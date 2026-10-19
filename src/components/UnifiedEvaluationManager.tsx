import React, { useState } from 'react';
import { UserSession } from '../types/assignments';
import { Student, ClassInfo } from '../types/classroom';
import { MonthlyEvaluationManager } from './MonthlyEvaluationManager';
import { SemesterEvaluationManager } from './SemesterEvaluationManager';
import { 
  Award, 
  CalendarCheck, 
  Sparkles, 
  CheckCircle2, 
  Layers,
  FileCheck,
  TrendingUp,
  School
} from 'lucide-react';

interface UnifiedEvaluationManagerProps {
  session: UserSession;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string;
  initialSubTab?: 'monthly' | 'year_end';
}

export const UnifiedEvaluationManager: React.FC<UnifiedEvaluationManagerProps> = ({
  session,
  classes,
  students,
  currentClassId,
  initialSubTab = 'monthly',
}) => {
  const [subTab, setSubTab] = useState<'monthly' | 'year_end'>(initialSubTab);

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-blue-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-blue-700" />
                HỆ THỐNG ĐÁNH GIÁ & NHẬN XÉT HỌC SINH
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Thông tư 27/2020/TT-BGDĐT
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
              ĐÁNH GIÁ THEO THÁNG & ĐÁNH GIÁ NHẬN XÉT CUỐI NĂM
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tổng hợp điểm lý thuyết, kết quả bài thực hành/sản phẩm số, theo dõi chuyên cần và tự động gợi ý nhận xét dự thảo với Trợ lý AI.
            </p>
          </div>

          {/* Sub-tab Switcher Buttons */}
          <div className="flex items-center gap-1 p-1 bg-blue-50 border border-blue-200 rounded-xl shrink-0">
            <button
              onClick={() => setSubTab('monthly')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                subTab === 'monthly'
                  ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-700'
                  : 'text-blue-900 hover:bg-blue-100/80 hover:text-blue-950 font-bold'
              }`}
            >
              <CalendarCheck className={`w-4 h-4 ${subTab === 'monthly' ? 'text-white' : 'text-blue-600'}`} />
              <span>ĐÁNH GIÁ THEO THÁNG</span>
            </button>

            <button
              onClick={() => setSubTab('year_end')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                subTab === 'year_end'
                  ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-700'
                  : 'text-blue-900 hover:bg-blue-100/80 hover:text-blue-950 font-bold'
              }`}
            >
              <Award className={`w-4 h-4 ${subTab === 'year_end' ? 'text-white' : 'text-amber-500'}`} />
              <span>ĐÁNH GIÁ NHẬN XÉT CUỐI NĂM</span>
            </button>
          </div>
        </div>

        {/* Quick status bar */}
        <div className="pt-2.5 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-blue-800 font-bold">Chế độ xem:</span>
            <span className="px-2 py-0.5 bg-slate-100 rounded-md font-semibold text-slate-800 border border-slate-200">
              {subTab === 'monthly' ? 'Sổ theo dõi & Nhận xét thường xuyên theo Tháng' : 'Bảng tổng hợp Đánh giá Định kỳ Cuối năm / Học kỳ'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>• Học sinh: 249 em (9 lớp)</span>
            <span>• Thang đánh giá: T (Tốt) - H (Hoàn thành) - C (Chưa hoàn thành)</span>
            <span>• Xuất file: Excel & In sổ theo dõi</span>
          </div>
        </div>
      </div>

      {/* Render Sub-Component */}
      {subTab === 'monthly' ? (
        <MonthlyEvaluationManager
          session={session}
          classes={classes}
          students={students}
          currentClassId={currentClassId}
        />
      ) : (
        <SemesterEvaluationManager
          session={session}
          classes={classes}
          students={students}
          currentClassId={currentClassId}
        />
      )}
    </div>
  );
};
