import { 
  AssignmentHistoryRecord, 
  ClassAssignments, 
  ComputerSlot, 
  DatabaseStatus, 
  Student 
} from '../types/classroom';
import { 
  CLASSES_DATA, 
  INITIAL_STUDENTS, 
  TOTAL_COMPUTERS, 
  TOTAL_STUDENTS, 
  TOTAL_CLASSES,
  isSameClass,
  canonicalClassId,
  inferVietnameseGender
} from '../data/initialData';

const STORAGE_KEY_STUDENTS = 'smart_ict_students_v1';
const STORAGE_KEY_ASSIGNMENTS = 'smart_ict_assignments_v1';
const STORAGE_KEY_COMPUTERS = 'smart_ict_computers_v1';
const STORAGE_KEY_BROKEN_COMPUTERS = 'smart_ict_broken_computers_v1';
const STORAGE_KEY_CLASS_TEMPLATES = 'smart_ict_class_templates_v1';

// Check if localStorage is available and operational
export function checkStorageHealth(): { isHealthy: boolean; error?: string } {
  try {
    const testKey = '__test_ict_storage__';
    window.localStorage.setItem(testKey, '1');
    const read = window.localStorage.getItem(testKey);
    window.localStorage.removeItem(testKey);
    return { isHealthy: read === '1' };
  } catch (e: any) {
    return { 
      isHealthy: false, 
      error: e?.message || 'Trình duyệt đang chặn LocalStorage hoặc đang ở chế độ bảo mật riêng tư.' 
    };
  }
}

// ==========================================
// 1. BROKEN COMPUTERS MANAGEMENT
// ==========================================
export function getBrokenComputers(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BROKEN_COMPUTERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(Number).filter(n => n >= 1 && n <= TOTAL_COMPUTERS);
    }
  } catch (e) {
    console.warn('Could not read broken computers from localStorage', e);
  }
  return [];
}

export function saveBrokenComputers(brokenList: number[]): void {
  const cleanList = Array.from(new Set(brokenList.map(Number))).filter(n => n >= 1 && n <= TOTAL_COMPUTERS);
  try {
    localStorage.setItem(STORAGE_KEY_BROKEN_COMPUTERS, JSON.stringify(cleanList));
  } catch (e) {
    console.error('Failed to save broken computers to localStorage', e);
  }

  // Also sync with server in background
  fetch('/api/classroom/broken-computers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brokenComputers: cleanList }),
  }).catch(() => {
    // offline silent fallback
  });
}

export function toggleComputerBroken(computerId: number): number[] {
  const current = getBrokenComputers();
  const exists = current.includes(computerId);
  const updated = exists ? current.filter(id => id !== computerId) : [...current, computerId];
  saveBrokenComputers(updated);
  return updated;
}

// ==========================================
// 2. STUDENTS ROSTER STORAGE (LOCAL + SERVER SYNC)
// ==========================================
export function getStoredStudents(): Student[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Kiểm tra xem bộ nhớ cục bộ có chứa dữ liệu mẫu giả định trước đây (Nguyễn Văn An,...) không
        const isOldMockData = parsed.some(s => s.name === 'Nguyễn Văn An' || s.name === 'Trần Văn Bảo' || s.name === 'Lê Thị Anh');
        if (isOldMockData) {
          console.log('[Storage] Phát hiện dữ liệu giả định cũ trong trình duyệt. Tự động nâng cấp lên 249 học sinh chính thức!');
          saveStoredStudents(INITIAL_STUDENTS);
          return INITIAL_STUDENTS;
        }

        // 1. Chuẩn hóa mã lớp và tự động sửa giới tính theo họ tên nếu trước đó bị mặc định sai
        const normalizedList: Student[] = parsed.map((s: Student) => {
          const validClass = canonicalClassId(s.classId || s.code, '3.4');
          const inferred = inferVietnameseGender(s.name);
          // Nếu giới tính bị gán nhầm là male mà tên rõ ràng là nữ (VD có chữ 'Thị', Linh Đan, Bảo Ngân...)
          const gender = s.gender === 'male' && inferred === 'female' ? 'female' : (s.gender || inferred);
          return {
            ...s,
            classId: validClass,
            gender
          };
        });

        // 2. Bảo toàn đủ 9 lớp (249 học sinh) của nhà trường
        let mergedList = [...normalizedList];
        let hasChanges = false;

        CLASSES_DATA.forEach(cls => {
          const hasClass = mergedList.some(s => isSameClass(s.classId, cls.id));
          if (!hasClass) {
            hasChanges = true;
            const fallbackStudents = INITIAL_STUDENTS.filter(s => isSameClass(s.classId, cls.id));
            mergedList.push(...fallbackStudents);
          }
        });

        if (hasChanges || JSON.stringify(mergedList) !== raw) {
          saveStoredStudents(mergedList);
        }
        return mergedList;
      }
    }
  } catch (e) {
    console.warn('Could not read students from localStorage, initializing fresh data', e);
  }
  // Initialize and persist authentic 249 students across 9 classes
  saveStoredStudents(INITIAL_STUDENTS);
  return INITIAL_STUDENTS;
}

