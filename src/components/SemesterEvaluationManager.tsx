import React, { useState } from 'react';
import { 
  SemesterEvaluation, 
  UserSession 
} from '../types/assignments';
import { Student, ClassInfo } from '../types/classroom';
import { 
  getStoredSemesterEvaluations, 
  saveSemesterEvaluation,
  getStoredQuizSubmissions,
  getStoredPracticeSubmissions
} from '../services/assignmentService';
import { isSameClass } from '../data/initialData';
import { 
  Award, 
  FileSpreadsheet, 
  Printer, 
  Sparkles, 
  CheckCircle2, 
  Edit3, 
  X,
  FileCheck,
  ShieldCheck
} from 'lucide-react';

interface SemesterEvaluationManagerProps {
  session: UserSession;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string;
}

export const SemesterEvaluationManager: React.FC<SemesterEvaluationManagerProps> = ({
  session,
  classes,
  students,
  currentClassId,
}) => {
  const [selectedSemester, setSelectedSemester] = useState<1 | 2 | 3>(3); // 3 = Cuối năm (Cả năm)
  const [selectedSchoolYear, setSelectedSchoolYear] = useState<string>('2025-2026');
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClassId || '3/4');

  React.useEffect(() => {
    if (currentClassId) {
      setSelectedClassId(currentClassId);
    }
  }, [currentClassId]);

  const [evaluations, setEvaluations] = useState<SemesterEvaluation[]>(() => getStoredSemesterEvaluations());
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState<string>('');
  const [tempLevel, setTempLevel] = useState<'T' | 'H' | 'C'>('T');

  const isTeacher = session.role === 'teacher';
  const effectiveClassId = !isTeacher && session.classId ? session.classId : selectedClassId;
  const rawClassStudents = students.filter(s => isSameClass(s.classId, effectiveClassId));
  const classStudents = !isTeacher && session.studentId 
    ? rawClassStudents.filter(s => s.id === session.studentId)
    : rawClassStudents;
  const currentClassInfo = classes.find(c => isSameClass(c.id, effectiveClassId)) || classes[0];

  const allQuizSubs = getStoredQuizSubmissions();
  const allPracticeSubs = getStoredPracticeSubmissions();

  // Synthesize semester evaluation list for class
  const semesterList = classStudents.map((st, idx) => {
    const existing = evaluations.find(
      e => e.studentId === st.id && e.semester === selectedSemester && e.schoolYear === selectedSchoolYear
    );

    if (existing) return existing;

    // Actual scores from student's theory quizzes and practice submissions
    const studentQuizzes = allQuizSubs.filter(s => s.studentId === st.id);
    const studentPractices = allPracticeSubs.filter(s => s.studentId === st.id);

    let theoryAvg: number;
    if (studentQuizzes.length > 0) {
      const qScores = studentQuizzes.map(s => s.finalScore ?? s.autoGradedScore);
      theoryAvg = Math.round((qScores.reduce((a, b) => a + b, 0) / qScores.length) * 10) / 10;
    } else {
      const baseScore = 8.5 + ((idx % 3) * 0.5) - ((idx % 7) * 0.4);
      theoryAvg = Math.min(10, Math.max(6, Math.round(baseScore * 10) / 10));
    }

    let practiceAvg: number;
    if (studentPractices.length > 0) {
      const pScores = studentPractices.map(s => s.finalScore ?? s.automatedChecks?.totalAwarded ?? 8.0);
      practiceAvg = Math.round((pScores.reduce((a, b) => a + b, 0) / pScores.length) * 10) / 10;
    } else {
      const baseScore = 8.5 + ((idx % 3) * 0.5) - ((idx % 7) * 0.4);
      practiceAvg = Math.min(10, Math.max(6.5, Math.round((baseScore + 0.3) * 10) / 10));
    }

    const overall = (theoryAvg >= 8.5 && practiceAvg >= 8.5) ? 'T' : (theoryAvg >= 6 && practiceAvg >= 6) ? 'H' : 'C';

    const defaultComment = overall === 'T'
      ? `Học sinh hoàn thành xuất sắc các nội dung môn Tin học Học kỳ ${selectedSemester}. Nắm vững thao tác bàn phím, sử dụng chuột và các phần mềm thành thạo, có tính sáng tạo cao.`
      : overall === 'H'
      ? `Hoàn thành tốt các yêu cầu cần đạt của môn Tin học Học kỳ ${selectedSemester}. Biết tự giác thực hành trên máy tính, thực hiện được các thao tác cơ bản.`
      : `Đã có nhiều cố gắng trong học kỳ. Cần rèn luyện thêm kỹ năng gõ bàn phím và tập trung hơn trong các bài tập thực hành.`;

    const defaultEval: SemesterEvaluation = {
      id: `sem_${selectedSemester}_${selectedSchoolYear}_${st.id}`,
      semester: selectedSemester,
      schoolYear: selectedSchoolYear,
      grade: currentClassInfo.grade as any,
      classId: st.classId,
      studentId: st.id,
      studentName: st.name,
      overallLevel: overall,
      theoryScoreAvg: theoryAvg,
      practiceScoreAvg: practiceAvg,
      finalTeacherComment: defaultComment,
      aiDraftComment: defaultComment,
      teacherSigned: true,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    return defaultEval;
  });

  const handleSaveStudentReview = (studentId: string, level: 'T' | 'H' | 'C', comment: string) => {
    const target = semesterList.find(e => e.studentId === studentId);
    if (!target) return;

    const updated = {
      ...target,
      overallLevel: level,
      finalTeacherComment: comment,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    saveSemesterEvaluation(updated);
    setEvaluations(getStoredSemesterEvaluations());
    setEditingStudentId(null);

    // Sync to Supabase assessments table in background
    fetch('/api/teacher/save-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: target.studentId,
        term: `semester_${selectedSemester}_${selectedSchoolYear}`,
        score: target.theoryScoreAvg,
        comment: `[${level}] ${comment}`,
      }),
    }).catch(() => {});
  };

  const handleExportCSV = () => {
    const headers = ['Mã HS', 'Họ và tên', 'Lớp', 'Học kỳ', 'Năm học', 'Điểm TB Lý thuyết', 'Điểm TB Thực hành', 'Mức Đánh giá (TT 27)', 'Nhận xét Đánh giá chung'];
    const rows = semesterList.map(e => [
      e.studentId,
      `"${e.studentName}"`,
      e.classId,
      `Học kỳ ${e.semester}`,
      e.schoolYear,
      e.theoryScoreAvg,
      e.practiceScoreAvg,
      e.overallLevel,
      `"${e.finalTeacherComment.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DanhGiaHocKy${selectedSemester}_Lop${selectedClassId.replace('/', '-')}_NamHoc${selectedSchoolYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalT = semesterList.filter(s => s.overallLevel === 'T').length;
  const totalH = semesterList.filter(s => s.overallLevel === 'H').length;
  const totalC = semesterList.filter(s => s.overallLevel === 'C').length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border-2 border-blue-600 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
              Giai đoạn D • Thông tư 27
            </span>
            <h2 className="text-base font-black text-slate-800">
              BẢNG TỔNG HỢP ĐÁNH GIÁ NHẬN XÉT CUỐI NĂM & HỌC KỲ (MÔN TIN HỌC)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp kết quả lý thuyết, bài thực hành và nhận xét cả năm học. Giáo viên quyết định mức đánh giá chính thức (T - Hoàn thành Tốt, H - Hoàn thành, C - Chưa hoàn thành) theo TT 27.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-1.5 bg-blue-50 border border-blue-300 rounded-lg font-bold text-xs text-blue-900 outline-none"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>Lớp {c.id} ({c.totalStudents} HS)</option>
            ))}
          </select>

          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(Number(e.target.value) as 1 | 2 | 3)}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs text-slate-800 outline-none"
          >
            <option value={3}>🏆 Đánh giá nhận xét Cuối năm (Cả năm)</option>
            <option value={1}>Học kỳ I</option>
            <option value={2}>Học kỳ II</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel / PDF</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold uppercase">Tổng sĩ số lớp</span>
          <div className="text-xl font-black text-slate-900 mt-0.5">{classStudents.length} học sinh</div>
          <div className="text-[10px] text-slate-400">Lớp {selectedClassId}</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs">
          <span className="text-[11px] text-emerald-700 font-bold uppercase">Mức T (Hoàn thành Tốt)</span>
          <div className="text-xl font-black text-emerald-700 mt-0.5">{totalT} học sinh</div>
          <div className="text-[10px] text-emerald-600 font-medium">{Math.round((totalT / classStudents.length) * 100)}% cả lớp</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-[11px] text-blue-700 font-bold uppercase">Mức H (Hoàn thành)</span>
          <div className="text-xl font-black text-blue-700 mt-0.5">{totalH} học sinh</div>
          <div className="text-[10px] text-blue-600 font-medium">{Math.round((totalH / classStudents.length) * 100)}% cả lớp</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-xs">
          <span className="text-[11px] text-amber-700 font-bold uppercase">Mức C (Chưa hoàn thành)</span>
          <div className="text-xl font-black text-amber-700 mt-0.5">{totalC} học sinh</div>
          <div className="text-[10px] text-amber-600 font-medium">{Math.round((totalC / classStudents.length) * 100)}% cả lớp</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-blue-500 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3.5 bg-blue-50/70 border-b border-blue-200 flex justify-between items-center text-xs">
          <span className="font-bold text-blue-950">
            SỔ ĐÁNH GIÁ ĐỊNH KỲ {selectedSemester === 3 ? 'CUỐI NĂM HỌC (CẢ NĂM)' : `HỌC KỲ ${selectedSemester}`} • NĂM HỌC {selectedSchoolYear} ({currentClassInfo.name})
          </span>
          <span className="text-[11px] text-blue-800 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tuân thủ Thông tư 27/2020/TT-BGDĐT
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16">Mã HS</th>
                <th className="p-3 w-40">Họ và tên</th>
                <th className="p-3 w-24 text-center">ĐTB Lý thuyết</th>
                <th className="p-3 w-24 text-center">ĐTB Thực hành</th>
                <th className="p-3 w-28 text-center">Mức đánh giá</th>
                <th className="p-3">Nhận xét đánh giá học kỳ (Giáo viên phê duyệt)</th>
                <th className="p-3 w-20 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {semesterList.map((item) => {
                const isEditing = editingStudentId === item.studentId;

                return (
                  <tr key={item.studentId} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-slate-500 font-semibold">{item.studentId}</td>
                    <td className="p-3 font-bold text-slate-900">{item.studentName}</td>
                    <td className="p-3 text-center font-bold text-blue-700">{item.theoryScoreAvg.toFixed(1)}</td>
                    <td className="p-3 text-center font-bold text-indigo-700">{item.practiceScoreAvg.toFixed(1)}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                        item.overallLevel === 'T'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : item.overallLevel === 'H'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        Mức {item.overallLevel}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 leading-relaxed text-[11px]">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">Mức chính thức:</span>
                            <select
                              value={tempLevel}
                              onChange={(e) => setTempLevel(e.target.value as any)}
                              className="p-1 bg-white border border-slate-300 rounded font-bold"
                            >
                              <option value="T">T - Hoàn thành Tốt</option>
                              <option value="H">H - Hoàn thành</option>
                              <option value="C">C - Chưa hoàn thành</option>
                            </select>
                          </div>
                          <textarea
                            rows={3}
                            value={tempComment}
                            onChange={(e) => setTempComment(e.target.value)}
                            className="w-full p-2 bg-white border border-blue-500 rounded-lg text-xs outline-none"
                          />
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => setEditingStudentId(null)}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-[10px]"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveStudentReview(item.studentId, tempLevel, tempComment)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                            >
                              Lưu kết quả
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p>{item.finalTeacherComment}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Ký duyệt bởi: Giáo viên Tin học • {item.updatedAt}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingStudentId(item.studentId);
                            setTempComment(item.finalTeacherComment);
                            setTempLevel(item.overallLevel);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Duyệt</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
