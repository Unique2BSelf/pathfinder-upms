"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Home, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function CRMDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState({ households: 0, members: 0, events: 0, pendingAlerts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const [{ count: hhCount }, { count: youthCount }, { count: eventCount }, { data: alerts }] = await Promise.all([
        supabase.from("households").select("*", { count: "exact", head: true }),
        supabase.from("youth_members").select("*", { count: "exact", head: true }),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("admin_alerts").select("*").eq("status", "unread"),
      ]);
      setStats({ households: hhCount || 0, members: youthCount || 0, events: eventCount || 0, pendingAlerts: alerts?.length || 0 });
      setLoading(false);
    }
    loadStats();
  }, [supabase]);

  if (loading) return <div className="p-8 text-center text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">CRM Dashboard</h1>
        <p className="text-slate-400">Overview of your organization</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/admin/roster" className="bg-slate-800 rounded-xl p-6 hover:bg-slate-750">
          <Users className="w-8 h-8 text-forest-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.members}</div>
          <div className="text-sm text-slate-400">Youth Members</div>
        </Link>
        <Link href="/dashboard/admin/households" className="bg-slate-800 rounded-xl p-6 hover:bg-slate-750">
          <Home className="w-8 h-8 text-blue-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.households}</div>
          <div className="text-sm text-slate-400">Households</div>
        </Link>
        <Link href="/dashboard/admin/events" className="bg-slate-800 rounded-xl p-6 hover:bg-slate-750">
          <Calendar className="w-8 h-8 text-amber-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.events}</div>
          <div className="text-sm text-slate-400">Events</div>
        </Link>
        <Link href="/dashboard/admin/alerts" className="bg-slate-800 rounded-xl p-6 hover:bg-slate-750">
          <AlertTriangle className="w-8 h-8 text-red-400 mb-2" />
          <div className="text-2xl font-bold text-white">{stats.pendingAlerts}</div>
          <div className="text-sm text-slate-400">Alerts</div>
        </Link>
      </div>
    </div>
  );
}