/**
 * Đồng bộ danh sách học sinh: Lưu vào LocalStorage VÀ lưu ngay lên Server để khi share link / đổi máy vẫn giữ nguyên
 */
export async function saveStoredStudents(students: Student[]): Promise<boolean> {
  try {
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
  } catch (e) {
    console.error('Failed to save students to localStorage', e);
  }

  // Gửi lên server API để lưu vĩnh viễn vào tệp /.data/students.json
  try {
    const res = await fetch('/api/classroom/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students }),
    });
    return res.ok;
  } catch (err) {
    console.warn('Could not sync students to server:', err);
    return false;
  }
}

/**
 * Lấy danh sách học sinh từ Server (dùng khi share link qua email hoặc mở trên máy khác)
 */
export async function fetchStudentsFromServer(): Promise<Student[] | null> {
  try {
    const res = await fetch('/api/classroom/students');
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && Array.isArray(data.students) && data.students.length > 0) {
      const normalized: Student[] = data.students.map((s: Student) => {
        const validClass = canonicalClassId(s.classId || s.code, '3.4');
        const inferred = inferVietnameseGender(s.name);
        const gender = s.gender === 'male' && inferred === 'female' ? 'female' : (s.gender || inferred);
        return {
          ...s,
          classId: validClass,
          gender
        };
      });

      // Kiểm tra nếu dữ liệu server trả về chứa tên giả định cũ, lập tức ghi đè bằng INITIAL_STUDENTS chính thức
      const hasMock = normalized.some(s => s.name === 'Nguyễn Văn An' || s.name === 'Trần Văn Bảo' || s.name === 'Lê Thị Anh');
      if (hasMock) {
        console.log('[Storage] Server chứa dữ liệu giả cũ, đồng bộ ngay 249 học sinh chính thức lên server...');
        saveStoredStudents(INITIAL_STUDENTS);
        return INITIAL_STUDENTS;
      }

      // Bảo toàn đủ 9 lớp (249 học sinh)
      let merged = [...normalized];
      let hasChanges = false;
      CLASSES_DATA.forEach(cls => {
        const hasClass = merged.some(s => isSameClass(s.classId, cls.id));
        if (!hasClass) {
          hasChanges = true;
          const fallbackStudents = INITIAL_STUDENTS.filter(s => isSameClass(s.classId, cls.id));
          merged.push(...fallbackStudents);
        }
      });

      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(merged));
      if (hasChanges) {
        saveStoredStudents(merged);
      }
      return merged;
    }
  } catch (err) {
    console.warn('Could not fetch students from server:', err);
  }
  return null;
}

/**
 * Tự động chuẩn hóa giới tính theo từ điển tên tiếng Việt cho danh sách học sinh
 */
export function autoFixStudentGenders(students: Student[]): { updatedStudents: Student[]; changedCount: number } {
  let changedCount = 0;
  const updatedStudents = students.map(s => {
    const inferred = inferVietnameseGender(s.name);
    if (s.gender !== inferred) {
      changedCount++;
      return { ...s, gender: inferred };
    }
    return s;
  });
  if (changedCount > 0) {
    saveStoredStudents(updatedStudents);
  }
  return { updatedStudents, changedCount };
}

export function resetStoredStudentsToDefault(): Student[] {
  saveStoredStudents(INITIAL_STUDENTS);
  return INITIAL_STUDENTS;
}

// ==========================================
// 3. CLASS MASTER TEMPLATES (SƠ ĐỒ RIÊNG TỪNG LỚP)
// ==========================================
export function getClassMasterTemplates(): Record<string, ClassAssignments> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLASS_TEMPLATES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read class templates from storage', e);
  }
  return {};
}

export function getClassMasterTemplate(classId: string): ClassAssignments | null {
  const templates = getClassMasterTemplates();
  return templates[classId] || null;
}

