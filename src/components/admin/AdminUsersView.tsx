import React, { useState, useEffect } from 'react';
import {
  Users, Search, Lock, Unlock, Trash2, Shield, UserCheck,
  MessageSquare, ShieldCheck, ShieldOff, Crown, Ban, Filter, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { UserProfile } from '../../types';
import { api } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { AdminChatSessionsModal } from './AdminChatSessionsModal';
import { TableRowsSkeleton } from '../common/LoadingSkeleton';

interface AdminUsersViewProps {
  currentUser: UserProfile;
}

type RoleFilter = 'all' | 'admin' | 'subadmin' | 'user' | 'suspended';

let _usersCache: { users: UserProfile[]; reqs: any[]; loadedAt: number } | null = null;
const USERS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
        <Crown className="w-3 h-3 text-amber-600" /> Admin
      </span>
    );
  }
  if (role === 'subadmin') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
        <Shield className="w-3 h-3 text-purple-600" /> SubAdmin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase bg-slate-100 text-slate-700 border border-slate-200">
      User
    </span>
  );
}

export const AdminUsersView: React.FC<AdminUsersViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const { showSuccess, showError } = useNotification();

  // Status toggle modal (Ban / Unban)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [userToToggleStatus, setUserToToggleStatus] = useState<UserProfile | null>(null);
  const [unlockRequests, setUnlockRequests] = useState<any[]>([]);

  // Role change modal (User <-> SubAdmin)
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [userToChangeRole, setUserToChangeRole] = useState<UserProfile | null>(null);

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatModalUserId, setChatModalUserId] = useState<string | null>(null);

  const isFullAdmin = currentUser.role === 'admin';

  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter]);

  const loadUsersAndRequests = async (force = false) => {
    // Return cached users if available and fresh to avoid refetching on window focus or tab navigation
    if (!force && _usersCache && Date.now() - _usersCache.loadedAt < USERS_CACHE_TTL_MS) {
      setUsers(_usersCache.users);
      setUnlockRequests(_usersCache.reqs);
      setLoading(false);
      return;
    }

    if (force) setIsRefreshing(true);
    else setLoading(true);

    try {
      const [usersData, reqsData] = await Promise.all([
        api.getUsers(),
        api.getUnlockRequests()
      ]);
      const validUsers = Array.isArray(usersData) ? usersData : [];
      const validReqs = Array.isArray(reqsData) ? reqsData : [];
      setUsers(validUsers);
      setUnlockRequests(validReqs);
      _usersCache = { users: validUsers, reqs: validReqs, loadedAt: Date.now() };
    } catch (e) {
      console.error('Error loading data:', e);
      if (!_usersCache) {
        setUsers([]);
        setUnlockRequests([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsersAndRequests();
  }, []);

  // Explicit refresh triggered by clicking sidebar item
  useEffect(() => {
    const handleSidebarRefresh = () => {
      loadUsersAndRequests(true);
    };
    window.addEventListener('petcare_refresh_admin_users', handleSidebarRefresh);
    return () => window.removeEventListener('petcare_refresh_admin_users', handleSidebarRefresh);
  }, []);

  /* ── Status toggle (Ban / Unban) ── */
  const handleToggleClick = (user: UserProfile) => {
    if (user.id === currentUser.id) return;
    setUserToToggleStatus(user);
    setStatusModalOpen(true);
  };

  const confirmToggleStatus = async () => {
    if (!userToToggleStatus) return;
    try {
      const newStatus: 'active' | 'suspended' = userToToggleStatus.status === 'active' ? 'suspended' : 'active';
      await api.updateUserStatus(userToToggleStatus.id, newStatus);
      const updateFn = (u: UserProfile) => u.id === userToToggleStatus.id ? { ...u, status: newStatus } : u;
      setUsers(prev => prev.map(updateFn));
      if (_usersCache) {
        _usersCache.users = _usersCache.users.map(updateFn);
      }

      if (newStatus === 'active') {
        const safeReqs = Array.isArray(unlockRequests) ? unlockRequests : [];
        const reqsToDelete = safeReqs.filter(r => r.userId === userToToggleStatus.id || r.userEmail === userToToggleStatus.email);
        if (reqsToDelete.length > 0) {
          await Promise.all(reqsToDelete.map(r => api.deleteUnlockRequest(r.id)));
          const filterReqs = (prev: any[]) => (Array.isArray(prev) ? prev : []).filter(r => r.userId !== userToToggleStatus.id && r.userEmail !== userToToggleStatus.email);
          setUnlockRequests(filterReqs);
          if (_usersCache) {
            _usersCache.reqs = filterReqs(_usersCache.reqs);
          }
          window.dispatchEvent(new Event('petcare_notifications_updated'));
        }
      }

      showSuccess(newStatus === 'suspended'
        ? `Đã khóa (ban) tài khoản của ${userToToggleStatus.name}`
        : `Đã mở khóa tài khoản của ${userToToggleStatus.name}`
      );
    } catch (e) {
      console.error(e);
      showError('Cập nhật trạng thái thất bại');
    } finally {
      setUserToToggleStatus(null);
    }
  };

  /* ── Delete ── */
  const handleDeleteClick = (id: string) => {
    if (id === currentUser.id) return;
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      await api.deleteUser(userToDelete);
      setUsers(prev => (Array.isArray(prev) ? prev : []).filter(u => u.id !== userToDelete));
      if (_usersCache) {
        _usersCache.users = _usersCache.users.filter(u => u.id !== userToDelete);
      }
      showSuccess('Đã xóa người dùng thành công');
    } catch (e) {
      console.error(e);
      showError('Xóa người dùng thất bại');
    }
  };

  /* ── Role change ── */
  const handleRoleClick = (user: UserProfile) => {
    if (user.id === currentUser.id || user.role === 'admin') return;
    setUserToChangeRole(user);
    setRoleModalOpen(true);
  };

  const confirmRoleChange = async () => {
    if (!userToChangeRole) return;
    const newRole: 'user' | 'subadmin' = userToChangeRole.role === 'subadmin' ? 'user' : 'subadmin';
    try {
      const updated = await api.updateUserRole(userToChangeRole.id, newRole);
      const updateRoleFn = (u: UserProfile) => u.id === userToChangeRole.id ? { ...u, role: updated.role } : u;
      setUsers(prev => prev.map(updateRoleFn));
      if (_usersCache) {
        _usersCache.users = _usersCache.users.map(updateRoleFn);
      }
      showSuccess(`Đã cập nhật quyền: ${userToChangeRole.name} → ${newRole === 'subadmin' ? 'SubAdmin' : 'User'}`);
    } catch (e: any) {
      showError(e.message || 'Thay đổi quyền thất bại');
    } finally {
      setUserToChangeRole(null);
    }
  };

  const safeUsers = Array.isArray(users) ? users : [];

  // Filter users by search term and role tab
  const filteredUsers = safeUsers.filter(u => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter === 'admin') return u.role === 'admin';
    if (roleFilter === 'subadmin') return u.role === 'subadmin';
    if (roleFilter === 'user') return u.role === 'user';
    if (roleFilter === 'suspended') return u.status === 'suspended';
    return true;
  });

  // Pagination calculations
  const totalFilteredUsers = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredUsers / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFilteredUsers);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const totalUsers = safeUsers.length;
  const adminOnlyCount = safeUsers.filter(u => u.role === 'admin').length;
  const subAdminCount = safeUsers.filter(u => u.role === 'subadmin').length;
  const normalUserCount = safeUsers.filter(u => u.role === 'user').length;
  const suspendedCount = safeUsers.filter(u => u.status === 'suspended').length;
  const activeCount = safeUsers.filter(u => u.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Quản Lý Người Dùng &amp; Phân Quyền</h2>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Realtime DB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm soát danh sách tài khoản, khóa / ban vi phạm và chỉ định SubAdmin trong hệ thống.
                {!isFullAdmin && (
                  <span className="ml-2 text-purple-600 font-semibold">
                    (Chế độ SubAdmin | không thể thay đổi quyền hoặc xóa tài khoản)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => loadUsersAndRequests(true)}
              title="Tải lại dữ liệu người dùng từ database"
              disabled={isRefreshing}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isRefreshing ? 'Đang tải...' : 'Làm mới'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setChatModalUserId(null); setIsChatModalOpen(true); }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Xem tin nhắn &amp; Kiểm tra lỗi</span>
            </button>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên hoặc email..."
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick stats counter */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <span className="text-slate-500 text-[11px] block">Tổng tài khoản</span>
            <strong className="text-slate-900 text-base font-black">{totalUsers}</strong>
          </div>
          <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
            <span className="text-amber-800 text-[11px] block font-medium">Admin (Toàn quyền)</span>
            <strong className="text-amber-900 text-base font-black">{adminOnlyCount}</strong>
          </div>
          <div className="bg-purple-50/70 p-2.5 rounded-xl border border-purple-200/60">
            <span className="text-purple-800 text-[11px] block font-medium">SubAdmin</span>
            <strong className="text-purple-900 text-base font-black">{subAdminCount}</strong>
          </div>
          <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/60">
            <span className="text-blue-800 text-[11px] block font-medium">Người dùng (User)</span>
            <strong className="text-blue-900 text-base font-black">{normalUserCount}</strong>
          </div>
          <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60">
            <span className="text-emerald-800 text-[11px] block font-medium">Hoạt động</span>
            <strong className="text-emerald-900 text-base font-black">{activeCount}</strong>
          </div>
          <div className="bg-red-50/70 p-2.5 rounded-xl border border-red-200/60">
            <span className="text-red-800 text-[11px] block font-medium">Đã bị khóa / Ban</span>
            <strong className="text-red-900 text-base font-black">{suspendedCount}</strong>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>
          <button
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${roleFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
          >
            Tất cả ({totalUsers})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${roleFilter === 'admin'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
          >
            <Crown className="w-3.5 h-3.5" /> Admin ({adminOnlyCount})
          </button>
          <button
            onClick={() => setRoleFilter('subadmin')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${roleFilter === 'subadmin'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
          >
            <Shield className="w-3.5 h-3.5" /> SubAdmin ({subAdminCount})
          </button>
          <button
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${roleFilter === 'user'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
          >
            Người dùng ({normalUserCount})
          </button>
          <button
            onClick={() => setRoleFilter('suspended')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${roleFilter === 'suspended'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
          >
            <Ban className="w-3.5 h-3.5" /> Bị khóa ({suspendedCount})
          </button>
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
                <th className="p-4 text-right">Thao Tác Quản Trị</th>
              </tr>
            </thead>
            {loading ? (
              <TableRowsSkeleton rows={pageSize} cols={5} />
            ) : (
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-500">
                      Không tìm thấy tài khoản nào phù hợp bộ lọc.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    const isTargetAdmin = u.role === 'admin';

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-slate-50/80 transition-colors ${isSelf ? 'bg-amber-50/25' : ''
                          }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900">{u.name}</span>
                                {isSelf && (
                                  <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded shadow-2xs">
                                    Bạn (Hiện tại)
                                  </span>
                                )}
                              </div>
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
                          <RoleBadge role={u.role} />
                        </td>

                        <td className="p-4">
                          {u.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                              <UserCheck className="w-3 h-3" /> Hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 font-bold bg-red-50 px-2.5 py-0.5 rounded-full text-[11px] border border-red-200">
                              <Lock className="w-3 h-3" /> Đã bị khóa (Ban)
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-slate-500">
                          {new Date(u.createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* 1. View chat history / sessions */}
                            <button
                              onClick={() => { setChatModalUserId(u.id); setIsChatModalOpen(true); }}
                              title="Xem hội thoại & tin nhắn của người dùng"
                              className="p-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Tin nhắn</span>
                            </button>

                            {/* 2. Lock / Unlock (Ban / Unban) */}
                            {isSelf ? (
                              <span className="text-[11px] text-slate-400 italic px-1">Chính bạn</span>
                            ) : isTargetAdmin ? (
                              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Admin bảo vệ
                              </span>
                            ) : (
                              <>
                                {/* Full Admin can ban/unban non-admin users */}
                                {isFullAdmin && (
                                  <button
                                    onClick={() => handleToggleClick(u)}
                                    title={u.status === 'active' ? 'Khóa tài khoản (Ban)' : 'Mở khóa tài khoản'}
                                    className={`p-1.5 rounded-lg border font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${u.status === 'active'
                                        ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                        : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                      }`}
                                  >
                                    {u.status === 'active' ? (
                                      <><Lock className="w-3.5 h-3.5" /> Khóa / Ban</>
                                    ) : (
                                      <><Unlock className="w-3.5 h-3.5" /> Mở khóa</>
                                    )}
                                  </button>
                                )}

                                {/* 3. Role toggle: Set SubAdmin or demote to User */}
                                {isFullAdmin && (
                                  <button
                                    onClick={() => handleRoleClick(u)}
                                    title={u.role === 'subadmin' ? 'Hạ về User thông thường' : 'Thăng lên SubAdmin'}
                                    className={`p-1.5 rounded-lg border font-semibold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${u.role === 'subadmin'
                                        ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                                        : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                                      }`}
                                  >
                                    {u.role === 'subadmin' ? (
                                      <><ShieldOff className="w-3.5 h-3.5" /> Hạ về User</>
                                    ) : (
                                      <><ShieldCheck className="w-3.5 h-3.5" /> Thăng SubAdmin</>
                                    )}
                                  </button>
                                )}

                                {/* 4. Delete user account */}
                                {isFullAdmin && (
                                  <button
                                    onClick={() => handleDeleteClick(u.id)}
                                    title="Xóa người dùng vĩnh viễn"
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="bg-slate-50/90 border-t border-slate-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Left: Summary & Page Size selector */}
          <div className="flex flex-wrap items-center gap-3 text-slate-600">
            <span>
              Hiển thị <strong>{totalFilteredUsers === 0 ? 0 : startIndex + 1}</strong> - <strong>{endIndex}</strong> trong tổng số <strong>{totalFilteredUsers}</strong> người dùng
            </span>

            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
              <span className="text-slate-400 text-[11px]">Mỗi trang:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer shadow-2xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Right: Page Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              title="Trang đầu"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              title="Trang trước"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                .reduce<(number | string)[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                    acc.push('...');
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) => {
                  if (item === '...') {
                    return (
                      <span key={`dots-${idx}`} className="px-1.5 text-slate-400 select-none">
                        ...
                      </span>
                    );
                  }
                  const p = item as number;
                  const isActive = p === safeCurrentPage;
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${isActive
                          ? 'bg-slate-900 text-amber-400 shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {p}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              title="Trang sau"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              title="Trang cuối"
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Lock/Unlock (Ban/Unban) Modal */}
      <ConfirmModal
        isOpen={statusModalOpen}
        onClose={() => { setStatusModalOpen(false); setUserToToggleStatus(null); }}
        onConfirm={confirmToggleStatus}
        title={userToToggleStatus?.status === 'active' ? 'Xác nhận khóa (Ban) tài khoản' : 'Xác nhận mở khóa tài khoản'}
        message={
          userToToggleStatus?.status === 'active'
            ? `Bạn có chắc chắn muốn khóa tài khoản "${userToToggleStatus?.name}" (${userToToggleStatus?.email})? Người dùng sẽ bị chặn toàn bộ quyền đăng nhập và chat trên hệ thống.`
            : `Bạn có chắc chắn muốn khôi phục quyền hoạt động cho tài khoản "${userToToggleStatus?.name}" (${userToToggleStatus?.email})?`
        }
        confirmText={userToToggleStatus?.status === 'active' ? 'Khóa (Ban)' : 'Mở khóa'}
        cancelText="Hủy bỏ"
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setUserToDelete(null); }}
        onConfirm={confirmDelete}
        title="Xác nhận xóa tài khoản vĩnh viễn"
        message="Bạn có chắc chắn muốn xóa tài khoản này khỏi hệ thống? Hành động này sẽ xóa toàn bộ dữ liệu liên quan và không thể hoàn tác."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
      />

      {/* Confirm Role Change Modal */}
      <ConfirmModal
        isOpen={roleModalOpen}
        onClose={() => { setRoleModalOpen(false); setUserToChangeRole(null); }}
        onConfirm={confirmRoleChange}
        title={userToChangeRole?.role === 'subadmin' ? 'Xác nhận hạ quyền về User' : 'Xác nhận thăng lên SubAdmin'}
        message={
          userToChangeRole?.role === 'subadmin'
            ? `Hạ "${userToChangeRole?.name}" từ SubAdmin về User thông thường. Tài khoản sẽ mất quyền truy cập menu quản trị.`
            : `Thăng "${userToChangeRole?.name}" lên SubAdmin. Người dùng sẽ có quyền quản trị vận hành (Dashboard, Logs, Kiểm tra server, Quản lý bài viết, Phòng khám), nhưng KHÔNG THỂ truy cập/chỉnh sửa người dùng và cấu hình API/Key.`
        }
        confirmText={userToChangeRole?.role === 'subadmin' ? 'Hạ về User' : 'Thăng SubAdmin'}
        cancelText="Hủy bỏ"
      />

      {/* Admin User Live Chat Inspector Modal */}
      <AdminChatSessionsModal
        isOpen={isChatModalOpen}
        onClose={() => {
          setIsChatModalOpen(false);
          setChatModalUserId(null);
        }}
        initialUserId={chatModalUserId}
        users={safeUsers}
      />
    </div>
  );
};
