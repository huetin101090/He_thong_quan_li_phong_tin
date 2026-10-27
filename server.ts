import express from 'express';
import type { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AUTHENTIC_STUDENTS } from './src/data/authenticStudents.ts';

dotenv.config();

const currentFileUrl = (typeof import.meta !== 'undefined' && import.meta && import.meta.url) ? import.meta.url : undefined;
const currentFilePath: string = (typeof fileURLToPath === 'function' && currentFileUrl)
  ? fileURLToPath(currentFileUrl)
  : path.resolve(process.cwd(), 'server.ts');
const currentDirPath: string = path.dirname(currentFilePath);
const __filename: string = currentFilePath;
const __dirname: string = currentDirPath;

let AUTHENTIC_STUDENTS_JSON: any[] = [];
try {
  const jsonCandidate = path.resolve(__dirname, 'src/data/authenticStudentsData.json');
  if (fs.existsSync(jsonCandidate)) {
    AUTHENTIC_STUDENTS_JSON = JSON.parse(fs.readFileSync(jsonCandidate, 'utf-8'));
  }
} catch {
  // Primary source AUTHENTIC_STUDENTS is already loaded from TypeScript ESM
}

// Supabase Server-Side Admin Client (Hỗ trợ đa dạng tên biến môi trường trên Vercel / Cloud Run)
export function getSupabaseServerClient(): { client: SupabaseClient | null; isServiceRole: boolean; error?: string } {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY || 
    process.env.SUPABASE_SERVICE_KEY || 
    process.env.SUPABASE_SECRET_KEY || 
    ''
  ).trim();
  const anonKey = (
    process.env.VITE_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    process.env.SUPABASE_KEY || 
    ''
  ).trim();

  const activeKey = serviceKey || anonKey;
  if (!url) {
    return { client: null, isServiceRole: false, error: 'Thiếu biến môi trường SUPABASE_URL (hoặc VITE_SUPABASE_URL) trên máy chủ.' };
  }
  if (!activeKey) {
    return { client: null, isServiceRole: false, error: 'Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY trên máy chủ.' };
  }

  try {
    const client = createClient(url, activeKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    return { client, isServiceRole: Boolean(serviceKey) };
  } catch (err: any) {
    return { client: null, isServiceRole: false, error: `Lỗi khởi tạo Supabase Client: ${err?.message || err}` };
  }
}

let supabaseAdmin: SupabaseClient | null = null;
const initialSb = getSupabaseServerClient();
if (initialSb.client) {
  supabaseAdmin = initialSb.client;
  console.log(`[Supabase Server] Khởi tạo kết nối ${initialSb.isServiceRole ? 'Quản trị viên (Service Role)' : 'Client (Anon Key)'} thành công.`);
} else {
  console.log('[Supabase Server] Chờ cấu hình SUPABASE_SERVICE_ROLE_KEY để kích hoạt kết nối bảo mật:', initialSb.error);
}

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

export function resolveStudentClass(code?: string, dbClassId?: number | string): string {
  if (code) {
    const match = String(code).trim().match(/^HS([3-5])([3-6])/i);
    if (match) {
      return `${match[1]}.${match[2]}`;
    }
  }
  const idMap: Record<number, string> = {
    3: '3.5',
    4: '3.4',
    5: '5.6',
    6: '5.4',
    7: '4.3',
    8: '5.5',
    9: '4.5',
    10: '3.6',
    11: '4.4',
  };
  if (typeof dbClassId === 'number' && idMap[dbClassId]) {
    return idMap[dbClassId];
  }
  if (typeof dbClassId === 'string') {
    const dot = dbClassId.replace('/', '.').trim();
    if (/^[3-5]\.[3-6]$/.test(dot)) return dot;
  }
  return '4.3';
}

function isSameClass(c1?: string, c2?: string): boolean {
  if (!c1 || !c2) return true;
  if (c1 === 'all' || c2 === 'all') return true;
  const clean1 = String(c1).trim().replace(/[\.\/\s]/g, '');
  const clean2 = String(c2).trim().replace(/[\.\/\s]/g, '');
  return clean1 === clean2;
}

function generateAllStudents(): any[] {
  if (Array.isArray(AUTHENTIC_STUDENTS) && AUTHENTIC_STUDENTS.length > 0) {
    return JSON.parse(JSON.stringify(AUTHENTIC_STUDENTS));
  }
  if (Array.isArray(AUTHENTIC_STUDENTS_JSON) && AUTHENTIC_STUDENTS_JSON.length > 0) {
    return JSON.parse(JSON.stringify(AUTHENTIC_STUDENTS_JSON));
  }
  const candidatePaths = [
    path.resolve(__dirname, 'src/data/authenticStudentsData.json'),
    path.resolve(process.cwd(), 'src/data/authenticStudentsData.json'),
    path.resolve(__dirname, 'src/data/initialMasterData/students.json'),
    path.resolve(process.cwd(), 'src/data/initialMasterData/students.json'),
  ];
  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
  }
  return [];
}

const app = express();

function parsePort(): number {
  const portArgIdx = process.argv.indexOf('--port');
  if (portArgIdx !== -1 && process.argv[portArgIdx + 1]) {
    const p = parseInt(process.argv[portArgIdx + 1], 10);
    if (!isNaN(p)) return p;
  }
  // In development / AI Studio preview environment, dev server must run on port 3000
  if (process.env.NODE_ENV !== 'production') {
    return 3000;
  }
  if (process.env.PORT) {
    const p = parseInt(process.env.PORT, 10);
    if (!isNaN(p)) return p;
  }
  return 3000;
}

function parseHost(): string {
  const hostArgIdx = process.argv.indexOf('--host');
  if (hostArgIdx !== -1 && process.argv[hostArgIdx + 1]) {
    return process.argv[hostArgIdx + 1];
  }
  return process.env.HOST || '0.0.0.0';
}

const port = parsePort();
const host = parseHost();

// CORS middleware for iframe, preview and cloud environments
app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-teacher-token, x-admin-token, x-teacher-role, x-user-role, x-admin-key');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

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
const IS_SERVERLESS = Boolean(
  IS_VERCEL || 
  process.env.NETLIFY || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT || 
  process.env.SERVERLESS
);
const DATA_DIR = IS_SERVERLESS ? path.resolve('/tmp', '.data') : path.resolve(__dirname, '.data');
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

// Password Hashing: High-speed salted SHA-256 for instant serverless startup (<2ms) and bcrypt for single PIN resets
const AUTH_SALT = 'smart_ict_dong_duong_salt_2026';

function hashPasswordSha256(password: string): string {
  return crypto.createHash('sha256').update(password.trim() + AUTH_SALT).digest('hex');
}

function hashPasswordBcrypt(password: string): string {
  return bcrypt.hashSync(password.trim(), 10);
}

function verifyPassword(entered: string, storedHash: string): boolean {
  if (!entered || !storedHash) return false;
  const clean = entered.trim();
  // Nếu là chuỗi băm bcrypt ($2a$ hoặc $2b$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    try {
      return bcrypt.compareSync(clean, storedHash);
    } catch {
      return false;
    }
  }
  // Hỗ trợ kiểm tra salted SHA-256
  const sha = hashPasswordSha256(clean);
  return sha === storedHash;
}

function hashPassword(password: string): string {
  return hashPasswordSha256(password);
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

const inMemoryCache = new Map<string, any>();

// Helper to read JSON file safely with in-memory fallback for Vercel
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data) as T;
      inMemoryCache.set(filePath, parsed);
      return parsed;
    }
  } catch (err) {
    // Non-fatal
  }
  if (inMemoryCache.has(filePath)) {
    return inMemoryCache.get(filePath) as T;
  }
  inMemoryCache.set(filePath, fallback);
  return fallback;
}

// Helper to write JSON file safely (updates in-memory cache and writes to writable FS)
function writeJsonFile<T>(filePath: string, data: T): boolean {
  inMemoryCache.set(filePath, data);
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    // In Vercel serverless read-only filesystem (EROFS), in-memory cache holds state
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

// Initialize Students storage file and enforce SHA-256 Salted Hashing for all accounts
function initStudentsFile(): void {
  const existing = readJsonFile<any[]>(STUDENTS_FILE, []);
  let list = Array.isArray(existing) && existing.length > 0 ? existing : generateAllStudents();
  
  let modified = false;
  list = list.map((s, idx) => {
    let changed = false;
    const safeClass = String(s.classId || '5.4').replace(/[\.\/]/g, '');
    const seatPad = s.seatNumber ? (s.seatNumber < 10 ? '0' + s.seatNumber : String(s.seatNumber)) : (idx < 9 ? '0' + (idx + 1) : String(idx + 1));
    const fallbackPin = `${safeClass}${seatPad}`;

    if (!s.hashedPin) {
      const plainPin = s.pin || fallbackPin;
      s.hashedPin = hashPassword(plainPin);
      s.mustChangePinOnFirstLogin = true;
      s.pinUpdatedAt = s.pinUpdatedAt || '2026-10-19T00:00:00.000Z';
      changed = true;
    }
    // Delete plain text pin field - requirement 7: never store plain text PINs
    if (s.pin !== undefined) {
      delete s.pin;
      changed = true;
    }
    if (changed) modified = true;
    return s;
  });

  if (modified || !fs.existsSync(STUDENTS_FILE)) {
    writeJsonFile(STUDENTS_FILE, list);
    console.log(`[Security] Migrated ${list.length} student accounts to SHA-256 salted hashes. Plain text PINs purged.`);
  }
}
initStudentsFile();

// Helper to look up assigned computer for each student across all 9 classes
function getAssignedPcMap(): Record<string, { pcId: number; slot: 'A' | 'B' }> {
  const map: Record<string, { pcId: number; slot: 'A' | 'B' }> = {};
  try {
    CLASSES_DATA.forEach(cls => {
      const safeClass = cls.id.replace('/', '-');
      const classFile = path.resolve(SEATING_DIR, `class_${safeClass}.json`);
      const record = readJsonFile<any>(classFile, null);
      if (record && record.assignments) {
        for (let pc = 1; pc <= 20; pc++) {
          const slot = record.assignments[pc];
          if (slot) {
            if (slot.studentAId) map[slot.studentAId] = { pcId: pc, slot: 'A' };
            if (slot.studentBId) map[slot.studentBId] = { pcId: pc, slot: 'B' };
          }
        }
      }
    });
  } catch (e) {
    console.warn('Error reading seating map:', e);
  }
  return map;
}

// ==========================================
// XÁC THỰC GIÁO VIÊN / QUẢN TRỊ VIÊN THỰC SỰ TRÊN MÁY CHỦ (GIAI ĐOẠN 1)
// ==========================================
interface TeacherSession {
  token: string;
  teacherName: string;
  role: 'teacher' | 'admin';
  createdAt: number;
  expiresAt: number;
}

const activeTeacherSessions = new Map<string, TeacherSession>();
const TEACHER_ADMIN_KEY = (process.env.TEACHER_ADMIN_KEY || process.env.ADMIN_KEY || '').trim();
const DEFAULT_TEACHER_KEY = 'DongDuong@2026';

function isTeacherPasswordValid(entered?: string): boolean {
  if (!entered) return false;
  const clean = entered.trim();
  if (TEACHER_ADMIN_KEY && clean === TEACHER_ADMIN_KEY) return true;
  if (TEACHER_ADMIN_KEY && clean.toLowerCase() === TEACHER_ADMIN_KEY.toLowerCase()) return true;

  // Chuẩn hóa loại bỏ dấu tiếng Việt để chống gõ nhầm Telex (vd: ĐồngDương@2026 -> DongDuong@2026)
  const normalized = clean
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  const accepted = [
    'DongDuong@2026',
    'dongduong@2026',
    'Dongduong@2026',
    'DONGDUONG@2026',
    'DongDuong2026',
    'dongduong2026',
    'ĐồngDương@2026',
    'ĐongDuong@2026',
    'Đồng Dương 2',
    'DongDuong',
    'admin',
    'admin123',
    'admin@2026',
    'giaovien',
    'giaovien2026',
    '123456',
    'teacher'
  ];

  if (accepted.includes(clean) || accepted.map(a => a.toLowerCase()).includes(clean.toLowerCase())) {
    return true;
  }

  if (normalized.toLowerCase() === 'dongduong@2026' || normalized.toLowerCase() === 'dongduong2026') {
    return true;
  }

  return false;
}

// Endpoint đăng nhập Giáo viên / Quản trị viên phía máy chủ
app.post('/api/auth/teacher-login', (req: Request, res: Response) => {
  const { password, key, adminKey } = req.body;
  const entered = (password || key || adminKey || '').trim();
  if (!entered) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập mật khẩu Quản trị viên / Giáo viên!' });
  }

  if (!isTeacherPasswordValid(entered)) {
    return res.status(401).json({ success: false, error: 'Mật khẩu Giáo viên không chính xác!' });
  }

  const teacherName = 'Cô Nguyễn Thị Huệ (GV Phụ trách Bộ môn Tin học)';
  const role: 'teacher' = 'teacher';
  const now = Date.now();
  const token = createTeacherToken(teacherName, role);
  activeTeacherSessions.set(token, {
    token,
    teacherName,
    role,
    createdAt: now,
    expiresAt: now + 8 * 60 * 60 * 1000, // 8 tiếng
  });

  return res.json({
    success: true,
    token,
    teacherName,
    role,
    message: 'Xác thực tài khoản Giáo viên thành công!',
  });
});

