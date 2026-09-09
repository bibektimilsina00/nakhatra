"use client";

import { useState, useEffect, useRef } from "react";

import { authHeaders } from "@/features/auth/store/auth-store";
import { useStreamingReport } from "@/features/report/hooks/use-streaming-report";
import { ReportSectionCard } from "@/features/report/components/report-section-card";
import { SectionIcon } from "@/features/report/components/section-icon";
import { useRouter } from "next/navigation";
import { exportElementToPdf } from "@/lib/utils/pdf-exporter";
import { DashaChakra } from "@/features/kundali/components/dasha-chakra";
import { NorthIndianChart } from "@/features/kundali/components/north-indian-chart";
import { PatroHead } from "@/features/kundali/components/patro-head";
import { SouthIndianChart } from "@/features/kundali/components/south-indian-chart";
import { loadKundaliFromStorage } from "@/features/kundali/store/kundali-store";
import type { Chart, BirthDetailsIn } from "@/features/kundali/types";
import type { ReportSection } from "@/features/report/types";
import {
  speakText,
  isPaused,
  pauseSpeech,
  resumeSpeech,
  stopSpeech,
  seekAudioBy,
  seekAudioToPercent,
  setPlaybackRate,
} from "@/lib/utils/audio-speaker";
import { OptionMenu } from "@/components/ui/option-menu";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { ChartSwitcher } from "@/features/kundali/components/chart-switcher";
import { currentDasha, useToday } from "@/features/kundali/dasha";
import { GeneratingScreen } from "@/features/kundali/components/generating-screen";
import { ReadingSkeleton, ReadingStatus } from "@/features/report/components/reading-status";
import { ASTROLOGER_VOICES } from "@/lib/constants/voices";

import { generateDynamicAstrologyReport } from "@/features/kundali/api/report-generator";
import { useTranslation, type Language } from "@/lib/i18n/language-context";
import { CustomVoiceSelector } from "@/features/voice/components/voice-selector";
import {
  ArrowLeft,
  Download,
  Share2,
  Sparkles,
  Clock,
  MessageSquareText,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Orbit,
  Gem,
  Activity,
} from "lucide-react";

import {
  toLocalizedDigit,
  getPlanetName,
  getPlanetAbbrev,
  getSignName,
  getNakshatraName,
  getAvakhadaTerm,
  getLocalizedAuspiciousElements,
} from "@/lib/i18n/vedic-translations";
import {
  trackAudioDownloaded,
  trackAudioPlayed,
  trackPdfDownloaded,
  trackShareClicked,
} from "@/lib/utils/analytics";

function formatAudioTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fmtDeg(deg: number, lang: Language = "en"): string {
  const d = Math.floor(deg);
  const mFull = (deg - d) * 60;
  const m = Math.floor(mFull);
  const s = Math.round((mFull - m) * 60);
  const formatted = `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(2, "0")}"`;
  return toLocalizedDigit(formatted, lang);
}

function getAuspiciousElements(lagnaSign: string) {
  const map: Record<string, { luckyColors: string; unluckyColors: string; luckyGemstones: string; unluckyGemstones: string }> = {
    Aries: {
      luckyColors: "Red, Saffron, Yellow, Golden & White.",
      unluckyColors: "Black, Dark Blue & Dull Grey.",
      luckyGemstones: "Red Coral (Moonga), Yellow Sapphire (Pukhraj) & Ruby (Manikya).",
      unluckyGemstones: "Blue Sapphire (Neelam) & Diamond (Hira).",
    },
    Taurus: {
      luckyColors: "White, Off-White, Pink, Light Blue & Green.",
      unluckyColors: "Red, Crimson & Dark Yellow.",
      luckyGemstones: "Diamond (Hira), White Sapphire & Emerald (Panna).",
      unluckyGemstones: "Ruby (Manikya) & Red Coral (Moonga).",
    },
    Gemini: {
      luckyColors: "Light Green, Emerald, Yellow, White & Sky Blue.",
      unluckyColors: "Deep Red, Scarlet & Dark Orange.",
      luckyGemstones: "Emerald (Panna), Diamond (Hira) & Blue Sapphire (Neelam).",
      unluckyGemstones: "Red Coral (Moonga) & Ruby (Manikya).",
    },
    Cancer: {
      luckyColors: "White, Silver, Cream, Sea Green & Soft Yellow.",
      unluckyColors: "Black, Dark Charcoal & Deep Grey.",
      luckyGemstones: "Pearl (Moti), Red Coral (Moonga) & Yellow Sapphire (Pukhraj).",
      unluckyGemstones: "Blue Sapphire (Neelam) & Diamond (Hira).",
    },
    Leo: {
      luckyColors: "Gold, Orange, Saffron, Bright Red & Light Yellow.",
      unluckyColors: "Black, Navy Blue & Dark Grey.",
      luckyGemstones: "Ruby (Manikya), Red Coral (Moonga) & Yellow Sapphire (Pukhraj).",
      unluckyGemstones: "Diamond (Hira) & Blue Sapphire (Neelam).",
    },
    Virgo: {
      luckyColors: "Green, Olive, White, Light Yellow & Sky Blue.",
      unluckyColors: "Fiery Red & Deep Scarlet.",
      luckyGemstones: "Emerald (Panna), Diamond (Hira) & White Sapphire.",
      unluckyGemstones: "Red Coral (Moonga) & Ruby (Manikya).",
    },
    Libra: {
      luckyColors: "White, Pastel Pink, Sky Blue, Royal Blue & Turquoise.",
      unluckyColors: "Deep Yellow, Ochre & Crimson.",
      luckyGemstones: "Diamond (Hira), Opal & Blue Sapphire (Neelam).",
      unluckyGemstones: "Ruby (Manikya) & Yellow Sapphire (Pukhraj).",
    },
    Scorpio: {
      luckyColors: "Dark Red, Maroon, Saffron, Yellow & Orange.",
      unluckyColors: "Black, Deep Navy & Dark Green.",
      luckyGemstones: "Red Coral (Moonga), Yellow Sapphire (Pukhraj) & Pearl (Moti).",
      unluckyGemstones: "Diamond (Hira) & Emerald (Panna).",
    },
    Sagittarius: {
      luckyColors: "Yellow, Golden, Saffron, Light Orange & White.",
      unluckyColors: "Black, Dark Blue & Charcoal.",
      luckyGemstones: "Yellow Sapphire (Pukhraj), Ruby (Manikya) & Red Coral (Moonga).",
      unluckyGemstones: "Diamond (Hira) & Blue Sapphire (Neelam).",
    },
    Capricorn: {
      luckyColors: "Royal Blue, Navy Blue, Black, Dark Green & Grey.",
      unluckyColors: "Bright Red, Scarlet & Crimson.",
      luckyGemstones: "Blue Sapphire (Neelam), Diamond (Hira) & Emerald (Panna).",
      unluckyGemstones: "Ruby (Manikya) & Red Coral (Moonga).",
    },
    Aquarius: {
      luckyColors: "Electric Blue, Cyan, Black, Dark Blue & White.",
      unluckyColors: "Bright Red, Crimson & Deep Yellow.",
      luckyGemstones: "Blue Sapphire (Neelam), Emerald (Panna) & Diamond (Hira).",
      unluckyGemstones: "Ruby (Manikya) & Red Coral (Moonga).",
    },
    Pisces: {
      luckyColors: "Yellow, Golden, Cream, White & Light Pink.",
      unluckyColors: "Black, Dark Blue & Charcoal.",
      luckyGemstones: "Yellow Sapphire (Pukhraj), Pearl (Moti) & Red Coral (Moonga).",
      unluckyGemstones: "Diamond (Hira) & Blue Sapphire (Neelam).",
    },
  };

  return map[lagnaSign] || map.Cancer;
}

