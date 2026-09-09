import { authHeaders } from "@/features/auth/store/auth-store";
import type { BirthDetailsIn, Chart } from "@/features/kundali/types";
import type {
  RealtimeWebRTCCallbacks,
} from "@/lib/utils/openai-realtime-webrtc";

/**
 * Gemini Live over WebSocket, wearing the exact callback surface of the
 * OpenAI WebRTC client so the workspace cannot tell them apart.
 *
 * The transport is the whole difference: Gemini has no WebRTC, so this
 * client does by hand what the browser did for free there — capture the
 * microphone as 16 kHz PCM16 and stream it up, and schedule the returned
 * 24 kHz PCM16 onto an AudioContext for playback. The backend decides which
 * provider a session uses; this class only ever sees a minted token.
 */

const WS_HOST = "wss://generativelanguage.googleapis.com/ws";
const WS_PATH = "google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained";

/** Our voice ids are OpenAI's; Gemini has its own cast. Nearest neighbours. */
const GEMINI_VOICES: Record<string, string> = {
  onyx: "Charon",   // deep male
  ash: "Fenrir",    // clear male
  echo: "Puck",     // bright male
  ballad: "Orus",
  verse: "Zephyr",
  alloy: "Zephyr",
  sage: "Kore",     // serene female
  coral: "Aoede",   // warm female
  shimmer: "Leda",
};

type SessionGrant = {
  client_secret: string;
  model: string;
  instructions?: string | null;
};

export class GeminiLiveClient {
  private callbacks: RealtimeWebRTCCallbacks;
  private ws: WebSocket | null = null;
  private mediaStream: MediaStream | null = null;
  private captureCtx: AudioContext | null = null;
  private captureNode: ScriptProcessorNode | null = null;
  private playbackCtx: AudioContext | null = null;
  private playhead = 0;
  private liveSources = new Set<AudioBufferSourceNode>();
  private muted = false;
  private closedByUs = false;
  private assistantTranscript = "";
  private userTranscript = "";
  private assistantIsSpeaking = false;

  constructor(callbacks: RealtimeWebRTCCallbacks = {}) {
    this.callbacks = callbacks;
  }

