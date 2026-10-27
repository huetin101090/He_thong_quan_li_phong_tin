import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Download, 
  Check, 
  RefreshCw, 
  Filter, 
  Calendar, 
  Monitor, 
  ShieldCheck, 
  FileSpreadsheet,
  AlertCircle,
  Search,
  School
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, ClassInfo, Student } from '../types/classroom';
import { isSameClass } from '../data/initialData';
import { 
  fetchAttendanceRecords, 
  confirmAttendanceRecords, 
  getAttendanceExportUrl 
} from '../services/attendanceService';

interface ClassAttendanceTableProps {
  currentClass: ClassInfo;
  classStudents: Student[];
  currentDate: string;
  daySession: 'morning' | 'afternoon';
  periodNumber: number;
  assignments: Record<number, { studentAId: string | null; studentBId: string | null }>;
  onDateChange: (date: string) => void;
  onSessionChange: (session: 'morning' | 'afternoon') => void;
  onPeriodChange: (period: number) => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ClassAttendanceTable: React.FC<ClassAttendanceTableProps> = ({
  currentClass,
  classStudents,
  currentDate,
  daySession,
  periodNumber,
  assignments,
  onDateChange,
  onSessionChange,
  onPeriodChange,
  onShowToast,
}) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Requirement 3 & 5: When switching class, clear search & filters of previous class
  useEffect(() => {
    setSearchTerm('');
    setFilterStatus('all');
  }, [currentClass.id]);

  // Map of studentId -> assigned PC info
  const assignedPcMap = useMemo(() => {
    const map = new Map<string, { pcId: number; slot: 'A' | 'B' }>();
    for (let c = 1; c <= 20; c++) {
      const slot = assignments[c];
      if (slot?.studentAId) map.set(slot.studentAId, { pcId: c, slot: 'A' });
      if (slot?.studentBId) map.set(slot.studentBId, { pcId: c, slot: 'B' });
    }
    return map;
  }, [assignments]);

