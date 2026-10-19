import React, { useState } from 'react';
import { 
  UserCheck, 
  GraduationCap, 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  User, 
  LogOut,
  ChevronDown,
  Info,
  Key
} from 'lucide-react';
import { UserSession } from '../types/assignments';
import { Student } from '../types/classroom';

interface UserRoleBarProps {
  session: UserSession;
  onSwitchSession: (newSession: UserSession) => void;
  students: Student[];
  onOpenSecurityModal: () => void;
  onOpenStudentLoginModal?: () => void;
  currentPcId?: number;
  lastCheckInStatus?: { isCorrectPc: boolean; actualPc: number; assignedPc: number | null } | null;
}

export const UserRoleBar: React.FC<UserRoleBarProps> = ({
  session,
  onSwitchSession,
  students,
  onOpenSecurityModal,
  onOpenStudentLoginModal,
  currentPcId = 1,
  lastCheckInStatus,
}) => {
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

  const isTeacher = session.role === 'teacher';

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.code.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.classId.includes(studentSearch)
  ).slice(0, 8); // Top 8 matching

  return (
    <div className="bg-slate-900 text-white rounded-xl px-4 py-2 mb-3 shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      
      {/* Role Indicator & Quick switcher */}
      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
          Chế độ làm việc:
        </span>

        {/* Teacher / Student Toggle Buttons */}
        <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700">
          <button
            onClick={() => onSwitchSession({ role: 'teacher', teacherName: 'Cô Nguyễn Thị Huệ (GV Quản lý Tin học)' })}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              isTeacher 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Giáo viên Tin học</span>
          </button>

          <button
            onClick={() => {
              if (onOpenStudentLoginModal) {
                onOpenStudentLoginModal();
              } else if (isTeacher) {
                const defaultStudent = students[0];
                onSwitchSession({
                  role: 'student',
                  studentId: defaultStudent.id,
                  studentName: defaultStudent.name,
                  classId: defaultStudent.classId,
                });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              !isTeacher 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Cổng Học sinh</span>
          </button>
        </div>

        {/* Current Active User display */}
        {isTeacher ? (
          <span className="hidden md:inline-flex items-center gap-1.5 text-blue-300 font-medium bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-500/30">
            <span>Đang đăng nhập: <strong>Cô Nguyễn Thị Huệ</strong></span>
            <span className="text-[10px] text-blue-400">(GV Quản lý • Toàn quyền giao bài & điểm danh)</span>
          </span>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 text-emerald-300 font-medium bg-emerald-950/60 px-3 py-1 rounded-xl border border-emerald-500/30">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>HS: <strong>{session.studentName}</strong> ({session.studentId} • Lớp {session.classId})</span>
              <span className="mx-1 text-slate-500">|</span>
              <span className="font-bold text-cyan-300">Máy: PC{currentPcId < 10 ? '0' + currentPcId : currentPcId}</span>

              {lastCheckInStatus && (
                lastCheckInStatus.isCorrectPc ? (
                  <span className="ml-1 text-[9px] font-bold bg-emerald-800/80 text-emerald-200 px-1.5 py-0.2 rounded-full">
                    ✓ Đúng máy
                  </span>
                ) : (
                  <span className="ml-1 text-[9px] font-bold bg-amber-800 text-amber-200 px-1.5 py-0.2 rounded-full" title={`Được xếp PC${lastCheckInStatus.assignedPc}, ngồi PC${lastCheckInStatus.actualPc}`}>
                    ⚠️ Sai máy
                  </span>
                )
              )}
            </div>

            {onOpenStudentLoginModal && (
              <button
                onClick={onOpenStudentLoginModal}
                className="text-[11px] font-bold text-emerald-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1"
                title="Đăng nhập lại hoặc đổi máy tính thực hành"
              >
                <Key className="w-3 h-3 text-emerald-400" />
                <span>Đổi máy / Điểm danh</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Security & Database Status Badge */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenSecurityModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
          title="Thông tin phân quyền bảo mật & CSDL Firebase Firestore"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bảo mật & CSDL dùng chung</span>
        </button>
      </div>

    </div>
  );
};
