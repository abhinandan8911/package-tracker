import { Router } from 'express';
import { z } from 'zod';
import db from '../db/database';
import { detectCarrierLocally, getCarrierName } from '../services/carrierDetect';
import {
  detectCarrierAPI,
  createTracking,
  getTracking,
  deleteTracking,
  normalizeCarrierName,
} from '../services/aftership';
import type { Package, PackageWithCheckpoints, Checkpoint } from '../types';

const router = Router();

const AddPackageSchema = z.object({
  tracking_number: z.string().min(6).max(60).trim(),
  direction: z.enum(['incoming', 'outgoing']),
  label: z.string().max(100).optional(),
  order_id: z.string().max(100).optional(),
});

const UpdatePackageSchema = z.object({
  label: z.string().max(100).optional(),
  order_id: z.string().max(100).optional(),
  direction: z.enum(['incoming', 'outgoing']).optional(),
});

function parseCheckpoints(json: string): Checkpoint[] {
  try { return JSON.parse(json); } catch { return []; }
}

function toPackageWithCheckpoints(pkg: Package): PackageWithCheckpoints {
  const { checkpoints_json, ...rest } = pkg;
  return { ...rest, checkpoints: parseCheckpoints(checkpoints_json) };
}

// POST /api/packages/detect
router.post('/detect', async (req, res, next) => {
  try {
    const { tracking_number } = z.object({ tracking_number: z.string().min(1) }).parse(req.body);
    const local = detectCarrierLocally(tracking_number);
    if (local) {
      return res.json({ slug: local.slug, carrier_name: local.name });
    }
    const apiResult = await detectCarrierAPI(tracking_number);
    if (apiResult) {
      return res.json({ slug: apiResult.slug, carrier_name: apiResult.name });
    }
    return res.json({ slug: null, carrier_name: null });
  } catch (err) {
    next(err);
  }
});

