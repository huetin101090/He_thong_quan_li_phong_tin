import React from 'react';
import { Printer, X, Monitor } from 'lucide-react';
import { ClassAssignments, ClassInfo, Student } from '../types/classroom';
import { SCHOOL_NAME, TOTAL_COMPUTERS } from '../data/initialData';

interface PrintViewProps {
  isOpen: boolean;
  onClose: () => void;
  currentClass: ClassInfo;
  assignments: ClassAssignments;
  studentMap: Map<string, Student>;
  date: string;
  session: 'morning' | 'afternoon';
  periodNumber: number;
  lessonName: string;
}

export const PrintView: React.FC<PrintViewProps> = ({
  isOpen,
  onClose,
  currentClass,
  assignments,
  studentMap,
  date,
  session,
  periodNumber,
  lessonName,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-300 overflow-hidden my-6">
        {/* Modal Top Control Bar (Hidden during actual window.print()) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
          <span className="text-sm font-bold flex items-center gap-2">
            <Printer className="w-4 h-4 text-cyan-400" />
            Xem trước bản in sơ đồ phòng máy Tin học (20 máy)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In ngay / Xuất PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet */}
        <div className="p-8 bg-white text-slate-900 space-y-6 print:p-0">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start text-xs">
            <div>
              <p className="font-semibold uppercase tracking-wider text-slate-600">Phòng GD&ĐT Huyện</p>
              <h2 className="font-extrabold text-base uppercase text-blue-900">{SCHOOL_NAME}</h2>
              <p className="text-slate-500">Phòng thực hành Tin học Tiểu học (20 Máy)</p>
            </div>
            <div className="text-right">
              <p className="font-semibold uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="italic text-slate-600">Độc lập - Tự do - Hạnh phúc</p>
              <p className="text-[11px] text-slate-500 mt-1">Ngày {date.split('-').reverse().join('/')}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-lg font-black uppercase tracking-wide text-slate-900">
              SƠ ĐỒ PHÂN CÔNG CHỖ NGỒI PHÒNG MÁY TÍNH
            </h1>
            <p className="text-xs font-semibold text-blue-800">
              {currentClass.name} • Sĩ số: {currentClass.totalStudents} học sinh • {session === 'morning' ? 'Buổi Sáng' : 'Buổi Chiều'} - Tiết {periodNumber}
            </p>
            {lessonName && (
              <p className="text-xs italic text-slate-600">
                Bài học: {lessonName}
              </p>
            )}
          </div>

          {/* Teacher Desk & Screen Indicator */}
          <div className="bg-slate-100 border border-slate-300 rounded-lg py-1.5 text-center text-xs font-bold uppercase tracking-wider text-slate-700">
            [ BẢNG TƯƠNG TÁC THÔNG MINH & BÀN GIÁO VIÊN ]
          </div>

          {/* 20 Computer Boxes (4 rows x 5 columns) */}
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
            {Array.from({ length: TOTAL_COMPUTERS }, (_, i) => i + 1).map((compId) => {
              const comp = assignments[compId] || { studentAId: null, studentBId: null };
              const studentA = comp.studentAId ? studentMap.get(comp.studentAId) : null;
              const studentB = comp.studentBId ? studentMap.get(comp.studentBId) : null;

              return (
                <div key={compId} className="border border-slate-300 rounded-md p-2 bg-slate-50/50 text-[10px] space-y-1">
                  <div className="font-black text-slate-800 border-b border-slate-200 pb-0.5 flex justify-between">
                    <span>MÁY {compId < 10 ? `0${compId}` : compId}</span>
                    <span className="text-slate-400 font-normal">
                      {studentA && studentB ? '2 HS' : studentA ? '1 HS' : 'Trống'}
                    </span>
                  </div>

                  {/* Slot A */}
                  <div className="pt-0.5">
                    <span className="font-bold text-indigo-700">A: </span>
                    {studentA ? (
                      <span className="font-medium text-slate-900">
                        {studentA.name} <span className="text-slate-400">({studentA.code})</span>
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Trống</span>
                    )}
                  </div>

                  {/* Slot B */}
                  <div>
                    <span className="font-bold text-purple-700">B: </span>
                    {studentB ? (
                      <span className="font-medium text-slate-900">
                        {studentB.name} <span className="text-slate-400">({studentB.code})</span>
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Trống</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signature Footer */}
          <div className="pt-8 flex justify-between text-xs text-center">
            <div className="space-y-12">
              <div>
                <p className="font-bold uppercase">Giáo viên chủ nhiệm</p>
                <p className="text-[11px] text-slate-500">{currentClass.homeroomTeacher}</p>
              </div>
              <p className="italic text-slate-400">(Ký và ghi rõ họ tên)</p>
            </div>

            <div className="space-y-12">
              <div>
                <p className="font-bold uppercase">Giáo viên Tin học</p>
                <p className="text-[11px] text-slate-500">{currentClass.ictTeacher}</p>
              </div>
              <p className="italic text-slate-400">(Ký và ghi rõ họ tên)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
