import { detectCarrierLocally, getCarrierName } from './carrierDetect';
import { getMockTracking, isMockMode } from './mockTracking';

const AFTERSHIP_BASE = 'https://api.aftership.com/v4';

function getHeaders() {
  return {
    'aftership-api-key': process.env.AFTERSHIP_API_KEY ?? '',
    'Content-Type': 'application/json',
  };
}

export interface AfterShipCheckpoint {
  created_at: string;
  slug: string;
  city: string | null;
  state: string | null;
  country_name: string | null;
  message: string;
  tag: string;
  subtag: string;
  location: string | null;
}

export interface AfterShipTracking {
  id: string;
  tracking_number: string;
  slug: string;
  title: string | null;
  order_id: string | null;
  tag: string;
  subtag: string;
  subtag_message: string | null;
  origin_country_iso3: string | null;
  destination_country_iso3: string | null;
  expected_delivery: string | null;
  last_updated_at: string | null;
  checkpoints: AfterShipCheckpoint[];
}

async function aftershipFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${AFTERSHIP_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers ?? {}),
    },
  });
  const json = await res.json() as { meta: { code: number; message: string }; data: unknown };
  if (json.meta.code !== 200 && json.meta.code !== 201) {
    throw new Error(`AfterShip error ${json.meta.code}: ${json.meta.message}`);
  }
  return json.data;
}

export async function detectCarrierAPI(trackingNumber: string): Promise<{ slug: string; name: string } | null> {
  try {
    const data = await aftershipFetch('/couriers/detect', {
      method: 'POST',
      body: JSON.stringify({ tracking: { tracking_number: trackingNumber } }),
    }) as { couriers: Array<{ slug: string; name: string }> };
    if (data.couriers && data.couriers.length > 0) {
      const c = data.couriers[0];
      return { slug: c.slug, name: c.name };
    }
  } catch {
    // fallback to local detection
  }
  return detectCarrierLocally(trackingNumber);
}

export async function createTracking(
  trackingNumber: string,
  slug: string,
  options: { title?: string; orderId?: string }
): Promise<AfterShipTracking> {
  if (isMockMode()) {
    const mock = getMockTracking(slug, trackingNumber);
    return mock ?? {
      id: `mock_${Date.now()}`,
      tracking_number: trackingNumber,
      slug,
      title: options.title ?? null,
      order_id: options.orderId ?? null,
      tag: 'Pending',
      subtag: 'Pending_001',
      subtag_message: null,
      origin_country_iso3: null,
      destination_country_iso3: null,
      expected_delivery: null,
      last_updated_at: new Date().toISOString(),
      checkpoints: [],
    };
  }
  const data = await aftershipFetch('/trackings', {
    method: 'POST',
    body: JSON.stringify({
      tracking: {
        tracking_number: trackingNumber,
        slug,
        title: options.title,
        order_id: options.orderId,
      },
    }),
  }) as { tracking: AfterShipTracking };
  return data.tracking;
}

export async function getTracking(
  slug: string,
  trackingNumber: string
): Promise<AfterShipTracking> {
  if (isMockMode()) {
    const mock = getMockTracking(slug, trackingNumber);
    if (mock) return mock;
  }
  const data = await aftershipFetch(`/trackings/${slug}/${trackingNumber}`) as { tracking: AfterShipTracking };
  return data.tracking;
}

export async function deleteTracking(slug: string, trackingNumber: string): Promise<void> {
  await aftershipFetch(`/trackings/${slug}/${trackingNumber}`, { method: 'DELETE' });
}

export function normalizeCarrierName(slug: string, apiName?: string | null): string {
  return apiName ?? getCarrierName(slug);
}

export { isMockMode };
