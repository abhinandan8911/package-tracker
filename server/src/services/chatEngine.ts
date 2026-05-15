import db from '../db/database';
import type { Package, Checkpoint } from '../types';

// ── Entity maps ───────────────────────────────────────────────────────────────

const STATE_MAP: Record<string, string> = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR',
  california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
};

// Reverse: abbr → full name
const STATE_ABBR_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_MAP).map(([name, abbr]) => [abbr, name])
);

const CARRIER_MAP: Record<string, string> = {
  ups: 'ups', 'united parcel': 'ups',
  fedex: 'fedex', 'federal express': 'fedex',
  usps: 'usps', 'postal service': 'usps', 'post office': 'usps', 'us mail': 'usps',
  dhl: 'dhl',
  amazon: 'amazon',
};

const STATUS_MAP: Record<string, string[]> = {
  delivered: ['Delivered'],
  'in transit': ['InTransit'],
  transit: ['InTransit'],
  intransit: ['InTransit'],
  'out for delivery': ['OutForDelivery'],
  outfordelivery: ['OutForDelivery'],
  'out for': ['OutForDelivery'],
  exception: ['Exception', 'AttemptFail'],
  problem: ['Exception', 'AttemptFail'],
  issue: ['Exception', 'AttemptFail'],
  failed: ['AttemptFail', 'Exception'],
  attempt: ['AttemptFail'],
  pending: ['Pending'],
  'info received': ['InfoReceived'],
  'label created': ['InfoReceived', 'Pending'],
  pickup: ['AvailableForPickup'],
  expired: ['Expired'],
};

// ── Parsed query ──────────────────────────────────────────────────────────────

interface ParsedQuery {
  intent: 'count' | 'list' | 'summary' | 'unknown';
  locations: string[];       // lowercase city/state names & abbrs to search
  statuses: string[];        // AfterShip tag values
  carriers: string[];        // carrier slugs
  direction: 'incoming' | 'outgoing' | null;
  deliveryWindow: 'today' | 'week' | null;
}

