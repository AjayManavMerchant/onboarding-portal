export function ProgressSummary({ total, completed, pending }: { total: number; completed: number; pending: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="space-y-1.5">
      <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <div className="flex gap-1">
          <dt className="text-gray-600">Total</dt>
          <dd className="font-semibold">{total}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-gray-600">Completed</dt>
          <dd className="font-semibold text-green-700">{completed}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-gray-600">Pending</dt>
          <dd className="font-semibold text-amber-700">{pending}</dd>
        </div>
      </dl>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-label={`${completed} of ${total} completed`}
        className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
      >
        <div className="h-full rounded-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
