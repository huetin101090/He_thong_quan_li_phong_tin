import React from 'react';
import { 
  TOP_DOWNLOADED_MATERIALS, 
  LATEST_MATERIALS, 
  LearningMaterial 
} from '../data/learningMaterials';
import { MaterialCard } from './MaterialCard';
import { Sparkles, TrendingUp, Clock, Filter, Layers } from 'lucide-react';

interface MaterialsSectionProps {
  searchTerm: string;
  selectedCategory: string;
  selectedGrade: 'all' | 3 | 4 | 5;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subj: 'all' | 'tin' | 'congnghe') => void;
  onPreviewMaterial: (mat: LearningMaterial) => void;
  onQuickDownload: (mat: LearningMaterial) => void;
  onAssignToComputers?: (mat: LearningMaterial) => void;
}

export const MaterialsSection: React.FC<MaterialsSectionProps> = ({
  searchTerm,
  selectedCategory,
  selectedGrade,
  selectedSubject = 'all',
  onSelectSubject,
  onPreviewMaterial,
  onQuickDownload,
  onAssignToComputers,
}) => {
  // Filter logic
  const filterList = (list: LearningMaterial[]) => {
    return list.filter((item) => {
      const matchSearch = 
        !searchTerm || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.author.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCat = 
        selectedCategory === 'all' || 
        item.category === selectedCategory;

      const matchGrade = 
        selectedGrade === 'all' || 
        item.grade === 'all' || 
        item.grade === selectedGrade;

      const matchSubject = 
        !selectedSubject || 
        selectedSubject === 'all' || 
        !item.subject || 
        item.subject === 'both' || 
        item.subject === selectedSubject;

      return matchSearch && matchCat && matchGrade && matchSubject;
    });
  };

  const topMaterials = filterList(TOP_DOWNLOADED_MATERIALS);
  const latestMaterials = filterList(LATEST_MATERIALS);

  return (
    <div className="space-y-6">
      
      {/* SUBJECT TOGGLE BANNER */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 border-2 border-indigo-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                Kho Học liệu Số: Môn Tin học & Môn Công nghệ
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Chương trình GDPT 2018
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Phụ trách: <strong>Cô Nguyễn Thị Huệ</strong> • Đầy đủ sách giáo khoa, bài giảng điện tử, video thực hành và phiếu bài tập
            </p>
          </div>
        </div>

        {onSelectSubject && (
          <div className="inline-flex items-center p-1 bg-white rounded-xl border border-slate-200 shadow-xs text-xs font-bold">
            <button
              onClick={() => onSelectSubject('all')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                selectedSubject === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📚 Tất cả
            </button>
            <button
              onClick={() => onSelectSubject('tin')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedSubject === 'tin' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              💻 Môn Tin học
            </button>
            <button
              onClick={() => onSelectSubject('congnghe')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                selectedSubject === 'congnghe' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              🛠️ Môn Công nghệ
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: HỌC LIỆU TẢI NHIỀU NHẤT */}
      <div className="space-y-3">
        {/* Label Badge matching wireframe: HỌC LIỆU TẢI NHIỀU NHẤT */}
        <div className="inline-block border-2 border-blue-600 rounded-xl px-4 py-1.5 bg-blue-50 shadow-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wider">
              HỌC LIỆU TẢI NHIỀU NHẤT {selectedSubject === 'congnghe' ? '(MÔN CÔNG NGHỆ)' : selectedSubject === 'tin' ? '(MÔN TIN HỌC)' : ''}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-600 text-white">
              {topMaterials.length} tài nguyên
            </span>
          </div>
        </div>

        {/* 4 columns x 2 rows grid (8 cards) */}
        {topMaterials.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border-2 border-dashed border-blue-200 text-xs text-slate-400">
            Không tìm thấy học liệu phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {topMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onPreview={onPreviewMaterial}
                onQuickDownload={onQuickDownload}
                onAssignToComputers={onAssignToComputers}
              />
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: HỌC LIỆU MỚI NHẤT */}
      <div className="space-y-3 pt-2">
        {/* Label Badge matching wireframe: HỌC LIỆU MỚI NHẤT */}
        <div className="inline-block border-2 border-blue-600 rounded-xl px-4 py-1.5 bg-blue-50 shadow-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wider">
              HỌC LIỆU MỚI NHẤT
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-600 text-white">
              {latestMaterials.length} mới cập nhật
            </span>
          </div>
        </div>

        {/* 4 columns x 2 rows grid (8 cards) */}
        {latestMaterials.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border-2 border-dashed border-blue-200 text-xs text-slate-400">
            Không tìm thấy học liệu mới phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {latestMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                onPreview={onPreviewMaterial}
                onQuickDownload={onQuickDownload}
                onAssignToComputers={onAssignToComputers}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