// GET /api/packages
router.get('/', (req, res, next) => {
  try {
    const { direction, status, search } = req.query as Record<string, string | undefined>;
    let query = `SELECT * FROM packages WHERE is_archived = 0`;
    const params: (string | number)[] = [];

    if (direction && (direction === 'incoming' || direction === 'outgoing')) {
      query += ` AND direction = ?`;
      params.push(direction);
    }
    if (status) {
      query += ` AND status_tag = ?`;
      params.push(status);
    }
    if (search) {
      query += ` AND (label LIKE ? OR tracking_number LIKE ? OR carrier_name LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    query += ` ORDER BY
      CASE WHEN status_tag = 'OutForDelivery' THEN 0
           WHEN status_tag = 'InTransit' THEN 1
           WHEN status_tag = 'Pending' THEN 2
           WHEN status_tag = 'Delivered' THEN 4
           ELSE 3
      END,
      last_checkpoint_at DESC NULLS LAST,
      created_at DESC`;

    const packages = db.prepare(query).all(...params) as Package[];
    res.json(packages.map(toPackageWithCheckpoints));
  } catch (err) {
    next(err);
  }
});

// POST /api/packages
router.post('/', async (req, res, next) => {
  try {
    const body = AddPackageSchema.parse(req.body);

    // Detect carrier
    let slug: string;
    let carrierName: string;
    const local = detectCarrierLocally(body.tracking_number);
    if (local) {
      slug = local.slug;
      carrierName = local.name;
    } else {
      const apiResult = await detectCarrierAPI(body.tracking_number);
      if (!apiResult) {
        return res.status(422).json({ error: 'Could not detect carrier. Please check the tracking number.' });
      }
      slug = apiResult.slug;
      carrierName = apiResult.name;
    }

    // Create tracking in AfterShip
    let aftershipTracking;
    try {
      aftershipTracking = await createTracking(body.tracking_number, slug, {
        title: body.label,
        orderId: body.order_id,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // If already registered, fetch existing
      if (msg.includes('4003') || msg.toLowerCase().includes('already')) {
        aftershipTracking = await getTracking(slug, body.tracking_number);
      } else {
        throw err;
      }
    }

    const checkpoints: Checkpoint[] = (aftershipTracking.checkpoints ?? []).map((cp) => ({
      created_at: cp.created_at,
      message: cp.message,
      location: cp.location ?? ([cp.city, cp.state, cp.country_name].filter(Boolean).join(', ') || null),
      tag: cp.tag,
      subtag: cp.subtag,
      city: cp.city ?? null,
      state: cp.state ?? null,
      country_name: cp.country_name ?? null,
    }));

    const lastCheckpoint = checkpoints[0] ?? null;

    const insert = db.prepare(`
      INSERT INTO packages (
        aftership_id, tracking_number, slug, carrier_name, direction,
        label, order_id, status_tag, status_subtag, status_message,
        origin_country, destination_country, expected_delivery,
        last_checkpoint_at, last_synced_at, checkpoints_json
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, datetime('now'), ?
      )
    `);

    const result = insert.run(
      aftershipTracking.id,
      body.tracking_number,
      slug,
      normalizeCarrierName(slug, carrierName),
      body.direction,
      body.label ?? null,
      body.order_id ?? null,
      aftershipTracking.tag ?? 'Pending',
      aftershipTracking.subtag ?? null,
      aftershipTracking.subtag_message ?? lastCheckpoint?.message ?? null,
      aftershipTracking.origin_country_iso3 ?? null,
      aftershipTracking.destination_country_iso3 ?? null,
      aftershipTracking.expected_delivery ?? null,
      lastCheckpoint?.created_at ?? null,
      JSON.stringify(checkpoints),
    );

    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(result.lastInsertRowid) as Package;
    return res.status(201).json(toPackageWithCheckpoints(pkg));
  } catch (err) {
    next(err);
  }
});

// POST /api/packages/refresh-all
router.post('/refresh-all', async (_req, res, next) => {
  try {
    const { refreshAllPackages } = await import('../scheduler');
    const result = await refreshAllPackages();
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/packages/:id
router.get('/:id', (req, res, next) => {
  try {
    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as Package | undefined;
    if (!pkg) return res.status(404).json({ error: 'Package not found' });
    res.json(toPackageWithCheckpoints(pkg));
  } catch (err) {
    next(err);
  }
});

// PUT /api/packages/:id
router.put('/:id', (req, res, next) => {
  try {
    const body = UpdatePackageSchema.parse(req.body);
    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as Package | undefined;
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const updates: string[] = [];
    const params: unknown[] = [];

    if (body.label !== undefined) { updates.push('label = ?'); params.push(body.label); }
    if (body.order_id !== undefined) { updates.push('order_id = ?'); params.push(body.order_id); }
    if (body.direction !== undefined) { updates.push('direction = ?'); params.push(body.direction); }

    if (updates.length === 0) return res.json(toPackageWithCheckpoints(pkg));

    params.push(req.params.id);
    db.prepare(`UPDATE packages SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as Package;
    res.json(toPackageWithCheckpoints(updated));
  } catch (err) {
    next(err);
  }
});

// POST /api/packages/:id/refresh
router.post('/:id/refresh', async (req, res, next) => {
  try {
    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as Package | undefined;
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const tracking = await getTracking(pkg.slug, pkg.tracking_number);

    const checkpoints: Checkpoint[] = (tracking.checkpoints ?? []).map((cp) => ({
      created_at: cp.created_at,
      message: cp.message,
      location: cp.location ?? ([cp.city, cp.state, cp.country_name].filter(Boolean).join(', ') || null),
      tag: cp.tag,
      subtag: cp.subtag,
      city: cp.city ?? null,
      state: cp.state ?? null,
      country_name: cp.country_name ?? null,
    }));

    const lastCheckpoint = checkpoints[0] ?? null;

    db.prepare(`
      UPDATE packages SET
        status_tag = ?,
        status_subtag = ?,
        status_message = ?,
        expected_delivery = ?,
        last_checkpoint_at = ?,
        last_synced_at = datetime('now'),
        checkpoints_json = ?
      WHERE id = ?
    `).run(
      tracking.tag ?? pkg.status_tag,
      tracking.subtag ?? null,
      tracking.subtag_message ?? lastCheckpoint?.message ?? null,
      tracking.expected_delivery ?? null,
      lastCheckpoint?.created_at ?? null,
      JSON.stringify(checkpoints),
      req.params.id,
    );

    const updated = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as Package;
    res.json(toPackageWithCheckpoints(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/packages/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id) as Package | undefined;
    if (!pkg) return res.status(404).json({ error: 'Package not found' });

    const hard = req.query.hard === 'true';
    if (hard) {
      try { await deleteTracking(pkg.slug, pkg.tracking_number); } catch { /* ignore */ }
      db.prepare('DELETE FROM packages WHERE id = ?').run(req.params.id);
    } else {
      db.prepare('UPDATE packages SET is_archived = 1 WHERE id = ?').run(req.params.id);
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Suppress unused import warning
void getCarrierName;

export default router;
