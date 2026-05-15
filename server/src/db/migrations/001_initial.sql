CREATE TABLE IF NOT EXISTS packages (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  aftership_id          TEXT NOT NULL UNIQUE,
  tracking_number       TEXT NOT NULL,
  slug                  TEXT NOT NULL,
  carrier_name          TEXT NOT NULL,
  direction             TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  label                 TEXT,
  order_id              TEXT,
  status_tag            TEXT DEFAULT 'Pending',
  status_subtag         TEXT,
  status_message        TEXT,
  origin_country        TEXT,
  destination_country   TEXT,
  expected_delivery     TEXT,
  last_checkpoint_at    TEXT,
  last_synced_at        TEXT,
  checkpoints_json      TEXT DEFAULT '[]',
  is_archived           INTEGER NOT NULL DEFAULT 0,
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_packages_direction    ON packages(direction);
CREATE INDEX IF NOT EXISTS idx_packages_status_tag   ON packages(status_tag);
CREATE INDEX IF NOT EXISTS idx_packages_tracking_num ON packages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_is_archived  ON packages(is_archived);

CREATE TRIGGER IF NOT EXISTS packages_updated_at
  AFTER UPDATE ON packages
  FOR EACH ROW
  BEGIN
    UPDATE packages SET updated_at = datetime('now') WHERE id = OLD.id;
  END;
