"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";
import { Upload, X, ImageIcon, CheckCircle2 } from "lucide-react";
import AppLogo from "@/components/AppLogo";

interface LogoDropzoneProps {
  /** Current logo URL/base64 */
  logoUrl?: string;
  /** Whether to render accent background behind preview */
  showBackground?: boolean;
  /** Fallback letter when no logo */
  fallbackLetter?: string;
  /** Called with compressed webp base64 when a valid image is dropped/selected */
  onLogoChange: (base64: string) => void;
  /** Called when user clicks "Hapus logo" */
  onLogoClear: () => void;
}

/** Max dimension (px) for the compressed output */
const MAX_DIM = 500;
/** Accepted MIME types */
const ACCEPTED = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.type === "image/svg+xml") {
      // SVG: read as text → data URL, no canvas needed
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX_DIM) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
        else if (h > MAX_DIM) { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/webp", 0.85));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function LogoDropzone({
  logoUrl,
  showBackground = false,
  fallbackLetter = "N",
  onLogoChange,
  onLogoClear,
}: LogoDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragInvalid, setIsDragInvalid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [justUploaded, setJustUploaded] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setErrorMsg(null);
    if (!ACCEPTED.includes(file.type)) {
      setErrorMsg("Format tidak didukung. Gunakan PNG, JPG, WebP, GIF, atau SVG.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal 5 MB.");
      return;
    }
    setIsProcessing(true);
    try {
      const compressed = await compressImage(file);
      onLogoChange(compressed);
      setJustUploaded(true);
      setTimeout(() => setJustUploaded(false), 2000);
    } catch {
      setErrorMsg("Gagal memproses gambar. Coba file lain.");
    } finally {
      setIsProcessing(false);
    }
  }, [onLogoChange]);

  /* ── Drag handlers ── */
  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    const hasImage = Array.from(e.dataTransfer.items).some(
      (item) => item.kind === "file" && item.type.startsWith("image/")
    );
    setIsDragOver(true);
    setIsDragInvalid(!hasImage);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const onDragLeave = (e: DragEvent) => {
    // Only clear when leaving the drop zone entirely (not a child)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      setIsDragInvalid(false);
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setIsDragInvalid(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  /* ── Input handler ── */
  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  /* ── Border & overlay style based on state ── */
  const borderColor = isDragInvalid
    ? "border-red-500"
    : isDragOver
    ? "border-accent"
    : justUploaded
    ? "border-green-500"
    : "border-border hover:border-accent/60";

  const overlayBg = isDragInvalid
    ? "bg-red-500/10"
    : isDragOver
    ? "bg-accent/10"
    : "";

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        Logo Aplikasi
      </label>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload logo — klik atau seret gambar ke sini"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer",
          "flex flex-col items-center justify-center gap-3 p-6 select-none outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
          borderColor,
          overlayBg,
        ].join(" ")}
        style={{ minHeight: 200 }}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={onFileChange}
          tabIndex={-1}
        />

        {/* States */}
        {isProcessing ? (
          /* Processing spinner */
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-text-muted">Memproses gambar…</span>
          </div>

        ) : isDragOver ? (
          /* Drag-over overlay */
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            {isDragInvalid ? (
              <>
                <X className="w-10 h-10 text-red-400 animate-bounce" />
                <span className="text-sm font-medium text-red-400">Bukan file gambar</span>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-accent animate-bounce" />
                <span className="text-sm font-medium text-accent">Lepaskan untuk upload</span>
              </>
            )}
          </div>

        ) : justUploaded ? (
          /* Success flash */
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
            <span className="text-sm font-medium text-green-500">Logo berhasil diupload!</span>
          </div>

        ) : (
          /* Default idle state */
          <>
            {/* Logo preview */}
            <AppLogo
              logoUrl={logoUrl}
              showBackground={showBackground}
              fallbackLetter={fallbackLetter}
              size={20}
              className="pointer-events-none"
            />

            {/* Hint text */}
            <div className="flex flex-col items-center gap-1 pointer-events-none">
              <div className="flex items-center gap-1.5 text-text-muted text-xs font-medium">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Seret & lepas logo, atau klik untuk memilih file</span>
              </div>
              <span className="text-text-muted/60 text-[11px] text-center leading-relaxed">
                PNG transparan direkomendasikan · Maks 5 MB<br />
                Auto-compress ke WebP 500×500 px
              </span>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {errorMsg && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <X className="w-3.5 h-3.5 shrink-0" />
          {errorMsg}
        </p>
      )}

      {/* Clear button */}
      {logoUrl && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onLogoClear(); }}
          className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Hapus logo
        </button>
      )}
    </div>
  );
}
