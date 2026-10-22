import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

function maskApiKey(key: string): string {
  if (!key || key.length < 10) return '***';
  return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
}

function parseApiKeys(inputs: any[]): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  for (const input of inputs) {
    if (!input) continue;
    let items: string[] = [];
    if (typeof input === 'string') {
      items = input.split(/[,;\n\r]+/).map(s => s.trim());
    } else if (Array.isArray(input)) {
      items = input.map(s => (typeof s === 'string' ? s.trim() : ''));
    }

    for (const item of items) {
      if (item && item.length >= 10 && !seen.has(item) && !item.includes('...') && !item.includes('***')) {
        seen.add(item);
        result.push(item);
      }
    }
  }
  return result;
}

async function loadAllKeys(): Promise<{ keys: string[]; sources: Record<string, string> }> {
  const candidates: { key: string; source: string }[] = [];

  // 1. From .env
  if (process.env.GEMINI_API_KEY) {
    const envKeys = parseApiKeys([process.env.GEMINI_API_KEY]);
    envKeys.forEach(k => candidates.push({ key: k, source: 'Môi trường (.env - GEMINI_API_KEY)' }));
  }
  if (process.env.GEMINI_API_KEYS) {
    const envKeys = parseApiKeys([process.env.GEMINI_API_KEYS]);
    envKeys.forEach(k => candidates.push({ key: k, source: 'Môi trường (.env - GEMINI_API_KEYS)' }));
  }
  for (let i = 1; i <= 20; i++) {
    const val = process.env[`GEMINI_API_KEY_${i}`];
    if (val) {
      const parsed = parseApiKeys([val]);
      parsed.forEach(k => candidates.push({ key: k, source: `Môi trường (.env - GEMINI_API_KEY_${i})` }));
    }
  }
  for (const [envKey, envVal] of Object.entries(process.env)) {
    if (envKey.startsWith('GEMINI_API_KEY') && envKey !== 'GEMINI_API_KEY' && envKey !== 'GEMINI_API_KEYS' && !envKey.match(/^GEMINI_API_KEY_\d+$/) && envVal) {
      const parsed = parseApiKeys([envVal]);
      parsed.forEach(k => candidates.push({ key: k, source: `Môi trường (.env - ${envKey})` }));
    }
  }

  // 2. From Supabase system_config
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      const { data } = await supabase.from('system_config').select('*').eq('id', 1).maybeSingle();
      if (data) {
        if (data.gemini_api_key) candidates.push({ key: data.gemini_api_key, source: 'Supabase DB (gemini_api_key)' });
        if (data.backup_gemini_api_key) candidates.push({ key: data.backup_gemini_api_key, source: 'Supabase DB (backup_gemini_api_key)' });
        if (data.fallback_gemini_api_key) candidates.push({ key: data.fallback_gemini_api_key, source: 'Supabase DB (fallback_gemini_api_key)' });
        if (data.gemini_api_keys_pool) {
          const poolKeys = parseApiKeys([data.gemini_api_keys_pool]);
          poolKeys.forEach(k => candidates.push({ key: k, source: 'Supabase DB (gemini_api_keys_pool)' }));
        }
        for (let i = 1; i <= 20; i++) {
          if (data[`gemini_api_key_${i}`]) {
            candidates.push({ key: data[`gemini_api_key_${i}`], source: `Supabase DB (gemini_api_key_${i})` });
          }
        }
      }
    } catch {
      // Ignore DB fetch failure in offline mode
    }
  }

  const keys: string[] = [];
  const sources: Record<string, string> = {};
  const seen = new Set<string>();

  for (const c of candidates) {
    const cleanKeys = parseApiKeys([c.key]);
    for (const k of cleanKeys) {
      if (!seen.has(k)) {
        seen.add(k);
        keys.push(k);
        sources[k] = c.source;
      }
    }
  }

  return { keys, sources };
}

