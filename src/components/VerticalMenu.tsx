import React, { useState } from 'react';
import { 
  School, 
  Calendar, 
  Clock, 
  Sun, 
  Moon, 
  BookOpen, 
  Keyboard, 
  Palette, 
  Code2, 
  FileText, 
  Gamepad2, 
  Video, 
  Sparkles,
  Users,
  ChevronDown,
  ChevronRight,
  Monitor,
  CheckCircle2,
  FolderOpen,
  GraduationCap,
  Layers,
  Laptop,
  Lock,
  ShieldAlert
} from 'lucide-react';
import { CLASSES_DATA } from '../data/initialData';
import { ClassInfo } from '../types/classroom';
import { UserSession } from '../types/assignments';

interface VerticalMenuProps {
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedGradeFilter: 'all' | 3 | 4 | 5;
  onSelectGradeFilter: (grade: 'all' | 3 | 4 | 5) => void;
  currentDate: string;
  onDateChange: (date: string) => void;
  session: 'morning' | 'afternoon';
  onSessionChange: (session: 'morning' | 'afternoon') => void;
  periodNumber: number;
  onPeriodChange: (p: number) => void;
  onOpenAutoAssign: () => void;
  onOpenClassRoster: () => void;
  activeClassStudentCount: number;
  userSession?: UserSession;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subject: 'all' | 'tin' | 'congnghe') => void;
  onOpen18FoldersModal?: () => void;
}

