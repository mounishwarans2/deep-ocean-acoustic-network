/**
 * Minimal in-app navigation trail used ONLY to decide whether a Back button
 * can safely call `navigate(-1)` or must fall back to /dashboard.
 *
 * Browser history itself always performs the navigation — this stack simply
 * mirrors dashboard locations so a Back press never escapes the app (e.g.
 * back to /login) and never dead-ends on a fresh deep link.
 */

const MAX_TRAIL = 50;
const trail: string[] = [];

function isAppPath(path: string): boolean {
  return path === '/dashboard' || path.startsWith('/dashboard/');
}

export function recordAppPath(pathname: string): void {
  if (!isAppPath(pathname)) return;
  const top = trail[trail.length - 1];
  if (top === pathname) return;
  // Browser-back movement: new location matches the entry below the top.
  if (trail.length >= 2 && trail[trail.length - 2] === pathname) {
    trail.pop();
    return;
  }
  trail.push(pathname);
  if (trail.length > MAX_TRAIL) trail.shift();
}

/** True when a previous in-app entry exists for `navigate(-1)` to reach. */
export function canGoBackInApp(): boolean {
  return trail.length >= 2;
}

/** Clear the trail (logout) so Back never returns into a previous session. */
export function resetAppHistory(): void {
  trail.length = 0;
}
