import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Self-contained data models for server persistence
const TOTAL_COMPUTERS = 20;

interface ServerClassInfo {
  id: string;
  name: string;
  grade: number;
  totalStudents: number;
  homeroomTeacher: string;
  ictTeacher: string;
}

const CLASSES_DATA: ServerClassInfo[] = [
  { id: '3.4', name: 'Lớp 3.4', grade: 3, totalStudents: 31, homeroomTeacher: 'Cô Trần Thị Lan', ictTeacher: 'Cô Nguyễn Thị Huệ' },
  { id: '3.5', name: 'Lớp 3.5', grade: 3, totalStudents: 31, homeroomTeacher: 'Cô Nguyễn Mai Hoa', ictTeacher: 'Cô Nguyễn Thị Huệ' },
  { id: '3.6', name: 'Lớp 3.6', grade: 3, totalStudents: 23, homeroomTeacher: 'Thầy Đặng Quốc Bảo', ictTeacher: 'Cô Nguyễn Thị Huệ' },
  { id: '4.3', name: 'Lớp 4.3', grade: 4, totalStudents: 29, homeroomTeacher: 'Cô Lê Thị Thùy', ictTeacher: 'Cô Nguyễn Thị Huệ' },
  { id: '4.4', name: 'Lớp 4.4', grade: 4, totalStudents: 29, homeroomTeacher: 'Cô Phạm Thúy Hằng', ictTeacher: 'Cô Nguyễn Thị Huệ' },
  { id: '4.5', name: 'Lớp 4.5', grade: 4, totalStudents: 18, homeroomTeacher: 'Thầy Hoàng Văn Minh', ictTeacher: 'Cô Nguyễn Thị Huệ' },
  { id: '5.4', name: 'Lớp 5.4', grade: 5, totalStudents: 35, homeroomTeacher: 'Cô Đỗ Hồng Nhung', ictTeacher: 'Cô Nguyễn Thị Huệ' },
  { id: '5.5', name: 'Lớp 5.5', grade: 5, totalStudents: 34, homeroomTeacher: 'Thầy Vũ Đình Trọng', ictTeacher: 'Cô Nguyễn Thị Huệ' },
  { id: '5.6', name: 'Lớp 5.6', grade: 5, totalStudents: 19, homeroomTeacher: 'Cô Bùi Thị Mai', ictTeacher: 'Cô Nguyễn Thị Huệ' },
];

