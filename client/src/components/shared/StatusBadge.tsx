import { cn } from '@/lib/utils';
import { getStatusConfig } from '@/lib/carriers';

interface StatusBadgeProps {
  tag: string;
  className?: string;
}

export function StatusBadge({ tag, className }: StatusBadgeProps) {
  const config = getStatusConfig(tag);
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.bg,
        config.color,
        className
      )}
    >
      {config.label}
    </span>
  );
}
