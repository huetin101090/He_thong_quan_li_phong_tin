import React, { useState } from 'react';
import { 
  ExternalResourceLink, 
  UserSession 
} from '../types/assignments';
import { Student, ClassInfo } from '../types/classroom';
import { 
  getStoredExternalLinks, 
  saveExternalLink, 
  verifyStudentExternalCompletion 
} from '../services/assignmentService';
import { 
  ExternalLink, 
  Plus, 
  Globe, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  FileText, 
  X, 
  UserCheck, 
  Lock,
  Layers,
  Sparkles,
  Gamepad2,
  Play,
  KeyRound,
  BookOpen,
  HelpCircle,
  Flame,
  Award
} from 'lucide-react';

interface ExternalLinksManagerProps {
  session: UserSession;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string;
}

export const ExternalLinksManager: React.FC<ExternalLinksManagerProps> = ({
  session,
  classes,
  students,
  currentClassId,
}) => {
  const [links, setLinks] = useState<ExternalResourceLink[]>(() => getStoredExternalLinks());
  const [gradeFilter, setGradeFilter] = useState<'all' | 3 | 4 | 5>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [verifyingLink, setVerifyingLink] = useState<ExternalResourceLink | null>(null);

  // Quick game PIN launcher state
  const [pinTarget, setPinTarget] = useState<'kahoot' | 'quizizz'>('kahoot');
  const [gamePin, setGamePin] = useState('');

  const isTeacher = session.role === 'teacher';

  const filteredLinks = links.filter(l => {
    if (gradeFilter !== 'all' && l.grade !== gradeFilter) return false;
    if (platformFilter !== 'all' && l.platform !== platformFilter) return false;
    if (!isTeacher && session.classId) {
      return l.targetClassIds.includes(session.classId);
    }
    return true;
  });

  const handleSaveNewLink = (newLink: ExternalResourceLink) => {
    saveExternalLink(newLink);
    setLinks(getStoredExternalLinks());
    setIsCreateOpen(false);
  };

  const handleVerifyStudent = (linkId: string, studentId: string, score: number) => {
    verifyStudentExternalCompletion(linkId, studentId, score, session.teacherName || 'Giáo viên');
    setLinks(getStoredExternalLinks());
    if (verifyingLink && verifyingLink.id === linkId) {
      const updated = getStoredExternalLinks().find(l => l.id === linkId) || null;
      setVerifyingLink(updated);
    }
  };

  const handleQuickLaunchGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamePin.trim()) return;
    if (pinTarget === 'kahoot') {
      window.open(`https://kahoot.it/?pin=${encodeURIComponent(gamePin.trim())}`, '_blank', 'noopener,noreferrer');
    } else {
      window.open(`https://quizizz.com/join?gc=${encodeURIComponent(gamePin.trim())}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-blue-900 uppercase tracking-wider bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-blue-700" />
              CÔNG CỤ DẠY HỌC & NỀN TẢNG TƯƠNG TÁC
            </span>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
              ⚡ BeeClass • GVDM • Kahoot! • Quizizz
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
            KHO CÔNG CỤ DẠY HỌC, THI ĐẤU TRẮC NGHIỆM & LIÊN KẾT NGOÀI
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kết nối an toàn tới các nền tảng giảng dạy tương tác hàng đầu, mở phòng thi đấu trực tiếp, chia sẻ mã PIN cho học sinh và xác nhận kết quả học tập.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Grade filter */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setGradeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition ${gradeFilter === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setGradeFilter(3)}
              className={`px-2.5 py-1 rounded-md transition ${gradeFilter === 3 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 3
            </button>
            <button
              onClick={() => setGradeFilter(4)}
              className={`px-2.5 py-1 rounded-md transition ${gradeFilter === 4 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 4
            </button>
            <button
              onClick={() => setGradeFilter(5)}
              className={`px-2.5 py-1 rounded-md transition ${gradeFilter === 5 ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Khối 5
            </button>
          </div>

          {isTeacher && (
            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao bài từ công cụ mới</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top 4 Core Interactive Platform Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: BeeClass */}
        <div className="bg-white border-2 border-amber-400 hover:border-amber-500 rounded-xl p-3.5 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                🐝 BEECLASS.VN
              </span>
              <span className="text-[10px] font-bold text-amber-700">Luyện gõ tiếng Việt</span>
            </div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              Phòng Luyện Gõ & Quản Lý Bài Tập
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Kiểm tra tốc độ gõ phím 10 ngón, thống kê WPM và độ chính xác theo chuẩn GDPT 2018.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center justify-between gap-2">
            <a
              href="https://beeclass.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
            >
              <span>Vào BeeClass</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Card 2: Giáo viên Đổi mới (GVDM) */}
        <div className="bg-white border-2 border-emerald-400 hover:border-emerald-500 rounded-xl p-3.5 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full border border-emerald-300">
                🌱 GVDM.EDU.VN
              </span>
              <span className="text-[10px] font-bold text-emerald-700">STEM & Đổi mới</span>
            </div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              Giáo Viên Đổi Mới
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Kho học liệu sáng kiến kinh nghiệm, giáo án điện tử STEM Tin học và thử thách tư duy thuật toán.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex items-center justify-between gap-2">
            <a
              href="https://giaoviendoimoi.edu.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition"
            >
              <span>Vào GVDM</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Card 3: Kahoot! */}
        <div className="bg-white border-2 border-purple-500 hover:border-purple-600 rounded-xl p-3.5 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 px-2 py-0.5 rounded-full border border-purple-300 flex items-center gap-1">
                <Flame className="w-3 h-3 text-purple-600" />
                KAHOOT!
              </span>
              <span className="text-[10px] font-bold text-purple-700">Đấu trường Live</span>
            </div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              Đấu Trường Trắc Nghiệm Kahoot!
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Tạo không khí học tập sôi nổi, thi đua bấm chuông trả lời câu hỏi trắc nghiệm Tin học có bảng xếp hạng.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-purple-100 flex items-center justify-between gap-1.5">
            <a
              href="https://kahoot.it"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
            >
              <span>Chơi (Mã PIN)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {isTeacher && (
              <a
                href="https://kahoot.com"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-300 text-[11px] font-bold rounded-lg transition"
                title="Đăng nhập Giáo viên tạo đề"
              >
                Tạo đề
              </a>
            )}
          </div>
        </div>

        {/* Card 4: Quizizz */}
        <div className="bg-white border-2 border-rose-500 hover:border-rose-600 rounded-xl p-3.5 shadow-xs flex flex-col justify-between transition hover:shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-900 px-2 py-0.5 rounded-full border border-rose-300 flex items-center gap-1">
                <Gamepad2 className="w-3 h-3 text-rose-600" />
                QUIZIZZ
              </span>
              <span className="text-[10px] font-bold text-rose-700">Game hóa bài học</span>
            </div>
            <h3 className="font-bold text-slate-800 text-xs sm:text-sm">
              Trắc Nghiệm Tương Tác Quizizz
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Học sinh trả lời theo tốc độ riêng với nhạc nền, meme vui nhộn và nhận xét động viên tự động.
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-rose-100 flex items-center justify-between gap-1.5">
            <a
              href="https://quizizz.com/join"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition"
            >
              <span>Vào thi (Code)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            {isTeacher && (
              <a
                href="https://quizizz.com/admin"
                target="_blank"
                rel="noopener noreferrer"
                className="py-1.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-[11px] font-bold rounded-lg transition"
                title="Đăng nhập Giáo viên quản trị"
              >
                Quản lý
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. Quick PIN Join Bar (Cho Học Sinh & Giáo Viên kiểm tra nhanh) */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-4 shadow-md border border-blue-500/30">
        <form onSubmit={handleQuickLaunchGame} className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="p-2 bg-white/10 rounded-xl border border-white/20">
              <KeyRound className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wide flex items-center gap-1.5 text-white">
                <span>VÀO PHÒNG CHƠI NHANH BẰNG MÃ PIN / GAME CODE</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400 text-slate-900 font-extrabold">Live</span>
              </h4>
              <p className="text-[11px] text-blue-200">
                Nhập mã do thầy/cô cung cấp trên màn chiếu để tham gia tranh tài trực tiếp không cần đăng nhập.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Select Target */}
            <div className="inline-flex rounded-lg p-0.5 bg-white/10 border border-white/20 text-xs">
              <button
                type="button"
                onClick={() => setPinTarget('kahoot')}
                className={`px-3 py-1 rounded-md font-bold transition ${pinTarget === 'kahoot' ? 'bg-purple-600 text-white shadow-xs' : 'text-blue-200 hover:text-white'}`}
              >
                Kahoot!
              </button>
              <button
                type="button"
                onClick={() => setPinTarget('quizizz')}
                className={`px-3 py-1 rounded-md font-bold transition ${pinTarget === 'quizizz' ? 'bg-rose-600 text-white shadow-xs' : 'text-blue-200 hover:text-white'}`}
              >
                Quizizz
              </button>
            </div>

            {/* Input PIN */}
            <input
              type="text"
              value={gamePin}
              onChange={(e) => setGamePin(e.target.value)}
              placeholder={pinTarget === 'kahoot' ? 'Mã PIN Kahoot (VD: 458923)' : 'Mã Game Code (VD: 789123)'}
              className="bg-white/15 text-white placeholder-blue-300 text-xs px-3 py-1.5 rounded-lg border border-white/20 focus:border-cyan-300 focus:bg-white/25 outline-none w-44 sm:w-56 font-mono font-bold"
            />

            <button
              type="submit"
              className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-900 rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Tham gia ngay</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Platform Filter Pills */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-xs font-bold text-slate-500 mr-1">Bộ lọc nền tảng:</span>
          {['all', 'BeeClass', 'GiaoVienDoiMoi', 'Kahoot', 'Quizizz', 'Olm'].map((plat) => (
            <button
              key={plat}
              onClick={() => setPlatformFilter(plat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                platformFilter === plat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {plat === 'all' ? 'Tất cả' : plat === 'GiaoVienDoiMoi' ? 'Giáo viên đổi mới' : plat}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-medium shrink-0">
          Hiển thị: <span className="font-bold text-blue-700">{filteredLinks.length}</span> liên kết
        </div>
      </div>

      {/* 5. Grid of Assigned External Resource Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLinks.map((link) => {
          const completionsCount = Object.keys(link.completions || {}).length;
          const myCompletion = !isTeacher && session.studentId ? link.completions?.[session.studentId] : null;

          return (
            <div
              key={link.id}
              className="bg-white rounded-2xl border-2 border-blue-500 hover:border-blue-600 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    link.platform === 'BeeClass'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : link.platform === 'GiaoVienDoiMoi'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : link.platform === 'Kahoot'
                      ? 'bg-purple-100 text-purple-900 border border-purple-300'
                      : link.platform === 'Quizizz'
                      ? 'bg-rose-100 text-rose-900 border border-rose-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}>
                    {link.platform} • Khối {link.grade}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Hạn: {link.deadline}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mb-1">
                  {link.title}
                </h3>
                <p className="text-[11px] text-slate-600 line-clamp-3 mb-2 leading-relaxed">
                  {link.description}
                </p>

                <div className="text-[10px] text-slate-400 space-y-0.5 pt-2 border-t border-slate-100">
                  <div>Lớp được giao: <span className="font-semibold text-slate-700">{link.targetClassIds.join(', ')}</span></div>
                  {link.attachedFileName && (
                    <div className="flex items-center gap-1 text-blue-600 font-medium">
                      <Download className="w-3 h-3" />
                      <span>{link.attachedFileName} ({link.attachedFileSize})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Mở liên kết trong tab mới an toàn"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở tab mới</span>
                </a>

                {isTeacher ? (
                  <button
                    onClick={() => setVerifyingLink(link)}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Xác nhận ({completionsCount} đã xong)</span>
                  </button>
                ) : (
                  <div>
                    {myCompletion?.isCompleted ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Đã xác nhận: {myCompletion.score}đ
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-600 italic">Chưa xác nhận</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TEACHER MODAL: VERIFY STUDENT EXTERNAL COMPLETIONS */}
      {verifyingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Xác nhận kết quả học sinh trên nền tảng ngoài</h3>
                <p className="text-xs text-blue-200">{verifyingLink.title} ({verifyingLink.platform})</p>
              </div>
              <button onClick={() => setVerifyingLink(null)} className="p-1 text-white/80 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-2">Mã HS</th>
                    <th className="p-2">Họ và tên</th>
                    <th className="p-2">Lớp</th>
                    <th className="p-2">Trạng thái</th>
                    <th className="p-2">Điểm ghi nhận</th>
                    <th className="p-2">Thời gian xác nhận</th>
                    <th className="p-2 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students
                    .filter(s => verifyingLink.targetClassIds.includes(s.classId))
                    .map((st) => {
                      const comp = verifyingLink.completions[st.id];
                      return (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="p-2 font-mono text-slate-500">{st.id}</td>
                          <td className="p-2 font-bold text-slate-800">{st.name}</td>
                          <td className="p-2 font-semibold text-slate-600">{st.classId}</td>
                          <td className="p-2">
                            {comp?.isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Đã hoàn thành
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px]">
                                Chưa xác nhận
                              </span>
                            )}
                          </td>
                          <td className="p-2 font-bold text-blue-700">
                            {comp?.score ? `${comp.score}đ` : '-'}
                          </td>
                          <td className="p-2 text-[10px] text-slate-400">
                            {comp?.verifiedAt || '-'}
                          </td>
                          <td className="p-2 text-right">
                            <button
                              onClick={() => {
                                const scoreStr = prompt(`Nhập điểm ghi nhận cho ${st.name} (0-10):`, comp?.score?.toString() || '9.0');
                                if (scoreStr !== null) {
                                  const score = Number(scoreStr) || 10;
                                  handleVerifyStudent(verifyingLink.id, st.id, score);
                                }
                              }}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[10px] cursor-pointer"
                            >
                              {comp?.isCompleted ? 'Cập nhật điểm' : 'Xác nhận hoàn thành'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW LINK MODAL */}
      {isCreateOpen && (
        <CreateExternalLinkModal
          classes={classes}
          onClose={() => setIsCreateOpen(false)}
          onSave={handleSaveNewLink}
        />
      )}
    </div>
  );
};

const CreateExternalLinkModal: React.FC<{
  classes: ClassInfo[];
  onClose: () => void;
  onSave: (link: ExternalResourceLink) => void;
}> = ({ classes, onClose, onSave }) => {
  const [platform, setPlatform] = useState<ExternalResourceLink['platform']>('Kahoot');
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState<3 | 4 | 5>(4);
  const [targetClassIds, setTargetClassIds] = useState<string[]>(['4/3', '4/4']);
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2026-10-31');
  const [attachedFileName, setAttachedFileName] = useState('HuongDan_ThamGia.pdf');

  const handleSubmit = () => {
    if (!title.trim() || !url.trim()) {
      alert('Vui lòng nhập tên bài tập/thử thách và đường dẫn liên kết URL!');
      return;
    }

    const newLink: ExternalResourceLink = {
      id: `ext_${Date.now()}`,
      platform,
      title,
      grade,
      targetClassIds,
      url,
      description,
      deadline,
      attachedFileName,
      attachedFileSize: '2.4 MB',
      completions: {},
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSave(newLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border-2 border-blue-600 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-4 flex items-center justify-between">
          <h3 className="font-bold text-sm">Giao bài từ công cụ hoặc nền tảng ngoài</h3>
          <button onClick={onClose} className="p-1 text-white/80 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          <div>
            <label className="font-bold text-slate-800 block mb-1">Nền tảng / Công cụ:</label>
            <select
              value={platform}
              onChange={(e) => {
                const p = e.target.value as any;
                setPlatform(p);
                if (p === 'Kahoot' && !url) setUrl('https://kahoot.it');
                if (p === 'Quizizz' && !url) setUrl('https://quizizz.com/join');
                if (p === 'BeeClass' && !url) setUrl('https://beeclass.vn');
                if (p === 'GiaoVienDoiMoi' && !url) setUrl('https://giaoviendoimoi.edu.vn');
              }}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs"
            >
              <option value="Kahoot">Kahoot! (Đấu trường trắc nghiệm Live)</option>
              <option value="Quizizz">Quizizz (Trắc nghiệm tương tác & Meme)</option>
              <option value="BeeClass">BeeClass (Phòng thi gõ phím & bài tập)</option>
              <option value="GiaoVienDoiMoi">Giáo viên đổi mới (STEM & Tư duy)</option>
              <option value="Olm">OLM.VN (Trắc nghiệm tương tác)</option>
              <option value="Wordwall">Wordwall (Trò chơi học tập tương tác)</option>
              <option value="Liveworksheets">Liveworksheets (Phiếu bài tập tương tác)</option>
              <option value="Khac">Nền tảng giáo dục khác</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Tên bài / Thử thách tương tác:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đấu trường Kahoot Ôn tập Tin học..."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-semibold text-xs"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Đường dẫn liên kết (URL / Phòng thi):</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none font-mono text-xs text-blue-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Khối lớp:</label>
              <select
                value={grade}
                onChange={(e) => {
                  const g = Number(e.target.value) as 3 | 4 | 5;
                  setGrade(g);
                  setTargetClassIds(classes.filter(c => c.grade === g).map(c => c.id));
                }}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs"
              >
                <option value={3}>Khối 3 (Lớp 3/4, 3/5, 3/6)</option>
                <option value={4}>Khối 4 (Lớp 4/3, 4/4, 4/5)</option>
                <option value={5}>Khối 5 (Lớp 5/4, 5/5, 5/6)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">Thời hạn:</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">Mô tả và hướng dẫn học sinh:</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mã PIN, cách đăng nhập hoặc hướng dẫn thực hiện..."
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg outline-none text-xs"
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer">
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
          >
            Lưu liên kết công cụ
          </button>
        </div>
      </div>
    </div>
  );
};
