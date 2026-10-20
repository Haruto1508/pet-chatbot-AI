require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Realistic clinical veterinary topics
const TOPICS = [
  {
    title: 'Mèo con 2 tháng tuổi bị tiêu chảy phân lỏng',
    userText: 'Bác sĩ ơi, mèo con nhà em 2 tháng tuổi sáng nay đi phân lỏng màu vàng, hơi lờ đờ, em phải làm sao ạ?',
    aiText: 'Chào bạn! Mèo con 2 tháng tuổi đi phân lỏng rất dễ mất nước hạ đường huyết. [Cảnh báo: 🟡 Vàng]. Hướng dẫn tạm thời: 1. Ngưng sữa lạ và thức ăn ôi thiu. 2. Bổ sung oresol pha loãng bù điện giải. 3. Giữ ấm cơ thể. Nếu tiếp tục tiêu chảy quá 3 lần kèm nôn ói, cần đưa đến phòng khám thú y ngay.',
    triage: 'YELLOW'
  },
  {
    title: 'Cún Poodle nôn bọt trắng bỏ ăn sáng nay',
    userText: 'Chó Poodle 1 tuổi nhà em từ sáng nôn 2 lần ra bọt trắng dịch trong, không chịu ăn hạt.',
    aiText: 'Chào bạn! Nôn bọt trắng có thể do dạ dày trống tăng tiết axit hoặc kích ứng đường tiêu hóa nhẹ [Cảnh báo: 🟡 Vàng]. Hãy theo dõi: tạm nhịn ăn 4-6 tiếng, cho uống từng ngụm nước ấm nhỏ. Nếu cún kèm sốt hoặc lờ đờ không cử động, cần kiểm tra Parvovirus/Care tại phòng khám.',
    triage: 'YELLOW'
  },
  {
    title: 'Lịch tiêm phòng dại và 7 bệnh cho chó Golden',
    userText: 'Cho em hỏi lịch tiêm vắc xin cho cún Golden 2.5 tháng tuổi gồm những mũi nào ạ?',
    aiText: 'Chào bạn! Lịch tiêm chuẩn cho chó con [Cảnh báo: 🟢 Xanh]:\n- 6-8 tuần tuổi: Mũi 1 đa giá (5 bệnh).\n- 9-11 tuần tuổi: Mũi 2 (7 bệnh).\n- 12-14 tuần tuổi: Mũi 3 (7 bệnh) + Tiêm phòng Dại.\n- Nhắc lại hàng năm 1 mũi 7 bệnh và 1 mũi Dại.',
    triage: 'GREEN'
  },
  {
    title: 'Mèo bị rụng lông hình đồng xu ở tai nghi bị nấm',
    userText: 'Tai mèo nhà em bị rụng lông thành từng mảng tròn có vảy gàu trắng ngứa, có phải bị nấm nấm Microsporum không?',
    aiText: 'Khả năng cao là nấm da (Dermatophytosis / Ringworm) [Cảnh báo: 🟢 Xanh]. Hướng dẫn xử lý: 1. Đeo loa chống liếm. 2. Vệ sinh vùng nấm bằng cồn đỏ Povidine hoặc xịt trị nấm chuyên dụng cho thú cưng. 3. Cách ly với mèo khác và rửa tay sạch vì nấm có thể lây sang người.',
    triage: 'GREEN'
  },
  {
    title: 'Chó con ăn nhầm xương gà có nguy hiểm không?',
    userText: 'Cún nhà em vừa lỡ nuốt phải một khúc xương đùi gà luộc, giờ đang thở gấp khó chịu!',
    aiText: 'Cực kỳ khẩn cấp! [Cảnh báo: 🔴 Đỏ]. Xương gà luộc khi gãy rất sắc nhọn, có nguy cơ gây thủng thực quản, rách dạ dày hoặc tắc ruột. Bạn hãy đưa cún đến ngay Bệnh viện Thú y gần nhất có máy chụp X-quang và nội soi, tuyệt đối KHÔNG tự ý gây nôn tại nhà!',
    triage: 'RED'
  },
  {
    title: 'Tư vấn chế độ dinh dưỡng cho mèo sau triệt sản',
    userText: 'Mèo đực nhà em vừa cắt tinh hoàn được 1 tuần, nên cho ăn loại thức ăn nào để tránh béo phì và sỏi thận?',
    aiText: 'Mèo sau triệt sản nhu cầu năng lượng giảm ~25-30% nhưng lại thèm ăn hơn [Cảnh báo: 🟢 Xanh]. Nên dùng thức ăn dành riêng cho mèo triệt sản (Sterilised), tăng cường chất xơ và kiểm soát khoáng chất Magie/Phốt pho. Khuyến khích mèo uống nhiều nước bằng đài phun nước tự động.',
    triage: 'GREEN'
  },
  {
    title: 'Cún bị ngứa gãi liên tục, nổi mẩn đỏ ở bụng',
    userText: 'Bụng dưới của cún bị nổi nhiều đốm đỏ li ti, cún liếm và gãi suốt ngày.',
    aiText: 'Triệu chứng của viêm da dị ứng hoặc viêm da tiếp xúc vi khuẩn/ve rận [Cảnh báo: 🟢 Xanh]. Tạm thời: tắm bằng sữa tắm dịu nhẹ trị viêm da, giữ chỗ nằm khô ráo thoáng mát, đeo loa chống liếm tránh cún cào xước gây nhiễm trùng thứ phát.',
    triage: 'GREEN'
  },
  {
    title: 'Mèo đực 2 tuổi đi tiểu khó kêu rên ở khay cát',
    userText: 'Mèo đực nhà em ngồi khay cát rặn mãi chỉ ra vài giọt có lẫn vệt hồng, kêu la đau đớn!',
    aiText: 'Cảnh báo nguy cấp: Hội chứng tắc nghẽn đường tiết niệu (FLUTD / Tắc niệu đạo) [Cảnh báo: 🔴 Đỏ]! Tắc tiểu trên 24-48h sẽ dẫn đến suy thận cấp và tăng kali máu gây ngừng tim. Bạn cần đưa mèo đến phòng khám thú y để thông tiểu khẩn cấp ngay lập tức!',
    triage: 'RED'
  },
  {
    title: 'Mắt chó bị đục nhẹ và chảy ghèn xanh buổi sáng',
    userText: 'Mắt trái của bé chó sáng dậy mở không lên, có nhiều ghèn vàng xanh.',
    aiText: 'Dấu hiệu viêm kết mạc hoặc trầy xước giác mạc [Cảnh báo: 🟡 Vàng]. Bạn hãy nhỏ nước muối sinh lý NaCl 0.9% để rửa sạch ghèn, tránh để cún lấy chân dụi vào mắt. Nếu mắt có màng mây đục hoặc cún nhắm tịt, cần bác sĩ nhuộm Fluorescein kiểm tra loét giác mạc.',
    triage: 'YELLOW'
  },
  {
    title: 'Mèo bị sổ mũi hắt hơi liên tục thời tiết lạnh',
    userText: 'Mèo nhà em 2 hôm nay cứ hắt xì liên tục, mũi chảy nước trong, vẫn ăn uống được.',
    aiText: 'Có thể mèo bị cảm lạnh đường hô hấp trên hoặc viêm mũi dị ứng [Cảnh báo: 🟢 Xanh]. Hãy giữ ấm phòng, cho xông hơi nước ấm pha ít tinh dầu tràm hoặc nước muối để thông mũi. Cho ăn thức ăn ấm thơm kích thích khứu giác. Theo dõi thân nhiệt không để sốt trên 39.2°C.',
    triage: 'GREEN'
  },
  {
    title: 'Tẩy giun định kỳ và nhỏ gáy trị ve rận cho cún',
    userText: 'Bao lâu thì nên tẩy giun và nhỏ gáy phòng ve rận bọ chét cho chó một lần?',
    aiText: 'Lịch chuẩn chăm sóc định kỳ [Cảnh báo: 🟢 Xanh]:\n- Tẩy giun: Chó con dưới 6 tháng tuổi tẩy mỗi tháng 1 lần. Chó trên 6 tháng tẩy định kỳ 3 tháng/lần.\n- Phòng ve rận/bọ chét: Nhỏ gáy hoặc cho uống viên nhai phòng ve định kỳ mỗi 1 - 3 tháng tùy loại thuốc.',
    triage: 'GREEN'
  },
  {
    title: 'Chó ăn phải socola đen có bị ngộ độc không?',
    userText: 'Cún nhà em nặng 4kg lỡ ăn phải 1 thanh socola đen 70% cacao, hiện đang thở dốc tim đập nhanh!',
    aiText: 'Cấp cứu nguy hiểm tính mạng! [Cảnh báo: 🔴 Đỏ]. Socola đen chứa hàm lượng Theobromine rất cao gây ngộ độc thần kinh và tim mạch. Với cún 4kg thì liều này cực kỳ độc. Hãy đưa ngay đến trạm cấp cứu thú y để rửa dạ dày và dùng than hoạt tính giải độc!',
    triage: 'RED'
  }
];