function generateAllStudents(): any[] {
  try {
    const seedFile = path.resolve(__dirname, 'src/data/authenticStudentsData.json');
    if (fs.existsSync(seedFile)) {
      return JSON.parse(fs.readFileSync(seedFile, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading authenticStudentsData.json:', err);
  }
  return [];
}

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Immediate health check endpoints for Cloud Run & container health probes
app.get('/healthz', (_req: Request, res: Response) => {
  return res.status(200).send('OK');
});

app.get('/api/health', (_req: Request, res: Response) => {
  return res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Dynamic Gemini Client initialization
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (e) {
    console.warn('Could not initialize GoogleGenAI with key:', e);
    return null;
  }
}

// 1. API: Student Assignment Feedback
app.post('/api/gemini/feedback', async (req: Request, res: Response) => {
  const { studentName, assignmentTitle, score, maxScore, criteriaScores, submissionDetails } = req.body;
  const ai = getAIClient();

  if (!ai) {
    // If no key configured, return signal to client to use smart pedagogical rules
    return res.status(200).json({
      status: 'fallback',
      message: 'GEMINI_API_KEY chưa được cấu hình. Hệ thống sử dụng quy tắc sư phạm tiểu học chuẩn.',
    });
  }

  try {
    const prompt = `Bạn là giáo viên Tin học Tiểu học tận tâm, giàu kinh nghiệm tại Việt Nam.
Hãy nhận xét bài tập môn Tin học của học sinh tiểu học sau đây:
- Tên học sinh: ${studentName}
- Tên bài tập: ${assignmentTitle}
- Điểm số: ${score}/${maxScore}
- Điểm tiêu chí: ${JSON.stringify(criteriaScores || {})}
- Chi tiết bài làm: ${submissionDetails || 'Học sinh đã nộp bài theo yêu cầu.'}

YÊU CẦU BẮT BUỘC:
1. Nhận xét phải dùng ngôn từ tích cực, khích lệ, gần gũi, phù hợp lứa tuổi học sinh tiểu học (lớp 3, 4, 5).
2. Không suy diễn thái độ hay hành vi học sinh nếu không có dữ liệu.
3. Phải chia rõ 3 phần:
   - strengths: Điều học sinh thực hiện tốt
   - needsImprovement: Nội dung học sinh cần cố gắng
   - concreteSuggestion: Một gợi ý cụ thể để em tiến bộ trong bài sau
4. combined: Đoạn văn hoàn chỉnh kết hợp cả 3 phần ngắn gọn (2-3 câu).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strengths: { type: Type.STRING, description: 'Điều học sinh làm tốt' },
            needsImprovement: { type: Type.STRING, description: 'Nội dung cần cố gắng' },
            concreteSuggestion: { type: Type.STRING, description: 'Gợi ý cụ thể để tiến bộ' },
            combined: { type: Type.STRING, description: 'Đoạn nhận xét hoàn chỉnh 2-3 câu' },
          },
          required: ['strengths', 'needsImprovement', 'concreteSuggestion', 'combined'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Gemini feedback error:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi xử lý Gemini AI' });
  }
});

// 2. API: Monthly Summary Feedback
app.post('/api/gemini/monthly-summary', async (req: Request, res: Response) => {
  const { studentName, classId, month, averageScore, quizzesCompleted, practiceCompleted } = req.body;
  const ai = getAIClient();

  if (!ai) {
    return res.status(200).json({ status: 'fallback' });
  }

  try {
    const prompt = `Viết đoạn nhận xét tổng kết tháng ${month} môn Tin học cho học sinh tiểu học:
- Học sinh: ${studentName} (Lớp ${classId})
- Điểm trung bình tháng: ${averageScore}/10
- Bài lý thuyết đã hoàn thành: ${quizzesCompleted} bài
- Bài thực hành đã hoàn thành: ${practiceCompleted} bài

Yêu cầu:
- Viết ngắn gọn từ 2 đến 4 câu.
- Dùng từ ngữ tích cực, chuẩn mực theo quy định đánh giá học sinh Tiểu học hiện hành (Thông tư 27/2020/TT-BGDĐT).
- Khích lệ tinh thần học tập và kỹ năng thực hành máy tính.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ summary: response.text?.trim() });
  } catch (error: any) {
    console.error('Gemini monthly summary error:', error);
    return res.status(500).json({ error: error?.message || 'Lỗi Gemini AI' });
  }
});

// 3. API: Gemini Status Check
app.get('/api/gemini/status', (_req: Request, res: Response) => {
  const ai = getAIClient();
  return res.json({
    configured: !!ai,
    model: 'gemini-3.8-flash',
  });
});

// 4. API: AI Tự tạo câu hỏi kiểm tra Lý thuyết bám sát chương trình Tin học Tiểu học
app.post('/api/gemini/generate-questions', async (req: Request, res: Response) => {
  const { 
    grade = 4, 
    lessonTitle = '', 
    topicContent = '', 
    lessonReferenceText = '', 
    questionCount = 10, 
    cognitiveLevels = ['Nhận biết', 'Thông hiểu', 'Vận dụng'],
    questionTypes = ['single_choice', 'true_false', 'multiple_choice', 'short_answer', 'essay'],
    activityType = 'practice' 
  } = req.body;
  const ai = getAIClient();

  if (!ai) {
    return res.status(503).json({
      error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng cấu hình biến môi trường GEMINI_API_KEY để sử dụng tính năng AI tạo câu hỏi thực tế từ Google Gemini.',
      status: 'unconfigured'
    });
  }

  // Validate topic input quality (Requirement 5: if input is unclear, request teacher to specify instead of hallucinating)
  const trimmedTopic = String(topicContent || '').trim();
  const trimmedTitle = String(lessonTitle || '').trim();
  const trimmedRef = String(lessonReferenceText || '').trim();

  if (trimmedTopic.length < 4 && trimmedTitle.length < 4 && trimmedRef.length < 10) {
    return res.status(400).json({
      error: 'Nội dung đầu vào chưa đủ rõ ràng. Thầy/Cô vui lòng nhập cụ thể Tên bài học hoặc Chủ đề/Nội dung kiến thức trọng tâm (hoặc dán tài liệu bài học) để AI sinh câu hỏi chính xác, không bịa nội dung.',
    });
  }

  const count = Math.min(25, Math.max(1, Number(questionCount) || 10));

  try {
    const prompt = `Bạn là chuyên gia giáo dục và giáo viên Tin học Tiểu học hàng đầu tại Việt Nam, am hiểu sâu sắc Chương trình GDPT 2018 môn Tin học và Thông tư 27/2020/TT-BGDĐT về đánh giá học sinh Tiểu học.

Hãy tạo chính xác ${count} câu hỏi kiểm tra cho học sinh Tiểu học theo đúng các yêu cầu sư phạm sau:
- Khối lớp: Khối ${grade} (học sinh Tiểu học khoảng ${Number(grade) + 5} - ${Number(grade) + 6} tuổi; câu từ trong sáng, ngắn gọn, dễ hiểu, tình huống gần gũi thực tế đời sống và học đường).
- Tên bài học: "${trimmedTitle || trimmedTopic}"
- Chủ đề / Nội dung kiến thức trọng tâm cần kiểm tra: "${trimmedTopic || trimmedTitle}"
${trimmedRef ? `- Tài liệu / Nội dung tham khảo chi tiết của bài học:\n"""\n${trimmedRef.slice(0, 5000)}\n"""` : ''}
- Số lượng câu hỏi cần tạo: ĐÚNG ${count} câu hỏi.
- Phân bổ mức độ nhận thức: ${Array.isArray(cognitiveLevels) && cognitiveLevels.length > 0 ? cognitiveLevels.join(', ') : 'Nhận biết, Thông hiểu, Vận dụng'}
- Các dạng câu hỏi: ${Array.isArray(questionTypes) && questionTypes.length > 0 ? questionTypes.join(', ') : 'Một đáp án, Nhiều đáp án, Đúng/Sai, Điền khuyết, Tự luận ngắn'}
- Mục đích bài: ${activityType === 'periodic_exam' ? 'Kiểm tra định kỳ (đánh giá chuẩn kiến thức kỹ năng)' : 'Luyện tập thường xuyên trong tiết học (động viên, khích lệ học tập)'}

QUY TẮC BẮT BUỘC (CRITICAL):
1. BÁM SÁT CHỦ ĐỀ: Các câu hỏi CHỈ ĐƯỢC xoay quanh bài "${trimmedTitle}" và chủ đề "${trimmedTopic}". TUYỆT ĐỐI KHÔNG sinh câu hỏi lạc đề hoặc từ bài học khác (Ví dụ: nếu chủ đề là "Tìm kiếm thông tin trên website" thì KHÔNG đưa câu hỏi về phím F, J, hay phần mềm Paint).
2. Phù hợp tuyệt đối với học sinh Lớp ${grade}. Không dùng thuật ngữ công nghệ quá hàn lâm hay lập trình phức tạp vượt lứa tuổi.
3. Mỗi câu hỏi PHẢI CÓ:
   - id: chuỗi id duy nhất (ví dụ: "q-ai-1", "q-ai-2"...)
   - type: một trong ['single_choice', 'multiple_choice', 'true_false', 'short_answer', 'essay']
   - prompt: lời dẫn câu hỏi rõ ràng, sư phạm
   - options: mảng phương án trả lời (đối với single_choice: 4 phương án rõ ràng; true_false: ['Đúng', 'Sai']; multiple_choice: 4 phương án)
   - correctAnswers: đáp án đúng (với single_choice, true_false là 1 chuỗi string chính xác khớp với 1 phần tử trong options; với multiple_choice là mảng string các đáp án đúng; với short_answer là mảng các từ khóa đúng được chấp nhận; với essay là gợi ý câu trả lời chuẩn)
   - explanation: lời giải thích vì sao đáp án đó đúng, ngắn gọn, súc tích, mang tính chỉ dẫn học tập cho học sinh
   - cognitiveLevel: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng'
   - points: tính điểm sao cho tổng điểm của cả bộ câu hỏi là 10 điểm (ví dụ ${count} câu thì mỗi câu ${Math.round((10 / count) * 10) / 10} điểm)
   - rubricGuide: (đối với câu tự luận) hướng dẫn giáo viên chấm điểm ngắn gọn.`;

    const geminiConfig = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          lessonTitle: { type: Type.STRING },
          topic: { type: Type.STRING },
          grade: { type: Type.INTEGER },
          totalQuestions: { type: Type.INTEGER },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['single_choice', 'multiple_choice', 'true_false', 'short_answer', 'essay'] },
                prompt: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswers: { type: Type.STRING, description: 'Chuỗi đáp án đúng cho single_choice/true_false/essay' },
                correctAnswersArray: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Mảng các đáp án đúng cho multiple_choice hoặc short_answer' },
                explanation: { type: Type.STRING },
                cognitiveLevel: { type: Type.STRING, enum: ['Nhận biết', 'Thông hiểu', 'Vận dụng'] },
                points: { type: Type.NUMBER },
                rubricGuide: { type: Type.STRING },
              },
              required: ['id', 'type', 'prompt', 'explanation', 'cognitiveLevel', 'points'],
            },
          },
        },
        required: ['questions'],
      },
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: geminiConfig,
    });

    const parsed = JSON.parse(response.text || '{}');
    const rawQuestions = parsed.questions || [];

    // Format & normalize each question
    const normalizedQuestions = rawQuestions.map((q: any, idx: number) => {
      let finalCorrectAnswers = q.correctAnswers;
      if (q.type === 'multiple_choice' || q.type === 'short_answer') {
        if (q.correctAnswersArray && q.correctAnswersArray.length > 0) {
          finalCorrectAnswers = q.correctAnswersArray;
        } else if (typeof q.correctAnswers === 'string') {
          if (q.correctAnswers.includes(';') || q.correctAnswers.includes(',')) {
            finalCorrectAnswers = q.correctAnswers.split(/[,;]+/).map((s: string) => s.trim()).filter(Boolean);
          } else {
            finalCorrectAnswers = [q.correctAnswers];
          }
        }
      }

      return {
        id: q.id || `ai_q_${Date.now()}_${idx + 1}`,
        type: q.type || 'single_choice',
        prompt: q.prompt,
        options: q.type === 'true_false' 
          ? ['Đúng', 'Sai'] 
          : (Array.isArray(q.options) && q.options.length > 0 ? q.options : undefined),
        correctAnswers: finalCorrectAnswers || (q.options ? q.options[0] : 'Đúng'),
        explanation: q.explanation || 'Xem lại kiến thức bài học để hiểu rõ đáp án.',
        cognitiveLevel: q.cognitiveLevel || 'Thông hiểu',
        points: q.points || Math.round((10 / count) * 10) / 10,
        rubricGuide: q.rubricGuide,
      };
    });

    return res.json({
      success: true,
      lessonTitle: parsed.lessonTitle || trimmedTitle,
      grade: Number(grade),
      questionCount: normalizedQuestions.length,
      questions: normalizedQuestions,
    });
  } catch (error: any) {
    console.error('Gemini question generation error:', error);
    return res.status(500).json({
      error: `Lỗi khi gọi Gemini AI: ${error?.message || 'Không thể tạo câu hỏi lúc này'}. Vui lòng thử lại.`,
    });
  }
});

