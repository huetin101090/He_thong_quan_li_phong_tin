import * as XLSX from 'xlsx';
import { Student, Gender, AttendanceStatus } from '../types/classroom';

export interface ParsedStudentRow {
  stt: number;
  code: string;
  lastNameMiddle: string; // Cột C: Họ và tên đệm
  firstName: string;      // Cột D: Tên học sinh
  name: string;           // Ghép cột C và D thành "HỌ VÀ TÊN HỌC SINH"
  classId: string;
  gender: Gender;
  notes?: string;
  sourceSheets: string[]; // Sheet xuất xứ (VD: Tin học, Công nghệ)
  isValid: boolean;
  error?: string;
}

export interface ParseResult {
  success: boolean;
  rows: ParsedStudentRow[];
  detectedClassId?: string;
  detectedClasses: string[];
  totalRows: number;
  validCount: number;
  sheetCount: number;
  sheetNames: string[];
  mergedDuplicateCount: number; // Số học sinh trùng qua nhiều sheet đã được ghép hợp nhất
  errors: string[];
}

/**
 * Chuẩn hóa chuỗi để nhận diện tiêu đề cột tiếng Việt
 */
function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

import { CLASSES_DATA, canonicalClassId, inferVietnameseGender } from '../data/initialData';

/**
 * Nhận diện giới tính từ chuỗi hoặc tự động suy luận theo họ tên tiếng Việt
 */
function parseGender(raw: any, studentFullName?: string): Gender {
  if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
    const str = String(raw).toLowerCase().trim();
    if (
      str.includes('nữ') || 
      str.includes('nu') || 
      str === 'female' || 
      str === 'f' || 
      str === 'gái' ||
      str === 'g' ||
      str === 'x' // Nhiều bảng điểm tích dấu x vào cột Nữ
    ) {
      return 'female';
    }
    if (
      str.includes('nam') || 
      str === 'male' || 
      str === 'm' || 
      str === 'trai'
    ) {
      return 'male';
    }
  }
  // Nếu file không có cột giới tính hoặc ô trống: tự động xác định từ họ tên
  return inferVietnameseGender(studentFullName || '');
}

/**
 * Nhận diện phân môn từ tên sheet hoặc tên tệp tin (Tin học vs Công nghệ)
 * Hỗ trợ các định dạng: _TIN HỌC 3.4, _CÔNG NGHỆ 3.4, _TIN 4.3, _CN4.3, _TIN 4.5., _CN 4.5, _TIN5.4, _CN 5.4, _TIN 5.6, _CN 5.6
 */
export function detectSubjectFromSheetOrName(raw: string): 'Tin học' | 'Công nghệ' | 'Tin học & Công nghệ' {
  if (!raw) return 'Tin học & Công nghệ';
  const upper = raw.toUpperCase();
  const hasTin = upper.includes('TIN') || upper.includes('ICT');
  const hasCN = upper.includes('CÔNG NGHỆ') || upper.includes('CONG NGHE') || upper.includes('CN');
  if (hasTin && !hasCN) return 'Tin học';
  if (hasCN && !hasTin) return 'Công nghệ';
  return 'Tin học & Công nghệ';
}

/**
 * Nhận diện mã lớp từ tên sheet hoặc chuỗi (VD: "_TIN HỌC 3.4", "_CÔNG NGHỆ 3.4", "_TIN 4.3", "_CN4.3", "_TIN 4.5.", "_TIN5.4", "_CN 5.6")
 */
export function normalizeClassId(raw: any, defaultClassId: string = '3.4'): string {
  return canonicalClassId(raw, defaultClassId);
}

/**
 * Công thức bắt buộc theo yêu cầu:
 * hoTen = [cotC, cotD].map(x => String(x ?? "").trim()).filter(Boolean).join(" ").replace(/\s+/g, " ")
 */
