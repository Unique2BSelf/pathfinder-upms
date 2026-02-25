"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface StaffNotesProps {
  youthId: string;
  initialNotes: string | null;
  isAdmin: boolean;
}

export default function StaffNotes({ youthId, initialNotes, isAdmin }: StaffNotesProps) {
  const supabase = createClient();
  const [notes, setNotes] = useState(initialNotes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isAdmin) return null;

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("youth_members")
      .update({ internal_notes: notes })
      .eq("id", youthId);
    
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-white">Staff Notes</h3>
        <span className="text-xs text-slate-500">Only visible to admins</span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add private notes about this youth member..." 
        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 min-h-[120px]"
      />
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {saved && <span className="text-forest-400">Saved!</span>}
        </span>
        <button
          onClick={saveNotes}
          disabled={saving}
          className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}
