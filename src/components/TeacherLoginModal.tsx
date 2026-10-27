import React, { useState } from 'react';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  X, 
  ShieldCheck, 
  KeyRound, 
  AlertCircle, 
  UserCheck, 
  School, 
  Monitor,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import { loginTeacher } from '../services/studentAccountService';

interface TeacherLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teacherInfo: { name: string; role: 'teacher' }) => void;
  defaultAdmin?: boolean;
}

export const TeacherLoginModal: React.FC<TeacherLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAdmin = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = password.trim();
    if (!clean) {
      setError('Vui lòng nhập mật khẩu tài khoản Giáo viên!');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loginTeacher(clean);
      if (result.success) {
        const teacherName = defaultAdmin 
          ? 'Quản trị viên (Admin)' 
          : 'Cô Nguyễn Thị Huệ (GV Phụ trách Bộ môn Tin học)';
        onSuccess({ name: teacherName, role: 'teacher' });
        setPassword('');
        setError(null);
        onClose();
      } else {
        setError(result.error || 'Mật khẩu Giáo viên không chính xác. Vui lòng kiểm tra lại!');
      }
    } catch (err: any) {
      setError(err?.message || 'Lỗi kết nối khi xác thực giáo viên.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border-2 border-blue-500/30 w-full max-w-md overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white">
              <School className="w-3 h-3" />
              TH Đồng Dương 2
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
              <Sparkles className="w-3 h-3" />
              Môn Tin học
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight flex items-center gap-2 text-white">
            <KeyRound className="w-5 h-5 text-amber-300" />
            <span>Đăng nhập Giáo viên Quản lý</span>
          </h2>
          <p className="text-xs text-blue-200 mt-0.5 font-medium">
            Xác thực tài khoản để kích hoạt quyền tạo bài tập, chấm điểm và cấp mã PIN
          </p>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Teacher Account Information Card (Yêu cầu: Hiển thị tài khoản đăng nhập của GV) */}
          <div className="bg-blue-50/80 rounded-2xl p-3.5 border border-blue-200 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Thông tin tài khoản Giáo viên phụ trách</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Giáo viên:</span>
                <span className="font-extrabold text-blue-950 text-xs">Cô Nguyễn Thị Huệ</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-2xs">
                <span className="text-[10px] text-slate-500 block">Tài khoản / Email:</span>
                <span className="font-bold text-slate-800 text-xs truncate block" title="huetin90@gmail.com">
                  huetin90@gmail.com
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-blue-100 shadow-2xs col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block">Phân môn & Phạm vi:</span>
                  <span className="font-bold text-indigo-900 text-xs">Môn Tin học • 9 Lớp (Khối 3, 4, 5)</span>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">
                  20 Máy trạm
                </span>
              </div>
            </div>
          </div>

          {/* Warning / Explanation for Guests */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Phân quyền an toàn:</strong> Khách và học sinh chỉ được <strong>xem học liệu</strong> và sơ đồ phòng máy. Thao tác <strong>tạo bài tập, giao bài và cấp mã PIN học sinh</strong> bắt buộc phải xác thực mật khẩu Giáo viên.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Mật khẩu Giáo viên Quản trị:</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (Mặc định: DongDuong@2026)
                </span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Nhập mật khẩu Giáo viên..."
                  className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy / Xem
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="w-2/3 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-cyan-200" />
                    <span>ĐĂNG NHẬP QUẢN LÝ</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-2.5 text-center text-[10px] text-slate-500 font-medium">
          Trường Tiểu học Đồng Dương 2 • Bản quyền phân hệ Môn Tin học 2026
        </div>
      </div>
    </div>
  );
};