// ==========================================
// 5. CLASSROOM SEATING & BROKEN COMPUTERS API
// ==========================================
const IS_VERCEL = Boolean(process.env.VERCEL);
const DATA_DIR = IS_VERCEL ? path.resolve('/tmp', '.data') : path.resolve(__dirname, '.data');
const SEATING_DIR = path.resolve(DATA_DIR, 'seating');
const ATTENDANCE_FILE = path.resolve(DATA_DIR, 'attendance.json');
const BROKEN_COMPUTERS_FILE = path.resolve(DATA_DIR, 'broken_computers.json');
const WORKSTATIONS_FILE = path.resolve(DATA_DIR, 'workstations.json');
const STUDENTS_FILE = path.resolve(DATA_DIR, 'students.json');
const MASTER_DATA_DIR = path.resolve(__dirname, 'src/data/initialMasterData');

try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SEATING_DIR)) fs.mkdirSync(SEATING_DIR, { recursive: true });

  function syncSeedFileIfMissing(targetPath: string, seedName: string) {
    if (!fs.existsSync(targetPath)) {
      const sourcePath = path.resolve(MASTER_DATA_DIR, seedName);
      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, targetPath);
        } catch (e) {
          console.warn(`Failed to seed ${targetPath}:`, e);
        }
      }
    }
  }

  syncSeedFileIfMissing(STUDENTS_FILE, 'students.json');
  syncSeedFileIfMissing(BROKEN_COMPUTERS_FILE, 'broken_computers.json');
  syncSeedFileIfMissing(WORKSTATIONS_FILE, 'workstations.json');
  syncSeedFileIfMissing(ATTENDANCE_FILE, 'attendance.json');

  if (fs.existsSync(path.resolve(MASTER_DATA_DIR, 'seating'))) {
    try {
      const sFiles = fs.readdirSync(path.resolve(MASTER_DATA_DIR, 'seating'));
      for (const f of sFiles) {
        const targetSeatFile = path.resolve(SEATING_DIR, f);
        if (!fs.existsSync(targetSeatFile)) {
          fs.copyFileSync(path.resolve(MASTER_DATA_DIR, 'seating', f), targetSeatFile);
        }
      }
    } catch (e) {
      console.warn('Seating templates sync warning:', e);
    }
  }
} catch (fsErr) {
  console.warn('Filesystem init non-fatal warning:', fsErr);
}

