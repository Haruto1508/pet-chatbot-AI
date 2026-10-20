import React, { useState, useEffect } from 'react';
import {
  Coins, Sparkles, Check, Zap, Crown, ArrowRight, ShieldCheck,
  CreditCard, Clock, QrCode, AlertCircle, RotateCcw, ChevronRight,
  TrendingUp, Award, HelpCircle, Gift
} from 'lucide-react';
import { UserProfile, PointTransaction, ChatPackage } from '../../types';
import { api } from '../../services/api';

interface PricingPackagesViewProps {
  currentUser: UserProfile;
  onUpdateUser: (updates: Partial<UserProfile>) => void;
  onOpenLoginModal: () => void;
  onNavigateToChat: () => void;
}

export const PricingPackagesView: React.FC<PricingPackagesViewProps> = ({
  currentUser,
  onUpdateUser,
  onOpenLoginModal,
  onNavigateToChat,
}) => {
  const isGuest = currentUser.id === 'guest';
  const userPoints = currentUser.points ?? 10;

  // Custom amount state
  const [customPoints, setCustomPoints] = useState<number>(20);
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{ points: number; message: string } | null>(null);

  // Transactions list
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load transactions and latest point balance
  const loadData = async () => {
    if (isGuest) return;
    setIsLoadingHistory(true);
    try {
      const [balRes, txRes] = await Promise.all([
        api.getUserPoints(currentUser.id),
        api.getPointTransactions(currentUser.id)
      ]);
      if (balRes && typeof balRes.points === 'number') {
        onUpdateUser({ points: balRes.points });
      }
      if (Array.isArray(txRes)) {
        setTransactions(txRes);
      }
    } catch (e) {
      console.error('Failed to load points data:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser.id]);

  // Packages list
  const packages = [
    {
      id: 'month',
      name: 'Gói Chat Tháng',
      tagline: 'Phổ biến nhất cho chủ nuôi',
      badge: 'TIẾT KIỆM 20%',
      priceVnd: 49000,
      points: 60,
      duration: '30 ngày',
      description: 'Lựa chọn hoàn hảo để theo dõi sức khỏe và chăm sóc thú cưng định kỳ.',
      features: [
        '60 lượt tư vấn Bác Sĩ Thú Y AI chuyên sâu',
        'Phân tích tổn thương ngoài da qua hình ảnh',
        'Phân loại mức độ nguy cấp Triage 🔴🟡🟢',
        'Lưu lịch sử hội thoại không giới hạn',
        'Tra cứu phòng khám thú y 24/7 gần nhất'
      ],
      isPopular: true,
      color: 'from-emerald-500 to-teal-600',
      badgeColor: 'bg-emerald-500 text-white'
    },
    {
      id: 'year',
      name: 'Gói Chat Năm (VIP)',
      tagline: 'Gói siêu ưu đãi cho cả năm',
      badge: 'TIẾT KIỆM CAO NHẤT',
      priceVnd: 399000,
      points: 500,
      duration: '365 ngày',
      description: 'Trọn vẹn 1 năm bảo vệ sức khỏe toàn diện cho tất cả thú cưng trong gia đình.',
      features: [
        '500 lượt tư vấn AI ưu tiên cao nhất',
        'Tặng huy hiệu Thành Viên VIP Thú Cưng',
        'Ưu tiên kết nối máy chủ AI siêu tốc độ',
        'Lưu trữ hồ sơ y tế & phác đồ điều trị trọn đời',
        'Hỗ trợ sơ cứu khẩn cấp & tra cứu hotline 24/7'
      ],
      isBestValue: true,
      color: 'from-amber-500 to-orange-600',
      badgeColor: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
    }
  ];

  // Quick custom point options
  const quickOptions = [10, 20, 50, 100, 200];

  const handleSelectPackage = (pkg: any) => {
    if (isGuest) {
      onOpenLoginModal();
      return;
    }
    setSelectedPackage(pkg);
    setIsPaymentModalOpen(true);
  };

  const handleSelectCustom = () => {
    if (isGuest) {
      onOpenLoginModal();
      return;
    }
    const amount = customPoints * 1000;
    setSelectedPackage({
      id: 'custom',
      name: `Nạp tùy ý: ${customPoints} Point`,
      tagline: 'Gói nạp điểm linh hoạt',
      priceVnd: amount,
      points: customPoints,
      description: `Quy đổi 1 Point = 1.000 VNĐ. Nhận ngay ${customPoints} điểm chat.`
    });
    setIsPaymentModalOpen(true);
  };

  // Process Mock Sandbox Top-up
  const handleConfirmSandboxPayment = async () => {
    if (!selectedPackage || isGuest) return;
    setIsProcessingPayment(true);
    try {
      const res = await api.topupPointsSandbox({
        userId: currentUser.id,
        packageId: selectedPackage.id,
        amountVnd: selectedPackage.priceVnd,
        points: selectedPackage.points,
        description: `Nạp ${selectedPackage.points} Point (${selectedPackage.name}) - Thử nghiệm Sandbox`
      });

      if (res.success) {
        onUpdateUser({ points: res.newPoints });
        setPaymentSuccessData({
          points: selectedPackage.points,
          message: res.message
        });
        loadData();
      }
    } catch (e: any) {
      alert(e.message || 'Có lỗi xảy ra khi nạp điểm thử nghiệm');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-6 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Hệ Thống Point & Gói Dịch Vụ AI</span>
              <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black">THỬ NGHIỆM</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Bảng Giá & Gói Tư Vấn Bác Sĩ Thú Y AI
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Chi phí siêu tiết kiệm: <strong className="text-amber-300">1 lượt chat = 1 Point (1.000 VNĐ)</strong>.
              Tài khoản đăng ký được tặng mặc định <strong className="text-emerald-300">10 Point miễn phí</strong> để bắt đầu trò chuyện.
            </p>
          </div>

          {/* User Balance Card Widget */}
          <div className="w-full md:w-auto shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 shadow-inner flex flex-col items-center justify-center min-w-[240px]">
            <span className="text-xs text-slate-300 font-medium">Số dư hiện tại của bạn</span>
            <div className="flex items-center gap-2 my-1">
              <span className="text-3xl font-black text-amber-300 tracking-tight">
                {isGuest ? '0' : userPoints}
              </span>
              <span className="text-sm font-bold text-amber-200">Point</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              {isGuest ? 'Đăng nhập để nhận ngay 10 Point' : `Tương đương ~${userPoints} lần tư vấn AI`}
            </p>

            {isGuest ? (
              <button
                type="button"
                onClick={onOpenLoginModal}
                className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Đăng nhập nhận 10 Point</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateToChat}
                className="w-full py-2 px-4 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Vào Chat AI Ngay</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Trial Badge Notice */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-amber-200/90 font-medium">
          <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            <strong>Lưu ý thử nghiệm (Sandbox Beta):</strong> Tính năng nạp tiền đang ở chế độ mô phỏng thử nghiệm. Bạn không cần thanh toán tiền thật, điểm sẽ được cộng ngay lập tức vào tài khoản sau khi xác nhận!
          </span>
        </div>
      </div>

      {/* Pricing Cards Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span>Các Gói Đăng Ký Tiết Kiệm</span>
            </h2>
            <p className="text-xs text-slate-500">Đăng ký theo gói để nhận thêm lượt chat và ưu đãi tính năng cao cấp</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-3xl bg-white border p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 ${
                pkg.isBestValue
                  ? 'border-amber-300 ring-2 ring-amber-400/40'
                  : 'border-slate-200'
              }`}
            >
              {/* Badge */}
              {pkg.badge && (
                <div className="absolute -top-3 right-6">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm ${pkg.badgeColor}`}>
                    {pkg.badge}
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900">{pkg.name}</h3>
                    <p className="text-xs text-slate-500">{pkg.tagline}</p>
                  </div>
                </div>

                <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900">
                      {pkg.priceVnd.toLocaleString('vi-VN')}
                    </span>
                    <span className="text-xs font-semibold text-slate-500 ml-1">VNĐ / {pkg.duration}</span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>+{pkg.points} Point</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-5 leading-relaxed">{pkg.description}</p>

                <div className="space-y-2.5 mb-6">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Đặc quyền bao gồm:</p>
                  {pkg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSelectPackage(pkg)}
                className={`w-full py-3 px-6 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-white bg-gradient-to-r ${pkg.color} hover:opacity-95`}
              >
                <span>Đăng ký {pkg.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Flexible Custom Top-up Section */}
      <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span>Nạp Điểm Tùy Ý (Linh Hoạt)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Bạn chỉ muốn nạp một số điểm vừa đủ dùng? Tỉ lệ quy đổi tiêu chuẩn: <strong>1.000 VNĐ = 1 Point</strong> (1 lượt chat).
            </p>
          </div>
          <div className="shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <Coins className="w-4 h-4 text-amber-600" />
              <span>1 Point = 1.000đ</span>
            </span>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-2 block">Chọn nhanh số Point muốn nạp:</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {quickOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setCustomPoints(opt)}
                  className={`py-3 px-4 rounded-2xl border text-center font-bold transition-all cursor-pointer ${
                    customPoints === opt
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400/30'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="text-base font-black flex items-center justify-center gap-1">
                    <span>{opt}</span>
                    <span className="text-xs font-bold">Point</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {(opt * 1000).toLocaleString('vi-VN')} đ
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Input */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                Hoặc nhập số Point tùy chọn (Tối thiểu 10 Point):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={5000}
                  step={5}
                  value={customPoints}
                  onChange={(e) => setCustomPoints(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full pl-4 pr-16 py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black text-slate-900 text-lg"
                  placeholder="20"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                  Point
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">Thành tiền thanh toán:</span>
                <span className="text-xl font-black text-emerald-700">
                  {(customPoints * 1000).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
              <button
                type="button"
                onClick={handleSelectCustom}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>Nạp Ngay</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      {!isGuest && (
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-600" />
                <span>Lịch Sử Giao Dịch & Sử Dụng Point</span>
              </h2>
              <p className="text-xs text-slate-500">Chi tiết các lần nạp điểm thử nghiệm và trừ điểm khi tư vấn chat</p>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={isLoadingHistory}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              title="Làm mới lịch sử"
            >
              <RotateCcw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Chưa có giao dịch nào được ghi nhận. Số điểm ban đầu mặc định của bạn là 10 Point.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2.5 font-bold">Mô tả giao dịch</th>
                    <th className="py-2.5 font-bold">Loại</th>
                    <th className="py-2.5 font-bold text-right">Biến động Point</th>
                    <th className="py-2.5 font-bold text-right">Số tiền</th>
                    <th className="py-2.5 font-bold text-right">Thời gian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-semibold text-slate-800">
                        {tx.description || (tx.points > 0 ? 'Nạp Point' : 'Trừ Point chat AI')}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          tx.transactionType === 'topup'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {tx.transactionType === 'topup' ? 'Nạp tiền' : 'Chat AI'}
                        </span>
                      </td>
                      <td className={`py-3 text-right font-black ${
                        tx.points > 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points} Point
                      </td>
                      <td className="py-3 text-right text-slate-600">
                        {tx.amountVnd > 0 ? `${tx.amountVnd.toLocaleString('vi-VN')} đ` : '-'}
                      </td>
                      <td className="py-3 text-right text-slate-400">
                        {new Date(tx.createdAt).toLocaleString('vi-VN', {
                          hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Thanh Toán Thử Nghiệm (Sandbox Payment Modal) */}
      {isPaymentModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Cổng Thanh Toán Thử Nghiệm (Sandbox)
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-white/20 text-white">
                  MOCK PAYMENT
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{selectedPackage.name}</h3>
              <p className="text-xs text-emerald-100 mt-1">{selectedPackage.tagline}</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {paymentSuccessData ? (
                /* Success View */
                <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900">Nạp Thành Công!</h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    Tài khoản của bạn đã được cộng thêm <strong className="text-emerald-700 font-bold">+{paymentSuccessData.points} Point</strong> vào số dư.
                  </p>
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs font-semibold text-emerald-800">
                    Số dư hiện tại: <strong>{userPoints} Point</strong>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        setPaymentSuccessData(null);
                        onNavigateToChat();
                      }}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                    >
                      Bắt Đầu Chat Ngay
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPaymentModalOpen(false);
                        setPaymentSuccessData(null);
                      }}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : (
                /* Payment Details View */
                <>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Gói dịch vụ:</span>
                      <strong className="text-slate-900">{selectedPackage.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Điểm nhận được:</span>
                      <strong className="text-emerald-700 font-black">+{selectedPackage.points} Point</strong>
                    </div>
                    <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-2 text-sm">
                      <span className="font-bold text-slate-800">Tổng thanh toán:</span>
                      <span className="font-black text-emerald-700">
                        {selectedPackage.priceVnd.toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                  </div>

                  {/* Mock VietQR Display */}
                  <div className="p-4 rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-xs border border-slate-200 flex flex-col items-center justify-center shrink-0">
                      <QrCode className="w-20 h-20 text-slate-800" />
                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">VIETQR SANDBOX</span>
                    </div>
                    <div className="text-xs space-y-1 text-slate-700">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-1">
                        <span>Chuyển khoản thử nghiệm</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Ngân hàng: <strong>MBBank (Mô phỏng Sandbox)</strong></p>
                      <p className="text-[11px] text-slate-500">STK: <strong>9999-VETHIC-AI</strong></p>
                      <p className="text-[11px] text-slate-500">Nội dung: <strong>VETHIC {currentUser.id.substring(0, 6).toUpperCase()}</strong></p>
                      <p className="text-[11px] text-amber-700 font-bold pt-1">
                        👉 Không cần quét QR thật! Nhấn nút bên dưới để hệ thống tự động cộng điểm.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={handleConfirmSandboxPayment}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isProcessingPayment ? (
                        <>
                          <RotateCcw className="w-4 h-4 animate-spin" />
                          <span>Đang kích hoạt nạp điểm...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>Xác Nhận Nạp Thử Nghiệm (+{selectedPackage.points} Point)</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={isProcessingPayment}
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
