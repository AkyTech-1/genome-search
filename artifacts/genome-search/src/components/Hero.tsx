import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useApp } from "@/App";

interface HeroProps {
  onSectionChange: (section: string) => void;
}

export function Hero({ onSectionChange }: HeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setActiveTab } = useApp();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: { x: number; y: number; vx: number; vy: number; alpha: number; size: number }[] = [];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        alpha: Math.random() * 0.6 + 0.15,
        size: Math.random() * 2.2 + 0.5,
      });
    }

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(0,212,255,${0.12 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  const chars = "ATGCUNATGCUNATGCUN";

  const handleDatabaseClick = () => {
    setActiveTab("database");
    onSectionChange("database");
    const el = document.getElementById("main-content-anchor");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleBlastClick = () => {
    setActiveTab("blast");
    onSectionChange("blast");
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center overflow-hidden grid-bg scanlines"
      style={{ minHeight: "100vh" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.55 }} />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,212,255,0.07) 0%, rgba(189,0,255,0.04) 40%, transparent 70%)"
      }} />

      {/* DNA helix — left */}
      <div className="absolute left-8 top-1/2 opacity-20 select-none hidden lg:block" style={{ transform: "translateY(-50%)" }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <span className="font-mono text-xs" style={{ color: "#00d4ff", display: "block", transform: `translateX(${Math.sin(i * 0.55) * 22}px)` }}>
              {chars[i % chars.length]}
            </span>
          </div>
        ))}
      </div>

      {/* DNA helix — right */}
      <div className="absolute right-8 top-1/2 opacity-20 select-none hidden lg:block" style={{ transform: "translateY(-50%)" }}>
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} style={{ marginBottom: 10 }}>
            <span className="font-mono text-xs" style={{ color: "#bd00ff", display: "block", transform: `translateX(${Math.cos(i * 0.55) * 22}px)` }}>
              {chars[(i + 9) % chars.length]}
            </span>
          </div>
        ))}
      </div>

      <div className="relative z-10 text-center px-8 max-w-5xl mx-auto">
        {/* System label */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ marginBottom: 32, display: "inline-flex", alignItems: "center", gap: 12, padding: "8px 20px", border: "1px solid rgba(0,212,255,0.2)", background: "rgba(0,212,255,0.05)", borderRadius: 4 }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: "#00ff88", boxShadow: "0 0 10px #00ff88", width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
          <span className="font-mono" style={{ fontSize: 11, color: "#00ff88", letterSpacing: "0.18em" }}>VIRAL GENOME INTELLIGENCE SYSTEM v3.0</span>
          <span className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: "#00ff88", boxShadow: "0 0 10px #00ff88", width: 8, height: 8, borderRadius: "50%", flexShrink: 0 }} />
        </motion.div>

        {/* Main title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
        >
          <h1
            className="font-orbitron glow-cyan animate-flicker"
            style={{ fontSize: "clamp(48px, 8vw, 92px)", fontWeight: 900, color: "#00d4ff", letterSpacing: "-0.02em", lineHeight: 1.0, marginBottom: 4 }}
          >
            VIRAL GENOME
          </h1>
          <h1
            className="font-orbitron glow-purple"
            style={{ fontSize: "clamp(48px, 8vw, 92px)", fontWeight: 900, color: "#bd00ff", letterSpacing: "-0.02em", lineHeight: 1.0, marginBottom: 32 }}
          >
            INTELLIGENCE
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: "clamp(13px, 1.5vw, 17px)", color: "#7ab8d4", lineHeight: 1.8, marginBottom: 48, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}
        >
          Advanced pathogen database with real-time NCBI BLAST sequence analysis.<br />
          <span style={{ color: "#4a8aaa" }}>49 catalogued pathogens · Pandemic risk assessment · Clinical profiling · Vaccine intelligence</span>
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          style={{ display: "flex", gap: 16, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}
        >
          <motion.button
            className="btn-cyber-green"
            style={{ fontFamily: "Orbitron", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", padding: "14px 36px", border: "1px solid #00ff8866", background: "linear-gradient(135deg, #00ff8814, #00ff8806)", color: "#00ff88", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderRadius: 6 }}
            whileHover={{ scale: 1.04, boxShadow: "0 0 30px #00ff8844" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDatabaseClick}
          >
            🧬 Browse Viral Database
          </motion.button>
          <motion.button
            style={{ fontFamily: "Orbitron", fontSize: 12, fontWeight: 700, letterSpacing: "0.14em", padding: "14px 36px", border: "1px solid #00d4ff66", background: "linear-gradient(135deg, #00d4ff14, #00d4ff06)", color: "#00d4ff", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, borderRadius: 6 }}
            whileHover={{ scale: 1.04, boxShadow: "0 0 30px #00d4ff44" }}
            whileTap={{ scale: 0.97 }}
            onClick={handleBlastClick}
          >
            🔬 Run BLAST Analysis
          </motion.button>
        </motion.div>

        {/* Sequence ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          style={{ marginTop: 64, overflow: "hidden", height: 24 }}
        >
          <div
            className="font-mono"
            style={{
              color: "#1a3a5c",
              animation: "seq-scroll 28s linear infinite",
              display: "inline-block",
              whiteSpace: "nowrap",
              fontSize: 12,
              letterSpacing: "0.1em",
            }}
          >
            {"ATGCATGCATGCGCTATCGCTAGCTAGCATCGATCGATGCATGCATCGATCGATCGATGCATCGATGCATGCATGCATGCATGCATCG ··· ATGCATGCATGCGCTATCGCTAGCTAGCATCGATCGATGCATGCATCGATCGATCGATGCATCGATGCATGCATGCATGCATGCATCG ···".split("").map((c, i) => (
              <span key={i} style={{ color: c === "A" ? "#0a2a40" : c === "T" ? "#150a2a" : c === "G" ? "#0a2a1a" : c === "C" ? "#2a1a08" : "#0e1a22" }}>{c}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
        style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
      >
        <span className="font-mono" style={{ fontSize: 10, color: "#2a4a6a", letterSpacing: "0.2em" }}>SCROLL</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 1, height: 32, background: "linear-gradient(to bottom, #00d4ff44, transparent)" }}
        />
      </motion.div>
    </div>
  );
}
