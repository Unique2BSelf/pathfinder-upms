"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Check, Eraser, Loader2 } from "lucide-react";

export default function SignDocumentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [document, setDocument] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [signed, setSigned] = useState(false);

  useEffect(() => {
    supabase.from("documents").select("*, youth:youth_members(first_name, last_name)").eq("id", params.id).single()
      .then(({ data }) => setDocument(data));
    const canvas = canvasRef.current;
    if (canvas) { const ctx = canvas.getContext("2d"); if (ctx) { ctx.strokeStyle = "#000"; ctx.lineWidth = 2; ctx.lineCap = "round"; } }
  }, [params.id, supabase]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y); ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearSignature = () => { const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext("2d"); if (!ctx) return; ctx.clearRect(0, 0, canvas.width, canvas.height); };

  const submitSignature = async () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (dataUrl.includes("iVBORw0KGgo")) { alert("Please sign first"); return; }
    setSaving(true);
    const { error } = await supabase.from("documents").update({ status: "signed", signature_data: dataUrl, signed_at: new Date().toISOString() }).eq("id", params.id);
    if (error) { alert("Failed: " + error.message); setSaving(false); return; }
    setSigned(true);
    setTimeout(() => router.push("/dashboard/documents"), 2000);
  };

  if (!document) return <div className="p-8 text-center text-slate-400">Loading...</div>;
  if (document.status === "signed") return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8"><div className="text-center"><div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-10 h-10 text-white" /></div><h1 className="text-2xl font-bold text-white">Already Signed</h1></div></div>;
  if (signed) return <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8"><div className="text-center"><div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><Check className="w-10 h-10 text-white" /></div><h1 className="text-2xl font-bold text-white">Signed!</h1></div></div>;

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div><h1 className="text-2xl font-bold text-white">Sign Document</h1><p className="text-slate-400">{document.title || "Waiver"} for {document.youth?.first_name} {document.youth?.last_name}</p></div>
        <div className="bg-slate-800 rounded-xl p-6">
          <p className="text-slate-300 mb-4">By signing below, I acknowledge that I have read and agree to the terms of this document.</p>
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-4">
            <p className="text-sm text-slate-500 mb-2">Sign here:</p>
            <canvas ref={canvasRef} width={400} height={150} className="bg-white rounded cursor-cross touch-none" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
          </div>
          <div className="flex justify-between mt-4">
            <button onClick={clearSignature} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"><Eraser className="w-4 h-4" />Clear</button>
            <button onClick={submitSignature} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-forest-600 hover:bg-forest-500 text-white rounded-lg disabled:opacity-50">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}{saving ? "Signing..." : "Sign & Submit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
