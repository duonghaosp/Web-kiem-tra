import React from 'react';
import {
  Trash2,
  RotateCcw,
  AlertOctagon,
  X,
  Clock,
  BookOpen,
  Calendar,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import { Assignment } from '../../types/database';

interface AssignmentTrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashAssignments: Assignment[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

export const AssignmentTrashModal: React.FC<AssignmentTrashModalProps> = ({
  isOpen,
  onClose,
  trashAssignments,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header Thùng rác */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                  Lưu Trữ Tạm Thời
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {trashAssignments.length} bài kiểm tra
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-0.5">
                Thùng Rác Bài Kiểm Tra Đã Xóa
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trashAssignments.length > 0 && (
              <button
                type="button"
                onClick={onEmptyTrash}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <AlertOctagon className="w-3.5 h-3.5" /> Dọn sạch
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung danh sách trong thùng rác */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {trashAssignments.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Inbox className="w-8 h-8" />
              </div>
              <div className="font-black text-slate-800 text-base">
                Thùng rác hiện đang trống!
              </div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Khi cô xóa bất kỳ bài kiểm tra nào, đề thi sẽ được lưu tạm tại đây để cô có thể khôi phục lại bất kỳ lúc nào nếu cần.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {trashAssignments.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold bg-ocean-100 text-ocean-800 px-2.5 py-0.5 rounded-md">
                        Khối {item.grade || 7}
                      </span>
                      <span className="text-[10px] font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                        {item.category || 'Kiểm tra'}
                      </span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {item.duration_minutes || 15} phút
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        • {item.questions_count || 10} câu hỏi
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                      {item.title}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>Lớp: <strong>{item.target_ids?.join(', ') || 'Tất cả'}</strong></span>
                      {item.deleted_at && (
                        <span>
                          • Đã xóa lúc:{' '}
                          <strong className="text-rose-700">
                            {new Date(item.deleted_at).toLocaleString('vi-VN')}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nút Khôi phục & Xóa vĩnh viễn */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onRestore(item.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Khôi Phục
                    </button>
                    <button
                      type="button"
                      onClick={() => onPermanentDelete(item.id)}
                      className="p-2 text-rose-600 hover:bg-rose-100/80 active:scale-95 rounded-xl transition cursor-pointer"
                      title="Xóa vĩnh viễn khỏi hệ thống"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Đề thi khôi phục sẽ xuất hiện lại ngay lập tức trên màn hình của học sinh.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Đóng Thùng Rác
          </button>
        </div>
      </div>
    </div>
  );
};