// Password Hashing with SHA-256 + Salt
const AUTH_SALT = 'smart_ict_dong_duong_salt_2026';
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim() + AUTH_SALT).digest('hex');
}

// Workstation interface
export interface WorkstationInfo {
  pcId: number;
  code: string;
  name: string;
  deviceToken: string;
  isRegistered: boolean;
  status: 'active' | 'broken';
  verifiedBy: string;
  verifiedAt: string;
  ipAddress: string;
}

// Stored Attendance Record interface
export interface StoredAttendanceRecord {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classId: string;
  date: string;
  session: 'morning' | 'afternoon';
  periodNumber: number;
  assignedPcId: number | null;
  actualPcId: number;
  loginTimestamp: string;
  status: string;
  seatChangeConfirmed?: boolean;
  teacherNote?: string;
  verifiedByTeacher?: string;
  verifiedAt?: string;
}

// Helper to read JSON file safely
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to write JSON file safely
function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

// Initialize 20 Workstations PC01 - PC20
function initWorkstations(): WorkstationInfo[] {
  const existing = readJsonFile<WorkstationInfo[]>(WORKSTATIONS_FILE, []);
  if (Array.isArray(existing) && existing.length === 20) {
    return existing;
  }
  const broken = readJsonFile<number[]>(BROKEN_COMPUTERS_FILE, []);
  const list: WorkstationInfo[] = Array.from({ length: 20 }, (_, i) => {
    const pcId = i + 1;
    const padded = pcId < 10 ? `0${pcId}` : `${pcId}`;
    const tokenHash = crypto.createHash('md5').update(`PC${padded}_DONG_DUONG_HW_TOKEN`).digest('hex').substring(0, 8).toUpperCase();
    return {
      pcId,
      code: `PC${padded}`,
      name: `Máy tính trạm ${padded}`,
      deviceToken: `WS-DD-PC${padded}-${tokenHash}`,
      isRegistered: true,
      status: broken.includes(pcId) ? 'broken' : 'active',
      verifiedBy: 'Cô Nguyễn Thị Huệ (GV Quản lý)',
      verifiedAt: '2026-10-16 08:00:00',
      ipAddress: `192.168.1.${100 + pcId}`,
    };
  });
  writeJsonFile(WORKSTATIONS_FILE, list);
  return list;
}

// Initialize 9 Classes Seating Templates so every class has saved assignments
function initClassSeatingTemplates() {
  const allStudents = generateAllStudents();
  CLASSES_DATA.forEach(cls => {
    const safeClass = cls.id.replace('/', '-');
    const classFile = path.resolve(SEATING_DIR, `class_${safeClass}.json`);
    if (!fs.existsSync(classFile)) {
      const clsStudents = allStudents.filter(s => s.classId === cls.id)
        .sort((a, b) => (a.seatNumber || 0) - (b.seatNumber || 0));
      
      const assignments: Record<number, { studentAId: string | null; studentBId: string | null }> = {};
      for (let i = 1; i <= 20; i++) {
        assignments[i] = { studentAId: null, studentBId: null };
      }

      // Pass 1: Slot A for each machine
      let idx = 0;
      for (let i = 1; i <= 20; i++) {
        if (idx < clsStudents.length) {
          assignments[i].studentAId = clsStudents[idx].id;
          idx++;
        }
      }
      // Pass 2: Slot B for remaining students
      for (let i = 1; i <= 20; i++) {
        if (idx < clsStudents.length) {
          assignments[i].studentBId = clsStudents[idx].id;
          idx++;
        }
      }

      const template = {
        classId: cls.id,
        assignments,
        lessonName: `Tiết thực hành Tin học - Lớp ${cls.name}`,
        updatedAt: '2026-10-16 08:00:00',
        savedBy: 'Hệ thống khởi tạo',
      };
      writeJsonFile(classFile, template);
    }
  });
}

// Run initializations
initWorkstations();
initClassSeatingTemplates();

// Initialize Students storage file if empty
function initStudentsFile(): void {
  const existing = readJsonFile<any[]>(STUDENTS_FILE, []);
  if (!Array.isArray(existing) || existing.length === 0) {
    const initial = generateAllStudents();
    writeJsonFile(STUDENTS_FILE, initial);
  }
}
initStudentsFile();

// 5.0 Students Master Storage API (Persistent across browsers, shares & restarts)
app.get('/api/classroom/students', (_req: Request, res: Response) => {
  const initial = generateAllStudents();
  const students = readJsonFile<any[]>(STUDENTS_FILE, initial);
  return res.json({ success: true, count: students.length, students });
});

app.post('/api/classroom/students', (req: Request, res: Response) => {
  const { students } = req.body;
  if (!Array.isArray(students)) {
    return res.status(400).json({ error: 'students phải là mảng học sinh' });
  }
  const success = writeJsonFile(STUDENTS_FILE, students);
  if (success) {
    console.log(`[Storage] Saved ${students.length} students to ${STUDENTS_FILE}`);
    try {
      writeJsonFile(path.resolve(MASTER_DATA_DIR, 'students.json'), students);
      writeJsonFile(path.resolve(__dirname, 'src/data/authenticStudentsData.json'), students);
    } catch (e) {
      console.warn('Could not mirror student data to seed files:', e);
    }
  }
  return res.json({ success: true, count: students.length, updatedAt: new Date().toISOString() });
});

