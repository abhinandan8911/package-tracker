import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Archive, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { formatDistanceToNow, parseISO, format } from 'date-fns';
import type { Package } from '@/lib/api';
import { packagesApi } from '@/lib/api';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { CarrierBadge } from '@/components/shared/CarrierBadge';

interface PackageTableProps {
  packages: Package[];
}

export function PackageTable({ packages }: PackageTableProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const refreshMutation = useMutation({
    mutationFn: (id: number) => packagesApi.refresh(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast.success('Updated'); },
    onError: () => toast.error('Refresh failed'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: number) => packagesApi.archive(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast.success('Archived'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => packagesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['packages'] }); toast.success('Deleted'); },
  });

  return (
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[var(--color-muted)] border-b border-[var(--color-border)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">Carrier</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">Package</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">Dir</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">Status</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">Last Event</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">Expected</th>
              <th className="text-left px-4 py-3 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">Synced</th>
              <th className="text-right px-4 py-3 font-medium text-[var(--color-muted-foreground)] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {packages.map(pkg => {
              const lastEvent = pkg.last_checkpoint_at
                ? formatDistanceToNow(parseISO(pkg.last_checkpoint_at), { addSuffix: true })
                : '—';
              const synced = pkg.last_synced_at
                ? formatDistanceToNow(parseISO(pkg.last_synced_at), { addSuffix: true })
                : '—';
              const expected = pkg.expected_delivery
                ? format(new Date(pkg.expected_delivery + 'T12:00:00'), 'MMM d')
                : '—';

              return (
                <tr
                  key={pkg.id}
                  className="bg-[var(--color-card)] hover:bg-[var(--color-accent)] transition-colors cursor-pointer group"
                  onClick={() => navigate(`/packages/${pkg.id}`)}
                >
                  <td className="px-4 py-3">
                    <CarrierBadge slug={pkg.slug} name={pkg.carrier_name} />
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="font-medium text-[var(--color-foreground)] truncate">
                      {pkg.label ?? pkg.tracking_number}
                    </p>
                    {pkg.label && (
                      <p className="text-xs text-[var(--color-muted-foreground)] font-mono truncate">
                        {pkg.tracking_number}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {pkg.direction === 'incoming'
                      ? <span title="Incoming"><ArrowDownCircle className="h-4 w-4 text-green-500" /></span>
                      : <span title="Outgoing"><ArrowUpCircle className="h-4 w-4 text-blue-500" /></span>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tag={pkg.status_tag} />
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)] whitespace-nowrap">
                    {lastEvent}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)] whitespace-nowrap">
                    {expected}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted-foreground)] whitespace-nowrap text-xs">
                    {synced}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="p-1.5 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        title="View details"
                        onClick={() => navigate(`/packages/${pkg.id}`)}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        title="Refresh"
                        onClick={() => refreshMutation.mutate(pkg.id)}
                        disabled={refreshMutation.isPending}
                      >
                        {refreshMutation.isPending && refreshMutation.variables === pkg.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-[var(--color-muted)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                        title="Archive"
                        onClick={() => archiveMutation.mutate(pkg.id)}
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950 text-[var(--color-muted-foreground)] hover:text-red-600"
                        title="Delete"
                        onClick={() => deleteMutation.mutate(pkg.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
