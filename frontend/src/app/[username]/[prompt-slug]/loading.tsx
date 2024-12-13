// src/app/[username]/[prompt-slug]/loading.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert } from '@/components/ui/alert';

export default function Loading() {
  return (
    <div className="container max-w-4xl py-8">
      <Card>
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-[300px]" /> {/* Title */}
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-[100px]" /> {/* Username */}
                <span>•</span>
                <Skeleton className="h-4 w-[80px]" /> {/* Visibility badge */}
              </div>
            </div>
            <Skeleton className="h-10 w-[120px]" /> {/* Button */}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Content skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* News section skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-[150px]" /> {/* Section title */}
            <div className="space-y-2">
              <Alert>
                <Skeleton className="h-4 w-full" />
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}