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
import { OpenAIRealtimeWebRTCClient } from "@/lib/utils/openai-realtime-webrtc";
import { ASTROLOGER_VOICES } from "@/lib/constants/voices";
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
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState(false);
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const webrtcClientRef = useRef<OpenAIRealtimeWebRTCClient | null>(null);
  const activeSessionRef = useRef<boolean>(false);
  const accumulatedTranscriptRef = useRef<string>("");
  const lastSpeakingTimestampRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);
  const userSpokeRef = useRef<boolean>(false);

  // Stale-closure-free refs for audio & VAD loop
  const voiceStateRef = useRef<"listening" | "thinking" | "speaking" | "paused">("paused");
  const isWebRTCActiveRef = useRef<boolean>(false);
  const shouldTranscribeRef = useRef<boolean>(false);

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

  // Load active chart
  useEffect(() => {
    const stored = loadKundaliFromStorage();
    if (stored) {
      setActiveBirth(stored.birth);
      setActiveChart(stored.chart);
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

  // Transcribe recorded MediaRecorder audio blob using OpenAI Whisper API
  const transcribeAudioBlob = async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size < 400) {
      addDebugLog("WHISPER_SKIP", "Audio buffer too small for transcription");
      if (activeSessionRef.current) {
        updateVoiceState("listening");
        startMediaRecorder();
      }
      return;
    }

    addDebugLog("WHISPER_TRANSCRIBE_START", `Sending ${Math.round(audioBlob.size / 1024)}KB audio to OpenAI Whisper (${selectedLanguageRef.current})...`);
    setIsThinking(true);
    updateVoiceState("thinking");

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "speech.webm");
      formData.append("language", selectedLanguageRef.current);

      const res = await fetch("/api/v1/transcribe", {
        method: "POST",
        // Whisper is billed per minute; the endpoint is authenticated. The
        // Content-Type is left to the browser so the multipart boundary is set.
        headers: authHeaders(),
        body: formData,
      });

      const data = await res.json();
      setIsThinking(false);

      if (data.text && data.text.trim()) {
        addDebugLog("WHISPER_TRANSCRIBE_SUCCESS", `Transcribed: "${data.text}"`);
        setInterimTranscript(data.text);
        handleSend(data.text);
      } else {
        addDebugLog("WHISPER_NO_SPEECH", "No speech recognized in audio buffer");
        if (activeSessionRef.current) {
          updateVoiceState("listening");
          startMediaRecorder();
        }
      }
    } catch (err: any) {
      console.error("Whisper transcription error:", err);
      addDebugLog("WHISPER_ERROR", err?.message || "Whisper API request failed");
      setIsThinking(false);
      if (activeSessionRef.current) {
        updateVoiceState("listening");
        startMediaRecorder();
      }
    }
  };

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

      // Only in fallback mode. While the realtime session is up it owns the
      // turn-taking, and a MediaRecorder buffering in parallel is a second
      // transcription pipeline nobody reads plus a buffer that never drains.
      if (!isWebRTCActiveRef.current) startMediaRecorder();

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

          // 800ms Hardware Silence VAD Trigger
          if (
            silentMs >= 800 &&
            !isSubmittingRef.current &&
            !currentWebRTC &&
            (currentVoiceState === "listening" || currentVoiceState === "paused")
          ) {
            isSubmittingRef.current = true;
            userSpokeRef.current = false;
            lastSpeakingTimestampRef.current = 0;
            shouldTranscribeRef.current = true;

            addDebugLog(
              "VAD_HARDWARE_SILENCE_TRIGGER",
              "800ms silence threshold reached. Stopping MediaRecorder to transcribe speech with Whisper AI..."
            );

            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              try { mediaRecorderRef.current.stop(); } catch (e) {}
            } else if (accumulatedTranscriptRef.current.trim()) {
              handleSend(accumulatedTranscriptRef.current.trim());
            }
          }
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

  // Start native MediaRecorder chunk collection
  const startMediaRecorder = () => {
    if (!mediaStreamRef.current || !mediaStreamRef.current.active) return;
    if (typeof MediaRecorder === "undefined") return;

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }

      audioChunksRef.current = [];
      shouldTranscribeRef.current = false;

      const options = MediaRecorder.isTypeSupported("audio/webm")
        ? { mimeType: "audio/webm" }
        : MediaRecorder.isTypeSupported("audio/mp4")
        ? { mimeType: "audio/mp4" }
        : undefined;

      const recorder = new MediaRecorder(mediaStreamRef.current, options);
      
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setIsRecordingMedia(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: options?.mimeType || "audio/webm" });
        audioChunksRef.current = [];

        if (shouldTranscribeRef.current) {
          shouldTranscribeRef.current = false;
          transcribeAudioBlob(audioBlob);
        } else {
          addDebugLog("MEDIA_RECORDER_RESET", "MediaRecorder buffer cleared for new session");
        }
      };

      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setIsRecordingMedia(true);
      isSubmittingRef.current = false;
      if (activeSessionRef.current && !isThinking) {
        updateVoiceState("listening");
      }
      addDebugLog("MEDIA_RECORDER_START", "Native MediaRecorder active & collecting audio chunks");
    } catch (err: any) {
      console.warn("MediaRecorder start error:", err);
      addDebugLog("MEDIA_RECORDER_ERROR", err?.message || "MediaRecorder failed to start");
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

      setMessages([
        {
          id: "msg-init",
          sender: "astrologer",
          text: greeting,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          astrologicalBasis: `${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} ${ascendantWord} · ${dashaText}`,
        },
      ]);
      setTeleprompterText(greeting);
      setTeleprompterBasis(`${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} Ascendant · ${dashaText}`);
      addDebugLog("SESSION_INIT", `Dynamic greeting built for ${activeBirth.name} (${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} Ascendant)`);
    }
  }, [activeChart, activeBirth, messages.length, selectedLanguage]);

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

        // Voice playback handling in Live Voice Mode
        if (activeSessionRef.current && !isWebRTCActiveRef.current) {
          updateVoiceState("speaking");
          addDebugLog("TTS_START", `Playing audio response via speaker engine (${selectedLanguageRef.current})...`);
          
          let hasEnded = false;
          const finishPlayback = () => {
            if (hasEnded) return;
            hasEnded = true;
            addDebugLog("TTS_END", `Playback complete. Resuming mic listening loop.`);
            if (activeSessionRef.current && !isMicMuted) {
              updateVoiceState("listening");
              startMediaRecorder();
            } else {
              updateVoiceState("paused");
            }
          };

          // Failsafe timer (max 25s or 120ms per character) to ensure voice state NEVER stalls
          const maxDurationMs = Math.max(4000, Math.min(25000, data.text.length * 120));
          const failsafeTimer = setTimeout(() => {
            addDebugLog("TTS_TIMEOUT_FAILSAFE", "Playback safety timeout reached. Resuming mic loop.");
            finishPlayback();
          }, maxDurationMs);

          speakText(data.text, {
            language: selectedLanguageRef.current,
            voice: selectedVoiceRef.current,
            onStart: () => updateVoiceState("speaking"),
            onEnd: () => {
              clearTimeout(failsafeTimer);
              finishPlayback();
            },
          });
        } else if (activeSessionRef.current) {
          updateVoiceState("listening");
          startMediaRecorder();
        }
      } else {
        addDebugLog("EMPTY_AI_RESPONSE", "No response text received from AI engine");
        if (activeSessionRef.current) {
          updateVoiceState("listening");
          startMediaRecorder();
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch AI Astrologer response", err);
      addDebugLog("API_ERROR", err?.message || "Chat completion failed");
      setIsThinking(false);
      if (activeSessionRef.current) {
        updateVoiceState("listening");
        startMediaRecorder();
      }
    }
  };

  // Start OpenAI Realtime WebRTC Session
  const startOpenAIRealtimeWebRTC = async () => {
    if (!activeChart || !activeBirth) return;
    
    addDebugLog("WEBRTC_CONNECTING", "Initializing OpenAI Realtime WebRTC native audio stream...");

    setRealtimeError(null);
    const client = new OpenAIRealtimeWebRTCClient({
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
              astrologicalBasis: `${getSignName(activeChart.lagna_sign, selectedLanguageRef.current)} Ascendant · OpenAI Realtime`,
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
        // The client reconnects transport drops on its own; reaching here means
        // it gave up or the service refused. Say so instead of going quiet, and
        // hand turn-taking back to the Whisper pipeline.
        setRealtimeError(err);
        updateWebRTCActive(false);
        updateVoiceState("listening");
        startMediaRecorder();
      },
    });

    webrtcClientRef.current = client;
    const success = await client.connect(activeChart, activeBirth, selectedLanguageRef.current, selectedVoiceRef.current);
    if (success) {
      updateWebRTCActive(true);
      updateVoiceState("listening");
      addDebugLog("WEBRTC_LIVE", `Realtime Voice Session Active in ${selectedLanguageRef.current.toUpperCase()}`);
    } else {
      updateWebRTCActive(false);
      updateVoiceState("listening");
      addDebugLog("WEBRTC_FALLBACK", "Using Native Voice Engine");
      startMediaRecorder();
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch (e) {}
      }
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

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {}
      }
      mediaRecorderRef.current = null;

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
      startMediaRecorder();
    }
  };

  if (!activeChart) {
    return (
      <AppShell sidebar={false} fill>
        <div className="flex flex-1 flex-col items-center justify-center space-y-4 text-center">
          <div className="size-12 animate-spin rounded-full border-4 border-[#E5A93C] border-t-transparent" />
          <p className="text-sm font-bold text-[#F8FAFC]">{t.connectingToDesk}</p>
          <p className="text-xs text-[#94A3B8]">{t.calculatingEphemeris}</p>
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
  const suggestions = (selectedLanguage === "ne"
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
            className="grid size-9 shrink-0 place-items-center rounded-[8px] border border-white/10 text-[#94A3B8] transition-colors hover:border-white/25 hover:text-[#F8FAFC]"
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
                <span className="block truncate text-[14px] font-bold text-[#F8FAFC]">
                  {t.brandName} Live AI
                </span>
                <span className="block truncate text-[11px] text-[#94A3B8]">{activeBirth.name}</span>
              </span>
            }
          />
        </div>
      }
    >
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#090A10] text-[#94A3B8] font-sans selection:bg-[#E5A93C]/30 selection:text-[#F3C766]">

      {/* =================================================================== */}
      {/* REAL-TIME AUDIO TELEMETRY & RECORDING DEBUG PANEL                  */}
      {/* =================================================================== */}
      {showDebugPanel && (
        <div className="border-b border-amber-500/30 bg-[#0D0F19] p-5 z-40 text-xs font-mono space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold text-sm">🐛 Live Audio Recording &amp; Voice Telemetry Console</span>
              <span className={`rounded-[8px] border px-2 py-0.5 text-[10px] font-bold ${isWebRTCActive ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"}`}>
                {isWebRTCActive ? "Realtime WebRTC Active" : "Voice AI Active"}
              </span>
            </div>
            <button
              onClick={() => setShowDebugPanel(false)}
              className="text-xs text-[#94A3B8] hover:text-white"
            >
              ✕ Close Panel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-5 text-[11px]">
            {/* Box 1: Hardware Mic State */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-3 space-y-1.5">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">🎙️ Mic Hardware Status</span>
              <p className="font-bold text-[#F8FAFC] flex items-center gap-2">
                <span className={`size-2 rounded-full ${mediaStreamRef.current?.active ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
                {mediaStreamRef.current?.active ? "MediaStream Connected" : "Mic Stream Inactive"}
              </p>
              <button
                onClick={() => {
                  setupMicAnalyzer();
                  startMediaRecorder();
                }}
                className="mt-1 rounded-[8px] bg-[#E5A93C]/20 border border-[#E5A93C]/40 text-[#F3C766] px-2 py-0.5 text-[10px] font-bold hover:bg-[#E5A93C]/30 transition"
              >
                ▶️ Start Mic Hardware
              </button>
            </div>

            {/* Box 2: Audio Level & VU Meter */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-3 space-y-1.5">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">🔊 Audio Level (VU Meter)</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#F3C766]">{audioLevel}%</span>
                <div className="flex-1 bg-[#090A10] h-2 rounded-[8px] overflow-hidden border border-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-[#E5A93C]"
                    style={{ width: `${Math.max(5, audioLevel)}%` }}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[#94A3B8]">Speech Threshold: &gt; 14%</span>
            </div>

            {/* Box 3: Silence Counter VAD */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-3 space-y-1.5">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">⏱️ VAD Silence Timer</span>
              <p className="font-bold text-[#F8FAFC]">
                {silenceCounterMs}ms / 800ms
              </p>
              <div className="w-full bg-[#090A10] h-1.5 rounded-[8px] overflow-hidden border border-white/10">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${Math.min(100, (silenceCounterMs / 800) * 100)}%` }}
                />
              </div>
            </div>

            {/* Box 4: Live Speech Listener State */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-3 space-y-1.5">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">🗣️ Live Voice Listener</span>
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
                  <span className="text-[#F3C766]">🧠 Analyzing Speech...</span>
                ) : voiceState === "speaking" ? (
                  <span className="text-amber-400">🔊 Astrologer Speaking</span>
                ) : (
                  <span className="text-[#94A3B8]">👂 Listening for speech...</span>
                )}
              </p>
              <span className="text-[10px] text-[#94A3B8]">Auto-transcribe after 800ms</span>
            </div>

            {/* Box 5: Native MediaRecorder Status */}
            <div className="rounded-[8px] border border-white/10 bg-[#161B2B] p-3 space-y-1.5">
              <span className="text-[#94A3B8] block text-[10px] uppercase font-semibold">📼 MediaRecorder Buffer</span>
              <p className="font-bold text-cyan-300 flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${isRecordingMedia ? "bg-red-500 animate-ping" : "bg-slate-600"}`} />
                {isRecordingMedia ? "Capturing Audio Chunks..." : "Buffer Ready"}
              </p>
              <span className="text-[10px] text-[#94A3B8]">Voice Audio Buffer</span>
            </div>
          </div>

          {/* Test Action & Last Query Bar */}
          <div className="flex items-center justify-between bg-[#161B2B] border border-white/10 rounded-[8px] p-3">
            <div className="flex items-center gap-2">
              <span className="text-[#E5A93C] font-bold text-[11px]">Last Transmitted Query:</span>
              <span className="text-[#F8FAFC] font-semibold">{lastSubmittedQuery || "None yet"}</span>
            </div>
            <button
              onClick={() => {
                const sample = "When is the strongest period for my career growth?";
                setInterimTranscript(sample);
                accumulatedTranscriptRef.current = sample;
                addDebugLog("SIMULATED_TEST_QUERY", `Injected test query: "${sample}"`);
                handleSend(sample);
              }}
              className="rounded-[8px] bg-[#E5A93C] hover:bg-[#F3C766] px-3 py-1 text-xs font-bold text-[#090A10] transition"
            >
              🧪 Test Trigger Career Query
            </button>
          </div>

          {/* Event Stream Console Logs */}
          <div className="space-y-1 bg-[#090A10] border border-white/10 rounded-[8px] p-3 max-h-48 overflow-y-auto">
            <span className="text-[10px] text-[#94A3B8] block uppercase font-bold mb-1">Live Event Telemetry Log ({debugLogs.length} events)</span>
            {debugLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] font-mono leading-tight py-0.5 border-b border-white/5">
                <span className="text-[#94A3B8] text-[10px] shrink-0">[{log.time}]</span>
                <span className="text-[#E5A93C] font-bold shrink-0">{log.event}:</span>
                <span className="text-[#F8FAFC] truncate">{log.detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODE 1: ULTRA-PREMIUM FULLSCREEN LIVE VOICE EXPERIENCE             */}
      {/* =================================================================== */}
      {viewMode === "live_voice" ? (
        <div className="relative flex-1 min-h-0 h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1E1B4B]/40 via-[#090A10] to-[#090A10] flex flex-col items-start justify-start p-4 sm:p-5 overflow-hidden">
          
          <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-0">
            
            {/* LEFT COLUMN (4 COLS): SEEKER NAME CARD + REALTIME RESPONSE CARD - DYNAMICALLY FIT TO SCREEN */}
            <div className="lg:col-span-4 flex flex-col space-y-3 h-full justify-between min-h-0">
              
              {/* Seeker Profile / Name Card - PERFECTLY ALIGNED AT TOP LEFT */}
              <div className="w-full bg-[#161B2B]/90 backdrop-blur-xl border border-white/10 rounded-[8px] p-4 shadow-xl flex items-center gap-3 shrink-0">
                <div className="size-10 rounded-full bg-gradient-to-br from-[#E5A93C] to-[#F3C766] text-[#090A10] flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                  {activeBirth.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-bold text-[#F8FAFC] block truncate leading-tight">{activeBirth.name}</span>
                  <span className="text-[11px] text-[#94A3B8] block truncate">{getSignName(activeChart.lagna_sign, selectedLanguage)} {t.ascendantLabel} · {getPlanetName(mahaLord, selectedLanguage)}-{getPlanetName(antarLord, selectedLanguage)} {selectedLanguage === "ne" ? "दशा" : selectedLanguage === "hi" ? "दशा" : "Dasha"}</span>
                </div>
              </div>

              {/* Realtime Astrologer Response Card - EXPANDS DYNAMICALLY TO FILL FULL SCREEN HEIGHT */}
              <div className="w-full flex-1 rounded-[8px] border border-[#E5A93C]/30 bg-gradient-to-b from-[#161B2B]/95 via-[#121625]/95 to-[#0D0F19]/95 backdrop-blur-2xl p-5 space-y-4 z-10 shadow-[0_10px_40px_rgba(0,0,0,0.6)] animate-fade-in flex flex-col justify-between min-h-0">
                
                {/* Response Section Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
                  <span className="text-xs font-serif font-bold text-[#E5A93C] flex items-center gap-2">
                    <span className="size-2 rounded-full bg-[#E5A93C] animate-pulse" />
                    📜 {t.realtimeResponse}
                  </span>
                  {teleprompterBasis && (
                    <button
                      onClick={() => {
                        setShowChartDrawer(true);
                        setHighlightedHouse(teleprompterText.includes("7th") ? 7 : 10);
                      }}
                      className="rounded-[8px] bg-[#090A10] border border-[#E5A93C]/40 px-2.5 py-1 text-[10px] font-semibold text-[#F3C766] hover:bg-[#E5A93C]/10 transition shadow-sm truncate max-w-[140px]"
                    >
                      📍 {teleprompterBasis}
                    </button>
                  )}
                </div>

                {/* Response Text Content Body - STRETCHES FULL HEIGHT */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-[260px] max-h-[calc(100vh-280px)]">
                  {teleprompterText ? (
                    <MarkdownRenderer content={teleprompterText} />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-[#94A3B8]/60">
                      <span className="text-3xl">🪔</span>
                      <p className="text-xs font-serif font-semibold text-[#F8FAFC]">{t.listeningToVoice}</p>
                      <p className="text-[10px]">{t.askAnyQuestionOrb}</p>
                    </div>
                  )}
                </div>

                {/* Session Summary & Transcript Button Footer */}
                <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-[#94A3B8] shrink-0">
                  <span>{t.messagesCount}: <strong className="text-[#F8FAFC]">{messages.length}</strong></span>
                  <button
                    onClick={() => setShowTranscriptDrawer(true)}
                    className="text-[#E5A93C] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>📜</span> {t.viewTranscript}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (8 COLS): Cosmic Visualizer Orb + Controls */}
            <div className="lg:col-span-8 flex flex-col items-center justify-between h-full space-y-3 min-h-0">
              
              {/* VERTICALLY CENTERED ORB VISUALIZER SECTION */}
              <div className="flex-1 flex flex-col items-center justify-center my-auto w-full space-y-4">
                {/* Central Animated Cosmic Mandala Orb */}
                <div className="relative flex items-center justify-center size-72 md:size-80 shrink-0">
                  {/* Ambient Backlight Glow Aura */}
                  <div className={`absolute inset-0 m-auto size-72 md:size-80 rounded-full transition-all duration-700 pointer-events-none ${
                    voiceState === "listening"
                      ? "bg-cyan-500/20 blur-3xl scale-125"
                      : voiceState === "thinking"
                      ? "bg-[#E5A93C]/25 blur-3xl scale-110"
                      : voiceState === "speaking"
                      ? "bg-gradient-to-tr from-[#E5A93C]/20 via-[#F3C766]/30 to-amber-500/20 blur-3xl scale-150 animate-pulse-glow"
                      : "bg-transparent"
                  }`} />

                  {/* Pulsing Radar Wave on Listening */}
                  {voiceState === "listening" && (
                    <div className="absolute inset-0 m-auto size-72 md:size-80 rounded-full border border-cyan-500/30 animate-pulse-radar pointer-events-none" />
                  )}

                  {/* Rotating Dasha Wheel on Thinking */}
                  {voiceState === "thinking" && (
                    <div className="absolute inset-0 m-auto size-72 md:size-80 rounded-full border-2 border-dashed border-[#E5A93C]/50 animate-rotate-slow pointer-events-none" />
                  )}

                  {/* Core 3D Spherical Cosmic Mandala Orb */}
                  <button
                    onClick={() => {
                      if (voiceState === "speaking") {
                        handleInterrupt();
                      } else if (interimTranscript.trim()) {
                        handleSend(interimTranscript);
                      } else {
                        activeSessionRef.current = true;
                        updateVoiceState("listening");
                        startOpenAIRealtimeWebRTC();
                      }
                    }}
                    className={`group relative size-56 md:size-64 rounded-full flex items-center justify-center transition-all duration-700 cursor-pointer overflow-hidden backdrop-blur-xl ${
                      voiceState === "listening"
                        ? "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-cyan-950 via-[#161B2B] to-[#090A10] border-2 border-cyan-400/70 shadow-[0_0_90px_rgba(6,182,212,0.45)] scale-105"
                        : voiceState === "thinking"
                        ? "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#2A1F0D] via-[#161B2B] to-[#090A10] border-2 border-[#E5A93C] shadow-[0_0_90px_rgba(229,169,60,0.45)] scale-100"
                        : voiceState === "speaking"
                        ? "bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#38260B] via-[#1E1B4B] to-[#090A10] border-2 border-[#F3C766] shadow-[0_0_110px_rgba(243,199,102,0.6)] scale-110 animate-pulse-glow"
                        : "bg-[#161B2B] border border-white/10 opacity-70"
                    }`}
                  >
                    {/* Sacred Geometric SVG Ring */}
                    <svg className="absolute inset-0 size-full p-2 text-white/15 animate-rotate-slow pointer-events-none" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 2" />
                      <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 2" />
                      <polygon points="50,6 88.1,72 11.9,72" fill="none" stroke="currentColor" strokeWidth="0.4" />
                      <polygon points="50,94 88.1,28 11.9,28" fill="none" stroke="currentColor" strokeWidth="0.4" />
                    </svg>
                    
                    <div className="text-center z-10 p-5 space-y-1">
                      <span className="block text-[34px] leading-none opacity-90">🕉️</span>

                      <span className="mt-3 block text-[14px] font-semibold leading-snug text-[#F8FAFC]">
                        {voiceState === "speaking"
                          ? t.astrologerSpeaking
                          : voiceState === "thinking"
                          ? t.thinkingState
                          : micOpen
                            ? t.listeningState
                            : t.voiceReadyPaused}
                      </span>

                      {/* One meter, inside the circle. Bars while listening are
                          the level from this room, so you can see it hears you;
                          while speaking they move on their own. */}
                      <span className="mt-3 flex h-5 items-end justify-center gap-[3px]" aria-hidden>
                        {[0, 1, 2, 3, 4].map((bar) => {
                          const speaking = voiceState === "speaking";
                          const on = speaking || (micOpen && audioLevel >= (bar + 1) * 16);
                          return (
                            <span
                              key={bar}
                              className={`w-[3px] rounded-full transition-all duration-100 ${
                                speaking
                                  ? `bg-[#F3C766] animate-equalizer-${bar + 1}`
                                  : on
                                    ? "bg-cyan-400"
                                    : "bg-white/15"
                              }`}
                              style={speaking ? undefined : { height: on ? 7 + bar * 3 : 5 }}
                            />
                          );
                        })}
                      </span>

                      <span className="mt-3 block text-[10.5px] text-[#94A3B8]">
                        {voiceState === "speaking" ? t.tapToInterrupt : t.tapToStartVoice}
                      </span>
                    </div>
                  </button>
                </div>

                {/* Live User Speech Teleprompter */}
                {interimTranscript && (
                  <div className="flex items-center gap-2 w-full max-w-xl animate-fade-in z-20 shrink-0">
                    <div className="rounded-[8px] border border-cyan-500/40 bg-cyan-950/80 backdrop-blur-xl px-4 py-2 text-center text-xs font-semibold text-cyan-200 shadow-2xl flex-1 truncate">
                      🗣️ &quot;{interimTranscript}&quot;
                    </div>
                    <button
                      onClick={() => handleSend(interimTranscript)}
                      className="rounded-[8px] bg-gradient-to-r from-[#E5A93C] to-[#F3C766] hover:from-[#F3C766] hover:to-[#E5A93C] px-4 py-2 text-xs font-bold text-[#090A10] transition shrink-0 shadow-lg"
                    >
                      {t.sendNow}
                    </button>
                  </div>
                )}

                {micPermissionError && (
                  <div className="w-full max-w-md rounded-[8px] border border-red-500/30 bg-red-950/50 backdrop-blur-md px-4 py-2 text-center text-[11px] text-red-300 shadow-lg shrink-0">
                    ⚠️ {micPermissionError}
                  </div>
                )}
              </div>

              {/* TIGHT BOTTOM STACK: PROMPT PILLS, CONTROL DOCK & INPUT BAR */}
              <div className="w-full flex flex-col items-center gap-2.5 shrink-0 z-20">
                {/* Dynamic Quick Prompt Pills */}
                <div className="w-full max-w-xl flex gap-2 overflow-x-auto justify-center z-10 shrink-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {(selectedLanguage === "ne"
                    ? [
                        { label: "✨ करियरको योग?", query: "मेरो करियर र नोकरीमा कहिले राम्रो समय आउँछ?" },
                        { label: "❤️ विवाह र ७औं भाव?", query: "मेरो विवाह र दाम्पत्य जीवनको विश्लेषण गर्नुहोस्।" },
                        { label: `🪔 ${getPlanetName(mahaLord, selectedLanguage)} दशा उपाय?`, query: `मेरो ${getPlanetName(mahaLord, selectedLanguage)} महादशाको लागि के शान्ति उपायहरू छन्?` },
                      ]
                    : selectedLanguage === "hi"
                    ? [
                        { label: "✨ करियर का समय?", query: "मेरे करियर और पदोन्नति का सबसे अच्छा समय कब है?" },
                        { label: "❤️ विवाह और 7वां भाव?", query: "मेरे विवाह और 7वें भाव का विस्तृत विश्लेषण करें।" },
                        { label: `🪔 ${getPlanetName(mahaLord, selectedLanguage)} दशा उपाय?`, query: `मेरी ${getPlanetName(mahaLord, selectedLanguage)} महादशा के लिए कौन से उपाय करने चाहिए?` },
                      ]
                    : [
                        { label: "✨ Career shift timing?", query: "When is the strongest period for my career growth?" },
                        { label: "❤️ Marriage & relationship?", query: "Analyze my 7th house for marriage & relationship." },
                        { label: `🪔 ${getPlanetName(mahaLord, selectedLanguage)} Remedies?`, query: `What remedies help my ${getPlanetName(mahaLord, selectedLanguage)} Dasha period?` },
                      ]
                  ).map((chip) => (
                    <button
                      key={chip.label}
                      onClick={() => handleSend(chip.query)}
                      className="shrink-0 rounded-[8px] border border-white/10 bg-[#161B2B]/80 backdrop-blur-md px-3.5 py-1.5 text-xs text-[#F8FAFC] hover:border-[#E5A93C] hover:text-[#F3C766] hover:shadow-[0_0_15px_rgba(229,169,60,0.2)] transition-all shadow-md"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* CONTROL DOCK (Voice, Mute, Kundali, Interrupt, Transcript, Exit) */}
                <div className="w-full max-w-2xl rounded-[8px] border border-white/10 bg-[#161B2B]/95 backdrop-blur-2xl p-2 flex flex-wrap items-center justify-between gap-1.5 z-20 shadow-2xl shrink-0">
                  {/* Custom Voice Selector with Sound Preview */}
                  <CustomVoiceSelector
                    selectedVoice={selectedVoice}
                    onSelectVoice={(vId) => handleVoiceChange(vId)}
                    language={selectedLanguage}
                  />

                  {/* Mute / Unmute Button */}
                  <button
                    type="button"
                    onClick={() => setIsMicMuted(!isMicMuted)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                      isMicMuted ? "bg-red-500/20 text-red-400 border border-red-500/40" : "text-[#F8FAFC] hover:bg-white/5 border border-white/10"
                    }`}
                  >
                    {isMicMuted ? <MicOff className="size-3.5 text-red-400" /> : <Mic className="size-3.5 text-[#E5A93C]" />}
                    <span className="text-[11px]">{isMicMuted ? t.unmute : t.mute}</span>
                  </button>

                  {/* Kundali Chart Drawer Button */}
                  <button
                    type="button"
                    onClick={() => setShowChartDrawer(!showChartDrawer)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                      showChartDrawer ? "bg-[#E5A93C]/20 text-[#F3C766] border border-[#E5A93C]/40" : "text-[#F8FAFC] hover:bg-white/5 border border-white/10"
                    }`}
                  >
                    <Map className="size-3.5 text-[#E5A93C]" />
                    <span className="text-[11px]">{t.kundaliChart}</span>
                  </button>

                  {/* Interrupt Button */}
                  <button
                    type="button"
                    onClick={handleInterrupt}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] bg-gradient-to-r from-[#E5A93C] to-[#F3C766] text-[#090A10] font-bold text-xs hover:shadow-[0_0_20px_rgba(229,169,60,0.4)] transition shadow-lg scale-105 cursor-pointer active:scale-95"
                  >
                    <Zap className="size-3.5 fill-current" />
                    <span className="text-[11px]">{t.interrupt}</span>
                  </button>

                  {/* Transcript Drawer Button */}
                  <button
                    type="button"
                    onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition cursor-pointer ${
                      showTranscriptDrawer ? "bg-[#E5A93C]/20 text-[#F3C766] border border-[#E5A93C]/40" : "text-[#F8FAFC] hover:bg-white/5 border border-white/10"
                    }`}
                  >
                    <FileText className="size-3.5 text-[#E5A93C]" />
                    <span className="text-[11px]">{t.transcript}</span>
                  </button>

                  {/* Exit Consultation Button */}
                  <button
                    type="button"
                    onClick={() => {
                      toggleLiveVoiceMode(false);
                      router.push("/reading");
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition cursor-pointer"
                  >
                    <LogOut className="size-3.5 text-red-400" />
                    <span className="text-[11px]">{t.exitVoice}</span>
                  </button>
                </div>

                {/* DIRECT TEXT INPUT BAR - ALIGNED FLUSH AT BOTTOM */}
                <div className="w-full max-w-2xl z-20 shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="flex items-center gap-2.5"
                  >
                    <button
                      type="button"
                      onClick={toggleDictation}
                      className={`grid size-11 shrink-0 place-items-center rounded-[8px] border transition group cursor-pointer active:scale-95 ${
                        isDictating
                          ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                          : "border-white/20 bg-[#161B2B]/95 text-[#94A3B8] hover:text-[#F3C766] hover:border-[#E5A93C]/50"
                      }`}
                      title={isDictating ? "Stop Voice Dictation" : "Dictate Question by Voice"}
                    >
                      {isDictating ? (
                        <MicOff className="size-5 text-red-400" />
                      ) : (
                        <Mic className="size-5 group-hover:scale-110 transition-transform text-[#E5A93C]" />
                      )}
                    </button>

                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder={isDictating ? "Listening... Speak now..." : t.askPlaceholder}
                      className={`flex-1 rounded-[8px] border bg-[#161B2B]/95 backdrop-blur-2xl px-5 py-3.5 text-sm text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:border-[#E5A93C] focus:ring-2 focus:ring-[#E5A93C]/40 focus:outline-none transition shadow-2xl ${
                        isDictating ? "border-amber-400/70 ring-2 ring-amber-400/20" : "border-white/20"
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!inputQuery.trim() || isThinking}
                      className="rounded-[8px] bg-gradient-to-r from-[#E5A93C] to-[#F3C766] hover:from-[#F3C766] hover:to-[#E5A93C] px-6 py-3.5 text-xs sm:text-sm font-bold text-[#090A10] transition shrink-0 disabled:opacity-40 shadow-xl active:scale-95 cursor-pointer"
                    >
                      {isThinking ? "..." : t.sendQuery}
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>

          {/* Collapsible Floating Kundali Chart Drawer */}
          {showChartDrawer && (
            <div className="absolute top-16 right-6 w-80 rounded-[8px] border border-white/10 bg-[#161B2B]/95 backdrop-blur-2xl p-4 shadow-2xl z-30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="font-serif text-xs font-bold text-[#F8FAFC]">
                  {activeBirth.name}&apos;s D1 Kundali
                </h4>
                <button
                  onClick={() => setShowChartDrawer(false)}
                  className="text-xs text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  ✕ {t.closeChartDrawer}
                </button>
              </div>
              <div className="bg-[#090A10] rounded-[8px] border border-[#E5A93C]/30 p-2">
                <NorthIndianChart
                  chart={activeChart}
                  selectedHouse={highlightedHouse}
                  onSelectHouse={(h) => setHighlightedHouse((prev) => (prev === h ? null : h))}
                />
              </div>
              <p className="text-[10px] text-center text-[#94A3B8]">
                {getSignName(activeChart.lagna_sign, selectedLanguage)} {t.ascendantLabel} ({activeChart.lagna_degree.toFixed(2)}°)
              </p>
            </div>
          )}

          {/* Collapsible Chat Transcript Drawer */}
          {showTranscriptDrawer && (
            <div className="absolute inset-x-6 top-16 bottom-24 rounded-[8px] border border-white/10 bg-[#161B2B]/95 backdrop-blur-2xl p-6 shadow-2xl z-30 flex flex-col animate-fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <h4 className="font-serif text-xs font-bold text-[#F8FAFC]">
                  Live Consultation History ({messages.length} messages)
                </h4>
                <button
                  onClick={() => setShowTranscriptDrawer(false)}
                  className="text-xs font-semibold text-[#E5A93C] hover:underline"
                >
                  ✕ {t.closeTranscriptDrawer}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-[12px] text-xs ${
                      m.sender === "user"
                        ? "bg-gradient-to-r from-[#E5A93C] to-[#F3C766] text-[#090A10] font-semibold ml-auto max-w-[80%]"
                        : "bg-[#090A10] text-[#F8FAFC] border border-white/10 max-w-[85%]"
                    }`}
                  >
                    <MarkdownRenderer content={m.text} isUser={m.sender === "user"} />
                    <span className="block mt-1 text-[9px] opacity-70">{m.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* =================================================================== */
        /* MODE 2: INTERACTIVE ASTROLOGER DESK VIEW (SPLIT SCREEN VIEW)        */
        /* =================================================================== */
        <div className="flex-1 min-h-0 h-full grid gap-0 lg:grid-cols-[38%_62%] overflow-hidden">
          
          {/* LEFT COLUMN (38% width) - Interactive Kundali Reference & Seeker Context */}
          <aside className="h-full min-h-0 space-y-4 overflow-y-auto border-r border-white/[0.06] bg-ink2 p-5">
            
            {/* Seeker Profile & D1 Chart Reference Card */}
            <div className="space-y-4 rounded-[12px] border border-white/[0.09] bg-card p-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-full bg-gradient-to-br from-[#E5A93C] to-[#F3C766] text-[#090A10] flex items-center justify-center font-bold text-xs shadow-md">
                    {activeBirth.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold leading-tight text-paper">
                      {activeBirth.name}
                    </h2>
                    <span className="text-[10px] text-[#94A3B8] block">{t.d1SiderealBirthChart}</span>
                  </div>
                </div>
                <span className="rounded-[8px] bg-[#E5A93C]/10 border border-[#E5A93C]/30 text-[#F3C766] px-2.5 py-0.5 text-[10px] font-bold">
                  {getSignName(activeChart.lagna_sign, selectedLanguage)} {t.ascendantLabel}
                </span>
              </div>
              
              {/* Illuminated North Indian Chart Container */}
              <div className="relative mx-auto w-full max-w-[290px] rounded-[10px] border border-white/[0.08] bg-ink p-2.5">
                <NorthIndianChart
                  chart={activeChart}
                  selectedHouse={highlightedHouse}
                  onSelectHouse={(h) => setHighlightedHouse((prev) => (prev === h ? null : h))}
                />
              </div>
              <p className="text-center text-[10px] text-[#94A3B8]/80 leading-tight">
                {t.tapHouseHelper}
              </p>
            </div>

            {/* Quick Dasha & Active Time Lords Widget */}
            <div className="space-y-3 rounded-[12px] border border-white/[0.09] bg-card p-4">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-2.5">
                <h3 className="text-[12.5px] font-semibold text-paper">{t.activeTimeLords}</h3>
                <span className="text-[10px] uppercase tracking-[0.1em] text-faint">
                  {t.vimshottariLabel}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <DashaCell
                  label={t.mahadashaLabel}
                  lord={getPlanetName(mahaLord, selectedLanguage)}
                  period={runningNow.maha}
                  tone="text-gold"
                />
                <DashaCell
                  label={t.antardashaLabel}
                  lord={getPlanetName(antarLord, selectedLanguage)}
                  period={runningNow.antar}
                  tone="text-amber-300"
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.07] pt-2.5 text-[11.5px] text-faint">
                <span>{t.ascendantPlacementLabel}</span>
                <span className="font-medium text-paper">
                  {getSignName(activeChart.lagna_sign, selectedLanguage)} ·{" "}
                  {activeChart.lagna_degree.toFixed(2)}°
                </span>
              </div>
            </div>

          </aside>

          {/* RIGHT COLUMN (62% width) - Interactive Live Chat Desk */}
          <main className="flex flex-col flex-1 min-h-0 h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#131728] via-[#090A10] to-[#090A10] overflow-hidden">
            
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
                  <h2 className="text-[13px] font-semibold text-paper">{t.consultSuggestedTopics}</h2>
                  <p className="mt-1 text-[12.5px] leading-[1.7] text-faint">{t.askAnythingHint}</p>
                  <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                    {suggestions.map((chip) => (
                      <button
                        key={chip.title}
                        onClick={() => handleSend(chip.query)}
                        className="group flex items-start gap-3 rounded-[10px] border border-white/[0.09] bg-card p-3.5 text-left transition-colors hover:border-gold/40 hover:bg-ink2"
                      >
                        <span className="text-[15px] leading-none">{chip.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium text-paper">{chip.title}</span>
                          <span className="mt-1 block text-[11.5px] leading-[1.6] text-faint">
                            {chip.query}
                          </span>
                        </span>
                        <ArrowLeft className="mt-0.5 size-3.5 shrink-0 rotate-180 text-faint transition-colors group-hover:text-gold" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Thinking / Analyzing Indicator */}
              {isThinking && (
                <div className="flex items-center gap-3 p-4 rounded-[14px] border border-white/10 bg-[#161B2B]/90 backdrop-blur-md max-w-xs animate-pulse">
                  <div className="size-6 rounded-full bg-gradient-to-br from-[#E5A93C] to-[#F3C766] text-[#090A10] flex items-center justify-center font-bold text-xs">
                    <span>🕉️</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#F3C766] font-medium">
                    <span className="size-2 rounded-full bg-[#E5A93C] animate-bounce" />
                    <span className="size-2 rounded-full bg-[#F3C766] animate-bounce delay-150" />
                    <span className="size-2 rounded-full bg-[#E5A93C] animate-bounce delay-300" />
                    <span className="ml-2">{t.analyzingSpeech}</span>
                  </div>
                </div>
              )}
            </div>

            {realtimeError && (
              <div className="mx-4 mb-2 flex shrink-0 items-center gap-2.5 rounded-[8px] border border-gold/30 bg-[#1A150B] px-3.5 py-2.5">
                <TriangleAlert className="size-4 shrink-0 text-gold" />
                <span className="min-w-0 flex-1 text-[12px] leading-[1.6] text-muted">
                  {t.voiceFellBack}
                </span>
                <button
                  type="button"
                  onClick={() => setRealtimeError(null)}
                  aria-label={t.dashClose}
                  className="shrink-0 text-[11px] text-faint transition-colors hover:text-paper"
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
                  className="group inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-white/[0.09] bg-card px-3.5 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-paper"
                >
                  <span className="text-xs">{chip.icon}</span>
                  <span className="font-medium text-[11px] sm:text-xs">{chip.title}</span>
                </button>
              ))}
            </div>

            {/* Bottom Mic & Message Input Dock */}
            <footer className="border-t border-white/10 bg-[#161B2B]/90 backdrop-blur-xl p-4 shadow-2xl">
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
                  className="grid size-11 shrink-0 place-items-center rounded-[8px] border border-[#E5A93C]/50 bg-gradient-to-br from-[#161B2B] to-[#2A1F0D] text-[#F3C766] hover:border-[#E5A93C] hover:shadow-[0_0_20px_rgba(229,169,60,0.35)] hover:scale-105 transition group cursor-pointer active:scale-95"
                  title={
                    selectedLanguage === "ne"
                      ? "प्रत्यक्ष एआई भ्वाइस परामर्श सुरु गर्नुहोस्"
                      : selectedLanguage === "hi"
                      ? "लाइव एआई वॉइस परामर्श शुरू करें"
                      : "Talk to Live AI Astrologer (Realtime Voice Mode)"
                  }
                >
                  <div className="relative">
                    <Headphones className="size-5 text-[#F3C766] group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-[#E5A93C] animate-ping" />
                  </div>
                </button>

                {/* Button 2: Speech-to-Text Dictation Mic (fills inputQuery field) */}
                <button
                  type="button"
                  onClick={toggleDictation}
                  className={`grid size-11 shrink-0 place-items-center rounded-[8px] border transition group cursor-pointer active:scale-95 ${
                    isDictating
                      ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                      : "border-white/10 bg-[#090A10] text-[#94A3B8] hover:text-[#F3C766] hover:border-[#E5A93C]/50"
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
                    <Mic className="size-5 group-hover:scale-110 transition-transform text-[#E5A93C]" />
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
                  className={`flex-1 rounded-[8px] border bg-[#090A10] px-4 py-3 text-xs sm:text-sm text-[#F8FAFC] placeholder-[#94A3B8]/50 focus:border-[#E5A93C] focus:ring-1 focus:ring-[#E5A93C]/40 focus:outline-none transition ${
                    isDictating ? "border-amber-400/70 ring-2 ring-amber-400/20" : "border-white/10"
                  }`}
                />

                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isThinking}
                  className="rounded-[8px] bg-gradient-to-r from-[#E5A93C] to-[#F3C766] hover:from-[#F3C766] hover:to-[#E5A93C] px-6 py-3 text-xs sm:text-sm font-bold text-[#090A10] transition shadow-lg disabled:opacity-40 cursor-pointer active:scale-95 shrink-0"
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
    <div className="rounded-[10px] border border-white/[0.06] bg-ink p-3">
      <span className="block text-[10px] uppercase tracking-[0.1em] text-faint">{label}</span>
      <span className={`mt-1 block text-[15px] font-bold ${tone}`}>{lord}</span>
      {period && (
        <span className="mt-1 block text-[10.5px] tabular-nums text-faint">
          {period.start.slice(0, 4)} – {period.end.slice(0, 4)}
        </span>
      )}
    </div>
  );
}
