/**
 * Runs once when the server starts. The studio's clock lives here because
 * a `setInterval` in a route module only exists once that route has been
 * hit — and an unattended morning render is exactly the case where it has
 * not been.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startClock } = await import("@/lib/studio");
    startClock();
  }
}
