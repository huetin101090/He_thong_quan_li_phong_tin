/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ClassInfo, 
  Student, 
  ClassAssignments, 
  DatabaseStatus,
  AttendanceRecord
} from './types/classroom';
import { 
  UserSession 
} from './types/assignments';
import { 
  CLASSES_DATA, 
  INITIAL_STUDENTS, 
  TOTAL_COMPUTERS, 
  TOTAL_STUDENTS, 
  TOTAL_CLASSES,
  SCHOOL_NAME,
  APP_NAME,
  isSameClass,
  ClassSubjectFolder,
  ALL_18_CLASS_FOLDERS
} from './data/initialData';
import { 
  getStoredStudents, 
  saveStoredStudents, 
  loadClassAssignment, 
  saveClassAssignment, 
  autoAssignStudents, 
  getDatabaseDiagnosticStatus, 
  seedDefaultAssignmentsIfEmpty,
  checkStorageHealth,
  getBrokenComputers,
  toggleComputerBroken,
  reassignDisplacedStudentsFromBrokenComputers,
  fetchStudentsFromServer
} from './services/storageService';
import { getTeacherToken, setTeacherToken } from './services/studentAccountService';
import { fetchStudentsAndClassesFromSupabase } from './services/supabaseDataService';
import { fetchAttendanceRecords } from './services/attendanceService';
import { LearningMaterial } from './data/learningMaterials';

import { HeroBanner } from './components/HeroBanner';
import { HorizontalNavbar, ActiveViewTab } from './components/HorizontalNavbar';
import { VerticalMenu } from './components/VerticalMenu';
import { MaterialsSection } from './components/MaterialsSection';
import { MaterialPreviewModal } from './components/MaterialPreviewModal';
import { StatsOverview } from './components/StatsOverview';
import { ComputerGrid } from './components/ComputerGrid';
import { StudentSidebar } from './components/StudentSidebar';
import { AutoAssignModal } from './components/AutoAssignModal';
import { DataIntegrityModal } from './components/DataIntegrityModal';
import { PrintView } from './components/PrintView';
import { ClassAttendanceTable } from './components/ClassAttendanceTable';
import { StudentLoginModal } from './components/StudentLoginModal';
import { ClassFoldersModal } from './components/ClassFoldersModal';
import { StudentPortalView } from './components/StudentPortalView';
import { AssignExerciseModal } from './components/AssignExerciseModal';
import { TeacherLoginModal } from './components/TeacherLoginModal';

// New Advanced Modules for Assignment, Grading, Evaluation & AI Feedback
import { UserRoleBar } from './components/UserRoleBar';
import { TheoryQuizManager } from './components/TheoryQuizManager';
import { PracticeAssignmentManager } from './components/PracticeAssignmentManager';
import { ExternalLinksManager } from './components/ExternalLinksManager';
import { MonthlyEvaluationManager } from './components/MonthlyEvaluationManager';
import { SemesterEvaluationManager } from './components/SemesterEvaluationManager';
import { UnifiedEvaluationManager } from './components/UnifiedEvaluationManager';
import { SecurityAndAccountsModal } from './components/SecurityAndAccountsModal';
import { WorkstationManagerModal } from './components/WorkstationManagerModal';

// Components for exact layout match with image.png
import { LearningPhotosManager } from './components/LearningPhotosManager';
import { ParentContactView } from './components/ParentContactView';
import { DiscussionForumView } from './components/DiscussionForumView';
import { StudentRosterView } from './components/StudentRosterView';
import { StudentAccountsManager } from './components/StudentAccountsManager';

