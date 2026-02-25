"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Edit } from "lucide-react";
import Link from "next/link";

export default function EventsPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    Promise.all([
      supabase.from("events").select("*, program:programs(id, name, slug)").order("starts_at"),
      supabase.from("programs").select("*")
    ]).then(([e, p]) => {
      setEvents(e.data || []);
      setPrograms(p.data || []);
    });
  }, [supabase]);

  const filtered = filter === "all" ? events : events.filter(e => e.program?.slug === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Events</h1>
        <Link href="/dashboard/admin/events/new" className="px-4 py-2 bg-forest-600 text-white rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Event
        </Link>
      </div>
      <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white">
        <option value="all">All Programs</option>
        {programs.map(p => <option key={p.id} value={p.slug}>{p.name}</option>)}
      </select>
      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr><th className="px-4 py-3 text-left">Event</th><th className="px-4 py-3 text-left">Program</th><th className="px-4 py-3 text-left">Date</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-slate-750">
                <td className="px-4 py-3 text-white">{e.title}</td>
                <td className="px-4 py-3 text-slate-400">{e.program?.name || "All"}</td>
                <td className="px-4 py-3 text-slate-400">{new Date(e.starts_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
