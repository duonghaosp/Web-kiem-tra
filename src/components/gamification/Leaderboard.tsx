import React, { useState } from 'react';
import { Trophy, Medal, Crown, Flame, Users, Sparkles } from 'lucide-react';
import { Profile } from '../../types/database';

interface LeaderboardProps {
  students: Profile[];
  currentStudentId?: string;
  className?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  students = [],
  currentStudentId,
  className = '',
}) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');

  // Lọc và sắp xếp theo XP giảm dần
  const filteredStudents = students
    .filter((s) => selectedGrade === 'all' || s.grade === selectedGrade)
    .sort((a, b) => (b.xp || 0) - (a.xp || 0));

  const top3 = filteredStudents.slice(0, 3);
  const remaining = filteredStudents.slice(3, 10);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black flex items-center justify-center shadow-md ring-2 ring-amber-300 text-sm">
          <Crown className="w-4 h-4 text-amber-900 fill-amber-900" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-800 font-bold flex items-center justify-center shadow ring-2 ring-slate-300 text-xs">
          2
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-bold flex items-center justify-center shadow ring-2 ring-amber-500 text-xs">
          3
        </div>
      );
    }
    return (
      <span className="w-6 text-center font-bold text-slate-400 text-xs">
        #{rank}
      </span>
    );
  };

  return (
    <div className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Bảng Xếp Hạng Thi Đua</h3>
            <p className="text-xs text-slate-500">Tích lũy XP qua các bài kiểm tra & câu hỏi Địa lí</p>
          </div>
        </div>

        {/* Bộ lọc Khối */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start">
          <button
            type="button"
            onClick={() => setSelectedGrade('all')}
            className={`px-2.5 py-1 rounded-lg transition ${
              selectedGrade === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả
          </button>
          {[6, 7, 8, 9].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={`px-2.5 py-1 rounded-lg transition ${
                selectedGrade === g ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Khối {g}
            </button>
          ))}
        </div>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs">
          Chưa có dữ liệu thi đua của học sinh.
        </div>
      ) : (
        <>
          {/* Top 3 Bục Vinh Quang (Podium) */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6 pt-4 pb-2 border-b border-slate-100">
              {/* Vị trí 2 */}
              {top3[1] && (
                <div className="flex flex-col items-center text-center order-1 sm:order-1 pt-4">
                  <div className="relative mb-2">
                    <img
                      src={top3[1].avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80'}
                      alt={top3[1].full_name}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-slate-300 object-cover shadow"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-slate-300 text-slate-800 rounded-full text-[10px] font-black flex items-center justify-center shadow">
                      2
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[90px]">
                    {top3[1].full_name}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-600">
                    {top3[1].xp.toLocaleString()} XP
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Cấp {top3[1].level}
                  </span>
                </div>
              )}

              {/* Vị trí 1 (Quán Quân) */}
              {top3[0] && (
                <div className="flex flex-col items-center text-center order-2 sm:order-2">
                  <div className="relative mb-2">
                    <Crown className="w-6 h-6 text-amber-500 fill-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                    <img
                      src={top3[0].avatar_url || 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80'}
                      alt={top3[0].full_name}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-3 border-amber-400 object-cover shadow-md ring-4 ring-amber-100"
                    />
                    <span className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-tr from-amber-500 to-yellow-400 text-amber-950 rounded-full text-xs font-black flex items-center justify-center shadow">
                      1
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-amber-900 line-clamp-1 max-w-[100px]">
                    {top3[0].full_name}
                  </h4>
                  <span className="text-xs font-black text-amber-700 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    {top3[0].xp.toLocaleString()} XP
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
                    Cấp {top3[0].level}
                  </span>
                </div>
              )}

              {/* Vị trí 3 */}
              {top3[2] && (
                <div className="flex flex-col items-center text-center order-3 sm:order-3 pt-6">
                  <div className="relative mb-2">
                    <img
                      src={top3[2].avatar_url || 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=120&q=80'}
                      alt={top3[2].full_name}
                      className="w-11 h-11 sm:w-13 sm:h-13 rounded-full border-2 border-amber-600 object-cover shadow"
                    />
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-700 text-white rounded-full text-[10px] font-black flex items-center justify-center shadow">
                      3
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[90px]">
                    {top3[2].full_name}
                  </h4>
                  <span className="text-[11px] font-bold text-amber-800">
                    {top3[2].xp.toLocaleString()} XP
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Cấp {top3[2].level}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Danh sách thứ hạng tiếp theo */}
          <div className="space-y-1.5">
            {remaining.map((student, idx) => {
              const rank = idx + 4;
              const isCurrent = student.id === currentStudentId;

              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition ${
                    isCurrent
                      ? 'bg-ocean-50 border border-ocean-300 font-semibold text-ocean-950'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getRankBadge(rank)}
                    <img
                      src={student.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'}
                      alt={student.full_name}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{student.full_name}</span>
                        {student.grade && (
                          <span className="text-[10px] font-normal text-slate-400">
                            (Khối {student.grade})
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[9px] bg-ocean-600 text-white px-1.5 py-0.2 rounded-full">
                            Bạn
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      {student.xp.toLocaleString()} XP
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 w-10 text-right">
                      Cấp {student.level}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