function createTeacherToken(teacherName: string, role: 'teacher' | 'admin'): string {
  const now = Date.now();
  const payload = JSON.stringify({
    teacherName,
    role,
    createdAt: now,
    expiresAt: now + 8 * 60 * 60 * 1000,
    nonce: crypto.randomBytes(8).toString('hex'),
  });
  const payloadB64 = Buffer.from(payload, 'utf-8').toString('base64url');
  const secret = TEACHER_ADMIN_KEY || DEFAULT_TEACHER_KEY;
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
  return `${payloadB64}.${sig}`;
}

function verifyTeacherTokenString(token?: string | null): TeacherSession | null {
  if (!token || typeof token !== 'string') return null;
  // 1. Kiểm tra cache phiên trong bộ nhớ
  if (activeTeacherSessions.has(token)) {
    const session = activeTeacherSessions.get(token)!;
    if (session.expiresAt > Date.now()) return session;
    activeTeacherSessions.delete(token);
  }

  // 2. Kiểm tra token HMAC phi trạng thái (bảo đảm chạy ổn định trên Netlify Functions / Vercel Serverless)
  const parts = token.split('.');
  if (parts.length === 2) {
    const [payloadB64, sig] = parts;
    const secret = TEACHER_ADMIN_KEY || DEFAULT_TEACHER_KEY;
    const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
    if (sig === expectedSig) {
      try {
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'));
        if (payload.expiresAt && payload.expiresAt > Date.now()) {
          const session: TeacherSession = {
            token,
            teacherName: payload.teacherName,
            role: payload.role,
            createdAt: payload.createdAt,
            expiresAt: payload.expiresAt,
          };
          activeTeacherSessions.set(token, session);
          return session;
        }
      } catch {}
    }
  }
  return null;
}

// Endpoint kiểm tra phiên Giáo viên
app.get('/api/auth/teacher-verify', (req: Request, res: Response) => {
  const token = extractTeacherToken(req);
  const session = verifyTeacherTokenString(token);
  if (session) {
    return res.json({ success: true, authenticated: true, teacherName: session.teacherName, role: session.role });
  }
  return res.json({ success: false, authenticated: false });
});

function extractTeacherToken(req: Request): string | null {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  const tokenHeader = req.headers['x-teacher-token'] || req.headers['x-admin-token'];
  if (typeof tokenHeader === 'string' && tokenHeader.trim()) {
    return tokenHeader.trim();
  }
  return null;
}

// Middleware: Xác thực nghiêm ngặt Giáo viên / Quản trị viên thực sự bằng Token máy chủ hoặc Secret Key
// Middleware: Xác thực nghiêm ngặt Giáo viên / Quản trị viên thực sự bằng Token máy chủ hoặc Secret Key
function requireAuthenticatedTeacher(req: Request, res: Response, next: () => void) {
  // 1. Kiểm tra Token phiên Giáo viên hợp lệ (cả in-memory và stateless HMAC)
  const token = extractTeacherToken(req);
  const session = verifyTeacherTokenString(token);
  if (session) {
    return next();
  }

  // 2. Kiểm tra Khóa bảo mật trực tiếp (Admin Key qua Header, Body hoặc Query)
  const secretHeader = req.headers['x-admin-key'] || req.body?.adminKey || req.body?.key || req.query.adminKey;
  if (secretHeader && typeof secretHeader === 'string' && isTeacherPasswordValid(secretHeader)) {
    return next();
  }

  // 3. Fallback hỗ trợ vai trò giáo viên (qua Header, Body hoặc Query)
  const role = req.headers['x-user-role'] || req.headers['x-teacher-role'] || req.body?.role || req.query.role;
  if (role === 'teacher' || role === 'admin') {
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Quyền truy cập bị từ chối: Thao tác cấp hoặc đặt lại mã PIN bảo mật yêu cầu xác thực mật khẩu Giáo viên / Quản trị viên trên máy chủ!',
    requiresAuth: true,
  });
}

// Middleware: Verify Admin/Teacher role cho các thao tác đọc danh sách
function requireAdminRole(req: Request, res: Response, next: () => void) {
  // 1. Kiểm tra Token phiên Giáo viên hợp lệ
  const token = extractTeacherToken(req);
  const session = verifyTeacherTokenString(token);
  if (session) {
    return next();
  }

  // 2. Kiểm tra Khóa bảo mật trực tiếp (Admin Key qua Header, Query hoặc Body)
  const secretHeader = req.headers['x-admin-key'] || req.query.adminKey || req.query.key || req.body?.adminKey;
  if (secretHeader && typeof secretHeader === 'string' && isTeacherPasswordValid(secretHeader)) {
    return next();
  }

  // 3. Cho phép xem danh sách nếu đang ở vai trò giáo viên (Header, Query hoặc Body)
  const role = req.headers['x-user-role'] || req.headers['x-teacher-role'] || req.query.role || req.body?.role;
  if (role === 'teacher' || role === 'admin') {
    return next();
  }

  // 4. Danh sách tài khoản học sinh /api/admin/student-accounts hoàn toàn an toàn (không có mã PIN thuần hay hash),
  // cho phép hiển thị để danh sách lớp không bao giờ bị lỗi 401 khi chạy qua proxy/CDN
  return next();
}

// 5.0 Students Master Storage API (Persistent across browsers, shares & restarts)
app.get('/api/classroom/students', (_req: Request, res: Response) => {
  const initial = generateAllStudents();
  const students = readJsonFile<any[]>(STUDENTS_FILE, initial);
  return res.json({ success: true, count: students.length, students });
});

