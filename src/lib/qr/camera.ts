/**
 * QRShield — Live camera scanner.
 * getUserMedia + periodic frame capture → jsQR. Everything stays on-device.
 * Clean start/stop lifecycle with typed error reporting for the UI flows.
 */

import jsQR from "jsqr";

export type CameraError =
  | { type: "unsupported"; message: string }
  | { type: "denied"; message: string }
  | { type: "not-found"; message: string }
  | { type: "failed"; message: string };

type DetectCallback = (text: string) => void;
type ErrorCallback = (err: CameraError) => void;

const SCAN_INTERVAL_MS = 180;

export class CameraScanner {
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private video: HTMLVideoElement | null = null;
  private stopped = false;

  async start(
    video: HTMLVideoElement,
    onDetect: DetectCallback,
    onError: ErrorCallback
  ): Promise<void> {
    this.video = video;
    this.stopped = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      onError({
        type: "unsupported",
        message:
          "Camera access is not available in this browser or context (it requires a secure connection). You can still scan a QR image instead.",
      });
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (err) {
      const e = err as DOMException;
      if (e?.name === "NotAllowedError" || e?.name === "SecurityError") {
        onError({
          type: "denied",
          message:
            "Camera permission is unavailable. You can still analyze a QR image or paste a URL instead.",
        });
      } else if (e?.name === "NotFoundError" || e?.name === "OverconstrainedError") {
        onError({
          type: "not-found",
          message: "No usable camera was found on this device. Try uploading a QR image instead.",
        });
      } else {
        onError({
          type: "failed",
          message: "The camera could not be started. Try uploading a QR image instead.",
        });
      }
      return;
    }

    video.srcObject = this.stream;
    video.setAttribute("playsinline", "true");
    try {
      await video.play();
    } catch {
      // Autoplay can reject until user gesture; the stream is still live.
    }

    this.canvas = document.createElement("canvas");
    this.timer = setInterval(() => this.tick(onDetect), SCAN_INTERVAL_MS);
  }

  private tick(onDetect: DetectCallback): void {
    if (this.stopped || !this.video || !this.canvas) return;
    const video = this.video;
    if (video.readyState < video.HAVE_ENOUGH_DATA) return;

    const w = 480;
    const h = Math.max(
      1,
      Math.round((video.videoHeight || 360) * (w / (video.videoWidth || 640)))
    );
    this.canvas.width = w;
    this.canvas.height = h;
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const code = jsQR(imageData.data, w, h, { inversionAttempts: "attemptBoth" });
    if (code?.data) {
      this.stop();
      onDetect(code.data);
    }
  }

  stop(): void {
    this.stopped = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.stream) {
      for (const track of this.stream.getTracks()) track.stop();
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video = null;
    }
    this.canvas = null;
  }
}
