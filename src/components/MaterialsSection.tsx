import React from 'react';
import { 
  TOP_DOWNLOADED_MATERIALS, 
  LATEST_MATERIALS, 
  LearningMaterial 
} from '../data/learningMaterials';
import { MaterialCard } from './MaterialCard';
import { Sparkles, TrendingUp, Clock, Filter, Layers, Monitor } from 'lucide-react';

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

      // Filter strictly for Môn Tin học (exclude congnghe)
      if (item.subject === 'congnghe') return false;
      const matchSubject = !item.subject || item.subject === 'tin' || item.subject === 'both';

      return matchSearch && matchCat && matchGrade && matchSubject;
    });
  };

  const topMaterials = filterList(TOP_DOWNLOADED_MATERIALS);
  const latestMaterials = filterList(LATEST_MATERIALS);

  return (
    <div className="space-y-6">
      
      {/* SUBJECT BANNER (MÔN TIN HỌC) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-tight">
                Kho Học liệu Số: Môn Tin học (Phòng máy tính)
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                Chương trình GDPT 2018
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Phụ trách: <strong>Cô Nguyễn Thị Huệ</strong> • Đầy đủ sách giáo khoa, phần mềm luyện gõ, bài tập Scratch, video thực hành
            </p>
          </div>
        </div>

        {/* Active Subject Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white shadow-xs text-xs font-bold shrink-0">
          <Monitor className="w-4 h-4 text-cyan-200" />
          <span>MÔN TIN HỌC (9 Lớp)</span>
        </div>
      </div>

      {/* SECTION 1: HỌC LIỆU TẢI NHIỀU NHẤT */}
      <div className="space-y-3">
        {/* Label Badge: HỌC LIỆU TẢI NHIỀU NHẤT (MÔN TIN HỌC) */}
        <div className="inline-block border-2 border-blue-600 rounded-xl px-4 py-1.5 bg-blue-50 shadow-xs">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wider">
              HỌC LIỆU TẢI NHIỀU NHẤT (MÔN TIN HỌC)
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
