import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  X, 
  RefreshCw, 
  Laptop, 
  Key, 
  Users, 
  Wrench,
  CheckCircle2,
  Printer,
  Info
} from 'lucide-react';
import { fetchWorkstations, verifyWorkstation, WorkstationItem } from '../services/attendanceService';
import { TOTAL_COMPUTERS, SCHOOL_NAME } from '../data/initialData';

interface WorkstationManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  brokenComputers: number[];
  onToggleBrokenComputer: (pcId: number) => void;
  currentClassId: string;
  currentDate: string;
  daySession: 'morning' | 'afternoon';
  periodNumber: number;
}

export const WorkstationManagerModal: React.FC<WorkstationManagerModalProps> = ({
  isOpen,
  onClose,
  brokenComputers,
  onToggleBrokenComputer,
  currentClassId,
  currentDate,
  daySession,
  periodNumber,
}) => {
  const [workstations, setWorkstations] = useState<WorkstationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWorkstations(currentClassId, currentDate, daySession, periodNumber);
      setWorkstations(data);
    } catch (e) {
      console.warn('Could not load workstations', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, currentClassId, currentDate, daySession, periodNumber, brokenComputers]);

  if (!isOpen) return null;

  const handleToggleRegister = async (pcId: number, currentStatus: boolean) => {
    try {
      const res = await verifyWorkstation(pcId, !currentStatus, 'Cô Nguyễn Thị Huệ (GV Quản lý)');
      setStatusMsg(res.message);
      await loadData();
      setTimeout(() => setStatusMsg(null), 3500);
    } catch (e) {
      setStatusMsg('Lỗi cập nhật thiết bị');
    }
  };

  const handleVerifyAll = async () => {
    setIsLoading(true);
    for (let i = 1; i <= TOTAL_COMPUTERS; i++) {
      await verifyWorkstation(i, true, 'Cô Nguyễn Thị Huệ (GV Quản lý)');
    }
    await loadData();
    setIsLoading(false);
    setStatusMsg('Đã xác thực và phê duyệt đồng loạt 20 máy tính trạm trong phòng máy!');
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const activeCount = workstations.filter(w => !brokenComputers.includes(w.pcId)).length;
  const verifiedCount = workstations.filter(w => w.isRegistered).length;
  const occupiedCount = workstations.filter(w => (w.occupancy || 0) > 0).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 rounded-2xl border border-blue-400/30 text-cyan-300">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base uppercase tracking-tight">
                  QUẢN LÝ MÃ ĐỊNH DANH 20 MÁY TÍNH TRẠM (PC01 – PC20)
                </h3>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 px-2 py-0.5 rounded-full font-bold">
                  Phân quyền Giáo viên
                </span>
              </div>
              <p className="text-[11px] text-blue-200 mt-0.5">
                {SCHOOL_NAME} • Quản lý chứng thư phần cứng thiết bị • Không tin tưởng mã máy tự khai báo
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs shrink-0">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổng máy trạm:</span>
            <span className="font-black text-base text-blue-950">20 Máy tính</span>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">Hoạt động tốt:</span>
            <span className="font-black text-base text-emerald-950">{activeCount} / 20 Máy</span>
          </div>
          <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-[10px] text-blue-700 font-bold uppercase block">Đã kiểm định (GV):</span>
            <span className="font-black text-base text-blue-950">{verifiedCount} / 20 Máy</span>
          </div>
          <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200">
            <span className="text-[10px] text-purple-700 font-bold uppercase block">Đang có học sinh ngồi:</span>
            <span className="font-black text-base text-purple-950">{occupiedCount} Máy trạm</span>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className="mx-4 mt-3 p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn shrink-0">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{statusMsg}</span>
            </span>
            <button onClick={() => setStatusMsg(null)} className="text-white/80 hover:text-white text-xs">✕</button>
          </div>
        )}

        {/* Controls */}
        <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-100 text-xs shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Mã định danh Token được gán cố định cho từng thiết bị vật lý để chống gian lận vị trí ngồi.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVerifyAll}
              disabled={isLoading}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition cursor-pointer flex items-center gap-1 shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Xác nhận kiểm định cả 20 máy</span>
            </button>

            <button
              type="button"
              onClick={loadData}
              disabled={isLoading}
              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs transition cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Workstations Grid */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {workstations.map((ws) => {
              const isBroken = brokenComputers.includes(ws.pcId);
              const occ = ws.occupancy || 0;

              return (
                <div 
                  key={ws.pcId}
                  className={`p-3 rounded-2xl border-2 transition relative flex flex-col justify-between ${
                    isBroken
                      ? 'bg-rose-50/60 border-rose-300 opacity-80'
                      : ws.isRegistered
                      ? 'bg-white border-blue-200 shadow-2xs hover:border-blue-400'
                      : 'bg-amber-50/50 border-amber-300'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${isBroken ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                        <span className="font-black text-sm text-slate-900">{ws.code}</span>
                      </div>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                        isBroken
                          ? 'bg-rose-100 text-rose-700 border border-rose-300'
                          : ws.isRegistered
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {isBroken ? 'Báo hỏng' : ws.isRegistered ? 'Đã kiểm định' : 'Chưa duyệt'}
                      </span>
                    </div>

                    {/* Hardware Token & IP */}
                    <div className="space-y-0.5 text-[10px] text-slate-500 font-mono mb-2">
                      <div className="truncate text-slate-700" title={ws.deviceToken}>
                        Token: <strong className="text-blue-700">{ws.deviceToken}</strong>
                      </div>
                      <div>IP: {ws.ipAddress}</div>
                    </div>

                    {/* Active logged in students (up to 2 students per machine) */}
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 mb-2 min-h-12 text-[10px]">
                      <span className="font-bold text-slate-600 block text-[9px] uppercase">
                        Học sinh đăng nhập ({occ}/2 HS):
                      </span>
                      {ws.activeStudents && ws.activeStudents.length > 0 ? (
                        <div className="space-y-1 mt-1">
                          {ws.activeStudents.map((st, i) => (
                            <div key={st.studentId} className="flex items-center justify-between text-blue-900 font-semibold">
                              <span className="truncate max-w-[120px]">• {st.studentName} ({st.studentCode})</span>
                              <span className="text-[8px] bg-blue-100 text-blue-800 px-1 rounded">Chỗ {i === 0 ? 'A' : 'B'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic mt-1 block">Chưa có học sinh đăng nhập</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleToggleRegister(ws.pcId, ws.isRegistered)}
                      className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        ws.isRegistered
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>{ws.isRegistered ? 'Hủy duyệt' : 'Duyệt máy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleBrokenComputer(ws.pcId)}
                      className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                        isBroken
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      <Wrench className="w-3 h-3" />
                      <span>{isBroken ? 'Khôi phục' : 'Báo hỏng'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 text-xs shrink-0">
          <span className="text-[11px] text-slate-500">
            Giáo viên quản lý: <strong>Cô Nguyễn Thị Huệ</strong> • Đảm bảo học sinh không tự ý đổi số máy mà không có xác nhận
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer text-xs"
          >
            Đóng bảng quản lý
          </button>
        </div>

      </div>
    </div>
  );
};
