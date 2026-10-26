import * as XLSX from 'xlsx';

export interface StudentAccountRow {
  stt: number;
  id: string;
  code: string;
  name: string;
  classId: string;
  seatNumber: number;
  gender: string;
  assignedPc: string;
  assignedPcId: number | null;
  assignedSlot?: 'A' | 'B' | null;
  hasPin: boolean;
  mustChangePinOnFirstLogin: boolean;
  pinUpdatedAt: string | null;
  pinResetCount: number;
  newTempPin?: string; // Only available immediately after a reset in current session
}

const TEACHER_TOKEN_STORAGE_KEY = 'smart_ict_teacher_token';

export function getTeacherToken(): string | null {
  try {
    return sessionStorage.getItem(TEACHER_TOKEN_STORAGE_KEY) || localStorage.getItem(TEACHER_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setTeacherToken(token: string | null): void {
  try {
    if (token) {
      sessionStorage.setItem(TEACHER_TOKEN_STORAGE_KEY, token);
      localStorage.setItem(TEACHER_TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TEACHER_TOKEN_STORAGE_KEY);
      localStorage.removeItem(TEACHER_TOKEN_STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Cannot save teacher token to storage:', e);
  }
}

export async function loginTeacher(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/teacher-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setTeacherToken(data.token);
      return { success: true, token: data.token };
    }
    return { success: false, error: data.error || 'Mật khẩu Giáo viên không chính xác!' };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Không thể kết nối máy chủ xác thực giáo viên' };
  }
}

function getTeacherAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-teacher-role': 'teacher',
    'x-user-role': 'teacher',
  };
  const token = getTeacherToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-teacher-token'] = token;
  }
  return headers;
}

// 1. Fetch Student Accounts for Admin
export async function fetchStudentAccounts(classId?: string): Promise<{
  success: boolean;
  accounts: StudentAccountRow[];
  totalCount: number;
  error?: string;
  requiresAuth?: boolean;
}> {
  try {
    const url = `/api/admin/student-accounts?classId=${encodeURIComponent(classId || 'all')}&role=teacher`;
    const res = await fetch(url, {
      headers: getTeacherAuthHeaders(),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        accounts: [],
        totalCount: 0,
        error: err.error || (res.status === 401 ? 'Yêu cầu quyền Giáo viên để xem danh sách tài khoản' : `Lỗi máy chủ (${res.status})`),
        requiresAuth: err.requiresAuth || res.status === 401,
      };
    }

    const data = await res.json();
    return {
      success: true,
      accounts: data.accounts || [],
      totalCount: data.totalCount || 0,
    };
  } catch (err: any) {
    return {
      success: false,
      accounts: [],
      totalCount: 0,
      error: err?.message || 'Không thể kết nối máy chủ quản trị',
    };
  }
}

// 2. Reset single student PIN (Yêu cầu 3 & 4: bcrypt, salt riêng, lưu student_credentials)
export async function resetStudentPin(studentId: string, customPin?: string): Promise<{
  success: boolean;
  studentId?: string;
  studentCode?: string;
  studentName?: string;
  classId?: string;
  newTempPin?: string;
  assignedPc?: string;
  savedToSupabase?: boolean;
  message?: string;
  error?: string;
  requiresAuth?: boolean;
}> {
  try {
    const res = await fetch('/api/admin/reset-student-pin', {
      method: 'POST',
      headers: getTeacherAuthHeaders(),
      body: JSON.stringify({ studentId, customPin, role: 'teacher' }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { 
        success: false, 
        error: data.error || (res.status === 401 ? 'Cần xác thực mật khẩu Giáo viên để cấp lại PIN' : 'Không thể cấp lại mã PIN'),
        requiresAuth: data.requiresAuth || res.status === 401
      };
    }

    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi mạng khi cấp lại mã PIN' };
  }
}

// 3. Batch reset PINs for a class, all 9 classes, or selected students (Requirement 3 & 4)
export async function batchResetPins(params?: {
  classId?: string;
  studentIds?: string[];
  customPin?: string;
} | string): Promise<{
  success: boolean;
  count?: number;
  classId?: string;
  accountsWithNewPin?: Array<{
    stt: number;
    id: string;
    classId: string;
    name: string;
    code: string;
    newTempPin: string;
    assignedPc: string;
    assignedPcId: number | null;
    mustChangePinOnFirstLogin: boolean;
  }>;
  message?: string;
  error?: string;
  requiresAuth?: boolean;
}> {
  try {
    let payload: any = { role: 'teacher' };
    if (typeof params === 'string') {
      payload = { classId: params || 'all', role: 'teacher' };
    } else if (params) {
      payload = {
        classId: params.classId || 'all',
        studentIds: params.studentIds,
        customPin: params.customPin,
        role: 'teacher',
      };
    } else {
      payload = { classId: 'all', role: 'teacher' };
    }

    const res = await fetch('/api/admin/batch-reset-pins', {
      method: 'POST',
      headers: getTeacherAuthHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { 
        success: false, 
        error: data.error || (res.status === 401 ? 'Cần xác thực mật khẩu Giáo viên để cấp lại PIN hàng loạt' : 'Không thể cấp lại mã PIN'),
        requiresAuth: data.requiresAuth || res.status === 401
      };
    }

    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi kết nối khi cấp lại mã PIN' };
  }
}

// 4. Student self-change PIN (Requirement 8 & 10)
export async function changeStudentPin(studentCode: string, oldPin: string, newPin: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/student-change-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, oldPin, newPin }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || 'Đổi mã PIN không thành công' };
    }

    return data;
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi kết nối khi đổi mã PIN' };
  }
}

