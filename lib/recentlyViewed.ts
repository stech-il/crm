const KEY = "crm_recently_viewed";
const MAX = 8;

export type RecentItem = { entitySlug: string; recordId: string; title: string };

export function addRecentlyViewed(item: RecentItem) {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(KEY);
  let list: RecentItem[] = raw ? JSON.parse(raw) : [];
  list = list.filter((x) => !(x.entitySlug === item.entitySlug && x.recordId === item.recordId));
  list.unshift(item);
  list = list.slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("recentlyViewedUpdate"));
}

export function getRecentlyViewed(): RecentItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}
