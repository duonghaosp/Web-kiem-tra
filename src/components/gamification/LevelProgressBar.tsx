import React from 'react';
import { Sparkles, Trophy, Zap } from 'lucide-react';
import { getLevelProgress } from '../../lib/gamification';

interface LevelProgressBarProps {
  xp: number;
  className?: string;
  showDetails?: boolean;
}

export const LevelProgressBar: React.FC<LevelProgressBarProps> = ({
  xp,
  className = '',
  showDetails = true,
}) => {
  const { currentLevel, nextLevel, percentage, currentXp, neededXp } = getLevelProgress(xp);

  return (
    <div className={`bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 text-white flex items-center justify-center font-black text-lg shadow-md ring-4 ring-amber-100">
              {currentLevel}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-slate-900 text-yellow-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-yellow-400/50">
              LV
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-slate-800 text-sm sm:text-base">
                Cấp độ {currentLevel}
              </h4>
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentLevel >= 100
                ? 'Đã đạt Cấp độ Tối đa (Cực Phẩm Đại Sư)'
                : `Cần thêm ${neededXp.toLocaleString()} XP để lên Cấp ${nextLevel}`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            {currentXp.toLocaleString()} XP
          </span>
        </div>
      </div>

      {/* Thanh tiến độ */}
      <div className="space-y-1.5">
        <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-400 transition-all duration-500 shadow-sm relative"
            style={{ width: `${percentage}%` }}
          >
            {percentage > 15 && (
              <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-black text-white px-1 leading-none">
                {percentage}%
              </span>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="flex justify-between text-[11px] text-slate-400 font-medium px-1">
            <span>Cấp {currentLevel}</span>
            <span className="text-slate-500 font-semibold">{percentage}% hoàn thành</span>
            <span>Cấp {nextLevel}</span>
          </div>
        )}
      </div>
    </div>
  );
};
