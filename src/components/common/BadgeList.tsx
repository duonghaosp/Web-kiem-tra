import React from 'react';
import { Award, Trophy, Compass, MapPin, Globe, Moon, ShieldCheck, Star, Sparkles, Check } from 'lucide-react';
import { ALL_BADGES, BadgeItem } from '../../data/badgeService';

interface BadgeListProps {
  unlockedBadgeIds?: string[];
  allBadges?: BadgeItem[];
  onToggleBadge?: (badgeId: string) => void;
  isTeacherMode?: boolean;
}

export const BadgeList: React.FC<BadgeListProps> = ({
  unlockedBadgeIds = [],
  allBadges = ALL_BADGES,
  onToggleBadge,
  isTeacherMode = false,
}) => {
  const getIcon = (iconName: string, isUnlocked: boolean) => {
    const props = { className: `w-5 h-5 ${isUnlocked ? 'text-amber-600' : 'text-slate-400'}` };
    switch (iconName) {
      case 'Moon': return <Moon {...props} />;
      case 'Award': return <Award {...props} />;
      case 'Trophy': return <Trophy {...props} />;
      case 'Compass': return <Compass {...props} />;
      case 'MapPin': return <MapPin {...props} />;
      case 'Globe': return <Globe {...props} />;
      case 'Star': return <Star {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      default: return <ShieldCheck {...props} />;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {allBadges.map((badge) => {
        const isUnlocked = unlockedBadgeIds.includes(badge.id);

        return (
          <div
            key={badge.id}
            onClick={() => onToggleBadge && onToggleBadge(badge.id)}
            className={`relative flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-200 ${
              onToggleBadge ? 'cursor-pointer select-none active:scale-95' : ''
            } ${
              isUnlocked
                ? 'bg-gradient-to-b from-amber-50 to-amber-100/50 border-amber-300 shadow-sm ring-2 ring-amber-400/30'
                : 'bg-slate-50/60 border-slate-200 opacity-60 hover:opacity-80'
            }`}
          >
            {/* Dấu tích khi cô Hảo đã trao tặng */}
            {isUnlocked && (
              <span className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-xs">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            )}

            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-1.5 shadow-inner transition ${
                isUnlocked
                  ? 'bg-amber-100/80 ring-2 ring-amber-400/60 shadow-amber-200'
                  : 'bg-slate-200/80'
              }`}
            >
              {getIcon(badge.icon, isUnlocked)}
            </div>

            <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-0.5">
              {badge.name}
            </h4>

            <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight min-h-[24px]">
              {badge.description}
            </p>

            <div className="mt-2 w-full">
              {isUnlocked ? (
                <span className="inline-block w-full text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                  🎖️ Cô Hảo trao tặng
                </span>
              ) : isTeacherMode ? (
                <span className="inline-block w-full text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800 border border-slate-200">
                  + Bấm để trao tặng
                </span>
              ) : (
                <span className="inline-block w-full text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                  +{badge.xp_reward} XP
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
