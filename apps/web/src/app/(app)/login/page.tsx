"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff } from "lucide-react";

import { NakhatraMark } from "@/components/ui/nakhatra-mark";
import { GoogleButton } from "@/features/auth/components/google-button";
import { useLogin, useSession, useSignup } from "@/features/auth/hooks/use-auth";
import { loginSchema, signupSchema } from "@/features/auth/schema/auth-forms";

const FIELD =
  "w-full rounded-[8px] border border-brd bg-[#181B27] px-3.5 py-2.5 text-sm " +
  "text-fg placeholder-[#5A6172] transition-colors " +
  "focus:border-acc/70 focus:outline-none focus-visible:border-acc";

const LABEL = "block text-[13px] font-semibold text-mid mb-1.5";

/**
 * Where a signed-in visitor lands. One constant because three paths reach it —
 * email, Google, and arriving already signed in — and three literals drift.
 */
const AFTER_SIGN_IN = "/dashboard";

/**
 * Auth backdrop.
 *
 * Two faint side panels with a halo behind the card, and one lit segment
 * tracing their card-facing edges — a single continuous path that runs down the
 * left panel, bridges off-screen, returns along the right, and loops, so
 * exactly one side is lit at a time.
 *
 * The panels are not empty: each holds a birth chart's lattice, cropped by the
 * panel shape. Faint enough to be texture rather than content — something you
 * notice on the second look, not the first.
 */
const PANEL = "M1130 150 L1500 150 L1500 800 L945 800 L945 420 Z";
const TRACE =
  "M-60 150 L310 150 L495 420 L495 800 L-60 800 L-60 950 L1500 950 L1500 800 " +
  "L945 800 L945 420 L1130 150 L1500 150 L1500 -100 L-60 -100 Z";
const FLIP = "matrix(-1 0 0 1 1440 0)";

function Panel() {
  return (
    <>
      <path d={PANEL} fill="url(#panelFill)" stroke="#FFFFFF" strokeOpacity="0.06" />
      <g clipPath="url(#panelClip)" fill="none" stroke="#FFFFFF" strokeOpacity="0.04">
        {/* A chart, cropped by the panel it sits in. */}
        <rect x="960" y="185" width="560" height="560" />
        <path d="M1240 185 L1520 465 L1240 745 L960 465 Z" />
        <path d="M960 185 L1520 745 M1520 185 L960 745" strokeOpacity="0.025" />
      </g>
    </>
  );
}

