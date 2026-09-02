import React from 'react';
import { HelpCircle, PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
      <div className="w-14 h-14 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center mb-4 shadow-sm">
        {icon || <HelpCircle className="w-7 h-7" />}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2.5 bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white text-sm font-semibold rounded-xl transition shadow-sm"
        >
          <PlusCircle className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
