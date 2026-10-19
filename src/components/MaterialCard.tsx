import React from 'react';
import { 
  Keyboard, 
  Palette, 
  Code2, 
  BookOpen, 
  Gamepad2, 
  Video, 
  FileText, 
  Download, 
  Star, 
  ExternalLink,
  Sparkles,
  Send
} from 'lucide-react';
import { LearningMaterial } from '../data/learningMaterials';

interface MaterialCardProps {
  material: LearningMaterial;
  onPreview: (material: LearningMaterial) => void;
  onQuickDownload: (material: LearningMaterial) => void;
  onAssignToComputers?: (material: LearningMaterial) => void;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onPreview,
  onQuickDownload,
  onAssignToComputers,
}) => {
  // Render icon based on type
  const renderIcon = () => {
    switch (material.iconType) {
      case 'keyboard':
        return <Keyboard className="w-6 h-6 text-orange-600" />;
      case 'paint':
        return <Palette className="w-6 h-6 text-pink-600" />;
      case 'code':
        return <Code2 className="w-6 h-6 text-indigo-600" />;
      case 'book':
        return <BookOpen className="w-6 h-6 text-blue-600" />;
      case 'game':
        return <Gamepad2 className="w-6 h-6 text-purple-600" />;
      case 'video':
        return <Video className="w-6 h-6 text-rose-600" />;
      default:
        return <FileText className="w-6 h-6 text-emerald-600" />;
    }
  };

  return (
    <div className="group bg-white rounded-xl border-2 border-blue-500 hover:border-blue-600 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between p-3 overflow-hidden relative">
      {/* Top badges */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
          {material.badge || (material.grade === 'all' ? 'Toàn trường' : `Khối ${material.grade}`)}
        </span>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
          {material.fileType}
        </span>
      </div>

      {/* Main Content */}
      <div className="space-y-1.5 mb-3">
        {/* Icon thumbnail */}
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
          {renderIcon()}
        </div>

        {/* Title */}
        <h4 
          onClick={() => onPreview(material)}
          className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition line-clamp-2 leading-snug cursor-pointer"
          title={material.title}
        >
          {material.title}
        </h4>

        {/* Description snippet */}
        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
          {material.description}
        </p>
      </div>

      {/* Meta details */}
      <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-amber-600 font-semibold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{material.rating}</span>
          </span>
          <span>{material.downloads.toLocaleString()} lượt tải</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1 pt-1">
          <button
            onClick={() => onQuickDownload(material)}
            className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition cursor-pointer"
            title="Tải học liệu về máy tính"
          >
            <Download className="w-3 h-3" />
            <span>Tải về</span>
          </button>

          <button
            onClick={() => onPreview(material)}
            className="flex items-center justify-center gap-1 py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[10px] transition cursor-pointer"
            title="Xem chi tiết và hướng dẫn sử dụng"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Xem</span>
          </button>
        </div>
      </div>
    </div>
  );
};
