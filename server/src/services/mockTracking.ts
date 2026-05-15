import type { AfterShipTracking, AfterShipCheckpoint } from './aftership';

// A pool of realistic mock packages to draw from when seeding
export const MOCK_PACKAGES = [
  {
    id: 'mock_001',
    tracking_number: '1Z999AA10123456784',
    slug: 'ups',
    carrier_name: 'UPS',
    direction: 'incoming' as const,
    label: 'New MacBook Pro',
    tag: 'InTransit',
    subtag: 'InTransit_001',
    subtag_message: 'Package transferred to destination facility',
    expected_delivery: daysFromNow(2),
    origin_country_iso3: 'USA',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-1,  'InTransit', 'Package transferred to destination facility', 'Louisville, KY'),
      mkCheckpoint(-2,  'InTransit', 'Departed from facility', 'Louisville, KY'),
      mkCheckpoint(-3,  'InTransit', 'Arrived at facility', 'Louisville, KY'),
      mkCheckpoint(-4,  'InTransit', 'Package in transit', 'Memphis, TN'),
      mkCheckpoint(-5,  'InTransit', 'Departed from facility', 'Seattle, WA'),
      mkCheckpoint(-6,  'InTransit', 'Origin scan', 'Seattle, WA'),
      mkCheckpoint(-7,  'InfoReceived', 'Order processed: Ready for UPS', 'Seattle, WA'),
    ],
  },
  {
    id: 'mock_002',
    tracking_number: '9400136106196412631562',
    slug: 'usps',
    carrier_name: 'USPS',
    direction: 'incoming' as const,
    label: 'Birthday Gift',
    tag: 'OutForDelivery',
    subtag: 'OutForDelivery_001',
    subtag_message: 'Out for Delivery',
    expected_delivery: daysFromNow(0),
    origin_country_iso3: 'USA',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-0.2, 'OutForDelivery', 'Out for delivery', 'Austin, TX'),
      mkCheckpoint(-1,   'InTransit', 'Arrived at post office', 'Austin, TX'),
      mkCheckpoint(-2,   'InTransit', 'In transit to next facility', 'Dallas, TX'),
      mkCheckpoint(-3,   'InTransit', 'Departed USPS Regional Facility', 'Dallas, TX'),
      mkCheckpoint(-4,   'InTransit', 'Arrived at USPS Regional Facility', 'Dallas, TX'),
      mkCheckpoint(-5,   'InfoReceived', 'Shipping label created, USPS awaiting item', 'New York, NY'),
    ],
  },
  {
    id: 'mock_003',
    tracking_number: '773849271023',
    slug: 'fedex',
    carrier_name: 'FedEx',
    direction: 'outgoing' as const,
    label: 'Client Shipment #4821',
    tag: 'Delivered',
    subtag: 'Delivered_001',
    subtag_message: 'Delivered - Front Door',
    expected_delivery: daysFromNow(-1),
    origin_country_iso3: 'USA',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-1,  'Delivered', 'Delivered - Front Door', 'Chicago, IL'),
      mkCheckpoint(-1.5,'OutForDelivery', 'On FedEx vehicle for delivery', 'Chicago, IL'),
      mkCheckpoint(-2,  'InTransit', 'At local FedEx facility', 'Chicago, IL'),
      mkCheckpoint(-3,  'InTransit', 'In transit', 'Indianapolis, IN'),
      mkCheckpoint(-4,  'InTransit', 'Departed FedEx facility', 'Columbus, OH'),
      mkCheckpoint(-5,  'InTransit', 'Arrived at FedEx facility', 'Columbus, OH'),
      mkCheckpoint(-6,  'InfoReceived', 'Shipment information sent to FedEx', 'New York, NY'),
    ],
  },
  {
    id: 'mock_004',
    tracking_number: 'JD014600006261129444',
    slug: 'dhl',
    carrier_name: 'DHL Express',
    direction: 'incoming' as const,
    label: 'Camera Lens Import',
    tag: 'InTransit',
    subtag: 'InTransit_002',
    subtag_message: 'Customs clearance in progress',
    expected_delivery: daysFromNow(5),
    origin_country_iso3: 'DEU',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-1,  'InTransit', 'Customs clearance in progress', 'Cincinnati, OH'),
      mkCheckpoint(-2,  'InTransit', 'Arrived at DHL facility', 'Cincinnati, OH'),
      mkCheckpoint(-3,  'InTransit', 'Departed DHL hub', 'Leipzig, Germany'),
      mkCheckpoint(-4,  'InTransit', 'Processed at DHL hub', 'Leipzig, Germany'),
      mkCheckpoint(-5,  'InTransit', 'Picked up', 'Berlin, Germany'),
      mkCheckpoint(-6,  'InfoReceived', 'Shipment booked', 'Berlin, Germany'),
    ],
  },
  {
    id: 'mock_005',
    tracking_number: 'TBA312093475000',
    slug: 'amazon',
    carrier_name: 'Amazon Logistics',
    direction: 'incoming' as const,
    label: 'Desk Lamp',
    tag: 'Delivered',
    subtag: 'Delivered_001',
    subtag_message: 'Package delivered',
    expected_delivery: daysFromNow(-3),
    origin_country_iso3: 'USA',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-3,  'Delivered', 'Package delivered', 'Austin, TX'),
      mkCheckpoint(-3.2,'OutForDelivery', 'Out for delivery', 'Austin, TX'),
      mkCheckpoint(-4,  'InTransit', 'Package arrived at Amazon facility', 'Austin, TX'),
      mkCheckpoint(-5,  'InTransit', 'Package in transit', 'Dallas, TX'),
      mkCheckpoint(-6,  'InfoReceived', 'Shipment confirmed', 'Phoenix, AZ'),
    ],
  },
  {
    id: 'mock_006',
    tracking_number: '1Z4R30E80391425670',
    slug: 'ups',
    carrier_name: 'UPS',
    direction: 'outgoing' as const,
    label: 'Return — Defective Monitor',
    tag: 'Exception',
    subtag: 'Exception_002',
    subtag_message: 'Address not found — return to sender',
    expected_delivery: null,
    origin_country_iso3: 'USA',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-1,  'Exception', 'Address not found — return to sender', 'Miami, FL'),
      mkCheckpoint(-2,  'AttemptFail', 'Delivery attempt failed — no access', 'Miami, FL'),
      mkCheckpoint(-3,  'InTransit', 'Package arrived at facility', 'Miami, FL'),
      mkCheckpoint(-4,  'InTransit', 'In transit', 'Atlanta, GA'),
      mkCheckpoint(-5,  'InTransit', 'Departed facility', 'Charlotte, NC'),
      mkCheckpoint(-6,  'InfoReceived', 'Shipment ready for pickup', 'Charlotte, NC'),
    ],
  },
  {
    id: 'mock_007',
    tracking_number: '274899172569',
    slug: 'fedex',
    carrier_name: 'FedEx',
    direction: 'incoming' as const,
    label: 'Office Supplies',
    tag: 'Pending',
    subtag: 'Pending_001',
    subtag_message: 'Label created',
    expected_delivery: daysFromNow(6),
    origin_country_iso3: 'USA',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-0.5, 'InfoReceived', 'Label created, not yet in FedEx system', 'Portland, OR'),
    ],
  },
  {
    id: 'mock_008',
    tracking_number: '9400111899225018916849',
    slug: 'usps',
    carrier_name: 'USPS',
    direction: 'outgoing' as const,
    label: 'eBay Sale — Vintage Watch',
    tag: 'InTransit',
    subtag: 'InTransit_001',
    subtag_message: 'In transit to next facility',
    expected_delivery: daysFromNow(3),
    origin_country_iso3: 'USA',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-1,  'InTransit', 'In transit to next facility', 'Kansas City, MO'),
      mkCheckpoint(-2,  'InTransit', 'Departed USPS Regional Facility', 'St. Louis, MO'),
      mkCheckpoint(-3,  'InTransit', 'Accepted at USPS facility', 'St. Louis, MO'),
      mkCheckpoint(-4,  'InfoReceived', 'USPS awaiting item', 'St. Louis, MO'),
    ],
  },
  {
    id: 'mock_009',
    tracking_number: '3318160025000',
    slug: 'dhl',
    carrier_name: 'DHL Express',
    direction: 'outgoing' as const,
    label: 'Export — Tech Parts',
    tag: 'Delivered',
    subtag: 'Delivered_001',
    subtag_message: 'Delivered',
    expected_delivery: daysFromNow(-2),
    origin_country_iso3: 'USA',
    destination_country_iso3: 'GBR',
    checkpoints: [
      mkCheckpoint(-2,  'Delivered', 'Delivered — signed for by recipient', 'London, UK'),
      mkCheckpoint(-3,  'OutForDelivery', 'With delivery courier', 'London, UK'),
      mkCheckpoint(-4,  'InTransit', 'Customs cleared', 'London, UK'),
      mkCheckpoint(-5,  'InTransit', 'Arrived at DHL facility', 'East Midlands, UK'),
      mkCheckpoint(-6,  'InTransit', 'Departed DHL hub', 'Cincinnati, OH'),
      mkCheckpoint(-7,  'InfoReceived', 'Picked up', 'San Francisco, CA'),
    ],
  },
  {
    id: 'mock_010',
    tracking_number: 'TBA298374650000',
    slug: 'amazon',
    carrier_name: 'Amazon Logistics',
    direction: 'incoming' as const,
    label: 'Mechanical Keyboard',
    tag: 'OutForDelivery',
    subtag: 'OutForDelivery_001',
    subtag_message: 'Out for delivery — arriving today',
    expected_delivery: daysFromNow(0),
    origin_country_iso3: 'USA',
    destination_country_iso3: 'USA',
    checkpoints: [
      mkCheckpoint(-0.3, 'OutForDelivery', 'Out for delivery — arriving today', 'Seattle, WA'),
      mkCheckpoint(-1,   'InTransit', 'Package arrived at delivery station', 'Seattle, WA'),
      mkCheckpoint(-2,   'InTransit', 'Package in transit', 'Spokane, WA'),
      mkCheckpoint(-3,   'InfoReceived', 'Shipped', 'Las Vegas, NV'),
    ],
  },
];

