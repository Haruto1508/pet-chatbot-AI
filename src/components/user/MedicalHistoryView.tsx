import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Calendar,
  User,
  PawPrint,
  Filter,
  Download,
  Trash2,
  ChevronRight,
  ShieldAlert,
  Printer
} from 'lucide-react';
import { MedicalRecord, PetProfile, TriageLevel, UserProfile } from '../../types';
import { TriageBadge } from '../common/TriageBadge';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

interface Props {
  pets: PetProfile[];
  currentUser: UserProfile;
  onViewRecordDetail?: (record: MedicalRecord) => void;
}

export const MedicalHistoryView: React.FC<Props> = ({ pets, currentUser, onViewRecordDetail }) => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPetFilter, setSelectedPetFilter] = useState<string>('all');
  const [selectedTriageFilter, setSelectedTriageFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeRecordModal, setActiveRecordModal] = useState<MedicalRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const { showSuccess, showError } = useNotification();

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getMedicalRecords(undefined, currentUser.id);
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading medical records:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [currentUser.id]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecordToDelete(id);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await api.deleteMedicalRecord(recordToDelete);
      setRecords(prev => (Array.isArray(prev) ? prev : []).filter(r => r.id !== recordToDelete));
      if (activeRecordModal?.id === recordToDelete) setActiveRecordModal(null);
      showSuccess('Đã xóa hồ sơ bệnh án thành công!');
    } catch (e) {
      showError('Xóa hồ sơ bệnh án thất bại.');
    } finally {
      setRecordToDelete(null);
    }
  };

  const safeRecords = Array.isArray(records) ? records : [];
  const safePets = Array.isArray(pets) ? pets : [];

  const filteredRecords = safeRecords.filter(rec => {
    const matchesPet = selectedPetFilter === 'all' || rec.petId === selectedPetFilter;
    const matchesTriage = selectedTriageFilter === 'all' || rec.triageLevel === selectedTriageFilter;
    const matchesSearch =
      (rec.petName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.symptomSummary || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rec.diagnosis || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPet && matchesTriage && matchesSearch;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Lịch Sử & Hồ Sơ Bệnh Án Thú Cưng</h2>
              <p className="text-xs text-slate-500">
                Các hồ sơ bệnh án được AI tổng hợp tự động từ cuộc trò chuyện tư vấn sức khỏe.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            Tổng cộng: <strong>{records.length}</strong> bệnh án
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên thú cưng, chẩn đoán..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Pet Filter */}
        <div className="relative">
          <select
            value={selectedPetFilter}
            onChange={(e) => setSelectedPetFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
          >
            <option value="all">🐾 Tất cả thú cưng</option>
            {safePets.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.species})
              </option>
            ))}

          </select>
        </div>

        {/* Triage Level Filter */}
        <div className="relative">
          <select
            value={selectedTriageFilter}
            onChange={(e) => setSelectedTriageFilter(e.target.value)}
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-700"
          >
            <option value="all">🚦 Tất cả mức độ nguy hiểm</option>
            <option value="RED">🔴 Khẩn cấp (Cảnh báo Đỏ)</option>
            <option value="YELLOW">🟡 Theo dõi (Cảnh báo Vàng)</option>
            <option value="GREEN">🟢 An toàn (Cảnh báo Xanh)</option>
          </select>
        </div>
      </div>

      {/* Medical Records Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Đang tải danh sách hồ sơ...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Chưa có hồ sơ bệnh án nào phù hợp.</p>
          <p className="text-xs text-slate-500">
            Hãy bắt đầu trò chuyện với Chatbot AI và bấm nút "Lưu hồ sơ bệnh án" để tạo bệnh án đầu tiên.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecords.map((rec) => (
            <div
              key={rec.id}
              onClick={() => onViewRecordDetail ? onViewRecordDetail(rec) : setActiveRecordModal(rec)}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-500 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-xs">
                      🐾
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {rec.petName} ({rec.petSpecies})
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {rec.date}
                      </p>
                    </div>
                  </div>

                  <TriageBadge level={rec.triageLevel} compact />
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider">Triệu chứng:</span>
                    <p className="text-slate-600 line-clamp-2 mt-0.5">{rec.symptomSummary}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block text-xs uppercase tracking-wider">Chẩn đoán ban đầu:</span>
                    <p className="text-slate-900 font-semibold line-clamp-2 mt-0.5">{rec.diagnosis}</p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-500">
                <span className="text-emerald-600 group-hover:underline flex items-center gap-1">
                  Xem chi tiết phác đồ & dinh dưỡng <ChevronRight className="w-3.5 h-3.5" />
                </span>
                <button
                  onClick={(e) => handleDelete(rec.id, e)}
                  title="Xóa hồ sơ"
                  className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Medical Record Modal */}
      {activeRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setActiveRecordModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
            >
              ✕
            </button>

            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-slate-200 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                      HỒ SƠ BỆNH ÁN THÚ Y AI
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                      {activeRecordModal.petName} ({activeRecordModal.petSpecies})
                    </h3>
                  </div>
                  <TriageBadge level={activeRecordModal.triageLevel} compact />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mã bệnh án: {activeRecordModal.id} | Ngày tạo: {activeRecordModal.date}
                </p>
              </div>

              {/* Danger Frame */}
              <TriageBadge level={activeRecordModal.triageLevel} />

              {/* Clinical Details */}
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">🩺 Tóm Tắt Triệu Chứng Lâm Sàng:</span>
                  <p className="text-slate-700 leading-relaxed">{activeRecordModal.symptomSummary}</p>
                </div>

                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-1">
                  <span className="font-bold text-blue-950 block">🔬 Chẩn Đoán AI Bác Sĩ Thú Y:</span>
                  <p className="text-blue-900 font-medium leading-relaxed">{activeRecordModal.diagnosis}</p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-1">
                  <span className="font-bold text-emerald-950 block">💊 Phác Đồ Điều Trị & Sơ Cứu:</span>
                  <p className="text-emerald-900 leading-relaxed">{activeRecordModal.treatmentPlan}</p>
                </div>

                <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200 space-y-1">
                  <span className="font-bold text-amber-950 block">🥗 Chế Độ Dinh Dưỡng & Khẩu Phần:</span>
                  <p className="text-amber-900 leading-relaxed">{activeRecordModal.dietaryAdvice}</p>
                </div>

                <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1">
                  <span className="font-bold text-purple-950 block">📌 Lưu Ý Tái Khám & Theo Dõi:</span>
                  <p className="text-purple-900 leading-relaxed">{activeRecordModal.followUpNotes}</p>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700"
                >
                  <Printer className="w-4 h-4" /> In / Xuất Bệnh Án
                </button>

                <button
                  onClick={() => setActiveRecordModal(null)}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">Xóa Bệnh Án</h3>
            <p className="text-sm text-center text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ bệnh án này? Hành động này không thể hoàn tác.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRecordToDelete(null)}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-xs"
              >
                Xóa ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
