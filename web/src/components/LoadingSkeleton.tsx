interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export function TableSkeleton({ columns, rows = 6 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden bg-white rounded-lg shadow animate-pulse">
      <div className="grid gap-4 bg-gray-50 border-b px-6 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <div key={index} className="h-4 bg-gray-200 rounded" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid gap-4 border-b px-6 py-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }).map((_, columnIndex) => (
            <div key={columnIndex} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-6">
            <div className="flex-1 space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="flex gap-3">
              <div className="h-8 w-8 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded" />
              <div className="h-8 w-8 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
