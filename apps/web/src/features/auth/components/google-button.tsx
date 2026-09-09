"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

import { useGoogleSignIn } from "@/features/auth/hooks/use-auth";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = "https://accounts.google.com/gsi/client";

/**
 * Minimal surface of Google Identity Services. Typing only what is called is
 * deliberate: a fuller definition would be a second, drifting copy of Google's.
 */
interface GsiCodeResponse {
  code?: string;
  error?: string;
}

interface GsiCodeClient {
  requestCode(): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initCodeClient(config: {
            client_id: string;
            scope: string;
            ux_mode: "popup";
            callback: (response: GsiCodeResponse) => void;
            error_callback?: (error: { type?: string }) => void;
          }): GsiCodeClient;
        };
      };
    };
  }
}

/**
 * "Continue with Google", as our own button.
 *
 * The auth-code popup flow rather than the ID-token one. Google only hands a
 * credential straight to the page from a button it rendered itself — which
 * means its markup, its theme and its type, sitting visibly apart from the
 * form around it. `initCodeClient` can be triggered from any element, so the
 * button is ours and the server redeems the code for the same ID token one
 * exchange later.
 *
 * With no `NEXT_PUBLIC_GOOGLE_CLIENT_ID` set this renders nothing at all. A
 * visible button that cannot work is worse than an absent one — it reads as
 * broken rather than as unavailable, and it is the state every local checkout
 * without the variable would be in.
 */
export function GoogleButton({ onSignedIn }: { onSignedIn: () => void }) {
  const [ready, setReady] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);
  const client = useRef<GsiCodeClient | null>(null);
  const google = useGoogleSignIn();

  // `onSignedIn` is reached from Google's callback, registered once. Through a
  // ref so the registered one is never a stale closure.
  const onSignedInRef = useRef(onSignedIn);
  useEffect(() => {
    onSignedInRef.current = onSignedIn;
  }, [onSignedIn]);

  const signIn = google.mutate;
  const handleCode = useCallback(
    (response: GsiCodeResponse) => {
      // No code and no error is the user closing the popup — not a failure,
      // and not something to show them a message about.
      if (!response.code) return;
      setPopupError(null);
      signIn({ code: response.code }, { onSuccess: () => onSignedInRef.current() });
    },
    [signIn],
  );

  useEffect(() => {
    if (!ready || !CLIENT_ID || !window.google) return;

    client.current = window.google.accounts.oauth2.initCodeClient({
      client_id: CLIENT_ID,
      // openid gets the ID token; email and profile fill in who they are.
      scope: "openid email profile",
      ux_mode: "popup",
      callback: handleCode,
      error_callback: (error) => {
        // A blocked popup is the one failure the user can act on, and it is
        // invisible otherwise — nothing happens when they click.
        if (error?.type === "popup_failed_to_open") {
          setPopupError("Your browser blocked the Google window. Allow popups and try again.");
        }
      },
    });
  }, [ready, handleCode]);

  if (!CLIENT_ID) return null;

  const pending = google.isPending;
  const message = popupError ?? (google.isError ? google.error.message : null);
  // The API attaches `details.reason` only when ENV=local, so this is the real
  // cause during development and absent in production.
  const reason = google.isError ? google.error.details?.reason : null;

  return (
    <div>
      <Script src={GSI_SRC} strategy="afterInteractive" onReady={() => setReady(true)} />

      <button
        type="button"
        disabled={!ready || pending}
        onClick={() => client.current?.requestCode()}
        className="flex w-full items-center justify-center gap-3 rounded-[8px] border border-brd bg-[#181B27] px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:border-brd2 hover:bg-[#1E2230] focus-visible:border-acc focus-visible:outline-none disabled:opacity-60"
      >
        <GoogleGlyph />
        <span>{pending ? "Signing you in…" : "Continue with Google"}</span>
      </button>

      {message && (
        <p role="alert" className="mt-2 text-center text-[13px] text-rose-300">
          {message}
        </p>
      )}

      {reason && (
        <pre className="mt-1.5 whitespace-pre-wrap break-words rounded-[6px] border border-brd bg-[#0C0E15] px-3 py-2 text-left font-mono text-[11px] leading-[1.5] text-mut">
          {reason}
        </pre>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.18 0 10.02 0 12s.46 3.82 1.26 5.42l4.02-3.15z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
    </svg>
  );
}
