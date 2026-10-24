import { ClassInfo, Student, Gender } from '../types/classroom';

export const SCHOOL_NAME = 'TRƯỜNG TIỂU HỌC ĐỒNG DƯƠNG 2';
export const APP_NAME = 'LỚP HỌC SỐ THÔNG MINH – SMART ICT CLASSROOM AI';
export const TOTAL_COMPUTERS = 20;

export const CLASSES_DATA: ClassInfo[] = [
  // Khối 3: 3.4 (31 HS), 3.5 (31 HS), 3.6 (23 HS) -> Tổng 85 HS
  { 
    id: '3.4', 
    name: 'Lớp 3.4', 
    grade: 3, 
    totalStudents: 31, 
    homeroomTeacher: 'Cô Trần Thị Lan', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN HỌC 3.4',
    congNgheFolder: '_CÔNG NGHỆ 3.4',
    aliases: ['3.4', '3/4', '3-4', '3_4', '34', '3A4', '3A 4', '3 A 4', '3 A4', 'LỚP 3A4', 'LỚP 3.4', 'LỚP 3/4', 'HS34', 'HS-34', 'HS3.4', '_TIN HỌC 3.4', '_CÔNG NGHỆ 3.4', 'TIN HỌC 3.4', 'CÔNG NGHỆ 3.4', 'TIN 3.4', 'CN 3.4']
  },
  { 
    id: '3.5', 
    name: 'Lớp 3.5', 
    grade: 3, 
    totalStudents: 31, 
    homeroomTeacher: 'Cô Nguyễn Mai Hoa', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN HỌC 3.5',
    congNgheFolder: '_CÔNG NGHỆ 3.5',
    aliases: ['3.5', '3/5', '3-5', '3_5', '35', '3A5', '3A 5', '3 A 5', '3 A5', 'LỚP 3A5', 'LỚP 3.5', 'LỚP 3/5', 'HS35', 'HS-35', 'HS3.5', '_TIN HỌC 3.5', '_CÔNG NGHỆ 3.5', 'TIN HỌC 3.5', 'CÔNG NGHỆ 3.5', 'TIN 3.5', 'CN 3.5']
  },
  { 
    id: '3.6', 
    name: 'Lớp 3.6', 
    grade: 3, 
    totalStudents: 23, 
    homeroomTeacher: 'Thầy Đặng Quốc Bảo', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN HỌC 3.6',
    congNgheFolder: '_CÔNG NGHỆ 3.6',
    aliases: ['3.6', '3/6', '3-6', '3_6', '36', '3A6', '3A 6', '3 A 6', '3 A6', 'LỚP 3A6', 'LỚP 3.6', 'LỚP 3/6', 'HS36', 'HS-36', 'HS3.6', '_TIN HỌC 3.6', '_CÔNG NGHỆ 3.6', 'TIN HỌC 3.6', 'CÔNG NGHỆ 3.6', 'TIN 3.6', 'CN 3.6']
  },

  // Khối 4: 4.3 (29 HS), 4.4 (29 HS), 4.5 (18 HS) -> Tổng 76 HS
  { 
    id: '4.3', 
    name: 'Lớp 4.3', 
    grade: 4, 
    totalStudents: 29, 
    homeroomTeacher: 'Cô Lê Thị Thùy', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN 4.3',
    congNgheFolder: '_CN4.3',
    aliases: ['4.3', '4/3', '4-3', '4_3', '43', '4A3', '4A 3', '4 A 3', '4 A3', 'LỚP 4A3', 'LỚP 4.3', 'LỚP 4/3', 'HS43', 'HS-43', 'HS4.3', '_TIN 4.3', '_CN4.3', 'TIN 4.3', 'CN 4.3', 'CN4.3']
  },
  { 
    id: '4.4', 
    name: 'Lớp 4.4', 
    grade: 4, 
    totalStudents: 29, 
    homeroomTeacher: 'Cô Phạm Thúy Hằng', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN 4.4',
    congNgheFolder: '_CN4.4',
    aliases: ['4.4', '4/4', '4-4', '4_4', '44', '4A4', '4A 4', '4 A 4', '4 A4', 'LỚP 4A4', 'LỚP 4.4', 'LỚP 4/4', 'HS44', 'HS-44', 'HS4.4', '_TIN 4.4', '_CN4.4', 'TIN 4.4', 'CN 4.4', 'CN4.4']
  },
  { 
    id: '4.5', 
    name: 'Lớp 4.5', 
    grade: 4, 
    totalStudents: 18, 
    homeroomTeacher: 'Thầy Hoàng Văn Minh', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN 4.5.',
    congNgheFolder: '_CN 4.5',
    aliases: ['4.5', '4/5', '4-5', '4_5', '45', '4A5', '4A 5', '4 A 5', '4 A5', 'LỚP 4A5', 'LỚP 4.5', 'LỚP 4/5', 'HS45', 'HS-45', 'HS4.5', '_TIN 4.5.', '_TIN 4.5', '_CN 4.5', 'TIN 4.5.', 'TIN 4.5', 'CN 4.5']
  },

  // Khối 5: 5.4 (35 HS), 5.5 (34 HS), 5.6 (19 HS) -> Tổng 88 HS
  { 
    id: '5.4', 
    name: 'Lớp 5.4', 
    grade: 5, 
    totalStudents: 35, 
    homeroomTeacher: 'Cô Đỗ Hồng Nhung', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN5.4',
    congNgheFolder: '_CN 5.4',
    aliases: ['5.4', '5/4', '5-4', '5_4', '54', '5A4', '5A 4', '5 A 4', '5 A4', 'LỚP 5A4', 'LỚP 5.4', 'LỚP 5/4', 'HS54', 'HS-54', 'HS5.4', '_TIN5.4', '_TIN 5.4', '_CN 5.4', 'TIN5.4', 'TIN 5.4', 'CN 5.4']
  },
  { 
    id: '5.5', 
    name: 'Lớp 5.5', 
    grade: 5, 
    totalStudents: 34, 
    homeroomTeacher: 'Thầy Vũ Đình Trọng', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN 5.5',
    congNgheFolder: '_CN 5.5',
    aliases: ['5.5', '5/5', '5-5', '5_5', '55', '5A5', '5A 5', '5 A 5', '5 A5', 'LỚP 5A5', 'LỚP 5.5', 'LỚP 5/5', 'HS55', 'HS-55', 'HS5.5', '_TIN 5.5', '_TIN5.5', '_CN 5.5', 'TIN 5.5', 'CN 5.5']
  },
  { 
    id: '5.6', 
    name: 'Lớp 5.6', 
    grade: 5, 
    totalStudents: 19, 
    homeroomTeacher: 'Cô Bùi Thị Mai', 
    ictTeacher: 'Cô Nguyễn Thị Huệ',
    tinHocFolder: '_TIN 5.6',
    congNgheFolder: '_CN 5.6',
    aliases: ['5.6', '5/6', '5-6', '5_6', '56', '5A6', '5A 6', '5 A 6', '5 A6', 'LỚP 5A6', 'LỚP 5.6', 'LỚP 5/6', 'HS56', 'HS-56', 'HS5.6', '_TIN 5.6', '_TIN5.6', '_CN 5.6', 'TIN 5.6', 'CN 5.6']
  },
];

