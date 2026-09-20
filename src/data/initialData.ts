import { UserProfile, PetProfile, KnowledgeArticle, VetClinic, MedicalRecord, SystemConfig } from '../types';

export const initialUsers: UserProfile[] = [
  {
    id: 'user_01',
    name: 'Người Nuôi Pet (Mẫu)',
    email: 'user@petcare.local',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150',
    role: 'user',
    status: 'active',
    createdAt: '2026-01-15'
  },
  {
    id: 'user_admin',
    name: 'Dr. Bác Sĩ Thú Y (Admin)',
    email: 'admin@vethic.ai',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150',
    role: 'admin',
    status: 'active',
    createdAt: '2026-01-01'
  },
  {
    id: 'user_02',
    name: 'Nguyễn Thị Minh',
    email: 'minh.nguyen@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    role: 'user',
    status: 'active',
    createdAt: '2026-02-10'
  },
  {
    id: 'user_03',
    name: 'Trần Hoàng Bảo',
    email: 'bao.tran@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150',
    role: 'user',
    status: 'suspended',
    createdAt: '2026-03-02'
  }
];

export const initialPets: PetProfile[] = [
  {
    id: 'pet_01',
    userId: 'user_01',
    name: 'Mật Béo',
    species: 'Mèo',
    breed: 'Mèo Anh Lông Tắn (British Shorthair)',
    age: 24, // 2 tuổi
    weight: 4.8,
    gender: 'Đực',
    vaccineStatus: ['Dại (Rabies)', '4 Bệnh Cơ Bản Mèo (FVRCP)', 'Tẩy giun định kỳ'],
    allergies: ['Dị ứng hải sản khô'],
    avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-01-15'
  },
  {
    id: 'pet_02',
    userId: 'user_01',
    name: 'Lucky',
    species: 'Chó',
    breed: 'Golden Retriever',
    age: 36, // 3 tuổi
    weight: 28.5,
    gender: 'Đực',
    vaccineStatus: ['Carre & Parvo 7 bệnh', 'Phòng dại', 'Ho cũi chó'],
    allergies: ['Không có'],
    avatarUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-01-20'
  },
  {
    id: 'pet_03',
    userId: 'user_02',
    name: 'Kiki',
    species: 'Chó',
    breed: 'Poodle Toy',
    age: 14,
    weight: 3.2,
    gender: 'Cái',
    vaccineStatus: ['Mũi 5 trong 1'],
    allergies: ['Nhạy cảm với sữa chua'],
    avatarUrl: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-02-12'
  }
];

