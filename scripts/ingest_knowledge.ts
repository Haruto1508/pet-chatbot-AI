import fs from 'fs';
import path from 'path';

// Cấu hình URL của API Server Node.js (phải đang chạy)
const API_URL = 'http://localhost:3000/api/articles';

// Thư mục chứa tài liệu RAG
const KNOWLEDGE_DIR = path.join(process.cwd(), 'python_ai_service', 'knowledge');

async function processFile(filePath: string) {
  const fileName = path.basename(filePath);
  console.log(`Đang xử lý file: ${fileName}`);

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Cắt file theo các đề mục lớn (Heading 1 - bắt đầu bằng '# ')
  // Dùng regex để split, giữ lại dấu '# '
  const sections = content.split(/\n# /g);

  for (let i = 0; i < sections.length; i++) {
    let sectionText = sections[i].trim();
    if (!sectionText) continue;

    // Nếu đoạn cắt không bắt đầu bằng '# ' (có thể là đoạn văn đầu file), thêm '# ' vào để parse dễ hơn
    if (i > 0 && !sectionText.startsWith('# ')) {
      sectionText = '# ' + sectionText;
    } else if (i === 0 && !sectionText.startsWith('# ')) {
      // Bỏ qua trang bìa hoặc phần giới thiệu không có heading rõ ràng
      continue;
    }

    const lines = sectionText.split('\n');
    let title = lines[0].replace(/^#\s*/, '').trim();
    
    // Xóa các ký tự thừa trong title (như *, _, [, ])
    title = title.replace(/[\*_\[\]]/g, '');

    const bodyContent = lines.slice(1).join('\n').trim();

    // Bỏ qua các mục quá ngắn (chỉ có tiêu đề mà không có nội dung)
    if (bodyContent.length < 50) {
      console.log(`- Bỏ qua mục "${title}" vì nội dung quá ngắn.`);
      continue;
    }

    // Tóm tắt đơn giản: Lấy 200 ký tự đầu tiên
    let summary = bodyContent.slice(0, 200).replace(/\n/g, ' ') + '...';

    // Xây dựng Payload gửi lên Server Node.js
    const payload = {
      title: title,
      summary: summary,
      content: bodyContent,
      category: 'medical_doc', // Phân loại tài liệu y khoa
      species: 'Cả hai', // Mặc định
      urgencyLevel: 'GREEN',
      symptoms: [],
      firstAidSteps: [],
      doctorAdvice: ''
    };

    console.log(`- Đang đẩy mục: "${title}" (Độ dài: ${bodyContent.length} ký tự)...`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`   -> THÀNH CÔNG! Đã lưu và sinh Vector.`);
      } else {
        const err = await response.text();
        console.error(`   -> LỖI: ${err}`);
      }
    } catch (e: any) {
      console.error(`   -> LỖI KẾT NỐI (Server Node.js có đang chạy không?): ${e.message}`);
    }

    // Đợi 2 giây giữa mỗi request để tránh bị quá tải (rate limit) từ API của Google Gemini
    await new Promise(r => setTimeout(r, 2000));
  }
}

async function main() {
  console.log('--- BẮT ĐẦU NẠP DỮ LIỆU RAG ---');
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    console.error(`Thư mục không tồn tại: ${KNOWLEDGE_DIR}`);
    return;
  }

  const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.md'));
  
  if (files.length === 0) {
    console.log('Không tìm thấy file .md nào trong thư mục knowledge.');
    return;
  }

  for (const file of files) {
    const filePath = path.join(KNOWLEDGE_DIR, file);
    await processFile(filePath);
  }

  console.log('--- HOÀN TẤT NẠP DỮ LIỆU ---');
}

main();
