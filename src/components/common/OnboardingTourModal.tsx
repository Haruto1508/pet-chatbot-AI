import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Stethoscope,
  Camera,
  MapPin,
  PawPrint,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Navigation,
  Phone,
  ArrowRight,
  FileText,
  HeartPulse,
  Clock,
  Compass
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface TourStep {
  id: number;
  tag: string;
  tagColor: string;
  title: string;
  subtitle: string;
  description: string;
  keyFeatures: string[];
  visualType: 'triage' | 'multimodal' | 'clinics' | 'records' | 'firstaid';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    tag: 'Bác Sĩ Thú Y AI 24/7',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    title: 'Chào Mừng Đến Với Vethic AI',
    subtitle: 'Hệ thống đánh giá sức khỏe & phân loại Triage thông minh',
    description:
      'Vethic AI giúp chủ nuôi phát hiện sớm các dấu hiệu nguy hiểm ở chó mèo, tư vấn định hướng xử lý ban đầu và hỗ trợ chăm sóc 24/7.',
    keyFeatures: [
      'Phân loại 3 mức độ: 🔴 Cấp cứu khẩn cấp / 🟡 Theo dõi thăm khám / 🟢 Bình thường',
      'Định hình phác đồ sơ cứu và khuyến nghị y tế chính xác theo từng triệu chứng',
      'Hỗ trợ tư vấn dinh dưỡng, hành vi và chăm sóc sức khỏe toàn diện'
    ],
    visualType: 'triage'
  },
  {
    id: 2,
    tag: 'AI Thị Giác Multimodal',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
    title: 'Chẩn Đoán Qua Hình Ảnh Lâm Sàng',
    subtitle: 'Nhận diện tổn thương da, mắt, niêm mạc qua ảnh chụp',
    description:
      'Bạn có thể gửi hình ảnh thực tế kèm câu hỏi để Bác sĩ AI phân tích thị giác, đối chiếu triệu chứng bệnh lý và phát hiện sớm bất thường.',
    keyFeatures: [
      'Đính kèm ảnh da, mắt, vết thương hoặc phân để đối chiếu lâm sàng',
      'Phát hiện sớm các bệnh ngoài da thường gặp (viêm da, nấm, ghẻ Demodex)',
      'Phản hồi đa phương thức kết hợp hướng dẫn sơ cứu tức thì'
    ],
    visualType: 'multimodal'
  },
  {
    id: 3,
    tag: 'Bản Đồ GPS & Cấp Cứu 24/7',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
    title: 'Tìm Phòng Khám Gần Nhất',
    subtitle: 'Định vị cơ sở thú y trực đêm & 1-click dẫn đường',
    description:
      'Tự động quét và hiển thị các cơ sở thú y uy tín xung quanh bạn, lọc nhanh phòng khám trực cấp cứu 24/7 khi thú cưng chuyển biến xấu.',
    keyFeatures: [
      'Tự động tính toán khoảng cách km từ vị trí hiện tại của bạn',
      'Lọc nhanh các bệnh viện thú y trực đêm có bác sĩ chuyên khoa',
      '1-click gọi hotline cấp cứu hoặc mở chỉ đường qua Google Maps'
    ],
    visualType: 'clinics'
  },
  {
    id: 4,
    tag: 'Sổ Khám Điện Tử',
    tagColor: 'bg-purple-100 text-purple-800 border-purple-200',
    title: 'Quản Lý Hồ Sơ & Thú Cưng',
    subtitle: 'Lưu trữ lịch sử tiêm chủng, cân nặng & bệnh án',
    description:
      'Mỗi bé cưng có một hồ sơ số riêng biệt để theo dõi tiến trình hồi phục, lịch tiêm phòng vắc xin định kỳ và xuất bệnh án dạng file.',
    keyFeatures: [
      'Quản lý nhiều bé (chó, mèo) với thông tin giống loài, cân nặng, dị ứng',
      'Lưu vết tất cả lịch sử tư vấn và phác đồ điều trị của Bác sĩ AI',
      'Tải xuống bản tóm tắt hồ sơ (.md) để mang đến phòng khám trực tiếp'
    ],
    visualType: 'records'
  },
  {
    id: 5,
    tag: 'Cẩm Nang Cứu Nguy',
    tagColor: 'bg-rose-100 text-rose-800 border-rose-200',
    title: 'Cẩm Nang Sơ Cứu Khẩn Cấp',
    subtitle: 'Hành động đúng lúc để bảo vệ tính mạng thú cưng',
    description:
      'Quy trình sơ cứu nhanh được xây dựng chuẩn y khoa cho các tình huống nguy kịch: ngộ độc, sặc dị vật, sốc nhiệt say nắng hay chấn thương.',
    keyFeatures: [
      'Các bước cần làm ngay để duy trì dấu hiệu sinh tồn cho bé',
      'Cảnh báo những sai lầm nguy hiểm tuyệt đối KHÔNG ĐƯỢC làm',
      'Cơ sở tri thức bệnh học phong phú, cập nhật liên tục'
    ],
    visualType: 'firstaid'
  }
];

