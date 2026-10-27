import React from 'react';
import { 
  Monitor, 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  Printer, 
  RefreshCw, 
  Download, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { DatabaseStatus } from '../types/classroom';
import { SCHOOL_NAME, APP_NAME } from '../data/initialData';

interface HeaderProps {
  dbStatus: DatabaseStatus;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subj: 'all' | 'tin' | 'congnghe') => void;
  onOpenDiagnostic: () => void;
  onOpenPrint: () => void;
  onReloadCheck: () => void;
  onExportJson: () => void;
  lastSavedText: string;
}

export const Header: React.FC<HeaderProps> = ({
  dbStatus,
  selectedSubject = 'all',
  onSelectSubject,
  onOpenDiagnostic,
  onOpenPrint,
  onReloadCheck,
  onExportJson,
  lastSavedText,
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white shadow-lg border-b border-blue-800/50 sticky top-0 z-30">
      {/* Top utility alert if DB error exists */}
      {!dbStatus.isActive && (
        <div className="bg-rose-600 px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 text-white animate-pulse">
          <AlertTriangle className="w-5 h-5" />
          <span>CẢNH BÁO: Chưa có cơ sở dữ liệu hoạt động! Trình duyệt đang chặn LocalStorage. Vui lòng bật cookie và lưu trữ trình duyệt để không mất dữ liệu khi tải lại trang!</span>
          <button 
            onClick={onOpenDiagnostic} 
            className="underline ml-2 bg-white/20 px-2 py-0.5 rounded text-xs hover:bg-white/30"
          >
            Kiểm tra ngay
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Brand & School info */}
          <div className="flex items-center space-x-3.5">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white flex-shrink-0">
              <Monitor className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-cyan-500/30">
                  {SCHOOL_NAME}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-cyan-300 bg-blue-950/80 border border-cyan-500/40 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Môn Tin học (Khối 3, 4, 5)
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white mt-0.5">
                {APP_NAME}
              </h1>
            </div>
          </div>

          {/* Dedicated Informatics Badge */}
          <div className="inline-flex items-center px-3.5 py-1.5 bg-blue-950/90 rounded-2xl border border-cyan-500/40 shadow-inner self-start lg:self-center">
            <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
              <span>💻 MÔN TIN HỌC (9 Lớp • 249 Học sinh • Phòng máy tính)</span>
            </span>
          </div>

          {/* Right action bar & Database status */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Database indicator */}
            <button
              onClick={onOpenDiagnostic}
              title="Nhấp để kiểm tra toàn vẹn cơ sở dữ liệu và dữ liệu lưu trữ"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm border ${
                dbStatus.isActive
                  ? 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border-emerald-600/40'
                  : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-500/60'
              }`}
            >
              {dbStatus.isActive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Database className="w-3.5 h-3.5" />
                  <span>CSDL: Đã đồng bộ an toàn</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                  <span>CSDL: Chưa hoạt động</span>
                </>
              )}
            </button>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-lg border border-slate-700/80">
              <button
                onClick={onOpenPrint}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/80 rounded transition"
                title="In sơ đồ phân công phòng máy"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">In sơ đồ</span>
              </button>

              <button
                onClick={onReloadCheck}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/80 rounded transition"
                title="Kiểm tra tải lại trang (Thử nghiệm lưu trữ)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Thử tải lại</span>
              </button>

              <button
                onClick={onExportJson}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-700/80 rounded transition"
                title="Xuất file sao lưu JSON"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Sao lưu</span>
              </button>

              <button
                onClick={onOpenDiagnostic}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition"
                title="Thông tin hệ thống và chẩn đoán"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Real-time sync feedback bar */}
        <div className="mt-2 pt-2 border-t border-blue-900/60 flex items-center justify-between text-[11px] text-blue-200/80">
          <div className="flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Hệ thống phân công phòng Tin học: <strong>20 máy tính</strong> (Hỗ trợ tối đa 2 HS/máy)</span>
          </div>
          <div className="text-right truncate max-w-md">
            <span>Trạng thái lưu: <span className="text-cyan-300 font-mono">{lastSavedText}</span></span>
          </div>
        </div>
      </div>
    </header>
  );
};
