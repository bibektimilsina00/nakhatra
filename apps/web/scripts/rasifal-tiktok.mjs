/**
 * The day's two TikToks, out of the page that already renders the rasifal.
 *
 *   npm run build && npm start          # `next dev` never fires load; see below
 *   node scripts/rasifal-tiktok.mjs     # → ~/Desktop/rasifal-YYYY-MM-DD/
 *
 *   --date 2026-09-11   a day other than today in Kathmandu
 *   --part 1|2          just one of them
 *   --base http://…     a running site instead of localhost:3000
 *   --voice Aoede       any Gemini prebuilt voice (Kore, Leda, Charon, …)
 *   --out /path         where the files land (default ~/Desktop)
 *   --key <secret>      STUDIO_KEY, which the slide route demands
 *   --keep              leave the frames and the voice clips behind
 *
 * Each slide is shot once, its narration is spoken by the TTS voice, and the
 * frame is held for exactly as long as the voice needs — so the cut lands on
 * the sentence rather than on a stopwatch. No music: TikTok's own library is
 * where a trending track has to come from, and a muxed one only gets replaced.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : process.argv[i + 1];
};
const has = (name) => process.argv.includes(`--${name}`);

// A Mac to work on, a Debian container to run in.
const CHROME = [
  process.env.CHROME_PATH,
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));

/** Homebrew's ffmpeg first; the one Playwright caches has no H.264. */
const FFMPEG = ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"].find(existsSync);
const FFPROBE = ["/opt/homebrew/bin/ffprobe", "/usr/local/bin/ffprobe", "/usr/bin/ffprobe"].find(existsSync);

if (!CHROME) throw new Error("No Chromium found — set CHROME_PATH.");
if (!FFMPEG || !FFPROBE) throw new Error("ffmpeg is missing — `brew install ffmpeg`.");

const base = arg("base", "http://localhost:3000");
const parts = arg("part") ? [arg("part")] : ["1", "2"];
/** The slide route is private; without this it answers 404. */
const key = arg("key", process.env.STUDIO_KEY || "");

// Today means today in Kathmandu, which is the day the API answers for.
const nowNepal = new Date(Date.now() + (5 * 60 + 45) * 60000);
const date = arg("date", nowNepal.toISOString().slice(0, 10));

const out = join(arg("out", join(homedir(), "Desktop")), `rasifal-${date}`);
mkdirSync(out, { recursive: true });

const FPS = 30;
/** A beat of silence before the voice starts and after it stops. A cut that
 *  lands on the first syllable reads as a glitch. */
const LEAD = 0.35;
const TAIL = 0.7;

const ff = (args) => execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });

const seconds = (file) =>
  Number(
    execFileSync(FFPROBE, [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1",
      file,
    ]).toString().trim(),
  );

/**
 * The voice.
 *
 * Gemini TTS, because it is the one engine with a Nepali voice behind a key
 * this repo already holds — Cloud TTS has no ne-NP at all, and ElevenLabs
 * wants a second account and ten times the money for a minute of audio. It
 * detects the language from the text; the line above the script is spoken as
 * a direction, not read out.
 */
const VOICE = arg("voice", "Aoede");
const TTS_MODEL = "gemini-3.1-flash-tts-preview";
const DIRECTION =
  "एक न्यानो, स्पष्ट र भरोसालाग्दो नेपाली समाचारवाचक शैलीमा, बिस्तारै र " +
  "स्वाभाविक लयमा भन्नुहोस्:\n\n";

/** The key lives with the API, which is the only place it is configured. */
const geminiKey = () => {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  const env = readFileSync(new URL("../../api/.env", import.meta.url), "utf8");
  const m = env.match(/^GEMINI_API_KEY=(.+)$/m);
  if (!m) throw new Error("GEMINI_API_KEY is not set, and apps/api/.env has none.");
  return m[1].trim();
};

/** Raw 24 kHz mono PCM, which ffmpeg takes directly and whose duration is
 *  arithmetic rather than another ffprobe. */
const PCM_RATE = 24000;

