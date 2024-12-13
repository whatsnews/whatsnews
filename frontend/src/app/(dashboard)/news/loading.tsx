// src/app/(dashboard)/news/loading.tsx
import { NewsCardSkeleton } from "@/components/news/NewsCard";

export default function Loading() {
  return (
    <div className="p-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
        <div className="flex gap-3 mt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md"></div>
          ))}
        </div>
      </div>

      {/* News Cards Skeleton */}
      <div className="space-y-4">
        <NewsCardSkeleton />
        <NewsCardSkeleton />
        <NewsCardSkeleton />
      </div>
    </div>
  );
}