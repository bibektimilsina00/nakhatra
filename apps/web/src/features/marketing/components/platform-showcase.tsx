"use client";

import { useEffect, useRef, useState } from "react";

import { useLatinTracking, useMarketing } from "@/lib/i18n/language-context";

/**
 * The five things the platform does, each with a preview of what it
 * produces. Cycles on its own until touched — and only while it is on
 * screen, because an invisible section has no business animating.
 */
export function PlatformShowcase() {
  const m = useMarketing().platform;
  const p = useMarketing().preview;
  const refs = useMarketing().reading.entries[2].refs;
  const mil = useMarketing().milan;
  const ch = useMarketing().chart;
  const eyebrow = useLatinTracking("uppercase tracking-[0.22em]");
  const badge = useLatinTracking("uppercase tracking-[0.12em]");
  const label = useLatinTracking("uppercase tracking-[0.2em]");
  const micro = useLatinTracking("uppercase tracking-[0.16em]");
  const stepsRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [touched, setTouched] = useState(false);

  const pick = (i: number) => {
    setTouched(true);
    setActive(i);
  };

  useEffect(() => {
    const el = stepsRef.current;
    if (!el || touched) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer = 0;
    const io = new IntersectionObserver(
      ([e]) => {
        clearInterval(timer);
        if (e.isIntersecting) {
          timer = window.setInterval(() => setActive((i) => (i + 1) % 5), 4200);
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      clearInterval(timer);
      io.disconnect();
    };
  }, [touched]);

  return (
    <section id="pillars" className="py-24">
      <div className="mx-auto max-w-[1360px] px-8">
        <div className="mb-14 max-w-2xl">
          <span className={`font-mono text-[11px] text-gold ${eyebrow}`}>{m.eyebrow}</span>
          <h2 className="mt-4 font-disp text-[30px] font-bold leading-[1.12] tracking-[-0.015em] text-paper sm:text-[38px]">
            {m.title}
          </h2>
          <p className="mt-4 text-[15.5px] leading-[1.7] text-muted">
            {m.sub}
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-16">
          <div ref={stepsRef} className="reveal self-center">
            <button
              type="button"
              className={`pstep flex w-full items-start gap-5 border-l-2 py-4 pl-5 text-left transition ${
                active === 0
                  ? "border-gold bg-gradient-to-r from-gold/[0.07] to-transparent text-paper"
                  : "border-white/[0.09] text-muted hover:border-white/30 hover:bg-white/[0.02] hover:text-paper"
              }`}
              aria-current={active === 0}
              onClick={() => pick(0)}
              onMouseEnter={() => pick(0)}
            >
              <span className="mt-1 font-mono text-[11px] tabular-nums opacity-60">01</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2.5 font-disp text-[16.5px] font-semibold">{m.items[0].title}</span>
                <span className="mt-1.5 block text-[13px] leading-[1.65] text-faint">{m.items[0].body}</span>
              </span>
            </button>
            <button
              type="button"
              className={`pstep flex w-full items-start gap-5 border-l-2 py-4 pl-5 text-left transition ${
                active === 1
                  ? "border-gold bg-gradient-to-r from-gold/[0.07] to-transparent text-paper"
                  : "border-white/[0.09] text-muted hover:border-white/30 hover:bg-white/[0.02] hover:text-paper"
              }`}
              aria-current={active === 1}
              onClick={() => pick(1)}
              onMouseEnter={() => pick(1)}
            >
              <span className="mt-1 font-mono text-[11px] tabular-nums opacity-60">02</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2.5 font-disp text-[16.5px] font-semibold">{m.items[1].title}</span>
                <span className="mt-1.5 block text-[13px] leading-[1.65] text-faint">{m.items[1].body}</span>
              </span>
            </button>
            <button
              type="button"
              className={`pstep flex w-full items-start gap-5 border-l-2 py-4 pl-5 text-left transition ${
                active === 2
                  ? "border-gold bg-gradient-to-r from-gold/[0.07] to-transparent text-paper"
                  : "border-white/[0.09] text-muted hover:border-white/30 hover:bg-white/[0.02] hover:text-paper"
              }`}
              aria-current={active === 2}
              onClick={() => pick(2)}
              onMouseEnter={() => pick(2)}
            >
              <span className="mt-1 font-mono text-[11px] tabular-nums opacity-60">03</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2.5 font-disp text-[16.5px] font-semibold">{m.items[2].title}</span>
                <span className="mt-1.5 block text-[13px] leading-[1.65] text-faint">{m.items[2].body}</span>
              </span>
            </button>
            <button
              type="button"
              className={`pstep flex w-full items-start gap-5 border-l-2 py-4 pl-5 text-left transition ${
                active === 3
                  ? "border-gold bg-gradient-to-r from-gold/[0.07] to-transparent text-paper"
                  : "border-white/[0.09] text-muted hover:border-white/30 hover:bg-white/[0.02] hover:text-paper"
              }`}
              aria-current={active === 3}
              onClick={() => pick(3)}
              onMouseEnter={() => pick(3)}
            >
              <span className="mt-1 font-mono text-[11px] tabular-nums opacity-60">04</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2.5 font-disp text-[16.5px] font-semibold">{m.items[3].title}</span>
                <span className="mt-1.5 block text-[13px] leading-[1.65] text-faint">{m.items[3].body}</span>
              </span>
            </button>
            <button
              type="button"
              className={`pstep flex w-full items-start gap-5 border-l-2 py-4 pl-5 text-left transition ${
                active === 4
                  ? "border-gold bg-gradient-to-r from-gold/[0.07] to-transparent text-paper"
                  : "border-white/[0.09] text-muted hover:border-white/30 hover:bg-white/[0.02] hover:text-paper"
              }`}
              aria-current={active === 4}
              onClick={() => pick(4)}
              onMouseEnter={() => pick(4)}
            >
              <span className="mt-1 font-mono text-[11px] tabular-nums opacity-60">05</span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2.5 font-disp text-[16.5px] font-semibold">{m.items[4].title}<span className={`rounded-[3px] border border-gold/35 px-1.5 py-px font-mono text-[8.5px] font-bold text-gold ${badge}`}>{m.soon}</span></span>
                <span className="mt-1.5 block text-[13px] leading-[1.65] text-faint">{m.items[4].body}</span>
              </span>
            </button>
          </div>

          <div className="reveal relative min-h-[430px] overflow-hidden rounded-[8px] border border-white/10 bg-card/70" data-d="1">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_70%_at_70%_0%,rgba(229,169,60,.07),transparent_70%)]"></div>
            <div
              className="pv absolute inset-0 flex flex-col p-7 sm:p-9"
              style={{ opacity: active === 0 ? 1 : 0, pointerEvents: active === 0 ? "auto" : "none" }}
            >
              <div className="min-h-0 flex-1"><div className="flex h-full items-center gap-8">
                <div className="w-[54%] max-w-[240px] shrink-0"><svg viewBox="-1 -1 102 102" className="w-full">
                  <g fill="none" stroke="#E5A93C" strokeOpacity=".38" strokeWidth=".7">
                    <rect x="0" y="0" width="100" height="100"/><path d="M50 0 L100 50 L50 100 L0 50 Z"/>
                    <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".2"/>
                  </g>
                  <g fill="#E5A93C" fillOpacity=".8" fontSize="4.6" fontFamily="ui-monospace,monospace" textAnchor="middle">
                    <text x="50" y="21">Mo</text><text x="25" y="51">Ju</text><text x="25" y="91">Ke</text>
                    <text x="50" y="81">Su Me</text><text x="75" y="51">Sa</text><text x="75" y="11">Ve Ma Ra</text>
                  </g>
                </svg></div>
                <dl className="min-w-0 flex-1 border-t border-white/[0.08] font-mono text-[11.5px]">
                  <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-2"><dt className="text-faint">{p.lagna}</dt><dd className="tabular-nums text-gold2">{ch.statValues[0]}</dd></div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-2"><dt className="text-faint">{p.nakshatra}</dt><dd className="tabular-nums text-gold2">{ch.statValues[2]}</dd></div>
                  <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.05] py-2"><dt className="text-faint">{p.vargas}</dt><dd className="tabular-nums text-gold2">16</dd></div>
                  <div className="flex items-baseline justify-between gap-3 py-2"><dt className="text-faint">{p.ayanamsa}</dt><dd className="tabular-nums text-gold2">23.514°</dd></div>
                </dl>
              </div></div>
              <a href="#chart" className="mt-6 inline-flex shrink-0 items-center gap-2 self-start text-[13px] font-semibold text-gold transition-colors hover:text-gold2">See a real chart
                <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg></a>
            </div>
            <div
              className="pv absolute inset-0 flex flex-col p-7 sm:p-9"
              style={{ opacity: active === 1 ? 1 : 0, pointerEvents: active === 1 ? "auto" : "none" }}
            >
              <div className="min-h-0 flex-1"><div className="flex h-full flex-col">
                <div className={`font-mono text-[10px] text-gold ${label}`}>{p.sectionOf}</div>
                <h4 className="mt-2.5 font-disp text-[17px] font-bold text-paper">{p.careerTitle}</h4>
                <p className="mt-4 border-l-2 border-gold/50 pl-3.5 text-[13px] font-medium leading-[1.7] text-gold2">{p.careerSummary}</p>
                <p className="mt-4 text-[13px] leading-[1.8] text-muted">{p.careerBody}</p>
                <div className="mt-auto pt-5">
                  <div className={`mb-2.5 font-mono text-[9.5px] text-gold ${label}`}>{p.basedOn}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-[5px] border border-white/10 bg-ink px-2 py-1 text-[11px] text-paper">{p.tenthHouse}</span>
                    <span className="rounded-[5px] border border-white/10 bg-ink px-2 py-1 text-[11px] text-paper">{refs[1]}</span>
                    <span className="rounded-[5px] border border-white/10 bg-ink px-2 py-1 text-[11px] text-paper">{refs[2]}</span>
                  </div>
                </div>
              </div></div>
              <a href="#reading" className="mt-6 inline-flex shrink-0 items-center gap-2 self-start text-[13px] font-semibold text-gold transition-colors hover:text-gold2">Read a sample
                <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg></a>
            </div>
            <div
              className="pv absolute inset-0 flex flex-col p-7 sm:p-9"
              style={{ opacity: active === 2 ? 1 : 0, pointerEvents: active === 2 ? "auto" : "none" }}
            >
              <div className="min-h-0 flex-1"><div className="flex h-full flex-col justify-center gap-3">
                <div className="ml-auto w-fit max-w-[80%] rounded-[8px] bg-gold px-3.5 py-2 text-[13px] leading-snug text-ink">{p.chatQuestion}</div>
                <div className="w-fit max-w-[92%] space-y-2.5 rounded-[8px] border border-white/10 bg-ink px-3.5 py-3">
                  <p className="text-[13px] leading-[1.7] text-muted">{p.chatAnswerA}<strong className="font-semibold text-paper">{p.chatAnswerEm}</strong>{p.chatAnswerB}</p>
                  <div className="flex flex-wrap gap-1.5 border-t border-white/10 pt-2">
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10.5px] text-faint">{p.tenthLord}</span>
                    <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10.5px] text-faint">{refs[2]}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-3 rounded-[8px] border border-white/10 bg-ink px-3.5 py-2.5">
                  <span className="flex h-7 items-center gap-[3px]"><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "6px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "13px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "9px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "20px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "14px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "26px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "11px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "18px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "7px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "15px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "22px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "10px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "16px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "8px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "12px" }}></span><span className="w-[3px] rounded-full bg-gold/70" style={{ height: "5px" }}></span></span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.16em] text-faint">नेपाली</span>
                </div>
              </div></div>
              <a href="#ask" className="mt-6 inline-flex shrink-0 items-center gap-2 self-start text-[13px] font-semibold text-gold transition-colors hover:text-gold2">See how it answers
                <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg></a>
            </div>
            <div
              className="pv absolute inset-0 flex flex-col p-7 sm:p-9"
              style={{ opacity: active === 3 ? 1 : 0, pointerEvents: active === 3 ? "auto" : "none" }}
            >
              <div className="min-h-0 flex-1"><div className="flex h-full flex-col">
                <div className="flex items-center gap-5">
                  <div className="flex-1 text-center"><div className="mx-auto max-w-[92px]"><svg viewBox="-1 -1 102 102" className="w-full">
                    <g fill="none" stroke="#E5A93C" strokeOpacity=".34" strokeWidth="1">
                      <rect x="0" y="0" width="100" height="100"/><path d="M50 0 L100 50 L50 100 L0 50 Z"/>
                      <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".18"/>
                    </g>
                  </svg></div><div className={`mt-2 font-mono text-[9.5px] text-faint ${micro}`}>{mil.bride}</div></div>
                  <div className="shrink-0 text-center">
                    <div className="font-mono text-[38px] font-bold leading-none text-gold">28<span className="text-[17px] text-faint">/36</span></div>
                    <div className={`mt-1.5 font-mono text-[9.5px] text-faint ${micro}`}>{p.guna}</div>
                  </div>
                  <div className="flex-1 text-center"><div className="mx-auto max-w-[92px]"><svg viewBox="-1 -1 102 102" className="w-full">
                    <g fill="none" stroke="#E5A93C" strokeOpacity=".34" strokeWidth="1">
                      <rect x="0" y="0" width="100" height="100"/><path d="M50 0 L100 50 L50 100 L0 50 Z"/>
                      <path d="M0 0 L100 100 M100 0 L0 100" strokeOpacity=".18"/>
                    </g>
                  </svg></div><div className={`mt-2 font-mono text-[9.5px] text-faint ${micro}`}>{mil.groom}</div></div>
                </div>
                <ul className="mt-auto space-y-2.5 border-t border-white/[0.08] pt-5">
                  <li className="flex items-center gap-3 text-[12px]"><span className="w-20 shrink-0 text-muted">{mil.kutaNames[4]}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink"><span className="block h-full rounded-full bg-gold" style={{ width: "100%" }}></span></span><span className="w-9 shrink-0 text-right font-mono text-faint">5/5</span></li><li className="flex items-center gap-3 text-[12px]"><span className="w-20 shrink-0 text-muted">{mil.kutaNames[5]}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink"><span className="block h-full rounded-full bg-gold" style={{ width: "100%" }}></span></span><span className="w-9 shrink-0 text-right font-mono text-faint">6/6</span></li><li className="flex items-center gap-3 text-[12px]"><span className="w-20 shrink-0 text-muted">{mil.kutaNames[6]}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink"><span className="block h-full rounded-full bg-rose-500/70" style={{ width: "0%" }}></span></span><span className="w-9 shrink-0 text-right font-mono text-faint">0/7</span></li><li className="flex items-center gap-3 text-[12px]"><span className="w-20 shrink-0 text-muted">{mil.kutaNames[7]}</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink"><span className="block h-full rounded-full bg-gold" style={{ width: "100%" }}></span></span><span className="w-9 shrink-0 text-right font-mono text-faint">8/8</span></li>
                </ul>
              </div></div>
              <a href="#milan" className="mt-6 inline-flex shrink-0 items-center gap-2 self-start text-[13px] font-semibold text-gold transition-colors hover:text-gold2">Open Milan
                <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg></a>
            </div>
            <div
              className="pv absolute inset-0 flex flex-col p-7 sm:p-9"
              style={{ opacity: active === 4 ? 1 : 0, pointerEvents: active === 4 ? "auto" : "none" }}
            >
              <div className="min-h-0 flex-1"><div className="flex h-full flex-col">
                <div className={`font-mono text-[10px] text-gold ${label}`}>{p.verified}</div>
                <ul className="mt-4">
                  <li className="flex items-center gap-4 border-b border-white/[0.06] py-3.5 last:border-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-ink font-mono text-[11px] text-gold">PS</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[13.5px] font-semibold text-paper">Pandit Sharma<svg className="size-3.5 shrink-0 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v6c0 4.4 3.1 7.9 7.5 9 4.4-1.1 7.5-4.6 7.5-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg></span>
                      <span className="mt-0.5 block truncate font-mono text-[10.5px] text-faint">Parashari · नेपाली · हिन्दी</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-4 border-b border-white/[0.06] py-3.5 last:border-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-ink font-mono text-[11px] text-gold">RA</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[13.5px] font-semibold text-paper">Radha Acharya<svg className="size-3.5 shrink-0 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 4.5 6v6c0 4.4 3.1 7.9 7.5 9 4.4-1.1 7.5-4.6 7.5-9V6L12 3Z"/><path d="m9 12 2.2 2.2L15.5 10"/></svg></span>
                      <span className="mt-0.5 block truncate font-mono text-[10.5px] text-faint">KP paddhati · English · हिन्दी</span>
                    </span>
                  </li>
                  <li className="flex items-center gap-4 border-b border-white/[0.06] py-3.5 last:border-0">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold/25 bg-ink font-mono text-[11px] text-gold">SJ</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[13.5px] font-semibold text-paper">Suresh Joshi</span>
                      <span className="mt-0.5 block truncate font-mono text-[10.5px] text-faint">Nadi · English · नेपाली</span>
                    </span>
                  </li>
                </ul>
                <p className="mt-auto pt-5 text-[12.5px] leading-[1.7] text-faint">{p.illustrative}</p>
              </div></div>
              <a href="#astrologers" className="mt-6 inline-flex shrink-0 items-center gap-2 self-start text-[13px] font-semibold text-gold transition-colors hover:text-gold2">What is coming
                <svg className="size-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 8h11M9 4l4 4-4 4"/></svg></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
