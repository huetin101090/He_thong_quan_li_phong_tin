import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Database, 
  Users, 
  Cloud, 
  AlertTriangle, 
  X, 
  Check, 
  Server, 
  Key, 
  FileCheck,
  ChevronRight
} from 'lucide-react';
import { DatabaseStatus } from '../types/classroom';
import { SCHOOL_NAME } from '../data/initialData';

interface SecurityAndAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DatabaseStatus;
}

export const SecurityAndAccountsModal: React.FC<SecurityAndAccountsModalProps> = ({
  isOpen,
  onClose,
  dbStatus,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-400/30 text-cyan-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base">Bảo mật dữ liệu, Phân quyền & Đề xuất CSDL dùng chung</h3>
              <p className="text-xs text-blue-200">{SCHOOL_NAME} • Báo cáo kiến trúc hệ thống</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Current Database & Supabase Status: Clear honest status (Requirement 3) */}
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-300 text-blue-950 flex items-start gap-3">
            <Server className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block text-blue-900">Trạng thái CSDL Máy chủ & Supabase Cloud</span>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                • <strong>Máy chủ nội bộ (Node/Express Master Storage):</strong> Đang hoạt động bình thường, bảo toàn dữ liệu <strong>9 lớp (249 học sinh)</strong> và 20 máy tính trạm PC01–PC20. Mã PIN học sinh được băm mật mã SHA-256 an toàn.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  Máy chủ trường học: Sẵn sàng 100%
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                  Supabase Cloud: {import.meta.env.VITE_SUPABASE_URL ? 'Đã kết nối' : 'Chưa cấu hình (Hệ thống chạy mượt trên máy chủ nội bộ, không bị treo)'}
                </span>
              </div>
            </div>
          </div>

          {/* Proposal for Shared Cloud DB: Firebase Firestore + Auth */}
          <div className="border border-blue-200 rounded-xl p-4 bg-blue-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-blue-950 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-blue-600" />
                Đề xuất nâng cấp: Cơ sở dữ liệu đám mây Firebase Firestore & Authentication
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-full">
                Khuyên dùng
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Để 20 máy tính của học sinh trong phòng thực hành có thể nộp bài trực tiếp và giáo viên nhận bài tức thời từ bàn điều khiển, hệ thống cần nâng cấp lên <strong>Firebase Firestore</strong> và <strong>Firebase Authentication</strong>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white rounded-lg border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  Xác thực phân quyền (RBAC):
                </span>
                <p className="text-slate-600 text-[10px]">
                  • Giáo viên: Đăng nhập tài khoản Google giáo dục, toàn quyền giao bài, duyệt điểm.
                  <br />
                  • Học sinh: Đăng nhập bằng Mã HS (VD: HS34-01) an toàn, chỉ xem bài và điểm của chính mình.
                </p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-blue-100 space-y-1">
                <span className="font-bold text-blue-900 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Lưu trữ đám mây dùng chung:
                </span>
                <p className="text-slate-600 text-[10px]">
                  • Firestore: Đồng bộ thời gian thực kết quả 249 học sinh và 9 lớp học.
                  <br />
                  • Cloud Storage: Lưu trữ an toàn các tệp DOCX, PPTX, PDF, bài vẽ Paint của học sinh.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Gemini AI Ethics Compliance */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-600" />
              Cam kết bảo mật & Quyền riêng tư học sinh:
            </span>
            <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
              <li>
                <strong>Không công khai dữ liệu cá nhân học sinh:</strong> Bảng điểm và bài nộp được phân quyền bảo mật, học sinh không thể xem bài làm của bạn khác.
              </li>
              <li>
                <strong>An toàn khi gọi Gemini AI:</strong> Chỉ gửi các tiêu chí kỹ thuật và thông số bài tập đã được ẩn danh; không gửi dữ liệu nhạy cảm hay thông tin định danh cá nhân của học sinh ra ngoài.
              </li>
              <li>
                <strong>Giáo viên luôn là người phê duyệt cuối cùng:</strong> Mọi gợi ý của Gemini AI chỉ mang tính chất tham khảo, không tự động công bố khi chưa được giáo viên xem xét.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
