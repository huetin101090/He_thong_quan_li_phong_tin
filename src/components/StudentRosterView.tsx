import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  Search, 
  GraduationCap, 
  Monitor, 
  Award, 
  CheckCircle2, 
  ArrowRight,
  UserX,
  Plus,
  Edit2,
  Printer,
  X,
  Download,
  Check,
  Eye,
  School,
  Trash2,
  FileSpreadsheet,
  Upload,
  AlertTriangle,
  RotateCcw,
  FileUp,
  HelpCircle,
  Sparkles,
  Save,
  ChevronDown,
  Share2
} from 'lucide-react';
import { Student, ClassInfo, ClassAssignments, AttendanceStatus, Gender } from '../types/classroom';
import { UserSession } from '../types/assignments';
import { INITIAL_QUIZ_SUBMISSIONS, INITIAL_PRACTICE_SUBMISSIONS } from '../data/initialAssignments';
import { 
  downloadSampleExcel, 
  downloadSampleCSV, 
  parseStudentExcelOrCsv, 
  ParseResult 
} from '../services/studentExcelService';
import { 
  resetStoredStudentsToDefault, 
  autoFixStudentGenders, 
  saveStoredStudents 
} from '../services/storageService';
import { isSameClass, canonicalClassId, CLASSES_DATA, INITIAL_STUDENTS } from '../data/initialData';

interface StudentRosterViewProps {
  session: UserSession;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string;
  onSelectStudent: (id: string) => void;
  onGoToComputers: (classId: string) => void;
  assignments: ClassAssignments;
  onUpdateStudents?: (updatedStudents: Student[]) => void;
  onSelectClass?: (classId: string) => void;
  selectedSubject?: 'all' | 'tin' | 'congnghe';
  onSelectSubject?: (subject: 'all' | 'tin' | 'congnghe') => void;
  onOpen18FoldersModal?: () => void;
}

