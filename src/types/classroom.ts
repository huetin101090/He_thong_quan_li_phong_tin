export type Gender = 'male' | 'female';
export type AttendanceStatus = 
  | 'present' 
  | 'present_pending_confirm' 
  | 'wrong_pc' 
  | 'late' 
  | 'absent_excused' 
  | 'absent_unexcused' 
  | 'unverified' 
  | 'absent' 
  | 'excused';

export type ComputerStatus = 'operational' | 'maintenance' | 'broken' | 'issue';

export interface Student {
  id: string; // e.g., 'HS34-01'
  code: string; // e.g., 'HS34-01'
  name: string; // Vietnamese full name
  gender: Gender;
  classId: string; // e.g., '3/4'
  seatNumber?: number; // order in class list
  attendance: AttendanceStatus;
  notes?: string;
  pin?: string; // 4-digit PIN for student login
  assignedPcId?: number | null; // Currently assigned PC (1-20)
  actualPcId?: number | null; // Actual PC used when checking in
  loginTime?: string; // Timestamp of login
}

export interface ClassInfo {
  id: string; // e.g., '3.4', '3.5', '3.6', '4.3', '4.4', '4.5', '5.4', '5.5', '5.6'
  name: string; // e.g., 'Lớp 3.4'
  grade: number; // 3, 4, 5
  totalStudents: number;
  homeroomTeacher: string;
  ictTeacher: string;
  tinHocFolder?: string;
  congNgheFolder?: string;
  aliases?: string[];
}

export interface ComputerSlot {
  computerId: number; // 1 to 20
  studentAId: string | null; // Student ID
  studentBId: string | null; // Student ID (second student if class > 20)
  status: ComputerStatus;
  notes?: string;
}

export type ClassAssignments = Record<number, { studentAId: string | null; studentBId: string | null }>;

export interface AttendanceRecord {
  id: string; // e.g. att_HS54-01_2026-10-15_morning_P2
  studentId: string;
  studentCode: string;
  studentName: string;
  classId: string;
  date: string; // YYYY-MM-DD
  session: 'morning' | 'afternoon';
  periodNumber: number;
  assignedPcId: number | null;
  actualPcId: number;
  loginTimestamp: string;
  status: AttendanceStatus;
  seatChangeConfirmed?: boolean;
  teacherNote?: string;
  verifiedByTeacher?: string;
  verifiedAt?: string;
}

export interface ClassAttendanceSummary {
  classId: string;
  date: string;
  session: 'morning' | 'afternoon';
  periodNumber: number;
  totalStudents: number;
  loggedInCount: number;
  verifiedPresentCount: number;
  absentCount: number;
  lateCount: number;
  unverifiedCount: number;
  wrongPcCount: number;
}

export interface PeriodSchedule {
  date: string; // YYYY-MM-DD
  session: 'morning' | 'afternoon';
  periodNumber: number; // 1 to 5
  lessonName?: string;
  teacherNote?: string;
}

export interface AssignmentHistoryRecord {
  id: string; // classId_date_session_period
  classId: string;
  date: string;
  session: 'morning' | 'afternoon';
  periodNumber: number;
  lessonName: string;
  assignments: ClassAssignments;
  brokenComputers?: number[]; // List of broken computer IDs in this session
  updatedAt: string;
  savedByTeacher?: string;
}

export interface DatabaseStatus {
  isActive: boolean;
  type: 'LocalStorage' | 'MockDB' | 'ServerREST' | 'Firebase' | 'Disconnected';
  totalClasses: number;
  totalStudents: number;
  totalComputers: number;
  savedRecordsCount: number;
  lastSyncTime: string;
  integrityVerified: boolean;
  message: string;
}
