import React from 'react';
import { 
  X, 
  Download, 
  Star, 
  Monitor, 
  FileCheck, 
  Calendar, 
  User, 
  Layers, 
  Sparkles,
  Check
} from 'lucide-react';
import { LearningMaterial } from '../data/learningMaterials';

interface MaterialPreviewModalProps {
  material: LearningMaterial | null;
  onClose: () => void;
  onDownload: (mat: LearningMaterial) => void;
  onDeployToComputers?: (mat: LearningMaterial) => void;
  currentClassName: string;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  material,
  onClose,
  onDownload,
  onDeployToComputers,
  currentClassName,
}) => {
  if (!material) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/20 border border-white/30">
              {material.fileType}
            </span>
            <span className="text-xs font-bold text-blue-100">
              {material.grade === 'all' ? 'Dành cho tất cả các khối' : `Dành cho Khối ${material.grade}`}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          <div>
            <h3 className="text-base font-black text-slate-900 leading-snug">
              {material.title}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                Tác giả: <strong>{material.author}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Ngày: {material.dateAdded}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {material.rating} ({material.downloads.toLocaleString()} lượt tải)
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
            <h4 className="font-bold text-blue-950 mb-1">Mô tả và hướng dẫn sử dụng:</h4>
            <p className="leading-relaxed text-slate-700">
              {material.description}
            </p>
          </div>

          {/* Details list */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Dung lượng tệp:</span>
              <span className="font-bold text-slate-800">{material.size}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-slate-400 block text-[10px]">Tương thích phòng máy:</span>
              <span className="font-bold text-emerald-700">✓ 20 máy tính Windows</span>
            </div>
          </div>

          {/* Interactive Classroom Integration Callout */}
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-950 flex items-start gap-2.5">
            <Monitor className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Đồng bộ với {currentClassName}:</span>
              <p className="text-[11px] text-indigo-800 mt-0.5">
                Giáo viên có thể đồng bộ tài liệu này tới màn hình của 20 máy tính trong tiết thực hành đang chọn.
              </p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => onDeployToComputers?.(material)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Đồng bộ tới 20 máy ({currentClassName})</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(material)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file về máy ({material.size})</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