async function testSingleKey(apiKey: string): Promise<{ ok: boolean; latencyMs: number; status: string; message: string }> {
  const start = Date.now();
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Thử gemini-3.5-flash trước, nếu 503 thử tiếp gemini-3.1-flash-lite
    let response: any = null;
    let usedModel = 'gemini-3.5-flash';
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'ping',
        config: { maxOutputTokens: 5 }
      });
    } catch (e: any) {
      if (/503|UNAVAILABLE|high demand/i.test(e?.message)) {
        usedModel = 'gemini-3.1-flash-lite';
        response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: 'ping',
          config: { maxOutputTokens: 5 }
        });
      } else {
        throw e;
      }
    }

    const latencyMs = Date.now() - start;
    if (response && response.text) {
      return { ok: true, latencyMs, status: 'HEALTHY', message: `API Key hoạt động tốt (${usedModel})` };
    }
    return { ok: true, latencyMs, status: 'HEALTHY', message: `API phản hồi thành công (${usedModel})` };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    const msg = err?.message || 'Lỗi không xác định';
    if (/quota|429|RESOURCE_EXHAUSTED/i.test(msg)) {
      return { ok: false, latencyMs, status: '429_QUOTA', message: 'Tạm hết Quota (Rate limit 429)' };
    }
    if (/401|403|API_KEY_INVALID/i.test(msg)) {
      return { ok: false, latencyMs, status: 'INVALID_KEY', message: 'Key không hợp lệ hoặc đã bị xóa' };
    }
    if (/503|UNAVAILABLE|high demand/i.test(msg)) {
      return { ok: false, latencyMs, status: '503_BUSY', message: 'Máy chủ Google đang bận (503)' };
    }
    return { ok: false, latencyMs, status: 'ERROR', message: msg.slice(0, 80) };
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('🔍 KIỂM TRA POOL API KEY GEMINI CỦA HỆ THỐNG');
  console.log('======================================================\n');

  console.log('⏳ Đang đọc danh sách Key từ .env và Supabase Database...');
  const { keys, sources } = await loadAllKeys();

  console.log(`\n📦 Tổng số Key hợp lệ phát hiện được: ${keys.length} key\n`);

  if (keys.length === 0) {
    console.log('❌ Không tìm thấy API Key nào trong .env hoặc Database!');
    return;
  }

  console.log('------------------------------------------------------');
  console.log('🧪 BẮT ĐẦU TEST TỪNG KEY TRỰC TIẾP VỚI GOOGLE GEMINI:');
  console.log('------------------------------------------------------\n');

  let workingCount = 0;
  let quotaCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const masked = maskApiKey(k);
    const source = sources[k] || 'Không xác định';

    process.stdout.write(`[${i + 1}/${keys.length}] Đang test ${masked}... `);
    const result = await testSingleKey(k);

    if (result.ok) {
      workingCount++;
      console.log(`✅ HOẠT ĐỘNG (${result.latencyMs}ms)`);
      console.log(`   └─ Nguồn: ${source} | Trạng thái: ${result.message}\n`);
    } else if (result.status === '429_QUOTA') {
      quotaCount++;
      console.log(`⚠️  CHẠM QUOTA (${result.latencyMs}ms)`);
      console.log(`   └─ Nguồn: ${source} | ${result.message}\n`);
    } else {
      invalidCount++;
      console.log(`❌ LỖI (${result.latencyMs}ms)`);
      console.log(`   └─ Nguồn: ${source} | ${result.message}\n`);
    }

    // Delay nhẹ giữa các lần test tránh spam
    if (i + 1 < keys.length) {
      await new Promise(r => setTimeout(r, 400));
    }
  }

  console.log('======================================================');
  console.log('📊 TỔNG KẾT TRẠNG THÁI KEY POOL:');
  console.log('======================================================');
  console.log(`• Tổng số Key nhận diện:       ${keys.length} key`);
  console.log(`• Key đang chạy tốt (Healthy): ${workingCount} key ✅`);
  console.log(`• Key chạm Quota (Cooldown):   ${quotaCount} key ⚠️`);
  console.log(`• Key lỗi / Không hợp lệ:      ${invalidCount} key ❌`);
  console.log('------------------------------------------------------');
  if (workingCount >= 3) {
    console.log(`🎉 Hệ thống có ${workingCount} key đang chạy tốt, dư sức cân bằng tải >10 người dùng đồng thời!`);
  } else if (workingCount > 0) {
    console.log(`⚠️  Hiện có ${workingCount} key hoạt động. Khuyến nghị bổ sung thêm vào .env để đạt tối ưu cho 10+ người.`);
  } else {
    console.log('❌ CẢNH BÁO: Tất cả key đều bị lỗi hoặc hết quota! Cần nạp key mới ngay.');
  }
  console.log('======================================================\n');
}

main().catch(console.error);
