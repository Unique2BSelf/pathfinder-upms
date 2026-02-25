"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Plus, Trash2, FileText, Users } from "lucide-react";

interface RegistrationField {
  id: string;
  name: string;
  label: string;
  field_type: string;
  required: boolean;
  options: string;
  sort_order: number;
}

interface ProgramWaiver {
  program_id: string;
  template_id: string;
}

export default function RegistrationConfigPage() {
  const supabase = createClient();
  const [fields, setFields] = useState<RegistrationField[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [newField, setNewField] = useState({ name: "", label: "", field_type: "text", required: false, options: "" });
  const [waivers, setWaivers] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      supabase.from("registration_fields").select("*").order("sort_order"),
      supabase.from("programs").select("*"),
      supabase.from("document_templates").select("*"),
      supabase.from("program_waivers").select("*"),
    ]).then(([f, p, t, w]) => {
      setFields(f.data || []);
      setPrograms(p.data || []);
      setTemplates(t.data || []);
      const waiverMap: Record<string, string> = {};
      (w.data || []).forEach((wr: any) => { waiverMap[wr.program_id] = wr.template_id; });
      setWaivers(waiverMap);
    });
  }, [supabase]);

  const saveWaiver = async (programId: string, templateId: string) => {
    await supabase.from("program_waivers").upsert({ program_id: programId, template_id: templateId }, { onConflict: "program_id" });
    setWaivers({ ...waivers, [programId]: templateId });
    alert("Saved!");
  };

  const addField = async () => {
    if (!newField.name || !newField.label) return;
    const maxOrder = Math.max(0, ...fields.map(f => f.sort_order));
    const { data, error } = await supabase.from("registration_fields").insert({
      ...newField, sort_order: maxOrder + 1, options: newField.options || null
    }).select().single();
    if (!error && data) setFields([...fields, { ...data, required: newField.required }]);
    setNewField({ name: "", label: "", field_type: "text", required: false, options: "" });
  };

  const deleteField = async (id: string) => {
    if (!confirm("Delete this field?")) return;
    await supabase.from("registration_fields").delete().eq("id", id);
    setFields(fields.filter(f => f.id !== id));
  };

  const toggleRequired = async (field: RegistrationField) => {
    const required = !field.required;
    await supabase.from("registration_fields").update({ required }).eq("id", field.id);
    setFields(fields.map(f => f.id === field.id ? { ...f, required } : f));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Registration Configuration</h1>
        <p className="text-slate-400">Manage registration fields and program waivers</p>
      </div>

      {/* Program Waivers */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Program Waivers
        </h2>
        <p className="text-slate-400 text-sm mb-4">Assign waiver templates to auto-push when youth join a program</p>
        <div className="space-y-4">
          {programs.map(p => (
            <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-700 rounded-lg">
              <div className="flex-1"><span className="text-white font-medium">{p.name}</span></div>
              <select
                value={waivers[p.id] || ""}
                onChange={e => saveWaiver(p.id, e.target.value)}
                className="px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-sm"
              >
                <option value="">No waiver required</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Fields */}
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" /> Registration Fields
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
          <input placeholder="Field name" value={newField.name} onChange={e => setNewField({...newField, name: e.target.value})} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
          <input placeholder="Label" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
          <select value={newField.field_type} onChange={e => setNewField({...newField, field_type: e.target.value})} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm">
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="select">Dropdown</option>
          </select>
          <input placeholder="Options (comma)" value={newField.options} onChange={e => setNewField({...newField, options: e.target.value})} className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm" />
          <button onClick={addField} className="px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg text-sm flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {fields.map(f => (
            <div key={f.id} className="flex items-center gap-4 p-3 bg-slate-700 rounded-lg">
              <div className="flex-1"><span className="text-white">{f.label}</span><span className="text-slate-500 text-sm ml-2">({f.name})</span></div>
              <span className="text-xs text-slate-500">{f.field_type}</span>
              <button onClick={() => toggleRequired(f)} className={`px-2 py-1 rounded text-xs ${f.required ? "bg-red-600" : "bg-slate-600"} text-white`}>
                {f.required ? "Required" : "Optional"}
              </button>
              <button onClick={() => deleteField(f.id)} className="p-1 hover:bg-slate-600 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
            </div>
          ))}
          {fields.length === 0 && <p className="text-slate-500 text-sm">No custom fields added yet</p>}
        </div>
      </div>
    </div>
  );
}
