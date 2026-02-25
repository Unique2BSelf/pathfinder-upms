"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Home, Users, CheckCircle2, ChevronRight, ChevronLeft,
  Plus, Trash2, Loader2, Mountain, AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PROGRAMS } from "@/lib/programs";
import type {
  HouseholdInfoFormValues,
  AddYouthFormValues,
} from "@/types";

// ── Constants ──────────────────────────────────────────────────────────────
const STEPS = [
  { id: "household_info", label: "Family Info",    icon: Home  },
  { id: "add_members",    label: "Youth Members",  icon: Users },
] as const;

const SHIRT_SIZES  = ["YS","YM","YL","AS","AM","AL","AXL"];
const US_STATES    = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
                      "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
                      "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
                      "TX","UT","VT","VA","WA","WV","WI","WY"];

const blankYouth = (): AddYouthFormValues => ({
  first_name:      "",
  last_name:       "",
  dob:             "",
  gender:          "",
  grade:           undefined,
  school_name:     "",
  shirt_size:      "",
  program_ids:     [],
  known_allergies: "",
  medications:     "",
});

// =============================================================================
export default function OnboardingPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [programs,    setPrograms]    = useState<Array<{id: string; slug: string; name: string; short_name: string}>>([]);

  // Step 1 form
  const [householdForm, setHouseholdForm] = useState<HouseholdInfoFormValues>({
    family_name:            "",
    address_line1:          "",
    address_line2:          "",
    city:                   "",
    state:                  "",
    zip:                    "",
    phone:                  "",
    emergency_contact_name:  "",
    emergency_contact_phone: "",
    emergency_contact_rel:   "",
    calendar_password:       "",
  });

  // Step 2 form — array of youth
  const [youthList, setYouthList] = useState<AddYouthFormValues[]>([blankYouth()]);

  // Load session and programs on mount
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth/login"); return; }
      setUserId(user.id);

      const { data: progs } = await supabase
        .from("programs")
        .select("id, slug, name, short_name")
        .eq("is_active", true)
        .order("sort_order");
      if (progs) setPrograms(progs);

      // Check if user already has a household (resuming)
      const { data: userData } = await supabase
        .from("users")
        .select("household_id, onboarding_step")
        .eq("id", user.id)
        .single();

      if (userData?.household_id) {
        setHouseholdId(userData.household_id);
        if (userData.onboarding_step === "add_members") setCurrentStep(1);
      }
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step 1 Submit: Create Household ─────────────────────────────────────
  async function submitHouseholdInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Insert household
      const { data: hh, error: hhError } = await supabase
        .from("households")
        .insert({
          family_name:              householdForm.family_name,
          address_line1:            householdForm.address_line1,
          address_line2:            householdForm.address_line2 || null,
          city:                     householdForm.city,
          state:                    householdForm.state,
          zip:                      householdForm.zip,
          emergency_contact_name:   householdForm.emergency_contact_name,
          emergency_contact_phone:  householdForm.emergency_contact_phone,
          emergency_contact_rel:    householdForm.emergency_contact_rel,
          calendar_password:        householdForm.calendar_password || "pathfinder2024",
        })
        .select("id")
        .single();

      if (hhError || !hh) throw new Error(hhError?.message ?? "Failed to create household");

      // 2. Link user to household + update phone + advance onboarding step
      const { error: userError } = await supabase
        .from("users")
        .update({
          household_id:    hh.id,
          phone:           householdForm.phone,
          onboarding_step: "add_members",
        })
        .eq("id", userId);

      if (userError) throw new Error(userError.message);

      setHouseholdId(hh.id);
      setCurrentStep(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2 Submit: Add Youth Members ────────────────────────────────────
  async function submitYouthMembers(e: React.FormEvent) {
    e.preventDefault();
    if (!householdId) return;

    const validYouth = youthList.filter(
      (y) => y.first_name.trim() && y.last_name.trim() && y.dob
    );
    if (validYouth.length === 0) {
      setError("Add at least one youth member to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      for (const youth of validYouth) {
        // 1. Insert youth member
        const { data: ym, error: ymError } = await supabase
          .from("youth_members")
          .insert({
            household_id:    householdId,
            first_name:      youth.first_name.trim(),
            last_name:       youth.last_name.trim(),
            dob:             youth.dob,
            gender:          youth.gender || null,
            grade:           youth.grade ?? null,
            school_name:     youth.school_name || null,
            shirt_size:      youth.shirt_size || null,
            known_allergies: youth.known_allergies || null,
            medications:     youth.medications || null,
            medical_alert_flag: !!(youth.known_allergies || youth.medications),
          })
          .select("id")
          .single();

        if (ymError || !ym) throw new Error(ymError?.message ?? "Failed to add youth member");

        // 2. Create trip account stub
        await supabase
          .from("trip_accounts")
          .insert({ youth_id: ym.id, current_balance: 0 });

        // 3. Create enrollments for selected programs
        if (youth.program_ids.length > 0) {
          const enrollments = youth.program_ids.map((pid) => ({
            youth_id:   ym.id,
            program_id: pid,
            status:     "pending" as const,
            join_date:  new Date().toISOString().slice(0, 10),
          }));
          const { error: enrError } = await supabase
            .from("enrollments")
            .insert(enrollments);
          if (enrError) throw new Error(enrError.message);
        }
      }

      // 4. Mark onboarding complete
      await supabase
        .from("users")
        .update({
          onboarding_step:          "complete",
          onboarding_completed_at:  new Date().toISOString(),
        })
        .eq("id", userId!);

      router.push("/dashboard?welcome=1");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Youth list helpers ──────────────────────────────────────────────────
  function updateYouth(index: number, field: keyof AddYouthFormValues, value: any) {
    setYouthList((prev) => prev.map((y, i) => i === index ? { ...y, [field]: value } : y));
  }

  function toggleProgram(index: number, programId: string) {
    setYouthList((prev) =>
      prev.map((y, i) => {
        if (i !== index) return y;
        const exists = y.program_ids.includes(programId);
        return {
          ...y,
          program_ids: exists
            ? y.program_ids.filter((id) => id !== programId)
            : [...y.program_ids, programId],
        };
      })
    );
  }

  function addYouth()           { setYouthList((p) => [...p, blankYouth()]); }
  function removeYouth(i: number) {
    if (youthList.length === 1) return;
    setYouthList((p) => p.filter((_, idx) => idx !== i));
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="border-b border-slate-800 px-4 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
          <Mountain className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-white text-sm">Pathfinder — Family Setup</span>
      </header>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-10">
          {STEPS.map((step, i) => {
            const Icon     = step.icon;
            const isDone   = i < currentStep;
            const isActive = i === currentStep;
            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                   border-2 transition-all
                    ${isDone   ? "bg-forest-600 border-forest-600"
                    : isActive ? "bg-slate-800 border-amber-500"
                                : "bg-slate-800 border-slate-700"}`}>
                    {isDone
                      ? <CheckCircle2 className="w-5 h-5 text-white" />
                      : <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-600"}`} />
                    }
                  </div>
                  <span className={`text-xs font-medium
                    ${isActive ? "text-amber-400" : isDone ? "text-forest-400" : "text-slate-600"}`}>
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 rounded
                    ${isDone ? "bg-forest-600" : "bg-slate-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30
                          text-red-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── STEP 1: Household Info ─────────────────────────────────── */}
        {currentStep === 0 && (
          <form onSubmit={submitHouseholdInfo} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Family Information</h1>
              <p className="text-slate-400 text-sm">
                This is your household profile. You can update it anytime.
              </p>
            </div>

            {/* Family name */}
            <div>
              <label className="label">Family name *</label>
              <input type="text" required value={householdForm.family_name}
                onChange={(e) => setHouseholdForm((p) => ({ ...p, family_name: e.target.value }))}
                placeholder='e.g. "The Smith Family"' className="input" />
            </div>

            {/* Address */}
            <div className="space-y-3">
              <label className="label">Home address *</label>
              <input type="text" required value={householdForm.address_line1}
                onChange={(e) => setHouseholdForm((p) => ({ ...p, address_line1: e.target.value }))}
                placeholder="Street address" className="input" />
              <input type="text" value={householdForm.address_line2}
                onChange={(e) => setHouseholdForm((p) => ({ ...p, address_line2: e.target.value }))}
                placeholder="Apt, suite, etc. (optional)" className="input" />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <input type="text" required value={householdForm.city}
                    onChange={(e) => setHouseholdForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="City" className="input" />
                </div>
                <div>
                  <select required value={householdForm.state}
                    onChange={(e) => setHouseholdForm((p) => ({ ...p, state: e.target.value }))}
                    className="input">
                    <option value="">State</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <input type="text" required value={householdForm.zip}
                    onChange={(e) => setHouseholdForm((p) => ({ ...p, zip: e.target.value }))}
                    placeholder="ZIP" className="input" maxLength={10} />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="label">Primary phone *</label>
              <input type="tel" required value={householdForm.phone}
                onChange={(e) => setHouseholdForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(555) 000-0000" className="input" />
            </div>

            {/* Emergency contact */}
            <div className="space-y-3 border-t border-slate-700 pt-5">
              <p className="text-sm font-semibold text-slate-300">Emergency Contact
                <span className="text-slate-500 font-normal ml-1">(not a parent/guardian)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <input type="text" required value={householdForm.emergency_contact_name}
                  onChange={(e) => setHouseholdForm((p) => ({ ...p, emergency_contact_name: e.target.value }))}
                  placeholder="Full name" className="input" />
                <input type="text" required value={householdForm.emergency_contact_rel}
                  onChange={(e) => setHouseholdForm((p) => ({ ...p, emergency_contact_rel: e.target.value }))}
                  placeholder="Relationship" className="input" />
              </div>
              <input type="tel" required value={householdForm.emergency_contact_phone}
                onChange={(e) => setHouseholdForm((p) => ({ ...p, emergency_contact_phone: e.target.value }))}
                placeholder="Phone number" className="input" />
            </div>

            {/* Calendar password */}
            <div className="space-y-2 border-t border-slate-700 pt-5">
              <label className="label">Family calendar password
                <span className="text-slate-500 font-normal ml-1">(optional)</span>
              </label>
              <input type="text" value={householdForm.calendar_password}
                onChange={(e) => setHouseholdForm((p) => ({ ...p, calendar_password: e.target.value }))}
                placeholder="Leave blank for default password" className="input" />
              <p className="text-xs text-slate-500">
                Families use this password to view your program's schedule without logging in.
              </p>
            </div>

            <button type="submit" disabled={loading}
              className="btn-gold w-full py-4 rounded-xl font-bold text-base
                         flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> :
                <>Continue <ChevronRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}

        {/* ── STEP 2: Add Youth Members ──────────────────────────────── */}
        {currentStep === 1 && (
          <form onSubmit={submitYouthMembers} className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Add Youth Members</h1>
              <p className="text-slate-400 text-sm">
                Add all the kids in your household. You can add more later from your profile.
              </p>
            </div>

            {youthList.map((youth, idx) => (
              <div key={idx} className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">
                    Youth Member #{idx + 1}
                  </h3>
                  {youthList.length > 1 && (
                    <button type="button" onClick={() => removeYouth(idx)}
                      className="text-slate-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Name + DOB */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">First name *</label>
                    <input type="text" required value={youth.first_name}
                      onChange={(e) => updateYouth(idx, "first_name", e.target.value)}
                      placeholder="First" className="input" />
                  </div>
                  <div>
                    <label className="label">Last name *</label>
                    <input type="text" required value={youth.last_name}
                      onChange={(e) => updateYouth(idx, "last_name", e.target.value)}
                      placeholder="Last" className="input" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Date of birth *</label>
                    <input type="date" required value={youth.dob}
                      onChange={(e) => updateYouth(idx, "dob", e.target.value)}
                      className="input" max={new Date().toISOString().slice(0,10)} />
                  </div>
                  <div>
                    <label className="label">Grade</label>
                    <select value={youth.grade ?? ""}
                      onChange={(e) => updateYouth(idx, "grade", e.target.value ? +e.target.value : undefined)}
                      className="input">
                      <option value="">Select grade</option>
                      <option value="0">Kindergarten</option>
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(g =>
                        <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">School</label>
                    <input type="text" value={youth.school_name}
                      onChange={(e) => updateYouth(idx, "school_name", e.target.value)}
                      placeholder="School name" className="input" />
                  </div>
                  <div>
                    <label className="label">Shirt size</label>
                    <select value={youth.shirt_size}
                      onChange={(e) => updateYouth(idx, "shirt_size", e.target.value)}
                      className="input">
                      <option value="">Select size</option>
                      {SHIRT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                {/* Program selection */}
                <div>
                  <label className="label">Program(s) *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {programs.map((prog) => {
                      const config = PROGRAMS.find(p => p.slug === prog.slug);
                      const selected = youth.program_ids.includes(prog.id);
                      return (
                        <button
                          key={prog.id}
                          type="button"
                          onClick={() => toggleProgram(idx, prog.id)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border
                                     text-sm font-medium transition-all text-left
                            ${selected
                              ? "bg-forest-600/20 border-forest-600 text-forest-400"
                              : "border-slate-700 text-slate-400 hover:border-slate-500"}`}
                        >
                          <span className="text-base">{config?.icon ?? "🏕️"}</span>
                          <span>{prog.short_name}</span>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Medical — collapsible */}
                <details className="border-t border-slate-700 pt-3">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300
                                      select-none list-none flex items-center gap-1">
                    <span>+ Medical info (optional — can be added later)</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="label">Known allergies</label>
                      <input type="text" value={youth.known_allergies}
                        onChange={(e) => updateYouth(idx, "known_allergies", e.target.value)}
                        placeholder="Peanuts, bees, penicillin…" className="input" />
                    </div>
                    <div>
                      <label className="label">Current medications</label>
                      <input type="text" value={youth.medications}
                        onChange={(e) => updateYouth(idx, "medications", e.target.value)}
                        placeholder="EpiPen, inhaler…" className="input" />
                    </div>
                  </div>
                </details>
              </div>
            ))}

            {/* Add another youth */}
            <button type="button" onClick={addYouth}
              className="w-full border-2 border-dashed border-slate-700 hover:border-slate-500
                         rounded-xl py-3 text-sm text-slate-500 hover:text-slate-300
                         flex items-center justify-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              Add another youth member
            </button>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setCurrentStep(0)}
                className="btn-outline px-5 py-3 rounded-xl flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button type="submit" disabled={loading}
                className="btn-gold flex-1 py-3 rounded-xl font-bold
                           flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> :
                  <>Complete Setup <CheckCircle2 className="w-4 h-4" /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
