import { PackageOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  trackingNumber?: string;
  onTrack?: () => void;
}

export function EmptyState({
  title = 'No packages',
  description = 'Add a tracking number to get started',
  trackingNumber,
  onTrack,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <PackageOpen className="h-12 w-12 text-[var(--color-muted-foreground)] mb-4" />
      <h3 className="text-lg font-medium text-[var(--color-foreground)]">{title}</h3>
      <p className="text-sm text-[var(--color-muted-foreground)] mt-1">{description}</p>
      {trackingNumber && onTrack && (
        <button
          onClick={onTrack}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          Track "{trackingNumber}"
        </button>
      )}
    </div>
  );
}
