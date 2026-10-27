import React, { useState, useMemo, useEffect } from 'react';
import { 
  TheoryQuiz, 
  PracticeAssignment, 
  UserSession,
  AssignmentDispatchRecord
} from '../types/assignments';
import { Student, ClassInfo } from '../types/classroom';
import { 
  getStoredQuizzes, 
  saveQuiz, 
  getStoredPracticeAssignments, 
  savePracticeAssignment,
  getStoredAssignmentDispatches,
  saveAssignmentDispatch,
  deleteAssignmentDispatch
} from '../services/assignmentService';
import { isSameClass, CLASSES_DATA } from '../data/initialData';
import { 
  Send, 
  X, 
  Users, 
  FileText, 
  Laptop, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Search, 
  HelpCircle,
  FolderOpen,
  Filter,
  Layers,
  History,
  Trash2,
  AlertTriangle,
  Award,
  ChevronRight,
  BookOpen,
  Share2
} from 'lucide-react';

interface AssignExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession;
  classes?: ClassInfo[];
  students: Student[];
  currentClassId?: string;
  initialQuiz?: TheoryQuiz | null;
  initialPractice?: PracticeAssignment | null;
  onAssignmentSaved?: () => void;
  onShowToast?: (msg: { text: string; type: 'success' | 'error' | 'info' }) => void;
}