export const VerticalMenu: React.FC<VerticalMenuProps> = ({
  selectedClassId,
  onSelectClass,
  selectedCategory,
  onSelectCategory,
  selectedGradeFilter,
  onSelectGradeFilter,
  currentDate,
  onDateChange,
  session,
  onSessionChange,
  periodNumber,
  onPeriodChange,
  onOpenAutoAssign,
  onOpenClassRoster,
  activeClassStudentCount,
  selectedSubject = 'all',
  onSelectSubject,
  onOpen18FoldersModal,
}) => {
  const [isClassMenuOpen, setIsClassMenuOpen] = useState(true);
  const [isScheduleMenuOpen, setIsScheduleMenuOpen] = useState(true);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(true);

  // Danh mục học liệu gốc của hệ thống
  const categories = [
    { id: 'all', name: 'Tất cả học liệu số', icon: BookOpen, count: 16 },
    { id: 'software', name: 'Phần mềm luyện gõ & gõ TV', icon: Keyboard, count: 4 },
    { id: 'paint', name: 'Em tập vẽ (Paint / Mỹ thuật số)', icon: Palette, count: 3 },
    { id: 'code', name: 'Lập trình Scratch & Blockly', icon: Code2, count: 3 },
    { id: 'exercise', name: 'Soạn thảo Word & Phiếu bài tập', icon: FileText, count: 4 },
    { id: 'game', name: 'Trò chơi giáo dục & STEM', icon: Gamepad2, count: 3 },
    { id: 'video', name: 'Video bài giảng tương tác', icon: Video, count: 2 },
  ];

  return (
    <aside className="bg-white border-2 border-blue-600 rounded-2xl shadow-sm p-3.5 space-y-4">
      
      {/* 1. Header Box: GVQL: Cô Nguyễn Thị Huệ */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-emerald-800 text-white rounded-xl p-2.5 text-center shadow-xs">
        <h2 className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center justify-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-amber-300 shrink-0" />
          <span>GV: Cô Nguyễn Thị Huệ</span>
        </h2>
        <p className="text-[10px] text-blue-100 font-medium mt-0.5">
          Phụ trách Bộ môn Tin học & Bộ môn Công nghệ
        </p>
      </div>

      {/* 2. CƠ CẤU 9 LỚP HỌC (249 HỌC SINH) - NỘI DUNG CHUẨN CỦA TRƯỜNG */}
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-blue-200">
          <button
            onClick={() => setIsClassMenuOpen(!isClassMenuOpen)}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-900 cursor-pointer"
          >
            <School className="w-3.5 h-3.5" />
            <span>9 LỚP HỌC (249 HS)</span>
            {isClassMenuOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
          </button>
          
          {onOpen18FoldersModal && (
            <button
              onClick={onOpen18FoldersModal}
              className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300 transition cursor-pointer"
              title="Xem danh mục 18 thư mục Tin & Công nghệ"
            >
              📁 18 Thư mục
            </button>
          )}
        </div>

        {/* Quick Subject Filter Inside Vertical Menu */}
        {onSelectSubject && (
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => onSelectSubject('all')}
              className={`py-1 rounded-lg text-center transition cursor-pointer ${
                selectedSubject === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả 2 môn
            </button>
            <button
              type="button"
              onClick={() => onSelectSubject('tin')}
              className={`py-1 rounded-lg text-center transition cursor-pointer ${
                selectedSubject === 'tin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              💻 Tin học
            </button>
            <button
              type="button"
              onClick={() => onSelectSubject('congnghe')}
              className={`py-1 rounded-lg text-center transition cursor-pointer ${
                selectedSubject === 'congnghe'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              🛠️ Công nghệ
            </button>
          </div>
        )}

        {isClassMenuOpen && (
          <div className="space-y-2.5 text-xs">
            
            {/* Khối 3: 3.4 (31), 3.5 (31), 3.6 (23) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span>Khối 3 (85 HS)</span>
                <span className="text-[9px] text-slate-400 font-normal">3 lớp • 6 thư mục</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {CLASSES_DATA.filter(c => c.grade === 3).map((cls) => {
                  const isSelected = selectedClassId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => onSelectClass(cls.id)}
                      className={`p-1.5 rounded-lg text-center font-bold transition cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-black">{cls.name}</div>
                      <div className={`text-[9px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {cls.totalStudents} HS
                      </div>
                      
                      {/* Subject folder tags */}
                      <div className="w-full mt-1 space-y-0.5">
                        {(selectedSubject === 'all' || selectedSubject === 'tin') && (
                          <div className={`text-[7.5px] truncate font-mono px-0.5 rounded ${
                            isSelected ? 'bg-blue-700 text-blue-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {cls.tinHocFolder}
                          </div>
                        )}
                        {(selectedSubject === 'all' || selectedSubject === 'congnghe') && (
                          <div className={`text-[7.5px] truncate font-mono px-0.5 rounded ${
                            isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {cls.congNgheFolder}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Khối 4: 4.3 (29), 4.4 (29), 4.5 (18) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span>Khối 4 (76 HS)</span>
                <span className="text-[9px] text-slate-400 font-normal">3 lớp • 6 thư mục</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {CLASSES_DATA.filter(c => c.grade === 4).map((cls) => {
                  const isSelected = selectedClassId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => onSelectClass(cls.id)}
                      className={`p-1.5 rounded-lg text-center font-bold transition cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-indigo-600 text-white shadow-xs' 
                          : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-black">{cls.name}</div>
                      <div className={`text-[9px] font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {cls.totalStudents} HS
                      </div>
                      
                      {/* Subject folder tags */}
                      <div className="w-full mt-1 space-y-0.5">
                        {(selectedSubject === 'all' || selectedSubject === 'tin') && (
                          <div className={`text-[7.5px] truncate font-mono px-0.5 rounded ${
                            isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {cls.tinHocFolder}
                          </div>
                        )}
                        {(selectedSubject === 'all' || selectedSubject === 'congnghe') && (
                          <div className={`text-[7.5px] truncate font-mono px-0.5 rounded ${
                            isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {cls.congNgheFolder}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Khối 5: 5.4 (35), 5.5 (34), 5.6 (19) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span>Khối 5 (88 HS)</span>
                <span className="text-[9px] text-slate-400 font-normal">3 lớp • 6 thư mục</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {CLASSES_DATA.filter(c => c.grade === 5).map((cls) => {
                  const isSelected = selectedClassId === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => onSelectClass(cls.id)}
                      className={`p-1.5 rounded-lg text-center font-bold transition cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-emerald-600 text-white shadow-xs' 
                          : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-black">{cls.name}</div>
                      <div className={`text-[9px] font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {cls.totalStudents} HS
                      </div>
                      
                      {/* Subject folder tags */}
                      <div className="w-full mt-1 space-y-0.5">
                        {(selectedSubject === 'all' || selectedSubject === 'tin') && (
                          <div className={`text-[7.5px] truncate font-mono px-0.5 rounded ${
                            isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {cls.tinHocFolder}
                          </div>
                        )}
                        {(selectedSubject === 'all' || selectedSubject === 'congnghe') && (
                          <div className={`text-[7.5px] truncate font-mono px-0.5 rounded ${
                            isSelected ? 'bg-teal-700 text-teal-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {cls.congNgheFolder}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 3. DANH MỤC HỌC LIỆU SỐ (NỘI DUNG GỐC) */}
      <div className="space-y-2 pt-1 border-t border-slate-200">
        <button
          onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-800 pb-1"
        >
          <span className="flex items-center gap-1.5 text-blue-800">
            <BookOpen className="w-3.5 h-3.5" />
            <span>DANH MỤC HỌC LIỆU</span>
          </span>
          {isCategoryMenuOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {isCategoryMenuOpen && (
          <div className="space-y-1">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-blue-50/80 hover:text-blue-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. BUỔI HỌC & TIẾT PHÒNG MÁY */}
      <div className="space-y-2 pt-1 border-t border-slate-200">
        <button
          onClick={() => setIsScheduleMenuOpen(!isScheduleMenuOpen)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-800 pb-1"
        >
          <span className="flex items-center gap-1.5 text-blue-800">
            <Clock className="w-3.5 h-3.5" />
            <span>BUỔI HỌC & TIẾT PHÒNG MÁY</span>
          </span>
          {isScheduleMenuOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        {isScheduleMenuOpen && (
          <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={() => onSessionChange('morning')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition ${
                  session === 'morning'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Sun className="w-3 h-3 text-amber-300" />
                <span>Buổi Sáng</span>
              </button>

              <button
                onClick={() => onSessionChange('afternoon')}
                className={`flex-1 py-1 px-2 rounded-lg font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer transition ${
                  session === 'afternoon'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200'
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-300" />
                <span>Buổi Chiều</span>
              </button>
            </div>

            {/* Period 1-5 selector */}
            <div className="flex items-center justify-between gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => onPeriodChange(p)}
                  className={`flex-1 py-1 rounded-md text-[11px] font-black transition cursor-pointer text-center ${
                    periodNumber === p
                      ? 'bg-blue-600 text-white ring-1 ring-blue-500'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-blue-50'
                  }`}
                >
                  T{p}
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="pt-1 flex items-center gap-1.5">
              <button
                onClick={onOpenAutoAssign}
                className="flex-1 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs hover:brightness-105 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Phân công AI</span>
              </button>
              <button
                onClick={onOpenClassRoster}
                className="flex-1 py-1.5 bg-white text-blue-700 border border-blue-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-blue-50 cursor-pointer"
              >
                <Users className="w-3 h-3" />
                <span>Xem {activeClassStudentCount} HS</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </aside>
  );
};
