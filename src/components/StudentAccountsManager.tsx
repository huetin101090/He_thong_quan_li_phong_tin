import React, { useState, useEffect, useMemo } from 'react';
import { 
  KeyRound, 
  ShieldCheck, 
  Lock, 
  FileSpreadsheet, 
  RefreshCw, 
  Search, 
  Users, 
  AlertTriangle, 
  Copy, 
  Check, 
  Monitor, 
  Download,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Sparkles,
  Printer,
  ChevronDown,
  Info,
  CheckSquare,
  Square,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserSession } from '../types/assignments';
import { ClassInfo } from '../types/classroom';
import { 
  StudentAccountRow, 
  fetchStudentAccounts, 
  resetStudentPin, 
  batchResetPins, 
  exportStudentAccountsToExcel,
  getTeacherToken,
  loginTeacher
} from '../services/studentAccountService';
import { CLASSES_DATA, SCHOOL_NAME, isSameClass } from '../data/initialData';

interface StudentAccountsManagerProps {
  session: UserSession;
  classes?: ClassInfo[];
  currentClassId?: string;
  onGoToComputers?: (classId: string) => void;
  onOpenStudentLoginModal?: () => void;
}

export const StudentAccountsManager: React.FC<StudentAccountsManagerProps> = ({
  session,
  classes = CLASSES_DATA,
  currentClassId = '4.3',
  onGoToComputers,
  onOpenStudentLoginModal,
}) => {
  const isTeacher = session.role === 'teacher';

  // Teacher Authentication state on server
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => Boolean(getTeacherToken()));
  const [showTeacherAuthModal, setShowTeacherAuthModal] = useState<boolean>(false);
  const [teacherPasswordInput, setTeacherPasswordInput] = useState<string>('');
  const [showTeacherPassword, setShowTeacherPassword] = useState<boolean>(false);
  const [teacherAuthError, setTeacherAuthError] = useState<string | null>(null);
  const [isVerifyingTeacher, setIsVerifyingTeacher] = useState<boolean>(false);

  // Filters & State
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accounts, setAccounts] = useState<StudentAccountRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Checkbox multi-select state (Requirement 3: Cho phép chọn từng học sinh)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Master "CẤP LẠI PIN VÀ XUẤT EXCEL" Modal state (Requirement 2 & 3)
  const [isMainResetModalOpen, setIsMainResetModalOpen] = useState<boolean>(false);
  const [resetTargetScope, setResetTargetScope] = useState<'class' | 'all' | 'selected'>('class');
  const [chosenClassForReset, setChosenClassForReset] = useState<string>('4.3');
  const [customPinMode, setCustomPinMode] = useState<'random' | 'custom'>('random');
  const [customPinInput, setCustomPinInput] = useState<string>('');
  const [isResettingMaster, setIsResettingMaster] = useState<boolean>(false);

  // Single Student Reset Modal state
  const [singleStudentModal, setSingleStudentModal] = useState<StudentAccountRow | null>(null);
  const [singleCustomPin, setSingleCustomPin] = useState<string>('');
  const [isResettingSingle, setIsResettingSingle] = useState<boolean>(false);
  const [singleIssuedPinResult, setSingleIssuedPinResult] = useState<{
    studentName: string;
    code: string;
    classId: string;
    pin: string;
    assignedPc: string;
  } | null>(null);

  // Post-Reset Instant Result & Excel Download Modal (Requirement 8: Chỉ xem và tải 1 lần)
  const [postResetResult, setPostResetResult] = useState<{
    count: number;
    scopeTitle: string;
    items: Array<{
      stt: number;
      id: string;
      classId: string;
      name: string;
      code: string;
      newTempPin: string;
      assignedPc: string;
    }>;
  } | null>(null);

  // Sample testing guide card collapsed state
  const [isTestGuideOpen, setIsTestGuideOpen] = useState<boolean>(true);

  // Copied indicator state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Load accounts from Server
  const loadAccounts = async (classId: string = 'all') => {
    setIsLoading(true);
    setErrorMsg(null);
    const res = await fetchStudentAccounts(classId);
    if (res.success) {
      setAccounts(res.accounts);
    } else {
      setErrorMsg(res.error || 'Không thể tải danh sách tài khoản');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isTeacher) {
      loadAccounts(selectedClassId);
    }
  }, [isTeacher, selectedClassId]);

  // Keep chosen class in sync with filter if user picks a class
  useEffect(() => {
    if (selectedClassId !== 'all') {
      setChosenClassForReset(selectedClassId);
    }
  }, [selectedClassId]);

  // Copy helper
  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtered accounts for display
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchSearch = 
        acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.classId.includes(searchTerm);
      return matchSearch;
    });
  }, [accounts, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = accounts.length;
    const needChange = accounts.filter(a => a.mustChangePinOnFirstLogin).length;
    const assigned = accounts.filter(a => a.assignedPcId !== null).length;
    return { total, needChange, assigned };
  }, [accounts]);

  // Multi-select toggle
  const handleToggleSelectAll = () => {
    if (selectedStudentIds.size === filteredAccounts.length) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredAccounts.map(a => a.id)));
    }
  };

  const handleToggleStudentSelect = (studentId: string) => {
    const next = new Set(selectedStudentIds);
    if (next.has(studentId)) {
      next.delete(studentId);
    } else {
      next.add(studentId);
    }
    setSelectedStudentIds(next);
  };

  // ==========================================
  // THỰC THI: XÁC THỰC GIÁO VIÊN TRÊN MÁY CHỦ & CẤP PIN (YÊU CẦU 1, 2, 3, 4)
  // ==========================================
  const handleTeacherLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pass = teacherPasswordInput.trim();
    if (!pass) {
      setTeacherAuthError('Vui lòng nhập mật khẩu Giáo viên!');
      return;
    }
    setIsVerifyingTeacher(true);
    setTeacherAuthError(null);
    const res = await loginTeacher(pass);
    if (res.success) {
      setIsTeacherAuthenticated(true);
      setShowTeacherAuthModal(false);
      setTeacherPasswordInput('');
      setSuccessMsg('Xác thực phiên Giáo viên máy chủ thành công! Giờ Thầy/Cô có thể tiến hành cấp mã PIN.');
      setTimeout(() => setSuccessMsg(null), 4000);
      loadAccounts(selectedClassId);
    } else {
      setTeacherAuthError(res.error || 'Mật khẩu Giáo viên chưa chính xác!');
    }
    setIsVerifyingTeacher(false);
  };

  const handleExecuteResetAndExport = async () => {
    if (!isTeacherAuthenticated) {
      setShowTeacherAuthModal(true);
      return;
    }

    setIsResettingMaster(true);
    setErrorMsg(null);

    let classParam: string | undefined = undefined;
    let studentIdsParam: string[] | undefined = undefined;
    let scopeTitle = '';

    if (resetTargetScope === 'all') {
      classParam = 'all';
      scopeTitle = 'Toàn trường (9 lớp • 249 học sinh)';
    } else if (resetTargetScope === 'selected') {
      if (selectedStudentIds.size === 0) {
        setErrorMsg('Vui lòng tích chọn ít nhất 1 học sinh trong bảng danh sách!');
        setIsResettingMaster(false);
        return;
      }
      studentIdsParam = Array.from(selectedStudentIds);
      scopeTitle = `Nhóm ${studentIdsParam.length} học sinh được chọn`;
    } else {
      // Single class
      classParam = chosenClassForReset;
      scopeTitle = `Lớp ${chosenClassForReset.replace('.', '/')}`;
    }

    const customPin = (customPinMode === 'custom' && customPinInput.trim().length >= 6)
      ? customPinInput.trim()
      : undefined;

    // Call server endpoint with admin role verification (Requirement 5)
    const res = await batchResetPins({
      classId: classParam,
      studentIds: studentIdsParam,
      customPin,
    });

    if (res.requiresAuth) {
      setIsTeacherAuthenticated(false);
      setShowTeacherAuthModal(true);
      setErrorMsg('Yêu cầu xác thực tài khoản Giáo viên trên máy chủ trước khi cấp PIN!');
      setIsResettingMaster(false);
      return;
    }

    if (res.success && Array.isArray(res.accountsWithNewPin)) {
      const pinMap = new Map<string, string>();
      res.accountsWithNewPin.forEach(item => {
        pinMap.set(item.id, item.newTempPin);
      });

      // Update local state (in ephemeral React memory only, never in localStorage - Requirement 9)
      setAccounts(prev => prev.map(a => {
        if (pinMap.has(a.id)) {
          return {
            ...a,
            newTempPin: pinMap.get(a.id),
            mustChangePinOnFirstLogin: true,
            hasPin: true,
            pinResetCount: a.pinResetCount + 1,
            pinUpdatedAt: new Date().toISOString(),
          };
        }
        return a;
      }));

      // Build rows for Excel export strictly matching Requirement 7
      const exportRows: StudentAccountRow[] = res.accountsWithNewPin.map((item, idx) => ({
        stt: idx + 1,
        id: item.id,
        code: item.code,
        name: item.name,
        classId: item.classId,
        seatNumber: idx + 1,
        gender: 'male',
        assignedPc: item.assignedPc,
        assignedPcId: item.assignedPcId,
        hasPin: true,
        mustChangePinOnFirstLogin: true,
        pinUpdatedAt: new Date().toISOString(),
        pinResetCount: 1,
        newTempPin: item.newTempPin, // 6-digit random PIN
      }));

      // Trigger instant Excel file download (.xlsx)
      exportStudentAccountsToExcel(exportRows, {
        scopeName: scopeTitle,
        teacherName: session.teacherName || 'Cô Nguyễn Thị Huệ (GV Phụ trách Tin học)',
        isFreshReset: true,
      });

      // Close setup modal
      setIsMainResetModalOpen(false);
      setSelectedStudentIds(new Set());

      // Open Post-Reset Result Modal (Requirement 8)
      setPostResetResult({
        count: res.accountsWithNewPin.length,
        scopeTitle,
        items: res.accountsWithNewPin,
      });

      setSuccessMsg(`Đã cấp lại PIN thành công cho ${res.accountsWithNewPin.length} học sinh và tự động tải tệp Excel (.xlsx)!`);
      setTimeout(() => setSuccessMsg(null), 8000);
    } else {
      setErrorMsg(res.error || 'Cấp lại mã PIN không thành công!');
    }

    setIsResettingMaster(false);
  };

  // Execute single student reset & optional Excel receipt
  const handleConfirmSingleReset = async () => {
    if (!singleStudentModal) return;

    if (!isTeacherAuthenticated) {
      setShowTeacherAuthModal(true);
      return;
    }

    setIsResettingSingle(true);
    setErrorMsg(null);

    const customPin = (singleCustomPin.trim().length >= 6) ? singleCustomPin.trim() : undefined;

    const res = await resetStudentPin(singleStudentModal.id, customPin);

    if (res.requiresAuth) {
      setIsTeacherAuthenticated(false);
      setShowTeacherAuthModal(true);
      setErrorMsg('Phiên Giáo viên chưa xác thực hoặc đã hết hạn. Vui lòng nhập mật khẩu Giáo viên!');
      setIsResettingSingle(false);
      return;
    }

    if (res.success && res.newTempPin) {
      // Update local state
      setAccounts(prev => prev.map(a => {
        if (a.id === singleStudentModal.id) {
          return {
            ...a,
            newTempPin: res.newTempPin,
            mustChangePinOnFirstLogin: true,
            hasPin: true,
            pinResetCount: a.pinResetCount + 1,
            pinUpdatedAt: new Date().toISOString(),
          };
        }
        return a;
      }));

      setSingleIssuedPinResult({
        studentName: res.studentName || singleStudentModal.name,
        code: res.studentCode || singleStudentModal.code,
        classId: res.classId || singleStudentModal.classId,
        pin: res.newTempPin,
        assignedPc: res.assignedPc || singleStudentModal.assignedPc,
      });

      setSuccessMsg(`Đã cấp lại mã PIN mới cho em ${res.studentName} thành công bằng bcrypt!`);
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(res.error || 'Cấp lại mã PIN thất bại');
    }
    setIsResettingSingle(false);
  };

  // Export 1 single student receipt to Excel
  const handleExportSingleStudentReceipt = () => {
    if (!singleIssuedPinResult) return;
    const singleRow: StudentAccountRow = {
      stt: 1,
      id: singleIssuedPinResult.code,
      code: singleIssuedPinResult.code,
      name: singleIssuedPinResult.studentName,
      classId: singleIssuedPinResult.classId,
      seatNumber: 1,
      gender: 'male',
      assignedPc: singleIssuedPinResult.assignedPc,
      assignedPcId: 1,
      hasPin: true,
      mustChangePinOnFirstLogin: true,
      pinUpdatedAt: new Date().toISOString(),
      pinResetCount: 1,
      newTempPin: singleIssuedPinResult.pin,
    };

    exportStudentAccountsToExcel([singleRow], {
      scopeName: `Học sinh ${singleIssuedPinResult.studentName} (${singleIssuedPinResult.code})`,
      teacherName: session.teacherName || 'Cô Nguyễn Thị Huệ',
      fileName: `PhieuTaiKhoan_${singleIssuedPinResult.code}_${singleIssuedPinResult.pin}.xlsx`,
      isFreshReset: true,
    });
  };

  // ACCESS DENIED VIEW IF STUDENT ROLE (Requirement 6)
  if (!isTeacher) {
    return (
      <div className="bg-white rounded-3xl p-8 border-2 border-rose-200 shadow-xl max-w-2xl mx-auto my-8 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-3xl mx-auto flex items-center justify-center border border-rose-200 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
          Quyền truy cập bị giới hạn
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
          Mục <strong>"Quản lý & Cấp mã PIN Tài khoản Học sinh"</strong> được bảo mật nghiêm ngặt và chỉ dành riêng cho <strong>Giáo viên / Quản trị viên</strong> phòng máy. 
          <br />
          Học sinh không được phép xem tài khoản hoặc mã PIN của các bạn khác.
        </p>
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Chính sách bảo mật dữ liệu học đường • TT 27/2020/TT-BGDĐT</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* ======================================================== */}
      {/* TOP BANNER WITH PROMINENT "CẤP LẠI PIN VÀ XUẤT EXCEL" */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-xl border border-blue-800/60 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-2xl text-blue-950 shadow-lg shadow-amber-500/25 shrink-0 ring-4 ring-amber-400/20">
              <KeyRound className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  {SCHOOL_NAME}
                </span>
                {isTeacherAuthenticated ? (
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Máy chủ: Đã xác thực phiên Giáo viên
                  </span>
                ) : (
                  <button
                    onClick={() => setShowTeacherAuthModal(true)}
                    className="text-[11px] font-bold text-amber-300 bg-amber-950/90 hover:bg-amber-900/90 px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title="Bấm để xác thực mật khẩu máy chủ Giáo viên"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Chưa xác thực mật khẩu GV (Nhấn để đăng nhập)
                  </button>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold tracking-tight mt-1.5 text-white flex items-center gap-2">
                QUẢN LÝ VÀ CẤP TÀI KHOẢN HỌC SINH (9 LỚP • 249 EM)
              </h2>
              <p className="text-xs text-blue-200 mt-1 max-w-2xl leading-relaxed">
                Mỗi học sinh có mã đăng nhập và mã PIN riêng biệt. CSDL máy chủ băm bảo mật bcrypt (10 vòng), đồng bộ Supabase <code className="text-amber-300">student_credentials</code>.
              </p>
            </div>
          </div>

          {/* MAIN PROMINENT ACTION BUTTON (Requirement 2) */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                if (!isTeacherAuthenticated) {
                  setShowTeacherAuthModal(true);
                  return;
                }
                setResetTargetScope(selectedClassId === 'all' ? 'all' : 'class');
                if (selectedClassId !== 'all') setChosenClassForReset(selectedClassId);
                setIsMainResetModalOpen(true);
              }}
              className="px-5 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 transition-all flex items-center gap-2.5 cursor-pointer border-2 border-amber-300 transform active:scale-95"
              title="Cấp lại mã PIN 6 số an toàn và tự động tải file Excel (.xlsx)"
            >
              <KeyRound className="w-5 h-5 text-slate-950" />
              <FileSpreadsheet className="w-5 h-5 text-slate-950" />
              <span className="tracking-wide">CẤP LẠI PIN VÀ XUẤT EXCEL</span>
            </button>
          </div>

        </div>

        {/* Security Rules Banner (Requirements 6, 7, 8, 9) */}
        <div className="mt-4 pt-3.5 border-t border-blue-800/60 grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] text-blue-100">
          <div className="flex items-center gap-2 bg-blue-950/70 p-2.5 rounded-xl border border-blue-700/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Mật mã băm <strong>bcrypt (10 rounds)</strong>. Lưu an toàn trong Supabase <code>student_credentials</code>.</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-950/70 p-2.5 rounded-xl border border-blue-700/40">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Sinh PIN bằng <strong>CSPRNG bảo mật</strong>. Giới hạn 5 lần thử sai & khóa 10 phút.</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-950/70 p-2.5 rounded-xl border border-blue-700/40">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Học sinh được yêu cầu <strong>đổi sang mã PIN cá nhân</strong> trong lần đăng nhập đầu.</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SAMPLE TEST ACCOUNT FLOW (Requirement "hướng dẫn kiểm thử 1 học sinh") */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 rounded-2xl border-2 border-blue-200 p-4 shadow-sm animate-fadeIn">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsTestGuideOpen(!isTestGuideOpen)}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-blue-950 uppercase tracking-tight flex items-center gap-2">
                HƯỚNG DẪN KIỂM THỬ THỬ NGHIỆM VỚI 1 HỌC SINH (GIAI ĐOẠN 1)
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                  Khuyến nghị: Thử nghiệm với 1 học sinh trước
                </span>
              </h3>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Quy trình chuẩn: Xác thực Giáo viên → Thử cấp PIN 1 học sinh (bcrypt) → Mở Đăng nhập học sinh kiểm thử.
              </p>
            </div>
          </div>
          <button className="text-blue-700 p-1 hover:bg-blue-100 rounded-lg">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isTestGuideOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {isTestGuideOpen && (
          <div className="mt-3 pt-3 border-t border-blue-200 text-xs text-slate-700 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              
              <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-mono">1</span>
                  <span>Xác thực Giáo viên</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Nếu góc trên hiển thị màu vàng, Thầy/Cô bấm xác thực mật khẩu Giáo viên (mặc định: <strong>DongDuong@2026</strong>) để mở quyền máy chủ.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-mono">2</span>
                  <span>Cấp PIN thử 1 học sinh</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Bấm nút <strong>"Cấp lại PIN"</strong> ở dòng em <strong>HS43-07 (Trần Văn Hà - Lớp 4/3)</strong>. Hệ thống băm bcrypt lưu Supabase và hiển thị mã PIN 1 lần.
                </p>
              </div>

              <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-mono">3</span>
                  <span>Đăng nhập học sinh kiểm thử</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Mở <strong>"Đăng nhập học sinh"</strong>, nhập mã <strong>HS43-07</strong> và mã PIN vừa cấp tại Máy PC07. Thử nhập sai 5 lần để kiểm tra tự động khóa 10 phút.
                </p>
              </div>

            </div>

            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-[11px] text-blue-900">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                Thầy/Cô có thể bấm nhanh nút thử nghiệm dưới đây để cấp mã PIN bảo mật cho 1 học sinh ngay lập tức:
              </span>
              <button
                type="button"
                onClick={() => {
                  const target = accounts.find(a => a.code === 'HS43-07') || accounts[0];
                  if (target) {
                    setSingleStudentModal(target);
                    setSingleIssuedPinResult(null);
                    setSingleCustomPin('');
                  }
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Thử nghiệm cấp PIN em Trần Văn Hà (HS43-07)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 text-emerald-950 rounded-2xl flex items-center justify-between text-xs animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border-2 border-rose-400 text-rose-950 rounded-2xl flex items-center justify-between text-xs animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5 font-bold">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-700 hover:text-rose-900 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Tổng tài khoản</span>
            <span className="text-lg font-black text-slate-800">{stats.total} học sinh</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Trạng thái bảo mật</span>
            <span className="text-lg font-black text-emerald-700">100% SHA-256</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Cần đổi PIN lần đầu</span>
            <span className="text-lg font-black text-amber-700">{stats.needChange} em</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Đã phân máy trạm</span>
            <span className="text-lg font-black text-purple-700">{stats.assigned} em</span>
          </div>
        </div>
      </div>

      {/* Filter and Class Tabs bar (Requirements 2: 9 classes) */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Class Selectors for 9 classes */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <span className="text-xs font-bold text-slate-500 mr-1 shrink-0">Lọc theo lớp:</span>
            
            <button
              onClick={() => setSelectedClassId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                selectedClassId === 'all'
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả 9 lớp (249)
            </button>

            {CLASSES_DATA.map(c => {
              const safeLabel = c.id.replace('.', '/');
              const isSelected = selectedClassId === c.id || isSameClass(selectedClassId, c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClassId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>Lớp {safeLabel}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {c.totalStudents}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo tên hoặc mã HS..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* Floating multi-select action toolbar (Requirement 3: Cho phép chọn từng học sinh) */}
        {selectedStudentIds.size > 0 && (
          <div className="p-2.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-between text-xs animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <CheckSquare className="w-4 h-4 text-amber-600" />
              <span>Đang chọn {selectedStudentIds.size} học sinh</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setResetTargetScope('selected');
                  setIsMainResetModalOpen(true);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-xs cursor-pointer border border-amber-300"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Cấp lại PIN & Xuất Excel cho {selectedStudentIds.size} em này</span>
              </button>
              <button
                onClick={() => setSelectedStudentIds(new Set())}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium text-xs cursor-pointer"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Student Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
              Danh sách tài khoản học sinh {selectedClassId === 'all' ? '(Toàn trường)' : `(Lớp ${selectedClassId.replace('.', '/')})`}
            </span>
            <span className="text-[11px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
              {filteredAccounts.length} học sinh
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>GV Quản lý: <strong>{session.teacherName?.split('(')[0] || 'Cô Nguyễn Thị Huệ'}</strong></span>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
              <span>Đang tải danh sách tài khoản học sinh từ máy chủ...</span>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <span>Không tìm thấy học sinh nào phù hợp với bộ lọc.</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-slate-500 hover:text-blue-600"
                      title="Chọn tất cả danh sách đang hiển thị"
                    >
                      {selectedStudentIds.size > 0 && selectedStudentIds.size === filteredAccounts.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-12 text-center">STT</th>
                  <th className="py-3 px-3 w-20">Lớp</th>
                  <th className="py-3 px-3">Họ và tên học sinh</th>
                  <th className="py-3 px-3 w-32">Mã đăng nhập (Mã HS)</th>
                  <th className="py-3 px-3 w-36">Máy phân công</th>
                  <th className="py-3 px-3 w-40">Trạng thái mã PIN</th>
                  <th className="py-3 px-3 w-44">Mã PIN mới cấp</th>
                  <th className="py-3 px-3 w-32 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAccounts.map((acc, index) => {
                  const safeClass = acc.classId.replace('.', '/');
                  const hasNewPin = Boolean(acc.newTempPin);
                  const isChecked = selectedStudentIds.has(acc.id);

                  return (
                    <tr 
                      key={acc.id}
                      className={`hover:bg-blue-50/50 transition ${hasNewPin ? 'bg-amber-50/50' : isChecked ? 'bg-blue-50/40' : ''}`}
                    >
                      {/* Checkbox select */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStudentSelect(acc.id)}
                          className="text-slate-400 hover:text-blue-600 cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* STT */}
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                        {index + 1}
                      </td>

                      {/* Lớp */}
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-800 font-bold rounded-md border border-blue-200">
                          {safeClass}
                        </span>
                      </td>

                      {/* Họ và tên */}
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900">{acc.name}</div>
                        <span className="text-[10px] text-slate-400">
                          {acc.gender === 'female' ? 'Nữ' : 'Nam'} • Thứ tự: #{acc.seatNumber}
                        </span>
                      </td>

                      {/* Mã đăng nhập (Mã học sinh) */}
                      <td className="py-2.5 px-3">
                        <div className="inline-flex items-center gap-1.5 font-mono font-bold text-blue-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          <span>{acc.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(acc.code, `code_${acc.id}`)}
                            className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                            title="Sao chép mã đăng nhập"
                          >
                            {copiedCode === `code_${acc.id}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Máy tính được phân công */}
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          acc.assignedPcId ? 'text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200' : 'text-slate-400 italic'
                        }`}>
                          <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{acc.assignedPc}</span>
                        </span>
                      </td>

                      {/* Trạng thái mã PIN */}
                      <td className="py-2.5 px-3">
                        {acc.mustChangePinOnFirstLogin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Cần đổi PIN lần đầu</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Đã bảo mật CSDL</span>
                          </span>
                        )}
                      </td>

                      {/* Mã PIN mới cấp (Requirement 7 & 8) */}
                      <td className="py-2.5 px-3">
                        {hasNewPin ? (
                          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-950 px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs font-mono font-black text-sm">
                            <span className="tracking-wider">{acc.newTempPin}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(acc.newTempPin!, `pin_${acc.id}`)}
                              className="p-1 hover:bg-amber-200 rounded text-amber-800 cursor-pointer"
                              title="Sao chép mã PIN mới cấp"
                            >
                              {copiedCode === `pin_${acc.id}` ? (
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span className="text-[9px] font-sans font-bold text-amber-800 bg-amber-200/80 px-1 py-0.2 rounded">
                              Mới cấp
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400">
                            <span className="font-mono text-sm tracking-widest text-slate-400 font-bold">••••••</span>
                            <span className="text-[10px] text-slate-400 italic">
                              (Đã băm SHA-256)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Thao tác từng học sinh */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSingleStudentModal(acc);
                            setSingleCustomPin('');
                            setSingleIssuedPinResult(null);
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-500 hover:text-slate-950 text-amber-800 font-black text-[11px] rounded-lg transition border border-amber-300 cursor-pointer flex items-center gap-1 mx-auto shadow-2xs"
                          title="Cấp lại mã PIN riêng và xuất phiếu cho học sinh này"
                        >
                          <KeyRound className="w-3 h-3 text-amber-600 hover:text-slate-950" />
                          <span>Cấp lại PIN</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* MASTER "CẤP LẠI PIN VÀ XUẤT EXCEL" MODAL DIALOG */}
      {/* ======================================================== */}
      {isMainResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border-2 border-amber-500 overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 p-4.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-950 text-amber-400 rounded-2xl shadow-md">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight text-slate-950">
                    CẤP LẠI PIN VÀ XUẤT EXCEL
                  </h3>
                  <p className="text-xs text-amber-950 font-semibold">
                    Sinh mã PIN ngẫu nhiên 6 chữ số • Băm SHA-256 • Xuất file Excel (.xlsx)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMainResetModalOpen(false)} 
                className="text-slate-900 hover:text-slate-950 p-1.5 rounded-xl hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              
              {/* Step 1: Chọn đối tượng cấp PIN */}
              <div className="space-y-2">
                <label className="font-black text-slate-800 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>1. Chọn phạm vi học sinh để cấp lại PIN:</span>
                </label>

                <div className="space-y-2">
                  {/* Option: Từng lớp cụ thể */}
                  <label className={`p-3 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                    resetTargetScope === 'class' ? 'bg-amber-50/80 border-amber-500 text-slate-900 shadow-xs' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="resetScope"
                      checked={resetTargetScope === 'class'}
                      onChange={() => setResetTargetScope('class')}
                      className="mt-1 text-amber-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm">Cấp cho một lớp cụ thể</span>
                        <select
                          value={chosenClassForReset}
                          onChange={(e) => {
                            setChosenClassForReset(e.target.value);
                            setResetTargetScope('class');
                          }}
                          className="px-2.5 py-1 bg-white border border-amber-300 rounded-xl font-bold text-xs text-blue-900 outline-none"
                        >
                          {CLASSES_DATA.map(c => (
                            <option key={c.id} value={c.id}>
                              Lớp {c.id.replace('.', '/')} ({c.totalStudents} học sinh)
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Chỉ cấp lại PIN cho học sinh lớp này, giữ nguyên PIN của 8 lớp còn lại.
                      </p>
                    </div>
                  </label>

                  {/* Option: Toàn trường */}
                  <label className={`p-3 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                    resetTargetScope === 'all' ? 'bg-amber-50/80 border-amber-500 text-slate-900 shadow-xs' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}>
                    <input
                      type="radio"
                      name="resetScope"
                      checked={resetTargetScope === 'all'}
                      onChange={() => setResetTargetScope('all')}
                      className="mt-1 text-amber-600"
                    />
                    <div>
                      <span className="font-black text-sm">Toàn trường (9 lớp • 249 học sinh)</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Cấp mới mã PIN đồng loạt cho toàn bộ học sinh Trường TH Đồng Dương 2 để bàn giao đầu năm học hoặc đầu kỳ.
                      </p>
                    </div>
                  </label>

                  {/* Option: Danh sách tick chọn */}
                  {selectedStudentIds.size > 0 && (
                    <label className={`p-3 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                      resetTargetScope === 'selected' ? 'bg-amber-50/80 border-amber-500 text-slate-900 shadow-xs' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}>
                      <input
                        type="radio"
                        name="resetScope"
                        checked={resetTargetScope === 'selected'}
                        onChange={() => setResetTargetScope('selected')}
                        className="mt-1 text-amber-600"
                      />
                      <div>
                        <span className="font-black text-sm">Chỉ {selectedStudentIds.size} học sinh đã tích chọn</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cấp lại mã PIN cho riêng các em được đánh dấu chọn trong bảng.
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Step 2: Cơ chế sinh PIN (Requirement 4: CSPRNG >= 6 số) */}
              <div className="space-y-2 pt-1 border-t border-slate-200">
                <label className="font-black text-slate-800 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>2. Cơ chế tạo mã PIN (Tối thiểu 6 chữ số):</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomPinMode('random')}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                      customPinMode === 'random' 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs text-emerald-900">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>Sinh 6 số ngẫu nhiên CSPRNG</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-normal">
                      Mỗi em 1 mã PIN riêng biệt (ví dụ: 849201, 573194). Khuyến nghị bảo mật cao nhất.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomPinMode('custom')}
                    className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                      customPinMode === 'custom' 
                        ? 'bg-blue-50 border-blue-500 text-blue-950 font-bold' 
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs text-blue-900">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span>Đặt mã PIN khởi tạo chung</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 font-normal">
                      Tất cả học sinh dùng chung 1 mã PIN ban đầu (tối thiểu 6 số), bắt buộc đổi ngay khi vào máy.
                    </p>
                  </button>
                </div>

                {customPinMode === 'custom' && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                    <label className="font-bold text-blue-950 block">Nhập mã PIN khởi tạo chung (tối thiểu 6 chữ số):</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={customPinInput}
                      onChange={(e) => setCustomPinInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ví dụ: 123456"
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-xs font-mono font-black text-blue-950 tracking-wider outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-[10px] text-blue-800 block">
                      * Học sinh sẽ được yêu cầu đổi mã PIN bí mật riêng ngay trong lần đầu đăng nhập.
                    </span>
                  </div>
                )}
              </div>

              {/* Security confirmation banner */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-slate-600 text-[11px]">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Quy trình tự động sau khi xác nhận:</span>
                </div>
                <p>• Máy chủ tạo PIN, băm SHA-256 lưu CSDL và xóa vĩnh viễn PIN thuần.</p>
                <p>• Trình duyệt tự động tải xuống tệp <strong>Excel (.xlsx)</strong> chứa: <em>STT, Lớp, Họ và tên, Mã đăng nhập, Mã PIN mới cấp, Máy được phân công</em>.</p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMainResetModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isResettingMaster}
                  onClick={handleExecuteResetAndExport}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 rounded-xl font-black text-xs transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isResettingMaster ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Đang băm mật khẩu & tạo Excel...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>Xác nhận Cấp lại PIN & Tải tệp Excel</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* POST-RESET RESULTS & EXCEL DOWNLOAD MODAL (Requirement 8) */}
      {/* ======================================================== */}
      {postResetResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col">
            
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white text-emerald-700 rounded-xl shadow-md">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-base uppercase tracking-tight">
                    CẤP LẠI MÃ PIN & TẢI EXCEL THÀNH CÔNG!
                  </h3>
                  <p className="text-xs text-emerald-100">
                    Phạm vi: {postResetResult.scopeTitle} • Tổng cộng {postResetResult.count} học sinh
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPostResetResult(null)} 
                className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Download banner notice */}
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-black text-emerald-950 text-xs block">
                      Tệp Excel (.xlsx) đã được tự động tạo và tải về máy tính của Thầy/Cô!
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Bao gồm 6 cột: STT, Lớp, Họ và tên, Mã đăng nhập, PIN mới cấp, Máy được phân công.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const exportRows: StudentAccountRow[] = postResetResult.items.map((item, idx) => ({
                      stt: idx + 1,
                      id: item.id,
                      code: item.code,
                      name: item.name,
                      classId: item.classId,
                      seatNumber: idx + 1,
                      gender: 'male',
                      assignedPc: item.assignedPc,
                      assignedPcId: null,
                      hasPin: true,
                      mustChangePinOnFirstLogin: true,
                      pinUpdatedAt: new Date().toISOString(),
                      pinResetCount: 1,
                      newTempPin: item.newTempPin,
                    }));
                    exportStudentAccountsToExcel(exportRows, {
                      scopeName: postResetResult.scopeTitle,
                      teacherName: session.teacherName || 'Cô Nguyễn Thị Huệ',
                      isFreshReset: true,
                    });
                  }}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải lại file Excel</span>
                </button>
              </div>

              {/* Requirement 8 & 9 Security Warning */}
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl text-[11px] text-amber-950 space-y-1">
                <span className="font-bold block flex items-center gap-1 text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  LƯU Ý BẢO MẬT (QUAN TRỌNG):
                </span>
                <p className="leading-relaxed text-amber-900">
                  Mã PIN văn bản thuần chỉ tồn tại trong phiên làm việc này để Thầy/Cô kiểm tra hoặc in phiếu phát cho học sinh. Sau khi đóng cửa sổ này hoặc tải lại trang, mã PIN văn bản thuần sẽ bị xóa vĩnh viễn khỏi bộ nhớ, chỉ còn bản băm <strong>SHA-256</strong> trên máy chủ.
                </p>
              </div>

              {/* Quick Preview Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="p-2.5 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 flex items-center justify-between">
                  <span>Bảng xem nhanh {postResetResult.items.length} mã PIN vừa cấp:</span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="flex items-center gap-1 text-slate-600 hover:text-blue-600 cursor-pointer text-[11px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In phiếu</span>
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2 text-center w-10">STT</th>
                        <th className="p-2 w-16">Lớp</th>
                        <th className="p-2">Họ và tên</th>
                        <th className="p-2 w-28">Mã đăng nhập</th>
                        <th className="p-2 w-28 text-center">Mã PIN mới</th>
                        <th className="p-2 w-24">Máy trạm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {postResetResult.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-blue-50/50">
                          <td className="p-2 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-2 font-bold text-blue-900">{item.classId.replace('.', '/')}</td>
                          <td className="p-2 font-bold text-slate-900">{item.name}</td>
                          <td className="p-2 font-mono text-blue-800">{item.code}</td>
                          <td className="p-2 text-center">
                            <span className="font-mono font-black text-amber-950 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                              {item.newTempPin}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600 font-semibold">{item.assignedPc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPostResetResult(null)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Đã tải file Excel & Hoàn tất
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SINGLE STUDENT RESET MODAL */}
      {/* ======================================================== */}
      {singleStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-amber-500 overflow-hidden flex flex-col">
            
            <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-slate-950 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-950 text-amber-400 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase">Cấp lại mã PIN học sinh</h3>
                  <p className="text-[11px] text-slate-950 font-medium">Em: {singleStudentModal.name} ({singleStudentModal.code})</p>
                </div>
              </div>
              <button 
                onClick={() => setSingleStudentModal(null)} 
                className="text-slate-950/80 hover:text-slate-950 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {singleIssuedPinResult ? (
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 text-center space-y-3">
                  <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-full mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-emerald-950 uppercase">MÃ PIN MỚI ĐÃ CẤP THÀNH CÔNG</h4>
                    <p className="text-[11px] text-emerald-800 mt-1">
                      Học sinh: <strong>{singleIssuedPinResult.studentName}</strong> • Mã đăng nhập: <strong>{singleIssuedPinResult.code}</strong>
                    </p>
                  </div>

                  {/* Highlighted 6-digit PIN */}
                  <div className="p-3 bg-white border-2 border-emerald-300 rounded-2xl inline-flex items-center gap-3 shadow-xs">
                    <span className="font-mono text-3xl font-black text-blue-950 tracking-wider">
                      {singleIssuedPinResult.pin}
                    </span>
                    <button
                      onClick={() => handleCopy(singleIssuedPinResult.pin, 'single_modal_pin')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                    >
                      {copiedCode === 'single_modal_pin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedCode === 'single_modal_pin' ? 'Đã sao chép' : 'Sao chép'}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleExportSingleStudentReceipt}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Xuất phiếu Excel em này (.xlsx)</span>
                    </button>
                  </div>

                  <div className="text-[11px] text-amber-950 bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-left">
                    <span className="font-bold text-amber-900 block flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      Lưu ý bảo mật (Chỉ hiển thị 1 lần):
                    </span>
                    <p className="mt-0.5 text-amber-800">
                      Mã PIN này đã được băm bcrypt (10 vòng) an toàn và lưu vào CSDL Supabase (public.student_credentials). Vui lòng ghi lại hoặc gửi cho học sinh ngay vì mã sẽ không hiển thị lại sau khi đóng.
                    </p>
                  </div>

                  <button
                    onClick={() => setSingleStudentModal(null)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Hoàn tất & Đóng
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Lớp: <strong>Lớp {singleStudentModal.classId.replace('.', '/')}</strong></span>
                      <span>Mã đăng nhập: <strong className="font-mono text-blue-800">{singleStudentModal.code}</strong></span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Máy phân công: <strong>{singleStudentModal.assignedPc}</strong></span>
                      <span>Số lần đã cấp: <strong>{singleStudentModal.pinResetCount} lần</strong></span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">
                      Tùy chọn mã PIN mới (tối thiểu 6 chữ số):
                    </label>
                    <input
                      type="text"
                      maxLength={8}
                      value={singleCustomPin}
                      onChange={(e) => setSingleCustomPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Để trống để tự tạo 6 số ngẫu nhiên CSPRNG"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
                    />
                    <span className="text-[10px] text-slate-500 block">
                      * Nếu để trống, hệ thống máy chủ sẽ tự sinh mã PIN ngẫu nhiên 6 chữ số đảm bảo bảo mật.
                    </span>
                  </div>

                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-0.5">
                    <span className="font-bold block flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Quy chuẩn bảo mật máy chủ & Supabase:
                    </span>
                    <p className="text-blue-800">
                      Mã PIN sẽ được băm bcrypt (10 vòng) kèm salt ngẫu nhiên riêng biệt, lưu vào CSDL Supabase <code>public.student_credentials</code>. Học sinh sẽ được yêu cầu đổi mã PIN riêng khi đăng nhập lần đầu vào phòng máy.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSingleStudentModal(null)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type="button"
                      disabled={isResettingSingle}
                      onClick={handleConfirmSingleReset}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {isResettingSingle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                      <span>Xác nhận Cấp lại PIN</span>
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TEACHER AUTHENTICATION MODAL (GIAI ĐOẠN 1) */}
      {/* ======================================================== */}
      {showTeacherAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-amber-500 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-4.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-md">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-tight text-amber-300">
                    Xác thực Giáo viên Tin học
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Bảo mật máy chủ & CSDL Supabase • TT 27/2020/TT-BGDĐT
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTeacherAuthModal(false);
                  setTeacherAuthError(null);
                }} 
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTeacherLoginSubmit} className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1 text-blue-950">
                  <Lock className="w-3.5 h-3.5 text-blue-600" />
                  Quy định bảo mật quyền Quản trị viên:
                </span>
                <p className="leading-relaxed">
                  Để ngăn chặn việc cấp PIN trái phép, máy chủ yêu cầu Giáo viên phụ trách bộ môn xác thực mật khẩu phiên trước khi thao tác cấp lại PIN cho học sinh.
                </p>
              </div>

              {teacherAuthError && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-semibold space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{teacherAuthError}</span>
                  </div>
                  <p className="text-[11px] font-normal text-rose-700 pl-6">
                    💡 Mẹo: Hãy kiểm tra bộ gõ tiếng Việt (Unikey/EVKey) tránh gõ nhầm chữ hoặc bấm nút <strong>Điền nhanh</strong> bên dưới.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 block text-xs">
                    Mật khẩu Giáo viên / Quản trị viên:
                  </label>
                  <span className="text-[11px] text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    ℹ️ Không cần tên tài khoản
                  </span>
                </div>

                <div className="relative">
                  <input
                    type={showTeacherPassword ? "text" : "password"}
                    value={teacherPasswordInput}
                    onChange={(e) => setTeacherPasswordInput(e.target.value)}
                    placeholder="Nhập DongDuong@2026 hoặc admin..."
                    autoFocus
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md"
                    title={showTeacherPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Quick autofill helper buttons */}
                <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-xl space-y-1.5">
                  <div className="text-[11px] font-bold text-amber-950 flex items-center justify-between">
                    <span>⚡ Bấm để điền nhanh mật khẩu mặc định:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherPasswordInput('DongDuong@2026');
                        setTeacherAuthError(null);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[11px] shadow-xs cursor-pointer transition flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      DongDuong@2026 (Chuẩn)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherPasswordInput('admin');
                        setTeacherAuthError(null);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-[11px] border border-slate-300 cursor-pointer transition"
                    >
                      admin
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherPasswordInput('giaovien');
                        setTeacherAuthError(null);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg text-[11px] border border-slate-300 cursor-pointer transition"
                    >
                      giaovien
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600">
                    * Hệ thống đã hỗ trợ các mật khẩu: <code className="font-mono font-bold text-blue-900">DongDuong@2026</code>, <code className="font-mono font-bold text-blue-900">admin</code>, <code className="font-mono font-bold text-blue-900">giaovien</code> (hoặc cấu hình qua biến môi trường <code className="font-mono">TEACHER_ADMIN_KEY</code>).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTeacherAuthModal(false);
                    setTeacherAuthError(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingTeacher}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingTeacher ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>Xác nhận quyền Giáo viên</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
