import React, { useState } from 'react';
import { X, Zap, Award, CheckCircle2, Sparkles, Heart } from 'lucide-react';
import { grantStudentXp, triggerCelebration } from '../../lib/gamification';
import { Profile } from '../../types/database';

interface GrantXpModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Profile | null;
  onSuccess?: (studentId: string, addedXp: number) => void;
}

const PRESET_REASONS = [
  { label: 'Phát biểu xây dựng bài xuất sắc', amount: 50, icon: '🌟' },
  { label: 'Làm bài tập Địa lí đạt điểm 10', amount: 100, icon: '🎯' },
  { label: 'Tích cực giúp đỡ bạn cùng tiến', amount: 40, icon: '🤝' },
  { label: 'Tìm hiểu sâu kiến thức bản đồ', amount: 60, icon: '🗺️' },
  { label: 'Có tiến bộ vượt bậc tuần này', amount: 80, icon: '🚀' },
];

export const GrantXpModal: React.FC<GrantXpModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(50);
  const [reason, setReason] = useState<string>('Phát biểu xây dựng bài xuất sắc');
  const [loading, setLoading] = useState<boolean>(false);
  const [grantedSuccess, setGrantedSuccess] = useState<boolean>(false);

  if (!isOpen || !student) return null;

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !reason.trim()) return;

    setLoading(true);
    const result = await grantStudentXp(student.id, amount, reason.trim());
    setLoading(false);

    if (result.success) {
      triggerCelebration();
      setGrantedSuccess(true);
      if (onSuccess) {
        onSuccess(student.id, amount);
      }
      setTimeout(() => {
        setGrantedSuccess(false);
        onClose();
      }, 1500);
    }
  };

  const handlePresetSelect = (preset: { label: string; amount: number }) => {
    setReason(preset.label);
    setAmount(preset.amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {grantedSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Đã Tặng Thành Công +{amount} XP!
            </h3>
            <p className="text-xs text-slate-500">
              Điểm thưởng đã được cộng trực tiếp vào tài khoản của {student.full_name}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleGrant} className="space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Zap className="w-6 h-6 fill-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Tặng Điểm Thưởng XP</h3>
                <p className="text-xs text-slate-500">
                  Khen thưởng học sinh: <strong className="text-slate-800">{student.full_name}</strong>
                </p>
              </div>
            </div>

            {/* Chọn nhanh lý do mẫu */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Gợi ý lý do khen thưởng nhanh của Cô:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_REASONS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(p)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition ${
                      reason === p.label && amount === p.amount
                        ? 'bg-amber-100 text-amber-950 border-amber-300 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="mr-1">{p.icon}</span>
                    {p.label} (+{p.amount} XP)
                  </button>
                ))}
              </div>
            </div>

            {/* Số lượng XP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điểm XP muốn tặng:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="1000"
                  step="5"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold text-base text-slate-800"
                  required
                />
                <Zap className="w-5 h-5 text-amber-500 fill-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Lý do chi tiết */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lời khen / Lý do hiển thị cho học sinh:
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Em trả lời rất hay câu hỏi về khí hậu miền Bắc"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs text-slate-800"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={loading || amount <= 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Đang cộng điểm...' : `Tặng +${amount} XP Ngay`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
