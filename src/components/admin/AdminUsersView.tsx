import React, { useState, useEffect } from 'react';
import { Users, Search, Lock, Unlock, Trash2, Shield, UserCheck } from 'lucide-react';
import { UserProfile } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { ConfirmModal } from '../common/ConfirmModal';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showSuccess, showError } = useNotification();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState<UserProfile | null>(null);
  const [unlockRequests, setUnlockRequests] = useState<any[]>([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (e) {
      console.error('Error loading users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    try {
      const reqs = JSON.parse(localStorage.getItem('petcare_unlock_requests') || '[]');
      setUnlockRequests(reqs);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleToggleClick = (user: UserProfile) => {
    setUserToToggleStatus(user);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    try {
      const newStatus = userToToggleStatus.status === 'active' ? 'suspended' : 'active';
      await api.updateUserStatus(userToToggleStatus.id, newStatus);
      setUsers(prev => prev.map(u => u.id === userToToggleStatus.id ? { ...u, status: newStatus } : u));
      
      if (newStatus === 'active') {
        const updatedReqs = unlockRequests.filter(r => r.userId !== userToToggleStatus.id && r.userEmail !== userToToggleStatus.email);
        setUnlockRequests(updatedReqs);
        localStorage.setItem('petcare_unlock_requests', JSON.stringify(updatedReqs));
      }

      showSuccess(`Đã ${newStatus === 'active' ? 'mở khóa' : 'khóa'} tài khoản ${userToToggleStatus.name}`);
    } catch (e) {
      console.error(e);
      showError('Cập nhật trạng thái thất bại');
    } finally {
      setUserToToggleStatus(null);
    }
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete);
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      showSuccess('Đã xóa người dùng thành công');
    } catch (e) {
      console.error(e);
      showError('Xóa người dùng thất bại');
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Quản Lý Người Dùng & Tài Khoản</h2>
            <p className="text-xs text-slate-500">
              Kiểm soát quyền truy cập, khóa tài khoản vi phạm hoặc xóa hồ sơ người dùng.
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc email..."
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-4">Người Dùng</th>
                <th className="p-4">Vai Trò</th>
                <th className="p-4">Trạng Thái</th>
                <th className="p-4">Ngày Tham Gia</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-slate-500">
                    Đang tải danh sách người dùng...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-8 text-slate-500">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block">{u.name}</span>
                          <span className="text-[11px] text-slate-500 block">{u.email}</span>
                          {(() => {
                            const req = unlockRequests.find(r => r.userId === u.id || r.userEmail === u.email);
                            if (!req || u.status !== 'suspended') return null;
                            return (
                              <div className="mt-1 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] p-1.5 rounded-lg max-w-xs shadow-2xs">
                                <span className="font-bold block text-amber-800">📩 Đã gửi yêu cầu mở khóa:</span>
                                <span className="italic line-clamp-2">"{req.reason}"</span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                          u.role === 'admin'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="p-4">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                          <UserCheck className="w-3 h-3" /> Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-full text-[11px]">
                          <Lock className="w-3 h-3" /> Đã bị khóa
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-500">{u.createdAt}</td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleClick(u)}
                          title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          className={`p-1.5 rounded-lg border font-semibold text-[11px] transition-all cursor-pointer ${
                            u.status === 'active'
                              ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? (
                            <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Khóa</span>
                          ) : (
                            <span className="flex items-center gap-1"><Unlock className="w-3.5 h-3.5" /> Mở</span>
                          )}
                        </button>

                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleDeleteClick(u.id)}
                            title="Xóa người dùng"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Lock/Unlock Status Modal */}
      <ConfirmModal
        isOpen={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setUserToToggleStatus(null);
        }}
        onConfirm={confirmToggleStatus}
        title={
          userToToggleStatus?.status === 'active'
            ? 'Xác nhận khóa tài khoản'
            : 'Xác nhận mở khóa tài khoản'
        }
        message={
          userToToggleStatus?.status === 'active'
            ? `Bạn có chắc chắn muốn khóa tài khoản "${userToToggleStatus?.name}" (${userToToggleStatus?.email}) không? Người dùng sẽ bị tạm dừng quyền đăng nhập hệ thống.`
            : `Bạn có chắc chắn muốn khôi phục quyền hoạt động cho tài khoản "${userToToggleStatus?.name}" (${userToToggleStatus?.email}) không?`
        }
        confirmText={userToToggleStatus?.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa'}
        cancelText="Hủy bỏ"
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Xác nhận xóa tài khoản"
        message="Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống? Hành động này không thể hoàn tác."
      />
    </div>
  );
};
