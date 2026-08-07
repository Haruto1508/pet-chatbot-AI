import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { TriageLevel } from '../../types';

interface Props {
  level: TriageLevel;
  title?: string;
  urgency?: string;
  actions?: string[];
  compact?: boolean;
}

export const TriageBadge: React.FC<Props> = ({
  level,
  title,
  urgency,
  actions = [],
  compact = false
}) => {
  if (compact) {
    switch (level) {
      case 'RED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            ĐỎ: CẤP BÁCH
          </span>
        );
      case 'YELLOW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            VÀNG: CẢNH BÁO
          </span>
        );
      case 'GREEN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            XANH: AN TOÀN
          </span>
        );
    }
  }

  // Full Triage Alert Frame Box
  const getConfig = () => {
    switch (level) {
      case 'RED':
        return {
          bg: 'bg-red-50/90 border-red-500 text-red-950',
          headerBg: 'bg-red-600 text-white',
          icon: <ShieldAlert className="w-5 h-5 text-white animate-bounce" />,
          defaultTitle: 'CẢNH BÁO ĐỎ: CẤP BÁCH / NGUY HIỂM CAO',
          defaultUrgency: 'Thú cưng gặp nguy cơ nguy hiểm tính mạng! Cần đưa tới phòng khám thú y ngay lập tức.',
          badge: 'KHẨN CẤP 24/7'
        };
      case 'YELLOW':
        return {
          bg: 'bg-amber-50/90 border-amber-500 text-amber-950',
          headerBg: 'bg-amber-500 text-white',
          icon: <AlertTriangle className="w-5 h-5 text-white" />,
          defaultTitle: 'CẢNH BÁO VÀNG: THEO DÕI SÁT SAO',
          defaultUrgency: 'Triệu chứng bệnh mức độ trung bình. Theo dõi triệu chứng sát sao trong 12-24h.',
          badge: 'CẦN THEO DÕI'
        };
      case 'GREEN':
      default:
        return {
          bg: 'bg-emerald-50/90 border-emerald-500 text-emerald-950',
          headerBg: 'bg-emerald-600 text-white',
          icon: <CheckCircle2 className="w-5 h-5 text-white" />,
          defaultTitle: 'KHUNG XANH: AN TOÀN / MỨC ĐỘ THẤP',
          defaultUrgency: 'Không ghi nhận triệu chứng cấp bách. Thực hiện chăm sóc và dinh dưỡng bình thường.',
          badge: 'AN TOÀN'
        };
    }
  };

  const config = getConfig();

  return (
    <div className={`my-3 rounded-xl border-2 shadow-sm overflow-hidden transition-all ${config.bg}`}>
      <div className={`px-4 py-2.5 flex items-center justify-between font-bold text-sm tracking-wide ${config.headerBg}`}>
        <div className="flex items-center gap-2">
          {config.icon}
          <span>{title || config.defaultTitle}</span>
        </div>
        <span className="text-[11px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded bg-black/20 text-white">
          {config.badge}
        </span>
      </div>

      <div className="p-3.5 space-y-2 text-xs md:text-sm">
        <p className="font-semibold text-slate-800 leading-relaxed">
          {urgency || config.defaultUrgency}
        </p>

        {actions.length > 0 && (
          <div className="pt-2 border-t border-slate-200/80">
            <span className="font-bold text-slate-700 block mb-1">
              ⚡ Các hành động xử lý tức thì:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
              {actions.map((act, i) => (
                <li key={i} className="leading-snug">{act}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