import { 
  Monitor, 
  Users, 
  X, 
  CheckCircle, 
  Sparkles,
  BookOpen,
  ArrowRight,
  Search,
  ClipboardCheck,
  FileSpreadsheet,
  AlertTriangle,
  Printer,
  RotateCcw,
  Wrench,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  // Master state
  const [students, setStudents] = useState<Student[]>(() => getStoredStudents());
  const [selectedClassId, setSelectedClassId] = useState<string>('5.4'); // Default 5.4
  
  // User Session: Default to 'guest' (Viewer mode) unless verified teacher token exists
  const [session, setSession] = useState<UserSession>(() => {
    const token = getTeacherToken();
    if (token) {
      return {
        role: 'teacher',
        teacherName: 'Cô Nguyễn Thị Huệ (GV Phụ trách Bộ môn Tin học)',
        isTeacherAuthenticated: true,
      };
    }
    return {
      role: 'guest',
      teacherName: 'Khách xem học liệu (Chế độ xem)',
      isTeacherAuthenticated: false,
    };
  });

  const [isTeacherLoginOpen, setIsTeacherLoginOpen] = useState(false);
  const [defaultAdminMode, setDefaultAdminMode] = useState(false);

  // Global active subject: strictly 'tin' (Môn Tin học)
  const [currentSubject, setCurrentSubject] = useState<'all' | 'tin' | 'congnghe'>('tin');
  const [is18FoldersModalOpen, setIs18FoldersModalOpen] = useState<boolean>(false);

  // Student workstation identity & login state
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState(false);
  const [isWorkstationModalOpen, setIsWorkstationModalOpen] = useState(false);
  const [currentPcId, setCurrentPcId] = useState<number>(1);
  const [lastCheckInStatus, setLastCheckInStatus] = useState<{ isCorrectPc: boolean; actualPc: number; assignedPc: number | null } | null>(null);

  // View mode tab: 'materials' (default matching screenshot), 'students', 'computers', 'theory', 'products', 'photos', 'parents', 'discussion'
  const [activeTab, setActiveTab] = useState<ActiveViewTab>('materials');

  // Sub-view toggle for 'computers' tab: 'grid' (20 máy tính) vs 'attendance' (Bảng điểm danh)
  const [computersSubView, setComputersSubView] = useState<'grid' | 'attendance'>('grid');

  // Broken computers tracking (PC01 - PC20)
  const [brokenComputers, setBrokenComputers] = useState<number[]>(() => getBrokenComputers());

  // Real attendance records cache
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  // Search & Filter state for learning materials
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<'all' | 3 | 4 | 5>(5);
  const [previewMaterial, setPreviewMaterial] = useState<LearningMaterial | null>(null);

  // Date & Period state (Today's date in YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [currentDate, setCurrentDate] = useState<string>(todayStr);
  const [daySession, setDaySession] = useState<'morning' | 'afternoon'>('morning');
  const [periodNumber, setPeriodNumber] = useState<number>(2);
  const [lessonName, setLessonName] = useState<string>('Tiết thực hành Lập trình Scratch 3.0');

  // Active assignment state for the selected class & period
  const [assignments, setAssignments] = useState<ClassAssignments>(() => {
    return loadClassAssignment('5.4', todayStr, 'morning', 2).assignments;
  });

  // UI state
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedText, setLastSavedText] = useState<string>('Đã đồng bộ');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals state
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isClassRosterDrawerOpen, setIsClassRosterDrawerOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isGlobalAssignModalOpen, setIsGlobalAssignModalOpen] = useState(false);
  // Database diagnostic status
  const [dbStatus, setDbStatus] = useState<DatabaseStatus>(() => getDatabaseDiagnosticStatus());

  // Supabase Database Connection State (Chỉ đọc - Read-Only)
  const [supabaseStatus, setSupabaseStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [supabaseMetadata, setSupabaseMetadata] = useState<{
    totalFromDb: number;
    authenticCount: number;
    excludedMockCount: number;
    classesCount: number;
  } | null>(null);

  // Show Toast helper
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Đọc dữ liệu thật từ Supabase: public.students và public.classes
  const loadSupabaseData = useCallback(async () => {
    setSupabaseStatus('loading');
    setSupabaseError(null);
    try {
      const result = await fetchStudentsAndClassesFromSupabase();
      if (result.success && result.students.length > 0) {
        setStudents(result.students);
        setSupabaseStatus('connected');
        setSupabaseMetadata({
          totalFromDb: result.totalFromDb,
          authenticCount: result.authenticCount,
          excludedMockCount: result.excludedMockCount,
          classesCount: result.classesCount,
        });
      } else {
        // Nếu kết nối trực tiếp thất bại, bảo toàn 249 học sinh chính thức từ bộ nhớ chuẩn, không để danh sách rỗng (0 học sinh)
        setSupabaseStatus('error');
        const errMsg = result.error || 'Không thể đọc dữ liệu học sinh trực tiếp từ Supabase.';
        setSupabaseError(errMsg);
        setStudents(result.students && result.students.length > 0 ? result.students : INITIAL_STUDENTS);
        showToast(`Thông báo kết nối: ${errMsg}`, 'error');
      }
    } catch (err: any) {
      setSupabaseStatus('error');
      const errMsg = err?.message || 'Lỗi ngoại lệ khi kết nối Supabase';
      setSupabaseError(errMsg);
      setStudents(INITIAL_STUDENTS);
      showToast(`Lỗi kết nối Supabase: ${errMsg}`, 'error');
    }
  }, [showToast]);

  // Khởi tạo và nạp dữ liệu thật 249 học sinh từ Supabase
  useEffect(() => {
    seedDefaultAssignmentsIfEmpty(todayStr);
    setDbStatus(getDatabaseDiagnosticStatus());
    loadSupabaseData();
  }, [todayStr, loadSupabaseData]);

  // Current class info
  const currentClass: ClassInfo = useMemo(() => {
    return CLASSES_DATA.find(c => isSameClass(c.id, selectedClassId)) || CLASSES_DATA[0];
  }, [selectedClassId]);

  // All students belonging to the current class
  const classStudents = useMemo(() => {
    return students.filter(s => isSameClass(s.classId, selectedClassId));
  }, [students, selectedClassId]);

  // Map of studentId -> Student for fast lookup
  const studentMap = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach(s => map.set(s.id, s));
    return map;
  }, [students]);

  // Map of studentId -> AttendanceRecord
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach(r => {
      if (r.studentId) map.set(r.studentId, r);
      if (r.studentCode) map.set(r.studentCode, r);
    });
    return map;
  }, [attendanceRecords]);

  // Refresh attendance records from server / localStorage
  const refreshAttendance = useCallback(async () => {
    try {
      const data = await fetchAttendanceRecords(selectedClassId, currentDate, daySession, periodNumber, classStudents);
      setAttendanceRecords(data.records);
    } catch (e) {
      console.warn('Could not refresh attendance in App.tsx', e);
    }
  }, [selectedClassId, currentDate, daySession, periodNumber, classStudents]);

  // Load assignments & attendance when class, date, session, or period changes
  useEffect(() => {
    const result = loadClassAssignment(selectedClassId, currentDate, daySession, periodNumber);
    setAssignments(result.assignments);
    if (result.lessonName) {
      setLessonName(result.lessonName);
    }
    setIsSaved(result.isPersisted);
    setLastSavedText(result.updatedAt ? `Đã lưu (${result.updatedAt})` : 'Chưa lưu');
    setSelectedStudentId(null);
    refreshAttendance();
  }, [selectedClassId, currentDate, daySession, periodNumber, refreshAttendance]);

  // Toggle broken computer status (PC01 - PC20)
  const handleToggleBrokenComputer = (compId: number) => {
    const updated = toggleComputerBroken(compId);
    setBrokenComputers([...updated]);
    showToast(
      updated.includes(compId)
        ? `Đã đánh dấu Máy PC${compId < 10 ? '0' + compId : compId} bị hỏng/bảo trì.`
        : `Đã khôi phục Máy PC${compId < 10 ? '0' + compId : compId} hoạt động bình thường.`,
      updated.includes(compId) ? 'info' : 'success'
    );
  };

  // Smart Reassignment for students on broken computers
  const handleReassignBroken = () => {
    const result = reassignDisplacedStudentsFromBrokenComputers(assignments, brokenComputers, classStudents);
    if (result.newAssignments) {
      setAssignments(result.newAssignments);
      saveClassAssignment(selectedClassId, currentDate, daySession, periodNumber, result.newAssignments, lessonName);
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.message, 'error');
      }
    }
  };

  // Student login & check-in callback
  const handleStudentLoginSuccess = (newSession: UserSession, pcId: number, checkInResult: any) => {
    setSession(newSession);
    setCurrentPcId(pcId);
    if (newSession.classId) {
      setSelectedClassId(newSession.classId);
    }
    setLastCheckInStatus({
      isCorrectPc: checkInResult.isCorrectPc,
      actualPc: pcId,
      assignedPc: checkInResult.assignedPc,
    });
    refreshAttendance();
    showToast(
      checkInResult.isCorrectPc
        ? `Đăng nhập thành công! Em ${newSession.studentName} đã điểm danh đúng Máy PC${pcId < 10 ? '0' + pcId : pcId} (Chờ GV xác nhận).`
        : `⚠️ Cảnh báo: Em ${newSession.studentName} được phân công Máy PC${checkInResult.assignedPc ? (checkInResult.assignedPc < 10 ? '0' + checkInResult.assignedPc : checkInResult.assignedPc) : 'khác'} nhưng đang ngồi Máy PC${pcId < 10 ? '0' + pcId : pcId}. Đã gửi thông báo tới Giáo viên!`,
      checkInResult.isCorrectPc ? 'success' : 'info'
    );
  };

  // Calculate seating metrics for the current class
  const { assignedCount, unassignedCount, singleStudentComputers, doubleStudentComputers, emptyComputers } = useMemo(() => {
    let single = 0;
    let double = 0;
    let empty = 0;
    const assignedIds = new Set<string>();

    for (let i = 1; i <= TOTAL_COMPUTERS; i++) {
      const slot = assignments[i];
      const hasA = !!slot?.studentAId;
      const hasB = !!slot?.studentBId;

      if (hasA) assignedIds.add(slot.studentAId!);
      if (hasB) assignedIds.add(slot.studentBId!);

      if (hasA && hasB) {
        double++;
      } else if (hasA || hasB) {
        single++;
      } else {
        empty++;
      }
    }

    const assigned = assignedIds.size;
    const unassigned = Math.max(0, classStudents.length - assigned);

    return {
      assignedCount: assigned,
      unassignedCount: unassigned,
      singleStudentComputers: single,
      doubleStudentComputers: double,
      emptyComputers: empty,
    };
  }, [assignments, classStudents]);

  // Save current assignment
  const handleSaveAssignment = useCallback(() => {
    setIsSaving(true);
    const result = saveClassAssignment(
      selectedClassId,
      currentDate,
      daySession,
      periodNumber,
      assignments,
      lessonName
    );

    setIsSaving(false);
    if (result.success) {
      setIsSaved(true);
      setLastSavedText(new Date().toLocaleTimeString('vi-VN'));
      setDbStatus(getDatabaseDiagnosticStatus());
      showToast(result.message, 'success');
    } else {
      showToast(result.message, 'error');
    }
  }, [selectedClassId, currentDate, daySession, periodNumber, assignments, lessonName, showToast]);

  // Auto-assign action
  const handleApplyAutoAssign = (strategy: 'standard' | 'gender_balanced' | 'random') => {
    const newAssignments = autoAssignStudents(classStudents, strategy);
    setAssignments(newAssignments);
    setIsSaved(false);

    // Save immediately so state is kept
    const saveResult = saveClassAssignment(
      selectedClassId,
      currentDate,
      daySession,
      periodNumber,
      newAssignments,
      lessonName
    );

    if (saveResult.success) {
      setIsSaved(true);
      setLastSavedText(new Date().toLocaleTimeString('vi-VN'));
      setDbStatus(getDatabaseDiagnosticStatus());
      showToast(`Đã tự động phân công thành công cho Lớp ${selectedClassId}!`, 'success');
    }
  };

  // Click on a computer slot or student chip (smart move & swap)
  const handleSlotClick = (computerId: number, slot: 'A' | 'B') => {
    if (computerId === 0) {
      setSelectedStudentId(null);
      return;
    }

    // Check if target machine is marked broken
    if (brokenComputers.includes(computerId)) {
      showToast(`Máy tính PC${computerId < 10 ? '0' + computerId : computerId} đang báo hỏng/bảo trì. Vui lòng chọn máy hoạt động!`, 'error');
      return;
    }

    const targetSlot = assignments[computerId] || { studentAId: null, studentBId: null };
    const targetOccupantId = slot === 'A' ? targetSlot.studentAId : targetSlot.studentBId;

    // Case 1: No student currently selected
    if (!selectedStudentId) {
      if (targetOccupantId) {
        setSelectedStudentId(targetOccupantId);
        const st = studentMap.get(targetOccupantId);
        showToast(`Đã chọn em ${st?.name} (Máy PC${computerId < 10 ? '0' + computerId : computerId} - Chỗ ${slot}). Nhấp vào máy khác để chuyển chỗ hoặc hoán đổi!`, 'info');
      }
      return;
    }

    // Case 2: Student is currently selected
    // 2a. Clicked on the same student -> unselect
    if (selectedStudentId === targetOccupantId) {
      setSelectedStudentId(null);
      showToast('Đã hủy chọn học sinh.', 'info');
      return;
    }

    // Find current seat of selectedStudentId (if any)
    let sourceComp: number | null = null;
    let sourceSlot: 'A' | 'B' | null = null;
    for (let c = 1; c <= TOTAL_COMPUTERS; c++) {
      if (assignments[c]?.studentAId === selectedStudentId) {
        sourceComp = c;
        sourceSlot = 'A';
        break;
      }
      if (assignments[c]?.studentBId === selectedStudentId) {
        sourceComp = c;
        sourceSlot = 'B';
        break;
      }
    }

    const newAssignments: ClassAssignments = JSON.parse(JSON.stringify(assignments));

    // 2b. Target slot is occupied by student B -> SWAP positions!
    if (targetOccupantId && sourceComp !== null && sourceSlot !== null) {
      newAssignments[sourceComp] = {
        ...newAssignments[sourceComp],
        [sourceSlot === 'A' ? 'studentAId' : 'studentBId']: targetOccupantId,
      };
      newAssignments[computerId] = {
        ...newAssignments[computerId],
        [slot === 'A' ? 'studentAId' : 'studentBId']: selectedStudentId,
      };

      setAssignments(newAssignments);
      setSelectedStudentId(null);
      setIsSaved(false);
      saveClassAssignment(selectedClassId, currentDate, daySession, periodNumber, newAssignments, lessonName);

      const stA = studentMap.get(selectedStudentId);
      const stB = studentMap.get(targetOccupantId);
      showToast(`Đã hoán đổi vị trí giữa em ${stA?.name} và em ${stB?.name}!`, 'success');
      return;
    }

    // 2c. Target slot is empty or selected student had no source seat -> MOVE
    if (sourceComp !== null && sourceSlot !== null) {
      newAssignments[sourceComp] = {
        ...newAssignments[sourceComp],
        [sourceSlot === 'A' ? 'studentAId' : 'studentBId']: null,
      };
    }
    const targetCompData = newAssignments[computerId] || { studentAId: null, studentBId: null };
    newAssignments[computerId] = {
      ...targetCompData,
      [slot === 'A' ? 'studentAId' : 'studentBId']: selectedStudentId,
    };

    setAssignments(newAssignments);
    setSelectedStudentId(null);
    setIsSaved(false);
    saveClassAssignment(selectedClassId, currentDate, daySession, periodNumber, newAssignments, lessonName);

    const st = studentMap.get(selectedStudentId);
    showToast(`Đã xếp em ${st?.name} vào Máy PC${computerId < 10 ? '0' + computerId : computerId} (Chỗ ${slot})`, 'success');
  };

  // Remove student from slot
  const handleRemoveStudent = (computerId: number, slot: 'A' | 'B') => {
    const newAssignments: ClassAssignments = { ...assignments };
    const current = newAssignments[computerId];
    if (!current) return;

    const removedStudentId = slot === 'A' ? current.studentAId : current.studentBId;
    if (slot === 'A') {
      newAssignments[computerId] = { ...current, studentAId: null };
    } else {
      newAssignments[computerId] = { ...current, studentBId: null };
    }

    setAssignments(newAssignments);
    setIsSaved(false);
    saveClassAssignment(selectedClassId, currentDate, daySession, periodNumber, newAssignments, lessonName);

    if (removedStudentId) {
      const student = studentMap.get(removedStudentId);
      showToast(`Đã đưa ${student?.name} về danh sách chờ.`, 'info');
    }
  };

  // Quick assign next available slot
  const handleQuickAssignNext = (studentId: string) => {
    const newAssignments: ClassAssignments = { ...assignments };

    let assignedComp: number | null = null;
    let assignedSlot: 'A' | 'B' | null = null;

    for (let c = 1; c <= TOTAL_COMPUTERS; c++) {
      const current = newAssignments[c] || { studentAId: null, studentBId: null };
      if (!current.studentAId) {
        assignedComp = c;
        assignedSlot = 'A';
        break;
      }
    }

    if (!assignedComp) {
      for (let c = 1; c <= TOTAL_COMPUTERS; c++) {
        const current = newAssignments[c] || { studentAId: null, studentBId: null };
        if (!current.studentBId) {
          assignedComp = c;
          assignedSlot = 'B';
          break;
        }
      }
    }

    if (assignedComp && assignedSlot) {
      const target = newAssignments[assignedComp] || { studentAId: null, studentBId: null };
      if (assignedSlot === 'A') {
        newAssignments[assignedComp] = { ...target, studentAId: studentId };
      } else {
        newAssignments[assignedComp] = { ...target, studentBId: studentId };
      }

      setAssignments(newAssignments);
      setIsSaved(false);
      saveClassAssignment(selectedClassId, currentDate, daySession, periodNumber, newAssignments, lessonName);
      const student = studentMap.get(studentId);
      showToast(`Đã xếp nhanh ${student?.name} vào Máy ${assignedComp} (Chỗ ${assignedSlot})`, 'success');
    } else {
      showToast('Phòng máy đã đầy 40/40 chỗ ngồi!', 'error');
    }
  };

  // Unassign student
  const handleUnassignStudent = (studentId: string) => {
    const newAssignments: ClassAssignments = { ...assignments };
    let found = false;

    for (let c = 1; c <= TOTAL_COMPUTERS; c++) {
      if (!newAssignments[c]) continue;
      if (newAssignments[c].studentAId === studentId) {
        newAssignments[c] = { ...newAssignments[c], studentAId: null };
        found = true;
      }
      if (newAssignments[c].studentBId === studentId) {
        newAssignments[c] = { ...newAssignments[c], studentBId: null };
        found = true;
      }
    }

    if (found) {
      setAssignments(newAssignments);
      setIsSaved(false);
      saveClassAssignment(selectedClassId, currentDate, daySession, periodNumber, newAssignments, lessonName);
      const student = studentMap.get(studentId);
      showToast(`Đã hủy chỗ ngồi của ${student?.name}`, 'info');
    }
  };

  // Toggle student attendance
  const handleToggleAttendance = (studentId: string) => {
    const updated = students.map(s => {
      if (s.id === studentId) {
        const newStatus = s.attendance === 'absent' ? 'present' : 'absent';
        return { ...s, attendance: newStatus as any };
      }
      return s;
    });

    setStudents(updated);
    saveStoredStudents(updated);

    const target = updated.find(s => s.id === studentId);
    if (target?.attendance === 'absent') {
      handleUnassignStudent(studentId);
      showToast(`Đã đánh dấu vắng mặt cho ${target.name}.`, 'info');
    } else {
      showToast(`Đã đánh dấu có mặt cho ${target?.name}.`, 'success');
    }
  };

  // Update students roster (supports additions, bulk deletions, single deletion, and Excel imports)
  const handleUpdateStudents = useCallback((newStudents: Student[]) => {
    setStudents(newStudents);
    saveStoredStudents(newStudents);

    // Unassign deleted students from current assignments if any
    const remainingStudentIds = new Set(newStudents.map(s => s.id));
    let hasAssignmentChanges = false;
    const updatedAssignments: ClassAssignments = { ...assignments };

    for (let c = 1; c <= TOTAL_COMPUTERS; c++) {
      if (!updatedAssignments[c]) continue;
      if (updatedAssignments[c].studentAId && !remainingStudentIds.has(updatedAssignments[c].studentAId!)) {
        updatedAssignments[c] = { ...updatedAssignments[c], studentAId: null };
        hasAssignmentChanges = true;
      }
      if (updatedAssignments[c].studentBId && !remainingStudentIds.has(updatedAssignments[c].studentBId!)) {
        updatedAssignments[c] = { ...updatedAssignments[c], studentBId: null };
        hasAssignmentChanges = true;
      }
    }

    if (hasAssignmentChanges) {
      setAssignments(updatedAssignments);
      saveClassAssignment(selectedClassId, currentDate, daySession, periodNumber, updatedAssignments, lessonName);
    }
  }, [assignments, selectedClassId, currentDate, daySession, periodNumber, lessonName]);

  // Material Actions
  const handleQuickDownload = (material: LearningMaterial) => {
    showToast(`Đang tải về: ${material.title} (${material.size})`, 'success');
  };

  const handleDeployToComputers = (material: LearningMaterial) => {
    setLessonName(`Thực hành: ${material.title}`);
    showToast(`Đã đồng bộ bài thực hành "${material.title}" tới 20 máy tính lớp ${selectedClassId}!`, 'success');
    if (previewMaterial) setPreviewMaterial(null);
  };

  // Export JSON backup
  const handleExportJson = () => {
    const records = localStorage.getItem('smart_ict_assignments_v1') || '{}';
    const studentsData = localStorage.getItem('smart_ict_students_v1') || '[]';
    const blob = new Blob(
      [JSON.stringify({ 
        school: SCHOOL_NAME, 
        appName: APP_NAME,
        classesCount: TOTAL_CLASSES,
        studentsCount: TOTAL_STUDENTS,
        exportedAt: new Date().toISOString(),
        assignments: JSON.parse(records),
        students: JSON.parse(studentsData)
      }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DongDuong_PhongTinHoc_SaoLuu_${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file sao lưu JSON an toàn!', 'success');
  };

  // Reload page test
  const handleReloadCheck = () => {
    if (window.confirm('Hệ thống sẽ tải lại trang ngay bây giờ để kiểm chứng dữ liệu 9 lớp, 249 học sinh và các phân công đã lưu vẫn được giữ nguyên vẹn. Tiếp tục?')) {
      window.location.reload();
    }
  };

  // Student portal handlers
  const handleStudentLogout = useCallback(() => {
    setSession({
      role: 'guest',
      teacherName: 'Khách xem học liệu (Chế độ xem)',
      isTeacherAuthenticated: false,
    });
    setLastCheckInStatus(null);
    showToast('Đã đăng xuất khỏi Cổng Học Sinh.', 'info');
  }, [showToast]);

  const handleOpenTeacherLoginModal = useCallback((defaultAdmin = false) => {
    setDefaultAdminMode(defaultAdmin);
    setIsTeacherLoginOpen(true);
  }, []);

  const handleTeacherLoginSuccess = useCallback((teacherInfo: { name: string; role: 'teacher' }) => {
    setSession({
      role: 'teacher',
      teacherName: teacherInfo.name,
      isTeacherAuthenticated: true,
    });
    showToast(`Đăng nhập thành công! Chào mừng ${teacherInfo.name} vào hệ thống Quản lý.`, 'success');
  }, [showToast]);

  const handleTeacherLogout = useCallback(() => {
    setTeacherToken(null);
    setSession({
      role: 'guest',
      teacherName: 'Khách xem học liệu (Chế độ xem)',
      isTeacherAuthenticated: false,
    });
    showToast('Đã đăng xuất khỏi tài khoản Giáo viên. Bạn đang ở Chế độ xem an toàn.', 'info');
  }, [showToast]);

  const handleSwitchToTeacher = useCallback(async (adminKey: string) => {
    try {
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSession({
          role: 'teacher',
          teacherName: data.teacherName || 'Cô Nguyễn Thị Huệ (GV Phụ trách Bộ môn Tin học)',
        });
        showToast('Xác thực giáo viên thành công! Chuyển về Giao diện Quản lý.', 'success');
        return { success: true };
      } else {
        return { success: false, error: data.error || 'Mật khẩu Giáo viên không chính xác!' };
      }
    } catch (err: any) {
      return { success: false, error: err?.message || 'Lỗi kết nối khi xác thực giáo viên!' };
    }
  }, [showToast]);

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col font-sans p-3 sm:p-5">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce-subtle">
          <div className={`px-4 py-2.5 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-600 text-white border-emerald-700' 
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Dedicated Student Portal vs Teacher Dashboard */}
      {session.role === 'student' ? (
        <StudentPortalView
          session={session}
          students={students}
          classes={CLASSES_DATA}
          currentPcId={currentPcId}
          onLogout={handleStudentLogout}
          onSwitchToTeacher={handleSwitchToTeacher}
        />
      ) : (
        <div className="max-w-7xl w-full mx-auto space-y-3">
        
        {/* User Role Bar: Teacher vs Student switch */}
        <UserRoleBar
          session={session}
          onSwitchSession={setSession}
          students={students}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          onOpenStudentLoginModal={() => setIsStudentLoginOpen(true)}
          onOpenStudentAccounts={() => setActiveTab('accounts')}
          onOpenTeacherLoginModal={() => handleOpenTeacherLoginModal(false)}
          onLogoutTeacher={handleTeacherLogout}
          currentPcId={currentPcId}
          lastCheckInStatus={lastCheckInStatus}
        />

        {/* 1. TOP SECTION: Hero banner (matching image.png) */}
        <HeroBanner
          dbStatus={dbStatus}
          currentClassName={currentClass.name}
          currentClassId={selectedClassId}
          onSelectClass={(newClassId) => setSelectedClassId(newClassId)}
          selectedGrade={selectedGradeFilter === 'all' ? 5 : selectedGradeFilter}
          onSelectGrade={(grade) => {
            setSelectedGradeFilter(grade);
            const firstOfGrade = CLASSES_DATA.find(c => c.grade === grade);
            if (firstOfGrade) setSelectedClassId(firstOfGrade.id);
          }}
          selectedSubject={currentSubject}
          onSelectSubject={setCurrentSubject}
          onOpen18FoldersModal={() => setIs18FoldersModalOpen(true)}
          session={session}
          onSwitchSession={setSession}
          onExploreClick={() => setActiveTab('materials')}
          onOpenDiagnostic={() => setIsDiagnosticOpen(true)}
          onOpenComputers={() => setActiveTab('computers')}
          onOpenStudentLoginModal={(targetClassId) => {
            if (targetClassId) {
              setSelectedClassId(targetClassId);
            }
            setIsStudentLoginOpen(true);
          }}
          onOpenTeacherLoginModal={handleOpenTeacherLoginModal}
          periodNumber={periodNumber}
          daySession={daySession}
        />

        {/* 2. NAVBAR SECTION: navbar (menu nằm ngang matching image.png) */}
        <HorizontalNavbar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          studentCount={students.length}
          quizCount={4}
          productCount={4}
          photoCount={6}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedSubject={currentSubject}
          onSelectSubject={setCurrentSubject}
          onOpen18FoldersModal={() => setIs18FoldersModalOpen(true)}
          onOpenAssignModal={() => setIsGlobalAssignModalOpen(true)}
          isTeacher={session.role === 'teacher'}
          onRequireTeacherLogin={(msg) => {
            showToast(msg || 'Bạn cần đăng nhập tài khoản Giáo viên để giao bài tập!', 'error');
            handleOpenTeacherLoginModal(false);
          }}
        />

        {/* 3. TWO-COLUMN MAIN BODY (Left: Menu dọc | Right: Content Grid as drawn in mauweb.jpg) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* LEFT COLUMN: Menu dọc (from mauweb.jpg) - 3 cols on lg */}
          <div className="lg:col-span-3 xl:col-span-3">
            <VerticalMenu
              selectedClassId={selectedClassId}
              onSelectClass={(id) => setSelectedClassId(id)}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedGradeFilter={selectedGradeFilter}
              onSelectGradeFilter={setSelectedGradeFilter}
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              session={daySession}
              onSessionChange={setDaySession}
              periodNumber={periodNumber}
              onPeriodChange={setPeriodNumber}
              onOpenAutoAssign={() => setIsAutoAssignOpen(true)}
              onOpenClassRoster={() => setIsClassRosterDrawerOpen(true)}
              activeClassStudentCount={classStudents.length}
              selectedSubject={currentSubject}
              onSelectSubject={setCurrentSubject}
              onOpen18FoldersModal={() => setIs18FoldersModalOpen(true)}
            />
          </div>

          {/* RIGHT COLUMN: Main Content Area - 9 cols on lg */}
          <div className="lg:col-span-9 xl:col-span-9 space-y-5">
            
            {/* TAB 1: Kho Học Liệu Số (EXACT WIREFRAME MATCH: HỌC LIỆU TẢI NHIỀU NHẤT & HỌC LIỆU MỚI NHẤT) */}
            {activeTab === 'materials' && (
              <div className="space-y-4">
                <div className="bg-white border-2 border-blue-600 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-blue-800">Đang chọn:</span>
                    <span className="font-extrabold text-slate-900 bg-blue-100 px-2 py-0.5 rounded-lg border border-blue-200">
                      {currentClass.name} ({currentClass.totalStudents} học sinh)
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-600">
                      {daySession === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'} - Tiết {periodNumber}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Compact Search input for materials */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm học liệu, phần mềm..."
                        className="pl-8 pr-6 py-1 text-xs rounded-lg border border-slate-300 focus:border-blue-500 outline-none w-36 sm:w-48 bg-slate-50 focus:bg-white"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute right-2 top-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveTab('computers')}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      <span>Xem sơ đồ 20 máy</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setIsClassRosterDrawerOpen(true)}
                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>DS {classStudents.length} HS</span>
                    </button>
                  </div>
                </div>

                <MaterialsSection
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  selectedGrade={selectedGradeFilter}
                  selectedSubject={currentSubject}
                  onSelectSubject={setCurrentSubject}
                  onPreviewMaterial={(mat) => setPreviewMaterial(mat)}
                  onQuickDownload={handleQuickDownload}
                  onAssignToComputers={handleDeployToComputers}
                />
              </div>
            )}

            {/* TAB 2: HỌC SINH (Hồ sơ học sinh 9 lớp, 249 học sinh từ Supabase) */}
            {activeTab === 'students' && (
              <StudentRosterView
                session={session}
                classes={CLASSES_DATA}
                students={students}
                supabaseStatus={supabaseStatus}
                supabaseError={supabaseError}
                supabaseMetadata={supabaseMetadata}
                onRetrySupabase={loadSupabaseData}
                currentClassId={selectedClassId}
                selectedSubject={currentSubject}
                onSelectSubject={setCurrentSubject}
                onOpen18FoldersModal={() => setIs18FoldersModalOpen(true)}
                onSelectStudent={(id) => {
                  setSelectedStudentId(id);
                  setActiveTab('computers');
                }}
                onGoToComputers={(cid) => {
                  if (cid !== 'all') setSelectedClassId(cid);
                  setActiveTab('computers');
                }}
                assignments={assignments}
                onUpdateStudents={handleUpdateStudents}
                onSelectClass={(cid) => {
                  if (cid !== 'all') setSelectedClassId(cid);
                }}
              />
            )}

            {/* TAB 2.1: QUẢN LÝ VÀ XUẤT TÀI KHOẢN HỌC SINH (9 LỚP, 249 HỌC SINH, CẤP MÃ PIN & XUẤT EXCEL) */}
            {activeTab === 'accounts' && (
              <StudentAccountsManager
                session={session}
                classes={CLASSES_DATA}
                currentClassId={selectedClassId}
                onGoToComputers={(cid) => {
                  if (cid !== 'all') setSelectedClassId(cid);
                  setActiveTab('computers');
                }}
              />
            )}

            {/* TAB 3: Sơ đồ 20 Máy tính & Bảng Điểm Danh Phòng Máy */}
            {activeTab === 'computers' && (
              <div className="space-y-4 pt-1 animate-fadeIn">
                {/* Sub-view navigation: Seating Grid vs Attendance Table */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setComputersSubView('grid')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                        computersSubView === 'grid'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Monitor className="w-4 h-4" />
                      <span>🖥️ Sơ đồ 20 Máy tính (Chỗ ngồi)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setComputersSubView('attendance')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${
                        computersSubView === 'attendance'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>📋 Bảng Điểm danh Phòng máy</span>
                      {attendanceRecords.length > 0 && (
                        <span className="ml-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-mono">
                          {attendanceRecords.length}
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {computersSubView === 'grid' ? (
                      <>
                        <button
                          onClick={() => setIsAutoAssignOpen(true)}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                          <span>Phân công AI</span>
                        </button>
                        <button
                          onClick={() => setIsWorkstationModalOpen(true)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          title="Quản lý và xác nhận mã định danh PC01-PC20 cho 20 máy tính trạm"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Quản lý 20 máy trạm</span>
                        </button>
                        <button
                          onClick={handleSaveAssignment}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          Lưu sơ đồ lớp
                        </button>
                        <button
                          onClick={() => setIsPrintOpen(true)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer"
                          title="In sơ đồ chỗ ngồi phòng máy"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] text-slate-500 font-medium">
                        Điểm danh theo tiết • Tự động đối chiếu sơ đồ máy
                      </span>
                    )}
                  </div>
                </div>

                {computersSubView === 'grid' ? (
                  <div className="space-y-4">
                    {/* Seating Stats Summary */}
                    <StatsOverview
                      currentClass={currentClass}
                      classStudents={classStudents}
                      assignedCount={assignedCount}
                      unassignedCount={unassignedCount}
                      singleStudentComputers={singleStudentComputers}
                      doubleStudentComputers={doubleStudentComputers}
                      emptyComputers={emptyComputers}
                    />

                    {/* 20 Computer Stations Grid */}
                    <ComputerGrid
                      assignments={assignments}
                      studentMap={studentMap}
                      selectedStudentId={selectedStudentId}
                      brokenComputers={brokenComputers}
                      attendanceMap={attendanceMap}
                      onSlotClick={handleSlotClick}
                      onRemoveStudent={handleRemoveStudent}
                      onToggleBrokenComputer={handleToggleBrokenComputer}
                      onReassignBroken={handleReassignBroken}
                      classTotalStudents={classStudents.length}
                    />
                  </div>
                ) : (
                  <ClassAttendanceTable
                    currentClass={currentClass}
                    classStudents={classStudents}
                    currentDate={currentDate}
                    daySession={daySession}
                    periodNumber={periodNumber}
                    assignments={assignments}
                    onDateChange={setCurrentDate}
                    onSessionChange={setDaySession}
                    onPeriodChange={setPeriodNumber}
                    onShowToast={showToast}
                  />
                )}
              </div>
            )}

            {/* TAB 4: BÀI TẬP LÝ THUYẾT (Trắc nghiệm, Điền khuyết, Đúng/Sai, Tự luận) */}
            {/* TAB 4: BÀI TẬP LÝ THUYẾT (Trắc nghiệm, Điền khuyết, Đúng/Sai, Tự luận) */}
            {activeTab === 'theory' && (
              <TheoryQuizManager
                session={session}
                classes={CLASSES_DATA}
                students={students}
                currentClassId={selectedClassId}
                selectedSubject={currentSubject}
                onSelectSubject={setCurrentSubject}
              />
            )}

            {/* TAB 5: BÀI TẬP THỰC HÀNH (Sản phẩm số HS) */}
            {(activeTab === 'practice' || activeTab === 'products') && (
              <PracticeAssignmentManager
                session={session}
                classes={CLASSES_DATA}
                students={students}
                currentClassId={selectedClassId}
                onSwitchSession={setSession}
                selectedSubject={currentSubject}
                onSelectSubject={setCurrentSubject}
              />
            )}

            {/* TAB 6: ĐÁNH GIÁ & NHẬN XÉT (Bao gồm Đánh giá theo tháng và Đánh giá nhận xét cuối năm) */}
            {(activeTab === 'evaluation' || activeTab === 'monthly' || activeTab === 'semester') && (
              <UnifiedEvaluationManager
                session={session}
                classes={CLASSES_DATA}
                students={students}
                currentClassId={selectedClassId}
                initialSubTab={activeTab === 'semester' ? 'year_end' : 'monthly'}
              />
            )}

            {/* TAB 7: CÔNG CỤ DẠY HỌC (BeeClass, Giáo viên đổi mới, Kahoot!, Quizizz..) */}
            {(activeTab === 'tools' || activeTab === 'external') && (
              <ExternalLinksManager
                session={session}
                classes={CLASSES_DATA}
                students={students}
                currentClassId={selectedClassId}
              />
            )}

            {/* TAB 8: HÌNH ẢNH HỌC TẬP (Hình ảnh dạy học & hoạt động thực hành) */}
            {activeTab === 'photos' && (
              <LearningPhotosManager
                session={session}
                classes={CLASSES_DATA}
                currentClassId={selectedClassId}
              />
            )}

            {/* TAB 9: BAN LIÊN LẠC PH (Sổ liên lạc điện tử & Trao đổi phụ huynh) */}
            {activeTab === 'parents' && (
              <ParentContactView
                session={session}
                classes={CLASSES_DATA}
                students={students}
                currentClassId={selectedClassId}
              />
            )}

            {/* TAB 10: TRAO ĐỔI (Diễn đàn hỏi đáp Tin học học sinh & giáo viên) */}
            {activeTab === 'discussion' && (
              <DiscussionForumView
                session={session}
                currentClassId={selectedClassId}
              />
            )}

          </div>

        </div>

      </div>
      )}

      {/* Slide-out Drawer: Danh sách học sinh của lớp đang chọn */}
      {isClassRosterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l-2 border-blue-600">
            <div className="p-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-200" />
                <div>
                  <h3 className="font-bold text-sm">Danh sách học sinh {currentClass.name}</h3>
                  <p className="text-[11px] text-blue-100">Sĩ số: {classStudents.length} học sinh</p>
                </div>
              </div>
              <button
                onClick={() => setIsClassRosterDrawerOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <StudentSidebar
                students={classStudents}
                assignments={assignments}
                selectedStudentId={selectedStudentId}
                onSelectStudent={(id) => {
                  setSelectedStudentId(id);
                  if (id) {
                    setIsClassRosterDrawerOpen(false);
                    setActiveTab('computers');
                    showToast('Đã chọn học sinh. Hãy nhấp vào máy tính để xếp chỗ!', 'info');
                  }
                }}
                onQuickAssignNext={handleQuickAssignNext}
                onToggleAttendance={handleToggleAttendance}
                onUnassignStudent={handleUnassignStudent}
                currentClassName={currentClass.name}
                onOpenFullRoster={() => {
                  setIsClassRosterDrawerOpen(false);
                  setActiveTab('students');
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <MaterialPreviewModal
        material={previewMaterial}
        onClose={() => setPreviewMaterial(null)}
        onDownload={handleQuickDownload}
        onDeployToComputers={handleDeployToComputers}
        currentClassName={currentClass.name}
      />

      <AutoAssignModal
        isOpen={isAutoAssignOpen}
        onClose={() => setIsAutoAssignOpen(false)}
        currentClass={currentClass}
        activeStudentCount={classStudents.filter(s => s.attendance !== 'absent').length}
        onConfirmAutoAssign={handleApplyAutoAssign}
      />

      <DataIntegrityModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        dbStatus={dbStatus}
        onRefreshDiagnostic={() => setDbStatus(getDatabaseDiagnosticStatus())}
        onExportJson={handleExportJson}
        onReloadPage={handleReloadCheck}
      />

      <PrintView
        isOpen={isPrintOpen}
        onClose={() => setIsPrintOpen(false)}
        currentClass={currentClass}
        assignments={assignments}
        studentMap={studentMap}
        date={currentDate}
        session={daySession}
        periodNumber={periodNumber}
        lessonName={lessonName}
      />

      <SecurityAndAccountsModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        dbStatus={dbStatus}
      />

      <WorkstationManagerModal
        isOpen={isWorkstationModalOpen}
        onClose={() => setIsWorkstationModalOpen(false)}
        brokenComputers={brokenComputers}
        onToggleBrokenComputer={handleToggleBrokenComputer}
        currentClassId={selectedClassId}
        currentDate={currentDate}
        daySession={daySession}
        periodNumber={periodNumber}
      />

      <StudentLoginModal
        isOpen={isStudentLoginOpen}
        onClose={() => setIsStudentLoginOpen(false)}
        classes={CLASSES_DATA}
        students={students}
        currentClassId={selectedClassId}
        onSelectClass={setSelectedClassId}
        currentDate={currentDate}
        daySession={daySession}
        periodNumber={periodNumber}
        brokenComputers={brokenComputers}
        onLoginSuccess={handleStudentLoginSuccess}
      />

      {/* Modal 18 Thư mục Lớp học Cô Huệ (Tin học & Công nghệ) */}
      <ClassFoldersModal
        isOpen={is18FoldersModalOpen}
        onClose={() => setIs18FoldersModalOpen(false)}
        selectedClassId={selectedClassId}
        selectedSubject={currentSubject}
        onSelectFolder={(folder: ClassSubjectFolder) => {
          setSelectedClassId(folder.classId);
          setCurrentSubject(folder.subject);
          showToast(`Đã chọn ${folder.code} (${folder.className} - ${folder.subjectName})`, 'success');
        }}
        onOpenRoster={() => {
          setIs18FoldersModalOpen(false);
          setActiveTab('students');
        }}
      />

      {/* Global Assign Exercise Modal (Giao bài tập cho lớp và học sinh) */}
      <AssignExerciseModal
        isOpen={isGlobalAssignModalOpen}
        onClose={() => setIsGlobalAssignModalOpen(false)}
        session={session}
        classes={CLASSES_DATA}
        students={students}
        currentClassId={selectedClassId}
        onShowToast={(msg) => showToast(msg.text, msg.type)}
        onAssignmentSaved={() => {
          showToast('Đã lưu và cập nhật trạng thái phân công bài tập!', 'success');
        }}
      />

      {/* Teacher Authentication Modal */}
      <TeacherLoginModal
        isOpen={isTeacherLoginOpen}
        onClose={() => setIsTeacherLoginOpen(false)}
        onSuccess={handleTeacherLoginSuccess}
        defaultAdmin={defaultAdminMode}
      />

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto mt-6 py-4 border-t-2 border-blue-200 text-center text-xs text-slate-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-bold text-blue-900">{SCHOOL_NAME} • Cổng thông tin Môn Tin học Lớp học số AI</span>
          <span className="font-semibold text-slate-700">9 Lớp • 9 Thư mục Tin học • 249 Học sinh • 20 Máy tính</span>
          <span className="text-slate-400">Hệ thống Đánh giá & Học liệu Tin học Tiểu học v3.5 • Cô Nguyễn Thị Huệ</span>
        </div>
      </footer>
    </div>
  );
}
