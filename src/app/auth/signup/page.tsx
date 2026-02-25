"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mountain, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    first_name: "",
    last_name:  "",
    email:      "",
    password:   "",
    confirm:    "",
  });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email:    form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.first_name,
          last_name:  form.last_name,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  // ── Email confirmation sent screen ────────────────────────────────────
  if (sent) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-forest-600/20 border border-forest-600/40
                          flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-forest-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Confirm your email</h1>
          <p className="text-slate-400 text-sm mb-2">
            We sent a confirmation link to{" "}
            <span className="text-white font-medium">{form.email}</span>.
          </p>
          <p className="text-slate-500 text-xs">
            After confirming, you'll set up your family profile and add your youth members.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Create a family account</h1>
        <p className="text-slate-400 text-sm">Takes about 5 minutes to get fully set up.</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input type="text" required value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
                placeholder="Jane" className="input pl-9" />
            </div>
          </div>
          <div>
            <label className="label">Last name</label>
            <input type="text" required value={form.last_name}
              onChange={(e) => update("last_name", e.target.value)}
              placeholder="Smith" className="input" />
          </div>
        </div>

        <div>
          <label className="label">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input type="email" required value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="parent@email.com" className="input pl-10" />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input type={showPw ? "text" : "password"} required value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min. 8 characters" className="input pl-10 pr-10" />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Confirm password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input type={showPw ? "text" : "password"} required value={form.confirm}
              onChange={(e) => update("confirm", e.target.value)}
              placeholder="Repeat password" className="input pl-10" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="btn-gold w-full py-3 rounded-lg font-bold text-base mt-2
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
          ) : "Create Family Account →"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-amber-400 hover:text-amber-300 font-medium">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}

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
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}
