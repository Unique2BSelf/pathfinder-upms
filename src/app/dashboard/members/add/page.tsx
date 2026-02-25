"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PROGRAMS } from "@/lib/programs";

const SHIRT_SIZES = ["YS","YM","YL","AS","AM","AL","AXL"];
const US_GRADES   = [
  { value: 0,  label: "Kindergarten" },
  ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Grade ${i + 1}` })),
];

export default function AddMemberPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [programs,    setPrograms]    = useState<Array<{ id: string; slug: string; name: string; short_name: string }>>([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name:      "",
    last_name:       "",
    preferred_name:  "",
    dob:             "",
    gender:          "",
    grade:           "" as string | number,
    school_name:     "",
    shirt_size:      "",
    known_allergies: "",
    medications:     "",
    program_ids:     [] as string[],
  });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);

      const { data: u } = await supabase
        .from("users")
        .select("household_id")
        .eq("id", user.id)
        .single();
      setHouseholdId(u?.household_id ?? null);

      const { data: progs } = await supabase
        .from("programs")
        .select("id, slug, name, short_name")
        .eq("is_active", true)
        .order("sort_order");
      setPrograms(progs ?? []);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleProgram(id: string) {
    setForm((prev) => ({
      ...prev,
      program_ids: prev.program_ids.includes(id)
        ? prev.program_ids.filter((p) => p !== id)
        : [...prev.program_ids, id],
    }));
  }

  function update(field: string, value: any) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId || !userId) { setError("Session error — please refresh."); return; }
    if (!form.first_name || !form.last_name || !form.dob) {
      setError("First name, last name, and date of birth are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Insert youth member
      const { data: ym, error: ymErr } = await supabase
        .from("youth_members")
        .insert({
          household_id:    householdId,
          first_name:      form.first_name.trim(),
          last_name:       form.last_name.trim(),
          preferred_name:  form.preferred_name.trim() || null,
          dob:             form.dob,
          gender:          form.gender || null,
          grade:           form.grade !== "" ? Number(form.grade) : null,
          school_name:     form.school_name.trim() || null,
          shirt_size:      form.shirt_size || null,
          known_allergies: form.known_allergies.trim() || null,
          medications:     form.medications.trim() || null,
          medical_alert_flag: !!(form.known_allergies || form.medications),
        })
        .select("id")
        .single();

      if (ymErr || !ym) throw new Error(ymErr?.message ?? "Failed to create member");

      // 2. Create trip account stub
      await supabase.from("trip_accounts").insert({ youth_id: ym.id, current_balance: 0 });

      // 3. Insert one enrollment row per selected program
      if (form.program_ids.length > 0) {
        const enrollments = form.program_ids.map((pid) => ({
          youth_id:   ym.id,
          program_id: pid,
          status:     "pending" as const,
          join_date:  new Date().toISOString().slice(0, 10),
        }));
        const { error: enrErr } = await supabase.from("enrollments").insert(enrollments);
        if (enrErr) throw new Error(enrErr.message);
      }

      router.push(`/dashboard/members/${ym.id}?added=1`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <Link href="/dashboard/members"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300
                     text-sm transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Members
        </Link>
        <h1 className="text-2xl font-bold text-white">Add Youth Member</h1>
        <p className="text-slate-400 text-sm mt-1">
          Youth can be enrolled in multiple programs simultaneously.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30
                        text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Basic Info ────────────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-white text-sm">Basic Information</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First name *</label>
              <input type="text" required value={form.first_name}
                onChange={(e) => update("first_name", e.target.value)}
                placeholder="First" className="input" />
            </div>
            <div>
              <label className="label">Last name *</label>
              <input type="text" required value={form.last_name}
                onChange={(e) => update("last_name", e.target.value)}
                placeholder="Last" className="input" />
            </div>
          </div>

          <div>
            <label className="label">
              Preferred nickname <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <input type="text" value={form.preferred_name}
              onChange={(e) => update("preferred_name", e.target.value)}
              placeholder="e.g. Skip, Charlie" className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date of birth *</label>
              <input type="date" required value={form.dob}
                onChange={(e) => update("dob", e.target.value)}
                max={new Date().toISOString().slice(0, 10)} className="input" />
            </div>
            <div>
              <label className="label">Gender</label>
              <select value={form.gender} onChange={(e) => update("gender", e.target.value)}
                className="input">
                <option value="">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="nonbinary">Nonbinary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Grade</label>
              <select value={form.grade} onChange={(e) => update("grade", e.target.value)}
                className="input">
                <option value="">Select grade</option>
                {US_GRADES.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Shirt size</label>
              <select value={form.shirt_size} onChange={(e) => update("shirt_size", e.target.value)}
                className="input">
                <option value="">Select size</option>
                {SHIRT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label">School</label>
            <input type="text" value={form.school_name}
              onChange={(e) => update("school_name", e.target.value)}
              placeholder="School name" className="input" />
          </div>
        </div>

        {/* ── Program Selection ─────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-white text-sm">Program Enrollment</h2>
            <p className="text-slate-500 text-xs mt-1">
              Select all programs this youth will participate in. Each creates a
              separate enrollment row in the database.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {programs.map((prog) => {
              const config   = PROGRAMS.find((p) => p.slug === prog.slug);
              const selected = form.program_ids.includes(prog.id);
              return (
                <button
                  key={prog.id}
                  type="button"
                  onClick={() => toggleProgram(prog.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border
                               text-sm font-medium transition-all text-left
                    ${selected
                      ? "bg-forest-600/20 border-forest-600 text-white"
                      : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                >
                  <span className="text-xl flex-shrink-0">{config?.icon ?? "🏕️"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{prog.name}</div>
                    <div className="text-xs text-slate-500 truncate">
                      {config?.ageRange ?? ""}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                                   flex-shrink-0 transition-all
                    ${selected
                      ? "bg-forest-600 border-forest-600"
                      : "border-slate-600"}`}>
                    {selected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {form.program_ids.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                            bg-forest-600/10 border border-forest-600/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-400 flex-shrink-0" />
              <p className="text-forest-400 text-xs">
                <strong>{form.program_ids.length} program{form.program_ids.length !== 1 ? "s" : ""}</strong> selected
                — {form.program_ids.length} enrollment row{form.program_ids.length !== 1 ? "s" : ""} will be created.
              </p>
            </div>
          )}
        </div>

        {/* ── Medical ───────────────────────────────────────────────── */}
        <div className="card p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-white text-sm">Medical Information</h2>
            <p className="text-slate-500 text-xs mt-1">
              This information surfaces as a red flag on the leader's field roster.
              Leave blank if none.
            </p>
          </div>

          <div>
            <label className="label">Known allergies</label>
            <input type="text" value={form.known_allergies}
              onChange={(e) => update("known_allergies", e.target.value)}
              placeholder="Peanuts, bee stings, penicillin…" className="input" />
          </div>
          <div>
            <label className="label">Current medications</label>
            <input type="text" value={form.medications}
              onChange={(e) => update("medications", e.target.value)}
              placeholder="EpiPen, inhaler, Adderall…" className="input" />
          </div>

          {(form.known_allergies || form.medications) && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg
                            bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-xs">
                Medical alert flag will be set — this member will be highlighted on the leader's field roster.
              </p>
            </div>
          )}
        </div>

        {/* ── Submit ────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <Link href="/dashboard/members"
            className="btn-outline px-6 py-3 rounded-xl text-sm">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="btn-gold flex-1 py-3 rounded-xl font-bold text-sm
                       flex items-center justify-center gap-2 disabled:opacity-50">
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              : <><Plus className="w-4 h-4" /> Add Member</>}
          </button>
        </div>
      </form>
    </div>
  );
}
