"use client";

import { useState } from "react";

import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/**
 * The human-astrologer marketplace, and its waitlist.
 *
 * TODO: the waitlist needs a `POST /v1/waitlist` endpoint and a table
 * (docs/astrologer-marketplace.md, phase 0). Until that exists this hands
 * the address to a mail client rather than faking a success state — a
 * "thanks, you're on the list" toast that stored nothing would be a lie.
 */
export function AstrologersSection() {
  const m = useMarketing().astrologers;
  const badge = useLatinTracking("uppercase tracking-[0.16em]");
  const label = useLatinTracking("uppercase tracking-[0.2em]");
  const chip = useLatinTracking("uppercase tracking-[0.14em]");
  const [email, setEmail] = useState("");

  const joinWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    const to = "hello@nakhatra.com";
    const subject = encodeURIComponent("Astrologer waitlist");
    const body = encodeURIComponent(`Please tell me when consultations open.\n\n${email}`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
  };

  return (
    <section id="astrologers" className="bg-ink2 py-24">
      <div className="mx-auto max-w-[1360px] px-8">
        <div className="overflow-hidden rounded-[8px] border border-gold/20 bg-gradient-to-br from-card via-card to-ink">
          <div className="grid gap-12 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,.92fr)] lg:gap-16 lg:p-14">
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-[4px] border border-gold/40 px-2.5 py-1 font-mono text-[10px] font-bold text-gold ${badge}`}>{m.badge}</span>
                <span className="text-[13px] text-faint">{m.status}</span>
              </div>
              <h2 className="mt-7 font-disp text-[28px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[36px]">{m.title}</h2>
              <p className="mt-5 text-[15.5px] leading-[1.7] text-muted">{m.body}</p>

              {/* Phase 0 is a waitlist, so the section asks for one. */}
              <div className="mt-9">
                <label htmlFor="wl-email" className={`block font-mono text-[10px] text-gold ${label}`}>{m.waitlistLabel}</label>
                <form onSubmit={joinWaitlist} className="mt-3 flex flex-wrap gap-2.5">
                  <input
                type="email"
                id="wl-email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={m.emailPlaceholder}
                className="min-w-0 flex-1 rounded-[8px] border border-white/12 bg-ink px-4 py-3 text-[14px] text-paper outline-none placeholder:text-faint focus:border-gold/60"
              />
                  <button
                type="submit"
                className="shrink-0 rounded-[8px] bg-gold px-6 py-3 text-[14px] font-semibold text-ink transition hover:bg-gold2"
              >
                {m.submit}
              </button>
                </form>
                <p className="mt-3 text-[12.5px] text-faint">{m.practising}<a href="mailto:hello@nakhatra.com?subject=Astrologer%20application" className="text-muted underline decoration-white/25 underline-offset-4 transition-colors hover:text-gold">{m.apply}</a>.</p>
              </div>
            </div>

            {/* The directory it is describing, drawn. */}
            <div className="rounded-[8px] border border-white/10 bg-ink/60 p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className={`font-mono text-[10px] text-gold ${label}`}>{m.findLabel}</span>
                <span className={`rounded-[4px] border border-white/12 px-1.5 py-0.5 font-mono text-[9px] text-faint ${chip}`}>{m.preview}</span>
              </div>
              <div className="mb-1 flex flex-wrap gap-2">
                <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11.5px] text-gold2">Parashari</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11.5px] text-muted">नेपाली</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11.5px] text-muted">{m.marriage}</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-[11.5px] text-faint">+4</span>
              </div>
              <ul className="mt-3">
                <li className="flex items-center gap-4 border-b border-white/[0.07] py-4 last:border-0">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-ink font-mono text-[12px] text-gold">RS</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-paper">Ram Sharma</span>
                      <svg className="size-3.5 shrink-0 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v6c0 4.4 3.1 7.9 7.5 9 4.4-1.1 7.5-4.6 7.5-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>
                    </div>
                    <div className="mt-1 truncate font-mono text-[10.5px] text-faint">Parashari · 24 yrs · नेपाली · हिन्दी</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1"><svg className="size-3 text-gold" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6-5.9-3.2-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9Z"/></svg><span className="font-mono text-[11.5px] text-paper">4.9</span><span className="font-mono text-[10px] text-faint">(128)</span></div>
                    <div className="mt-1 font-mono text-[10.5px] text-faint">NPR 1,500 / 30 min</div>
                  </div>
                </li>
                <li className="flex items-center gap-4 border-b border-white/[0.07] py-4 last:border-0">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-ink font-mono text-[12px] text-gold">RA</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-paper">Radha Acharya</span>
                      <svg className="size-3.5 shrink-0 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v6c0 4.4 3.1 7.9 7.5 9 4.4-1.1 7.5-4.6 7.5-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>
                    </div>
                    <div className="mt-1 truncate font-mono text-[10.5px] text-faint">KP paddhati · 16 yrs · English · हिन्दी</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1"><svg className="size-3 text-gold" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6-5.9-3.2-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9Z"/></svg><span className="font-mono text-[11.5px] text-paper">4.8</span><span className="font-mono text-[10px] text-faint">(94)</span></div>
                    <div className="mt-1 font-mono text-[10.5px] text-faint">NPR 2,000 / 30 min</div>
                  </div>
                </li>
                <li className="flex items-center gap-4 border-b border-white/[0.07] py-4 last:border-0 opacity-55">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-ink font-mono text-[12px] text-gold">SJ</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-paper">Suresh Joshi</span>
                      <svg className="size-3.5 shrink-0 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v6c0 4.4 3.1 7.9 7.5 9 4.4-1.1 7.5-4.6 7.5-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg>
                    </div>
                    <div className="mt-1 truncate font-mono text-[10.5px] text-faint">Nadi · 31 yrs · English · नेपाली</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end gap-1"><svg className="size-3 text-gold" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.5 2.9 6.1 6.6.9-4.8 4.6 1.2 6.6-5.9-3.2-5.9 3.2 1.2-6.6L2.5 9.5l6.6-.9Z"/></svg><span className="font-mono text-[11.5px] text-paper">4.9</span><span className="font-mono text-[10px] text-faint">(212)</span></div>
                    <div className="mt-1 font-mono text-[10.5px] text-faint">NPR 2,500 / 45 min</div>
                  </div>
                </li>
              </ul>
              <div className="mt-5 flex gap-3 border-t border-white/[0.09] pt-4">
                <span className="mt-px shrink-0 text-gold"><svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg></span>
                <p className="text-[12px] leading-[1.7] text-faint">{m.shareNote}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-x-10 gap-y-9 border-t border-white/[0.09] p-8 sm:p-12 sm:grid-cols-2 lg:grid-cols-4 lg:p-14 lg:pt-12">
            <div>
              <span className="text-gold"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4.5 4.5"/></svg></span>
              <h3 className="mt-3.5 text-[15px] font-semibold text-paper">{m.cards[0].title}</h3>
              <p className="mt-2 text-[13px] leading-[1.7] text-muted">{m.cards[0].body}</p>
            </div>
            <div>
              <span className="text-gold"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a7.5 7.5 0 0 1-10.9 6.7L4 20l1.3-4.1A7.5 7.5 0 1 1 20 12Z"/></svg></span>
              <h3 className="mt-3.5 text-[15px] font-semibold text-paper">{m.cards[1].title}</h3>
              <p className="mt-2 text-[13px] leading-[1.7] text-muted">{m.cards[1].body}</p>
            </div>
            <div>
              <span className="text-gold"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.2 3.5 8.6 8 6.8 9.8a12 12 0 0 0 5.9 5.9L14.5 14l4.5 2.4v3.1a1 1 0 0 1-1.1 1A16.5 16.5 0 0 1 3 5.6a1 1 0 0 1 1-1.1h2.2Z"/></svg></span>
              <h3 className="mt-3.5 text-[15px] font-semibold text-paper">{m.cards[2].title}</h3>
              <p className="mt-2 text-[13px] leading-[1.7] text-muted">{m.cards[2].body}</p>
            </div>
            <div>
              <span className="text-gold"><svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v6c0 4.4 3.1 7.9 7.5 9 4.4-1.1 7.5-4.6 7.5-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg></span>
              <h3 className="mt-3.5 text-[15px] font-semibold text-paper">{m.cards[3].title}</h3>
              <p className="mt-2 text-[13px] leading-[1.7] text-muted">{m.cards[3].body}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
