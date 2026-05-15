import { format, parseISO } from 'date-fns';
import type { Checkpoint } from '@/lib/api';
import { getStatusConfig } from '@/lib/carriers';
import { cn } from '@/lib/utils';

interface TrackingTimelineProps {
  checkpoints: Checkpoint[];
  currentTag: string;
}

export function TrackingTimeline({ checkpoints, currentTag }: TrackingTimelineProps) {
  if (checkpoints.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No tracking events yet. Check back later.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {checkpoints.map((cp, i) => {
        const isLatest = i === 0;
        const config = getStatusConfig(cp.tag || currentTag);
        return (
          <div key={i} className="flex gap-4 pb-4">
            {/* Timeline dot + line */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'h-3 w-3 rounded-full mt-1 shrink-0 border-2',
                  isLatest
                    ? `border-current ${config.color} bg-current`
                    : 'border-[var(--color-border)] bg-[var(--color-muted)]'
                )}
              />
              {i < checkpoints.length - 1 && (
                <div className="w-0.5 flex-1 bg-[var(--color-border)] mt-1" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1">
              <p className={cn(
                'text-sm font-medium',
                isLatest ? 'text-[var(--color-foreground)]' : 'text-[var(--color-muted-foreground)]'
              )}>
                {cp.message}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {cp.location && (
                  <span className="text-xs text-[var(--color-muted-foreground)]">{cp.location}</span>
                )}
                {cp.location && <span className="text-[var(--color-muted-foreground)] text-xs">·</span>}
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {format(parseISO(cp.created_at), 'MMM d, yyyy · h:mm a')}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
