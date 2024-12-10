// src/app/(dashboard)/prompts/[id]/loading.tsx
export default function Loading() {
    return (
      <div className="p-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-8"></div>
        <div className="space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded"></div>
          <div className="h-32 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }