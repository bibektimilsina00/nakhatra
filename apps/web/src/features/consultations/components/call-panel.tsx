"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, TriangleAlert, Video, VideoOff } from "lucide-react";

import type { useCall } from "@/features/consultations/hooks/use-call";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * The call, when there is one.
 *
 * Video is one element per side rather than a grid: this is a consultation,
 * not a meeting, and there are never more than two people. The local view is
 * small and in a corner because nobody needs to watch themselves.
 */
export function CallPanel({
  call,
  medium,
  canCall,
}: {
  call: ReturnType<typeof useCall>;
  medium: "chat" | "voice" | "video";
  /** Only while the session is active — a call is the thing being metered. */
  canCall: boolean;
}) {
  const { t } = useTranslation();
  const { state } = call;
  const video = call.withVideo;
  const remote = useRef<HTMLVideoElement>(null);
  const local = useRef<HTMLVideoElement>(null);

  // Attaching a stream is a DOM assignment, not a render, so it belongs in an
  // effect keyed on the streams the session is holding.
  useEffect(() => {
    if (remote.current) remote.current.srcObject = call.session.remoteStream;
    if (local.current) local.current.srcObject = call.session.localStream;
  }, [call.session, call.state]);

  const round =
    "grid size-11 place-items-center rounded-full transition-colors disabled:opacity-40";

  if (state === "idle") {
    if (!canCall || medium === "chat") return null;
    return (
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="primary" onClick={() => call.session.start(medium === "video")}>
          {medium === "video" ? <Video className="size-4" /> : <Phone className="size-4" />}
          {medium === "video" ? t.callStartVideo : t.callStartVoice}
        </Button>
        {call.warning === "noRelay" && <Warning text={t.callNoRelay} onDismiss={call.session.dismissWarning} />}
        {call.warning === "mic" && <Warning text={t.callNoMic} onDismiss={call.session.dismissWarning} />}
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-line-strong bg-surface">
      {video && state !== "ringing" && (
        <div className="relative aspect-video bg-ink">
          <video
            ref={remote}
            autoPlay
            playsInline
            className="size-full bg-ink object-cover"
          />
          <video
            ref={local}
            autoPlay
            playsInline
            muted
            className="absolute bottom-3 right-3 aspect-video w-32 rounded-md border border-line-strong bg-ink object-cover"
          />
        </div>
      )}

      {/* Voice calls still need the element — it is what plays the audio. */}
      {!video && <video ref={remote} autoPlay playsInline className="hidden" />}

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="text-xs text-muted">
          {state === "calling" && t.callRinging}
          {state === "ringing" && t.callIncoming}
          {state === "connecting" && t.callConnecting}
          {state === "live" && (
            <span className="inline-flex items-center gap-2 text-success">
              <span className="size-1.5 animate-pulse rounded-full bg-success" />
              {t.callLive}
            </span>
          )}
        </span>

        <div className="flex items-center gap-2">
          {state === "ringing" ? (
            <>
              <button
                type="button"
                onClick={call.session.accept}
                aria-label={t.callAnswer}
                className={`${round} bg-success text-white hover:opacity-90`}
              >
                <Phone className="size-4" />
              </button>
              <button
                type="button"
                onClick={call.session.decline}
                aria-label={t.callDecline}
                className={`${round} bg-danger text-white hover:opacity-90`}
              >
                <PhoneOff className="size-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={call.session.toggleMic}
                aria-label={t.callMute}
                aria-pressed={!call.micOn}
                className={`${round} border ${
                  call.micOn
                    ? "border-line-strong text-muted hover:text-ink"
                    : "border-danger/40 bg-danger/10 text-danger"
                }`}
              >
                {call.micOn ? <Mic className="size-4" /> : <MicOff className="size-4" />}
              </button>

              {video && (
                <button
                  type="button"
                  onClick={call.session.toggleCamera}
                  aria-label={t.callCamera}
                  aria-pressed={!call.cameraOn}
                  className={`${round} border ${
                    call.cameraOn
                      ? "border-line-strong text-muted hover:text-ink"
                      : "border-danger/40 bg-danger/10 text-danger"
                  }`}
                >
                  {call.cameraOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => call.session.hangUp()}
                aria-label={t.callEnd}
                className={`${round} bg-danger text-white hover:opacity-90`}
              >
                <PhoneOff className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {call.warning === "noRelay" && (
        <div className="border-t border-line px-4 pb-4">
          <Warning text={t.callNoRelay} onDismiss={call.session.dismissWarning} />
        </div>
      )}
    </div>
  );
}

function Warning({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return (
    <p className="flex items-start gap-2 rounded-md border border-accent/30 bg-accent-wash px-3 py-2 text-xs leading-[1.6] text-accent-ink">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <span className="flex-1">{text}</span>
      <button type="button" onClick={onDismiss} className="shrink-0 text-dim hover:text-ink">
        ✕
      </button>
    </p>
  );
}
