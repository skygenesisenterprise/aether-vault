import { setSharedCookie, getSharedCookie, deleteSharedCookie } from '@/lib/shared-cookie';

const PROFILE_SELECTED_KEY = 'guilderia_profile_selected';
const SELECTED_PROFILE_NAME_KEY = 'guilderia_selected_profile_name';
const SELECTED_PROFILE_AVATAR_KEY = 'guilderia_selected_profile_avatar';
const SELECTED_PROFILE_ID_KEY = 'guilderia_selected_profile_id';

// Cookie names for cross-subdomain sharing
const PROFILE_SELECTED_COOKIE = 'guilderia_profile_selected';
const PROFILE_ID_COOKIE = 'guilderia_selected_profile_id';
const SELECTED_PROFILE_COOKIE = 'guilderia_selected_profile';

export interface SelectedProfileInfo {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

// ── In-memory cache so `isProfileSelected()` doesn't hit storage on every
//    navigation.  The cache is positive-only (we cache "yes, selected") and
//    expires after CACHE_TTL_MS.  A negative result is NOT cached so that a
//    fresh selection is picked up immediately.
let _cache: boolean | null = null;
let _cacheExpiry = 0;
const CACHE_TTL_MS = 30_000; // 30 seconds

export function isProfileSelected(): boolean {
  if (typeof window === 'undefined') return false;

  // Serve from cache if still valid
  if (_cache !== null && Date.now() < _cacheExpiry) return _cache;

  let result = false;
  try {
    // Check localStorage first (same-origin fast path)
    if (localStorage.getItem(PROFILE_SELECTED_KEY) === 'true') {
      result = true;
    }
    // Fallback to cookie (cross-subdomain path)
    else if (getSharedCookie(PROFILE_SELECTED_COOKIE) === 'true') {
      // Back-fill localStorage so subsequent checks are fast
      try { localStorage.setItem(PROFILE_SELECTED_KEY, 'true'); } catch { /* quota */ }
      result = true;
    }
  } catch {
    // ignore
  }

  // Only cache positive results — negative results stay un-cached so a
  // concurrent setProfileSelected() call is visible immediately.
  if (result) {
    _cache = true;
    _cacheExpiry = Date.now() + CACHE_TTL_MS;
  } else {
    _cache = null;
  }

  return result;
}

export function setProfileSelected(selected: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (selected) {
      localStorage.setItem(PROFILE_SELECTED_KEY, 'true');
      // 30-day cookie for cross-subdomain sharing
      setSharedCookie(PROFILE_SELECTED_COOKIE, 'true', 30 * 24 * 60 * 60);
      _cache = true;
      _cacheExpiry = Date.now() + CACHE_TTL_MS;
    } else {
      localStorage.removeItem(PROFILE_SELECTED_KEY);
      deleteSharedCookie(PROFILE_SELECTED_COOKIE);
      _cache = null;
    }
  } catch {
    // Ignore storage errors
  }
}

export function saveSelectedProfile(profile: SelectedProfileInfo): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SELECTED_PROFILE_ID_KEY, profile.id);
    localStorage.setItem(SELECTED_PROFILE_NAME_KEY, profile.displayName);
    if (profile.avatarUrl) {
      localStorage.setItem(SELECTED_PROFILE_AVATAR_KEY, profile.avatarUrl);
    } else {
      localStorage.removeItem(SELECTED_PROFILE_AVATAR_KEY);
    }
    // Also persist profile id in cookie for cross-subdomain access
    setSharedCookie(PROFILE_ID_COOKIE, profile.id, 30 * 24 * 60 * 60);
    // Persist the full profile so cross-subdomain pages can restore name/avatar
    setSharedCookie(SELECTED_PROFILE_COOKIE, JSON.stringify(profile), 30 * 24 * 60 * 60);
    _notifyListeners();
  } catch {
    // Ignore storage errors
  }
}

export function getSelectedProfile(): SelectedProfileInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    // Cross-subdomain source of truth: the shared cookie always holds the
    // latest selection, no matter which subdomain it was made on. localStorage
    // is per-origin and can go stale (e.g. a previous switch back-filled it).
    const raw = getSharedCookie(SELECTED_PROFILE_COOKIE);
    if (raw) {
      const parsed = JSON.parse(raw) as SelectedProfileInfo;
      if (parsed?.id && parsed?.displayName) {
        // Back-fill localStorage so subsequent reads are fast
        localStorage.setItem(SELECTED_PROFILE_ID_KEY, parsed.id);
        localStorage.setItem(SELECTED_PROFILE_NAME_KEY, parsed.displayName);
        if (parsed.avatarUrl) localStorage.setItem(SELECTED_PROFILE_AVATAR_KEY, parsed.avatarUrl);
        return { id: parsed.id, displayName: parsed.displayName, avatarUrl: parsed.avatarUrl };
      }
    }

    // Fallback when the cookie is absent/expired but localStorage persists
    const id = localStorage.getItem(SELECTED_PROFILE_ID_KEY) ?? getSharedCookie(PROFILE_ID_COOKIE);
    const name = localStorage.getItem(SELECTED_PROFILE_NAME_KEY);
    if (id && name) {
      return {
        id,
        displayName: name,
        avatarUrl: localStorage.getItem(SELECTED_PROFILE_AVATAR_KEY) || undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function clearProfileSelection(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PROFILE_SELECTED_KEY);
    localStorage.removeItem(SELECTED_PROFILE_ID_KEY);
    localStorage.removeItem(SELECTED_PROFILE_NAME_KEY);
    localStorage.removeItem(SELECTED_PROFILE_AVATAR_KEY);
    deleteSharedCookie(PROFILE_SELECTED_COOKIE);
    deleteSharedCookie(PROFILE_ID_COOKIE);
    deleteSharedCookie(SELECTED_PROFILE_COOKIE);
    _cache = null;
    _notifyListeners();
  } catch {
    // Ignore storage errors
  }
}

// ── Profile change listener ────────────────────────────────────────────────
type ProfileChangeCallback = (profile: SelectedProfileInfo | null) => void;
const _listeners: Set<ProfileChangeCallback> = new Set();

function _notifyListeners() {
  const profile = getSelectedProfile();
  for (const cb of _listeners) {
    try { cb(profile); } catch { /* swallow */ }
  }
}

/**
 * Subscribe to profile changes.  The callback fires whenever the selected
 * profile is updated (via `saveSelectedProfile` or `clearProfileSelection`).
 * Returns an unsubscribe function.
 */
export function onProfileChange(callback: ProfileChangeCallback): () => void {
  _listeners.add(callback);
  return () => { _listeners.delete(callback); };
}