export function combineStudentName(cotC: any, cotD: any): string {
  return [cotC, cotD]
    .map(x => String(x ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

/**
 * Tạo file mẫu Excel chuẩn theo đúng danh sách lớp thực tế của trường:
 * - Cột A: STT
 * - Cột B: Mã học sinh
 * - Cột C: Họ và tên đệm
 * - Cột D: Tên học sinh
 * - Cột E: Lớp
 * - Cột F: Ghi chú
 * Ngắn gọn, không cột giới tính, 1 sheet duy nhất đúng tên lớp
 */
export function downloadSampleExcel(classId: string = '3.4', subject: 'all' | 'tin' | 'congnghe' = 'all') {
  const cleanClassId = normalizeClassId(classId, '3.4');
  const cleanPrefix = cleanClassId.replace(/[\/\.]/g, '');
  const classObj = CLASSES_DATA.find(c => c.id === cleanClassId);

  let sheetName = `Lớp ${cleanClassId}`;
  let fileName = `Danh_Sach_Hoc_Sinh_Lop_${cleanClassId}.xlsx`;
  if (subject === 'tin' && classObj?.tinHocFolder) {
    sheetName = classObj.tinHocFolder;
    fileName = `${classObj.tinHocFolder}.xlsx`;
  } else if (subject === 'congnghe' && classObj?.congNgheFolder) {
    sheetName = classObj.congNgheFolder;
    fileName = `${classObj.congNgheFolder}.xlsx`;
  }
  
  // Dữ liệu mẫu chuẩn ghép Họ & tên đệm + Tên
  const data = [
    ['STT', 'Mã học sinh', 'Họ và tên đệm', 'Tên học sinh', 'Lớp', 'Ghi chú'],
    [1, `HS${cleanPrefix}-01`, 'Võ Nguyễn Khánh', 'An', cleanClassId, 'Tiếp thu nhanh, vẽ Paint tốt'],
    [2, `HS${cleanPrefix}-02`, 'Trương Nguyễn Minh', 'Anh', cleanClassId, 'Thích lập trình Scratch'],
    [3, `HS${cleanPrefix}-03`, 'Hồ Gia', 'Bảo', cleanClassId, 'Thực hành chăm chỉ'],
    [4, `HS${cleanPrefix}-04`, 'Lê Hoàng Minh', 'Khang', cleanClassId, 'Có máy tính ở nhà'],
    [5, `HS${cleanPrefix}-05`, 'Phạm Ngọc Bảo', 'Trâm', cleanClassId, 'Cần hỗ trợ gõ 10 ngón']
  ];

  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },  // A: STT
    { wch: 15 }, // B: Mã học sinh
    { wch: 22 }, // C: Họ và tên đệm
    { wch: 14 }, // D: Tên học sinh
    { wch: 10 }, // E: Lớp
    { wch: 30 }  // F: Ghi chú
  ];
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, fileName);
}

/**
 * Tạo file mẫu CSV chuẩn UTF-8 không cột giới tính
 */
