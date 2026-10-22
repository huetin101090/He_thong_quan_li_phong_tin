import React, { useState, useMemo, useEffect } from 'react';
import { 
  TheoryQuiz, 
  TheoryQuestion, 
  QuizSubmission, 
  UserSession,
  QuestionType 
} from '../types/assignments';
import { Student, ClassInfo } from '../types/classroom';
import { 
  getStoredQuizzes, 
  saveQuiz, 
  deleteQuiz, 
  getStoredQuizSubmissions, 
  saveQuizSubmission, 
  autoGradeQuizSubmission,
  resetStudentQuizAttempts,
  deleteQuizSubmission
} from '../services/assignmentService';
import { 
  Plus, 
  CheckCircle2, 
  XCircle,
  Clock, 
  HelpCircle, 
  Edit3, 
  Trash2, 
  Eye, 
  Award, 
  AlertCircle, 
  AlertTriangle,
  Calendar, 
  FileText, 
  ListOrdered, 
  CheckSquare, 
  AlignLeft,
  X,
  Play,
  RotateCcw,
  Sparkles,
  UserCheck,
  Users,
  BarChart3,
  History,
  Download,
  Upload,
  Printer,
  ChevronRight,
  Check,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Info,
  RefreshCw,
  FileUp,
  Layers,
  Loader2
} from 'lucide-react';

interface TheoryQuizManagerProps {
  session: UserSession;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subject: 'all' | 'tin' | 'congnghe') => void;
}

