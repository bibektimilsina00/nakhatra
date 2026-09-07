"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/features/dashboard/components/app-shell";
import { useSession } from "@/features/auth/hooks/use-auth";
import { SessionMeter } from "@/features/consultations/components/session-meter";
import { useConsultationSocket } from "@/features/consultations/hooks/use-consultation-socket";
import {
  useConsultation,
  useConsultationAction,
  useMessages,
  useSendMessage,
  useWallet,
} from "@/features/consultations/hooks/use-consultations";
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

  // Pushed, not polled. `socketUp` turns the fallback polling off while it
  // holds, and back on the moment it drops.
  const socketUp = useConsultationSocket(id, live);

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
          <div className="h-[180px] animate-pulse rounded-[12px] border border-white/[0.07] bg-card" />
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
          className="mb-5 inline-flex items-center gap-2 text-[12.5px] text-muted transition-colors hover:text-paper"
        >
          <ArrowLeft className="size-4" />
          {t.consultTitle}
        </button>

        <SessionMeter consultation={c} wallet={wallet.data} />

        {live && !socketUp && (
          // Said out loud rather than degrading silently: updates still arrive,
          // just more slowly, and the reader should know which they are getting.
          <p className="mt-2 text-[11.5px] text-faint">{t.consultReconnecting}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {isPractitioner && c.state === "requested" && (
            <>
              <button
                type="button"
                onClick={() => act.mutate("accept")}
                className={`${button} bg-gold text-ink hover:bg-gold2`}
              >
                {t.consultAccept}
              </button>
              <button
                type="button"
                onClick={() => act.mutate("decline")}
                className={`${button} border border-white/12 text-muted hover:border-white/25 hover:text-paper`}
              >
                {t.consultDecline}
              </button>
            </>
          )}

          {!isPractitioner && c.state === "requested" && (
            <>
              <span className="text-[13px] text-faint">{t.consultWaiting}</span>
              <button
                type="button"
                onClick={() => act.mutate("cancel")}
                className={`${button} border border-white/12 text-muted hover:border-white/25 hover:text-paper`}
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
              className={`${button} bg-gold text-ink hover:bg-gold2`}
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

          {c.state === "ended" && <span className="text-[13px] text-faint">{t.consultEnded}</span>}
        </div>

        {act.isError && (
          <p role="alert" className="mt-3 text-[13px] text-rose-300">
            {/* A 402 here means the wallet cannot fund the minimum session. The
                message from the server says so; adding our own would guess. */}
            {act.error.message}
          </p>
        )}

        <div
          ref={feed}
          className="mt-6 max-h-[46vh] space-y-3 overflow-y-auto rounded-[12px] border border-white/[0.09] bg-card p-4"
        >
          {messages.data && messages.data.length > 0 ? (
            messages.data.map((message) => {
              const mine = message.sender_id === user?.id;
              return (
                <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <span
                    className={`max-w-[76%] rounded-[10px] px-3.5 py-2.5 text-[13.5px] leading-[1.65] ${
                      mine ? "bg-gold text-ink" : "border border-white/[0.09] bg-ink text-paper"
                    }`}
                  >
                    {message.body}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="py-8 text-center text-[12.5px] text-faint">{t.consultPlaceholder}</p>
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
            className="min-w-0 flex-1 rounded-[8px] border border-white/[0.09] bg-card px-3.5 py-2.5 text-[13.5px] text-paper placeholder-faint focus:border-gold/45 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!draft.trim() || send.isPending}
            className={`${button} inline-flex items-center gap-1.5 bg-gold text-ink hover:bg-gold2`}
          >
            <Send className="size-3.5" />
            {t.consultSend}
          </button>
        </form>
      </main>
    </AppShell>
  );
}
