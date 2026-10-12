"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw, X, Zap, ZapOff, Upload, AlertCircle } from "lucide-react";
import { Locale } from "@/lib/i18n";

interface CameraViewfinderProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
  onSelectFileFallback: () => void;
  locale: Locale;
}

export function CameraViewfinder({
  isOpen,
  onClose,
  onCapture,
  onSelectFileFallback,
  locale,
}: CameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Stop camera tracks helper
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn("Error stopping track:", e);
        }
      });
      streamRef.current = null;
    }
  }, []);

  // Start camera stream
  const startCamera = useCallback(async (mode: "environment" | "user") => {
    stopStream();
    setIsInitializing(true);
    setErrorMessage(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setHasPermission(false);
      setErrorMessage(
        locale === "hi"
          ? "आपके ब्राउज़र में कैमरा समर्थित नहीं है। कृपया फ़ाइल चुनें।"
          : "Camera not supported in this browser. Please upload an image file."
      );
      setIsInitializing(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setHasPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.warn("Video play error:", err));
      }

      // Check if torch/flashlight is supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities?.() as any) || {};
        setHasTorch(Boolean(capabilities.torch));
      }

      setIsInitializing(false);
    } catch (err: any) {
      console.warn("Camera access error:", err);
      setIsInitializing(false);
      setHasPermission(false);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setErrorMessage(
          locale === "hi"
            ? "कैमरे की अनुमति अस्वीकृत की गई। कृपया ब्राउज़र सेटिंग्स में कैमरा चालू करें या फ़ाइल से अपलोड करें।"
            : "Camera permission denied. Please allow camera access in your browser settings, or upload a photo."
        );
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setErrorMessage(
          locale === "hi"
            ? "डिवाइस पर कोई कैमरा नहीं मिला। कृपया फ़ोटो अपलोड करें।"
            : "No camera found on this device. Please upload a photo from files."
        );
      } else {
        setErrorMessage(
          locale === "hi"
            ? "कैमरा शुरू करने में समस्या आई। कृपया फ़ाइल अपलोड का उपयोग करें।"
            : "Unable to start camera stream. Please use photo upload."
        );
      }
    }
  }, [stopStream, locale]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn("Torch toggle error:", e);
      }
    }
  };

  // Flip camera between front and back
  const flipCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture current video frame to Blob
  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Stop stream right after capture
    stopStream();

    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  // Manage camera lifecycle based on isOpen
  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopStream();
    }
    return () => {
      stopStream();
    };
  }, [isOpen, startCamera, stopStream, facingMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between items-center animate-fadeIn select-none">
      {/* Top Controls Bar */}
      <div className="w-full max-w-md px-4 py-4 flex items-center justify-between z-20">
        <button
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="tap-target p-2.5 rounded-full bg-navy-900/80 hover:bg-navy-800 text-white border border-white/20 transition flex items-center justify-center"
          aria-label="Close Camera"
        >
          <X className="w-6 h-6" />
        </button>

        <span className="text-xs font-semibold text-sky-300 tracking-wide bg-navy-900/80 px-3 py-1.5 rounded-full border border-sky-500/30">
          {locale === "hi" ? "दवा स्कैनर" : "Medicine Scanner"}
        </span>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              onClick={toggleTorch}
              className={`tap-target p-2.5 rounded-full border transition flex items-center justify-center ${
                torchOn
                  ? "bg-amber-400 text-black border-amber-300"
                  : "bg-navy-900/80 text-white border-white/20 hover:bg-navy-800"
              }`}
              aria-label="Toggle Flashlight"
            >
              {torchOn ? <Zap className="w-5 h-5 fill-current" /> : <ZapOff className="w-5 h-5" />}
            </button>
          )}

          <button
            onClick={flipCamera}
            className="tap-target p-2.5 rounded-full bg-navy-900/80 hover:bg-navy-800 text-white border border-white/20 transition flex items-center justify-center"
            aria-label="Switch Camera"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Viewfinder Center Area */}
      <div className="relative w-full max-w-md flex-1 flex items-center justify-center overflow-hidden px-4">
        {/* Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover rounded-3xl ${
            isInitializing || !hasPermission ? "opacity-0" : "opacity-100"
          } transition-opacity duration-300`}
        />

        {/* Loading Spinner */}
        {isInitializing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sky-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p className="text-xs font-medium text-slate-300">
              {locale === "hi" ? "कैमरा शुरू हो रहा है..." : "Initializing camera..."}
            </p>
          </div>
        )}

        {/* Permission Denied / Error State */}
        {!isInitializing && hasPermission === false && (
          <div className="absolute inset-x-6 p-6 rounded-2xl bg-navy-900/90 border border-red-500/40 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-950 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-medium">
              {errorMessage}
            </p>
            <button
              onClick={() => {
                stopStream();
                onClose();
                onSelectFileFallback();
              }}
              className="tap-target w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow"
            >
              <Upload className="w-4 h-4" />
              <span>{locale === "hi" ? "गैलरी / फ़ाइल से चुनें" : "Select from Files / Gallery"}</span>
            </button>
          </div>
        )}

        {/* Viewfinder Reticle Overlay (Only when camera active) */}
        {!isInitializing && hasPermission && (
          <div className="absolute inset-8 sm:inset-10 pointer-events-none flex flex-col justify-between">
            {/* Corner Bracket Guides */}
            <div className="flex justify-between">
              <div className="w-8 h-8 border-t-4 border-l-4 border-sky-400 rounded-tl-lg shadow-[0_0_8px_#38bdf8]" />
              <div className="w-8 h-8 border-t-4 border-r-4 border-sky-400 rounded-tr-lg shadow-[0_0_8px_#38bdf8]" />
            </div>

            {/* Sweeping Laser Beam */}
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-pulse my-auto" />

            <div className="flex justify-between">
              <div className="w-8 h-8 border-b-4 border-l-4 border-sky-400 rounded-bl-lg shadow-[0_0_8px_#38bdf8]" />
              <div className="w-8 h-8 border-b-4 border-r-4 border-sky-400 rounded-br-lg shadow-[0_0_8px_#38bdf8]" />
            </div>
          </div>
        )}

        {/* Helper Guidance Text */}
        {!isInitializing && hasPermission && (
          <div className="absolute bottom-6 inset-x-6 text-center pointer-events-none">
            <span className="text-[12px] font-medium text-white/90 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 shadow">
              {locale === "hi"
                ? "स्ट्रिप, सिरप बोतल या पैक के बैच व नाम को बॉक्स के अंदर रखें"
                : "Align medicine name, batch number & expiry inside frame"}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Shutter & Upload Bar */}
      <div className="w-full max-w-md px-6 py-6 flex items-center justify-around z-20">
        {/* Upload Fallback Button */}
        <button
          onClick={() => {
            stopStream();
            onClose();
            onSelectFileFallback();
          }}
          className="tap-target flex flex-col items-center gap-1 text-slate-300 hover:text-white transition p-2"
          aria-label="Upload from files"
        >
          <Upload className="w-6 h-6" />
          <span className="text-[10px] font-medium">
            {locale === "hi" ? "गैलरी" : "Gallery"}
          </span>
        </button>

        {/* Big Shutter Button */}
        <button
          onClick={handleCapture}
          disabled={!hasPermission || isInitializing}
          className="tap-target w-20 h-20 rounded-full border-4 border-white/80 p-1 bg-transparent hover:scale-105 active:scale-95 transition flex items-center justify-center disabled:opacity-40"
          aria-label="Capture Photo"
        >
          <div className="w-full h-full rounded-full bg-white shadow-lg shadow-white/30 flex items-center justify-center">
            <Camera className="w-8 h-8 text-navy-950" />
          </div>
        </button>

        {/* Spacer / Re-center balance */}
        <div className="w-12" />
      </div>
    </div>
  );
}

