import React from 'react';
import {
  AlertTriangle,
  PauseCircle,
  Trash2,
  AlertOctagon,
  X,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { Assignment } from '../../types/database';

interface DeleteAssignmentWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  submissionsCount: number;
  onPause: (assignment: Assignment) => void;
  onMoveToTrash: (assignment: Assignment) => void;
  onForceDelete: (assignment: Assignment) => void;
}

export const DeleteAssignmentWarningModal: React.FC<DeleteAssignmentWarningModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submissionsCount,
  onPause,
  onMoveToTrash,
  onForceDelete,
}) => {
  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header cảnh báo */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-5 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-7 h-7 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-yellow-400 text-amber-950 px-2.5 py-0.5 rounded-full">
                  Cảnh Báo An Toàn Dữ Liệu
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                Xác Nhận Xóa Bài Kiểm Tra Đã Giao
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nội dung thông tin chi tiết */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Hộp thông tin bài thi và số bài đã nộp */}
          <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-900 text-base">{assignment.title}</h4>
              <span className="text-xs font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Khối {assignment.grade || 7}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-rose-800 font-bold pt-1">
              <Users className="w-4 h-4 text-rose-600" />
              <span>
                Hiện đã có <strong className="text-rose-950 text-sm">{submissionsCount} học sinh</strong> hoàn thành và nộp bài làm!
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Nếu cô xóa hẳn bài kiểm tra này, toàn bộ dữ liệu điểm số, lời phê và bài thi của{' '}
              <strong>{submissionsCount} học sinh</strong> sẽ bị gỡ bỏ khỏi bảng tổng hợp.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Cô Hảo vui lòng chọn phương án xử lý:
          </div>

          {/* 3 Lựa chọn xử lý */}
          <div className="space-y-3">
            {/* Lựa chọn 1: Tạm dừng nhận bài (Khuyên dùng) */}
            <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 transition space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                    <PauseCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-black text-emerald-950 text-sm">
                        1. Tạm Dừng Nhận Bài Mới
                      </h5>
                      <span className="text-[10px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-md flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Khuyên dùng
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                      Khóa không cho học sinh mới vào làm bài. Điểm số và lời phê của{' '}
                      <strong>{submissionsCount} học sinh đã nộp</strong> vẫn được bảo toàn nguyên vẹn 100%. Cô có thể mở lại bất kỳ lúc nào.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onPause(assignment)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <PauseCircle className="w-4 h-4" />
                Chọn Tạm Dừng Nhận Bài (Bảo Toàn Điểm)
              </button>
            </div>

            {/* Lựa chọn 2: Chuyển vào Thùng rác */}
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 transition space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-black text-amber-950 text-sm">
                    2. Chuyển Vào Thùng Rác (Lưu Tạm Thời)
                  </h5>
                  <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                    Đề thi sẽ được cất vào <strong>Thùng rác</strong>, học sinh sẽ không còn thấy bài thi này nữa. Nếu cô đổi ý hoặc lỡ tay xóa, cô có thể bấm nút <em>"Khôi phục"</em> lại nguyên trạng.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onMoveToTrash(assignment)}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Chuyển Bài Này Vào Thùng Rác
              </button>
            </div>

            {/* Lựa chọn 3: Xóa vĩnh viễn */}
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 hover:bg-rose-50/60 transition space-y-2.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold mt-0.5">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-black text-rose-950 text-sm">
                    3. Xóa Hoàn Toàn Khỏi Hệ Thống
                  </h5>
                  <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                    Xóa vĩnh viễn đề thi và giải phóng toàn bộ dữ liệu bài nộp. Hành động này không thể hoàn tác sau khi thực hiện.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onForceDelete(assignment)}
                className="w-full py-2.5 px-4 bg-slate-700 hover:bg-rose-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2"
              >
                <AlertOctagon className="w-4 h-4" />
                Vẫn Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Hệ thống bảo vệ dữ liệu điểm số của học sinh
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