async function speak(text, file) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey() },
      body: JSON.stringify({
        contents: [{ parts: [{ text: DIRECTION + text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`gemini tts ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()).candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!data) throw new Error(`gemini tts returned no audio for: ${text.slice(0, 60)}…`);
  const pcm = Buffer.from(data, "base64");
  writeFileSync(file, pcm);
  return pcm.length / (PCM_RATE * 2);
}

/** What the slide wants said, and the day it is about — straight out of the
 *  slide, so the caption carries the Bikram Sambat date the video shows. */
async function slideOf(url) {
  const html = await fetch(url).then((r) => {
    if (!r.ok) throw new Error(`${url} → ${r.status}`);
    return r.text();
  });
  const m = html.match(/id="narration" type="application\/json">(.*?)<\/script>/s);
  if (!m) throw new Error(`no narration on ${url} — is this the studio route?`);
  return JSON.parse(m[1]);
}

const SIGNS = {
  "1": "मेष, वृष, मिथुन, कर्कट, सिंह र कन्या",
  "2": "तुला, वृश्चिक, धनु, मकर, कुम्भ र मीन",
};
const HASHTAGS =
  "#rasifal #राशिफल #आजकोराशिफल #nepal #nepalitiktok #jyotish #ज्योतिष " +
  "#horoscope #zodiac #nepalinews #kathmandu #nakhatra #fyp #foryou";

/** The caption, ready to paste. Written here rather than by hand each morning
 *  for the same reason the slides are: it is the same post every day. */
const caption = (part, { miti, weekday }) =>
  `आजको राशिफल · ${miti} (${weekday})\n` +
  `भाग ${part === "2" ? "२" : "१"} — ${SIGNS[part]}।\n\n` +
  (part === "2"
    ? "भाग १ मा मेष देखि कन्या सम्म छ — हेर्न नबिर्सनुहोला।\n"
    : "भाग २ मा तुला देखि मीन सम्म। आफ्नो राशि कमेन्टमा लेख्नुहोस्।\n") +
  "गोचर, मूर्ति निर्णय र वेधबाट नेपालकै समयमा गणना गरिएको — " +
  "पूरा राशिफल nakhatra.com मा।\n\n" +
  HASHTAGS;

for (const part of parts) {
  const work = join(out, `work-${part}`);
  rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });

  const clips = [];
  let day = {};

  // 0 is the title card, 1–6 the signs of this half.
  for (let i = 0; i <= 6; i++) {
    const n = String(i).padStart(2, "0");
    const url =
      `${base}/studio/rasifal?date=${date}&part=${part}&i=${i}` +
      (key ? `&key=${encodeURIComponent(key)}` : "");
    const png = join(work, `${n}.png`);
    const pcm = join(work, `${n}.pcm`);
    const clip = join(work, `${n}.mp4`);

    const { text, ...about } = await slideOf(url);
    day = about;

    execFileSync(CHROME, [
      "--headless",
      "--disable-gpu",
      // Root in a container has no sandbox and a 64 MB /dev/shm.
      "--no-sandbox",
      "--disable-dev-shm-usage",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      "--window-size=540,960",
      // A guard, not a wait: the shot is taken as soon as the page loads.
      // `next dev` never fires load — its HMR socket stays open — so this
      // wants the built site (`npm run build && npm start`), not the dev one.
      "--timeout=20000",
      `--screenshot=${png}`,
      url,
      // Chromium logs a screenful of CoreVideo complaints on a Mac with no
      // display attached to it. A non-zero exit still throws.
    ], { stdio: "ignore" });

    const dur = LEAD + (await speak(text, pcm)) + TAIL;
    const frames = Math.round(dur * FPS);

    // A slow push in. A still frame held for twenty seconds reads as a
    // stalled video; the same frame drifting reads as a held shot.
    ff([
      "-loop", "1", "-i", png,
      "-f", "s16le", "-ar", String(PCM_RATE), "-ac", "1", "-i", pcm,
      "-filter_complex",
      `[0:v]scale=2160:-1,zoompan=z='min(zoom+0.00035,1.07)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1920:fps=${FPS}[v];` +
        `[1:a]adelay=${Math.round(LEAD * 1000)}|${Math.round(LEAD * 1000)},apad[a]`,
      "-map", "[v]", "-map", "[a]",
      "-t", dur.toFixed(3),
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p",
      "-c:a", "aac", "-b:a", "160k", "-ar", "44100", "-ac", "2",
      clip,
    ]);

    clips.push(clip);
    process.stdout.write(`part ${part} · slide ${i} · ${dur.toFixed(1)}s ✓\n`);
  }

  const list = join(work, "clips.txt");
  writeFileSync(list, clips.map((c) => `file '${c}'`).join("\n"));
  const mp4 = join(out, `rasifal-${date}-part${part}.mp4`);
  // Every clip was encoded the same way, so the join is a copy. faststart
  // moves the index to the front, which is what lets the admin page play the
  // file while it is still arriving.
  ff(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", "-movflags", "+faststart", mp4]);
  if (!has("keep")) rmSync(work, { recursive: true, force: true });

  const txt = `${mp4.replace(/\.mp4$/, "")}-caption.txt`;
  writeFileSync(txt, caption(part, day));
  console.log(`\n${mp4}  (${seconds(mp4).toFixed(0)}s)\n\n${caption(part, day)}\n`);
}

