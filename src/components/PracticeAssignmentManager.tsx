import React, { useState, useMemo, useEffect } from 'react';
import { 
  PracticeAssignment, 
  PracticeSubmission, 
  UserSession,
  PracticeRubricItem 
} from '../types/assignments';
import { Student, ClassInfo } from '../types/classroom';
import { 
  getStoredPracticeAssignments, 
  savePracticeAssignment, 
  getStoredPracticeSubmissions, 
  savePracticeSubmission, 
  runAutomatedDocxChecks,
  generateGeminiStudentFeedback
} from '../services/assignmentService';
import { 
  Plus, 
  FileText, 
  Upload, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Award, 
  Edit3, 
  X, 
  UserCheck, 
  Eye, 
  History, 
  RefreshCw,
  Sliders,
  Check,
  FileCheck,
  Laptop,
  Users,
  Search,
  Filter,
  GraduationCap,
  ChevronDown,
  Info
} from 'lucide-react';

interface PracticeAssignmentManagerProps {
  session: UserSession;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string;
  onSwitchSession?: (newSession: UserSession) => void;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subject: 'all' | 'tin' | 'congnghe') => void;
}

export const PracticeAssignmentManager: React.FC<PracticeAssignmentManagerProps> = ({
  session,
  classes,
  students,
  currentClassId,
  onSwitchSession,
  selectedSubject = 'tin',
  onSelectSubject,
}) => {
  const [assignments, setAssignments] = useState<PracticeAssignment[]>(() => getStoredPracticeAssignments());
  const [submissions, setSubmissions] = useState<PracticeSubmission[]>(() => getStoredPracticeSubmissions());

  // Filter
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

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<PracticeAssignment | null>(null);
  const [viewingSubmissionsAssignment, setViewingSubmissionsAssignment] = useState<PracticeAssignment | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<PracticeSubmission | null>(null);

  // Student upload & view modals
  const [uploadingForAssignment, setUploadingForAssignment] = useState<PracticeAssignment | null>(null);
  const [studentViewingSub, setStudentViewingSub] = useState<{ sub: PracticeSubmission; assignment: PracticeAssignment } | null>(null);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [mockFileText, setMockFileText] = useState<string>('');

  // Modal Student Identity override (in case studentId is missing or user switches within the modal)
  const [overrideStudentId, setOverrideStudentId] = useState<string>('');
  const [overrideClassId, setOverrideClassId] = useState<string>('');

  // Quick switch dropdown in Practice banner
  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [studentSearchText, setStudentSearchText] = useState('');

  // AI loading status
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const isTeacher = session.role === 'teacher';

  // Resolved active student info strictly scoped to current class
  const classStudents = useMemo(() => students.filter(s => s.classId === currentClassId), [students, currentClassId]);
  const defaultClassStudent = classStudents[0] || students[0];
  const activeStudentId = session.studentId || overrideStudentId || (defaultClassStudent ? defaultClassStudent.id : 'HS45-01');
  const activeStudent = students.find(s => s.id === activeStudentId) || defaultClassStudent || {
    id: activeStudentId,
    code: activeStudentId,
    name: session.studentName || 'Học sinh',
    classId: session.classId || currentClassId || '4/5',
    gender: 'male',
    seatNumber: 1,
    attendance: 'present',
  };
  const activeStudentClassId = session.classId || activeStudent.classId || currentClassId || '4/5';

  // Filtering assignments (strictly Môn Tin học)
  const filteredAssignments = assignments.filter(a => {
    if (gradeFilter !== 'all' && a.grade !== gradeFilter) return false;
    // Exclude any congnghe assignment
    if (a.subject === 'congnghe') return false;
    if (a.subject && a.subject !== 'tin') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchObj = a.objectives.toLowerCase().includes(q);
      if (!matchTitle && !matchObj) return false;
    }
    // For students: allow viewing either assignments for their class or all classes in grade
    if (!isTeacher) {
      if (activeStudentClassId && a.targetClassIds && a.targetClassIds.length > 0) {
        // If student class matches or if viewing all
        return a.targetClassIds.includes(activeStudentClassId);
      }
    }
    return true;
  });

  // Switch student from inside Practice Manager
  const handleSelectStudentForPractice = (st: Student) => {
    setOverrideStudentId(st.id);
    setOverrideClassId(st.classId);
    if (onSwitchSession) {
      onSwitchSession({
        role: 'student',
        studentId: st.id,
        studentName: st.name,
        classId: st.classId,
      });
    }
    setIsStudentPickerOpen(false);
  };

  // Open upload modal with prefilled active student
  const handleOpenUploadModal = (assign: PracticeAssignment) => {
    setUploadingForAssignment(assign);
    setSelectedUploadFile(null);
    // Prefill mock text based on assignment topic
    if (assign.title.toLowerCase().includes('word') || assign.title.toLowerCase().includes('hạt gạo')) {
      setMockFileText(`HẠT GẠO LÀNG TA\nHạt gạo làng ta\nCó vị phù sa\nCủa sông Kinh Thầy\nCó hương sen thơm\nTrong hồ nước đầy...\n[Hình ảnh cánh đồng lúa chèn ở giữa]`);
    } else if (assign.title.toLowerCase().includes('scratch')) {
      setMockFileText(`// Dự án Scratch 3.0: Mèo bắt bóng sao\nwhen green flag clicked\nset [Score v] to [0]\nforever\n  move 10 steps\n  if on edge, bounce\n  if <touching [Star v]?> then\n    play sound [Magic Spell v] until done\n    change [Score v] by 1\n  end\nend`);
    } else {
      setMockFileText(`Bài thực hành môn Tin học Tiểu học của học sinh ${activeStudent.name} (Lớp ${activeStudentClassId}). Đã hoàn thành các yêu cầu kỹ thuật.`);
    }
    setOverrideStudentId(activeStudent.id);
    setOverrideClassId(activeStudentClassId);
  };

  // Teacher Save Assignment
  const handleSaveAssignment = (newAssignment: PracticeAssignment) => {
    savePracticeAssignment(newAssignment);
    setAssignments(getStoredPracticeAssignments());
    setIsCreateOpen(false);
    setEditingAssignment(null);
  };

  // Student submits practical file
  const handleStudentSubmitFile = () => {
    if (!uploadingForAssignment) return;

    // Use current active student info safely
    const finalStudentId = overrideStudentId || activeStudent.id;
    const finalStudentObj = students.find(s => s.id === finalStudentId) || activeStudent;
    const finalStudentName = finalStudentObj.name;
    const finalClassId = overrideClassId || finalStudentObj.classId || activeStudentClassId;

    const studentSanitized = finalStudentName.replace(/\s+/g, '');
    const classSanitized = finalClassId.replace('/', '-');

    const defaultExt = uploadingForAssignment.allowedFileTypes.includes('DOCX') 
      ? 'docx' 
      : uploadingForAssignment.allowedFileTypes.includes('IMAGE') 
      ? 'png' 
      : uploadingForAssignment.allowedFileTypes.includes('PPTX') 
      ? 'pptx' 
      : 'pdf';

    const fileName = selectedUploadFile 
      ? selectedUploadFile.name 
      : `Lop${classSanitized}_${studentSanitized}_${uploadingForAssignment.id}.${defaultExt}`;

    const lowerName = fileName.toLowerCase();
    const fileType = lowerName.endsWith('.pptx') ? 'PPTX' : lowerName.endsWith('.pdf') ? 'PDF' : (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) ? 'IMAGE' : 'DOCX';
    const fileSize = selectedUploadFile ? `${Math.round(selectedUploadFile.size / 1024)} KB` : '245 KB';

    // Run verifiable technical automated check
    const automatedChecks = runAutomatedDocxChecks(fileName, fileType, mockFileText);

    // Submission ID - uniquely identified
    const subId = `sub_p_${uploadingForAssignment.id}_${finalStudentId}`;
    
    // Check if updating existing
    const existingSub = submissions.find(s => s.assignmentId === uploadingForAssignment.id && s.studentId === finalStudentId);
    const attemptSeq = existingSub ? existingSub.history.length + 1 : 1;

    const newSub: PracticeSubmission = {
      id: subId,
      assignmentId: uploadingForAssignment.id,
      studentId: finalStudentId,
      studentName: finalStudentName,
      classId: finalClassId,
      fileName,
      fileType: fileType as any,
      fileSize,
      fileContentText: mockFileText || 'Nội dung tệp thực hành học sinh đã nộp.',
      submittedAt: new Date().toLocaleString('vi-VN', {
        hour: '2-digit', minute: '2-digit',
        day: '2-digit', month: '2-digit', year: 'numeric'
      }),
      status: 'submitted',
      automatedChecks,
      rubricScores: existingSub ? existingSub.rubricScores : {},
      finalScore: null,
      teacherComment: '',
      canResubmit: true,
      history: [
        ...(existingSub ? existingSub.history : []),
        { 
          action: attemptSeq === 1 ? 'Nộp tệp bài làm lần 1' : `Nộp lại bài lần ${attemptSeq}`, 
          timestamp: new Date().toLocaleString('vi-VN'), 
          note: `Tệp ${fileName} (${fileSize}) - ${automatedChecks.totalAwarded}/${automatedChecks.totalPossible}đ kiểm tra kỹ thuật tự động` 
        }
      ],
    };

    savePracticeSubmission(newSub);
    const updatedSubs = getStoredPracticeSubmissions();
    setSubmissions(updatedSubs);
    setUploadingForAssignment(null);
    setSelectedUploadFile(null);

    // Open submission review modal for student immediately so they can verify their submission
    setStudentViewingSub({
      sub: newSub,
      assignment: uploadingForAssignment
    });
  };

  // Trigger Gemini AI comment generation
  const handleGenerateAiFeedback = async (sub: PracticeSubmission, assign: PracticeAssignment) => {
    setIsAiGenerating(true);
    const score = sub.finalScore || sub.automatedChecks?.totalAwarded || 8;
    const result = await generateGeminiStudentFeedback({
      studentName: sub.studentName,
      assignmentTitle: assign.title,
      score,
      maxScore: assign.maxPoints,
      criteriaScores: sub.rubricScores,
      submissionDetails: sub.automatedChecks?.summary,
    });

    setIsAiGenerating(false);
    return result;
  };

  // Teacher finalize grade
  const handleTeacherSaveGrade = (
    sub: PracticeSubmission,
    rubricScores: Record<string, number>,
    finalScore: number,
    gradeLevel: 'T' | 'H' | 'C',
    teacherComment: string,
    requireResubmit: boolean,
    aiFeedback?: any
  ) => {
    const updated: PracticeSubmission = {
      ...sub,
      rubricScores,
      finalScore,
      gradeLevel,
      teacherComment,
      aiSuggestedComment: aiFeedback,
      status: requireResubmit ? 'resubmit_required' : 'graded',
      canResubmit: requireResubmit,
      history: [
        ...sub.history,
        {
          action: requireResubmit ? 'Yêu cầu nộp lại bài' : 'Giáo viên đã chấm điểm & phê duyệt',
          timestamp: new Date().toLocaleString('vi-VN'),
          note: requireResubmit 
            ? 'Cần bổ sung theo nhận xét của giáo viên' 
            : `Điểm: ${finalScore}/10 (${gradeLevel === 'T' ? 'Hoàn thành Tốt' : gradeLevel === 'H' ? 'Hoàn thành' : 'Chưa hoàn thành'})`,
        }
      ],
    };

    savePracticeSubmission(updated);
    setSubmissions(getStoredPracticeSubmissions());
    setGradingSubmission(null);
  };

  // Filter students for the dropdown
  const filteredStudentsForPicker = students.filter(s => 
    s.name.toLowerCase().includes(studentSearchText.toLowerCase()) ||
    s.code.toLowerCase().includes(studentSearchText.toLowerCase()) ||
    s.classId.includes(studentSearchText)
  ).slice(0, 10);

  return (
    <div className="space-y-4">
      {/* 1. STUDENT IDENTITY & ACCESS CONTROL STATUS BAR */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-blue-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/80 border border-blue-400/40 flex items-center justify-center shrink-0">
              <Laptop className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  {isTeacher ? 'Chế độ Giáo viên Quản lý' : 'Cổng Học sinh Nộp bài'}
                </span>
                <span className="text-xs font-bold text-white">
                  Phân quyền nộp bài thực hành máy tính
                </span>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                {isTeacher 
                  ? 'Cô Nguyễn Thị Huệ có toàn quyền giao bài, duyệt tệp nộp, chạy kiểm tra kỹ thuật tự động và chấm điểm kèm trợ lý AI.'
                  : `Đang đăng nhập: ${activeStudent.name} (Mã: ${activeStudent.id} • Lớp ${activeStudentClassId}) - Có toàn quyền nộp tệp và xem nhận xét.`}
              </p>
            </div>
          </div>

          {/* Quick role / student selector */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {/* Quick switch between Teacher and Student */}
            <div className="inline-flex rounded-xl p-0.5 bg-slate-800/80 border border-slate-700 text-xs">
              <button
                onClick={() => {
                  if (!isTeacher && onSwitchSession) {
                    onSwitchSession({
                      role: 'teacher',
                      teacherName: 'Cô Nguyễn Thị Huệ (GV Quản lý Tin học)',
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  isTeacher ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Giáo viên</span>
              </button>

              <button
                onClick={() => {
                  if (isTeacher && onSwitchSession) {
                    const targetSt = students[0];
                    onSwitchSession({
                      role: 'student',
                      studentId: targetSt.id,
                      studentName: targetSt.name,
                      classId: targetSt.classId,
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  !isTeacher ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Học sinh</span>
              </button>
            </div>

            {/* Dropdown student picker */}
            <div className="relative">
              <button
                onClick={() => setIsStudentPickerOpen(!isStudentPickerOpen)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                title="Chọn một học sinh trong danh sách 249 học sinh để thực hành nộp bài"
              >
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="max-w-[140px] truncate">
                  HS: {activeStudent.name} ({activeStudent.classId})
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isStudentPickerOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-fadeIn">
                  <div className="text-[11px] font-bold text-slate-700 px-1 py-1 border-b border-slate-100 flex justify-between items-center">
                    <span>Chọn học sinh nộp bài:</span>
                    <span className="text-[10px] text-slate-400">{students.length} HS</span>
                  </div>
                  <input
                    type="text"
                    value={studentSearchText}
                    onChange={(e) => setStudentSearchText(e.target.value)}
                    placeholder="Tìm tên, mã HS hoặc lớp..."
                    className="w-full text-xs p-1.5 my-1.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                  <div className="max-h-52 overflow-y-auto space-y-1">
                    {filteredStudentsForPicker.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => handleSelectStudentForPractice(st)}
                        className={`w-full text-left p-1.5 rounded-lg text-xs flex justify-between items-center transition cursor-pointer ${
                          activeStudentId === st.id ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="truncate pr-1">
                          <div className="font-semibold">{st.name}</div>
                          <div className="text-[10px] text-slate-400">{st.code} • Lớp {st.classId}</div>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono shrink-0">
                          {st.classId}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP CONTROLS & FILTER BAR */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-blue-900 uppercase tracking-wider bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300">
              💻 BÀI TẬP THỰC HÀNH MÔN TIN HỌC
            </span>
            <h2 className="text-base font-black text-slate-800">
              QUẢN LÝ BÀI TẬP THỰC HÀNH & TRIỂN LÃM SẢN PHẨM SỐ
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Giao bài thực hành máy tính (MS Word, PowerPoint, Vẽ Paint, Scratch 3.0), kiểm tra kỹ thuật tự động và chấm điểm kèm nhận xét AI sư phạm.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm bài thực hành..."
              className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-blue-500 outline-none w-36 sm:w-44 bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Active Subject Badge (Tin học) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs">
            <span>💻 Môn Tin học</span>
          </div>

          {/* Grade filter */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setGradeFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${gradeFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tất cả khối
            </button>
            <button
              onClick={() => setGradeFilter(3)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${gradeFilter === 3 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 3
            </button>
            <button
              onClick={() => setGradeFilter(4)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${gradeFilter === 4 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 4
            </button>
            <button
              onClick={() => setGradeFilter(5)}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${gradeFilter === 5 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 5
            </button>
          </div>

          {isTeacher && (
            <button
              onClick={() => {
                setEditingAssignment(null);
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao dự án sản phẩm số mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. GRID OF PRACTICE ASSIGNMENTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssignments.map((assign) => {
          const assignSubs = submissions.filter(s => s.assignmentId === assign.id);
          // Find student's own submission based on active student identity
          const mySub = assignSubs.find(s => s.studentId === activeStudent.id);
          const gradedCount = assignSubs.filter(s => s.status === 'graded').length;
          const pendingCount = assignSubs.filter(s => s.status === 'submitted').length;
          const resubmitCount = assignSubs.filter(s => s.status === 'resubmit_required').length;

          const isTargetClass = assign.targetClassIds.includes(activeStudentClassId);

          return (
            <div
              key={assign.id}
              className={`bg-white rounded-2xl border-2 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                mySub ? 'border-emerald-500 bg-emerald-50/10' : 'border-blue-500 hover:border-blue-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Khối {assign.grade} • Thang {assign.maxPoints}đ
                  </span>
                  <div className="flex gap-1">
                    {assign.allowedFileTypes.map(t => (
                      <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-bold border border-slate-200">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1">
                  {assign.title}
                </h3>
                <p className="text-[11px] text-slate-600 line-clamp-2 mb-2">
                  {assign.objectives}
                </p>

                <div className="text-[10px] text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                  <div>Lớp giao bài: <strong className="text-slate-800">{assign.targetClassIds.join(', ')}</strong></div>
                  <div>Hạn nộp: <strong className="text-slate-800">{assign.deadline}</strong></div>
                  {assign.sampleAttachmentName && (
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                      <Download className="w-3 h-3" />
                      <span className="truncate">{assign.sampleAttachmentName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action bar */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                {isTeacher ? (
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setViewingSubmissionsAssignment(assign)}
                      className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Bài nộp ({assignSubs.length} bài • {pendingCount} chờ chấm)</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenUploadModal(assign)}
                        title="Thử nghiệm nộp bài với tư cách học sinh"
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                      >
                        Nộp thử
                      </button>
                      <button
                        onClick={() => {
                          setEditingAssignment(assign);
                          setIsCreateOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                        title="Chỉnh sửa bài tập"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mySub ? (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            mySub.status === 'graded' 
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                              : mySub.status === 'resubmit_required'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {mySub.status === 'graded' 
                              ? `Đã chấm: ${mySub.finalScore}/10 (${mySub.gradeLevel || 'Đạt'})` 
                              : mySub.status === 'resubmit_required' 
                              ? 'Cần nộp lại' 
                              : 'Đã nộp • Chờ cô chấm'}
                          </span>

                          <button
                            onClick={() => setStudentViewingSub({ sub: mySub, assignment: assign })}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Xem nhận xét</span>
                          </button>
                        </div>

                        {mySub.canResubmit && (
                          <button
                            onClick={() => handleOpenUploadModal(assign)}
                            className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Nộp lại tệp bài làm</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleOpenUploadModal(assign)}
                        className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md hover:shadow-lg active:scale-98"
                      >
                        <Upload className="w-4 h-4 text-yellow-300" />
                        <span>Nộp tệp bài làm ngay ({activeStudent.name})</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. STUDENT UPLOAD MODAL (Accessible by student or teacher testing) */}
      {uploadingForAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm">Nộp tệp bài tập thực hành</h3>
                <p className="text-xs text-blue-100">{uploadingForAssignment.title}</p>
              </div>
              <button onClick={() => setUploadingForAssignment(null)} className="p-1 text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Student identity bar inside modal */}
              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Học sinh nộp bài:</span>
                  <div className="font-black text-slate-800 text-xs">
                    {activeStudent.name} <span className="font-mono text-slate-500 font-normal">({activeStudent.id})</span>
                  </div>
                  <div className="text-[11px] text-slate-500">Lớp: <strong>{activeStudentClassId}</strong> • TRƯỜNG TIỂU HỌC ĐỒNG DƯƠNG 2</div>
                </div>

                {/* Quick switcher inside modal */}
                <div className="shrink-0">
                  <select
                    value={overrideStudentId || activeStudent.id}
                    onChange={(e) => {
                      const st = students.find(s => s.id === e.target.value);
                      if (st) {
                        setOverrideStudentId(st.id);
                        setOverrideClassId(st.classId);
                        if (onSwitchSession) {
                          onSwitchSession({
                            role: 'student',
                            studentId: st.id,
                            studentName: st.name,
                            classId: st.classId,
                          });
                        }
                      }
                    }}
                    className="p-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-blue-900 outline-none"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code} - Lớp {s.classId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Yêu cầu bài tập:</span>
                <p className="text-slate-600 leading-relaxed text-[11px] whitespace-pre-line">
                  {uploadingForAssignment.instructions}
                </p>
              </div>

              {/* File upload zone */}
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-5 text-center bg-blue-50/40 hover:bg-blue-50 transition cursor-pointer">
                <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Kéo thả tệp hoặc nhấp để chọn tệp từ máy</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Định dạng cho phép: {uploadingForAssignment.allowedFileTypes.join(', ')} (DOCX, PPTX, PDF, IMAGE)
                </p>
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedUploadFile(e.target.files[0]);
                    }
                  }}
                  className="mt-3 block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                />
                {selectedUploadFile && (
                  <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    Đã chọn: {selectedUploadFile.name} ({Math.round(selectedUploadFile.size / 1024)} KB)
                  </div>
                )}
              </div>

              {/* Sample Preset helper for rapid testing without needing a local docx file */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px]">
                <div className="font-bold text-amber-900 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Nội dung bài làm thực hành (để hệ thống kiểm tra tự động):</span>
                  </span>
                  <span className="text-[10px] text-amber-700 font-normal">Hỗ trợ kiểm tra tự động</span>
                </div>
                <textarea
                  rows={4}
                  value={mockFileText}
                  onChange={(e) => setMockFileText(e.target.value)}
                  placeholder="Gõ hoặc dán nội dung văn bản để hệ thống kiểm tra tự động..."
                  className="w-full p-2 bg-white border border-amber-300 rounded text-xs outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setUploadingForAssignment(null)} 
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleStudentSubmitFile}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Xác nhận nộp bài</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. STUDENT SUBMISSION STATUS & FEEDBACK REVIEW MODAL */}
      {studentViewingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm">Chi tiết bài nộp & Nhận xét của Giáo viên</h3>
                <p className="text-xs text-emerald-100">{studentViewingSub.assignment.title}</p>
              </div>
              <button onClick={() => setStudentViewingSub(null)} className="p-1 text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Submission Status header */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                <div>
                  <div className="font-black text-slate-800 text-sm">
                    {studentViewingSub.sub.studentName} <span className="font-mono text-slate-500 text-xs">({studentViewingSub.sub.studentId})</span>
                  </div>
                  <div className="text-[11px] text-slate-600">
                    Lớp {studentViewingSub.sub.classId} • Nộp lúc: {studentViewingSub.sub.submittedAt}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    studentViewingSub.sub.status === 'graded' 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : studentViewingSub.sub.status === 'resubmit_required'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-amber-500 text-white shadow-xs'
                  }`}>
                    {studentViewingSub.sub.status === 'graded' 
                      ? `Điểm: ${studentViewingSub.sub.finalScore}/10 (${studentViewingSub.sub.gradeLevel})` 
                      : studentViewingSub.sub.status === 'resubmit_required'
                      ? 'Yêu cầu nộp lại bài'
                      : 'Đã nộp • Chờ cô chấm'}
                  </span>
                </div>
              </div>

              {/* File details */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>Tệp đã nộp: {studentViewingSub.sub.fileName}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Định dạng: {studentViewingSub.sub.fileType} • Dung lượng: {studentViewingSub.sub.fileSize}
                </div>
              </div>

              {/* Automated Technical Verifications */}
              {studentViewingSub.sub.automatedChecks && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
                  <div className="flex justify-between items-center font-bold text-blue-950">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      Kết quả kiểm tra kỹ thuật tự động:
                    </span>
                    <span className="text-blue-700 font-black">
                      {studentViewingSub.sub.automatedChecks.totalAwarded}/{studentViewingSub.sub.automatedChecks.totalPossible} điểm
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 italic">
                    {studentViewingSub.sub.automatedChecks.summary}
                  </p>
                  <div className="space-y-1 pt-1">
                    {studentViewingSub.sub.automatedChecks.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-lg border border-blue-100">
                        <span className="flex items-center gap-1.5">
                          {item.passed ? <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          <span>{item.name}</span>
                        </span>
                        <span className="font-bold text-slate-700 shrink-0">+{item.scoreAwarded}đ</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Comments & Feedback */}
              <div className="p-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 space-y-2">
                <div className="font-bold text-purple-950 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span>Lời nhận xét từ Cô Nguyễn Thị Huệ (GVQL):</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-purple-100 text-xs text-slate-700 leading-relaxed">
                  {studentViewingSub.sub.teacherComment || studentViewingSub.sub.aiSuggestedComment?.combined || (
                    <span className="italic text-slate-400">
                      Bài làm đã nộp thành công và được ghi nhận trên hệ thống. Giáo viên sẽ chấm điểm và nhận xét chi tiết sớm nhất.
                    </span>
                  )}
                </div>

                {studentViewingSub.sub.aiSuggestedComment && (
                  <div className="space-y-1 pt-1 text-[11px] bg-white/70 p-2.5 rounded-lg border border-purple-100">
                    <div><strong className="text-emerald-800">1. Điều làm tốt:</strong> {studentViewingSub.sub.aiSuggestedComment.strengths}</div>
                    <div><strong className="text-amber-800">2. Cần cố gắng:</strong> {studentViewingSub.sub.aiSuggestedComment.needsImprovement}</div>
                    <div><strong className="text-blue-800">3. Gợi ý cụ thể:</strong> {studentViewingSub.sub.aiSuggestedComment.concreteSuggestion}</div>
                  </div>
                )}
              </div>

              {/* History */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lịch sử nộp bài:</span>
                </span>
                <div className="space-y-1">
                  {studentViewingSub.sub.history.map((h, idx) => (
                    <div key={idx} className="text-[11px] text-slate-600 flex justify-between bg-white p-1.5 rounded border border-slate-100">
                      <span><strong>{h.action}</strong>: {h.note}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{h.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              {studentViewingSub.sub.canResubmit ? (
                <button
                  onClick={() => {
                    const assign = studentViewingSub.assignment;
                    setStudentViewingSub(null);
                    handleOpenUploadModal(assign);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Nộp lại bài tập</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setStudentViewingSub(null)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. TEACHER VIEW: CLASS SUBMISSIONS ROSTER */}
      {viewingSubmissionsAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm">Danh sách học sinh nộp bài thực hành</h3>
                <p className="text-xs text-blue-200">{viewingSubmissionsAssignment.title}</p>
              </div>
              <button onClick={() => setViewingSubmissionsAssignment(null)} className="p-1 text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2">Mã HS</th>
                    <th className="p-2">Họ và tên</th>
                    <th className="p-2">Lớp</th>
                    <th className="p-2">Tệp nộp</th>
                    <th className="p-2">Kiểm tra tự động</th>
                    <th className="p-2">Điểm & Mức</th>
                    <th className="p-2">Trạng thái</th>
                    <th className="p-2 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {submissions.filter(s => s.assignmentId === viewingSubmissionsAssignment.id).map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono text-slate-500">{sub.studentId}</td>
                      <td className="p-2 font-bold text-slate-800">{sub.studentName}</td>
                      <td className="p-2 font-semibold text-slate-600">{sub.classId}</td>
                      <td className="p-2">
                        <span className="font-medium text-blue-600 truncate max-w-[150px] block" title={sub.fileName}>
                          {sub.fileName}
                        </span>
                        <span className="text-[10px] text-slate-400">{sub.fileSize}</span>
                      </td>
                      <td className="p-2">
                        {sub.automatedChecks ? (
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            {sub.automatedChecks.totalAwarded}/{sub.automatedChecks.totalPossible}đ kỹ thuật
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">Chưa kiểm tra</span>
                        )}
                      </td>
                      <td className="p-2 font-bold">
                        {sub.finalScore !== null ? (
                          <span className="text-emerald-700">{sub.finalScore}/10 ({sub.gradeLevel || 'Đạt'})</span>
                        ) : (
                          <span className="text-amber-600">Chờ chấm</span>
                        )}
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.status === 'graded' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'resubmit_required' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {sub.status === 'graded' ? 'Đã chấm' : sub.status === 'resubmit_required' ? 'Yêu cầu nộp lại' : 'Chờ giáo viên'}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => setGradingSubmission(sub)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[10px] shadow-xs cursor-pointer"
                        >
                          Chấm bài & AI
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {submissions.filter(s => s.assignmentId === viewingSubmissionsAssignment.id).length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Chưa có bài nộp nào cho bài tập thực hành này.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. TEACHER DETAILED GRADING & GEMINI AI COMMENT ASSISTANT */}
      {gradingSubmission && (() => {
        const targetAssign = assignments.find(a => a.id === gradingSubmission.assignmentId) || assignments[0];

        return (
          <TeacherGradingModal
            submission={gradingSubmission}
            assignment={targetAssign}
            onClose={() => setGradingSubmission(null)}
            onSaveGrade={handleTeacherSaveGrade}
            onGenerateAiFeedback={handleGenerateAiFeedback}
            isAiGenerating={isAiGenerating}
          />
        );
      })()}

      {/* 8. CREATE / EDIT PRACTICE MODAL */}
      {isCreateOpen && (
        <CreatePracticeModal
          initialAssignment={editingAssignment}
          classes={classes}
          onClose={() => {
            setIsCreateOpen(false);
            setEditingAssignment(null);
          }}
          onSave={handleSaveAssignment}
        />
      )}
    </div>
  );
};

// Sub-component: Teacher Detailed Grading & Gemini Feedback Assistant
const TeacherGradingModal: React.FC<{
  submission: PracticeSubmission;
  assignment: PracticeAssignment;
  onClose: () => void;
  onSaveGrade: (
    sub: PracticeSubmission,
    rubricScores: Record<string, number>,
    finalScore: number,
    gradeLevel: 'T' | 'H' | 'C',
    teacherComment: string,
    requireResubmit: boolean,
    aiFeedback?: any
  ) => void;
  onGenerateAiFeedback: (sub: PracticeSubmission, assign: PracticeAssignment) => Promise<any>;
  isAiGenerating: boolean;
}> = ({ submission, assignment, onClose, onSaveGrade, onGenerateAiFeedback, isAiGenerating }) => {
  const [rubricScores, setRubricScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    assignment.rubric.forEach(r => {
      initial[r.id] = submission.rubricScores[r.id] ?? r.maxPoints * 0.9;
    });
    return initial;
  });

  const [teacherComment, setTeacherComment] = useState(submission.teacherComment || '');
  const [gradeLevel, setGradeLevel] = useState<'T' | 'H' | 'C'>(submission.gradeLevel || 'T');
  const [requireResubmit, setRequireResubmit] = useState(submission.status === 'resubmit_required');
  const [aiDraft, setAiDraft] = useState<any>(submission.aiSuggestedComment || null);

  const calculatedTotal = Object.values(rubricScores).reduce((a, b) => a + b, 0);

  const handleRunAi = async () => {
    const feedback = await onGenerateAiFeedback(submission, assignment);
    setAiDraft(feedback);
    setTeacherComment(feedback.combined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-bold text-sm">Chấm bài thực hành & Nhận xét sư phạm</h3>
            <p className="text-xs text-blue-200">
              Học sinh: {submission.studentName} ({submission.studentId} - Lớp {submission.classId})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {/* Submission Info Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
            <div>
              <span className="font-bold text-slate-900 block">{submission.fileName}</span>
              <span className="text-[10px] text-slate-500">Định dạng {submission.fileType} • {submission.fileSize} • Nộp: {submission.submittedAt}</span>
            </div>
            <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
              Bài: {assignment.title}
            </span>
          </div>

          {/* Automated Technical Verifications */}
          {submission.automatedChecks && (
            <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 space-y-2">
              <div className="flex justify-between items-center font-bold text-blue-950">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Kết quả kiểm tra kỹ thuật tự động:
                </span>
                <span className="text-blue-700 font-bold">
                  {submission.automatedChecks.totalAwarded}/{submission.automatedChecks.totalPossible} điểm
                </span>
              </div>
              <p className="text-[11px] text-slate-600 italic">
                {submission.automatedChecks.summary}
              </p>
              <div className="space-y-1 pt-1">
                {submission.automatedChecks.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] bg-white p-1.5 rounded border border-blue-100">
                    <span className="flex items-center gap-1.5">
                      {item.passed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                      <span>{item.name}</span>
                    </span>
                    <span className="font-bold text-slate-700">+{item.scoreAwarded}đ</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rubric Criteria Evaluation */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 block text-xs uppercase tracking-wider">
              Bảng tiêu chí đánh giá (Rubric):
            </span>
            {assignment.rubric.map((r) => (
              <div key={r.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center gap-3">
                <div className="flex-1">
                  <div className="font-bold text-slate-800">{r.name}</div>
                  <div className="text-[10px] text-slate-500">{r.description}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min={0}
                    max={r.maxPoints}
                    step={0.5}
                    value={rubricScores[r.id] ?? 0}
                    onChange={(e) => {
                      setRubricScores({
                        ...rubricScores,
                        [r.id]: Number(e.target.value) || 0,
                      });
                    }}
                    className="w-16 p-1 bg-white border border-slate-300 rounded text-center font-bold text-blue-700 text-xs"
                  />
                  <span className="text-[10px] text-slate-400">/{r.maxPoints}đ</span>
                </div>
              </div>
            ))}
          </div>

          {/* Total score & Level (Thông tư 27) */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-emerald-950 block">Tổng điểm thực hành:</span>
              <span className="text-xl font-black text-emerald-700">{calculatedTotal.toFixed(1)} / {assignment.maxPoints} điểm</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Mức đánh giá (TT 27):</span>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value as any)}
                className="p-1.5 bg-white border border-emerald-300 rounded font-bold text-xs text-emerald-800 outline-none"
              >
                <option value="T">T - Hoàn thành Tốt</option>
                <option value="H">H - Hoàn thành</option>
                <option value="C">C - Chưa hoàn thành</option>
              </select>
            </div>
          </div>

          {/* GEMINI AI ASSISTANT: 3-Part Feedback Generator */}
          <div className="p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Trợ lý nhận xét Gemini AI (Khích lệ tiểu học):
              </span>
              <button
                type="button"
                onClick={handleRunAi}
                disabled={isAiGenerating}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isAiGenerating ? 'animate-spin' : ''}`} />
                <span>{isAiGenerating ? 'Đang tạo...' : 'Gợi ý nhận xét AI'}</span>
              </button>
            </div>

            {aiDraft && (
              <div className="space-y-1.5 pt-1 text-[11px] bg-white p-2.5 rounded-lg border border-indigo-100">
                <div><strong>1. Điểm làm tốt:</strong> <span className="text-emerald-700">{aiDraft.strengths}</span></div>
                <div><strong>2. Cần cố gắng:</strong> <span className="text-amber-700">{aiDraft.needsImprovement}</span></div>
                <div><strong>3. Gợi ý cụ thể:</strong> <span className="text-blue-700">{aiDraft.concreteSuggestion}</span></div>
              </div>
            )}
          </div>

          {/* Teacher Final Comment & Resubmit Checkbox */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">Lời nhận xét chính thức của giáo viên:</label>
            <textarea
              rows={3}
              value={teacherComment}
              onChange={(e) => setTeacherComment(e.target.value)}
              placeholder="Giáo viên xem xét, chỉnh sửa và phê duyệt nhận xét gửi tới học sinh..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs"
            />
          </div>

          <label className="flex items-center gap-2 text-rose-700 font-bold cursor-pointer">
            <input
              type="checkbox"
              checked={requireResubmit}
              onChange={(e) => setRequireResubmit(e.target.checked)}
              className="w-4 h-4 text-rose-600 rounded"
            />
            <span>Yêu cầu học sinh nộp lại bài thực hành (cho phép sửa lỗi)</span>
          </label>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer">
            Đóng
          </button>
          <button
            onClick={() => onSaveGrade(
              submission,
              rubricScores,
              calculatedTotal,
              gradeLevel,
              teacherComment,
              requireResubmit,
              aiDraft
            )}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            Lưu & Phê duyệt kết quả
          </button>
        </div>
      </div>
    </div>
  );
};

// Sub-component: Create Practice Assignment
const CreatePracticeModal: React.FC<{
  initialAssignment: PracticeAssignment | null;
  classes: ClassInfo[];
  onClose: () => void;
  onSave: (assign: PracticeAssignment) => void;
}> = ({ initialAssignment, classes, onClose, onSave }) => {
  const [title, setTitle] = useState(initialAssignment?.title || '');
  const [grade, setGrade] = useState<3 | 4 | 5>(initialAssignment?.grade || 4);
  const [targetClassIds, setTargetClassIds] = useState<string[]>(initialAssignment?.targetClassIds || ['4/3', '4/4']);
  const [objectives, setObjectives] = useState(initialAssignment?.objectives || '');
  const [instructions, setInstructions] = useState(initialAssignment?.instructions || '');
  const [deadline, setDeadline] = useState(initialAssignment?.deadline || '2026-10-31');
  const [allowedTypes, setAllowedTypes] = useState<('DOCX' | 'PPTX' | 'PDF' | 'IMAGE')[]>(initialAssignment?.allowedFileTypes || ['DOCX', 'PDF']);

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài tập thực hành!');
      return;
    }

    const newAssign: PracticeAssignment = {
      id: initialAssignment?.id || `prac_${Date.now()}`,
      title,
      grade,
      targetClassIds,
      objectives,
      instructions,
      allowedFileTypes: allowedTypes,
      maxPoints: 10,
      deadline,
      sampleAttachmentName: 'HuongDanThucHanh_DongDuong.docx',
      status: 'published',
      createdBy: 'Giáo viên Tin học',
      createdAt: initialAssignment?.createdAt || new Date().toISOString().split('T')[0],
      rubric: [
        { id: 'r1', name: 'Định dạng văn bản & Tiêu đề', maxPoints: 3, description: 'Phông chữ, cỡ chữ chuẩn và căn lề ngay ngắn.' },
        { id: 'r2', name: 'Nội dung thực hành & Kỹ thuật máy tính', maxPoints: 4, description: 'Đạt đầy đủ các yêu cầu thao tác phần mềm.' },
        { id: 'r3', name: 'Trình bày thẩm mỹ & Quy cách tệp', maxPoints: 3, description: 'Đặt tên tệp đúng quy định và bố cục hài hòa.' },
      ],
    };

    onSave(newAssign);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-sm">
            {initialAssignment ? 'Chỉnh sửa bài tập thực hành' : 'Giao bài tập thực hành mới'}
          </h3>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Tên bài thực hành:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Thực hành Word: Soạn thảo và Chèn hình ảnh..."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-semibold text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Khối lớp:</label>
              <select
                value={grade}
                onChange={(e) => {
                  const g = Number(e.target.value) as 3 | 4 | 5;
                  setGrade(g);
                  setTargetClassIds(classes.filter(c => c.grade === g).map(c => c.id));
                }}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs font-bold text-blue-700"
              >
                <option value={3}>Khối 3 (Lớp 3/4, 3/5, 3/6)</option>
                <option value={4}>Khối 4 (Lớp 4/3, 4/4, 4/5)</option>
                <option value={5}>Khối 5 (Lớp 5/4, 5/5, 5/6)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Thời hạn nộp bài:</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs"
              />
            </div>
          </div>

          {/* Class selection per grade */}
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
                  className="text-[10px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                >
                  ✓ Chọn tất cả Khối {grade}
                </button>
                <button
                  type="button"
                  onClick={() => setTargetClassIds([])}
                  className="text-[10px] font-semibold text-slate-500 hover:text-rose-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                >
                  ✕ Bỏ chọn
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              {classes.filter(c => c.grade === grade).map(c => {
                const isSelected = targetClassIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setTargetClassIds(targetClassIds.filter(id => id !== c.id));
                      } else {
                        setTargetClassIds([...targetClassIds, c.id]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'
                    }`}
                  >
                    <span>{isSelected ? '✓' : '+'}</span>
                    <span>{c.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      ({c.totalStudents} HS)
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 mt-1 italic">
              * Hệ thống chỉ hiển thị đúng các lớp thuộc Khối {grade} của trường ({grade === 3 ? 'Lớp 3/4, 3/5, 3/6' : grade === 4 ? 'Lớp 4/3, 4/4, 4/5' : 'Lớp 5/4, 5/5, 5/6'}).
            </p>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Mục tiêu bài thực hành:</label>
            <input
              type="text"
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              placeholder="VD: Rèn kỹ năng gõ tiếng Việt có dấu và chèn ảnh minh họa..."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Hướng dẫn chi tiết từng bước:</label>
            <textarea
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="1. Khởi động phần mềm...&#10;2. Nhập văn bản...&#10;3. Lưu tệp..."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            Lưu & Giao bài
          </button>
        </div>
      </div>
    </div>
  );
};
