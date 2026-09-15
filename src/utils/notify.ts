// Shared client-side notification-status channel between Dashboard
// (writes, on System Failure click) and SystemFailurePage (reads).
// The actual SMS/call is sent by server/ — never from here.

export const NOTIFY_STORAGE_KEY = 'failure-notify-status';
// Cooldown so rapid re-clicks / back-and-forth navigation can't spam real SMS/calls.
export const NOTIFY_COOLDOWN_MS = 60_000;

export interface NotifyStatus {
  phase: 'sending' | 'retrying' | 'done' | 'error';
  sms: string;
  call: string;
  detail?: string;
  /** current retry attempt (1-based) when phase is 'retrying' */
  attempt?: number;
  at: number;
}

export const NOTIFY_MAX_ATTEMPTS = 3;
export const NOTIFY_RETRY_DELAY_MS = 5000;

export function readNotifyStatus(): NotifyStatus | null {
  try {
    const raw = sessionStorage.getItem(NOTIFY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NotifyStatus;
    // Stale results (older than 10 min) are hidden.
    if (!parsed.at || Date.now() - parsed.at > 10 * 60_000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeNotifyStatus(s: NotifyStatus) {
  try {
    sessionStorage.setItem(NOTIFY_STORAGE_KEY, JSON.stringify(s));
  } catch {
    // storage unavailable — notification still proceeds
  }
}
