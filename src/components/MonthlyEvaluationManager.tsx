import React, { useState, useEffect } from 'react';
import { 
  MonthlyEvaluation, 
  QuizSubmission, 
  PracticeSubmission, 
  TheoryQuiz, 
  PracticeAssignment, 
  UserSession 
} from '../types/assignments';
import { Student, ClassInfo } from '../types/classroom';
import { 
  getStoredQuizzes, 
  getStoredPracticeAssignments, 
  getStoredQuizSubmissions, 
  getStoredPracticeSubmissions, 
  getStoredMonthlyEvaluations, 
  saveMonthlyEvaluation,
  generateMonthlySummaryForStudent
} from '../services/assignmentService';
import { isSameClass } from '../data/initialData';
import { 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Download, 
  Printer, 
  Award, 
  Edit3, 
  Save, 
  RefreshCw, 
  Layers, 
  FileSpreadsheet,
  Check
} from 'lucide-react';

interface MonthlyEvaluationManagerProps {
  session: UserSession;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string;
}

export const MonthlyEvaluationManager: React.FC<MonthlyEvaluationManagerProps> = ({
  session,
  classes,
  students,
  currentClassId,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // Tháng 10
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedClassId, setSelectedClassId] = useState<string>(currentClassId || '3/4');

  React.useEffect(() => {
    if (currentClassId) {
      setSelectedClassId(currentClassId);
    }
  }, [currentClassId]);

  const [evaluations, setEvaluations] = useState<MonthlyEvaluation[]>(() => getStoredMonthlyEvaluations());
  const [isGeneratingAllAi, setIsGeneratingAllAi] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [tempComment, setTempComment] = useState<string>('');

  const quizzes = getStoredQuizzes();
  const practiceAssignments = getStoredPracticeAssignments();
  const quizSubs = getStoredQuizSubmissions();
  const practiceSubs = getStoredPracticeSubmissions();

  const isTeacher = session.role === 'teacher';
  const effectiveClassId = !isTeacher && session.classId ? session.classId : selectedClassId;
  const rawClassStudents = students.filter(s => isSameClass(s.classId, effectiveClassId));
  const classStudents = !isTeacher && session.studentId 
    ? rawClassStudents.filter(s => s.id === session.studentId)
    : rawClassStudents;
  const currentClassInfo = classes.find(c => isSameClass(c.id, effectiveClassId)) || classes[0];

  // Synthesize student progress for selected class and month
  const synthesizedList = classStudents.map((st) => {
    // Check if an evaluation already exists
    const existing = evaluations.find(
      e => e.studentId === st.id && e.month === selectedMonth && e.year === selectedYear
    );

    // Calculate actual recorded metrics
    const studentQuizzes = quizSubs.filter(s => s.studentId === st.id);
    const studentPractices = practiceSubs.filter(s => s.studentId === st.id);

    const qScores = studentQuizzes.map(s => s.finalScore || s.autoGradedScore);
    const pScores = studentPractices.map(s => s.finalScore || s.automatedChecks?.totalAwarded || 8);
    const allScores = [...qScores, ...pScores];
    const avg = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 8.5;

    const quizzesTotal = quizzes.filter(q => q.targetClassIds.some(cid => isSameClass(cid, st.classId))).length || 1;
    const practiceTotal = practiceAssignments.filter(p => p.targetClassIds.some(cid => isSameClass(cid, st.classId))).length || 1;

    if (existing) {
      return existing;
    }

    // Default synthesis
    const defaultEval: MonthlyEvaluation = {
      id: `eval_${selectedMonth}_${selectedYear}_${st.id}`,
      month: selectedMonth,
      year: selectedYear,
      grade: currentClassInfo.grade as any,
      classId: st.classId,
      studentId: st.id,
      studentName: st.name,
      quizzesCompleted: studentQuizzes.length,
      quizzesTotal,
      practiceCompleted: studentPractices.length,
      practiceTotal,
      averageScore: Math.round(avg * 10) / 10,
      participationLevel: avg >= 8 ? 'Tích cực' : 'Đạt yêu cầu',
      strengths: avg >= 8.5 ? 'Thao tác máy tính nhanh nhẹn, gõ phím chuẩn xác.' : 'Có ý thức tự giác thực hành.',
      needsImprovement: avg < 8 ? 'Cần rèn luyện thêm tư thế ngồi và định dạng văn bản.' : 'Tiếp tục phát huy.',
      aiDraftComment: `Trong tháng ${selectedMonth}, em ${st.name} có tinh thần học tập tích cực, hoàn thành tốt bài thực hành phòng máy tính (ĐTB: ${(Math.round(avg * 10) / 10).toFixed(1)}). Rất đáng khen ngợi!`,
      teacherComment: `Trong tháng ${selectedMonth}, em ${st.name} có tinh thần học tập tích cực, hoàn thành tốt bài thực hành phòng máy tính. Rất đáng khen ngợi!`,
      isApproved: true,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    return defaultEval;
  });

  const handleUpdateStudentComment = (studentId: string, newComment: string) => {
    const target = synthesizedList.find(e => e.studentId === studentId);
    if (!target) return;

    const updated = {
      ...target,
      teacherComment: newComment,
      isApproved: true,
      updatedAt: new Date().toLocaleDateString('vi-VN'),
    };

    saveMonthlyEvaluation(updated);
    setEvaluations(getStoredMonthlyEvaluations());
    setEditingStudentId(null);

    // Sync to Supabase assessments table in background
    fetch('/api/teacher/save-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentCode: target.studentId,
        term: `monthly_${selectedMonth}_${selectedYear}`,
        score: target.averageScore,
        comment: newComment,
      }),
    }).catch(() => {});
  };

  // Generate Gemini AI comments for all students in class
  const handleGenerateAllAiComments = async () => {
    setIsGeneratingAllAi(true);

    for (const item of synthesizedList) {
      const summary = await generateMonthlySummaryForStudent({
        studentId: item.studentId,
        studentName: item.studentName,
        classId: item.classId,
        month: selectedMonth,
        year: selectedYear,
        quizzesCompleted: item.quizzesCompleted,
        quizzesTotal: item.quizzesTotal,
        practiceCompleted: item.practiceCompleted,
        practiceTotal: item.practiceTotal,
        averageScore: item.averageScore,
      });

      const updated = {
        ...item,
        aiDraftComment: summary,
        teacherComment: summary,
        isApproved: true,
      };
      saveMonthlyEvaluation(updated);

      // Sync to Supabase assessments table in background
      fetch('/api/teacher/save-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentCode: item.studentId,
          term: `monthly_${selectedMonth}_${selectedYear}`,
          score: item.averageScore,
          comment: summary,
        }),
      }).catch(() => {});
    }

    setEvaluations(getStoredMonthlyEvaluations());
    setIsGeneratingAllAi(false);
    alert(`Đã tổng hợp và tạo đề xuất nhận xét Gemini AI hoàn chỉnh cho toàn bộ ${synthesizedList.length} học sinh Lớp ${selectedClassId}!`);
  };

  // Export CSV / Excel
  const handleExportCSV = () => {
    const headers = ['Mã HS', 'Họ và tên', 'Lớp', 'Tháng', 'Bài LT hoàn thành', 'Bài TH hoàn thành', 'Điểm TB', 'Mức độ', 'Nhận xét của Giáo viên'];
    const rows = synthesizedList.map(e => [
      e.studentId,
      `"${e.studentName}"`,
      e.classId,
      `Tháng ${e.month}/${e.year}`,
      `${e.quizzesCompleted}/${e.quizzesTotal}`,
      `${e.practiceCompleted}/${e.practiceTotal}`,
      e.averageScore,
      e.participationLevel,
      `"${e.teacherComment.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NhanXetThang${selectedMonth}_Lop${selectedClassId.replace('/', '-')}_DongDuong.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border-2 border-blue-600 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200">
              Giai đoạn D
            </span>
            <h2 className="text-base font-black text-slate-800">
              NHẬN XÉT TỔNG KẾT HẰNG THÁNG MÔN TIN HỌC TIỂU HỌC
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tổng hợp kết quả học tập ghi nhận, Trợ lý Gemini AI đề xuất nhận xét tích cực (2-4 câu), giáo viên duyệt và xuất danh sách.
          </p>
        </div>

        {/* Month & Class selector */}
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
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-1.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-xs text-slate-800 outline-none"
          >
            {[9, 10, 11, 12, 1, 2, 3, 4, 5].map(m => (
              <option key={m} value={m}>Tháng {m}/{selectedYear}</option>
            ))}
          </select>

          <button
            onClick={handleGenerateAllAiComments}
            disabled={isGeneratingAllAi}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-yellow-200 ${isGeneratingAllAi ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAllAi ? 'AI đang tổng hợp...' : 'AI đề xuất cả lớp'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            title="Xuất bảng nhận xét ra tệp Excel (CSV)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Roster of Monthly Reviews */}
      <div className="bg-white border-2 border-blue-500 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-3.5 bg-blue-50/70 border-b border-blue-200 flex justify-between items-center text-xs">
          <span className="font-bold text-blue-950">
            BẢNG TỔNG HỢP & NHẬN XÉT THÁNG {selectedMonth} • {currentClassInfo.name} ({classStudents.length} HỌC SINH)
          </span>
          <span className="text-[11px] text-blue-800 font-medium">
            Chuẩn ngôn ngữ khích lệ học sinh Tiểu học • Không suy diễn hành vi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3 w-16">Mã HS</th>
                <th className="p-3 w-36">Họ và tên</th>
                <th className="p-3 w-28 text-center">Hoàn thành bài</th>
                <th className="p-3 w-20 text-center">Điểm TB</th>
                <th className="p-3 w-28 text-center">Mức độ tham gia</th>
                <th className="p-3">Nhận xét của Giáo viên (Gemini AI hỗ trợ)</th>
                <th className="p-3 w-24 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {synthesizedList.map((item) => {
                const isEditing = editingStudentId === item.studentId;

                return (
                  <tr key={item.studentId} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-slate-500 font-semibold">{item.studentId}</td>
                    <td className="p-3 font-bold text-slate-900">{item.studentName}</td>
                    <td className="p-3 text-center text-[11px]">
                      <div>LT: <strong>{item.quizzesCompleted}/{item.quizzesTotal}</strong></div>
                      <div>TH: <strong>{item.practiceCompleted}/{item.practiceTotal}</strong></div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-base font-black text-blue-700">{item.averageScore.toFixed(1)}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.averageScore >= 8 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {item.participationLevel}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700 leading-relaxed text-[11px]">
                      {isEditing ? (
                        <div className="space-y-1.5">
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
                              onClick={() => handleUpdateStudentComment(item.studentId, tempComment)}
                              className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold"
                            >
                              Lưu nhận xét
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="group relative">
                          <p>{item.teacherComment}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Cập nhật: {item.updatedAt} • Đã duyệt
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingStudentId(item.studentId);
                            setTempComment(item.teacherComment);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Sửa lời</span>
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
