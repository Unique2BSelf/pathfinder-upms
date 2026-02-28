"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Check, AlertCircle, Users, ChevronDown, Loader2, Trophy } from "lucide-react";

interface Rank {
  id: string;
  slug: string;
  name: string;
  program: string;
}

interface Requirement {
  id: string;
  name: string;
  description: string;
  display_order: number;
}

interface YouthMember {
  id: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  patrol_id?: string;
}

interface Progress {
  requirement_id: string;
  status: string;
}

interface Patrol {
  id: string;
  name: string;
  program: string;
}

export default function AdvancementGridPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [patrols, setPatrols] = useState<Patrol[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [selectedPatrol, setSelectedPatrol] = useState<string>("");
  const [selectedProgram, setSelectedProgram] = useState<string>("boy");
  const [selectedRank, setSelectedRank] = useState<Rank | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [youth, setYouth] = useState<YouthMember[]>([]);
  const [progress, setProgress] = useState<Record<string, Record<string, string>>>({});
  const [selectedScouts, setSelectedScouts] = useState<Set<string>>(new Set());
  const [savingRequirement, setSavingRequirement] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadPatrols();
  }, []);

  useEffect(() => {
    loadRanks();
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedRank && selectedPatrol) {
      loadData();
    }
  }, [selectedRank, selectedPatrol]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const loadPatrols = async () => {
    const { data } = await supabase
      .from("patrols")
      .select("*")
      .eq("is_active", true)
      .order("name");
    if (data) setPatrols(data);
    setLoading(false);
  };

  const loadRanks = async () => {
    const { data } = await supabase
      .from("advancement_catalog")
      .select("id, slug, name, program")
      .eq("type", "rank")
      .eq("program", selectedProgram)
      .order("display_order");
    if (data) {
      setRanks(data);
      if (data.length > 0) {
        setSelectedRank(data[0]);
      }
    }
  };

  const loadData = async () => {
    if (!selectedRank) return;
    setLoading(true);

    const { data: reqs } = await supabase
      .from("advancement_catalog")
      .select("id, name, description, display_order")
      .eq("parent_id", selectedRank.id)
      .order("display_order");
    if (reqs) setRequirements(reqs);

    const { data: assignments } = await supabase
      .from("patrol_assignments")
      .select(`
        youth_member_id,
        youth_members(id, first_name, last_name, preferred_name)
      `)
      .eq("patrol_id", selectedPatrol);

    if (assignments) {
      const youthData = assignments.map((a: any) => a.youth_members);
      setYouth(youthData);

      const youthIds = youthData.map((y: any) => y.id);
      if (youthIds.length > 0) {
        const { data: progressData } = await supabase
          .from("scout_progress")
          .select("requirement_id, youth_member_id, status")
          .in("youth_member_id", youthIds)
          .in("requirement_id", reqs?.map((r) => r.id) || []);

        const progressMap: Record<string, Record<string, string>> = {};
        progressData?.forEach((p) => {
          if (!progressMap[p.youth_member_id]) {
            progressMap[p.youth_member_id] = {};
          }
          progressMap[p.youth_member_id][p.requirement_id] = p.status;
        });
        setProgress(progressMap);
      }
    }
    setLoading(false);
  };

  const toggleScout = (id: string) => {
    const newSelected = new Set(selectedScouts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedScouts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedScouts.size === youth.length) {
      setSelectedScouts(new Set());
    } else {
      setSelectedScouts(new Set(youth.map((y: any) => y.id)));
    }
  };

  const markComplete = async (requirementId: string) => {
    if (selectedScouts.size === 0) return;
    setSavingRequirement(requirementId);

    const updates = Array.from(selectedScouts).map((scoutId) => ({
      youth_member_id: scoutId,
      requirement_id: requirementId,
      status: "verified",
      completion_date: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("scout_progress")
      .upsert(updates, { onConflict: "youth_member_id,requirement_id" });

    if (!error) {
      // Refresh progress
      await loadData();
      
      // Check if any scout just completed their rank
      for (const scoutId of Array.from(selectedScouts)) {
        const { data: result } = await supabase.rpc('check_rank_completion', {
          p_youth_id: scoutId,
          p_rank_id: selectedRank?.id
        });
        
        if (result && result[0]?.is_complete) {
          const scout = youth.find((y: any) => y.id === scoutId);
          const name = scout?.preferred_name || scout?.first_name || 'Scout';
          showToast(`🎉 ${name} has completed ${selectedRank?.name}!`, 'success');
        }
      }
    }
    setSavingRequirement(null);
  };

  const checkRankComplete = (scoutId: string): boolean => {
    if (!requirements.length) return false;
    const scoutProgress = progress[scoutId] || {};
    return requirements.every((req) => 
      scoutProgress[req.id] === "verified" || scoutProgress[req.id] === "awarded"
    );
  };

  const getCompletionCount = (scoutId: string): number => {
    const scoutProgress = progress[scoutId] || {};
    return requirements.filter((req) => 
      scoutProgress[req.id] === "verified" || scoutProgress[req.id] === "awarded"
    ).length;
  };

  if (loading && ranks.length > 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.type === 'success' ? <Trophy className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {toast.message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Users className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Advancement Grid</h1>
          <p className="text-slate-500">Mass-entry for patrol/den advancement</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Program</label>
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          >
            <option value="boy">Boy Scouts</option>
            <option value="cub">Cub Scouts</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Patrol / Den</label>
          <select
            value={selectedPatrol}
            onChange={(e) => setSelectedPatrol(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          >
            <option value="">Select a patrol...</option>
            {patrols
              .filter((p) => p.program === selectedProgram)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Rank</label>
          <select
            value={selectedRank?.id || ""}
            onChange={(e) => {
              const rank = ranks.find((r) => r.id === e.target.value);
              setSelectedRank(rank || null);
            }}
            className="px-4 py-2 border border-slate-300 rounded-lg"
          >
            {ranks.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {selectedPatrol && selectedRank && requirements.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedScouts.size === youth.length && youth.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                    Scout
                  </th>
                  {requirements.map((req) => (
                    <th
                      key={req.id}
                      className="px-2 py-3 text-center text-xs font-semibold text-slate-600 whitespace-nowrap"
                    >
                      <div className="w-8">{req.display_order}</div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody>
                {youth.map((y: any) => {
                  const isComplete = checkRankComplete(y.id);
                  const scoutProgress = progress[y.id] || {};
                  return (
                    <tr
                      key={y.id}
                      className={`border-b border-slate-100 ${
                        selectedScouts.has(y.id) ? "bg-emerald-50" : ""
                      } ${isComplete ? "bg-green-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedScouts.has(y.id)}
                          onChange={() => toggleScout(y.id)}
                          className="w-4 h-4 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">
                            {y.preferred_name || y.first_name} {y.last_name}
                          </span>
                          {isComplete && (
                            <Check className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </td>
                      {requirements.map((req) => {
                        const status = scoutProgress[req.id];
                        const isComplete = status === "verified" || status === "awarded";
                        return (
                          <td key={req.id} className="px-2 py-3 text-center">
                            <button
                              onClick={() => !isComplete && markComplete(req.id)}
                              disabled={savingRequirement === req.id || isComplete}
                              className={`w-6 h-6 rounded flex items-center justify-center mx-auto ${
                                isComplete
                                  ? "bg-green-500 text-white"
                                  : "bg-slate-100 hover:bg-slate-200"
                              }`}
                            >
                              {savingRequirement === req.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : isComplete ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-medium">
                          {getCompletionCount(y.id)}/{requirements.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {youth.length === 0 && (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">
                No scouts in this patrol. Add scouts to a unit first.
              </p>
            </div>
          )}

          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 md:hidden">
            Scroll horizontally to see all requirements
          </div>
        </div>
      )}

      {!selectedPatrol && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-amber-700">
            Select a program and patrol to view the advancement grid
          </p>
        </div>
      )}
    </div>
  );
}
