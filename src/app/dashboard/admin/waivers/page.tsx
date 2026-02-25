"use client";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, FileText, Send, Trash2 } from "lucide-react";

export default function WaiversPage() {
  const supabase = createClient();
  const [templates, setTemplates] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("document_templates").select("*").order("name"),
      supabase.from("documents").select("*, youth:youth_members(first_name, last_name)").order("created_at", { ascending: false }).limit(50),
    ]).then(([t, d]) => {
      setTemplates(t.data || []);
      setDocuments(d.data || []);
    });
  }, [supabase]);

  const uploadTemplate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload("templates/" + Date.now() + "_" + file.name, file);
    if (uploadError) { alert("Upload failed: " + uploadError.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(uploadData.path);
    const { error: insertError } = await supabase.from("document_templates").insert({ name: file.name.replace(/\.[^/.]+$/, ""), file_path: publicUrl, is_required_globally: false });
    if (insertError) { alert("Failed: " + insertError.message); } else { const { data } = await supabase.from("document_templates").select("*").order("name"); setTemplates(data || []); }
    setUploading(false);
  };

  const pushToAll = async (templateId: string) => {
    const { data: youth } = await supabase.from("youth_members").select("id");
    if (!youth?.length) return;
    const docs = youth.map(y => ({ template_id: templateId, youth_id: y.id, type: "waiver", status: "pending" }));
    const { error } = await supabase.from("documents").insert(docs);
    if (error) alert("Failed: " + error.message); else alert("Pushed to " + youth.length + " members!");
  };

  const deleteTemplate = async (id: string) => { if (!confirm("Delete?")) return; await supabase.from("document_templates").delete().eq("id", id); setTemplates(templates.filter(t => t.id !== id)); };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-white">Waiver Management</h1><p className="text-slate-400">Upload templates and push to members</p></div>
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upload Template</h2>
        <div className="flex items-center gap-4">
          <input type="file" accept=".pdf,.doc,.docx" ref={fileRef} onChange={uploadTemplate} className="hidden" />
          <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg disabled:opacity-50">
            <Upload className="w-4 h-4" />{uploading ? "Uploading..." : "Upload PDF"}
          </button>
        </div>
      </div>
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Templates</h2>
        {templates.length === 0 ? <p className="text-slate-500">No templates</p> : (
          <div className="space-y-3">
            {templates.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                <div className="flex items-center gap-3"><FileText className="w-5 h-5 text-amber-400" /><div><p className="text-white font-medium">{t.name}</p></div></div>
                <div className="flex gap-2">
                  <button onClick={() => pushToAll(t.id)} className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm"><Send className="w-3 h-3" />Push</button>
                  <button onClick={() => deleteTemplate(t.id)} className="p-2 hover:bg-slate-600 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Recent Waivers</h2>
        <div className="space-y-2">
          {documents.map(d => (
            <div key={d.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
              <div><p className="text-white">{d.youth?.first_name} {d.youth?.last_name}</p><p className="text-xs text-slate-500">{new Date(d.created_at).toLocaleDateString()}</p></div>
              <span className={`px-2 py-1 rounded text-xs ${d.status === "signed" ? "bg-green-600 text-white" : d.status === "pending" ? "bg-yellow-600 text-white" : "bg-slate-600 text-slate-300"}`}>{d.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
