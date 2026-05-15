import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { packagesApi } from '@/lib/api';
import { PackageCard } from '@/components/packages/PackageCard';
import { PackageTable } from '@/components/packages/PackageTable';
import { PackageFilters } from '@/components/packages/PackageFilters';
import { AddPackageDialog } from '@/components/packages/AddPackageDialog';
import { EmptyState } from '@/components/shared/EmptyState';
import { Loader2, Database } from 'lucide-react';

function looksLikeTrackingNumber(s: string) {
  return s.length >= 8 && /^[A-Z0-9]+$/i.test(s.replace(/[-\s]/g, ''));
}

export function DashboardPage() {
  const [params] = useSearchParams();
  const direction = params.get('direction') || undefined;
  const status = params.get('status') || undefined;
  const search = params.get('search') || undefined;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefillTracking, setPrefillTracking] = useState<string | undefined>();
  const [view, setView] = useState<'grid' | 'table'>('table');

  const qc = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['packages', direction, status, search],
    queryFn: () => packagesApi.list({ direction, status, search }),
  });

  const refreshAllMutation = useMutation({
    mutationFn: () => packagesApi.refreshAll(),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['packages'] });
      toast.success(`Refreshed ${data.refreshed} packages${data.failed ? `, ${data.failed} failed` : ''}`);
    },
    onError: () => toast.error('Refresh failed'),
  });

  const seedMutation = useMutation({
    mutationFn: () => packagesApi.seed(),
    onSuccess: (data: { seeded: number }) => {
      qc.invalidateQueries({ queryKey: ['packages'] });
      toast.success(`Seeded ${data.seeded} demo packages`);
    },
    onError: () => {
      // Try force seed if regular seed conflicts
      toast.error('Already has data — use force seed to reset');
    },
  });

  const showQuickTrack = !isLoading && !packages?.length && search && looksLikeTrackingNumber(search);
  const showSeedBanner = !isLoading && !packages?.length && !search && !direction && !status;

  function openDialog(trackingNumber?: string) {
    setPrefillTracking(trackingNumber);
    setDialogOpen(true);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Packages</h1>
        <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
          Track your incoming and outgoing shipments
        </p>
      </div>

      <PackageFilters
        view={view}
        onViewChange={setView}
        onRefreshAll={() => refreshAllMutation.mutate()}
        refreshing={refreshAllMutation.isPending}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-muted-foreground)]" />
        </div>
      ) : !packages?.length ? (
        <>
          {showSeedBanner && (
            <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-muted)]">
              <Database className="h-5 w-5 text-[var(--color-muted-foreground)] shrink-0" />
              <p className="text-sm text-[var(--color-muted-foreground)] flex-1">
                No packages yet. Load demo data to explore the app.
              </p>
              <button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-foreground)] text-[var(--color-background)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {seedMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Database className="h-3.5 w-3.5" />
                )}
                Seed demo data
              </button>
            </div>
          )}
          <EmptyState
            title={search ? 'No matching packages' : 'No packages'}
            description={search ? 'No packages match your search' : 'Add a tracking number to get started'}
            trackingNumber={showQuickTrack ? search : undefined}
            onTrack={showQuickTrack ? () => openDialog(search) : undefined}
          />
        </>
      ) : view === 'table' ? (
        <PackageTable packages={packages} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {packages.map(pkg => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}

      <AddPackageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialTrackingNumber={prefillTracking}
        onFabClick={() => openDialog(undefined)}
      />
    </div>
  );
}
