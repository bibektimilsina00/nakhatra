"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { NorthIndianChart } from "@/features/kundali/components/north-indian-chart";
import { AppShell } from "@/features/dashboard/components/app-shell";
import { ChartSwitcher } from "@/features/kundali/components/chart-switcher";
import { currentDasha, useToday } from "@/features/kundali/dasha";
import { loadKundaliFromStorage } from "@/features/kundali/store/kundali-store";
import { getPlanetName, getSignName } from "@/lib/i18n/vedic-translations";
import type { Chart, BirthDetailsIn } from "@/features/kundali/types";
import type { ChatMessage } from "@/features/chat/types";
import { speakText, stopSpeech } from "@/lib/utils/audio-speaker";
import { OpenAIRealtimeWebRTCClient, type RealtimeWebRTCCallbacks } from "@/lib/utils/openai-realtime-webrtc";
import { GeminiLiveClient } from "@/lib/utils/gemini-live-client";
import {
  clearMilanLive,
  loadMilanLive,
  toMilanContext,
  type MilanLive,
} from "@/features/milan/store/milan-live";
import { ASTROLOGER_VOICES, GEMINI_ASTROLOGER_VOICES } from "@/lib/constants/voices";
import { CustomVoiceSelector } from "@/features/voice/components/voice-selector";
import { authHeaders } from "@/features/auth/store/auth-store";
import { useAskAstrologer } from "@/features/chat/hooks/use-ask-astrologer";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { ChatMessageBubble } from "@/features/chat/components/chat-message-bubble";

import { useTranslation } from "@/lib/i18n/language-context";
import { trackAiChatMessageSent, trackLiveVoiceStarted } from "@/lib/utils/analytics";
import {
  TriangleAlert,
  ArrowLeft,
  Sparkles,
  Mic,
  MicOff,
  Zap,
  FileText,
  Map,
  Bug,
  Monitor,
  Radio,
  Headphones,
  Heart,
  LogOut,
} from "lucide-react";

