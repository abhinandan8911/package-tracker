import { cn } from '@/lib/utils';

interface CarrierBadgeProps {
  slug: string;
  name: string;
  className?: string;
}

const CARRIER_ABBREV: Record<string, string> = {
  ups: 'UPS',
  fedex: 'FDX',
  usps: 'USPS',
  dhl: 'DHL',
  amazon: 'AMZ',
  ontrac: 'OTC',
  lasership: 'LS',
};

const CARRIER_COLORS: Record<string, string> = {
  ups: 'bg-amber-800 text-amber-50',
  fedex: 'bg-purple-700 text-purple-50',
  usps: 'bg-blue-800 text-blue-50',
  dhl: 'bg-yellow-400 text-yellow-900',
  amazon: 'bg-orange-500 text-orange-50',
  ontrac: 'bg-orange-700 text-orange-50',
  lasership: 'bg-blue-600 text-blue-50',
};

export function CarrierBadge({ slug, name, className }: CarrierBadgeProps) {
  const abbrev = CARRIER_ABBREV[slug] ?? slug.slice(0, 3).toUpperCase();
  const color = CARRIER_COLORS[slug] ?? 'bg-gray-600 text-gray-50';
  return (
    <span
      className={cn('inline-flex items-center justify-center px-2 py-1 rounded text-xs font-bold min-w-[2.5rem]', color, className)}
      title={name}
    >
      {abbrev}
    </span>
  );
}
