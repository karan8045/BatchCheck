"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DICTIONARY,
  Locale,
  MatchedRecord,
  DataSourceItem,
  getResultText,
} from "@/lib/i18n";
import { compressImage } from "@/lib/image-compress";
import { createSpeechController } from "@/lib/speech";
import { use3DCapabilities } from "@/lib/use-capabilities";
import { DynamicHeroScene, DynamicResultScene, DynamicAboutScene } from "@/components/3d/Dynamic3D";
import { Static2DFallback } from "@/components/3d/Static2DFallback";
import { CameraViewfinder } from "@/components/CameraViewfinder";
import {
  Camera,
  Keyboard,
  Sparkles,
  Volume2,
  VolumeX,
  AlertTriangle,
  Clock,
  Search,
  ChevronLeft,
  ExternalLink,
  ShieldAlert,
  Info,
  RefreshCw,
  FileCheck2,
  Pill,
  BookmarkCheck,
} from "lucide-react";

type Screen = "home" | "confirm" | "result" | "about";

export default function BatchCheckApp() {
  // Locale State (persisted in localStorage)
  const [locale, setLocale] = useState<Locale>("en");
  const t = DICTIONARY[locale];

  // Screen State
  const [screen, setScreen] = useState<Screen>("home");

  // Capabilities & 3D Lite Mode
  const { is3DEnabled, isLiteMode, toggleLiteMode } = use3DCapabilities();

  // Form Fields State
  const [drugName, setDrugName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryRaw, setExpiryRaw] = useState("");

  // Worldwide Pharmacopeia Insights State
  const [activeIngredients, setActiveIngredients] = useState("");
  const [drugCategory, setDrugCategory] = useState("");
  const [packagingType, setPackagingType] = useState("");
  const [usageSummary, setUsageSummary] = useState("");

  // Loading, Camera & Error States
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Result State
  const [resultStatus, setResultStatus] = useState<"flagged" | "expired" | "no_match">("no_match");
  const [resultConfidence, setResultConfidence] = useState<"low" | "high">("high");
  const [isAlsoExpired, setIsAlsoExpired] = useState(false);
  const [matchedRows, setMatchedRows] = useState<MatchedRecord[]>([]);
  const [listsCheckedNames, setListsCheckedNames] = useState("");
  const [latestMonthYear, setLatestMonthYear] = useState("");
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);

  // Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const speechRef = useRef(createSpeechController());

  // File Input Ref for gallery upload fallback
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initialize Locale from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("batchcheck_lang") as Locale | null;
      if (stored === "en" || stored === "hi") {
        setLocale(stored);
      }
    } catch {
      // localStorage may be disabled
    }
  }, []);

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    try {
      localStorage.setItem("batchcheck_lang", newLocale);
    } catch {
      // ignore
    }
  };

  // 2. Fetch Data Sources for About Screen
  useEffect(() => {
    fetch("/api/sources")
      .then((res) => res.json())
      .then((data) => {
        if (data.sources) {
          setDataSources(data.sources);
        }
      })
      .catch((err) => console.warn("Could not fetch data sources:", err));
  }, []);

  // 3. Auto-speak when landing on Result Screen
  useEffect(() => {
    if (screen === "result") {
      const { speechText } = getResultText(locale, {
        status: resultStatus,
        confidence: resultConfidence,
        isAlsoExpired,
        listsCheckedNames,
        latestMonthYear,
      });

      // Small delay to allow page render
      const timer = setTimeout(() => {
        handleSpeak(speechText);
      }, 350);

      return () => {
        clearTimeout(timer);
        speechRef.current.stop();
        setIsSpeaking(false);
      };
    } else {
      speechRef.current.stop();
      setIsSpeaking(false);
    }
  }, [screen, resultStatus, resultConfidence, isAlsoExpired, locale]);

  // Speech Handler
  const handleSpeak = (text?: string) => {
    const textToSpeak =
      text ||
      getResultText(locale, {
        status: resultStatus,
        confidence: resultConfidence,
        isAlsoExpired,
        listsCheckedNames,
        latestMonthYear,
      }).speechText;

    if (isSpeaking) {
      speechRef.current.stop();
      setIsSpeaking(false);
      return;
    }

    setSpeechError(null);
    const started = speechRef.current.speak(textToSpeak, locale, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        setSpeechError(t.result.voiceUnavailable);
      },
    });

    if (!started) {
      setSpeechError(t.result.voiceUnavailable);
    }
  };

  // Shared OCR & Medicine Analysis Pipeline
  const processMedicineImage = async (blob: Blob) => {
    try {
      setIsScanning(true);
      setScanNotice(null);

      // Client-side canvas compression (max 1280px, quality 0.8)
      const file = new File([blob], "medicine_scan.jpg", { type: "image/jpeg" });
      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressedBlob, "medicine_scan.jpg");

      const response = await fetch("/api/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.error) {
        setScanNotice(t.confirm.manualFallbackNotice);
      }

      // Populate extracted OCR values
      setDrugName(data.drug_name || "");
      setManufacturer(data.manufacturer || "");
      setBatchNumber(data.batch_number || "");
      setExpiryRaw(data.expiry_raw || "");

      // Populate Worldwide Pharmacopeia Insights
      setActiveIngredients(data.active_ingredients || "");
      setDrugCategory(data.drug_category || "");
      setPackagingType(data.packaging_type || "");
      setUsageSummary(data.usage_summary || "");

      // Transition to Confirm screen
      setScreen("confirm");
    } catch (err: any) {
      console.warn("Scan upload failed, falling back to manual entry:", err);
      setScanNotice(t.confirm.manualFallbackNotice);
      setDrugName("");
      setManufacturer("");
      setBatchNumber("");
      setExpiryRaw("");
      setActiveIngredients("");
      setDrugCategory("");
      setPackagingType("");
      setUsageSummary("");
      setScreen("confirm");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Live Camera Capture Handler
  const handleCameraCapture = (blob: Blob) => {
    setIsCameraOpen(false);
    processMedicineImage(blob);
  };

  // File Picker Fallback Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processMedicineImage(file);
  };

  // 5. Handle "Try a sample" (Demo)
  const handleTrySample = async () => {
    setIsChecking(true);
    // Use the seeded fictional demo batch
    const sample = {
      drug_name: "Altopan Pantoprazole Tablets 40mg",
      manufacturer: "Novagen Healthcare Pvt Ltd",
      batch_number: "BX2417A",
      expiry_raw: "08/2026",
    };

    setDrugName(sample.drug_name);
    setManufacturer(sample.manufacturer);
    setBatchNumber(sample.batch_number);
    setExpiryRaw(sample.expiry_raw);

    // Seeded demo pharmacopeia identification
    setActiveIngredients("Pantoprazole Sodium IP 40mg");
    setDrugCategory("Proton Pump Inhibitor (Antacid / Anti-ulcer)");
    setPackagingType("Alu-Alu Blister Strip");
    setUsageSummary("Reduces stomach acid production; indicated for gastroesophageal reflux disease (GERD) and peptic ulcers.");

    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sample),
      });
      const data = await res.json();

      setResultStatus(data.status || "flagged");
      setResultConfidence(data.confidence || "high");
      setIsAlsoExpired(Boolean(data.isAlsoExpired));
      setMatchedRows(data.matchedRows || []);
      setListsCheckedNames(data.listsCheckedNames || "DEMO DATA (fictional)");
      setLatestMonthYear(data.latestMonthYear || "August 2026");

      setScreen("result");
    } catch (err) {
      console.warn("Sample check error:", err);
      // Fallback demo result in case of network issue
      setResultStatus("flagged");
      setResultConfidence("high");
      setIsAlsoExpired(false);
      setMatchedRows([
        {
          drug_name: sample.drug_name,
          manufacturer: sample.manufacturer,
          batch_number: sample.batch_number,
          alert_type: "NSQ",
          reason: "Fails dissolution test requirement",
          source_name: "DEMO DATA (fictional)",
          published_month: "2026-08-01",
          is_demo: true,
        },
      ]);
      setListsCheckedNames("DEMO DATA (fictional)");
      setLatestMonthYear("August 2026");
      setScreen("result");
    } finally {
      setIsChecking(false);
    }
  };

  // 6. Handle "Check Batch" from Confirm Screen
  const handleCheckBatch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setConfirmError(null);

    const trimmed = batchNumber.trim();
    if (!trimmed) {
      setConfirmError(t.confirm.batchRequiredError);
      return;
    }

    setIsChecking(true);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          drug_name: drugName,
          manufacturer,
          batch_number: trimmed,
          expiry_raw: expiryRaw,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setConfirmError(data.error || "Failed to check batch. Please check your connection.");
        setIsChecking(false);
        return;
      }

      setResultStatus(data.status);
      setResultConfidence(data.confidence || "high");
      setIsAlsoExpired(Boolean(data.isAlsoExpired));
      setMatchedRows(data.matchedRows || []);
      setListsCheckedNames(data.listsCheckedNames || "CDSCO Regulatory Lists");
      setLatestMonthYear(data.latestMonthYear || "Current");

      setScreen("result");
    } catch (err: any) {
      console.error("Check batch request error:", err);
      setConfirmError("Network error. Please try again or check your connection.");
    } finally {
      setIsChecking(false);
    }
  };

  // Switch to Manual Entry directly
  const handleManualEntry = () => {
    setScanNotice(null);
    setConfirmError(null);
    setDrugName("");
    setManufacturer("");
    setBatchNumber("");
    setExpiryRaw("");
    setActiveIngredients("");
    setDrugCategory("");
    setPackagingType("");
    setUsageSummary("");
    setScreen("confirm");
  };

  // Reset to Home
  const handleBackHome = () => {
    speechRef.current.stop();
    setIsSpeaking(false);
    setScreen("home");
  };

  // Result card presentation variables
  const resultTextObj = getResultText(locale, {
    status: resultStatus,
    confidence: resultConfidence,
    isAlsoExpired,
    listsCheckedNames,
    latestMonthYear,
  });

  const isDemoResult = matchedRows.some((r) => r.is_demo);

  return (
    <div className="min-h-screen flex flex-col justify-between max-w-md mx-auto w-full px-4 py-3 sm:py-6 relative">
      {/* Hidden File Input for fallback gallery upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload medicine photo from gallery"
      />

      {/* Live Camera Viewfinder Modal */}
      <CameraViewfinder
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        onSelectFileFallback={() => fileInputRef.current?.click()}
        locale={locale}
      />

      {/* TOP HEADER */}
      <header className="flex items-center justify-between py-2 border-b border-navy-800/80 mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBackHome}
            className="flex items-center gap-2.5 text-left focus:outline-none focus:ring-2 focus:ring-sky-400 rounded-lg p-1 -m-1"
            title="BatchCheck Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
                {t.appName}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">CDSCO Alert Check</p>
            </div>
          </button>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeLocale(locale === "en" ? "hi" : "en")}
            className="tap-target px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-sky-400 border border-navy-700 transition flex items-center gap-1.5 shadow"
            aria-label="Switch Language"
          >
            <span className={locale === "hi" ? "text-sky-300 font-bold" : "text-slate-400"}>EN</span>
            <span className="text-slate-500">/</span>
            <span className={locale === "en" ? "text-sky-300 font-bold" : "text-slate-400"}>हिन्दी</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* SCREEN 1: HOME */}
      {/* ======================================================== */}
      {screen === "home" && (
        <main className="flex-1 flex flex-col justify-between animate-fadeIn">
          {/* Plain language explanation */}
          <div className="mb-2">
            <p className="text-sm text-slate-300 leading-relaxed bg-navy-900/60 border border-navy-800 p-3.5 rounded-xl shadow-sm">
              {t.plainLanguageIntro}
            </p>
          </div>

          {/* 3D Blister Hero Scene (or 2D Fallback if Lite mode) */}
          <div className="my-1">
            {is3DEnabled ? (
              <DynamicHeroScene isScanning={isScanning} />
            ) : (
              <Static2DFallback status="default" isScanning={isScanning} />
            )}
            {isScanning && (
              <div className="text-center my-2 animate-pulse">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950 text-sky-300 text-xs font-medium border border-sky-800">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {t.home.scanningAction}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 mt-auto pt-4">
            {/* BIG SCAN BUTTON (Opens Camera Permission & Viewfinder) */}
            <button
              onClick={() => setIsCameraOpen(true)}
              disabled={isScanning}
              className="tap-target w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl shadow-sky-900/40 tilt-button transition disabled:opacity-50"
            >
              <Camera className="w-6 h-6" />
              <span>{t.home.scanButton}</span>
            </button>

            {/* Photo Tip */}
            <p className="text-[12px] text-center text-slate-400 px-2 leading-tight">
              {t.home.photoTip}
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              {/* Type Details Manually */}
              <button
                onClick={handleManualEntry}
                className="tap-target flex-1 py-3 px-4 rounded-xl bg-navy-800/90 hover:bg-navy-700/90 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 border border-navy-700 transition"
              >
                <Keyboard className="w-4 h-4 text-slate-400" />
                <span>{t.home.manualEntryLink}</span>
              </button>

              {/* Try a Sample (Demo) */}
              <button
                onClick={handleTrySample}
                disabled={isChecking}
                className="tap-target flex-1 py-3 px-4 rounded-xl bg-navy-800/90 hover:bg-navy-700/90 text-amber-300 font-medium text-sm flex items-center justify-center gap-2 border border-amber-900/40 hover:border-amber-700 transition"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isChecking ? "Checking..." : t.home.sampleButton}</span>
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* SCREEN 2: CONFIRM */}
      {/* ======================================================== */}
      {screen === "confirm" && (
        <main className="flex-1 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackHome}
                className="p-1 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-white transition"
                aria-label="Back to home"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-white">{t.confirm.title}</h2>
            </div>

            <p className="text-xs text-slate-300 bg-navy-900/80 p-2.5 rounded-lg border border-navy-800">
              {t.confirm.subtitle}
            </p>

            {scanNotice && (
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/70 text-amber-200 text-xs flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{scanNotice}</span>
              </div>
            )}

            {confirmError && (
              <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{confirmError}</span>
              </div>
            )}

            {/* WORLDWIDE PHARMACOPEIA IDENTIFICATION CARD */}
            {(activeIngredients || drugCategory || packagingType || usageSummary) && (
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-navy-900 via-navy-850 to-indigo-950/40 border border-sky-500/30 text-xs space-y-2 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold text-sky-300 text-[11px] uppercase tracking-wider">
                  <BookmarkCheck className="w-4 h-4 text-sky-400" />
                  <span>{t.confirm.insightsHeader}</span>
                </div>

                {activeIngredients && (
                  <div>
                    <span className="text-slate-400 font-medium">{t.confirm.ingredientsLabel}: </span>
                    <span className="text-white font-semibold">{activeIngredients}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-0.5 text-[11px]">
                  {drugCategory && (
                    <span className="px-2.5 py-0.5 rounded-md bg-sky-950 text-sky-200 border border-sky-800/80 font-medium">
                      {drugCategory}
                    </span>
                  )}
                  {packagingType && (
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-950 text-indigo-200 border border-indigo-800/80 font-medium">
                      {packagingType}
                    </span>
                  )}
                </div>

                {usageSummary && (
                  <p className="text-slate-300 text-[11px] leading-relaxed pt-1 border-t border-white/10 italic">
                    "{usageSummary}"
                  </p>
                )}
              </div>
            )}

            {/* Editable Form */}
            <form onSubmit={handleCheckBatch} className="space-y-3">
              {/* Batch Number (Required) */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
                  {t.confirm.batchLabel} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder={t.confirm.batchPlaceholder}
                  required
                  className="tap-target w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-sky-500/40 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white font-mono text-base tracking-wide"
                />
              </div>

              {/* Drug Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
                  {t.confirm.drugNameLabel}
                </label>
                <input
                  type="text"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder={t.confirm.drugNamePlaceholder}
                  className="tap-target w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-navy-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-sm"
                />
              </div>

              {/* Manufacturer */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
                  {t.confirm.mfrLabel}
                </label>
                <input
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder={t.confirm.mfrPlaceholder}
                  className="tap-target w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-navy-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-sm"
                />
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
                  {t.confirm.expiryLabel}
                </label>
                <input
                  type="text"
                  value={expiryRaw}
                  onChange={(e) => setExpiryRaw(e.target.value)}
                  placeholder={t.confirm.expiryPlaceholder}
                  className="tap-target w-full px-3.5 py-2.5 rounded-xl bg-navy-900 border border-navy-700 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-white text-sm font-mono"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChecking}
                  className="tap-target w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-sky-900/40 tilt-button transition disabled:opacity-50"
                >
                  {isChecking ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{t.confirm.checkingButton}</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-5 h-5" />
                      <span>{t.confirm.checkButton}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="pt-4 text-center">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="text-xs text-sky-400 hover:text-sky-300 underline font-medium p-2"
            >
              Re-scan with camera
            </button>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* SCREEN 3: RESULT */}
      {/* ======================================================== */}
      {screen === "result" && (
        <main className="flex-1 flex flex-col justify-between animate-fadeIn">
          <div>
            {/* 3D Scene Reaction above result card */}
            <div className="my-1">
              {is3DEnabled ? (
                <DynamicResultScene status={resultStatus} />
              ) : (
                <Static2DFallback status={resultStatus} />
              )}
            </div>

            {/* Speech Notice / Controls */}
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] text-slate-400">
                {locale === "hi" ? t.result.voiceLanguageNotice : t.result.voiceLanguageNotice}
              </span>
              <button
                onClick={() => handleSpeak()}
                className={`tap-target px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  isSpeaking
                    ? "bg-red-900/60 text-red-200 border border-red-700 animate-pulse"
                    : "bg-navy-800 text-sky-300 border border-navy-700 hover:bg-navy-700"
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span>{t.result.stopSpeech}</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{t.result.readAloud}</span>
                  </>
                )}
              </button>
            </div>

            {speechError && (
              <p className="text-[11px] text-amber-300/80 mb-2 px-1">{speechError}</p>
            )}

            {/* COLOR-CODED RESULT CARD */}
            {/* RED = FLAGGED, AMBER = EXPIRED, GREY = NO MATCH */}
            <div
              className={`w-full rounded-2xl p-4 sm:p-5 border-2 shadow-2xl relative transition-all ${
                resultStatus === "flagged"
                  ? "bg-red-950/60 border-red-600 text-white shadow-red-950/50"
                  : resultStatus === "expired"
                  ? "bg-amber-950/50 border-amber-600 text-white shadow-amber-950/50"
                  : "bg-slate-900/80 border-slate-600 text-slate-100 shadow-slate-950/50"
              }`}
            >
              {/* Demo Badge */}
              {isDemoResult && (
                <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[10px] font-extrabold tracking-widest px-2.5 py-0.5 rounded-full uppercase shadow">
                  {t.result.demoBadge}
                </div>
              )}

              {/* Status Header Badge & Icon */}
              <div className="flex items-start gap-3 mb-3">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    resultStatus === "flagged"
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : resultStatus === "expired"
                      ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
                      : "bg-slate-700 text-slate-200"
                  }`}
                >
                  {resultStatus === "flagged" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : resultStatus === "expired" ? (
                    <Clock className="w-6 h-6" />
                  ) : (
                    <Search className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <h3 className="font-extrabold text-lg leading-tight uppercase tracking-tight">
                    {resultStatus === "flagged"
                      ? resultConfidence === "low"
                        ? t.result.flaggedLowBadge
                        : t.result.flaggedHighBadge
                      : resultStatus === "expired"
                      ? t.result.expiredBadge
                      : t.result.noMatchBadge}
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Batch: <span className="font-bold text-white">{batchNumber.toUpperCase()}</span>
                  </p>
                </div>
              </div>

              {/* CARD RESULT TEXT (Strictly from fixed templates, NEVER from LLM!) */}
              <div className="my-3 p-3.5 rounded-xl bg-black/30 border border-white/10 text-sm sm:text-base leading-relaxed font-medium">
                {resultTextObj.cardText}
              </div>

              {/* WORLDWIDE PHARMACOPEIA IDENTIFICATION SUMMARY */}
              {(activeIngredients || drugCategory || usageSummary) && (
                <div className="mt-3 p-3 rounded-lg bg-black/30 border border-white/10 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-300 font-bold text-[11px] uppercase tracking-wider">
                    <Pill className="w-3.5 h-3.5" />
                    <span>{t.result.pharmacopeiaHeader}</span>
                  </div>
                  {activeIngredients && (
                    <p className="text-white font-medium">
                      <span className="text-slate-400">{t.confirm.ingredientsLabel}:</span> {activeIngredients}
                    </p>
                  )}
                  {drugCategory && (
                    <p className="text-slate-300">
                      <span className="text-slate-400">{t.confirm.categoryLabel}:</span> {drugCategory}
                    </p>
                  )}
                </div>
              )}

              {/* Matched Record Details (If Flagged) */}
              {resultStatus === "flagged" && matchedRows.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/15 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-red-200">
                    {t.result.matchedDetailsHeader}
                  </h4>
                  {matchedRows.map((match, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-black/40 border border-red-500/30 space-y-1.5 text-xs"
                    >
                      <div className="flex justify-between">
                        <span className="text-red-200/80">{t.result.drugName}:</span>
                        <span className="font-bold text-white text-right">{match.drug_name}</span>
                      </div>
                      {match.manufacturer && (
                        <div className="flex justify-between">
                          <span className="text-red-200/80">{t.result.manufacturer}:</span>
                          <span className="text-white text-right">{match.manufacturer}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-red-200/80">{t.result.alertType}:</span>
                        <span className="font-bold text-amber-300 text-right">
                          {t.alertTypes[match.alert_type] || match.alert_type}
                        </span>
                      </div>
                      {match.reason && (
                        <div className="pt-1 text-[11px] text-red-100/90 italic">
                          "{match.reason}"
                        </div>
                      )}
                      <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-white/10">
                        <span>{match.source_name}</span>
                        {match.published_month && (
                          <span>{match.published_month.substring(0, 7)}</span>
                        )}
                      </div>
                      {match.source_url && (
                        <div className="pt-1">
                          <a
                            href={match.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                          >
                            <span>Official notice link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4">
            <button
              onClick={() => setIsCameraOpen(true)}
              className="tap-target w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-sky-900/40 tilt-button transition"
            >
              <Camera className="w-5 h-5" />
              <span>{t.result.scanAnother}</span>
            </button>

            <button
              onClick={handleBackHome}
              className="tap-target w-full py-3 px-4 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 border border-navy-700 transition"
            >
              <span>{t.result.backHome}</span>
            </button>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* SCREEN 4: ABOUT / DATA */}
      {/* ======================================================== */}
      {screen === "about" && (
        <main className="flex-1 flex flex-col justify-between relative animate-fadeIn">
          {/* Subtle 3D background */}
          {is3DEnabled && <DynamicAboutScene />}

          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleBackHome}
                className="p-1 rounded-lg hover:bg-navy-800 text-slate-400 hover:text-white transition"
                aria-label="Back to home"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold text-white">{t.about.title}</h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-navy-900/80 p-3 rounded-xl border border-navy-800">
              {t.about.intro}
            </p>

            {/* MANDATORY SAFETY DISCLAIMER */}
            <div className="p-4 rounded-xl bg-amber-950/40 border-2 border-amber-600/70 text-amber-100 space-y-1.5 shadow-lg">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h4>{t.about.safetyDisclaimerTitle}</h4>
              </div>
              <p className="text-xs leading-relaxed text-amber-200/90">
                {t.about.safetyDisclaimer}
              </p>
            </div>

            {/* Ingested Lists Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {t.about.sourcesHeader}
              </h3>
              <div className="overflow-x-auto rounded-xl border border-navy-800 bg-navy-900/90 shadow">
                <table className="w-full text-left text-xs">
                  <thead className="bg-navy-800/80 text-slate-400 text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2">{t.about.tableName}</th>
                      <th className="px-3 py-2">{t.about.tableMonth}</th>
                      <th className="px-3 py-2">{t.about.tableRecords}</th>
                      <th className="px-3 py-2">{t.about.tableSource}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-800 text-slate-300">
                    {dataSources.length > 0 ? (
                      dataSources.map((src) => (
                        <tr key={src.id} className="hover:bg-navy-850/50">
                          <td className="px-3 py-2.5 font-medium text-white">{src.name}</td>
                          <td className="px-3 py-2.5 font-mono text-[11px]">
                            {src.published_month ? src.published_month.substring(0, 7) : "—"}
                          </td>
                          <td className="px-3 py-2.5 font-mono">{src.record_count}</td>
                          <td className="px-3 py-2.5">
                            {src.source_url ? (
                              <a
                                href={src.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-400 hover:underline inline-flex items-center gap-1"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-slate-400">
                          {t.about.noSourcesYet}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How It Works */}
            <div className="p-3.5 rounded-xl bg-navy-900/60 border border-navy-800 text-xs space-y-1">
              <h4 className="font-bold text-slate-200">{t.about.howItWorksTitle}</h4>
              <p className="text-slate-400 leading-relaxed">{t.about.howItWorksText}</p>
            </div>
          </div>

          <div className="pt-4 relative z-10">
            <button
              onClick={handleBackHome}
              className="tap-target w-full py-3 px-4 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 border border-navy-700 transition"
            >
              <span>{t.about.backButton}</span>
            </button>
          </div>
        </main>
      )}

      {/* ======================================================== */}
      {/* FOOTER */}
      {/* ======================================================== */}
      <footer className="mt-4 pt-3 border-t border-navy-850/80 flex flex-col gap-2 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          {/* Lite Mode Toggle */}
          <button
            onClick={toggleLiteMode}
            className="tap-target px-2 py-1 text-[11px] rounded hover:text-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono transition"
            aria-label="Toggle 3D Lite Mode"
          >
            {isLiteMode ? t.footer.liteModeOn : t.footer.liteModeOff}
          </button>

          {/* About / Data Link */}
          <button
            onClick={() => setScreen("about")}
            className="tap-target px-2 py-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium underline transition"
          >
            {t.footer.aboutLink}
          </button>
        </div>

        <div className="text-center text-[10px] text-slate-400/80 pb-1">
          BatchCheck • Informational Tool • CDSCO Regulatory Lists
        </div>
      </footer>
    </div>
  );
}
