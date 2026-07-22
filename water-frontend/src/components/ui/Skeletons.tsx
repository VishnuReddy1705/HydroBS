
interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-100/80 before:absolute before:inset-0 before:-translate-x-full before:before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/50 before:to-transparent ${className}`}
      style={{
        backgroundImage: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite linear"
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between h-32">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-7 w-20" />
      </div>
      <div className="flex justify-between items-center mt-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-8 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-20 animate-pulse" />
      </div>
      <div className="h-64 flex items-end gap-3 pt-6 border-b border-slate-100">
        <Skeleton className="h-[20%] flex-1 animate-pulse" />
        <Skeleton className="h-[45%] flex-1 animate-pulse" />
        <Skeleton className="h-[30%] flex-1 animate-pulse" />
        <Skeleton className="h-[60%] flex-1 animate-pulse" />
        <Skeleton className="h-[75%] flex-1 animate-pulse" />
        <Skeleton className="h-[50%] flex-1 animate-pulse" />
        <Skeleton className="h-[90%] flex-1 animate-pulse" />
      </div>
      <div className="flex justify-between pt-2">
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
        <Skeleton className="h-3 w-8" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="border border-slate-100 bg-white rounded-3xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-44" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="p-4">
                  <Skeleton className="h-3 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="hover:bg-slate-50/30 transition-colors">
                {Array.from({ length: cols }).map((_, c) => (
                  <td key={c} className="p-4">
                    <Skeleton className="h-3.5 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="p-6 rounded-3xl border border-slate-100 bg-white shadow-sm space-y-4">
      <Skeleton className="h-4 w-28" />
      <div className="space-y-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3.5 items-start">
            <Skeleton className="h-8 w-8 rounded-xl flex-shrink-0 animate-pulse" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
