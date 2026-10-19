import React from 'react';
import { 
  GraduationCap, 
  Users, 
  Monitor, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  Laptop2,
  Layers
} from 'lucide-react';
import { ClassInfo, Student } from '../types/classroom';
import { TOTAL_CLASSES, TOTAL_STUDENTS, TOTAL_COMPUTERS } from '../data/initialData';

interface StatsOverviewProps {
  currentClass: ClassInfo;
  classStudents: Student[];
  assignedCount: number;
  unassignedCount: number;
  singleStudentComputers: number;
  doubleStudentComputers: number;
  emptyComputers: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  currentClass,
  classStudents,
  assignedCount,
  unassignedCount,
  singleStudentComputers,
  doubleStudentComputers,
  emptyComputers,
}) => {
  const percentAssigned = classStudents.length > 0 
    ? Math.round((assignedCount / classStudents.length) * 100) 
    : 0;

  return (
    <div className="space-y-3">
      {/* Primary 3 Master Metric Cards required by brief: 9 lớp, 249 học sinh, 20 máy tính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: 9 Lớp */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số lớp học</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-blue-700">{TOTAL_CLASSES}</span>
                <span className="text-xs font-medium text-slate-600">Lớp (3 khối)</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center text-xs text-slate-500 gap-1.5 pt-2 border-t border-slate-100">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Khối 3: 3 lớp | Khối 4: 3 lớp | Khối 5: 3 lớp</span>
          </div>
        </div>

        {/* Card 2: 249 Học sinh */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng số học sinh</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700">{TOTAL_STUDENTS}</span>
                <span className="text-xs font-medium text-slate-600">Học sinh</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center text-xs text-slate-500 gap-1.5 pt-2 border-t border-slate-100">
            <span className="inline-block w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Mã định danh duy nhất (100% không trùng)</span>
          </div>
        </div>

        {/* Card 3: 20 Máy tính */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Phòng máy Tin học</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-cyan-700">{TOTAL_COMPUTERS}</span>
                <span className="text-xs font-medium text-slate-600">Máy tính</span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 border border-cyan-100">
              <Monitor className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center text-xs text-slate-500 gap-1.5 pt-2 border-t border-slate-100">
            <span className="inline-block w-2 h-2 rounded-full bg-cyan-500"></span>
            <span>Tối đa 2 HS/máy (Sức chứa 40 HS/tiết)</span>
          </div>
        </div>

        {/* Card 4: Sĩ số lớp hiện tại & tình trạng xếp chỗ */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                Đang quản lý: {currentClass.name}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-white">{currentClass.totalStudents}</span>
                <span className="text-xs text-slate-300">học sinh</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          {/* Quick Progress Bar */}
          <div className="mt-2.5">
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Đã có máy: <strong className="text-emerald-400">{assignedCount}/{classStudents.length}</strong></span>
              <span className="font-semibold text-cyan-300">{percentAssigned}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  assignedCount === classStudents.length ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${percentAssigned}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Lab Seating breakdown sub-bar */}
      <div className="bg-white rounded-lg px-4 py-2.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-slate-600">
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Laptop2 className="w-4 h-4 text-indigo-600" />
            Phân bổ phòng máy tiết này:
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block"></span>
            Máy ngồi 1 HS: <strong className="text-slate-900">{singleStudentComputers}</strong> máy
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500 inline-block"></span>
            Máy ngồi đôi (2 HS): <strong className="text-slate-900">{doubleStudentComputers}</strong> máy
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300 inline-block"></span>
            Máy còn trống: <strong className="text-slate-900">{emptyComputers}</strong> máy
          </span>
        </div>

        <div className="flex items-center gap-3">
          {unassignedCount > 0 ? (
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-medium">
              <UserX className="w-3.5 h-3.5 text-amber-600" />
              Còn <strong>{unassignedCount}</strong> học sinh chưa xếp máy
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              100% học sinh đã có chỗ ngồi!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
