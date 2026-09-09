"use client";

import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/**
 * The AI astrologer, shown as a transcript. Each answer carries its own
 * citations — the section's whole claim is that it shows what it read.
 */
export function AskSection() {
  const m = useMarketing().ask;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");
  const micro = useLatinTracking("uppercase tracking-[0.16em]");

  return (
    <section id="ask" className="py-24">
      <div className="mx-auto max-w-[1360px] px-8">
        <div className="mb-14 max-w-2xl">
          <span className={`font-mono text-[11px] text-gold ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-disp text-[30px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[38px]">{m.title}</h2>
          <p className="mt-4 text-[15.5px] leading-[1.7] text-muted">{m.sub}</p>
        </div>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,.9fr)] lg:gap-16">
          <div className="reveal overflow-hidden rounded-[8px] border border-brd bg-card">
            {/* Who you are talking to, and in what language. */}
            <div className="flex items-center gap-3 border-b border-brd bg-ink/40 px-5 py-3.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-[6px] border border-gold/25 bg-ink">
                <svg viewBox="0 0 100 100" className="size-4 text-gold" fill="none" stroke="currentColor">
                  <g strokeWidth="5" strokeLinejoin="round"><rect x="12" y="12" width="76" height="76" rx="2"/><path d="M50 12 L88 50 L50 88 L12 50 Z"/></g>
                  <path d="M50 12 L69 31 L50 50 L31 31 Z" fill="currentColor" stroke="none"/>
                </svg>
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold leading-tight text-paper">Nakhatra</div>
                <div className="mt-0.5 font-mono text-[10px] leading-tight text-faint">{m.readingLabel}</div>
              </div>
              <span className={`ml-auto flex shrink-0 items-center gap-1.5 font-mono text-[9.5px] text-faint ${micro}`}>
                <span className="size-1.5 rounded-full bg-emerald-400/90"></span>{m.live}
              </span>
            </div>

            <div className="space-y-3.5 p-5 sm:p-6">
              {m.chat.map((turn, i) =>
                !turn.refs ? (
                  <div key={i} className="ml-auto w-fit max-w-[85%] rounded-[8px] rounded-br-[2px] bg-gold px-4 py-2.5 text-[14px] leading-snug text-ink">
                    {turn.text}
                  </div>
                ) : (
                  <div key={i} className="w-fit max-w-[92%] space-y-2.5 rounded-[8px] rounded-bl-[2px] border border-brd bg-ink px-4 py-3">
                    <p className="text-[13.5px] leading-[1.75] text-muted" dangerouslySetInnerHTML={{ __html: turn.text }} />
                    <div className="flex flex-wrap gap-1.5 border-t border-brd pt-2.5">
                      {turn.refs.map((r) => (
                        <span key={r} className="rounded border border-brd px-1.5 py-0.5 font-mono text-[10.5px] text-faint">{r}</span>
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>

            <div className="border-t border-brd bg-ink/30 p-5 sm:p-6">
              <div className="mb-3 flex flex-wrap gap-2">
                <a href="#form" className="rounded-full border border-brd px-3 py-1 text-[12px] text-muted transition-colors hover:border-gold/40 hover:text-paper">{m.chips[0]}</a>
                <a href="#form" className="rounded-full border border-brd px-3 py-1 text-[12px] text-muted transition-colors hover:border-gold/40 hover:text-paper">{m.chips[1]}</a>
                <a href="#form" className="rounded-full border border-brd px-3 py-1 text-[12px] text-muted transition-colors hover:border-gold/40 hover:text-paper">{m.chips[2]}</a>
              </div>
              <div className="flex items-center gap-2 rounded-[8px] border border-brd bg-ink px-4 py-3">
                <span className="flex-1 text-[13.5px] text-faint">{m.placeholder}</span>
                <span className="flex size-7 items-center justify-center rounded-[6px] bg-gold text-ink">
                  <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Each row shows the thing rather than describing it. */}
          <div>
            <div className="divide-y divide-white/[0.07] border-y border-brd">
              <div className="reveal py-7">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-gold"><svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9v6h3l5 4V5L7 9H4Z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19.5 5.5a9 9 0 0 1 0 13"/></svg></span>
                  <h3 className="font-disp text-[16.5px] font-semibold text-paper">{m.readAloudTitle}</h3>
                </div>
                <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted">{m.readAloudBody}</p>
                <div className="mt-4 flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold"><svg className="size-3" viewBox="0 0 12 12" fill="currentColor"><path d="M3 1.5 10 6l-7 4.5Z"/></svg></span>
                  <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-fg/10"><span className="block h-full w-[38%] rounded-full bg-gold"></span></span>
                  <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-faint">04:47 / 12:40</span>
                </div>
              </div>

              <div className="reveal py-7" data-d="1">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-gold"><svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/></svg></span>
                  <h3 className="font-disp text-[16.5px] font-semibold text-paper">{m.speakTitle}</h3>
                </div>
                <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted">{m.speakBody}</p>
                <div className="mt-4 flex items-center gap-3 rounded-[8px] border border-brd bg-ink/50 px-3.5 py-2.5">
                  <span className="flex h-6 items-center gap-[3px]"><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "5px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "11px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "7px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "17px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "12px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "22px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "9px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "15px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "6px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "13px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "19px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "8px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "14px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "7px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "10px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "4px" }}></span></span>
                  <span className={`ml-auto font-mono text-[10px] text-faint ${micro}`}>{m.listening}</span>
                </div>
              </div>

              <div className="reveal py-7" data-d="2">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 text-gold"><svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.7 3.8 5.7 3.8 9S14.5 18.3 12 21c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z"/></svg></span>
                  <h3 className="font-disp text-[16.5px] font-semibold text-paper">{m.languagesTitle}</h3>
                </div>
                <p className="mt-2.5 text-[13.5px] leading-[1.7] text-muted">{m.languagesBody}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-gold/45 bg-gold/10 px-3 py-1 text-[12px] text-gold2">English</span>
                  <span className="rounded-full border border-brd px-3 py-1 text-[12px] text-muted">नेपाली</span>
                  <span className="rounded-full border border-brd px-3 py-1 text-[12px] text-muted">हिन्दी</span>
                </div>
              </div>
            </div>

            {/* The limit is part of the product, so it is stated. */}
            <div className="mt-7 flex gap-3.5 rounded-[8px] border border-brd bg-card/50 p-5">
              <span className="mt-px shrink-0 text-gold"><svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v6c0 4.4 3.1 7.9 7.5 9 4.4-1.1 7.5-4.6 7.5-9V6L12 3Z"/></svg></span>
              <p className="text-[13px] leading-[1.7] text-muted">{m.limits}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
