import { api } from "./client";
import type { AnniversarySummary, Capsule, Couple, Entry, Notification, User } from "./types";

export async function registerUser(email: string, password: string, display_name: string) {
  const { data } = await api.post<User>("/api/auth/register", { email, password, display_name });
  return data;
}

export async function loginUser(email: string, password: string) {
  const form = new URLSearchParams();
  form.set("username", email);
  form.set("password", password);
  const { data } = await api.post<{ access_token: string; token_type: string }>(
    "/api/auth/login",
    form,
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  return data;
}

export async function fetchMe() {
  const { data } = await api.get<User>("/api/auth/me");
  return data;
}

export async function createInvite() {
  const { data } = await api.post<{ invite_code: string; status: string }>("/api/couples/invite");
  return data;
}

export async function joinCouple(invite_code: string) {
  const { data } = await api.post<Couple>("/api/couples/join", { invite_code });
  return data;
}

export async function fetchMyCouple() {
  const { data } = await api.get<Couple>("/api/couples/me");
  return data;
}

export async function fetchEntries() {
  const { data } = await api.get<Entry[]>("/api/entries");
  return data;
}

export async function createEntry(payload: {
  entry_date: string;
  title?: string;
  location_name?: string;
  weather?: string;
  song?: string;
}) {
  const { data } = await api.post<Entry>("/api/entries", payload);
  return data;
}

export async function addComment(entryId: string, text: string) {
  const { data } = await api.post<Entry>(`/api/entries/${entryId}/comment`, { text });
  return data;
}

export async function toggleFavorite(entryId: string) {
  const { data } = await api.put<Entry>(`/api/entries/${entryId}/favorite`);
  return data;
}

export async function uploadEntryPhoto(entryId: string, file: File) {
  const { data: presign } = await api.post<{ upload_url: string; storage_key: string }>(
    `/api/entries/${entryId}/photos/presign`,
    null,
    { params: { filename: file.name, content_type: file.type || "image/jpeg" } }
  );
  await fetch(presign.upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type || "image/jpeg" },
    body: file,
  });
  const { data: entry } = await api.post<Entry>(`/api/entries/${entryId}/photos`, {
    storage_key: presign.storage_key,
  });
  return entry;
}

export async function fetchAnniversarySummary() {
  const { data } = await api.get<AnniversarySummary>("/api/entries/summary/anniversary");
  return data;
}

export async function fetchNotifications() {
  const { data } = await api.get<Notification[]>("/api/notifications");
  return data;
}

export async function fetchUnreadNotificationCount() {
  const { data } = await api.get<{ count: number }>("/api/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id: string) {
  const { data } = await api.put<Notification>(`/api/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  await api.put("/api/notifications/read-all");
}

export async function fetchCapsules() {
  const { data } = await api.get<Capsule[]>("/api/capsules");
  return data;
}

export async function createCapsule(payload: {
  unlock_date: string;
  title: string;
  content_text?: string;
}) {
  const { data } = await api.post<Capsule>("/api/capsules", payload);
  return data;
}

export async function openCapsule(capsuleId: string) {
  const { data } = await api.put<Capsule>(`/api/capsules/${capsuleId}/open`);
  return data;
}
