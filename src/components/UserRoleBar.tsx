import React from 'react';
import { 
  UserCheck, 
  GraduationCap, 
  ShieldCheck, 
  Lock, 
  User, 
  LogOut,
  Key,
  KeyRound,
  Eye,
  AlertTriangle
} from 'lucide-react';
import { UserSession } from '../types/assignments';
import { Student } from '../types/classroom';

interface UserRoleBarProps {
  session: UserSession;
  onSwitchSession: (newSession: UserSession) => void;
  students: Student[];
  onOpenSecurityModal: () => void;
  onOpenStudentLoginModal?: () => void;
  onOpenStudentAccounts?: () => void;
  onOpenTeacherLoginModal?: () => void;
  onLogoutTeacher?: () => void;
  currentPcId?: number;
  lastCheckInStatus?: { isCorrectPc: boolean; actualPc: number; assignedPc: number | null } | null;
}

export const UserRoleBar: React.FC<UserRoleBarProps> = ({
  session,
  onSwitchSession,
  students,
  onOpenSecurityModal,
  onOpenStudentLoginModal,
  onOpenStudentAccounts,
  onOpenTeacherLoginModal,
  onLogoutTeacher,
  currentPcId = 1,
  lastCheckInStatus,
}) => {
  const isTeacher = session.role === 'teacher';
  const isGuest = session.role === 'guest';
  const isStudent = session.role === 'student';

  return (
    <div className="bg-slate-900 text-white rounded-xl px-4 py-2 mb-3 shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      
      {/* Role Indicator & Mode switcher */}
      <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
          Chế độ làm việc:
        </span>

        {/* Mode Selector Buttons */}
        <div className="inline-flex rounded-lg p-0.5 bg-slate-800 border border-slate-700">
          {/* Teacher Mode Button: If not logged in as teacher, prompt for login! */}
          <button
            type="button"
            onClick={() => {
              if (isTeacher) {
                // Already teacher
              } else if (onOpenTeacherLoginModal) {
                onOpenTeacherLoginModal();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              isTeacher 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
            title={isTeacher ? 'Đang trong Chế độ Giáo viên' : 'Đăng nhập vào tài khoản Giáo viên'}
          >
            {isTeacher ? <UserCheck className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-amber-400" />}
            <span>Giáo viên Tin học</span>
            {!isTeacher && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-normal">Khóa</span>}
          </button>

          {/* Student Mode Button */}
          <button
            type="button"
            onClick={() => {
              if (onOpenStudentLoginModal) {
                onOpenStudentLoginModal();
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-bold transition cursor-pointer ${
              isStudent 
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Đăng nhập Cổng Học sinh"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Cổng Học sinh</span>
          </button>

          {/* Guest / View Only Mode */}
          <button
            type="button"
            onClick={() => {
              if (onLogoutTeacher) {
                onLogoutTeacher();
              } else {
                onSwitchSession({ role: 'guest', teacherName: 'Chế độ xem' });
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
              isGuest 
                ? 'bg-slate-700 text-cyan-300 shadow-xs' 
                : 'text-slate-400 hover:text-white'
            }`}
            title="Chế độ xem công khai (Chỉ đọc)"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Chế độ xem</span>
          </button>
        </div>

        {/* Status display based on active session */}
        {isTeacher ? (
          <div className="inline-flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 text-blue-300 font-medium bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-500/30">
              <span>Đang đăng nhập: <strong>Cô Nguyễn Thị Huệ</strong></span>
              <span className="text-[10px] text-blue-400">(GV Quản lý • Toàn quyền giao bài & điểm danh)</span>
            </span>
            {onLogoutTeacher && (
              <button
                type="button"
                onClick={onLogoutTeacher}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50 transition cursor-pointer"
                title="Đăng xuất khỏi tài khoản Giáo viên, chuyển về chế độ xem an toàn"
              >
                <LogOut className="w-3 h-3 text-rose-400" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        ) : isStudent ? (
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
        ) : (
          /* Guest mode: Explicit badge and login call-to-action */
          <div className="inline-flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-amber-300 font-medium bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Chế độ xem: <strong>Khách / Học sinh</strong> (Chỉ xem học liệu, không thể tạo bài tập hay cấp PIN)</span>
            </span>
            {onOpenTeacherLoginModal && (
              <button
                type="button"
                onClick={onOpenTeacherLoginModal}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer shadow-xs"
              >
                <Lock className="w-3 h-3" />
                <span>Đăng nhập Giáo viên</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Security & Database Status Badge */}
      <div className="flex items-center gap-2">
        {isTeacher && onOpenStudentAccounts ? (
          <button
            onClick={onOpenStudentAccounts}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 border border-amber-500/40 transition cursor-pointer shadow-xs"
            title="Quản lý và cấp lại mã PIN học sinh"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Tài khoản & PIN học sinh</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (onOpenTeacherLoginModal) {
                onOpenTeacherLoginModal();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
            title="Cần đăng nhập Giáo viên để quản lý và cấp mã PIN"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Cấp PIN học sinh (Khóa)</span>
          </button>
        )}
        <button
          onClick={onOpenSecurityModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
          title="Thông tin phân quyền bảo mật & CSDL Firebase Firestore"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bảo mật & CSDL</span>
        </button>
      </div>
    </div>
  );
};
