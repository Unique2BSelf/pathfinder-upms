"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Save, Loader2, CheckCircle2, AlertCircle, User,
  Home, Phone, Shield, KeyRound
} from "lucide-react";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN",
                   "IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV",
                   "NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN",
                   "TX","UT","VT","VA","WA","WV","WI","WY"];

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function ProfilePage() {
  const supabase = createClient();

  const [userId,      setUserId]      = useState<string | null>(null);
  const [householdId, setHouseholdId] = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saveStatus,  setSaveStatus]  = useState<SaveStatus>("idle");
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [activeTab,   setActiveTab]   = useState<"personal" | "address" | "emergency" | "calendar">("personal");

  // Personal
  const [personal, setPersonal] = useState({ first_name: "", last_name: "", email: "", phone: "" });

  // Address
  const [address, setAddress] = useState({
    family_name:   "",
    address_line1: "",
    address_line2: "",
    city:          "",
    state:         "",
    zip:           "",
  });

  // Emergency
  const [emergency, setEmergency] = useState({
    emergency_contact_name:  "",
    emergency_contact_phone: "",
    emergency_contact_rel:   "",
  });

  // Calendar
  const [calendarPw, setCalendarPw] = useState("");

  // Load existing data
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: u } = await supabase
        .from("users")
        .select("first_name, last_name, email, phone, household_id")
        .eq("id", user.id)
        .single();

      if (u) {
        setPersonal({
          first_name: u.first_name ?? "",
          last_name:  u.last_name  ?? "",
          email:      u.email      ?? user.email ?? "",
          phone:      u.phone      ?? "",
        });
        setHouseholdId(u.household_id);

        if (u.household_id) {
          const { data: hh } = await supabase
            .from("households")
            .select("family_name, address_line1, address_line2, city, state, zip, emergency_contact_name, emergency_contact_phone, emergency_contact_rel, calendar_password")
            .eq("id", u.household_id)
            .single();

          if (hh) {
            setAddress({
              family_name:   hh.family_name   ?? "",
              address_line1: hh.address_line1 ?? "",
              address_line2: hh.address_line2 ?? "",
              city:          hh.city          ?? "",
              state:         hh.state         ?? "",
              zip:           hh.zip           ?? "",
            });
            setEmergency({
              emergency_contact_name:  hh.emergency_contact_name  ?? "",
              emergency_contact_phone: hh.emergency_contact_phone ?? "",
              emergency_contact_rel:   hh.emergency_contact_rel   ?? "",
            });
            setCalendarPw(hh.calendar_password ?? "");
          }
        }
      }
      setLoading(false);
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Save handler ──────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaveStatus("saving");
    setErrorMsg(null);

    try {
      // Update users table (phone change will trigger admin alert via DB trigger)
      const { error: userErr } = await supabase
        .from("users")
        .update({
          first_name: personal.first_name,
          last_name:  personal.last_name,
          phone:      personal.phone,
        })
        .eq("id", userId);

      if (userErr) throw new Error(userErr.message);

      // Update households (address change will trigger admin alert via DB trigger)
      if (householdId) {
        const { error: hhErr } = await supabase
          .from("households")
          .update({
            family_name:              address.family_name,
            address_line1:            address.address_line1,
            address_line2:            address.address_line2 || null,
            city:                     address.city,
            state:                    address.state,
            zip:                      address.zip,
            emergency_contact_name:   emergency.emergency_contact_name,
            emergency_contact_phone:  emergency.emergency_contact_phone,
            emergency_contact_rel:    emergency.emergency_contact_rel,
            calendar_password:        calendarPw || "pathfinder2024",
          })
          .eq("id", householdId);

        if (hhErr) throw new Error(hhErr.message);
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setSaveStatus("error");
    }
  }

  const TABS = [
    { id: "personal",   label: "Personal",       icon: User    },
    { id: "address",    label: "Address",         icon: Home    },
    { id: "emergency",  label: "Emergency",       icon: Shield  },
    { id: "calendar",   label: "Calendar",        icon: KeyRound},
  ] as const;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Address and phone changes automatically notify program admins.
        </p>
      </div>

      {/* Admin alert notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10
                      border border-amber-500/30 text-amber-400 text-sm">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Changes to your address or phone number will be flagged to program staff for their records.</p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg bg-slate-800 p-1 gap-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md
                          text-xs font-medium transition-all
                ${activeTab === tab.id
                  ? "bg-slate-700 text-white shadow"
                  : "text-slate-500 hover:text-slate-300"}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:block">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* ── Personal tab ────────────────────────────────────────── */}
        {activeTab === "personal" && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm">Personal Information</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First name</label>
                <input type="text" required value={personal.first_name}
                  onChange={(e) => setPersonal(p => ({ ...p, first_name: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="label">Last name</label>
                <input type="text" required value={personal.last_name}
                  onChange={(e) => setPersonal(p => ({ ...p, last_name: e.target.value }))}
                  className="input" />
              </div>
            </div>
            <div>
              <label className="label">Email address</label>
              <input type="email" value={personal.email} disabled
                className="input opacity-50 cursor-not-allowed" />
              <p className="text-xs text-slate-600 mt-1">
                Email cannot be changed here. Contact support.
              </p>
            </div>
            <div>
              <label className="label">
                Phone number
                <span className="text-amber-500 text-[10px] ml-2 font-normal">
                  ⚠ Changes notify admins
                </span>
              </label>
              <input type="tel" value={personal.phone}
                onChange={(e) => setPersonal(p => ({ ...p, phone: e.target.value }))}
                placeholder="(555) 000-0000" className="input" />
            </div>
          </div>
        )}

        {/* ── Address tab ──────────────────────────────────────────── */}
        {activeTab === "address" && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-white text-sm">Home Address</h2>
              <span className="text-amber-500 text-[10px] font-normal">⚠ Changes notify admins</span>
            </div>
            <div>
              <label className="label">Family name</label>
              <input type="text" value={address.family_name}
                onChange={(e) => setAddress(p => ({ ...p, family_name: e.target.value }))}
                className="input" />
            </div>
            <div>
              <label className="label">Street address</label>
              <input type="text" value={address.address_line1}
                onChange={(e) => setAddress(p => ({ ...p, address_line1: e.target.value }))}
                placeholder="123 Main St" className="input" />
            </div>
            <div>
              <label className="label">Apt / Suite <span className="text-slate-500 font-normal">(optional)</span></label>
              <input type="text" value={address.address_line2}
                onChange={(e) => setAddress(p => ({ ...p, address_line2: e.target.value }))}
                className="input" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">City</label>
                <input type="text" value={address.city}
                  onChange={(e) => setAddress(p => ({ ...p, city: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="label">State</label>
                <select value={address.state}
                  onChange={(e) => setAddress(p => ({ ...p, state: e.target.value }))}
                  className="input">
                  <option value="">--</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">ZIP</label>
                <input type="text" value={address.zip}
                  onChange={(e) => setAddress(p => ({ ...p, zip: e.target.value }))}
                  maxLength={10} className="input" />
              </div>
            </div>
          </div>
        )}

        {/* ── Emergency tab ────────────────────────────────────────── */}
        {activeTab === "emergency" && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm">Emergency Contact</h2>
            <p className="text-slate-500 text-xs">
              This should be someone other than the registered guardians — a grandparent, neighbor, or close family friend.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Full name</label>
                <input type="text" value={emergency.emergency_contact_name}
                  onChange={(e) => setEmergency(p => ({ ...p, emergency_contact_name: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="label">Relationship</label>
                <input type="text" value={emergency.emergency_contact_rel}
                  onChange={(e) => setEmergency(p => ({ ...p, emergency_contact_rel: e.target.value }))}
                  placeholder="Grandmother, Uncle…" className="input" />
              </div>
            </div>
            <div>
              <label className="label">Phone number</label>
              <input type="tel" value={emergency.emergency_contact_phone}
                onChange={(e) => setEmergency(p => ({ ...p, emergency_contact_phone: e.target.value }))}
                placeholder="(555) 000-0000" className="input" />
            </div>
          </div>
        )}

        {/* ── Calendar tab ─────────────────────────────────────────── */}
        {activeTab === "calendar" && (
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-white text-sm">Family Calendar Password</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              This password lets anyone in your family view the program calendar without
              logging in. Share it with grandparents, babysitters, or coaches who just
              need to check the schedule.
            </p>
            <div>
              <label className="label">Calendar password</label>
              <input type="text" value={calendarPw}
                onChange={(e) => setCalendarPw(e.target.value)}
                placeholder="e.g. smith-family-2024" className="input" />
            </div>
            <p className="text-xs text-slate-600">
              Share this link with the password:{" "}
              <span className="text-slate-400 font-mono">
                {typeof window !== "undefined" ? window.location.origin : ""}/calendar
              </span>
            </p>
          </div>
        )}

        {/* ── Save button ──────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saveStatus === "saving"}
            className="btn-gold px-8 py-3 rounded-xl font-bold flex items-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
            ) : saveStatus === "saved" ? (
              <><CheckCircle2 className="w-4 h-4" /> Saved!</>
            ) : (
              <><Save className="w-4 h-4" /> Save Changes</>
            )}
          </button>

          {saveStatus === "error" && errorMsg && (
            <p className="text-red-400 text-sm flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
