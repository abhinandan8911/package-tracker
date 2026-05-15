import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Loader2, PackageCheck } from 'lucide-react';
import { packagesApi } from '@/lib/api';
import { CarrierBadge } from '@/components/shared/CarrierBadge';

interface AddPackageDialogProps {
  initialTrackingNumber?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFabClick: () => void;
}

export function AddPackageDialog({ initialTrackingNumber, open, onOpenChange, onFabClick }: AddPackageDialogProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [direction, setDirection] = useState<'incoming' | 'outgoing'>('incoming');
  const [label, setLabel] = useState('');
  const [orderId, setOrderId] = useState('');
  const [detected, setDetected] = useState<{ slug: string; carrier_name: string } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const qc = useQueryClient();

  // Pre-fill tracking number when opened with an initial value
  useEffect(() => {
    if (open) {
      setTrackingNumber(initialTrackingNumber ?? '');
      setDirection('incoming');
      setLabel('');
      setOrderId('');
      setDetected(null);
    }
  }, [open, initialTrackingNumber]);

  async function handleTrackingBlur() {
    if (!trackingNumber.trim() || trackingNumber.length < 6) return;
    setDetecting(true);
    try {
      const result = await packagesApi.detect(trackingNumber.trim());
      if (result.slug) {
        setDetected({ slug: result.slug, carrier_name: result.carrier_name! });
      } else {
        setDetected(null);
      }
    } catch {
      setDetected(null);
    } finally {
      setDetecting(false);
    }
  }

  const addMutation = useMutation({
    mutationFn: packagesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['packages'] });
      toast.success('Package added successfully');
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to add package';
      toast.error(msg);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    addMutation.mutate({
      tracking_number: trackingNumber.trim(),
      direction,
      label: label.trim() || undefined,
      order_id: orderId.trim() || undefined,
    });
  }

  return (
    <>
      {/* FAB — always visible when dialog is closed */}
      {!open && (
        <button
          onClick={onFabClick}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity z-50"
          aria-label="Add package"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Dialog */}
      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => onOpenChange(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--color-card)] rounded-xl shadow-2xl z-50 p-6">
            <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-4 flex items-center gap-2">
              <PackageCheck className="h-5 w-5" />
              Track a Package
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Tracking Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    onBlur={handleTrackingBlur}
                    placeholder="Enter tracking number..."
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] pr-24"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {detecting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--color-muted-foreground)]" />
                    ) : detected ? (
                      <CarrierBadge slug={detected.slug} name={detected.carrier_name} />
                    ) : null}
                  </div>
                </div>
                {detected && (
                  <p className="text-xs text-[var(--color-muted-foreground)] mt-1">
                    Detected: {detected.carrier_name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">Direction</label>
                <div className="flex gap-3">
                  {(['incoming', 'outgoing'] as const).map(d => (
                    <label
                      key={d}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border cursor-pointer text-sm font-medium transition-colors ${
                        direction === d
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-accent)] text-[var(--color-foreground)]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="direction"
                        value={d}
                        checked={direction === d}
                        onChange={() => setDirection(d)}
                        className="sr-only"
                      />
                      {d === 'incoming' ? '↓ Incoming' : '↑ Outgoing'}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Label <span className="text-[var(--color-muted-foreground)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Amazon order, Gift from Mom..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Order ID <span className="text-[var(--color-muted-foreground)] font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="Order reference number..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 py-2 px-4 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-accent)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || !trackingNumber.trim()}
                  className="flex-1 py-2 px-4 rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {addMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
                  ) : (
                    'Add Package'
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
