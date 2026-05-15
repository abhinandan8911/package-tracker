import { Search, LayoutGrid, Table2, RefreshCw } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';

const DIRECTION_TABS = [
  { value: '', label: 'All' },
  { value: 'incoming', label: '↓ Incoming' },
  { value: 'outgoing', label: '↑ Outgoing' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'InTransit', label: 'In Transit' },
  { value: 'OutForDelivery', label: 'Out for Delivery' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Exception', label: 'Exception' },
  { value: 'Pending', label: 'Pending' },
];

interface PackageFiltersProps {
  view: 'grid' | 'table';
  onViewChange: (v: 'grid' | 'table') => void;
  onRefreshAll: () => void;
  refreshing: boolean;
}

export function PackageFilters({ view, onViewChange, onRefreshAll, refreshing }: PackageFiltersProps) {
  const [params, setParams] = useSearchParams();
  const direction = params.get('direction') ?? '';
  const status = params.get('status') ?? '';
  const search = params.get('search') ?? '';

  function set(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Direction tabs */}
      <div className="flex gap-1 bg-[var(--color-muted)] p-1 rounded-lg">
        {DIRECTION_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => set('direction', tab.value)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              direction === tab.value
                ? 'bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={e => set('status', e.target.value)}
        className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
      >
        {STATUS_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-muted-foreground)]" />
        <input
          type="text"
          placeholder="Search packages..."
          value={search}
          onChange={e => set('search', e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
        />
      </div>

      {/* View toggle + Refresh All */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={onRefreshAll}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh All'}
        </button>
        <div className="flex gap-0.5 bg-[var(--color-muted)] p-0.5 rounded-lg">
          <button
            onClick={() => onViewChange('grid')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'grid'
                ? 'bg-[var(--color-card)] shadow-sm text-[var(--color-foreground)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewChange('table')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              view === 'table'
                ? 'bg-[var(--color-card)] shadow-sm text-[var(--color-foreground)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
            )}
            title="Table view"
          >
            <Table2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