function daysFromNow(days: number): string {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
}

function mkCheckpoint(daysAgo: number, tag: string, message: string, location: string): AfterShipCheckpoint {
  const d = new Date();
  d.setTime(d.getTime() - Math.abs(daysAgo) * 24 * 60 * 60 * 1000);
  const parts = location.split(', ');
  return {
    created_at: d.toISOString(),
    slug: '',
    city: parts[0] ?? null,
    state: parts[1] ?? null,
    country_name: parts[2] ?? null,
    message,
    tag,
    subtag: `${tag}_001`,
    location,
  };
}

export function getMockTracking(slug: string, trackingNumber: string): AfterShipTracking | null {
  const found = MOCK_PACKAGES.find(
    p => p.tracking_number === trackingNumber && p.slug === slug
  );
  if (!found) {
    // Return a generic pending state for unknown numbers
    return {
      id: `mock_${trackingNumber}`,
      tracking_number: trackingNumber,
      slug,
      title: null,
      order_id: null,
      tag: 'Pending',
      subtag: 'Pending_001',
      subtag_message: 'Label created, awaiting pickup',
      origin_country_iso3: null,
      destination_country_iso3: null,
      expected_delivery: null,
      last_updated_at: new Date().toISOString(),
      checkpoints: [mkCheckpoint(0, 'InfoReceived', 'Tracking number registered', 'Unknown')],
    };
  }
  return {
    id: found.id,
    tracking_number: found.tracking_number,
    slug: found.slug,
    title: found.label,
    order_id: null,
    tag: found.tag,
    subtag: found.subtag,
    subtag_message: found.subtag_message,
    origin_country_iso3: found.origin_country_iso3,
    destination_country_iso3: found.destination_country_iso3,
    expected_delivery: found.expected_delivery,
    last_updated_at: new Date().toISOString(),
    checkpoints: found.checkpoints,
  };
}

export function isMockMode(): boolean {
  const key = process.env.AFTERSHIP_API_KEY ?? '';
  return !key || key === 'your_aftership_api_key_here' || key.startsWith('test_');
}
