export interface LearningPhoto {
  id: string;
  title: string;
  category: 'thuc_hanh' | 'scratch' | 'nhom' | 'hoi_thi' | 'ngoai_khoa';
  grade: 3 | 4 | 5;
  classId: string; // e.g. '5/4'
  imageUrl: string;
  mediaType?: 'image' | 'video';
  videoUrl?: string;
  date: string;
  description: string;
  tags: string[];
  likes: number;
}

export const INITIAL_LEARNING_PHOTOS: LearningPhoto[] = [
  {
    id: 'photo-01',
    title: 'Học sinh Lớp 5/4 hào hứng trong giờ thực hành Lập trình Scratch 3.0',
    category: 'scratch',
    grade: 5,
    classId: '5/4',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1200&auto=format&fit=crop',
    date: '14/10/2026',
    description: 'Các em học sinh chăm chú ghép các khối lệnh chuyển động và âm thanh để lập trình game tương tác đầu tay.',
    tags: ['Scratch 3.0', 'Lớp 5/4', 'Lập trình nhí', 'Phòng máy 20 máy'],
    likes: 42,
  },
  {
    id: 'photo-02',
    title: 'Cô Nguyễn Thị Huệ hướng dẫn học sinh thao tác phím và bài tập soạn thảo văn bản',
    category: 'thuc_hanh',
    grade: 4,
    classId: '4/3',
    imageUrl: 'https://i.ibb.co/Q3YM47RF/c262267f-4f7d-4151-b6a8-3fa00211fa09.png',
    date: '16/10/2026',
    description: 'Cô Nguyễn Thị Huệ tận tình chỉ dẫn từng bạn học sinh Lớp 4/3 cách đặt tay trên bàn phím, gõ tiếng Việt có dấu và soạn thảo văn bản chuẩn.',
    tags: ['Cô Nguyễn Thị Huệ', 'Lớp 4/3', 'Soạn thảo văn bản', 'Thực hành máy', 'TH Đồng Dương'],
    likes: 68,
  },
  {
    id: 'video-01',
    title: 'Video ghi lại giờ học thực hành phòng máy 20 máy trạm – Tiết học môn Tin học',
    category: 'thuc_hanh',
    grade: 5,
    classId: '5/4',
    mediaType: 'video',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    date: '18/10/2026',
    description: 'Video ngắn ghi lại không khí học tập tích cực, kỷ luật và trật tự của các em học sinh khi thực hành đôi trên 20 máy tính trạm.',
    tags: ['Video giờ học', 'Phòng máy 20 máy', 'Thực hành Tin học', 'Lớp 5/4'],
    likes: 58,
  },
  {
    id: 'photo-03',
    title: 'Mô hình học tập 2 học sinh/máy – Tinh thần làm việc nhóm và hỗ trợ bạn bè',
    category: 'nhom',
    grade: 5,
    classId: '5/6',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?q=80&w=1200&auto=format&fit=crop',
    date: '10/10/2026',
    description: 'Hai bạn học sinh Chỗ A và Chỗ B tại Máy 08 cùng nhau thảo luận, phối hợp thiết kế bài trình chiếu PowerPoint về Thế giới loài vật.',
    tags: ['Làm việc nhóm', 'Lớp 5/6', 'Hỗ trợ bạn', 'Máy 08'],
    likes: 56,
  },
  {
    id: 'photo-04',
    title: 'Đội tuyển Tin học trẻ của trường chuẩn bị cho Hội thi Tin học cấp Thành phố',
    category: 'hoi_thi',
    grade: 5,
    classId: '5/4',
    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    date: '05/10/2026',
    description: 'Các bạn học sinh tiêu biểu khối 5 rèn luyện thuật toán tư duy logic và kỹ năng giải quyết vấn đề trên máy tính.',
    tags: ['Tin học trẻ', 'Tài năng nhí', 'Khối 5', 'Tư duy logic'],
    likes: 67,
  },
  {
    id: 'photo-05',
    title: 'Giờ học Vẽ tranh trên máy tính – Khơi dậy sáng tạo nghệ thuật số',
    category: 'thuc_hanh',
    grade: 3,
    classId: '3/4',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1200&auto=format&fit=crop',
    date: '02/10/2026',
    description: 'Học sinh khối 3 tự tin sử dụng bảng màu và cọ vẽ kỹ thuật số để tạo nên những bức tranh ngôi trường thân yêu.',
    tags: ['Hội họa số', 'Paint', 'Lớp 3/4', 'Sáng tạo'],
    likes: 35,
  },
  {
    id: 'photo-06',
    title: 'Luyện gõ bàn phím 10 ngón với phần mềm Typing Master',
    category: 'thuc_hanh',
    grade: 4,
    classId: '4/3',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
    date: '28/09/2026',
    description: 'Không khí thi đua sôi nổi tại phòng máy 20 trạm, học sinh đạt tốc độ gõ trên 30 từ/phút với tỷ lệ chính xác 98%.',
    tags: ['Typing', 'Lớp 4/3', 'Gõ 10 ngón', 'Thi đua'],
    likes: 49,
  },
];