export const initialArticles: KnowledgeArticle[] = [
  {
    id: 'art_01',
    title: 'Xử lý khẩn cấp khi chó mèo ngộ độc thực phẩm hoặc hóa chất',
    species: 'Cả hai',
    category: 'first_aid',
    summary: 'Hướng dẫn sơ cứu khẩn cấp từng bước khi thú cưng nuốt phải chất độc, thuốc trừ sâu, socola hoặc hành tỏi.',
    symptoms: [
      'Nôn mửa dữ dội hoặc sùi bọt dại',
      'Co giật, run rẩy toàn thân',
      'Thở gấp hoặc nghẹt thở',
      'Đồng tử giãn, lờ đờ không phản ứng'
    ],
    firstAidSteps: [
      'Xác định loại chất độc mà thú cưng đã tiếp xúc (giữ lại vỏ chai hoặc mẫu thực phẩm).',
      'KHÔNG tự ý gây nôn nếu thú cưng đã ngất xỉu hoặc nuốt phải axit/chất tẩy rửa mạnh.',
      'Rửa sạch miệng bằng nước mát nếu dính hóa chất bên ngoài.',
      'Đưa thú cưng ngay lập tức đến trạm thú y gần nhất trong vòng 30-60 phút.'
    ],
    doctorAdvice: 'Ngộ độc là tình trạng RED (CẤP BÁCH). Thời gian vàng xử lý là 1-2 giờ đầu. Bác sĩ thú y sẽ cần rửa dạ dày và truyền dịch giải độc khẩn cấp.',
    urgencyLevel: 'RED',
    imageUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=600',
    content: `Ngộ độc ở thú cưng có thể do ăn phải socola, chất làm ngọt xylitol, bã chuột, hành tây, hoa ly (đặc biệt nguy hiểm với mèo) hoặc thuốc gia đình. 

**Biểu hiện lâm sàng:**
Chó mèo bắt đầu nôn liên tục, suy nhược nhanh chóng, co giật hoặc nướu răng nhợt nhạt.

**Sơ cứu tức thì:**
1. Giữ bình tĩnh, cách ly thú cưng khỏi khu vực có chất độc.
2. Kiểm tra xem thú cưng còn tỉnh táo hay không.
3. Liên hệ hotline phòng khám thú y gần nhất báo trước tình trạng.`,
    updatedAt: '2026-07-20'
  },
  {
    id: 'art_02',
    title: 'Phòng ngừa và nhận biết bệnh Parvovirus & Carre ở chó',
    species: 'Chó',
    category: 'prevention',
    summary: 'Hai bệnh truyền nhiễm nguy hiểm nhất ở chó con với tỷ lệ tử vong cao nếu không tiêm vắc xin đúng lịch.',
    symptoms: [
      'Tiêu chảy văng máu có mùi hôi tanh đặc trưng',
      'Bỏ ăn hoàn toàn, sốt cao 39.5 - 41 độ C',
      'Nôn ra dịch vàng hoặc bọt trắng',
      'Mắt chảy nhiều gèn, chảy mũi đặc'
    ],
    firstAidSteps: [
      'Cách ly chó bệnh khỏi các thú cưng khác ngay lập tức.',
      'Ngừng cho ăn thức ăn thô, bổ sung nước điện giải Oresol pha loãng theo giọt.',
      'Sát trùng toàn bộ khu vực ở bằng dung dịch Nano Bạc hoặc Chloramine B.',
      'Đưa đến bệnh viện thú y để test nhanh Parvo/Carre và truyền dịch cấp cứu.'
    ],
    doctorAdvice: 'Vắc xin 5 trong 1 hoặc 7 trong 1 là biện pháp bảo vệ duy nhất hiệu quả 98%. Hãy hoàn tất 3 mũi vắc xin cho chó con từ 6-12 tuần tuổi.',
    urgencyLevel: 'RED',
    imageUrl: 'https://images.unsplash.com/photo-1534361960057-19889db9621e?auto=format&fit=crop&q=80&w=600',
    content: `Parvovirus tấn công vào đường ruột làm bong tróc niêm mạc, dẫn đến mất nước nghiêm trọng. Bệnh Carre tấn công vào hệ thần kinh và hô hấp.

**Chế độ chăm sóc khi điều trị:**
Cần nằm phòng cách ly ấm áp, truyền dịch đạm và dùng kháng sinh chống nhiễm trùng thứ phát dưới sự chỉ định của Bác sĩ Thú y.`,
    updatedAt: '2026-07-15'
  },
  {
    id: 'art_03',
    title: 'Chế độ dinh dưỡng chuẩn cho mèo bị suy thận & sỏi đường tiết niệu (FLUTD)',
    species: 'Mèo',
    category: 'nutrition',
    summary: 'Giải pháp ăn uống giúp giảm gánh nặng cho thận và ngăn ngừa kết sỏi bàng quang ở mèo đực.',
    symptoms: [
      'Mèo đi tiểu rặn đau, rên rỉ trong khay cát',
      'Tiểu ra máu nhẹ hoặc tiểu rắt từng giọt',
      'Uống nước nhiều bất thường nhưng bỏ ăn',
      'Liếm vùng sinh dục liên tục'
    ],
    firstAidSteps: [
      'Chuyển từ hạt khô sang hạt mềm hoặc pate thủy phân (Urinary / Renal).',
      'Khuyến khích mèo uống thêm nước bằng đài phun nước hoặc xilanh bơm nhẹ.',
      'Nếu mèo hoàn toàn không tiểu được trong 12h, cần đưa đi thông tiểu cấp cứu.'
    ],
    doctorAdvice: 'Mèo đực rất dễ bị tắc nghẽn niệu đạo hoàn toàn. Nếu tắc đường tiểu >24h có thể vỡ bàng quang hoặc ngộ độc ure huyết nguy hiểm tính mạng (Cảnh báo Đỏ).',
    urgencyLevel: 'YELLOW',
    imageUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&q=80&w=600',
    content: `Bệnh đường tiết niệu dưới ở mèo (FLUTD) thường do thiếu nước, chế độ ăn hạt giá rẻ chứa nhiều Phospho và Magie dư thừa.

**Thức ăn khuyên dùng:**
- Pate Royal Canin Urinary S/O, Hill's c/d.
- Bổ sung thực phẩm giàu độ ẩm (>75% nước).
- Tuyệt đối không cho ăn đồ mặn, cá khô thương mại.`,
    updatedAt: '2026-07-10'
  },
  {
    id: 'art_04',
    title: 'Sơ cứu khi chó mèo bị say nắng (Heatstroke) ngày hè',
    species: 'Cả hai',
    category: 'first_aid',
    summary: 'Cách làm giảm thân nhiệt an toàn tránh sốc nhiệt tử vong cho chó mặt nạ (Pug, Bull) và mèo xù.',
    symptoms: [
      'Thở hổn hển dữ dội, lưỡi thè dài đỏ ửng',
      'Nước dãi chảy rớt dai dẳng',
      'Thân nhiệt nóng rực (>40 độ C)',
      'Bước đi xiêu vẹo, niêm mạc mắt đỏ chói'
    ],
    firstAidSteps: [
      'Đưa thú cưng ngay vào chỗ mát, có quạt hoặc điều hòa.',
      'Đặt khăn ẩm nước MÁT (KHÔNG DÙNG NƯỚC ĐÁ LẠNH) lên nách, bẹn và lòng bàn chân.',
      'Cho uống từng hụm nước mát nhỏ.',
      'Chuyển tới bác sĩ thú y theo dõi chỉ số tổn thương não.'
    ],
    doctorAdvice: 'Tuyệt đối không dội trực tiếp nước đá lạnh ngắt vì sẽ gây co mạch máu ngoại vi làm nhiệt tích tụ sâu trong cơ quan nội tạng.',
    urgencyLevel: 'YELLOW',
    imageUrl: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&q=80&w=600',
    content: `Say nắng ở chó mèo là tình trạng cấp tính nguy hiểm khi nhiệt độ môi trường cao kết hợp không khí bí bách.`,
    updatedAt: '2026-06-25'
  }
];

