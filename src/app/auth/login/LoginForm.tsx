"use client";

import { Suspense } from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mountain, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginFormInner() {
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

  async function handleMagicLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: magicError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin + "/auth/callback?redirect=" + redirect,
      },
    });

    if (magicError) {
      setError(magicError.message);
      setLoading(false);
      return;
    }

    setMagicSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center">
                <Mountain className="w-5 h-5 text-white" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-slate-400 mt-2">Sign in to your Pathfinder account</p>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {magicSent ? (
            <div className="p-6 rounded-lg bg-forest-600/10 border border-forest-600/20 text-center">
              <p className="text-forest-400">Check your email for the magic link!</p>
            </div>
          ) : (
            <form onSubmit={useMagic ? handleMagicLogin : handlePasswordLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-forest-500"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              {!useMagic && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-12 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-forest-500"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useMagic}
                    onChange={(e) => setUseMagic(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-forest-600 focus:ring-forest-500"
                  />
                  <span className="text-sm text-slate-400">Use magic link</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          <p className="text-center text-slate-400 text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-forest-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-forest-600 to-slate-800 items-center justify-center p-12">
        <div className="max-w-lg text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            One family. Five programs. One portal.
          </h2>
          <p className="text-slate-300 text-lg">
            Manage your kids&apos; Scouting journey across all five Pathfinder programs — 
            from Cub Scouts to Shooting Club.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500" />
      </div>
    }>
      <LoginFormInner />
    </Suspense>
  );
}
