import React from 'react';
import { 
  Home, 
  Users, 
  Monitor, 
  FileText, 
  Laptop, 
  Camera, 
  HeartHandshake, 
  MessageSquare, 
  Search,
  Globe,
  Award,
  Gamepad2,
  CalendarCheck,
  KeyRound,
  Send
} from 'lucide-react';

export type ActiveViewTab = 
  | 'materials' 
  | 'students'
  | 'accounts'
  | 'computers'
  | 'attendance'
  | 'theory' 
  | 'practice'
  | 'products'
  | 'evaluation'
  | 'monthly'
  | 'semester'
  | 'tools'
  | 'external' 
  | 'photos' 
  | 'parents' 
  | 'discussion';

interface HorizontalNavbarProps {
  activeTab: ActiveViewTab;
  onTabChange: (tab: ActiveViewTab) => void;
  studentCount?: number;
  quizCount?: number;
  productCount?: number;
  photoCount?: number;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subject: 'all' | 'tin' | 'congnghe') => void;
  onOpen18FoldersModal?: () => void;
  onOpenAssignModal?: () => void;
  isTeacher?: boolean;
  onRequireTeacherLogin?: (message?: string) => void;
}

export const HorizontalNavbar: React.FC<HorizontalNavbarProps> = ({
  activeTab,
  onTabChange,
  studentCount = 249,
  quizCount = 4,
  productCount = 4,
  photoCount = 6,
  searchTerm,
  onSearchChange,
  selectedSubject = 'all',
  onSelectSubject,
  onOpen18FoldersModal,
  onOpenAssignModal,
  isTeacher = false,
  onRequireTeacherLogin,
}) => {
  return (
    <nav className="bg-[#1a3a8f] text-white rounded-2xl shadow-lg px-2.5 py-1.5 mb-4 sticky top-2 z-20 border border-blue-600/40">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
        
        {/* Navigation Tabs matching layout exactly */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          
          {/* 1. TRANG CHỦ & HỌC LIỆU */}
          <button
            onClick={() => onTabChange('materials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer ${
              activeTab === 'materials'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-blue-500" />
            <span>TRANG CHỦ & HỌC LIỆU</span>
          </button>

          {/* 2. HỌC SINH (249) */}
          <button
            onClick={() => onTabChange('students')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-300" />
            <span>HỌC SINH ({studentCount})</span>
          </button>

          {/* 2.1 TÀI KHOẢN HỌC SINH & CẤP MÃ PIN (YÊU CẦU QUẢN TRỊ) */}
          <button
            onClick={() => onTabChange('accounts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'accounts'
                ? 'bg-amber-400 text-slate-950 font-black shadow-sm ring-2 ring-amber-300'
                : 'text-amber-300 hover:bg-white/10 hover:text-white'
            }`}
            title="Quản lý và cấp lại mã PIN tài khoản học sinh 9 lớp"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>TÀI KHOẢN HỌC SINH</span>
          </button>

          {/* 3. 20 MÁY TÍNH */}
          <button
            onClick={() => onTabChange('computers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'computers'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-300" />
            <span>20 MÁY TÍNH</span>
          </button>

          {/* GIAO BÀI TẬP CHO LỚP & HỌC SINH */}
          {onOpenAssignModal && (
            <button
              onClick={() => {
                if (isTeacher) {
                  onOpenAssignModal();
                } else if (onRequireTeacherLogin) {
                  onRequireTeacherLogin('Bạn cần đăng nhập tài khoản Giáo viên để giao bài tập hoặc tạo nhiệm vụ cho học sinh!');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer shadow-md ring-1 transform hover:scale-[1.02] ${
                isTeacher
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white ring-emerald-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-emerald-300 ring-slate-600'
              }`}
              title={isTeacher ? 'Chọn lớp, chọn bài tập và phân công bài tập cho học sinh' : 'Cần đăng nhập Giáo viên để giao bài tập'}
            >
              <Send className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              <span>GIAO BÀI TẬP</span>
              {!isTeacher && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-normal">🔒</span>}
            </button>
          )}

          {/* 4. BÀI TẬP LÝ THUYẾT */}
          <button
            onClick={() => onTabChange('theory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'theory'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>BÀI TẬP LÝ THUYẾT ({quizCount})</span>
          </button>

          {/* 5. BÀI TẬP THỰC HÀNH (SẢN PHẨM SỐ HS) */}
          <button
            onClick={() => onTabChange('practice')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'practice' || activeTab === 'products'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-yellow-300" />
            <span>BÀI TẬP THỰC HÀNH ({productCount})</span>
          </button>

          {/* 6. ĐÁNH GIÁ NHẬN XÉT (ĐÁNH GIÁ THEO THÁNG & CUỐI NĂM) */}
          <button
            onClick={() => onTabChange('evaluation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'evaluation' || activeTab === 'monthly' || activeTab === 'semester'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-300" />
            <span>ĐÁNH GIÁ NHẬN XÉT</span>
          </button>

          {/* 7. CÔNG CỤ DẠY HỌC (BEECLASS, GVDM, KAHOOT, QUIZIZZ..) */}
          <button
            onClick={() => onTabChange('tools')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'tools' || activeTab === 'external'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 text-purple-300" />
            <span>CÔNG CỤ DẠY HỌC</span>
          </button>

          {/* 8. HÌNH ẢNH HỌC TẬP */}
          <button
            onClick={() => onTabChange('photos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-rose-300" />
            <span>HÌNH ẢNH HỌC TẬP</span>
          </button>

          {/* 9. BAN LIÊN LẠC PH */}
          <button
            onClick={() => onTabChange('parents')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'parents'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-300" />
            <span>BAN LIÊN LẠC PH</span>
          </button>

          {/* 10. TRAO ĐỔI */}
          <button
            onClick={() => onTabChange('discussion')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'discussion'
                ? 'bg-white text-blue-900 shadow-sm ring-1 ring-white/50'
                : 'text-white/90 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-sky-300" />
            <span>TRAO ĐỔI</span>
          </button>

        </div>

        {/* Right Area: Subject Switcher & Search */}
        <div className="shrink-0 flex flex-wrap items-center justify-end gap-2">
          
          {/* Active Subject Badge (Tin học) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/90 rounded-xl border border-cyan-400/50 text-[11px] font-black text-cyan-300 shadow-xs">
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>MÔN TIN HỌC</span>
          </div>

          {onOpen18FoldersModal && (
            <button
              type="button"
              onClick={onOpen18FoldersModal}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
              title="Mở bảng 9 thư mục lớp Môn Tin học Cô Huệ"
            >
              <span>📁 9 Thư mục Tin học</span>
            </button>
          )}

          {/* Search Box */}
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-blue-300 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm học liệu, công cụ..."
              className="w-full bg-blue-900/60 text-white placeholder-blue-300 text-xs pl-8 pr-3 py-1 rounded-xl border border-blue-400/30 focus:border-cyan-300 focus:bg-blue-900/90 outline-none transition"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1 text-blue-300 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

      </div>
    </nav>
  );
};