export function saveClassMasterTemplate(classId: string, assignments: ClassAssignments): void {
  try {
    const templates = getClassMasterTemplates();
    templates[classId] = assignments;
    localStorage.setItem(STORAGE_KEY_CLASS_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error(`Failed to save template for class ${classId}`, e);
  }
}

// ==========================================
// 4. ASSIGNMENT HISTORY & SESSION RECORDS
// ==========================================
export function getAllAssignmentRecords(): Record<string, AssignmentHistoryRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read assignments from storage', e);
  }
  return {};
}

export function makeRecordId(classId: string, date: string, session: string, periodNumber: number): string {
  const safeClass = classId.replace('/', '-');
  return `${safeClass}_${date}_${session}_P${periodNumber}`;
}

// Load assignment for a specific class and period
export function loadClassAssignment(
  classId: string, 
  date: string, 
  session: 'morning' | 'afternoon', 
  periodNumber: number
): { assignments: ClassAssignments; lessonName?: string; updatedAt?: string; isPersisted: boolean } {
  const records = getAllAssignmentRecords();
  const key = makeRecordId(classId, date, session, periodNumber);
  const found = records[key];

  if (found && found.assignments) {
    return {
      assignments: found.assignments,
      lessonName: found.lessonName,
      updatedAt: found.updatedAt,
      isPersisted: true,
    };
  }

  // Fallback 1: Class Master Template saved specifically for this class
  const classTemplate = getClassMasterTemplate(classId);
  if (classTemplate) {
    return {
      assignments: classTemplate,
      lessonName: `Tiết thực hành Tin học - Lớp ${classId}`,
      updatedAt: 'Sơ đồ mặc định của lớp',
      isPersisted: true,
    };
  }

  // Fallback 2: Check any previous assignment for this class
  const classKeys = Object.keys(records).filter(k => k.startsWith(`${classId.replace('/', '-')}_`));
  if (classKeys.length > 0) {
    const latestKey = classKeys[classKeys.length - 1];
    return {
      assignments: records[latestKey].assignments,
      lessonName: records[latestKey].lessonName || `Tiết thực hành Tin học - Lớp ${classId}`,
      updatedAt: records[latestKey].updatedAt,
      isPersisted: false,
    };
  }

  // Fallback 3: Automatically generate standard seating for this class
  const allStudents = getStoredStudents();
  const classStudents = allStudents.filter(s => isSameClass(s.classId, classId));
  if (classStudents.length > 0) {
    const generated = autoAssignStudents(classStudents, 'standard');
    saveClassMasterTemplate(classId, generated);
    return {
      assignments: generated,
      lessonName: `Tiết thực hành Tin học - Lớp ${classId}`,
      updatedAt: 'Khởi tạo tự động',
      isPersisted: false,
    };
  }

  // Empty slots
  const emptyAssignments: ClassAssignments = {};
  for (let i = 1; i <= TOTAL_COMPUTERS; i++) {
    emptyAssignments[i] = { studentAId: null, studentBId: null };
  }

  return {
    assignments: emptyAssignments,
    lessonName: `Bài học Tin học thực hành - Lớp ${classId}`,
    isPersisted: false,
  };
}

