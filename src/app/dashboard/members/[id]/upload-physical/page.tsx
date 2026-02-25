"use client";

import { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  Loader2, X, Camera, File
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const MAX_FILE_SIZE_MB = 10;
const ACCEPTED_TYPES   = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/heic"];
const ACCEPTED_EXTS    = ".pdf,.jpg,.jpeg,.png,.webp,.heic";

type UploadStep = "select" | "preview" | "uploading" | "done" | "error";

export default function UploadPhysicalPage() {
  const { id: youthId } = useParams<{ id: string }>();
  const router          = useRouter();
  const supabase        = createClient();
  const fileInputRef    = useRef<HTMLInputElement>(null);

  const [step,           setStep]           = useState<UploadStep>("select");
  const [file,           setFile]           = useState<File | null>(null);
  const [previewUrl,     setPreviewUrl]     = useState<string | null>(null);
  const [expirationDate, setExpirationDate] = useState("");
  const [notes,          setNotes]          = useState("");
  const [error,          setError]          = useState<string | null>(null);
  const [progress,       setProgress]       = useState(0);
  const [isDragging,     setIsDragging]     = useState(false);

  // ── File selection ────────────────────────────────────────────────────
  function handleFileSelect(selected: File) {
    setError(null);

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setError("Only PDF, JPEG, PNG, or HEIC files are accepted.");
      return;
    }
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setFile(selected);

    // Generate preview URL for images
    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    setStep("preview");
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleFileSelect(f);
  }

  // ── Drag and drop ─────────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Upload to Supabase Storage + insert document record ────────────────
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !youthId) return;

    setStep("uploading");
    setProgress(10);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Build storage path: medicals/{youth_id}/{timestamp}_{filename}
      const timestamp  = Date.now();
      const safeName   = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${youthId}/${timestamp}_${safeName}`;

      setProgress(30);

      // 2. Upload to Supabase Storage (private "medicals" bucket)
      const { error: uploadError } = await supabase.storage
        .from("medicals")
        .upload(storagePath, file, {
          contentType:  file.type,
          cacheControl: "3600",
          upsert:       false,
        });

      if (uploadError) throw new Error(uploadError.message);
      setProgress(70);

      // 3. Compute a simple client-side hash for integrity (SHA-256)
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer  = await crypto.subtle.digest("SHA-256", arrayBuffer);
      const hashArray   = Array.from(new Uint8Array(hashBuffer));
      const fileHash    = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      setProgress(85);

      // 4. Insert document metadata record
      const { error: docError } = await supabase.from("documents").insert({
        youth_id:        youthId,
        type:            "physical",
        status:          "signed",              // Physicals are "signed" upon upload
        title:           `Physical Exam — ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
        file_path:       storagePath,
        file_hash:       fileHash,
        signed_at:       new Date().toISOString(),
        expiration_date: expirationDate || null,
        signed_by:       user.id,
        notes:           notes || null,
      });

      if (docError) throw new Error(docError.message);

      // 5. Update youth_member physical_expiration for dashboard red-flag logic
      if (expirationDate) {
        await supabase
          .from("youth_members")
          .update({ physical_expiration: expirationDate })
          .eq("id", youthId);
      }

      setProgress(100);
      setStep("done");
    } catch (err: any) {
      setError(err.message);
      setStep("error");
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Upload Physical Exam</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload a PDF or photo of the completed physical exam. Files are encrypted and
          only accessible to you and authorized program leaders.
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-forest-600/10
                      border border-forest-600/30 text-forest-400 text-sm">
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>Files are stored in a private, encrypted storage bucket. Only you and program admins can access this document.</p>
      </div>

      {/* ── Step: Select ──────────────────────────────────────────── */}
      {step === "select" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer
            ${isDragging
              ? "border-amber-500 bg-amber-500/10"
              : "border-slate-700 hover:border-slate-500 hover:bg-slate-800/50"}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-6 h-6 text-slate-400" />
          </div>
          <p className="font-semibold text-white mb-1">Drop file here or tap to browse</p>
          <p className="text-slate-500 text-sm mb-4">PDF, JPG, PNG, or HEIC — max {MAX_FILE_SIZE_MB}MB</p>

          <div className="flex gap-3 justify-center">
            <button type="button" className="btn-outline px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <File className="w-3.5 h-3.5" /> Browse files
            </button>
            <button type="button" className="btn-outline px-4 py-2 rounded-lg text-sm flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" /> Take photo
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept={ACCEPTED_EXTS}
            className="hidden" onChange={handleInputChange} />
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30
                        text-red-400 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
          <button onClick={() => { setError(null); setStep("select"); setFile(null); }}
            className="ml-auto flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── Step: Preview + details ───────────────────────────────── */}
      {(step === "preview") && file && (
        <form onSubmit={handleUpload} className="space-y-5">
          {/* File card */}
          <div className="card p-4 flex items-start gap-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Physical preview"
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-slate-700" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-slate-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm truncate">{file.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">
                {(file.size / (1024 * 1024)).toFixed(2)} MB · {file.type.split("/")[1].toUpperCase()}
              </p>
            </div>
            <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); setStep("select"); }}
              className="text-slate-600 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Expiration date */}
          <div>
            <label className="label">
              Physical expiration date
              <span className="text-slate-500 font-normal ml-1">(optional but recommended)</span>
            </label>
            <input type="date" value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              min={new Date().toISOString().slice(0,10)}
              className="input" />
            <p className="text-xs text-slate-600 mt-1">
              If set, you'll receive a reminder 60 days before expiration.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes <span className="text-slate-500 font-normal">(optional)</span></label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dr. Johnson at Pediatric Associates, cleared for all activities"
              rows={3} className="input resize-none" />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => { setFile(null); setPreviewUrl(null); setStep("select"); }}
              className="btn-outline px-5 py-3 rounded-xl">
              Back
            </button>
            <button type="submit" className="btn-gold flex-1 py-3 rounded-xl font-bold
                                              flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" /> Upload Physical
            </button>
          </div>
        </form>
      )}

      {/* ── Step: Uploading ───────────────────────────────────────── */}
      {step === "uploading" && (
        <div className="card p-8 text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-forest-400 mx-auto" />
          <p className="font-semibold text-white">Uploading securely…</p>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-forest-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-500 text-xs">{progress}% complete</p>
        </div>
      )}

      {/* ── Step: Done ────────────────────────────────────────────── */}
      {step === "done" && (
        <div className="card p-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-forest-400 mx-auto" />
          <div>
            <p className="font-bold text-white text-lg mb-1">Physical uploaded!</p>
            <p className="text-slate-400 text-sm">
              The file has been securely stored and the member's profile has been updated.
            </p>
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => router.push("/dashboard")}
              className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold">
              Back to Dashboard
            </button>
            <button onClick={() => { setStep("select"); setFile(null); setPreviewUrl(null); setExpirationDate(""); setNotes(""); }}
              className="btn-ghost px-6 py-3 rounded-xl text-sm">
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