export const initialClinics: VetClinic[] = [
  {
    id: 'clinic_01',
    name: 'Bệnh Viện Thú Y Vethic Central 24/7',
    address: '124 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP. Hồ Chí Minh',
    phone: '0903 123 456',
    lat: 10.7782,
    lng: 106.6895,
    rating: 4.9,
    reviewsCount: 320,
    isEmergency247: true,
    openingHours: 'Mở cửa 24/7 (Có trực cấp cứu đêm)',
    services: ['Cấp cứu 24/7', 'Phẫu thuật ngoại khoa', 'Chụp X-Quang & Siêu âm', 'Xét nghiệm máu', 'Khách sạn thú cưng'],
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'clinic_02',
    name: 'Trạm Thú Y Sài Gòn Vet Clinic',
    address: '458 Lê Văn Sỹ, Phường 14, Quận 3, TP. Hồ Chí Minh',
    phone: '028 3931 7890',
    lat: 10.7891,
    lng: 106.6742,
    rating: 4.7,
    reviewsCount: 185,
    isEmergency247: false,
    openingHours: '08:00 - 20:30 (Thứ 2 - Chủ Nhật)',
    services: ['Tiêm vắc xin', 'Tẩy giun & Trị ve rận', 'Triệt sản an toàn', 'Spa & Cắt tỉa lông'],
    imageUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'clinic_03',
    name: 'Trung Tâm Y Khoa Thú Cưng ProVet',
    address: '88 Xuân Thủy, Phường Thảo Điền, Thành phố Thủ Đức, TP. Hồ Chí Minh',
    phone: '0988 776 655',
    lat: 10.8042,
    lng: 106.7351,
    rating: 4.8,
    reviewsCount: 240,
    isEmergency247: true,
    openingHours: 'Mở cửa 24/7 (Bác sĩ chuyên khoa quốc tế)',
    services: ['Chẩn đoán hình ảnh MRI', 'Nội soi dạ dày', 'Điều trị nội trú chuyên sâu', 'Cấp cứu ngộ độc'],
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=500'
  },
  {
    id: 'clinic_04',
    name: 'Bệnh Viện Thú Y Hà Nội Pet Emergency',
    address: '72 Đường Cầu Giấy, Phường Quan Hoa, Cầu Giấy, Hà Nội',
    phone: '0912 345 678',
    lat: 21.0333,
    lng: 105.7981,
    rating: 4.9,
    reviewsCount: 410,
    isEmergency247: true,
    openingHours: 'Mở cửa 24/7',
    services: ['Cấp cứu tai nạn', 'Truyền máu thú cưng', 'Phẫu thuật xương khớp', 'Tiêm phòng định kỳ'],
    imageUrl: 'https://images.unsplash.com/photo-1629909615184-74f495363b67?auto=format&fit=crop&q=80&w=500'
  }
];