export function downloadSampleCSV(classId: string = '3.4', subject: 'all' | 'tin' | 'congnghe' = 'all') {
  const cleanClassId = normalizeClassId(classId, '3.4');
  const cleanPrefix = cleanClassId.replace(/[\/\.]/g, '');
  const classObj = CLASSES_DATA.find(c => c.id === cleanClassId);

  let fileName = `Danh_Sach_Hoc_Sinh_Lop_${cleanClassId}.csv`;
  if (subject === 'tin' && classObj?.tinHocFolder) {
    fileName = `${classObj.tinHocFolder}.csv`;
  } else if (subject === 'congnghe' && classObj?.congNgheFolder) {
    fileName = `${classObj.congNgheFolder}.csv`;
  }

  const csvContent = 
    `\uFEFFSTT,Mã học sinh,Họ và tên đệm,Tên học sinh,Lớp,Ghi chú\r\n` +
    `1,HS${cleanPrefix}-01,Võ Nguyễn Khánh,An,${cleanClassId},Tiếp thu nhanh\r\n` +
    `2,HS${cleanPrefix}-02,Trương Nguyễn Minh,Anh,${cleanClassId},Thích Scratch\r\n` +
    `3,HS${cleanPrefix}-03,Hồ Gia,Bảo,${cleanClassId},Thực hành tốt\r\n` +
    `4,HS${cleanPrefix}-04,Lê Hoàng Minh,Khang,${cleanClassId},Có máy tính tại nhà\r\n` +
    `5,HS${cleanPrefix}-05,Phạm Ngọc Bảo,Trâm,${cleanClassId},Chăm chỉ\r\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * NÂNG CẤP XỬ LÝ FILE EXCEL / CSV CHUẨN XÁC THEO 10 YÊU CẦU:
 * 1. Nhận diện: Cột A (STT), Cột B (Mã HS), Cột C (Họ và tên đệm), Cột D (Tên).
 * 2. Ghép cột C và D bằng công thức chuẩn:
 *    hoTen = [cotC, cotD].map(x => String(x ?? "").trim()).filter(Boolean).join(" ").replace(/\s+/g, " ")
 * 3. Giữ nguyên dấu tiếng Việt, không đảo thứ tự họ tên.
 * 4. Đọc TẤT CẢ các sheet nếu có nhiều sheet, nhận diện lớp từ tên sheet hoặc cột lớp.
 * 5. Khử trùng (Deduplication): Nếu học sinh xuất hiện ở nhiều sheet (Tin học & Công nghệ),
 *    nhận diện qua mã học sinh hoặc họ tên + lớp để tránh tạo hồ sơ trùng.
 */
export async function parseStudentExcelOrCsv(
  file: File, 
  fallbackClassId: string = '5/4'
): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve({
            success: false,
            rows: [],
            totalRows: 0,
            validCount: 0,
            sheetCount: 0,
            sheetNames: [],
            mergedDuplicateCount: 0,
            detectedClasses: [],
            errors: ['Không đọc được nội dung tệp tin tải lên.']
          });
          return;
        }

        const wb = XLSX.read(buffer, { type: 'array' });
        const sheetNames = wb.SheetNames;
        if (!sheetNames || sheetNames.length === 0) {
          resolve({
            success: false,
            rows: [],
            totalRows: 0,
            validCount: 0,
            sheetCount: 0,
            sheetNames: [],
            mergedDuplicateCount: 0,
            detectedClasses: [],
            errors: ['Tệp Excel/CSV không có trang tính (sheet) nào.']
          });
          return;
        }

        // Map để lưu trữ học sinh độc nhất theo mã hoặc theo họ tên+lớp (tránh trùng giữa các sheet)
        // Key: Normalized code (nếu có) hoặc Name + Class
        const studentMap = new Map<string, ParsedStudentRow>();
        let duplicateCount = 0;
        const allDetectedClasses = new Set<string>();

        // Nhận diện mã lớp từ tên file tải lên (VD: "Lop_3.4.xlsx", "DSHS_3A4.xlsx", "Tin_Hoc_3.4.xlsx")
        const fileDetectedClass = canonicalClassId(file.name, fallbackClassId);

        // Duyệt qua TẤT CẢ CÁC SHEET
        sheetNames.forEach((sheetName) => {
          const ws = wb.Sheets[sheetName];
          if (!ws) return;

          const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
          if (!rawData || rawData.length === 0) return;

          // Kiểm tra xem tiêu đề trong 6 dòng đầu có chứa tên lớp không (VD: "DANH SÁCH LỚP 3.4", "LỚP 3A4")
          let titleDetectedClass = '';
          for (let r = 0; r < Math.min(6, rawData.length); r++) {
            const row = rawData[r];
            if (!Array.isArray(row)) continue;
            const rowText = row.map(cell => String(cell || '')).join(' ');
            if (rowText.toLowerCase().includes('lớp') || rowText.toLowerCase().includes('lop') || rowText.toLowerCase().includes('khối')) {
              const parsedClass = canonicalClassId(rowText, '');
              if (parsedClass) {
                titleDetectedClass = parsedClass;
                break;
              }
            }
          }

          // Lấy class mặc định từ tên sheet (VD: "_TIN HỌC 3.4", "Lớp 3A4", "3.4")
          // Nếu sheet là tên chung ("Sheet1", "Trang tính 1"), ưu tiên: titleDetectedClass -> fileDetectedClass -> fallbackClassId
          const isGenericSheet = sheetName.toLowerCase().startsWith('sheet') || 
                                 sheetName.toLowerCase().startsWith('trang') || 
                                 sheetName.toLowerCase().includes('danh sach') || 
                                 sheetName.toLowerCase().includes('dshs');
          const sheetDefaultClass = isGenericSheet
            ? canonicalClassId(titleDetectedClass || fileDetectedClass || fallbackClassId, fallbackClassId)
            : canonicalClassId(sheetName, titleDetectedClass || fileDetectedClass || fallbackClassId);

          allDetectedClasses.add(sheetDefaultClass);

          // Quét tìm dòng tiêu đề (Header row) trong 10 dòng đầu
          let headerRowIndex = -1;
          let colIdxSTT = 0;       // Mặc định Cột A (0)
          let colIdxCode = 1;      // Mặc định Cột B (1)
          let colIdxLastMiddle = 2;// Mặc định Cột C (2): Họ và tên đệm
          let colIdxFirstName = 3; // Mặc định Cột D (3): Tên học sinh
          let colIdxFullName = -1; // Cột Họ và tên (nếu bảng dùng 1 cột duy nhất)
          let colIdxClass = -1;
          let colIdxGender = -1;
          let colIdxFemaleOnly = -1;
          let colIdxMaleOnly = -1;
          let colIdxNotes = -1;

          for (let r = 0; r < Math.min(10, rawData.length); r++) {
            const row = rawData[r];
            if (!Array.isArray(row)) continue;

            let foundHeaderCols = false;

            for (let c = 0; c < row.length; c++) {
              const val = normalizeHeader(String(row[c] || ''));

              // Kiểm tra cột Họ và tên đệm / Họ đệm / Họ lót
              if (
                val.includes('hovatendem') || 
                val.includes('hodem') || 
                val.includes('holot') || 
                val.includes('hovalot') ||
                val.includes('chulot') ||
                val === 'ho'
              ) {
                colIdxLastMiddle = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              }

              // Kiểm tra cột Tên
              if (
                val === 'ten' || 
                val === 'tenhocsinh' || 
                val === 'tenhs' || 
                val === 'firstname'
              ) {
                colIdxFirstName = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              }

              // Kiểm tra cột Họ và tên gộp 1 cột
              if (
                val === 'hovaten' || 
                val === 'hoten' || 
                val === 'hovatenhocsinh' || 
                val === 'fullname'
              ) {
                colIdxFullName = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              }

              // Kiểm tra cột STT
              if (val === 'stt' || val === 'sothutu' || val === 'no') {
                colIdxSTT = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              }

              // Kiểm tra cột Mã HS / Mã định danh
              if (
                val.includes('mahs') || 
                val.includes('mahocsinh') || 
                val.includes('madinhdanh') || 
                val.includes('dinhdanh') ||
                val === 'code' || 
                val === 'ma' || 
                val === 'id'
              ) {
                colIdxCode = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              }

              // Kiểm tra cột Lớp
              if (val.includes('lop') || val.includes('class') || val === 'khoi') {
                colIdxClass = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              }

              // Kiểm tra cột Giới tính chung
              if (
                val.includes('gioitinh') || 
                val.includes('gender') || 
                val.includes('phai') || 
                val.includes('namnu')
              ) {
                colIdxGender = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              } else if (
                val === 'nu' || 
                val === 'nux' || 
                val === 'nusinh' || 
                val.startsWith('nu')
              ) {
                // Cột chuyên biệt "Nữ" (đặc trưng phần mềm QLGD/SMAS/VnEdu/CSDL ngành)
                colIdxFemaleOnly = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              } else if (val === 'nam' || val === 'namx' || val === 'namnu') {
                colIdxMaleOnly = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              }

              // Kiểm tra cột Ghi chú
              if (val.includes('ghichu') || val.includes('note') || val.includes('nhanxet')) {
                colIdxNotes = c;
                headerRowIndex = r;
                foundHeaderCols = true;
              }
            }

            if (foundHeaderCols && (colIdxLastMiddle !== -1 || colIdxFullName !== -1)) {
              break;
            }
          }

          // Xác định dòng bắt đầu dữ liệu
          let startRow = 0;
          if (headerRowIndex !== -1) {
            startRow = headerRowIndex + 1;
          } else {
            // Nếu không có dòng tiêu đề rõ ràng, kiểm tra nếu dòng 0 là dữ liệu (Cột C hoặc D có chữ)
            const firstRow = rawData[0];
            if (firstRow) {
              const testC = String(firstRow[2] || '');
              const testD = String(firstRow[3] || '');
              if (/[a-zA-ZÀ-ỹ]/.test(testC) || /[a-zA-ZÀ-ỹ]/.test(testD)) {
                startRow = 0;
              } else {
                startRow = 1;
              }
            }
          }

          // Đọc từng hàng trong sheet
          for (let r = startRow; r < rawData.length; r++) {
            const row = rawData[r];
            if (!row || !Array.isArray(row)) continue;

            // 1. Trích xuất Cột C (Họ và tên đệm) và Cột D (Tên học sinh)
            const cotC = row[colIdxLastMiddle];
            const cotD = row[colIdxFirstName];

            // 2. GHÉP HỌ VÀ TÊN BẰNG CÔNG THỨC CHUẨN:
            // hoTen = [cotC, cotD].map(x => String(x ?? "").trim()).filter(Boolean).join(" ").replace(/\s+/g, " ")
            let hoTen = combineStudentName(cotC, cotD);

            // Trường hợp file dùng 1 cột duy nhất "Họ và tên" (colIdxFullName)
            if (!hoTen && colIdxFullName !== -1 && row[colIdxFullName]) {
              hoTen = String(row[colIdxFullName]).trim().replace(/\s+/g, " ");
            }

            // Bỏ qua các dòng trống hoặc dòng lặp lại tiêu đề
            const lowerHoTen = hoTen.toLowerCase();
            if (
              !hoTen || 
              lowerHoTen === 'họ và tên' || 
              lowerHoTen === 'họ tên' || 
              lowerHoTen === 'họ và tên đệm tên' ||
              lowerHoTen.includes('stt') ||
              lowerHoTen.includes('cộng hòa xã hội')
            ) {
              continue;
            }

            // 3. Trích xuất STT (Cột A)
            let stt = 0;
            if (row[colIdxSTT] !== undefined && !isNaN(Number(row[colIdxSTT]))) {
              stt = Number(row[colIdxSTT]);
            }

            // 4. Trích xuất Lớp: ưu tiên cột lớp trong hàng, sau đó đến lớp nhận diện từ tên Sheet
            let rowClassId = sheetDefaultClass;
            if (colIdxClass !== -1 && row[colIdxClass]) {
              rowClassId = canonicalClassId(row[colIdxClass], sheetDefaultClass);
            }
            rowClassId = canonicalClassId(rowClassId, sheetDefaultClass);
            allDetectedClasses.add(rowClassId);

            // 5. Trích xuất Giới tính chuẩn xác (Ưu tiên cột Nữ/Nam chuyên biệt, cột Giới tính chung, rồi từ điển tên tiếng Việt)
            let gender: Gender = 'male';
            if (colIdxFemaleOnly !== -1 && row[colIdxFemaleOnly] !== undefined) {
              const valFemale = String(row[colIdxFemaleOnly]).trim().toLowerCase();
              if (valFemale !== '' && valFemale !== '-' && valFemale !== '0') {
                gender = 'female';
              } else {
                gender = 'male';
              }
            } else if (colIdxMaleOnly !== -1 && row[colIdxMaleOnly] !== undefined) {
              const valMale = String(row[colIdxMaleOnly]).trim().toLowerCase();
              if (valMale !== '' && valMale !== '-' && valMale !== '0') {
                gender = 'male';
              } else {
                gender = 'female';
              }
            } else if (colIdxGender !== -1 && row[colIdxGender] !== undefined && String(row[colIdxGender]).trim() !== '') {
              gender = parseGender(row[colIdxGender], hoTen);
            } else {
              gender = inferVietnameseGender(hoTen);
            }

            // 6. Trích xuất Ghi chú
            const notes = colIdxNotes !== -1 && row[colIdxNotes] ? String(row[colIdxNotes]).trim() : undefined;

            // 7. Trích xuất hoặc sinh Mã học sinh (Cột B)
            let code = colIdxCode !== -1 && row[colIdxCode] ? String(row[colIdxCode]).trim() : '';
            
            // Khóa định danh để kiểm tra trùng (Requirement 6: Nếu học sinh xuất hiện ở cả Tin học & Công nghệ)
            let dedupKey = '';
            if (code && code.length >= 3 && !/^\d+$/.test(code)) {
              // Mã có định dạng chuẩn (VD: HS54-01, DH2026,...)
              dedupKey = `CODE_${code.toUpperCase()}`;
            } else {
              // Nhận diện theo Họ Tên + Lớp
              dedupKey = `NAME_${hoTen.toLowerCase().replace(/\s+/g, '')}_${rowClassId}`;
            }

            // Kiểm tra trùng giữa các sheet
            if (studentMap.has(dedupKey)) {
              duplicateCount++;
              const existing = studentMap.get(dedupKey)!;
              // Bổ sung sheet nguồn vào danh sách xuất xứ
              if (!existing.sourceSheets.includes(sheetName)) {
                existing.sourceSheets.push(sheetName);
              }
              // Cập nhật bổ sung ghi chú nếu sheet mới có thêm thông tin
              if (notes && (!existing.notes || !existing.notes.includes(notes))) {
                existing.notes = existing.notes ? `${existing.notes}; ${notes}` : notes;
              }
              continue; // Bỏ qua tạo mới, đã hợp nhất vào hồ sơ có sẵn!
            }

            // Nếu chưa có mã học sinh hợp lệ, tạo mã theo lớp
            if (!code || !code.startsWith('HS')) {
              const cleanPrefix = rowClassId.replace(/[\/\.]/g, '');
              const seq = studentMap.size + 1;
              code = `HS${cleanPrefix}-${seq < 10 ? '0' + seq : seq}`;
            }

            const parsedRow: ParsedStudentRow = {
              stt: stt || (studentMap.size + 1),
              code,
              lastNameMiddle: String(cotC ?? '').trim(),
              firstName: String(cotD ?? '').trim(),
              name: hoTen,
              classId: rowClassId,
              gender,
              notes,
              sourceSheets: [sheetName],
              isValid: true
            };

            studentMap.set(dedupKey, parsedRow);
          }
        });

        const parsedRows = Array.from(studentMap.values());

        // Đánh lại số thứ tự STT hiển thị đẹp từ 1 đến N
        parsedRows.forEach((item, idx) => {
          item.stt = idx + 1;
        });

        // Xác định lớp xuất hiện nhiều nhất làm lớp mặc định
        const classCountMap = new Map<string, number>();
        parsedRows.forEach(r => {
          classCountMap.set(r.classId, (classCountMap.get(r.classId) || 0) + 1);
        });

        let mostFrequentClass = canonicalClassId(fallbackClassId, '3.4');
        let maxCount = 0;
        classCountMap.forEach((cnt, cls) => {
          if (cnt > maxCount) {
            maxCount = cnt;
            mostFrequentClass = canonicalClassId(cls, fallbackClassId);
          }
        });

        if (parsedRows.length === 0) {
          resolve({
            success: false,
            rows: [],
            totalRows: 0,
            validCount: 0,
            sheetCount: sheetNames.length,
            sheetNames,
            mergedDuplicateCount: duplicateCount,
            detectedClasses: Array.from(allDetectedClasses),
            errors: ['Không tìm thấy dữ liệu học sinh hợp lệ trong các sheet của file. Vui lòng kiểm tra lại định dạng tệp tin.']
          });
          return;
        }

        resolve({
          success: true,
          rows: parsedRows,
          detectedClassId: mostFrequentClass,
          detectedClasses: Array.from(allDetectedClasses),
          totalRows: parsedRows.length,
          validCount: parsedRows.filter(r => r.isValid).length,
          sheetCount: sheetNames.length,
          sheetNames,
          mergedDuplicateCount: duplicateCount,
          errors: []
        });

      } catch (err: any) {
        resolve({
          success: false,
          rows: [],
          totalRows: 0,
          validCount: 0,
          sheetCount: 0,
          sheetNames: [],
          mergedDuplicateCount: 0,
          detectedClasses: [],
          errors: [err?.message || 'Có lỗi xảy ra khi phân tích tệp tin Excel/CSV.']
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        rows: [],
        totalRows: 0,
        validCount: 0,
        sheetCount: 0,
        sheetNames: [],
        mergedDuplicateCount: 0,
        detectedClasses: [],
        errors: ['Lỗi khi đọc file từ máy tính.']
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
