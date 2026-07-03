import { motion } from "framer-motion";
import { useListViruses } from "@workspace/api-client-react";

interface Stat {
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  glow: string;
}

export function StatsBar() {
  const { data: viruses } = useListViruses();

  const total = viruses?.length ?? 49;
  const critical = viruses?.filter((v) => v.pandemic_risk === "Critical").length ?? 4;
  const high = viruses?.filter((v) => v.pandemic_risk === "High").length ?? 18;
  const families = viruses ? new Set(viruses.map((v) => v.family)).size : 22;

  const stats: Stat[] = [
    { label: "PATHOGENS CATALOGUED", value: total, color: "#00d4ff", glow: "#00d4ff" },
    { label: "CRITICAL RISK", value: critical, color: "#ff2244", glow: "#ff2244" },
    { label: "HIGH RISK", value: high, color: "#ffaa00", glow: "#ffaa00" },
    { label: "VIRUS FAMILIES", value: families, color: "#bd00ff", glow: "#bd00ff" },
    { label: "NCBI BLAST", value: "LIVE", color: "#00ff88", glow: "#00ff88" },
    { label: "DATABASE", value: "v2.4", unit: ".1", color: "#00d4ff", glow: "#00d4ff" },
  ];

  return (
    <div
      className="relative border-y"
      style={{
        background: "linear-gradient(90deg, #050d15, #081422, #050d15)",
        borderColor: "#0e2540",
      }}
    >
      {/* Top scan line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #00d4ff44, transparent)" }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #bd00ff33, transparent)" }} />

      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-x" style={{ borderColor: "#0e2540" }}>
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="relative flex flex-col items-center justify-center py-5 px-4 text-center"
              style={{ borderColor: "#0e2540" }}
            >
              {/* Animated value */}
              <div
                className="font-orbitron text-2xl md:text-3xl font-black mb-1"
                style={{
                  color: stat.color,
                  textShadow: `0 0 12px ${stat.glow}88, 0 0 24px ${stat.glow}33`,
                }}
              >
                {stat.value}
                {stat.unit && <span className="text-lg opacity-60">{stat.unit}</span>}
              </div>
              <div
                className="font-mono text-xs tracking-widest"
                style={{ color: "#3d6b8a", letterSpacing: "0.12em" }}
              >
                {stat.label}
              </div>

              {/* Active indicator for LIVE */}
              {stat.value === "LIVE" && (
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse-glow"
                    style={{ background: "#00ff88", boxShadow: "0 0 6px #00ff88" }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
