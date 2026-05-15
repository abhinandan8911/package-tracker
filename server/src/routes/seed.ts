import { Router } from 'express';
import db from '../db/database';
import { MOCK_PACKAGES } from '../services/mockTracking';
import type { Checkpoint } from '../types';

const router = Router();

router.post('/', (_req, res, next) => {
  try {
    const existing = (db.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number }).count;
    if (existing > 0) {
      return res.status(409).json({ error: 'Database already has packages. Clear first or use POST /api/seed/force' });
    }
    seedPackages();
    const count = (db.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number }).count;
    res.json({ seeded: count });
  } catch (err) { next(err); }
});

// Allow force re-seed
router.post('/force', (_req, res, next) => {
  try {
    db.prepare('DELETE FROM packages').run();
    seedPackages();
    const count = (db.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number }).count;
    res.json({ seeded: count });
  } catch (err) { next(err); }
});

function seedPackages() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO packages (
      aftership_id, tracking_number, slug, carrier_name, direction,
      label, order_id, status_tag, status_subtag, status_message,
      origin_country, destination_country, expected_delivery,
      last_checkpoint_at, last_synced_at, checkpoints_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
  `);

  const insertMany = db.transaction(() => {
    for (const pkg of MOCK_PACKAGES) {
      const checkpoints: Checkpoint[] = pkg.checkpoints.map(cp => ({
        created_at: cp.created_at,
        message: cp.message,
        location: cp.location,
        tag: cp.tag,
        subtag: cp.subtag,
        city: cp.city,
        state: cp.state,
        country_name: cp.country_name,
      }));
      const lastCheckpoint = checkpoints[0] ?? null;
      insert.run(
        pkg.id,
        pkg.tracking_number,
        pkg.slug,
        pkg.carrier_name,
        pkg.direction,
        pkg.label,
        null,
        pkg.tag,
        pkg.subtag,
        pkg.subtag_message,
        pkg.origin_country_iso3,
        pkg.destination_country_iso3,
        pkg.expected_delivery,
        lastCheckpoint?.created_at ?? null,
        JSON.stringify(checkpoints),
      );
    }
  });
  insertMany();
}

export default router;
