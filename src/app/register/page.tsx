"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mountain, Mail, Lock, User, Phone, Home, Eye, EyeOff, Loader2, ArrowRight, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface YouthMember {
  first_name: string;
  last_name: string;
  dob: string;
  program_id: string;
}

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // Form data
  const [form, setForm] = useState({
    // Parent
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    // Household
    family_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    zip: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_rel: "",
  });

  const [youth, setYouth] = useState<YouthMember[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

  // Load programs
  useState(() => {
    supabase.from("programs").select("*").then(({ data }) => {
      if (data) setPrograms(data);
    });
  });

  const addYouth = () => {
    setYouth([...youth, { first_name: "", last_name: "", dob: "", program_id: "" }]);
  };

  const removeYouth = (index: number) => {
    setYouth(youth.filter((_, i) => i !== index));
  };

  const updateYouth = (index: number, field: string, value: string) => {
    const updated = [...youth];
    (updated[index] as any)[field] = value;
    setYouth(updated);
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.first_name,
            last_name: form.last_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      const userId = authData.user.id;

      // 2. Create household
      const { data: household, error: hhError } = await supabase
        .from("households")
        .insert({
          family_name: form.family_name,
          address_line1: form.address_line1,
          address_line2: form.address_line2,
          city: form.city,
          state: form.state,
          zip: form.zip,
          emergency_contact_name: form.emergency_contact_name,
          emergency_contact_phone: form.emergency_contact_phone,
          emergency_contact_rel: form.emergency_contact_rel,
        })
        .select()
        .single();

      if (hhError) throw hhError;

      // 3. Link user to household
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: userId,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          household_id: household.id,
          role: "parent",
        });

      if (userError) throw userError;

      // 4. Create youth members and enrollments
      for (const y of youth) {
        if (y.first_name && y.last_name && y.dob) {
          const { data: youthMember, error: youthError } = await supabase
            .from("youth_members")
            .insert({
              household_id: household.id,
              first_name: y.first_name,
              last_name: y.last_name,
              dob: y.dob,
            })
            .select()
            .single();

          if (youthError) throw youthError;

          if (y.program_id) {
            await supabase.from("enrollments").insert({
              youth_id: youthMember.id,
              program_id: y.program_id,
              status: "pending",
            });
          }
        }
      }

      // 5. Sign in and redirect
      await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-xl bg-forest-600 flex items-center justify-center">
              <Mountain className="w-6 h-6 text-white" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white">Join Pathfinder</h1>
          <p className="text-slate-400 mt-2">Create your family account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Parent Info */}
          <div className="bg-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Parent / Guardian
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
                <input
                  type="text"
                  value={form.first_name}
                  onChange={(e) => updateForm("first_name", e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
                <input
                  type="text"
                  value={form.last_name}
                  onChange={(e) => updateForm("last_name", e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => updateForm("password", e.target.value)}
                  className="w-full px-4 py-2 pr-12 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2: Household Info */}
          <div className="bg-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Home className="w-5 h-5" />
              Household
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Family Name</label>
              <input
                type="text"
                value={form.family_name}
                onChange={(e) => updateForm("family_name", e.target.value)}
                placeholder="e.g., The Smith Family"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
              <input
                type="text"
                value={form.address_line1}
                onChange={(e) => updateForm("address_line1", e.target.value)}
                placeholder="123 Main St"
                className="w-full px-4 py-2 mb-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
              <input
                type="text"
                value={form.address_line2}
                onChange={(e) => updateForm("address_line2", e.target.value)}
                placeholder="Apt, Suite, etc."
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateForm("city", e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={form.state}
                  onChange={(e) => updateForm("state", e.target.value)}
                  placeholder="TX"
                  maxLength={2}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">ZIP</label>
                <input
                  type="text"
                  value={form.zip}
                  onChange={(e) => updateForm("zip", e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4 mt-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.emergency_contact_name}
                    onChange={(e) => updateForm("emergency_contact_name", e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.emergency_contact_phone}
                    onChange={(e) => updateForm("emergency_contact_phone", e.target.value)}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Youth Members */}
          <div className="bg-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Youth Members
              </h2>
              <button
                type="button"
                onClick={addYouth}
                className="text-sm text-forest-400 hover:text-forest-300 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add Youth
              </button>
            </div>

            {youth.length === 0 ? (
              <p className="text-slate-500 text-sm">No youth members added yet. You can add them later.</p>
            ) : (
              <div className="space-y-4">
                {youth.map((y, i) => (
                  <div key={i} className="p-4 bg-slate-700 rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-slate-300">Youth {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeYouth(i)}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="First name"
                        value={y.first_name}
                        onChange={(e) => updateYouth(i, "first_name", e.target.value)}
                        className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Last name"
                        value={y.last_name}
                        onChange={(e) => updateYouth(i, "last_name", e.target.value)}
                        className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={y.dob}
                        onChange={(e) => updateYouth(i, "dob", e.target.value)}
                        className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                      />
                      <select
                        value={y.program_id}
                        onChange={(e) => updateYouth(i, "program_id", e.target.value)}
                        className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
                      >
                        <option value="">Select program</option>
                        {programs.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <p className="text-center text-slate-400 text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-forest-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-forest-500" />
      </div>
    }>
      <RegisterFormInner />
    </Suspense>
  );
}
