import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Compass,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

export interface TourStepConfig {
  id: number;
  selector: string;
  tabRequired?: string;
  requiresMobileSidebar?: boolean;
  title: string;
  tag: string;
  description: string;
  tip?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export const TOUR_STEPS: TourStepConfig[] = [
  {
    id: 1,
    selector: '[data-tour="chat-input"]',
    tabRequired: 'chat',
    requiresMobileSidebar: false,
    tag: 'Bước 1 / 4',
    title: 'Chat AI Tư Vấn',
    description:
      'Nhập triệu chứng thú cưng (nôn, bỏ ăn, tiêu chảy...). AI phân loại nguy cơ 🔴 Đỏ / 🟡 Vàng / 🟢 Xanh và đưa hướng dẫn sơ cứu ngay lập tức.',
    tip: '💡 Mô tả kèm thời gian xuất hiện giúp AI chẩn đoán chính xác hơn.',
    placement: 'top'
  },
  {
    id: 2,
    selector: '[data-tour="image-upload"]',
    tabRequired: 'chat',
    requiresMobileSidebar: false,
    tag: 'Bước 2 / 4',
    title: 'Gửi Ảnh Chẩn Đoán',
    description:
      'Đính kèm ảnh vết thương, da, mắt hoặc phân (JPG/PNG/WEBP/GIF, tối đa 5MB). Hỗ trợ dán Ctrl+V hoặc kéo thả ảnh thẳng vào khung chat.',
    tip: '📸 Chụp cận cảnh, đủ sáng để AI nhận diện chính xác hơn.',
    placement: 'top'
  },
  {
    id: 3,
    selector: '[data-tour="nav-news"]',
    requiresMobileSidebar: true,
    tag: 'Bước 3 / 4',
    title: 'Tin Tức & Sơ Cứu 24/7',
    description:
      'Tra cứu thao tác sơ cứu (ngộ độc, sặc dị vật, sốc nhiệt...) và đọc cẩm nang y khoa cập nhật cho thú cưng.',
    tip: '🚑 Làm đúng các bước sơ cứu giúp duy trì sinh tồn trước khi đến thú y.',
    placement: 'right'
  },
  {
    id: 4,
    selector: '[data-tour="nav-clinics"]',
    requiresMobileSidebar: true,
    tag: 'Bước 4 / 4',
    title: 'Tìm Phòng Khám Gần Nhất',
    description:
      'Định vị GPS phòng khám thú y quanh bạn, lọc trực cấp cứu 24/7, gọi hotline hoặc mở chỉ đường Google Maps chỉ 1 chạm.',
    tip: '📍 Dùng khi thú cưng nhận cảnh báo 🔴 Đỏ cần đến bác sĩ ngay.',
    placement: 'right'
  }
];

interface SpotlightTourProps {
  isOpen: boolean;
  onClose: () => void;
  onEnsureTab: (tab: string) => void;
  setIsOpenMobileSidebar?: (open: boolean) => void;
}

interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export const SpotlightTour: React.FC<SpotlightTourProps> = ({
  isOpen,
  onClose,
  onEnsureTab,
  setIsOpenMobileSidebar
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [targetRect, setTargetRect] = useState<ElementRect | null>(null);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number; placement: string }>({
    top: 0,
    left: 0,
    placement: 'top'
  });

  const currentStep = TOUR_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  // Measure and locate target element
  const updateTargetRect = useCallback(() => {
    if (!isOpen || !currentStep) return;

    const el = document.querySelector(currentStep.selector);
    if (!el) {
      // Element not found immediately, might be rendering
      return;
    }

    // Scroll into view if needed
    el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });

    const rect = el.getBoundingClientRect();
    // Add small padding around the element for comfortable spotlighting
    const padding = 6;
    setTargetRect({
      top: Math.max(0, rect.top - padding),
      left: Math.max(0, rect.left - padding),
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      bottom: rect.bottom + padding,
      right: rect.right + padding
    });
  }, [isOpen, currentStep]);

  // Adjust app view state based on current step requirements
  useEffect(() => {
    if (!isOpen) return;

    const isMobile = window.innerWidth < 1024;

    if (currentStep.tabRequired) {
      onEnsureTab(currentStep.tabRequired);
    }

    if (isMobile && setIsOpenMobileSidebar) {
      if (currentStep.requiresMobileSidebar) {
        setIsOpenMobileSidebar(true);
      } else {
        setIsOpenMobileSidebar(false);
      }
    }

    // Re-measure with brief delay to let layout transition finish
    const timer1 = setTimeout(updateTargetRect, 80);
    const timer2 = setTimeout(updateTargetRect, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isOpen, currentStepIndex, currentStep, onEnsureTab, setIsOpenMobileSidebar, updateTargetRect]);

  // Handle window resize and scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      updateTargetRect();
    };

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen, updateTargetRect]);

  // Compute Tooltip position relative to Target Rect
  useEffect(() => {
    if (!targetRect) return;

    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || 340;
    const tooltipHeight = tooltipEl?.offsetHeight || 220;
    const margin = 14;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let placement = currentStep.placement || 'top';
    let top = 0;
    let left = 0;

    if (placement === 'top') {
      top = targetRect.top - tooltipHeight - margin;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      // If overflows top, flip to bottom
      if (top < 16) {
        top = targetRect.bottom + margin;
        placement = 'bottom';
      }
    } else if (placement === 'bottom') {
      top = targetRect.bottom + margin;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      // If overflows bottom, flip to top
      if (top + tooltipHeight > vh - 16) {
        top = targetRect.top - tooltipHeight - margin;
        placement = 'top';
      }
    } else if (placement === 'right') {
      left = targetRect.right + margin;
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      // If overflows right (e.g. mobile), fallback to bottom or top
      if (left + tooltipWidth > vw - 16) {
        top = targetRect.bottom + margin;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        placement = 'bottom';
      }
    } else if (placement === 'left') {
      left = targetRect.left - tooltipWidth - margin;
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      if (left < 16) {
        left = targetRect.right + margin;
        placement = 'right';
      }
    }

    // Clamp coordinates inside visible viewport
    left = Math.max(16, Math.min(left, vw - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, vh - tooltipHeight - 16));

    setTooltipPos({ top, left, placement });
  }, [targetRect, currentStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleFinish();
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
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem('vethic_onboarding_completed', 'true');
    }
    if (setIsOpenMobileSidebar) {
      setIsOpenMobileSidebar(false);
    }
    onClose();
  };

  const handleNext = () => {
    if (isLastStep) {
      handleFinish();
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
    <div className="fixed inset-0 z-50 pointer-events-auto overflow-hidden animate-in fade-in duration-200">
      {/* 1. SVG Cutout Spotlight Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="vethic-spotlight-mask">
            {/* White canvas = visible dark overlay */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black hole = transparent spotlight cutout */}
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="16"
                ry="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        {/* Dark dimming backdrop with cutout */}
        <rect
          x="0"
          y="0"
          width="100%" height="100%"
          fill="rgba(15, 23, 42, 0.76)"
          mask="url(#vethic-spotlight-mask)"
        />
      </svg>

      {/* 2. Glowing Animated Focus Ring around Target */}
      {targetRect && (
        <div
          style={{
            top: `${targetRect.top}px`,
            left: `${targetRect.left}px`,
            width: `${targetRect.width}px`,
            height: `${targetRect.height}px`
          }}
          className="absolute rounded-2xl border-2 border-emerald-400/90 shadow-[0_0_24px_rgba(52,211,153,0.55)] pointer-events-none transition-all duration-300 ease-out animate-pulse ring-4 ring-emerald-500/20"
        />
      )}

      {/* 3. Floating Tooltip Popover Pointing at Target */}
      <div
        ref={tooltipRef}
        style={{
          top: `${tooltipPos.top}px`,
          left: `${tooltipPos.left}px`
        }}
        className="absolute w-[calc(100vw-28px)] max-w-[320px] bg-white rounded-xl shadow-xl border border-slate-200/90 p-3 transition-all duration-300 ease-out z-50 pointer-events-auto"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60 shadow-2xs">
              {currentStep.tag}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">
              Vethic AI Tour
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleFinish}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Bỏ qua
            </button>
            <button
              type="button"
              onClick={handleFinish}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="space-y-1.5">
          <h3 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{currentStep.title}</span>
          </h3>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            {currentStep.description}
          </p>

          {currentStep.tip && (
            <div className="px-2 py-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-800 text-[10px] font-medium leading-snug">
              {currentStep.tip}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Checkbox Don't show again */}
          <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-3 h-3 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>Không hiện lại</span>
          </label>

          {/* Dots and Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Step Dots */}
            <div className="flex items-center gap-1">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? 'w-4 bg-emerald-600'
                      : 'w-1.5 bg-slate-200 hover:bg-slate-300'
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
                className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-0.5 cursor-pointer"
              >
                <ChevronLeft className="w-3 h-3" />
                Lại
              </button>
            )}

            {/* Next / Finish Button */}
            <button
              type="button"
              onClick={handleNext}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold text-white transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                isLastStep
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
            >
              <span>{isLastStep ? 'Hoàn tất' : 'Tiếp'}</span>
              {isLastStep ? <Sparkles className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