export const AssignExerciseModal: React.FC<AssignExerciseModalProps> = ({
  isOpen,
  onClose,
  session,
  classes = CLASSES_DATA,
  students,
  currentClassId = '5.4',
  initialQuiz = null,
  initialPractice = null,
  onAssignmentSaved,
  onShowToast
}) => {
  // Tabs: 'create_dispatch' (Giao bài) vs 'dispatch_history' (Lịch sử đã giao)
  const [modalTab, setModalTab] = useState<'create_dispatch' | 'dispatch_history'>('create_dispatch');

  // Loaded assignments list
  const [quizzes, setQuizzes] = useState<TheoryQuiz[]>(() => getStoredQuizzes());
  const [practiceAssignments, setPracticeAssignments] = useState<PracticeAssignment[]>(() => getStoredPracticeAssignments());
  const [dispatches, setDispatches] = useState<AssignmentDispatchRecord[]>(() => getStoredAssignmentDispatches());

  // STEP 1: CLASS & STUDENT TARGET SELECTION
  const [targetType, setTargetType] = useState<'whole_class' | 'individual_students'>('whole_class');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState<string>('all');

  // STEP 2: EXERCISE SELECTION
  const [exerciseTypeFilter, setExerciseTypeFilter] = useState<'all' | 'theory' | 'practice'>('all');
  const [exerciseGradeFilter, setExerciseGradeFilter] = useState<'all' | 3 | 4 | 5>('all');
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [selectedExerciseCategory, setSelectedExerciseCategory] = useState<'theory' | 'practice'>('theory');

  // STEP 3: ASSIGNMENT SETTINGS
  const [deadlineDate, setDeadlineDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [deadlineTime, setDeadlineTime] = useState<string>('23:59');
  const [maxAttempts, setMaxAttempts] = useState<number>(2);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [teacherInstructions, setTeacherInstructions] = useState<string>(
    'Các em đọc kỹ lý thuyết bài học và làm bài cẩn thận. Kiểm tra lại kết quả trước khi nộp bài nhé.'
  );

  // Sync state when opened with initial assignment or when opened fresh
  useEffect(() => {
    if (!isOpen) return;

    // Refresh assignments from storage
    const currentQ = getStoredQuizzes();
    const currentP = getStoredPracticeAssignments();
    const currentD = getStoredAssignmentDispatches();
    setQuizzes(currentQ);
    setPracticeAssignments(currentP);
    setDispatches(currentD);

    if (initialQuiz) {
      setSelectedExerciseCategory('theory');
      setSelectedExerciseId(initialQuiz.id);
      setSelectedClassIds(initialQuiz.targetClassIds.length > 0 ? initialQuiz.targetClassIds : [currentClassId]);
      if (initialQuiz.deadline) {
        setDeadlineDate(initialQuiz.deadline.split(' ')[0] || initialQuiz.deadline);
      }
      setMaxAttempts(initialQuiz.maxAttempts || 2);
      setTimeLimitMinutes(initialQuiz.timeLimitMinutes || 15);
      if (initialQuiz.teacherInstructions) {
        setTeacherInstructions(initialQuiz.teacherInstructions);
      }
    } else if (initialPractice) {
      setSelectedExerciseCategory('practice');
      setSelectedExerciseId(initialPractice.id);
      setSelectedClassIds(initialPractice.targetClassIds.length > 0 ? initialPractice.targetClassIds : [currentClassId]);
      if (initialPractice.deadline) {
        setDeadlineDate(initialPractice.deadline.split(' ')[0] || initialPractice.deadline);
      }
      if (initialPractice.teacherInstructions) {
        setTeacherInstructions(initialPractice.teacherInstructions);
      }
    } else {
      // Default to first Tin học quiz if none selected
      const tinQuizzes = currentQ.filter(q => q.subject !== 'congnghe' && !q.title?.toLowerCase().includes('công nghệ') && !q.lessonTopic?.toLowerCase().includes('công nghệ'));
      if (tinQuizzes.length > 0) {
        setSelectedExerciseCategory('theory');
        setSelectedExerciseId(tinQuizzes[0].id);
        setSelectedClassIds(tinQuizzes[0].targetClassIds.length > 0 ? tinQuizzes[0].targetClassIds : [currentClassId]);
      }
    }
  }, [isOpen, initialQuiz, initialPractice, currentClassId]);

  // Combined assignment list (Chỉ giữ môn Tin học, loại bỏ hoàn toàn môn Công nghệ)
  const allExercises = useMemo(() => {
    const list: Array<{
      id: string;
      category: 'theory' | 'practice';
      title: string;
      grade: 3 | 4 | 5;
      topic: string;
      targetClassIds: string[];
      detailsText: string;
      deadline: string;
      timeLimitMinutes?: number;
      maxAttempts?: number;
      questionsCount?: number;
    }> = [];

    quizzes.forEach(q => {
      // Loại bỏ toàn bộ bài lý thuyết thuộc môn Công nghệ
      if (q.subject === 'congnghe') return;
      if (q.title?.toLowerCase().includes('công nghệ') || q.lessonTopic?.toLowerCase().includes('công nghệ')) return;

      list.push({
        id: q.id,
        category: 'theory',
        title: q.title,
        grade: q.grade,
        topic: q.lessonTopic,
        targetClassIds: q.targetClassIds,
        detailsText: `${q.questions.length} câu trắc nghiệm • ${q.timeLimitMinutes} phút • Tối đa ${q.maxAttempts} lần`,
        deadline: q.deadline,
        timeLimitMinutes: q.timeLimitMinutes,
        maxAttempts: q.maxAttempts,
        questionsCount: q.questions.length,
      });
    });

    practiceAssignments.forEach(p => {
      // Loại bỏ toàn bộ bài thực hành thuộc môn Công nghệ
      if (p.subject === 'congnghe') return;
      if (p.title?.toLowerCase().includes('công nghệ') || p.objectives?.toLowerCase().includes('công nghệ')) return;

      list.push({
        id: p.id,
        category: 'practice',
        title: p.title,
        grade: p.grade,
        topic: p.objectives,
        targetClassIds: p.targetClassIds,
        detailsText: `Thực hành số • Tiêu chí chấm: ${p.rubric.length} mục • Thang ${p.maxPoints}đ`,
        deadline: p.deadline,
      });
    });

    return list;
  }, [quizzes, practiceAssignments]);

  // Filtered exercises
  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      if (exerciseTypeFilter !== 'all' && ex.category !== exerciseTypeFilter) return false;
      if (exerciseGradeFilter !== 'all' && ex.grade !== exerciseGradeFilter) return false;
      if (exerciseSearchQuery.trim()) {
        const query = exerciseSearchQuery.toLowerCase();
        const matchesTitle = ex.title.toLowerCase().includes(query);
        const matchesTopic = ex.topic.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTopic) return false;
      }
      return true;
    });
  }, [allExercises, exerciseTypeFilter, exerciseGradeFilter, exerciseSearchQuery]);

  // Currently selected exercise object
  const currentSelectedExercise = useMemo(() => {
    return allExercises.find(e => e.id === selectedExerciseId && e.category === selectedExerciseCategory) || allExercises[0];
  }, [allExercises, selectedExerciseId, selectedExerciseCategory]);

  // Total student count for selected classes
  const targetStudentsCount = useMemo(() => {
    if (targetType === 'individual_students') {
      return selectedStudentIds.length;
    }
    return students.filter(s => selectedClassIds.some(cId => isSameClass(s.classId, cId))).length;
  }, [targetType, selectedClassIds, selectedStudentIds, students]);

  // Quick class selection helpers
  const handleSelectGradeClasses = (grade: 3 | 4 | 5) => {
    const gradeClassIds = classes.filter(c => c.grade === grade).map(c => c.id);
    setSelectedClassIds(prev => Array.from(new Set([...prev, ...gradeClassIds])));
  };

  const handleSelectAllClasses = () => {
    setSelectedClassIds(classes.map(c => c.id));
  };

  const handleClearClasses = () => {
    setSelectedClassIds([]);
    setSelectedStudentIds([]);
  };

  const handleToggleClass = (classId: string) => {
    setSelectedClassIds(prev => 
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  // Quick preset deadline buttons
  const setDeadlinePreset = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDeadlineDate(d.toISOString().split('T')[0]);
  };

  // Quick preset teacher instructions
  const teacherPresets = [
    '💡 Các em đọc kỹ kiến thức trong SGK Tin học trước khi làm bài, kiểm tra kỹ đáp án trước khi bấm nộp bài.',
    '💻 Bài tập thực hành: Lưu bài đúng thư mục _TIN HỌC của lớp, đặt tên tệp: [SốMáy]_[HọTên]_[TênBài].',
    '⭐ Bài tập ôn tập củng cố kiến thức cuối tuần, yêu cầu 100% học sinh các lớp hoàn thành đúng hạn.',
    '🚀 Nhiệm vụ sáng tạo nâng cao dành cho các bạn đam mê Tin học và Lập trình Scratch.'
  ];

  // SUBMIT ASSIGNMENT DISPATCH
  const handleConfirmAssign = () => {
    if (!currentSelectedExercise) {
      alert('Vui lòng chọn một bài tập để giao!');
      return;
    }

    if (selectedClassIds.length === 0 && targetType === 'whole_class') {
      alert('Vui lòng chọn ít nhất một lớp học để giao bài tập!');
      return;
    }

    if (targetType === 'individual_students' && selectedStudentIds.length === 0) {
      alert('Vui lòng chọn ít nhất một học sinh để giao bài!');
      return;
    }

    const fullDeadline = `${deadlineDate} ${deadlineTime}`;
    const teacherName = session.teacherName || 'Cô Nguyễn Thị Huệ (GV Phụ trách Bộ môn Tin học)';

    if (currentSelectedExercise.category === 'theory') {
      const q = quizzes.find(item => item.id === currentSelectedExercise.id);
      if (q) {
        const updatedQuiz: TheoryQuiz = {
          ...q,
          targetClassIds: selectedClassIds,
          assignedStudentIds: targetType === 'individual_students' ? selectedStudentIds : undefined,
          deadline: fullDeadline,
          maxAttempts: maxAttempts,
          timeLimitMinutes: timeLimitMinutes,
          teacherInstructions: teacherInstructions,
          status: 'published'
        };
        saveQuiz(updatedQuiz);
      }
    } else {
      const p = practiceAssignments.find(item => item.id === currentSelectedExercise.id);
      if (p) {
        const updatedPractice: PracticeAssignment = {
          ...p,
          targetClassIds: selectedClassIds,
          assignedStudentIds: targetType === 'individual_students' ? selectedStudentIds : undefined,
          deadline: fullDeadline,
          teacherInstructions: teacherInstructions,
          status: 'published'
        };
        savePracticeAssignment(updatedPractice);
      }
    }

    // Create dispatch record for history tracking
    const newDispatch: AssignmentDispatchRecord = {
      id: `disp_${Date.now()}`,
      assignmentId: currentSelectedExercise.id,
      assignmentType: currentSelectedExercise.category,
      assignmentTitle: currentSelectedExercise.title,
      grade: currentSelectedExercise.grade,
      targetClassIds: selectedClassIds,
      assignedStudentIds: targetType === 'individual_students' ? selectedStudentIds : undefined,
      assignedStudentCount: targetStudentsCount,
      deadline: fullDeadline,
      maxAttempts: currentSelectedExercise.category === 'theory' ? maxAttempts : undefined,
      teacherInstructions: teacherInstructions,
      assignedBy: teacherName,
      assignedAt: new Date().toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
      }),
      status: 'active'
    };

    saveAssignmentDispatch(newDispatch);

    if (onShowToast) {
      onShowToast({
        text: `Đã giao thành công bài "${currentSelectedExercise.title}" cho ${selectedClassIds.length} lớp (${targetStudentsCount} học sinh)!`,
        type: 'success'
      });
    }

    if (onAssignmentSaved) {
      onAssignmentSaved();
    }

    onClose();
  };

  // Delete dispatch record
  const handleDeleteDispatch = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa lịch sử đợt giao bài này?')) {
      deleteAssignmentDispatch(id);
      setDispatches(getStoredAssignmentDispatches());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border-2 border-blue-600 max-w-5xl w-full my-auto overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-blue-950 flex items-center justify-center shadow-md font-black">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  GIAO BÀI TẬP CHO LỚP & HỌC SINH
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  Môn Tin học • Phòng máy tính
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Giáo viên phụ trách: <strong>Cô Nguyễn Thị Huệ</strong> • Trường TH Đồng Dương 2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="hidden sm:flex items-center bg-blue-950/60 p-1 rounded-xl border border-blue-600/40 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('create_dispatch')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer ${modalTab === 'create_dispatch' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-200 hover:text-white'}`}
              >
                Giao bài mới
              </button>
              <button
                type="button"
                onClick={() => setModalTab('dispatch_history')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${modalTab === 'dispatch_history' ? 'bg-white text-blue-900 shadow-xs' : 'text-blue-200 hover:text-white'}`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Lịch sử đã giao ({dispatches.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE SUB-TABS */}
        <div className="sm:hidden flex border-b border-slate-200 bg-slate-100 p-1">
          <button
            onClick={() => setModalTab('create_dispatch')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center ${modalTab === 'create_dispatch' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600'}`}
          >
            Giao bài mới
          </button>
          <button
            onClick={() => setModalTab('dispatch_history')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center ${modalTab === 'dispatch_history' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600'}`}
          >
            Lịch sử đã giao ({dispatches.length})
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {modalTab === 'dispatch_history' ? (
            /* TAB 2: DISPATCH HISTORY */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Danh sách các đợt giao bài tập cho học sinh
                  </h4>
                  <p className="text-xs text-slate-500">
                    Theo dõi tiến độ, thời hạn nộp bài và các lớp được phân công
                  </p>
                </div>
                <button
                  onClick={() => setModalTab('create_dispatch')}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>+ Giao bài tập mới</span>
                </button>
              </div>

              {dispatches.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-600">Chưa có đợt giao bài nào</p>
                  <p className="text-xs text-slate-400 mt-1">Bấm nút "Giao bài mới" để giao bài tập đầu tiên cho các lớp.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dispatches.map((disp) => (
                    <div
                      key={disp.id}
                      className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                            disp.assignmentType === 'theory' 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            {disp.assignmentType === 'theory' ? '📝 Lý thuyết' : '💻 Thực hành'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            Khối {disp.grade}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteDispatch(disp.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Xóa đợt giao bài này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                        {disp.assignmentTitle}
                      </h5>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span>Lớp nhận bài:</span>
                          <span className="font-bold text-blue-700">
                            {disp.targetClassIds.join(', ')} ({disp.assignedStudentCount} HS)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Hạn chót nộp:</span>
                          <span className="font-bold text-rose-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {disp.deadline}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Thời gian giao:</span>
                          <span className="text-slate-500">{disp.assignedAt}</span>
                        </div>
                      </div>

                      {disp.teacherInstructions && (
                        <p className="text-[11px] text-slate-600 italic bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                          "{disp.teacherInstructions}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB 1: CREATE DISPATCH WORKFLOW */
            <div className="space-y-6">

              {/* BƯỚC 1: CHỌN LỚP HỌC & ĐỐI TƯỢNG */}
              <div className="bg-white rounded-2xl border-2 border-blue-500/80 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      1
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        CHỌN LỚP HỌC NHẬN BÀI TẬP
                      </h4>
                      <p className="text-xs text-slate-500">
                        Phân công đến 9 lớp (249 học sinh) hoặc chọn từng em cụ thể
                      </p>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setTargetType('whole_class')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        targetType === 'whole_class' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Toàn bộ học sinh trong lớp
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetType('individual_students')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        targetType === 'individual_students' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Chọn từng học sinh cụ thể
                    </button>
                  </div>
                </div>

                {/* Quick select buttons */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 mr-1">Chọn nhanh:</span>
                  <button
                    type="button"
                    onClick={() => handleSelectGradeClasses(3)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer transition"
                  >
                    Khối 3 (85 HS)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectGradeClasses(4)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer transition"
                  >
                    Khối 4 (76 HS)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectGradeClasses(5)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 cursor-pointer transition"
                  >
                    Khối 5 (88 HS)
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 cursor-pointer transition"
                  >
                    Tất cả 9 lớp (249 HS)
                  </button>
                  <button
                    type="button"
                    onClick={handleClearClasses}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium cursor-pointer transition"
                  >
                    Bỏ chọn
                  </button>
                </div>

                {/* 9 Class Cards Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                  {classes.map((cls) => {
                    const isSelected = selectedClassIds.includes(cls.id);
                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => handleToggleClass(cls.id)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                            : 'bg-white border-slate-200 hover:border-blue-400 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="text-xs font-black">{cls.name}</span>
                        <span className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {cls.totalStudents} HS
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 mt-1 text-amber-300" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* If individual students mode is active */}
                {targetType === 'individual_students' && (
                  <div className="mt-3 p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-900">
                          Danh sách học sinh được chọn ({selectedStudentIds.length} HS)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={studentClassFilter}
                          onChange={(e) => setStudentClassFilter(e.target.value)}
                          className="text-xs border border-blue-300 bg-white rounded-lg px-2 py-1 font-bold text-slate-700"
                        >
                          <option value="all">Tất cả lớp được chọn</option>
                          {selectedClassIds.map(cId => (
                            <option key={cId} value={cId}>Lớp {cId}</option>
                          ))}
                        </select>

                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Tìm tên, mã HS..."
                            value={studentSearchQuery}
                            onChange={(e) => setStudentSearchQuery(e.target.value)}
                            className="text-xs border border-blue-300 bg-white rounded-lg pl-7 pr-2 py-1 w-36 sm:w-44 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                        </div>
                      </div>
                    </div>

                    {/* Student List Box */}
                    <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 p-1">
                      {students
                        .filter(s => {
                          if (selectedClassIds.length > 0 && !selectedClassIds.some(cId => isSameClass(s.classId, cId))) {
                            return false;
                          }
                          if (studentClassFilter !== 'all' && !isSameClass(s.classId, studentClassFilter)) {
                            return false;
                          }
                          if (studentSearchQuery.trim()) {
                            const q = studentSearchQuery.toLowerCase();
                            return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
                          }
                          return true;
                        })
                        .map(st => {
                          const isChecked = selectedStudentIds.includes(st.id);
                          return (
                            <label
                              key={st.id}
                              className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                                isChecked
                                  ? 'bg-blue-100 border-blue-500 text-blue-950 font-bold'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStudent(st.id)}
                                className="w-3.5 h-3.5 text-blue-600 rounded-sm cursor-pointer"
                              />
                              <span className="truncate flex-1">
                                {st.name} <span className="text-[10px] text-slate-500">({st.classId} - PC{String(st.seatNumber).padStart(2, '0')})</span>
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-2 rounded-xl flex items-center justify-between border border-blue-200">
                  <span>
                    Tổng số lớp đã chọn: <strong>{selectedClassIds.length} lớp</strong>
                  </span>
                  <span>
                    Tổng số học sinh sẽ nhận bài: <strong className="text-emerald-700 font-black text-sm">{targetStudentsCount} học sinh</strong>
                  </span>
                </div>
              </div>

              {/* BƯỚC 2: CHỌN BÀI TẬP */}
              <div className="bg-white rounded-2xl border-2 border-amber-400 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      2
                    </span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        CHỌN BÀI TẬP CẦN GIAO
                      </h4>
                      <p className="text-xs text-slate-500">
                        Chọn từ ngân hàng câu hỏi lý thuyết hoặc bài tập thực hành sản phẩm số
                      </p>
                    </div>
                  </div>

                  {/* Filter by Category */}
                  <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setExerciseTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        exerciseTypeFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      Tất cả ({allExercises.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExerciseTypeFilter('theory')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        exerciseTypeFilter === 'theory' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      📝 Lý thuyết ({quizzes.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExerciseTypeFilter('practice')}
                      className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                        exerciseTypeFilter === 'practice' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                      }`}
                    >
                      💻 Thực hành ({practiceAssignments.length})
                    </button>
                  </div>
                </div>

                {/* Sub filters */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">Lọc theo khối:</span>
                    <button
                      type="button"
                      onClick={() => setExerciseGradeFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                        exerciseGradeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      Tất cả
                    </button>
                    {[3, 4, 5].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setExerciseGradeFilter(g as 3 | 4 | 5)}
                        className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                          exerciseGradeFilter === g ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Khối {g}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Tìm bài tập theo tên..."
                      value={exerciseSearchQuery}
                      onChange={(e) => setExerciseSearchQuery(e.target.value)}
                      className="text-xs border border-slate-300 rounded-lg pl-7 pr-2 py-1 w-48 sm:w-60 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  </div>
                </div>

                {/* Exercises Radio List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto p-1">
                  {filteredExercises.map((ex) => {
                    const isSelected = selectedExerciseId === ex.id && selectedExerciseCategory === ex.category;
                    return (
                      <div
                        key={`${ex.category}_${ex.id}`}
                        onClick={() => {
                          setSelectedExerciseId(ex.id);
                          setSelectedExerciseCategory(ex.category);
                          if (ex.timeLimitMinutes) setTimeLimitMinutes(ex.timeLimitMinutes);
                          if (ex.maxAttempts) setMaxAttempts(ex.maxAttempts);
                        }}
                        className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-500 shadow-md ring-2 ring-amber-300'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                ex.category === 'theory' 
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              }`}>
                                {ex.category === 'theory' ? '📝 Lý thuyết' : '💻 Thực hành'}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                Khối {ex.grade}
                              </span>
                            </div>

                            {isSelected && (
                              <span className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                                Đã chọn
                              </span>
                            )}
                          </div>

                          <h5 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                            {ex.title}
                          </h5>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {ex.topic}
                          </p>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                          <span>{ex.detailsText}</span>
                          <span className="text-blue-700 font-semibold">
                            Đang giao: {ex.targetClassIds.join(', ') || 'Chưa giao'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BƯỚC 3: THIẾT LẬP THỜI HẠN & HƯỚNG DẪN CỦA CÔ HUỆ */}
              <div className="bg-white rounded-2xl border-2 border-emerald-500/80 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      THỜI HẠN NỘP BÀI & LỜI DẶN DÒ CỦA GIÁO VIÊN
                    </h4>
                    <p className="text-xs text-slate-500">
                      Cài đặt deadline, số lần làm bài và ghi chú hướng dẫn của Cô Huệ cho học sinh
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Deadline picker */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Hạn chót nộp bài (Deadline)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={deadlineDate}
                        onChange={(e) => setDeadlineDate(e.target.value)}
                        className="text-xs border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 flex-1 focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="time"
                        value={deadlineTime}
                        onChange={(e) => setDeadlineTime(e.target.value)}
                        className="text-xs border border-slate-300 rounded-xl px-2 py-2 font-bold text-slate-800 w-24 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {/* Quick deadline buttons */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset(0)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        Hôm nay
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset(1)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        Ngày mai
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset(3)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        3 ngày tới
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeadlinePreset(7)}
                        className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 cursor-pointer"
                      >
                        1 tuần tới
                      </button>
                    </div>
                  </div>

                  {/* Max Attempts */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Số lần làm bài tối đa</span>
                    </label>
                    <select
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(Number(e.target.value))}
                      className="text-xs border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 w-full focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 lần làm (Kiểm tra chấm điểm)</option>
                      <option value={2}>2 lần làm (Có cơ hội sửa sai)</option>
                      <option value={3}>3 lần làm (Luyện tập nâng cao)</option>
                      <option value={99}>Không giới hạn (Tự do ôn tập)</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Hệ thống tự động lưu lịch sử các lần thi và tính điểm lần cao nhất
                    </p>
                  </div>

                  {/* Time limit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Thời gian làm bài</span>
                    </label>
                    <select
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                      className="text-xs border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-800 w-full focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10 phút (Khảo sát nhanh)</option>
                      <option value={15}>15 phút (Bài kiểm tra 15 phút)</option>
                      <option value={20}>20 phút</option>
                      <option value={35}>35 phút (1 tiết thực hành)</option>
                      <option value={45}>45 phút</option>
                    </select>
                    <p className="text-[10px] text-slate-400">
                      Đồng hồ đếm ngược trực tiếp trên màn hình học sinh khi làm bài
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Lời dặn dò / Hướng dẫn của Cô Huệ cho học sinh:
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Hiển thị trực tiếp trên đầu bài thi của học sinh
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={teacherInstructions}
                    onChange={(e) => setTeacherInstructions(e.target.value)}
                    placeholder="Nhập lời dặn dò của giáo viên..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {teacherPresets.map((pr, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTeacherInstructions(pr.replace(/^[^a-zA-ZÀ-ỹ]+/, ''))}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-[10px] font-semibold text-amber-900 border border-amber-200 cursor-pointer text-left transition"
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        {modalTab === 'create_dispatch' && (
          <div className="bg-slate-100 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            {/* Quick summary */}
            <div className="text-xs text-slate-600">
              <div>
                Bài được chọn: <strong className="text-slate-900">{currentSelectedExercise?.title || 'Chưa chọn'}</strong>
              </div>
              <div className="text-[11px] text-blue-700 font-semibold mt-0.5">
                Giao đến: {selectedClassIds.length > 0 ? selectedClassIds.map(c => `Lớp ${c}`).join(', ') : 'Chưa chọn lớp'} ({targetStudentsCount} học sinh) • Hạn nộp: {deadlineDate} {deadlineTime}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-200 text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmAssign}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs transition shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer transform hover:scale-[1.02]"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>🚀 XÁC NHẬN GIAO BÀI TẬP NGAY</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