/**
 * Danh sách 18 thư mục / danh sách lớp chuẩn xác theo đúng ảnh của Cô Huệ
 * Khối 3 (6 thư mục: Tin 3.4, CN 3.4, CN 3.5, Tin 3.5, CN 3.6, Tin 3.6)
 * Khối 4 (6 thư mục: Tin 4.3, CN 4.3, Tin 4.4, CN 4.4, Tin 4.5., CN 4.5)
 * Khối 5 (6 thư mục: Tin 5.4, CN 5.4, Tin 5.5, CN 5.5, Tin 5.6, CN 5.6)
 */
export interface ClassSubjectFolder {
  code: string;
  classId: string;
  className: string;
  grade: 3 | 4 | 5;
  subject: 'tin' | 'congnghe';
  subjectName: 'Tin học' | 'Công nghệ';
  totalStudents: number;
}

export const ALL_18_CLASS_FOLDERS: ClassSubjectFolder[] = [
  // Khối 3
  { code: '_TIN HỌC 3.4', classId: '3.4', className: 'Lớp 3.4', grade: 3, subject: 'tin', subjectName: 'Tin học', totalStudents: 31 },
  { code: '_CÔNG NGHỆ 3.4', classId: '3.4', className: 'Lớp 3.4', grade: 3, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 31 },
  { code: '_CÔNG NGHỆ 3.5', classId: '3.5', className: 'Lớp 3.5', grade: 3, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 31 },
  { code: '_TIN HỌC 3.5', classId: '3.5', className: 'Lớp 3.5', grade: 3, subject: 'tin', subjectName: 'Tin học', totalStudents: 31 },
  { code: '_CÔNG NGHỆ 3.6', classId: '3.6', className: 'Lớp 3.6', grade: 3, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 23 },
  { code: '_TIN HỌC 3.6', classId: '3.6', className: 'Lớp 3.6', grade: 3, subject: 'tin', subjectName: 'Tin học', totalStudents: 23 },

  // Khối 4
  { code: '_TIN 4.3', classId: '4.3', className: 'Lớp 4.3', grade: 4, subject: 'tin', subjectName: 'Tin học', totalStudents: 29 },
  { code: '_CN4.3', classId: '4.3', className: 'Lớp 4.3', grade: 4, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 29 },
  { code: '_TIN 4.4', classId: '4.4', className: 'Lớp 4.4', grade: 4, subject: 'tin', subjectName: 'Tin học', totalStudents: 29 },
  { code: '_CN4.4', classId: '4.4', className: 'Lớp 4.4', grade: 4, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 29 },
  { code: '_TIN 4.5.', classId: '4.5', className: 'Lớp 4.5', grade: 4, subject: 'tin', subjectName: 'Tin học', totalStudents: 18 },
  { code: '_CN 4.5', classId: '4.5', className: 'Lớp 4.5', grade: 4, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 18 },

  // Khối 5
  { code: '_TIN5.4', classId: '5.4', className: 'Lớp 5.4', grade: 5, subject: 'tin', subjectName: 'Tin học', totalStudents: 35 },
  { code: '_CN 5.4', classId: '5.4', className: 'Lớp 5.4', grade: 5, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 35 },
  { code: '_TIN 5.5', classId: '5.5', className: 'Lớp 5.5', grade: 5, subject: 'tin', subjectName: 'Tin học', totalStudents: 34 },
  { code: '_CN 5.5', classId: '5.5', className: 'Lớp 5.5', grade: 5, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 34 },
  { code: '_TIN 5.6', classId: '5.6', className: 'Lớp 5.6', grade: 5, subject: 'tin', subjectName: 'Tin học', totalStudents: 19 },
  { code: '_CN 5.6', classId: '5.6', className: 'Lớp 5.6', grade: 5, subject: 'congnghe', subjectName: 'Công nghệ', totalStudents: 19 },
];

