import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Plus, 
  Heart, 
  Maximize2, 
  Calendar, 
  Users, 
  Sparkles, 
  Tag, 
  X, 
  Download, 
  Share2,
  Filter,
  CheckCircle2,
  Upload,
  Image as ImageIcon,
  Trash2,
  FileImage,
  Video,
  Play,
  Film,
  FileVideo
} from 'lucide-react';
import { LearningPhoto, INITIAL_LEARNING_PHOTOS } from '../data/learningPhotos';
import { UserSession } from '../types/assignments';
import { ClassInfo } from '../types/classroom';

interface LearningPhotosManagerProps {
  session: UserSession;
  classes: ClassInfo[];
  currentClassId: string;
}

function getEmbedYoutubeUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export const LearningPhotosManager: React.FC<LearningPhotosManagerProps> = ({
  session,
  classes,
  currentClassId,
}) => {
  const [photos, setPhotos] = useState<LearningPhoto[]>(() => {
    try {
      const saved = localStorage.getItem('smart_ict_learning_photos_v1');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load photos from storage', e);
    }
    return INITIAL_LEARNING_PHOTOS;
  });

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<'all' | 3 | 4 | 5>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<LearningPhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // New media form state
  const [mediaKind, setMediaKind] = useState<'image' | 'video'>('image');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'thuc_hanh' | 'scratch' | 'nhom' | 'hoi_thi' | 'ngoai_khoa'>('scratch');
  const [newClassId, setNewClassId] = useState(currentClassId || '5/4');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('Tin học, Thực hành máy');

  // File upload state & ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload');

  const handleMediaFileSelected = (file: File) => {
    const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|ogg)$/i.test(file.name);
    const isImg = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.name);

    if (!isVid && !isImg) {
      alert('Vui lòng chọn một tệp hình ảnh (PNG, JPG, WebP) hoặc video clip (MP4, WebM, MOV)!');
      return;
    }

    setSelectedFileName(file.name);

    if (isVid) {
      setMediaKind('video');
      // For video: if under 25MB, read as Data URL, else use Object URL for smooth playback
      if (file.size <= 25 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setVideoPreview(dataUrl);
          setNewVideoUrl(dataUrl);
        };
        reader.readAsDataURL(file);
      } else {
        const objUrl = URL.createObjectURL(file);
        setVideoPreview(objUrl);
        setNewVideoUrl(objUrl);
      }
    } else {
      setMediaKind('image');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setImagePreview(dataUrl);
        setNewImageUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const isTeacher = session.role === 'teacher';

  // Filtered photos & videos
  const filteredPhotos = photos.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (gradeFilter !== 'all' && p.grade !== gradeFilter) return false;
    if (classFilter !== 'all' && p.classId !== classFilter) return false;
    if (mediaTypeFilter === 'image' && p.mediaType === 'video') return false;
    if (mediaTypeFilter === 'video' && p.mediaType !== 'video') return false;
    return true;
  });

  // Handle Like
  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = photos.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p);
    setPhotos(updated);
    try {
      localStorage.setItem('smart_ict_learning_photos_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add New Photo or Video
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const classInfo = classes.find(c => c.id === newClassId);
    const grade = (classInfo?.grade || 5) as 3 | 4 | 5;
    const isVideo = mediaKind === 'video';

    const defaultImg = isVideo 
      ? 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop'
      : 'https://i.ibb.co/Q3YM47RF/c262267f-4f7d-4151-b6a8-3fa00211fa09.png';

    const newPhoto: LearningPhoto = {
      id: `${isVideo ? 'video' : 'photo'}-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      grade,
      classId: newClassId,
      mediaType: isVideo ? 'video' : 'image',
      imageUrl: newImageUrl.trim() || defaultImg,
      videoUrl: isVideo ? (newVideoUrl.trim() || newImageUrl.trim()) : undefined,
      date: new Date().toLocaleDateString('vi-VN'),
      description: newDescription.trim() || (isVideo 
        ? 'Video clip hoạt động học tập thực hành môn Tin học tại phòng máy 20 máy trạm Trường TH Đồng Dương.' 
        : 'Hình ảnh hoạt động học tập môn Tin học tại phòng máy vi tính Trường TH Đồng Dương.'),
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
      likes: 1,
    };

    const updated = [newPhoto, ...photos];
    setPhotos(updated);
    try {
      localStorage.setItem('smart_ict_learning_photos_v1', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setIsUploadOpen(false);
    setNewTitle('');
    setNewImageUrl('');
    setNewVideoUrl('');
    setImagePreview(null);
    setVideoPreview(null);
    setSelectedFileName('');
    setNewDescription('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-blue-950 uppercase tracking-tight flex items-center gap-2">
              <span>KHO ẢNH & VIDEO HOẠT ĐỘNG PHÒNG MÁY TIN HỌC</span>
              <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200 uppercase font-bold">
                Đa phương tiện
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Kho tư liệu trực quan: Ảnh chụp & Video clip giờ thực hành 20 máy, lập trình Scratch, làm việc nhóm và các hội thi
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isTeacher && (
            <button
              onClick={() => {
                setImagePreview(null);
                setVideoPreview(null);
                setSelectedFileName('');
                setNewImageUrl('');
                setNewVideoUrl('');
                setNewTitle('');
                setNewDescription('');
                setIsUploadOpen(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tải ảnh hoặc video clip mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Media Type Filter (Ảnh vs Video) */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200">
          <button
            onClick={() => setMediaTypeFilter('all')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
              mediaTypeFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({photos.length})
          </button>
          <button
            onClick={() => setMediaTypeFilter('image')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
              mediaTypeFilter === 'image'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Ảnh ({photos.filter(p => p.mediaType !== 'video').length})</span>
          </button>
          <button
            onClick={() => setMediaTypeFilter('video')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
              mediaTypeFilter === 'video'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Video ({photos.filter(p => p.mediaType === 'video').length})</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-bold text-slate-500 text-[11px] mr-1">Chủ đề:</span>
          {[
            { id: 'all', label: 'Tất cả chủ đề' },
            { id: 'scratch', label: 'Lập trình Scratch' },
            { id: 'thuc_hanh', label: 'Thực hành 20 máy' },
            { id: 'nhom', label: 'Làm việc nhóm đôi' },
            { id: 'hoi_thi', label: 'Hội thi Tin học trẻ' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-[11px] ${
                categoryFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Class Filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500 text-[11px]">Lớp:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả các lớp (9 lớp)</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs">
          Chưa có hình ảnh hoặc video nào phù hợp với bộ lọc hiện tại. Thầy cô có thể nhấp "Tải ảnh hoặc video clip mới" để bổ sung!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => {
            const isVid = photo.mediaType === 'video';
            return (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-500 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Media Preview Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-900">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Play Button Overlay for Videos */}
                  {isVid && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="w-12 h-12 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play className="w-5 h-5 fill-white ml-0.5" />
                      </div>
                    </div>
                  )}
                  
                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white shadow-xs">
                      Lớp {photo.classId}
                    </span>
                    {isVid ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                        <Play className="w-2.5 h-2.5 fill-white" /> Video
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-700 backdrop-blur-xs shadow-xs">
                        {photo.date}
                      </span>
                    )}
                  </div>

                  {/* Top Right Zoom Icon */}
                  <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center backdrop-blur-xs">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Bottom gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Meta & Title */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-blue-700 transition line-clamp-2 leading-snug">
                      {photo.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {photo.description}
                    </p>
                  </div>

                  {/* Tags and Like Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {photo.tags.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">
                          #{t}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={(e) => handleLike(photo.id, e)}
                      className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full transition cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                      <span>{photo.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIGHTBOX MODAL: Xem ảnh hoặc Phát video chi tiết */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 border border-white/30">
                  Lớp {selectedPhoto.classId}
                </span>
                {selectedPhoto.mediaType === 'video' ? (
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white flex items-center gap-1">
                    <Play className="w-3 h-3 fill-white" /> Đang phát Video
                  </span>
                ) : (
                  <span className="text-xs text-blue-100">{selectedPhoto.date}</span>
                )}
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 aspect-[16/10] sm:aspect-[16/9] flex items-center justify-center">
                {selectedPhoto.mediaType === 'video' ? (
                  getEmbedYoutubeUrl(selectedPhoto.videoUrl || selectedPhoto.imageUrl) ? (
                    <iframe
                      src={getEmbedYoutubeUrl(selectedPhoto.videoUrl || selectedPhoto.imageUrl)!}
                      title={selectedPhoto.title}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={selectedPhoto.videoUrl || selectedPhoto.imageUrl}
                      controls
                      autoPlay
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <img
                    src={selectedPhoto.imageUrl}
                    alt={selectedPhoto.title}
                    className="w-full h-full object-contain bg-slate-900"
                  />
                )}
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {selectedPhoto.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  {selectedPhoto.description}
                </p>
              </div>

              {/* Tags & Action row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  {selectedPhoto.tags.map((t, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">
                      #{t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleLike(selectedPhoto.id, e)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition cursor-pointer"
                  >
                    <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                    <span>Thích ({selectedPhoto.likes})</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* UPLOAD MODAL (HỖ TRỢ CẢ ẢNH VÀ VIDEO) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Tải ảnh hoặc video hoạt động học tập mới</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-3 text-xs">
              {/* Loại đa phương tiện: Ảnh vs Video */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Loại tệp tải lên: *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaKind('image');
                      setImagePreview(null);
                      setVideoPreview(null);
                      setSelectedFileName('');
                    }}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      mediaKind === 'image'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Ảnh chụp (PNG, JPG)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaKind('video');
                      setImagePreview(null);
                      setVideoPreview(null);
                      setSelectedFileName('');
                    }}
                    className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      mediaKind === 'video'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Video clip (MP4, WebM)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  {mediaKind === 'video' ? 'Tiêu đề video clip *' : 'Tiêu đề hình ảnh / Hoạt động *'}
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder={mediaKind === 'video' ? 'Ví dụ: Video các bạn lớp 5.4 hoàn thành game Scratch bắt chuột...' : 'Ví dụ: Giờ học lập trình Scratch 3.0 lớp 5.4...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chủ đề hoạt động</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                  >
                    <option value="scratch">Lập trình Scratch</option>
                    <option value="thuc_hanh">Thực hành 20 máy</option>
                    <option value="nhom">Làm việc nhóm đôi</option>
                    <option value="hoi_thi">Hội thi Tin học trẻ</option>
                    <option value="ngoai_khoa">Hoạt động ngoại khóa</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lớp học</label>
                  <select
                    value={newClassId}
                    onChange={(e) => setNewClassId(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tùy chọn Tải tệp lên từ máy hoặc Dùng URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 block">
                    {mediaKind === 'video' ? 'Tệp Video clip *' : 'Hình ảnh hoạt động *'}
                  </label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setUploadMethod('upload')}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${uploadMethod === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      Tải tệp từ máy
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMethod('url')}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${uploadMethod === 'url' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      {mediaKind === 'video' ? 'Link YouTube/URL' : 'Dùng URL'}
                    </button>
                  </div>
                </div>

                {uploadMethod === 'upload' ? (
                  <div>
                    {/* Hidden Native File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={mediaKind === 'video' ? 'video/mp4,video/webm,video/ogg,video/quicktime' : 'image/png,image/jpeg,image/jpg,image/webp'}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleMediaFileSelected(file);
                      }}
                    />

                    {/* Preview Area */}
                    {mediaKind === 'video' && videoPreview ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-rose-400 bg-black p-2 group">
                        <video
                          src={videoPreview}
                          controls
                          className="w-full h-44 rounded-lg bg-black object-contain"
                        />
                        <div className="mt-2 flex items-center justify-between px-1 bg-white p-1 rounded-lg">
                          <span className="text-[11px] font-medium text-slate-700 truncate max-w-[200px]">
                            🎬 {selectedFileName || 'Video đã chọn'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 text-[11px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg cursor-pointer"
                            >
                              Chọn video khác
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setVideoPreview(null);
                                setSelectedFileName('');
                                setNewVideoUrl('');
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Xóa video này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : mediaKind === 'image' && imagePreview ? (
                      <div className="relative rounded-xl overflow-hidden border-2 border-blue-400 bg-slate-50 p-2 group">
                        <img
                          src={imagePreview}
                          alt="Xem trước ảnh tải lên"
                          className="w-full h-44 object-cover rounded-lg"
                        />
                        <div className="mt-2 flex items-center justify-between px-1">
                          <span className="text-[11px] font-medium text-slate-600 truncate max-w-[200px]">
                            📷 {selectedFileName || 'Ảnh đã chọn'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg cursor-pointer"
                            >
                              Chọn ảnh khác
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null);
                                setSelectedFileName('');
                                setNewImageUrl('');
                              }}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Xóa ảnh này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleMediaFileSelected(file);
                        }}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
                          isDragging 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-1.5 ${
                          mediaKind === 'video' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {mediaKind === 'video' ? <Video className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
                        </div>
                        <p className="font-bold text-slate-800 text-xs">
                          {mediaKind === 'video' 
                            ? 'Nhấp để tải video clip lên từ máy tính / điện thoại' 
                            : 'Nhấp để tải ảnh lên từ máy tính / điện thoại'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {mediaKind === 'video'
                            ? 'Hoặc kéo thả file video vào đây (Hỗ trợ MP4, WebM, MOV)'
                            : 'Hoặc kéo thả file ảnh vào đây (Hỗ trợ PNG, JPG, WebP)'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <input
                      type="url"
                      value={mediaKind === 'video' ? (newVideoUrl || newImageUrl) : newImageUrl}
                      onChange={(e) => {
                        if (mediaKind === 'video') {
                          setNewVideoUrl(e.target.value);
                          setNewImageUrl(e.target.value);
                        } else {
                          setNewImageUrl(e.target.value);
                        }
                      }}
                      placeholder={mediaKind === 'video' 
                        ? 'https://www.youtube.com/watch?v=... hoặc link video MP4' 
                        : 'https://... (URL hình ảnh trực tuyến)'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      {mediaKind === 'video'
                        ? 'Hỗ trợ dán đường link video YouTube trực tiếp hoặc link video MP4 trên Google Drive / Cloud.'
                        : 'Dán đường link ảnh trực tuyến nếu bạn đã tải ảnh lên máy chủ lưu trữ hoặc Google Drive/Imgur.'}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả nội dung</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả không khí học tập, sản phẩm thực hành các em học sinh làm được..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thẻ từ khóa (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder={mediaKind === 'video' ? 'Video thực hành, Scratch 3.0, Lớp 5.4...' : 'Ảnh đẹp, Scratch 3.0, Lớp 5.4...'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-xl font-bold shadow-xs cursor-pointer text-white ${
                    mediaKind === 'video' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {mediaKind === 'video' ? 'Lưu video hoạt động' : 'Lưu ảnh hoạt động'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
