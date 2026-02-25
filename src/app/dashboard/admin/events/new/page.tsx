"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Save, X } from "lucide-react";
import Link from "next/link";

const EVENT_TYPES = ["meeting", "campout", "service", "fundraiser", "competition", "ceremony", "trip", "other"];

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", event_type: "meeting", program_id: "", location: "",
    starts_at: "", ends_at: "", is_public: true, rsvp_enabled: false, max_attendees: ""
  });

  useEffect(() => { supabase.from("programs").select("*").then(({ data }) => setPrograms(data || [])); }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("events").insert({
      title: form.title, description: form.description, event_type: form.event_type,
      program_id: form.program_id || null, location: form.location || null,
      starts_at: form.starts_at, ends_at: form.ends_at,
      is_public: form.is_public, rsvp_enabled: form.rsvp_enabled,
      max_attendees: form.max_attendees ? parseInt(form.max_attendees) : null,
    });
    if (error) { alert(error.message); setLoading(false); return; }
    router.push("/dashboard/admin/events");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between"><h1 className="text-2xl font-bold text-white">Create Event</h1><Link href="/dashboard/admin/events"><X className="w-6 h-6 text-slate-400"/></Link></div>
      <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 space-y-4">
        <div><label className="block text-sm text-slate-300 mb-1">Title *</label><input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" required/></div>
        <div><label className="block text-sm text-slate-300 mb-1">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-slate-300 mb-1">Type *</label><select value={form.event_type} onChange={e => setForm({...form, event_type: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white">{EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
          <div><label className="block text-sm text-slate-300 mb-1">Program</label><select value={form.program_id} onChange={e => setForm({...form, program_id: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"><option value="">All Programs</option>{programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        </div>
        <div><label className="block text-sm text-slate-300 mb-1">Location</label><input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"/></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm text-slate-300 mb-1">Start *</label><input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form, starts_at: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" required/></div>
          <div><label className="block text-sm text-slate-300 mb-1">End *</label><input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form, ends_at: e.target.value})} className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white" required/></div>
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={form.is_public} onChange={e => setForm({...form, is_public: e.target.checked})}/>Public</label>
          <label className="flex items-center gap-2 text-slate-300"><input type="checkbox" checked={form.rsvp_enabled} onChange={e => setForm({...form, rsvp_enabled: e.target.checked})}/>RSVP</label>
        </div>
        <button type="submit" disabled={loading} className="w-full py-3 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-lg disabled:opacity-50">{loading ? "Saving..." : "Save Event"}</button>
      </form>
    </div>
  );
}