function Backdrop() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="halo" cx="50%" cy="47%" r="46%">
          <stop offset="0" stopColor="#141726" stopOpacity="1" />
          <stop offset="1" stopColor="#141726" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="panelFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#141726" stopOpacity="1" />
          <stop offset="1" stopColor="#141726" stopOpacity="0.15" />
        </linearGradient>
        <radialGradient id="fade" cx="50%" cy="44%" r="60%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <mask id="fadeMask">
          <rect width="1440" height="900" fill="url(#fade)" />
        </mask>
        <clipPath id="panelClip">
          <path d={PANEL} />
        </clipPath>
        <filter id="edgeGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <rect width="1440" height="900" fill="url(#halo)" />

      <g mask="url(#fadeMask)">
        <Panel />
        <g transform={FLIP}>
          <Panel />
        </g>
      </g>

      <path
        className="login-trace"
        d={TRACE}
        fill="none"
        stroke="#E5A93C"
        strokeWidth="4.5"
        strokeLinecap="round"
        pathLength={1000}
        strokeDasharray="10 990"
        filter="url(#edgeGlow)"
      />
      <path
        className="login-trace"
        d={TRACE}
        fill="none"
        stroke="#FFE1A3"
        strokeWidth="1.4"
        strokeLinecap="round"
        pathLength={1000}
        strokeDasharray="10 990"
      />
    </svg>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const { user } = useSession();
  const login = useLogin();
  const signup = useSignup();

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";

  useEffect(() => {
    if (user) router.push(AFTER_SIGN_IN);
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        await login.mutateAsync(parsed.data);
      } else {
        const parsed = signupSchema.safeParse({ email, password, full_name: fullName });
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
        await signup.mutateAsync(parsed.data);
      }
      router.push(AFTER_SIGN_IN);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? "signup" : "login");
    setError(null);
  };

  return (
    <div className="w-full max-w-[400px]">
      <div className="overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#111420]">
        <div className="px-7 pb-8 pt-8 sm:px-8">
          {/* Same treatment as the app bar: gold linework, no tile. */}
          <NakhatraMark className="mx-auto mb-5 block size-12 text-acc" />

          <div className="mb-7 text-center">
            <h1 className="font-serif text-[22px] font-bold tracking-tight text-fg">
              {isLogin ? "Sign in to Nakhatra" : "Create your Nakhatra account"}
            </h1>
            <p className="mt-1.5 text-[13px] text-mut">
              {isLogin
                ? "Welcome back. Please sign in to continue."
                : "Welcome. Fill in your details to get started."}
            </p>
          </div>

          <GoogleButton onSignedIn={() => router.push(AFTER_SIGN_IN)} />

          <div className="my-6 flex items-center gap-4">
            <span className="h-px flex-1 bg-fg/10" />
            <span className="text-[13px] text-mut">or</span>
            <span className="h-px flex-1 bg-fg/10" />
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-[8px] border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-300"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label htmlFor="full-name" className={LABEL}>
                  Full name
                </label>
                <input
                  id="full-name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className={FIELD}
                />
              </div>
            )}

            <div>
              <label htmlFor="email" className={LABEL}>
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className={FIELD}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <label htmlFor="password" className={LABEL + " mb-0"}>
                  Password
                </label>
                {isLogin && (
                  <Link
                    href="#"
                    className="text-[12px] text-acc hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? "Enter your password" : "At least 8 characters"}
                  className={FIELD + " pr-11"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5A6172] transition-colors hover:text-mid focus-visible:text-acc focus-visible:outline-none"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] bg-acc py-2.5 text-sm font-semibold text-onacc transition-colors hover:bg-acc2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3C766] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111420] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-[#090A10] border-t-transparent" />
              ) : (
                <>
                  <span>{isLogin ? "Continue" : "Create account"}</span>
                  <ArrowRight className="size-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="border-t border-white/[0.08] bg-[#0C0E15] px-7 py-4 text-center text-[13px] text-mut">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={switchMode}
            className="font-semibold text-acc hover:underline focus-visible:outline-none focus-visible:underline"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-dvh flex-col justify-between overflow-hidden bg-[#0A0B11] font-body text-fg">
      <Backdrop />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <NakhatraMark className="size-8 text-acc transition-colors group-hover:text-acc2" />
          <span className="font-logo text-sm font-bold tracking-[0.16em] text-fg">
            NAKHATRA
          </span>
        </Link>

        <Link
          href="/kundali"
          className="flex items-center gap-1 text-[13px] font-semibold text-acc hover:underline"
        >
          Free kundali <ArrowRight className="size-3.5" />
        </Link>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
        <Suspense
          fallback={
            <div className="h-[520px] w-full max-w-[400px] rounded-[14px] border border-white/[0.08] bg-[#111420]" />
          }
        >
          <LoginFormContent />
        </Suspense>
      </main>

      <footer className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-6 py-7 text-[13px] text-[#64748B]">
        <span>© 2026 Nakhatra</span>
        <span aria-hidden="true" className="text-[#2A3040]">·</span>
        <Link href="#" className="transition-colors hover:text-mid">Support</Link>
        <span aria-hidden="true" className="text-[#2A3040]">·</span>
        <Link href="/privacy" className="transition-colors hover:text-mid">Privacy</Link>
        <span aria-hidden="true" className="text-[#2A3040]">·</span>
        <Link href="/terms" className="transition-colors hover:text-mid">Terms</Link>
      </footer>
    </div>
  );
}
