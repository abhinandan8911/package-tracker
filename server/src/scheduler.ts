import db from './db/database';
import { getTracking } from './services/aftership';
import type { Package, Checkpoint } from './types';

const INTERVAL_MS = Number(process.env.REFRESH_INTERVAL_MS ?? 30 * 60 * 1000); // 30 min default

let schedulerHandle: ReturnType<typeof setInterval> | null = null;

async function refreshAllPackages(): Promise<{ refreshed: number; failed: number }> {
  const active = db.prepare(`
    SELECT * FROM packages
    WHERE is_archived = 0
      AND status_tag NOT IN ('Delivered', 'Expired')
  `).all() as Package[];

  let refreshed = 0;
  let failed = 0;

  for (const pkg of active) {
    try {
      const tracking = await getTracking(pkg.slug, pkg.tracking_number);
      const checkpoints: Checkpoint[] = (tracking.checkpoints ?? []).map(cp => ({
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
        pkg.id,
      );
      refreshed++;
    } catch {
      failed++;
    }
  }

  console.log(`[scheduler] Refreshed ${refreshed} packages, ${failed} failed`);
  return { refreshed, failed };
}

export function startScheduler() {
  console.log(`[scheduler] Starting — interval ${INTERVAL_MS / 1000}s`);
  schedulerHandle = setInterval(() => {
    refreshAllPackages().catch(console.error);
  }, INTERVAL_MS);
}

export function stopScheduler() {
  if (schedulerHandle) {
    clearInterval(schedulerHandle);
    schedulerHandle = null;
  }
}

export { refreshAllPackages };