export function LiveModeWorkspace() {
  const router = useRouter();
  const askAstrologer = useAskAstrologer();
  const { language: globalLang, setLanguage: setGlobalLang, t } = useTranslation();
  const [viewMode, setViewMode] = useState<"desk" | "live_voice">("desk");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [highlightedHouse, setHighlightedHouse] = useState<number | null>(null);

  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat feed on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isThinking]);

  // Live Voice Mode State Machine
  const [voiceState, setVoiceState] = useState<"listening" | "thinking" | "speaking" | "paused">("paused");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [teleprompterText, setTeleprompterText] = useState("");
  const [teleprompterBasis, setTeleprompterBasis] = useState("");
  const [showChartDrawer, setShowChartDrawer] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);
  const [isWebRTCActive, setIsWebRTCActive] = useState<boolean>(false);
  /** Shown in the desk, so a failed voice session is not silent. */
  const [realtimeError, setRealtimeError] = useState<string | null>(null);
  /** Whether the microphone is open — not the same thing as being connected. */
  const [micOpen, setMicOpen] = useState(true);
  const [isRecordingMedia, setIsRecordingMedia] = useState<boolean>(false);
  const [isDictating, setIsDictating] = useState<boolean>(false);

  const dictationRef = useRef<any>(null);

  // Toggle Voice Dictation (Speech-to-Text directly into inputQuery text field)
  const toggleDictation = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isDictating) {
      if (dictationRef.current) {
        try { dictationRef.current.stop(); } catch (e) {}
      }
      setIsDictating(false);
      addDebugLog("DICTATION_STOPPED", "Voice dictation ended");
      return;
    }

    if (!SpeechRecognitionClass) {
      addDebugLog("DICTATION_UNSUPPORTED", "Browser does not support Web Speech API");
      setMicPermissionError("Speech recognition is not supported in this browser. Please type your query.");
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLanguageRef.current === "ne" ? "ne-NP" : selectedLanguageRef.current === "hi" ? "hi-IN" : "en-US";

      recognition.onstart = () => {
        setIsDictating(true);
        addDebugLog("DICTATION_START", `Voice dictation listening in ${selectedLanguageRef.current.toUpperCase()}...`);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        if (currentTranscript.trim()) {
          setInputQuery(currentTranscript);
          addDebugLog("DICTATION_RESULT", `Captured text: "${currentTranscript}"`);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn("Dictation error:", e);
        addDebugLog("DICTATION_ERROR", e?.error || "Dictation error");
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
        addDebugLog("DICTATION_ENDED", "Dictation speech stream closed");
      };

      recognition.start();
      dictationRef.current = recognition;
    } catch (err: any) {
      console.error("Dictation initialization error:", err);
      addDebugLog("DICTATION_INIT_ERROR", err?.message || "Dictation failed");
      setIsDictating(false);
    }
  };
  
  // Realtime Audio & Debug Telemetry
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [silenceCounterMs, setSilenceCounterMs] = useState<number>(0);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string>("");
  const [debugLogs, setDebugLogs] = useState<Array<{ time: string; event: string; detail: string }>>([
    {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      event: "SYSTEM_READY",
      detail: "Live Astrologer Desk Initialized (Realtime Voice & Audio Engine)",
    },
  ]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const webrtcClientRef = useRef<OpenAIRealtimeWebRTCClient | GeminiLiveClient | null>(null);
  const activeSessionRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>("");
  const lastSpeakingTimestampRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  const userSpokeRef = useRef<boolean>(false);

  // Stale-closure-free refs for audio & VAD loop
  const voiceStateRef = useRef<"listening" | "thinking" | "speaking" | "paused">("paused");
  const isWebRTCActiveRef = useRef<boolean>(false);

  const updateVoiceState = (state: "listening" | "thinking" | "speaking" | "paused") => {
    voiceStateRef.current = state;
    setVoiceState(state);
  };

  const updateWebRTCActive = (active: boolean) => {
    isWebRTCActiveRef.current = active;
    setIsWebRTCActive(active);
  };

  const [activeBirth, setActiveBirth] = useState<BirthDetailsIn>({
    name: "Bibek Timilsina",
    date: "2002-01-11" as any,
    time: "19:30",
    tz_name: "Asia/Kathmandu",
    latitude: 27.55,
    longitude: 83.05,
    place_label: "Kapilbastu, Nepal",
    time_accuracy: "exact",
    siddhanta: "surya",
  });

  const [activeChart, setActiveChart] = useState<Chart | null>(null);

  // Add log to debug console
  const addDebugLog = (event: string, detail: string) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setDebugLogs((prev) => [{ time, event, detail }, ...prev.slice(0, 49)]);
  };

  // The transcript survives a refresh the same way the chart does: in
  // sessionStorage, keyed by the birth so another kundali never inherits
  // this one's conversation.
  const transcriptKey = (b: BirthDetailsIn) =>
    `nakhatra_chat:${b.name}|${b.date}|${b.time}`;

  // A match handed over from the milan page, if the visitor came from one.
  // Held in a ref as well, because the realtime mint reads it outside render.
  const [milanLive, setMilanLive] = useState<MilanLive | null>(null);
  const milanRef = useRef<MilanLive | null>(null);

  // Load active chart
  useEffect(() => {
    const stored = loadKundaliFromStorage();
    // The handoff only applies to the chart it was made for. Without this
    // check, opening any later consultation would still be answered as though
    // it were about someone's marriage match.
    const live = loadMilanLive();
    if (live && stored && live.self.chart.julian_day === stored.chart.julian_day) {
      setMilanLive(live);
      milanRef.current = live;
    } else if (live) {
      clearMilanLive();
    }
    if (stored) {
      setActiveBirth(stored.birth);
      setActiveChart(stored.chart);
      try {
        const saved = sessionStorage.getItem(transcriptKey(stored.birth));
        if (saved) setMessages(JSON.parse(saved));
      } catch {
        // a corrupt transcript just means starting fresh
      }
    } else {
      // Nothing chosen. This used to POST the placeholder birth — an empty
      // name at 1900-01-01, latitude 0 — and talk about the chart that came
      // back as though it were yours.
      router.replace("/reading/choose?mode=live");
    }
  }, []);

  // Mirrors the app bar's selector rather than owning a second copy of it.
  // Two selectors on screen disagreed about what "language" meant.
  const selectedLanguage = globalLang;
  const today = useToday();
  const todayRef = useRef(today);
  const selectedLanguageRef = useRef<"en" | "ne" | "hi">(globalLang);

  const [selectedVoice, setSelectedVoice] = useState<string>("onyx");
  const [liveProvider, setLiveProvider] = useState<string>("openai");
  const selectedVoiceRef = useRef<string>("onyx");

  const handleVoiceChange = (newVoice: string) => {
    setSelectedVoice(newVoice);
    selectedVoiceRef.current = newVoice;
    addDebugLog("VOICE_CHANGED", `Switched astrologer voice to ${newVoice}`);
    if (activeSessionRef.current && isWebRTCActiveRef.current) {
      if (webrtcClientRef.current) {
        webrtcClientRef.current.disconnect();
      }
      startOpenAIRealtimeWebRTC();
    }
  };

  useEffect(() => {
    todayRef.current = today;
  }, [today]);

  // The app bar's selector is the only one now, so this is where a language
  // change reaches the astrologer. A realtime session has its language baked
  // in, so it reconnects — but only on an actual change, or the first render
  // would tear down the session it just opened.
  useEffect(() => {
    if (selectedLanguageRef.current === globalLang) return;
    selectedLanguageRef.current = globalLang;
    addDebugLog("LANGUAGE_CHANGED", `Astrologer language switched to ${globalLang.toUpperCase()}`);
    if (isWebRTCActiveRef.current && webrtcClientRef.current) {
      webrtcClientRef.current.disconnect();
      startOpenAIRealtimeWebRTC();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the reconnect
    // helpers are recreated every render; depending on them would loop.
  }, [globalLang]);

  const lastLoggedSilenceMsRef = useRef<number>(0);
  const speechDetectedLoggedRef = useRef<boolean>(false);

  // Setup Web Audio API Mic Analyzer & Native MediaRecorder Audio Capture
  const setupMicAnalyzer = async () => {
    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
      
      if (mediaStreamRef.current && mediaStreamRef.current.active) {
        addDebugLog("MIC_STREAM_ACTIVE", "Microphone stream active");
        return;
      }

      // Reuse the realtime session's microphone when there is one. Opening a
      // second capture of the same device is what made the meter and the
      // model fight over the input.
      const stream =
        webrtcClientRef.current?.micStream ??
        (await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        }));
      mediaStreamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      addDebugLog("MIC_HARDWARE_CONNECTED", "Hardware Mic Connected & Web Audio Analyser Active");


      const updateLevel = () => {
        if (!mediaStreamRef.current || !mediaStreamRef.current.active) return;
        
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const level = Math.min(100, Math.round(average));
        setAudioLevel(level);

        const now = Date.now();
        const SPEECH_THRESHOLD = 14;

        if (level > SPEECH_THRESHOLD) {
          lastSpeakingTimestampRef.current = now;
          if (!speechDetectedLoggedRef.current) {
            speechDetectedLoggedRef.current = true;
            addDebugLog(
              "SPEECH_DETECTED",
              `Voice activity detected! Mic Level: ${level}% (Threshold: >${SPEECH_THRESHOLD}%)`
            );
          }
          userSpokeRef.current = true;
          setSilenceCounterMs(0);
          lastLoggedSilenceMsRef.current = 0;
        } else if (userSpokeRef.current && lastSpeakingTimestampRef.current > 0) {
          const silentMs = now - lastSpeakingTimestampRef.current;
          setSilenceCounterMs(silentMs);

          // Log silence counting progress every 250ms
          if (silentMs - lastLoggedSilenceMsRef.current >= 250 && silentMs < 800) {
            lastLoggedSilenceMsRef.current = silentMs;
            addDebugLog(
              "VAD_SILENCE_COUNTING",
              `Silence timer: ${Math.round(silentMs)}ms / 800ms (Audio level: ${level}%)`
            );
          }

          const currentVoiceState = voiceStateRef.current;
          const currentWebRTC = isWebRTCActiveRef.current;

        }

        requestAnimationFrame(updateLevel);
      };
      updateLevel();
      setMicPermissionError(null);
    } catch (err: any) {
      console.warn("Microphone stream request error:", err);
      addDebugLog("MIC_ERROR", err?.message || "Failed to access microphone hardware");
      setMicPermissionError("Microphone access required. Please allow mic permissions in your browser URL bar.");
    }
  };

  // Toggle debug panel
  const handleToggleDebugPanel = () => {
    const nextState = !showDebugPanel;
    setShowDebugPanel(nextState);
    if (nextState) {
      addDebugLog("DEBUG_PANEL_OPENED", "Opened Audio Telemetry Console");
      setupMicAnalyzer();
    }
  };

  // Initialize initial greeting dynamically
  useEffect(() => {
    if (activeChart && messages.length === 0) {
      // `periods[0]` and `periods[1]` were the first two mahadashas *from
      // birth*, the second mislabelled as the antardasha. A 1998 chart opened
      // with its birth-era dashas announced as current.
      const runningNow = currentDasha(activeChart, todayRef.current);
      const mahaLord = runningNow.maha?.lord ?? "Main";
      const antarLord = runningNow.antar?.lord ?? "Sub";
      // The words around the names have to follow the reader's language too,
      // or the chip reads "कर्कट Ascendant · शुक्र-केतु Dasha".
      const lang = selectedLanguageRef.current;
      const ascendantWord = lang === "en" ? "Ascendant" : "लग्न";
      const dashaWord = lang === "en" ? "Dasha" : "दशा";
      const dashaText = `${getPlanetName(mahaLord, lang)}-${getPlanetName(antarLord, lang)} ${dashaWord}`;

      const greeting =
        selectedLanguage === "ne"
          ? `नमस्ते ${activeBirth.name}! मैले तपाईंको कुण्डलीको विस्तृत विश्लेषण गरेको छु। तपाईंको ${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} लग्न${activeChart.panchang?.moon_sign ? ` र ${getSignName(activeChart.panchang.moon_sign, selectedLanguageRef.current)} चन्द्रमा` : ""} तथा वर्तमान ${getPlanetName(mahaLord, selectedLanguageRef.current)}-${getPlanetName(antarLord, selectedLanguageRef.current)} दशाले तपाईंको जीवनमा नयाँ अवसर सङ्केत गर्दछ। आज तपाईं के सोध्न चाहनुहुन्छ?`
          : selectedLanguage === "hi"
          ? `नमस्ते ${activeBirth.name}! मैंने आपकी कुंडली का विस्तृत विश्लेषण किया है। आपका ${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} लग्न${activeChart.panchang?.moon_sign ? ` एवं ${getSignName(activeChart.panchang.moon_sign, selectedLanguageRef.current)} चंद्रमा` : ""} तथा वर्तमान ${getPlanetName(mahaLord, selectedLanguageRef.current)}-${getPlanetName(antarLord, selectedLanguageRef.current)} दशा आपके जीवन में महत्वपूर्ण समय का संकेत देती है। आज आप क्या पूछना चाहते हैं?`
          : `Namaste ${activeBirth.name}! I have thoroughly analyzed your Kundali. Your ${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} Ascendant${activeChart.panchang?.moon_sign ? ` with ${getSignName(activeChart.panchang.moon_sign, selectedLanguageRef.current)} Moon` : ""} under current ${dashaText} make this a significant phase for your personal growth. What specific questions do you have today?`;

      const matched = milanRef.current;
      const matchLine = matched
        ? selectedLanguage === "ne"
          ? ` तपाईं र ${matched.partner.name}को मिलानमा ३६ मध्ये ${matched.match.total_guna} गुण मिलेको छ — दुवै कुण्डली मसँग छन्, जे पनि सोध्नुहोस्।`
          : selectedLanguage === "hi"
            ? ` आपका और ${matched.partner.name} का मिलान 36 में से ${matched.match.total_guna} गुण है — दोनों कुंडली मेरे पास हैं, कुछ भी पूछें।`
            : ` Your match with ${matched.partner.name} scores ${matched.match.total_guna} of 36 — I have both charts in front of me, so ask me anything about the two of you.`
        : "";

      setMessages([
        {
          id: "msg-init",
          sender: "astrologer",
          text: greeting + matchLine,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          astrologicalBasis: `${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} ${ascendantWord} · ${dashaText}`,
        },
      ]);
      setTeleprompterText(greeting);
      setTeleprompterBasis(`${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} Ascendant · ${dashaText}`);
      addDebugLog("SESSION_INIT", `Dynamic greeting built for ${activeBirth.name} (${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} Ascendant)`);
    }
  }, [activeChart, activeBirth, messages.length, selectedLanguage]);

  useEffect(() => {
    if (!activeBirth.name || messages.length === 0) return;
    try {
      sessionStorage.setItem(transcriptKey(activeBirth), JSON.stringify(messages.slice(-60)));
    } catch {
      // storage full or private mode — the chat just won't survive a refresh
    }
  }, [messages, activeBirth]);

  // Send message query function
  const handleSend = async (textToSend?: string) => {
    const query = textToSend || accumulatedTranscriptRef.current || inputQuery;
    if (!query.trim() || isThinking) return;

    accumulatedTranscriptRef.current = "";
    setInterimTranscript("");
    setLastSubmittedQuery(query);
    trackAiChatMessageSent(
      selectedLanguageRef.current,
      isWebRTCActiveRef.current ? "live_voice" : "text",
    );

    // If WebRTC is active, send text via WebRTC DataChannel
    if (isWebRTCActiveRef.current && webrtcClientRef.current) {
      addDebugLog("WEBRTC_SEND_TEXT", `Sending text over OpenAI Realtime WebRTC: "${query}"`);
      webrtcClientRef.current.sendTextMessage(query);
      
      const userMsg: ChatMessage = {
        id: `usr-${Date.now()}`,
        sender: "user",
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, userMsg]);
      if (!textToSend) setInputQuery("");
      return;
    }

    addDebugLog("QUERY_SENT", `Submitting query to AI: "${query}"`);

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery("");
    setIsThinking(true);
    if (viewMode === "live_voice") {
      updateVoiceState("thinking");
    }

    if (!activeChart) {
      // Previously this sent `chart: null`, the backend rejected it, and the
      // failure disappeared into the catch below as a generic error. Say what
      // is actually wrong instead.
      setIsThinking(false);
      addDebugLog("CHAT_BLOCKED", "No chart loaded yet — cannot ask about a chart.");
      return;
    }

    try {
      const data = await askAstrologer.mutateAsync({
        query,
        // The API keeps only the recent turns; sending the whole transcript
        // every time is bandwidth the backend immediately discards.
        messages: messages.map((m) => ({ sender: m.sender, text: m.text })),
        chart: activeChart,
        birth: activeBirth,
        language: selectedLanguageRef.current,
        ...(milanRef.current ? { milan: toMilanContext(milanRef.current) } : {}),
      });
      setIsThinking(false);

      if (data.text) {
        addDebugLog("AI_RESPONSE_RECEIVED", `Response: "${data.text.slice(0, 50)}..."`);

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "astrologer",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          astrologicalBasis: data.astrological_basis,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setTeleprompterText(data.text);
        setTeleprompterBasis(data.astrological_basis || "");

        if (data.highlight_house) {
          setHighlightedHouse(data.highlight_house);
        }

        // In live mode the realtime session is the only voice. A typed
        // question while it is down gets its answer on screen, unspoken —
        // the whisper/TTS fallback used to answer *alongside* the realtime
        // session, which is why callers heard two astrologers.
        if (activeSessionRef.current) updateVoiceState("listening");
      } else {
        addDebugLog("EMPTY_AI_RESPONSE", "No response text received from AI engine");
        if (activeSessionRef.current) updateVoiceState("listening");
      }
    } catch (err: any) {
      console.error("Failed to fetch AI Astrologer response", err);
      addDebugLog("API_ERROR", err?.message || "Chat completion failed");
      setIsThinking(false);
      if (activeSessionRef.current) updateVoiceState("listening");
    }
  };

  // Start OpenAI Realtime WebRTC Session
  const startOpenAIRealtimeWebRTC = async () => {
    if (!activeChart || !activeBirth) return;
    // One live session, ever. Restarts (language or voice change) come
    // through here too, so the old peer connection is torn down first —
    // stacking a second one left both answering, audibly doubled.
    if (webrtcClientRef.current) {
      webrtcClientRef.current.disconnect();
      webrtcClientRef.current = null;
    }
    
    addDebugLog("WEBRTC_CONNECTING", "Initializing OpenAI Realtime WebRTC native audio stream...");

    setRealtimeError(null);
    // One mint decides the provider: Gemini when the server has its key
    // (about a third of gpt-realtime's price), OpenAI WebRTC otherwise.
    let grant: { client_secret?: string | null; model?: string | null; provider?: string; instructions?: string | null } = {};
    try {
      const grantRes = await fetch("/api/v1/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          chart: activeChart,
          birth: activeBirth,
          language: selectedLanguageRef.current,
          voice: selectedVoiceRef.current,
          ...(milanRef.current ? { milan: toMilanContext(milanRef.current) } : {}),
        }),
      });
      if (grantRes.ok) grant = await grantRes.json();
      setLiveProvider(grant.provider ?? "openai");
    } catch {
      // the client's own failure path reports it
    }

    const callbacks: RealtimeWebRTCCallbacks = {
      onStateChange: (state) => {
        addDebugLog("WEBRTC_STATE", `State: ${state}`);
        if (state === "speaking") updateVoiceState("speaking");
        else if (state === "listening") updateVoiceState("listening");
        else if (state === "connecting") updateVoiceState("thinking");
      },
      onTranscriptDelta: (delta) => {
        setTeleprompterText((prev) => (prev.length > 200 ? delta : prev + delta));
      },
      onTranscriptComplete: (text) => {
        if (text) {
          setTeleprompterText(text);
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-webrtc-${Date.now()}`,
              sender: "astrologer",
              text,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              astrologicalBasis: `${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} ${selectedLanguageRef.current === "en" ? "Ascendant" : "लग्न"}`,
            },
          ]);
        }
      },
      // Barge-in: the moment the reader speaks, anything we are playing
      // locally stops. Without this the browser's own TTS kept going while the
      // realtime session was already listening, and both were audible at once.
      onUserSpeechStart: () => {
        stopSpeech();
        setIsThinking(false);
        updateVoiceState("listening");
      },
      // Mirrors the microphone, so the indicator can say "paused" during the
      // astrologer's turn instead of claiming to listen while it talks.
      onMicEnabledChange: setMicOpen,
      onUserTranscript: (userText) => {
        if (userText) {
          setInterimTranscript(userText);
          setMessages((prev) => [
            ...prev,
            {
              id: `usr-webrtc-${Date.now()}`,
              sender: "user",
              text: userText,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          ]);
        }
      },
      onDebugLog: (event, detail) => {
        addDebugLog(event, detail);
      },
      onError: (err) => {
        addDebugLog("WEBRTC_ERROR", err);
        // The client gave up or the service refused. Say so instead of
        // going quiet; the orb offers the retry.
        setRealtimeError(err);
        updateWebRTCActive(false);
        updateVoiceState("paused");
      },
    };

    let client: OpenAIRealtimeWebRTCClient | GeminiLiveClient =
      grant.provider === "gemini"
        ? new GeminiLiveClient(callbacks)
        : new OpenAIRealtimeWebRTCClient(callbacks);
    webrtcClientRef.current = client;
    let success = await client.connect(
      activeChart,
      activeBirth,
      selectedLanguageRef.current,
      selectedVoiceRef.current,
      grant.client_secret ? (grant as { client_secret: string; model: string }) : undefined,
    );

    // A Gemini grant can be refused only at connect time (billing, region).
    // Rather than stranding the caller, mint again with the provider pinned
    // to OpenAI and carry on.
    if (!success && grant.provider === "gemini") {
      addDebugLog("GEMINI_FELL_BACK", "Gemini session refused; retrying on OpenAI");
      setLiveProvider("openai");
      client.disconnect();
      client = new OpenAIRealtimeWebRTCClient(callbacks);
      webrtcClientRef.current = client;
      let openaiGrant: { client_secret?: string | null; model?: string | null } | undefined;
      try {
        const res = await fetch("/api/v1/realtime-session", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({
            chart: activeChart,
            birth: activeBirth,
            language: selectedLanguageRef.current,
            voice: selectedVoiceRef.current,
            provider: "openai",
            ...(milanRef.current ? { milan: toMilanContext(milanRef.current) } : {}),
          }),
        });
        if (res.ok) openaiGrant = await res.json();
      } catch {
        // the connect below reports the failure
      }
      success = await client.connect(
        activeChart,
        activeBirth,
        selectedLanguageRef.current,
        selectedVoiceRef.current,
        openaiGrant?.client_secret ? (openaiGrant as { client_secret: string; model: string }) : undefined,
      );
    }
    if (success) {
      updateWebRTCActive(true);
      updateVoiceState("listening");
      addDebugLog("WEBRTC_LIVE", `Realtime Voice Session Active in ${selectedLanguageRef.current.toUpperCase()}`);
    } else {
      updateWebRTCActive(false);
      updateVoiceState("paused");
      setRealtimeError("Live voice could not connect. Check your connection and tap the orb to retry.");
      addDebugLog("WEBRTC_UNAVAILABLE", "Realtime session refused; live voice stays down");
    }
  };

  // Toggle Live Voice Mode Session
  const toggleLiveVoiceMode = (enable: boolean) => {
    if (enable) {
      setViewMode("live_voice");
      activeSessionRef.current = true;
      updateVoiceState("listening");
      // Realtime first: it opens the microphone with echo cancellation, and
      // the level meter then attaches to that same stream rather than opening
      // its own. Reversed, the meter won the race and the two fought.
      void startOpenAIRealtimeWebRTC().finally(() => {
        void setupMicAnalyzer();
      });
      addDebugLog("MODE_SWITCH", "Entered Live Voice Mode");
      trackLiveVoiceStarted();
    } else {
      activeSessionRef.current = false;
      stopSpeech();
      if (webrtcClientRef.current) {
        webrtcClientRef.current.disconnect();
        webrtcClientRef.current = null;
      }
      updateWebRTCActive(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      updateVoiceState("paused");
      setViewMode("desk");
      addDebugLog("MODE_SWITCH", "Exited to Desk View");
    }
  };

  // Interrupt AI speaking
  // Leaving the page must actually leave it. There was no unmount cleanup at
  // all: navigating back kept the astrologer talking over the next screen, held
  // the microphone open with the browser's recording dot lit, left the realtime
  // session running and billing, and kept an animation loop measuring audio
  // levels for a component that no longer existed.
  useEffect(() => {
    return () => {
      stopSpeech();
      activeSessionRef.current = false;
      isWebRTCActiveRef.current = false;

      webrtcClientRef.current?.disconnect();
      webrtcClientRef.current = null;

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;

      // Closes the audio graph, which is also what stops the rAF level loop:
      // it bails as soon as the stream is gone.
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== "closed") void ctx.close().catch(() => {});
      audioContextRef.current = null;
    };
    // Runs once, on unmount. Anything in the dependency list would tear the
    // live session down mid-conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInterrupt = () => {
    addDebugLog("USER_INTERRUPT", "User took the turn");
    stopSpeech();
    if (isWebRTCActiveRef.current && webrtcClientRef.current) {
      // Was `sendTextMessage("Hello")`: pressing stop *asked a question*
      // instead of stopping, so the astrologer answered and kept talking.
      webrtcClientRef.current.takeTurn();
      updateVoiceState("listening");
    } else {
      activeSessionRef.current = true;
      updateVoiceState("listening");
    }
  };

  if (!activeChart) {
    return (
      <AppShell sidebar={false} fill>
        <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
          <div className="size-12 animate-spin rounded-full border-4 border-acc border-t-transparent" />
          <p className="text-sm font-bold text-fg">{t.connectingToDesk}</p>
          <p className="text-xs text-mut">{t.calculatingEphemeris}</p>
        </div>
      </AppShell>
    );
  }

  const runningNow = currentDasha(activeChart, today);
  const mahaLord = runningNow.maha?.lord ?? "Main";
  const antarLord = runningNow.antar?.lord ?? "Sub";

  // One list. It drives the empty state in the middle of the chat and the
  // strip above the input; written twice it would drift, and the empty
  // state is where these actually get read.
  // A match consultation asks match questions. The single-chart set below
  // is about one person's career and gemstones, which is not what someone
  // who just cast a milan came to ask.
  const partnerName = milanLive?.partner.name ?? "";
  const milanSuggestions =
    selectedLanguage === "ne"
      ? [
          { icon: "❤️", title: "यो मिलान कस्तो हो?", query: `${partnerName}सँगको मेरो मिलान समग्रमा कस्तो छ? बलियो र कमजोर पक्ष के-के हुन्?` },
          { icon: "⚠️", title: "कमजोर कूटहरू", query: "कम अंक आएका कूटहरूले व्यावहारिक रूपमा के अर्थ राख्छन्? कति गम्भीर हो?" },
          { icon: "🔥", title: "मंगल दोष", query: "हाम्रो मंगल दोषको अवस्था कस्तो छ र यसले विवाहमा के असर गर्छ?" },
          { icon: "🪔", title: "उपाय के छन्?", query: "हाम्रो मिलानका कमजोर पक्षका लागि के-के शान्ति उपाय गर्न सकिन्छ?" },
          { icon: "🤝", title: "स्वभाव मिल्छ?", query: "दुवैको चन्द्रमा र लग्न हेरेर हाम्रो स्वभाव कति मिल्छ?" },
        ]
      : selectedLanguage === "hi"
        ? [
            { icon: "❤️", title: "यह मिलान कैसा है?", query: `${partnerName} के साथ मेरा मिलान कुल मिलाकर कैसा है? मजबूत और कमजोर पक्ष क्या हैं?` },
            { icon: "⚠️", title: "कमजोर कूट", query: "कम अंक वाले कूटों का व्यावहारिक अर्थ क्या है? यह कितना गंभीर है?" },
            { icon: "🔥", title: "मंगल दोष", query: "हमारे मंगल दोष की स्थिति क्या है और इसका विवाह पर क्या असर होगा?" },
            { icon: "🪔", title: "उपाय क्या हैं?", query: "हमारे मिलान के कमजोर पक्षों के लिए कौन से उपाय किए जा सकते हैं?" },
            { icon: "🤝", title: "स्वभाव मिलता है?", query: "दोनों के चंद्रमा और लग्न को देखकर हमारा स्वभाव कितना मिलता है?" },
          ]
        : [
            { icon: "❤️", title: "How good is this match?", query: `Overall, how good is my match with ${partnerName}? What are its real strengths and weaknesses?` },
            { icon: "⚠️", title: "The weak kootas", query: "What do the kootas that scored low actually mean in practice, and how serious are they?" },
            { icon: "🔥", title: "Mangal dosha", query: "What is our Mangal dosha situation, and how does it affect the marriage?" },
            { icon: "🪔", title: "Remedies for us", query: "What remedies are advised for the weak points in our match?" },
            { icon: "🤝", title: "Do our natures fit?", query: "Looking at both Moons and both ascendants, how well do our temperaments fit?" },
          ];

  const singleSuggestions = (selectedLanguage === "ne"
                ? [
                    { icon: "✨", title: "करियर र धन योग?", query: "मेरो करियर र नोकरीमा कहिले राम्रो समय आउँछ?" },
                    { icon: "❤️", title: "विवाह र ७औं भाव?", query: "मेरो विवाह र दाम्पत्य जीवनको विश्लेषण गर्नुहोस्।" },
                    { icon: "🪔", title: `${getPlanetName(mahaLord, selectedLanguage)} दशा शान्ति उपाय`, query: `मेरो ${getPlanetName(mahaLord, selectedLanguage)} महादशा सन्तुलन गर्न के उपाय गर्नुपर्छ?` },
                    { icon: "💎", title: `${getSignName(activeChart.lagna_sign, selectedLanguage)} रत्न`, query: `मेरो ${getSignName(activeChart.lagna_sign, selectedLanguage)} लग्नको लागि कुन रत्न उत्तम हुन्छ?` },
                    { icon: "✈️", title: "विदेश यात्रा योग?", query: `के मेरो ${getPlanetName(mahaLord, selectedLanguage)} महादशामा विदेश यात्राको योग छ?` },
                  ]
                : selectedLanguage === "hi"
                ? [
                    { icon: "✨", title: "करियर एवं धन समय?", query: "मेरे करियर और पदोन्नति का सबसे अच्छा समय कब है?" },
                    { icon: "❤️", title: "विवाह और 7वां भाव?", query: "मेरे विवाह और 7वें भाव का विस्तृत विश्लेषण करें।" },
                    { icon: "🪔", title: `${getPlanetName(mahaLord, selectedLanguage)} दशा उपाय`, query: `मेरी ${getPlanetName(mahaLord, selectedLanguage)} महादशा के लिए कौन से उपाय करने चाहिए?` },
                    { icon: "💎", title: `${getSignName(activeChart.lagna_sign, selectedLanguage)} रत्न`, query: `मेरे ${getSignName(activeChart.lagna_sign, selectedLanguage)} लग्न के लिए कौन सा रत्न शुभ है?` },
                    { icon: "✈️", title: "विदेश यात्रा योग?", query: `क्या मेरी ${getPlanetName(mahaLord, selectedLanguage)} महादशा में विदेश यात्रा का योग है?` },
                  ]
                : [
                    { icon: "✨", title: "Career growth timing?", query: "When is the strongest period for my career growth?" },
                    { icon: "❤️", title: "Marriage & 7th house?", query: "Analyze my 7th house for marriage & relationship." },
                    { icon: "🪔", title: `${getPlanetName(mahaLord, selectedLanguage)} Dasha remedies`, query: `What remedies help balance my ${getPlanetName(mahaLord, selectedLanguage)} period?` },
                    { icon: "💎", title: `Gemstone for ${getSignName(activeChart.lagna_sign, selectedLanguage)}`, query: `What gemstone is recommended for my ${getSignName(activeChart.lagna_sign, selectedLanguage)} Ascendant?` },
                    { icon: "✈️", title: "Foreign relocation?", query: `Will I travel or relocate abroad during my ${getPlanetName(mahaLord, selectedLanguage)} dasha?` },
                  ]);

  const suggestions = milanLive ? milanSuggestions : singleSuggestions;

  return (
    <AppShell
      sidebar={false}
      fill
      // One bar. The back button, the title and which chart is loaded go where
      // the search would otherwise sit; the brand, language, notifications and
      // account are the shell's, exactly as on the dashboard.
      bar={
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={() => {
              toggleLiveVoiceMode(false);
              router.back();
            }}
            aria-label={t.readingBack}
            className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-brd text-mut transition-colors hover:border-brd2 hover:text-fg"
          >
            <ArrowLeft className="size-4" />
          </button>
          {/* Arriving from the sidebar loads whichever chart was opened last,
              so the title names it and doubles as the way to change it. */}
          <ChartSwitcher
            activeName={activeBirth.name}
            onSelect={(birth, chart) => {
              setActiveBirth(birth);
              setActiveChart(chart);
            }}
            trigger={
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-bold text-fg">
                  {t.brandName} Live AI
                </span>
                <span className="block truncate text-[11px] text-mut">{activeBirth.name}</span>
              </span>
            }
          />
        </div>
      }
    >
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-inset text-mut font-sans selection:bg-acc/30 selection:text-acc2">

      {/* =================================================================== */}
      {/* REAL-TIME AUDIO TELEMETRY & RECORDING DEBUG PANEL                  */}
      {/* =================================================================== */}
      {showDebugPanel && (
        <div className="border-b border-amber-500/30 bg-[#0D0F19] p-5 z-40 text-xs font-mono space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-brd pb-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">🐛 Live Audio Recording &amp; Voice Telemetry Console</span>
              <span className={`rounded-[8px] border px-2 py-0.5 text-[10px] font-bold ${isWebRTCActive ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"}`}>
                {isWebRTCActive ? "Realtime WebRTC Active" : "Voice AI Active"}
              </span>
            </div>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-xs text-mut hover:text-white"
            >
              ✕ Close Panel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-5 text-[11px]">
            {/* Box 1: Hardware Mic State */}
            <div className="rounded-[8px] border border-brd bg-panel p-3 space-y-1.5">
              <span className="text-mut block text-[10px] uppercase font-semibold">🎙️ Mic Hardware Status</span>
              <p className="font-bold text-fg flex items-center gap-2">
                <span className={`size-2 rounded-full ${mediaStreamRef.current?.active ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                {mediaStreamRef.current?.active ? "MediaStream Connected" : "Mic Stream Inactive"}
              </p>
              <button
onClick={() => setupMicAnalyzer()}
                className="mt-1 rounded-[8px] bg-acc/20 border border-acc/40 text-acc2 px-2 py-0.5 text-[10px] font-bold hover:bg-acc/30 transition"
              >
                ▶️ Start Mic Hardware
              </button>
            </div>

            {/* Box 2: Audio Level & VU Meter */}
            <div className="rounded-[8px] border border-brd bg-panel p-3 space-y-1.5">
              <span className="text-mut block text-[10px] uppercase font-semibold">🔊 Audio Level (VU Meter)</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-acc2">{audioLevel}%</span>
                <div className="flex-1 bg-inset h-2 rounded-[8px] overflow-hidden border border-brd">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-acc"
                    style={{ width: `${Math.max(5, audioLevel)}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-mut">Speech Threshold: &gt; 14%</span>
            </div>

            {/* Box 3: Silence Counter VAD */}
            <div className="rounded-[8px] border border-brd bg-panel p-3 space-y-1.5">
              <span className="text-mut block text-[10px] uppercase font-semibold">⏱️ VAD Silence Timer</span>
              <p className="font-bold text-fg">
                {silenceCounterMs}ms / 800ms
              </p>
              <div className="w-full bg-inset h-1.5 rounded-[8px] overflow-hidden border border-brd">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, (silenceCounterMs / 800) * 100)}%` }}
                />
              </div>
            </div>

            {/* Box 4: Live Speech Listener State */}
            <div className="rounded-[8px] border border-brd bg-panel p-3 space-y-1.5">
              <span className="text-mut block text-[10px] uppercase font-semibold">🗣️ Live Voice Listener</span>
              <p className="font-bold text-xs truncate">
                {audioLevel > 14 ? (
                  <span className="text-emerald-400 flex items-center gap-1.5 animate-pulse">
                    <span className="size-2 rounded-full bg-emerald-400" />
                    Voice Detected ({audioLevel}%)
                  </span>
                ) : silenceCounterMs > 0 ? (
                  <span className="text-amber-300">
                    ⏱️ Counting Silence ({silenceCounterMs}ms)
                  </span>
                ) : voiceState === "thinking" ? (
                  <span className="text-acc2">🧠 Analyzing Speech...</span>
                ) : voiceState === "speaking" ? (
                  <span className="text-amber-400">🔊 Astrologer Speaking</span>
                ) : (
                  <span className="text-mut">👂 Listening for speech...</span>
                )}
              </p>
              <span className="text-[10px] text-mut">Auto-transcribe after 800ms</span>
            </div>

            {/* Box 5: Native MediaRecorder Status */}
            <div className="rounded-[8px] border border-brd bg-panel p-3 space-y-1.5">
              <span className="text-mut block text-[10px] uppercase font-semibold">📼 MediaRecorder Buffer</span>
              <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${isRecordingMedia ? "bg-red-500 animate-ping" : "bg-slate-600"}`} />
                {isRecordingMedia ? "Capturing Audio Chunks..." : "Buffer Ready"}
              </p>
              <span className="text-[10px] text-mut">Voice Audio Buffer</span>
            </div>
          </div>

          {/* Test Action & Last Query Bar */}
          <div className="flex items-center justify-between bg-panel border border-brd rounded-[8px] p-3">
            <div className="flex items-center gap-2">
              <span className="text-acc font-bold text-[11px]">Last Transmitted Query:</span>
              <span className="text-fg font-semibold">{lastSubmittedQuery || "None yet"}</span>
            </div>
            <button
              onClick={() => {
                const sample = "When is the strongest period for my career growth?";
                setInterimTranscript(sample);
                accumulatedTranscriptRef.current = sample;
                addDebugLog("SIMULATED_TEST_QUERY", `Injected test query: "${sample}"`);
                handleSend(sample);
              }}
              className="rounded-[8px] bg-acc hover:bg-acc2 px-3 py-1 text-xs font-bold text-onacc transition"
            >
              🧪 Test Trigger Career Query
            </button>
          </div>

          {/* Event Stream Console Logs */}
          <div className="space-y-1 bg-inset border border-brd rounded-[8px] p-3 max-h-48 overflow-y-auto">
            <span className="text-[10px] text-mut block uppercase font-bold mb-1">Live Event Telemetry Log ({debugLogs.length} events)</span>
            {debugLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] font-mono leading-tight py-0.5 border-b border-brd">
                <span className="text-mut text-[10px] shrink-0">[{log.time}]</span>
                <span className="text-acc font-bold shrink-0">{log.event}:</span>
                <span className="text-fg truncate">{log.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODE 1: ULTRA-PREMIUM FULLSCREEN LIVE VOICE EXPERIENCE             */}
      {/* =================================================================== */}
      {viewMode === "live_voice" ? (
        /* The consultation room. Everything sits on the theme tokens, so the
           patro light theme owns it as fully as the night theme does; the one
           accent is the house gold. */
        <div className="relative flex-1 min-h-0 h-full bg-app flex flex-col p-4 sm:p-5 overflow-hidden">
          <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-5 items-stretch min-h-0">

            {/* ── The conversation, as a written record ─────────────────── */}
            <div className="hidden lg:flex flex-col rounded-[8px] border border-brd bg-panel min-h-0 overflow-hidden">
              <div className="border-b border-brd px-4 py-3 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 font-serif text-sm font-bold text-fg">
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-acc opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-acc" />
                    </span>
                    {t.realtimeResponse}
                  </span>
                  {teleprompterBasis && (
                    <button
                      onClick={() => {
                        setShowChartDrawer(true);
                        setHighlightedHouse(teleprompterText.includes("7th") ? 7 : 10);
                      }}
                      className="max-w-[150px] truncate rounded-full border border-brd bg-inset px-2.5 py-0.5 text-[10px] font-semibold text-mid transition hover:border-acc/50 hover:text-acc2"
                    >
                      {teleprompterBasis}
                    </button>
                  )}
                </div>
                <p className="mt-1 truncate text-[11px] text-mut">
                  {activeBirth.name} · {getSignName(activeChart.lagna_sign, selectedLanguage)} {t.ascendantLabel} ·{" "}
                  {getPlanetName(mahaLord, selectedLanguage)}-{getPlanetName(antarLord, selectedLanguage)}{" "}
                  {selectedLanguage === "en" ? "Dasha" : "दशा"}
                </p>
              </div>

              <div ref={chatScrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
                {messages.length > 0 ? (
                  messages.map((m) =>
                    m.sender === "user" ? (
                      <div key={m.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-[12px] rounded-br-[4px] border border-acc/30 bg-acc/10 px-3.5 py-2.5">
                          <MarkdownRenderer content={m.text} isUser />
                          <span className="mt-1 block text-right text-[9px] text-dim">{m.timestamp}</span>
                        </div>
                      </div>
                    ) : (
                      <div key={m.id} className="flex items-start gap-2.5">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-inset font-serif text-[11px] font-bold text-acc">
                          ॐ
                        </span>
                        <div className="min-w-0 max-w-[85%] rounded-[12px] rounded-tl-[4px] border border-brd bg-inset px-3.5 py-2.5">
                          <MarkdownRenderer content={m.text} />
                          <span className="mt-1 block text-[9px] text-dim">{m.timestamp}</span>
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div className="flex h-full flex-col items-center justify-center space-y-2 p-6 text-center">
                    <span className="font-serif text-2xl text-acc">ॐ</span>
                    <p className="font-serif text-xs font-semibold text-fg">{t.listeningToVoice}</p>
                    <p className="text-[10px] text-mut">{t.askAnyQuestionOrb}</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── The stage ─────────────────────────────────────────────── */}
            <div className="flex min-h-0 flex-col items-center justify-between space-y-4">
              <div className="my-auto flex w-full flex-1 flex-col items-center justify-center space-y-5">
                <div className="relative flex size-60 shrink-0 items-center justify-center md:size-64">
                  {/* One quiet aura; the state changes its warmth, not its colour family. */}
                  <div
                    className={`pointer-events-none absolute inset-0 m-auto rounded-full transition-all duration-700 ${
                      voiceState === "speaking"
                        ? "bg-acc/25 blur-3xl scale-125 animate-pulse-glow"
                        : voiceState === "listening"
                          ? "bg-acc/10 blur-3xl scale-110"
                          : voiceState === "thinking"
                            ? "bg-acc/15 blur-3xl"
                            : "bg-transparent"
                    }`}
                  />
                  {voiceState === "listening" && (
                    <div className="pointer-events-none absolute inset-0 m-auto animate-pulse-radar rounded-full border border-acc/25" />
                  )}
                  {voiceState === "thinking" && (
                    <div className="pointer-events-none absolute inset-0 m-auto animate-rotate-slow rounded-full border-2 border-dashed border-acc/40" />
                  )}

                  <button
                    onClick={() => {
                      if (voiceState === "speaking") {
                        handleInterrupt();
                      } else if (!webrtcClientRef.current) {
                        activeSessionRef.current = true;
                        updateVoiceState("listening");
                        startOpenAIRealtimeWebRTC();
                      }
                    }}
                    className={`group relative flex size-48 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 bg-panel transition-all duration-700 md:size-52 ${
                      voiceState === "speaking"
                        ? "scale-105 border-acc shadow-[0_0_70px_rgba(229,169,60,0.35)]"
                        : voiceState === "listening"
                          ? "border-acc/50 shadow-[0_0_50px_rgba(229,169,60,0.18)]"
                          : voiceState === "thinking"
                            ? "border-acc/70"
                            : "border-brd opacity-80"
                    }`}
                  >
                    <svg
                      className="pointer-events-none absolute inset-0 size-full animate-rotate-slow p-2 text-fg/10"
                      viewBox="0 0 100 100"
                    >
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 2" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
                      <polygon points="50,6 88.1,72 11.9,72" fill="none" stroke="currentColor" strokeWidth="0.4" />
                      <polygon points="50,94 88.1,28 11.9,28" fill="none" stroke="currentColor" strokeWidth="0.4" />
                    </svg>

                    <div className="z-10 space-y-2 p-5 text-center">
                      <span className="block font-serif text-[32px] leading-none text-acc">ॐ</span>
                      <span className="block text-[13px] font-semibold leading-snug text-fg">
                        {voiceState === "speaking"
                          ? t.astrologerSpeaking
                          : voiceState === "thinking"
                            ? t.thinkingState
                            : micOpen
                              ? t.listeningState
                              : t.voiceReadyPaused}
                      </span>
                      {/* One meter: room level while listening, its own pulse while speaking. */}
                      <span className="flex h-5 items-end justify-center gap-[3px]" aria-hidden>
                        {[0, 1, 2, 3, 4].map((bar) => {
                          const speaking = voiceState === "speaking";
                          const on = speaking || (micOpen && audioLevel >= (bar + 1) * 16);
                          return (
                            <span
                              key={bar}
                              className={`w-[3px] rounded-full transition-all duration-100 ${
                                speaking
                                  ? `bg-acc animate-equalizer-${bar + 1}`
                                  : on
                                    ? "bg-acc"
                                    : "bg-fg/15"
                              }`}
                              style={speaking ? undefined : { height: on ? 7 + bar * 3 : 5 }}
                            />
                          );
                        })}
                      </span>
                    </div>
                  </button>
                </div>

                <p className="text-[11px] text-mut">
                  {voiceState === "speaking" ? t.tapToInterrupt : t.tapToStartVoice}
                </p>


                {micPermissionError && (
                  <div className="w-full max-w-md shrink-0 rounded-[8px] border border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-[11px] text-red-400">
                    {micPermissionError}
                  </div>
                )}
                {realtimeError && (
                  <div className="w-full max-w-md shrink-0 rounded-[8px] border border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-[11px] text-red-400">
                    {realtimeError}
                  </div>
                )}
              </div>

              {/* ── One console: suggestions, input, controls ─────────────── */}
              <div className="z-20 w-full max-w-2xl shrink-0 space-y-2.5">
                {/* The same topics the desk offers, so a match consultation
                    asks match questions here too. */}
                <div className="flex justify-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {suggestions.slice(0, 3).map((chip) => (
                    <button
                      key={chip.title}
                      onClick={() => handleSend(chip.query)}
                      className="shrink-0 rounded-full border border-brd bg-panel px-3.5 py-1.5 text-[11px] font-medium text-mid transition hover:border-acc/50 hover:text-acc2"
                    >
                      {chip.title}
                    </button>
                  ))}
                </div>

                <div className="rounded-[10px] border border-brd bg-panel shadow-xl">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-2 p-2"
                  >
                    <button
                      type="button"
                      onClick={toggleDictation}
                      className={`grid size-10 shrink-0 cursor-pointer place-items-center rounded-[8px] transition active:scale-95 ${
                        isDictating
                          ? "bg-red-500/15 text-red-400 animate-pulse"
                          : "text-mut hover:bg-inset hover:text-acc2"
                      }`}
                      title={isDictating ? "Stop Voice Dictation" : "Dictate Question by Voice"}
                    >
                      {isDictating ? <MicOff className="size-4.5" /> : <Mic className="size-4.5" />}
                    </button>
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder={isDictating ? "Listening..." : t.askPlaceholder}
                      className="min-w-0 flex-1 bg-transparent px-2 py-2.5 text-sm text-fg outline-none placeholder:text-mut/60"
                    />
                    <button
                      type="submit"
                      disabled={!inputQuery.trim() || isThinking}
                      className="shrink-0 cursor-pointer rounded-[8px] bg-acc px-5 py-2.5 text-xs font-bold text-onacc transition hover:bg-acc2 active:scale-95 disabled:opacity-40"
                    >
                      {isThinking ? "..." : t.sendQuery}
                    </button>
                  </form>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-t border-brd px-2 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <CustomVoiceSelector
                        selectedVoice={selectedVoice}
                        onSelectVoice={(vId) => handleVoiceChange(vId)}
                        language={selectedLanguage}
                        voices={liveProvider === "gemini" ? GEMINI_ASTROLOGER_VOICES : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const next = !isMicMuted;
                          setIsMicMuted(next);
                          // the state was only ever cosmetic — the session's
                          // microphone track is what actually goes quiet
                          webrtcClientRef.current?.setMuted(next);
                        }}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          isMicMuted ? "bg-red-500/15 text-red-400" : "text-mid hover:bg-inset hover:text-fg"
                        }`}
                      >
                        {isMicMuted ? <MicOff className="size-3.5" /> : <Mic className="size-3.5" />}
                        {isMicMuted ? t.unmute : t.mute}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChartDrawer(!showChartDrawer)}
                        className={`flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold transition ${
                          showChartDrawer ? "bg-acc/15 text-acc2" : "text-mid hover:bg-inset hover:text-fg"
                        }`}
                      >
                        <Map className="size-3.5" />
                        {t.kundaliChart}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleInterrupt}
                        className="flex cursor-pointer items-center gap-1.5 rounded-[8px] border border-acc/40 px-3 py-1.5 text-[11px] font-bold text-acc2 transition hover:bg-acc/10 active:scale-95"
                      >
                        <Zap className="size-3.5" />
                        {t.interrupt}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleLiveVoiceMode(false);
                          router.push("/reading");
                        }}
                        className="flex cursor-pointer items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[11px] font-semibold text-mid transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <LogOut className="size-3.5" />
                        {t.exitVoice}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* The chart, close at hand */}
          {/* The chart, close at hand — both of them during a match, since
              that consultation is about the pair. */}
          {showChartDrawer && (
            <div
              className={`absolute right-5 top-5 z-30 max-h-[calc(100%-2.5rem)] animate-fade-in space-y-3 overflow-y-auto rounded-[8px] border border-brd bg-panel p-4 shadow-2xl ${
                milanLive ? "w-[22rem] sm:w-[34rem]" : "w-80"
              }`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-brd pb-2">
                <h4 className="min-w-0 truncate font-serif text-xs font-bold text-fg">
                  {milanLive
                    ? `${milanLive.self.name} & ${milanLive.partner.name}`
                    : `${activeBirth.name}'s D1 Kundali`}
                </h4>
                <button
                  onClick={() => setShowChartDrawer(false)}
                  className="shrink-0 text-xs text-mut hover:text-fg"
                >
                  {t.closeChartDrawer}
                </button>
              </div>

              <div className={milanLive ? "grid gap-3 sm:grid-cols-2" : ""}>
                <div className="space-y-2">
                  {milanLive && (
                    <p className="truncate text-[11px] font-semibold text-fg">
                      {milanLive.self.name}
                    </p>
                  )}
                  <div className="rounded-[8px] border border-brd bg-inset p-2">
                    <NorthIndianChart
                      chart={activeChart}
                      selectedHouse={highlightedHouse}
                      onSelectHouse={(h) => setHighlightedHouse((prev) => (prev === h ? null : h))}
                    />
                  </div>
                  <p className="text-center text-[10px] text-mut">
                    {getSignName(activeChart.lagna_sign, selectedLanguage)} {t.ascendantLabel} (
                    {activeChart.lagna_degree.toFixed(2)}°)
                  </p>
                </div>

                {milanLive && (
                  <div className="space-y-2">
                    <p className="truncate text-[11px] font-semibold text-fg">
                      {milanLive.partner.name}
                    </p>
                    <div className="rounded-[8px] border border-brd bg-inset p-2">
                      <NorthIndianChart chart={milanLive.partner.chart} />
                    </div>
                    <p className="text-center text-[10px] text-mut">
                      {getSignName(milanLive.partner.chart.lagna_sign, selectedLanguage)}{" "}
                      {t.ascendantLabel} ({milanLive.partner.chart.lagna_degree.toFixed(2)}°)
                    </p>
                  </div>
                )}
              </div>

              {milanLive && (
                <p className="border-t border-brd pt-2.5 text-center text-[10.5px] text-mut">
                  {milanLive.match.total_guna}/{milanLive.match.max_guna}{" "}
                  {selectedLanguage === "en" ? "gunas" : "गुण"}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        /* =================================================================== */
        /* MODE 2: INTERACTIVE ASTROLOGER DESK VIEW (SPLIT SCREEN VIEW)        */
        /* =================================================================== */
        <div className="flex-1 min-h-0 h-full grid gap-0 lg:grid-cols-[38%_62%] overflow-hidden">
          
          {/* LEFT COLUMN (38% width) - Interactive Kundali Reference & Seeker Context */}
          <aside className="h-full min-h-0 space-y-4 overflow-y-auto border-r border-brd bg-inset p-5">
            
            {milanLive && (
              <div className="flex items-center gap-2.5 rounded-[10px] border border-acc/30 bg-acc/[0.08] px-3.5 py-2.5">
                <Heart className="size-4 shrink-0 text-acc" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] font-semibold text-fg">
                    {milanLive.self.name} &amp; {milanLive.partner.name}
                  </span>
                  <span className="block text-[10.5px] text-mut">
                    {milanLive.match.total_guna}/{milanLive.match.max_guna}{" "}
                    {selectedLanguage === "en" ? "gunas · both charts loaded" : "गुण · दुवै कुण्डली"}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearMilanLive();
                    milanRef.current = null;
                    setMilanLive(null);
                  }}
                  aria-label={selectedLanguage === "en" ? "Leave match context" : "मिलान हटाउनुहोस्"}
                  className="shrink-0 cursor-pointer rounded-[6px] px-1.5 text-[13px] text-mut transition hover:text-fg"
                >
                  ✕
                </button>
              </div>
            )}

            {/* The door to live voice, where a new visitor will actually see
                it — the footer's bare headphone icon explained nothing. */}
            <button
              type="button"
              onClick={() => toggleLiveVoiceMode(true)}
              className="group flex w-full cursor-pointer items-center gap-3.5 rounded-[12px] bg-acc p-4 text-left text-onacc shadow-lg transition hover:bg-acc2 active:scale-[0.99]"
            >
              <span className="relative grid size-11 shrink-0 place-items-center rounded-full bg-onacc/15">
                <Headphones className="size-5 transition-transform group-hover:scale-110" />
                <span className="absolute -right-0.5 -top-0.5 size-2.5 animate-ping rounded-full bg-onacc/70" />
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-onacc" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold leading-tight">
                  {selectedLanguage === "ne"
                    ? "प्रत्यक्ष एआई ज्योतिषीसँग बोल्नुहोस्"
                    : selectedLanguage === "hi"
                      ? "लाइव एआई ज्योतिषी से बात करें"
                      : "Talk Live with the AI Astrologer"}
                </span>
                <span className="mt-0.5 block text-[11px] font-medium opacity-80">
                  {selectedLanguage === "ne"
                    ? "आवाजमै प्रश्न सोध्नुहोस् — तुरुन्तै जवाफ सुन्नुहोस्"
                    : selectedLanguage === "hi"
                      ? "आवाज़ में पूछें — तुरंत जवाब सुनें"
                      : "Ask by voice, hear the answer instantly"}
                </span>
              </span>
              <ArrowLeft className="size-4 shrink-0 rotate-180 opacity-70 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Seeker Profile & D1 Chart Reference Card */}
            <div className="space-y-4 rounded-[12px] border border-brd bg-panel p-5">
              <div className="flex items-center justify-between border-b border-brd pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-gradient-to-br from-acc to-acc2 text-onacc flex items-center justify-center font-bold text-xs shadow-md">
                    {activeBirth.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold leading-tight text-fg">
                      {activeBirth.name}
                    </h2>
                    <span className="text-[10px] text-mut block">{t.d1SiderealBirthChart}</span>
                  </div>
                </div>
                <span className="rounded-[8px] bg-acc/10 border border-acc/30 text-acc2 px-2.5 py-0.5 text-[10px] font-bold">
                  {getSignName(activeChart.lagna_sign, selectedLanguage)} {t.ascendantLabel}
                </span>
              </div>
              
              {/* Illuminated North Indian Chart Container */}
              <div className="relative mx-auto w-full max-w-[290px] rounded-[10px] border border-brd bg-app p-2.5">
                <NorthIndianChart
                  chart={activeChart}
                  selectedHouse={highlightedHouse}
                  onSelectHouse={(h) => setHighlightedHouse((prev) => (prev === h ? null : h))}
                />
              </div>
              <p className="text-center text-[10px] text-mut/80 leading-tight">
                {t.tapHouseHelper}
              </p>
            </div>

            {/* The other chart. A match consultation that shows one kundali is
                answering about two and displaying one. */}
            {milanLive && (
              <div className="space-y-4 rounded-[12px] border border-acc/30 bg-panel p-5">
                <div className="flex items-center justify-between border-b border-brd pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-full bg-inset text-xs font-bold text-acc">
                      {milanLive.partner.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-[14px] font-bold leading-tight text-fg">
                        {milanLive.partner.name}
                      </h2>
                      <span className="block text-[10px] text-mut">
                        {selectedLanguage === "en" ? "Partner's chart" : "जोडीको कुण्डली"}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-[8px] border border-acc/30 bg-acc/10 px-2.5 py-0.5 text-[10px] font-bold text-acc2">
                    {getSignName(milanLive.partner.chart.lagna_sign, selectedLanguage)}{" "}
                    {t.ascendantLabel}
                  </span>
                </div>

                <div className="relative mx-auto w-full max-w-[290px] rounded-[10px] border border-brd bg-app p-2.5">
                  <NorthIndianChart chart={milanLive.partner.chart} />
                </div>
              </div>
            )}

            {/* Quick Dasha & Active Time Lords Widget */}
            <div className="space-y-3 rounded-[12px] border border-brd bg-panel p-4">
              <div className="flex items-center justify-between border-b border-brd pb-2.5">
                <h3 className="text-[12.5px] font-semibold text-fg">{t.activeTimeLords}</h3>
                <span className="text-[10px] uppercase tracking-[0.1em] text-dim">
                  {t.vimshottariLabel}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <DashaCell
                  label={t.mahadashaLabel}
                  lord={getPlanetName(mahaLord, selectedLanguage)}
                  period={runningNow.maha}
                  tone="text-acc"
                />
                <DashaCell
                  label={t.antardashaLabel}
                  lord={getPlanetName(antarLord, selectedLanguage)}
                  period={runningNow.antar}
                  tone="text-amber-300"
                />
              </div>

              <div className="flex items-center justify-between border-t border-brd pt-2.5 text-[11.5px] text-dim">
                <span>{t.ascendantPlacementLabel}</span>
                <span className="font-medium text-fg">
                  {getSignName(activeChart.lagna_sign, selectedLanguage)} ·{" "}
                  {activeChart.lagna_degree.toFixed(2)}°
                </span>
              </div>
            </div>

          </aside>

          {/* RIGHT COLUMN (62% width) - Interactive Live Chat Desk */}
          <main className="flex flex-col flex-1 min-h-0 h-full bg-app overflow-hidden">
            
            {/* Streamed Chat Feed */}
            <div ref={chatScrollRef} className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto scroll-smooth p-4 sm:p-6">
              {messages.map((msg) => (
                <ChatMessageBubble
                  key={msg.id}
                  message={msg}
                  masterAstrologerLabel={t.masterAstrologer}
                  groundedInChartLabel={t.groundedInChart}
                  language={selectedLanguage}
                  onHighlightHouse={(h) => {
                    setHighlightedHouse(h);
                    setShowChartDrawer(true);
                  }}
                />
              ))}

              {messages.length <= 1 && !isThinking && (
                <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-1 py-6">
                  <h2 className="text-[13px] font-semibold text-fg">{t.consultSuggestedTopics}</h2>
                  <p className="mt-1 text-[12.5px] leading-[1.7] text-dim">
                    {milanLive
                      ? selectedLanguage === "ne"
                        ? `${milanLive.self.name} र ${milanLive.partner.name} — दुवै कुण्डली र मिलानको अंक मसँग छन्। जे पनि सोध्नुहोस्।`
                        : selectedLanguage === "hi"
                          ? `${milanLive.self.name} और ${milanLive.partner.name} — दोनों कुंडली और मिलान के अंक मेरे पास हैं। कुछ भी पूछें।`
                          : `${milanLive.self.name} and ${milanLive.partner.name} — I have both charts and the koota scores. Ask me anything about the two of you.`
                      : t.askAnythingHint}
                  </p>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {suggestions.map((chip) => (
                      <button
                        key={chip.title}
                        onClick={() => handleSend(chip.query)}
                        className="group flex items-start gap-3 rounded-[10px] border border-brd bg-panel p-3.5 text-left transition-colors hover:border-acc/40 hover:bg-inset"
                      >
                        <span className="text-[15px] leading-none">{chip.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-fg">{chip.title}</span>
                          <span className="mt-1 block text-[11.5px] leading-[1.6] text-dim">
                            {chip.query}
                          </span>
                        </span>
                        <ArrowLeft className="mt-0.5 size-3.5 shrink-0 rotate-180 text-dim transition-colors group-hover:text-acc" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Thinking / Analyzing Indicator */}
              {isThinking && (
                <div className="flex items-center gap-3 p-4 rounded-[14px] border border-brd bg-panel/90 backdrop-blur-md max-w-xs animate-pulse">
                  <span className="grid size-6 place-items-center rounded-full bg-inset font-serif text-[11px] font-bold text-acc">
                    ॐ
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-acc2 font-medium">
                    <span className="size-2 rounded-full bg-acc animate-bounce" />
                    <span className="size-2 rounded-full bg-acc2 animate-bounce delay-150" />
                    <span className="size-2 rounded-full bg-acc animate-bounce delay-300" />
                    <span className="ml-2">{t.analyzingSpeech}</span>
                  </div>
                </div>
              )}
            </div>

            {realtimeError && (
              <div className="mx-4 mb-2 flex shrink-0 items-center gap-2.5 rounded-[8px] border border-acc/30 bg-inset px-3.5 py-2.5">
                <TriangleAlert className="size-4 shrink-0 text-acc" />
                <span className="min-w-0 flex-1 text-[12px] leading-[1.6] text-mut">
                  {t.voiceFellBack}
                </span>
                <button
                  type="button"
                  onClick={() => setRealtimeError(null)}
                  aria-label={t.dashClose}
                  className="shrink-0 text-[11px] text-dim transition-colors hover:text-fg"
                >
                  ✕
                </button>
              </div>
            )}

            {/* The same suggestions as a thin strip, once the middle is busy. */}
            <div
              className={`z-10 shrink-0 items-center justify-center gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
                messages.length > 1 ? "flex" : "hidden"
              }`}
            >
              {suggestions.map((chip) => (
                <button
                  key={chip.title}
                  onClick={() => handleSend(chip.query)}
                  className="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-brd bg-panel px-3.5 py-1.5 text-xs text-mut transition-colors hover:border-acc/40 hover:text-fg"
                >
                  <span className="text-xs">{chip.icon}</span>
                  <span className="font-medium text-[11px] sm:text-xs">{chip.title}</span>
                </button>
              ))}
            </div>

            {/* Bottom Mic & Message Input Dock */}
            <footer className="border-t border-brd bg-panel/90 backdrop-blur-xl p-4 shadow-2xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2.5 max-w-4xl mx-auto"
              >
                {/* Button 1: Live Voice Consultation Mode Switcher */}
                <button
                  type="button"
                  onClick={() => toggleLiveVoiceMode(true)}
                  className="group grid size-11 shrink-0 cursor-pointer place-items-center rounded-[8px] bg-acc text-onacc transition hover:bg-acc2 active:scale-95"
                  title={
                    selectedLanguage === "ne"
                      ? "प्रत्यक्ष एआई भ्वाइस परामर्श सुरु गर्नुहोस्"
                      : selectedLanguage === "hi"
                      ? "लाइव एआई वॉइस परामर्श शुरू करें"
                      : "Talk to Live AI Astrologer (Realtime Voice Mode)"
                  }
                >
                  <Headphones className="size-5 transition-transform group-hover:scale-110" />
                </button>

                {/* Button 2: Speech-to-Text Dictation Mic (fills inputQuery field) */}
                <button
                  type="button"
                  onClick={toggleDictation}
                  className={`grid size-11 shrink-0 place-items-center rounded-[8px] border transition group cursor-pointer active:scale-95 ${
                    isDictating
                      ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                      : "border-brd bg-inset text-mut hover:text-acc2 hover:border-acc/50"
                  }`}
                  title={
                    isDictating
                      ? selectedLanguage === "ne"
                        ? "आवाज रेकर्डिङ रोक्नुहोस्"
                        : selectedLanguage === "hi"
                        ? "आवाज़ रिकॉर्डिंग रोकें"
                        : "Stop Voice Dictation"
                      : selectedLanguage === "ne"
                      ? "बोलेर प्रश्न लेख्नुहोस् (भ्वाइस टाइपिङ)"
                      : selectedLanguage === "hi"
                      ? "बोलकर प्रश्न लिखें (वॉइस टाइपिंग)"
                      : "Dictate Question by Voice (Speech-to-Text)"
                  }
                >
                  {isDictating ? (
                    <MicOff className="size-5 text-red-400" />
                  ) : (
                    <Mic className="size-5 group-hover:scale-110 transition-transform text-acc" />
                  )}
                </button>

                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder={
                    isDictating
                      ? selectedLanguage === "ne"
                        ? "आवाज सुन्दैछ... बोल्नुहोस्..."
                        : selectedLanguage === "hi"
                        ? "आवाज़ सुन रहा है... बोलिए..."
                        : "Listening to your voice... Speak now..."
                      : t.askPlaceholder
                  }
                  className={`flex-1 rounded-[8px] border bg-inset px-4 py-3 text-xs sm:text-sm text-fg placeholder-mut/50 focus:border-acc focus:ring-1 focus:ring-acc/40 focus:outline-none transition ${
                    isDictating ? "border-amber-400/70 ring-2 ring-amber-400/20" : "border-brd"
                  }`}
                />

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isThinking}
                  className="rounded-[8px] bg-acc px-6 py-3 text-xs font-bold text-onacc transition hover:bg-acc2 disabled:opacity-40 cursor-pointer active:scale-95 shrink-0 sm:text-sm"
                >
                  {isThinking ? "..." : t.sendQuery}
                </button>
              </form>
            </footer>
          </main>
        </div>
      )}
    </div>
    </AppShell>
  );
}

/**
 * One running period: who rules it, and for how long.
 *
 * The dates are the point. "Rahu / Saturn" alone is two words the reader has to
 * take on trust; "2024 – 2031" is the same claim with its working shown, and it
 * is the difference between a label and a fact.
 */
function DashaCell({
  label,
  lord,
  period,
  tone,
}: {
  label: string;
  lord: string;
  period: { start: string; end: string } | null;
  tone: string;
}) {
  return (
    <div className="rounded-[10px] border border-brd bg-app p-3">
      <span className="block text-[10px] uppercase tracking-[0.1em] text-dim">{label}</span>
      <span className={`mt-1 block text-[15px] font-bold ${tone}`}>{lord}</span>
      {period && (
        <span className="mt-1 block text-[10.5px] tabular-nums text-dim">
          {period.start.slice(0, 4)} – {period.end.slice(0, 4)}
        </span>
      )}
    </div>
  );
}
