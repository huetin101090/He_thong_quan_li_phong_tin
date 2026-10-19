import React, { useState } from 'react';
import { ClassInfo } from '../types/classroom';
import { CLASSES_DATA, isSameClass } from '../data/initialData';
import { School, Check } from 'lucide-react';

interface ClassSelectorProps {
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subject: 'all' | 'tin' | 'congnghe') => void;
  onOpen18FoldersModal?: () => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  selectedClassId,
  onSelectClass,
  selectedSubject = 'all',
  onSelectSubject,
  onOpen18FoldersModal,
}) => {
  const [gradeFilter, setGradeFilter] = useState<'all' | 3 | 4 | 5>('all');
  
  // Use parent subject state if provided
  const activeSubject = selectedSubject;
  const handleSubjectChange = (subj: 'all' | 'tin' | 'congnghe') => {
    if (onSelectSubject) {
      onSelectSubject(subj);
    }
  };

  const filteredClasses = gradeFilter === 'all' 
    ? CLASSES_DATA 
    : CLASSES_DATA.filter(c => c.grade === gradeFilter);

  const currentCls = CLASSES_DATA.find(c => isSameClass(c.id, selectedClassId)) || CLASSES_DATA[0];

  const handleGradeFilterClick = (filter: 'all' | 3 | 4 | 5) => {
    setGradeFilter(filter);
    if (filter !== 'all') {
      const cls = CLASSES_DATA.find(c => isSameClass(c.id, selectedClassId));
      if (!cls || cls.grade !== filter) {
        const firstClsOfGrade = CLASSES_DATA.find(c => c.grade === filter);
        if (firstClsOfGrade) {
          onSelectClass(firstClsOfGrade.id);
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-3 sm:p-4 space-y-3">
      {/* Top Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shadow-xs">
            <School className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                9 Lớp học theo Khối & Phân môn
              </h2>
              <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 font-bold px-2 py-0.5 rounded-full">
                249 học sinh • 20 máy
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Khối 3 (3.4, 3.5, 3.6) • Khối 4 (4.3, 4.4, 4.5) • Khối 5 (5.4, 5.5, 5.6)
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpen18FoldersModal && (
            <button
              type="button"
              onClick={onOpen18FoldersModal}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg shadow-xs transition cursor-pointer flex items-center gap-1"
              title="Xem danh mục 18 thư mục lớp học Cô Huệ"
            >
              <span>📁 18 Thư mục Cô Huệ</span>
            </button>
          )}

          {/* Subject Filter */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
            <button
              onClick={() => handleSubjectChange('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                activeSubject === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cả 2 môn (Tin & CN)
            </button>
            <button
              onClick={() => handleSubjectChange('tin')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                activeSubject === 'tin'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              💻 Tin học (_TIN)
            </button>
            <button
              onClick={() => handleSubjectChange('congnghe')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                activeSubject === 'congnghe'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              🛠️ Công nghệ (_CN)
            </button>
          </div>

          {/* Grade tabs */}
          <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
            <button
              onClick={() => handleGradeFilterClick('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                gradeFilter === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả khối
            </button>
            <button
              onClick={() => handleGradeFilterClick(3)}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                gradeFilter === 3
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 3
            </button>
            <button
              onClick={() => handleGradeFilterClick(4)}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                gradeFilter === 4
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 4
            </button>
            <button
              onClick={() => handleGradeFilterClick(5)}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                gradeFilter === 5
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối 5
            </button>
          </div>
        </div>
      </div>

      {/* Class Pills Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2">
        {filteredClasses.map((cls) => {
          const isSelected = isSameClass(cls.id, selectedClassId);
          return (
            <button
              key={cls.id}
              onClick={() => onSelectClass(cls.id)}
              className={`relative flex flex-col items-center justify-between py-2 px-1.5 rounded-xl text-center border transition-all duration-200 cursor-pointer min-h-[82px] ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300 ring-offset-1'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              {isSelected && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full p-0.5 shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              
              <div className="w-full">
                <span className={`text-base font-black tracking-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                  {cls.name}
                </span>
                
                <div className="mt-0.5 flex items-center justify-center gap-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-700 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {cls.totalStudents} HS
                  </span>
                </div>
              </div>

              {/* Exact Subject Folder Tags from User Files */}
              <div className="w-full mt-1.5 space-y-0.5">
                {(activeSubject === 'all' || activeSubject === 'tin') && (
                  <span className={`text-[9px] font-bold block truncate rounded px-1 py-0.2 ${
                    isSelected ? 'bg-blue-800/80 text-blue-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {cls.tinHocFolder}
                  </span>
                )}
                {(activeSubject === 'all' || activeSubject === 'congnghe') && (
                  <span className={`text-[9px] font-bold block truncate rounded px-1 py-0.2 ${
                    isSelected ? 'bg-emerald-800/80 text-emerald-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  }`}>
                    {cls.congNgheFolder}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Selected Class Context Bar */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Đang chọn:</span>
          <span className="font-black text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded text-xs">
            {currentCls.name} (Khối {currentCls.grade})
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-600">
            Sĩ số: <strong>{currentCls.totalStudents} học sinh</strong>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-600">
            GVCN: <strong>{currentCls.homeroomTeacher}</strong>
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Khớp thư mục nhập liệu:</span>
          <span className="font-mono text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
            {currentCls.tinHocFolder}
          </span>
          <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
            {currentCls.congNgheFolder}
          </span>
        </div>
      </div>
    </div>
  );
};