// Save assignment with strict validation and verification
export function saveClassAssignment(
  classId: string,
  date: string,
  session: 'morning' | 'afternoon',
  periodNumber: number,
  assignments: ClassAssignments,
  lessonName: string = 'Tiết học thực hành Tin học'
): { success: boolean; message: string; recordId: string } {
  const health = checkStorageHealth();
  if (!health.isHealthy) {
    return {
      success: false,
      message: `Cảnh báo: Chưa có cơ sở dữ liệu hoạt động (${health.error}). Vui lòng kiểm tra quyền lưu trữ của trình duyệt!`,
      recordId: '',
    };
  }

  // Validate: No duplicate student in this lesson
  const seenStudents = new Set<string>();
  const brokenList = getBrokenComputers();

  for (let compId = 1; compId <= TOTAL_COMPUTERS; compId++) {
    const slot = assignments[compId];
    if (!slot) continue;

    // Check if broken computer has students
    if (brokenList.includes(compId) && (slot.studentAId || slot.studentBId)) {
      return {
        success: false,
        message: `Lỗi: Máy tính PC${compId < 10 ? '0' + compId : compId} đang báo hỏng/bảo trì, không thể xếp học sinh vào máy này!`,
        recordId: '',
      };
    }
    
    if (slot.studentAId) {
      if (seenStudents.has(slot.studentAId)) {
        return {
          success: false,
          message: `Lỗi: Học sinh ${slot.studentAId} bị phân công trùng vào nhiều máy tính trong cùng một tiết học!`,
          recordId: '',
        };
      }
      seenStudents.add(slot.studentAId);
    }

    if (slot.studentBId) {
      if (seenStudents.has(slot.studentBId)) {
        return {
          success: false,
          message: `Lỗi: Học sinh ${slot.studentBId} bị phân công trùng vào nhiều máy tính trong cùng một tiết học!`,
          recordId: '',
        };
      }
      seenStudents.add(slot.studentBId);
    }
  }

  try {
    const records = getAllAssignmentRecords();
    const key = makeRecordId(classId, date, session, periodNumber);
    const now = new Date().toLocaleString('vi-VN');

    records[key] = {
      id: key,
      classId,
      date,
      session,
      periodNumber,
      lessonName,
      assignments,
      brokenComputers: brokenList,
      updatedAt: now,
      savedByTeacher: 'Giáo viên Tin học',
    };

    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(records));

    // Also update class master template so switching back to this class recalls the chart
    saveClassMasterTemplate(classId, assignments);

    // Sync to server API in background
    fetch(`/api/classroom/seating/${encodeURIComponent(classId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assignments,
        lessonName,
        brokenComputers: brokenList,
      }),
    }).catch(() => {});

    return {
      success: true,
      message: `Đã lưu thành công sơ đồ phân công riêng cho Lớp ${classId} (Tiết ${periodNumber}) lúc ${now}.`,
      recordId: key,
    };
  } catch (e: any) {
    return {
      success: false,
      message: `Lỗi lưu trữ: ${e?.message || 'Không thể ghi vào bộ nhớ.'}`,
      recordId: '',
    };
  }
}

// ==========================================
// 5. AUTO-ASSIGNMENT & REASSIGNMENT ON BROKEN COMPUTERS
// ==========================================
export function autoAssignStudents(
  students: Student[],
  strategy: 'standard' | 'gender_balanced' | 'random' = 'standard',
  brokenComputers: number[] = []
): ClassAssignments {
  let eligible = students.filter(s => s.attendance !== 'absent');
  if (eligible.length === 0) {
    eligible = [...students];
  }

  if (strategy === 'random') {
    eligible = [...eligible].sort(() => Math.random() - 0.5);
  } else if (strategy === 'gender_balanced') {
    const boys = eligible.filter(s => s.gender === 'male');
    const girls = eligible.filter(s => s.gender === 'female');
    const interleaved: Student[] = [];
    const maxLen = Math.max(boys.length, girls.length);
    for (let i = 0; i < maxLen; i++) {
      if (boys[i]) interleaved.push(boys[i]);
      if (girls[i]) interleaved.push(girls[i]);
    }
    eligible = interleaved;
  } else {
    eligible = [...eligible].sort((a, b) => (a.seatNumber || 0) - (b.seatNumber || 0));
  }

  const result: ClassAssignments = {};
  for (let i = 1; i <= TOTAL_COMPUTERS; i++) {
    result[i] = { studentAId: null, studentBId: null };
  }

  // Only allocate to working computers
  const workingComps = Array.from({ length: TOTAL_COMPUTERS }, (_, i) => i + 1)
    .filter(id => !brokenComputers.includes(id));

  let studentIdx = 0;
  const count = eligible.length;

  // Pass 1: Slot A for each operational computer
  for (const compId of workingComps) {
    if (studentIdx < count) {
      result[compId].studentAId = eligible[studentIdx].id;
      studentIdx++;
    }
  }

  // Pass 2: Slot B for operational computers if more students remain
  for (const compId of workingComps) {
    if (studentIdx < count) {
      result[compId].studentBId = eligible[studentIdx].id;
      studentIdx++;
    }
  }

  return result;
}

// Smart Reassignment when a computer breaks during class
export function reassignDisplacedStudentsFromBrokenComputers(
  assignments: ClassAssignments,
  brokenComputers: number[],
  classStudents: Student[]
): {
  success: boolean;
  newAssignments: ClassAssignments;
  displacedCount: number;
  unassignedCount: number;
  message: string;
} {
  const newAssignments: ClassAssignments = JSON.parse(JSON.stringify(assignments));
  const displacedStudentIds: string[] = [];

  // Remove students from broken computers
  for (const brokenId of brokenComputers) {
    const slot = newAssignments[brokenId];
    if (slot) {
      if (slot.studentAId) {
        displacedStudentIds.push(slot.studentAId);
        slot.studentAId = null;
      }
      if (slot.studentBId) {
        displacedStudentIds.push(slot.studentBId);
        slot.studentBId = null;
      }
    }
  }

  if (displacedStudentIds.length === 0) {
    return {
      success: true,
      newAssignments,
      displacedCount: 0,
      unassignedCount: 0,
      message: 'Không có học sinh nào bị ảnh hưởng bởi máy hỏng.',
    };
  }

  // Find operational computers with empty Slot A or Slot B
  const workingComps = Array.from({ length: TOTAL_COMPUTERS }, (_, i) => i + 1)
    .filter(id => !brokenComputers.includes(id));

  const maxCapacity = workingComps.length * 2;
  const totalStudents = classStudents.length;

  let remainingDisplaced = [...displacedStudentIds];

  // Try to fill empty Slot A first on working computers
  for (const compId of workingComps) {
    if (remainingDisplaced.length === 0) break;
    const slot = newAssignments[compId] || { studentAId: null, studentBId: null };
    if (!slot.studentAId) {
      slot.studentAId = remainingDisplaced.shift()!;
      newAssignments[compId] = slot;
    }
  }

  // Try to fill empty Slot B on working computers
  for (const compId of workingComps) {
    if (remainingDisplaced.length === 0) break;
    const slot = newAssignments[compId] || { studentAId: null, studentBId: null };
    if (!slot.studentBId) {
      slot.studentBId = remainingDisplaced.shift()!;
      newAssignments[compId] = slot;
    }
  }

  if (remainingDisplaced.length > 0) {
    return {
      success: false,
      newAssignments,
      displacedCount: displacedStudentIds.length,
      unassignedCount: remainingDisplaced.length,
      message: `Cảnh báo: Hiện chỉ còn ${workingComps.length} máy hoạt động (tối đa ${maxCapacity} chỗ). Lớp có ${totalStudents} học sinh, còn thiếu ${remainingDisplaced.length} chỗ ngồi! Tuyệt đối không xếp quá 2 học sinh/máy. Giáo viên cần bố trí thêm máy hoặc luân phiên!`,
    };
  }

  return {
    success: true,
    newAssignments,
    displacedCount: displacedStudentIds.length,
    unassignedCount: 0,
    message: `Đã tự động chuyển thành công ${displacedStudentIds.length} học sinh từ máy hỏng sang các máy còn chỗ trống (tối đa 2 HS/máy).`,
  };
}

// ==========================================
// 6. DATABASE DIAGNOSTICS & STATUS
// ==========================================
export function getDatabaseDiagnosticStatus(): DatabaseStatus {
  const health = checkStorageHealth();
  const students = getStoredStudents();
  const records = getAllAssignmentRecords();
  const recordsList = Object.values(records);

  const lastSync = recordsList.length > 0 
    ? recordsList[recordsList.length - 1].updatedAt 
    : 'Chưa có bản ghi mới';

  return {
    isActive: health.isHealthy,
    type: 'ServerREST',
    totalClasses: CLASSES_DATA.length,
    totalStudents: students.length,
    totalComputers: TOTAL_COMPUTERS,
    savedRecordsCount: recordsList.length,
    lastSyncTime: lastSync,
    integrityVerified: health.isHealthy && students.length === 249 && CLASSES_DATA.length === 9,
    message: 'Hệ thống đã kích hoạt CSDL dùng chung (Server REST API & File Persistence) kết hợp bộ nhớ đệm LocalStorage.',
  };
}

// ==========================================
// 7. SEED DEFAULT SEATING FOR ALL 9 CLASSES
// ==========================================
export function seedDefaultAssignmentsIfEmpty(todayStr: string) {
  const templates = getClassMasterTemplates();
  const students = getStoredStudents();

  // Ensure every class of the 9 classes has a distinct seating chart
  CLASSES_DATA.forEach((cls) => {
    if (!templates[cls.id]) {
      const classStudents = students.filter(s => s.classId === cls.id);
      const assigned = autoAssignStudents(classStudents, 'standard');
      saveClassMasterTemplate(cls.id, assigned);

      // Save for today's periods as well
      for (let p = 1; p <= 5; p++) {
        saveClassAssignment(
          cls.id,
          todayStr,
          'morning',
          p,
          assigned,
          `Thực hành Tin học: Luyện gõ phím & Khám phá phần mềm (Lớp ${cls.id})`
        );
      }
    }
  });
}