export const StudentRosterView: React.FC<StudentRosterViewProps> = ({
  session,
  classes,
  students,
  currentClassId,
  onSelectStudent,
  onGoToComputers,
  assignments,
  onUpdateStudents,
  onSelectClass,
  selectedSubject = 'all',
  onSelectSubject,
  onOpen18FoldersModal,
}) => {
  // Class filter: 'all' or specific class ID like '5/4'
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClassId || '5/4');
  const [gradeFilter, setGradeFilter] = useState<'all' | 3 | 4 | 5>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [computerFilter, setComputerFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent'>('all');

  // Multi-selection state for batch operations
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Synchronize with currentClassId and clear previous class filters
  React.useEffect(() => {
    if (currentClassId) {
      setSelectedClassId(currentClassId);
      const cls = classes.find(c => c.id === currentClassId);
      setGradeFilter(cls ? (cls.grade as 3 | 4 | 5) : 'all');
      setSearchTerm('');
      setGenderFilter('all');
      setComputerFilter('all');
      setAttendanceFilter('all');
      setSelectedStudentIds([]);
    }
  }, [currentClassId, classes]);

  const handleClassSelect = (classId: string) => {
    setSelectedClassId(classId);
    if (classId === 'all') {
      setGradeFilter('all');
    } else {
      const cls = classes.find(c => c.id === classId);
      if (cls) setGradeFilter(cls.grade as 3 | 4 | 5);
    }
    // Clear stale filters from previous class
    setSearchTerm('');
    setGenderFilter('all');
    setComputerFilter('all');
    setAttendanceFilter('all');
    setSelectedStudentIds([]);
    if (onSelectClass) onSelectClass(classId);
  };

  // Modals & Dialogs
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Delete Modals State
  const [studentToDeleteSingle, setStudentToDeleteSingle] = useState<Student | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  // Excel / CSV Upload State (mặc định ẩn ô lớn để giao diện gọn gàng)
  const [isUploadCardExpanded, setIsUploadCardExpanded] = useState(false);
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [importTargetClass, setImportTargetClass] = useState<string>(selectedClassId === 'all' ? '5/4' : selectedClassId);
  const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Student form state
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGender, setNewStudentGender] = useState<Gender>('male');
  const [newStudentClassId, setNewStudentClassId] = useState<string>(selectedClassId === 'all' ? '5/4' : selectedClassId);
  const [newStudentNotes, setNewStudentNotes] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editGender, setEditGender] = useState<Gender>('male');
  const [editClassId, setEditClassId] = useState('');
  const [editAttendance, setEditAttendance] = useState<AttendanceStatus>('present');
  const [editNotes, setEditNotes] = useState('');

  const isTeacher = session.role === 'teacher';

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackToast({ msg, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Computer seat lookup
  const getStudentComputerSeat = (studentId: string) => {
    for (let i = 1; i <= 20; i++) {
      if (assignments[i]?.studentAId === studentId) return { label: `Máy ${i < 10 ? '0' + i : i} (Chỗ A)`, compId: i, slot: 'A' };
      if (assignments[i]?.studentBId === studentId) return { label: `Máy ${i < 10 ? '0' + i : i} (Chỗ B)`, compId: i, slot: 'B' };
    }
    return null;
  };

  // Filtered student list: strictly based on selectedClassId and active filters
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Class filter: When a specific class is selected (e.g. '3.4', '4.3', '5.4'), ONLY return students of that class!
      if (selectedClassId !== 'all') {
        if (!isSameClass(s.classId, selectedClassId)) return false;
      } else {
        // If 'all', optional grade filter can apply
        if (gradeFilter !== 'all') {
          const cls = classes.find(c => isSameClass(c.id, s.classId));
          if (cls?.grade !== gradeFilter) return false;
        }
      }

      // 2. Computer assignment filter
      const seat = getStudentComputerSeat(s.id);
      if (computerFilter === 'assigned' && !seat) return false;
      if (computerFilter === 'unassigned' && seat) return false;

      // 3. Attendance filter
      if (attendanceFilter === 'present' && s.attendance === 'absent') return false;
      if (attendanceFilter === 'absent' && s.attendance !== 'absent') return false;

      // 4. Search match (name or student code)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchName = s.name.toLowerCase().includes(query);
        const matchCode = s.code.toLowerCase().includes(query);
        if (!matchName && !matchCode) return false;
      }

      return true;
    });
  }, [students, selectedClassId, gradeFilter, computerFilter, attendanceFilter, searchTerm, assignments, classes]);

  // Multi-select helpers
  const isAllFilteredSelected = useMemo(() => {
    if (filteredStudents.length === 0) return false;
    return filteredStudents.every(s => selectedStudentIds.includes(s.id));
  }, [filteredStudents, selectedStudentIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return filteredStudents.some(s => selectedStudentIds.includes(s.id)) && !isAllFilteredSelected;
  }, [filteredStudents, selectedStudentIds, isAllFilteredSelected]);

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      // Deselect all filtered students
      const filteredSet = new Set(filteredStudents.map(s => s.id));
      setSelectedStudentIds(prev => prev.filter(id => !filteredSet.has(id)));
    } else {
      // Select all filtered students
      const currentSet = new Set(selectedStudentIds);
      filteredStudents.forEach(s => currentSet.add(s.id));
      setSelectedStudentIds(Array.from(currentSet));
    }
  };

  const handleToggleSelectStudent = (id: string, e: React.MouseEvent | React.ChangeEvent) => {
    e.stopPropagation();
    setSelectedStudentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Delete Individual Student
  const handleConfirmDeleteSingle = () => {
    if (!studentToDeleteSingle || !onUpdateStudents) return;
    const target = studentToDeleteSingle;
    const updated = students.filter(s => s.id !== target.id);
    onUpdateStudents(updated);
    setSelectedStudentIds(prev => prev.filter(id => id !== target.id));
    setStudentToDeleteSingle(null);
    showToast(`Đã xóa học sinh ${target.name} (${target.code}) thành công!`, 'success');
  };

  // Batch Delete Selected Students
  const handleConfirmBatchDelete = () => {
    if (selectedStudentIds.length === 0 || !onUpdateStudents) return;
    const deleteSet = new Set(selectedStudentIds);
    const count = selectedStudentIds.length;
    const updated = students.filter(s => !deleteSet.has(s.id));
    onUpdateStudents(updated);
    setSelectedStudentIds([]);
    setIsBatchDeleteModalOpen(false);
    showToast(`Đã xóa thành công ${count} học sinh đã chọn!`, 'success');
  };

  // Batch mark attendance
  const handleBatchMarkAttendance = (status: AttendanceStatus) => {
    if (selectedStudentIds.length === 0 || !onUpdateStudents) return;
    const targetSet = new Set(selectedStudentIds);
    const updated = students.map(s => {
      if (targetSet.has(s.id)) {
        return { ...s, attendance: status };
      }
      return s;
    });
    onUpdateStudents(updated);
    showToast(`Đã cập nhật trạng thái chuyên cần cho ${selectedStudentIds.length} học sinh!`, 'success');
  };

  // File Upload Handlers (Excel / CSV)
  const handleProcessFile = async (file: File) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValidType = validExtensions.some(ext => lowerName.endsWith(ext));

    if (!isValidType) {
      showToast('Vui lòng chọn đúng tệp Excel (.xlsx, .xls) hoặc CSV (.csv)', 'error');
      return;
    }

    setIsParsingFile(true);
    setUploadedFileName(file.name);

    try {
      const targetClass = selectedClassId === 'all' ? '3.4' : canonicalClassId(selectedClassId, '3.4');
      const result = await parseStudentExcelOrCsv(file, targetClass);
      setParseResult(result);
      if (result.detectedClassId) {
        setImportTargetClass(canonicalClassId(result.detectedClassId, targetClass));
      } else {
        setImportTargetClass(targetClass);
      }
      setIsUploadModalOpen(true);
    } catch (err: any) {
      showToast(err?.message || 'Lỗi khi đọc file Excel/CSV', 'error');
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  // Confirm Import parsed students (Chỉ lưu khi bấm xác nhận, không làm mất điểm hay vị trí máy)
  const handleConfirmImport = () => {
    if (!parseResult || !parseResult.rows || parseResult.rows.length === 0 || !onUpdateStudents) return;

    const newRows = parseResult.rows.filter(r => r.isValid);
    if (newRows.length === 0) {
      showToast('Không có hàng nào hợp lệ để nhập vào hệ thống', 'error');
      return;
    }

    const defaultClassForImport = selectedClassId === 'all' ? '3.4' : canonicalClassId(selectedClassId, '3.4');

    // Convert parsed rows to imported student records with strictly canonical classId
    const importedStudents = newRows.map((row, idx) => {
      const clsId = canonicalClassId(
        importTargetClass === 'auto' ? row.classId : importTargetClass,
        defaultClassForImport
      );
      const cleanPrefix = clsId.replace(/[\/\.]/g, '');
      const code = row.code && row.code.startsWith('HS') 
        ? row.code 
        : `HS${cleanPrefix}-${(idx + 1) < 10 ? '0' + (idx + 1) : (idx + 1)}`;

      return {
        id: code,
        code,
        name: row.name, // Họ và tên đầy đủ (ghép cột C và cột D)
        classId: clsId,
        gender: row.gender,
        seatNumber: row.stt || idx + 1,
        attendance: 'present' as AttendanceStatus,
        notes: row.notes || undefined
      };
    });

    let finalStudents: Student[] = [];
    let updatedCount = 0;
    let addedCount = 0;

    const targetCls = canonicalClassId(
      importTargetClass === 'auto' ? (parseResult.detectedClassId || defaultClassForImport) : importTargetClass,
      defaultClassForImport
    );

    if (importMode === 'overwrite') {
      // Chế độ ghi đè: chỉ ghi đè học sinh thuộc lớp được chỉ định, BẢO LƯU 100% CÁC LỚP KHÁC
      const remainingStudents = students.filter(s => !isSameClass(s.classId, targetCls));
      finalStudents = [...remainingStudents, ...importedStudents];
      addedCount = importedStudents.length;
    } else {
      // Chế độ Cập nhật & Bổ sung (Mặc định - Bảo toàn vị trí máy tính và điểm số)
      const existingByCode = new Map<string, Student>();
      const existingByNameClass = new Map<string, Student>();

      students.forEach(s => {
        existingByCode.set(s.code.trim().toUpperCase(), s);
        existingByCode.set(s.id.trim().toUpperCase(), s);
        const normKey = `${s.name.trim().toLowerCase().replace(/\s+/g, ' ')}_${canonicalClassId(s.classId)}`;
        existingByNameClass.set(normKey, s);
      });

      // Tạo bản sao danh sách học sinh hiện tại
      const updatedList = [...students];

      importedStudents.forEach(imp => {
        const impCodeKey = imp.code.trim().toUpperCase();
        const normImpKey = `${imp.name.trim().toLowerCase().replace(/\s+/g, ' ')}_${canonicalClassId(imp.classId)}`;

        // Kiểm tra học sinh đã tồn tại theo mã hoặc theo họ tên + lớp
        const existingStudent = existingByCode.get(impCodeKey) || existingByNameClass.get(normImpKey);

        if (existingStudent) {
          // BẢO LƯU: Cập nhật họ tên đầy đủ, giữ nguyên id, số máy tính và trạng thái
          const index = updatedList.findIndex(s => s.id === existingStudent.id);
          if (index !== -1) {
            updatedList[index] = {
              ...updatedList[index],
              name: imp.name, // Họ và tên đầy đủ mới
              gender: imp.gender || updatedList[index].gender,
              classId: imp.classId,
              notes: imp.notes || updatedList[index].notes
            };
            updatedCount++;
          }
        } else {
          // THÊM MỚI HỌC SINH CHƯA CÓ
          let uniqueId = imp.id;
          let counter = 1;
          while (updatedList.some(s => s.id === uniqueId)) {
            uniqueId = `${imp.id}_${counter++}`;
          }
          updatedList.push({ ...imp, id: uniqueId });
          addedCount++;
        }
      });

      finalStudents = updatedList;
    }

    // Bảo toàn đầy đủ 9 lớp (249 học sinh) của nhà trường
    CLASSES_DATA.forEach(cls => {
      const hasClass = finalStudents.some(s => isSameClass(s.classId, cls.id));
      if (!hasClass) {
        const fallback = INITIAL_STUDENTS.filter(s => isSameClass(s.classId, cls.id));
        finalStudents.push(...fallback);
      }
    });

    onUpdateStudents(finalStudents);
    saveStoredStudents(finalStudents).catch(err => console.warn('Could not sync imported students:', err));
    setIsUploadModalOpen(false);
    setParseResult(null);

    // Chuyển giao diện ngay lập tức sang lớp vừa nạp để hiển thị danh sách ngay bên dưới
    setSelectedClassId(targetCls);
    if (onSelectClass) onSelectClass(targetCls);

    // Xóa tất cả các bộ lọc tìm kiếm và chuyên cần để danh sách mới hiển thị 100%
    setSearchTerm('');
    setGenderFilter('all');
    setComputerFilter('all');
    setAttendanceFilter('all');
    setSelectedStudentIds([]);

    const detailMsg = updatedCount > 0 
      ? `Đã cập nhật ${updatedCount} học sinh có sẵn & thêm ${addedCount} học sinh mới!`
      : `Đã nạp thành công ${addedCount} học sinh vào Lớp ${targetCls}! Danh sách đã hiển thị bên dưới.`;

    showToast(`Nhập dữ liệu thành công! ${detailMsg}`, 'success');

    // Cuộn mượt xuống bảng danh sách học sinh
    setTimeout(() => {
      const tableEl = document.getElementById('student-roster-table');
      if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // State đồng bộ Server vĩnh viễn (đáp ứng yêu cầu khi tắt app hoặc share link qua email khác)
  const [isSyncingServer, setIsSyncingServer] = useState(false);
  const handleSyncToServer = async () => {
    setIsSyncingServer(true);
    try {
      const ok = await saveStoredStudents(students);
      if (ok) {
        showToast('Đã lưu & đồng bộ toàn bộ danh sách 9 lớp lên máy chủ vĩnh viễn! (Tắt app hay share link vẫn giữ nguyên)', 'success');
      } else {
        showToast('Đã lưu dữ liệu vào bộ nhớ trình duyệt.', 'info');
      }
    } catch {
      showToast('Đã lưu dữ liệu vào bộ nhớ trình duyệt.', 'info');
    } finally {
      setIsSyncingServer(false);
    }
  };

  // Chia sẻ liên kết kèm đồng bộ toàn bộ dữ liệu hiện tại lên máy chủ
  const [isCopiedLink, setIsCopiedLink] = useState(false);
  const handleShareLink = async () => {
    try {
      await saveStoredStudents(students);
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setIsCopiedLink(true);
      showToast('Đã lưu dữ liệu & sao chép liên kết chia sẻ! Người nhận mở link sẽ xem được đầy đủ 100% danh sách học sinh.', 'success');
      setTimeout(() => setIsCopiedLink(false), 3500);
    } catch {
      showToast('Đã lưu dữ liệu! Liên kết: ' + window.location.href, 'info');
    }
  };

  // Tự động chuẩn hóa toàn bộ giới tính theo từ điển tên tiếng Việt
  const handleAutoFixGenders = () => {
    if (!onUpdateStudents) return;
    const { updatedStudents, changedCount } = autoFixStudentGenders(students);
    onUpdateStudents(updatedStudents);
    showToast(
      changedCount > 0 
        ? `Đã tự động chuẩn hóa chính xác giới tính cho ${changedCount} học sinh theo tên tiếng Việt!` 
        : `Tất cả học sinh đã có giới tính chuẩn xác theo ngôn ngữ học tiếng Việt!`,
      'success'
    );
  };

  // Statistics calculation
  const totalInScope = filteredStudents.length;
  const maleCount = filteredStudents.filter(s => s.gender === 'male').length;
  const femaleCount = filteredStudents.filter(s => s.gender === 'female').length;
  const malePct = totalInScope > 0 ? Math.round((maleCount / totalInScope) * 100) : 0;
  const femalePct = totalInScope > 0 ? 100 - malePct : 0;
  const assignedCount = filteredStudents.filter(s => getStudentComputerSeat(s.id) !== null).length;
  const presentCount = filteredStudents.filter(s => s.attendance !== 'absent').length;

  const currentClassObj = classes.find(c => c.id === selectedClassId);

  // Toggle student gender directly (Nam <-> Nu)
  const handleToggleStudentGender = (studentId: string) => {
    if (!onUpdateStudents) return;
    const updated = students.map(st => {
      if (st.id === studentId) {
        const nextGender: Gender = st.gender === 'female' ? 'male' : 'female';
        return { ...st, gender: nextGender };
      }
      return st;
    });
    onUpdateStudents(updated);
    const target = updated.find(s => s.id === studentId);
    showToast(`Đã đổi giới tính em ${target?.name} sang ${target?.gender === 'female' ? 'Nữ 👧' : 'Nam 👦'}!`, 'success');
  };

  // Toggle student attendance
  const handleToggleAttendance = (studentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateStudents) return;
    const updated = students.map(st => {
      if (st.id === studentId) {
        const newAtt: AttendanceStatus = st.attendance === 'absent' ? 'present' : 'absent';
        return { ...st, attendance: newAtt };
      }
      return st;
    });
    onUpdateStudents(updated);
    showToast('Đã cập nhật trạng thái chuyên cần!');
  };

  // Mark all currently filtered as present
  const handleMarkAllPresent = () => {
    if (!onUpdateStudents) return;
    const targetIds = new Set(filteredStudents.map(s => s.id));
    const updated = students.map(st => {
      if (targetIds.has(st.id)) {
        return { ...st, attendance: 'present' as AttendanceStatus };
      }
      return st;
    });
    onUpdateStudents(updated);
    showToast(`Đã điểm danh CÓ MẶT cho tất cả ${filteredStudents.length} học sinh!`);
  };

  // Add new student
  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !onUpdateStudents) return;

    const classPrefix = newStudentClassId.replace('/', '');
    const currentClassCount = students.filter(s => s.classId === newStudentClassId).length;
    const newSeq = currentClassCount + 1;
    const newCode = `HS${classPrefix}-${newSeq < 10 ? '0' + newSeq : newSeq}`;

    const newStudent: Student = {
      id: newCode,
      code: newCode,
      name: newStudentName.trim(),
      gender: newStudentGender,
      classId: newStudentClassId,
      seatNumber: newSeq,
      attendance: 'present',
      notes: newStudentNotes.trim() || undefined,
    };

    const updated = [...students, newStudent];
    onUpdateStudents(updated);
    setIsAddStudentOpen(false);
    setNewStudentName('');
    setNewStudentNotes('');
    showToast(`Đã thêm thành công học sinh ${newStudent.name} (${newCode}) vào lớp ${newStudentClassId}!`);
  };

  // Open Edit Modal
  const handleOpenEdit = (st: Student, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudent(st);
    setEditName(st.name);
    setEditGender(st.gender);
    setEditClassId(st.classId);
    setEditAttendance(st.attendance);
    setEditNotes(st.notes || '');
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent || !onUpdateStudents) return;

    const updated = students.map(st => {
      if (st.id === editingStudent.id) {
        return {
          ...st,
          name: editName.trim(),
          gender: editGender,
          classId: editClassId,
          attendance: editAttendance,
          notes: editNotes.trim() || undefined,
        };
      }
      return st;
    });

    onUpdateStudents(updated);
    setEditingStudent(null);
    showToast(`Đã lưu cập nhật thông tin học sinh ${editName}!`);
  };

  // Restore factory data
  const handleResetToDefault = () => {
    if (window.confirm('Khôi phục danh sách gốc 249 học sinh cho 9 lớp học của Trường TH Đồng Dương? Các dữ liệu tự thêm hoặc xóa sẽ được hoàn tác về mặc định.')) {
      const defaults = resetStoredStudentsToDefault();
      if (onUpdateStudents) onUpdateStudents(defaults);
      setSelectedStudentIds([]);
      showToast('Đã khôi phục thành công danh sách gốc 249 học sinh!', 'info');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {feedbackToast && (
        <div className={`fixed top-4 right-4 z-50 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fadeIn ${
          feedbackToast.type === 'error' ? 'bg-rose-600' : feedbackToast.type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'
        }`}>
          {feedbackToast.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          )}
          <span>{feedbackToast.msg}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* 1. Header Banner */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white flex items-center justify-center shadow-sm shrink-0">
            <Users className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-blue-950 uppercase tracking-tight">
                {selectedClassId === 'all' 
                  ? 'DANH SÁCH HỌC SINH TOÀN TRƯỜNG' 
                  : `HỒ SƠ HỌC SINH TIN HỌC • LỚP ${selectedClassId}`}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 border border-blue-300">
                {filteredStudents.length} HS
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Trường Tiểu học Đồng Dương • <strong>GVQL: Cô Nguyễn Thị Huệ</strong> • Quản lý hồ sơ, chọn nhiều để xóa, tải lên Excel/CSV
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          {isTeacher && (
            <>
              {/* Nút Lưu & Đồng bộ Server vĩnh viễn (đáp ứng tắt app / chia sẻ link) */}
              <button
                type="button"
                onClick={handleSyncToServer}
                disabled={isSyncingServer}
                className="px-3 py-2 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ring-1 ring-blue-400/50"
                title="Lưu vĩnh viễn toàn bộ dữ liệu 9 lớp lên máy chủ (khi tắt app hoặc gửi link cho người khác vẫn xem được đầy đủ)"
              >
                <Save className={`w-4 h-4 ${isSyncingServer ? 'animate-spin' : 'text-cyan-200'}`} />
                <span>{isSyncingServer ? 'Đang lưu máy chủ...' : 'Lưu & Đồng bộ Server'}</span>
              </button>

              {/* Nút Chia sẻ Link kèm bảo toàn dữ liệu */}
              <button
                type="button"
                onClick={handleShareLink}
                className="px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ring-1 ring-purple-400/50"
                title="Lưu dữ liệu và sao chép link để gửi qua email cho đồng nghiệp hoặc mở trên thiết bị khác"
              >
                <Share2 className="w-4 h-4 text-purple-200" />
                <span>{isCopiedLink ? 'Đã chép link!' : 'Chia sẻ link'}</span>
              </button>

              {/* Nút Tải file danh sách Excel / CSV (kèm menu tùy chọn gọn gàng) */}
              <div className="relative inline-flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (fileInputRef.current) fileInputRef.current.click();
                  }}
                  className="px-3 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold rounded-l-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ring-1 ring-emerald-400/50"
                  title="Tải lên tệp danh sách học sinh định dạng Excel (.xlsx, .xls) hoặc CSV (.csv)"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Tải file Excel / CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsUploadMenuOpen(prev => !prev)}
                  className="px-2 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-r-xl border-l border-emerald-500/50 shadow-xs transition cursor-pointer ring-1 ring-emerald-400/50"
                  title="Tùy chọn tải file & tải file mẫu"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-emerald-100" />
                </button>

                {/* Dropdown Menu nhỏ gọn khi bấm mũi tên */}
                {isUploadMenuOpen && (
                  <div 
                    className="absolute top-full mt-1.5 right-0 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in slide-in-from-top-2 text-xs"
                    onMouseLeave={() => setIsUploadMenuOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setIsUploadMenuOpen(false);
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-2 font-medium cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-emerald-600" />
                      <span>Chọn file từ máy tính (.xlsx, .csv)</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsUploadMenuOpen(false);
                        downloadSampleExcel(selectedClassId === 'all' ? '5/4' : selectedClassId);
                      }}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-600" />
                      <span>Tải file mẫu Excel (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsUploadMenuOpen(false);
                        downloadSampleCSV(selectedClassId === 'all' ? '5/4' : selectedClassId);
                      }}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-teal-600" />
                      <span>Tải file mẫu CSV (UTF-8)</span>
                    </button>
                    <div className="my-1 border-t border-slate-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsUploadMenuOpen(false);
                        setIsUploadCardExpanded(prev => !prev);
                      }}
                      className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <FileUp className="w-4 h-4 text-blue-600" />
                      <span>{isUploadCardExpanded ? 'Ẩn ô kéo thả lớn' : 'Mở ô kéo thả tệp lớn'}</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setNewStudentClassId(selectedClassId === 'all' ? '5/4' : selectedClassId);
                  setIsAddStudentOpen(true);
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm học sinh</span>
              </button>
            </>
          )}

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In / Xuất bảng</span>
          </button>

          <button
            onClick={() => onGoToComputers(selectedClassId === 'all' ? '5/4' : selectedClassId)}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Monitor className="w-4 h-4" />
            <span>Sơ đồ 20 máy {selectedClassId === 'all' ? 'Lớp 5/4' : currentClassObj?.name}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. KHU VỰC TẢI LÊN FILE DANH SÁCH EXCEL / CSV (THEO YÊU CẦU NGƯỜI DÙNG: ẨN MẶC ĐỊNH ĐỂ GIAO DIỆN GỌN VÀ ĐẸP HƠN) */}
      {isTeacher && isUploadCardExpanded && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-300 rounded-2xl p-3.5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-tight flex items-center gap-2">
                  <span>Khu vực tải lên danh sách học sinh (Excel / CSV)</span>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    Mới cập nhật
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-800">
                  Kéo thả hoặc tải tệp Excel (.xlsx, .xls) hoặc CSV để nạp nhanh danh sách cả lớp mà không phải nhập từng em
                </p>
              </div>
            </div>

            {/* Quick Actions & Download Templates */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSampleExcel(selectedClassId === 'all' ? '5/4' : selectedClassId)}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                title="Tải tệp mẫu Excel có sẵn các cột chuẩn để điền dữ liệu"
              >
                <Download className="w-3.5 h-3.5 text-emerald-700" />
                <span>Tải mẫu Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => downloadSampleCSV(selectedClassId === 'all' ? '5/4' : selectedClassId)}
                className="px-2.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                title="Tải tệp mẫu CSV UTF-8 có dấu"
              >
                <Download className="w-3.5 h-3.5 text-teal-700" />
                <span>Tải mẫu CSV</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Chọn tệp tải lên...</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUploadCardExpanded(false)}
                className="px-2.5 py-1.5 bg-white/80 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                title="Ẩn ô này cho giao diện gọn và đẹp hơn"
              >
                <X className="w-3.5 h-3.5" />
                <span>Ẩn ô này</span>
              </button>
            </div>
          </div>

          {/* Interactive Drag & Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.click();
            }}
            className={`mt-3 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
              isDragOver 
                ? 'border-emerald-600 bg-emerald-100/70 scale-[0.99]' 
                : 'border-emerald-300 hover:border-emerald-500 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-1.5">
              <FileUp className={`w-7 h-7 ${isDragOver ? 'text-emerald-700 animate-bounce' : 'text-emerald-600'}`} />
              <div className="text-xs font-bold text-slate-800">
                <span className="text-emerald-700 underline font-black">Bấm vào đây để chọn tệp</span> hoặc kéo thả file Excel / CSV vào khung này
              </div>
              <div className="text-[11px] text-slate-600 flex flex-wrap items-center justify-center gap-1.5 font-medium">
                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-bold">Cột A: STT</span>
                <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded font-bold">Cột B: Mã HS</span>
                <span className="bg-purple-100 text-purple-900 px-2 py-0.5 rounded font-bold">Cột C: Họ & tên đệm</span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">Cột D: Tên HS</span>
                <span className="text-slate-400">→</span>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded font-black">Tự ghép thành Họ và tên đầy đủ</span>
              </div>
              <div className="text-[10.5px] text-slate-500 flex flex-wrap items-center justify-center gap-2 mt-0.5">
                <span>✓ Đọc tất cả các sheet (Tin học & Công nghệ)</span>
                <span>•</span>
                <span>✓ Tự nhận diện lớp</span>
                <span>•</span>
                <span>✓ Khử trùng hồ sơ qua mã HS</span>
                <span>•</span>
                <span>✓ Giữ nguyên 100% dấu tiếng Việt</span>
              </div>

              {/* 18 Configured Folders Display */}
              <div className="mt-2 pt-2 border-t border-emerald-200/60 text-[10.5px] text-emerald-900 flex flex-col items-center gap-1 w-full">
                <span className="font-bold text-emerald-950 flex items-center gap-1">
                  <span>📁 Tự động khớp 18 thư mục/tệp Tin học & Công nghệ của Cô Huệ:</span>
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1 font-mono text-[9px] max-w-4xl">
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN HỌC 3.4</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CÔNG NGHỆ 3.4</span>
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN HỌC 3.5</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CÔNG NGHỆ 3.5</span>
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN HỌC 3.6</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CÔNG NGHỆ 3.6</span>
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN 4.3</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CN4.3</span>
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN 4.4</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CN4.4</span>
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN 4.5.</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CN 4.5</span>
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN5.4</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CN 5.4</span>
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN 5.5</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CN 5.5</span>
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded text-blue-800 font-semibold shadow-2xs">_TIN 5.6</span>
                  <span className="bg-white border border-emerald-200 px-1.5 py-0.5 rounded text-emerald-800 font-semibold shadow-2xs">_CN 5.6</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. STATS KPI CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase">Tổng số HS</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-black text-blue-950 mt-1">
            {totalInScope} <span className="text-xs font-normal text-blue-600">/ {students.length} HS</span>
          </div>
          <p className="text-[10px] text-blue-700 mt-0.5">
            {selectedClassId === 'all' ? 'Toàn bộ 9 lớp' : `Lớp ${selectedClassId}`}
          </p>
        </div>

        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-tight">Tỉ lệ Giới tính</span>
              <GraduationCap className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-base sm:text-lg font-black text-indigo-950 mt-1 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-blue-700 font-black">{maleCount}</span>
              <span className="text-xs font-bold text-blue-600">Nam ({malePct}%)</span>
              <span className="text-slate-400">•</span>
              <span className="text-pink-600 font-black">{femaleCount}</span>
              <span className="text-xs font-bold text-pink-500">Nữ ({femalePct}%)</span>
            </div>
          </div>

          <div className="mt-2 space-y-1">
            {totalInScope > 0 ? (
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden flex shadow-2xs">
                <div 
                  style={{ width: `${malePct}%` }} 
                  className="bg-blue-500 transition-all duration-300" 
                  title={`Nam: ${maleCount} HS (${malePct}%)`} 
                />
                <div 
                  style={{ width: `${femalePct}%` }} 
                  className="bg-pink-500 transition-all duration-300" 
                  title={`Nữ: ${femaleCount} HS (${femalePct}%)`} 
                />
              </div>
            ) : (
              <div className="w-full h-2 bg-slate-200 rounded-full" />
            )}
            <div className="flex items-center justify-between text-[10px] text-indigo-700 font-medium pt-0.5">
              <span>{totalInScope > 0 ? `Cơ cấu: ${malePct}% Nam – ${femalePct}% Nữ` : 'Chưa có học sinh'}</span>
              {isTeacher && totalInScope > 0 && (
                <button
                  type="button"
                  onClick={handleAutoFixGenders}
                  className="text-[9.5px] font-bold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                  title="Tự động chuẩn hóa giới tính Nam/Nữ theo từ điển họ tên tiếng Việt"
                >
                  ⚡ Chuẩn hóa
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase">Đã xếp máy</span>
            <Monitor className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-950 mt-1">
            {assignedCount} <span className="text-xs font-normal text-emerald-700">HS</span>
          </div>
          <p className="text-[10px] text-emerald-700 mt-0.5">
            {totalInScope - assignedCount > 0 ? `Còn ${totalInScope - assignedCount} chưa xếp` : 'Đã phân công đủ'}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-800 uppercase">Chuyên cần hôm nay</span>
            <CheckCircle2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-950 mt-1">
            {presentCount} <span className="text-xs font-normal text-emerald-700">Có mặt</span>
            {totalInScope - presentCount > 0 && (
              <span className="text-xs font-normal text-rose-600"> • {totalInScope - presentCount} Vắng</span>
            )}
          </div>
          <p className="text-[10px] text-amber-800 mt-0.5">
            Tỉ lệ đi học: {Math.round((presentCount / (totalInScope || 1)) * 100)}%
          </p>
        </div>
      </div>

      {/* 4. CLASS & GRADE SELECTOR (9 LỚP HỌC) */}
      <div className="bg-white border-2 border-blue-200 rounded-2xl p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-2 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1">
              <School className="w-4 h-4 text-blue-700" />
              <span className="text-xs font-black uppercase text-slate-800 tracking-wider">
                Phân môn & Khối lớp tra cứu:
              </span>
            </div>

            {/* Subject toggle */}
            {onSelectSubject && (
              <div className="inline-flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => onSelectSubject('all')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    selectedSubject === 'all'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌟 Cả 2 môn (18 Thư mục)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSubject('tin')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    selectedSubject === 'tin'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 text-blue-400" />
                  <span>💻 MÔN TIN HỌC</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectSubject('congnghe')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    selectedSubject === 'congnghe'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                  <span>🛠️ MÔN CÔNG NGHỆ</span>
                </button>
              </div>
            )}

            {onOpen18FoldersModal && (
              <button
                type="button"
                onClick={onOpen18FoldersModal}
                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                title="Xem danh mục 18 thư mục theo danh sách của Cô Huệ"
              >
                <span>📁 Bảng 18 Thư mục Cô Huệ</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* All classes tab */}
            <button
              onClick={() => handleClassSelect('all')}
              className={`px-3 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 ${
                selectedClassId === 'all'
                  ? 'bg-blue-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-blue-100 text-slate-700 border border-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>TẤT CẢ ({students.length} HỌC SINH)</span>
            </button>

            {isTeacher && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
                title="Khôi phục lại danh sách 249 học sinh mẫu ban đầu của nhà trường"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Khôi phục DS gốc</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Groups of Classes: Khối 3, Khối 4, Khối 5 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* KHỐI 3 */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1 text-blue-800">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Khối 3 ({students.filter(s => classes.find(c => isSameClass(c.id, s.classId))?.grade === 3).length} HS)
              </span>
              <span className="text-[10px] text-slate-500">3 lớp • 6 thư mục</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {classes.filter(c => c.grade === 3).map(c => {
                const isSelected = isSameClass(selectedClassId, c.id);
                const count = students.filter(s => isSameClass(s.classId, c.id)).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleClassSelect(c.id)}
                    className={`p-2 rounded-lg text-center transition cursor-pointer font-bold flex flex-col justify-between min-h-[78px] ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-400'
                        : 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-200 text-xs'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">{c.name}</div>
                      <div className={`text-[10px] font-normal ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        {count} HS
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5 w-full">
                      <span className={`block truncate text-[8.5px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-blue-700 text-blue-100' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.tinHocFolder}
                      </span>
                      <span className={`block truncate text-[8.5px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {c.congNgheFolder}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* KHỐI 4 */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1 text-indigo-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Khối 4 ({students.filter(s => classes.find(c => isSameClass(c.id, s.classId))?.grade === 4).length} HS)
              </span>
              <span className="text-[10px] text-slate-500">3 lớp • 6 thư mục</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {classes.filter(c => c.grade === 4).map(c => {
                const isSelected = isSameClass(selectedClassId, c.id);
                const count = students.filter(s => isSameClass(s.classId, c.id)).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleClassSelect(c.id)}
                    className={`p-2 rounded-lg text-center transition cursor-pointer font-bold flex flex-col justify-between min-h-[78px] ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400'
                        : 'bg-white hover:bg-indigo-50 text-slate-700 border border-slate-200 text-xs'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">{c.name}</div>
                      <div className={`text-[10px] font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {count} HS
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5 w-full">
                      <span className={`block truncate text-[8.5px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.tinHocFolder}
                      </span>
                      <span className={`block truncate text-[8.5px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {c.congNgheFolder}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* KHỐI 5 */}
          <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
              <span className="flex items-center gap-1 text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Khối 5 ({students.filter(s => classes.find(c => isSameClass(c.id, s.classId))?.grade === 5).length} HS)
              </span>
              <span className="text-[10px] text-slate-500">3 lớp • 6 thư mục</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {classes.filter(c => c.grade === 5).map(c => {
                const isSelected = isSameClass(selectedClassId, c.id);
                const count = students.filter(s => isSameClass(s.classId, c.id)).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleClassSelect(c.id)}
                    className={`p-2 rounded-lg text-center transition cursor-pointer font-bold flex flex-col justify-between min-h-[78px] ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-400'
                        : 'bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 text-xs'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black">{c.name}</div>
                      <div className={`text-[10px] font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {count} HS
                      </div>
                    </div>
                    <div className="mt-1 space-y-0.5 w-full">
                      <span className={`block truncate text-[8.5px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {c.tinHocFolder}
                      </span>
                      <span className={`block truncate text-[8.5px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-teal-700 text-teal-100' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {c.congNgheFolder}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 5. FILTERS & SEARCH TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        
        {/* Search input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo họ tên, mã HS (VD: HS54-01)..."
            className="w-full pl-9 pr-7 py-1.5 text-xs rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-slate-50 focus:bg-white"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown Filters (Bỏ lọc giới tính cho ngắn gọn) */}
        <div className="flex flex-wrap items-center gap-2">

          {/* Computer seat */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-semibold">Máy tính:</span>
            <select
              value={computerFilter}
              onChange={(e: any) => setComputerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Tất cả máy</option>
              <option value="assigned">Đã xếp chỗ</option>
              <option value="unassigned">Chưa xếp chỗ</option>
            </select>
          </div>

          {/* Attendance */}
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-slate-500 font-semibold">Chuyên cần:</span>
            <select
              value={attendanceFilter}
              onChange={(e: any) => setAttendanceFilter(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="present">Có mặt</option>
              <option value="absent">Vắng</option>
            </select>
          </div>

          {/* Quick Mark All Present */}
          {isTeacher && (
            <button
              onClick={handleMarkAllPresent}
              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              title="Đánh dấu tất cả học sinh đang hiển thị là Có mặt"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Điểm danh tất cả</span>
            </button>
          )}

        </div>

      </div>

      {/* 6. BATCH ACTION BAR: HIỂN THỊ KHI CÓ ÍT NHẤT 1 HỌC SINH ĐƯỢC CHỌN (XOÁ 1 LÚC NHIỀU EM) */}
      {selectedStudentIds.length > 0 && isTeacher && (
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-3 rounded-2xl shadow-lg border border-blue-500/40 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 text-white font-black text-xs">
              {selectedStudentIds.length}
            </span>
            <div>
              <div className="font-black text-xs sm:text-sm">
                Đã chọn {selectedStudentIds.length} học sinh
              </div>
              <div className="text-[11px] text-slate-300">
                Thực hiện thao tác hàng loạt cho các học sinh đang chọn
              </div>
            </div>
          </div>

          {/* Bulk buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* NÚT XOÁ HÀNG LOẠT (ĐÁP ỨNG TRỰC TIẾP YÊU CẦU NGƯỜI DÙNG) */}
            <button
              type="button"
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer ring-1 ring-rose-400"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa {selectedStudentIds.length} học sinh đã chọn</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchMarkAttendance('present')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Điểm danh có mặt</span>
            </button>

            <button
              type="button"
              onClick={() => handleBatchMarkAttendance('absent')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Báo vắng</span>
            </button>

            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Bỏ chọn</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. STUDENTS TABLE WITH SELECTION CHECKBOXES & ACTIONS */}
      <div id="student-roster-table" className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white uppercase text-[10px] font-black tracking-wider">
              <tr>
                {/* Ô CHỌN TẤT CẢ (HEADER CHECKBOX) */}
                {isTeacher && (
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllFilteredSelected}
                      ref={el => {
                        if (el) el.indeterminate = isSomeFilteredSelected;
                      }}
                      onChange={handleToggleSelectAll}
                      title="Chọn tất cả học sinh đang hiển thị"
                      className="w-4 h-4 rounded border-white/60 text-blue-600 focus:ring-white cursor-pointer accent-blue-500"
                    />
                  </th>
                )}
                <th className="py-3 px-2 w-10 text-center">STT</th>
                <th className="py-3 px-4">Mã định danh HS</th>
                <th className="py-3 px-4">Họ và tên học sinh</th>
                <th className="py-3 px-3 text-center">Lớp</th>
                <th className="py-3 px-4">Vị trí máy trạm (20 máy)</th>
                <th className="py-3 px-3 text-center">Điểm danh</th>
                <th className="py-3 px-3 text-center">Kết quả học tập</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isTeacher ? 9 : 8} className="py-12 text-center text-slate-400">
                    <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-slate-700 text-sm">Chưa có học sinh nào phù hợp bộ lọc hiện tại</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedClassId !== 'all' 
                        ? `Đang chọn Lớp ${selectedClassId}. Bạn có thể xem toàn trường hoặc khôi phục danh sách mẫu.` 
                        : 'Không có dữ liệu phù hợp với từ khóa hoặc bộ lọc.'}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleClassSelect('all')}
                        className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Xem toàn bộ học sinh ({students.length} HS)</span>
                      </button>
                      {isTeacher && (
                        <button
                          type="button"
                          onClick={handleResetToDefault}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Khôi phục danh sách gốc (249 HS)</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => {
                  const seatInfo = getStudentComputerSeat(st.id);
                  const isPresent = st.attendance !== 'absent';
                  const isChecked = selectedStudentIds.includes(st.id);
                  
                  // Look up student's sample submissions if any
                  const quizSub = INITIAL_QUIZ_SUBMISSIONS.find(q => q.studentId === st.id);
                  const practiceSub = INITIAL_PRACTICE_SUBMISSIONS.find(p => p.studentId === st.id);

                  return (
                    <tr 
                      key={st.id} 
                      onClick={() => setSelectedStudentForModal(st)}
                      className={`hover:bg-blue-50/70 transition cursor-pointer group ${
                        isChecked ? 'bg-blue-50/80 font-medium' : ''
                      }`}
                    >
                      {/* Ô CHỌN TỪNG HỌC SINH (ROW CHECKBOX) */}
                      {isTeacher && (
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleToggleSelectStudent(st.id, e)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                          />
                        </td>
                      )}

                      <td className="py-2.5 px-2 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                        <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                          {st.code}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div 
                            onClick={(e) => {
                              if (isTeacher) {
                                e.stopPropagation();
                                handleToggleStudentGender(st.id);
                              }
                            }}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-xs cursor-pointer ${
                              st.gender === 'female' ? 'bg-pink-500 hover:bg-pink-600' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                            title="Bấm để đổi giới tính Nam ↔ Nữ"
                          >
                            {st.name.charAt(st.name.lastIndexOf(' ') + 1) || st.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="group-hover:text-blue-700 transition">{st.name}</span>
                              {isTeacher && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleStudentGender(st.id);
                                  }}
                                  className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold border transition cursor-pointer flex items-center gap-0.5 ${
                                    st.gender === 'female'
                                      ? 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
                                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                  }`}
                                  title="Bấm để đổi giới tính Nam ↔ Nữ cho học sinh này"
                                >
                                  {st.gender === 'female' ? '👧 Nữ' : '👦 Nam'}
                                </button>
                              )}
                            </div>
                            {st.notes && (
                              <div className="text-[10px] text-slate-400 font-normal truncate max-w-[150px]">
                                {st.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {st.classId}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {seatInfo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <Monitor className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{seatInfo.label}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500">
                            <span>Chưa xếp chỗ</span>
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleAttendance(st.id, e)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                            isPresent 
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300' 
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300'
                          }`}
                          title="Nhấp để đổi trạng thái Có mặt / Vắng"
                        >
                          {isPresent ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Có mặt</span>
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3 text-rose-600" />
                              <span>Vắng</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {quizSub || practiceSub ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                            <Award className="w-3 h-3 text-purple-600" />
                            <span>{quizSub ? `${quizSub.finalScore} đ` : 'Đã nộp bài'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Đang theo học</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedStudentForModal(st)}
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                            title="Xem chi tiết hồ sơ học sinh"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {isTeacher && (
                            <>
                              <button
                                onClick={(e) => handleOpenEdit(st, e)}
                                className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer"
                                title="Chỉnh sửa thông tin học sinh"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              
                              {/* NÚT XOÁ TỪNG NGƯỜI (ĐÁP ỨNG YÊU CẦU NGƯỜI DÙNG) */}
                              <button
                                onClick={() => setStudentToDeleteSingle(st)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                title="Xóa học sinh này khỏi danh sách"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onSelectStudent(st.id)}
                            className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                            title="Xếp vị trí máy tính"
                          >
                            <Monitor className="w-3 h-3" />
                            <span>Xếp máy</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer with summary */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-500 font-medium">
          <div>
            Hiển thị <strong>{filteredStudents.length}</strong> / <strong>{students.length}</strong> học sinh ({selectedClassId === 'all' ? 'Toàn trường' : `Lớp ${selectedClassId}`})
            {selectedStudentIds.length > 0 && (
              <span className="ml-2 font-bold text-blue-700">
                • Đang chọn {selectedStudentIds.length} em
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>GV Quản lý: <strong className="text-blue-900">Cô Nguyễn Thị Huệ</strong></span>
            <span>•</span>
            <span>Phòng Tin học 20 máy</span>
          </div>
        </div>
      </div>

      {/* 8. MODAL XÁC NHẬN XOÁ 1 HỌC SINH */}
      {studentToDeleteSingle && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-600 to-red-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa học sinh</span>
              </h3>
              <button 
                onClick={() => setStudentToDeleteSingle(null)} 
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-950">
                    Bạn có chắc chắn muốn xóa học sinh này khỏi hệ thống?
                  </p>
                  <p className="text-[11px] text-rose-800 mt-1">
                    Nếu học sinh đang được phân công vào máy tính nào trong 20 máy, vị trí máy tính đó sẽ được giải phóng tự động.
                  </p>
                </div>
              </div>

              {/* Student info box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div><strong>Họ và tên:</strong> <span className="font-black text-slate-900">{studentToDeleteSingle.name}</span></div>
                <div><strong>Mã định danh:</strong> <span className="font-mono text-blue-700 font-bold">{studentToDeleteSingle.code}</span></div>
                <div><strong>Lớp:</strong> {studentToDeleteSingle.classId}</div>
                <div><strong>Giới tính:</strong> {studentToDeleteSingle.gender === 'female' ? 'Nữ' : 'Nam'}</div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStudentToDeleteSingle(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteSingle}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa học sinh này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL XÁC NHẬN XOÁ HÀNG LOẠT (NHIỀU HỌC SINH 1 LÚC) */}
      {isBatchDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-rose-700 to-red-800 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa {selectedStudentIds.length} học sinh</span>
              </h3>
              <button 
                onClick={() => setIsBatchDeleteModalOpen(false)} 
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700 overflow-y-auto flex-1">
              <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-950">
                    Cảnh báo xóa hàng loạt: Bạn đang chuẩn bị xóa {selectedStudentIds.length} học sinh!
                  </p>
                  <p className="text-[11px] text-rose-800 mt-1">
                    Tất cả các học sinh được chọn bên dưới sẽ bị xóa vĩnh viễn khỏi danh sách và mọi vị trí máy tính liên quan sẽ được giải phóng.
                  </p>
                </div>
              </div>

              {/* List of students being deleted */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  Danh sách {selectedStudentIds.length} học sinh sẽ bị xóa:
                </label>
                <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50 p-2 space-y-1">
                  {students.filter(s => selectedStudentIds.includes(s.id)).map((st, i) => (
                    <div key={st.id} className="text-[11px] flex items-center justify-between py-1 px-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono w-4">{i + 1}.</span>
                        <span className="font-bold text-slate-900">{st.name}</span>
                        <span className="text-slate-500 font-mono">({st.code})</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                        Lớp {st.classId}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBatchDeleteModalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBatchDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xác nhận xóa {selectedStudentIds.length} học sinh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. MODAL XEM TRƯỚC VÀ XÁC NHẬN NHẬP DỮ LIỆU TỪ EXCEL / CSV (THEO 10 YÊU CẦU NÂNG CẤP) */}
      {isUploadModalOpen && parseResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-emerald-200 overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base uppercase tracking-tight flex items-center gap-2">
                    <span>XEM TRƯỚC & XÁC NHẬN NHẬP DANH SÁCH HỌC SINH TỪ EXCEL</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-emerald-100 mt-0.5">
                    <span>Tệp tin: <strong className="text-white">{uploadedFileName}</strong></span>
                    <span>•</span>
                    <span>Đã nhận diện: <strong>{parseResult.validCount} học sinh</strong></span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsUploadModalOpen(false)} 
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
              
              {/* Highlight KPI & Algorithm Rules */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    <span className="font-black text-emerald-950 uppercase tracking-wide text-xs">
                      Kết quả nhận diện tự động & Ghép họ tên chuẩn tiếng Việt:
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-xs shadow-xs">
                      {parseResult.validCount} học sinh hợp lệ
                    </span>
                    {parseResult.mergedDuplicateCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-xs shadow-xs" title="Học sinh có cùng mã đã được tự động ghép làm 1 hồ sơ duy nhất">
                        Đã khử trùng {parseResult.mergedDuplicateCount} em trùng mã
                      </span>
                    )}
                  </div>
                </div>

                {/* Explanation of Column C + D concatenation and Vietnamese accents */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-emerald-900 bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                  <div className="space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Nhận diện cột: Cột A (STT), Cột B (Mã HS), Cột C (Họ & tên đệm), Cột D (Tên).</span>
                    </div>
                    <div className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Ghép chuẩn: <code>[Họ & tên đệm] + [Tên] → [HỌ VÀ TÊN HỌC SINH]</code></span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-slate-700">
                      <strong>Ví dụ ghép:</strong> Võ Nguyễn Khánh + An → <strong className="text-emerald-800">Võ Nguyễn Khánh An</strong>; Trương Nguyễn Minh + Anh → <strong className="text-emerald-800">Trương Nguyễn Minh Anh</strong>; Hồ Gia + Bảo → <strong className="text-emerald-800">Hồ Gia Bảo</strong>
                    </div>
                    <div className="font-semibold text-emerald-800">
                      ✓ Giữ nguyên 100% dấu tiếng Việt, không đảo thứ tự họ tên, không mất vị trí máy tính hay điểm số đã có.
                    </div>
                  </div>
                </div>
              </div>

              {/* Import Options (Target Class & Mode) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nhập vào lớp:
                  </label>
                  <select
                    value={importTargetClass}
                    onChange={(e) => setImportTargetClass(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value="auto">
                      ✓ Tự động nhận diện theo từng Sheet / Cột Lớp trong file ({parseResult.detectedClasses.join(', ') || 'Đa lớp'})
                    </option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Chế độ nạp dữ liệu:
                  </label>
                  <select
                    value={importMode}
                    onChange={(e: any) => setImportMode(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 bg-white font-bold text-xs focus:border-emerald-500 outline-none"
                  >
                    <option value="append">Cập nhật & Bổ sung (Khuyên dùng - Bảo lưu vị trí máy & điểm số đã có)</option>
                    <option value="overwrite">Ghi đè danh sách lớp được chọn</option>
                  </select>
                </div>
              </div>

              {/* Preview Table (Requirement 7: STT, Mã học sinh, Họ và tên đầy đủ, Lớp, Giới tính) */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="font-black text-slate-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <span>Bảng xem trước dữ liệu ({parseResult.rows.length} học sinh):</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                      {parseResult.rows.filter(r => r.gender === 'male').length} Nam
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 border border-pink-200">
                      {parseResult.rows.filter(r => r.gender === 'female').length} Nữ
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Bấm nút <strong>👦 Nam / 👧 Nữ</strong> để đổi giới tính trực tiếp nếu cần
                  </span>
                </div>

                <div className="border-2 border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto shadow-xs">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 sticky top-0 uppercase text-[10px] tracking-wider z-10">
                      <tr>
                        <th className="p-2.5 w-12 text-center bg-slate-100">STT</th>
                        <th className="p-2.5 w-28 bg-slate-100">Mã HS (Cột B)</th>
                        <th className="p-2.5 bg-slate-100">Họ và tên đầy đủ (Ghép C + D)</th>
                        <th className="p-2.5 text-center w-20 bg-slate-100">Lớp</th>
                        <th className="p-2.5 text-center w-28 bg-slate-100">Giới tính (Sửa)</th>
                        <th className="p-2.5 bg-slate-100">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parseResult.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-blue-50/60 transition">
                          <td className="p-2.5 text-center font-bold text-slate-400">{row.stt}</td>
                          <td className="p-2.5 font-mono font-bold text-blue-700">
                            <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200">
                              {row.code}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-900 font-black">{row.name}</span>
                              {row.lastNameMiddle && row.firstName && (
                                <span className="text-[9.5px] text-slate-400 font-normal">
                                  ({row.lastNameMiddle} + {row.firstName})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              {importTargetClass === 'auto' ? row.classId : importTargetClass}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const nextGender = row.gender === 'female' ? 'male' : 'female';
                                const updatedRows = [...parseResult.rows];
                                updatedRows[i] = { ...row, gender: nextGender };
                                setParseResult({ ...parseResult, rows: updatedRows });
                              }}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                                row.gender === 'female'
                                  ? 'bg-pink-50 border-pink-200 text-pink-700 hover:bg-pink-100'
                                  : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                              }`}
                              title="Bấm để đổi giới tính Nam ↔ Nữ cho học sinh này trước khi nạp"
                            >
                              {row.gender === 'female' ? '👧 Nữ' : '👦 Nam'}
                            </button>
                          </td>
                          <td className="p-2.5 text-slate-500 truncate max-w-[200px]">{row.notes || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer (Requirement 8: Chỉ lưu khi bấm "XÁC NHẬN NHẬP DANH SÁCH") */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Hủy bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmImport}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-black text-xs flex items-center gap-2 transition cursor-pointer shadow-lg hover:shadow-xl ring-2 ring-emerald-400"
              >
                <Check className="w-4 h-4" />
                <span>XÁC NHẬN NHẬP DANH SÁCH ({parseResult.validCount} HỌC SINH)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 11. MODAL: CHI TIẾT HỒ SƠ HỌC SINH */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-blue-200 overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black text-white shadow-md ${
                  selectedStudentForModal.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'
                }`}>
                  {selectedStudentForModal.name.charAt(selectedStudentForModal.name.lastIndexOf(' ') + 1) || selectedStudentForModal.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">
                    {selectedStudentForModal.name}
                  </h3>
                  <p className="text-xs text-blue-200 font-medium">
                    Mã HS: <strong>{selectedStudentForModal.code}</strong> • Lớp: <strong>{selectedStudentForModal.classId}</strong> • {selectedStudentForModal.gender === 'female' ? 'Nữ sinh' : 'Nam sinh'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
              
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    Thông tin Lớp học & Giáo viên
                  </span>
                  <div><strong>Trường:</strong> Tiểu học Đồng Dương</div>
                  <div><strong>Lớp:</strong> {selectedStudentForModal.classId}</div>
                  <div><strong>GV Chủ nhiệm:</strong> {classes.find(c => c.id === selectedStudentForModal.classId)?.homeroomTeacher || 'Chưa cập nhật'}</div>
                  <div><strong>GV Quản lý Tin học:</strong> <span className="text-blue-900 font-bold">Cô Nguyễn Thị Huệ</span></div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block">
                    Vị trí máy trạm & Chuyên cần
                  </span>
                  <div>
                    <strong>Chỗ ngồi: </strong>
                    {getStudentComputerSeat(selectedStudentForModal.id)?.label || 'Chưa xếp máy trong tiết này'}
                  </div>
                  <div>
                    <strong>Chuyên cần: </strong>
                    <span className={`font-bold ${selectedStudentForModal.attendance === 'absent' ? 'text-rose-600' : 'text-emerald-700'}`}>
                      {selectedStudentForModal.attendance === 'absent' ? 'Vắng mặt' : 'Có mặt thường xuyên'}
                    </span>
                  </div>
                  <div><strong>Trạng thái tài khoản:</strong> Đã cấp mã thẻ thực hành</div>
                </div>
              </div>

              {/* Learning Results Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Kết quả học tập & Đánh giá môn Tin học</span>
                </h4>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block">Bài tập Lý thuyết (Trắc nghiệm):</span>
                      <span className="text-[11px] text-slate-500">Bộ câu hỏi kiến thức nền tảng</span>
                    </div>
                    {INITIAL_QUIZ_SUBMISSIONS.find(q => q.studentId === selectedStudentForModal.id) ? (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
                        {INITIAL_QUIZ_SUBMISSIONS.find(q => q.studentId === selectedStudentForModal.id)?.finalScore}/10 Điểm
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Chưa có bài nộp</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 block">Sản phẩm số HS (Bài thực hành):</span>
                      <span className="text-[11px] text-slate-500">Soạn thảo Word, Vẽ Paint, Scratch</span>
                    </div>
                    {INITIAL_PRACTICE_SUBMISSIONS.find(p => p.studentId === selectedStudentForModal.id) ? (
                      <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-black text-xs">
                        {INITIAL_PRACTICE_SUBMISSIONS.find(p => p.studentId === selectedStudentForModal.id)?.finalScore ?? 9}/10 Điểm (Đạt)
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Đang thực hiện</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 block">Mức độ hoàn thành môn học (Thông tư 27):</span>
                      <span className="text-[11px] text-slate-500">Đánh giá quá trình rèn luyện</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-bold text-xs">
                      Hoàn thành tốt (T)
                    </span>
                  </div>
                </div>
              </div>

              {/* Teacher Notes */}
              {selectedStudentForModal.notes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="font-bold text-amber-900 block mb-1">Ghi chú rèn luyện:</span>
                  <p className="text-amber-800 text-xs italic">{selectedStudentForModal.notes}</p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const id = selectedStudentForModal.id;
                  setSelectedStudentForModal(null);
                  onSelectStudent(id);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Monitor className="w-4 h-4" />
                <span>Chuyển tới sơ đồ máy tính</span>
              </button>

              <button
                onClick={() => setSelectedStudentForModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 12. MODAL: THÊM HỌC SINH MỚI */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Thêm học sinh mới vào lớp</span>
              </h3>
              <button onClick={() => setIsAddStudentOpen(false)} className="text-white hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên học sinh (*)</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Hoàng Anh"
                  className="w-full p-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp (*)</label>
                  <select
                    value={newStudentClassId}
                    onChange={(e) => setNewStudentClassId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-xs font-semibold"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính (*)</label>
                  <select
                    value={newStudentGender}
                    onChange={(e: any) => setNewStudentGender(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-xs font-semibold"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú (Tùy chọn)</label>
                <input
                  type="text"
                  value={newStudentNotes}
                  onChange={(e) => setNewStudentNotes(e.target.value)}
                  placeholder="Ví dụ: Tiếp thu nhanh, có máy tính tại nhà..."
                  className="w-full p-2 rounded-xl border border-slate-300 focus:border-emerald-500 outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Thêm học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. MODAL: CHỈNH SỬA THÔNG TIN HỌC SINH */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                <span>Chỉnh sửa thông tin: {editingStudent.code}</span>
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-white hover:text-slate-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên học sinh (*)</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Lớp</label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-xs font-semibold"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={editGender}
                    onChange={(e: any) => setEditGender(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-xs font-semibold"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Chuyên cần</label>
                <select
                  value={editAttendance}
                  onChange={(e: any) => setEditAttendance(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-xs font-semibold"
                >
                  <option value="present">Có mặt</option>
                  <option value="absent">Vắng mặt</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú rèn luyện</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ghi chú về học sinh..."
                  className="w-full p-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl transition cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 14. MODAL: IN & XUẤT DANH SÁCH HỌC SINH */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>Bản xem trước & In danh sách học sinh</span>
              </h3>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-white hover:text-slate-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 font-serif text-slate-800 text-xs">
              <div className="text-center space-y-1 mb-5">
                <div className="font-bold uppercase text-[11px] tracking-wide text-slate-600">PHÒNG GIÁO DỤC VÀ ĐÀO TẠO • TRƯỜNG TIỂU HỌC ĐỒNG DƯƠNG</div>
                <div className="text-base font-bold uppercase tracking-tight text-blue-950">
                  {selectedClassId === 'all' 
                    ? `DANH SÁCH ${students.length} HỌC SINH PHÒNG TIN HỌC NĂM HỌC 2026 - 2027` 
                    : `DANH SÁCH HỌC SINH LỚP ${selectedClassId} – PHÒNG MÁY TIN HỌC`}
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  (Giáo viên Quản lý & Phụ trách bộ môn: Cô Nguyễn Thị Huệ)
                </div>
              </div>

              <table className="w-full border-collapse border border-slate-400 text-left text-[11px]">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="border border-slate-400 p-2 text-center w-10">STT</th>
                    <th className="border border-slate-400 p-2 w-24">Mã HS</th>
                    <th className="border border-slate-400 p-2">Họ và tên</th>
                    <th className="border border-slate-400 p-2 text-center w-16">Lớp</th>
                    <th className="border border-slate-400 p-2 text-center w-16">Giới tính</th>
                    <th className="border border-slate-400 p-2 w-32">Vị trí máy trạm</th>
                    <th className="border border-slate-400 p-2 text-center w-20">Ký nhận</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((st, i) => (
                    <tr key={st.id}>
                      <td className="border border-slate-400 p-1.5 text-center">{i + 1}</td>
                      <td className="border border-slate-400 p-1.5 font-mono">{st.code}</td>
                      <td className="border border-slate-400 p-1.5 font-bold">{st.name}</td>
                      <td className="border border-slate-400 p-1.5 text-center">{st.classId}</td>
                      <td className="border border-slate-400 p-1.5 text-center">{st.gender === 'female' ? 'Nữ' : 'Nam'}</td>
                      <td className="border border-slate-400 p-1.5">{getStudentComputerSeat(st.id)?.label || '-'}</td>
                      <td className="border border-slate-400 p-1.5"></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 flex justify-between text-xs pt-4">
                <div className="text-center">
                  <div className="font-bold">BAN GIÁM HIỆU</div>
                  <div className="italic text-slate-500">(Ký và ghi rõ họ tên)</div>
                </div>
                <div className="text-center">
                  <div className="italic text-slate-500">Đồng Dương, ngày {new Date().toLocaleDateString('vi-VN')}</div>
                  <div className="font-bold uppercase mt-1">GIÁO VIÊN BỘ MÔN TIN HỌC</div>
                  <div className="font-black text-blue-900 mt-12">Cô Nguyễn Thị Huệ</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Tiến hành In (Print)</span>
              </button>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
