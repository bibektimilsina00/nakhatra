import { authHeaders } from "@/features/auth/store/auth-store";
import type { BirthDetailsIn, Chart } from "@/features/kundali/types";

export type RealtimeState =
  | "connecting"
  | "connected"
  | "speaking"
  | "listening"
  | "disconnected";

export type RealtimeWebRTCCallbacks = {
  onStateChange?: (state: RealtimeState) => void;
  onTranscriptDelta?: (delta: string) => void;
  onTranscriptComplete?: (text: string) => void;
  onUserTranscript?: (text: string) => void;
  /** The reader started talking. Whatever else is playing should stop. */
  onUserSpeechStart?: () => void;
  /** Microphone opened or closed, so the UI can say which. */
  onMicEnabledChange?: (enabled: boolean) => void;
  onError?: (error: string) => void;
  onDebugLog?: (event: string, detail: string) => void;
};

/**
 * Microphone constraints, and the reason each one is here.
 *
 * `echoCancellation` is the one that matters. Without it the microphone picks
 * up the astrologer's own voice from the speakers, the server's VAD hears
 * "speech", and the model interrupts itself mid-sentence — which is precisely
 * what "it does not listen properly" looks like from the outside. It was
 * absent: the old code asked for `{ audio: true }` and took the defaults,
 * which on desktop Chrome leaves processing off for a WebRTC track.
 */
const MIC_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  // The model resamples anyway; asking for less keeps cheap laptop mics from
  // handing over a channel of hiss.
  channelCount: 1,
};

/** How long to wait before treating a dropped connection as dead. */
const RECONNECT_DELAY_MS = 1200;
const MAX_RECONNECTS = 3;

export class OpenAIRealtimeWebRTCClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private mediaStream: MediaStream | null = null;
  private remoteAudioEl: HTMLAudioElement | null = null;
  private callbacks: RealtimeWebRTCCallbacks;
  private currentAssistantTranscript = "";
  private assistantIsSpeaking = false;
  /** Set by `disconnect()`, so a deliberate close never triggers a reconnect. */
  private closedByUs = false;
  private reconnects = 0;
  private lastArgs: {
    chart: Chart;
    birth: BirthDetailsIn;
    language: "en" | "ne" | "hi";
    voice: string;
  } | null = null;

  constructor(callbacks: RealtimeWebRTCCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public async connect(
    chart: Chart,
    birth: BirthDetailsIn,
    language: "en" | "ne" | "hi" = "en",
    voice: string = "ash",
  ): Promise<boolean> {
    this.closedByUs = false;
    this.lastArgs = { chart, birth, language, voice };

    try {
      this.callbacks.onStateChange?.("connecting");
      this.callbacks.onDebugLog?.(
        "WEBRTC_INIT",
        `Requesting ephemeral session key (${language.toUpperCase()}, voice: ${voice})`,
      );

      const tokenRes = await fetch("/api/v1/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ chart, birth, language, voice }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.client_secret) {
        this.callbacks.onDebugLog?.(
          "WEBRTC_UNAVAILABLE",
          tokenData.error || tokenData.detail || "Realtime ephemeral key not available",
        );
        return false;
      }

      const clientSecret = tokenData.client_secret;
      const model = tokenData.model || "gpt-4o-realtime-preview-2024-12-17";

      const pc = new RTCPeerConnection();
      this.pc = pc;

      // The element has to be in the document. A detached <audio> plays in
      // Chrome and stays silent in Safari, which read as "it connected but
      // said nothing".
      const audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.setAttribute("playsinline", "");
      audioEl.style.display = "none";
      document.body.appendChild(audioEl);
      this.remoteAudioEl = audioEl;

      pc.ontrack = (e) => {
        audioEl.srcObject = e.streams[0];
        // Autoplay can still be refused if the session was not opened from a
        // gesture. Surface it rather than sitting mute.
        void audioEl.play().catch((err) => {
          this.callbacks.onDebugLog?.("WEBRTC_AUTOPLAY_BLOCKED", String(err));
          this.callbacks.onError?.("Tap the screen to allow audio playback.");
        });
        this.callbacks.onDebugLog?.("WEBRTC_REMOTE_TRACK", "Receiving astrologer audio");
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: MIC_CONSTRAINTS });
      this.mediaStream = stream;
      // With the stream as the second argument, so the track is published as
      // part of a stream rather than as a loose track some SFUs will drop.
      for (const track of stream.getAudioTracks()) pc.addTrack(track, stream);
      this.callbacks.onDebugLog?.(
        "WEBRTC_LOCAL_MIC",
        `Mic added (echoCancellation: ${stream.getAudioTracks()[0]?.getSettings().echoCancellation})`,
      );

      const dc = pc.createDataChannel("oai-events");
      this.dc = dc;

      dc.addEventListener("open", () => {
        this.callbacks.onDebugLog?.("WEBRTC_DATACHANNEL_OPEN", "Event channel established");
        // The ephemeral session already carries this, but re-asserting it makes
        // a reconnect behave identically to a first connect instead of relying
        // on whatever the reused token was minted with.
        // Turn detection moved under `audio.input` in the current API; sent at
        // the old top level it is ignored, and the session keeps whatever
        // defaults it was minted with.
        this.send({
          type: "session.update",
          session: {
            type: "realtime",
            audio: {
              input: {
                // Matches what the session was minted with. Semantic, so a
                // cough or a passing car does not count as a question.
                turn_detection: {
                  type: "semantic_vad",
                  eagerness: "medium",
                  create_response: true,
                  // Half-duplex; see `setMicEnabled`.
                  interrupt_response: false,
                },
              },
            },
          },
        });
      });

      dc.addEventListener("message", (e) => {
        try {
          this.handleRealtimeEvent(JSON.parse(e.data));
        } catch (err) {
          // Was silently swallowed. A malformed event is worth one line.
          this.callbacks.onDebugLog?.("WEBRTC_BAD_EVENT", String(err));
        }
      });

      // A dropped connection used to go unnoticed: the UI kept saying
      // "connected" while nothing worked and no audio moved.
      pc.addEventListener("connectionstatechange", () => {
        const state = pc.connectionState;
        this.callbacks.onDebugLog?.("WEBRTC_STATE", state);
        if (state === "failed" || state === "disconnected") this.handleDrop();
      });

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // `/v1/realtime` answers "The Realtime Beta API is no longer supported";
      // the WebRTC offer goes to `/v1/realtime/calls` now.
      const sdpRes = await fetch(`https://api.openai.com/v1/realtime/calls?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpRes.ok) {
        const sdpErr = await sdpRes.text();
        this.callbacks.onDebugLog?.("WEBRTC_SDP_FAIL", `SDP exchange failed: ${sdpErr}`);
        this.callbacks.onError?.("Could not reach the voice service.");
        this.disconnect();
        return false;
      }

      await pc.setRemoteDescription({ type: "answer", sdp: await sdpRes.text() });
      this.reconnects = 0;
      this.callbacks.onStateChange?.("connected");
      this.callbacks.onDebugLog?.("WEBRTC_CONNECTED", "Connected to the realtime gateway");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.callbacks.onDebugLog?.("WEBRTC_ERROR", message);
      this.callbacks.onError?.(message || "Voice connection failed");
      this.disconnect();
      return false;
    }
  }

  /** Reconnect once the transport drops, unless we closed it on purpose. */
  private handleDrop() {
    if (this.closedByUs || !this.lastArgs) return;
    if (this.reconnects >= MAX_RECONNECTS) {
      this.callbacks.onError?.("Voice connection lost.");
      this.disconnect();
      return;
    }
    const attempt = ++this.reconnects;
    this.callbacks.onDebugLog?.("WEBRTC_RECONNECT", `Attempt ${attempt}/${MAX_RECONNECTS}`);
    const args = this.lastArgs;
    this.teardown();
    setTimeout(() => {
      if (this.closedByUs) return;
      void this.connect(args.chart, args.birth, args.language, args.voice);
    }, RECONNECT_DELAY_MS * attempt);
  }

  private send(event: Record<string, unknown>) {
    if (this.dc?.readyState !== "open") return;
    this.dc.send(JSON.stringify(event));
  }

  private handleRealtimeEvent(event: { type?: string; [key: string]: unknown }) {
    if (!event?.type) return;

    switch (event.type) {
      case "response.audio_transcript.delta":
        // The microphone closes for the duration. Two things follow from it:
        // the astrologer cannot hear itself or the room while it talks, and the
        // state cannot flip to "listening" mid-sentence because no speech
        // events can arrive — which is the "it says listening while it is
        // speaking" that had no reproducible trigger.
        if (!this.assistantIsSpeaking) this.setMicEnabled(false);
        this.assistantIsSpeaking = true;
        this.callbacks.onStateChange?.("speaking");
        this.currentAssistantTranscript += (event.delta as string) || "";
        this.callbacks.onTranscriptDelta?.((event.delta as string) || "");
        break;

      case "response.audio_transcript.done":
        this.assistantIsSpeaking = false;
        this.callbacks.onTranscriptComplete?.(this.currentAssistantTranscript);
        this.currentAssistantTranscript = "";
        this.setMicEnabled(true);
        this.callbacks.onStateChange?.("listening");
        break;

      case "conversation.item.input_audio_transcription.completed": {
        const heard = ((event.transcript as string) || "").trim();
        // Noise that got past turn detection still reaches transcription, and
        // comes back as "", "." or a lone "uh". Posting that as the reader's
        // question puts an empty bubble in the transcript and makes the
        // astrologer answer something nobody asked.
        if (!isSpeech(heard)) {
          this.callbacks.onDebugLog?.("WEBRTC_NOISE_IGNORED", JSON.stringify(heard));
          break;
        }
        this.callbacks.onUserTranscript?.(heard);
        break;
      }

      case "input_audio_buffer.speech_started":
        // Should not arrive while the astrologer speaks — the microphone is
        // muted then. If it does, the mute lost a race, so ignore it rather
        // than announce "listening" over audio that is still playing.
        if (this.assistantIsSpeaking) {
          this.callbacks.onDebugLog?.("WEBRTC_SPEECH_WHILE_SPEAKING", "ignored");
          break;
        }
        this.callbacks.onUserSpeechStart?.();
        this.callbacks.onStateChange?.("listening");
        break;

      case "error": {
        // The server's own errors were dropped on the floor entirely.
        const detail = event.error as { message?: string } | undefined;
        const message = detail?.message || "The voice service reported an error.";
        this.callbacks.onDebugLog?.("WEBRTC_SERVER_ERROR", message);
        this.callbacks.onError?.(message);
        break;
      }
    }
  }

  public sendTextMessage(text: string) {
    this.send({
      type: "conversation.item.create",
      item: { type: "message", role: "user", content: [{ type: "input_text", text }] },
    });
    this.send({ type: "response.create" });
  }

  /**
   * Open or close the microphone without tearing the session down.
   *
   * `track.enabled = false` keeps the transport up and sends silence, so the
   * session survives and the browser's recording indicator stays honest about
   * whether anything is being captured.
   */
  private setMicEnabled(on: boolean) {
    const tracks = this.mediaStream?.getAudioTracks() ?? [];
    for (const track of tracks) track.enabled = on;
    if (tracks.length) this.callbacks.onMicEnabledChange?.(on);
  }

  /**
   * Take the turn. Stops the astrologer and reopens the microphone.
   *
   * Called from a button rather than from speech: the caller decides when to
   * interrupt, which is the whole point of running half-duplex.
   */
  public takeTurn() {
    if (this.assistantIsSpeaking) {
      this.send({ type: "response.cancel" });
      this.assistantIsSpeaking = false;
      this.currentAssistantTranscript = "";
      this.callbacks.onDebugLog?.("WEBRTC_USER_TOOK_TURN", "Stopped the astrologer");
    }
    this.setMicEnabled(true);
    this.callbacks.onStateChange?.("listening");
  }

  /**
   * The live microphone stream.
   *
   * Shared rather than duplicated: the level meter used to open a second
   * `getUserMedia` on the same device. Two captures is not merely wasteful —
   * on Bluetooth headsets and on mobile, the second one renegotiates the audio
   * route and the first goes quiet, which is the "sometimes it stops hearing
   * me" that has no pattern to it.
   */
  public get micStream(): MediaStream | null {
    return this.mediaStream;
  }

  /** Whether audio is actually flowing, rather than whether we tried to connect. */
  public get connected(): boolean {
    return this.pc?.connectionState === "connected";
  }

  private teardown() {
    if (this.dc) {
      try {
        this.dc.close();
      } catch {}
      this.dc = null;
    }
    if (this.pc) {
      try {
        this.pc.close();
      } catch {}
      this.pc = null;
    }
    if (this.mediaStream) {
      // Releasing the tracks is what turns the browser's recording indicator
      // off. Leaving them live held the microphone open for the whole session.
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    if (this.remoteAudioEl) {
      this.remoteAudioEl.pause();
      this.remoteAudioEl.srcObject = null;
      this.remoteAudioEl.remove();
      this.remoteAudioEl = null;
    }
    this.assistantIsSpeaking = false;
    this.currentAssistantTranscript = "";
  }

  public disconnect() {
    this.closedByUs = true;
    this.teardown();
    this.callbacks.onStateChange?.("disconnected");
    this.callbacks.onDebugLog?.("WEBRTC_DISCONNECTED", "Session closed");
  }
}

/**
 * Whether a transcript is worth treating as a question.
 *
 * Transcription is willing to guess. A door closing comes back as "." or
 * "Thank you." or a single syllable — short strings with no substance. Anything
 * a person actually asked clears this bar easily, so the test is deliberately
 * generous: it only rejects what is plainly not speech.
 */
function isSpeech(text: string): boolean {
  const stripped = text.replace(/[\p{P}\p{S}\s]/gu, "");
  if (stripped.length < 2) return false;
  // Common single-token hallucinations from silence, across the three languages
  // this app speaks.
  return !/^(uh|um|hmm|ah|oh|mm|hm|आ|अँ|हँ|उम)$/i.test(stripped);
}