export const TheoryQuizManager: React.FC<TheoryQuizManagerProps> = ({
  session,
  classes,
  students,
  currentClassId,
  selectedSubject = 'tin',
  onSelectSubject,
}) => {
  const [quizzes, setQuizzes] = useState<TheoryQuiz[]>(() => getStoredQuizzes());
  const [submissions, setSubmissions] = useState<QuizSubmission[]>(() => getStoredQuizSubmissions());

  // Filters
  const [gradeFilter, setGradeFilter] = useState<'all' | 3 | 4 | 5>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'tin' | 'congnghe'>('tin');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync with prop
  useEffect(() => {
    setSubjectFilter('tin');
  }, [selectedSubject]);

  const handleSubjectChange = (subj: 'all' | 'tin' | 'congnghe') => {
    setSubjectFilter(subj);
    if (onSelectSubject) onSelectSubject(subj);
  };

  // Modals & Active Views
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<TheoryQuiz | null>(null);
  const [initialOpenAiMode, setInitialOpenAiMode] = useState(false);
  
  // Teacher Class Results View
  const [viewingSubmissionsQuiz, setViewingSubmissionsQuiz] = useState<TheoryQuiz | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<QuizSubmission | null>(null);

  // Student Active Quiz Taking State
  const [takingQuiz, setTakingQuiz] = useState<TheoryQuiz | null>(null);
  const [studentAnswers, setStudentAnswers] = useState<Record<string, string | string[]>>({});
  
  // Review & History Modals
  const [reviewingSubmission, setReviewingSubmission] = useState<{
    submission: QuizSubmission;
    quiz: TheoryQuiz;
  } | null>(null);

  const [historyModalData, setHistoryModalData] = useState<{
    student: Student;
    quiz: TheoryQuiz;
    attempts: QuizSubmission[];
  } | null>(null);

  const isTeacher = session.role === 'teacher';

  // Filtered quizzes (strictly Môn Tin học)
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => {
      if (gradeFilter !== 'all' && q.grade !== gradeFilter) return false;
      // Exclude any congnghe quiz
      if (q.subject === 'congnghe') return false;
      if (q.subject && q.subject !== 'tin') return false;
      if (!isTeacher && session.classId) {
        return q.targetClassIds.includes(session.classId);
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return q.title.toLowerCase().includes(query) || q.lessonTopic.toLowerCase().includes(query);
      }
      return true;
    });
  }, [quizzes, gradeFilter, isTeacher, session.classId, searchQuery]);

  // Handle Save Quiz (Teacher)
  const handleSaveQuiz = (newQuiz: TheoryQuiz) => {
    saveQuiz(newQuiz);
    setQuizzes(getStoredQuizzes());
    setIsCreateQuizOpen(false);
    setEditingQuiz(null);
  };

  const handleDeleteQuiz = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài kiểm tra lý thuyết này?')) {
      deleteQuiz(id);
      setQuizzes(getStoredQuizzes());
    }
  };

  // Student starts taking quiz
  const handleStartTakingQuiz = (quiz: TheoryQuiz) => {
    const studentId = session.studentId || 'HS-TEST';
    const previousAttempts = submissions.filter(s => s.quizId === quiz.id && s.studentId === studentId);
    if (previousAttempts.length >= quiz.maxAttempts) {
      alert(`Em đã hoàn thành tối đa số lần làm bài cho phép (${quiz.maxAttempts} lần) cho bài kiểm tra này!`);
      return;
    }

    setTakingQuiz(quiz);
    setStudentAnswers({});
  };

  // Student submits quiz
  const handleSubmitQuiz = () => {
    if (!takingQuiz) return;
    const studentId = session.studentId || 'HS-TEST';
    const studentName = session.studentName || 'Học sinh trải nghiệm';
    const classId = session.classId || currentClassId || '3/4';

    // Check answered count
    const answeredCount = Object.keys(studentAnswers).filter(k => {
      const val = studentAnswers[k];
      return val !== undefined && val !== '' && (!Array.isArray(val) || val.length > 0);
    }).length;

    if (answeredCount < takingQuiz.questions.length) {
      const unAnswered = takingQuiz.questions.length - answeredCount;
      if (!window.confirm(`Em còn ${unAnswered} câu chưa trả lời. Em có chắc chắn muốn nộp bài ngay bây giờ không?`)) {
        return;
      }
    }

    const previousAttempts = submissions.filter(s => s.quizId === takingQuiz.id && s.studentId === studentId);
    const attemptNumber = previousAttempts.length + 1;

    // Run auto-grading for objective questions
    const { questionScores, autoGradedScore, hasEssay } = autoGradeQuizSubmission(takingQuiz, studentAnswers);

    const submissionId = `sub_${takingQuiz.id}_${studentId}_att${attemptNumber}_${Date.now()}`;
    const submission: QuizSubmission = {
      id: submissionId,
      quizId: takingQuiz.id,
      quizTitle: takingQuiz.title,
      studentId,
      studentName,
      classId,
      attemptNumber,
      answers: studentAnswers,
      questionScores,
      autoGradedScore,
      essayScore: hasEssay ? null : 0,
      finalScore: hasEssay ? null : autoGradedScore,
      isGraded: !hasEssay,
      teacherFeedback: hasEssay 
        ? 'Điểm tự động đã được ghi nhận. Câu hỏi tự luận đang chờ cô Nguyễn Thị Huệ chấm duyệt.' 
        : (autoGradedScore >= 9 
            ? 'Xuất sắc! Em đã nắm vững toàn bộ kiến thức bài học.' 
            : autoGradedScore >= 7 
            ? 'Làm bài rất tốt! Em hãy xem lại lời giải thích ở các câu sai để rèn luyện thêm.' 
            : 'Em cần ôn lại các câu trả lời sai và luyện tập thêm nhé.'),
      submittedAt: new Date().toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
      }),
    };

    saveQuizSubmission(submission);
    const updatedSubs = getStoredQuizSubmissions();
    setSubmissions(updatedSubs);

    // Open detailed review immediately for student
    setTakingQuiz(null);
    setReviewingSubmission({
      submission,
      quiz: takingQuiz,
    });
  };

  // Teacher Grades Essay Question
  const handleTeacherGradeEssay = (subId: string, essayScores: Record<string, number>, feedback: string) => {
    const subs = getStoredQuizSubmissions();
    const target = subs.find(s => s.id === subId);
    if (!target) return;

    let totalEssayScore = 0;
    Object.entries(essayScores).forEach(([qId, score]) => {
      target.questionScores[qId] = score;
      totalEssayScore += score;
    });

    target.essayScore = totalEssayScore;
    target.finalScore = Math.min(10, Math.round((target.autoGradedScore + totalEssayScore) * 10) / 10);
    target.isGraded = true;
    target.teacherFeedback = feedback;
    target.gradedAt = new Date().toLocaleString('vi-VN');

    saveQuizSubmission(target);
    setSubmissions(getStoredQuizSubmissions());
    setGradingSubmission(null);
  };

  // Teacher resets student attempts (allow retake)
  const handleResetAttempts = (quizId: string, studentId: string, studentName: string) => {
    if (window.confirm(`Cho phép học sinh ${studentName} (${studentId}) làm lại bài kiểm tra này từ đầu (làm mới số lần)?`)) {
      resetStudentQuizAttempts(quizId, studentId);
      setSubmissions(getStoredQuizSubmissions());
    }
  };

  // Export JSON backup
  const handleExportBackup = () => {
    const data = {
      exportDate: new Date().toISOString(),
      school: 'Trường Tiểu học Đồng Dương',
      manager: 'Cô Nguyễn Thị Huệ (GVQL Tin học)',
      quizzes: getStoredQuizzes(),
      submissions: getStoredQuizSubmissions(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DongDuong_BaiTapLyThuyet_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed.submissions && Array.isArray(parsed.submissions)) {
          localStorage.setItem('smart_ict_quiz_submissions_v1', JSON.stringify(parsed.submissions));
          if (parsed.quizzes && Array.isArray(parsed.quizzes)) {
            localStorage.setItem('smart_ict_quizzes_v1', JSON.stringify(parsed.quizzes));
          }
          setQuizzes(getStoredQuizzes());
          setSubmissions(getStoredQuizSubmissions());
          alert('Đã khôi phục dữ liệu bài tập và kết quả lý thuyết thành công!');
        } else {
          alert('Tệp JSON không đúng định dạng sao lưu của hệ thống.');
        }
      } catch (err) {
        alert('Lỗi đọc tệp sao lưu: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* 1. LOCALSTORAGE CLOUD NOTICE BANNER */}
      <div className="bg-gradient-to-r from-amber-50 via-amber-100/60 to-yellow-50 border-2 border-amber-400/80 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shadow-xs shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-200/90 px-2.5 py-0.5 rounded-full border border-amber-300">
                  Thông báo lưu trữ cục bộ (LocalStorage)
                </span>
                <span className="text-xs font-bold text-slate-600">
                  Phòng máy Tin học • GVQL: Cô Nguyễn Thị Huệ
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                Hệ thống hiện đang lưu trữ kết quả và lịch sử bài làm cục bộ trên trình duyệt máy tính (<strong>LocalStorage</strong>) phục vụ giảng dạy nội bộ. 
                Dữ liệu chưa đồng bộ qua cơ sở dữ liệu đám mây trực tuyến (Firebase Firestore). Kết quả làm bài được bảo lưu riêng theo từng máy tính; vui lòng không xóa bộ nhớ cache trình duyệt để giữ nguyên lịch sử thi.
              </p>
            </div>
          </div>

          {/* Backup / Restore buttons */}
          <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-amber-200">
            <button
              onClick={handleExportBackup}
              title="Tải tệp JSON sao lưu toàn bộ kết quả bài tập lý thuyết"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-amber-300 text-slate-700 hover:text-blue-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              <span>Sao lưu JSON</span>
            </button>

            <label
              title="Nhập dữ liệu bài tập và kết quả từ file JSON"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-amber-300 text-slate-700 hover:text-blue-700 text-xs font-bold transition shadow-2xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Khôi phục JSON</span>
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* 2. TOP CONTROLS & HEADER */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
              Giai đoạn A • Trắc nghiệm & Lý thuyết
            </span>
            <h2 className="text-base font-black text-slate-800">
              BÀI TẬP LÝ THUYẾT TIN HỌC TIỂU HỌC
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động chấm trắc nghiệm khách quan, hiển thị đáp án và lời giải thích chi tiết, lưu trữ lịch sử các lần thi không ghi đè.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {/* Active Subject Badge (Tin học) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-2xs">
            <span>💻 Môn Tin học</span>
          </div>

          {/* Grade filter */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setGradeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${gradeFilter === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tất cả khối
            </button>
            <button
              onClick={() => setGradeFilter(3)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${gradeFilter === 3 ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 3
            </button>
            <button
              onClick={() => setGradeFilter(4)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${gradeFilter === 4 ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 4
            </button>
            <button
              onClick={() => setGradeFilter(5)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${gradeFilter === 5 ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 5
            </button>
          </div>

          {/* Teacher Create Buttons */}
          {isTeacher && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditingQuiz(null);
                  setInitialOpenAiMode(true);
                  setIsCreateQuizOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xs font-black transition shadow-xs cursor-pointer transform hover:scale-[1.02]"
                title="Sử dụng Gemini AI để tự động tạo câu hỏi trắc nghiệm bám sát bài học"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>✨ AI TỰ TẠO CÂU HỎI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingQuiz(null);
                  setInitialOpenAiMode(false);
                  setIsCreateQuizOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Soạn đề thủ công</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. ACTIVE QUIZ TAKING INTERFACE (Student view) */}
      {takingQuiz ? (
        <div className="bg-white border-2 border-blue-600 rounded-2xl p-5 shadow-lg space-y-5 animate-fadeIn">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
            <div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Đang làm bài trực tiếp • Khối {takingQuiz.grade}
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">{takingQuiz.title}</h3>
              <p className="text-xs text-slate-500">{takingQuiz.lessonTopic}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Thời gian: {takingQuiz.timeLimitMinutes} phút</span>
              </div>
              <button
                onClick={() => {
                  if (window.confirm('Em có chắc chắn muốn hủy bài làm này và quay lại danh sách bài tập?')) {
                    setTakingQuiz(null);
                    setStudentAnswers({});
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Hủy làm bài
              </button>
            </div>
          </div>

          {/* Student Banner Info */}
          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold">Học sinh làm bài:</span>
              <span className="font-black text-blue-800">{session.studentName || 'Học sinh'} ({session.studentId || 'HS-TEST'})</span>
              <span>- Lớp: <strong className="text-blue-800">{session.classId || currentClassId}</strong></span>
            </div>
            <span className="text-[11px] text-blue-700">
              Tối đa cho phép: <strong>{takingQuiz.maxAttempts} lần làm</strong>
            </span>
          </div>

          {/* Question List */}
          <div className="space-y-4">
            {takingQuiz.questions.map((q, idx) => {
              const currentAns = studentAnswers[q.id];
              const isAnswered = currentAns !== undefined && currentAns !== '' && (!Array.isArray(currentAns) || currentAns.length > 0);

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition ${
                    isAnswered ? 'bg-blue-50/30 border-blue-300' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {q.prompt}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 shrink-0">
                      {q.points} điểm
                    </span>
                  </div>

                  {/* Answers by Question Type */}
                  <div className="mt-3 pl-8">
                    {/* 1. Single Choice & True/False */}
                    {(q.type === 'single_choice' || q.type === 'true_false') && q.options && (
                      <div className="space-y-1.5">
                        {q.options.map((opt) => (
                          <label
                            key={opt}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                              currentAns === opt
                                ? 'bg-blue-100/70 border-blue-500 text-blue-900 font-bold'
                                : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              value={opt}
                              checked={currentAns === opt}
                              onChange={() => setStudentAnswers({ ...studentAnswers, [q.id]: opt })}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {/* 2. Multiple Choice */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-500 italic mb-1">
                          (Chọn một hoặc nhiều đáp án đúng)
                        </p>
                        {q.options.map((opt) => {
                          const currentArr = Array.isArray(currentAns) ? currentAns : [];
                          const isChecked = currentArr.includes(opt);

                          return (
                            <label
                              key={opt}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                isChecked
                                  ? 'bg-blue-100/70 border-blue-500 text-blue-900 font-bold'
                                  : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  let next = [...currentArr];
                                  if (e.target.checked) next.push(opt);
                                  else next = next.filter(item => item !== opt);
                                  setStudentAnswers({ ...studentAnswers, [q.id]: next });
                                }}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. Short Answer */}
                    {q.type === 'short_answer' && (
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={typeof currentAns === 'string' ? currentAns : ''}
                          onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                          placeholder="Nhập câu trả lời ngắn của em vào đây..."
                          className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                        />
                        <p className="text-[10px] text-slate-400">
                          Gợi ý: Điền từ khóa hoặc tên phím tắt chính xác theo bài học.
                        </p>
                      </div>
                    )}

                    {/* 4. Essay */}
                    {q.type === 'essay' && (
                      <div className="space-y-1">
                        <textarea
                          rows={3}
                          value={typeof currentAns === 'string' ? currentAns : ''}
                          onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                          placeholder="Viết câu trả lời tự luận của em (2-3 câu)..."
                          className="w-full bg-white text-xs p-2.5 rounded-lg border border-slate-300 focus:border-blue-500 outline-none"
                        />
                        <p className="text-[10px] text-amber-700 bg-amber-50 p-1.5 rounded border border-amber-200 inline-block">
                          ℹ️ Câu này sẽ được cô Nguyễn Thị Huệ chấm điểm và nhận xét sau khi em nộp bài.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
            <span className="text-xs text-slate-600 font-medium">
              Đã trả lời: <strong className="text-blue-700">{Object.keys(studentAnswers).length}/{takingQuiz.questions.length}</strong> câu
            </span>

            <button
              onClick={handleSubmitQuiz}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Nộp bài ngay</span>
            </button>
          </div>
        </div>
      ) : (
        /* 4. QUIZ LIST GRID */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuizzes.map((quiz) => {
            // Find student's submissions for this quiz
            const mySubs = session.studentId 
              ? submissions.filter(s => s.quizId === quiz.id && s.studentId === session.studentId)
              : [];
            const myLatestSub = mySubs.length > 0 ? mySubs[0] : null;

            // Find all submissions across all students for this quiz
            const allQuizSubs = submissions.filter(s => s.quizId === quiz.id);
            const uniqueStudentsCount = new Set(allQuizSubs.map(s => s.studentId)).size;

            return (
              <div
                key={quiz.id}
                className="bg-white rounded-2xl border-2 border-blue-500 hover:border-blue-600 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      Khối {quiz.grade} • {quiz.questions.length} câu hỏi
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {quiz.timeLimitMinutes} phút
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1">
                    {quiz.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                    {quiz.lessonTopic}
                  </p>

                  <div className="text-[10px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                    <div>Lớp được giao: <span className="font-bold text-blue-700">{quiz.targetClassIds.join(', ')}</span></div>
                    <div>Thời hạn nộp: <span className="font-semibold text-slate-700">{quiz.deadline}</span></div>
                    <div>Số lần tối đa: <span className="font-semibold text-slate-700">{quiz.maxAttempts} lần làm</span></div>
                  </div>
                </div>

                {/* Status & Action */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  {isTeacher ? (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setViewingSubmissionsQuiz(quiz)}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 flex items-center gap-1.5 cursor-pointer transition shadow-2xs"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Bảng kết quả ({uniqueStudentsCount} HS đã nộp)</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingQuiz(quiz);
                            setIsCreateQuizOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Chỉnh sửa đề thi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa đề thi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myLatestSub ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Điểm: {myLatestSub.finalScore !== null ? `${myLatestSub.finalScore}/10` : `${myLatestSub.autoGradedScore}đ (Chờ tự luận)`}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Đã làm {mySubs.length}/{quiz.maxAttempts} lần
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setReviewingSubmission({ submission: myLatestSub, quiz })}
                              className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[11px] font-bold border border-emerald-300 transition cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem bài làm & Lời giải</span>
                            </button>

                            {mySubs.length > 1 && (
                              <button
                                onClick={() => {
                                  const foundStudent = students.find(s => s.id === session.studentId);
                                  const currentStudent: Student = foundStudent || {
                                    id: session.studentId || 'HS-01',
                                    code: session.studentId || 'HS-01',
                                    name: session.studentName || 'Học sinh',
                                    classId: session.classId || '3/4',
                                    gender: 'male',
                                    seatNumber: 1,
                                    attendance: 'present'
                                  };
                                  setHistoryModalData({
                                    student: currentStudent,
                                    quiz,
                                    attempts: mySubs
                                  });
                                }}
                                title="Xem lịch sử các lần làm bài"
                                className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-300 transition cursor-pointer flex items-center gap-1"
                              >
                                <History className="w-3.5 h-3.5" />
                                <span>{mySubs.length} lần</span>
                              </button>
                            )}

                            {mySubs.length < quiz.maxAttempts && (
                              <button
                                onClick={() => handleStartTakingQuiz(quiz)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer shadow-2xs"
                              >
                                Làm lại
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleStartTakingQuiz(quiz)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Vào làm bài kiểm tra</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. DETAILED SUBMISSION REVIEW MODAL (Per question, correct answers, explanation) */}
      {reviewingSubmission && (
        <DetailedQuizReviewModal
          submission={reviewingSubmission.submission}
          quiz={reviewingSubmission.quiz}
          onClose={() => setReviewingSubmission(null)}
          onRetake={!isTeacher && (submissions.filter(s => s.quizId === reviewingSubmission.quiz.id && s.studentId === session.studentId).length < reviewingSubmission.quiz.maxAttempts)
            ? () => {
                const q = reviewingSubmission.quiz;
                setReviewingSubmission(null);
                handleStartTakingQuiz(q);
              }
            : undefined}
        />
      )}

      {/* 6. TEACHER MODAL: FULL CLASS RESULTS ROSTER & STATISTICS */}
      {viewingSubmissionsQuiz && (
        <TeacherClassResultsModal
          quiz={viewingSubmissionsQuiz}
          classes={classes}
          students={students}
          submissions={submissions}
          onClose={() => setViewingSubmissionsQuiz(null)}
          onGradeEssay={(sub) => setGradingSubmission(sub)}
          onViewReview={(sub) => setReviewingSubmission({ submission: sub, quiz: viewingSubmissionsQuiz })}
          onViewHistory={(student, attempts) => setHistoryModalData({
            student,
            quiz: viewingSubmissionsQuiz,
            attempts
          })}
          onResetAttempts={(studentId, studentName) => handleResetAttempts(viewingSubmissionsQuiz.id, studentId, studentName)}
        />
      )}

      {/* 7. STUDENT ATTEMPT HISTORY MODAL */}
      {historyModalData && (
        <StudentAttemptHistoryModal
          student={historyModalData.student}
          quiz={historyModalData.quiz}
          attempts={historyModalData.attempts}
          onClose={() => setHistoryModalData(null)}
          onViewAttempt={(sub) => {
            setHistoryModalData(null);
            setReviewingSubmission({ submission: sub, quiz: historyModalData.quiz });
          }}
        />
      )}

      {/* 8. TEACHER MODAL: GRADE ESSAY SUBMISSION */}
      {gradingSubmission && (
        <TeacherGradeEssayModal
          submission={gradingSubmission}
          quiz={quizzes.find(q => q.id === gradingSubmission.quizId)}
          onClose={() => setGradingSubmission(null)}
          onSave={handleTeacherGradeEssay}
        />
      )}

      {/* 9. TEACHER MODAL: CREATE / EDIT QUIZ */}
      {isCreateQuizOpen && (
        <CreateQuizModal
          initialQuiz={editingQuiz}
          initialOpenAiMode={initialOpenAiMode}
          classes={classes}
          onClose={() => {
            setIsCreateQuizOpen(false);
            setEditingQuiz(null);
            setInitialOpenAiMode(false);
          }}
          onSave={handleSaveQuiz}
        />
      )}
    </div>
  );
};

// ==========================================
// SUB-COMPONENT: DETAILED QUIZ REVIEW MODAL
// ==========================================
interface DetailedQuizReviewModalProps {
  submission: QuizSubmission;
  quiz: TheoryQuiz;
  onClose: () => void;
  onRetake?: () => void;
}

const DetailedQuizReviewModal: React.FC<DetailedQuizReviewModalProps> = ({
  submission,
  quiz,
  onClose,
  onRetake,
}) => {
  const isPerfect = submission.finalScore === 10;
  const isGood = (submission.finalScore ?? submission.autoGradedScore) >= 8;
  const isPendingEssay = submission.essayScore === null && quiz.questions.some(q => q.type === 'essay');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide">
                Phiếu Kết Quả & Lời Giải Thích Chi Tiết
              </h3>
              <p className="text-xs text-blue-200">
                {quiz.title} • {submission.studentName} ({submission.studentId} - Lớp {submission.classId})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Summary Score Card */}
          <div className={`p-4 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-4 ${
            isPerfect ? 'bg-emerald-50 border-emerald-500' :
            isGood ? 'bg-blue-50 border-blue-500' :
            'bg-amber-50 border-amber-400'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`p-3 rounded-2xl text-white font-black text-xl shadow-xs ${
                isPerfect ? 'bg-emerald-600' :
                isGood ? 'bg-blue-600' :
                'bg-amber-500'
              }`}>
                {submission.finalScore !== null ? `${submission.finalScore}` : `${submission.autoGradedScore}`}
                <span className="text-xs font-normal">/10</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-800">
                    {submission.finalScore !== null ? 'Điểm chính thức' : 'Điểm tự chấm khách quan'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-300 text-slate-600">
                    Lần nộp thứ {submission.attemptNumber}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Nộp lúc: <strong>{submission.submittedAt}</strong>
                </p>
                {isPendingEssay && (
                  <p className="text-[11px] font-bold text-amber-700 mt-0.5 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Câu hỏi tự luận đang chờ cô Nguyễn Thị Huệ chấm duyệt điểm chính thức.</span>
                  </p>
                )}
              </div>
            </div>

            <div className="text-right sm:border-l sm:pl-4 border-slate-200">
              <span className="text-[11px] text-slate-500 block">Đánh giá chung:</span>
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg inline-block mt-0.5 ${
                isPerfect ? 'bg-emerald-100 text-emerald-800' :
                isGood ? 'bg-blue-100 text-blue-800' :
                'bg-amber-100 text-amber-900'
              }`}>
                {isPerfect ? 'Hoàn thành Xuất sắc' : isGood ? 'Hoàn thành Tốt' : 'Cần rèn luyện thêm'}
              </span>
            </div>
          </div>

          {/* Teacher Feedback if available */}
          {submission.teacherFeedback && (
            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nhận xét của Giáo viên (Cô Nguyễn Thị Huệ):</span>
              </span>
              <p className="text-xs text-indigo-950 font-medium italic">
                "{submission.teacherFeedback}"
              </p>
            </div>
          )}

          {/* Detailed Question by Question breakdown */}
          <div className="space-y-4">
            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2 pb-1 border-b border-slate-200">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Chi tiết từng câu hỏi, đáp án và lời giải thích:</span>
            </h4>

            {quiz.questions.map((q, idx) => {
              const studentAns = submission.answers[q.id];
              const scoreAwarded = submission.questionScores[q.id] ?? 0;
              const isCorrect = scoreAwarded >= q.points;
              const isPartial = scoreAwarded > 0 && scoreAwarded < q.points;
              const isEssay = q.type === 'essay';

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border-2 transition ${
                    isEssay && submission.essayScore === null
                      ? 'bg-amber-50/40 border-amber-300'
                      : isCorrect
                      ? 'bg-emerald-50/30 border-emerald-400'
                      : isPartial
                      ? 'bg-blue-50/40 border-blue-400'
                      : 'bg-rose-50/30 border-rose-300'
                  }`}
                >
                  {/* Question header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                        isEssay && submission.essayScore === null
                          ? 'bg-amber-500 text-white'
                          : isCorrect
                          ? 'bg-emerald-600 text-white'
                          : isPartial
                          ? 'bg-blue-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">
                        {q.prompt}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isEssay && submission.essayScore === null
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : isCorrect
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : isPartial
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {scoreAwarded}/{q.points} điểm
                      </span>
                    </div>
                  </div>

                  {/* Student's response display */}
                  <div className="mt-3 pl-8 space-y-2">
                    <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                        Câu trả lời của em:
                      </span>
                      <div className="font-semibold text-slate-800">
                        {Array.isArray(studentAns) ? (
                          <div className="flex flex-wrap gap-1.5">
                            {studentAns.length > 0 ? studentAns.map(a => (
                              <span key={a} className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-xs">
                                {a}
                              </span>
                            )) : <span className="text-slate-400 italic">(Em chưa chọn đáp án)</span>}
                          </div>
                        ) : studentAns ? (
                          <span>{studentAns}</span>
                        ) : (
                          <span className="text-rose-500 italic">(Chưa trả lời)</span>
                        )}
                      </div>
                    </div>

                    {/* Official correct answer */}
                    {!isEssay && (
                      <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1 mb-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Đáp án đúng của đề:
                        </span>
                        <div className="font-bold text-emerald-950 text-xs">
                          {Array.isArray(q.correctAnswers) ? (
                            <div className="flex flex-wrap gap-1.5">
                              {q.correctAnswers.map(ans => (
                                <span key={ans} className="px-2 py-0.5 rounded bg-white text-emerald-900 border border-emerald-300">
                                  {ans}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span>{q.correctAnswers}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Clear Pedagogical Explanation */}
                    <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200 space-y-1">
                      <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        <span>Lời giải thích dễ hiểu cho học sinh:</span>
                      </span>
                      <p className="text-xs text-blue-950 leading-relaxed font-sans">
                        {q.explanation || 'Hãy chú ý xem kỹ hướng dẫn sách giáo khoa Tin học để ghi nhớ thao tác nhé.'}
                      </p>
                      {q.rubricGuide && (
                        <p className="text-[11px] text-slate-500 pt-1 border-t border-blue-200">
                          <strong>Tiêu chí chấm tự luận:</strong> {q.rubricGuide}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>In phiếu kết quả</span>
          </button>

          <div className="flex items-center gap-2">
            {onRetake && (
              <button
                onClick={onRetake}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại bài kiểm tra</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==============================================================
// SUB-COMPONENT: TEACHER CLASS RESULTS TABLE & FULL ROSTER VIEW
// ==============================================================
interface TeacherClassResultsModalProps {
  quiz: TheoryQuiz;
  classes: ClassInfo[];
  students: Student[];
  submissions: QuizSubmission[];
  onClose: () => void;
  onGradeEssay: (sub: QuizSubmission) => void;
  onViewReview: (sub: QuizSubmission) => void;
  onViewHistory: (student: Student, attempts: QuizSubmission[]) => void;
  onResetAttempts: (studentId: string, studentName: string) => void;
}

const TeacherClassResultsModal: React.FC<TeacherClassResultsModalProps> = ({
  quiz,
  classes,
  students,
  submissions,
  onClose,
  onGradeEssay,
  onViewReview,
  onViewHistory,
  onResetAttempts,
}) => {
  // Available classes for this quiz
  const assignedClassIds = quiz.targetClassIds;
  const [selectedClassId, setSelectedClassId] = useState<string>(
    assignedClassIds.length > 0 ? assignedClassIds[0] : '3/4'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'not_submitted'>('all');
  const [searchStudent, setSearchStudent] = useState('');

  // Clear search and filter when changing class
  useEffect(() => {
    setSearchStudent('');
    setStatusFilter('all');
  }, [selectedClassId]);

  // Class info and student roster
  const currentClassStudents = useMemo(() => {
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Submissions for this quiz in this class
  const classSubmissions = useMemo(() => {
    return submissions.filter(s => s.quizId === quiz.id && s.classId === selectedClassId);
  }, [submissions, quiz.id, selectedClassId]);

  // Statistics calculation
  const totalStudents = currentClassStudents.length;
  
  // Group submissions by student
  const studentSubmissionsMap = useMemo(() => {
    const map = new Map<string, QuizSubmission[]>();
    classSubmissions.forEach(sub => {
      const existing = map.get(sub.studentId) || [];
      existing.push(sub);
      // sort latest first
      existing.sort((a, b) => b.attemptNumber - a.attemptNumber);
      map.set(sub.studentId, existing);
    });
    return map;
  }, [classSubmissions]);

  const submittedStudentsCount = studentSubmissionsMap.size;
  const notSubmittedStudentsCount = Math.max(0, totalStudents - submittedStudentsCount);
  const completionRate = totalStudents > 0 ? Math.round((submittedStudentsCount / totalStudents) * 100) : 0;

  // Grade distributions based on latest attempt
  const { avgScore, distribution } = useMemo(() => {
    const scores: number[] = [];
    const dist = { excellent: 0, good: 0, fair: 0, poor: 0 };

    studentSubmissionsMap.forEach((attempts) => {
      const best = attempts[0]; // latest attempt
      const sc = best.finalScore ?? best.autoGradedScore;
      scores.push(sc);

      if (sc >= 9) dist.excellent++;
      else if (sc >= 7) dist.good++;
      else if (sc >= 5) dist.fair++;
      else dist.poor++;
    });

    const avg = scores.length > 0 
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 
      : 0;

    return { avgScore: avg, distribution: dist };
  }, [studentSubmissionsMap]);

  // Filter roster
  const displayedStudents = useMemo(() => {
    return currentClassStudents.filter(st => {
      const attempts = studentSubmissionsMap.get(st.id) || [];
      const isDone = attempts.length > 0;

      if (statusFilter === 'submitted' && !isDone) return false;
      if (statusFilter === 'not_submitted' && isDone) return false;

      if (searchStudent.trim()) {
        const q = searchStudent.toLowerCase();
        return st.name.toLowerCase().includes(q) || st.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [currentClassStudents, studentSubmissionsMap, statusFilter, searchStudent]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wide">
                Bảng Kết Quả Bài Tập Lý Thuyết Theo Lớp
              </h3>
              <p className="text-xs text-blue-200">
                {quiz.title} • Giáo viên Quản lý: Cô Nguyễn Thị Huệ
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar & Class Selector */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Select class tabs */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Chọn lớp xem:</span>
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
              {assignedClassIds.map((cid) => (
                <button
                  key={cid}
                  onClick={() => setSelectedClassId(cid)}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    selectedClassId === cid
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                  }`}
                >
                  Lớp {cid}
                </button>
              ))}
            </div>
          </div>

          {/* Search box & Print */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Tìm mã hoặc tên học sinh..."
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs outline-none focus:border-blue-500 w-44"
            />

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 font-bold text-slate-700 text-xs transition cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>In bảng điểm</span>
            </button>
          </div>
        </div>

        {/* KPI / Statistics Summary Cards */}
        <div className="p-4 bg-blue-50/40 border-b border-blue-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Sĩ số lớp {selectedClassId}:</span>
            <div className="text-lg font-black text-slate-800">{totalStudents} <span className="text-xs font-normal">học sinh</span></div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Đã nộp bài:</span>
            <div className="text-lg font-black text-emerald-700">
              {submittedStudentsCount} <span className="text-xs font-semibold">({completionRate}%)</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Chưa làm bài:</span>
            <div className="text-lg font-black text-amber-600">
              {notSubmittedStudentsCount} <span className="text-xs font-semibold">({100 - completionRate}%)</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-indigo-200 shadow-2xs">
            <span className="text-slate-500 block text-[11px]">Điểm trung bình lớp:</span>
            <div className="text-lg font-black text-indigo-700">
              {avgScore > 0 ? `${avgScore} / 10` : 'Chưa có'}
            </div>
          </div>
        </div>

        {/* Quick Tabs to Filter Submitted / Not Submitted */}
        <div className="px-4 pt-3 flex items-center justify-between border-b border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`pb-2 font-bold px-2 border-b-2 transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả học sinh ({totalStudents})
            </button>
            <button
              onClick={() => setStatusFilter('submitted')}
              className={`pb-2 font-bold px-2 border-b-2 transition cursor-pointer ${
                statusFilter === 'submitted'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Đã nộp bài ({submittedStudentsCount})
            </button>
            <button
              onClick={() => setStatusFilter('not_submitted')}
              className={`pb-2 font-bold px-2 border-b-2 transition cursor-pointer ${
                statusFilter === 'not_submitted'
                  ? 'border-rose-600 text-rose-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Chưa làm bài ({notSubmittedStudentsCount})
            </button>
          </div>

          {/* Grade distribution chips */}
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] pb-2">
            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
              Giỏi: {distribution.excellent}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
              Khá: {distribution.good}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
              Đạt: {distribution.fair}
            </span>
            {distribution.poor > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold">
                Cần rèn: {distribution.poor}
              </span>
            )}
          </div>
        </div>

        {/* Full Roster Table */}
        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
              <tr>
                <th className="p-2.5 rounded-l-lg">STT</th>
                <th className="p-2.5">Mã HS</th>
                <th className="p-2.5">Họ và tên</th>
                <th className="p-2.5">Máy phân công</th>
                <th className="p-2.5">Trạng thái</th>
                <th className="p-2.5">Số lần làm</th>
                <th className="p-2.5">Điểm cao nhất</th>
                <th className="p-2.5">Lần gần nhất</th>
                <th className="p-2.5 text-right rounded-r-lg">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedStudents.map((st, idx) => {
                const attempts = studentSubmissionsMap.get(st.id) || [];
                const latest = attempts[0];
                const bestScore = attempts.length > 0 
                  ? Math.max(...attempts.map(a => a.finalScore ?? a.autoGradedScore))
                  : null;
                const hasPendingEssay = latest && latest.essayScore === null && quiz.questions.some(q => q.type === 'essay');

                return (
                  <tr key={st.id} className="hover:bg-slate-50 transition">
                    <td className="p-2.5 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="p-2.5 font-mono font-bold text-slate-600">{st.id}</td>
                    <td className="p-2.5 font-bold text-slate-800">{st.name}</td>
                    <td className="p-2.5 text-slate-500">
                      {st.seatNumber ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          Máy {st.seatNumber < 10 ? `0${st.seatNumber}` : st.seatNumber}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-2.5">
                      {attempts.length > 0 ? (
                        hasPendingEssay ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                            Chờ chấm tự luận
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1 w-max">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã hoàn thành
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] w-max inline-block">
                          Chưa làm bài
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      {attempts.length > 0 ? (
                        <span className="font-bold text-blue-700">
                          {attempts.length} lần
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                    <td className="p-2.5 font-black">
                      {bestScore !== null ? (
                        <span className={bestScore >= 8 ? 'text-emerald-700' : bestScore >= 5 ? 'text-blue-700' : 'text-amber-700'}>
                          {bestScore}/10
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-slate-500 text-[11px]">
                      {latest ? latest.submittedAt : '-'}
                    </td>
                    <td className="p-2.5 text-right space-x-1.5 whitespace-nowrap">
                      {attempts.length > 0 ? (
                        <>
                          <button
                            onClick={() => onViewReview(latest)}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition cursor-pointer"
                          >
                            Xem bài làm
                          </button>

                          {attempts.length > 1 && (
                            <button
                              onClick={() => onViewHistory(st, attempts)}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer"
                              title="Xem lịch sử các lần thi"
                            >
                              Lịch sử ({attempts.length})
                            </button>
                          )}

                          {hasPendingEssay && (
                            <button
                              onClick={() => onGradeEssay(latest)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] transition cursor-pointer shadow-2xs"
                            >
                              Chấm tự luận
                            </button>
                          )}

                          <button
                            onClick={() => onResetAttempts(st.id, st.name)}
                            title="Xóa lượt thi cũ để học sinh làm lại bài"
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Chờ học sinh vào làm</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayedStudents.length === 0 && (
            <div className="text-center py-12 text-slate-400 text-xs">
              Không có học sinh nào phù hợp với bộ lọc hiện tại.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Hiển thị <strong>{displayedStudents.length}</strong> / {totalStudents} học sinh lớp {selectedClassId}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================
// SUB-COMPONENT: STUDENT ATTEMPT HISTORY MODAL
// ====================================================
interface StudentAttemptHistoryModalProps {
  student: Student;
  quiz: TheoryQuiz;
  attempts: QuizSubmission[];
  onClose: () => void;
  onViewAttempt: (sub: QuizSubmission) => void;
}

const StudentAttemptHistoryModal: React.FC<StudentAttemptHistoryModalProps> = ({
  student,
  quiz,
  attempts,
  onClose,
  onViewAttempt,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-sm">Lịch Sử Các Lần Làm Bài</h3>
              <p className="text-xs text-blue-200">
                {student.name} ({student.id} - Lớp {student.classId})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-3 text-xs">
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
            <span className="font-bold text-blue-900 block">Đề bài: {quiz.title}</span>
            <span className="text-slate-600 text-[11px]">
              Tối đa cho phép: {quiz.maxAttempts} lần làm bài. Các lần nộp đều được bảo lưu riêng biệt, không bị ghi đè.
            </span>
          </div>

          <div className="space-y-2">
            {attempts.map((att, idx) => {
              const prevAttempt = attempts[idx + 1];
              const scoreDiff = prevAttempt 
                ? (att.finalScore ?? att.autoGradedScore) - (prevAttempt.finalScore ?? prevAttempt.autoGradedScore)
                : 0;

              return (
                <div
                  key={att.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black flex items-center justify-center text-sm shrink-0">
                      {att.attemptNumber}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        Lần nộp thứ {att.attemptNumber}
                        {scoreDiff !== 0 && (
                          <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            scoreDiff > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {scoreDiff > 0 ? `+${scoreDiff.toFixed(1)}đ tiến bộ` : `${scoreDiff.toFixed(1)}đ`}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Thời gian: <strong>{att.submittedAt}</strong>
                      </p>
                      {att.teacherFeedback && (
                        <p className="text-[11px] text-indigo-700 italic mt-0.5">
                          "{att.teacherFeedback}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Điểm số</span>
                      <span className="text-sm font-black text-emerald-700">
                        {att.finalScore !== null ? `${att.finalScore}/10` : `${att.autoGradedScore} (Chờ tự luận)`}
                      </span>
                    </div>

                    <button
                      onClick={() => onViewAttempt(att)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-2xs"
                    >
                      Xem lại
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================
// SUB-COMPONENT: TEACHER GRADE ESSAY MODAL
// ====================================================
interface TeacherGradeEssayModalProps {
  submission: QuizSubmission;
  quiz?: TheoryQuiz;
  onClose: () => void;
  onSave: (subId: string, scores: Record<string, number>, feedback: string) => void;
}

const TeacherGradeEssayModal: React.FC<TeacherGradeEssayModalProps> = ({
  submission,
  quiz,
  onClose,
  onSave,
}) => {
  const essayQuestions = quiz?.questions.filter(q => q.type === 'essay') || [];
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    essayQuestions.forEach(q => {
      init[q.id] = submission.questionScores[q.id] ?? q.points;
    });
    return init;
  });
  const [feedback, setFeedback] = useState(submission.teacherFeedback || 'Em làm bài tốt, câu trả lời tự luận rõ ràng và chính xác.');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">Chấm Câu Hỏi Tự Luận & Duyệt Điểm</h3>
            <p className="text-xs text-blue-200">
              Học sinh: {submission.studentName} ({submission.studentId} - Lớp {submission.classId})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-800">Điểm trắc nghiệm khách quan đã tự chấm:</div>
              <div className="text-[11px] text-slate-500">Hệ thống đối chiếu tự động không cần chấm lại.</div>
            </div>
            <div className="text-xl font-black text-blue-700">{submission.autoGradedScore} điểm</div>
          </div>

          {essayQuestions.map((eq) => {
            const studentAns = submission.answers[eq.id];
            const currentScore = scores[eq.id] ?? 0;

            return (
              <div key={eq.id} className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
                <div className="font-bold text-slate-900">Câu hỏi: {eq.prompt}</div>
                <div className="text-[11px] text-slate-500">
                  <strong>Hướng dẫn chấm:</strong> {eq.rubricGuide || eq.explanation}
                </div>

                <div className="p-2.5 bg-white rounded-lg border border-slate-300">
                  <span className="text-[10px] text-slate-400 block font-semibold">Bài làm của học sinh:</span>
                  <p className="text-xs text-slate-800 mt-1 italic font-serif">
                    "{studentAns || '(Học sinh để trống)'}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-700">Cho điểm câu này (Tối đa {eq.points}đ):</span>
                  <input
                    type="number"
                    min={0}
                    max={eq.points}
                    step={0.5}
                    value={currentScore}
                    onChange={(e) => setScores({ ...scores, [eq.id]: Math.min(eq.points, Math.max(0, Number(e.target.value))) })}
                    className="w-20 p-1.5 bg-white border border-slate-300 rounded-lg font-black text-center text-blue-700 outline-none"
                  />
                </div>
              </div>
            );
          })}

          <div className="space-y-1">
            <label className="font-bold text-slate-800 block">Lời nhận xét của cô Nguyễn Thị Huệ:</label>
            <textarea
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Nhập nhận xét khích lệ học sinh..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none text-xs focus:border-blue-500"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200">
            Hủy
          </button>
          <button
            onClick={() => onSave(submission.id, scores, feedback)}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Lưu & Công bố điểm chính thức
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================================
// SUB-COMPONENT: CREATE / EDIT QUIZ MODAL
// ====================================================
interface CreateQuizModalProps {
  initialQuiz: TheoryQuiz | null;
  initialOpenAiMode?: boolean;
  classes: ClassInfo[];
  onClose: () => void;
  onSave: (quiz: TheoryQuiz) => void;
}

const CreateQuizModal: React.FC<CreateQuizModalProps> = ({
  initialQuiz,
  initialOpenAiMode,
  classes,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialQuiz?.title || '');
  const [grade, setGrade] = useState<3 | 4 | 5>(initialQuiz?.grade || 3);
  const [targetClassIds, setTargetClassIds] = useState<string[]>(() => {
    if (initialQuiz?.targetClassIds && initialQuiz.targetClassIds.length > 0) {
      return initialQuiz.targetClassIds;
    }
    // Default to all classes of initial grade
    const initialGrade = initialQuiz?.grade || 3;
    return classes.filter(c => c.grade === initialGrade).map(c => c.id);
  });
  const [lessonTopic, setLessonTopic] = useState(initialQuiz?.lessonTopic || '');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialQuiz?.timeLimitMinutes || 15);
  const [maxAttempts, setMaxAttempts] = useState(initialQuiz?.maxAttempts || 2);
  const [deadline, setDeadline] = useState(initialQuiz?.deadline || '2026-10-30 23:59');
  const [allowReview, setAllowReview] = useState(initialQuiz ? initialQuiz.allowReview : true);
  const [activityType, setActivityType] = useState<'practice' | 'periodic_exam'>(initialQuiz?.activityType || 'practice');

  // AI Question Generation States
  const [showAiPanel, setShowAiPanel] = useState<boolean>(initialOpenAiMode ?? false);
  const [aiLessonTitle, setAiLessonTitle] = useState(initialQuiz?.title || '');
  const [aiTopicContent, setAiTopicContent] = useState(initialQuiz?.lessonTopic || '');
  const [aiLessonRefText, setAiLessonRefText] = useState('');
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(10);
  const [aiCognitiveLevels, setAiCognitiveLevels] = useState<string[]>(['Nhận biết', 'Thông hiểu', 'Vận dụng']);
  const [aiQuestionTypes, setAiQuestionTypes] = useState<string[]>([
    'single_choice',
    'true_false',
    'multiple_choice',
    'short_answer',
    'essay'
  ]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDraftQuestions, setAiDraftQuestions] = useState<TheoryQuestion[] | null>(null);

  const [questions, setQuestions] = useState<TheoryQuestion[]>(
    initialQuiz?.questions || [
      {
        id: 'q1',
        type: 'single_choice',
        prompt: 'Hai phím nào sau đây là hai phím có gờ trên bàn phím máy tính?',
        options: ['Phím F và phím J', 'Phím A và phím L', 'Phím G và phím H', 'Phím Space và Shift'],
        correctAnswers: 'Phím F và phím J',
        explanation: 'Phím F và phím J là hai phím có gờ trên hàng phím cơ sở để giúp ngón trỏ của hai bàn tay định vị đúng vị trí xuất phát.',
        points: 2,
        cognitiveLevel: 'Nhận biết',
      },
      {
        id: 'q2',
        type: 'true_false',
        prompt: 'Khi ngồi làm việc với máy tính, lưng phải thẳng và mắt cách màn hình từ 50cm đến 80cm.',
        options: ['Đúng', 'Sai'],
        correctAnswers: 'Đúng',
        explanation: 'Ngồi đúng tư thế giúp bảo vệ mắt và cột sống của học sinh.',
        points: 2,
        cognitiveLevel: 'Thông hiểu',
      },
    ]
  );

  // Handle grade change: automatically deselect classes from other grades and select all classes of new grade
  const handleGradeChange = (newGrade: 3 | 4 | 5) => {
    setGrade(newGrade);
    const validClassIds = classes.filter(c => c.grade === newGrade).map(c => c.id);
    setTargetClassIds(validClassIds);
  };

  const handleToggleClass = (cid: string) => {
    if (targetClassIds.includes(cid)) {
      setTargetClassIds(targetClassIds.filter(id => id !== cid));
    } else {
      setTargetClassIds([...targetClassIds, cid]);
    }
  };

  const handleToggleAiCognitiveLevel = (level: string) => {
    if (aiCognitiveLevels.includes(level)) {
      if (aiCognitiveLevels.length === 1) return; // keep at least 1
      setAiCognitiveLevels(aiCognitiveLevels.filter(l => l !== level));
    } else {
      setAiCognitiveLevels([...aiCognitiveLevels, level]);
    }
  };

  const handleToggleAiQuestionType = (typeKey: string) => {
    if (aiQuestionTypes.includes(typeKey)) {
      if (aiQuestionTypes.length === 1) return; // keep at least 1
      setAiQuestionTypes(aiQuestionTypes.filter(t => t !== typeKey));
    } else {
      setAiQuestionTypes([...aiQuestionTypes, typeKey]);
    }
  };

  // Call Server-side Gemini API
  const handleGenerateAiQuestions = async () => {
    setAiError(null);
    const topicTrimmed = aiTopicContent.trim() || lessonTopic.trim();
    const titleTrimmed = aiLessonTitle.trim() || title.trim();

    if (topicTrimmed.length < 4 && titleTrimmed.length < 4 && aiLessonRefText.trim().length < 10) {
      setAiError('Nội dung đầu vào chưa đủ rõ. Thầy/Cô vui lòng nhập cụ thể Tên bài học hoặc Chủ đề/Nội dung kiến thức cần kiểm tra (hoặc dán tài liệu) để AI tạo câu hỏi chính xác bám sát bài học.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          lessonTitle: titleTrimmed || topicTrimmed,
          topicContent: topicTrimmed || titleTrimmed,
          lessonReferenceText: aiLessonRefText,
          questionCount: aiQuestionCount,
          cognitiveLevels: aiCognitiveLevels,
          questionTypes: aiQuestionTypes,
          activityType,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Lỗi khi gọi máy chủ Gemini AI');
      }

      if (data.questions && Array.isArray(data.questions)) {
        setAiDraftQuestions(data.questions);
        if (titleTrimmed && !title) setTitle(titleTrimmed);
        if (topicTrimmed && !lessonTopic) setLessonTopic(topicTrimmed);
      } else {
        throw new Error('Dữ liệu câu hỏi trả về từ AI không đúng định dạng.');
      }
    } catch (err: any) {
      console.error('AI question generation error:', err);
      setAiError(err.message || 'Không thể tạo câu hỏi lúc này. Vui lòng kiểm tra cấu hình GEMINI_API_KEY hoặc thử lại.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Apply AI Draft Questions into main questions list
  const handleApplyAiDraft = () => {
    if (!aiDraftQuestions || aiDraftQuestions.length === 0) return;
    setQuestions(aiDraftQuestions);
    if (aiLessonTitle.trim()) setTitle(aiLessonTitle.trim());
    if (aiTopicContent.trim()) setLessonTopic(aiTopicContent.trim());
    setShowAiPanel(false);
  };

  // Add a manual question into the main list
  const handleAddQuestion = (type: QuestionType) => {
    const newQ: TheoryQuestion = {
      id: `q_${Date.now()}`,
      type,
      prompt: 'Nhập nội dung câu hỏi mới vào đây...',
      points: 2,
      explanation: 'Giải thích vì sao đáp án này đúng...',
      correctAnswers: type === 'true_false' ? 'Đúng' : type === 'multiple_choice' ? [] : '',
      options: (type === 'single_choice' || type === 'multiple_choice')
        ? ['Lựa chọn A', 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D']
        : type === 'true_false'
        ? ['Đúng', 'Sai']
        : undefined,
      cognitiveLevel: 'Thông hiểu',
    };
    setQuestions([...questions, newQ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài kiểm tra!');
      return;
    }
    if (targetClassIds.length === 0) {
      alert(`Vui lòng chọn ít nhất một lớp thuộc Khối ${grade} được giao bài!`);
      return;
    }
    if (questions.length === 0) {
      alert('Vui lòng thêm hoặc tạo ít nhất một câu hỏi!');
      return;
    }

    const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);

    const quiz: TheoryQuiz = {
      id: initialQuiz?.id || `quiz-${grade}-${Date.now()}`,
      title,
      grade,
      targetClassIds,
      lessonTopic,
      timeLimitMinutes: Number(timeLimitMinutes),
      maxAttempts: Number(maxAttempts),
      deadline,
      allowReview,
      questions,
      totalPoints,
      status: 'published',
      createdBy: 'Cô Nguyễn Thị Huệ',
      createdAt: initialQuiz?.createdAt || new Date().toISOString().slice(0, 10),
      activityType,
    };

    onSave(quiz);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-300" />
            <div>
              <h3 className="font-bold text-sm">
                {initialQuiz ? 'Chỉnh Sửa Đề Bài Lý Thuyết' : 'Soạn Đề Kiểm Tra Lý Thuyết Mới'}
              </h3>
              <p className="text-[10px] text-blue-100">
                Trường Tiểu học Đồng Dương • Đánh giá theo Thông tư 27/2020/TT-BGDĐT
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAiPanel(!showAiPanel);
                if (!showAiPanel && !aiLessonTitle) setAiLessonTitle(title);
                if (!showAiPanel && !aiTopicContent) setAiTopicContent(lessonTopic);
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 hover:from-amber-300 hover:to-orange-300 text-indigo-950 font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer transform hover:scale-[1.03]"
            >
              <Sparkles className="w-4 h-4 text-purple-900 animate-pulse" />
              <span>✨ AI TỰ TẠO CÂU HỎI</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-white/80 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* 1. PROMINENT GEMINI AI GENERATION BANNER */}
          <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border-2 border-indigo-400/80 rounded-2xl p-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-indigo-950 text-xs sm:text-sm uppercase tracking-wide">
                      TRỢ LÝ GEMINI AI: TỰ ĐỘNG SOẠN BỘ CÂU HỎI
                    </span>
                    <span className="text-[10px] bg-indigo-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Chuẩn GDPT 2018
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5 leading-relaxed">
                    Nhập tên bài hoặc chủ đề, Gemini AI sẽ tự động tạo bộ câu hỏi trắc nghiệm kèm đáp án và lời giải thích bám sát bài học.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowAiPanel(!showAiPanel);
                  if (!showAiPanel && !aiLessonTitle) setAiLessonTitle(title);
                  if (!showAiPanel && !aiTopicContent) setAiTopicContent(lessonTopic);
                }}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md transform hover:scale-[1.02] ${
                  showAiPanel
                    ? 'bg-white hover:bg-slate-100 text-indigo-900 border-2 border-indigo-300'
                    : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white ring-2 ring-amber-300 ring-offset-1'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>{showAiPanel ? 'Chuyển sang soạn thủ công' : '✨ AI TỰ TẠO CÂU HỎI'}</span>
              </button>
            </div>

            {/* EXPANDED AI CREATOR PANEL */}
            {showAiPanel && (
              <div className="mt-4 pt-4 border-t border-indigo-200/80 space-y-3.5 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-indigo-950 block mb-1">
                      Khối lớp áp dụng:
                    </label>
                    <select
                      value={grade}
                      onChange={(e) => handleGradeChange(Number(e.target.value) as 3 | 4 | 5)}
                      className="w-full p-2 bg-white border border-indigo-300 rounded-lg outline-none font-bold text-indigo-900 text-xs"
                    >
                      <option value={3}>Khối 3 (Lớp 3/4, 3/5, 3/6)</option>
                      <option value={4}>Khối 4 (Lớp 4/3, 4/4, 4/5)</option>
                      <option value={5}>Khối 5 (Lớp 5/4, 5/5, 5/6)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-indigo-950 block mb-1">
                      Tên bài học *
                    </label>
                    <input
                      type="text"
                      value={aiLessonTitle}
                      onChange={(e) => setAiLessonTitle(e.target.value)}
                      placeholder="VD: Tìm kiếm thông tin trên website"
                      className="w-full p-2 bg-white border border-indigo-300 rounded-lg outline-none text-xs text-indigo-950 font-medium"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-indigo-950 block mb-1">
                      Số lượng câu hỏi:
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[5, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setAiQuestionCount(num)}
                          className={`flex-1 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                            aiQuestionCount === num
                              ? 'bg-indigo-600 text-white shadow-2xs'
                              : 'bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-200'
                          }`}
                        >
                          {num} câu
                        </button>
                      ))}
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={aiQuestionCount}
                        onChange={(e) => setAiQuestionCount(Number(e.target.value))}
                        className="w-14 p-1.5 bg-white border border-indigo-300 rounded-lg text-center font-bold text-xs text-indigo-950 outline-none"
                        title="Số câu tùy chỉnh (1-25 câu)"
                      />
                    </div>
                  </div>
                </div>

                {/* Topic content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-indigo-950">
                      Chủ đề / Nội dung kiến thức cần kiểm tra *
                    </label>
                    <span className="text-[10px] text-indigo-700 italic">
                      AI cam kết bám sát 100% chủ đề này, không sinh câu hỏi lạc đề
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={aiTopicContent}
                    onChange={(e) => setAiTopicContent(e.target.value)}
                    placeholder="VD: Cách dùng máy tìm kiếm để tìm thông tin, đặt từ khóa ngắn gọn, xác định kết quả tìm kiếm an toàn và hữu ích trên Internet..."
                    className="w-full p-2 bg-white border border-indigo-300 rounded-lg outline-none text-xs text-indigo-950 leading-relaxed"
                  />
                </div>

                {/* Optional reference text / pasted lesson text or uploaded file */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-indigo-950">
                      Tài liệu bài học tham khảo (Dán văn bản SGK hoặc tải tệp .txt):
                    </label>
                    <label className="cursor-pointer text-[10px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-2 py-0.5 rounded-md border border-indigo-300 flex items-center gap-1 transition">
                      <Upload className="w-3 h-3" />
                      <span>Tải tệp tài liệu (.txt)</span>
                      <input
                        type="file"
                        accept=".txt,.md,.json,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              const text = evt.target?.result;
                              if (typeof text === 'string') {
                                setAiLessonRefText(text);
                              }
                            };
                            reader.readAsText(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    value={aiLessonRefText}
                    onChange={(e) => setAiLessonRefText(e.target.value)}
                    placeholder="Dán nội dung bài đọc, kiến thức trọng tâm SGK nếu muốn AI sinh câu hỏi bám sát từng câu chữ..."
                    className="w-full p-2 bg-white border border-indigo-200 rounded-lg outline-none text-xs text-slate-700"
                  />
                </div>

                {/* Cognitive levels & Question Types */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-200 space-y-1.5">
                    <span className="font-bold text-indigo-950 block text-[11px]">
                      Mức độ nhận thức (Thông tư 27):
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                      {['Nhận biết', 'Thông hiểu', 'Vận dụng'].map((lvl) => (
                        <label key={lvl} className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={aiCognitiveLevels.includes(lvl)}
                            onChange={() => handleToggleAiCognitiveLevel(lvl)}
                            className="rounded text-indigo-600"
                          />
                          <span>{lvl}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 bg-white/90 rounded-xl border border-indigo-200 space-y-1.5">
                    <span className="font-bold text-indigo-950 block text-[11px]">
                      Dạng câu hỏi mong muốn:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap text-[11px]">
                      {[
                        { key: 'single_choice', label: '1 đáp án' },
                        { key: 'true_false', label: 'Đúng/Sai' },
                        { key: 'multiple_choice', label: 'Nhiều đáp án' },
                        { key: 'short_answer', label: 'Điền khuyết' },
                        { key: 'essay', label: 'Tự luận ngắn' },
                      ].map((typeObj) => (
                        <label key={typeObj.key} className="flex items-center gap-1 cursor-pointer font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={aiQuestionTypes.includes(typeObj.key)}
                            onChange={() => handleToggleAiQuestionType(typeObj.key)}
                            className="rounded text-indigo-600"
                          />
                          <span>{typeObj.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error message display if any */}
                {aiError && (
                  <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-xs">Thông báo từ hệ thống AI:</strong>
                      <p className="text-[11px] mt-0.5 leading-relaxed">{aiError}</p>
                    </div>
                  </div>
                )}

                {/* Action button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-indigo-800">
                    💡 Gọi mô hình <strong>Gemini 3.8 Flash</strong> an toàn phía máy chủ. Giáo viên luôn xem trước và duyệt trước khi lưu.
                  </span>

                  <button
                    type="button"
                    onClick={handleGenerateAiQuestions}
                    disabled={isGeneratingAi}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                        <span>AI đang tạo câu hỏi... Vui lòng đợi trong giây lát</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>✨ AI Tạo {aiQuestionCount} câu hỏi ngay</span>
                      </>
                    )}
                  </button>
                </div>

                {/* DRAFT PREVIEW (Bản nháp câu hỏi do AI tạo) */}
                {aiDraftQuestions && (
                  <div className="mt-4 p-4 bg-white rounded-xl border-2 border-indigo-400 shadow-md space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-indigo-100 flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="font-black text-slate-800 text-xs sm:text-sm">
                          Bản nháp câu hỏi do AI tạo ({aiDraftQuestions.length} câu)
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Đã sẵn sàng duyệt
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const newQ: TheoryQuestion = {
                              id: `q_manual_${Date.now()}`,
                              type: 'single_choice',
                              prompt: 'Nhập câu hỏi mới...',
                              options: ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'],
                              correctAnswers: 'Phương án A',
                              explanation: 'Giải thích chi tiết...',
                              cognitiveLevel: 'Thông hiểu',
                              points: 1.0,
                            };
                            setAiDraftQuestions([...aiDraftQuestions, newQ]);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm câu hỏi</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleApplyAiDraft}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Duyệt và lưu bộ câu hỏi này</span>
                        </button>
                      </div>
                    </div>

                    {/* Questions Cards in Draft */}
                    <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                      {aiDraftQuestions.map((q, idx) => (
                        <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-indigo-950">
                                Câu {idx + 1}:
                              </span>
                              <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-blue-100 text-blue-800">
                                {q.type === 'single_choice' ? '1 đáp án' : q.type === 'multiple_choice' ? 'Nhiều đáp án' : q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Điền khuyết' : 'Tự luận'}
                              </span>
                              {q.cognitiveLevel && (
                                <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-purple-100 text-purple-800">
                                  {q.cognitiveLevel}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-500 font-medium">Điểm:</span>
                              <input
                                type="number"
                                step={0.5}
                                min={0.5}
                                max={10}
                                value={q.points}
                                onChange={(e) => {
                                  const next = [...aiDraftQuestions];
                                  next[idx].points = Number(e.target.value);
                                  setAiDraftQuestions(next);
                                }}
                                className="w-14 p-1 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setAiDraftQuestions(aiDraftQuestions.filter((_, i) => i !== idx));
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Xóa câu hỏi này khỏi bản nháp"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Editable prompt */}
                          <input
                            type="text"
                            value={q.prompt}
                            onChange={(e) => {
                              const next = [...aiDraftQuestions];
                              next[idx].prompt = e.target.value;
                              setAiDraftQuestions(next);
                            }}
                            className="w-full p-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 outline-none focus:border-indigo-500"
                          />

                          {/* Options if choice */}
                          {q.options && q.options.length > 0 && (
                            <div className="space-y-1 pl-3 border-l-2 border-indigo-200">
                              <span className="text-[10px] text-slate-500 font-bold block">Phương án lựa chọn:</span>
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = Array.isArray(q.correctAnswers)
                                  ? q.correctAnswers.includes(opt)
                                  : q.correctAnswers === opt;
                                return (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>
                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => {
                                        const next = [...aiDraftQuestions];
                                        if (next[idx].options) {
                                          next[idx].options![optIdx] = e.target.value;
                                          setAiDraftQuestions(next);
                                        }
                                      }}
                                      className={`flex-1 p-1 bg-white border rounded text-xs ${
                                        isCorrect ? 'border-emerald-400 font-bold text-emerald-950 bg-emerald-50/50' : 'border-slate-200 text-slate-700'
                                      }`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Correct answer and explanation */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                            <div>
                              <span className="text-[10px] text-emerald-800 font-bold block">Đáp án đúng:</span>
                              <input
                                type="text"
                                value={Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : q.correctAnswers}
                                onChange={(e) => {
                                  const next = [...aiDraftQuestions];
                                  if (q.type === 'multiple_choice') {
                                    next[idx].correctAnswers = e.target.value.split(',').map(s => s.trim());
                                  } else {
                                    next[idx].correctAnswers = e.target.value;
                                  }
                                  setAiDraftQuestions(next);
                                }}
                                className="w-full p-1.5 bg-white border border-emerald-300 rounded font-bold text-emerald-900 text-xs"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-blue-800 font-bold block">Lời giải thích:</span>
                              <input
                                type="text"
                                value={q.explanation}
                                onChange={(e) => {
                                  const next = [...aiDraftQuestions];
                                  next[idx].explanation = e.target.value;
                                  setAiDraftQuestions(next);
                                }}
                                className="w-full p-1.5 bg-white border border-blue-300 rounded text-blue-900 text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-indigo-100 flex justify-end">
                      <button
                        type="button"
                        onClick={handleApplyAiDraft}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Duyệt và lưu bộ câu hỏi này vào đề kiểm tra</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. GENERAL INFO SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Tên bài kiểm tra / Luyện tập *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kiểm tra Lý thuyết Tin học 4: Tìm kiếm thông tin trên website"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500 font-semibold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Chủ đề bài học</label>
              <input
                type="text"
                value={lessonTopic}
                onChange={(e) => setLessonTopic(e.target.value)}
                placeholder="VD: Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 3. ACTIVITY TYPE & GRADE & TIMING */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Khối lớp *</label>
              <select
                value={grade}
                onChange={(e) => handleGradeChange(Number(e.target.value) as 3 | 4 | 5)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-bold text-blue-700"
              >
                <option value={3}>Khối 3 (Lớp 3/4, 3/5, 3/6)</option>
                <option value={4}>Khối 4 (Lớp 4/3, 4/4, 4/5)</option>
                <option value={5}>Khối 5 (Lớp 5/4, 5/5, 5/6)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Mục đích đánh giá:</label>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value as 'practice' | 'periodic_exam')}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-semibold text-slate-700"
              >
                <option value="practice">Luyện tập thường xuyên (ĐGTX theo TT 27)</option>
                <option value="periodic_exam">Kiểm tra định kỳ (Thang điểm 10)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Thời gian làm bài (Phút)</label>
              <input
                type="number"
                min={5}
                max={60}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Số lần làm tối đa</label>
              <input
                type="number"
                min={1}
                max={5}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none"
              />
            </div>
          </div>

          {/* 4. CLASS SELECTION (STRICTLY GRADE-FILTERED - REQUIREMENT 2) */}
          <div>
            <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
              <label className="font-bold text-slate-800">
                Giao cho các lớp Khối {grade}:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allGradeClassIds = classes.filter(c => c.grade === grade).map(c => c.id);
                    setTargetClassIds(allGradeClassIds);
                  }}
                  className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200 transition cursor-pointer"
                >
                  ✓ Chọn tất cả các lớp Khối {grade}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetClassIds([])}
                  className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  ✕ Bỏ chọn tất cả
                </button>
              </div>
            </div>

            {/* Display only classes belonging to this grade */}
            <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              {classes.filter(c => c.grade === grade).map(c => {
                const isSelected = targetClassIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleToggleClass(c.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{c.name}</span>
                    <span className={`text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      ({c.totalStudents} HS)
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 italic">
              * Hệ thống chỉ hiển thị đúng các lớp thuộc Khối {grade} của Trường Tiểu học Đồng Dương ({grade === 3 ? 'Lớp 3/4, 3/5, 3/6' : grade === 4 ? 'Lớp 4/3, 4/4, 4/5' : 'Lớp 5/4, 5/5, 5/6'}).
            </p>
          </div>

          {/* 5. OPTIONS & REVIEW SETTINGS */}
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={allowReview}
                onChange={(e) => setAllowReview(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-medium text-slate-700">
                Cho phép học sinh xem đáp án đúng, câu sai và lời giải thích sau khi nộp bài
              </span>
            </label>
          </div>

          {/* 6. QUESTIONS LIST EDITOR */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">
                  Danh sách câu hỏi chính thức ({questions.length} câu - Tổng: {questions.reduce((a, b) => a + (b.points || 0), 0)}đ)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Thầy/Cô có thể chỉnh sửa thủ công từng câu hỏi, đáp án và lời giải bên dưới.
                </p>
              </div>

              {/* Add manual question buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddQuestion('single_choice')}
                  className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded font-semibold text-[11px] hover:bg-blue-100 cursor-pointer"
                >
                  + Trắc nghiệm 1 đáp án
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('multiple_choice')}
                  className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold text-[11px] hover:bg-indigo-100 cursor-pointer"
                >
                  + Nhiều đáp án
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('true_false')}
                  className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold text-[11px] hover:bg-emerald-100 cursor-pointer"
                >
                  + Đúng / Sai
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('short_answer')}
                  className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-semibold text-[11px] hover:bg-amber-100 cursor-pointer"
                >
                  + Điền khuyết
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('essay')}
                  className="px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold text-[11px] hover:bg-purple-100 cursor-pointer"
                >
                  + Tự luận ngắn
                </button>
              </div>
            </div>

            {/* Questions items */}
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-blue-800">
                        Câu {idx + 1}: ({q.type === 'single_choice' ? '1 đáp án' : q.type === 'multiple_choice' ? 'Nhiều đáp án' : q.type === 'true_false' ? 'Đúng/Sai' : q.type === 'short_answer' ? 'Điền khuyết' : 'Tự luận'})
                      </span>
                      {q.cognitiveLevel && (
                        <span className="text-[10px] px-2 py-0.2 rounded bg-purple-100 text-purple-800 font-semibold">
                          {q.cognitiveLevel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">Điểm:</span>
                      <input
                        type="number"
                        min={0.5}
                        max={10}
                        step={0.5}
                        value={q.points}
                        onChange={(e) => {
                          const pts = Number(e.target.value);
                          const next = [...questions];
                          next[idx].points = pts;
                          setQuestions(next);
                        }}
                        className="w-14 p-1 bg-white border border-slate-300 rounded text-center font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Xóa câu hỏi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={q.prompt}
                    onChange={(e) => {
                      const next = [...questions];
                      next[idx].prompt = e.target.value;
                      setQuestions(next);
                    }}
                    placeholder="Nhập nội dung câu hỏi..."
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg outline-none font-medium text-xs"
                  />

                  {/* Options editor for choice questions */}
                  {q.options && (
                    <div className="space-y-1 pl-4 border-l-2 border-slate-300">
                      <span className="text-[10px] text-slate-500 font-bold block">Các phương án lựa chọn:</span>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...questions];
                              if (next[idx].options) {
                                next[idx].options![optIdx] = e.target.value;
                                setQuestions(next);
                              }
                            }}
                            className="flex-1 p-1.5 bg-white border border-slate-300 rounded text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Correct answer and explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold block mb-0.5">Đáp án đúng chính xác:</span>
                      <input
                        type="text"
                        value={Array.isArray(q.correctAnswers) ? q.correctAnswers.join(', ') : q.correctAnswers}
                        onChange={(e) => {
                          const next = [...questions];
                          if (q.type === 'multiple_choice') {
                            next[idx].correctAnswers = e.target.value.split(',').map(s => s.trim());
                          } else {
                            next[idx].correctAnswers = e.target.value;
                          }
                          setQuestions(next);
                        }}
                        placeholder="Nhập đáp án đúng..."
                        className="w-full p-1.5 bg-white border border-emerald-300 rounded text-xs font-bold text-emerald-900"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-800 font-bold block mb-0.5">Lời giải thích dễ hiểu:</span>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => {
                          const next = [...questions];
                          next[idx].explanation = e.target.value;
                          setQuestions(next);
                        }}
                        placeholder="Nhập lời giải thích cho học sinh..."
                        className="w-full p-1.5 bg-white border border-blue-300 rounded text-xs text-blue-900"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center flex-wrap gap-2">
            <span className="text-slate-500 text-[11px]">
              Đang chọn: <strong>{targetClassIds.length} lớp</strong> ({targetClassIds.join(', ') || 'Chưa chọn lớp'})
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
              >
                Lưu & Giao bài kiểm tra ({questions.length} câu)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
