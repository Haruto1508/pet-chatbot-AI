import React from 'react';
import { ServerCrash, RotateCcw, Home } from 'lucide-react';

interface ServerErrorViewProps {
  error?: Error | null;
  resetError?: () => void;
}

export const ServerErrorView: React.FC<ServerErrorViewProps> = ({ error, resetError }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-4 ring-white border border-red-100">
        <ServerCrash className="w-12 h-12 text-red-500 animate-pulse" />
      </div>
      <h1 className="text-6xl font-black text-slate-900 mb-2 tracking-tight">500</h1>
      <h2 className="text-xl font-bold text-slate-700 mb-4">Lỗi máy chủ nội bộ</h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        Hệ thống đang gặp sự cố kết nối hoặc xử lý dữ liệu. Vui lòng thử lại sau ít phút hoặc quay về trang chủ.
      </p>
      
      {error && (
        <div className="bg-slate-900 text-red-400 text-[10px] sm:text-xs p-4 rounded-xl w-full max-w-lg mb-8 overflow-auto text-left font-mono">
          <span className="font-bold block mb-1 text-red-300">Chi tiết lỗi:</span>
          {error.message || error.toString()}
        </div>
      )}
      
      <div className="flex items-center justify-center gap-3 w-full">
        <button
          onClick={() => {
            if (resetError) resetError();
            else window.location.reload();
          }}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Thử lại
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