  // Load attendance data
  const loadAttendance = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAttendanceRecords(
        currentClass.id,
        currentDate,
        daySession,
        periodNumber,
        classStudents
      );
      setRecords(data.records);
    } catch (e) {
      console.error('Failed to load attendance records', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [currentClass.id, currentDate, daySession, periodNumber, classStudents]);

  // Map of studentId -> AttendanceRecord (strictly for current class students)
  const attendanceRecordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    const validStudentIds = new Set(classStudents.map(s => s.id));
    records.forEach(r => {
      // Only include records that belong to current class students
      if (validStudentIds.has(r.studentId) && (r.classId === currentClass.id || isSameClass(r.classId, currentClass.id))) {
        map.set(r.studentId, r);
      }
    });
    return map;
  }, [records, classStudents, currentClass.id]);

  // Compute attendance metrics strictly for classStudents
  const metrics = useMemo(() => {
    let loggedIn = 0;
    let verifiedPresent = 0;
    let wrongPc = 0;
    let late = 0;
    let absent = 0;
    let unverified = 0;

    classStudents.forEach(st => {
      const r = attendanceRecordMap.get(st.id);
      if (!r || r.status === 'unverified') {
        unverified++;
      } else {
        loggedIn++;
        if (r.status === 'present') verifiedPresent++;
        else if (r.status === 'wrong_pc') wrongPc++;
        else if (r.status === 'late') late++;
        else if (r.status === 'absent_excused' || r.status === 'absent_unexcused' || r.status === 'absent') absent++;
      }
    });

    return {
      total: classStudents.length,
      loggedIn,
      verifiedPresent,
      wrongPc,
      late,
      absent,
      unverified,
    };
  }, [classStudents, attendanceRecordMap]);

  // Quick Action: Confirm all pending logins to verified present
  const handleConfirmAllPending = async () => {
    setIsLoading(true);
    try {
      await confirmAttendanceRecords({
        classId: currentClass.id,
        date: currentDate,
        session: daySession,
        period: periodNumber,
        confirmAllPending: true,
        teacherName: 'Cô Nguyễn Thị Huệ',
      });
      await loadAttendance();
      onShowToast(`Đã xác nhận có mặt chính thức cho học sinh đã đăng nhập Lớp ${currentClass.id}!`, 'success');
    } catch (e) {
      onShowToast('Lỗi cập nhật điểm danh!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Action: Mark all students of this class present
  const handleMarkAllPresent = async () => {
    setIsLoading(true);
    try {
      const updates = classStudents.map(st => {
        const assigned = assignedPcMap.get(st.id);
        const existing = attendanceRecordMap.get(st.id);
        const recordId = existing?.id || `att_${st.id}_${currentDate}_${daySession}_P${periodNumber}`;
        return {
          id: recordId,
          studentId: st.id,
          studentCode: st.code,
          studentName: st.name,
          classId: currentClass.id,
          date: currentDate,
          session: daySession,
          periodNumber,
          assignedPcId: assigned ? assigned.pcId : null,
          actualPcId: assigned ? assigned.pcId : 1,
          loginTimestamp: existing?.loginTimestamp || new Date().toLocaleString('vi-VN'),
          status: 'present' as AttendanceStatus,
          verifiedByTeacher: 'Cô Nguyễn Thị Huệ',
        };
      });

      await confirmAttendanceRecords({
        classId: currentClass.id,
        date: currentDate,
        session: daySession,
        period: periodNumber,
        recordUpdates: updates.map(u => ({
          id: u.id,
          status: 'present',
          teacherNote: 'Giáo viên xác nhận cả lớp có mặt',
        })),
        teacherName: 'Cô Nguyễn Thị Huệ',
      });

      await loadAttendance();
      onShowToast(`Đã điểm danh cả lớp ${currentClass.name} có mặt đầy đủ (${classStudents.length} HS)!`, 'success');
    } catch (e) {
      onShowToast('Lỗi điểm danh cả lớp!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Update single student attendance status
  const handleUpdateStudentStatus = async (
    student: Student,
    newStatus: AttendanceStatus,
    note?: string,
    seatChangeConfirmed?: boolean
  ) => {
    const existing = attendanceRecordMap.get(student.id);
    const assigned = assignedPcMap.get(student.id);
    const recordId = existing?.id || `att_${student.id}_${currentDate}_${daySession}_P${periodNumber}`;

    try {
      await confirmAttendanceRecords({
        classId: currentClass.id,
        date: currentDate,
        session: daySession,
        period: periodNumber,
        recordUpdates: [{
          id: recordId,
          status: newStatus,
          teacherNote: note,
          seatChangeConfirmed,
        }],
        teacherName: 'Cô Nguyễn Thị Huệ',
      });
      await loadAttendance();
      onShowToast(`Đã cập nhật điểm danh: ${student.name} -> ${newStatus === 'present' ? 'Có mặt' : newStatus === 'absent_unexcused' ? 'Vắng không phép' : 'Đã lưu'}`, 'success');
    } catch (e) {
      onShowToast('Lỗi khi lưu điểm danh', 'error');
    }
  };

  // Filter students strictly belonging to currentClass
  const filteredStudents = useMemo(() => {
    return classStudents.filter(st => {
      const r = attendanceRecordMap.get(st.id);
      const status = r ? r.status : 'unverified';

      if (filterStatus !== 'all') {
        if (filterStatus === 'logged_in' && (!r || r.status === 'unverified')) return false;
        if (filterStatus === 'present' && status !== 'present') return false;
        if (filterStatus === 'wrong_pc' && status !== 'wrong_pc') return false;
        if (filterStatus === 'late' && status !== 'late') return false;
        if (filterStatus === 'absent' && !(status === 'absent_excused' || status === 'absent_unexcused' || status === 'absent')) return false;
        if (filterStatus === 'unverified' && status !== 'unverified') return false;
      }

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return st.name.toLowerCase().includes(q) || st.code.toLowerCase().includes(q);
      }

      return true;
    });
  }, [classStudents, attendanceRecordMap, filterStatus, searchTerm]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Controls Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-slate-800">
                  BẢNG ĐIỂM DANH PHÒNG MÁY – {currentClass.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                  Đúng {classStudents.length} học sinh
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Lớp {currentClass.id} • Thư mục bài làm: <span className="font-mono text-blue-700 font-bold">{currentClass.tinHocFolder}</span> (Môn Tin học)
              </p>
            </div>
          </div>
        </div>

        {/* Date, Session, Period Selectors */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent text-xs font-semibold outline-none cursor-pointer"
            />
          </div>

          <select
            value={daySession}
            onChange={(e) => onSessionChange(e.target.value as 'morning' | 'afternoon')}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs outline-none cursor-pointer"
          >
            <option value="morning">Buổi sáng</option>
            <option value="afternoon">Buổi chiều</option>
          </select>

          <select
            value={periodNumber}
            onChange={(e) => onPeriodChange(Number(e.target.value))}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs outline-none cursor-pointer"
          >
            <option value={1}>Tiết 1</option>
            <option value={2}>Tiết 2</option>
            <option value={3}>Tiết 3</option>
            <option value={4}>Tiết 4</option>
            <option value={5}>Tiết 5</option>
          </select>

          <button
            onClick={loadAttendance}
            disabled={isLoading}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
            title="Làm mới bảng điểm danh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Export Excel button */}
          <a
            href={getAttendanceExportUrl(currentClass.id, currentDate, daySession, periodNumber)}
            download
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-xs cursor-pointer"
            title="Tải bảng tính Excel (CSV UTF-8 chuẩn)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </a>
        </div>
      </div>

      {/* KPI Metrics Cards (7 chỉ số yêu cầu) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {/* Total */}
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Sĩ số lớp</span>
          <span className="text-xl font-black text-slate-800">{metrics.total}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Lớp {currentClass.id}</span>
        </div>

        {/* Logged in */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-blue-700 uppercase block">2. Đã đăng nhập</span>
          <span className="text-xl font-black text-blue-900">{metrics.loggedIn}</span>
          <span className="text-[10px] text-blue-600 block mt-0.5">Tại máy PC</span>
        </div>

        {/* Verified Present */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase block">3. Đã duyệt có mặt</span>
          <span className="text-xl font-black text-emerald-900">{metrics.verifiedPresent}</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Chính thức</span>
        </div>

        {/* Absent */}
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-rose-700 uppercase block">4. Vắng mặt</span>
          <span className="text-xl font-black text-rose-900">{metrics.absent}</span>
          <span className="text-[10px] text-rose-600 block mt-0.5">Nghỉ học</span>
        </div>

        {/* Late */}
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-orange-700 uppercase block">5. Đi muộn</span>
          <span className="text-xl font-black text-orange-900">{metrics.late}</span>
          <span className="text-[10px] text-orange-600 block mt-0.5">Đến trễ</span>
        </div>

        {/* Unverified */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-slate-600 uppercase block">6. Chưa xác minh</span>
          <span className="text-xl font-black text-slate-700">{metrics.unverified}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Chưa vào máy</span>
        </div>

        {/* Wrong PC */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase block">7. Ngồi sai máy</span>
          <span className="text-xl font-black text-amber-900">{metrics.wrongPc}</span>
          <span className="text-[10px] text-amber-600 block mt-0.5">Cần duyệt đổi</span>
        </div>
      </div>

      {/* Filter and Quick Action Toolbar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc mã HS..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-xs outline-none"
            >
              <option value="all">Tất cả ({classStudents.length} HS)</option>
              <option value="present">Đã duyệt có mặt ({metrics.verifiedPresent})</option>
              <option value="wrong_pc">Ngồi sai máy ({metrics.wrongPc})</option>
              <option value="late">Đi muộn ({metrics.late})</option>
              <option value="absent">Vắng ({metrics.absent})</option>
              <option value="unverified">Chưa xác minh ({metrics.unverified})</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleConfirmAllPending}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Xác nhận HS đã đăng nhập</span>
          </button>
          <button
            onClick={handleMarkAllPresent}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Điểm danh cả lớp có mặt</span>
          </button>
        </div>
      </div>

      {/* Roster Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">STT</th>
                <th className="py-2.5 px-3">Mã HS</th>
                <th className="py-2.5 px-3">Họ và tên</th>
                <th className="py-2.5 px-3">Lớp</th>
                <th className="py-2.5 px-3">Máy phân công</th>
                <th className="py-2.5 px-3">Máy thực tế đăng nhập</th>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Trạng thái điểm danh</th>
                <th className="py-2.5 px-3 text-right">Giáo viên xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Không tìm thấy học sinh nào trong Lớp {currentClass.name} phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const assigned = assignedPcMap.get(st.id);
                  const att = attendanceRecordMap.get(st.id);
                  const status = att ? att.status : 'unverified';
                  const isMale = st.gender === 'male';

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {st.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <span className={`text-[10px] ${isMale ? 'text-blue-600' : 'text-pink-600'}`}>
                          {isMale ? 'Nam' : 'Nữ'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {st.classId}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                        {assigned ? (
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3.5 h-3.5 text-blue-600" />
                            <span>PC{assigned.pcId < 10 ? '0' + assigned.pcId : assigned.pcId} ({assigned.slot})</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa xếp chỗ</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {att ? (
                          <span className={att.status === 'wrong_pc' ? 'text-amber-600 flex items-center gap-1' : 'text-slate-800 flex items-center gap-1'}>
                            <Monitor className="w-3.5 h-3.5" />
                            <span>PC{att.actualPcId < 10 ? '0' + att.actualPcId : att.actualPcId}</span>
                            {att.status === 'wrong_pc' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                        {att?.loginTimestamp ? att.loginTimestamp.split(' ')[0] : '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        {status === 'present' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            <Check className="w-3 h-3 stroke-[3]" /> Có mặt (Đã duyệt)
                          </span>
                        )}
                        {status === 'present_pending_confirm' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3" /> Đã đăng nhập (Chờ duyệt)
                          </span>
                        )}
                        {status === 'wrong_pc' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3 h-3" /> Ngồi sai máy
                          </span>
                        )}
                        {status === 'late' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3" /> Đi muộn
                          </span>
                        )}
                        {(status === 'absent_excused' || status === 'absent_unexcused' || status === 'absent') && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-rose-100 text-rose-800">
                            <XCircle className="w-3 h-3" /> Vắng mặt
                          </span>
                        )}
                        {status === 'unverified' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600">
                            Chưa xác minh
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          {status !== 'present' && (
                            <button
                              onClick={() => handleUpdateStudentStatus(st, 'present', undefined, true)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] transition cursor-pointer"
                              title="Duyệt có mặt chính thức (chấp nhận chuyển chỗ nếu ngồi sai máy)"
                            >
                              Duyệt có mặt
                            </button>
                          )}
                          {status !== 'late' && (
                            <button
                              onClick={() => handleUpdateStudentStatus(st, 'late', 'Đến lớp muộn')}
                              className="px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-800 rounded font-bold text-[10px] transition cursor-pointer"
                              title="Ghi nhận đi muộn"
                            >
                              Đi muộn
                            </button>
                          )}
                          {status !== 'absent_unexcused' && (
                            <button
                              onClick={() => handleUpdateStudentStatus(st, 'absent_unexcused', 'Vắng không phép')}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded font-bold text-[10px] transition cursor-pointer"
                              title="Ghi nhận vắng mặt"
                            >
                              Báo vắng
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
