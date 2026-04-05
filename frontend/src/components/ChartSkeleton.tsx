interface ChartSkeletonProps {
  height?: number;
}

export function ChartSkeleton({ height = 300 }: ChartSkeletonProps) {
  return (
    <div
      className="w-full rounded-lg bg-slate-100 animate-pulse"
      style={{ height }}
      aria-label="Loading chart…"
    >
      <div className="flex items-end gap-2 h-full px-6 pb-4 pt-8">
        {[55, 35, 75, 45, 90, 60, 40, 70, 50, 80, 65, 45].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-slate-200 rounded-t-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}
