import React from 'react';
import { 
  Monitor, 
  User, 
  X, 
  Plus, 
  ArrowLeftRight, 
  Check, 
  ShieldCheck, 
  AlertCircle,
  Presentation,
  Tv,
  Wrench,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { AttendanceRecord, ClassAssignments, Student } from '../types/classroom';
import { TOTAL_COMPUTERS } from '../data/initialData';

interface ComputerGridProps {
  assignments: ClassAssignments;
  studentMap: Map<string, Student>;
  selectedStudentId: string | null;
  brokenComputers?: number[];
  attendanceMap?: Map<string, AttendanceRecord>;
  onSlotClick: (computerId: number, slot: 'A' | 'B') => void;
  onRemoveStudent: (computerId: number, slot: 'A' | 'B') => void;
  onToggleBrokenComputer?: (computerId: number) => void;
  onReassignBroken?: () => void;
  onSwapStudents?: (sourceComp: number, sourceSlot: 'A' | 'B', targetComp: number, targetSlot: 'A' | 'B') => void;
  classTotalStudents?: number;
  onOpenWorkstationManager?: () => void;
}

export const ComputerGrid: React.FC<ComputerGridProps> = ({
  assignments,
  studentMap,
  selectedStudentId,
  brokenComputers = [],
  attendanceMap = new Map(),
  onSlotClick,
  onRemoveStudent,
  onToggleBrokenComputer,
  onReassignBroken,
  classTotalStudents = 35,
  onOpenWorkstationManager,
}) => {
  const selectedStudent = selectedStudentId ? studentMap.get(selectedStudentId) : null;
  const workingComputersCount = TOTAL_COMPUTERS - brokenComputers.length;
  const maxWorkingCapacity = workingComputersCount * 2;
  const isOverCapacity = classTotalStudents > maxWorkingCapacity;
  const shortageCount = Math.max(0, classTotalStudents - maxWorkingCapacity);

  // Check how many students are currently stranded on broken computers
  const strandedStudentsCount = brokenComputers.reduce((acc, compId) => {
    const slot = assignments[compId];
    return acc + (slot?.studentAId ? 1 : 0) + (slot?.studentBId ? 1 : 0);
  }, 0);

  // Render an individual student chip inside Slot A or Slot B
  const renderStudentSlot = (
    computerId: number, 
    slot: 'A' | 'B', 
    studentId: string | null,
    isBroken: boolean
  ) => {
    if (isBroken) {
      return (
        <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center justify-center gap-1.5 italic">
          <Wrench className="w-3.5 h-3.5 text-rose-500" />
          <span>Vị trí {slot} khóa (Máy hỏng)</span>
        </div>
      );
    }

    const student = studentId ? studentMap.get(studentId) : null;
    const isTargetForSelected = selectedStudentId !== null && !student;
    const attRecord = student ? attendanceMap.get(student.id) : null;

    if (student) {
      const isMale = student.gender === 'male';

      // Real check-in badge status
      let attBadge = null;
      if (attRecord) {
        if (attRecord.status === 'present') {
          attBadge = (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded" title="Đã có mặt (Giáo viên đã duyệt)">
              <Check className="w-2.5 h-2.5 stroke-[3]" /> Có mặt
            </span>
          );
        } else if (attRecord.status === 'present_pending_confirm') {
          attBadge = (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-blue-700 bg-blue-100 px-1 py-0.2 rounded" title="Đã đăng nhập đúng máy (Chờ GV xác nhận)">
              <CheckCircle2 className="w-2.5 h-2.5" /> Đã đăng nhập
            </span>
          );
        } else if (attRecord.status === 'wrong_pc') {
          attBadge = (
            <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-1 py-0.2 rounded" title={`Cảnh báo: Đăng nhập tại PC${attRecord.actualPcId} thay vì PC${computerId}`}>
              <AlertTriangle className="w-2.5 h-2.5 text-amber-600" /> Sai máy (ngồi PC{attRecord.actualPcId < 10 ? '0' + attRecord.actualPcId : attRecord.actualPcId})
            </span>
          );
        } else if (attRecord.status === 'late') {
          attBadge = (
            <span className="text-[9px] font-bold text-orange-700 bg-orange-100 px-1 py-0.2 rounded">
              Đi muộn
            </span>
          );
        }
      }

      return (
        <div 
          onClick={() => onSlotClick(computerId, slot)}
          className={`group relative flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
            selectedStudentId === student.id
              ? 'ring-2 ring-amber-500 bg-amber-50 border-amber-400 shadow-sm'
              : isMale 
              ? 'bg-blue-50/90 border-blue-200 text-blue-950 hover:border-blue-300' 
              : 'bg-rose-50/90 border-rose-200 text-rose-950 hover:border-rose-300'
          }`}
          title={
            selectedStudentId 
              ? selectedStudentId === student.id 
                ? 'Nhấp để hủy chọn' 
                : `Nhấp để hoán đổi chỗ ngồi với ${student.name}` 
              : `Nhấp để chọn ${student.name} chuyển máy tính khác`
          }
        >
          <div className="flex items-center space-x-2 min-w-0 pr-1">
            {/* Slot indicator tag */}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              slot === 'A' ? 'bg-indigo-600 text-white' : 'bg-purple-600 text-white'
            }`}>
              {slot}
            </span>

            {/* Avatar / Gender Icon */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
              isMale ? 'bg-blue-200 text-blue-800' : 'bg-rose-200 text-rose-800'
            }`}>
              {student.name.charAt(student.name.lastIndexOf(' ') + 1) || 'HS'}
            </div>

            {/* Name and ID */}
            <div className="min-w-0">
              <p className="text-xs font-bold truncate leading-tight">
                {student.name}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <span>{student.code}</span>
                <span>•</span>
                <span className={isMale ? 'text-blue-600 font-medium' : 'text-rose-600 font-medium'}>
                  {isMale ? 'Nam' : 'Nữ'}
                </span>
                {attBadge}
              </div>
            </div>
          </div>

          {/* Remove button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemoveStudent(computerId, slot);
            }}
            title={`Hủy xếp chỗ cho ${student.name} về danh sách chờ`}
            className="opacity-60 group-hover:opacity-100 hover:bg-rose-100 hover:text-rose-700 text-slate-400 p-1 rounded transition shrink-0 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // Empty slot
    return (
      <button
        onClick={() => onSlotClick(computerId, slot)}
        className={`w-full flex items-center justify-center gap-1.5 p-2 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
          isTargetForSelected
            ? 'bg-amber-50 border-amber-400 text-amber-700 animate-pulse hover:bg-amber-100'
            : 'bg-slate-50/60 border-slate-200 text-slate-400 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-600'
        }`}
        title={selectedStudent ? `Nhấp để xếp ${selectedStudent.name} vào Máy ${computerId} (Chỗ ${slot})` : `Nhấp để chọn học sinh cho Máy ${computerId} (Chỗ ${slot})`}
      >
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
          {slot}
        </span>
        <Plus className="w-3 h-3" />
        <span className="text-[11px] font-medium">
          {isTargetForSelected ? `Xếp ${selectedStudent?.name.split(' ').pop()} vào đây` : `Chỗ ${slot} trống`}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-3.5">
      {/* Teacher Podium & Smartboard indicator */}
      <div className="bg-gradient-to-r from-slate-800 via-indigo-900 to-slate-800 text-white rounded-xl p-3 shadow-xs border border-indigo-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30 text-cyan-300">
            <Presentation className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-cyan-300">
              BẢNG TƯƠNG TÁC THÔNG MINH & BÀN GIÁO VIÊN
            </h3>
            <p className="text-[11px] text-slate-300">
              Phòng Tin học Tiểu học Đồng Dương 2 • Hướng nhìn xuống học sinh (Tối đa 2 HS / máy)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300 flex-wrap">
          <div className="flex items-center gap-1.5 bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/30">
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>20 Máy trạm</span>
          </div>
          <span className="text-[11px] text-indigo-200">
            {workingComputersCount}/20 máy hoạt động
          </span>
        </div>
      </div>

      {/* Broken Computers Warning Banner if any broken */}
      {brokenComputers.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 text-xs text-rose-950 space-y-2 animate-fadeIn shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-bold">
                Phòng máy ghi nhận {brokenComputers.length} máy báo hỏng/bảo trì:{' '}
                <strong className="text-rose-700">
                  {brokenComputers.map(id => `PC${id < 10 ? '0' + id : id}`).join(', ')}
                </strong>
              </span>
            </div>

            {onReassignBroken && strandedStudentsCount > 0 && (
              <button
                type="button"
                onClick={onReassignBroken}
                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-100" />
                <span>✨ Đề xuất xếp lại {strandedStudentsCount} HS từ máy hỏng</span>
              </button>
            )}
          </div>

          {/* Over-capacity warning */}
          {isOverCapacity && (
            <div className="p-2 bg-rose-100 border border-rose-300 rounded-lg text-rose-900 font-bold text-[11px] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <span>CẢNH BÁO QUÁ TẢI PHÒNG MÁY:</span> Hiện chỉ còn {workingComputersCount} máy hoạt động (sức chứa tối đa {maxWorkingCapacity} chỗ). Lớp có {classTotalStudents} học sinh, thiếu <strong>{shortageCount}</strong> chỗ ngồi!
                <div className="font-normal text-rose-800 mt-0.5">
                  * Quy định: Tuyệt đối không xếp quá 2 học sinh/máy. Giáo viên vui lòng sửa chữa máy hoặc bố trí máy trạm dự phòng/thực hành luân phiên.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Student Sticky Tip */}
      {selectedStudent && (
        <div className="bg-amber-500 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-between shadow-sm animate-bounce-subtle">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>
              Đang chọn: <strong>{selectedStudent.name}</strong> ({selectedStudent.code}) 
              — Hãy nhấp vào bất kỳ vị trí trống (A hoặc B) của máy tính bên dưới để xếp chỗ!
            </span>
          </div>
          <button 
            onClick={() => onSlotClick(0, 'A')}
            className="bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-[11px] underline cursor-pointer"
          >
            Hủy chọn
          </button>
        </div>
      )}

      {/* Grid of 20 Computers (4 rows x 5 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: TOTAL_COMPUTERS }, (_, i) => i + 1).map((compId) => {
          const isBroken = brokenComputers.includes(compId);
          const compData = assignments[compId] || { studentAId: null, studentBId: null };
          const studentA = compData.studentAId ? studentMap.get(compData.studentAId) : null;
          const studentB = compData.studentBId ? studentMap.get(compData.studentBId) : null;
          
          const occupiedCount = (studentA ? 1 : 0) + (studentB ? 1 : 0);
          const isFull = occupiedCount === 2;
          const isSingle = occupiedCount === 1;

          return (
            <div
              key={compId}
              className={`rounded-xl border transition-all duration-200 shadow-xs hover:shadow-md flex flex-col justify-between ${
                isBroken
                  ? 'bg-rose-50/50 border-rose-300 ring-2 ring-rose-200/50'
                  : isFull
                  ? 'bg-white border-purple-200 ring-1 ring-purple-100'
                  : isSingle
                  ? 'bg-white border-blue-200 ring-1 ring-blue-50'
                  : 'bg-slate-50/80 border-slate-200'
              }`}
            >
              {/* Computer Header */}
              <div className={`p-2 border-b flex items-center justify-between rounded-t-xl ${
                isBroken ? 'bg-rose-100/70 border-rose-200 text-rose-950' : 'bg-slate-50/70 border-slate-100'
              }`}>
                <div className="flex items-center gap-1.5">
                  <div className={`p-1 rounded-md ${
                    isBroken
                      ? 'bg-rose-200 text-rose-800'
                      : isFull 
                      ? 'bg-purple-100 text-purple-700' 
                      : isSingle 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isBroken ? <Wrench className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-xs font-black text-slate-800 tracking-tight">
                    Máy {compId < 10 ? `0${compId}` : compId}
                  </span>
                </div>

                {/* Capacity badge or broken badge */}
                <div className="flex items-center gap-1">
                  {isBroken ? (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-600 text-white">
                      Hỏng
                    </span>
                  ) : (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isFull
                        ? 'bg-purple-100 text-purple-700'
                        : isSingle
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isFull ? '2 HS (Đủ)' : isSingle ? '1 HS' : 'Trống'}
                    </span>
                  )}
                </div>
              </div>

              {/* Computer Seats (Slot A and Slot B) */}
              <div className="p-2 space-y-1.5 flex-1 flex flex-col justify-center">
                {renderStudentSlot(compId, 'A', compData.studentAId, isBroken)}
                {renderStudentSlot(compId, 'B', compData.studentBId, isBroken)}
              </div>

              {/* Computer Footer / toggle broken */}
              <div className="px-2 py-1 bg-slate-50/50 rounded-b-xl border-t border-slate-100 text-[10px] flex items-center justify-between">
                {isBroken ? (
                  <span className="text-rose-700 font-bold">● Đang báo hỏng</span>
                ) : (
                  <span className="text-emerald-600 font-medium">● Hoạt động tốt</span>
                )}

                {onToggleBrokenComputer && (
                  <button
                    type="button"
                    onClick={() => onToggleBrokenComputer(compId)}
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition cursor-pointer ${
                      isBroken
                        ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                    title={isBroken ? 'Khôi phục máy này sang hoạt động tốt' : 'Báo máy hỏng/bảo trì'}
                  >
                    {isBroken ? 'Khôi phục' : 'Báo hỏng'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
