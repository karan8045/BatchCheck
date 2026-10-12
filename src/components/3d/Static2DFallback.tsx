import React from "react";

interface Static2DFallbackProps {
  status?: "default" | "flagged" | "expired" | "no_match";
  isScanning?: boolean;
  className?: string;
}

export function Static2DFallback({
  status = "default",
  isScanning = false,
  className = "",
}: Static2DFallbackProps) {
  // Color tokens matching the 3D materials
  let foilGradientFrom = "#1e293b";
  let foilGradientTo = "#0f172a";
  let borderColor = "#334155";
  let pocketColor = "#475569";
  let pocketGlow = "#64748b";
  let statusBadge = null;

  if (status === "flagged") {
    foilGradientFrom = "#7f1d1d";
    foilGradientTo = "#450a0a";
    borderColor = "#ef4444";
    pocketColor = "#991b1b";
    pocketGlow = "#f87171";
    statusBadge = (
      <div className="absolute -top-3 right-3 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow">
        Alert Match
      </div>
    );
  } else if (status === "expired") {
    foilGradientFrom = "#78350f";
    foilGradientTo = "#451a03";
    borderColor = "#f59e0b";
    pocketColor = "#92400e";
    pocketGlow = "#fbbf24";
    statusBadge = (
      <div className="absolute -top-3 right-3 bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow">
        Expired
      </div>
    );
  } else if (status === "no_match") {
    foilGradientFrom = "#1e293b";
    foilGradientTo = "#0f172a";
    borderColor = "#64748b";
    pocketColor = "#334155";
    pocketGlow = "#94a3b8";
    statusBadge = (
      <div className="absolute -top-3 right-3 bg-slate-600 text-slate-100 text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow">
        List Check Complete
      </div>
    );
  }

  return (
    <div className={`relative flex items-center justify-center p-4 ${className}`}>
      {statusBadge}
      <div
        className="relative w-44 h-64 rounded-2xl border-2 shadow-2xl p-3 flex flex-col justify-between transition-all duration-500 overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${foilGradientFrom}, ${foilGradientTo})`,
          borderColor: borderColor,
          boxShadow: `0 10px 25px -5px ${status === "flagged" ? "rgba(220, 38, 38, 0.3)" : "rgba(15, 23, 42, 0.5)"}`,
        }}
      >
        {/* Embossed foil texture lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px]" />

        {/* Scanning beam line */}
        {isScanning && (
          <div className="absolute left-0 right-0 h-1 bg-cyan-400 shadow-[0_0_12px_#38bdf8] animate-bounce" />
        )}

        {/* 10 Blister pockets (2 cols x 5 rows) */}
        <div className="grid grid-cols-2 gap-2.5 h-full my-auto place-items-center">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="w-12 h-8 rounded-full border border-white/20 shadow-inner flex items-center justify-center transition-colors duration-500"
              style={{
                backgroundColor: pocketColor,
                boxShadow: `inset 0 2px 4px rgba(255,255,255,0.2), 0 2px 6px ${pocketGlow}33`,
              }}
            >
              <div className="w-8 h-4 rounded-full bg-white/10" />
            </div>
          ))}
        </div>

        {/* Foil edge indent */}
        <div className="w-full flex justify-between items-center text-[8px] tracking-widest text-white/40 uppercase font-mono px-1">
          <span>BATCH-CHECK</span>
          <span>FOIL SEAL</span>
        </div>
      </div>
    </div>
  );
}