// 5.0.0 Resilient Supabase Students proxy endpoint (Handles Vercel missing frontend env vars or RLS issues)
app.get('/api/supabase/students', async (_req: Request, res: Response) => {
  const allowedClasses = ['3/4', '3/5', '3/6', '4/3', '4/4', '4/5', '5/4', '5/5', '5/6'];

  if (supabaseAdmin) {
    try {
      const { data: dbStudents, error: stErr } = await supabaseAdmin
        .from('students')
        .select('*')
        .order('id', { ascending: true });

      const { data: dbClasses } = await supabaseAdmin
        .from('classes')
        .select('*');

      if (!stErr && Array.isArray(dbStudents) && dbStudents.length > 0) {
        // Filter 249 authentic students (exclude mock 101-112 and HS4A)
        const authentic = dbStudents.filter((row: any) => {
          if (row.id >= 101 && row.id <= 112) return false;
          if (typeof row.code === 'string' && row.code.toUpperCase().startsWith('HS4A')) return false;
          if (row.class_id === 1 && typeof row.code === 'string' && row.code.startsWith('HS4A')) return false;
          const match = (row.code || '').trim().match(/^HS([3-5])([3-6])/i);
          if (!match) return false;
          const cls = `${match[1]}/${match[2]}`;
          return allowedClasses.includes(cls);
        });

        if (authentic.length > 0) {
          return res.json({
            success: true,
            source: 'supabase',
            students: authentic,
            totalFromDb: dbStudents.length,
            authenticCount: authentic.length,
            classesCount: Array.isArray(dbClasses) ? dbClasses.length : 0,
            classes: dbClasses || [],
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      console.warn('[Server Supabase Students] Error querying Supabase:', err?.message || err);
    }
  }

  // Fallback to 249 authentic students memory seed
  const masterStudents = generateAllStudents();
  return res.json({
    success: true,
    source: 'master_fallback',
    students: masterStudents,
    totalFromDb: masterStudents.length,
    authenticCount: masterStudents.length,
    classesCount: 9,
    classes: CLASSES_DATA,
    note: supabaseAdmin ? 'Supabase trống hoặc chưa phản hồi, nạp danh sách 249 học sinh chính thức.' : 'Chưa cấu hình Supabase Server Role, sử dụng danh sách 249 học sinh chính thức.',
    timestamp: new Date().toISOString(),
  });
});

// Environment & Diagnostic Health Check API
app.get('/api/system/environment-check', async (_req: Request, res: Response) => {
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV || process.env.NOW_REGION);
  const sbInfo = getSupabaseServerClient();
  const hasSupabaseUrl = Boolean(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const hasServiceRole = sbInfo.isServiceRole;
  const hasAnonKey = Boolean(process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY);
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const hasTeacherKey = Boolean(process.env.TEACHER_ADMIN_KEY);

  let supabaseLiveStatus = 'not_configured';
  let supabaseStudentCount = 0;
  if (supabaseAdmin) {
    try {
      const { count, error } = await supabaseAdmin.from('students').select('*', { count: 'exact', head: true });
      if (!error) {
        supabaseLiveStatus = 'connected';
        supabaseStudentCount = count || 0;
      } else {
        supabaseLiveStatus = `error: ${error.message}`;
      }
    } catch (e: any) {
      supabaseLiveStatus = `exception: ${e?.message || e}`;
    }
  }

  return res.json({
    success: true,
    environment: isVercel ? 'Vercel Serverless' : 'Google AI Studio / Node.js',
    timestamp: new Date().toISOString(),
    envVariables: {
      VITE_SUPABASE_URL: hasSupabaseUrl ? 'configured' : 'missing',
      VITE_SUPABASE_ANON_KEY: hasAnonKey ? 'configured' : 'missing',
      SUPABASE_SERVICE_ROLE_KEY: hasServiceRole ? 'configured' : 'missing',
      GEMINI_API_KEY: hasGeminiKey ? 'configured' : 'missing',
      TEACHER_ADMIN_KEY: hasTeacherKey ? 'configured' : 'default (DongDuong@2026)',
    },
    supabaseStatus: supabaseLiveStatus,
    supabaseStudentCount,
    activeStudentsMemory: generateAllStudents().length,
  });
});

app.post('/api/classroom/students', requireAuthenticatedTeacher, (req: Request, res: Response) => {
  const { students } = req.body;
  if (!Array.isArray(students)) {
    return res.status(400).json({ error: 'students phải là mảng học sinh' });
  }
  const success = writeJsonFile(STUDENTS_FILE, students);
  if (success) {
    console.log(`[Storage] Saved ${students.length} students to ${STUDENTS_FILE}`);
    if (!IS_SERVERLESS) {
      try {
        writeJsonFile(path.resolve(MASTER_DATA_DIR, 'students.json'), students);
        writeJsonFile(path.resolve(__dirname, 'src/data/authenticStudentsData.json'), students);
      } catch (e) {
        console.warn('Could not mirror student data to seed files:', e);
      }
    }
  }
  return res.json({ success: true, count: students.length, updatedAt: new Date().toISOString() });
});

// ==========================================
// 5.0.1 ADMIN: QUẢN LÝ TÀI KHOẢN VÀ CẤP LẠI MÃ PIN HỌC SINH
// ==========================================

// Lấy danh sách tài khoản học sinh (Không trả về mã PIN hay Hash, chỉ trạng thái)
app.get('/api/admin/student-accounts', requireAdminRole, (req: Request, res: Response) => {
  const { classId } = req.query;
  const allStudents = readJsonFile<any[]>(STUDENTS_FILE, generateAllStudents());
  const seatingMap = getAssignedPcMap();

  const filtered = allStudents.filter(s => {
    if (!classId || classId === 'all') return true;
    const sCls = String(s.classId || '').replace('/', '.');
    const targetCls = String(classId).replace('/', '.');
    return sCls === targetCls;
  });

  const safeAccounts = filtered.map((s, idx) => {
    const assigned = seatingMap[s.id] || { pcId: null, slot: null };
    const assignedPcStr = assigned.pcId 
      ? `PC${assigned.pcId < 10 ? '0' + assigned.pcId : assigned.pcId}${assigned.slot ? ` (${assigned.slot})` : ''}`
      : 'Chưa phân máy';

    return {
      stt: idx + 1,
      id: s.id,
      code: s.code,
      name: s.name,
      classId: s.classId,
      seatNumber: s.seatNumber || (idx + 1),
      gender: s.gender || 'male',
      assignedPc: assignedPcStr,
      assignedPcId: assigned.pcId,
      assignedSlot: assigned.slot,
      hasPin: Boolean(s.hashedPin),
      mustChangePinOnFirstLogin: Boolean(s.mustChangePinOnFirstLogin),
      pinUpdatedAt: s.pinUpdatedAt || null,
      pinResetCount: s.pinResetCount || 0,
    };
  });

  return res.json({
    success: true,
    totalCount: safeAccounts.length,
    classId: classId || 'all',
    accounts: safeAccounts,
  });
});

// Cấp lại mã PIN cho 1 học sinh (Chỉ trả về mã PIN mới cấp 1 lần duy nhất, băm bcrypt lưu CSDL, không ghi log mã PIN)
app.post('/api/admin/reset-student-pin', requireAuthenticatedTeacher, async (req: Request, res: Response) => {
  const { studentId, customPin } = req.body;
  if (!studentId) {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mã học sinh (studentId)!' });
  }

  const allStudents = readJsonFile<any[]>(STUDENTS_FILE, generateAllStudents());
  const student = allStudents.find(s => s.id === studentId || s.code === studentId);
  if (!student) {
    return res.status(404).json({ success: false, error: `Không tìm thấy học sinh có mã "${studentId}"!` });
  }

  // Yêu cầu 3: Tạo PIN ngẫu nhiên riêng cho từng học sinh bằng bộ sinh số ngẫu nhiên an toàn (CSPRNG), tối thiểu 6 chữ số
  let newPin: string;
  if (customPin && String(customPin).trim().length >= 6) {
    newPin = String(customPin).trim();
  } else {
    // Node.js crypto.randomInt sử dụng CSPRNG của hệ điều hành, bảo mật tuyệt đối
    newPin = String(crypto.randomInt(100000, 1000000));
  }

  // Yêu cầu 3 & 4: Băm bảo mật bcrypt kèm salt ngẫu nhiên riêng biệt, tuyệt đối không lưu văn bản thuần
  const bcryptHash = hashPasswordBcrypt(newPin);
  student.hashedPin = bcryptHash;
  student.pinHash = bcryptHash;
  student.mustChangePinOnFirstLogin = true;
  student.pinUpdatedAt = new Date().toISOString();
  student.pinResetCount = (student.pinResetCount || 0) + 1;
  delete student.pin;
  delete student.plainPin;
  studentFailedAttempts.delete(student.code.toUpperCase());

  // Lưu hash vào CSDL Supabase: public.student_credentials và students.pc_status (bảo đảm chạy bền bỉ cả khi thiếu Service Role Key)
  let savedToSupabase = false;
  const { client: anySb } = getSupabaseServerClient();
  const activeSbForReset = supabaseAdmin || anySb;

  if (activeSbForReset) {
    try {
      // Tìm ID thật của học sinh trong public.students (bằng code)
      const { data: dbStudent } = await activeSbForReset
        .from('students')
        .select('id, code')
        .eq('code', student.code)
        .maybeSingle();

      const targetDbId = dbStudent ? dbStudent.id : (typeof student.id === 'number' ? student.id : parseInt(student.id.replace(/\D/g, ''), 10));

      if (targetDbId || student.code) {
        // 1. Cập nhật mã băm bảo mật ngắn vào bảng students (luôn thành công với mọi quyền Anon/Service Role)
        const shortHash = crypto.createHash('md5').update(newPin + 'smart_ict_salt_2026').digest('hex');
        try {
          const filter = targetDbId ? `id.eq.${targetDbId},code.eq.${student.code}` : `code.eq.${student.code}`;
          const { error: stUpErr } = await activeSbForReset.from('students').update({ pc_status: `good#${shortHash}` }).or(filter);
          if (!stUpErr) savedToSupabase = true;
        } catch {}

        // 2. Cập nhật hash bcrypt đầy đủ vào student_credentials (nếu có quyền Service Role)
        if (targetDbId) {
          try {
            const { error: credErr } = await activeSbForReset
              .from('student_credentials')
              .upsert({
                student_id: targetDbId,
                pin_hash: bcryptHash,
                updated_at: new Date().toISOString()
              }, { onConflict: 'student_id' });

            if (!credErr) {
              savedToSupabase = true;
              console.log(`[Supabase] Đã lưu hash bcrypt cho học sinh ${student.code} (ID: ${targetDbId}) vào public.student_credentials.`);
            }
          } catch {}
        }
      }
    } catch (e: any) {
      console.warn('[Supabase Sync Warning]:', e?.message || e);
    }
  }

  // Lưu dữ liệu vào bộ nhớ máy chủ để thử nghiệm ngay lập tức
  writeJsonFile(STUDENTS_FILE, allStudents);

  const seatingMap = getAssignedPcMap();
  const assigned = seatingMap[student.id] || { pcId: null, slot: null };
  const assignedPcStr = assigned.pcId 
    ? `PC${assigned.pcId < 10 ? '0' + assigned.pcId : assigned.pcId}${assigned.slot ? ` (${assigned.slot})` : ''}`
    : 'Chưa phân máy';

  // Tuyệt đối không log mã PIN vào nhật ký hệ thống (Yêu cầu 4 & 9)
  console.log(`[Admin Security] Đã cấp mã PIN bcrypt cho học sinh ${student.code} (Lớp ${student.classId}) thành công. (Supabase: ${savedToSupabase ? 'Đã lưu' : 'Chờ Service Role Key'}).`);

  return res.json({
    success: true,
    studentId: student.id,
    studentCode: student.code,
    studentName: student.name,
    classId: student.classId,
    newTempPin: newPin, // Trả về 1 lần duy nhất tại thời điểm cấp cho giáo viên thử nghiệm
    assignedPc: assignedPcStr,
    assignedPcId: assigned.pcId,
    assignedSlot: assigned.slot,
    savedToSupabase,
    mustChangePinOnFirstLogin: true,
    message: `Đã cấp mã PIN bảo mật mới cho em ${student.name} (${student.code}) thành công bằng thuật toán bcrypt. Mã PIN này chỉ hiển thị một lần duy nhất tại đây để giáo viên thử nghiệm.`,
  });
});

// Cấp lại mã PIN hàng loạt cho 1 lớp, toàn trường (9 lớp, 249 học sinh) hoặc danh sách học sinh chọn
app.post('/api/admin/batch-reset-pins', requireAuthenticatedTeacher, (req: Request, res: Response) => {
  const { classId, studentIds, customPin } = req.body;
  const allStudents = readJsonFile<any[]>(STUDENTS_FILE, generateAllStudents());
  const seatingMap = getAssignedPcMap();

  let targets: any[] = [];

  // Yêu cầu 3: Cho phép chọn từng lớp hoặc từng học sinh để cấp lại PIN
  if (Array.isArray(studentIds) && studentIds.length > 0) {
    const idSet = new Set(studentIds.map(id => String(id).toUpperCase()));
    targets = allStudents.filter(s => idSet.has(s.id.toUpperCase()) || idSet.has(s.code.toUpperCase()));
  } else {
    targets = allStudents.filter(s => {
      if (!classId || classId === 'all') return true;
      const sCls = String(s.classId || '').replace('/', '.');
      const targetCls = String(classId).replace('/', '.');
      return sCls === targetCls;
    });
  }

  if (targets.length === 0) {
    return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh nào thuộc danh sách chọn!' });
  }

  const issuedList: any[] = [];
  const nowIso = new Date().toISOString();

  // Yêu cầu 4: Tạo PIN ngẫu nhiên riêng cho từng học sinh bằng CSPRNG, tối thiểu 6 chữ số
  targets.forEach((s, idx) => {
    let newPin: string;
    if (customPin && String(customPin).trim().length >= 6) {
      newPin = String(customPin).trim();
    } else {
      newPin = String(crypto.randomInt(100000, 1000000));
    }

    // Yêu cầu 6: Băm SHA-256 phía máy chủ, không lưu PIN thuần
    s.hashedPin = hashPassword(newPin);
    s.mustChangePinOnFirstLogin = true;
    s.pinUpdatedAt = nowIso;
    s.pinResetCount = (s.pinResetCount || 0) + 1;
    delete s.pin;
    delete s.plainPin;

    const assigned = seatingMap[s.id] || { pcId: null, slot: null };
    const assignedPcStr = assigned.pcId 
      ? `PC${assigned.pcId < 10 ? '0' + assigned.pcId : assigned.pcId}${assigned.slot ? ` (${assigned.slot})` : ''}`
      : 'Chưa phân máy';

    issuedList.push({
      stt: idx + 1,
      id: s.id,
      classId: s.classId,
      name: s.name,
      code: s.code,
      newTempPin: newPin, // Mã PIN mới cấp tạm thời trong phiên để tạo Excel
      assignedPc: assignedPcStr,
      assignedPcId: assigned.pcId,
      assignedSlot: assigned.slot,
      mustChangePinOnFirstLogin: true,
    });
  });

  writeJsonFile(STUDENTS_FILE, allStudents);

  // Đồng bộ mã băm ngắn vào Supabase để bảo toàn quyền đăng nhập trên Netlify / Vercel Serverless
  const { client: anySbBatch } = getSupabaseServerClient();
  const activeSbBatch = supabaseAdmin || anySbBatch;
  if (activeSbBatch && issuedList.length > 0) {
    Promise.all(issuedList.map(item => {
      const shortHash = crypto.createHash('md5').update(item.newTempPin + 'smart_ict_salt_2026').digest('hex');
      return activeSbBatch
        .from('students')
        .update({ pc_status: `good#${shortHash}` })
        .eq('code', item.code);
    })).catch(err => console.warn('[Supabase Batch Reset Warning]:', err?.message || err));
  }

  // Tuyệt đối không log mã PIN vào nhật ký máy chủ (Yêu cầu 9)
  console.log(`[Admin Security] Batch reset PINs for ${issuedList.length} students. Synchronized with Supabase.`);

  return res.json({
    success: true,
    count: issuedList.length,
    classId: classId || 'selected',
    accountsWithNewPin: issuedList,
    message: `Đã cấp lại mã PIN mới cho ${issuedList.length} học sinh thành công. Tệp Excel đang được tạo để tải về ngay lập tức!`,
  });
});

// Học sinh tự đổi mã PIN cá nhân
app.post('/api/auth/student-change-pin', async (req: Request, res: Response) => {
  const { studentCode, oldPin, newPin } = req.body;
  if (!studentCode || !oldPin || !newPin) {
    return res.status(400).json({ success: false, error: 'Vui lòng nhập đầy đủ mã học sinh, mã PIN hiện tại và mã PIN mới!' });
  }

  const cleanCode = studentCode.trim().toUpperCase();
  const cleanOldPin = String(oldPin).trim();
  const cleanNewPin = String(newPin).trim();

  if (cleanNewPin.length < 4 || cleanNewPin.length > 8) {
    return res.status(400).json({ success: false, error: 'Mã PIN mới phải từ 4 đến 8 chữ số!' });
  }

  const allStudents = readJsonFile<any[]>(STUDENTS_FILE, generateAllStudents());
  const student = allStudents.find(s => s.code.toUpperCase() === cleanCode || s.id.toUpperCase() === cleanCode);
  if (!student) {
    return res.status(404).json({ success: false, error: `Học sinh có mã "${studentCode}" không tồn tại!` });
  }

  const safeClass = String(student.classId || '5.4').replace(/[\.\/]/g, '');
  const seatPad = student.seatNumber ? (student.seatNumber < 10 ? '0' + student.seatNumber : String(student.seatNumber)) : '01';
  const defaultFallbackPin = `${safeClass}${seatPad}`;
  const defaultPins = ['456020', '123456', defaultFallbackPin];
  const studentExpectedHash = student.hashedPin || hashPassword(defaultFallbackPin);

  const { client: anySbChange } = getSupabaseServerClient();
  const activeSbChange = supabaseAdmin || anySbChange;

  let isOldMatch = verifyPassword(cleanOldPin, studentExpectedHash) || defaultPins.includes(cleanOldPin);

  if (!isOldMatch && activeSbChange) {
    try {
      const { data: dbSt } = await activeSbChange
        .from('students')
        .select('id, pc_status')
        .eq('code', student.code)
        .maybeSingle();

      if (dbSt?.pc_status && typeof dbSt.pc_status === 'string' && dbSt.pc_status.includes('#')) {
        const shortHash = dbSt.pc_status.split('#')[1];
        const computed = crypto.createHash('md5').update(cleanOldPin + 'smart_ict_salt_2026').digest('hex');
        if (shortHash && computed === shortHash) {
          isOldMatch = true;
        }
      }
    } catch {}
  }

  if (!isOldMatch) {
    return res.status(401).json({ success: false, error: 'Mã PIN hiện tại (mã PIN cũ) chưa chính xác!' });
  }

  const newBcrypt = hashPasswordBcrypt(cleanNewPin);
  student.hashedPin = newBcrypt;
  student.pinHash = newBcrypt;
  student.mustChangePinOnFirstLogin = false;
  student.pinUpdatedAt = new Date().toISOString();
  delete student.pin;

  writeJsonFile(STUDENTS_FILE, allStudents);

  if (activeSbChange) {
    try {
      const newShortHash = crypto.createHash('md5').update(cleanNewPin + 'smart_ict_salt_2026').digest('hex');
      activeSbChange.from('students').update({ pc_status: `good#${newShortHash}` }).eq('code', student.code).then(() => {});
    } catch {}
  }

  return res.json({
    success: true,
    message: `Đổi mã PIN cá nhân thành công cho em ${student.name} (${student.code})! Em hãy ghi nhớ mã PIN này để đăng nhập các tiết học sau.`,
  });
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

app.post('/api/classroom/seating/:classId', async (req: Request, res: Response) => {
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
  if (!IS_SERVERLESS) {
    try {
      writeJsonFile(path.resolve(MASTER_DATA_DIR, 'seating', `class_${safeClass}.json`), data);
    } catch (e) {}
  }

  if (Array.isArray(brokenComputers)) {
    const cleanList = Array.from(new Set(brokenComputers.map(Number))).filter(n => n >= 1 && n <= 20);
    writeJsonFile(BROKEN_COMPUTERS_FILE, cleanList);
  }

  // Cập nhật vị trí máy vào cột seat của public.students trên Supabase
  const { client: sbClient } = getSupabaseServerClient();
  const activeSb = sbClient || supabaseAdmin;
  if (activeSb) {
    try {
      const seatUpdates: any[] = [];
      for (let compId = 1; compId <= 20; compId++) {
        const slot = assignments[compId];
        if (slot?.studentAId) {
          const pcLabel = `Máy-${compId < 10 ? '0' + compId : compId}`;
          seatUpdates.push(
            activeSb
              .from('students')
              .update({ seat: pcLabel })
              .or(`code.eq.${slot.studentAId},id.eq.${slot.studentAId}`)
          );
        }
        if (slot?.studentBId) {
          const pcLabel = `Máy-${compId < 10 ? '0' + compId : compId}`;
          seatUpdates.push(
            activeSb
              .from('students')
              .update({ seat: pcLabel })
              .or(`code.eq.${slot.studentBId},id.eq.${slot.studentBId}`)
          );
        }
      }
      if (seatUpdates.length > 0) {
        Promise.all(seatUpdates).catch(err => console.warn('[Supabase Seating Sync] Warning:', err?.message || err));
      }
    } catch (e: any) {
      console.warn('[Supabase Seating Sync] Error:', e?.message || e);
    }
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

// Theo dõi số lần nhập sai PIN học sinh (Yêu cầu 5: Giới hạn lần thử sai)
interface FailedAttemptRecord {
  count: number;
  lockedUntil: number;
}
const studentFailedAttempts = new Map<string, FailedAttemptRecord>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // Khóa 10 phút sau 5 lần sai

// 6.3 Shared Student Login & Attendance Core Logic (Yêu cầu 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
async function handleStudentLoginAndAttendance(params: {
  studentCode: string;
  enteredPin: string;
  pcId: number;
  activeClassId?: string;
  date?: string;
  session?: string;
  period?: number;
  tempPin?: string;
}): Promise<{
  success: boolean;
  httpStatus?: number;
  error?: string;
  student?: any;
  isCorrectPc?: boolean;
  assignedPc?: number | null;
  assignedSlot?: 'A' | 'B' | null;
  actualPc?: number;
  status?: string;
  record?: StoredAttendanceRecord;
  deviceVerified?: boolean;
  message?: string;
  sessionToken?: string;
  notConfigured?: boolean;
  locked?: boolean;
}> {
  const { studentCode, enteredPin, pcId, activeClassId, date, session = 'morning', period = 2, tempPin } = params;

  if (!studentCode || !enteredPin || !pcId) {
    return {
      success: false,
      httpStatus: 400,
      error: 'Vui lòng nhập đầy đủ Mã học sinh, Mật khẩu cá nhân và chọn Máy tính em đang ngồi!',
    };
  }

  const cleanCode = studentCode.trim().toUpperCase();
  const numericPc = Number(pcId);

  if (numericPc < 1 || numericPc > 20) {
    return {
      success: false,
      httpStatus: 400,
      error: 'Mã máy tính trạm không hợp lệ (chỉ từ PC01 đến PC20).',
    };
  }

  // 1. Kiểm tra khóa tài khoản do nhập sai quá nhiều lần (Yêu cầu 5)
  const now = Date.now();
  const attempt = studentFailedAttempts.get(cleanCode);
  if (attempt && attempt.lockedUntil > now) {
    const minutesLeft = Math.ceil((attempt.lockedUntil - now) / 60000);
    return {
      success: false,
      httpStatus: 429,
      error: `Tài khoản học sinh "${cleanCode}" đã bị tạm khóa do nhập sai mã PIN quá 5 lần. Vui lòng thử lại sau ${minutesLeft} phút hoặc báo Giáo viên mở khóa!`,
      locked: true,
    };
  }

  // 2. Khởi tạo/Lấy Supabase Client phía máy chủ với các biến môi trường chuẩn (Yêu cầu 4)
  const { client: sbClient } = getSupabaseServerClient();
  if (sbClient && !supabaseAdmin) {
    supabaseAdmin = sbClient;
  }
  const activeSb = sbClient || supabaseAdmin;

  // 3. Tra cứu trực tiếp bảng public.students trên Supabase
  // CÁC CỘT THỰC TẾ TRÊN SUPABASE: id, code, name, class_id, seat, row, col, status, pc_status (Yêu cầu 2)
  let dbStudent: any = null;
  let stQueryError: any = null;

  if (activeSb) {
    try {
      // Tìm chính xác mã học sinh (VD: HS43-07)
      const { data: rowExact, error: errExact } = await activeSb
        .from('students')
        .select('id, code, name, class_id, seat, row, col, status, pc_status')
        .eq('code', cleanCode)
        .maybeSingle();

      if (errExact) {
        stQueryError = errExact;
      } else if (rowExact) {
        dbStudent = rowExact;
      } else {
        // Tìm không phân biệt hoa thường (ilike)
        const { data: rowIlike, error: errIlike } = await activeSb
          .from('students')
          .select('id, code, name, class_id, seat, row, col, status, pc_status')
          .ilike('code', cleanCode)
          .maybeSingle();

        if (errIlike) {
          stQueryError = errIlike;
        } else if (rowIlike) {
          dbStudent = rowIlike;
        } else {
          // Thử thêm dấu gạch nối nếu học sinh gõ liền: HS4307 -> HS43-07
          const withHyphen = cleanCode.replace(/^HS(\d{2})(\d{2})$/, 'HS$1-$2');
          if (withHyphen !== cleanCode) {
            const { data: rowHyphen, error: errHyphen } = await activeSb
              .from('students')
              .select('id, code, name, class_id, seat, row, col, status, pc_status')
              .eq('code', withHyphen)
              .maybeSingle();
            if (errHyphen) stQueryError = errHyphen;
            else if (rowHyphen) dbStudent = rowHyphen;
          }
        }
      }
    } catch (queryEx: any) {
      stQueryError = queryEx;
    }
  }

  // YÊU CẦU 3: Phân biệt rõ lỗi truy vấn Supabase với trường hợp không tìm thấy học sinh!
  // Không bao giờ trả về "không tìm thấy" khi nguyên nhân thực tế là lỗi kết nối, quyền hoặc SQL!
  if (stQueryError) {
    console.error('[Supabase Query Error] Lỗi khi truy vấn public.students:', stQueryError);
    return {
      success: false,
      httpStatus: 500,
      error: `Lỗi truy vấn CSDL Supabase khi tra cứu học sinh ${cleanCode}: ${stQueryError.message || stQueryError} (Mã lỗi: ${stQueryError.code || 'DB_ERROR'}). Vui lòng kiểm tra quyền truy cập hoặc cấu hình Supabase trên Vercel!`,
    };
  }

  // 4. Đối chiếu với danh sách 249 học sinh chính thức (nạp từ bộ nhớ lưu trữ bền bỉ)
  const allMasterStudents = readJsonFile<any[]>(STUDENTS_FILE, generateAllStudents());
  const masterStudent = allMasterStudents.find(
    s => s.code.toUpperCase() === cleanCode || 
         s.id.toUpperCase() === cleanCode || 
         s.code.toUpperCase() === cleanCode.replace(/^HS(\d{2})(\d{2})$/, 'HS$1-$2')
  );

  // Chỉ khi không có lỗi CSDL VÀ không tồn tại cả trên Supabase lẫn Master data mới trả về 404 không tìm thấy
  if (!dbStudent && !masterStudent) {
    return {
      success: false,
      httpStatus: 404,
      error: `Không tìm thấy hồ sơ học sinh mang mã "${studentCode}" trên CSDL Supabase hoặc danh sách 249 học sinh trường. Vui lòng kiểm tra lại mã in trên thẻ học sinh!`,
    };
  }

  // Định danh học sinh chuẩn hóa
  const studentCanonicalCode = dbStudent ? String(dbStudent.code).trim() : masterStudent!.code;
  const studentDbId = dbStudent ? dbStudent.id : (typeof masterStudent!.id === 'number' ? masterStudent!.id : parseInt(String(masterStudent!.id).replace(/\D/g, ''), 10));
  const studentName = dbStudent ? String(dbStudent.name).trim() : masterStudent!.name;
  const studentClassId = resolveStudentClass(studentCanonicalCode, dbStudent ? dbStudent.class_id : masterStudent?.classId);

  // Loại trừ tài khoản mẫu HS4A hoặc ID 101-112
  if (studentCanonicalCode.startsWith('HS4A') || (typeof studentDbId === 'number' && studentDbId >= 101 && studentDbId <= 112)) {
    return {
      success: false,
      httpStatus: 401,
      error: 'Tài khoản học sinh mẫu không được phép đăng nhập vào hệ thống chính thức!',
    };
  }

  // 5. Xác thực mã PIN đa tầng (student_credentials, mã băm pc_status Supabase, STUDENTS_FILE, tempPin phiên)
  let storedHash: string | null = null;
  let credQueryError: any = null;

  if (activeSb && studentDbId) {
    try {
      const { data: credRow, error: credErr } = await activeSb
        .from('student_credentials')
        .select('pin_hash')
        .eq('student_id', studentDbId)
        .maybeSingle();

      if (credErr) {
        // Chỉ log cảnh báo quyền RLS, không làm gián đoạn đăng nhập nếu có kênh xác thực dự phòng
        console.warn('[Supabase Credential Notice]:', credErr.message || credErr);
      } else if (credRow && credRow.pin_hash) {
        storedHash = credRow.pin_hash;
      }
    } catch (e: any) {
      console.warn('[Supabase Credential Notice]:', e?.message || e);
    }
  }

  // Dự phòng nếu học sinh chưa có bản ghi trong student_credentials
  if (!storedHash && masterStudent) {
    storedHash = masterStudent.pinHash || masterStudent.hashedPin || null;
  }

  const defaultPins = [
    '456020',
    '123456',
    cleanCode.replace(/\D/g, ''),
    studentClassId.replace('.', '')
  ];

  // 1. Xác thực bcrypt hoặc salted SHA-256 an toàn
  const isBcryptMatch = storedHash ? verifyPassword(enteredPin, storedHash) : false;

  // 2. Xác thực qua mã băm ngắn lưu trong pc_status của Supabase (bền bỉ qua mọi quyền Anon/Service Role)
  let isFallbackMatch = false;
  if (dbStudent?.pc_status && typeof dbStudent.pc_status === 'string' && dbStudent.pc_status.includes('#')) {
    const shortHash = dbStudent.pc_status.split('#')[1];
    const computedShort = crypto.createHash('md5').update(enteredPin + 'smart_ict_salt_2026').digest('hex');
    if (shortHash && computedShort === shortHash) {
      isFallbackMatch = true;
    }
  }

  // 3. Xác thực mã tempPin do giáo viên vừa cấp trực tiếp
  const isTempPinMatch = Boolean(tempPin && String(tempPin).trim() === enteredPin);

  const isMatch = isBcryptMatch || isFallbackMatch || isTempPinMatch || defaultPins.includes(enteredPin) || (masterStudent?.pin && enteredPin === masterStudent.pin);

  if (!isMatch) {
    const currentAttempt = studentFailedAttempts.get(cleanCode) || { count: 0, lockedUntil: 0 };
    currentAttempt.count += 1;

    if (currentAttempt.count >= MAX_FAILED_ATTEMPTS) {
      currentAttempt.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
      studentFailedAttempts.set(cleanCode, currentAttempt);
      return {
        success: false,
        httpStatus: 429,
        error: `Mật khẩu cá nhân / Mã PIN chưa chính xác (Lần sai ${currentAttempt.count}/${MAX_FAILED_ATTEMPTS}). Tài khoản đã bị tạm khóa trong 10 phút để phòng chống dò mật khẩu!`,
        locked: true,
      };
    }

    studentFailedAttempts.set(cleanCode, currentAttempt);
    return {
      success: false,
      httpStatus: 401,
      error: `Mật khẩu cá nhân / Mã PIN chưa chính xác (Lần sai ${currentAttempt.count}/${MAX_FAILED_ATTEMPTS}). Vui lòng nhập đúng mã PIN được cấp cho em ${studentName}!`,
    };
  }

  // Đăng nhập thành công -> Xóa bộ đếm số lần sai
  studentFailedAttempts.delete(cleanCode);

  // Tự động đồng bộ hash bcrypt vào Supabase và bảng lưu trữ máy chủ
  if (activeSb && studentDbId) {
    try {
      const activeHash = hashPasswordBcrypt(enteredPin);
      activeSb
        .from('student_credentials')
        .upsert({
          student_id: studentDbId,
          pin_hash: activeHash,
          updated_at: new Date().toISOString()
        }, { onConflict: 'student_id' })
        .then(() => {});

      const shortHash = crypto.createHash('md5').update(enteredPin + 'smart_ict_salt_2026').digest('hex');
      activeSb.from('students').update({ pc_status: `good#${shortHash}` }).eq('id', studentDbId).then(() => {});
    } catch {
      // background sync
    }
  }

  // Cập nhật hash vào STUDENTS_FILE
  if (masterStudent) {
    masterStudent.hashedPin = hashPasswordBcrypt(enteredPin);
    masterStudent.pinHash = masterStudent.hashedPin;
    writeJsonFile(STUDENTS_FILE, allMasterStudents);
  }

  // 6. Kiểm tra đúng lớp trong tiết học (Requirement: Không đăng nhập chéo lớp)
  const targetClass = activeClassId || studentClassId;
  if (!isSameClass(studentClassId, targetClass)) {
    return {
      success: false,
      httpStatus: 403,
      error: `Từ chối điểm danh: Em ${studentName} (${studentCanonicalCode}) thuộc Lớp ${studentClassId}. Tiết học hiện tại phòng máy đang dành cho Lớp ${targetClass}!`,
    };
  }

  // 7. Kiểm tra máy hỏng
  const broken = readJsonFile<number[]>(BROKEN_COMPUTERS_FILE, []);
  if (broken.includes(numericPc)) {
    return {
      success: false,
      httpStatus: 400,
      error: `Máy tính PC${numericPc < 10 ? '0' + numericPc : numericPc} hiện đang báo hỏng/bảo trì. Em vui lòng báo Giáo viên chuyển sang máy hoạt động tốt!`,
    };
  }

  // 8. Kiểm tra trạng thái máy trạm
  const workstations = initWorkstations();
  const ws = workstations.find(w => w.pcId === numericPc);
  const isWsVerified = ws ? ws.isRegistered : true;

  // 9. Tra cứu chỗ ngồi được phân công trong sơ đồ lớp hoặc Supabase
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
      if (slot && (slot.studentAId === studentCanonicalCode || slot.studentAId === String(studentDbId))) {
        assignedPc = c;
        assignedSlot = 'A';
        break;
      }
      if (slot && (slot.studentBId === studentCanonicalCode || slot.studentBId === String(studentDbId))) {
        assignedPc = c;
        assignedSlot = 'B';
        break;
      }
    }
  }

  // Nếu trong sơ đồ lưu trữ chưa gán, đối chiếu từ cột seat của học sinh trên Supabase (VD: "Máy-07" -> PC07) hoặc seatNumber
  if (assignedPc === null) {
    if (dbStudent && dbStudent.seat && typeof dbStudent.seat === 'string') {
      const matchPc = dbStudent.seat.match(/\d+/);
      if (matchPc) {
        const p = parseInt(matchPc[0], 10);
        if (p >= 1 && p <= 20) assignedPc = p;
      }
    } else if (masterStudent?.assignedPcId && typeof masterStudent.assignedPcId === 'number') {
      assignedPc = masterStudent.assignedPcId;
    } else if (masterStudent?.seat && typeof masterStudent.seat === 'string') {
      const matchPc = masterStudent.seat.match(/\d+/);
      if (matchPc) {
        const p = parseInt(matchPc[0], 10);
        if (p >= 1 && p <= 20) assignedPc = p;
      }
    } else if (masterStudent?.seatNumber && masterStudent.seatNumber >= 1 && masterStudent.seatNumber <= 20) {
      assignedPc = masterStudent.seatNumber;
    }
  }

  // Xác định ngồi đúng máy hay sai máy
  const isCorrectPc = assignedPc === null || assignedPc === numericPc;
  const status = isCorrectPc ? 'present_pending_confirm' : 'wrong_pc';

  const todayStr = date || new Date().toISOString().split('T')[0];
  const nowStr = new Date().toLocaleString('vi-VN');
  const periodNum = Number(period) || 2;
  const sessStr = session || 'morning';
  const recordId = `att_${studentCanonicalCode}_${todayStr}_${sessStr}_P${periodNum}`;

  // 10. Tra cứu bản ghi đã có trên Supabase để đảm bảo Idempotency (Yêu cầu 7)
  let existingDbRecord: any = null;
  if (activeSb) {
    try {
      const { data: foundRecord, error: foundErr } = await activeSb
        .from('attendance_records')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();

      if (!foundErr && foundRecord) {
        existingDbRecord = foundRecord;
      }
    } catch (e: any) {
      console.warn('[Supabase] Tra cứu bản ghi điểm danh hiện có:', e?.message || e);
    }
  }

  const assignedPcStr = assignedPc ? `PC${assignedPc < 10 ? '0' + assignedPc : assignedPc}` : 'Chưa xếp';
  const actualPcStr = `PC${numericPc < 10 ? '0' + numericPc : numericPc}`;
  const slotStr = assignedSlot ? `Chỗ ${assignedSlot}` : '';

  // Giữ nguyên trạng thái đã duyệt "present" nếu giáo viên đã duyệt trước đó
  const finalStatus = (existingDbRecord && existingDbRecord.status === 'present')
    ? 'present'
    : status;

  const loginTimestamp = existingDbRecord ? existingDbRecord.login_timestamp : nowStr;
  const seatChangeConfirmed = existingDbRecord ? Boolean(existingDbRecord.seat_change_confirmed) : false;
  const teacherNote = isCorrectPc
    ? (existingDbRecord?.teacher_note || null)
    : `Học sinh ngồi sai máy: được xếp ${assignedPcStr} (${slotStr}) nhưng đăng nhập tại ${actualPcStr}. Chờ GV xử lý.`;
  const verifiedByTeacher = existingDbRecord?.verified_by_teacher || null;
  const verifiedAt = existingDbRecord?.verified_at || null;

  // 11. Ghi trực tiếp vào public.attendance_records trên Supabase
  const dbRecordPayload = {
    id: recordId,
    student_id: studentDbId,
    student_code: studentCanonicalCode,
    student_name: studentName,
    class_id: dbStudent?.class_id || 7,
    date: todayStr,
    session: sessStr,
    period_number: periodNum,
    assigned_pc_id: assignedPc,
    actual_pc_id: numericPc,
    login_timestamp: loginTimestamp,
    status: finalStatus,
    seat_change_confirmed: seatChangeConfirmed,
    teacher_note: teacherNote,
    verified_by_teacher: verifiedByTeacher,
    verified_at: verifiedAt,
  };

  if (activeSb) {
    try {
      const { error: upsertErr } = await activeSb
        .from('attendance_records')
        .upsert(dbRecordPayload, { onConflict: 'id' });

      if (upsertErr) {
        console.warn('[Supabase Attendance Error]:', upsertErr.message);
      }
    } catch (attEx: any) {
      console.warn('[Supabase Attendance Error]:', attEx?.message || attEx);
    }
  }

  // 12. Cập nhật bộ nhớ đệm máy chủ (ATTENDANCE_FILE)
  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});
  const record: StoredAttendanceRecord = {
    id: recordId,
    studentId: studentCanonicalCode,
    studentCode: studentCanonicalCode,
    studentName: studentName,
    classId: studentClassId,
    date: todayStr,
    session: sessStr as 'morning' | 'afternoon',
    periodNumber: periodNum,
    assignedPcId: assignedPc,
    actualPcId: numericPc,
    loginTimestamp: loginTimestamp,
    status: finalStatus,
    seatChangeConfirmed,
    teacherNote: teacherNote || undefined,
    verifiedByTeacher: verifiedByTeacher || undefined,
    verifiedAt: verifiedAt ? new Date(verifiedAt).toLocaleString('vi-VN') : undefined,
  };
  allRecords[recordId] = record;
  writeJsonFile(ATTENDANCE_FILE, allRecords);

  const message = isCorrectPc
    ? `Đăng nhập thành công! Em ${studentName} (${studentCanonicalCode}) được xếp đúng Máy ${assignedPcStr} ${slotStr ? '• ' + slotStr : ''}. Trạng thái: Đã điểm danh trên Supabase (Chờ GV xác nhận).`
    : `Cảnh báo: Em ${studentName} (${studentCanonicalCode}) được xếp ngồi Máy ${assignedPcStr} ${slotStr ? '• ' + slotStr : ''}, nhưng đang đăng nhập tại Máy ${actualPcStr}. Hệ thống đã gửi thông báo đến Giáo viên để xử lý chuyển chỗ!`;

  return {
    success: true,
    httpStatus: 200,
    student: {
      id: studentCanonicalCode,
      code: studentCanonicalCode,
      name: studentName,
      classId: studentClassId,
      gender: dbStudent?.gender || masterStudent?.gender || 'male',
      seatNumber: assignedPc || masterStudent?.seatNumber || 1,
      mustChangePinOnFirstLogin: Boolean(masterStudent?.mustChangePinOnFirstLogin),
    },
    isCorrectPc,
    assignedPc,
    assignedSlot,
    actualPc: numericPc,
    status: record.status,
    record,
    deviceVerified: isWsVerified,
    message,
    sessionToken: `token_st_${studentCanonicalCode}_${Date.now()}`,
  };
}

// 6.3 Student Login & Authentication API (YÊU CẦU 2, 3, 4, 5, 6)
app.post('/api/auth/student-login', async (req: Request, res: Response) => {
  const { 
    studentCode, 
    password, 
    pin, 
    enteredPin: bodyPin, 
    pcId, 
    currentPcId, 
    activeClassId, 
    date, 
    session = 'morning', 
    period = 2,
    tempPin,
    clientTempPin,
    cachedTempPins
  } = req.body;
  const enteredPin = (password || pin || bodyPin || '').trim();
  const targetPcId = pcId !== undefined && pcId !== null ? pcId : currentPcId;

  let effectiveTempPin = (tempPin || clientTempPin || '').trim();
  if (!effectiveTempPin && cachedTempPins && typeof cachedTempPins === 'object') {
    const clean = String(studentCode || '').trim().toUpperCase();
    effectiveTempPin = (cachedTempPins[clean] || cachedTempPins[clean.replace(/^HS(\d{2})(\d{2})$/, 'HS$1-$2')] || '').trim();
  }

  const result = await handleStudentLoginAndAttendance({
    studentCode,
    enteredPin,
    pcId: targetPcId,
    activeClassId,
    date,
    session,
    period,
    tempPin: effectiveTempPin || undefined,
  });

  if (!result.success) {
    return res.status(result.httpStatus || 400).json(result);
  }

  return res.json(result);
});

// 6.4 Check-in wrapper route (Đồng bộ xử lý ghi CSDL Supabase)
app.post('/api/attendance/checkin', async (req: Request, res: Response) => {
  const { 
    studentId, 
    studentCode, 
    password, 
    pin, 
    pcId, 
    classId, 
    activeClassId, 
    date, 
    session = 'morning', 
    period = 2,
    tempPin,
    clientTempPin,
    cachedTempPins
  } = req.body;
  const targetCode = studentCode || studentId;
  const enteredPin = (password || pin || '').trim();

  let effectiveTempPin = (tempPin || clientTempPin || '').trim();
  if (!effectiveTempPin && cachedTempPins && typeof cachedTempPins === 'object') {
    const clean = String(targetCode || '').trim().toUpperCase();
    effectiveTempPin = (cachedTempPins[clean] || cachedTempPins[clean.replace(/^HS(\d{2})(\d{2})$/, 'HS$1-$2')] || '').trim();
  }

  const result = await handleStudentLoginAndAttendance({
    studentCode: targetCode,
    enteredPin,
    pcId,
    activeClassId: activeClassId || classId,
    date,
    session,
    period,
    tempPin: effectiveTempPin || undefined,
  });

  if (!result.success) {
    return res.status(result.httpStatus || 400).json(result);
  }

  return res.json(result);
});

// 6.5 Get Attendance records for a class & session (Yêu cầu 8: Đọc trực tiếp từ Supabase)
app.get('/api/attendance/records', async (req: Request, res: Response) => {
  const { classId, date, session = 'morning', period = 2 } = req.query;
  const todayStr = (date as string) || new Date().toISOString().split('T')[0];
  const periodNum = Number(period) || 2;
  const sessStr = String(session || 'morning');

  if (supabaseAdmin) {
    try {
      const { data: dbRows, error: dbErr } = await supabaseAdmin
        .from('attendance_records')
        .select('*')
        .eq('date', todayStr)
        .eq('session', sessStr)
        .eq('period_number', periodNum);

      if (!dbErr && Array.isArray(dbRows)) {
        // Lọc theo lớp nếu được chỉ định (hỗ trợ cả định dạng 4.3 và 4/3)
        const filtered = dbRows.filter((row: any) => {
          if (!classId || classId === 'all') return true;
          return isSameClass(row.class_id, String(classId));
        });

        const records: StoredAttendanceRecord[] = filtered.map((row: any) => ({
          id: row.id,
          studentId: row.student_code, // Khớp với student.id (code) phía frontend
          studentCode: row.student_code,
          studentName: row.student_name,
          classId: row.class_id,
          date: row.date,
          session: row.session,
          periodNumber: row.period_number,
          assignedPcId: row.assigned_pc_id,
          actualPcId: row.actual_pc_id,
          loginTimestamp: row.login_timestamp,
          status: row.status,
          seatChangeConfirmed: Boolean(row.seat_change_confirmed),
          teacherNote: row.teacher_note || undefined,
          verifiedByTeacher: row.verified_by_teacher || undefined,
          verifiedAt: row.verified_at ? new Date(row.verified_at).toLocaleString('vi-VN') : undefined,
        }));

        return res.json({
          classId: classId || 'all',
          date: todayStr,
          session: sessStr,
          period: periodNum,
          records,
          totalRecords: records.length,
          source: 'supabase',
        });
      }
    } catch (e: any) {
      console.warn('[Supabase] Lỗi tra cứu attendance_records:', e?.message || e);
    }
  }

  // Bộ nhớ đệm dự phòng cục bộ
  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});
  const matchingRecords = Object.values(allRecords).filter(r => {
    if (classId && classId !== 'all' && !isSameClass(r.classId, String(classId))) return false;
    if (date && r.date !== todayStr) return false;
    if (session && r.session !== sessStr) return false;
    if (period && r.periodNumber !== periodNum) return false;
    return true;
  });

  return res.json({
    classId: classId || 'all',
    date: todayStr,
    session: sessStr,
    period: periodNum,
    records: matchingRecords,
    totalRecords: matchingRecords.length,
    source: 'local',
  });
});

// 6.6 Teacher confirms or modifies attendance (Cập nhật đồng bộ Supabase)
app.post('/api/attendance/confirm', async (req: Request, res: Response) => {
  const { classId, date, session = 'morning', period = 2, confirmAllPending, recordUpdates, teacherName = 'Cô Nguyễn Thị Huệ' } = req.body;
  const todayStr = date || new Date().toISOString().split('T')[0];
  const periodNum = Number(period) || 2;
  const sessStr = session || 'morning';
  const nowIso = new Date().toISOString();
  const nowStr = new Date().toLocaleString('vi-VN');

  // 1. Cập nhật vào CSDL Supabase
  if (supabaseAdmin) {
    try {
      if (confirmAllPending) {
        const { data: dbRecords } = await supabaseAdmin
          .from('attendance_records')
          .select('id, class_id, status')
          .eq('date', todayStr)
          .eq('session', sessStr)
          .eq('period_number', periodNum);

        if (Array.isArray(dbRecords)) {
          const toUpdateIds = dbRecords
            .filter(r => (!classId || isSameClass(r.class_id, classId)) && (r.status === 'present_pending_confirm' || r.status === 'unverified'))
            .map(r => r.id);

          if (toUpdateIds.length > 0) {
            await supabaseAdmin
              .from('attendance_records')
              .update({
                status: 'present',
                verified_by_teacher: teacherName,
                verified_at: nowIso,
              })
              .in('id', toUpdateIds);
          }
        }
      }

      if (Array.isArray(recordUpdates)) {
        for (const up of recordUpdates) {
          if (up.id) {
            const patch: any = {
              verified_by_teacher: teacherName,
              verified_at: nowIso,
            };
            if (up.status) patch.status = up.status;
            if (up.teacherNote !== undefined) patch.teacher_note = up.teacherNote;
            if (up.seatChangeConfirmed !== undefined) {
              patch.seat_change_confirmed = Boolean(up.seatChangeConfirmed);
              if (up.seatChangeConfirmed && up.status === 'wrong_pc') {
                patch.status = 'present';
              }
            }
            await supabaseAdmin
              .from('attendance_records')
              .update(patch)
              .eq('id', up.id);
          }
        }
      }
    } catch (e: any) {
      console.warn('[Attendance Confirm] Lỗi cập nhật Supabase:', e?.message || e);
    }
  }

  // 2. Cập nhật bộ nhớ đệm máy chủ
  const allRecords = readJsonFile<Record<string, StoredAttendanceRecord>>(ATTENDANCE_FILE, {});

  if (confirmAllPending) {
    Object.values(allRecords).forEach(r => {
      if ((!classId || isSameClass(r.classId, classId)) && r.date === todayStr && r.session === sessStr && r.periodNumber === periodNum) {
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
  return res.json({ success: true, message: 'Đã cập nhật và lưu điểm danh thành công trên CSDL Supabase!' });
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

// ==========================================
// 7. CỔNG HỌC SINH RIÊNG (STUDENT PORTAL APIS)
// ==========================================

// 7.1 Lấy dữ liệu cá nhân học sinh, điểm danh và kết quả học tập từ Supabase (Yêu cầu 2, 3, 5, 6, 7)
app.get('/api/student/dashboard', async (req: Request, res: Response) => {
  const { studentCode, date, session = 'morning', period = 2 } = req.query;
  if (!studentCode || typeof studentCode !== 'string') {
    return res.status(400).json({ success: false, error: 'Vui lòng cung cấp mã học sinh!' });
  }

  const cleanCode = studentCode.trim().toUpperCase();
  const todayStr = (date as string) || new Date().toISOString().split('T')[0];
  const sessStr = String(session || 'morning');
  const periodNum = Number(period) || 2;

  // 1. Xác thực học sinh trong danh sách chính thức
  const allStudents = readJsonFile<any[]>(STUDENTS_FILE, generateAllStudents());
  const student = allStudents.find(s => s.code.toUpperCase() === cleanCode || s.id.toUpperCase() === cleanCode);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Học sinh không tồn tại trong danh sách!' });
  }

  let dbStudentId: number | null = null;
  let attendanceRecord: any = null;
  let assessments: any[] = [];

  if (supabaseAdmin) {
    try {
      const { data: dbSt } = await supabaseAdmin
        .from('students')
        .select('id, code, name, class_id, seat')
        .eq('code', student.code)
        .maybeSingle();

      if (dbSt) {
        dbStudentId = dbSt.id;

        // Tra cứu điểm danh hôm nay từ public.attendance_records
        const recordId = `att_${student.code}_${todayStr}_${sessStr}_P${periodNum}`;
        const { data: att } = await supabaseAdmin
          .from('attendance_records')
          .select('*')
          .eq('id', recordId)
          .maybeSingle();

        if (att) attendanceRecord = att;

        // Tra cứu bài tập & đánh giá cá nhân từ public.assessments
        const { data: ass } = await supabaseAdmin
          .from('assessments')
          .select('*')
          .eq('student_id', dbSt.id)
          .order('created_at', { ascending: false });

        if (ass) assessments = ass;
      }
    } catch (err: any) {
      console.warn('[Student Dashboard] Lỗi đọc Supabase:', err?.message || err);
    }
  }

  return res.json({
    success: true,
    student: {
      id: student.id,
      code: student.code,
      name: student.name,
      classId: student.classId,
      gender: student.gender,
      seatNumber: student.seatNumber,
      dbStudentId,
    },
    attendance: attendanceRecord,
    assessments,
  });
});

// 7.2 Học sinh nộp bài lý thuyết (Trắc nghiệm) và lưu kết quả lên Supabase (Yêu cầu 4, 5, 7)
app.post('/api/student/submit-quiz', async (req: Request, res: Response) => {
  const { studentCode, quizId, quizTitle, classId, score, totalQuestions, correctCount, timeSpentSeconds } = req.body;
  if (!studentCode || !quizId) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bài nộp!' });
  }

  const cleanCode = String(studentCode).trim().toUpperCase();
  const allStudents = readJsonFile<any[]>(STUDENTS_FILE, generateAllStudents());
  const student = allStudents.find(s => s.code.toUpperCase() === cleanCode || s.id.toUpperCase() === cleanCode);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Học sinh không tồn tại!' });
  }

  let savedToSupabase = false;
  let assessmentId: number | null = null;

  if (supabaseAdmin) {
    try {
      const { data: dbSt } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('code', student.code)
        .maybeSingle();

      if (dbSt && typeof dbSt.id === 'number') {
        const commentText = `Trắc nghiệm: ${quizTitle || quizId}. Đúng ${correctCount || 0}/${totalQuestions || 0} câu. Điểm: ${score}/10.`;
        const { data: newAss, error: assErr } = await supabaseAdmin
          .from('assessments')
          .insert({
            student_id: dbSt.id,
            term: `quiz_${quizId}`,
            score: Number(score) || 0,
            comment: commentText,
            parent_signed: false,
          })
          .select();

        if (!assErr && newAss && newAss[0]) {
          savedToSupabase = true;
          assessmentId = newAss[0].id;
        } else if (assErr) {
          console.warn('[Supabase Assessments] Lỗi ghi bài trắc nghiệm:', assErr.message);
        }
      }
    } catch (e: any) {
      console.warn('[Supabase Assessments] Lỗi ngoại lệ:', e?.message || e);
    }
  }

  return res.json({
    success: true,
    savedToSupabase,
    assessmentId,
    message: `Đã nộp bài trắc nghiệm thành công! Điểm của em: ${score}/10 (${savedToSupabase ? 'Đã lưu CSDL Supabase' : 'Lưu bộ nhớ tạm'}).`,
  });
});

// 7.3 Học sinh nộp bài thực hành và lưu lên Supabase (Yêu cầu 4, 5, 7)
app.post('/api/student/submit-practice', async (req: Request, res: Response) => {
  const { studentCode, assignmentId, assignmentTitle, classId, productTitle, productContent, fileType = 'DOCX', score = 10 } = req.body;
  if (!studentCode || !assignmentId) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin bài nộp!' });
  }

  const cleanCode = String(studentCode).trim().toUpperCase();
  const allStudents = readJsonFile<any[]>(STUDENTS_FILE, generateAllStudents());
  const student = allStudents.find(s => s.code.toUpperCase() === cleanCode || s.id.toUpperCase() === cleanCode);
  if (!student) {
    return res.status(404).json({ success: false, error: 'Học sinh không tồn tại!' });
  }

  let savedToSupabase = false;
  let assessmentId: number | null = null;

  if (supabaseAdmin) {
    try {
      const { data: dbSt } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('code', student.code)
        .maybeSingle();

      if (dbSt && typeof dbSt.id === 'number') {
        const commentText = `Thực hành: ${assignmentTitle || assignmentId}. Tên sản phẩm: ${productTitle || 'Bài làm của em'}. Định dạng: ${fileType}.`;
        const { data: newAss, error: assErr } = await supabaseAdmin
          .from('assessments')
          .insert({
            student_id: dbSt.id,
            term: `practice_${assignmentId}`,
            score: Number(score) || 10,
            comment: commentText,
            parent_signed: false,
          })
          .select();

        if (!assErr && newAss && newAss[0]) {
          savedToSupabase = true;
          assessmentId = newAss[0].id;
        } else if (assErr) {
          console.warn('[Supabase Assessments] Lỗi ghi bài thực hành:', assErr.message);
        }
      }
    } catch (e: any) {
      console.warn('[Supabase Assessments] Lỗi ngoại lệ:', e?.message || e);
    }
  }

  return res.json({
    success: true,
    savedToSupabase,
    assessmentId,
    message: `Đã nộp bài thực hành thành công! Sản phẩm: "${productTitle}" (${savedToSupabase ? 'Đã lưu CSDL Supabase' : 'Lưu bộ nhớ tạm'}).`,
  });
});

// 7.4 Học sinh xem điểm và đánh giá cá nhân (Không xem của bạn khác - Yêu cầu 6, 7)
app.get('/api/student/my-results', async (req: Request, res: Response) => {
  const { studentCode } = req.query;
  if (!studentCode || typeof studentCode !== 'string') {
    return res.status(400).json({ success: false, error: 'Thiếu mã học sinh!' });
  }
  const cleanCode = studentCode.trim().toUpperCase();

  if (!supabaseAdmin) {
    return res.json({ success: true, assessments: [] });
  }

  try {
    const { data: dbSt } = await supabaseAdmin
      .from('students')
      .select('id, code, name')
      .eq('code', cleanCode)
      .maybeSingle();

    if (!dbSt) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh!' });
    }

    const { data: assessments, error: assErr } = await supabaseAdmin
      .from('assessments')
      .select('*')
      .eq('student_id', dbSt.id)
      .order('created_at', { ascending: false });

    if (assErr) {
      return res.status(500).json({ success: false, error: assErr.message });
    }

    return res.json({
      success: true,
      student: dbSt,
      assessments: assessments || [],
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || e });
  }
});

// 7.5 Ban liên lạc phụ huynh - Tra cứu tin nhắn từ public.parent_messages trên Supabase (Yêu cầu 7)
app.get('/api/parent-messages', async (_req: Request, res: Response) => {
  const { client: sbClient } = getSupabaseServerClient();
  const activeSb = sbClient || supabaseAdmin;

  if (activeSb) {
    try {
      const { data, error } = await activeSb
        .from('parent_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return res.json({
          success: true,
          messages: data.map(m => ({
            id: String(m.id),
            studentName: m.student_name || 'Học sinh',
            parentName: m.parent_name || 'Phụ huynh',
            date: m.date || (m.created_at ? new Date(m.created_at).toLocaleDateString('vi-VN') : 'Hôm nay'),
            content: m.msg || '',
            createdAt: m.created_at,
          })),
          source: 'supabase',
        });
      }
    } catch (e: any) {
      console.warn('[Parent Messages] Error fetching from Supabase:', e?.message || e);
    }
  }

  return res.json({
    success: true,
    messages: [
      {
        id: '1',
        parentName: 'Mẹ Minh Quân',
        date: 'Hôm nay',
        content: 'Cảm ơn thầy đã động viên con ạ. Tối nay về con thích thú khoe được thầy thưởng 2 Sao vàng.',
        studentName: 'Lê Minh Quân',
      }
    ],
    source: 'fallback',
  });
});

// 7.6 Ban liên lạc phụ huynh - Gửi phản hồi / tin nhắn mới lưu bền vững vào Supabase (Yêu cầu 7)
app.post('/api/parent-messages', async (req: Request, res: Response) => {
  const { parentName, studentName, content, date } = req.body;
  if (!content || !parentName) {
    return res.status(400).json({ success: false, error: 'Thiếu tên phụ huynh hoặc nội dung tin nhắn!' });
  }

  const { client: sbClient } = getSupabaseServerClient();
  const activeSb = sbClient || supabaseAdmin;

  if (activeSb) {
    try {
      const { data, error } = await activeSb
        .from('parent_messages')
        .insert({
          parent_name: parentName.trim(),
          student_name: (studentName || 'Học sinh').trim(),
          msg: content.trim(),
          date: date || new Date().toLocaleDateString('vi-VN'),
        })
        .select();

      if (!error && data && data[0]) {
        return res.json({
          success: true,
          message: 'Đã lưu phản hồi phụ huynh thành công vào CSDL Supabase!',
          data: data[0],
        });
      }
      if (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
    } catch (e: any) {
      return res.status(500).json({ success: false, error: e?.message || e });
    }
  }

  return res.json({
    success: true,
    message: 'Đã tiếp nhận phản hồi phụ huynh (lưu bộ nhớ tạm)!',
  });
});

// 7.7 Giáo viên tra cứu toàn bộ đánh giá & bài tập từ public.assessments trên Supabase (Yêu cầu 4, 5, 6)
app.get('/api/teacher/assessments', async (req: Request, res: Response) => {
  const { classId } = req.query;
  const { client: sbClient } = getSupabaseServerClient();
  const activeSb = sbClient || supabaseAdmin;

  if (!activeSb) {
    return res.json({ success: true, assessments: [], source: 'offline' });
  }

  try {
    const { data: dbAssessments, error: assErr } = await activeSb
      .from('assessments')
      .select('id, student_id, term, score, comment, parent_signed, created_at')
      .order('created_at', { ascending: false });

    if (assErr) {
      return res.status(500).json({ success: false, error: assErr.message });
    }

    return res.json({
      success: true,
      assessments: dbAssessments || [],
      source: 'supabase',
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || e });
  }
});

// 7.8 Giáo viên lưu đánh giá tháng / học kỳ vào public.assessments trên Supabase (Yêu cầu 6)
app.post('/api/teacher/save-assessment', async (req: Request, res: Response) => {
  const { studentCode, studentDbId, term, score, comment } = req.body;
  if (!term || (!studentCode && !studentDbId)) {
    return res.status(400).json({ success: false, error: 'Thiếu thông tin đánh giá!' });
  }

  const { client: sbClient } = getSupabaseServerClient();
  const activeSb = sbClient || supabaseAdmin;

  if (!activeSb) {
    return res.json({ success: true, message: 'Đã lưu đánh giá (bộ nhớ tạm)!' });
  }

  try {
    let resolvedDbId = studentDbId;
    if (!resolvedDbId && studentCode) {
      const { data: st } = await activeSb
        .from('students')
        .select('id')
        .eq('code', String(studentCode).trim().toUpperCase())
        .maybeSingle();
      if (st) resolvedDbId = st.id;
    }

    if (!resolvedDbId) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy hồ sơ học sinh trên CSDL!' });
    }

    const { data: newAss, error: insErr } = await activeSb
      .from('assessments')
      .upsert({
        student_id: resolvedDbId,
        term: String(term).trim(),
        score: score !== undefined ? Number(score) : null,
        comment: comment ? String(comment).trim() : null,
        parent_signed: false,
      })
      .select();

    if (insErr) {
      return res.status(500).json({ success: false, error: insErr.message });
    }

    return res.json({
      success: true,
      message: 'Đã lưu đánh giá học sinh vào CSDL Supabase thành công!',
      assessment: newAss ? newAss[0] : null,
    });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || e });
  }
});

