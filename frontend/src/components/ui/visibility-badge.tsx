// src/components/ui/visibility-badge.tsx
import { Badge } from '@/components/ui/badge';
import { Globe, Lock, Users } from 'lucide-react';
import { VisibilityType } from '@/types/api';
import { cn } from '@/lib/utils';

interface VisibilityBadgeProps {
  visibility: VisibilityType;
  size?: 'sm' | 'default';
  showLabel?: boolean;
  className?: string;
}

const visibilityConfig = {
  private: {
    icon: Lock,
    label: 'Private',
    className: 'bg-slate-600 text-slate-50 hover:bg-slate-600/80',
    description: 'Only you can see this'
  },
  internal: {
    icon: Users,
    label: 'Internal',
    className: 'bg-blue-600 text-blue-50 hover:bg-blue-600/80',
    description: 'All signed-in users can see this'
  },
  public: {
    icon: Globe,
    label: 'Public',
    className: 'bg-green-600 text-green-50 hover:bg-green-600/80',
    description: 'Anyone with the link can see this'
  }
} as const;

export function VisibilityBadge({
  visibility,
  size = 'default',
  showLabel = true,
  className
}: VisibilityBadgeProps) {
  const config = visibilityConfig[visibility];
  const Icon = config.icon;

  return (
    <Badge
      variant="secondary"
      className={cn(
        'flex items-center gap-1 font-medium',
        size === 'sm' && 'text-xs py-0',
        config.className,
        className
      )}
      title={config.description}
    >
      <Icon className={cn(
        'inline-block',
        size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
      )} />
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}