const VIETNAM_IPS = [
  '14.230.134.', '113.185.42.', '27.72.105.', '171.244.38.', '118.69.182.',
  '123.16.210.', '42.112.88.', '1.53.194.', '115.79.204.', '125.235.14.'
];

async function main() {
  console.log('🚀 Bắt đầu quá trình dọn sạch dữ liệu cũ và dump lại <= 150 data trong 30 ngày gần nhất...');

  // 1. Reset local analytics_store.json
  const storePath = path.resolve(__dirname, '../analytics_store.json');
  try {
    fs.writeFileSync(storePath, JSON.stringify({ pageViews: 0, visitors: {}, events: [] }, null, 2));
    console.log('✅ Đã reset analytics_store.json về 0');
  } catch (err) {
    console.warn('Không thể ghi analytics_store.json:', err.message);
  }

  // 2. Xóa sạch dữ liệu cũ trong Supabase
  console.log('🧹 Đang xóa toàn bộ rows cũ trong analytics_events...');
  const { error: errEvents } = await supabase.from('analytics_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errEvents) console.warn('Lỗi xóa analytics_events:', errEvents.message);
  else console.log('✅ Đã dọn sạch bảng analytics_events');

  console.log('🧹 Đang xóa toàn bộ rows cũ trong chat_sessions...');
  const { error: errSessions } = await supabase.from('chat_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errSessions) console.warn('Lỗi xóa chat_sessions:', errSessions.message);
  else console.log('✅ Đã dọn sạch bảng chat_sessions');

  console.log('🧹 Đang dọn sạch guest_rate_limits...');
  try {
    await supabase.from('guest_rate_limits').delete().neq('ip_address', 'dummy');
    console.log('✅ Đã dọn sạch guest_rate_limits');
  } catch {}

  // 3. Lấy danh sách registered users thực trong DB
  const { data: usersData } = await supabase.from('users').select('id, name, email, role');
  const regularUsers = (usersData || []).filter(u => u.id !== 'guest' && u.role !== 'admin' && u.role !== 'subadmin');
  console.log(`ℹ️ Tìm thấy ${regularUsers.length} tài khoản người dùng đăng ký hợp lệ.`);

  // 4. Chuẩn bị mốc thời gian 30 ngày (từ 2026-09-20 đến 2026-10-20)
  const now = new Date('2026-10-20T23:25:00.000Z');
  
  // Chúng ta sẽ tạo khoảng 115 chat_sessions và 135 analytics_events (hoàn toàn <= 150 data)
  const TOTAL_SESSIONS = 115;
  const TOTAL_EVENTS = 135;
  const UNIQUE_VISITOR_COUNT = 110;

  // Tạo danh sách visitor_ids cố định
  const visitorPool = [];
  for (let i = 0; i < UNIQUE_VISITOR_COUNT; i++) {
    const hex = crypto.randomBytes(6).toString('hex');
    const ipPrefix = VIETNAM_IPS[i % VIETNAM_IPS.length];
    const ipSuffix = Math.floor(Math.random() * 250) + 2;
    visitorPool.push({
      visitorId: `v_${hex}`,
      ip: `${ipPrefix}${ipSuffix}`
    });
  }

  // 5. Sinh 115 chat_sessions phân bổ trong 30 ngày
  console.log(`📝 Đang tạo ${TOTAL_SESSIONS} phiên chat chân thực trong 30 ngày...`);
  const sessionsToInsert = [];
  
  for (let i = 0; i < TOTAL_SESSIONS; i++) {
    // Phân bổ ngày: từ 30 ngày trước đến hôm nay
    const daysAgo = Math.floor(Math.random() * 30);
    const sessionDate = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
    // Random giờ trong ngày (từ 7h sáng đến 23h đêm)
    sessionDate.setHours(7 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    const isoDate = sessionDate.toISOString();

    const topic = TOPICS[i % TOPICS.length];
    
    // ~75% là guest, ~25% là user đăng ký
    const isGuest = Math.random() < 0.75 || regularUsers.length === 0;
    const assignedUser = isGuest ? null : regularUsers[Math.floor(Math.random() * regularUsers.length)];
    const userId = isGuest ? 'guest' : assignedUser.id;

    const timeStr = `${String(sessionDate.getHours()).padStart(2, '0')}:${String(sessionDate.getMinutes()).padStart(2, '0')}`;
    
    const messages = [
      {
        id: `msg_u_${i}`,
        text: topic.userText,
        sender: 'user',
        timestamp: timeStr
      },
      {
        id: `msg_ai_${i}`,
        text: topic.aiText,
        sender: 'ai',
        timestamp: timeStr,
        triageLevel: topic.triage
      }
    ];

    // Có một số phiên có thêm tin nhắn thứ 3 hoặc 4 hỏi thêm
    if (i % 3 === 0) {
      messages.push({
        id: `msg_u2_${i}`,
        text: 'Dạ em cảm ơn bác sĩ nhiều, em sẽ theo dõi sát cún/mèo nhà em ạ!',
        sender: 'user',
        timestamp: timeStr
      });
      messages.push({
        id: `msg_ai2_${i}`,
        text: 'Không có chi bạn nhé! Chúc bé cưng mau khỏe. Cần hỗ trợ thêm cứ nhắn tôi 24/7 🐾',
        sender: 'ai',
        timestamp: timeStr,
        triageLevel: topic.triage
      });
    }

    sessionsToInsert.push({
      id: crypto.randomUUID(),
      user_id: userId,
      pet_id: null,
      title: topic.title,
      messages: messages,
      created_at: isoDate,
      updated_at: isoDate,
      is_deleted: false,
      deleted_at: null
    });
  }

  // Chèn sessions theo lô 40 dòng
  for (let i = 0; i < sessionsToInsert.length; i += 40) {
    const chunk = sessionsToInsert.slice(i, i + 40);
    const { error } = await supabase.from('chat_sessions').insert(chunk);
    if (error) {
      console.error('Lỗi chèn chat_sessions:', error.message);
    }
  }
  console.log(`✅ Đã chèn thành công ${sessionsToInsert.length} chat_sessions vào Supabase.`);

  // 6. Sinh 135 analytics_events tương ứng trong 30 ngày
  console.log(`📊 Đang tạo ${TOTAL_EVENTS} analytics events chuẩn xác trong 30 ngày...`);
  const eventsToInsert = [];
  const PATHS = ['/chat', '/chat', '/chat', '/clinics', '/clinics', '/news', '/account'];
  const EVENT_TYPES = ['PAGE_VIEW', 'PAGE_VIEW', 'CHAT_OPEN', 'CHAT_MESSAGE_SENT', 'PAGE_VIEW'];

  for (let i = 0; i < TOTAL_EVENTS; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const eventDate = new Date(now.getTime() - daysAgo * 24 * 3600 * 1000);
    eventDate.setHours(7 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
    const isoDate = eventDate.toISOString();

    const v = visitorPool[i % visitorPool.length];
    const pathChoice = PATHS[i % PATHS.length];
    const eventChoice = EVENT_TYPES[i % EVENT_TYPES.length];

    eventsToInsert.push({
      id: crypto.randomUUID(),
      event_type: eventChoice,
      visitor_id: v.visitorId,
      ip_address: v.ip,
      user_id: null,
      path: pathChoice,
      metadata: {
        screen: '1528x732',
        path: pathChoice,
        url: `http://localhost:3000${pathChoice}`
      },
      created_at: isoDate
    });
  }

  // Chèn events theo lô 50 dòng
  for (let i = 0; i < eventsToInsert.length; i += 50) {
    const chunk = eventsToInsert.slice(i, i + 50);
    const { error } = await supabase.from('analytics_events').insert(chunk);
    if (error) {
      console.error('Lỗi chèn analytics_events:', error.message);
    }
  }
  console.log(`✅ Đã chèn thành công ${eventsToInsert.length} analytics_events vào Supabase.`);

  // 7. Xác nhận kết quả sau khi dump
  const [resCS, resAE, resU] = await Promise.all([
    supabase.from('chat_sessions').select('*', { count: 'exact', head: true }),
    supabase.from('analytics_events').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true })
  ]);

  console.log('\n==========================================');
  console.log('🎉 HOÀN THÀNH DỌN DẸP & DUMP DATA MỚI:');
  console.log(`- Chat Sessions mới: ${resCS.count} phiên (<= 150)`);
  console.log(`- Analytics Events mới: ${resAE.count} sự kiện (<= 150)`);
  console.log(`- Khoảng thời gian: Trải đều 30 ngày qua (từ 2026-09-20 đến 2026-10-20)`);
  console.log(`- Số lượng người dùng: ${resU.count}`);
  console.log('==========================================\n');
}

main().catch(console.error);
