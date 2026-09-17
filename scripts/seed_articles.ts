import fs from 'fs';
import path from 'path';

const articles = [
  {
    title: 'Bệnh Parvo ở chó: Dấu hiệu, cách sơ cứu và phòng ngừa',
    species: 'Chó',
    category: 'disease',
    summary: 'Bệnh Care (Parvo) là một trong những căn bệnh truyền nhiễm nguy hiểm nhất ở chó con, gây viêm dạ dày ruột xuất huyết nghiêm trọng.',
    symptoms: ['Nôn mửa liên tục', 'Tiêu chảy ra máu có mùi tanh', 'Bỏ ăn, mệt mỏi', 'Sốt cao', 'Mất nước trầm trọng'],
    firstAidSteps: [
      'Cách ly ngay lập tức khỏi các con chó khác',
      'Không cố ép ăn uống nếu chó nôn mửa liên tục',
      'Giữ ấm cơ thể',
      'Đưa đến bệnh viện thú y ngay lập tức (CẤP CỨU)'
    ],
    doctorAdvice: 'Cần bù dịch qua đường tĩnh mạch và dùng thuốc kháng sinh chống bội nhiễm. Tiêm phòng 3 mũi vaccine 5 hoặc 7 bệnh là cách phòng ngừa duy nhất hiệu quả.',
    urgencyLevel: 'RED',
    imageUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=800',
    content: 'Bệnh Parvovirus ở chó (Canine Parvovirus - CPV) là một loại virus rất dễ lây lan, ảnh hưởng chủ yếu đến đường tiêu hóa. Chó con dưới 4 tháng tuổi chưa tiêm phòng đầy đủ có nguy cơ nhiễm bệnh cao nhất. Virus xâm nhập vào thành ruột, phá hủy các mô khiến chó mất nước nhanh chóng. Tỉ lệ tử vong có thể lên tới 90% nếu không được điều trị kịp thời. Bệnh không lây sang người.'
  },
  {
    title: 'Dấu hiệu giảm bạch cầu ở mèo (Feline Panleukopenia)',
    species: 'Mèo',
    category: 'disease',
    summary: 'Bệnh giảm bạch cầu (Feline Parvovirus) là căn bệnh truyền nhiễm chết người ở mèo với tốc độ lây lan chóng mặt và khó điều trị.',
    symptoms: ['Sốt cao 40-41 độ', 'Nôn mửa dịch vàng', 'Tiêu chảy phân loãng hoặc có máu', 'Nằm một chỗ, lờ đờ', 'Rất khát nhưng không thể uống nước'],
    firstAidSteps: [
      'Cách ly ngay bé mèo bệnh',
      'Giữ ấm cơ thể',
      'Bổ sung điện giải (Oresol) nếu không bị nôn quá nhiều',
      'Mang đến bệnh viện thú y ngay lập tức'
    ],
    doctorAdvice: 'Bệnh không có thuốc đặc trị tiêu diệt virus, chủ yếu là điều trị triệu chứng (truyền dịch, kháng sinh chống bội nhiễm, thuốc chống nôn, tăng cường miễn dịch). Việc tiêm phòng vaccine 4 bệnh cho mèo đóng vai trò quyết định để cứu sống mèo.',
    urgencyLevel: 'RED',
    imageUrl: 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&q=80&w=800',
    content: 'Feline Panleukopenia Virus (FPV) tấn công trực tiếp vào các tế bào đang phân chia nhanh chóng trong cơ thể mèo, đặc biệt là tủy xương và niêm mạc đường ruột, làm giảm nghiêm trọng lượng bạch cầu trong máu khiến cơ thể mất khả năng miễn dịch. Cần phải sát khuẩn chuồng trại bằng dung dịch đặc trị vì virus FPV tồn tại rất lâu ở môi trường tự nhiên.'
  },
  {
    title: 'Viêm da ở chó mèo: Nguyên nhân và cách điều trị cơ bản',
    species: 'Cả hai',
    category: 'symptom',
    summary: 'Bệnh viêm da ở chó mèo thường do ký sinh trùng (ve, rận, ghẻ), nấm hoặc dị ứng thức ăn gây ra, khiến thú cưng ngứa ngáy và rụng lông.',
    symptoms: ['Ngứa ngáy, gãi nhiều', 'Rụng lông từng mảng', 'Da mẩn đỏ, có vảy hoặc nốt sần', 'Có mùi hôi ở vùng da bệnh', 'Xuất hiện mụn mủ'],
    firstAidSteps: [
      'Đeo vòng chống liếm (loa cổ Elizabeth)',
      'Vệ sinh vùng da bệnh bằng nước muối sinh lý hoặc Povidine loãng',
      'Tuyệt đối không tự ý bôi thuốc mỡ của người (như DEP) hay tắm xà phòng người'
    ],
    doctorAdvice: 'Cần làm xét nghiệm soi da dưới kính hiển vi để xác định chính xác nguyên nhân (nấm bào tử, ghẻ Demodex/Sarcoptes hay vi khuẩn) để dùng đúng thuốc. Luôn giữ môi trường sạch sẽ, khô ráo.',
    urgencyLevel: 'YELLOW',
    imageUrl: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800',
    content: 'Việc điều trị viêm da đòi hỏi sự kiên nhẫn, thường mất từ 4 - 8 tuần. Ngoài thuốc uống và thuốc bôi, cần kết hợp sử dụng sữa tắm đặc trị (chứa Chlorhexidine hoặc Ketoconazole) 1-2 lần/tuần. Đặc biệt cần tuân thủ lịch nhỏ gáy hoặc uống thuốc phòng ngừa ve rận, giun sán định kỳ để cắt đứt nguồn lây lan ký sinh trùng.'
  },
  {
    title: 'Sơ cứu khi chó mèo bị hóc xương hoặc dị vật',
    species: 'Cả hai',
    category: 'first_aid',
    summary: 'Hóc dị vật là tình trạng cấp cứu phổ biến. Nếu không được xử lý đúng cách, dị vật có thể đâm thủng thực quản hoặc gây nghẹt thở.',
    symptoms: ['Khạc nhổ liên tục', 'Chảy nhiều dãi', 'Dùng chân cào liên tục vào miệng', 'Khó thở, ho khẹc', 'Bỏ ăn đột ngột'],
    firstAidSteps: [
      'Giữ bình tĩnh, từ từ mở miệng thú cưng kiểm tra xem có thấy dị vật không',
      'Nếu dị vật dễ lấy (như xương mắc ngang răng), có thể dùng nhíp y tế gắp ra nhẹ nhàng',
      'NẾU KHÔNG THẤY HOẶC MẮC SÂU: Giữ nguyên hiện trạng, đưa đi cấp cứu thú y ngay',
      'TUYỆT ĐỐI không dùng tay móc sâu hoặc bắt nuốt nắm cơm như mẹo dân gian'
    ],
    doctorAdvice: 'Việc cố tình cho nuốt thức ăn cứng để đẩy dị vật xuống có thể khiến xương cắm sâu hơn vào niêm mạc, gây áp xe hoặc thủng thực quản, dẫn đến nhiễm trùng máu rất nguy hiểm. Cần chụp X-quang để xác định vị trí dị vật.',
    urgencyLevel: 'RED',
    imageUrl: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=800',
    content: 'Phòng ngừa hóc xương luôn là biện pháp tốt nhất. Không nên cho chó mèo ăn các loại xương dăm, xương gà, cổ vịt, hoặc cá có nhiều xương nhỏ cứng. Nếu muốn bổ sung canxi hoặc thỏa mãn nhu cầu nhai cắn, nên dùng các loại xương gặm chuyên dụng bằng da bò tảng, đồ chơi nhai, hoặc xay nhuyễn xương thật kỹ trước khi cho ăn.'
  },
  {
    title: 'Cách chăm sóc dinh dưỡng cho mèo bị sỏi tiết niệu (FUS / FLUTD)',
    species: 'Mèo',
    category: 'nutrition',
    summary: 'Viêm đường tiết niệu và sỏi thận là bệnh cực kỳ phổ biến ở mèo, đặc biệt là mèo đực ít vận động và ăn hạt khô kéo dài.',
    symptoms: ['Đi tiểu nhiều lần nhưng ra rất ít nước (tiểu dắt)', 'Kêu rên khi đang đi vệ sinh', 'Nước tiểu có màu hồng/đỏ (lẫn máu)', 'Liếm vùng sinh dục liên tục', 'Đi bậy ra ngoài khay cát vệ sinh'],
    firstAidSteps: [
      'Khuyến khích mèo uống nhiều nước bằng cách dùng đài phun nước hoặc pha nước thịt luộc',
      'Chuyển sang thức ăn ướt (pate) hoàn toàn',
      'Kiểm tra bụng: nếu bụng cứng và mèo hoàn toàn không tiểu được hơn 12 tiếng, phải đưa đi thông tiểu gấp'
    ],
    doctorAdvice: 'Mèo bị sỏi tiết niệu cần ăn hạt hoặc pate đặc trị (như Royal Canin Urinary S/O, Hills c/d) để hỗ trợ hòa tan sỏi Struvite và điều chỉnh độ pH nước tiểu. TUYỆT ĐỐI không cho ăn lại các loại hạt thông thường chứa nhiều canxi, magie.',
    urgencyLevel: 'YELLOW',
    imageUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800',
    content: 'Hội chứng đường tiết niệu ở mèo (FLUTD) thường tái phát nếu môi trường sống làm mèo stress hoặc uống ít nước. Nếu sỏi lớn làm tắc hoàn toàn niệu đạo, bàng quang sẽ căng phồng và có thể vỡ, hoặc gây suy thận cấp chỉ trong vòng 2 ngày, đe dọa trực tiếp đến tính mạng. Việc siêu âm và xét nghiệm nước tiểu định kỳ là rất cần thiết cho các bé từng có tiền sử bệnh.'
  }
];

async function seed() {
  console.log(`Bắt đầu thêm ${articles.length} bài viết (Kiến thức y khoa) vào CSDL...`);
  
  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(`Đang đẩy bài [${i + 1}/${articles.length}]: ${article.title}...`);
    
    try {
      const res = await fetch('http://localhost:3000/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article)
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`Lỗi khi đẩy bài ${i + 1}: ${errorText}`);
      } else {
        console.log(`-> Thành công!`);
      }
    } catch (e: any) {
      console.error(`Lỗi kết nối khi đẩy bài ${i + 1}:`, e.message);
    }
  }
  
  console.log('Hoàn thành quá trình seed dữ liệu!');
}

seed();
