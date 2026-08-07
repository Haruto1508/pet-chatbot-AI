import React from 'react';
import {
  ArrowLeft,
  Calendar,
  Printer,
  Trash2,
  FileText,
  AlertTriangle,
  Clipboard,
  Check,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { MedicalRecord } from '../../types';
import { TriageBadge } from '../common/TriageBadge';

interface Props {
  record: MedicalRecord;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export const MedicalRecordDetailView: React.FC<Props> = ({ record, onBack, onDelete }) => {
  const [idCopied, setIdCopied] = React.useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(record.id);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 print:p-0 print:m-0">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs print:hidden">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-emerald-700 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại lịch sử bệnh án
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onDelete(record.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 hover:bg-red-50 rounded-xl text-sm font-bold text-red-600 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" /> Xóa hồ sơ
          </button>
        </div>
      </div>

      {/* Main Print Layout / View Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata & Triage */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Main Record Badge Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="space-y-2">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Diagnostic Record
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
                {record.petName}
              </h2>
              <p className="text-sm text-slate-500 font-semibold flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Ngày lập: {record.date}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3.5">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Mức độ cảnh báo</span>
                <div className="mt-1.5">
                  <TriageBadge level={record.triageLevel} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wide">Loài vật</span>
                  <strong className="text-slate-800 text-sm mt-0.5 block">{record.petSpecies}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-2 group/id">
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-400 block font-bold text-[11px] uppercase tracking-wide">Mã hồ sơ</span>
                    <strong className="text-slate-800 text-xs mt-0.5 block truncate" title={record.id}>
                      {record.id.substring(0, 8)}...
                    </strong>
                  </div>
                  <button
                    onClick={handleCopyId}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer shadow-3xs flex-shrink-0"
                    title="Copy mã hồ sơ"
                  >
                    {idCopied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clipboard className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Original Chat Snippet */}
          {record.chatSnippet && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4 print:hidden">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <MessageSquare className="w-4 h-4 text-slate-500" /> Trích dẫn cuộc hội thoại
              </h3>
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-sm text-slate-600 font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                {record.chatSnippet}
              </div>
              <p className="text-[11px] text-slate-400 italic">
                * Đây là đoạn chat gốc đã được AI sử dụng để phân tích và tổng hợp thông tin y khoa phía bên.
              </p>
            </div>
          )}

        </div>

        {/* Right Column: Medical Summary Fields */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-6 print:border-none print:shadow-none print:p-0">
            
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Chi Tiết Kết Quả Khám AI</h3>
            </div>

            {/* Content Fields */}
            <div className="space-y-6">
              
              {/* Symptoms */}
              <div className="space-y-2">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Triệu chứng lâm sàng
                </h4>
                <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/60 text-slate-800 text-base leading-relaxed whitespace-pre-line">
                  {record.symptomSummary}
                </div>
              </div>

              {/* AI Diagnosis */}
              <div className="space-y-2">
                <h4 className="text-sm font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Chẩn đoán của Bác sĩ Thú y AI
                </h4>
                <div className="bg-blue-50/40 p-4 sm:p-5 rounded-2xl border border-blue-100 text-blue-950 text-base font-bold leading-relaxed whitespace-pre-line">
                  {record.diagnosis}
                </div>
              </div>

              {/* Treatment Plan */}
              <div className="space-y-2">
                <h4 className="text-sm font-black text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Hướng dẫn sơ cứu & Phác đồ đề xuất
                </h4>
                <div className="bg-emerald-50/40 p-4 sm:p-5 rounded-2xl border border-emerald-100 text-emerald-950 text-base leading-relaxed whitespace-pre-line">
                  {record.treatmentPlan}
                </div>
              </div>

              {/* Dietary Advice */}
              <div className="space-y-2">
                <h4 className="text-sm font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Chế độ dinh dưỡng & Chăm sóc khẩu phần
                </h4>
                <div className="bg-amber-50/40 p-4 sm:p-5 rounded-2xl border border-amber-100 text-amber-950 text-base leading-relaxed whitespace-pre-line">
                  {record.dietaryAdvice}
                </div>
              </div>

              {/* Follow-up notes */}
              <div className="space-y-2">
                <h4 className="text-sm font-black text-purple-600 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Hướng dẫn theo dõi & Lịch trình tái khám
                </h4>
                <div className="bg-purple-50/40 p-4 sm:p-5 rounded-2xl border border-purple-100 text-purple-950 text-base leading-relaxed whitespace-pre-line">
                  {record.followUpNotes}
                </div>
              </div>

            </div>

            {/* Disclaimer Disclaimer */}
            <div className="mt-8 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-500 leading-relaxed">
              <span className="font-extrabold text-slate-700 flex items-center gap-1.5 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" /> Khuyến cáo Y tế quan trọng:
              </span>
              Hệ thống PetCare AI chẩn đoán dựa trên mô tả triệu chứng và cơ sở dữ liệu chuyên môn. Đây chỉ là thông tin tham khảo, hướng dẫn sơ cứu khẩn cấp ban đầu. Không thể thay thế hoàn toàn việc chẩn đoán trực tiếp bằng xét nghiệm lâm sàng tại phòng khám thú y. Hãy đưa bé đến bác sĩ thú y ngay khi mức cảnh báo hiển thị Đỏ (RED).
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
