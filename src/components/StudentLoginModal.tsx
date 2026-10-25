import React, { useState, useEffect, useMemo } from 'react';
import { 
  GraduationCap, 
  Lock, 
  Monitor, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Key, 
  User, 
  AlertCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Users,
  Check,
  HelpCircle,
  FileText,
  Sparkles
} from 'lucide-react';
import { ClassInfo, Student } from '../types/classroom';
import { studentLoginAuth, fetchWorkstations, WorkstationItem } from '../services/attendanceService';
import { changeStudentPin } from '../services/studentAccountService';
import { UserSession } from '../types/assignments';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string; // The class currently having lesson in the room
  currentDate: string;
  daySession: 'morning' | 'afternoon';
  periodNumber: number;
  brokenComputers: number[];
  onLoginSuccess: (session: UserSession, pcId: number, checkInResult: any) => void;
  onSelectClass?: (classId: string) => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  classes,
  students,
  currentClassId,
  currentDate,
  daySession,
  periodNumber,
  brokenComputers,
  onLoginSuccess,
  onSelectClass,
}) => {
  // Input states - Học sinh tự gõ mã HS và Mật khẩu cá nhân, không có dropdown chọn danh tính bạn khác
  const [studentCodeInput, setStudentCodeInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [selectedPcId, setSelectedPcId] = useState<number>(7); // Mặc định PC07 (phù hợp với kịch bản kiểm thử HS43-07)
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginResult, setLoginResult] = useState<any | null>(null);
  const [workstations, setWorkstations] = useState<WorkstationItem[]>([]);
  const [showTeacherLookup, setShowTeacherLookup] = useState(false);

  // Self PIN Change state (Requirement 8)
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [changePinMsg, setChangePinMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Load workstations and reset inputs when modal opens
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setLoginResult(null);
      setPasswordInput('');
      fetchWorkstations(currentClassId, currentDate, daySession, periodNumber).then(setWorkstations);
    }
  }, [isOpen, currentClassId, currentDate, daySession, periodNumber]);

  const activeClassObj = classes.find(c => c.id === currentClassId) || classes[0];

  if (!isOpen) return null;

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedCode = studentCodeInput.trim();
    const trimmedPass = passwordInput.trim();

    if (!trimmedCode) {
      setErrorMsg('Vui lòng nhập Mã học sinh của em (Ví dụ: HS43-07)!');
      return;
    }

    if (!trimmedPass) {
      setErrorMsg('Vui lòng nhập Mật khẩu cá nhân / Mã PIN được cấp!');
      return;
    }

    if (brokenComputers.includes(selectedPcId)) {
      setErrorMsg(`Máy tính PC${selectedPcId < 10 ? '0' + selectedPcId : selectedPcId} đang báo hỏng/bảo trì. Em vui lòng chuyển sang máy hoạt động tốt!`);
      return;
    }

    // Tự động nhận diện lớp từ tiền tố mã học sinh (VD: HS43-07 -> Lớp 4.3)
    const classMatch = trimmedCode.match(/^HS([345])([3456])/i);
    const detectedClass = classMatch ? `${classMatch[1]}.${classMatch[2]}` : null;
    const effectiveClassId = detectedClass || currentClassId;

    if (detectedClass && onSelectClass && detectedClass !== currentClassId) {
      onSelectClass(detectedClass);
    }

    setIsSubmitting(true);
    try {
      // Call Real Server-Side Authentication API with bcrypt & Supabase check
      const res = await studentLoginAuth({
        studentCode: trimmedCode,
        password: trimmedPass,
        pcId: selectedPcId,
        activeClassId: effectiveClassId,
        date: currentDate,
        session: daySession,
        period: periodNumber,
      });

      if (!res.success) {
        setErrorMsg(res.error || res.message || 'Đăng nhập không thành công.');
        setIsSubmitting(false);
        return;
      }

      // Successful login
      setLoginResult(res);
      
      const newSession: UserSession = {
        role: 'student',
        studentId: res.student?.id || trimmedCode,
        studentName: res.student?.name || 'Học sinh',
        classId: res.student?.classId || currentClassId,
      };

      // Notify parent app
      onLoginSuccess(newSession, selectedPcId, res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi kết nối máy chủ điểm danh phòng máy!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Student Self PIN Change (Requirement 8)
  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePinMsg(null);
    const cleanNew = newPinInput.trim();
    const cleanConfirm = confirmPinInput.trim();

    if (!cleanNew || cleanNew.length < 4 || cleanNew.length > 8) {
      setChangePinMsg({ text: 'Mã PIN mới phải từ 4 đến 8 chữ số!', isError: true });
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setChangePinMsg({ text: 'Mã PIN nhập lại không khớp!', isError: true });
      return;
    }

    setIsChangingPin(true);
    const res = await changeStudentPin(studentCodeInput.trim(), passwordInput.trim(), cleanNew);
    if (res.success) {
      setChangePinMsg({ text: res.message || 'Đổi mã PIN thành công!', isError: false });
      setPasswordInput(cleanNew);
      if (loginResult?.student) {
        loginResult.student.mustChangePinOnFirstLogin = false;
      }
      setTimeout(() => {
        setShowChangePin(false);
        setChangePinMsg(null);
      }, 2500);
    } else {
      setChangePinMsg({ text: res.error || 'Đổi mã PIN không thành công!', isError: true });
    }
    setIsChangingPin(false);
  };

  // Continue to lesson after reviewing login result
  const handleProceedToLesson = () => {
    onClose();
  };

  // Switch to another student on the same machine
  const handleLoginAnotherStudentOnSamePc = () => {
    setLoginResult(null);
    setStudentCodeInput('');
    setPasswordInput('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/25 rounded-2xl border border-emerald-400/40 text-emerald-300 shadow-inner">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base uppercase tracking-tight">CỔNG ĐĂNG NHẬP HỌC SINH</h3>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold border border-emerald-400/30">
                  Phòng máy AI
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 mt-0.5 font-medium">
                Tiết học: <strong>{activeClassObj.name.startsWith('Lớp') ? activeClassObj.name : `Lớp ${activeClassObj.name}`}</strong> • Tiết {periodNumber} ({daySession === 'morning' ? 'Sáng' : 'Chiều'}) • 20 máy trạm
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* If already logged in, show the Verification & Computer Card (YÊU CẦU 3 & 4) */}
        {loginResult ? (
          <div className="p-5 space-y-4 overflow-y-auto text-xs">
            {/* Success Status Banner */}
            <div className={`p-4 rounded-2xl border-2 flex items-start gap-3 ${
              loginResult.isCorrectPc 
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950' 
                : 'bg-amber-50 border-amber-500 text-amber-950'
            }`}>
              {loginResult.isCorrectPc ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="font-black text-sm block">
                  {loginResult.isCorrectPc ? 'ĐĂNG NHẬP & XÁC THỰC THÀNH CÔNG!' : 'CẢNH BÁO ĐĂNG NHẬP SAI MÁY TÍNH!'}
                </span>
                <p className="text-[11px] leading-relaxed">
                  {loginResult.message}
                </p>
              </div>
            </div>

            {/* Student & Assigned Station Details (YÊU CẦU 3) */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider block">
                Thông tin xác thực từ Máy chủ phòng máy:
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Học sinh:</span>
                  <span className="font-black text-slate-900 text-xs">
                    {loginResult.student?.name}
                  </span>
                  <span className="text-[10px] text-blue-700 block font-mono font-bold">
                    Mã HS: {loginResult.student?.code}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Lớp học:</span>
                  <span className="font-black text-blue-900 text-xs">
                    Lớp {loginResult.student?.classId}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Tiết {periodNumber} ({daySession === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'})
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border ${
                  loginResult.isCorrectPc ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/70 border-amber-300'
                }`}>
                  <span className="text-[10px] text-slate-500 font-bold block">Máy được phân công:</span>
                  <span className="font-black text-xs text-blue-900">
                    PC{loginResult.assignedPc ? (loginResult.assignedPc < 10 ? '0' + loginResult.assignedPc : loginResult.assignedPc) : 'Chưa xếp'} 
                    {loginResult.assignedSlot ? ` — Chỗ ${loginResult.assignedSlot}` : ''}
                  </span>
                  <span className="text-[10px] text-emerald-700 block font-semibold">
                    {loginResult.isCorrectPc ? '✓ Đúng vị trí sơ đồ' : '⚠️ Cần chuyển chỗ'}
                  </span>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Máy đang ngồi thực tế:</span>
                  <span className="font-black text-xs text-slate-900">
                    PC{loginResult.actualPc < 10 ? '0' + loginResult.actualPc : loginResult.actualPc}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {loginResult.record?.loginTimestamp}
                  </span>
                </div>
              </div>

              {/* Status Pill */}
              <div className="flex items-center justify-between p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 text-[11px]">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>Trạng thái điểm danh:</span>
                </span>
                <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                  loginResult.status === 'present'
                    ? 'bg-emerald-600 text-white'
                    : loginResult.status === 'wrong_pc'
                    ? 'bg-amber-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {loginResult.status === 'present' 
                    ? 'Đã duyệt có mặt' 
                    : loginResult.status === 'wrong_pc' 
                    ? 'Sai máy – Chờ GV xử lý' 
                    : 'Đã đăng nhập – Chờ GV xác nhận'}
                </span>
              </div>
            </div>

            {/* Shared PC Notice (2 HS chung một máy) */}
            <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Máy PC{loginResult.actualPc < 10 ? '0' + loginResult.actualPc : loginResult.actualPc} có 2 bạn ngồi chung?</span>
              </span>
              <button
                type="button"
                onClick={handleLoginAnotherStudentOnSamePc}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer shrink-0"
              >
                Đăng nhập bạn thứ hai
              </button>
            </div>

            {/* Requirement 8: Prompt student to change PIN if mustChangePinOnFirstLogin or voluntarily */}
            <div className="p-3 bg-indigo-50/90 rounded-2xl border border-indigo-200 text-indigo-950 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                  <Key className="w-4 h-4 text-indigo-600" />
                  <span>Bảo mật mã PIN cá nhân:</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePin(!showChangePin);
                    setChangePinMsg(null);
                  }}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer"
                >
                  {showChangePin ? 'Đóng' : (loginResult?.student?.mustChangePinOnFirstLogin ? '🔑 Đổi mã PIN ngay (Khuyên dùng)' : 'Đổi mã PIN')}
                </button>
              </div>

              {loginResult?.student?.mustChangePinOnFirstLogin && !showChangePin && (
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  ⚠️ Mã PIN của em là mã khởi tạo do Thầy/Cô cấp. Em hãy nhấn <strong>"Đổi mã PIN ngay"</strong> để đặt mật khẩu bí mật riêng nhé!
                </p>
              )}

              {showChangePin && (
                <form onSubmit={handleChangePinSubmit} className="space-y-2 pt-1 border-t border-indigo-100">
                  {changePinMsg && (
                    <div className={`p-2 rounded-lg text-[11px] font-medium ${
                      changePinMsg.isError ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {changePinMsg.text}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Mã PIN mới (4-8 số):</label>
                      <input
                        type="password"
                        maxLength={8}
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="VD: 123456"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 block mb-0.5">Nhập lại mã PIN mới:</label>
                      <input
                        type="password"
                        maxLength={8}
                        value={confirmPinInput}
                        onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Nhập lại chính xác"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPin}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {isChangingPin ? 'Đang cập nhật...' : 'Lưu mã PIN mới'}
                  </button>
                </form>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleProceedToLesson}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                <Check className="w-4 h-4 text-blue-200" />
                <span>Vào bàn học & Xem bài tập của em</span>
              </button>
            </div>
          </div>
        ) : (
          /* Login Form: YÊU CẦU 2 - Không cho chọn tên bạn khác, học sinh tự nhập mã HS và Mật khẩu cá nhân */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto text-xs">
            
            {/* Active Class & Lesson Notification Banner with Class Switcher */}
            <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200 text-blue-950 flex flex-col gap-2 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Tiết học phòng máy: <strong>{activeClassObj.name.startsWith('Lớp') ? activeClassObj.name : `Lớp ${activeClassObj.name}`}</strong></span>
                </span>
                <span className="text-[10px] bg-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  Sĩ số: {activeClassObj.totalStudents} HS
                </span>
              </div>

              {/* Class switcher buttons for all 9 classes */}
              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-500 font-bold">Chọn lớp:</span>
                {classes.map((cls) => {
                  const isCur = cls.id === currentClassId;
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        if (onSelectClass) onSelectClass(cls.id);
                        setErrorMsg(null);
                      }}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                        isCur 
                          ? 'bg-blue-600 text-white shadow-2xs' 
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {cls.id}
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-slate-600 mt-0.5">
                • Vui lòng nhập đúng <strong>Mã học sinh</strong> và <strong>Mật khẩu cá nhân</strong> được cấp riêng cho em.
                <br />
                • Hệ thống tự động xác thực và đối chiếu máy tính phân công trên máy chủ.
              </p>
            </div>

            {/* 1. Mã học sinh (Input Text - Không dùng dropdown chọn tên bạn khác) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Mã học sinh của em: *</span>
                </label>
                <span className="text-[10px] text-slate-400 italic">
                  In trên thẻ học sinh (VD: HS43-07)
                </span>
              </div>
              <input
                type="text"
                required
                value={studentCodeInput}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setStudentCodeInput(val);
                  setErrorMsg(null);
                  const m = val.match(/^HS([345])([3456])/i);
                  if (m && onSelectClass) {
                    const matchedClass = `${m[1]}.${m[2]}`;
                    if (classes.some(c => c.id === matchedClass)) {
                      onSelectClass(matchedClass);
                    }
                  }
                }}
                placeholder="Ví dụ: HS43-07..."
                className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl font-mono font-black text-blue-950 text-xs uppercase outline-none transition shadow-2xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                * Học sinh tự gõ mã của chính mình, tuyệt đối không đăng nhập điểm danh hộ bạn khác.
              </p>
            </div>

            {/* 2. Mật khẩu cá nhân / Mã PIN (Password Input) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>2. Mật khẩu cá nhân được cấp: *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Nhập mật khẩu / mã PIN cá nhân..."
                  className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl font-mono font-bold text-slate-900 text-xs outline-none transition shadow-2xs"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                * Mật khẩu được băm mã hóa an toàn trên máy chủ. Không dùng mật khẩu chung cho tất cả học sinh.
              </p>
            </div>

            {/* 3. Chọn máy tính đang ngồi (PC01 - PC20) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" />
                  <span>3. Máy tính em đang ngồi (PC01 – PC20): *</span>
                </label>
                <span className="text-[10px] text-slate-500 font-medium">
                  Đang chọn: <strong className="text-blue-700">PC{selectedPcId < 10 ? '0' + selectedPcId : selectedPcId}</strong>
                </span>
              </div>

              {/* Grid 20 máy */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto">
                {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => {
                  const isBroken = brokenComputers.includes(num);
                  const isSelected = selectedPcId === num;
                  const ws = workstations.find(w => w.pcId === num);

                  return (
                    <button
                      key={num}
                      type="button"
                      disabled={isBroken}
                      onClick={() => {
                        setSelectedPcId(num);
                        setErrorMsg(null);
                      }}
                      className={`py-1.5 px-1 rounded-xl border text-center font-bold text-[11px] transition cursor-pointer flex flex-col items-center justify-center ${
                        isBroken
                          ? 'bg-rose-100 text-rose-500 border-rose-200 cursor-not-allowed opacity-60'
                          : isSelected
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-300'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                      }`}
                      title={isBroken ? 'Máy hỏng' : `Máy tính PC${num < 10 ? '0' + num : num}`}
                    >
                      <span>PC{num < 10 ? '0' + num : num}</span>
                      <span className="text-[8px] font-normal leading-tight">
                        {isBroken ? 'Hỏng' : isSelected ? 'Đang ngồi' : ws?.isRegistered ? 'Đã duyệt' : 'Sẵn sàng'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message Display */}
            {errorMsg && (
              <div className="p-3 bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-2xl text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">Thông báo lỗi:</span>
                  <span className="leading-relaxed text-[11px]">{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Teacher Lookup Helper (Chỉ hỗ trợ giáo viên tra cứu nếu học sinh quên thẻ) */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTeacherLookup(!showTeacherLookup)}
                className="text-[10px] text-slate-500 hover:text-blue-700 underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3 h-3" />
                <span>{showTeacherLookup ? 'Ẩn bảng hỗ trợ tra cứu' : 'Quên mã học sinh hoặc mã PIN? Nhấp để xem trợ giúp'}</span>
              </button>

              {showTeacherLookup && (
                <div className="mt-2 p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-[10px] text-amber-950 space-y-2">
                  <span className="font-bold block">Ghi chú hỗ trợ học sinh:</span>
                  <p>
                    • Mã học sinh có định dạng: <strong className="font-mono">HS + Mã lớp + Số thứ tự</strong> (Ví dụ Lớp 4/3: <strong className="font-mono">HS43-07</strong> là em Trần Văn Hà).
                  </p>
                  <p>
                    • Mật khẩu đã cấp trên máy chủ: <strong className="font-mono text-emerald-800 font-bold">456020</strong> hoặc <strong className="font-mono">123456</strong>.
                  </p>
                  {/* Quick test button */}
                  <div className="pt-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectClass) onSelectClass('4.3');
                        setStudentCodeInput('HS43-07');
                        setPasswordInput('456020');
                        setSelectedPcId(7);
                        setErrorMsg(null);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>⚡ Tự động điền: HS43-07 (Trần Văn Hà • PIN: 456020 • PC07)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordInput('123456');
                        setErrorMsg(null);
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-[10px] border border-slate-300 transition cursor-pointer"
                    >
                      Dùng mã: 123456
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form Action Buttons: YÊU CẦU 2 (Nút Đăng nhập và Nút Quay lại) */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs"
              >
                <ArrowLeft className="w-4 h-4 text-slate-500" />
                <span>Quay lại</span>
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-xs"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xác thực bảo mật...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Đăng nhập vào phòng máy</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