// 5. Export Student Accounts to Excel (.xlsx) per Requirements 5, 7, 8
// Gồm: STT, Lớp, Họ và tên, Mã đăng nhập, PIN mới cấp, Máy được phân công.
export function exportStudentAccountsToExcel(
  accounts: StudentAccountRow[],
  options?: {
    scopeName?: string;
    fileName?: string;
    teacherName?: string;
    isFreshReset?: boolean;
  }
): void {
  const scopeName = options?.scopeName || 'Toàn trường (9 lớp)';
  const teacherName = options?.teacherName || 'Cô Nguyễn Thị Huệ (GV Phụ trách Tin học)';
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN');

  // Title & Metadata rows
  const titleRows = [
    ['ỦY BAN NHÂN DÂN HUYỆN THANH OAI', '', '', '', '', '', ''],
    ['TRƯỜNG TIỂU HỌC ĐỒNG DƯƠNG', '', '', '', '', '', ''],
    [''],
    ['DANH SÁCH TÀI KHOẢN VÀ CẤP MÃ PIN ĐĂNG NHẬP HỌC SINH', '', '', '', '', '', ''],
    ['HỆ THỐNG PHÒNG MÁY TÍNH THÔNG MINH (SMART ICT CLASSROOM AI)', '', '', '', '', '', ''],
    [`Phạm vi: ${scopeName}`, '', `Ngày xuất: ${dateStr}`, '', `Giáo viên quản lý: ${teacherName}`, '', ''],
    ['LƯU Ý BẢO MẬT: Mã PIN chỉ cấp một lần. Học sinh bắt buộc đổi sang mã PIN cá nhân ngay lần đăng nhập đầu tiên.', '', '', '', '', '', ''],
    [''],
  ];

  // Requirements 5 & 7 exact headers:
  // STT, Lớp, Họ và tên, Mã đăng nhập, Mã PIN mới cấp, Máy được phân công, Ghi chú bảo mật
  const headers = [
    'STT',
    'Lớp',
    'Họ và tên học sinh',
    'Mã đăng nhập (Mã HS)',
    'Mã PIN mới cấp (Chỉ cấp 1 lần)',
    'Máy được phân công',
    'Ghi chú bảo mật',
  ];

  const dataRows = accounts.map((acc, index) => {
    // Yêu cầu 8: Tuyệt đối không xuất chuỗi băm mật khẩu ra file Excel
    let pinDisplay = '(Chưa cấp lại PIN đợt này)';
    if (acc.newTempPin) {
      pinDisplay = String(acc.newTempPin);
    }

    const securityNote = acc.mustChangePinOnFirstLogin
      ? 'Bắt buộc đổi mã PIN trong lần đăng nhập đầu'
      : 'Tài khoản hoạt động an toàn';

    const safeClass = String(acc.classId).includes('/') 
      ? `Lớp ${acc.classId}` 
      : `Lớp ${acc.classId.replace('.', '/')}`;

    return [
      index + 1,
      safeClass,
      acc.name,
      acc.code,
      pinDisplay,
      acc.assignedPc || 'Chưa phân máy',
      securityNote,
    ];
  });

  const allRows = [...titleRows, headers, ...dataRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set explicit column widths for beautiful printing
  ws['!cols'] = [
    { wch: 6 },  // STT
    { wch: 12 }, // Lớp
    { wch: 28 }, // Họ và tên
    { wch: 18 }, // Mã đăng nhập
    { wch: 22 }, // Mã PIN mới cấp
    { wch: 22 }, // Máy phân công
    { wch: 34 }, // Ghi chú bảo mật
  ];

  // Format PIN column cells as text strings so Excel won't strip leading zeros
  const headerRowIndex = titleRows.length; // 0-indexed row of headers
  for (let r = headerRowIndex + 1; r < allRows.length; r++) {
    const pinCellRef = XLSX.utils.encode_cell({ r, c: 4 }); // column 4 is PIN
    if (ws[pinCellRef]) {
      ws[pinCellRef].t = 's'; // string type
    }
    const codeCellRef = XLSX.utils.encode_cell({ r, c: 3 }); // column 3 is student code
    if (ws[codeCellRef]) {
      ws[codeCellRef].t = 's';
    }
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tai_Khoan_PIN_Hoc_Sinh');

  // File name
  const safeScope = scopeName.replace(/[^a-zA-Z0-9]/g, '_');
  const timeStamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const outFileName = options?.fileName || `TaiKhoan_CapPIN_${safeScope}_${timeStamp}.xlsx`;

  // Write and trigger download
  XLSX.writeFile(wb, outFileName);
}
