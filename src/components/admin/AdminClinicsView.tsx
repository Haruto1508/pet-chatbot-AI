import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Phone, Star, AlertCircle, X, Search, Clock, ShieldAlert, Building2 } from 'lucide-react';
import { VetClinic } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { CardsGridSkeleton } from '../common/LoadingSkeleton';

export const AdminClinicsView: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<VetClinic | null>(null);
  const [clinicToDelete, setClinicToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    lat: 10.7769,
    lng: 106.7009,
    rating: 5.0,
    isEmergency247: true,
    openingHours: 'Mở cửa 24/7',
    services: '',
    imageUrl: ''
  });

  const loadClinics = async (search?: string) => {
    setLoading(true);
    try {
      const data = await api.getClinics(search);
      setClinics(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading clinics from database:', e);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClinics(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const openAddModal = () => {
    setEditingClinic(null);
    setFormData({
      name: '',
      address: '',
      phone: '',
      lat: 10.7769,
      lng: 106.7009,
      rating: 5.0,
      isEmergency247: true,
      openingHours: 'Mở cửa 24/7',
      services: '',
      imageUrl: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (clinic: VetClinic) => {
    setEditingClinic(clinic);
    setFormData({
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone || '',
      lat: clinic.lat || 10.7769,
      lng: clinic.lng || 106.7009,
      rating: clinic.rating || 5.0,
      isEmergency247: !!clinic.isEmergency247,
      openingHours: clinic.openingHours || 'Mở cửa 24/7',
      services: Array.isArray(clinic.services) ? clinic.services.join(', ') : '',
      imageUrl: clinic.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim()) {
      showError('Vui lòng nhập tên và địa chỉ phòng khám');
      return;
    }

    setSubmitting(true);
    const serviceList = formData.services.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      phone: formData.phone.trim(),
      lat: Number(formData.lat) || 10.7769,
      lng: Number(formData.lng) || 106.7009,
      rating: Number(formData.rating) || 5.0,
      isEmergency247: formData.isEmergency247,
      openingHours: formData.openingHours.trim() || 'Mở cửa cả ngày',
      services: serviceList,
      imageUrl: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=500'
    };

    try {
      if (editingClinic) {
        await api.updateClinic(editingClinic.id, payload);
        showSuccess('Cập nhật phòng khám trong CSDL thành công!');
      } else {
        await api.createClinic(payload);
        showSuccess('Thêm phòng khám mới vào CSDL thành công!');
      }
      setIsModalOpen(false);
      loadClinics(searchTerm);
    } catch (e: any) {
      showError(e.message || 'Có lỗi xảy ra khi thao tác cơ sở dữ liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setClinicToDelete(id);
  };

  const confirmDelete = async () => {
    if (!clinicToDelete) return;
    try {
      await api.deleteClinic(clinicToDelete);
      showSuccess('Đã xóa phòng khám khỏi CSDL thành công!');
      loadClinics(searchTerm);
    } catch (e) {
      showError('Lỗi khi xóa phòng khám khỏi cơ sở dữ liệu.');
    } finally {
      setClinicToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">Quản Lý Phòng Khám & Bệnh Viện Thú Y</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                {clinics.length} cơ sở (CSDL Supabase)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ dữ liệu được lưu trữ trực tiếp trong CSDL Supabase, hỗ trợ đầy đủ thêm, sửa, xóa và tìm kiếm thời gian thực.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên hoặc địa chỉ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Thêm Phòng Khám
          </button>
        </div>
      </div>

      {/* Clinics Grid */}
      {loading ? (
        <CardsGridSkeleton count={4} />
      ) : clinics.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">
            {searchTerm ? 'Không tìm thấy phòng khám phù hợp' : 'Chưa có phòng khám nào trong cơ sở dữ liệu'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            {searchTerm
              ? `Không có kết quả nào khớp với "${searchTerm}". Hãy thử từ khóa khác.`
              : 'Hãy thêm phòng khám thú y đối tác đầu tiên để hiển thị cho người dùng trên bản đồ.'}
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Thêm Phòng Khám Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinics.map((clinic) => (
            <div
              key={clinic.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-200 transition-all flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {clinic.imageUrl ? (
                      <img
                        src={clinic.imageUrl}
                        alt={clinic.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{clinic.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{clinic.address}</span>
                      </p>
                    </div>
                  </div>
                  {clinic.isEmergency247 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 shrink-0 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      24/7
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-800">{clinic.phone || 'Chưa có SĐT'}</span>
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {clinic.rating || 5.0}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Clock className="w-3 h-3" />
                    {clinic.openingHours || 'Mở cửa cả ngày'}
                  </span>
                </div>

                {clinic.services && clinic.services.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {clinic.services.map((srv, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                      >
                        {srv}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-slate-400">
                  Tọa độ: {clinic.lat?.toFixed(4)}, {clinic.lng?.toFixed(4)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(clinic)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(clinic.id)}
                    className="p-1.5 rounded-lg border border-transparent hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                    title="Xóa phòng khám"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {editingClinic ? 'Chỉnh Sửa Thông Tin Phòng Khám' : 'Thêm Phòng Khám Mới Vào CSDL'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên phòng khám / Bệnh viện *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bệnh Xá Thú Y Trường Đại học Cần Thơ"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ đầy đủ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 600, Đường 30 Tháng 4, Phường Tân An, Cần Thơ"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 0945 455 623"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đánh giá (Sao từ 1.0 - 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vĩ độ (Latitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="10.008278"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kinh độ (Longitude)</label>
                  <input
                    type="number"
                    step="0.000001"
                    placeholder="105.765147"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giờ mở cửa</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Mở cửa 24/7 hoặc 7:30 - 21:00"
                    value={formData.openingHours}
                    onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                    <input
                      type="checkbox"
                      checked={formData.isEmergency247}
                      onChange={(e) => setFormData({ ...formData, isEmergency247: e.target.checked })}
                      className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                    />
                    <span>Trực Cấp Cứu 24/7 (Emergency)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Các dịch vụ cung cấp (ngăn cách bằng dấu phẩy)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cấp cứu 24/7, Phẫu thuật, Tiêm phòng, Xét nghiệm máu, Siêu âm"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Đường dẫn ảnh đại diện (Image URL)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 focus:border-purple-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu Vào Cơ Sở Dữ Liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clinicToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">Xóa Phòng Khám Khỏi CSDL</h3>
            <p className="text-sm text-center text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa phòng khám này khỏi CSDL Supabase? Bản ghi sẽ bị xóa vĩnh viễn và không thể khôi phục.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setClinicToDelete(null)}
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