/** The rate each option actually sets, and the label the reader sees. */
const SPEED_RATES = { "1x": 1.0, "1.2x": 1.2, "1.5x": 1.5 } as const;
const PLAYBACK_SPEEDS = [
  { value: "1x" as const, label: "1.0x" },
  { value: "1.2x" as const, label: "1.2x" },
  { value: "1.5x" as const, label: "1.5x" },
];

export function ReadingDashboard() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const today = useToday();
  const [chartStyle, setChartStyle] = useState<"north" | "south">("north");
  const [chartType, setChartType] = useState<"D1" | "D9">("D1");
  const [selectedHouse, setSelectedHouse] = useState<number | null>(10);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<"1x" | "1.2x" | "1.5x">("1x");
  const [selectedVoice, setSelectedVoice] = useState<string>("onyx");
  const [activeCategory, setActiveCategory] = useState("all");
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showFullPlanets, setShowFullPlanets] = useState(false);
  const [audioDebugText, setAudioDebugText] = useState<string>("");
  const [audioSource, setAudioSource] = useState<string>("");
  const pdfReportRef = useRef<HTMLDivElement>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  const handleDownloadPdf = async () => {
    if (!pdfReportRef.current) return;
    setIsExportingPdf(true);
    showToast(t.pdfGenerating);
    trackPdfDownloaded(language);
    try {
      await exportElementToPdf(pdfReportRef.current, `${activeBirth.name}_Complete_Janma_Kundali.pdf`);
      showToast(language === "en" ? "PDF report downloaded successfully!" : "पीडीएफ रिपोर्ट डाउनलोड भयो!");
    } catch (err) {
      console.error("PDF export error:", err);
      showToast(language === "en" ? "Failed to generate PDF" : "पीडीएफ निर्माण त्रुटि");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleSharePage = async () => {
    trackShareClicked("page");
    const title = `${activeBirth.name}'s Complete Janma Kundali Reading`;
    const text = `Explore the full Vedic Astrology Kundali report for ${activeBirth.name}.`;
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast(language === "en" ? "Reading page link copied to clipboard!" : "कुण्डली लिङ्क प्रतिलिपि गरियो!");
    } catch (e) {
      showToast(url);
    }
  };

  const handleDownloadAudio = async () => {
    showToast(language === "en" ? "Preparing audio download..." : "अडियो डाउनलोड तयार गर्दै...");
    const textToRead = reportSections
      .map((s) => `${s.title}. ${s.summary}... ${s.content?.[0] || ""}`)
      .join(" ... ");
    try {
      const res = await fetch("/api/v1/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          text: textToRead,
          language,
          voice: selectedVoice,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.audio_url) {
          const a = document.createElement("a");
          a.href = `/api${data.audio_url}`;
          a.download = `${activeBirth.name}_Kundali_Audio.mp3`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          trackAudioDownloaded(selectedVoice, language);
          showToast(language === "en" ? "Audio downloaded successfully!" : "अडियो डाउनलोड भयो!");
          return;
        }
      }
      showToast(language === "en" ? "Audio file ready." : "अडियो तयार भयो।");
    } catch (e) {
      console.error("Audio download error:", e);
      showToast(language === "en" ? "Audio download error" : "अडियो डाउनलोड त्रुटि");
    }
  };

  const handleShareAudio = async () => {
    trackShareClicked("audio");
    const title = `${activeBirth.name}'s Kundali Audio Reading`;
    const text = `Listen to ${activeBirth.name}'s Vedic Astrology Audio Reading.`;
    const url = window.location.href;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {}
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast(language === "en" ? "Audio link copied to clipboard!" : "अडियो लिङ्क प्रतिलिपि गरियो!");
    } catch (e) {
      showToast(url);
    }
  };

  // Placeholder for the single render before the redirect below fires. It used
  // to be a real person's name and birth date, committed to the repository and
  // shown to every visitor as their own chart (CLAUDE.md rule 9). Its `time` was
  // also "07:30 PM", which `BirthDetailsIn` rejects — so the default chart fetch
  // that relied on it had been 422ing silently.
  const [activeBirth, setActiveBirth] = useState<BirthDetailsIn>({
    name: "",
    date: "1900-01-01",
    time: "00:00",
    tz_name: "UTC",
    latitude: 0,
    longitude: 0,
    place_label: "",
    time_accuracy: "exact",
    siddhanta: "surya",
  });

  const [activeChart, setActiveChart] = useState<Chart | null>(null);

  useEffect(() => {
    const stored = loadKundaliFromStorage();
    if (stored) {
      setActiveBirth(stored.birth);
      setActiveChart(stored.chart);
    } else {
      // Nothing chosen — ask, rather than reading somebody else's chart.
      // Previously this computed a chart for hardcoded sample birth data and
      // presented it as the visitor's own reading.
      router.replace("/reading/choose");
    }
  }, []);

  // Streamed, not awaited: the model takes about a minute to write seven
  // sections, and there is no reason to hold all seven back until the last one
  // lands. Each arrives the moment it is finished.
  const report = useStreamingReport(
    activeChart ? { chart: activeChart, birth: activeBirth, language } : null,
  );

  // The deterministic reading, used only when the request fails outright.
  // Duplicates `modules/report/generator.py`; `report-generator.test.ts` and
  // `test_report_generator.py` pin both copies to the same fixtures so they
  // cannot drift apart silently.
  // No useMemo: the React Compiler is enabled for this project and memoises
  // this itself. A hand-written one it cannot verify makes it bail out of
  // optimising the whole component, which is worse than not writing it.
  const localReport = activeChart
    ? generateDynamicAstrologyReport(activeChart, activeBirth, language)
    : [];

  // Derived, not stored. This used to paint `localReport` immediately and swap
  // the model's in behind it — which made a model that had been failing for
  // weeks look identical to one that worked. Now nothing is shown until the
  // request settles, and the local copy is a failure path, not a first frame.
  // Whatever has streamed in so far. The deterministic copy is used only when
  // the stream failed before producing anything — partial output is real output
  // and is better than swapping it for a different reading mid-read.
  const reportSections: ReportSection[] =
    report.sections.length > 0
      ? report.sections
      : report.isError
        ? localReport
        : [];

  const filterCategory = (id: string) => {
    setActiveCategory(id);
  };

  const visibleSections = activeCategory === "all"
    ? reportSections
    : reportSections.filter((s) => s.id === activeCategory);

  if (!activeChart) {
    return (
      <AppShell sidebar={false}>
        <GeneratingScreen />
      </AppShell>
    );
  }

  const d9Varga = activeChart.vargas?.find((v) => v.code === "D9");
  const d9Chart: Chart = d9Varga
    ? ({
        lagna_sign_index: d9Varga.lagna_sign_index,
        lagna_sign: d9Varga.lagna_sign ?? "Cancer",
        lagna_degree: 0,
        houses: Array.from({ length: 12 }, (_, i) => ({
          number: i + 1,
          sign: "",
          sign_index: (d9Varga.lagna_sign_index + i) % 12,
          lord: "",
          occupants: [],
        })),
        planets: d9Varga.placements.map((p) => ({
          name: p.planet,
          house: p.house,
          degree_in_sign: 0,
          sign: "",
          sign_index: 0,
          retrograde: false,
          combust: false,
          avastha: "",
          dignity: null,
        })),
      } as unknown as Chart)
    : activeChart;

  const chartToRender = chartType === "D1" ? activeChart : d9Chart;

  const selectedHouseObj = selectedHouse
    ? chartToRender.houses.find((h) => h.number === selectedHouse)
    : null;

  const houseOccupants = selectedHouse
    ? chartToRender.planets.filter((p) => p.house === selectedHouse)
    : [];

  // The periods running today. This was `periods[0]` and `periods[1]` — the
  // first two mahadashas from birth, the second mislabelled as an antardasha —
  // with a hardcoded "Rahu ➔ Jupiter" when the chart had none at all, which is
  // a sentence about a chart nobody owns.
  const running = currentDasha(activeChart, today);
  const todayMs = today ? new Date(today).getTime() : 0;
  const currentDashaText = running.maha
    ? `${getPlanetName(running.maha.lord, language)} ${t.mahadashaLabel}` +
      (running.antar ? ` ➔ ${getPlanetName(running.antar.lord, language)} ${t.antardashaLabel}` : "")
    : t.noActiveDasha;

  return (
    <AppShell
      sidebar={false}
      // One bar, not two: the way back, whose chart this is, and which chart —
      // in the app bar itself, where the search would otherwise sit.
      bar={
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t.readingBack}
            className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-white/10 text-muted transition-colors hover:border-white/25 hover:text-paper"
          >
            <ArrowLeft className="size-4" />
          </button>
          {/* Arriving from the sidebar reads whatever chart was opened last, so
              the title says which one and doubles as the way to change it. */}
          <ChartSwitcher
            activeName={activeBirth.name}
            onSelect={(birth, chart) => {
              setActiveBirth(birth);
              setActiveChart(chart);
            }}
            trigger={
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-paper">
                  {activeBirth.name}&apos;s Kundali
                </span>
                <span className="block truncate text-[11px] text-faint">
                  {activeBirth.date} · {activeBirth.time} · {activeBirth.place_label.split("(")[0]}
                </span>
              </span>
            }
          />
        </div>
      }
    >
      {/* Main Two-Column Desktop Layout */}
      <main className="mx-auto w-full max-w-[1600px] px-6 lg:px-10 py-6">
        <ReadingStatus
          isPending={report.isPending}
          isError={report.isError && report.sections.length === 0}
          source={undefined}
          onRetry={report.retry}
        />

        <div className="grid gap-8 lg:grid-cols-[460px_minmax(0,1fr)] xl:grid-cols-[500px_minmax(0,1fr)] lg:items-start">
          
          {/* LEFT COLUMN (Wider layout) - Fixed/Sticky on Scroll with Dual Charts */}
          <aside className="space-y-6 lg:sticky lg:top-20 max-h-[calc(100vh-100px)] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {/* 1. Dual Kundali Charts Widget (D1 Lagna & D9 Navamsha) */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <h2 className="font-serif text-sm font-bold text-[#F8FAFC]">{t.kundaliChartsTitle}</h2>
                  <p className="text-[11px] text-[#94A3B8]">{t.kundaliChartsSub}</p>
                </div>
                
                {/* North / South Toggle & Header Quick Action Icons */}
                <div className="flex items-center gap-2">
                  <div className="flex rounded-[8px] border border-white/10 bg-[#090A10] p-0.5 text-[10px]">
                    <button
                      onClick={() => setChartStyle("north")}
                      className={`rounded-[6px] px-2.5 py-1 font-bold transition ${
                        chartStyle === "north" ? "bg-[#E5A93C] text-[#090A10]" : "text-[#94A3B8]"
                      }`}
                    >
                      North
                    </button>
                    <button
                      onClick={() => setChartStyle("south")}
                      className={`rounded-[6px] px-2.5 py-1 font-bold transition ${
                        chartStyle === "south" ? "bg-[#E5A93C] text-[#090A10]" : "text-[#94A3B8]"
                      }`}
                    >
                      South
                    </button>
                  </div>

                  <div className="flex items-center gap-1 border-l border-white/10 pl-2">
                    <button
                      onClick={handleDownloadPdf}
                      disabled={isExportingPdf}
                      title={isExportingPdf ? t.pdfGenerating : t.downloadPdf}
                      aria-label={t.downloadPdf}
                      className="group flex size-7 items-center justify-center rounded-[6px] border border-[#E5A93C]/40 bg-[#090A10] text-[#E5A93C] transition-all duration-200 hover:bg-[#E5A93C] hover:text-[#090A10] disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="size-3.5 transition-transform duration-200 group-hover:scale-110" />
                    </button>
                    <button
                      onClick={handleSharePage}
                      title={t.shareReading}
                      aria-label={t.shareReading}
                      className="group flex size-7 items-center justify-center rounded-[6px] border border-white/10 bg-[#090A10] text-[#94A3B8] transition-all duration-200 hover:border-[#E5A93C] hover:text-[#F3C766] cursor-pointer"
                    >
                      <Share2 className="size-3.5 transition-transform duration-200 group-hover:scale-110" />
                    </button>
                  </div>
                </div>
              </div>

              {/* The head of the janma patrika — inside the widget, exactly
                  where the scroll puts it: invocation, mangala shlokas and the
                  filled sankalpa immediately before the lagna chart. Collapsed
                  behind its invocation line until asked to unroll. */}
              <PatroHead chart={activeChart} birth={activeBirth} collapsible />

              {/* D1 Lagna Chart Display */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F3C766]">{t.d1LagnaChartTitle}</span>
                  <span className="text-[10px] text-[#94A3B8]">
                    {t.ascendantLabel}: {getSignName(activeChart.lagna_sign, language)} ({toLocalizedDigit(activeChart.lagna_sign_index + 1, language)})
                  </span>
                </div>
                <div className="relative mx-auto w-full flex items-center justify-center">
                  {chartStyle === "north" ? (
                    <NorthIndianChart
                      chart={activeChart}
                      selectedHouse={selectedHouse}
                      onSelectHouse={(h) => setSelectedHouse((prev) => (prev === h ? null : h))}
                    />
                  ) : (
                    <SouthIndianChart
                      chart={activeChart}
                      selectedHouse={selectedHouse}
                      onSelectHouse={(h) => setSelectedHouse((prev) => (prev === h ? null : h))}
                    />
                  )}
                </div>
              </div>

              {/* D9 Navamsha Chart Display */}
              <div className="space-y-2 border-t border-white/10 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#F3C766]">{t.d9NavamshaChartTitle}</span>
                  <span className="text-[10px] text-[#94A3B8]">
                    {t.ascendantLabel}: {getSignName(d9Chart.lagna_sign || activeChart.lagna_sign, language)} ({toLocalizedDigit((d9Chart.lagna_sign_index !== undefined ? d9Chart.lagna_sign_index : activeChart.lagna_sign_index) + 1, language)})
                  </span>
                </div>
                <div className="relative mx-auto w-full flex items-center justify-center">
                  {chartStyle === "north" ? (
                    <NorthIndianChart
                      chart={d9Chart}
                      selectedHouse={selectedHouse}
                      onSelectHouse={(h) => setSelectedHouse((prev) => (prev === h ? null : h))}
                    />
                  ) : (
                    <SouthIndianChart
                      chart={d9Chart}
                      selectedHouse={selectedHouse}
                      onSelectHouse={(h) => setSelectedHouse((prev) => (prev === h ? null : h))}
                    />
                  )}
                </div>
              </div>

              {/* House Detail Inspector Card */}
              {selectedHouseObj ? (
                <div className="rounded-[8px] border border-[#E5A93C]/40 bg-[#090A10] p-3 text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5 font-bold">
                    <span className="text-[#F3C766]">
                      {t.houseLabel} {toLocalizedDigit(selectedHouseObj.number, language)} · {getSignName(selectedHouseObj.sign || "House", language)}
                    </span>
                    <span className="text-[#94A3B8]">
                      {selectedHouseObj.lord ? `${t.lordLabel}: ${getPlanetName(selectedHouseObj.lord, language)}` : ""}
                    </span>
                  </div>
                  {houseOccupants.length === 0 ? (
                    <p className="text-[11px] text-[#94A3B8] italic">
                      {language === "ne"
                        ? `भाव ${toLocalizedDigit(selectedHouseObj.number, language)} मा कुनै ग्रह छैन।`
                        : language === "hi"
                        ? `भाव ${toLocalizedDigit(selectedHouseObj.number, language)} में कोई ग्रह नहीं है।`
                        : `No planets located in house ${selectedHouseObj.number}.`}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {houseOccupants.map((p: any) => (
                        <div key={p.name} className="flex justify-between items-center text-[11px]">
                          <span className="font-semibold text-[#F8FAFC]">
                            {getPlanetName(p.name, language)} {p.retrograde && <span className="text-[#E5A93C]">{language === "en" ? "℞" : " (व)"}</span>}
                          </span>
                          <span className="text-[#F3C766]">{p.degree_in_sign ? fmtDeg(p.degree_in_sign, language) : ""}</span>
                          <span className="text-[#94A3B8] uppercase text-[9px]">{p.dignity ?? p.avastha}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-[11px] text-[#94A3B8]">
                  {t.tapHouseHelper}
                </p>
              )}

            </div>

            {/* 2. Avakhada Chakra Panel */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#E5A93C]" /> {t.avakhadaTitle}
                </h3>
              </div>

              {/* Highlighted Current Dasha Banner in Left Panel */}
              <div className="flex items-center justify-between rounded-[8px] border border-[#E5A93C]/30 bg-[#090A10] px-3 py-2 text-xs font-semibold text-[#F3C766]">
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-[#E5A93C]" />
                  <span>{t.currentDasha}:</span>
                </div>
                <span className="font-bold text-[#F8FAFC]">{currentDashaText}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#CBD5E1]">{t.moonSignLabel}</span>
                  <span className="font-bold text-[#F8FAFC]">{getSignName(activeChart.avakhada?.sign || "Sagittarius", language)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#CBD5E1]">{t.nakshatraLabel}</span>
                  <span className="font-bold text-[#F3C766]">{getNakshatraName(activeChart.avakhada?.nakshatra || "Moola", language)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#CBD5E1]">{t.nakshatraPadaLabel}</span>
                  <span className="font-bold text-[#F8FAFC]">
                    {language === "en" ? "Pada " : "चरण "}{toLocalizedDigit(activeChart.avakhada?.charan || 2, language)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#CBD5E1]">{t.nameSyllableLabel}</span>
                  <span className="font-bold text-[#F3C766]">{activeChart.avakhada?.name_syllable || "Yo"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#CBD5E1]">{t.ganaLabel}</span>
                  <span className="font-bold text-[#F8FAFC]">{getAvakhadaTerm(activeChart.avakhada?.gana || "Rakshasa", language)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#CBD5E1]">{t.nadiLabel}</span>
                  <span className="font-bold text-[#F8FAFC]">{getAvakhadaTerm(activeChart.avakhada?.nadi || "Adi", language)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#CBD5E1]">{t.yoniLabel}</span>
                  <span className="font-bold text-[#F8FAFC]">{getAvakhadaTerm(activeChart.avakhada?.yoni || "Rat", language)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-[#CBD5E1]">{t.varnaElementLabel}</span>
                  <span className="font-bold text-[#F8FAFC]">
                    {getAvakhadaTerm(activeChart.avakhada?.varna || "Kshatriya", language)} · {getAvakhadaTerm(activeChart.avakhada?.tatva || "Fire", language)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Auspicious & Inauspicious Elements */}
            {(() => {
              const aus = getLocalizedAuspiciousElements(activeChart.lagna_sign, language);
              return (
                <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-3">
                  <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5 border-b border-white/10 pb-2">
                    <Gem className="size-3.5 text-[#E5A93C]" /> {t.auspiciousTitle}
                  </h3>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="font-bold text-[#10B981] flex items-center gap-1">
                        {t.luckyColors}
                      </span>
                      <p className="text-[#F8FAFC] mt-0.5 leading-relaxed">
                        {aus.luckyColors}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-[#EF4444] flex items-center gap-1">
                        {t.unluckyColors}
                      </span>
                      <p className="text-[#CBD5E1] mt-0.5 leading-relaxed">
                        {aus.unluckyColors}
                      </p>
                    </div>

                    <div className="border-t border-white/5 pt-2">
                      <span className="font-bold text-[#10B981] flex items-center gap-1">
                        {t.luckyGemstones}
                      </span>
                      <p className="text-[#F3C766] mt-0.5 leading-relaxed">
                        {aus.luckyGemstones}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-[#EF4444] flex items-center gap-1">
                        {t.unluckyGemstones}
                      </span>
                      <p className="text-[#CBD5E1] mt-0.5 leading-relaxed">
                        {aus.unluckyGemstones}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 4. Planetary Positions & Longitudes */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                  <Orbit className="size-3.5 text-[#E5A93C]" /> {t.planetaryPositionsTitle}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/sky")}
                    className="flex items-center gap-1 rounded-[6px] border border-[#E5A93C]/40 bg-[#090A10] px-2 py-1 text-[10px] font-bold text-[#F3C766] transition hover:bg-[#E5A93C] hover:text-[#090A10]"
                  >
                    <Sparkles className="size-3" />
                    {language === "en" ? "Birth Sky" : "जन्म आकाश"}
                  </button>
                  <button
                    onClick={() => setShowFullPlanets(!showFullPlanets)}
                    className="text-[10px] font-bold text-[#E5A93C] hover:underline"
                  >
                    {showFullPlanets ? t.compactLabel : t.fullDetailsLabel}
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px]">
                  <thead>
                    <tr className="border-b border-white/10 text-[#94A3B8]">
                      <th className="pb-1">{t.thPlanet}</th>
                      <th className="pb-1">{t.thSign}</th>
                      <th className="pb-1">{t.thHouse}</th>
                      <th className="pb-1">{t.thDegree}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr className="hover:bg-white/5 font-semibold text-[#F8FAFC]">
                      <td className="py-1 text-[#F3C766]">{getPlanetName("Ascendant", language)}</td>
                      <td className="py-1">{getSignName(activeChart.lagna_sign, language)}</td>
                      <td className="py-1 text-[#F8FAFC]">{language === "en" ? "H1" : "भाव १"}</td>
                      <td className="py-1 text-[#F3C766] font-mono">{fmtDeg(activeChart.lagna_degree, language)}</td>
                    </tr>
                    {activeChart.planets.map((p) => (
                      <tr key={p.name} className="hover:bg-white/5">
                        <td className="py-1 font-semibold text-[#F8FAFC]">
                          {getPlanetName(p.name, language)} {p.retrograde && <span className="text-[#E5A93C]">{language === "en" ? " ℞" : " (व)"}</span>}
                        </td>
                        <td className="py-1 text-[#94A3B8]">{getSignName(p.sign, language)}</td>
                        <td className="py-1 text-[#F8FAFC]">
                          {language === "en" ? "H" : "भाव "}{toLocalizedDigit(p.house, language)}
                        </td>
                        <td className="py-1 text-[#F3C766] font-mono">{fmtDeg(p.degree_in_sign, language)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Active Dasha Systems & Predictions */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h3 className="font-serif text-xs font-bold uppercase tracking-wider text-[#F8FAFC] flex items-center gap-1.5">
                  <Clock className="size-3.5 text-[#E5A93C]" /> {t.activeDashaTitle}
                </h3>
                <span className="text-[10px] font-bold text-[#F3C766] bg-[#090A10] px-2.5 py-1 rounded-[6px] border border-[#E5A93C]/30">
                  {t.currentDasha}: <span className="text-[#F8FAFC] ml-1">{currentDashaText}</span>
                </span>
              </div>

              {/* The three schemes as महादशाचक्रम् tables — the layout a
                  hand-written patro uses, one column per lord with years and
                  end date, the running period inked. These replaced a tabbed
                  widget whose dates were hardcoded specimens shown to every
                  user regardless of their chart. */}
              <div className="space-y-3">
                <DashaChakra
                  periods={activeChart.dasha.periods}
                  now={todayMs}
                  scheme="vimshottari"
                />
                {activeChart.tribhagi && (
                  <DashaChakra
                    periods={activeChart.tribhagi.periods}
                    now={todayMs}
                    scheme="tribhagi"
                  />
                )}
                {activeChart.yogini && (
                  <DashaChakra
                    periods={activeChart.yogini.periods}
                    now={todayMs}
                    scheme="yogini"
                  />
                )}
              </div>
            </div>

          </aside>

          {/* RIGHT COLUMN (65% width) - Deep Narrative & Audio */}
          <div className="space-y-6">

            {/* Hero Audio Player Bar (Sticky beneath top nav) */}
            <div className="sticky top-[57px] z-30 rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-3 shadow-xl backdrop-blur-md">
              {/* Top Row: Play Info on Left, Modern Action Icons on Top Right */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (isPlaying) {
                        // Pause, not stop. This button is labelled "Pause
                        // Audio" but called stopSpeech(), which discarded the
                        // audio — so play restarted a ten-minute reading from
                        // the beginning.
                        pauseSpeech();
                        setIsPlaying(false);
                      } else if (isPaused()) {
                        resumeSpeech();
                        setIsPlaying(true);
                      } else {
                        const textToRead = visibleSections
                          .map((s) => {
                            const mainDetail = s.content?.[0] || "";
                            return `${s.title}. ${s.summary}... ${mainDetail}`;
                          })
                          .join(" ... ");
                        const rateMap: Record<string, number> = { "1x": 1.0, "1.2x": 1.2, "1.5x": 1.5 };
                        const rate = rateMap[playbackSpeed] || 1.0;
                        setIsPlaying(true);
                        trackAudioPlayed(selectedVoice, language);
                        speakText(textToRead, {
                          rate,
                          language,
                          voice: selectedVoice,
                          onSpokenText: (spokenText, source) => {
                            setAudioDebugText(spokenText);
                            setAudioSource(source);
                          },
                          onTimeUpdate: (pct, currentTime, duration) => {
                            setAudioProgress(pct);
                            setAudioCurrentTime(currentTime);
                            setAudioDuration(duration);
                          },
                          onEnd: () => {
                            setIsPlaying(false);
                            setAudioProgress(0);
                            setAudioCurrentTime(0);
                          },
                        });
                      }
                    }}
                    className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-[#E5A93C] text-[#090A10] font-bold transition hover:bg-[#F3C766] active:scale-95 cursor-pointer shadow-md"
                    title={isPlaying ? "Pause Audio" : "Play Audio"}
                  >
                    {isPlaying ? (
                      <Pause className="size-4 fill-current" />
                    ) : (
                      <Play className="size-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif text-sm font-bold text-[#F8FAFC]">{t.narrativeAudioTitle}</span>
                    </div>
                    <p className="text-[11px] text-[#94A3B8]">
                      Voice: <strong className="text-[#F3C766]">{ASTROLOGER_VOICES.find(v => v.id === selectedVoice)?.name || "Acharya Dev"}</strong> ({ASTROLOGER_VOICES.find(v => v.id === selectedVoice)?.description[language as "en"|"ne"|"hi"] || "HD MP3 Stream Engine"})
                    </p>
                  </div>
                </div>

                {/* Top Right Action Icons & Custom Voice Selector for Audio */}
                <div className="flex items-center gap-2 shrink-0">
                  <CustomVoiceSelector
                    selectedVoice={selectedVoice}
                    onSelectVoice={(newVoice) => {
                      setSelectedVoice(newVoice);
                      if (isPlaying) {
                        stopSpeech();
                        setIsPlaying(false);
                      }
                    }}
                    language={language}
                  />

                  <button
                    onClick={handleDownloadAudio}
                    title={t.downloadAudio}
                    aria-label={t.downloadAudio}
                    className="group relative flex size-8 items-center justify-center rounded-[8px] border border-[#E5A93C]/40 bg-[#090A10] text-[#E5A93C] transition-all duration-200 hover:border-[#E5A93C] hover:bg-[#E5A93C] hover:text-[#090A10] hover:shadow-md hover:shadow-[#E5A93C]/20 active:scale-95 cursor-pointer"
                  >
                    <Download className="size-4 transition-transform duration-200 group-hover:scale-110" />
                  </button>

                  <button
                    onClick={handleShareAudio}
                    title={t.shareAudio}
                    aria-label={t.shareAudio}
                    className="group relative flex size-8 items-center justify-center rounded-[8px] border border-white/10 bg-[#090A10] text-[#CBD5E1] transition-all duration-200 hover:border-[#E5A93C] hover:bg-[#161B2B] hover:text-[#F3C766] hover:shadow-md active:scale-95 cursor-pointer"
                  >
                    <Share2 className="size-4 transition-transform duration-200 group-hover:scale-110" />
                  </button>
                </div>
              </div>

              {/* Bottom Scrubber & Speed Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-2.5">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => seekAudioBy(-10)}
                    title="Rewind 10 seconds"
                    className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#F8FAFC] font-mono transition active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="size-3 text-[#E5A93C]" />
                    <span>10s</span>
                  </button>

                  <div className="flex items-center gap-2 flex-1 max-w-xs">
                    <div
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                        setAudioProgress(pct);
                        seekAudioToPercent(pct);
                      }}
                      className="w-full h-2 rounded-[4px] bg-[#090A10] overflow-hidden cursor-pointer relative group border border-white/10"
                      title="Click to seek"
                    >
                      <div
                        className="h-full bg-[#E5A93C] transition-all duration-100 group-hover:bg-[#F3C766]"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                    {audioDuration > 0 && (
                      <span className="text-[10px] font-mono text-[#94A3B8] shrink-0">
                        {formatAudioTime(audioCurrentTime)} / {formatAudioTime(audioDuration)}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => seekAudioBy(10)}
                    title="Forward 10 seconds"
                    className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#F8FAFC] font-mono transition active:scale-95 cursor-pointer"
                  >
                    <span>10s</span>
                    <RotateCw className="size-3 text-[#E5A93C]" />
                  </button>
                </div>

                {/* Was a native <select>, which took the operating system's
                    styling and rendered a light Aqua menu inside a dark page. */}
                <OptionMenu
                  label={t.playbackSpeed}
                  value={playbackSpeed}
                  options={PLAYBACK_SPEEDS}
                  onChange={(speed) => {
                    setPlaybackSpeed(speed);
                    setPlaybackRate(SPEED_RATES[speed]);
                  }}
                />
              </div>
            </div>

            {/* Audio Telemetry & Live Teleprompter Debug Panel */}
            {(isPlaying || audioDebugText) && (
              <div className="rounded-[8px] border border-[#E5A93C]/40 bg-[#090A10] p-4 space-y-3 shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-block size-2 rounded-full bg-[#E5A93C] animate-pulse" />
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#F3C766] flex items-center gap-1.5">
                      <Activity className="size-3.5 text-[#E5A93C]" /> {t.telemetryTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="rounded bg-[#161B2B] px-2 py-0.5 font-mono text-[#94A3B8] border border-white/10">
                      Engine: {audioSource || "hd_mp3_audio_engine"}
                    </span>
                    <span className="rounded bg-[#E5A93C] px-2 py-0.5 font-bold text-[#090A10]">
                      {isPlaying ? "PLAYING" : "PAUSED"}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
                    <span>{t.activeScriptLabel}</span>
                    <span className="font-mono text-[#F3C766]">Playback Rate: {playbackSpeed}</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-[6px] border border-white/10 bg-[#161B2B] p-3 text-xs leading-relaxed text-[#F8FAFC] font-sans selection:bg-[#E5A93C] selection:text-[#090A10]">
                    <p className="border-l-2 border-[#E5A93C] pl-2.5 text-[#F3C766] font-medium leading-relaxed">
                      {audioDebugText || "Synthesizing spoken audio script stream..."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Category Navigation Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[
                ["all", t.catOverview],
                ["personality", t.catPersonality],
                ["career-finance", t.catCareer],
                ["love-marriage", t.catMarriage],
                ["current-dasha", t.catDasha],
                ["remedies", t.catRemedies],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => filterCategory(id)}
                  className={`shrink-0 rounded-[8px] px-4 py-1.5 text-xs font-semibold transition ${
                    activeCategory === id
                      ? "bg-[#E5A93C] text-[#090A10]"
                      : "border border-white/10 bg-[#161B2B] text-[#94A3B8] hover:text-[#F8FAFC]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 3. Deep Narrative Reading Cards */}
            <div className="space-y-6">
              {visibleSections.map((section) => (
                <ReportSectionCard
                  key={section.id}
                  section={section}
                  isHighlighted={selectedHouse === 10 && section.id === "career-finance"}
                  footnotesLabel={t.astrologicalFootnotes}
                  onPlacementClick={() => setSelectedHouse(10)}
                />
              ))}
              {/* Placeholders for the sections still being written, so the page
                  grows downward instead of jumping when each one lands. */}
              {report.isStreaming && activeCategory === "all" && (
                <ReadingSkeleton count={Math.max(1, 7 - report.sections.length)} />
              )}
            </div>

            {/* Bottom Fixed Banner / Floating CTA */}
            <div className="rounded-[8px] border border-[#E5A93C]/40 bg-[#161B2B] p-6 text-center space-y-3">
              <p className="font-serif text-base font-bold text-[#F8FAFC]">
                {t.bottomCtaQuestion}
              </p>
              <button
                onClick={() => router.push("/reading/live")}
                className="inline-flex items-center gap-2 rounded-[8px] bg-[#E5A93C] hover:bg-[#F3C766] px-6 py-3 text-sm font-bold text-[#090A10] transition cursor-pointer"
              >
                <span>{t.bottomCtaBtn}</span>
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* PDF Export Hidden Container - Renders complete reading report without tabs */}
      <div
        ref={pdfReportRef}
        style={{ display: "none" }}
        className="bg-[#090A10] text-[#F8FAFC] p-8 space-y-8 font-sans max-w-[1100px] mx-auto"
      >
        <div className="border-b border-[#E5A93C] pb-6 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl font-bold text-[#F3C766]">
              {activeBirth.name}&apos;s Complete Janma Kundali Report
            </h1>
            <p className="text-sm text-[#94A3B8] mt-1">
              {activeBirth.date} · {activeBirth.time} · {activeBirth.place_label}
            </p>
            {activeChart && (
              <p className="text-xs text-[#E5A93C] mt-1">
                {t.lagnaAscendant}: {getSignName(activeChart.lagna_sign, language)} · {t.moonSign}: {getSignName(activeChart.avakhada?.sign || "Sagittarius", language)} · {t.nakshatra}: {getNakshatraName(activeChart.avakhada?.nakshatra || "Moola", language)}
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="font-serif text-lg font-bold text-[#E5A93C]">Nakhatra</span>
            <p className="text-xs text-[#94A3B8]">Sidereal Ephemeris Analysis</p>
          </div>
        </div>

        {/* Dual Charts side-by-side */}
        {activeChart && (
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-2">
              <h3 className="font-serif text-xs font-bold text-[#F3C766] uppercase tracking-wider">{t.d1LagnaChartTitle}</h3>
              <NorthIndianChart chart={activeChart} />
            </div>
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-2">
              <h3 className="font-serif text-xs font-bold text-[#F3C766] uppercase tracking-wider">{t.d9NavamshaChartTitle}</h3>
              <NorthIndianChart chart={d9Chart} />
            </div>
          </div>
        )}

        {/* Avakhada & Auspicious Tables side-by-side */}
        {activeChart && (
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-3">
              <h3 className="font-serif text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#E5A93C]" /> {t.avakhadaTitle}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-[#94A3B8]">{t.moonSignLabel}</span> <strong>{getSignName(activeChart.avakhada?.sign || "Sagittarius", language)}</strong></div>
                <div><span className="text-[#94A3B8]">{t.nakshatraLabel}</span> <strong>{getNakshatraName(activeChart.avakhada?.nakshatra || "Moola", language)}</strong></div>
                <div><span className="text-[#94A3B8]">{t.ganaLabel}</span> <strong>{getAvakhadaTerm(activeChart.avakhada?.gana || "Rakshasa", language)}</strong></div>
                <div><span className="text-[#94A3B8]">{t.nadiLabel}</span> <strong>{getAvakhadaTerm(activeChart.avakhada?.nadi || "Adi", language)}</strong></div>
                <div><span className="text-[#94A3B8]">{t.yoniLabel}</span> <strong>{getAvakhadaTerm(activeChart.avakhada?.yoni || "Rat", language)}</strong></div>
                <div><span className="text-[#94A3B8]">{t.varnaElementLabel}</span> <strong>{getAvakhadaTerm(activeChart.avakhada?.varna || "Kshatriya", language)} · {getAvakhadaTerm(activeChart.avakhada?.tatva || "Fire", language)}</strong></div>
              </div>
            </div>

            {(() => {
              const aus = getLocalizedAuspiciousElements(activeChart.lagna_sign, language);
              return (
                <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-3">
                  <h3 className="font-serif text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
                    <Gem className="size-3.5 text-[#E5A93C]" /> {t.auspiciousTitle}
                  </h3>
                  <div className="space-y-1.5 text-xs">
                    <p><strong className="text-[#10B981]">{t.luckyColors}</strong> {aus.luckyColors}</p>
                    <p><strong className="text-[#EF4444]">{t.unluckyColors}</strong> {aus.unluckyColors}</p>
                    <p><strong className="text-[#10B981]">{t.luckyGemstones}</strong> {aus.luckyGemstones}</p>
                    <p><strong className="text-[#EF4444]">{t.unluckyGemstones}</strong> {aus.unluckyGemstones}</p>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Planetary Table */}
        {activeChart && (
          <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-4 space-y-3">
            <h3 className="font-serif text-xs font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-1.5">
              <Orbit className="size-3.5 text-[#E5A93C]" /> {t.planetaryPositionsTitle}
            </h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-[#94A3B8]">
                  <th className="pb-1">{t.thPlanet}</th>
                  <th className="pb-1">{t.thSign}</th>
                  <th className="pb-1">{t.thHouse}</th>
                  <th className="pb-1">{t.thDegree}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="py-1 text-[#F3C766]">{getPlanetName("Ascendant", language)}</td>
                  <td className="py-1">{getSignName(activeChart.lagna_sign, language)}</td>
                  <td className="py-1">{language === "en" ? "H1" : "भाव १"}</td>
                  <td className="py-1 font-mono">{fmtDeg(activeChart.lagna_degree, language)}</td>
                </tr>
                {activeChart.planets.map((p) => (
                  <tr key={p.name}>
                    <td className="py-1">{getPlanetName(p.name, language)} {p.retrograde && (language === "en" ? " ℞" : " (व)")}</td>
                    <td className="py-1">{getSignName(p.sign, language)}</td>
                    <td className="py-1">{language === "en" ? "H" : "भाव "}{toLocalizedDigit(p.house, language)}</td>
                    <td className="py-1 font-mono">{fmtDeg(p.degree_in_sign, language)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ALL Narrative Report Sections - Complete without tab filtering */}
        <div className="space-y-6">
          <h2 className="font-serif text-lg font-bold text-[#F3C766] border-b border-white/10 pb-2">
            {t.tabAnalysis} (Complete Kundali Analysis)
          </h2>
          {reportSections.map((section) => (
            <div key={section.id} className="rounded-[8px] border border-white/10 bg-[#161B2B] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-[6px] bg-[#090A10] border border-white/10">
                  <SectionIcon sectionId={section.id} className="size-4 text-[#E5A93C]" />
                </span>
                <h3 className="font-serif text-base font-bold text-[#F8FAFC]">{section.title}</h3>
              </div>
              <p className="text-xs text-[#F3C766] font-semibold">{section.summary}</p>
              <div className="space-y-2 text-xs leading-relaxed text-[#CBD5E1]">
                {section.content?.map((para: string, idx: number) => (
                  <p key={idx}>{para}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Floating Live Astrologer Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => router.push("/reading/live")}
          className="group flex items-center gap-2.5 rounded-[8px] bg-[#E5A93C] hover:bg-[#F3C766] px-4 py-3 text-xs font-bold text-[#090A10] shadow-2xl shadow-[#E5A93C]/40 border border-[#F3C766]/50 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
          title={t.talkToAstrologer}
        >
          <MessageSquareText className="size-4 text-[#090A10]" />
          <span>{language === "ne" ? "AI ज्योतिषीसँग बोल्नुहोस् (निःशुल्क)" : language === "hi" ? "AI ज्योतिषी से बात करें (निःशुल्क)" : "Talk to AI Astrologer (FREE)"}</span>
        </button>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-[8px] border border-[#E5A93C] bg-[#161B2B] px-5 py-2.5 text-xs font-bold text-[#F3C766] shadow-2xl animate-fade-in flex items-center gap-2">
          <Sparkles className="size-4 text-[#E5A93C]" />
          <span>{toastMessage}</span>
        </div>
      )}
    </AppShell>
  );
}
