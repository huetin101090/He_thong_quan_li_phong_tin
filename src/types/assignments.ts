export type QuestionType = 
  | 'single_choice' 
  | 'multiple_choice' 
  | 'true_false' 
  | 'short_answer' 
  | 'essay';

export interface TheoryQuestion {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // For single_choice, multiple_choice, true_false
  correctAnswers: string[] | string; // Correct answer(s)
  explanation: string;
  points: number;
  rubricGuide?: string; // For essay evaluation guidance
  cognitiveLevel?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
}

export interface TheoryQuiz {
  id: string;
  title: string;
  grade: 3 | 4 | 5;
  subject?: 'tin' | 'congnghe';
  targetClassIds: string[]; // e.g. ['3.4', '3.5', '3.6']
  lessonTopic: string;
  timeLimitMinutes: number; // e.g. 15
  maxAttempts: number; // e.g. 2
  deadline: string;
  allowReview: boolean; // Show explanation and answers after submit
  questions: TheoryQuestion[];
  totalPoints: number;
  status: 'published' | 'draft' | 'closed';
  createdBy: string;
  createdAt: string;
  activityType?: 'practice' | 'periodic_exam';
}

export interface QuizSubmission {
  id: string;
  quizId: string;
  quizTitle?: string;
  studentId: string; // e.g. 'HS34-01'
  studentName: string;
  classId: string;
  attemptNumber: number;
  answers: Record<string, string | string[]>; // questionId -> student's answer
  questionScores: Record<string, number>;
  autoGradedScore: number;
  essayScore: number | null; // null if pending teacher review
  finalScore: number | null;
  isGraded: boolean; // true when all questions including essay are graded
  teacherFeedback?: string;
  submittedAt: string;
  gradedAt?: string;
}

export interface PracticeRubricItem {
  id: string;
  name: string;
  maxPoints: number;
  description: string;
}

export interface PracticeAssignment {
  id: string;
  title: string;
  grade: 3 | 4 | 5;
  subject?: 'tin' | 'congnghe';
  targetClassIds: string[];
  objectives: string; // Mục tiêu bài học
  instructions: string; // Hướng dẫn chi tiết
  allowedFileTypes: ('DOCX' | 'PPTX' | 'PDF' | 'IMAGE')[];
  rubric: PracticeRubricItem[];
  maxPoints: number;
  deadline: string;
  sampleAttachmentName?: string;
  sampleAttachmentUrl?: string;
  status: 'published' | 'draft' | 'closed';
  createdBy: string;
  createdAt: string;
}

export interface AutomatedCheckItem {
  name: string;
  passed: boolean;
  scoreAwarded: number;
  maxScore: number;
  details: string;
}

export interface PracticeSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  classId: string;
  fileName: string;
  fileType: 'DOCX' | 'PPTX' | 'PDF' | 'IMAGE';
  fileSize: string;
  fileContentText?: string; // Text representation for automated verification
  submittedAt: string;
  status: 'submitted' | 'graded' | 'resubmit_required';
  automatedChecks?: {
    totalAwarded: number;
    totalPossible: number;
    items: AutomatedCheckItem[];
    summary: string;
  };
  rubricScores: Record<string, number>;
  finalScore: number | null;
  gradeLevel?: 'T' | 'H' | 'C'; // Hoàn thành Tốt (T), Hoàn thành (H), Chưa hoàn thành (C) theo Thông tư 27
  teacherComment: string;
  aiSuggestedComment?: {
    strengths: string;
    needsImprovement: string;
    concreteSuggestion: string;
    combined: string;
  };
  revisionNotes?: string;
  canResubmit: boolean;
  history: { action: string; timestamp: string; note?: string }[];
}

export interface ExternalResourceLink {
  id: string;
  platform: 'BeeClass' | 'GiaoVienDoiMoi' | 'Kahoot' | 'Quizizz' | 'Olm' | 'Wordwall' | 'Liveworksheets' | 'Khac';
  title: string;
  grade: 3 | 4 | 5;
  targetClassIds: string[];
  url: string;
  description: string;
  deadline: string;
  attachedFileName?: string;
  attachedFileSize?: string;
  completions: Record<string, { isCompleted: boolean; score?: number; verifiedAt?: string; verifiedBy?: string }>;
  createdAt: string;
}

export interface MonthlyEvaluation {
  id: string;
  month: number; // 1 - 12
  year: number;
  grade: 3 | 4 | 5;
  classId: string;
  studentId: string;
  studentName: string;
  quizzesCompleted: number;
  quizzesTotal: number;
  practiceCompleted: number;
  practiceTotal: number;
  averageScore: number;
  participationLevel: 'Tích cực' | 'Đạt yêu cầu' | 'Cần cố gắng';
  strengths: string;
  needsImprovement: string;
  aiDraftComment: string;
  teacherComment: string;
  isApproved: boolean;
  updatedAt: string;
}

export interface SemesterEvaluation {
  id: string;
  semester: 1 | 2 | 3; // 1: Học kỳ 1, 2: Học kỳ 2, 3: Đánh giá nhận xét cuối năm (Cả năm)
  schoolYear: string; // '2025-2026'
  grade: 3 | 4 | 5;
  classId: string;
  studentId: string;
  studentName: string;
  overallLevel: 'T' | 'H' | 'C'; // Thông tư 27/2020/TT-BGDĐT
  theoryScoreAvg: number;
  practiceScoreAvg: number;
  finalTeacherComment: string;
  aiDraftComment: string;
  teacherSigned: boolean;
  updatedAt: string;
}

export type UserRole = 'teacher' | 'student';

export interface UserSession {
  role: UserRole;
  studentId?: string; // If role is 'student' (e.g. 'HS34-01')
  studentName?: string;
  classId?: string;
  teacherName?: string;
}