export const VALID_9_CLASS_IDS = ['3.4', '3.5', '3.6', '4.3', '4.4', '4.5', '5.4', '5.5', '5.6'] as const;
export type ValidClassId = typeof VALID_9_CLASS_IDS[number];

/**
 * Chuẩn hóa mã lớp: chuyển '3/4' -> '3.4', 'Lớp 3A4' -> '3.4', '3A4' -> '3.4', '_TIN HỌC 3.4' -> '3.4', '_CN4.3' -> '4.3'
 * Luôn đảm bảo trả về 1 trong 9 mã lớp chuẩn của trường (3.4, 3.5, 3.6, 4.3, 4.4, 4.5, 5.4, 5.5, 5.6)
 */
export function canonicalClassId(raw: any, defaultId: string = '3.4'): string {
  // Chuẩn hóa defaultId về 1 trong 9 mã lớp
  const safeDefault = (VALID_9_CLASS_IDS as readonly string[]).includes(String(defaultId).trim()) 
    ? String(defaultId).trim() 
    : '3.4';

  if (!raw) return safeDefault;
  const str = String(raw).trim();
  if ((VALID_9_CLASS_IDS as readonly string[]).includes(str)) return str;

  const upper = str.toUpperCase();
  const unaccented = upper
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'D');

  // 1. Kiểm tra trực tiếp danh sách alias và folder của 9 lớp (kể cả có dấu lẫn không dấu)
  for (const cls of CLASSES_DATA) {
    if (cls.id === str || cls.name.toUpperCase() === upper) return cls.id;
    if (cls.tinHocFolder && (cls.tinHocFolder.toUpperCase() === upper || cls.tinHocFolder.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() === unaccented)) return cls.id;
    if (cls.congNgheFolder && (cls.congNgheFolder.toUpperCase() === upper || cls.congNgheFolder.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() === unaccented)) return cls.id;
    if (cls.aliases && cls.aliases.some(a => a.toUpperCase() === upper || a.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() === unaccented)) return cls.id;
  }

  // 2. Nhận diện các mẫu như 3A4, 3A5, 3A6, 4A3, 4A4, 4A5, 5A4, 5A5, 5A6, Lớp 3A4, 3-A-4
  const matchA = upper.match(/([3-5])\s*[A-Za-zÀ-ỹ\/\.\-_ ]*?\s*([3-6])/);
  if (matchA) {
    const candidate = `${matchA[1]}.${matchA[2]}`;
    if ((VALID_9_CLASS_IDS as readonly string[]).includes(candidate)) {
      return candidate;
    }
  }

  // 3. Mẫu số liền nhau: 34 -> 3.4, 35 -> 3.5, 36 -> 3.6, 43 -> 4.3, 44 -> 4.4, 45 -> 4.5, 54 -> 5.4, 55 -> 5.5, 56 -> 5.6
  const matchDigits = upper.match(/([3-5])([3-6])/);
  if (matchDigits) {
    const candidate = `${matchDigits[1]}.${matchDigits[2]}`;
    if ((VALID_9_CLASS_IDS as readonly string[]).includes(candidate)) {
      return candidate;
    }
  }

  // 4. Nếu chuỗi có chứa từ khóa HS (VD: HS34, HS-34, HS3.4, HS3/4)
  const matchHS = upper.match(/HS\s*([3-5])[\.\-_ /]?([3-6])/);
  if (matchHS) {
    const candidate = `${matchHS[1]}.${matchHS[2]}`;
    if ((VALID_9_CLASS_IDS as readonly string[]).includes(candidate)) {
      return candidate;
    }
  }

  // 5. Nếu chuỗi là tên sheet mặc định hoặc file không rõ lớp (VD: Sheet1, Trang tính, Danh sách, DSHS, Data...)
  // Hoặc không khớp bất kỳ lớp nào: LUÔN TRẢ VỀ safeDefault thay vì chuỗi lạ gây lỗi bộ lọc!
  return safeDefault;
}

