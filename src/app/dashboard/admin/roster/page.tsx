"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, AlertTriangle, Download, Search, Filter } from "lucide-react";

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  grade: number;
  known_allergies: string;
  medications: string;
  medical_alert_flag: boolean;
  physical_expiration: string;
  household: {
    family_name: string;
    city: string;
    state: string;
  };
  enrollments: {
    program: {
      name: string;
      slug: string;
    };
  }[];
}

export default function AdminRosterPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!userData || !["admin", "superadmin", "leader"].includes(userData.role)) {
        setLoading(false);
        return;
      }
      setUserRole(userData.role);

      const { data: membersData } = await supabase
        .from("youth_members")
        .select(`
          id, first_name, last_name, dob, grade,
          known_allergies, medications, medical_alert_flag, physical_expiration,
          household:households(id, family_name, city, state),
          enrollments(
:programs(id,            program name, slug)
          )
        `)
        .order("last_name");

      if (membersData) {
        setMembers(membersData as any);
      }
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.first_name.toLowerCase().includes(search.toLowerCase()) ||
      m.last_name.toLowerCase().includes(search.toLowerCase()) ||
      m.household?.family_name?.toLowerCase().includes(search.toLowerCase());

    const matchesAlerts = !showAlertsOnly || m.medical_alert_flag;
    return matchesSearch && matchesAlerts;
  });

  const exportCSV = () => {
    const headers = ["Name", "Grade", "Family", "City", "State", "Allergies", "Meds", "Alert", "Physical Exp"];
    const rows = filtered.map((m) => [
      `${m.first_name} ${m.last_name}`,
      m.grade || "",
      m.household?.family_name || "",
      m.household?.city || "",
      m.household?.state || "",
      m.known_allergies || "",
      m.medications || "",
      m.medical_alert_flag ? "YES" : "",
      m.physical_expiration || "",
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pathfinder-roster-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading roster...</div>;
  }

  if (!["admin", "superadmin", "leader"].includes(userRole || "")) {
    return (
      <div className="p-8 text-center text-red-400">
        Admin access required
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Roster</h1>
          <p className="text-slate-400 text-sm">
            {filtered.length} members
            {showAlertsOnly && " with alerts"}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or family..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
          />
        </div>
        <button
          onClick={() => setShowAlertsOnly(!showAlertsOnly)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            showAlertsOnly
              ? "bg-red-600 text-white"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> Alerts Only
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Grade</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Family</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Programs</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Medical Alert</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Physical</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.map((member) => (
              <tr key={member.id} className="hover:bg-slate-750">
                <td className="px-4 py-3">
                  <div className="text-white font-medium">
                    {member.first_name} {member.last_name}
                  </div>
                  <div className="text-xs text-slate-500">
                    DOB: {member.dob}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-300">
                  {member.grade !== null ? `Grade ${member.grade}` : "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="text-slate-300">{member.household?.family_name}</div>
                  <div className="text-xs text-slate-500">
                    {member.household?.city}, {member.household?.state}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {member.enrollments?.map((e, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded"
                      >
                        {e.program?.name}
                      </span>
                    )) || <span className="text-slate-500 text-sm">—</span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {member.medical_alert_flag ? (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">
                        {member.known_allergies || member.medications || "Alert"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {member.physical_expiration ? (
                    <span
                      className={`text-sm ${
                        new Date(member.physical_expiration) < new Date()
                          ? "text-red-400"
                          : new Date(member.physical_expiration) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
                          ? "text-yellow-400"
                          : "text-slate-300"
                      }`}
                    >
                      {new Date(member.physical_expiration).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-red-400 text-sm">Missing</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
