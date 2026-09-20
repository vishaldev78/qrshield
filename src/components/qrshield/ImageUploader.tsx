"use client";

import { useCallback, useRef, useState } from "react";
import { ImageUp, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { decodeQrFromFile } from "@/lib/qr/decodeImage";
import { useQRShield } from "@/lib/store";

type Phase = "idle" | "decoding" | "error";

export function ImageUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const analyzeAndShow = useQRShield((s) => s.analyzeAndShow);
  const showContentResult = useQRShield((s) => s.showContentResult);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setPhase("error");
        return;
      }
      setPhase("decoding");
      // Local preview only — the data URL never leaves the browser.
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);

      try {
        const text = await decodeQrFromFile(file);
        if (text) {
          const ok = analyzeAndShow(text, "upload");
          if (!ok) showContentResult({ kind: "invalid", content: text });
        } else {
          setPhase("error");
        }
      } catch {
        setPhase("error");
      }
    },
    [analyzeAndShow, showContentResult]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void processFile(file);
    },
    [processFile]
  );

  const reset = () => {
    setPhase("idle");
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a QR code image"
        onClick={() => phase !== "decoding" && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`relative flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          dragOver
            ? "border-primary bg-primary/10"
            : "border-border/70 bg-card/40 hover:border-primary/50 hover:bg-card/70"
        }`}
      >
        {preview && (
          // Local preview thumbnail — never uploaded anywhere.
           
          <img
            src={preview}
            alt="Uploaded QR code preview (processed locally)"
            className="absolute inset-0 h-full w-full rounded-xl object-contain p-4 opacity-25"
          />
        )}

        {phase === "decoding" ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">Decoding QR locally…</p>
          </>
        ) : phase === "error" ? (
          <>
            <div className="relative z-10 flex flex-col items-center gap-3">
              <p className="text-sm font-semibold text-foreground">
                We couldn&apos;t detect a QR code.
              </p>
              <ul className="text-xs leading-relaxed text-muted-foreground">
                <li>• Check the lighting and contrast</li>
                <li>• Use a larger or sharper image</li>
                <li>• Make sure the whole code is visible</li>
              </ul>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); reset(); }} className="gap-1.5">
                <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Try again
              </Button>
            </div>
          </>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
              <ImageUp className="h-6 w-6 text-primary" aria-hidden="true" />
            </span>
            <p className="text-sm font-medium text-foreground">
              Drag &amp; drop a QR image, or <span className="text-primary underline underline-offset-2">choose image</span>
            </p>
            <p className="text-xs text-muted-foreground">PNG · JPG · WEBP</p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/webp"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void processFile(file);
          }}
        />
      </div>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
        Image processed locally in your browser — it is never uploaded to a server.
      </p>
    </div>
  );
}