function parseQuery(raw: string): ParsedQuery {
  const q = raw.toLowerCase().replace(/[?!]/g, '');

  // Intent
  let intent: ParsedQuery['intent'] = 'list';
  if (/\b(how many|count|number of|total)\b/.test(q)) intent = 'count';
  else if (/\b(summary|overview|breakdown|report)\b/.test(q)) intent = 'summary';

  // Direction
  let direction: ParsedQuery['direction'] = null;
  if (/\b(incoming|inbound|arriving|receiving|received)\b/.test(q)) direction = 'incoming';
  else if (/\b(outgoing|outbound|sent|sending|shipped out|going out)\b/.test(q)) direction = 'outgoing';

  // Carriers
  const carriers: string[] = [];
  for (const [keyword, slug] of Object.entries(CARRIER_MAP)) {
    if (q.includes(keyword)) {
      if (!carriers.includes(slug)) carriers.push(slug);
    }
  }

  // Statuses
  const statuses: string[] = [];
  for (const [keyword, tags] of Object.entries(STATUS_MAP)) {
    if (q.includes(keyword)) {
      for (const tag of tags) {
        if (!statuses.includes(tag)) statuses.push(tag);
      }
    }
  }

  // Delivery window
  let deliveryWindow: ParsedQuery['deliveryWindow'] = null;
  if (/\b(today|arriving today|today's)\b/.test(q)) deliveryWindow = 'today';
  else if (/\b(this week|week)\b/.test(q)) deliveryWindow = 'week';

  // Locations — extract state names (multi-word first), abbreviations, then remaining proper nouns
  const locations: string[] = [];

  // Multi-word state names first
  for (const stateName of Object.keys(STATE_MAP).sort((a, b) => b.length - a.length)) {
    if (q.includes(stateName)) {
      if (!locations.includes(stateName)) locations.push(stateName);
      if (!locations.includes(STATE_MAP[stateName].toLowerCase())) {
        locations.push(STATE_MAP[stateName].toLowerCase());
      }
    }
  }

  // State abbreviations (e.g. "TX", "CA") — look for 2-letter uppercase patterns in original
  const abbrMatches = raw.match(/\b([A-Z]{2})\b/g) ?? [];
  for (const abbr of abbrMatches) {
    if (STATE_ABBR_MAP[abbr]) {
      const lower = abbr.toLowerCase();
      if (!locations.includes(lower)) locations.push(lower);
      const fullName = STATE_ABBR_MAP[abbr];
      if (!locations.includes(fullName)) locations.push(fullName);
    }
  }

  // City-like tokens: capitalized words that aren't already captured and aren't stop words
  const stopWords = new Set([
    'how', 'many', 'packages', 'package', 'shipments', 'shipment', 'deliveries',
    'delivery', 'are', 'is', 'the', 'going', 'to', 'from', 'in', 'at', 'my',
    'show', 'me', 'all', 'what', 'which', 'do', 'have', 'i', 'a', 'an', 'for',
    'and', 'or', 'of', 'that', 'with', 'status', 'tracking', 'carrier', 'any',
    'there', 'tell', 'about', 'between', 'via', 'through', 'heading', 'headed',
    'being', 'sent', 'shipped', 'by',
  ]);
  const cityMatches = raw.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  for (const city of cityMatches) {
    const lower = city.toLowerCase();
    if (!stopWords.has(lower) && !locations.includes(lower)) {
      locations.push(lower);
    }
  }

  return { intent, locations, statuses, carriers, direction, deliveryWindow };
}

// ── Package matching ──────────────────────────────────────────────────────────

function checkpointsOf(pkg: Package): Checkpoint[] {
  try { return JSON.parse(pkg.checkpoints_json ?? '[]'); } catch { return []; }
}

function packageMatchesLocation(pkg: Package, locations: string[]): boolean {
  if (locations.length === 0) return true;

  const haystack = [
    pkg.status_message,
    pkg.origin_country,
    pkg.destination_country,
    ...checkpointsOf(pkg).flatMap(cp => [cp.location, cp.city, cp.state, cp.country_name]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return locations.some(loc => haystack.includes(loc));
}

function filterPackages(query: ParsedQuery): Package[] {
  let pkgs = db.prepare('SELECT * FROM packages WHERE is_archived = 0').all() as Package[];

  if (query.direction) {
    pkgs = pkgs.filter(p => p.direction === query.direction);
  }
  if (query.carriers.length) {
    pkgs = pkgs.filter(p => query.carriers.includes(p.slug));
  }
  if (query.statuses.length) {
    pkgs = pkgs.filter(p => query.statuses.includes(p.status_tag));
  }
  if (query.locations.length) {
    pkgs = pkgs.filter(p => packageMatchesLocation(p, query.locations));
  }
  if (query.deliveryWindow === 'today') {
    const today = new Date().toISOString().split('T')[0];
    pkgs = pkgs.filter(p => p.expected_delivery === today || p.status_tag === 'OutForDelivery');
  } else if (query.deliveryWindow === 'week') {
    const now = new Date();
    const weekOut = new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    pkgs = pkgs.filter(
      p => p.expected_delivery && p.expected_delivery >= todayStr && p.expected_delivery <= weekOut
    );
  }

  return pkgs;
}

// ── Response generation ───────────────────────────────────────────────────────

function labelFor(pkg: Package): string {
  return pkg.label ?? pkg.tracking_number;
}

function locationContext(query: ParsedQuery): string {
  if (query.locations.length === 0) return '';
  // Use the original location terms (capitalised) for display
  const display = query.locations
    .filter(l => l.length > 2) // skip raw abbreviations
    .slice(0, 2)
    .map(l => l.replace(/\b\w/g, c => c.toUpperCase()))
    .join(' / ');
  return display ? ` in or through **${display}**` : '';
}

function describeFilters(query: ParsedQuery): string {
  const parts: string[] = [];
  if (query.direction) parts.push(query.direction);
  if (query.carriers.length) parts.push(query.carriers.map(c => c.toUpperCase()).join('/'));
  if (query.statuses.length) {
    parts.push(query.statuses.map(s => s.replace(/([A-Z])/g, ' $1').trim()).join('/'));
  }
  return parts.length ? parts.join(', ') : 'all';
}

function generateResponse(query: ParsedQuery, pkgs: Package[], rawQuestion: string): string {
  const loc = locationContext(query);
  const filterDesc = describeFilters(query);

  // ── Summary intent ────────────────────────────────────────────────────────
  if (query.intent === 'summary') {
    const total = db.prepare('SELECT COUNT(*) as n FROM packages WHERE is_archived = 0').get() as { n: number };
    const byStatus = db.prepare(`
      SELECT status_tag, COUNT(*) as n FROM packages WHERE is_archived = 0 GROUP BY status_tag
    `).all() as Array<{ status_tag: string; n: number }>;
    const byCarrier = db.prepare(`
      SELECT carrier_name, COUNT(*) as n FROM packages WHERE is_archived = 0 GROUP BY carrier_name
    `).all() as Array<{ carrier_name: string; n: number }>;

    const statusLines = byStatus.map(
      r => `  • **${r.status_tag.replace(/([A-Z])/g, ' $1').trim()}** — ${r.n}`
    ).join('\n');
    const carrierLines = byCarrier.map(r => `  • **${r.carrier_name}** — ${r.n}`).join('\n');

    return `Here's your shipment overview across **${total.n} packages**:\n\n**By Status:**\n${statusLines}\n\n**By Carrier:**\n${carrierLines}`;
  }

  // ── No results ────────────────────────────────────────────────────────────
  if (pkgs.length === 0) {
    if (query.locations.length) {
      const displayLoc = query.locations
        .filter(l => l.length > 2)
        .slice(0, 2)
        .map(l => l.replace(/\b\w/g, c => c.toUpperCase()))
        .join(' / ');
      return `I didn't find any packages with checkpoints${loc}. This could mean none of your tracked shipments have passed through that area, or the location hasn't appeared in any tracking events yet.`;
    }
    return `No packages found matching your query (${filterDesc}). Try broadening the filters.`;
  }

  // ── Count intent ──────────────────────────────────────────────────────────
  if (query.intent === 'count') {
    const n = pkgs.length;
    const incoming = pkgs.filter(p => p.direction === 'incoming').length;
    const outgoing = pkgs.filter(p => p.direction === 'outgoing').length;

    let msg = `You have **${n} package${n !== 1 ? 's' : ''}**${loc}`;
    if (!query.direction && incoming > 0 && outgoing > 0) {
      msg += ` — ${incoming} incoming, ${outgoing} outgoing`;
    }
    msg += '.';

    if (query.statuses.length === 0 && query.carriers.length === 0) {
      const statusCounts = pkgs.reduce<Record<string, number>>((acc, p) => {
        acc[p.status_tag] = (acc[p.status_tag] ?? 0) + 1;
        return acc;
      }, {});
      const breakdown = Object.entries(statusCounts)
        .map(([tag, n]) => `${tag.replace(/([A-Z])/g, ' $1').trim()} (${n})`)
        .join(', ');
      if (Object.keys(statusCounts).length > 1) msg += ` Breakdown: ${breakdown}.`;
    }
    return msg;
  }

  // ── List intent ───────────────────────────────────────────────────────────
  const lines = pkgs.map(p => {
    const status = p.status_tag.replace(/([A-Z])/g, ' $1').trim();
    const eta = p.expected_delivery
      ? ` · ETA ${new Date(p.expected_delivery + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : '';
    const lastEvent = p.status_message ? ` — *${p.status_message}*` : '';
    return `• **${labelFor(p)}** (${p.carrier_name}, ${p.direction}) — **${status}**${eta}${lastEvent}`;
  });

  const header = `Found **${pkgs.length} package${pkgs.length !== 1 ? 's' : ''}**${loc}:\n\n`;
  // Cap display at 8 to keep response readable
  const visible = lines.slice(0, 8);
  const overflow = pkgs.length > 8 ? `\n\n…and ${pkgs.length - 8} more.` : '';
  return header + visible.join('\n') + overflow;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export interface ChatResponse {
  answer: string;
  matchedCount: number;
  query: ParsedQuery;
}

export function answerQuery(rawQuestion: string): ChatResponse {
  const query = parseQuery(rawQuestion);
  const pkgs = filterPackages(query);
  const answer = generateResponse(query, pkgs, rawQuestion);
  return { answer, matchedCount: pkgs.length, query };
}

// Suggested starter questions
export const SUGGESTED_QUESTIONS = [
  'How many packages are in transit?',
  'Show me all packages going to Texas',
  'How many incoming packages do I have?',
  'Are there any exceptions or delivery issues?',
  'Which packages are out for delivery?',
  'Show me all FedEx shipments',
  'Give me a summary of all packages',
  'Which packages are arriving today?',
];