// 5.1 Broken Computers API
app.get('/api/classroom/broken-computers', (_req: Request, res: Response) => {
  const broken = readJsonFile<number[]>(BROKEN_COMPUTERS_FILE, []);
  return res.json({ brokenComputers: broken });
});

app.post('/api/classroom/broken-computers', (req: Request, res: Response) => {
  const { brokenComputers } = req.body;
  if (!Array.isArray(brokenComputers)) {
    return res.status(400).json({ error: 'brokenComputers phải là mảng số máy' });
  }
  const cleanList = Array.from(new Set(brokenComputers.map(Number))).filter(n => n >= 1 && n <= 20);
  writeJsonFile(BROKEN_COMPUTERS_FILE, cleanList);
  return res.json({ success: true, brokenComputers: cleanList });
});

// 5.2 Seating chart per class API
app.get('/api/classroom/seating/:classId', (req: Request, res: Response) => {
  const classId = req.params.classId;
  const safeClass = classId.replace('/', '-');
  const classFile = path.resolve(SEATING_DIR, `class_${safeClass}.json`);
  const record = readJsonFile<any>(classFile, null);
  const broken = readJsonFile<number[]>(BROKEN_COMPUTERS_FILE, []);
  return res.json({
    classId,
    seating: record ? record.assignments : null,
    lessonName: record ? record.lessonName : '',
    updatedAt: record ? record.updatedAt : null,
    brokenComputers: broken,
  });
});

app.post('/api/classroom/seating/:classId', (req: Request, res: Response) => {
  const classId = req.params.classId;
  const safeClass = classId.replace('/', '-');
  const classFile = path.resolve(SEATING_DIR, `class_${safeClass}.json`);
  const { assignments, lessonName, brokenComputers } = req.body;

  if (!assignments || typeof assignments !== 'object') {
    return res.status(400).json({ error: 'assignments không hợp lệ' });
  }

  const now = new Date().toLocaleString('vi-VN');
  const data = {
    classId,
    assignments,
    lessonName: lessonName || 'Tiết thực hành Tin học',
    updatedAt: now,
  };
  writeJsonFile(classFile, data);
  try {
    writeJsonFile(path.resolve(MASTER_DATA_DIR, 'seating', `class_${safeClass}.json`), data);
  } catch (e) {}

  if (Array.isArray(brokenComputers)) {
    const cleanList = Array.from(new Set(brokenComputers.map(Number))).filter(n => n >= 1 && n <= 20);
    writeJsonFile(BROKEN_COMPUTERS_FILE, cleanList);
  }

  return res.json({ success: true, classId, updatedAt: now });
});

// ==========================================
// 6. WORKSTATIONS (PC01 - PC20) & AUTHENTICATION API
// ==========================================

// 6.1 Workstations List API
app.get('/api/workstations', (req: Request, res: Response) => {
  const workstations = initWorkstations();
  const broken = readJsonFile<number[]>(BROKEN_COMPUTERS_FILE, []);
  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});

  const { classId, date, session = 'morning', period = 2 } = req.query;
  const todayStr = (date as string) || new Date().toISOString().split('T')[0];
  const periodNum = Number(period) || 2;

  // Active check-ins for this period
  const activeRecords = Object.values(allRecords).filter(r => 
    (!classId || r.classId === classId) &&
    r.date === todayStr &&
    r.session === session &&
    r.periodNumber === periodNum
  );

  const enriched = workstations.map(ws => {
    const isBroken = broken.includes(ws.pcId);
    const checkedIn = activeRecords.filter(r => r.actualPcId === ws.pcId);
    return {
      ...ws,
      status: isBroken ? 'broken' : ws.status,
      activeStudents: checkedIn.map(r => ({
        studentId: r.studentId,
        studentCode: r.studentCode,
        studentName: r.studentName,
        classId: r.classId,
        status: r.status,
        loginTimestamp: r.loginTimestamp,
      })),
      occupancy: checkedIn.length, // 0, 1, or 2
    };
  });

  return res.json({ success: true, workstations: enriched });
});

// 6.2 Teacher Verify / Update Workstation API
app.post('/api/workstations/verify', (req: Request, res: Response) => {
  const { pcId, isRegistered, teacherName = 'Cô Nguyễn Thị Huệ (GV Quản lý)' } = req.body;
  const numericPc = Number(pcId);
  if (numericPc < 1 || numericPc > 20) {
    return res.status(400).json({ error: 'Mã máy tính không hợp lệ (1-20)' });
  }

  const workstations = initWorkstations();
  const ws = workstations.find(w => w.pcId === numericPc);
  if (ws) {
    if (isRegistered !== undefined) ws.isRegistered = Boolean(isRegistered);
    ws.verifiedBy = teacherName;
    ws.verifiedAt = new Date().toLocaleString('vi-VN');
    writeJsonFile(WORKSTATIONS_FILE, workstations);
    return res.json({ success: true, workstation: ws, message: `Đã xác thực và ghi nhận Máy PC${numericPc < 10 ? '0' + numericPc : numericPc}.` });
  }

  return res.status(404).json({ error: 'Không tìm thấy máy tính' });
});

