import React, { useState } from 'react';
import { PawPrint, Plus, Edit, Trash2, Shield, AlertCircle, Heart, X, Check } from 'lucide-react';
import { PetProfile, UserProfile } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface Props {
  pets: PetProfile[];
  currentUser: UserProfile;
  onRefreshPets: () => void;
}

export const PetManagementView: React.FC<Props> = ({ pets, currentUser, onRefreshPets }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<PetProfile | null>(null);
  const { showSuccess, showError } = useNotification();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [petToDelete, setPetToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    species: 'Mèo' as 'Chó' | 'Mèo' | 'Chim' | 'Thú nhỏ khác',
    breed: '',
    age: 12,
    weight: 3.5,
    gender: 'Đực' as 'Đực' | 'Cái',
    vaccineStatus: '',
    allergies: '',
    avatarUrl: ''
  });

  const openAddModal = () => {
    setEditingPet(null);
    setFormData({
      name: '',
      species: 'Mèo',
      breed: '',
      age: 12,
      weight: 3.5,
      gender: 'Đực',
      vaccineStatus: 'Vắc xin phòng Dại, Tiêm nhắc định kỳ',
      allergies: 'Không có',
      avatarUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pet: PetProfile) => {
    setEditingPet(pet);
    const vaccineStr = Array.isArray(pet.vaccineStatus) ? pet.vaccineStatus.join(', ') : (pet.vaccineStatus || '');
    const allergiesStr = Array.isArray(pet.allergies) ? pet.allergies.join(', ') : (pet.allergies || '');
    setFormData({
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      weight: pet.weight,
      gender: pet.gender,
      vaccineStatus: vaccineStr,
      allergies: allergiesStr,
      avatarUrl: pet.avatarUrl
    });
    setIsModalOpen(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vaccines = formData.vaccineStatus.split(',').map(s => s.trim()).filter(Boolean);
    const allergyList = formData.allergies.split(',').map(s => s.trim()).filter(Boolean);

    const payload = {
      userId: currentUser.id,
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      age: Number(formData.age),
      weight: Number(formData.weight),
      gender: formData.gender,
      vaccineStatus: vaccines,
      allergies: allergyList,
      avatarUrl: formData.avatarUrl || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400'
    };

    try {
      if (editingPet) {
        await api.updatePet(editingPet.id, payload);
        showSuccess(`Cập nhật thông tin bé ${payload.name} thành công`);
      } else {
        await api.createPet(payload);
        showSuccess(`Đã thêm bé ${payload.name} thành công`);
      }
      setIsModalOpen(false);
      onRefreshPets();
    } catch (e) {
      console.error(e);
      showError('Có lỗi xảy ra khi lưu thông tin thú cưng');
    }
  };

  const handleDeleteClick = (id: string) => {
    setPetToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!petToDelete) return;
    try {
      await api.deletePet(petToDelete);
      onRefreshPets();
      showSuccess('Đã xóa thú cưng thành công');
    } catch (e) {
      console.error(e);
      showError('Xóa thú cưng thất bại');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <PawPrint className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quản Lý Hồ Sơ Thú Cưng</h2>
            <p className="text-xs text-slate-500">
              Thêm mới và cập nhật thông tin vắc-xin, dị ứng, cân nặng để AI chẩn đoán chuẩn xác.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm Thú Cưng Mới
        </button>
      </div>

      {/* Pet Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(Array.isArray(pets) ? pets : []).map((pet) => (
          <div
            key={pet.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={pet.avatarUrl}
                  alt={pet.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-amber-300 shadow-sm transition-transform duration-200 hover:scale-105"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{pet.name}</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                      {pet.species}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{pet.breed}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {pet.gender} • {pet.age} tháng tuổi • {pet.weight} kg
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" /> Vắc xin đã tiêm:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(Array.isArray(pet.vaccineStatus) ? pet.vaccineStatus : []).map((v, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium">
                        ✓ {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Tiền sử dị ứng:
                  </span>
                  <p className="text-slate-600 mt-0.5">
                    {(Array.isArray(pet.allergies) ? pet.allergies.join(', ') : pet.allergies) || 'Không có'}
                  </p>
                </div>
              </div>
            </div>


            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => openEditModal(pet)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700"
              >
                <Edit className="w-3.5 h-3.5" /> Chỉnh Sửa
              </button>

              <button
                onClick={() => handleDeleteClick(pet.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Pet */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingPet ? 'Chỉnh Sửa Hồ Sơ Thú Cưng' : 'Thêm Thú Cưng Mới'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Thú Cưng</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ví dụ: Mật Béo, Lucky..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loài</label>
                  <select
                    value={formData.species}
                    onChange={(e) => setFormData({ ...formData, species: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Mèo">🐱 Mèo</option>
                    <option value="Chó">🐶 Chó</option>
                    <option value="Chim">🦜 Chim</option>
                    <option value="Thú nhỏ khác">🐹 Thú nhỏ khác</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giống</label>
                  <input
                    type="text"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ví dụ: Anh Lông Ngắn, Poodle..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tuổi (tháng)</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Cân nặng (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    <option value="Đực">Đực</option>
                    <option value="Cái">Cái</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Trạng thái vắc xin (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={formData.vaccineStatus}
                  onChange={(e) => setFormData({ ...formData, vaccineStatus: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Dại, 7 bệnh, Tẩy giun..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiền sử dị ứng (nếu có)</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  placeholder="Dị ứng hải sản, dị ứng nhạy cảm..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hình ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  <img 
                    src={formData.avatarUrl || 'https://via.placeholder.com/150'} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm bg-slate-50 transition-transform duration-200 hover:scale-105"
                  />
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({ ...formData, avatarUrl: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Lưu Hồ Sơ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setPetToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xác nhận xóa thú cưng"
        message="Bạn có chắc chắn muốn xóa thú cưng này khỏi hệ thống? Thao tác này sẽ xóa toàn bộ hồ sơ y tế liên quan."
      />
    </div>
  );
};
