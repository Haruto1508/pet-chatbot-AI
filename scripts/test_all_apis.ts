import fetch from 'node-fetch';
import { decryptPayload } from '../src/utils/cryptoPayload.js';

const BASE_URL = 'http://127.0.0.1:3000';
const DEVICE_ID = 'test_device_runner_' + Date.now();

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  statusCode: number;
  durationMs: number;
  details?: string;
}

const results: TestResult[] = [];

function unwrapResponse(rawText: string): any {
  try {
    const parsed = JSON.parse(rawText);
    if (parsed && typeof parsed === 'object' && parsed.__enc && parsed.payload) {
      return decryptPayload(parsed.payload);
    }
    return parsed;
  } catch {
    return rawText;
  }
}

async function runTest(
  name: string,
  method: string,
  endpoint: string,
  body?: any,
  headers?: Record<string, string>,
  validate?: (unwrapped: any, rawText: string) => boolean | string
) {
  const start = Date.now();
  const reqHeaders: Record<string, string> = {
    'X-Guest-Device-Id': DEVICE_ID,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...headers
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    const durationMs = Date.now() - start;
    const rawText = await response.text();
    const data = unwrapResponse(rawText);

    let validationResult: boolean | string = response.ok;
    if (validate) {
      validationResult = validate(data, rawText);
    }

    const isPass = response.ok && validationResult === true;
    const detailMsg = typeof validationResult === 'string' 
      ? validationResult 
      : (data ? JSON.stringify(data).slice(0, 100) : rawText.slice(0, 100));

    results.push({
      name,
      endpoint,
      method,
      status: isPass ? 'PASS' : 'FAIL',
      statusCode: response.status,
      durationMs,
      details: detailMsg
    });

    console.log(`${isPass ? '✅ PASS' : '❌ FAIL'} [${response.status}] ${method.padEnd(5)} ${endpoint.padEnd(30)} (${durationMs}ms) - ${name}`);
    if (!isPass && typeof validationResult === 'string') {
      console.log(`   └─ Chi tiết lỗi: ${validationResult}`);
    }
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({
      name,
      endpoint,
      method,
      status: 'FAIL',
      statusCode: 0,
      durationMs,
      details: err.message
    });
    console.log(`❌ FAIL [ERROR] ${method.padEnd(5)} ${endpoint.padEnd(30)} (${durationMs}ms) - ${name}: ${err.message}`);
  }
}

async function testChatStream() {
  const name = 'AI Chat SSE Streaming & Key Balancer (/api/chat)';
  const endpoint = '/api/chat';
  const method = 'POST';
  const start = Date.now();

  console.log(`⏳ Đang kiểm tra ${name}... (Gọi Gemini và stream SSE)`);

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Guest-Device-Id': DEVICE_ID
      },
      body: JSON.stringify({
        message: 'Bé mèo của tôi bị sốt và bỏ ăn 2 ngày nay, mệt mỏi nằm một chỗ. Bác sĩ tư vấn giúp em với ạ.',
        chatHistory: [],
        petInfo: {
          name: 'Miu',
          species: 'Mèo',
          breed: 'Mèo ta',
          age: 2,
          weight: 3.5
        }
      })
    });

    const durationMs = Date.now() - start;
    if (!response.ok) {
      const errText = await response.text();
      results.push({
        name,
        endpoint,
        method,
        status: 'FAIL',
        statusCode: response.status,
        durationMs,
        details: errText.slice(0, 150)
      });
      console.log(`❌ FAIL [${response.status}] ${method} ${endpoint} - ${errText.slice(0, 150)}`);
      return;
    }

    // Read SSE Stream chunks
    let totalChunks = 0;
    let fullText = '';
    let decryptedChunks: string[] = [];

    if (response.body) {
      for await (const chunk of response.body as any) {
        totalChunks++;
        const str = chunk.toString();
        fullText += str;

        const lines = str.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonPart = line.slice(6).trim();
            if (jsonPart && jsonPart !== '[DONE]') {
              try {
                const parsed = JSON.parse(jsonPart);
                if (parsed.__enc && parsed.payload) {
                  const dec = decryptPayload(parsed.payload);
                  decryptedChunks.push(typeof dec === 'string' ? dec : JSON.stringify(dec));
                } else if (parsed.text) {
                  decryptedChunks.push(parsed.text);
                }
              } catch {
                // Non-JSON SSE line
              }
            }
          }
        }
      }
    }

    const decryptedFull = decryptedChunks.join('');
    const isPass = totalChunks > 0 && (fullText.length > 50 || decryptedFull.length > 20);

    results.push({
      name,
      endpoint,
      method,
      status: isPass ? 'PASS' : 'FAIL',
      statusCode: response.status,
      durationMs: Date.now() - start,
      details: `Nhận ${totalChunks} SSE chunks. Độ dài nội dung giải mã: ${decryptedFull.length} ký tự`
    });

    console.log(`${isPass ? '✅ PASS' : '❌ FAIL'} [${response.status}] ${method.padEnd(5)} ${endpoint.padEnd(30)} (${Date.now() - start}ms) - ${name}`);
    if (decryptedFull) {
      console.log(`   └─ Phản hồi từ AI: "${decryptedFull.slice(0, 100)}..."`);
    }
  } catch (err: any) {
    results.push({
      name,
      endpoint,
      method,
      status: 'FAIL',
      statusCode: 0,
      durationMs: Date.now() - start,
      details: err.message
    });
    console.log(`❌ FAIL [ERROR] ${method} ${endpoint} - ${err.message}`);
  }
}