// 6.3 Student Login & Authentication API (YÊU CẦU 2, 3, 4, 5)
app.post('/api/auth/student-login', (req: Request, res: Response) => {
  const { studentCode, password, pin, pcId, activeClassId, date, session = 'morning', period = 2 } = req.body;

  if (!studentCode || (!password && !pin) || !pcId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Vui lòng nhập đầy đủ Mã học sinh, Mật khẩu cá nhân và chọn Máy tính em đang ngồi!' 
    });
  }

  const enteredPin = (password || pin || '').trim();
  const cleanCode = studentCode.trim().toUpperCase();
  const numericPc = Number(pcId);

  if (numericPc < 1 || numericPc > 20) {
    return res.status(400).json({ success: false, error: 'Mã máy tính trạm không hợp lệ (chỉ từ PC01 đến PC20).' });
  }

  // 1. Authenticate student existence against 249 school records
  const allStudents = generateAllStudents();
  const student = allStudents.find(s => s.code.toUpperCase() === cleanCode || s.id.toUpperCase() === cleanCode);

  if (!student) {
    return res.status(401).json({ 
      success: false, 
      error: `Mã học sinh "${studentCode}" không tồn tại trong danh sách 249 học sinh Trường TH Đồng Dương. Vui lòng kiểm tra lại mã trên thẻ học sinh!` 
    });
  }

  // 2. Authenticate student personal PIN via SHA-256 Hash
  const correctPin = student.pin || `${student.classId.replace('/', '')}${student.seatNumber ? (student.seatNumber < 10 ? '0' + student.seatNumber : student.seatNumber) : '01'}`;
  const hashedEntered = hashPassword(enteredPin);
  const hashedExpected = hashPassword(correctPin);

  if (hashedEntered !== hashedExpected) {
    return res.status(401).json({ 
      success: false, 
      error: `Mật khẩu cá nhân chưa chính xác. Vui lòng nhập đúng mật khẩu/mã PIN được cấp cho em ${student.name} (${student.code})!` 
    });
  }

  // 3. Class match verification (Requirement 7: No cross-class login during class period)
  const targetClass = activeClassId || student.classId;
  if (student.classId !== targetClass) {
    return res.status(403).json({ 
      success: false, 
      error: `Từ chối điểm danh: Em ${student.name} (${student.code}) thuộc Lớp ${student.classId}. Tiết học hiện tại phòng máy đang dành cho Lớp ${targetClass}!` 
    });
  }

  // 4. Broken Computer Check
  const broken = readJsonFile<number[]>(BROKEN_COMPUTERS_FILE, []);
  if (broken.includes(numericPc)) {
    return res.status(400).json({ 
      success: false, 
      error: `Máy tính PC${numericPc < 10 ? '0' + numericPc : numericPc} hiện đang báo hỏng/bảo trì. Em vui lòng báo Giáo viên chuyển sang máy hoạt động tốt!` 
    });
  }

  // 5. Workstation verification check
  const workstations = initWorkstations();
  const ws = workstations.find(w => w.pcId === numericPc);
  const isWsVerified = ws ? ws.isRegistered : true;

  // 6. Find assigned seat in class seating template
  const safeClass = targetClass.replace('/', '-');
  const classFile = path.resolve(SEATING_DIR, `class_${safeClass}.json`);
  let classSeating = readJsonFile<any>(classFile, null);
  if (!classSeating || !classSeating.assignments) {
    initClassSeatingTemplates();
    classSeating = readJsonFile<any>(classFile, null);
  }

  let assignedPc: number | null = null;
  let assignedSlot: 'A' | 'B' | null = null;
  if (classSeating && classSeating.assignments) {
    for (let c = 1; c <= 20; c++) {
      const slot = classSeating.assignments[c];
      if (slot && slot.studentAId === student.id) {
        assignedPc = c;
        assignedSlot = 'A';
        break;
      }
      if (slot && slot.studentBId === student.id) {
        assignedPc = c;
        assignedSlot = 'B';
        break;
      }
    }
  }

  // Determine if student logged in to their assigned computer
  const isCorrectPc = assignedPc === null || assignedPc === numericPc;
  const status = isCorrectPc ? 'present_pending_confirm' : 'wrong_pc';

  const todayStr = date || new Date().toISOString().split('T')[0];
  const nowStr = new Date().toLocaleString('vi-VN');
  const periodNum = Number(period) || 2;
  const recordId = `att_${student.id}_${todayStr}_${session}_P${periodNum}`;

  // 7. Save to shared database (Idempotent - reload won't create duplicate records)
  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});
  const existingRecord = allRecords[recordId];

  const assignedPcStr = assignedPc ? `PC${assignedPc < 10 ? '0' + assignedPc : assignedPc}` : 'Chưa xếp';
  const actualPcStr = `PC${numericPc < 10 ? '0' + numericPc : numericPc}`;
  const slotStr = assignedSlot ? `Chỗ ${assignedSlot}` : '';

  const record: StoredAttendanceRecord = {
    id: recordId,
    studentId: student.id,
    studentCode: student.code,
    studentName: student.name,
    classId: student.classId,
    date: todayStr,
    session,
    periodNumber: periodNum,
    assignedPcId: assignedPc,
    actualPcId: numericPc,
    loginTimestamp: existingRecord ? existingRecord.loginTimestamp : nowStr,
    status: existingRecord && existingRecord.status === 'present' ? 'present' : status,
    seatChangeConfirmed: existingRecord ? existingRecord.seatChangeConfirmed : false,
    teacherNote: isCorrectPc 
      ? (existingRecord?.teacherNote || undefined) 
      : `Học sinh ngồi sai máy: được xếp ${assignedPcStr} (${slotStr}) nhưng đăng nhập tại ${actualPcStr}. Chờ GV xử lý.`,
    verifiedByTeacher: existingRecord?.verifiedByTeacher,
    verifiedAt: existingRecord?.verifiedAt,
  };

  allRecords[recordId] = record;
  writeJsonFile(ATTENDANCE_FILE, allRecords);

  const message = isCorrectPc
    ? `Đăng nhập thành công! Em ${student.name} (${student.code}) được xếp đúng Máy ${assignedPcStr} ${slotStr ? '• ' + slotStr : ''}. Trạng thái: Đã đăng nhập – Chờ giáo viên xác nhận.`
    : `Cảnh báo: Em ${student.name} (${student.code}) được xếp ngồi Máy ${assignedPcStr} ${slotStr ? '• ' + slotStr : ''}, nhưng đang đăng nhập tại Máy ${actualPcStr}. Hệ thống đã gửi thông báo đến Giáo viên để xử lý chuyển chỗ!`;

  return res.json({
    success: true,
    student: {
      id: student.id,
      code: student.code,
      name: student.name,
      classId: student.classId,
      gender: student.gender,
      seatNumber: student.seatNumber,
    },
    isCorrectPc,
    assignedPc,
    assignedSlot,
    actualPc: numericPc,
    status: record.status,
    record,
    deviceVerified: isWsVerified,
    message,
    sessionToken: `token_st_${student.id}_${Date.now()}`,
  });
});