/**
 * Kiểm tra xem 2 mã lớp có trùng nhau không (bất kể định dạng 3.4 hay 3/4 hay tên folder hay 3A4)
 */
export function isSameClass(classA?: string, classB?: string): boolean {
  if (!classA || !classB) return false;
  if (classA === classB) return true;
  return canonicalClassId(classA) === canonicalClassId(classB);
}

/**
 * Nhận diện giới tính học sinh chuẩn xác từ họ và tên tiếng Việt
 * 1. Chữ đệm 'Thị' -> 100% Nữ (female)
 * 2. Chữ đệm 'Văn', 'Đức', 'Hữu', 'Đình', 'Trọng', 'Bá', 'Công' -> Nam (male)
 * 3. Tên đệm kết hợp tên chính: Quỳnh Anh, Phương Anh, Minh Thư, Bảo Ngọc, Thùy Dương, Hương Giang... -> Nữ
 * 4. Tên chính và các đặc trưng văn hóa đặt tên học sinh tiểu học Việt Nam
 */
export function inferVietnameseGender(fullName: string): Gender {
  if (!fullName) return 'female';
  const clean = fullName.trim().toLowerCase().replace(/\s+/g, ' ');
  const parts = clean.split(' ');

  // 1. Chữ đệm 'thị' luôn là nữ (100% chuẩn mực tiếng Việt)
  if (parts.some((p, idx) => (p === 'thị' || p === 'thi') && idx > 0)) {
    return 'female';
  }

  // 2. Chữ đệm nam đặc trưng: văn, đức, hữu, đình, trọng, bá, công, thế, chí
  const maleMiddle = ['văn', 'đức', 'hữu', 'đình', 'trọng', 'bá', 'công', 'thế', 'chí'];
  for (let i = 1; i < parts.length - 1; i++) {
    if (maleMiddle.includes(parts[i])) {
      return 'male';
    }
  }

  // 3. Tên cuối hoặc 2 từ cuối
  const lastNameWord = parts[parts.length - 1];
  const lastTwoWords = parts.length >= 2 ? `${parts[parts.length - 2]} ${parts[parts.length - 1]}` : lastNameWord;

  // Các trường hợp tên "Anh" phân biệt theo từ đệm
  const femaleAnhNames = new Set([
    'quỳnh anh', 'phương anh', 'trâm anh', 'ngọc anh', 'mai anh', 
    'tuệ anh', 'diệp anh', 'thùy anh', 'bảo anh', 'khánh anh', 
    'hà anh', 'lan anh', 'thục anh', 'kim anh', 'hồng anh', 'yến anh', 
    'nhật anh', 'hải anh'
  ]);
  const maleAnhNames = new Set([
    'tuấn anh', 'đức anh', 'việt anh', 'quang anh', 'hoàng anh', 
    'thế anh', 'hùng anh', 'duy anh', 'trung anh', 'tiến anh', 'công anh'
  ]);

  if (femaleAnhNames.has(lastTwoWords)) return 'female';
  if (maleAnhNames.has(lastTwoWords)) return 'male';

  // Danh sách tên nữ phổ biến ở tiểu học
  const femaleNames = new Set([
    'đan', 'linh đan', 'ngân', 'bảo ngân', 'khánh ngân', 'kim ngân',
    'linh', 'trúc linh', 'khánh linh', 'thùy linh', 'mỹ linh', 'diệu linh', 'hà linh', 'gia linh', 'phương linh',
    'thảo', 'phương thảo', 'như thảo', 'hương', 'thu hương', 'quỳnh hương',
    'huyền', 'thu huyền', 'khánh huyền', 'thanh huyền', 'ngọc huyền',
    'trang', 'thu trang', 'quỳnh trang', 'thùy trang', 'mai trang', 'huyền trang',
    'mai', 'ngọc mai', 'thanh mai', 'xuân mai', 'ban mai',
    'chi', 'quỳnh chi', 'linh chi', 'khánh chi',
    'vy', 'hạ vy', 'thảo vy', 'tường vy', 'thúy vy', 'khánh vy',
    'trâm', 'bảo trâm', 'ngọc trâm', 'quỳnh trâm',
    'yến', 'hải yến', 'hoàng yến', 'kim yến',
    'nhi', 'yến nhi', 'tuyết nhi', 'thảo nhi', 'gia nhi', 'uyển nhi', 'thục nhi',
    'hà', 'thu hà', 'ngọc hà', 'thanh hà', 'ngân hà',
    'hân', 'gia hân', 'bảo hân', 'ngọc hân',
    'hiền', 'thu hiền', 'thanh hiền', 'dịu hiền', 'thảo hiền',
    'hoa', 'quỳnh hoa', 'hồng hoa', 'mai hoa',
    'lan', 'ngọc lan', 'hương lan', 'bích lan',
    'loan', 'phương loan', 'thanh loan',
    'ly', 'khánh ly', 'hương ly', 'cẩm ly', 'trúc ly',
    'mi', 'trà mi', 'diễm mi',
    'my', 'diễm my', 'hà my', 'thảo my', 'trà my',
    'nga', 'thúy nga', 'thanh nga', 'tố nga',
    'nhung', 'hồng nhung', 'tuyết nhung', 'cẩm nhung',
    'oanh', 'kiều oanh', 'hoàng oanh', 'kim oanh',
    'phương', 'thu phương', 'lan phương', 'mai phương', 'hà phương', 'nam phương',
    'quỳnh', 'như quỳnh', 'ngọc quỳnh', 'diễm quỳnh', 'hương quỳnh',
    'thi', 'anh thi', 'khánh thi',
    'thu', 'hoài thu', 'thanh thu', 'hà thu',
    'thủy', 'thu thủy', 'bích thủy', 'thanh thủy',
    'tiên', 'thủy tiên', 'cát tiên', 'giáng tiên',
    'tuyết', 'ánh tuyết', 'bạch tuyết',
    'uyên', 'phương uyên', 'tố uyên', 'thảo uyên', 'bảo uyên',
    'vân', 'thanh vân', 'thúy vân', 'khánh vân', 'hải vân', 'mỹ vân',
    'xuân', 'thanh xuân',
    'châu', 'minh châu', 'bảo châu', 'ngọc châu',
    'như', 'tâm như', 'hồng như', 'quỳnh như', 'ý như',
    'dung', 'thùy dung', 'mỹ dung',
    'duyên', 'kỳ duyên', 'mỹ duyên',
    'diệp', 'bích diệp', 'trúc diệp', 'ngọc diệp',
    'ánh', 'ngọc ánh', 'nhật ánh',
    'thư', 'anh thư', 'minh thư', 'quỳnh thư', 'thanh thư', 'ngọc thư', 'bảo thư', 'hà thư',
    'ngọc', 'bảo ngọc', 'khánh ngọc', 'minh ngọc', 'như ngọc', 'bích ngọc', 'ánh ngọc', 'hồng ngọc', 'kim ngọc',
    'dương', 'thùy dương', 'ánh dương',
    'giang', 'hương giang', 'trà giang',
    'nguyên', 'thảo nguyên', 'an nguyên',
    'tường', 'cát tường',
    'trúc', 'thanh trúc', 'nhã trúc',
    'quyên', 'thục quyên', 'lệ quyên', 'tố quyên',
    'mẫn', 'tuệ mẫn',
    'an', 'khánh an', 'hoài an', 'tâm an',
    'cúc', 'đào', 'giao', 'hạnh', 'hằng', 'liên', 'mơ', 'nương', 'sen', 'sương', 'thơ', 'thoa', 'thương', 'thúy', 'trân'
  ]);

  if (femaleNames.has(lastTwoWords) || femaleNames.has(lastNameWord)) {
    return 'female';
  }

  // Danh sách tên nam phổ biến
  const maleNames = new Set([
    'huy', 'hưng', 'khoa', 'khôi', 'mạnh', 'nam', 'nhân', 'bảo', 'cường',
    'dũng', 'đăng', 'đạt', 'đức', 'duy', 'hải', 'hiếu', 'hoàng', 'khang',
    'kiên', 'lâm', 'long', 'minh', 'nghĩa', 'phát', 'phúc',
    'quân', 'quang', 'sơn', 'tài', 'tâm', 'thành', 'thiện', 'thịnh',
    'tiến', 'toàn', 'triết', 'trọng', 'trung', 'tuấn', 'tùng', 'việt',
    'vinh', 'vũ', 'thắng', 'phong', 'chiến', 'bách', 'chính', 'hiệp', 'hy',
    'hùng', 'phước', 'bình', 'luân', 'thao', 'thạch', 'đoán', 'hoán'
  ]);

  if (maleNames.has(lastTwoWords) || maleNames.has(lastNameWord)) {
    return 'male';
  }

  // Kiểm tra tên đệm nữ (nếu chưa khớp tên chính)
  const femaleMiddleWords = ['thị', 'ngọc', 'phương', 'thùy', 'mỹ', 'diệu', 'cát', 'hồng'];
  if (parts.slice(1, -1).some(p => femaleMiddleWords.includes(p))) {
    return 'female';
  }

  return 'male';
}

