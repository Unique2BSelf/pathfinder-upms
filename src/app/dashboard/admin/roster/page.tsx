"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, AlertTriangle, Download, Search, Trash2, X } from "lucide-react";

interface Household {
  family_name: string;
  city: string;
  state: string;
}

interface YouthMember {
  id: string;
  first_name: string;
  last_name: string;
  dob: string;
  grade: number;
  known_allergies: string;
  medications: string;
  medical_alert_flag: boolean;
  physical_expiration: string;
  household_id: string;
  household?: Household | Household[];
  enrollments?: { program: { name: string; slug: string } }[];
  type: "youth";
}

interface AdultMember {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  household_id: string;
  household?: Household | Household[];
  type: "adult";
}

type Member = YouthMember | AdultMember;

function getHousehold(h: Household | Household[] | undefined): Household | undefined {
  if (!h) return undefined;
  if (Array.isArray(h)) return h[0];
  return h;
}

export default function AdminRosterPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{ id: string; name: string; type: string } | null>(null);

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

      const { data: youthData } = await supabase
        .from("youth_members")
        .select(`
          id, first_name, last_name, dob, grade,
          known_allergies, medications, medical_alert_flag, physical_expiration, household_id,
          household:households(id, family_name, city, state),
          enrollments(program:programs(name, slug))
        `)
        .order("last_name");

      const { data: adultData } = await supabase
        .from("users")
        .select(`
          id, first_name, last_name, email, phone, role, household_id,
          household:households(id, family_name, city, state)
        `)
        .order("last_name");

      const youth: Member[] = (youthData || []).map((y: any) => ({ ...y, type: "youth" as const }));
      const adults: Member[] = (adultData || []).map((a: any) => ({ ...a, type: "adult" as const }));

      setMembers([...youth, ...adults]);
      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const filtered = members.filter((m) => {
    const matchesSearch =
      !search ||
      m.first_name.toLowerCase().includes(search.toLowerCase()) ||
      m.last_name.toLowerCase().includes(search.toLowerCase()) ||
      getHousehold(m.household)?.family_name?.toLowerCase().includes(search.toLowerCase());

    const matchesAlerts = !showAlertsOnly || 
      (m.type === "youth" && (m as YouthMember).medical_alert_flag);
    
    return matchesSearch && matchesAlerts;
  });

  const handleRemove = async () => {
    if (!removeConfirm) return;
    
    const { type, id } = removeConfirm;
    setRemovingId(id);
    
    if (type === "youth") {
      await supabase.from("youth_members").delete().eq("id", id);
    } else {
      await supabase.from("users").delete().eq("id", id);
    }
    
    setMembers(members.filter(m => m.id !== id));
    setRemoveConfirm(null);
    setRemovingId(null);
  };

  const exportCSV = () => {
    const headers = ["Name", "Type", "Grade", "Family", "City", "State", "Allergies", "Meds", "Alert", "Physical Exp"];
    const rows = filtered.map((m) => {
      const hh = getHousehold(m.household);
      return [
        `${m.first_name} ${m.last_name}`,
        m.type,
        m.type === "youth" ? (m as YouthMember).grade?.toString() || "" : (m as AdultMember).role || "",
        hh?.family_name || "",
        hh?.city || "",
        hh?.state || "",
        m.type === "youth" ? (m as YouthMember).known_allergies || "" : "",
        m.type === "youth" ? (m as YouthMember).medications || "" : "",
        m.type === "youth" && (m as YouthMember).medical_alert_flag ? "YES" : "",
        m.type === "youth" ? (m as YouthMember).physical_expiration || "" : "",
      ];
    });

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pathfinder-roster-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading roster...</div>;
  if (!["admin", "superadmin", "leader"].includes(userRole || "")) {
    return <div className="p-8 text-center text-red-400">Admin access required</div>;
  }

  return (
    <div className="space-y-6">
      {removeConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Remove {removeConfirm.type === "youth" ? "Youth" : "Adult"}?</h3>
            </div>
            <p className="text-slate-300 mb-6">
              Are you sure you want to remove <strong>{removeConfirm.name}</strong>? 
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRemoveConfirm(null)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={removingId === removeConfirm.id}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50"
              >
                {removingId === removeConfirm.id ? "Removing..." : "Yes, Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Roster</h1>
          <p className="text-slate-400 text-sm">
            {filtered.length} members ({members.filter(m => m.type === "youth").length} youth, {members.filter(m => m.type === "adult").length} adults)
            {showAlertsOnly && " with alerts"}
          </p>
        </div>
        <button onClick={exportCSV} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 flex items-center gap-2">
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
            showAlertsOnly ? "bg-red-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"
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
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Family</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Programs/Role</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-300">Medical</th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filtered.map((member) => {
              const hh = getHousehold(member.household);
              return (
                <tr key={member.id} className="hover:bg-slate-750">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">
                      {member.first_name} {member.last_name}
                    </div>
                    {member.type === "youth" && (
                      <div className="text-xs text-slate-500">DOB: {(member as YouthMember).dob}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      member.type === "youth" ? "bg-amber-600/20 text-amber-400" : "bg-blue-600/20 text-blue-400"
                    }`}>
                      {member.type === "youth" ? "Youth" : "Adult"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300">{hh?.family_name}</div>
                    <div className="text-xs text-slate-500">
                      {hh?.city}, {hh?.state}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {member.type === "youth" ? (
                      <div className="flex flex-wrap gap-1">
                        {(member as YouthMember).enrollments?.map((e, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                            {e.program?.name}
                          </span>
                        )) || <span className="text-slate-500 text-sm">—</span>}
                      </div>
                    ) : (
                      <span className="text-slate-300">{(member as AdultMember).role}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {member.type === "youth" ? (
                      (member as YouthMember).medical_alert_flag ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 text-sm">
                            {(member as YouthMember).known_allergies || (member as YouthMember).medications || "Alert"}
                          </span>
                        </div>
                      ) : <span className="text-slate-500">—</span>
                    ) : <span className="text-slate-500">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setRemoveConfirm({ 
                        id: member.id, 
                        name: `${member.first_name} ${member.last_name}`,
                        type: member.type 
                      })}
                      className="p-2 hover:bg-red-600/20 rounded text-red-400"
                      title="Remove from household"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