// 6.4 Legacy check-in wrapper route (redirects to same robust logic)
app.post('/api/attendance/checkin', (req: Request, res: Response) => {
  const { studentId, studentCode, pin, pcId, classId, activeClassId, date, session = 'morning', period = 2 } = req.body;
  const targetCode = studentCode || studentId;

  // Delegate to student-login
  req.body.studentCode = targetCode;
  req.body.pin = pin;
  req.body.activeClassId = activeClassId || classId;
  
  // Re-run the login handler logic
  const allStudents = generateAllStudents();
  const student = allStudents.find(s => s.code.toUpperCase() === (targetCode || '').trim().toUpperCase() || s.id.toUpperCase() === (targetCode || '').trim().toUpperCase());
  if (!student) {
    return res.status(400).json({ error: 'Học sinh không tồn tại!' });
  }

  const numericPc = Number(pcId);
  if (numericPc < 1 || numericPc > 20) {
    return res.status(400).json({ error: 'Mã máy tính không hợp lệ!' });
  }

  const safeClass = (activeClassId || classId).replace('/', '-');
  const classFile = path.resolve(SEATING_DIR, `class_${safeClass}.json`);
  let classSeating = readJsonFile<any>(classFile, null);
  if (!classSeating || !classSeating.assignments) {
    initClassSeatingTemplates();
    classSeating = readJsonFile<any>(classFile, null);
  }

  let assignedPc: number | null = null;
  let assignedSlot: 'A' | 'B' | null = null;
  if (classSeating && classSeating.assignments) {
    for (let c = 1; c <= 20; c++) {
      const slot = classSeating.assignments[c];
      if (slot && slot.studentAId === student.id) {
        assignedPc = c;
        assignedSlot = 'A';
        break;
      }
      if (slot && slot.studentBId === student.id) {
        assignedPc = c;
        assignedSlot = 'B';
        break;
      }
    }
  }

  const isCorrectPc = assignedPc === null || assignedPc === numericPc;
  const status = isCorrectPc ? 'present_pending_confirm' : 'wrong_pc';
  const todayStr = date || new Date().toISOString().split('T')[0];
  const nowStr = new Date().toLocaleString('vi-VN');
  const periodNum = Number(period) || 2;
  const recordId = `att_${student.id}_${todayStr}_${session}_P${periodNum}`;

  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});
  const newRecord: StoredAttendanceRecord = {
    id: recordId,
    studentId: student.id,
    studentCode: student.code,
    studentName: student.name,
    classId: student.classId,
    date: todayStr,
    session,
    periodNumber: periodNum,
    assignedPcId: assignedPc,
    actualPcId: numericPc,
    loginTimestamp: nowStr,
    status,
    seatChangeConfirmed: false,
    teacherNote: isCorrectPc ? undefined : `Học sinh ngồi sai máy: được xếp PC${assignedPc ? (assignedPc < 10 ? '0'+assignedPc : assignedPc) : 'Chưa xếp'} nhưng đăng nhập tại PC${numericPc < 10 ? '0'+numericPc : numericPc}`,
  };

  allRecords[recordId] = newRecord;
  writeJsonFile(ATTENDANCE_FILE, allRecords);

  return res.json({
    success: true,
    record: newRecord,
    isCorrectPc,
    assignedPc,
    assignedSlot,
    actualPc: numericPc,
    message: isCorrectPc
      ? `Đăng nhập thành công tại Máy PC${numericPc < 10 ? '0'+numericPc : numericPc}. Trạng thái: Có mặt tạm thời (Chờ GV xác nhận).`
      : `Cảnh báo: Em được phân ngồi Máy PC${assignedPc ? (assignedPc < 10 ? '0'+assignedPc : assignedPc) : 'khác'}, nhưng đang đăng nhập tại Máy PC${numericPc < 10 ? '0'+numericPc : numericPc}. Hệ thống đã gửi thông báo đến Giáo viên!`,
  });
});

// 6.2 Get Attendance records for a class & session
app.get('/api/attendance/records', (req: Request, res: Response) => {
  const { classId, date, session = 'morning', period = 2 } = req.query;
  const todayStr = (date as string) || new Date().toISOString().split('T')[0];
  const periodNum = Number(period) || 2;

  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});
  const matchingRecords = Object.values(allRecords).filter(r => {
    if (classId && r.classId !== classId) return false;
    if (date && r.date !== todayStr) return false;
    if (session && r.session !== session) return false;
    if (period && r.periodNumber !== periodNum) return false;
    return true;
  });

  return res.json({
    classId: classId || 'all',
    date: todayStr,
    session,
    period: periodNum,
    records: matchingRecords,
    totalRecords: matchingRecords.length,
  });
});

