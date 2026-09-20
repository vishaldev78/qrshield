"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Loader2, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CameraScanner as CameraScannerEngine, type CameraError } from "@/lib/qr/camera";
import { useQRShield } from "@/lib/store";

type Phase = "idle" | "starting" | "scanning" | "error";

export function CameraScanner({ onErrorFallback }: { onErrorFallback: (errType: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<CameraScannerEngine | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<CameraError | null>(null);
  const analyzeAndShow = useQRShield((s) => s.analyzeAndShow);

  const handleDetect = useCallback(
    (text: string) => {
      setPhase("idle");
      const ok = analyzeAndShow(text, "camera");
      if (!ok) {
        // QR decoded but content wasn't a parsable destination — show it safely.
        useQRShield.getState().showContentResult({ kind: "invalid", content: text });
      }
    },
    [analyzeAndShow]
  );

  const handleError = useCallback((err: CameraError) => {
    setPhase("error");
    setError(err);
  }, []);

  const start = useCallback(async () => {
    if (!videoRef.current) return;
    setPhase("starting");
    setError(null);
    engineRef.current = new CameraScannerEngine();
    await engineRef.current.start(videoRef.current, handleDetect, handleError);
    // engine sets phase via callbacks only on failure; assume live now:
    setPhase((p) => (p === "starting" ? "scanning" : p));
  }, [handleDetect, handleError]);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    engineRef.current = null;
    setPhase("idle");
  }, []);

  // Cleanup on unmount / view switch — never keep a camera running.
  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  const live = phase === "scanning" || phase === "starting";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto aspect-[4/3] w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-black/40">
        <video
          ref={videoRef}
          className={`h-full w-full object-cover ${live ? "opacity-100" : "opacity-0"}`}
          muted
          playsInline
          aria-label="Live camera preview for QR scanning"
        />

        {/* Corner brackets */}
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity ${live ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        >
          {["top-4 left-4 border-t-2 border-l-2 rounded-tl-lg", "top-4 right-4 border-t-2 border-r-2 rounded-tr-lg", "bottom-4 left-4 border-b-2 border-l-2 rounded-bl-lg", "bottom-4 right-4 border-b-2 border-r-2 rounded-br-lg"].map(
            (cls) => (
              <span key={cls} className={`absolute h-10 w-10 border-primary/90 ${cls}`} />
            )
          )}
          <div className="absolute inset-x-10 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden rounded-full">
            <div className="scanline h-full w-full bg-gradient-to-r from-transparent via-primary to-transparent" />
          </div>
        </div>

        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
              <Camera className="h-7 w-7 text-primary" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">Camera is off</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Video is processed on your device only — nothing is recorded or uploaded.
              </p>
            </div>
            <Button onClick={start} className="gap-2">
              <Camera className="h-4 w-4" aria-hidden="true" />
              Start camera
            </Button>
          </div>
        )}

        {phase === "starting" && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Starting camera…
          </div>
        )}

        {phase === "error" && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 p-6 text-center">
            <CameraOff className="h-8 w-8 text-amber-400" aria-hidden="true" />
            <p className="max-w-xs text-[13px] leading-relaxed text-muted-foreground" role="alert">
              {error.message}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {error.type !== "unsupported" && (
                <Button size="sm" variant="outline" onClick={start}>
                  Try again
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => onErrorFallback("upload")}>
                Upload image
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onErrorFallback("url")}>
                Paste URL
              </Button>
            </div>
          </div>
        )}
      </div>

      {live && (
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <ScanLine className="h-4 w-4 animate-pulse text-primary" aria-hidden="true" />
            Point your camera at a QR code
            <span className="sr-only">Scanning is active. Detected content is analyzed locally.</span>
          </p>
          <Button size="sm" variant="outline" onClick={stop} className="shrink-0 gap-1.5">
            <CameraOff className="h-3.5 w-3.5" aria-hidden="true" />
            Stop
          </Button>
        </div>
      )}
    </div>
  );
}
