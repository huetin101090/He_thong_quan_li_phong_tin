import React, { useState, useMemo } from 'react';
import { 
  HeartHandshake, 
  Send, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  MessageCircle, 
  Bell, 
  Search,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { Student, ClassInfo } from '../types/classroom';
import { UserSession } from '../types/assignments';
import { isSameClass } from '../data/initialData';

interface ParentContactViewProps {
  session: UserSession;
  classes: ClassInfo[];
  students: Student[];
  currentClassId: string;
}

interface ParentMessage {
  id: string;
  studentName: string;
  studentCode: string;
  classId: string;
  parentName: string;
  phone: string;
  content: string;
  date: string;
  status: 'replied' | 'pending';
  teacherReply?: string;
}

export const ParentContactView: React.FC<ParentContactViewProps> = ({
  session,
  classes,
  students,
  currentClassId,
}) => {
  const [selectedClass, setSelectedClass] = useState<string>(currentClassId || '5/4');
  const [messages, setMessages] = useState<ParentMessage[]>([
    {
      id: 'msg-1',
      studentName: 'Trần Gia Bảo',
      studentCode: 'HS54-01',
      classId: '5.4',
      parentName: 'Phụ huynh em Bảo (Mẹ Lan)',
      phone: '0905.***.123',
      content: 'Chào cô Huệ, cháu Bảo về nhà rất hào hứng khoe bài lập trình game Scratch bắt chuột. Nhờ cô hướng dẫn thêm cho cháu phím tắt gõ 10 ngón ạ.',
      date: '14/10/2026 09:30',
      status: 'replied',
      teacherReply: 'Chào chị Lan! Em Bảo trên lớp thao tác rất nhanh nhẹn, sáng tạo. Cô đã giao thêm bài luyện gõ Typing Pro để em rèn luyện thêm ở nhà nhé!',
    },
    {
      id: 'msg-2',
      studentName: 'Lê Hoàng Long',
      studentCode: 'HS54-15',
      classId: '5.4',
      parentName: 'Phụ huynh em Long (Bố Hùng)',
      phone: '0913.***.456',
      content: 'Cô Huệ cho tôi hỏi lịch thi Tin học trẻ cấp trường vào thời gian nào để gia đình động viên cháu ôn tập?',
      date: '13/10/2026 15:45',
      status: 'replied',
      teacherReply: 'Dạ anh, dự kiến vòng sơ loại cấp trường sẽ diễn ra vào tuần thứ 3 tháng 11 tại phòng máy 20 máy trạm. Cô sẽ gửi tài liệu bồi dưỡng cho cháu Long sớm ạ.',
    },
    {
      id: 'msg-3',
      studentName: 'Nguyễn Thảo My',
      studentCode: 'HS55-08',
      classId: '5.5',
      parentName: 'Phụ huynh em My (Mẹ Hương)',
      phone: '0988.***.789',
      content: 'Nhờ cô Huệ kiểm tra giúp kết quả bài thi trắc nghiệm phần cứng máy tính của cháu My tháng này ạ.',
      date: '12/10/2026 11:20',
      status: 'pending',
    },
  ]);

  // Load messages from Supabase API on mount
  React.useEffect(() => {
    fetch('/api/parent-messages')
      .then(res => res.json())
      .then(data => {
        if (data && data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          const remoteMsgs: ParentMessage[] = data.messages.map((m: any, idx: number) => ({
            id: m.id || `msg-sb-${idx}`,
            studentName: m.studentName || 'Học sinh',
            studentCode: m.studentCode || 'HS',
            classId: m.classId || 'all',
            parentName: m.parentName || 'Phụ huynh',
            phone: '0905.***.***',
            content: m.content || '',
            date: m.date || 'Hôm nay',
            status: m.teacherReply ? 'replied' : 'pending',
            teacherReply: m.teacherReply,
          }));
          setMessages(prev => {
            const combined = [...remoteMsgs];
            prev.forEach(p => {
              if (!combined.some(c => c.id === p.id)) {
                combined.push(p);
              }
            });
            return combined;
          });
        }
      })
      .catch(() => {});
  }, []);

  const [newMsgContent, setNewMsgContent] = useState('');
  const [replyInput, setReplyInput] = useState<{ [id: string]: string }>({});

  // Form compose state with explicit student selection
  const [formClassId, setFormClassId] = useState<string>(selectedClass !== 'all' ? selectedClass : '5.4');
  const [selectedStudentCode, setSelectedStudentCode] = useState<string>('');
  const [parentSenderName, setParentSenderName] = useState<string>('');
  const [parentPhone, setParentPhone] = useState<string>('');

  // Synchronize formClassId when class filter changes
  React.useEffect(() => {
    if (selectedClass && selectedClass !== 'all') {
      setFormClassId(selectedClass);
      setSelectedStudentCode('');
    }
  }, [selectedClass]);

  const filteredMessages = messages.filter(m => selectedClass === 'all' || m.classId === 'all' || isSameClass(m.classId, selectedClass));
  const classStudents = students.filter(s => isSameClass(s.classId, selectedClass));

  // Available students for the dropdown
  const formAvailableStudents = useMemo(() => {
    return students.filter(s => isSameClass(s.classId, formClassId));
  }, [students, formClassId]);

  const handleSelectStudent = (stCode: string) => {
    setSelectedStudentCode(stCode);
    const targetStudent = students.find(s => s.code === stCode || s.id === stCode);
    if (targetStudent && !parentSenderName.trim()) {
      setParentSenderName(`Phụ huynh em ${targetStudent.name}`);
    }
  };

  const handleSendReply = (msgId: string) => {
    const text = replyInput[msgId];
    if (!text?.trim()) return;

    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          status: 'replied',
          teacherReply: text.trim(),
        };
      }
      return m;
    }));

    setReplyInput(prev => ({ ...prev, [msgId]: '' }));
  };

  const handleParentSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgContent.trim()) return;

    if (!selectedStudentCode) {
      alert('Vui lòng chọn học sinh của phụ huynh từ danh sách trước khi gửi lời nhắn!');
      return;
    }

    const targetStudent = students.find(s => s.code === selectedStudentCode || s.id === selectedStudentCode);
    const studentName = targetStudent?.name || 'Học sinh';
    const studentCode = targetStudent?.code || selectedStudentCode;
    const finalClassId = targetStudent?.classId || formClassId;
    const parentName = parentSenderName.trim() || `Phụ huynh em ${studentName}`;

    const newMsg: ParentMessage = {
      id: `msg-${Date.now()}`,
      studentName,
      studentCode,
      classId: finalClassId,
      parentName,
      phone: parentPhone.trim() || '0905.***.***',
      content: newMsgContent.trim(),
      date: new Date().toLocaleString('vi-VN'),
      status: 'pending',
    };

    setMessages(prev => [newMsg, ...prev]);
    setNewMsgContent('');
    setParentSenderName('');
    setSelectedStudentCode('');
    setParentPhone('');

    // Persist to Supabase parent_messages table
    fetch('/api/parent-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentName,
        studentName,
        content: newMsg.content,
        date: new Date().toLocaleDateString('vi-VN'),
      }),
    }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-blue-950 uppercase tracking-tight">
              BAN LIÊN LẠC PHỤ HUYNH & SỔ LIÊN LẠC SỐ
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Cầu nối tương tác giữa Giáo viên Tin học và Phụ huynh: Theo dõi tiến độ học tập, kết quả phòng máy và gửi phản hồi
            </p>
          </div>
        </div>

        {/* Class Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Lớp:</span>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
          >
            <option value="all">Tất cả các lớp</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name} ({c.totalStudents} HS)</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Quick Stats & Send message box */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Notice Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-blue-900 font-black text-xs uppercase">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>THÔNG BÁO TỪ BỘ MÔN TIN HỌC</span>
            </div>
            <ul className="text-xs text-slate-700 space-y-2 list-disc list-inside">
              <li>Lịch thực hành phòng máy: 100% học sinh được rèn luyện trực tiếp trên 20 máy trạm.</li>
              <li>Học sinh được cấp tài khoản rèn luyện Scratch và bài tập lý thuyết tại nhà.</li>
              <li>Phụ huynh có thể gửi phản hồi trực tiếp qua khung tin nhắn bên dưới.</li>
            </ul>
          </div>

          {/* Form to send message for Parents */}
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm space-y-3">
            <div>
              <h3 className="text-xs font-black text-blue-950 uppercase flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                <span>Gửi lời nhắn tới Cô Nguyễn Thị Huệ</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Phụ huynh chọn học sinh và gửi câu hỏi, trao đổi về tình hình học môn Tin học tại phòng máy 20 máy trạm
              </p>
            </div>

            <form onSubmit={handleParentSendMessage} className="space-y-2.5 text-xs">
              {/* 1. Chọn Lớp học */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">1. Lớp học của con: *</label>
                <select
                  value={formClassId}
                  onChange={(e) => {
                    setFormClassId(e.target.value);
                    setSelectedStudentCode('');
                  }}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white focus:border-blue-500 outline-none"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.totalStudents} HS)</option>
                  ))}
                </select>
              </div>

              {/* 2. Chọn học sinh cụ thể (249 học sinh thật) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">2. Chọn học sinh (Con em phụ huynh): *</label>
                <select
                  required
                  value={selectedStudentCode}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border-2 border-blue-400 bg-blue-50/50 font-bold text-slate-900 focus:border-blue-600 outline-none"
                >
                  <option value="">-- Nhấp để chọn học sinh trong Lớp {formClassId} --</option>
                  {formAvailableStudents.map(st => (
                    <option key={st.id} value={st.code}>
                      [{st.code}] {st.name} {st.assignedPcId ? `(Máy PC${st.assignedPcId < 10 ? '0' + st.assignedPcId : st.assignedPcId})` : ''}
                    </option>
                  ))}
                </select>
                {selectedStudentCode && (
                  <p className="text-[10px] text-blue-700 font-semibold mt-1">
                    ✓ Đã chọn học sinh: {formAvailableStudents.find(s => s.code === selectedStudentCode)?.name} ({selectedStudentCode})
                  </p>
                )}
              </div>

              {/* 3. Tên người gửi & Số điện thoại */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">3. Tên phụ huynh: *</label>
                  <input
                    type="text"
                    required
                    value={parentSenderName}
                    onChange={(e) => setParentSenderName(e.target.value)}
                    placeholder="Bố Hùng, Mẹ Lan..."
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">4. Số ĐT (tùy chọn):</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="0905.***.***"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* 5. Nội dung trao đổi */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">5. Nội dung lời nhắn gửi tới Cô Huệ: *</label>
                <textarea
                  required
                  rows={3}
                  value={newMsgContent}
                  onChange={(e) => setNewMsgContent(e.target.value)}
                  placeholder="Nhập câu hỏi, phản hồi về tình hình học tập môn Tin học của con..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi lời nhắn tới Cô Huệ</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Messages List */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1">
            <span>Danh sách trao đổi ({filteredMessages.length} phản hồi)</span>
            <span className="text-[11px] text-slate-400">Đã cập nhật hôm nay</span>
          </div>

          {filteredMessages.map((msg) => (
            <div key={msg.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    PH
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      {msg.parentName}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      HS: <strong className="text-slate-800">{msg.studentName}</strong> ({msg.studentCode}) • Lớp {msg.classId}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    msg.status === 'replied' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {msg.status === 'replied' ? '✓ Đã phản hồi' : '⏳ Chờ phản hồi'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5">{msg.date}</div>
                </div>
              </div>

              {/* Message content */}
              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                "{msg.content}"
              </div>

              {/* Teacher Reply */}
              {msg.teacherReply && (
                <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-blue-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cô Nguyễn Thị Huệ (Giáo viên Tin học):</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-5">
                    {msg.teacherReply}
                  </p>
                </div>
              )}

              {/* Reply Input for Teacher */}
              {session.role === 'teacher' && msg.status === 'pending' && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    value={replyInput[msg.id] || ''}
                    onChange={(e) => setReplyInput({ ...replyInput, [msg.id]: e.target.value })}
                    placeholder="Nhập câu trả lời của thầy cô..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSendReply(msg.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Trả lời</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
