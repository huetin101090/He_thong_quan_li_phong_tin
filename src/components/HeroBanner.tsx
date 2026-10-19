import React from 'react';
import { 
  GraduationCap, 
  BookOpen, 
  Lightbulb, 
  Users, 
  Globe, 
  ChevronRight, 
  KeyRound, 
  Monitor, 
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  School,
  Layers
} from 'lucide-react';
import { DatabaseStatus } from '../types/classroom';
import { UserSession } from '../types/assignments';
import { SCHOOL_NAME, APP_NAME, TOTAL_CLASSES, TOTAL_STUDENTS, TOTAL_COMPUTERS } from '../data/initialData';

interface HeroBannerProps {
  dbStatus: DatabaseStatus;
  currentClassName: string;
  currentClassId?: string;
  onSelectClass?: (classId: string) => void;
  selectedGrade: 3 | 4 | 5;
  onSelectGrade: (grade: 3 | 4 | 5) => void;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subject: 'all' | 'tin' | 'congnghe') => void;
  onOpen18FoldersModal?: () => void;
  session: UserSession;
  onSwitchSession: (session: UserSession) => void;
  onExploreClick: () => void;
  onOpenDiagnostic: () => void;
  onOpenComputers: () => void;
  onOpenStudentLoginModal?: (targetClassId?: string) => void;
  periodNumber?: number;
  daySession?: 'morning' | 'afternoon';
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  dbStatus,
  currentClassName,
  currentClassId = '4/3',
  onSelectClass,
  selectedGrade,
  onSelectGrade,
  selectedSubject = 'all',
  onSelectSubject,
  onOpen18FoldersModal,
  session,
  onSwitchSession,
  onExploreClick,
  onOpenDiagnostic,
  onOpenComputers,
  onOpenStudentLoginModal,
  periodNumber = 1,
  daySession = 'morning',
}) => {
  return (
    <div className="space-y-3 mb-4">
      {/* 1. MAIN HERO CONTAINER (Bố cục hiện đại, chuẩn nội dung ban đầu của trường) */}
      <div className="relative bg-gradient-to-br from-sky-100/90 via-blue-50/70 to-white rounded-3xl p-4 sm:p-5 lg:p-6 shadow-sm border border-blue-200/90 overflow-hidden">
        {/* Subtle decorative dot matrix background */}
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_0.75px,transparent_0.75px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-center">
          
          {/* LEFT COLUMN: Header, Titles, 4 Feature Cards, Buttons & Role Switcher (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-2.5 sm:space-y-3">
            
            {/* Top pill badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-600 text-white shadow-xs">
                <School className="w-3.5 h-3.5 text-cyan-200" />
                {SCHOOL_NAME}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-700 text-white shadow-xs">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                Môn Tin học & Môn Công nghệ AI
              </span>

              {onOpen18FoldersModal && (
                <button
                  type="button"
                  onClick={onOpen18FoldersModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs transition cursor-pointer"
                  title="Xem và quản lý 18 thư mục lớp học chuẩn theo danh sách của Cô Huệ"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-100" />
                  <span>📁 Danh mục 18 Thư mục Cô Huệ</span>
                </button>
              )}

              {dbStatus.isActive ? (
                <button
                  onClick={onOpenDiagnostic}
                  className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200 transition cursor-pointer"
                  title="Kiểm tra hệ thống CSDL"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>CSDL: Hoạt động tốt</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                  CSDL: Chưa kết nối
                </span>
              )}
            </div>

            {/* Main Title */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-black tracking-tight text-blue-950 uppercase leading-snug">
                {APP_NAME}
              </h1>
            </div>

            {/* Subject Switcher Row */}
            {onSelectSubject && (
              <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl border-2 border-indigo-200/90 shadow-sm flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-tight flex items-center gap-1">
                    <span>Phân môn:</span>
                  </span>
                  <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => onSelectSubject('all')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        selectedSubject === 'all'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🌟 Cả 2 môn (18 Thư mục)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectSubject('tin')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        selectedSubject === 'tin'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-blue-700'
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5 text-blue-400" />
                      <span>💻 MÔN TIN HỌC (9 Lớp)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectSubject('congnghe')}
                      className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        selectedSubject === 'congnghe'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-emerald-700'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                      <span>🛠️ MÔN CÔNG NGHỆ (9 Lớp)</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-600">
                  Phụ trách: <strong className="text-blue-900">Cô Nguyễn Thị Huệ</strong>
                </div>
              </div>
            )}

            {/* Subtitle & Scope (9 lớp, 249 học sinh, 20 máy tính) */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-bold text-blue-800">
              <span className="flex items-center gap-1 text-slate-800">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>{TOTAL_CLASSES} Lớp (18 Thư mục Tin & CN)</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-800">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>{TOTAL_STUDENTS} Học sinh</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-800">
                <Monitor className="w-4 h-4 text-cyan-600" />
                <span>{TOTAL_COMPUTERS} Máy vi tính</span>
              </span>
            </div>

            {/* Ecosystem Description */}
            <p className="text-xs sm:text-[13px] text-slate-600 font-normal leading-relaxed">
              Hệ thống Quản lý Giảng dạy & Phòng máy vi tính cho 9 lớp (Khối 3: 3.4, 3.5, 3.6; Khối 4: 4.3, 4.4, 4.5; Khối 5: 5.4, 5.5, 5.6) gồm 2 phân môn <strong>Tin học</strong> và <strong>Công nghệ</strong> Trường Tiểu học Đồng Dương.
            </p>

            {/* 4 Feature Cards in a row (Bố cục đẹp theo mẫu) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {/* Card 1 */}
              <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center text-center transition hover:border-blue-400 hover:shadow-sm">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1.5 border border-blue-100">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">HỌC TẬP</span>
                <span className="text-[9px] font-bold text-blue-600 uppercase">THÔNG MINH</span>
              </div>

              {/* Card 2 */}
              <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center text-center transition hover:border-blue-400 hover:shadow-sm">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1.5 border border-amber-100">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">TƯ DUY</span>
                <span className="text-[9px] font-bold text-amber-600 uppercase">SÁNG TẠO</span>
              </div>

              {/* Card 3 */}
              <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center text-center transition hover:border-blue-400 hover:shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 border border-emerald-100">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">KỸ NĂNG</span>
                <span className="text-[9px] font-bold text-emerald-600 uppercase">TOÀN DIỆN</span>
              </div>

              {/* Card 4 */}
              <div className="bg-white/90 backdrop-blur-xs p-2.5 rounded-xl border border-blue-200 shadow-xs flex flex-col items-center text-center transition hover:border-blue-400 hover:shadow-sm">
                <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center mb-1.5 border border-cyan-100">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">HỘI NHẬP</span>
                <span className="text-[9px] font-bold text-cyan-600 uppercase">TOÀN CẦU</span>
              </div>
            </div>

            {/* Action buttons & Quick role switcher */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Explore button */}
                <button
                  onClick={onExploreClick}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-extrabold rounded-full text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
                >
                  <span>KHÁM PHÁ NGAY</span>
                  <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>

                {/* Login button */}
                <button
                  type="button"
                  onClick={() => onSwitchSession({ role: 'teacher', teacherName: 'Cô Nguyễn Thị Huệ (GV Phụ trách Tin học & Công nghệ)' })}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-full text-xs border border-slate-300 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  title="Đăng nhập tài khoản Giáo viên Phụ trách Tin học & Công nghệ"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>Đăng nhập Giáo viên Quản lý</span>
                </button>
              </div>

              {/* Role switcher row matching user requirement */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium pt-0.5 flex-wrap">
                <span className="text-[11px] text-slate-700 font-bold flex items-center gap-1">
                  Chuyển chế độ:
                </span>
                
                <button
                  type="button"
                  onClick={() => onSwitchSession({ role: 'teacher', teacherName: 'Quản trị viên (Admin)' })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    session.role === 'teacher' && session.teacherName?.includes('Admin')
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  title="Chuyển chế độ Quản trị viên hệ thống"
                >
                  <span>👑 Admin</span>
                </button>

                <button
                  type="button"
                  onClick={() => onSwitchSession({ role: 'teacher', teacherName: 'Cô Nguyễn Thị Huệ' })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                    session.role === 'teacher' && !session.teacherName?.includes('Admin')
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                  title="Chuyển chế độ Giáo viên Tin học"
                >
                  <span>GV</span>
                </button>

                {/* YÊU CẦU 1: Nút HS 4/3 - Khi nhấn chuyển đến giao diện CỔNG ĐĂNG NHẬP HỌC SINH */}
                <button
                  type="button"
                  data-testid="student-login-btn-43"
                  onClick={() => {
                    try {
                      if (onSelectClass) {
                        onSelectClass('4/3');
                      }
                      if (onOpenStudentLoginModal) {
                        onOpenStudentLoginModal('4/3');
                      }
                    } catch (e: any) {
                      console.error('Lỗi khi mở Cổng đăng nhập HS 4/3:', e);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    session.role === 'student' && session.classId === '4/3' && session.studentId !== 'PH-01'
                      ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-300'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-400 shadow-2xs'
                  }`}
                  title="Mở Cổng đăng nhập & Điểm danh học sinh Lớp 4/3 (Ví dụ HS43-07 Phan Hải Đăng)"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>HS 4/3</span>
                  <span className="text-[9px] bg-emerald-200/90 text-emerald-950 font-bold px-1.5 py-0.2 rounded font-mono">Đăng nhập</span>
                </button>

                {/* Nếu lớp đang chọn không phải 4/3 (ví dụ 3/4, 4/5, 5/4), hiển thị thêm nút Cổng HS cho lớp đó */}
                {currentClassId && currentClassId !== '4/3' && (
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        if (onOpenStudentLoginModal) {
                          onOpenStudentLoginModal(currentClassId);
                        }
                      } catch (e: any) {
                        console.error('Lỗi khi mở Cổng đăng nhập học sinh:', e);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      session.role === 'student' && session.classId === currentClassId && session.studentId !== 'PH-01'
                        ? 'bg-teal-600 text-white shadow-xs ring-2 ring-teal-300'
                        : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300'
                    }`}
                    title={`Mở Cổng đăng nhập học sinh Lớp ${currentClassId}`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-teal-600" />
                    <span>HS {currentClassId}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSwitchSession({
                    role: 'student',
                    studentId: 'PH-01',
                    studentName: 'Phụ huynh học sinh',
                    classId: currentClassId || '4/3'
                  })}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition cursor-pointer"
                  title="Chế độ xem của Phụ huynh"
                >
                  <span>PH</span>
                </button>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Realistic Computer Lab Classroom Card with Blue Border (5 cols on lg) */}
          <div className="lg:col-span-5 flex justify-center items-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[340px] lg:max-w-[310px] xl:max-w-[330px] rounded-2xl overflow-hidden border-4 border-blue-500 shadow-xl bg-slate-900 group aspect-[2/3]">
              
              {/* Computer Lab photo: chuẩn tỷ lệ ảnh thật 2:3 (1024 x 1536) */}
              <div className="relative w-full h-full overflow-hidden bg-slate-950">
                <img
                  src="https://i.ibb.co/Q3YM47RF/c262267f-4f7d-4151-b6a8-3fa00211fa09.png"
                  onError={(e) => {
                    e.currentTarget.src = '/images/classroom_hero.png';
                  }}
                  alt="Tiết học Tin học Cô Nguyễn Thị Huệ - Trường TH Đồng Dương"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Gradient dark overlay: nhẹ ở dưới để nổi bật chữ, không che học sinh và máy tính */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/20 pointer-events-none" />

                {/* Top Right Floating Badge */}
                <div className="absolute top-2.5 right-2.5 z-10">
                  <button
                    type="button"
                    onClick={onOpenComputers}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-600/90 hover:bg-blue-600 text-white shadow-md backdrop-blur-xs border border-white/20 transition cursor-pointer"
                  >
                    <Monitor className="w-3.5 h-3.5 text-cyan-200" />
                    <span>Phòng máy 20 máy trạm</span>
                  </button>
                </div>
              </div>

              {/* Bottom Interactive Overlay Card showing active class */}
              <div className="absolute bottom-2 left-2 right-2 z-10 bg-slate-950/85 backdrop-blur-md rounded-xl p-2 px-2.5 border border-white/20 shadow-lg flex items-center justify-between gap-2 text-white">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Class Badge */}
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {currentClassName.replace('Lớp ', '') || '4/3'}
                  </div>

                  {/* Title & Description */}
                  <div className="min-w-0">
                    <h4 className="text-[11px] font-black text-white truncate">
                      {currentClassName} • {selectedSubject === 'congnghe' ? 'Môn Công nghệ' : selectedSubject === 'tin' ? 'Thực hành Tin học' : 'Tin học & Công nghệ'}
                    </h4>
                    <p className="text-[9px] text-cyan-200 font-medium truncate">
                      Sơ đồ 20 máy (2 HS/máy) • 100% HS thao tác
                    </p>
                  </div>
                </div>

                {/* Status indicator on the right */}
                <div className="text-right shrink-0">
                  <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Tiết {periodNumber}</span>
                  </div>
                  <div className="text-[9px] text-slate-300 font-medium">
                    {daySession === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* 2. FULL WIDTH SLOGAN PILL BANNER (matching layout from image) */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white py-2 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 text-center border border-blue-600/60">
        <Sparkles className="w-4 h-4 text-cyan-300 shrink-0" />
        <span className="text-xs sm:text-sm font-black uppercase tracking-wider drop-shadow-xs">
          CÔNG NGHỆ LÀ CÔNG CỤ – GIÁO DỤC LÀ NỀN TẢNG – TƯƠNG LAI LÀ ĐÍCH ĐẾN
        </span>
        <GraduationCap className="w-4 h-4 text-yellow-300 shrink-0" />
      </div>
    </div>
  );
};
