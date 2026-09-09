"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useSession } from "@/features/auth/hooks/use-auth";
import { SessionMeter } from "@/features/consultations/components/session-meter";
import { CallPanel } from "@/features/consultations/components/call-panel";
import { useCall } from "@/features/consultations/hooks/use-call";
import { useConsultationSocket } from "@/features/consultations/hooks/use-consultation-socket";
import {
  useConsultation,
  useConsultationAction,
  useMessages,
  useSendMessage,
  useWallet,
} from "@/features/consultations/hooks/use-consultations";
import { useLeaveReview } from "@/features/practitioners/hooks/use-practitioners";
import { assetUrl } from "@/lib/api/client";
import { useTranslation } from "@/lib/i18n/language-context";

/**
 * One consultation: the conversation, and the meter beside it.
 *
 * Which buttons appear is decided by state *and* by which side you are — the
 * practitioner accepts, the seeker cancels, and either may end a running
 * session. Showing a control the server will refuse is how a UI teaches people
 * not to trust it.
 */
export function ConsultationRoom({ id }: { id: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useSession();

  // Read once without the socket to learn the state, then decide whether this
  // consultation is still live enough to warrant a connection.
  const initial = useConsultation(id, false);
  const state = initial.data?.state;
  const live = state === "requested" || state === "accepted" || state === "active";

  // Pushed, not polled. `connected` turns the fallback polling off while it
  // holds, and back on the moment it drops.
  const socket = useConsultationSocket(id, live);
  const socketUp = socket.connected;

  // Signalling rides the same socket: two people talking to each other need no
  // server in the media path, and the socket already knows who is in the room.
  const call = useCall(socket.send, socket.onSignal);

  const consultation = useConsultation(id, live, socketUp);
  const messages = useMessages(id, live, socketUp);
  const wallet = useWallet(state === "active");
  const act = useConsultationAction(id);
  const send = useSendMessage(id);
  const [draft, setDraft] = useState("");

  const feed = useRef<HTMLDivElement>(null);
  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight });
  }, [messages.data?.length]);

  if (!consultation.data) {
    return (
      <AppShell>
        <main className="mx-auto w-full max-w-[900px] px-5 pt-10 sm:px-8">
          <div className="h-[180px] animate-pulse rounded-[12px] border border-white/[0.07] bg-panel" />
        </main>
      </AppShell>
    );
  }

  const c = consultation.data;
  const isPractitioner = user?.id === c.practitioner_user_id;
  const button =
    "rounded-[8px] px-4 py-2 text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40";

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-[900px] px-5 pb-24 pt-8 sm:px-8">
        <button
          type="button"
          onClick={() => router.push("/consultations")}
          className="mb-5 inline-flex items-center gap-2 text-[12.5px] text-mut transition-colors hover:text-fg"
        >
          <ArrowLeft className="size-4" />
          {t.chatTab}
        </button>

        {/* Who this is with, and a way back to their profile — a chat window
            that never names the other person is a text box. */}
        <div className="mb-4 flex items-center gap-3">
          {c.counterpart_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element -- our own upload route.
            <img
              src={assetUrl(c.counterpart_photo_url)}
              alt=""
              className="size-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-acc/[0.12] text-[13px] font-bold text-acc">
              {(c.counterpart_name || "?").charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-fg">
              {c.counterpart_name || t.dashJyotish}
            </p>
            {!isPractitioner && (
              <Link
                href={`/practitioners/${c.profile_id}`}
                className="text-[11.5px] text-acc hover:underline"
              >
                {t.profAbout}
              </Link>
            )}
          </div>
        </div>

        <SessionMeter consultation={c} wallet={wallet.data} />

        {/* A call is only offered while the session is running, because the
            meter is what a call is billed against. */}
        <CallPanel
          call={call}
          medium={(consultation.data?.medium ?? "chat") as "chat" | "voice" | "video"}
          canCall={consultation.data?.state === "active"}
        />

        {live && !socketUp && (
          // Said out loud rather than degrading silently: updates still arrive,
          // just more slowly, and the reader should know which they are getting.
          <p className="mt-2 text-[11.5px] text-dim">{t.consultReconnecting}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {isPractitioner && c.state === "requested" && (
            <>
              <button
                type="button"
                onClick={() => act.mutate("accept")}
                className={`${button} bg-acc text-ink hover:bg-acc2`}
              >
                {t.consultAccept}
              </button>
              <button
                type="button"
                onClick={() => act.mutate("decline")}
                className={`${button} border border-white/12 text-mut hover:border-brd2 hover:text-fg`}
              >
                {t.consultDecline}
              </button>
            </>
          )}

          {!isPractitioner && c.state === "requested" && (
            <>
              <span className="text-[13px] text-dim">{t.consultWaiting}</span>
              <button
                type="button"
                onClick={() => act.mutate("cancel")}
                className={`${button} border border-white/12 text-mut hover:border-brd2 hover:text-fg`}
              >
                {t.consultCancel}
              </button>
            </>
          )}

          {c.state === "accepted" && (
            <button
              type="button"
              onClick={() => act.mutate("connect")}
              disabled={act.isPending}
              className={`${button} bg-acc text-ink hover:bg-acc2`}
            >
              {t.consultStart}
            </button>
          )}

          {c.state === "active" && (
            <button
              type="button"
              onClick={() => act.mutate("end")}
              disabled={act.isPending}
              className={`${button} border border-rose-400/40 text-rose-300 hover:bg-rose-500/10`}
            >
              {t.consultEnd}
            </button>
          )}

          {c.state === "ended" && <span className="text-[13px] text-dim">{t.consultEnded}</span>}
        </div>

        {c.state === "ended" && !isPractitioner && (
          <ReviewForm
            consultationId={c.id}
            practitionerUserId={c.practitioner_user_id}
            done={c.reviewed}
          />
        )}

        {act.isError && (
          <p role="alert" className="mt-3 text-[13px] text-rose-300">
            {/* A 402 here means the wallet cannot fund the minimum session. The
                message from the server says so; adding our own would guess. */}
            {act.error.message}
          </p>
        )}

        <div
          ref={feed}
          className="mt-6 max-h-[46vh] space-y-3 overflow-y-auto rounded-[12px] border border-white/[0.09] bg-panel p-4"
        >
          {messages.data && messages.data.length > 0 ? (
            messages.data.map((message) => {
              const mine = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <span
                    className={`max-w-[76%] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.65] ${
                      mine ? "bg-acc text-ink" : "border border-white/[0.09] bg-app text-fg"
                    }`}
                  >
                    {message.body}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-[12.5px] text-dim">{t.consultPlaceholder}</p>
          )}
        </div>

        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const body = draft.trim();
            if (!body) return;
            send.mutate(body);
            setDraft("");
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={t.consultPlaceholder}
            disabled={c.state === "declined" || c.state === "cancelled"}
            className="min-w-0 flex-1 rounded-[8px] border border-white/[0.09] bg-panel px-3.5 py-2.5 text-[13.5px] text-fg placeholder-faint focus:border-acc/45 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || send.isPending}
            className={`${button} inline-flex items-center gap-1.5 bg-acc text-ink hover:bg-acc2`}
          >
            <Send className="size-3.5" />
            {t.consultSend}
          </button>
        </form>
      </main>
    </AppShell>
  );
}

/**
 * Rate the consultation you just had.
 *
 * Offered only to the seeker, only once, and only after it ended — the same
 * three conditions the server enforces. A form that appears and then 403s is
 * worse than no form.
 */
function ReviewForm({
  consultationId,
  practitionerUserId,
  done,
}: {
  consultationId: string;
  practitionerUserId: string;
  done: boolean;
}) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const review = useLeaveReview(consultationId, practitionerUserId);

  if (done || review.isSuccess) {
    return <p className="mt-4 text-[13px] text-acc2">{t.reviewThanks}</p>;
  }

  return (
    <form
      className="mt-5 rounded-[12px] border border-white/[0.09] bg-panel p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (rating > 0) review.mutate({ rating, body: body.trim() });
      }}
    >
      <p className="text-[14px] font-semibold text-fg">{t.reviewTitle}</p>
      <p className="mt-1 text-[11.5px] text-dim">{t.reviewNote}</p>

      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            aria-label={`${star}/5`}
            aria-pressed={rating === star}
            onClick={() => setRating(star)}
            className="p-0.5"
          >
            <Star
              className={`size-6 transition-colors ${
                star <= rating ? "fill-gold text-acc" : "text-white/20 hover:text-white/40"
              }`}
            />
          </button>
        ))}
      </div>

      <textarea
        rows={2}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={t.reviewPlaceholder}
        maxLength={2000}
        className="mt-3 w-full resize-none rounded-[8px] border border-white/[0.09] bg-app px-3 py-2 text-[13px] leading-[1.7] text-fg placeholder-faint focus:border-acc/45 focus:outline-none"
      />

      {review.isError && (
        <p role="alert" className="mt-2 text-[12.5px] text-rose-300">
          {review.error.message}
        </p>
      )}

      <button
        type="submit"
        disabled={rating === 0 || review.isPending}
        className="mt-3 rounded-[8px] bg-acc px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-40"
      >
        {t.reviewSubmit}
      </button>
    </form>
  );
}
