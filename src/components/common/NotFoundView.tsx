import React from 'react';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-4 ring-white">
        <FileQuestion className="w-12 h-12 text-slate-400" />
      </div>
      <h1 className="text-6xl font-black text-slate-900 mb-2 tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-slate-700 mb-4">Không tìm thấy trang</h2>
      <p className="text-sm text-slate-500 max-w-md mb-8">
        Xin lỗi, trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc tạm thời không thể truy cập. Vui lòng kiểm tra lại đường dẫn.
      </p>
      
      <div className="flex items-center justify-center gap-3 w-full">
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
        <button
          onClick={() => window.location.href = '/'}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-colors flex items-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          Về trang chủ
        </button>
      </div>
    </div>
  );
};
