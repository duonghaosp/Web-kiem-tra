import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Copy,
  Check,
  AlertCircle,
  FileSpreadsheet,
  Award,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { Assignment, Profile } from '../../types/database';

interface SubmissionStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  students: Profile[];
  studentSubmissions: any[];
}

export const SubmissionStatusModal: React.FC<SubmissionStatusModalProps> = ({
  isOpen,
  onClose,
  assignment,
  students,
  studentSubmissions,
}) => {
  if (!isOpen || !assignment) return null;

  const [activeTab, setActiveTab] = useState<'all' | 'submitted' | 'unsubmitted'>('all');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [copiedZalo, setCopiedZalo] = useState<boolean>(false);

  // Danh sách các lớp được giao bài này
  const targetClasses = useMemo(() => assignment.target_ids || [], [assignment]);

  // Toàn bộ học sinh thuộc các lớp được giao
  const assignedStudents = useMemo(() => {
    return students.filter((s) => Boolean(s.class_name && targetClasses.includes(s.class_name)));
  }, [students, targetClasses]);

  // Phân tích trạng thái từng học sinh (Đã nộp / Chưa nộp)
  const studentStatusList = useMemo(() => {
    return assignedStudents.map((stu) => {
      // Tìm bài nộp của học sinh này
      const sub = studentSubmissions.find(
        (s: any) =>
          String(s.assignment_id) === String(assignment.id) &&
          (s.student_code === stu.student_code ||
            (s.student_name && stu.full_name && s.student_name.trim().toLowerCase() === stu.full_name.trim().toLowerCase()))
      );

      return {
        student: stu,
        isSubmitted: Boolean(sub),
        submission: sub || null,
      };
    });
  }, [assignedStudents, studentSubmissions, assignment]);

  // Thống kê số lượng
  const stats = useMemo(() => {
    const total = studentStatusList.length;
    const submitted = studentStatusList.filter((item) => item.isSubmitted).length;
    const unsubmitted = total - submitted;
    const percent = total > 0 ? Math.round((submitted / total) * 100) : 0;

    return { total, submitted, unsubmitted, percent };
  }, [studentStatusList]);

  // Lọc theo Tab, Lớp, và Từ khóa tìm kiếm
  const filteredList = useMemo(() => {
    return studentStatusList.filter((item) => {
      // 1. Lọc theo tab
      if (activeTab === 'submitted' && !item.isSubmitted) return false;
      if (activeTab === 'unsubmitted' && item.isSubmitted) return false;

      // 2. Lọc theo lớp
      if (selectedClassFilter !== 'all' && item.student.class_name !== selectedClassFilter) {
        return false;
      }

      // 3. Tìm kiếm theo tên hoặc mã HS
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const name = (item.student.full_name || '').toLowerCase();
        const code = (item.student.student_code || '').toLowerCase();
        return name.includes(term) || code.includes(term);
      }

      return true;
    });
  }, [studentStatusList, activeTab, selectedClassFilter, searchTerm]);

  // Sao chép danh sách học sinh chưa nộp bài để cô gửi vào nhóm Zalo
  const handleCopyUnsubmittedZalo = () => {
    const unsubmittedList = studentStatusList.filter((item) => !item.isSubmitted);

    if (unsubmittedList.length === 0) {
      alert('Tuyệt vời cô ơi! Toàn bộ 100% học sinh các lớp đã hoàn thành nộp bài!');
      return;
    }

    // Nhóm theo lớp
    const byClass: Record<string, string[]> = {};
    unsubmittedList.forEach((item) => {
      const cls = item.student.class_name || 'Khác';
      if (!byClass[cls]) byClass[cls] = [];
      byClass[cls].push(item.student.full_name);
    });

    let text = `📢 THÔNG BÁO NHẮC NHỞ LÀM BÀI KIỂM TRA ĐỊA LÍ\n`;
    text += `📝 Đề: ${assignment.title}\n`;
    if (assignment.deadline) {
      text += `⏰ Hạn chót: ${new Date(assignment.deadline).toLocaleString('vi-VN')}\n`;
    }
    text += `------------------------------------\n`;
    text += `Hiện còn ${unsubmittedList.length} em chưa nộp bài làm. Danh sách chi tiết:\n\n`;

    Object.keys(byClass).sort().forEach((cls) => {
      text += `📌 ${cls} (${byClass[cls].length} em):\n`;
      byClass[cls].forEach((name, i) => {
        text += `   ${i + 1}. ${name}\n`;
      });
      text += `\n`;
    });

    text += `👉 Các em khẩn trương hoàn thành trước thời hạn nhé!`;

    navigator.clipboard.writeText(text);
    setCopiedZalo(true);
    setTimeout(() => setCopiedZalo(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-ocean-700 via-ocean-800 to-slate-900 p-5 sm:p-6 text-white flex items-start justify-between">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-ocean-200 shrink-0 shadow-inner mt-0.5">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-wider bg-ocean-400/20 text-ocean-200 px-2.5 py-0.5 rounded-full border border-ocean-300/30">
                  {assignment.category || 'Kiểm tra'}
                </span>
                <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">
                  {targetClasses.join(', ')}
                </span>
                {assignment.is_paused && (
                  <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full">
                    Đang tạm dừng
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1 leading-snug">
                {assignment.title}
              </h3>
              <p className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Hạn chót:{' '}
                  <strong className="text-white">
                    {assignment.deadline
                      ? new Date(assignment.deadline).toLocaleString('vi-VN')
                      : 'Không giới hạn'}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  Sĩ số thực tế: <strong className="text-white">{stats.total} học sinh</strong>
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh thống kê nhanh (Progress Banner) */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Tiến độ nộp bài:</span>
              <strong className="text-ocean-700 font-black text-sm">
                {stats.submitted} / {stats.total} HS ({stats.percent}%)
              </strong>
            </div>

            <div className="w-28 sm:w-36 bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-ocean-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.percent}%` }}
              />
            </div>
          </div>

          {/* Nút Copy Zalo */}
          <button
            type="button"
            onClick={handleCopyUnsubmittedZalo}
            disabled={stats.unsubmitted === 0}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs ${
              copiedZalo
                ? 'bg-emerald-600 text-white'
                : stats.unsubmitted > 0
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Sao chép tin nhắn nhắc nhở kèm danh sách học sinh chưa nộp để gửi vào nhóm Zalo"
          >
            {copiedZalo ? (
              <>
                <Check className="w-4 h-4" />
                <span>Đã sao chép tin nhắn Zalo!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Sao chép DS chưa nộp gửi Zalo ({stats.unsubmitted})</span>
              </>
            )}
          </button>
        </div>

        {/* Bộ lọc & Tìm kiếm */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs: Tất cả / Đã nộp / Chưa nộp */}
          <div className="flex items-center p-1 bg-slate-100 rounded-2xl gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('submitted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'submitted'
                  ? 'bg-emerald-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Đã nộp ({stats.submitted})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unsubmitted')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'unsubmitted'
                  ? 'bg-rose-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Chưa nộp ({stats.unsubmitted})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 sm:max-w-md">
            {/* Lọc theo lớp (nếu giao nhiều hơn 1 lớp) */}
            {targetClasses.length > 1 && (
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="px-2.5 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:border-ocean-500"
              >
                <option value="all">Tất cả lớp ({targetClasses.length})</option>
                {targetClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            )}

            {/* Ô tìm kiếm học sinh */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã học sinh..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 outline-none focus:border-ocean-500 focus:bg-white transition"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bảng danh sách học sinh */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {filteredList.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2.5">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-700 text-sm">
                Không tìm thấy học sinh nào phù hợp
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Cô thử chuyển bộ lọc (Tất cả / Đã nộp / Chưa nộp) hoặc xóa từ khóa tìm kiếm xem sao nhé!
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-3 sm:px-4">Họ và tên</th>
                    <th className="py-3 px-3 sm:px-4 w-24">Lớp</th>
                    <th className="py-3 px-3 sm:px-4 w-32 text-center">Trạng thái</th>
                    <th className="py-3 px-3 sm:px-4 w-28 text-center">Điểm số</th>
                    <th className="py-3 px-3 sm:px-4 w-36 text-right hidden sm:table-cell">Thời gian nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((item, idx) => {
                    const { student, isSubmitted, submission } = item;
                    return (
                      <tr
                        key={student.id || student.student_code || idx}
                        className={`hover:bg-slate-50/80 transition ${
                          isSubmitted ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="py-3 px-3 sm:px-4 text-center font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 sm:px-4">
                          <div className="font-bold text-slate-900 text-sm">
                            {student.full_name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Mã HS: {student.student_code || '---'}
                          </div>
                        </td>
                        <td className="py-3 px-3 sm:px-4 font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px]">
                            {student.class_name}
                          </span>
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-center">
                          {isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Đã nộp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 border border-rose-300">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                              Chưa nộp
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-center">
                          {isSubmitted && submission ? (
                            <div className="font-black text-sm text-emerald-700">
                              {Number(submission.score || 0).toFixed(1)}đ
                              <span className="text-[10px] text-slate-400 block font-normal">
                                / {submission.max_score || 10}đ
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 font-bold">---</span>
                          )}
                        </td>
                        <td className="py-3 px-3 sm:px-4 text-right hidden sm:table-cell text-slate-500 text-[11px]">
                          {isSubmitted && submission?.submitted_at ? (
                            <div>
                              <div className="font-medium text-slate-700">
                                {new Date(submission.submitted_at).toLocaleTimeString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {new Date(submission.submitted_at).toLocaleDateString('vi-VN')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-300">Chưa làm bài</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Hiển thị <strong>{filteredList.length}</strong> / {stats.total} học sinh
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