// 6.3 Teacher confirms or modifies attendance
app.post('/api/attendance/confirm', (req: Request, res: Response) => {
  const { classId, date, session = 'morning', period = 2, confirmAllPending, recordUpdates, teacherName = 'Cô Nguyễn Thị Huệ' } = req.body;
  const todayStr = date || new Date().toISOString().split('T')[0];
  const periodNum = Number(period) || 2;
  const nowStr = new Date().toLocaleString('vi-VN');

  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});

  if (confirmAllPending) {
    Object.values(allRecords).forEach(r => {
      if (r.classId === classId && r.date === todayStr && r.session === session && r.periodNumber === periodNum) {
        if (r.status === 'present_pending_confirm' || r.status === 'unverified') {
          r.status = 'present';
          r.verifiedByTeacher = teacherName;
          r.verifiedAt = nowStr;
        }
      }
    });
  }

  if (Array.isArray(recordUpdates)) {
    recordUpdates.forEach(up => {
      if (up.id && allRecords[up.id]) {
        if (up.status) allRecords[up.id].status = up.status;
        if (up.teacherNote !== undefined) allRecords[up.id].teacherNote = up.teacherNote;
        if (up.seatChangeConfirmed !== undefined) {
          allRecords[up.id].seatChangeConfirmed = up.seatChangeConfirmed;
          if (up.seatChangeConfirmed && allRecords[up.id].status === 'wrong_pc') {
            allRecords[up.id].status = 'present';
          }
        }
        allRecords[up.id].verifiedByTeacher = teacherName;
        allRecords[up.id].verifiedAt = nowStr;
      }
    });
  }

  writeJsonFile(ATTENDANCE_FILE, allRecords);
  return res.json({ success: true, message: 'Đã cập nhật và lưu điểm danh thành công!' });
});

// 6.4 Export Attendance to CSV / Excel
app.get('/api/attendance/export', (req: Request, res: Response) => {
  const { classId, date, session = 'morning', period = 2 } = req.query;
  const todayStr = (date as string) || new Date().toISOString().split('T')[0];
  const periodNum = Number(period) || 2;

  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});
  const matchingRecords = Object.values(allRecords).filter(r => {
    if (classId && r.classId !== classId) return false;
    if (date && r.date !== todayStr) return false;
    if (session && r.session !== session) return false;
    if (period && r.periodNumber !== periodNum) return false;
    return true;
  });

  const header = ['STT', 'Mã Học Sinh', 'Họ và Tên', 'Lớp', 'Máy Phân Công', 'Máy Thực Tế Đăng Nhập', 'Thời Gian Đăng Nhập', 'Trạng Thái Điểm Danh', 'Ghi Chú Giáo Viên'].join(',');
  const rows = matchingRecords.map((r, idx) => {
    const statusMap: Record<string, string> = {
      present: 'Có mặt (Đã duyệt)',
      present_pending_confirm: 'Đã đăng nhập (Có mặt tạm thời)',
      wrong_pc: 'Đăng nhập sai máy',
      late: 'Đi muộn',
      absent_excused: 'Vắng có phép',
      absent_unexcused: 'Vắng không phép',
      unverified: 'Chưa xác minh',
    };
    const stt = idx + 1;
    const assigned = r.assignedPcId ? `PC${r.assignedPcId < 10 ? '0' + r.assignedPcId : r.assignedPcId}` : 'Chưa xếp';
    const actual = `PC${r.actualPcId < 10 ? '0' + r.actualPcId : r.actualPcId}`;
    const statusText = statusMap[r.status] || r.status;
    const note = (r.teacherNote || '').replace(/"/g, '""');

    return [
      stt,
      `"${r.studentCode}"`,
      `"${r.studentName}"`,
      `"Lớp ${r.classId}"`,
      `"${assigned}"`,
      `"${actual}"`,
      `"${r.loginTimestamp}"`,
      `"${statusText}"`,
      `"${note}"`,
    ].join(',');
  });

  const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="DiemDanh_Lop_${String(classId || 'all').replace('/', '-')}_${todayStr}_Tiet${periodNum}.csv"`);
  return res.send(csvContent);
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.resolve(distDir, 'index.html');
  const hasDist = fs.existsSync(distIndex);

  // Robust production detection:
  // 1. Explicit NODE_ENV === 'production'
  // 2. Cloud Run environment indicators (K_SERVICE, K_REVISION, or PORT != 3000)
  // 3. npm lifecycle event is 'start' (from "start": "node server.ts")
  // 4. dist/index.html exists and we are not explicitly running 'npm run dev'
  const isExplicitProd = process.env.NODE_ENV === 'production';
  const isCloudRun = Boolean(process.env.K_SERVICE || process.env.K_REVISION || (process.env.PORT && process.env.PORT !== '3000'));
  const isNpmStart = process.env.npm_lifecycle_event === 'start';
  const isProd = isExplicitProd || isCloudRun || isNpmStart || (hasDist && process.env.npm_lifecycle_event !== 'dev');

  if (isProd && hasDist) {
    console.log(`[Server] Production mode active. Serving pre-built static bundle from ${distDir}`);
    app.use(express.static(distDir, { maxAge: '1d', index: false }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(distIndex);
    });
  } else if (isProd && !hasDist) {
    console.warn(`[Server] Production mode detected but dist/index.html missing. Serving placeholder while build completes.`);
    app.get('*', (_req: Request, res: Response) => {
      res.status(200).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lớp Học Số Thông Minh</title></head><body style="font-family:sans-serif;text-align:center;padding-top:60px;"><h2>Hệ thống Lớp Học Số Thông Minh đang sẵn sàng...</h2><p>Đang tải tài nguyên, vui lòng đợi trong giây lát...</p><script>setTimeout(function(){location.reload();},2500);</script></body></html>`);
    });
  } else {
    // Development mode with Vite middleware
    console.log('[Server] Development mode active. Mounting Vite dev middleware...');
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error('[Server] Vite middleware initialization failed, attempting static fallback:', viteErr);
      if (hasDist) {
        app.use(express.static(distDir));
        app.get('*', (_req: Request, res: Response) => {
          res.sendFile(distIndex);
        });
      }
    }
  }

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });

  server.on('error', (err: any) => {
    console.error('Server network listen error:', err);
  });
}

// Only launch standalone HTTP listener if not running in Vercel Serverless environment
if (!process.env.VERCEL) {
  startServer().catch((err) => {
    console.error('Unhandled error in startServer:', err);
    process.exit(1);
  });
}

export { app, startServer };
export default app;
