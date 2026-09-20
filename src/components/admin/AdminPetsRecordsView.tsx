import React, { useState, useEffect } from 'react';
import { FileText, Search, Trash2, Calendar, PawPrint } from 'lucide-react';
import { MedicalRecord } from '../../types';
import { TriageBadge } from '../common/TriageBadge';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

export const AdminPetsRecordsView: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [triageFilter, setTriageFilter] = useState('all');
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getMedicalRecords();
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading records:', e);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDelete = (id: string) => {
    setRecordToDelete(id);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await api.deleteMedicalRecord(recordToDelete);
      setRecords(prev => (Array.isArray(prev) ? prev : []).filter(r => r.id !== recordToDelete));
      showSuccess('Đã xóa hồ sơ bệnh án thành công!');
    } catch (e) {
      showError('Lỗi khi xóa bệnh án.');
    } finally {
      setRecordToDelete(null);
    }
  };

  const safeRecords = Array.isArray(records) ? records : [];
  const filtered = safeRecords.filter(rec => {
    const matchesTriage = triageFilter === 'all' || rec.triageLevel === triageFilter;
    const matchesSearch =
      (rec.petName || '').toLowerCase().includes(search.toLowerCase()) ||
      (rec.diagnosis || '').toLowerCase().includes(search.toLowerCase()) ||
      (rec.symptomSummary || '').toLowerCase().includes(search.toLowerCase());
    return matchesTriage && matchesSearch;
  });


  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quản Lý Hồ Sơ Thú Cưng & Báo Cáo Bệnh Án</h2>
            <p className="text-xs text-slate-500">
              Tổng hợp tất cả hồ sơ chẩn đoán sức khỏe thú cưng được hệ thống AI ghi nhận.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={triageFilter}
            onChange={(e) => setTriageFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white"
          >
            <option value="all">🚦 Tất cả rủi ro</option>
            <option value="RED">🔴 Khẩn cấp (Đỏ)</option>
            <option value="YELLOW">🟡 Cảnh báo (Vàng)</option>
            <option value="GREEN">🟢 An toàn (Xanh)</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên thú cưng..."
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Đang tải bệnh án...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
            Không tìm thấy bệnh án nào.
          </div>
        ) : (
          filtered.map((rec) => (
            <div key={rec.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    🐾 {rec.petName} ({rec.petSpecies})
                  </span>
                  <span className="text-xs text-slate-400">• {rec.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <TriageBadge level={rec.triageLevel} compact />
                  <button
                    onClick={() => handleDelete(rec.id)}
                    className="p-1 hover:text-red-600 text-slate-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block">Triệu chứng:</span>
                  <p className="text-slate-600 mt-1">{rec.symptomSummary}</p>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <span className="font-bold text-blue-950 block">Chẩn đoán AI:</span>
                  <p className="text-blue-900 font-medium mt-1">{rec.diagnosis}</p>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs">
                <span className="font-bold text-emerald-950 block">Phác đồ & Lời khuyên:</span>
                <p className="text-emerald-900 mt-1">{rec.treatmentPlan} | {rec.dietaryAdvice}</p>
              </div>
            </div>
          ))
        )}
      </div>

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
