import React, { useState } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import { LearningPhoto, INITIAL_LEARNING_PHOTOS } from '../data/learningPhotos';
import { UserSession } from '../types/assignments';
import { ClassInfo } from '../types/classroom';

interface LearningPhotosManagerProps {
  session: UserSession;
  classes: ClassInfo[];
  currentClassId: string;
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
  const [selectedPhoto, setSelectedPhoto] = useState<LearningPhoto | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // New photo form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'thuc_hanh' | 'scratch' | 'nhom' | 'hoi_thi' | 'ngoai_khoa'>('scratch');
  const [newClassId, setNewClassId] = useState(currentClassId || '5/4');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTags, setNewTags] = useState('Tin học, Thực hành máy');

  const isTeacher = session.role === 'teacher';

  // Filtered photos
  const filteredPhotos = photos.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (gradeFilter !== 'all' && p.grade !== gradeFilter) return false;
    if (classFilter !== 'all' && p.classId !== classFilter) return false;
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

  // Handle Add New Photo
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const classInfo = classes.find(c => c.id === newClassId);
    const grade = (classInfo?.grade || 5) as 3 | 4 | 5;

    const newPhoto: LearningPhoto = {
      id: `photo-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      grade,
      classId: newClassId,
      imageUrl: newImageUrl.trim() || 'https://i.ibb.co/Q3YM47RF/c262267f-4f7d-4151-b6a8-3fa00211fa09.png',
      date: new Date().toLocaleDateString('vi-VN'),
      description: newDescription.trim() || 'Hình ảnh hoạt động học tập môn Tin học tại phòng máy vi tính Trường TH Đồng Dương.',
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
    setNewDescription('');
  };

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-sm">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-blue-950 uppercase tracking-tight">
              HÌNH ẢNH HOẠT ĐỘNG DẠY & HỌC TIN HỌC
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Kho tư liệu hình ảnh trực quan: Giờ thực hành 20 máy, lập trình Scratch, làm việc nhóm và các hội thi
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isTeacher && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tải ảnh hoạt động mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-bold text-slate-500 text-[11px] mr-1">Chủ đề:</span>
          {[
            { id: 'all', label: 'Tất cả ảnh' },
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
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
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
            <option value="5/4">Lớp 5/4</option>
            <option value="5/5">Lớp 5/5</option>
            <option value="5/6">Lớp 5/6</option>
            <option value="4/3">Lớp 4/3</option>
            <option value="4/4">Lớp 4/4</option>
            <option value="3/4">Lớp 3/4</option>
          </select>
        </div>
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs">
          Chưa có hình ảnh nào phù hợp với bộ lọc hiện tại. Thầy cô có thể nhấp "Tải ảnh hoạt động mới" để bổ sung!
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                
                {/* Top Badge: Class */}
                <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white shadow-xs">
                    Lớp {photo.classId}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-slate-700 backdrop-blur-xs shadow-xs">
                    {photo.date}
                  </span>
                </div>

                {/* Top Right Zoom Icon */}
                <div className="absolute top-2.5 right-2.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-slate-900/70 text-white flex items-center justify-center backdrop-blur-xs">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Bottom gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Photo Meta & Title */}
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
          ))}
        </div>
      )}

      {/* LIGHTBOX MODAL: Xem ảnh chi tiết */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-white/20 border border-white/30">
                  Lớp {selectedPhoto.classId}
                </span>
                <span className="text-xs text-blue-100">{selectedPhoto.date}</span>
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
              <div className="rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 aspect-[16/10] sm:aspect-[16/9]">
                <img
                  src={selectedPhoto.imageUrl}
                  alt={selectedPhoto.title}
                  className="w-full h-full object-cover"
                />
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

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black text-slate-900">Tải ảnh hoạt động học tập mới</h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề ảnh / Hoạt động *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Giờ học lập trình Scratch 3.0 lớp 5/4..."
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

              <div>
                <label className="font-bold text-slate-700 block mb-1">Đường dẫn ảnh (URL hoặc ảnh mẫu)</label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://... (để trống sẽ dùng ảnh phòng máy chuẩn)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mô tả hoạt động</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả không khí học tập, sản phẩm các em làm được..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Thẻ từ khóa (cách nhau bởi dấu phẩy)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="Scratch 3.0, Lớp 5/4, Phòng máy..."
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Lưu ảnh hoạt động
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
