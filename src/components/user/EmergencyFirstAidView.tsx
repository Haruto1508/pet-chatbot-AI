import React from 'react';
import { ShieldAlert, PhoneCall, AlertTriangle, HeartPulse, ExternalLink, Activity } from 'lucide-react';

interface EmergencyGuide {
  id: string;
  title: string;
  urgency: 'RED' | 'YELLOW';
  species: string;
  causes: string;
  steps: string[];
  donots: string[];
}

export const EmergencyFirstAidView: React.FC = () => {
  const emergencyGuides: EmergencyGuide[] = [
    {
      id: 'fa_01',
      title: 'Xử lý Ngộ Độc Cấp Tính (Socola, Bã Thuốc, Hóa Chất)',
      urgency: 'RED',
      species: 'Chó & Mèo',
      causes: 'Ăn phải socola đen, củ hành tỏi, bã chuột, chất làm ngọt xylitol, hóa chất tẩy rửa.',
      steps: [
        'Xác định loại chất độc và lượng thú cưng đã tiếp xúc.',
        'Giữ thú cưng ở nơi thoáng mát, yên tĩnh, tránh hoảng loạn.',
        'Nếu dính hóa chất ngoài da/lông, xả bằng nước ấm sạch ngay lập tức.',
        'Gọi điện báo trước cho bệnh viện thú y 24/7 và di chuyển cấp cứu.'
      ],
      donots: [
        'KHÔNG tự ý ép nôn nếu thú cưng đã ngất, co giật hoặc nuốt phải chất tẩy/axit.',
        'KHÔNG cho uống sữa tươi vì sữa làm chất độc ngấm nhanh hơn qua đường ruột.'
      ]
    },
    {
      id: 'fa_02',
      title: 'Cấp Cứu Thất Nhịp & Khó Thở / Sặc Dị Vật',
      urgency: 'RED',
      species: 'Chó & Mèo',
      causes: 'Mắc xương cá, nuốt đồ chơi nhỏ, dị ứng sưng thanh quản, sặc nước.',
      steps: [
        'Mở miệng thú cưng, kéo lưỡi ra trước kiểm tra xem có dị vật nhìn thấy được không.',
        'Nếu nhìn thấy dị vật nhẹ nhàng dùng nhíp gắp ra (cẩn thận tránh bị cắn).',
        'Áp dụng thủ thuật Heimlich nhẹ cho thú cưng nếu nghẹt thở hoàn toàn.',
        'Giữ thẳng cổ thú cưng để đường thở thông thoáng.'
      ],
      donots: [
        'KHÔNG thò tay sâu vào họng mù đốn nếu không nhìn thấy rõ dị vật.',
        'KHÔNG đè mạnh lên lồng ngực làm gãy xương sườn.'
      ]
    },
    {
      id: 'fa_03',
      title: 'Sơ Cứu Bị Xe Đụng / Chấn Thương & Gãy Xương',
      urgency: 'RED',
      species: 'Chó & Mèo',
      causes: 'Va chạm giao thông, ngã từ tầng cao xuống.',
      steps: [
        'Dùng băng ca hoặc tấm gỗ phẳng cứng làm nẹp di chuyển.',
        'Buộc nhẹ mõm chó bằng dây mềm nếu chó bị đau có phản ứng cắn bảo vệ.',
        'Ép gạc sạch lên vết thương đang chảy máu liên tục trong 5-10 phút.',
        'Cố định vùng xương nghi gãy bằng thanh nẹp gỗ mềm bọc gạc.'
      ],
      donots: [
        'KHÔNG nhấc bổng thú cưng bằng cách bế dưới nách.',
        'KHÔNG cố uốn thẳng chi nghi gãy xương.'
      ]
    },
    {
      id: 'fa_04',
      title: 'Xử Lý Sốc Nhiệt / Say Nắng Ngày Hè',
      urgency: 'YELLOW',
      species: 'Chó & Mèo',
      causes: 'Để chó mèo trong xe hơi đóng kín, chạy nhảy dưới nắng gắt >38 độ C.',
      steps: [
        'Đưa vào chỗ mát có điều hòa/quạt ngay lập tức.',
        'Đắp khăn ẩm nước MÁT lên lòng bàn chân, bẹn và nách.',
        'Cho uống từng hụm nước mát nhỏ.',
        'Đo nhiệt độ hậu môn nếu >40 độ C cần liên hệ thú y.'
      ],
      donots: [
        'KHÔNG xối trực tiếp nước đá lạnh ngắt lên người.',
        'KHÔNG trùm kín người bằng khăn ướt bí.'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-red-600 text-white p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-amber-300 animate-pulse" />
            <h2 className="text-xl font-black">CẨM NANG SƠ CỨU KHẨN CẤP THÚ CƯNG (24/7)</h2>
          </div>
          <p className="text-xs text-red-100">
            Hướng dẫn thao tác tức thì trong 15 phút vàng giúp bảo vệ tính mạng chó mèo trước khi di chuyển tới phòng khám.
          </p>
        </div>

        <a
          href="tel:0903123456"
          className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-red-950 px-5 py-3 rounded-xl font-black text-xs shadow-md transition-all whitespace-nowrap"
        >
          <PhoneCall className="w-4 h-4 animate-bounce" />
          GỌI HOTLINE CẤP CỨU: 0903 123 456
        </a>
      </div>

      {/* Emergency Guide List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {emergencyGuides.map((guide) => (
          <div
            key={guide.id}
            className={`bg-white rounded-2xl border-2 p-5 shadow-sm space-y-4 ${
              guide.urgency === 'RED' ? 'border-red-400' : 'border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                  guide.urgency === 'RED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                🔴 NGUY HIỂM CAO - {guide.species}
              </span>
              <Activity className="w-5 h-5 text-red-600" />
            </div>

            <h3 className="text-base font-bold text-slate-900">{guide.title}</h3>

            <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <strong>Nguyên nhân thường gặp:</strong> {guide.causes}
            </p>

            <div className="space-y-2">
              <span className="text-xs font-bold text-emerald-700 block">✅ Các bước sơ cứu cần làm ngay:</span>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-1">
                {guide.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-red-600 block">❌ Tuyệt đối KHÔNG ĐƯỢC làm:</span>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 pl-1">
                {guide.donots.map((donot, i) => (
                  <li key={i}>{donot}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
