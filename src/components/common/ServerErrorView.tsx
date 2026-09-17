import React from 'react';
import { ServerCrash, RotateCcw, Home, RefreshCw, Sparkles } from 'lucide-react';

interface ServerErrorViewProps {
  error?: Error | null;
  resetError?: () => void;
}

export const ServerErrorView: React.FC<ServerErrorViewProps> = ({ error, resetError }) => {
  const errorMessage = (error?.message || error?.toString() || '').toLowerCase();
  const isChunkError =
    errorMessage.includes('failed to fetch dynamically imported module') ||
    errorMessage.includes('loading chunk') ||
    errorMessage.includes('importing a module script failed') ||
    errorMessage.includes('failed to load module script');

  const handleReload = () => {
    sessionStorage.removeItem('chunk_retry_reloaded');
    sessionStorage.removeItem('vite_preload_reloaded');
    window.location.reload();
  };

  if (isChunkError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-4 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-6 shadow-inner ring-4 ring-white border border-amber-200">
          <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-amber-500 animate-pulse" />
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 mb-3 uppercase tracking-wider">
          Cập nhật mới
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">
          Hệ thống vừa có phiên bản mới
        </h1>
        <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
          Ứng dụng vừa được phát hành phiên bản mới trên máy chủ. Vui lòng tải lại trang để nạp các tệp tin và tính năng mới nhất.
        </p>

        {error && (
          <div className="bg-slate-900 text-amber-300 text-[10px] sm:text-xs p-3 rounded-xl w-full max-w-lg mb-6 overflow-auto text-left font-mono opacity-80">
            <span className="font-bold block mb-0.5 text-slate-400">Chi tiết tệp cũ:</span>
            {error.message || error.toString()}
          </div>
        )}
        
        <div className="flex items-center justify-center gap-3 w-full">
          <button
            onClick={handleReload}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Tải lại trang ngay
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

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

