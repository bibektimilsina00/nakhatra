/**
 * One peer-to-peer call, as an object rather than a pile of refs.
 *
 * A media session is imperative and long-lived: a peer connection, two media
 * streams, a queue of candidates that arrived early. Held as `useRef`s that
 * becomes a dozen `.current` reads the React Compiler cannot prove are safe,
 * and it is fighting the framework to express something the framework has no
 * opinion about.
 *
 * So the session lives here, owns its own fields, and tells React when
 * something changed. React renders; this does the plumbing.
 */

export type CallState = "idle" | "calling" | "ringing" | "connecting" | "live" | "ended";
export type CallWarning = "noRelay" | "mic" | null;

export type CallSnapshot = {
  state: CallState;
  withVideo: boolean;
  micOn: boolean;
  cameraOn: boolean;
  warning: CallWarning;
};

type IceConfig = { ice_servers: RTCIceServer[]; has_relay: boolean };

export class CallSession {
  state: CallState = "idle";
  withVideo = false;
  micOn = true;
  cameraOn = true;
  warning: CallWarning = null;

  localStream: MediaStream | null = null;
  remoteStream: MediaStream | null = null;

  private pc: RTCPeerConnection | null = null;
  /** Candidates that arrived before the remote description existed. */
  private pending: RTCIceCandidateInit[] = [];
  private offer: { sdp: string; video: boolean } | null = null;
  private listeners = new Set<() => void>();

  constructor(
    private send: (frame: unknown) => void,
    private fetchIce: () => Promise<IceConfig>,
  ) {}

  // --- React's view of it ---

  subscribe = (onChange: () => void) => {
    this.listeners.add(onChange);
    return () => this.listeners.delete(onChange);
  };

  /** A new object each change, because `useSyncExternalStore` compares by identity. */
  snapshot = (): CallSnapshot => this.cached;

  private cached: CallSnapshot = {
    state: "idle",
    withVideo: false,
    micOn: true,
    cameraOn: true,
    warning: null,
  };

  private changed() {
    this.cached = {
      state: this.state,
      withVideo: this.withVideo,
      micOn: this.micOn,
      cameraOn: this.cameraOn,
      warning: this.warning,
    };
    for (const listener of this.listeners) listener();
  }

  // --- placing and answering ---

  async start(video: boolean) {
    this.withVideo = video;
    this.state = "calling";
    this.changed();
    try {
      const pc = await this.build(video);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.send({ type: "offer", sdp: offer.sdp ?? "", video });
    } catch {
      this.fail("mic");
    }
  }

  /** Answer the offer already received. */
  async accept() {
    if (!this.offer) return;
    this.state = "connecting";
    this.changed();
    try {
      const pc = await this.build(this.offer.video);
      await pc.setRemoteDescription({ type: "offer", sdp: this.offer.sdp });
      // Applied only now: adding a candidate before the remote description
      // throws, and the call quietly loses a path it could have connected on.
      for (const candidate of this.pending) await pc.addIceCandidate(candidate);
      this.pending = [];
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.send({ type: "answer", sdp: answer.sdp ?? "" });
    } catch {
      this.fail("mic");
    }
  }

  decline() {
    this.send({ type: "call-decline" });
    this.teardown();
    this.state = "idle";
    this.changed();
  }

  hangUp(tell = true) {
    if (tell) this.send({ type: "call-end" });
    this.teardown();
    this.state = "idle";
    this.changed();
  }

  // --- signalling from the other side ---

  async handle(frame: { type: string; sdp?: string; video?: boolean; candidate?: RTCIceCandidateInit }) {
    if (frame.type === "offer" && frame.sdp !== undefined) {
      this.offer = { sdp: frame.sdp, video: Boolean(frame.video) };
      this.withVideo = Boolean(frame.video);
      this.state = "ringing";
      this.changed();
      return;
    }
    if (frame.type === "answer" && frame.sdp !== undefined) {
      await this.pc?.setRemoteDescription({ type: "answer", sdp: frame.sdp });
      this.state = "connecting";
      this.changed();
      return;
    }
    if (frame.type === "ice" && frame.candidate) {
      if (!this.pc?.remoteDescription) this.pending.push(frame.candidate);
      else await this.pc.addIceCandidate(frame.candidate).catch(() => {});
      return;
    }
    if (frame.type === "call-decline" || frame.type === "call-end") this.hangUp(false);
  }

  // --- during a call ---

  toggleMic() {
    const tracks = this.localStream?.getAudioTracks() ?? [];
    this.micOn = !(tracks[0]?.enabled ?? true);
    tracks.forEach((track) => (track.enabled = this.micOn));
    this.changed();
  }

  toggleCamera() {
    const tracks = this.localStream?.getVideoTracks() ?? [];
    this.cameraOn = !(tracks[0]?.enabled ?? true);
    tracks.forEach((track) => (track.enabled = this.cameraOn));
    this.changed();
  }

  dismissWarning() {
    this.warning = null;
    this.changed();
  }

  // --- plumbing ---

  private async build(video: boolean): Promise<RTCPeerConnection> {
    const config = await this.fetchIce();
    if (!config.has_relay) {
      // Said rather than left to fail: without a relay this call will not
      // connect on symmetric NAT or many mobile carriers, and "connecting…"
      // forever is the worst way to find that out.
      this.warning = "noRelay";
    }

    const pc = new RTCPeerConnection({ iceServers: config.ice_servers });
    this.pc = pc;

    const stream = await navigator.mediaDevices.getUserMedia({
      // The same discipline the AI voice desk settled on: without echo
      // cancellation each side hears itself back through the other's speakers.
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: video ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
    });
    this.localStream = stream;
    for (const track of stream.getTracks()) pc.addTrack(track, stream);

    pc.ontrack = (event) => {
      this.remoteStream = event.streams[0];
      this.changed();
    };
    pc.onicecandidate = (event) => {
      if (event.candidate) this.send({ type: "ice", candidate: event.candidate.toJSON() });
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        this.state = "live";
        this.changed();
      }
      // A dropped call must not leave the interface claiming to be live.
      if (pc.connectionState === "failed" || pc.connectionState === "closed") this.hangUp(false);
    };

    this.changed();
    return pc;
  }

  private fail(warning: CallWarning) {
    this.warning = warning;
    this.teardown();
    this.state = "idle";
    this.changed();
  }

  teardown() {
    this.pc?.close();
    this.pc = null;
    // Stopping the tracks is what turns the browser's camera light off.
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localStream = null;
    this.remoteStream = null;
    this.pending = [];
    this.offer = null;
  }
}
