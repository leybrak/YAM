export interface User {
  id: string;
  email: string;
  display_name: string;
  couple_id: string | null;
  created_at: string;
}

export type CoupleStatus = "pending" | "linked";

export interface Couple {
  id: string;
  status: CoupleStatus;
  invite_code: string;
  linked_at: string | null;
  members: User[];
}

export interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
}

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
}

export interface Entry {
  id: string;
  entry_date: string;
  title: string | null;
  location_name: string | null;
  weather: string | null;
  song: string | null;
  created_at: string;
  is_unlocked: boolean;
  is_favorite: boolean;
  my_comment: Comment | null;
  partner_comment: Comment | null;
  my_photos: Photo[];
  partner_photos: Photo[];
}

export type NotificationType = "entry_unlocked";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  entry_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AnniversarySummary {
  days_together: number;
  total_entries: number;
  unlocked_entries: number;
  total_photos: number;
  highlight_entries: Entry[];
}

export interface Capsule {
  id: string;
  created_by_user_id: string;
  unlock_date: string;
  title: string;
  created_at: string;
  is_open: boolean;
  content_text: string | null;
  photo_url: string | null;
}
