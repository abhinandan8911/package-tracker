export interface Package {
  id: number;
  aftership_id: string;
  tracking_number: string;
  slug: string;
  carrier_name: string;
  direction: 'incoming' | 'outgoing';
  label: string | null;
  order_id: string | null;
  status_tag: string;
  status_subtag: string | null;
  status_message: string | null;
  origin_country: string | null;
  destination_country: string | null;
  expected_delivery: string | null;
  last_checkpoint_at: string | null;
  last_synced_at: string | null;
  checkpoints_json: string;
  is_archived: number;
  created_at: string;
  updated_at: string;
}

export interface PackageWithCheckpoints extends Omit<Package, 'checkpoints_json'> {
  checkpoints: Checkpoint[];
}

export interface Checkpoint {
  created_at: string;
  message: string;
  location: string | null;
  tag: string;
  subtag: string;
  city: string | null;
  state: string | null;
  country_name: string | null;
}
