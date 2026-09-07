"use client";

import { useEffect, useRef } from "react";
import { Mic, MicOff, Phone, PhoneOff, TriangleAlert, Video, VideoOff } from "lucide-react";

import type { useCall } from "@/features/consultations/hooks/use-call";
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
        <button
          type="button"
          onClick={() => call.session.start(medium === "video")}
          className="inline-flex items-center gap-2 rounded-[8px] bg-gold px-4 py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-gold2"
        >
          {medium === "video" ? <Video className="size-4" /> : <Phone className="size-4" />}
          {medium === "video" ? t.callStartVideo : t.callStartVoice}
        </button>
        {call.warning === "noRelay" && <Warning text={t.callNoRelay} onDismiss={call.session.dismissWarning} />}
        {call.warning === "mic" && <Warning text={t.callNoMic} onDismiss={call.session.dismissWarning} />}
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-[12px] border border-white/[0.09] bg-card">
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
            className="absolute bottom-3 right-3 aspect-video w-32 rounded-[8px] border border-white/[0.12] bg-ink object-cover"
          />
        </div>
      )}

      {/* Voice calls still need the element — it is what plays the audio. */}
      {!video && <video ref={remote} autoPlay playsInline className="hidden" />}

      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <span className="text-[12.5px] text-muted">
          {state === "calling" && t.callRinging}
          {state === "ringing" && t.callIncoming}
          {state === "connecting" && t.callConnecting}
          {state === "live" && (
            <span className="inline-flex items-center gap-2 text-emerald-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
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
                className={`${round} bg-emerald-500 text-ink hover:bg-emerald-400`}
              >
                <Phone className="size-4" />
              </button>
              <button
                type="button"
                onClick={call.session.decline}
                aria-label={t.callDecline}
                className={`${round} bg-rose-500 text-white hover:bg-rose-400`}
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
                    ? "border-white/12 text-muted hover:text-paper"
                    : "border-rose-400/40 bg-rose-500/10 text-rose-300"
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
                      ? "border-white/12 text-muted hover:text-paper"
                      : "border-rose-400/40 bg-rose-500/10 text-rose-300"
                  }`}
                >
                  {call.cameraOn ? <Video className="size-4" /> : <VideoOff className="size-4" />}
                </button>
              )}

              <button
                type="button"
                onClick={() => call.session.hangUp()}
                aria-label={t.callEnd}
                className={`${round} bg-rose-500 text-white hover:bg-rose-400`}
              >
                <PhoneOff className="size-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {call.warning === "noRelay" && (
        <div className="border-t border-white/[0.07] px-4 pb-4">
          <Warning text={t.callNoRelay} onDismiss={call.session.dismissWarning} />
        </div>
      )}
    </div>
  );
}

function Warning({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return (
    <p className="flex items-start gap-2 rounded-[8px] border border-gold/30 bg-[#1A150B] px-3 py-2 text-[11.5px] leading-[1.6] text-gold2">
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <span className="flex-1">{text}</span>
      <button type="button" onClick={onDismiss} className="shrink-0 text-faint hover:text-paper">
        ✕
      </button>
    </p>
  );
}
