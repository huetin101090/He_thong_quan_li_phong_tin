import React from 'react';
import { 
  Calendar, 
  Clock, 
  Sun, 
  Moon, 
  Sparkles, 
  Save, 
  RotateCcw, 
  BookOpen,
  CheckCircle,
  FileCheck
} from 'lucide-react';

interface PeriodSelectorProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  session: 'morning' | 'afternoon';
  onSessionChange: (session: 'morning' | 'afternoon') => void;
  periodNumber: number;
  onPeriodChange: (period: number) => void;
  lessonName: string;
  onLessonNameChange: (title: string) => void;
  onAutoAssign: () => void;
  onSaveAssignment: () => void;
  onClearAssignment: () => void;
  isSaved: boolean;
  isSaving: boolean;
  lastUpdated?: string;
}

const PERIOD_TIMES: Record<'morning' | 'afternoon', Record<number, string>> = {
  morning: {
    1: '07:30 - 08:05',
    2: '08:15 - 08:50',
    3: '09:05 - 09:40',
    4: '09:50 - 10:25',
    5: '10:35 - 11:10',
  },
  afternoon: {
    1: '13:30 - 14:05',
    2: '14:15 - 14:50',
    3: '15:05 - 15:40',
    4: '15:50 - 16:25',
    5: '16:35 - 17:10',
  },
};

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  currentDate,
  onDateChange,
  session,
  onSessionChange,
  periodNumber,
  onPeriodChange,
  lessonName,
  onLessonNameChange,
  onAutoAssign,
  onSaveAssignment,
  onClearAssignment,
  isSaved,
  isSaving,
  lastUpdated,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-3 sm:p-4 space-y-3">
      {/* Top row: Date & Session & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Date and Session Picker */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-4 h-4 text-blue-600" />
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer"
            />
          </div>

          {/* Session Switcher (Sáng / Chiều) */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs">
            <button
              onClick={() => onSessionChange('morning')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                session === 'morning'
                  ? 'bg-amber-500 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Sáng</span>
            </button>
            <button
              onClick={() => onSessionChange('afternoon')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition ${
                session === 'afternoon'
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Chiều</span>
            </button>
          </div>
        </div>

        {/* Action Buttons: Auto-Assign & Save */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto-Assign Button (Sparkles, high emphasis) */}
          <button
            onClick={onAutoAssign}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer"
            title="Tự động phân công: 1 học sinh/máy trước, phần còn lại ghép đôi"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-spin-slow" />
            <span>Phân công tự động AI</span>
          </button>

          {/* Save Button */}
          <button
            onClick={onSaveAssignment}
            disabled={isSaving}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold text-xs shadow-sm transition active:scale-95 cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="Lưu lịch sử phân công cho lớp và tiết học này vào cơ sở dữ liệu"
          >
            {isSaved ? (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-200" />
                <span>Đã lưu vào CSDL</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-blue-200" />
                <span>Lưu phân công</span>
              </>
            )}
          </button>

          {/* Clear / Reset Button */}
          <button
            onClick={onClearAssignment}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 font-medium text-xs transition cursor-pointer"
            title="Xóa trống tất cả chỗ ngồi của tiết này để xếp lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Xóa chỗ</span>
          </button>
        </div>
      </div>

      {/* Middle row: 5 Period Buttons (Tiết 1 -> Tiết 5) with timeframes */}
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((p) => {
          const isCurrent = periodNumber === p;
          const time = PERIOD_TIMES[session][p];
          return (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition text-center cursor-pointer ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-200 font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1">
                <Clock className={`w-3 h-3 ${isCurrent ? 'text-indigo-200' : 'text-slate-400'}`} />
                <span className="text-xs sm:text-sm font-bold">Tiết {p}</span>
              </div>
              <span className={`text-[10px] mt-0.5 ${isCurrent ? 'text-indigo-100' : 'text-slate-400'}`}>
                {time}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom row: Lesson Title input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium whitespace-nowrap">
          <BookOpen className="w-3.5 h-3.5 text-blue-600" />
          <span>Nội dung bài học:</span>
        </div>
        <input
          type="text"
          value={lessonName}
          onChange={(e) => onLessonNameChange(e.target.value)}
          placeholder="Nhập tên bài học (VD: Luyện tập chuột, Chèn hình trong Word, Khám phá Scratch...)"
          className="flex-1 bg-slate-50 hover:bg-white focus:bg-white text-xs text-slate-800 border border-slate-200 focus:border-blue-500 rounded-lg px-3 py-1.5 outline-none transition"
        />
        {lastUpdated && (
          <div className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1 self-center">
            <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Lần lưu gần nhất: {lastUpdated}</span>
          </div>
        )}
      </div>
    </div>
  );
};