async function main() {
  console.log('\n======================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN CÁC API ĐANG SỬ DỤNG');
  console.log(`🌐 Base URL: ${BASE_URL} | Device ID: ${DEVICE_ID}`);
  console.log('======================================================\n');

  console.log('--- 1. NHÓM API HỆ THỐNG & GIÁM SÁT (HEALTH & SYSTEM) ---');
  await runTest('Kiểm tra Server Sống', 'GET', '/api/health', undefined, undefined, (res) => {
    return res && res.status === 'ok';
  });

  await runTest('Kiểm tra Sức khỏe DB, Gemini, KeyPool Stats', 'GET', '/api/health-check', undefined, undefined, (res) => {
    if (!res || !res.supabase) return 'Không có supabase status';
    if (!res.gemini || !res.gemini.keyPoolStats) return 'Không có gemini keyPoolStats';
    return true;
  });

  await runTest('Kiểm tra Trạng thái Bảo trì', 'GET', '/api/maintenance-status', undefined, undefined, (res) => {
    return res && typeof res.maintenanceMode === 'boolean';
  });

  await runTest('Kiểm tra Cấu hình Hệ thống (System Config)', 'GET', '/api/config', undefined, undefined, (res) => {
    return res && typeof res === 'object';
  });

  console.log('\n--- 2. NHÓM API ĐIỂM & HẠN MỨC (POINTS & GUEST MONETIZATION) ---');
  await runTest('Lấy Cấu hình Gói Điểm & Phí Chat', 'GET', '/api/points/config', undefined, undefined, (res) => {
    return res && typeof res.costPerChat === 'number';
  });

  await runTest('Lấy Hạn mức Tin nhắn Khách (Guest Quota)', 'GET', '/api/guest-quota', undefined, undefined, (res) => {
    return res && typeof res.remaining === 'number';
  });

  await runTest('Lấy Số dư Điểm Người dùng (Points Balance)', 'GET', '/api/points/balance?userId=guest_user', undefined, undefined, (res) => {
    return res && typeof res.points === 'number';
  });

  await runTest('Nạp Điểm Thử nghiệm Sandbox', 'POST', '/api/points/topup-sandbox', {
    userId: 'guest_user',
    packageId: 'pkg_basic',
    amountVnd: 10000,
    points: 10,
    description: 'Auto-test topup'
  }, undefined, (res) => {
    return res && res.success === true;
  });

  console.log('\n--- 3. NHÓM API NỘI DUNG & TÀI NGUYÊN (RESOURCES) ---');
  await runTest('Lấy Danh mục Bài viết Sơ cứu (Articles)', 'GET', '/api/articles', undefined, undefined, (res) => {
    return Array.isArray(res);
  });

  await runTest('Lấy Danh sách Phòng khám Thú y (Clinics)', 'GET', '/api/clinics', undefined, undefined, (res) => {
    return Array.isArray(res);
  });

  console.log('\n--- 4. NHÓM API TRÍ TUỆ NHÂN TẠO (AI & CHAT CORE) ---');
  await runTest('Sinh Tiêu đề Tự động (/api/generate-title)', 'POST', '/api/generate-title', {
    firstMessage: 'Bé cún Poodle nhà em bị nôn và tiêu chảy sau khi ăn thức ăn lạ'
  }, undefined, (res) => {
    return res && typeof res.title === 'string' && res.title.length > 0;
  });

  await runTest('Tóm tắt Bệnh án (/api/summarize-medical-record)', 'POST', '/api/summarize-medical-record', {
    petInfo: { name: 'Miu', species: 'Mèo' },
    chatHistory: [
      { sender: 'user', text: 'Mèo bị nôn ra búi lông và bỏ ăn' },
      { sender: 'bot', text: 'Bé có dấu hiệu búi lông dạ dày, cần cho uống gel tiêu lông' }
    ]
  }, undefined, (res) => {
    return res && res.success === true && res.record && (typeof res.record.symptomSummary === 'string' || typeof res.record.diagnosis === 'string');
  });

  await testChatStream();

  console.log('\n======================================================');
  console.log('📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ API');
  console.log('======================================================');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log(`Tổng số API kiểm tra: ${results.length}`);
  console.log(`✅ Thành công: ${passed}`);
  console.log(`❌ Thất bại:   ${failed}`);
  console.log('------------------------------------------------------');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] [${r.statusCode}] ${r.method.padEnd(5)} ${r.endpoint.padEnd(35)} ${r.durationMs.toString().padStart(5)}ms | ${r.name}`);
  });
  console.log('======================================================\n');
}

main().catch(console.error);
