/**
 * The `state` a consent screen hands back.
 *
 * A callback arrives as a plain browser navigation with no bearer token, so
 * this is what proves the connection was started by an admin on the studio
 * page a moment ago. One map for every channel: the values are opaque and the
 * callback that consumes one knows which channel it is.
 *
 * On `globalThis` because the route that mints a state and the callback that
 * checks it are bundled separately — a module-level Map would be one Map per
 * bundle, and every callback would be refused.
 */
const pending = ((globalThis as unknown as { __studioOAuth?: Map<string, number> }).__studioOAuth ??=
  new Map<string, number>());

export function newState(): string {
  const state = crypto.randomUUID();
  pending.set(state, Date.now());
  // Ten minutes is longer than any consent screen takes and shorter than
  // anything worth stealing.
  for (const [s, at] of pending) if (Date.now() - at > 10 * 60_000) pending.delete(s);
  return state;
}

export function takeState(state: string): boolean {
  const ok = pending.has(state);
  pending.delete(state);
  return ok;
}
