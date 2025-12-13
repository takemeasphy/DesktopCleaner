export interface DesktopFile {
  name: string;
  path: string;
  ext: string;
  size_bytes: number;
  last_modified: string;
  last_access: string;

  trash_score?: number;
  trash_reasons?: string[];

  first_seen_at?: string;
  last_seen_at?: string;
  seen_count?: number;

  user_label?: string | null;
  user_category?: string | null;
}
