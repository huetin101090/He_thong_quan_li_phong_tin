import React, { useState } from 'react';
import { Sparkles, Check, X, Users, AlertCircle, Info, Shuffle, ShieldCheck } from 'lucide-react';
import { ClassInfo } from '../types/classroom';
import { TOTAL_COMPUTERS } from '../data/initialData';

interface AutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassInfo;
  activeStudentCount: number;
  onConfirmAutoAssign: (strategy: 'standard' | 'gender_balanced' | 'random') => void;
}

export const AutoAssignModal: React.FC<AutoAssignModalProps> = ({
  isOpen,
  onClose,
  currentClass,
  activeStudentCount,
  onConfirmAutoAssign,
}) => {
  const [strategy, setStrategy] = useState<'standard' | 'gender_balanced' | 'random'>('standard');

  if (!isOpen) return null;

  // Calculate distribution
  const count = activeStudentCount;
  let singleCount = 0;
  let doubleCount = 0;
  let emptyCount = 0;

  if (count <= TOTAL_COMPUTERS) {
    singleCount = count;
    doubleCount = 0;
    emptyCount = TOTAL_COMPUTERS - count;
  } else {
    // If count > 20:
    // First 20 machines each get 1 student.
    // Remaining (count - 20) students fill slot B of machines 1 to (count - 20).
    const remaining = count - TOTAL_COMPUTERS;
    doubleCount = remaining;
    singleCount = TOTAL_COMPUTERS - remaining;
    emptyCount = 0;
  }

  const handleApply = () => {
    onConfirmAutoAssign(strategy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h3 className="text-base font-bold">Phân công chỗ ngồi tự động AI</h3>
              <p className="text-xs text-blue-200">
                Áp dụng cho {currentClass.name} (Sĩ số: {activeStudentCount} học sinh có mặt)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Algorithm Strategy Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chọn phương án phân công:
            </label>

            {/* Option 1: Standard (Strictly adhering to requirement 6) */}
            <div
              onClick={() => setStrategy('standard')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                strategy === 'standard'
                  ? 'border-blue-600 bg-blue-50/70 text-slate-900'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                strategy === 'standard' ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
              }`}>
                {strategy === 'standard' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span>Quy tắc chuẩn Tiểu học (Khuyên dùng)</span>
                  <span className="text-[10px] bg-blue-600 text-white px-2 py-0.2 rounded-full">Tối ưu</span>
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Ưu tiên mỗi học sinh ngồi 1 máy riêng biệt trước. Khi vượt quá 20 học sinh, các em còn lại sẽ được phân bổ vào các máy để ghép đôi (tối đa 2 HS/máy).
                </p>
              </div>
            </div>

            {/* Option 2: Gender Balanced */}
            <div
              onClick={() => setStrategy('gender_balanced')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                strategy === 'gender_balanced'
                  ? 'border-indigo-600 bg-indigo-50/70 text-slate-900'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                strategy === 'gender_balanced' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
              }`}>
                {strategy === 'gender_balanced' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900">Cân bằng và hài hòa Nam - Nữ</span>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Đan xen học sinh nam và nữ giữa các máy tính và các nhóm ghép đôi.
                </p>
              </div>
            </div>

            {/* Option 3: Random */}
            <div
              onClick={() => setStrategy('random')}
              className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                strategy === 'random'
                  ? 'border-purple-600 bg-purple-50/70 text-slate-900'
                  : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
              }`}
            >
              <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                strategy === 'random' ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-300'
              }`}>
                {strategy === 'random' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
              <div className="text-xs">
                <span className="font-bold text-slate-900">Xáo trộn ngẫu nhiên (Đổi bạn mới)</span>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  Ngẫu nhiên hóa chỗ ngồi để các em có cơ hội giao lưu học hỏi lẫn nhau trong giờ thực hành.
                </p>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Preview */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Dự kiến phân bổ cho {currentClass.name}:</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-lg font-extrabold text-blue-700">{singleCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Máy 1 học sinh</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-lg font-extrabold text-purple-700">{doubleCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Máy ghép đôi (2 HS)</div>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-200">
                <div className="text-lg font-extrabold text-slate-600">{emptyCount}</div>
                <div className="text-[10px] text-slate-500 font-medium">Máy còn trống</div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              ✓ Toàn bộ <strong>{count} học sinh</strong> đều được bố trí máy tính. Không có học sinh nào bị phân công trùng lặp.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>Áp dụng phân công ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
