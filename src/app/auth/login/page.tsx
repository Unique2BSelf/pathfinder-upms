"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mountain, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get("redirect") ?? "/dashboard";
  const supabase     = createClient();

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [magicSent,  setMagicSent]  = useState(false);
  const [useMagic,   setUseMagic]   = useState(false);

  // ── Password sign-in ──────────────────────────────────────────────────
  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  // ── Magic link sign-in ────────────────────────────────────────────────
  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) { setError("Enter your email first."); return; }
    setLoading(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback?redirect=${redirect}` },
    });

    if (otpError) { setError(otpError.message); setLoading(false); return; }
    setMagicSent(true);
    setLoading(false);
  }

  // ── Magic link sent screen ────────────────────────────────────────────
  if (magicSent) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-600/20 border border-forest-600/40
                          flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-forest-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm mb-6">
            We sent a magic link to <span className="text-white font-medium">{email}</span>.
            Click it to sign in — no password needed.
          </p>
          <button
            onClick={() => { setMagicSent(false); setUseMagic(false); }}
            className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-slate-400 text-sm">Sign in to your Pathfinder family account</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Toggle */}
      <div className="flex rounded-lg bg-slate-800 p-1 mb-6">
        <button
          onClick={() => setUseMagic(false)}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
            ${!useMagic ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}
        >
          Password
        </button>
        <button
          onClick={() => setUseMagic(true)}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all
            ${useMagic ? "bg-slate-700 text-white shadow" : "text-slate-500 hover:text-slate-300"}`}
        >
          Magic Link
        </button>
      </div>

      <form onSubmit={useMagic ? handleMagicLink : handlePasswordLogin} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@email.com"
              className="input pl-10"
            />
          </div>
        </div>

        {!useMagic && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="label mb-0">Password</label>
              <Link href="/auth/forgot-password"
                className="text-xs text-slate-500 hover:text-amber-400 transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                id="password"
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-3 rounded-lg font-bold text-base mt-2
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
          ) : useMagic ? (
            <><Mail className="w-4 h-4" /> Send Magic Link</>
          ) : (
            <>Sign In <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        New to Pathfinder?{" "}
        <Link href="/auth/signup" className="text-amber-400 hover:text-amber-300 font-medium">
          Create a family account
        </Link>
      </p>
    </AuthShell>
  );
}

// ── Shared auth page shell ─────────────────────────────────────────────────
function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-8 group">
        <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center
                        group-hover:bg-forest-500 transition-colors">
          <Mountain className="w-5 h-5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">Pathfinder</span>
      </Link>

      <div className="w-full max-w-md">
        <div className="card p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