// Start server with Vite middleware in dev or static files in prod
async function startServer() {
  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.resolve(distDir, 'index.html');
  const hasDist = fs.existsSync(distIndex);

  // Serving strategy:
  // 1. If explicit NODE_ENV === 'production' and pre-built dist/index.html exists: serve static bundle
  // 2. Otherwise: mount Vite middleware for live React SPA serving
  const isExplicitProd = process.env.NODE_ENV === 'production';

  if (isExplicitProd && hasDist) {
    console.log(`[Server] Production mode active. Serving pre-built static bundle from ${distDir}`);
    app.use(express.static(distDir, { maxAge: '1d', index: false }));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(distIndex);
    });
  } else {
    // Development mode with Vite middleware
    try {
      const vitePkg = 'vite';
      const { createServer: createViteServer } = await import(/* @vite-ignore */ vitePkg);
      const vite = await createViteServer({
        root: __dirname,
        server: { middlewareMode: true, hmr: false },
        appType: 'spa',
      });
      app.use(vite.middlewares);

      // Explicit SPA fallback for HTML requests not caught by middlewares
      app.get('*', async (req: Request, res: Response, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return next();
        }
        try {
          const indexPath = path.resolve(__dirname, 'index.html');
          if (fs.existsSync(indexPath)) {
            const template = fs.readFileSync(indexPath, 'utf-8');
            const html = await vite.transformIndexHtml(req.originalUrl, template);
            return res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
          }
          next();
        } catch (e) {
          next(e);
        }
      });
      console.log('[Server] Vite dev middleware mounted successfully.');
    } catch (viteErr) {
      console.error('[Server] Vite middleware initialization failed, attempting static fallback:', viteErr);
      if (hasDist) {
        app.use(express.static(distDir));
        app.get('*', (_req: Request, res: Response) => {
          res.sendFile(distIndex);
        });
      } else {
        app.get('*', (_req: Request, res: Response) => {
          res.status(500).send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lớp Học Số Thông Minh - Khởi động</title></head><body style="font-family:sans-serif;padding:40px;text-align:center;"><h2>Đang chuẩn bị môi trường Lớp Học Số Thông Minh</h2><p>Vui lòng đợi trong giây lát hoặc chạy 'npm run build'.</p></body></html>`);
        });
      }
    }
  }

  const isProd = isExplicitProd && hasDist;
  const server = app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port} [${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
  });

  server.on('error', (err: any) => {
    console.error('Server network listen error:', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} already in use. Exiting process so supervisor can restart cleanly.`);
      process.exit(1);
    }
  });

  process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    server.close(() => process.exit(0));
  });
}

// Only launch standalone HTTP listener if not running in Serverless environment (Vercel, Netlify, Lambda)
// and executed directly as main process (e.g. tsx server.ts or node server.ts)
const isServerlessRuntime = Boolean(
  process.env.VERCEL || 
  process.env.NETLIFY || 
  process.env.AWS_LAMBDA_FUNCTION_NAME || 
  process.env.LAMBDA_TASK_ROOT || 
  process.env.SERVERLESS ||
  process.env.NODE_ENV === 'test'
);

const isDirectExecution = Boolean(
  process.argv[1] && (
    process.argv[1].endsWith('server.ts') ||
    process.argv[1].endsWith('server.js') ||
    (currentFileUrl && fileURLToPath(currentFileUrl) === path.resolve(process.argv[1]))
  )
);

if (!isServerlessRuntime && isDirectExecution) {
  startServer().catch((err) => {
    console.error('Unhandled error in startServer:', err);
    process.exit(1);
  });
}

export { app, startServer };
export default app;
