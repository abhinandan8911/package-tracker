export interface CarrierDetectionResult {
  slug: string;
  name: string;
}

const CARRIER_PATTERNS: Array<{
  slug: string;
  name: string;
  patterns: RegExp[];
}> = [
  {
    slug: 'ups',
    name: 'UPS',
    patterns: [
      /^1Z[A-Z0-9]{16}$/i,
      /^(T\d{10}|K\d{10}|J\d{10})$/,
      /^\d{9}$/,
    ],
  },
  {
    slug: 'amazon',
    name: 'Amazon Logistics',
    patterns: [
      /^TBA\d{12}$/i,
    ],
  },
  {
    slug: 'fedex',
    name: 'FedEx',
    patterns: [
      /^96\d{20}$/,
      /^61\d{18}$/,
      /^[0-9]{15}$/,
      /^[0-9]{22}$/,
      /^[0-9]{12}$/,
      /^[0-9]{20}$/,
    ],
  },
  {
    slug: 'usps',
    name: 'USPS',
    patterns: [
      /^(94|93|92|95)\d{20}$/,
      /^[A-Z]{2}\d{9}US$/,
      /^420\d{5}(9[12345])\d{18,20}$/,
      /^[0-9]{20,22}$/,
      /^[0-9]{13}$/,
    ],
  },
  {
    slug: 'dhl',
    name: 'DHL',
    patterns: [
      /^JD\d{18}$/,
      /^GM\d{16}$/,
      /^[A-Z]{3}\d{7}[A-Z]{2}$/,
      /^\d{10,11}$/,
    ],
  },
  {
    slug: 'ontrac',
    name: 'OnTrac',
    patterns: [/^C\d{14}$/],
  },
  {
    slug: 'lasership',
    name: 'LaserShip',
    patterns: [/^1LS\d{12}$/i, /^L[A-Z0-9]{9}[A-Z]$/],
  },
];

const CARRIER_NAMES: Record<string, string> = {
  ups: 'UPS',
  fedex: 'FedEx',
  usps: 'USPS',
  dhl: 'DHL Express',
  'dhl-ecommerce': 'DHL eCommerce',
  amazon: 'Amazon Logistics',
  ontrac: 'OnTrac',
  lasership: 'LaserShip',
  'canada-post': 'Canada Post',
  'royal-mail': 'Royal Mail',
  auspost: 'Australia Post',
  yanwen: 'Yanwen',
  'china-post': 'China Post',
};

export function getCarrierName(slug: string): string {
  return CARRIER_NAMES[slug] ?? slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function detectCarrierLocally(trackingNumber: string): CarrierDetectionResult | null {
  const cleaned = trackingNumber.trim().toUpperCase();
  for (const carrier of CARRIER_PATTERNS) {
    for (const pattern of carrier.patterns) {
      if (pattern.test(cleaned)) {
        return { slug: carrier.slug, name: carrier.name };
      }
    }
  }
  return null;
}