  public async connect(
    chart: Chart,
    birth: BirthDetailsIn,
    language: "en" | "ne" | "hi" = "en",
    voice: string = "ash",
    grant?: SessionGrant,
  ): Promise<boolean> {
    this.closedByUs = false;
    try {
      this.callbacks.onStateChange?.("connecting");

      let session = grant;
      if (!session) {
        const res = await fetch("/api/v1/realtime-session", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ chart, birth, language, voice }),
        });
        const data = await res.json();
        if (!res.ok || !data.client_secret || data.provider !== "gemini") {
          this.callbacks.onDebugLog?.("GEMINI_UNAVAILABLE", "No Gemini session granted");
          return false;
        }
        session = data;
      }
      const { client_secret, model, instructions } = session as SessionGrant;

      // Microphone first: if permission is refused there is nothing to say
      // to the socket, and the browser prompt should come before any I/O.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      this.mediaStream = stream;

      const ok = await this.openSocket(client_secret, model, voice, instructions ?? "");
      if (!ok) {
        this.teardown();
        return false;
      }

      this.startCapture(stream);
      this.callbacks.onMicEnabledChange?.(true);
      this.callbacks.onStateChange?.("listening");
      this.callbacks.onDebugLog?.("GEMINI_LIVE", `Live session on ${model}`);
      return true;
    } catch (err) {
      this.callbacks.onDebugLog?.("GEMINI_CONNECT_ERROR", String(err));
      this.teardown();
      return false;
    }
  }

  private openSocket(
    token: string,
    model: string,
    voice: string,
    instructions: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(`${WS_HOST}/${WS_PATH}?access_token=${encodeURIComponent(token)}`);
      this.ws = ws;
      let settled = false;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            setup: {
              model: `models/${model}`,
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: GEMINI_VOICES[voice] ?? "Charon" },
                  },
                },
              },
              systemInstruction: { parts: [{ text: instructions }] },
              // Without these the conversation is audio-only and the history
              // panel stays empty — the same lesson the OpenAI path taught.
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          }),
        );
      };

      ws.onmessage = async (ev) => {
        // Gemini frames arrive as Blobs, not strings.
        const raw = typeof ev.data === "string" ? ev.data : await (ev.data as Blob).text();
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(raw);
        } catch {
          this.callbacks.onDebugLog?.("GEMINI_BAD_FRAME", raw.slice(0, 120));
          return;
        }
        if ("setupComplete" in msg && !settled) {
          settled = true;
          resolve(true);
          return;
        }
        this.handleServerMessage(msg);
      };

      ws.onerror = () => {
        this.callbacks.onDebugLog?.("GEMINI_WS_ERROR", "WebSocket error");
        if (!settled) {
          settled = true;
          resolve(false);
        }
      };

      ws.onclose = (ev) => {
        this.callbacks.onDebugLog?.("GEMINI_WS_CLOSED", `${ev.code} ${ev.reason || ""}`.trim());
        if (!settled) {
          settled = true;
          resolve(false);
        } else if (!this.closedByUs) {
          this.callbacks.onError?.("Live voice disconnected.");
          this.callbacks.onStateChange?.("disconnected");
        }
      };
    });
  }

  private handleServerMessage(msg: Record<string, unknown>) {
    const content = msg.serverContent as Record<string, unknown> | undefined;
    if (!content) return;

    // Barge-in: the server noticed the caller speaking over the reply.
    // What has already been scheduled locally must stop too.
    if (content.interrupted) {
      this.stopPlayback();
      this.assistantIsSpeaking = false;
      this.callbacks.onUserSpeechStart?.();
      this.callbacks.onStateChange?.("listening");
    }

    const inTr = content.inputTranscription as { text?: string } | undefined;
    if (inTr?.text) this.userTranscript += inTr.text;

    const outTr = content.outputTranscription as { text?: string } | undefined;
    if (outTr?.text) {
      this.assistantTranscript += outTr.text;
      this.callbacks.onTranscriptDelta?.(outTr.text);
    }

    const turn = content.modelTurn as { parts?: Array<Record<string, unknown>> } | undefined;
    for (const part of turn?.parts ?? []) {
      const inline = part.inlineData as { data?: string; mimeType?: string } | undefined;
      if (inline?.data) {
        // The model has begun answering; the caller's turn is settled, so
        // their transcript is final and joins the history now.
        if (this.userTranscript.trim()) {
          this.callbacks.onUserTranscript?.(this.userTranscript.trim());
          this.userTranscript = "";
        }
        if (!this.assistantIsSpeaking) {
          this.assistantIsSpeaking = true;
          this.callbacks.onStateChange?.("speaking");
        }
        this.enqueueAudio(inline.data, inline.mimeType ?? "audio/pcm;rate=24000");
      }
    }

    if (content.turnComplete) {
      if (this.userTranscript.trim()) {
        this.callbacks.onUserTranscript?.(this.userTranscript.trim());
        this.userTranscript = "";
      }
      if (this.assistantTranscript.trim()) {
        this.callbacks.onTranscriptComplete?.(this.assistantTranscript.trim());
      }
      this.assistantTranscript = "";
      this.assistantIsSpeaking = false;
      this.callbacks.onStateChange?.("listening");
    }
  }

  // ── audio up ─────────────────────────────────────────────────────────

  private startCapture(stream: MediaStream) {
    // 16 kHz capture context, so no resampling is needed before the wire.
    const ctx = new AudioContext({ sampleRate: 16000 });
    this.captureCtx = ctx;
    const source = ctx.createMediaStreamSource(stream);
    // ponytail: ScriptProcessor is deprecated but universal; an AudioWorklet
    // is the upgrade path if its main-thread cost ever shows up in profiles.
    const node = ctx.createScriptProcessor(4096, 1, 1);
    this.captureNode = node;
    node.onaudioprocess = (e) => {
      if (this.muted || this.ws?.readyState !== WebSocket.OPEN) return;
      const f32 = e.inputBuffer.getChannelData(0);
      const i16 = new Int16Array(f32.length);
      for (let i = 0; i < f32.length; i++) {
        const v = Math.max(-1, Math.min(1, f32[i]));
        i16[i] = v < 0 ? v * 0x8000 : v * 0x7fff;
      }
      let bin = "";
      const bytes = new Uint8Array(i16.buffer);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      this.ws.send(
        JSON.stringify({
          realtimeInput: {
            audio: { data: btoa(bin), mimeType: "audio/pcm;rate=16000" },
          },
        }),
      );
    };
    source.connect(node);
    // A ScriptProcessor only runs while connected to a destination; a zero-
    // gain node keeps the microphone out of the speakers.
    const sink = ctx.createGain();
    sink.gain.value = 0;
    node.connect(sink);
    sink.connect(ctx.destination);
  }

  // ── audio down ───────────────────────────────────────────────────────

  private enqueueAudio(b64: string, mimeType: string) {
    const rate = Number(mimeType.match(/rate=(\d+)/)?.[1] ?? 24000);
    const ctx = this.playbackCtx ?? new AudioContext();
    this.playbackCtx = ctx;
    if (ctx.state === "suspended") void ctx.resume();

    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const i16 = new Int16Array(bytes.buffer);
    const buffer = ctx.createBuffer(1, i16.length, rate);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < i16.length; i++) ch[i] = i16[i] / 0x8000;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    const at = Math.max(ctx.currentTime, this.playhead);
    src.start(at);
    this.playhead = at + buffer.duration;
    this.liveSources.add(src);
    src.onended = () => this.liveSources.delete(src);
  }

  private stopPlayback() {
    for (const src of this.liveSources) {
      try {
        src.stop();
      } catch {
        // already ended
      }
    }
    this.liveSources.clear();
    this.playhead = 0;
  }

  // ── the shared control surface ───────────────────────────────────────

  public setMuted(muted: boolean) {
    this.muted = muted;
    for (const track of this.mediaStream?.getAudioTracks() ?? []) track.enabled = !muted;
    this.callbacks.onMicEnabledChange?.(!muted);
  }

  /** Stop the astrologer's audio; the server's own VAD handles the rest. */
  public takeTurn() {
    this.stopPlayback();
    this.assistantIsSpeaking = false;
    this.callbacks.onStateChange?.("listening");
  }

  public sendTextMessage(text: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        clientContent: { turns: [{ role: "user", parts: [{ text }] }], turnComplete: true },
      }),
    );
  }

  public get micStream(): MediaStream | null {
    return this.mediaStream;
  }

  public get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private teardown() {
    this.stopPlayback();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    this.captureNode?.disconnect();
    this.captureNode = null;
    if (this.captureCtx && this.captureCtx.state !== "closed") void this.captureCtx.close().catch(() => {});
    this.captureCtx = null;
    if (this.playbackCtx && this.playbackCtx.state !== "closed") void this.playbackCtx.close().catch(() => {});
    this.playbackCtx = null;
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.mediaStream = null;
  }

  public disconnect() {
    this.closedByUs = true;
    this.teardown();
  }
}