export const initialMedicalRecords: MedicalRecord[] = [
  {
    id: 'rec_01',
    petId: 'pet_01',
    petName: 'Mật Béo',
    petSpecies: 'Mèo',
    userId: 'user_01',
    date: '2026-07-28 14:30',
    symptomSummary: 'Mèo bị nôn ra dịch bọt trắng 2 lần buổi sáng, lờ đờ không chịu ăn hạt khô.',
    diagnosis: 'Có dấu hiệu rối loạn tiêu hóa nhẹ hoặc kích ứng dạ dày do búi lông (Hairball).',
    triageLevel: 'YELLOW',
    treatmentPlan: 'Cho uống Gel tiêu búi lông, chia nhỏ bữa ăn bằng pate mềm dễ tiêu, theo dõi thân nhiệt.',
    dietaryAdvice: 'Tạm ngưng hạt cứng 24h. Cho ăn pate hấp thủy phân hòa thêm ít nước ấm.',
    followUpNotes: 'Nếu tiếp tục nôn quá 3 lần hoặc kèm sốt trên 39 độ C, đưa đi khám ngay.',
    chatSnippet: 'User: Mèo Mật Béo nhà em sáng nay nôn bọt trắng 2 lần, lờ đờ...\nAI: Cảnh báo Vàng - Cần theo dõi sát sao...'
  },
  {
    id: 'rec_02',
    petId: 'pet_02',
    petName: 'Lucky',
    petSpecies: 'Chó',
    userId: 'user_01',
    date: '2026-07-15 09:15',
    symptomSummary: 'Khám sức khỏe định kỳ & tiêm phòng vắc xin dại + 7 bệnh.',
    diagnosis: 'Thể trạng chó Golden khỏe mạnh, cân nặng 28.5kg đạt chuẩn, tai mắt sạch.',
    triageLevel: 'GREEN',
    treatmentPlan: 'Đã hoàn tất tiêm mũi nhắc lại vắc xin 7 bệnh. Hẹn tẩy giun sau 2 tuần.',
    dietaryAdvice: 'Duy trì khẩu phần 600g hạt chuyên dụng + thịt ức gà luộc.',
    followUpNotes: 'Nhắc lịch tái khám sau 1 năm.',
    chatSnippet: 'User: Lucky đến lịch tiêm vắc xin hàng năm...'
  }
];

