"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Users, Shield, Save, AlertTriangle } from "lucide-react";

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

const ROLES = [
  { value: "parent", label: "Parent", description: "Regular user - can manage their household" },
  { value: "leader", label: "Leader", description: "Can access admin sections" },
  { value: "admin", label: "Admin", description: "Full admin access" },
  { value: "superadmin", label: "Superadmin", description: "Full access including settings" },
];

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("users").select("id, email, first_name, last_name, role, created_at").order("created_at", { ascending: false })
      .then(({ data }) => { setUsers(data || []); setLoading(false); });
  }, [supabase]);

  const updateRole = async (userId: string, newRole: string) => {
    setSaving(userId);
    await supabase.from("users").update({ role: newRole }).eq("id", userId);
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setSaving(null);
  };

  const filtered = users.filter(u => 
    !search || 
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Settings</h1>
        <p className="text-slate-400">Manage user roles and permissions</p>
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" /> User Roles
        </h2>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          />
        </div>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => (
              <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div className="flex-1">
                  <div className="text-white font-medium">
                    {user.first_name} {user.last_name}
                  </div>
                  <div className="text-sm text-slate-400">{user.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={user.role || "parent"}
                    onChange={e => updateRole(user.id, e.target.value)}
                    disabled={saving === user.id}
                    className={`px-3 py-2 rounded-lg text-white text-sm border-0 ${
                      user.role === "admin" || user.role === "superadmin" 
                        ? "bg-amber-600" 
                        : "bg-slate-600"
                    }`}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-slate-500 text-center py-4">No users found</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Role Descriptions</h2>
        <div className="space-y-3">
          {ROLES.map(role => (
            <div key={role.value} className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg">
              <Shield className={`w-5 h-5 mt-0.5 ${
                role.value === "superadmin" ? "text-red-400" :
                role.value === "admin" ? "text-amber-400" :
                role.value === "leader" ? "text-blue-400" :
                "text-slate-400"
              }`} />
              <div>
                <div className="text-white font-medium">{role.label}</div>
                <div className="text-sm text-slate-400">{role.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
