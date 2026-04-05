interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
  label?: string;
}

const SIZE_MAP = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
};

export function LoadingSpinner({ size = 'md', fullPage = false, label }: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`
          ${SIZE_MAP[size]}
          rounded-full
          border-slate-200
          border-t-indigo-500
          animate-spin
        `}
      />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-64">
        {spinner}
      </div>
    );
  }

  return spinner;
}
