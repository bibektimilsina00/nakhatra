"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";

import { useGoogleSignIn } from "@/features/auth/hooks/use-auth";
import { Button } from "@/components/ui/button";

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

      <Button
        type="button"
        variant="secondary"
        disabled={!ready || pending}
        onClick={() => client.current?.requestCode()}
        className="w-full"
      >
        <img src="/google-logo.svg" alt="" aria-hidden className="size-4" />
        <span>{pending ? "Signing you in…" : "Continue with Google"}</span>
      </Button>

      {message && (
        <p role="alert" className="mt-2 text-center text-sm text-danger">
          {message}
        </p>
      )}

      {reason && (
        <pre className="mt-1.5 whitespace-pre-wrap break-words rounded-md border border-line-strong bg-surface px-3 py-2 text-left font-mono text-2xs leading-relaxed text-muted">
          {reason}
        </pre>
      )}
    </div>
  );
}