export const OnboardingTourModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleComplete();
      } else if (e.key === 'ArrowRight') {
        if (currentStepIndex < TOUR_STEPS.length - 1) {
          setCurrentStepIndex((prev) => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((prev) => prev - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, dontShowAgain]);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('vethic_onboarding_completed', 'true');
    }
    onClose();
  };

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Modal Container */}
      <div
        className="bg-white w-full max-w-xl sm:max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Hướng Dẫn Nhanh Vethic AI</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {currentStepIndex + 1} / {TOUR_STEPS.length}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleComplete}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer hidden sm:inline"
            >
              Bỏ qua
            </button>
            <button
              type="button"
              onClick={handleComplete}
              className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Tag & Title */}
          <div>
            <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border mb-2.5 shadow-2xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isFirstStep ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              <span className={currentStep.tagColor}>{currentStep.tag}</span>
            </div>
            <h2 id="tour-title" className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              {currentStep.title}
            </h2>
            <p className="text-xs sm:text-sm text-emerald-700 font-semibold mt-0.5">
              {currentStep.subtitle}
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              {currentStep.description}
            </p>
          </div>

          {/* Interactive Illustration Preview Card */}
          <div className="rounded-2xl p-4 sm:p-5 border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 shadow-xs">
            {currentStep.visualType === 'triage' && (
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Mô phỏng 3 cấp độ phân loại:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl border border-red-200 bg-red-50/60 flex items-start gap-2">
                    <span className="text-sm">🔴</span>
                    <div>
                      <p className="text-xs font-bold text-red-800">Cấp cứu (RED)</p>
                      <p className="text-[10px] text-red-600 leading-tight mt-0.5">Nguy kịch, cần cấp cứu 24/7</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 flex items-start gap-2">
                    <span className="text-sm">🟡</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800">Theo dõi (YELLOW)</p>
                      <p className="text-[10px] text-amber-700 leading-tight mt-0.5">Thăm khám nếu không giảm</p>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-2">
                    <span className="text-sm">🟢</span>
                    <div>
                      <p className="text-xs font-bold text-emerald-800">An toàn (GREEN)</p>
                      <p className="text-[10px] text-emerald-700 leading-tight mt-0.5">Chăm sóc & dinh dưỡng</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep.visualType === 'multimodal' && (
              <div className="space-y-2.5">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">Tải ảnh triệu chứng thú cưng</p>
                      <p className="text-[11px] text-slate-500">Chụp vùng mắt, da, tai hoặc vết trầy xước</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                    AI Vision
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>AI tự động kết hợp phân tích đa phương thức văn bản và hình ảnh lâm sàng.</span>
                </div>
              </div>
            )}

            {currentStep.visualType === 'clinics' && (
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">Bệnh Viện Thú Y Vethic Central</h4>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200">
                        24/7 Cấp cứu
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">📍 Cách bạn 1.2 km • Mở cửa cả đêm</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                      <Phone className="w-3 h-3 text-emerald-600" /> Gọi
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                      <Navigation className="w-3 h-3 text-emerald-400" /> Chỉ đường
                    </span>
                  </div>
                </div>
              </div>
            )}

            {currentStep.visualType === 'records' && (
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                      🐾
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Mật Béo (Mèo Anh Lông Ngắn)</p>
                      <p className="text-[11px] text-slate-500">Cân nặng: 4.8 kg • Đã tiêm 4 bệnh cơ bản</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Hồ sơ chuẩn
                  </span>
                </div>
              </div>
            )}

            {currentStep.visualType === 'firstaid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Cần làm ngay:
                  </span>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Giữ ấm, đặt nơi thoáng khí, theo dõi nhịp thở và gọi cấp cứu.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-900">
                  <span className="font-bold flex items-center gap-1 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> Tuyệt đối KHÔNG:
                  </span>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    Không tự ý ép nôn khi ngất, không cho uống sữa tươi bừa bãi.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Key Features Bullet Points */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Điểm nổi bật của tính năng:
            </p>
            <ul className="space-y-1.5">
              {currentStep.keyFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-normal">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer: Controls & Dots */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none order-2 sm:order-1">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>Không tự động hiển thị lại</span>
          </label>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
            {/* Dots */}
            <div className="flex items-center gap-1.5 mr-2">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-6 bg-emerald-600'
                      : 'w-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Bước ${idx + 1}`}
                />
              ))}
            </div>

            {/* Back Button */}
            {!isFirstStep && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-200/70 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Quay lại
              </button>
            )}

            {/* Next / Finish Button */}
            <button
              type="button"
              onClick={handleNext}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isLastStep
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 ring-2 ring-emerald-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 active:scale-95'
              }`}
            >
              <span>{isLastStep ? 'Bắt đầu trải nghiệm' : 'Tiếp theo'}</span>
              {isLastStep ? <Sparkles className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
