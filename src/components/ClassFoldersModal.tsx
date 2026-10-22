import React from 'react';
import { 
  X, 
  FolderCheck, 
  Monitor, 
  Cpu, 
  Users, 
  ArrowRight, 
  FileSpreadsheet, 
  School, 
  Sparkles,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { ALL_18_CLASS_FOLDERS, ClassSubjectFolder } from '../data/initialData';

interface ClassFoldersModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClassId: string;
  selectedSubject: 'all' | 'tin' | 'congnghe';
  onSelectFolder: (folder: ClassSubjectFolder) => void;
  onOpenRoster?: () => void;
}

export const ClassFoldersModal: React.FC<ClassFoldersModalProps> = ({
  isOpen,
  onClose,
  selectedClassId,
  selectedSubject,
  onSelectFolder,
  onOpenRoster,
}) => {
  if (!isOpen) return null;

  const grades = [3, 4, 5] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl border border-white/20 text-cyan-300">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight uppercase">
                  Danh mục 9 Thư mục Lớp Học Môn Tin học
                </h2>
                <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full">
                  Cô Nguyễn Thị Huệ
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Cơ cấu chuẩn: 9 Lớp Môn Tin học (Tổng 249 học sinh • 3 Khối • Phòng máy 20 máy trạm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend & Stats Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-700">Phân môn hoạt động:</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold border border-blue-200">
              <Monitor className="w-3.5 h-3.5 text-blue-600" />
              <span>💻 9 Thư mục Môn Tin học (_TIN)</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Nhấp vào bất kỳ thư mục nào để chuyển lớp Tin học ngay lập tức
          </span>
        </div>

        {/* Main 3 Columns (Khối 3, Khối 4, Khối 5) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {grades.map((grade) => {
            const gradeFolders = ALL_18_CLASS_FOLDERS.filter(f => f.grade === grade);
            const tinFolders = gradeFolders.filter(f => f.subject === 'tin');
            const cnFolders = gradeFolders.filter(f => f.subject === 'congnghe');
            const totalGradeStudents = tinFolders.reduce((acc, f) => acc + f.totalStudents, 0);

            return (
              <div key={grade} className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-900 text-white shadow-xs">
                      Khối {grade}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      Tổng {totalGradeStudents} học sinh • 3 Thư mục Môn Tin học
                    </span>
                  </div>
                </div>

                {/* Tin học Folders Grid (3 folders per grade) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {tinFolders.map((folder) => {
                    const isCurrent = folder.classId === selectedClassId;
                    return (
                      <button
                        key={folder.code}
                        onClick={() => {
                          onSelectFolder(folder);
                          onClose();
                        }}
                        className={`w-full p-3 rounded-xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
                            : 'bg-white hover:bg-blue-50 text-slate-800 border-blue-100 hover:border-blue-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`p-2 rounded-lg ${isCurrent ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>
                            <Monitor className="w-4 h-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-mono font-black ${isCurrent ? 'text-white' : 'text-blue-900'}`}>
                                {folder.code}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                isCurrent ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {folder.className}
                              </span>
                            </div>
                            <span className={`text-[10px] ${isCurrent ? 'text-blue-100' : 'text-slate-500'}`}>
                              {folder.totalStudents} học sinh • Phòng máy
                            </span>
                          </div>
                        </div>
                        <ArrowRight className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-white' : 'text-blue-400'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600">
            Hỗ trợ nhập danh sách học sinh từ tệp Excel/CSV chuẩn theo phân phối lớp học <strong>Môn Tin học</strong>.
          </div>
          <div className="flex items-center gap-2">
            {onOpenRoster && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRoster();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Mở Danh sách Học sinh & Nhập Excel</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
