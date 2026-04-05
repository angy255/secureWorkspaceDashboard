import { AlertTriangle } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface ConfirmDialogProps {
  title:     string;
  message:   string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel:  () => void;
  confirmLabel?: string;
  intent?: 'danger' | 'warning';
}

export function ConfirmDialog({
  title,
  message,
  isLoading,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  intent = 'danger',
}: ConfirmDialogProps) {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
          intent === 'danger' ? 'bg-red-50' : 'bg-amber-50'
        }`}>
          <AlertTriangle
            size={22}
            className={intent === 'danger' ? 'text-red-500' : 'text-amber-500'}
          />
        </div>

        <h2 className="text-lg font-semibold text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">{message}</p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white
              transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed
              ${intent === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'}
            `}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
