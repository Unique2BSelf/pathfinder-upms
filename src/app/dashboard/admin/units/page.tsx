"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Users, Plus, Trash2, ArrowRight, ArrowLeft, 
  Crown, Loader2, Search, X, ChevronRight 
} from "lucide-react";

interface Patrol {
  id: string;
  name: string;
  program: "cub" | "boy";
  type: "den" | "patrol";
  is_active: boolean;
}

interface YouthMember {
  id: string;
  first_name: string;
  last_name: string;
}

interface Assignment {
  id: string;
  youth_member_id: string;
  patrol_id: string;
  role: string | null;
  youth_members: YouthMember;
}

const LEADERSHIP_ROLES = [
  { value: "leader", label: "Patrol Leader" },
  { value: "assistant", label: "Assistant PL" },
  { value: "scribe", label: "Scribe" },
  { value: "quartermaster", label: "Quartermaster" },
  { value: "member", label: "Member" },
];

export default function UnitsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [allYouth, setAllYouth] = useState<YouthMember[]>([]);
  const [selectedPatrol, setSelectedPatrol] = useState<Patrol | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPatrol, setNewPatrol] = useState({ name: "", program: "boy" as "cub" | "boy" });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [movingYouth, setMovingYouth] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPatrol) {
      loadAssignments();
    }
  }, [selectedPatrol]);

  const loadData = async () => {
    setLoading(true);
    
    // Load patrols
    const { data: patrolData } = await supabase
      .from("patrols")
      .select("*")
      .order("name");
    if (patrolData) setPatrols(patrolData);

    // Load all youth members
    const { data: youthData } = await supabase
      .from("youth_members")
      .select("id, first_name, last_name")
      .order("last_name");
    if (youthData) setAllYouth(youthData as any);

    setLoading(false);
  };

  const loadAssignments = async () => {
    if (!selectedPatrol) return;

    const { data } = await supabase
      .from("patrol_assignments")
      .select(`
        id,
        youth_member_id,
        patrol_id,
        role,
        youth_members(id, first_name, last_name)
      `)
      .eq("patrol_id", selectedPatrol.id);

    if (data) setAssignments(data as any);
  };

  const createPatrol = async () => {
    if (!newPatrol.name.trim()) return;
    setSaving(true);

    const type = newPatrol.program === "boy" ? "patrol" : "den";
    
    await supabase.from("patrols").insert({
      name: newPatrol.name,
      program: newPatrol.program,
      type,
      is_active: true,
    });

    await loadData();
    setShowCreateModal(false);
    setNewPatrol({ name: "", program: "boy" });
    setSaving(false);
  };

  const deletePatrol = async (id: string) => {
    if (!confirm("Delete this patrol? Scouts will return to unassigned.")) return;
    
    // Delete patrol assignments (scouts become unassigned)
    await supabase.from("patrol_assignments").delete().eq("patrol_id", id);
    // Delete the patrol
    await supabase.from("patrols").delete().eq("id", id);
    
    if (selectedPatrol?.id === id) {
      setSelectedPatrol(null);
    }
    await loadData();
  };

  // Move youth TO the selected patrol
  const moveToPatrol = async () => {
    if (!selectedPatrol || movingYouth.size === 0) return;
    setSaving(true);

    const inserts = Array.from(movingYouth).map((youthId) => ({
      youth_member_id: youthId,
      patrol_id: selectedPatrol.id,
      role: "member",
    }));

    await supabase.from("patrol_assignments").upsert(inserts, {
      onConflict: "youth_member_id,patrol_id",
    });

    setMovingYouth(new Set());
    await loadAssignments();
    setSaving(false);
  };

  // Move youth FROM the selected patrol (back to unassigned)
  const moveToUnassigned = async (assignmentIds: string[]) => {
    setSaving(true);

    await supabase.from("patrol_assignments").delete().eq("id", assignmentIds[0]);
    
    await loadAssignments();
    setSaving(false);
  };

  // Update leadership role
  const updateRole = async (assignmentId: string, role: string) => {
    await supabase
      .from("patrol_assignments")
      .update({ role })
      .eq("id", assignmentId);

    // If leader role, also add to leadership_log
    if (role !== "member") {
      const assignment = assignments.find((a) => a.id === assignmentId);
      if (assignment) {
        // Check if already has active leadership
        const { data: existing } = await supabase
          .from("leadership_log")
          .select("id")
          .eq("youth_member_id", assignment.youth_member_id)
          .eq("is_active", true)
          .maybeSingle();

        if (!existing) {
          await supabase.from("leadership_log").insert({
            youth_member_id: assignment.youth_member_id,
            role: role,
            start_date: new Date().toISOString().split("T")[0],
            is_active: true,
          });
        }
      }
    }

    await loadAssignments();
  };

  // Get assigned youth IDs
  const assignedYouthIds = assignments.map((a) => a.youth_member_id);
  
  // Unassigned youth
  const unassignedYouth = allYouth.filter(
    (y) => !assignedYouthIds.includes(y.id)
  );

  // Filter by search
  const filteredUnassigned = unassignedYouth.filter(
    (y) => `${y.first_name} ${y.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssigned = assignments.filter(
    (a) => {
      const name = `${a.youth_members.first_name} ${a.youth_members.last_name}`.toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Units Management</h1>
            <p className="text-slate-500">Patrols, Dens, and Assignments</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          New Unit
        </button>
      </div>

      {/* Unit Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-800 mb-4">Units</h2>
            
            {patrols.length === 0 ? (
              <p className="text-slate-500 text-sm">No units yet.</p>
            ) : (
              <div className="space-y-2">
                {patrols.map((patrol) => (
                  <div
                    key={patrol.id}
                    className={`p-3 rounded-lg border cursor-pointer transition ${
                      selectedPatrol?.id === patrol.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div onClick={() => setSelectedPatrol(patrol)} className="flex-1">
                        <span className="font-medium text-slate-800">{patrol.name}</span>
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {patrol.program === "boy" ? "Boy Scouts" : "Cub Scouts"}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deletePatrol(patrol.id);
                        }}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Transfer List */}
        <div className="lg:col-span-3">
          {selectedPatrol ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {selectedPatrol.name}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {selectedPatrol.program === "boy" ? "Boy Scout Patrol" : "Cub Scout Den"}
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-48"
                  />
                </div>
              </div>

              {/* Side-by-Side Transfer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unassigned Column */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Unassigned ({filteredUnassigned.length})
                  </h3>
                  <div className="border border-slate-200 rounded-lg h-64 overflow-y-auto">
                    {filteredUnassigned.length === 0 ? (
                      <p className="p-4 text-slate-400 text-sm">No unassigned scouts</p>
                    ) : (
                      filteredUnassigned.map((youth) => (
                        <label
                          key={youth.id}
                          className={`flex items-center gap-3 p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${
                            movingYouth.has(youth.id) ? "bg-indigo-50" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={movingYouth.has(youth.id)}
                            onChange={(e) => {
                              const newSet = new Set(movingYouth);
                              if (e.target.checked) {
                                newSet.add(youth.id);
                              } else {
                                newSet.delete(youth.id);
                              }
                              setMovingYouth(newSet);
                            }}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-slate-800">
                            {youth.first_name} {youth.last_name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                {/* Assigned Column */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">
                    Unit Members ({filteredAssigned.length})
                  </h3>
                  <div className="border border-slate-200 rounded-lg h-64 overflow-y-auto">
                    {filteredAssigned.length === 0 ? (
                      <p className="p-4 text-slate-400 text-sm">No members yet</p>
                    ) : (
                      filteredAssigned.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-center justify-between p-3 border-b border-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-800">
                              {assignment.youth_members.first_name} {assignment.youth_members.last_name}
                            </span>
                            {assignment.role && assignment.role !== "member" && (
                              <Crown className="w-3 h-3 text-amber-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={assignment.role || "member"}
                              onChange={(e) => updateRole(assignment.id, e.target.value)}
                              className="text-xs border border-slate-300 rounded px-2 py-1"
                            >
                              {LEADERSHIP_ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => moveToUnassigned([assignment.id])}
                              className="text-slate-400 hover:text-red-500 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Transfer Buttons */}
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={moveToPatrol}
                  disabled={movingYouth.size === 0 || saving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  <ArrowRight className="w-4 h-4" />
                  Add to {selectedPatrol.name}
                  {movingYouth.size > 0 && ` (${movingYouth.size})`}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                Select a unit to manage members
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Create New Unit
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={newPatrol.name}
                  onChange={(e) => setNewPatrol({ ...newPatrol, name: e.target.value })}
                  placeholder="e.g., Raven Patrol"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Program
                </label>
                <select
                  value={newPatrol.program}
                  onChange={(e) => setNewPatrol({ ...newPatrol, program: e.target.value as "cub" | "boy" })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="boy">Boy Scouts (Patrol)</option>
                  <option value="cub">Cub Scouts (Den)</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={createPatrol}
                disabled={saving || !newPatrol.name.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
