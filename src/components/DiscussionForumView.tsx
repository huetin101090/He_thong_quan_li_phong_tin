import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  ThumbsUp, 
  MessageCircle, 
  Sparkles, 
  HelpCircle, 
  Code2, 
  User, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { UserSession } from '../types/assignments';

interface DiscussionForumViewProps {
  session: UserSession;
  currentClassId: string;
}

interface ForumPost {
  id: string;
  authorName: string;
  role: 'teacher' | 'student';
  classId: string;
  title: string;
  content: string;
  date: string;
  likes: number;
  commentsCount: number;
  replies: {
    id: string;
    authorName: string;
    role: 'teacher' | 'student';
    content: string;
    date: string;
  }[];
}

export const DiscussionForumView: React.FC<DiscussionForumViewProps> = ({
  session,
  currentClassId,
}) => {
  const [posts, setPosts] = useState<ForumPost[]>([
    {
      id: 'post-1',
      authorName: 'Trần Gia Bảo',
      role: 'student',
      classId: '5/4',
      title: 'Làm sao để nhân vật Mèo trong Scratch xoay mặt sang trái mà không bị lộn ngược đầu ạ?',
      content: 'Thầy và các bạn ơi, khi em dùng lệnh "hướng về phía -90 độ" thì chú mèo bị lộn ngược đầu xuống dưới. Làm cách nào để mèo chỉ quay mặt trái phải bình thường ạ?',
      date: 'Hôm nay, 08:45',
      likes: 12,
      commentsCount: 2,
      replies: [
        {
          id: 'rep-1',
          authorName: 'Cô Nguyễn Thị Huệ',
          role: 'teacher',
          content: 'Chào Bảo! Trong Scratch có lệnh "đặt kiểu xoay [trái-phải]". Em ghép lệnh này vào ngay dưới cờ xanh là chú mèo sẽ không bị lộn ngược đầu nữa nhé!',
          date: 'Hôm nay, 08:50',
        },
        {
          id: 'rep-2',
          authorName: 'Lê Hoàng Long (5/4)',
          role: 'student',
          content: 'Hoặc bạn bấm vào phần Hướng ở góc phải sân khấu, chọn biểu tượng 2 mũi tên đối nhau là được á Bảo!',
          date: 'Hôm nay, 09:05',
        },
      ],
    },
    {
      id: 'post-2',
      authorName: 'Nguyễn Thảo My',
      role: 'student',
      classId: '5/5',
      title: 'Phím tắt nào để gõ dấu mũ chữ Â, Ê, Ô nhanh nhất trong Unikey?',
      content: 'Em đang tập gõ 10 ngón bài thơ Hạt gạo làng ta, các bạn chỉ em cách gõ kiểu Telex nhanh với ạ.',
      date: 'Hôm qua, 14:20',
      likes: 8,
      commentsCount: 1,
      replies: [
        {
          id: 'rep-3',
          authorName: 'Cô Nguyễn Thị Huệ',
          role: 'teacher',
          content: 'Theo kiểu gõ Telex: Gõ đúp aa -> â, ee -> ê, oo -> ô, dd -> đ. Em rèn luyện trên phần mềm Typing Pro sẽ tạo phản xạ tự nhiên rất nhanh nhé.',
          date: 'Hôm qua, 14:35',
        },
      ],
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [replyText, setReplyText] = useState<{ [postId: string]: string }>({});

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const newPost: ForumPost = {
      id: `post-${Date.now()}`,
      authorName: session.studentName || session.teacherName || 'Thành viên lớp',
      role: session.role,
      classId: session.classId || currentClassId,
      title: newTitle.trim(),
      content: newContent.trim(),
      date: 'Vừa xong',
      likes: 0,
      commentsCount: 0,
      replies: [],
    };

    setPosts([newPost, ...posts]);
    setNewTitle('');
    setNewContent('');
  };

  const handleAddReply = (postId: string) => {
    const text = replyText[postId];
    if (!text?.trim()) return;

    const reply = {
      id: `rep-${Date.now()}`,
      authorName: session.studentName || session.teacherName || 'Thành viên',
      role: session.role,
      content: text.trim(),
      date: 'Vừa xong',
    };

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          commentsCount: p.commentsCount + 1,
          replies: [...p.replies, reply],
        };
      }
      return p;
    }));

    setReplyText(prev => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-sm">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-blue-950 uppercase tracking-tight">
              GÓC TRAO ĐỔI & HỎI ĐÁP TIN HỌC TIỂU HỌC
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Không gian thảo luận sôi nổi: Đặt câu hỏi về Scratch, thủ thuật Word, PowerPoint và cùng giải đáp bài tập
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Create new question */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs sticky top-20">
            <h3 className="text-xs font-black text-slate-900 uppercase mb-3 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Đặt câu hỏi hoặc thảo luận mới</span>
            </h3>

            <form onSubmit={handleCreatePost} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tiêu đề thắc mắc *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Làm sao để chèn âm thanh vào Scratch?..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung chi tiết *</label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Mô tả cụ thể vấn đề em gặp phải khi thực hành máy tính..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Đăng câu hỏi lên diễn đàn</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Forum Posts */}
        <div className="lg:col-span-2 space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
              {/* Post Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${
                    post.role === 'teacher' ? 'bg-blue-600 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {post.role === 'teacher' ? 'GV' : 'HS'}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      {post.authorName}
                      {post.classId && <span className="text-[10px] text-blue-600 font-bold ml-1.5">(Lớp {post.classId})</span>}
                    </div>
                    <div className="text-[10px] text-slate-400">{post.date}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-slate-500 text-xs font-bold">
                  <ThumbsUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>{post.likes}</span>
                </div>
              </div>

              {/* Title & Body */}
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  {post.title}
                </h4>
                <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                  {post.content}
                </p>
              </div>

              {/* Replies */}
              {post.replies.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100 pl-4 border-l-2 border-blue-200 ml-2">
                  {post.replies.map((rep) => (
                    <div key={rep.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-black text-[11px] ${rep.role === 'teacher' ? 'text-blue-800' : 'text-slate-800'}`}>
                          {rep.authorName} {rep.role === 'teacher' && '⭐'}
                        </span>
                        <span className="text-[10px] text-slate-400">{rep.date}</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">
                        {rep.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Reply */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={replyText[post.id] || ''}
                  onChange={(e) => setReplyText({ ...replyText, [post.id]: e.target.value })}
                  placeholder="Gửi câu trả lời hoặc gợi ý của bạn..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs outline-none focus:border-blue-500"
                />
                <button
                  onClick={() => handleAddReply(post.id)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Gửi</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
