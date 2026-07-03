import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadingScreenProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  { text: "INITIALISING VIRAL GENOME INTELLIGENCE v3.0 ...", delay: 0 },
  { text: "Loading pathogen database (49 records) ...", delay: 400 },
  { text: "Establishing NCBI BLAST connection ...", delay: 850 },
  { text: "Mounting genome index ...", delay: 1200 },
  { text: "Calibrating pandemic risk scoring engine ...", delay: 1550 },
  { text: "Loading vaccine cross-reference module ...", delay: 1900 },
  { text: "ALL SYSTEMS OPERATIONAL", delay: 2200, accent: true },
];

// Precompute static helix positions so nothing is derived during render
const STRANDS = Array.from({ length: 16 }, (_, i) => {
  const y = 18 + i * 22;
  const phase = (i / 15) * Math.PI * 4;
  const amplitude = 56;
  const x1 = 80 + Math.sin(phase) * amplitude;
  const x2 = 80 - Math.sin(phase) * amplitude;
  const crossOpacity = 0.12 + Math.abs(Math.sin(phase)) * 0.32;
  const crossColor = i % 3 === 0 ? "#00d4ff" : i % 3 === 1 ? "#bd00ff" : "#00ff88";
  return { i, y, x1, x2, crossOpacity, crossColor, phase };
});

function DNAHelix() {
  return (
    <motion.svg
      width="160"
      height="360"
      viewBox="0 0 160 360"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
    >
      {STRANDS.map(({ i, y, x1, x2, crossOpacity, crossColor }) => (
        <g key={i}>
          {/* Cyan strand node — animated via CSS x transform, not SVG attr */}
          <motion.circle
            cx={x1}
            cy={y}
            r={6}
            fill="#00d4ff"
            animate={{ opacity: [0.55, 1, 0.55], scale: [0.85, 1.12, 0.85] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.09 }}
            style={{
              filter: "drop-shadow(0 0 7px #00d4ff)",
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          />
          {/* Purple strand node */}
          <motion.circle
            cx={x2}
            cy={y}
            r={6}
            fill="#bd00ff"
            animate={{ opacity: [0.55, 1, 0.55], scale: [0.85, 1.12, 0.85] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.09 + 1.2 }}
            style={{
              filter: "drop-shadow(0 0 7px #bd00ff)",
              transformBox: "fill-box",
              transformOrigin: "center",
            }}
          />
          {/* Cross-link — static, no SVG attribute animation */}
          <motion.line
            x1={x1}
            y1={y}
            x2={x2}
            y2={y}
            stroke={crossColor}
            strokeWidth={1.5}
            animate={{ opacity: [crossOpacity, crossOpacity * 0.3, crossOpacity] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.09 }}
          />
        </g>
      ))}

      {/* Faint backbone spines */}
      <polyline
        points={STRANDS.map(({ x1, y }) => `${x1},${y}`).join(" ")}
        fill="none"
        stroke="#00d4ff"
        strokeWidth={1}
        strokeOpacity={0.1}
      />
      <polyline
        points={STRANDS.map(({ x2, y }) => `${x2},${y}`).join(" ")}
        fill="none"
        stroke="#bd00ff"
        strokeWidth={1}
        strokeOpacity={0.1}
      />
    </motion.svg>
  );
}

function BootLine({ text, accent, index }: { text: string; accent?: boolean; index: number }) {
  const [chars, setChars] = useState(0);

  useEffect(() => {
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setChars(i);
      if (i >= text.length) clearInterval(iv);
    }, 16);
    return () => clearInterval(iv);
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 12,
        lineHeight: 1.75,
        letterSpacing: "0.04em",
        color: accent ? "#00ff88" : index % 2 === 0 ? "#4a8aaa" : "#3a7a9a",
        textShadow: accent ? "0 0 14px #00ff88" : "none",
        display: "flex",
        gap: 8,
        alignItems: "center",
      }}
    >
      <span style={{ color: accent ? "#00ff88" : "#1a4a6a", flexShrink: 0, minWidth: 28 }}>
        {accent ? "✓" : `[${String(index + 1).padStart(2, "0")}]`}
      </span>
      <span>
        {text.slice(0, chars)}
        {chars < text.length && (
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.48, repeat: Infinity }}
            style={{ color: "#00d4ff" }}
          >
            ▌
          </motion.span>
        )}
      </span>
    </motion.div>
  );
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(
        setTimeout(() => {
          setVisibleLines((prev) => [...prev, i]);
          setProgress(Math.round(((i + 1) / BOOT_LINES.length) * 100));
        }, line.delay)
      );
    });

    const lastDelay = BOOT_LINES[BOOT_LINES.length - 1].delay + 750;
    timers.push(setTimeout(() => setExiting(true), lastDelay));
    timers.push(setTimeout(() => onComplete(), lastDelay + 620));

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exiting ? (
        <motion.div
          key="boot-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position: "fixed",
            inset: 0,
            background: "#020408",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(0,212,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.025) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
              pointerEvents: "none",
            }}
          />
          {/* Scanlines */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,0.014) 2px,rgba(0,212,255,0.014) 4px)",
              pointerEvents: "none",
            }}
          />
          {/* Radial glow */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 70% 55% at 50% 50%,rgba(0,212,255,0.07) 0%,rgba(189,0,255,0.04) 45%,transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: 64,
              alignItems: "center",
              zIndex: 1,
              flexWrap: "wrap",
              justifyContent: "center",
              padding: "0 32px",
            }}
          >
            {/* Animated DNA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <DNAHelix />
            </motion.div>

            {/* Terminal panel */}
            <div style={{ maxWidth: 490, width: "100%" }}>
              <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                style={{ marginBottom: 28 }}
              >
                <div
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#00d4ff",
                    textShadow: "0 0 32px #00d4ff99",
                    marginBottom: 2,
                  }}
                >
                  VIRAL GENOME
                </div>
                <div
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: 24,
                    fontWeight: 900,
                    color: "#bd00ff",
                    textShadow: "0 0 32px #bd00ff99",
                  }}
                >
                  INTELLIGENCE
                </div>
                <div
                  style={{
                    fontFamily: "'Share Tech Mono', monospace",
                    fontSize: 10,
                    color: "#1a4a6a",
                    letterSpacing: "0.22em",
                    marginTop: 8,
                  }}
                >
                  SYSTEM BOOT · v3.0
                </div>
              </motion.div>

              <div style={{ display: "flex", flexDirection: "column", minHeight: 165, marginBottom: 24 }}>
                {visibleLines.map((i) => (
                  <BootLine key={i} text={BOOT_LINES[i].text} accent={BOOT_LINES[i].accent} index={i} />
                ))}
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span
                    style={{ fontFamily: "monospace", fontSize: 10, color: "#1a4a6a", letterSpacing: "0.1em" }}
                  >
                    LOADING
                  </span>
                  <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: 10, color: "#00d4ff" }}>
                    {progress}%
                  </span>
                </div>
                <div style={{ height: 3, background: "#0e2540", borderRadius: 2, overflow: "hidden" }}>
                  <motion.div
                    style={{
                      height: "100%",
                      background: "linear-gradient(90deg,#00d4ff,#00ff88)",
                      borderRadius: 2,
                      boxShadow: "0 0 14px #00d4ff",
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.38, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
