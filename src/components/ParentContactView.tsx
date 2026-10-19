import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { Student, ClassInfo } from '../types/classroom';
import { UserSession } from '../types/assignments';

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
      classId: '5/4',
      parentName: 'Phụ huynh em Bảo (Mẹ Lan)',
      phone: '0905.***.123',
      content: 'Chào thầy Tin, cháu Bảo về nhà rất hào hứng khoe bài lập trình game Scratch bắt chuột. Nhờ thầy hướng dẫn thêm cho cháu phím tắt gõ 10 ngón ạ.',
      date: '14/10/2026 09:30',
      status: 'replied',
      teacherReply: 'Chào chị Lan! Em Bảo trên lớp thao tác rất nhanh nhẹn, sáng tạo. Thầy đã giao thêm bài luyện gõ Typing Pro để em rèn luyện thêm ở nhà nhé!',
    },
    {
      id: 'msg-2',
      studentName: 'Lê Hoàng Long',
      studentCode: 'HS54-15',
      classId: '5/4',
      parentName: 'Phụ huynh em Long (Bố Hùng)',
      phone: '0913.***.456',
      content: 'Thầy cho tôi hỏi lịch thi Tin học trẻ cấp trường vào thời gian nào để gia đình động viên cháu ôn tập?',
      date: '13/10/2026 15:45',
      status: 'replied',
      teacherReply: 'Dạ anh, dự kiến vòng sơ loại cấp trường sẽ diễn ra vào tuần thứ 3 tháng 11 tại phòng máy 20 máy trạm. Thầy sẽ gửi tài liệu bồi dưỡng cho cháu Long sớm ạ.',
    },
    {
      id: 'msg-3',
      studentName: 'Nguyễn Thảo My',
      studentCode: 'HS55-08',
      classId: '5/5',
      parentName: 'Phụ huynh em My (Mẹ Hương)',
      phone: '0988.***.789',
      content: 'Nhờ thầy kiểm tra giúp kết quả bài thi trắc nghiệm phần cứng máy tính của cháu My tháng này ạ.',
      date: '12/10/2026 11:20',
      status: 'pending',
    },
  ]);

  const [newMsgContent, setNewMsgContent] = useState('');
  const [replyInput, setReplyInput] = useState<{ [id: string]: string }>({});

  const filteredMessages = messages.filter(m => selectedClass === 'all' || m.classId === selectedClass);
  const classStudents = students.filter(s => s.classId === selectedClass);

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

    const newMsg: ParentMessage = {
      id: `msg-${Date.now()}`,
      studentName: session.studentName || 'Học sinh Lớp ' + selectedClass,
      studentCode: session.studentId || 'HS54-01',
      classId: selectedClass,
      parentName: 'Phụ huynh em ' + (session.studentName || 'Bảo'),
      phone: '0905.***.999',
      content: newMsgContent.trim(),
      date: new Date().toLocaleString('vi-VN'),
      status: 'pending',
    };

    setMessages([newMsg, ...messages]);
    setNewMsgContent('');
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
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
            <h3 className="text-xs font-black text-slate-800 uppercase mb-2 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Gửi lời nhắn tới Thầy Tin</span>
            </h3>
            <form onSubmit={handleParentSendMessage} className="space-y-2.5 text-xs">
              <textarea
                required
                rows={3}
                value={newMsgContent}
                onChange={(e) => setNewMsgContent(e.target.value)}
                placeholder="Nhập nội dung trao đổi của phụ huynh về tình hình học tập môn Tin học của con..."
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 outline-none resize-none"
              />
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi lời nhắn tới giáo viên</span>
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
                    <span>Thầy Nguyễn Hữu Tin (Giáo viên Tin học):</span>
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
