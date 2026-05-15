import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, RefreshCw, Loader2, MapPin, Calendar, Hash } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import { packagesApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CarrierBadge } from '@/components/shared/CarrierBadge';
import { TrackingTimeline } from '@/components/tracking/TrackingTimeline';

export function PackageDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: pkg, isLoading } = useQuery({
    queryKey: ['packages', id],
    queryFn: () => packagesApi.get(Number(id)),
    enabled: !!id,
  });

  const refreshMutation = useMutation({
    mutationFn: () => packagesApi.refresh(Number(id)),
    onSuccess: (updated) => {
      qc.setQueryData(['packages', id], updated);
      qc.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Tracking updated');
    },
    onError: () => toast.error('Failed to refresh tracking'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
      </div>
    );
  }

  if (!pkg) {
    return <div className="text-center py-20 text-[var(--color-muted-foreground)]">Package not found</div>;
  }

  const sortedCheckpoints = [...pkg.checkpoints].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to packages
      </button>

      {/* Header card */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <CarrierBadge slug={pkg.slug} name={pkg.carrier_name} className="text-sm px-3 py-1.5" />
            <div>
              <h1 className="text-lg font-bold text-[var(--color-foreground)]">
                {pkg.label ?? pkg.tracking_number}
              </h1>
              {pkg.label && (
                <p className="text-sm font-mono text-[var(--color-muted-foreground)]">{pkg.tracking_number}</p>
              )}
              <div className="flex items-center gap-2 mt-1.5">
                <StatusBadge tag={pkg.status_tag} />
                <span className="text-xs text-[var(--color-muted-foreground)] capitalize">
                  {pkg.direction}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
            className="p-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-accent)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors disabled:opacity-50"
            title="Refresh tracking"
          >
            {refreshMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
          {pkg.expected_delivery && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-[var(--color-muted-foreground)] shrink-0" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Expected delivery</p>
                <p className="text-[var(--color-foreground)] font-medium">
                  {format(parseISO(pkg.expected_delivery), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          )}
          {(pkg.origin_country || pkg.destination_country) && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-[var(--color-muted-foreground)] shrink-0" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Route</p>
                <p className="text-[var(--color-foreground)] font-medium">
                  {[pkg.origin_country, pkg.destination_country].filter(Boolean).join(' → ')}
                </p>
              </div>
            </div>
          )}
          {pkg.order_id && (
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-[var(--color-muted-foreground)] shrink-0" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Order ID</p>
                <p className="text-[var(--color-foreground)] font-medium">{pkg.order_id}</p>
              </div>
            </div>
          )}
          {pkg.last_synced_at && (
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 text-[var(--color-muted-foreground)] shrink-0" />
              <div>
                <p className="text-xs text-[var(--color-muted-foreground)]">Last synced</p>
                <p className="text-[var(--color-foreground)] font-medium">
                  {formatDistanceToNow(parseISO(pkg.last_synced_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[var(--color-foreground)] mb-4">Tracking History</h2>
        <TrackingTimeline checkpoints={sortedCheckpoints} currentTag={pkg.status_tag} />
      </div>
    </div>
  );
}
