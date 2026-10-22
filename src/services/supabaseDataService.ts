import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { Student, ClassInfo, AttendanceStatus, Gender } from '../types/classroom';
import { inferVietnameseGender, canonicalClassId, CLASSES_DATA } from '../data/initialData';

// 9 lớp học chính thức theo quy định
export const ALLOWED_9_CLASSES = [
  '3/4', '3/5', '3/6', 
  '4/3', '4/4', '4/5', 
  '5/4', '5/5', '5/6'
] as const;

export interface SupabaseFetchResult {
  success: boolean;
  students: Student[];
  totalFromDb: number;
  authenticCount: number;
  excludedMockCount: number;
  classesCount: number;
  classes: ClassInfo[];
  error: string | null;
  timestamp: string;
}

/**
 * Trích xuất định dạng lớp 3/4, 4/3... từ mã học sinh HS34-01, HS43-01...
 */
export function extractClassSlashFromCode(code?: string): string | null {
  if (!code) return null;
  const match = code.trim().match(/^HS([3-5])([3-6])/i);
  if (match) {
    return `${match[1]}/${match[2]}`;
  }
  return null;
}

/**
 * ĐỌC DỮ LIỆU TỪ SUPABASE: public.students và public.classes
 * - Chỉ đọc (READ-ONLY), không sửa, xóa hay ghi đè
 * - Chỉ lấy 249 học sinh thật thuộc 9 lớp
 * - Loại trừ 12 học sinh mẫu (id 101-112, code HS4A01-HS4A12)
 * - Nếu lỗi, trả về lỗi rõ ràng, KHÔNG tự ý chuyển sang danh sách giả
 */
export async function fetchStudentsAndClassesFromSupabase(): Promise<SupabaseFetchResult> {
  const result: SupabaseFetchResult = {
    success: false,
    students: [],
    totalFromDb: 0,
    authenticCount: 0,
    excludedMockCount: 0,
    classesCount: 0,
    classes: [],
    error: null,
    timestamp: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) {
    result.error = 'Chưa cấu hình biến môi trường kết nối Supabase (VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY).';
    return result;
  }

  const client = getSupabaseClient();
  if (!client) {
    result.error = 'Không thể khởi tạo kết nối Supabase Client.';
    return result;
  }

  try {
    // 1. ĐỌC DỮ LIỆU TỪ public.classes
    const { data: dbClasses, error: errClasses } = await client
      .from('classes')
      .select('*');

    if (errClasses) {
      console.warn('[Supabase] Không thể đọc bảng public.classes:', errClasses.message);
      // Ghi nhận lỗi nhưng tiếp tục kiểm tra students nếu có
    } else if (Array.isArray(dbClasses) && dbClasses.length > 0) {
      result.classesCount = dbClasses.length;
      result.classes = dbClasses.map((c: any) => ({
        id: String(c.id || c.code || c.name),
        name: c.name || `Lớp ${c.id}`,
        grade: c.grade || parseInt(String(c.name || c.id).replace(/\D/g, '')[0], 10) || 3,
        totalStudents: c.total_students || 0,
        homeroomTeacher: c.homeroom_teacher || '',
        ictTeacher: c.ict_teacher || 'Cô Nguyễn Thị Huệ',
      }));
    } else {
      // Bảng classes hiện tại có 0 dòng (trống), sử dụng cơ cấu 9 lớp chuẩn
      result.classesCount = 0;
      result.classes = [...CLASSES_DATA];
    }

    // 2. ĐỌC DỮ LIỆU TỪ public.students
    const { data: dbStudents, error: errStudents } = await client
      .from('students')
      .select('*')
      .order('id', { ascending: true });

    if (errStudents) {
      result.error = `Lỗi truy vấn bảng public.students: ${errStudents.message}`;
      return result;
    }

    if (!Array.isArray(dbStudents)) {
      result.error = 'Dữ liệu trả về từ bảng public.students không phải là mảng hợp lệ.';
      return result;
    }

    result.totalFromDb = dbStudents.length;

    // 3. LỌC: BỎ 12 HỌC SINH MẪU (id 101-112, code HS4A...)
    // CHỈ LẤY 249 HỌC SINH THẬT THUỘC 9 LỚP (3/4, 3/5, 3/6, 4/3, 4/4, 4/5, 5/4, 5/5, 5/6)
    const authenticRows = dbStudents.filter((row: any) => {
      // Loại trừ 12 học sinh mẫu cũ
      if (row.id >= 101 && row.id <= 112) return false;
      if (typeof row.code === 'string' && row.code.toUpperCase().startsWith('HS4A')) return false;
      if (row.class_id === 1 && typeof row.code === 'string' && row.code.startsWith('HS4A')) return false;

      // Trích xuất lớp từ mã học sinh
      const slashClass = extractClassSlashFromCode(row.code);
      if (!slashClass) return false;

      return (ALLOWED_9_CLASSES as readonly string[]).includes(slashClass);
    });

    result.excludedMockCount = result.totalFromDb - authenticRows.length;
    result.authenticCount = authenticRows.length;

    // 4. ÁNH XẠ DỮ LIỆU THẬT SANG ĐỐI TƯỢNG HỌC SINH CỦA ỨNG DỤNG
    const mappedStudents: Student[] = authenticRows.map((row: any) => {
      const code = String(row.code || '').trim();
      const name = String(row.name || '').trim();
      const dotClass = canonicalClassId(code, '3.4');
      const inferredGender = inferVietnameseGender(name);
      const gender: Gender = (row.gender === 'male' || row.gender === 'female') 
        ? row.gender 
        : inferredGender;

      // Trích xuất số thứ tự trong lớp từ mã (VD: HS34-01 -> 1)
      const seatSeqMatch = code.match(/-(\d+)$/);
      const seatNumber = seatSeqMatch ? parseInt(seatSeqMatch[1], 10) : (row.col || 1);

      // Trích xuất máy được phân công từ cột seat (VD: "Máy-01" -> 1)
      let assignedPcId: number | null = null;
      if (row.seat && typeof row.seat === 'string') {
        const pcNum = parseInt(row.seat.replace(/\D/g, ''), 10);
        if (!isNaN(pcNum) && pcNum >= 1 && pcNum <= 20) {
          assignedPcId = pcNum;
        }
      }

      const attendance: AttendanceStatus = (row.status === 'absent') ? 'absent' : 'present';

      return {
        id: code || String(row.id),
        code: code,
        name: name,
        gender: gender,
        classId: dotClass, // '3.4', '4.3'... tương thích hoàn toàn các bộ lọc và sơ đồ
        seatNumber: seatNumber,
        attendance: attendance,
        assignedPcId: assignedPcId,
        notes: row.notes || (row.pc_status === 'broken' ? 'Máy hỏng' : undefined),
      };
    });

    result.students = mappedStudents;
    result.success = true;
    return result;

  } catch (err: any) {
    result.error = `Ngoại lệ khi kết nối Supabase: ${err?.message || String(err)}`;
    return result;
  }
}
