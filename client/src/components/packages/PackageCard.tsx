import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, MoreVertical, RefreshCw, Archive, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import type { Package } from '@/lib/api';
import { packagesApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CarrierBadge } from '@/components/shared/CarrierBadge';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface PackageCardProps {
  pkg: Package;
}

export function PackageCard({ pkg }: PackageCardProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const refreshMutation = useMutation({
    mutationFn: () => packagesApi.refresh(pkg.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Tracking updated');
    },
    onError: () => toast.error('Failed to refresh tracking'),
  });

  const archiveMutation = useMutation({
    mutationFn: () => packagesApi.archive(pkg.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package archived');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => packagesApi.delete(pkg.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package deleted');
    },
  });

  const lastEvent = pkg.last_checkpoint_at
    ? formatDistanceToNow(parseISO(pkg.last_checkpoint_at), { addSuffix: true })
    : null;

  return (
    <div
      className={cn(
        'group relative bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-4 cursor-pointer hover:border-[var(--color-primary)] transition-all hover:shadow-md',
        pkg.status_tag === 'OutForDelivery' && 'border-amber-400 dark:border-amber-500',
        pkg.status_tag === 'Delivered' && 'opacity-75'
      )}
      onClick={() => navigate(`/packages/${pkg.id}`)}
    >
      <div className="flex items-start gap-3">
        {/* Carrier + Direction */}
        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <CarrierBadge slug={pkg.slug} name={pkg.carrier_name} />
          {pkg.direction === 'incoming' ? (
            <ArrowDownCircle className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <ArrowUpCircle className="h-3.5 w-3.5 text-blue-500" />
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-foreground)] truncate">
                {pkg.label ?? pkg.tracking_number}
              </p>
              {pkg.label && (
                <p className="text-xs text-[var(--color-muted-foreground)] font-mono truncate">
                  {pkg.tracking_number}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <StatusBadge tag={pkg.status_tag} />
              {/* Menu */}
              <div ref={menuRef} className="relative" onClick={e => e.stopPropagation()}>
                <button
                  className="p-1 rounded hover:bg-[var(--color-accent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-6 w-40 bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-lg z-10 py-1">
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--color-accent)] text-[var(--color-foreground)]"
                      onClick={() => { setMenuOpen(false); refreshMutation.mutate(); }}
                      disabled={refreshMutation.isPending}
                    >
                      {refreshMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Refresh
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-[var(--color-accent)] text-[var(--color-foreground)]"
                      onClick={() => { setMenuOpen(false); archiveMutation.mutate(); }}
                    >
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </button>
                    <button
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-red-50 dark:hover:bg-red-950 text-red-600"
                      onClick={() => { setMenuOpen(false); deleteMutation.mutate(); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status message */}
          {pkg.status_message && (
            <p className="text-xs text-[var(--color-muted-foreground)] mt-1.5 line-clamp-1">
              {pkg.status_message}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[var(--color-muted-foreground)]">
              {pkg.expected_delivery
                ? `Expected ${new Date(pkg.expected_delivery).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : lastEvent
                  ? `Updated ${lastEvent}`
                  : 'No updates yet'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
