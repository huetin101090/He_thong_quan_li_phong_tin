import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserSession 
} from '../types/assignments';
import { 
  Student, 
  ClassInfo, 
  AttendanceRecord 
} from '../types/classroom';
import { 
  TheoryQuiz, 
  PracticeAssignment, 
  QuizSubmission, 
  PracticeSubmission 
} from '../types/assignments';
import { 
  getStoredQuizzes, 
  getStoredPracticeAssignments, 
  autoGradeQuizSubmission,
  saveQuizSubmission,
  savePracticeSubmission,
  verifyStudentAssignmentAccess
} from '../services/assignmentService';
import { isSameClass, canonicalClassId, SCHOOL_NAME } from '../data/initialData';
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Send, 
  Award, 
  ShieldCheck, 
  LogOut, 
  Key, 
  Monitor, 
  User, 
  FileText, 
  Trophy, 
  HelpCircle, 
  Check, 
  Lock, 
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ExternalLink,
  Bot,
  HeartHandshake
} from 'lucide-react';

interface StudentPortalViewProps {
  session: UserSession;
  students: Student[];
  classes: ClassInfo[];
  currentPcId: number;
  onLogout: () => void;
  onSwitchToTeacher: (adminKey: string) => Promise<{ success: boolean; error?: string }>;
  onOpenChangePin?: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  session,
  students,
  classes,
  currentPcId,
  onLogout,
  onSwitchToTeacher,
  onOpenChangePin,
}) => {
  // Navigation tabs for student
  const [activeTab, setActiveTab] = useState<'today' | 'quiz' | 'practice' | 'results' | 'safety'>('today');

  // Supabase Dashboard data
  const [attendance, setAttendance] = useState<any | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(true);

  // Teacher unlock modal state
  const [showTeacherAuthModal, setShowTeacherAuthModal] = useState<boolean>(false);
  const [teacherKeyInput, setTeacherKeyInput] = useState<string>('');
  const [teacherAuthError, setTeacherAuthError] = useState<string | null>(null);
  const [isVerifyingTeacher, setIsVerifyingTeacher] = useState<boolean>(false);

  // Self PIN change modal state
  const [showChangePinModal, setShowChangePinModal] = useState<boolean>(false);
  const [oldPinInput, setOldPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);

  // Active Quiz Taker state
  const [selectedQuiz, setSelectedQuiz] = useState<TheoryQuiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | string[]>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<{ score: number; correctCount: number; total: number; message: string } | null>(null);

  // Active Practice Submission state
  const [selectedPractice, setSelectedPractice] = useState<PracticeAssignment | null>(null);
  const [productTitleInput, setProductTitleInput] = useState<string>('');
  const [productDescriptionInput, setProductDescriptionInput] = useState<string>('');
  const [isSubmittingPractice, setIsSubmittingPractice] = useState<boolean>(false);
  const [practiceSuccessMsg, setPracticeSuccessMsg] = useState<string | null>(null);

  const studentCode = session.studentId || '';
  const currentStudent = useMemo(() => {
    return students.find(s => s.code.toUpperCase() === studentCode.toUpperCase() || s.id.toUpperCase() === studentCode.toUpperCase());
  }, [students, studentCode]);

  const studentClassId = session.classId || currentStudent?.classId || '4.3';
  const currentClassObj = useMemo(() => {
    return classes.find(c => isSameClass(c.id, studentClassId)) || classes[0];
  }, [classes, studentClassId]);

  // Load Real Supabase Dashboard Data (Attendance & Assessments)
  const loadDashboard = async () => {
    if (!studentCode) return;
    setIsLoadingDashboard(true);
    try {
      const res = await fetch(`/api/student/dashboard?studentCode=${encodeURIComponent(studentCode)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.attendance) setAttendance(data.attendance);
          if (Array.isArray(data.assessments)) setAssessments(data.assessments);
        }
      }
    } catch (e) {
      console.warn('Could not load student dashboard from Supabase:', e);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [studentCode]);

  // Filter Quizzes strictly for this student's class (Requirement 3)
  const availableQuizzes = useMemo(() => {
    const all = getStoredQuizzes();
    return all.filter(q => {
      if (q.status === 'closed') return false;
      if (!q.targetClassIds || q.targetClassIds.length === 0) return true;
      return q.targetClassIds.some(cid => isSameClass(cid, studentClassId));
    });
  }, [studentClassId]);

  // Filter Practice Assignments strictly for this student's class (Requirement 3)
  const availablePractice = useMemo(() => {
    const all = getStoredPracticeAssignments();
    return all.filter(p => {
      if (p.status === 'closed') return false;
      if (!p.targetClassIds || p.targetClassIds.length === 0) return true;
      return p.targetClassIds.some(cid => isSameClass(cid, studentClassId));
    });
  }, [studentClassId]);

  // Handle Quiz Submission to Supabase
  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuiz) return;

    // Check answered questions
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < selectedQuiz.questions.length) {
      const confirmSubmit = window.confirm(`Em mới trả lời ${answeredCount}/${selectedQuiz.questions.length} câu hỏi. Em có chắc chắn muốn nộp bài luôn không?`);
      if (!confirmSubmit) return;
    }

    setIsSubmittingQuiz(true);
    try {
      // Auto grade
      const grading = autoGradeQuizSubmission(selectedQuiz, quizAnswers);
      const score = Math.round(grading.autoGradedScore * 10) / 10;
      
      let correctCount = 0;
      selectedQuiz.questions.forEach(q => {
        const ans = quizAnswers[q.id];
        if (Array.isArray(q.correctAnswers)) {
          if (Array.isArray(ans) && ans.length === q.correctAnswers.length && ans.every(a => q.correctAnswers.includes(a))) {
            correctCount++;
          }
        } else if (ans === q.correctAnswers) {
          correctCount++;
        }
      });

      // 1. Submit to Server & Supabase public.assessments
      const res = await fetch('/api/student/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode,
          quizId: selectedQuiz.id,
          quizTitle: selectedQuiz.title,
          classId: studentClassId,
          score,
          totalQuestions: selectedQuiz.questions.length,
          correctCount,
        }),
      });

      const serverData = await res.json();

      // 2. Also save to local storage cache
      const submission: QuizSubmission = {
        id: `qsub_${selectedQuiz.id}_${studentCode}_${Date.now()}`,
        quizId: selectedQuiz.id,
        quizTitle: selectedQuiz.title,
        studentId: studentCode,
        studentName: session.studentName || 'Học sinh',
        classId: studentClassId,
        attemptNumber: 1,
        answers: quizAnswers,
        questionScores: grading.questionScores,
        autoGradedScore: score,
        essayScore: null,
        finalScore: score,
        isGraded: true,
        submittedAt: new Date().toLocaleString('vi-VN'),
      };
      saveQuizSubmission(submission);

      setQuizResult({
        score,
        correctCount,
        total: selectedQuiz.questions.length,
        message: serverData.message || `Chúc mừng em đã hoàn thành bài! Đạt ${score}/10 điểm.`,
      });

      // Reload assessments
      loadDashboard();
    } catch (err: any) {
      alert(`Lỗi nộp bài: ${err?.message || 'Vui lòng thử lại!'}`);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  // Handle Practice Submission to Supabase
  const handlePracticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPractice) return;

    if (!productTitleInput.trim()) {
      alert('Vui lòng nhập Tên sản phẩm hoặc tiêu đề bài làm của em!');
      return;
    }

    setIsSubmittingPractice(true);
    try {
      const res = await fetch('/api/student/submit-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode,
          assignmentId: selectedPractice.id,
          assignmentTitle: selectedPractice.title,
          classId: studentClassId,
          productTitle: productTitleInput.trim(),
          productContent: productDescriptionInput.trim(),
          fileType: 'DOCX',
          score: 10,
        }),
      });

      const data = await res.json();

      // Save to local cache
      const sub: PracticeSubmission = {
        id: `psub_${selectedPractice.id}_${studentCode}_${Date.now()}`,
        assignmentId: selectedPractice.id,
        studentId: studentCode,
        studentName: session.studentName || 'Học sinh',
        classId: studentClassId,
        fileName: `${productTitleInput.trim()}.docx`,
        fileType: 'DOCX',
        fileSize: '150 KB',
        fileContentText: productDescriptionInput.trim() || productTitleInput.trim(),
        submittedAt: new Date().toLocaleString('vi-VN'),
        status: 'submitted',
        rubricScores: {},
        finalScore: 10,
        gradeLevel: 'T',
        teacherComment: 'Đã nộp bài thành công trên Cổng Học Sinh.',
        canResubmit: true,
        history: [{ action: 'Nộp bài trực tuyến', timestamp: new Date().toLocaleString('vi-VN') }],
      };
      savePracticeSubmission(sub);

      setPracticeSuccessMsg(`Đã nộp bài thành công! Bài làm "${productTitleInput.trim()}" đã được lưu lên CSDL Supabase.`);
      setProductTitleInput('');
      setProductDescriptionInput('');
      loadDashboard();
    } catch (err: any) {
      alert(`Lỗi nộp bài thực hành: ${err?.message || 'Vui lòng thử lại!'}`);
    } finally {
      setIsSubmittingPractice(false);
    }
  };

  // Handle Teacher Authorization Unlock
  const handleTeacherUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherAuthError(null);
    if (!teacherKeyInput.trim()) {
      setTeacherAuthError('Vui lòng nhập mật khẩu quản lý của Giáo viên!');
      return;
    }

    setIsVerifyingTeacher(true);
    try {
      const result = await onSwitchToTeacher(teacherKeyInput.trim());
      if (result.success) {
        setShowTeacherAuthModal(false);
        setTeacherKeyInput('');
      } else {
        setTeacherAuthError(result.error || 'Mật khẩu Giáo viên không chính xác!');
      }
    } catch (err: any) {
      setTeacherAuthError(err?.message || 'Lỗi xác thực mật khẩu!');
    } finally {
      setIsVerifyingTeacher(false);
    }
  };

  // Handle Self PIN Change
  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeMsg(null);
    if (!oldPinInput.trim() || !newPinInput.trim()) {
      setPinChangeMsg({ text: 'Vui lòng nhập đầy đủ mã PIN cũ và mới!', isError: true });
      return;
    }
    if (newPinInput.trim().length < 4 || newPinInput.trim().length > 8) {
      setPinChangeMsg({ text: 'Mã PIN mới phải từ 4 đến 8 chữ số!', isError: true });
      return;
    }
    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinChangeMsg({ text: 'Mã PIN nhập lại không khớp!', isError: true });
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await fetch('/api/auth/student-change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode,
          oldPin: oldPinInput.trim(),
          newPin: newPinInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPinChangeMsg({ text: data.message || 'Đổi mã PIN thành công! Em hãy ghi nhớ mã PIN mới này nhé.', isError: false });
        setOldPinInput('');
        setNewPinInput('');
        setConfirmPinInput('');
      } else {
        setPinChangeMsg({ text: data.error || 'Đổi mã PIN thất bại!', isError: true });
      }
    } catch (e: any) {
      setPinChangeMsg({ text: 'Lỗi kết nối máy chủ khi đổi PIN!', isError: true });
    } finally {
      setIsChangingPin(false);
    }
  };

  return (
    <div className="max-w-6xl w-full mx-auto space-y-4 font-sans text-slate-800">
      
      {/* 1. TOP HEADER: Thẻ nhận diện học sinh & Điểm danh Supabase */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-blue-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Student Identity */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl sm:text-4xl shadow-inner">
              {currentStudent?.gender === 'female' ? '👧' : '👦'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-white/20 text-cyan-100 uppercase tracking-wider">
                  Cổng học sinh cá nhân
                </span>
                <span className="text-xs text-blue-200">{SCHOOL_NAME}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                {session.studentName || 'Học sinh'}
              </h1>
              <div className="flex items-center gap-3 mt-1.5 text-xs sm:text-sm font-semibold text-blue-100 flex-wrap">
                <span>Mã số: <strong className="text-yellow-300 font-mono text-base">{studentCode}</strong></span>
                <span>•</span>
                <span>Lớp: <strong className="text-white text-base">{currentClassObj.name}</strong></span>
                <span>•</span>
                <span className="bg-cyan-500/20 px-2 py-0.5 rounded-lg border border-cyan-400/30 text-cyan-200">
                  <Monitor className="w-3.5 h-3.5 inline mr-1" />
                  Máy trạm: <strong>PC{currentPcId < 10 ? '0' + currentPcId : currentPcId}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Attendance Status Badge directly from Supabase */}
          <div className="flex flex-col items-start md:items-end gap-2 w-full md:w-auto">
            {attendance ? (
              attendance.status === 'present' ? (
                <div className="px-4 py-2 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">Trạng thái điểm danh (Supabase)</div>
                    <div className="text-sm font-black text-white">✓ Đã có mặt (Giáo viên đã duyệt)</div>
                  </div>
                </div>
              ) : attendance.status === 'wrong_pc' ? (
                <div className="px-4 py-2 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-300">Cảnh báo chỗ ngồi</div>
                    <div className="text-sm font-black text-white">⚠️ Đang ngồi khác máy phân công</div>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-300 shrink-0 animate-pulse" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-300">Trạng thái điểm danh (Supabase)</div>
                    <div className="text-sm font-black text-white">✓ Đã điểm danh (Chờ GV duyệt)</div>
                  </div>
                </div>
              )
            ) : (
              <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 text-white flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-300" />
                <span className="text-xs font-semibold">Đã đăng nhập tại Máy PC{currentPcId < 10 ? '0' + currentPcId : currentPcId}</span>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setShowChangePinModal(true)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Đổi mã PIN cá nhân để bảo vệ tài khoản"
              >
                <Key className="w-3.5 h-3.5 text-yellow-300" />
                <span>Đổi mã PIN</span>
              </button>

              <button
                onClick={() => setShowTeacherAuthModal(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
                title="Chuyển sang bảng điều khiển Giáo viên (Yêu cầu mật khẩu)"
              >
                <Lock className="w-3.5 h-3.5 text-blue-300" />
                <span>Dành cho Giáo viên</span>
              </button>

              <button
                onClick={onLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Đăng xuất khỏi máy tính này"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* 2. NAVIGATION BAR: 5 Mục lớn thân thiện cho học sinh */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => { setActiveTab('today'); setSelectedQuiz(null); }}
          className={`p-3.5 rounded-2xl font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer shadow-sm ${
            activeTab === 'today'
              ? 'bg-blue-600 text-white shadow-md scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <BookOpen className="w-6 h-6" />
          <span className="text-sm">Bài học hôm nay</span>
          <span className="text-[10px] opacity-80 font-normal">Lý thuyết & Thực hành</span>
        </button>

        <button
          onClick={() => { setActiveTab('quiz'); setQuizResult(null); }}
          className={`p-3.5 rounded-2xl font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer shadow-sm ${
            activeTab === 'quiz'
              ? 'bg-indigo-600 text-white shadow-md scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <HelpCircle className="w-6 h-6" />
          <span className="text-sm">Làm trắc nghiệm</span>
          <span className="text-[10px] opacity-80 font-normal">{availableQuizzes.length} bài của lớp em</span>
        </button>

        <button
          onClick={() => { setActiveTab('practice'); setPracticeSuccessMsg(null); }}
          className={`p-3.5 rounded-2xl font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer shadow-sm ${
            activeTab === 'practice'
              ? 'bg-emerald-600 text-white shadow-md scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <Monitor className="w-6 h-6" />
          <span className="text-sm">Nộp bài thực hành</span>
          <span className="text-[10px] opacity-80 font-normal">{availablePractice.length} bài tập số</span>
        </button>

        <button
          onClick={() => { setActiveTab('results'); loadDashboard(); }}
          className={`p-3.5 rounded-2xl font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer shadow-sm ${
            activeTab === 'results'
              ? 'bg-amber-600 text-white shadow-md scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <Trophy className="w-6 h-6" />
          <span className="text-sm">Kết quả của em</span>
          <span className="text-[10px] opacity-80 font-normal">Điểm số & Nhận xét</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`col-span-2 sm:col-span-1 p-3.5 rounded-2xl font-bold transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer shadow-sm ${
            activeTab === 'safety'
              ? 'bg-teal-600 text-white shadow-md scale-[1.02]'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
          }`}
        >
          <ShieldCheck className="w-6 h-6" />
          <span className="text-sm">An toàn số & AI</span>
          <span className="text-[10px] opacity-80 font-normal">Bảo vệ tài khoản</span>
        </button>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: BÀI HỌC VÀ BÀI TẬP HÔM NAY */}
      {activeTab === 'today' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Nhiệm vụ học tập lớp {currentClassObj.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các bài tập lý thuyết và bài thực hành số được cô giáo giao cho lớp của em.
                </p>
              </div>
              <button 
                onClick={loadDashboard}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Tải lại dữ liệu mới nhất"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>

            {/* List of Today's Quizzes */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                Bài kiểm tra lý thuyết trắc nghiệm
              </h3>

              {availableQuizzes.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs">
                  Hiện chưa có bài trắc nghiệm mới cho lớp {currentClassObj.name}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availableQuizzes.map(quiz => {
                    const isCompleted = assessments.some(a => a.term === `quiz_${quiz.id}`);
                    return (
                      <div 
                        key={quiz.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                          isCompleted 
                            ? 'bg-emerald-50/60 border-emerald-200' 
                            : 'bg-white hover:border-indigo-300 border-slate-200 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100 text-indigo-700">
                              {quiz.subject === 'congnghe' ? 'Công nghệ' : 'Tin học'} • Khối {quiz.grade}
                            </span>
                            {isCompleted ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 stroke-[3]" /> Đã hoàn thành
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-500">
                                {quiz.questions.length} câu • {quiz.timeLimitMinutes} phút
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-base leading-snug">
                            {quiz.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {quiz.lessonTopic}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">
                            Hạn nộp: <strong>{quiz.deadline}</strong>
                          </span>
                          <button
                            onClick={() => {
                              setSelectedQuiz(quiz);
                              setQuizAnswers({});
                              setQuizResult(null);
                              setActiveTab('quiz');
                            }}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                            }`}
                          >
                            <span>{isCompleted ? 'Làm lại bài' : 'Làm bài ngay'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* List of Practice Tasks */}
            <div className="space-y-3 mt-6">
              <h3 className="text-sm font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-emerald-600" />
                Nhiệm vụ thực hành số trên máy tính
              </h3>

              {availablePractice.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs">
                  Hiện chưa có bài thực hành mới cho lớp {currentClassObj.name}.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {availablePractice.map(prac => {
                    const isSubmitted = assessments.some(a => a.term === `practice_${prac.id}`);
                    return (
                      <div 
                        key={prac.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                          isSubmitted 
                            ? 'bg-emerald-50/60 border-emerald-200' 
                            : 'bg-white hover:border-emerald-300 border-slate-200 shadow-xs'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Thực hành • Khối {prac.grade}
                            </span>
                            {isSubmitted ? (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                <Check className="w-3 h-3 stroke-[3]" /> Đã nộp sản phẩm
                              </span>
                            ) : (
                              <span className="text-[11px] font-semibold text-slate-500">
                                Tối đa 10 điểm
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-slate-900 text-base leading-snug">
                            {prac.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                            {prac.objectives}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500 font-medium">
                            Hạn nộp: <strong>{prac.deadline}</strong>
                          </span>
                          <button
                            onClick={() => {
                              setSelectedPractice(prac);
                              setProductTitleInput('');
                              setProductDescriptionInput('');
                              setPracticeSuccessMsg(null);
                              setActiveTab('practice');
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span>{isSubmitted ? 'Nộp lại bài' : 'Nộp bài làm'}</span>
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: LÀM BÀI TRẮC NGHIỆM */}
      {activeTab === 'quiz' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          {!selectedQuiz ? (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-indigo-600" />
                  Chọn bài trắc nghiệm để bắt đầu làm
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Các câu hỏi trắc nghiệm có nút bấm to rõ, em chỉ cần chọn đáp án đúng nhất.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableQuizzes.map(quiz => (
                  <div 
                    key={quiz.id}
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setQuizAnswers({});
                      setQuizResult(null);
                    }}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition cursor-pointer bg-slate-50/50 hover:bg-white group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600 mb-1">
                      <span>{quiz.questions.length} câu hỏi • {quiz.timeLimitMinutes} phút</span>
                      <span className="bg-indigo-100 px-2 py-0.5 rounded text-[10px]">Bấm để làm bài</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
                      {quiz.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {quiz.lessonTopic}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header of active quiz */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <button
                    onClick={() => setSelectedQuiz(null)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mb-1.5 cursor-pointer"
                  >
                    ← Trở lại danh sách bài trắc nghiệm
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {selectedQuiz.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedQuiz.lessonTopic} • Tổng số: <strong>{selectedQuiz.questions.length} câu hỏi</strong>
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 font-mono font-bold text-sm border border-indigo-200">
                    Thời gian: {selectedQuiz.timeLimitMinutes} phút
                  </span>
                </div>
              </div>

              {/* Quiz Result Display if submitted */}
              {quizResult && (
                <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg space-y-3 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-10 h-10 text-yellow-300 shrink-0" />
                    <div>
                      <h3 className="text-xl font-black text-white">Kết quả bài làm của em</h3>
                      <p className="text-xs text-emerald-100">{quizResult.message}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-white/10 rounded-2xl p-4 text-center">
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-yellow-300">{quizResult.score}/10</div>
                      <div className="text-[11px] text-emerald-100 font-medium">Điểm số</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-white">{quizResult.correctCount}/{quizResult.total}</div>
                      <div className="text-[11px] text-emerald-100 font-medium">Số câu đúng</div>
                    </div>
                    <div>
                      <div className="text-2xl sm:text-3xl font-black text-cyan-200">✓ Đã lưu</div>
                      <div className="text-[11px] text-emerald-100 font-medium">Supabase</div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedQuiz(null);
                        setQuizResult(null);
                        setActiveTab('results');
                      }}
                      className="px-4 py-2 rounded-xl bg-white text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition cursor-pointer"
                    >
                      Xem bảng điểm cá nhân →
                    </button>
                  </div>
                </div>
              )}

              {/* Questions List */}
              <form onSubmit={handleQuizSubmit} className="space-y-6">
                {selectedQuiz.questions.map((q, idx) => {
                  const studentAnswer = quizAnswers[q.id];
                  const isAnswered = studentAnswer !== undefined;

                  return (
                    <div 
                      key={q.id}
                      className={`p-5 rounded-3xl border transition ${
                        isAnswered ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      {/* Question Header */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white font-bold text-xs shrink-0">
                          Câu {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          {q.points} điểm
                        </span>
                      </div>

                      {/* Question Prompt */}
                      <p className="text-base sm:text-lg font-bold text-slate-900 mb-4 leading-relaxed">
                        {q.prompt}
                      </p>

                      {/* Options with Large, Kid-Friendly Buttons */}
                      {q.options && q.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {q.options.map((opt, oIdx) => {
                            const optLetter = String.fromCharCode(65 + oIdx); // A, B, C, D
                            const isSelected = q.type === 'multiple_choice' 
                              ? (Array.isArray(studentAnswer) && studentAnswer.includes(opt))
                              : (studentAnswer === opt);

                            return (
                              <button
                                type="button"
                                key={oIdx}
                                onClick={() => {
                                  if (q.type === 'multiple_choice') {
                                    const currentList = Array.isArray(studentAnswer) ? [...studentAnswer] : [];
                                    const nextList = currentList.includes(opt)
                                      ? currentList.filter(x => x !== opt)
                                      : [...currentList, opt];
                                    setQuizAnswers(prev => ({ ...prev, [q.id]: nextList }));
                                  } else {
                                    setQuizAnswers(prev => ({ ...prev, [q.id]: opt }));
                                  }
                                }}
                                className={`p-4 rounded-2xl text-left font-semibold text-sm transition flex items-center gap-3 cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-md border-2 border-indigo-700 scale-[1.01]'
                                    : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                                }`}
                              >
                                <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {optLetter}
                                </span>
                                <span className="leading-snug">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div>
                          <input
                            type="text"
                            value={typeof studentAnswer === 'string' ? studentAnswer : ''}
                            onChange={(e) => setQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                            placeholder="Gõ câu trả lời ngắn của em vào đây..."
                            className="w-full p-3.5 rounded-2xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-base font-semibold"
                          />
                        </div>
                      )}

                      {/* Explanation if review allowed and quiz finished */}
                      {quizResult && selectedQuiz.allowReview && (
                        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                          <strong>Đáp án đúng:</strong> {Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : q.correctAnswers}
                          <br />
                          <strong>Giải thích:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Submit button bar */}
                {!quizResult && (
                  <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-slate-600">
                      Đã trả lời: <strong>{Object.keys(quizAnswers).length}/{selectedQuiz.questions.length}</strong> câu
                    </span>
                    <button
                      type="submit"
                      disabled={isSubmittingQuiz}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingQuiz ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Đang nộp bài lên Supabase...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          <span>Hoàn thành & Nộp bài</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: NỘP BÀI THỰC HÀNH */}
      {activeTab === 'practice' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          {!selectedPractice ? (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-emerald-600" />
                  Chọn bài tập thực hành số để nộp
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Em có thể nộp bài vẽ Paint, bài Scratch, bài soạn thảo Word hoặc bài trình chiếu PowerPoint.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availablePractice.map(prac => (
                  <div 
                    key={prac.id}
                    onClick={() => {
                      setSelectedPractice(prac);
                      setProductTitleInput('');
                      setProductDescriptionInput('');
                      setPracticeSuccessMsg(null);
                    }}
                    className="p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition cursor-pointer bg-slate-50/50 hover:bg-white group"
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-600 mb-1">
                      <span>Định dạng: {prac.allowedFileTypes.join(', ')}</span>
                      <span className="bg-emerald-100 px-2 py-0.5 rounded text-[10px]">Bấm để nộp bài</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition">
                      {prac.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {prac.objectives}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <button
                    onClick={() => setSelectedPractice(null)}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 mb-1.5 cursor-pointer"
                  >
                    ← Trở lại danh sách bài thực hành
                  </button>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                    {selectedPractice.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {selectedPractice.objectives} • Hạn nộp: <strong>{selectedPractice.deadline}</strong>
                  </p>
                </div>
              </div>

              {/* Success alert */}
              {practiceSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{practiceSuccessMsg}</span>
                </div>
              )}

              {/* Instructions Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Hướng dẫn của cô giáo:
                </h4>
                <p className="text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedPractice.instructions}
                </p>
              </div>

              {/* Submission Form */}
              <form onSubmit={handlePracticeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tên sản phẩm của em <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productTitleInput}
                    onChange={(e) => setProductTitleInput(e.target.value)}
                    placeholder="Ví dụ: Bức tranh Ngôi trường em yêu - Trần Văn Hà"
                    className="w-full p-3.5 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-base font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Mô tả bài làm hoặc link dự án Scratch / Canva (nếu có)
                  </label>
                  <textarea
                    rows={3}
                    value={productDescriptionInput}
                    onChange={(e) => setProductDescriptionInput(e.target.value)}
                    placeholder="Em đã vẽ bức tranh bằng công cụ bút chì và tô màu nước... Hoặc dán đường link dự án của em vào đây."
                    className="w-full p-3.5 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-sm font-medium"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Sau khi nộp, hệ thống sẽ lưu trực tiếp vào CSDL Supabase để cô giáo chấm điểm và nhận xét cho em.</span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPractice(null)}
                    className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingPractice}
                    className="px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingPractice ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Đang lưu lên Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Gửi bài cho cô giáo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: KẾT QUẢ HỌC TẬP CỦA EM (Từ Supabase assessments) */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Kết quả học tập & Nhận xét của em
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Dữ liệu điểm số và nhận xét được lưu trữ bảo mật trên CSDL Supabase. Chỉ em mới xem được kết quả này.
              </p>
            </div>
            <button
              onClick={loadDashboard}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cập nhật</span>
            </button>
          </div>

          {isLoadingDashboard ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
              <span className="text-xs">Đang tải bảng điểm từ Supabase...</span>
            </div>
          ) : assessments.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <Award className="w-8 h-8 mx-auto text-slate-400" />
              <p className="text-sm font-bold text-slate-700">Chưa có bản ghi điểm nào trên hệ thống</p>
              <p className="text-xs text-slate-500">Em hãy hoàn thành bài trắc nghiệm hoặc nộp bài thực hành để nhận điểm nhé!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assessments.map(item => (
                <div 
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-amber-300 bg-slate-50/50 hover:bg-white transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                        {item.term ? item.term.replace('_', ' ') : 'Đánh giá'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleString('vi-VN') : ''}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800">
                      {item.comment || 'Hoàn thành bài học'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-2xl font-black text-amber-600">
                        {item.score !== null ? `${item.score}` : '--'}
                        <span className="text-xs font-normal text-slate-400">/10</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Đã lưu Supabase
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: GÓC AN TOÀN SỐ & AI CÓ TRÁCH NHIỆM (Requirement 9) */}
      {activeTab === 'safety' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xl font-black text-teal-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600" />
              Góc An Toàn Số & Sử Dụng AI Có Trách Nhiệm
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Những điều quan trọng học sinh {SCHOOL_NAME} cần nhớ khi học Tin học và dùng máy tính.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Box 1: Bảo vệ PIN */}
            <div className="p-5 rounded-3xl bg-amber-50/80 border border-amber-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🔐
              </div>
              <h3 className="font-bold text-base text-amber-950">1. Bảo vệ mã PIN & Tài khoản</h3>
              <ul className="text-xs text-amber-900 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
                <li>Mã PIN là mật khẩu cá nhân của riêng em, <strong>tuyệt đối không chia sẻ cho bạn khác</strong>.</li>
                <li>Không cho bạn khác mượn tài khoản để điểm danh hộ hoặc nộp bài hộ.</li>
                <li>Nếu nghi ngờ mã PIN bị bạn nhìn thấy, hãy bấm <strong>"Đổi mã PIN"</strong> ngay.</li>
                <li>Luôn bấm <strong>"Đăng xuất"</strong> trước khi rời khỏi phòng máy Tin học.</li>
              </ul>
            </div>

            {/* Box 2: An toàn trên mạng */}
            <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🌐
              </div>
              <h3 className="font-bold text-base text-blue-950">2. An toàn trên Internet</h3>
              <ul className="text-xs text-blue-900 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
                <li>Không cung cấp thông tin cá nhân (địa chỉ nhà, số điện thoại, mật khẩu) cho trang web lạ.</li>
                <li>Không bấm vào các đường link quảng cáo, nhận quà miễn phí đáng ngờ.</li>
                <li>Luôn cư xử lễ phép, không dùng lời lẽ thô tục khi thảo luận trên máy tính.</li>
                <li>Báo ngay cho <strong>Cô Huệ hoặc Thầy Cô phụ trách</strong> nếu thấy nội dung bất thường.</li>
              </ul>
            </div>

            {/* Box 3: Dùng AI có trách nhiệm */}
            <div className="p-5 rounded-3xl bg-purple-50/80 border border-purple-200 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                🤖
              </div>
              <h3 className="font-bold text-base text-purple-950">3. Học cùng AI có trách nhiệm</h3>
              <ul className="text-xs text-purple-900 space-y-1.5 list-disc pl-4 leading-relaxed font-medium">
                <li>Dùng Trí tuệ Nhân tạo (AI) như một người bạn gợi ý ý tưởng và giải thích bài học.</li>
                <li><strong>Không sao chép nguyên văn</strong> câu trả lời của AI để nộp bài làm bài tập của mình.</li>
                <li>Luôn tự suy nghĩ, kiểm tra lại thông tin và trung thực trong học tập.</li>
                <li>Tôn trọng quyền tác giả và công sức sáng tạo của bản thân cũng như của các bạn.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: XÁC THỰC GIÁO VIÊN ĐỂ RỜI KHỎI CỔNG HỌC SINH (Yêu cầu 6 & 7) */}
      {showTeacherAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Xác thực quyền Giáo viên</h3>
                  <p className="text-xs text-slate-500">Chỉ Giáo viên mới có quyền mở giao diện quản lý</p>
                </div>
              </div>
              <button
                onClick={() => { setShowTeacherAuthModal(false); setTeacherAuthError(null); }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {teacherAuthError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{teacherAuthError}</span>
              </div>
            )}

            <form onSubmit={handleTeacherUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mật khẩu Quản trị viên / Giáo viên:
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={teacherKeyInput}
                  onChange={(e) => setTeacherKeyInput(e.target.value)}
                  placeholder="Nhập mật khẩu Giáo viên..."
                  className="w-full p-3 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm font-semibold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTeacherAuthModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Ở lại Cổng học sinh
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingTeacher}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isVerifyingTeacher ? 'Đang xác thực...' : 'Mở bảng Giáo viên'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HỌC SINH TỰ ĐỔI MÃ PIN BẢO MẬT */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Đổi mã PIN cá nhân</h3>
                  <p className="text-xs text-slate-500">Mã học sinh: <strong>{studentCode}</strong></p>
                </div>
              </div>
              <button
                onClick={() => { setShowChangePinModal(false); setPinChangeMsg(null); }}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 font-bold flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {pinChangeMsg && (
              <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                pinChangeMsg.isError 
                  ? 'bg-rose-50 border-rose-200 text-rose-800' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                {pinChangeMsg.isError ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
                <span>{pinChangeMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mã PIN hiện tại:
                </label>
                <input
                  type="password"
                  required
                  value={oldPinInput}
                  onChange={(e) => setOldPinInput(e.target.value)}
                  placeholder="Nhập mã PIN hiện tại..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-yellow-500 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mã PIN mới (4 - 8 chữ số):
                </label>
                <input
                  type="password"
                  required
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  placeholder="Nhập mã PIN mới..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-yellow-500 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nhập lại mã PIN mới:
                </label>
                <input
                  type="password"
                  required
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value)}
                  placeholder="Nhập lại mã PIN mới..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-yellow-500 text-sm font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isChangingPin}
                  className="px-5 py-2.5 rounded-xl bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isChangingPin ? 'Đang đổi PIN...' : 'Lưu mã PIN mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
