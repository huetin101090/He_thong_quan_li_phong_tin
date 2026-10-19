import React, { useState } from 'react';
import { 
  Search, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Check, 
  HelpCircle, 
  Monitor, 
  SlidersHorizontal,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { ClassAssignments, Student } from '../types/classroom';

interface StudentSidebarProps {
  students: Student[];
  assignments: ClassAssignments;
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string | null) => void;
  onQuickAssignNext: (studentId: string) => void;
  onToggleAttendance: (studentId: string) => void;
  onUnassignStudent: (studentId: string) => void;
  currentClassName: string;
  onOpenFullRoster?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  students,
  assignments,
  selectedStudentId,
  onSelectStudent,
  onQuickAssignNext,
  onToggleAttendance,
  onUnassignStudent,
  currentClassName,
  onOpenFullRoster,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unassigned' | 'assigned' | 'absent'>('all');

  // Clear search and filter when changing class
  React.useEffect(() => {
    setSearchTerm('');
    setFilterMode('all');
  }, [currentClassName]);

  // Build a lookup map of studentId -> { compId, slot }
  const assignedLocationMap = new Map<string, { compId: number; slot: 'A' | 'B' }>();
  Object.entries(assignments).forEach(([compStr, slotData]) => {
    const compId = Number(compStr);
    if (slotData.studentAId) {
      assignedLocationMap.set(slotData.studentAId, { compId, slot: 'A' });
    }
    if (slotData.studentBId) {
      assignedLocationMap.set(slotData.studentBId, { compId, slot: 'B' });
    }
  });

  // Filter students based on search and tab
  const filteredStudents = students.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const isAssigned = assignedLocationMap.has(s.id);
    const isAbsent = s.attendance === 'absent';

    if (filterMode === 'unassigned') return !isAssigned && !isAbsent;
    if (filterMode === 'assigned') return isAssigned;
    if (filterMode === 'absent') return isAbsent;
    return true;
  });

  const unassignedCount = students.filter(s => !assignedLocationMap.has(s.id) && s.attendance !== 'absent').length;
  const assignedCount = students.filter(s => assignedLocationMap.has(s.id)).length;
  const absentCount = students.filter(s => s.attendance === 'absent').length;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 flex flex-col h-[750px] overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <span>Danh sách {currentClassName}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {students.length} HS
              </span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Nhấp học sinh để chọn, sau đó nhấp vào máy để xếp chỗ
            </p>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên hoặc mã HS..."
            className="w-full bg-white text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-[10px] text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1 mt-2.5 overflow-x-auto text-[11px] no-scrollbar">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Tất cả ({students.length})
          </button>
          <button
            onClick={() => setFilterMode('unassigned')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
              filterMode === 'unassigned'
                ? 'bg-amber-600 text-white font-semibold'
                : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            Chưa xếp ({unassignedCount})
          </button>
          <button
            onClick={() => setFilterMode('assigned')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
              filterMode === 'assigned'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
          >
            Đã có máy ({assignedCount})
          </button>
          <button
            onClick={() => setFilterMode('absent')}
            className={`px-2 py-1 rounded-md font-medium whitespace-nowrap transition ${
              filterMode === 'absent'
                ? 'bg-rose-600 text-white font-semibold'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
            }`}
          >
            Vắng ({absentCount})
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 divide-y divide-slate-100">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-10 px-4 text-xs text-slate-400">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-medium">Không tìm thấy học sinh phù hợp</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Thử đổi từ khóa tìm kiếm hoặc bộ lọc</p>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const loc = assignedLocationMap.get(student.id);
            const isAssigned = !!loc;
            const isSelected = selectedStudentId === student.id;
            const isMale = student.gender === 'male';
            const isAbsent = student.attendance === 'absent';

            return (
              <div
                key={student.id}
                onClick={() => {
                  if (isAbsent) return;
                  onSelectStudent(isSelected ? null : student.id);
                }}
                className={`pt-1.5 first:pt-0 p-2 rounded-lg transition cursor-pointer flex flex-col gap-1 border ${
                  isSelected
                    ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300 ring-offset-1'
                    : isAbsent
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : isAssigned
                    ? 'bg-white hover:bg-slate-50 border-slate-200/80'
                    : 'bg-blue-50/40 hover:bg-blue-50 border-blue-200/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Index badge */}
                    <span className="text-[10px] font-mono text-slate-400 w-5 text-right shrink-0">
                      #{student.seatNumber}
                    </span>

                    {/* Avatar initial */}
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isMale ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {student.name.charAt(student.name.lastIndexOf(' ') + 1) || 'HS'}
                    </div>

                    {/* Name & ID */}
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate leading-snug ${
                        isSelected ? 'text-amber-900 font-extrabold' : 'text-slate-800'
                      }`}>
                        {student.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                        <span>{student.code}</span>
                        <span>•</span>
                        <span className={isMale ? 'text-blue-600' : 'text-rose-600'}>
                          {isMale ? 'Nam' : 'Nữ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Seat or unassigned badge */}
                  <div className="shrink-0 text-right">
                    {isAbsent ? (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                        Vắng mặt
                      </span>
                    ) : isAssigned ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                        <Monitor className="w-3 h-3 text-emerald-600" />
                        Máy {loc.compId < 10 ? `0${loc.compId}` : loc.compId} ({loc.slot})
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Chưa xếp máy
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick action bar */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                  {/* Attendance toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleAttendance(student.id);
                    }}
                    className={`px-1.5 py-0.5 rounded transition ${
                      isAbsent
                        ? 'text-emerald-700 hover:bg-emerald-50 font-medium'
                        : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                  >
                    {isAbsent ? 'Đánh dấu có mặt' : 'Báo vắng'}
                  </button>

                  <div className="flex items-center gap-1">
                    {isAssigned ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnassignStudent(student.id);
                        }}
                        className="text-rose-600 hover:underline px-1 py-0.5"
                      >
                        Hủy xếp chỗ
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickAssignNext(student.id);
                        }}
                        className="text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-0.5 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded transition"
                      >
                        <span>Xếp máy nhanh</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span>Sĩ số: <strong>{students.length}</strong> học sinh</span>
          <span className="text-emerald-600 font-semibold">
            Đã xếp: {assignedCount}/{students.length - absentCount}
          </span>
        </div>
        {onOpenFullRoster && (
          <button
            type="button"
            onClick={onOpenFullRoster}
            className="w-full py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-blue-200"
          >
            <span>Quản lý hồ sơ, Xóa & Tải file Excel/CSV</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