export const defaultSystemConfig: SystemConfig = {
  aiModel: 'gemini-3.6-flash',
  temperature: 0.4,
  maxTokens: 2048,
  systemPrompt: `Bạn là Chuyên gia Bác sĩ Thú y AI cao cấp (Vethic AI Specialist) hàng đầu Việt Nam.
Nhiệm vụ của bạn là tư vấn chẩn đoán ban đầu, sơ cứu khẩn cấp, đưa ra giải pháp chăm sóc và chế độ dinh dưỡng khoa học cho các loại thú cưng (chó, mèo, chim, thú nhỏ).

QUY TẮC BẮT BUỘC TRONG MỖI CÂU TRẢ LỜI:
1. Bạn BẮT BUỘC phải phân loại mức độ nguy hiểm của tình trạng sức khỏe thú cưng theo 3 cấp độ:
   - RED (ĐỎ - NGUY HIỂM / CẤP BÁCH): Thú cưng gặp nguy hiểm tính mạng (ngộ độc, nôn máu, tiêu chảy máu, co giật, khó thở, sốc nhiệt, tai nạn, tắc đường tiểu hoàn toàn). Đưa ra lời khuyên đi cấp cứu lập tức.
   - YELLOW (VÀNG - CẢNH BÁO / THEO DÕI): Thú cưng có triệu chứng bệnh nhẹ đến trung bình (nôn 1-2 lần, bỏ ăn 1 bữa, tiêu chảy nhẹ, ho gừ, gãi tai, chấn thương nhẹ). Cần theo dõi sát và hướng dẫn xử lý tại nhà.
   - GREEN (XANH - AN TOÀN / BÌNH THƯỜNG): Thắc mắc dinh dưỡng, tư vấn vắc xin, chăm sóc lông măng, tập luyện, hành vi, triệu chứng thoáng qua nhẹ.

2. CẤU TRÚC PHẢN HỒI (Luôn trả về định dạng JSON chuẩn hoặc Markdown rõ ràng chứa phần Triage Header):
   Phần đầu của câu trả lời PHẢI bao gồm khối Triage Alert dạng JSON hoặc block chuẩn:
   [[TRIAGE_ALERT]]
   {
     "level": "RED" | "YELLOW" | "GREEN",
     "title": "Tên mức độ nguy hiểm tiếng Việt",
     "urgency": "Mức độ khẩn cấp (vd: Cần cấp cứu ngay trong 1 giờ / Theo dõi tại nhà 24h / An toàn)",
     "actions": ["Hành động 1", "Hành động 2"]
   }
   [[/TRIAGE_ALERT]]

3. Phần nội dung chi tiết bên dưới bao gồm:
   - 🩺 **Chẩn đoán sơ bộ & Phân tích triệu chứng**: Giải thích nguyên nhân có thể xảy ra.
   - 🚑 **Hướng dẫn sơ cứu / Xử lý từng bước**: Rõ ràng, dễ làm.
   - 🥗 **Chế độ dinh dưỡng & Chăm sóc**: Thực phẩm nên ăn/kiêng.
   - ⚠️ **Khi nào cần đến bác sĩ thú y ngay lập tức**.

Hãy dùng ngôn từ ân cần, chuyên nghiệp, khoa học và dễ hiểu bằng Tiếng Việt.`,
  emergencyKeywords: ['ngộ độc', 'nôn ra máu', 'tiêu chảy máu', 'co giật', 'khó thở', 'ngạt thở', 'bất tỉnh', 'sốc nhiệt', 'tắc tiểu', 'gãy xương', 'tai nạn']
};
