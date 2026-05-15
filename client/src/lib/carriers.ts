export const CARRIER_COLORS: Record<string, string> = {
  ups: '#351C15',
  fedex: '#4D148C',
  usps: '#333366',
  dhl: '#FFCC00',
  amazon: '#FF9900',
  ontrac: '#ED7B00',
  lasership: '#0066CC',
};

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  Pending: { label: 'Pending', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800' },
  InfoReceived: { label: 'Info Received', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
  InTransit: { label: 'In Transit', color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950' },
  OutForDelivery: { label: 'Out for Delivery', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  AttemptFail: { label: 'Attempt Failed', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  Delivered: { label: 'Delivered', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
  AvailableForPickup: { label: 'Pickup Ready', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
  Exception: { label: 'Exception', color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950' },
  Expired: { label: 'Expired', color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900' },
};

export function getStatusConfig(tag: string) {
  return STATUS_CONFIG[tag] ?? { label: tag, color: 'text-gray-500', bg: 'bg-gray-100' };
}