// Curated authentic Vietnamese student name lists for realistic primary school rosters
const firstNamesBoy = [
  'An', 'Bảo', 'Bình', 'Cường', 'Dũng', 'Đăng', 'Đạt', 'Đức', 'Duy', 'Gia Huy', 
  'Hải', 'Hiếu', 'Hoàng', 'Hưng', 'Huy', 'Khang', 'Khánh', 'Khoa', 'Kiên', 'Lâm', 
  'Long', 'Minh', 'Nam', 'Nghĩa', 'Nguyên', 'Nhân', 'Phát', 'Phúc', 'Quân', 'Quang', 
  'Quân', 'Sơn', 'Tài', 'Tâm', 'Thành', 'Thiện', 'Thịnh', 'Tiến', 'Toàn', 'Triết', 
  'Trọng', 'Trung', 'Tuấn', 'Tùng', 'Việt', 'Vinh', 'Vũ'
];

const firstNamesGirl = [
  'Anh', 'Bảo Ngọc', 'Châu', 'Chi', 'Diệp', 'Dung', 'Duyên', 'Giang', 'Hà', 'Hân', 
  'Hiền', 'Hòa', 'Hương', 'Huyền', 'Khánh Linh', 'Lan', 'Linh', 'Loan', 'Ly', 'Mai', 
  'Mi', 'Minh Châu', 'My', 'Nga', 'Ngân', 'Ngọc', 'Nhi', 'Như', 'Nhung', 'Oanh', 
  'Phương', 'Quỳnh', 'Thảo', 'Thi', 'Thu', 'Thủy', 'Tiên', 'Trang', 'Trâm', 'Trúc', 
  'Tuyết', 'Uyên', 'Vân', 'Vy', 'Xuân', 'Yến'
];

const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý', 'Đinh', 'Đoàn'];
const middleBoy = ['Văn', 'Đức', 'Minh', 'Hải', 'Quang', 'Hữu', 'Gia', 'Bảo', 'Tuấn', 'Thành', 'Thanh'];
const middleGirl = ['Thị', 'Ngọc', 'Phương', 'Mai', 'Thùy', 'Thanh', 'Khánh', 'Tường', 'Quỳnh', 'Mỹ'];

import { AUTHENTIC_STUDENTS } from './authenticStudents';

export function generateAllStudents(): Student[] {
  return [...AUTHENTIC_STUDENTS];
}

// Compute and verify counts
export const INITIAL_STUDENTS: Student[] = AUTHENTIC_STUDENTS;
export const TOTAL_STUDENTS = INITIAL_STUDENTS.length; // 249
export const TOTAL_CLASSES = CLASSES_DATA.length; // 9
