export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
      <div className="flex gap-2">
        <div className="h-6 bg-gray-100 rounded-full w-16" />
        <div className="h-6 bg-gray-100 rounded-full w-12" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
