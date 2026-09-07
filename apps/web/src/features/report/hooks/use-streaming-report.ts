"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { authHeaders } from "@/features/auth/store/auth-store";
import type { ReportRequest, ReportSection } from "@/features/report/types";

type Status = "idle" | "streaming" | "done" | "error";

/**
 * The report, arriving section by section.
 *
 * A mutation-shaped hook rather than a TanStack query because the value is not
 * one response: it is seven, spread over about a minute. What is cached is the
 * finished set, keyed by chart and language, so going back to a reading you
 * already generated does not pay for the model again.
 *
 * `sections` grows as frames land, so the page can render the first one while
 * the seventh is still being written.
 */
export function useStreamingReport(request: ReportRequest | null) {
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const abort = useRef<AbortController | null>(null);

  const key = request
    ? `${request.chart.engine_version}|${request.chart.julian_day}|${request.language ?? "en"}`
    : null;

  const run = useCallback(async () => {
    if (!request || !key) return;

    const cached = CACHE.get(key);
    if (cached) {
      setSections(cached);
      setStatus("done");
      return;
    }

    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;

    setSections([]);
    setStatus("streaming");

    const collected: ReportSection[] = [];
    try {
      const response = await fetch("/api/v1/report/stream", {
        method: "POST",
        signal: controller.signal,
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(request),
      });
      if (!response.ok || !response.body) throw new Error(String(response.status));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line. A partial frame stays in
        // the buffer until the rest of it arrives.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.split("\n").find((l) => l.startsWith("data:"));
          if (!line) continue;

          let event: { type: string; section?: ReportSection };
          try {
            event = JSON.parse(line.slice(5).trim());
          } catch {
            continue;
          }

          if (event.type === "section" && event.section) {
            collected.push(event.section);
            setSections([...collected]);
          } else if (event.type === "error") {
            throw new Error("stream ended early");
          }
        }
      }

      if (collected.length === 0) throw new Error("empty stream");
      CACHE.set(key, collected);
      setStatus("done");
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("report stream failed", err);
      // Whatever arrived stays on screen; the page decides whether that is
      // enough or whether to fall back to its own copy.
      setStatus("error");
    }
  }, [request, key]);

  // Re-runs when the chart or language changes, and never on a bare remount —
  // that is what the key comparison is for.
  const started = useRef<string | null>(null);
  useEffect(() => {
    if (!key || started.current === key) return;
    started.current = key;
    void run();
  }, [key, run]);

  useEffect(() => () => abort.current?.abort(), []);

  const retry = useCallback(() => {
    if (key) CACHE.delete(key);
    started.current = null;
    void run();
  }, [key, run]);

  return {
    sections,
    isPending: status === "streaming" && sections.length === 0,
    isStreaming: status === "streaming",
    isError: status === "error",
    retry,
  };
}

/**
 * Finished reports, by chart and language. A module-level Map rather than
 * TanStack's cache because what is cached here is the assembled result of a
 * stream, which a query client has no shape for.
 */
const CACHE = new Map<string, ReportSection[]>();
