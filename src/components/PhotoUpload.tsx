"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, Loader2, User } from "lucide-react";

interface PhotoUploadProps {
  youthId: string;
  currentPhotoUrl: string | null;
  onUpload: (url: string) => void;
}

export default function PhotoUpload({ youthId, currentPhotoUrl, onUpload }: PhotoUploadProps) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    
    setUploading(true);
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${youthId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from("public-assets")
      .upload(fileName, file, { upsert: true });
    
    if (error) {
      alert("Upload failed: " + error.message);
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from("public-assets")
      .getPublicUrl(data.path);
    
    onUpload(publicUrl);
    setUploading(false);
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-700 flex items-center justify-center">
        {currentPhotoUrl ? (
          <img src={currentPhotoUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <User className="w-8 h-8 text-slate-500" />
        )}
      </div>
      <div>
        <input
          type="file"
          accept="image/*"
          ref={fileRef}
          onChange={handleUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Uploading..." : "Upload Photo"}
        </button>
        <p className="text-xs text-slate-500 mt-1">JPG, PNG up to 5MB</p>
      </div>
    </div>
  );
}
