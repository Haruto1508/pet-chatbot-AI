import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Phone, Star, AlertCircle, X } from 'lucide-react';
import { VetClinic } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { CardsGridSkeleton } from '../common/LoadingSkeleton';

export const AdminClinicsView: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const [clinics, setClinics] = useState<VetClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<VetClinic | null>(null);
  const [clinicToDelete, setClinicToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    lat: 10.7769,
    lng: 106.7009,
    rating: 4.8,
    isEmergency247: true,
    openingHours: 'Mở cửa 24/7',
    services: 'Cấp cứu 24/7, Phẫu thuật, Tiêm phòng, Chụp X-Quang',
    imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=500'
  });

  const loadClinics = async () => {
    setLoading(true);
    try {
      const data = await api.getClinics();
      setClinics(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error loading clinics:', e);
      setClinics([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadClinics();
  }, []);

  const openAddModal = () => {
    setEditingClinic(null);
    setFormData({
      name: '',
      address: '',
      phone: '0909 123 456',
      lat: 10.7769,
      lng: 106.7009,
      rating: 4.8,
      isEmergency247: true,
      openingHours: 'Mở cửa 24/7',
      services: 'Cấp cứu 24/7, Phẫu thuật, Tiêm phòng',
      imageUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&q=80&w=500'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (clinic: VetClinic) => {
    setEditingClinic(clinic);
    setFormData({
      name: clinic.name,
      address: clinic.address,
      phone: clinic.phone,
      lat: clinic.lat,
      lng: clinic.lng,
      rating: clinic.rating,
      isEmergency247: clinic.isEmergency247,
      openingHours: clinic.openingHours,
      services: clinic.services.join(', '),
      imageUrl: clinic.imageUrl
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const serviceList = formData.services.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      name: formData.name,
      address: formData.address,
      phone: formData.phone,
      lat: Number(formData.lat),
      lng: Number(formData.lng),
      rating: Number(formData.rating),
      isEmergency247: formData.isEmergency247,
      openingHours: formData.openingHours,
      services: serviceList,
      imageUrl: formData.imageUrl
    };

    try {
      if (editingClinic) {
        await api.updateClinic(editingClinic.id, payload);
        showSuccess('Cập nhật thành công!');
      } else {
        await api.createClinic(payload);
        showSuccess('Thêm phòng khám mới thành công!');
      }
      setIsModalOpen(false);
      loadClinics();
    } catch (e: any) {
      showError(e.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const handleDelete = (id: string) => {
    setClinicToDelete(id);
  };

  const confirmDelete = async () => {
    if (!clinicToDelete) return;
    try {
      await api.deleteClinic(clinicToDelete);
      showSuccess('Đã xóa phòng khám!');
      loadClinics();
    } catch (e) {
      showError('Lỗi khi xóa phòng khám.');
    } finally {
      setClinicToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quản Lý Danh Sách Bệnh Viện & Phòng Khám</h2>
            <p className="text-xs text-slate-500">
              Thêm mới, cập nhật tọa độ Google Maps và cấu hình dịch vụ cấp cứu 24/7.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs"
        >
          <Plus className="w-4 h-4" /> Thêm Phòng Khám
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-1 md:col-span-2">
            <CardsGridSkeleton count={4} />
          </div>
        ) : (
          clinics.map((clinic) => (
            <div key={clinic.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{clinic.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{clinic.address}</p>
                </div>
                {clinic.isEmergency247 && (
                  <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-100 text-red-700">
                    24/7
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
                <span>📞 {clinic.phone}</span>
                <span className="font-bold text-amber-500">⭐ {clinic.rating}</span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                <button
                  onClick={() => openEditModal(clinic)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  <Edit className="w-3.5 h-3.5" /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(clinic.id)}
                  className="p-1.5 hover:text-red-600 text-slate-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingClinic ? 'Chỉnh Sửa Phòng Khám' : 'Thêm Phòng Khám Mới'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên phòng khám / bệnh viện</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa chỉ đầy đủ</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Đánh giá (Sao)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isEmergency247}
                  onChange={(e) => setFormData({ ...formData, isEmergency247: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                Trực Cấp Cứu 24/7
              </label>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Các dịch vụ (phân cách bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.services}
                  onChange={(e) => setFormData({ ...formData, services: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Lưu
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
            <h3 className="text-lg font-bold text-center text-slate-900 mb-2">Xóa Phòng Khám</h3>
            <p className="text-sm text-center text-slate-500 mb-6">
              Bạn có chắc chắn muốn xóa phòng khám này khỏi danh sách? Hành động này không thể hoàn tác.
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
