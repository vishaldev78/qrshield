"use client";

import { useEffect, useState } from "react";
import { Camera, ImageUp, Link2, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CameraScanner } from "./CameraScanner";
import { ImageUploader } from "./ImageUploader";
import { URLInput } from "./URLInput";
import { ScanHistory } from "./ScanHistory";
import { useQRShield } from "@/lib/store";

export function ScannerPanel() {
  const [tab, setTab] = useState("camera");
  const hydrateHistory = useQRShield((s) => s.hydrateHistory);

  // Load localStorage history on first mount (client-only, SSR-safe).
  useEffect(() => {
    hydrateHistory();
  }, [hydrateHistory]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Scan a QR Code
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Decode first. Analyze second. Visit last. The destination is never opened automatically.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3" aria-label="Scanning methods">
          <TabsTrigger value="camera" className="gap-1.5 text-[13px] sm:text-sm">
            <Camera className="h-4 w-4" aria-hidden="true" />
            Camera
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-1.5 text-[13px] sm:text-sm">
            <ImageUp className="h-4 w-4" aria-hidden="true" />
            Upload image
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-1.5 text-[13px] sm:text-sm">
            <Link2 className="h-4 w-4" aria-hidden="true" />
            Paste URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="mt-6 focus-visible:outline-none">
          <CameraScanner
            onErrorFallback={(t) => setTab(t === "upload" ? "upload" : "url")}
          />
        </TabsContent>
        <TabsContent value="upload" className="mt-6 focus-visible:outline-none">
          <ImageUploader />
        </TabsContent>
        <TabsContent value="url" className="mt-6 focus-visible:outline-none">
          <URLInput />
        </TabsContent>
      </Tabs>

      <div className="mt-8 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-4 py-3 text-xs text-emerald-300/90">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Privacy-first analysis — QR images are processed locally in your browser.
      </div>

      <div className="mt-8">
        <ScanHistory />
      </div>
    </div>
  );
}
