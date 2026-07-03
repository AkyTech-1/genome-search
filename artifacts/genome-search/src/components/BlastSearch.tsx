import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/App";

const EXAMPLES = [
  {
    label: "SARS-CoV-2 Spike (partial)",
    virus: "SARS-CoV-2",
    seq: `ATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTTACAACCAGAACTCAATTACCCCCTGCATACACTAATTCTTTCACACGTGGTGTTTATTACCCTGACAAAGTTTTCAGATCCTCAGTTTTACATTCAACTCAGGACTTGTTCTTACCTTTCTTTTCCAATGTTACTTGGTTCCATGCTATACATGTCTCTGGGACCAATGGTACTAAGAGGTTTGATAACCCTGTCCTACCATTTAATGATGGTGTTTATTTTGCTTCCACTGAGAAGTCTAACATAATAAGAGGCTGGATTTTTGGTACTACTTTAGATTCGAAGACCCAGTCCCTACTTATTGTTAATAACGCTACTAATGTTGTTATTAAAGTCTGTGAATTTCAATTTTGTAATGATCCATTTTTGGGTGTTTATTACCACAAAAACAACAAAAGTTGGATGGAAAGTGAGTTCAGAGTTTATTCTAGTGCGAATAATTGCACTTTTGAATATGTCTCTCAGCCTTTTCTTATGGACCTTGAAGGAAAACAGGGTAATTTCAAAAATCTTAGGGAATTTGTGTTTAAGAATATTGATGGT`,
  },
  {
    label: "Influenza H1N1 HA (partial)",
    virus: "Influenza A",
    seq: `ATGAAAGCAATACTCTTGTTCTTCATGGCAGTGACACAGAAATGGCTGGATAAAAACAAGCAGAATTCAGGGATAATAAAGCAGATAATACTGAGCAGAAATTTGAGGAACTAAAGAAAGAGTTCAGAGAAATGGAAGAAATACAGATTGCAATAGAAGGAGAACAGAGCAATGATCAGACAGTGATGGAGTTAACCAAAAATGTGGCAGAAGTGGAAACACTACAAAGATTAAGACTCTCACTAATGAAATACAAGATAGTGATAAATCAGGGATTCTGGGGCCAAGAAAAACTGAGCAATGTAATACAAACAAATACATTCCAGGGAACTATGAAATTCAGAAATCCAACATCTCTGAAGACTTGGTGAATCCTATCAACAATACAATGCAAGGAACCAAGCAATACAAACAAATCCAGAGCAGAAATCTCAAGCTATGCAGAGCATCATGATGGCAGATCAATGCTTCTTAAACTCCAATGAG`,
  },
  {
    label: "Ebola Glycoprotein (partial)",
    virus: "Ebola",
    seq: `ATGGGCGTTACAGGAATATTGCAGTTACCTCGTGATCAAGTGAAAAAGTTTCTAAAGATAACTACTGATCTAAACCTATCAGACATTGAAGTTATTGAAGATGAGAAGAAAATGTCCATAAATGATGAGTTCTATGTGATGCCAGACCCAAAGATAATGGAAAAGATGGCAGTTACTAAGGAACCTCAGGATGAAATAGACATCCAGAACATAATAGTGGACCAAATTAAAGAAATCTTCAATAAAGTTGAGAAAGAAGTAAAGAAAATGCTTGTAACAAGTCCTATAAAAGAATTATCAGGATTTAACCTTGAATTAGTGGGAATCCCTTCACTGACACCAGAAGTGGAGAACTTGAATAATGATAAAGACAGATTTGAGGAAAACTTAAAGAAATTATCCAGTCTCAGCAAGCAAATCAAGAAAAGATAGAACAAATTTCAAATAAAATCCAAGATGTCAGAAGAACTGATGGATGTTGAAGAAATAAAGAAGCAATTAAGTCAGACAATGGATATTCAAATTGAGAAGATACAAACATTAAAAGAG`,
  },
];

function ColorSeq({ seq }: { seq: string }) {
  const lines = seq.replace(/\s/g, "").toUpperCase().match(/.{1,60}/g) || [];
  return (
    <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 11, lineHeight: 1.8 }}>
      {lines.map((line, li) => (
        <div key={li}>
          {line.split("").map((ch, ci) => {
            const color = ch === "A" ? "#00d4ff" : ch === "T" ? "#bd00ff" : ch === "G" ? "#00ff88" : ch === "C" ? "#ffaa00" : "#888";
            return <span key={ci} style={{ color }}>{ch}</span>;
          })}
        </div>
      ))}
    </div>
  );
}

function DNAHelixAnimation() {
  const points = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div style={{ position: "relative", width: 120, height: 240, margin: "0 auto" }}>
      <svg width="120" height="240">
        {points.map((i) => {
          const y = (i / 13) * 220 + 10;
          const phase = (i / 13) * Math.PI * 2;
          return (
            <g key={i}>
              <motion.circle
                cx={60 + Math.sin(phase) * 40}
                cy={y}
                r={5}
                fill="#00d4ff"
                style={{ filter: "drop-shadow(0 0 6px #00d4ff)" }}
                animate={{
                  cx: [60 + Math.sin(phase) * 40, 60 - Math.sin(phase) * 40, 60 + Math.sin(phase) * 40],
                  opacity: [0.8, 0.4, 0.8],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
              />
              <motion.circle
                cx={60 - Math.sin(phase) * 40}
                cy={y}
                r={5}
                fill="#bd00ff"
                style={{ filter: "drop-shadow(0 0 6px #bd00ff)" }}
                animate={{
                  cx: [60 - Math.sin(phase) * 40, 60 + Math.sin(phase) * 40, 60 - Math.sin(phase) * 40],
                  opacity: [0.8, 0.4, 0.8],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
              />
              <motion.line
                x1={60 + Math.sin(phase) * 40}
                y1={y}
                x2={60 - Math.sin(phase) * 40}
                y2={y}
                stroke={i % 2 === 0 ? "#00d4ff44" : "#bd00ff44"}
                strokeWidth={1.5}
                animate={{
                  x1: [60 + Math.sin(phase) * 40, 60 - Math.sin(phase) * 40, 60 + Math.sin(phase) * 40],
                  x2: [60 - Math.sin(phase) * 40, 60 + Math.sin(phase) * 40, 60 - Math.sin(phase) * 40],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: i * 0.12 }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RadarAnimation({ progress }: { progress: number }) {
  return (
    <div style={{ position: "relative", width: 200, height: 200, margin: "0 auto" }}>
      <svg width="200" height="200">
        {/* Rings */}
        {[90, 65, 40, 18].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#00d4ff22" strokeWidth={1} />
        ))}
        {/* Crosshairs */}
        <line x1="100" y1="10" x2="100" y2="190" stroke="#00d4ff18" strokeWidth={1} />
        <line x1="10" y1="100" x2="190" y2="100" stroke="#00d4ff18" strokeWidth={1} />
        {/* Scanning sweep */}
        <motion.path
          d="M 100 100 L 190 100 A 90 90 0 0 1 100 10"
          fill="url(#sweep-grad)"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "100px 100px" }}
        />
        <defs>
          <radialGradient id="sweep-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity={0} />
            <stop offset="70%" stopColor="#00d4ff" stopOpacity={0.06} />
            <stop offset="100%" stopColor="#00d4ff" stopOpacity={0.18} />
          </radialGradient>
        </defs>
        {/* Progress blip */}
        <motion.line
          x1="100" y1="100"
          x2="190" y2="100"
          stroke="#00d4ff"
          strokeWidth={2}
          style={{ filter: "drop-shadow(0 0 8px #00d4ff)", transformOrigin: "100px 100px" }}
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
        />
        {/* Center dot */}
        <circle cx="100" cy="100" r={4} fill="#00d4ff" style={{ filter: "drop-shadow(0 0 6px #00d4ff)" }} />
        {/* Progress arc */}
        <motion.circle
          cx="100" cy="100" r="70"
          fill="none"
          stroke="#00ff88"
          strokeWidth={3}
          strokeDasharray={`${2 * Math.PI * 70}`}
          initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
          animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - progress / 100) }}
          transition={{ duration: 0.5 }}
          style={{ transformOrigin: "100px 100px", transform: "rotate(-90deg)", filter: "drop-shadow(0 0 4px #00ff88)" }}
        />
        {/* Random blips */}
        {[{ x: 130, y: 60 }, { x: 70, y: 120 }, { x: 150, y: 140 }].map((pt, i) => (
          <motion.circle
            key={i}
            cx={pt.x} cy={pt.y} r={3}
            fill="#00ff88"
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.7 + 0.5, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 4px #00ff88)" }}
          />
        ))}
      </svg>
    </div>
  );
}

type Phase = "idle" | "submitting" | "polling" | "done" | "error";

export function BlastSearch() {
  const { blastTarget, blastSequence, setBlastSequence, setBlastRid, setActiveTab } = useApp();
  const [sequence, setSequence] = useState(blastSequence || "");
  const [program, setProgram] = useState("blastn");
  const [database, setDatabase] = useState("nt");
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [ridLocal, setRidLocal] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopPollRef = useRef(false);

  // Sync pre-filled sequence from blastTarget
  useEffect(() => {
    if (blastSequence) {
      setSequence(blastSequence);
    }
  }, [blastSequence]);

  const clearPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    stopPollRef.current = true;
  };

  const handleSubmit = async () => {
    const seq = sequence.trim();
    if (!seq) { setError("Please enter or paste a nucleotide sequence"); return; }
    if (seq.replace(/[^ATGCatgcNn\s>A-Za-z0-9._-]/g, "").length < 20) {
      setError("Sequence appears too short or invalid. Minimum 20 nucleotides required.");
      return;
    }

    setError("");
    setPhase("submitting");
    setProgress(5);
    setStatusMsg("Connecting to NCBI BLAST...");

    try {
      const res = await fetch("/api/blast/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sequence: seq, program, database }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `NCBI error ${res.status}`);
      }

      const { rid } = await res.json();
      setRidLocal(rid);
      setBlastRid(rid);
      setPhase("polling");
      setProgress(15);
      setStatusMsg(`Job submitted — RID: ${rid}`);
      pollForResults(rid);
    } catch (e: unknown) {
      setPhase("error");
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const pollForResults = (rid: string) => {
    stopPollRef.current = false;
    let ticks = 0;
    const MESSAGES = [
      "Searching nucleotide databases...",
      "Running Smith-Waterman alignment...",
      "Computing statistical significance...",
      "Evaluating sequence similarity...",
      "Retrieving alignment results...",
      "Processing hit metadata...",
      "Almost there — finalizing results...",
    ];

    pollRef.current = setInterval(async () => {
      if (stopPollRef.current) return;
      ticks++;
      const msgIdx = Math.min(Math.floor(ticks / 3), MESSAGES.length - 1);
      setStatusMsg(MESSAGES[msgIdx]);
      setProgress(Math.min(90, 15 + ticks * 4));

      try {
        const r = await fetch(`/api/blast/results?rid=${encodeURIComponent(rid)}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();

        if (data.status === "done") {
          clearPoll();
          setProgress(100);
          setStatusMsg("Analysis complete!");
          setPhase("done");
        } else if (data.status === "failed") {
          clearPoll();
          setPhase("error");
          setError("BLAST search failed — try again with a different sequence");
        }
        // "waiting" — keep polling
      } catch {
        // Network error — keep trying for a bit
        if (ticks > 40) {
          clearPoll();
          setPhase("error");
          setError("NCBI unreachable after multiple retries. Please try again.");
        }
      }
    }, 5000);
  };

  const handleViewResults = () => {
    setActiveTab("results");
  };

  const handleReset = () => {
    clearPoll();
    setPhase("idle");
    setProgress(0);
    setStatusMsg("");
    setError("");
    setRidLocal(null);
  };

  const loadExample = (ex: typeof EXAMPLES[number]) => {
    setSequence(ex.seq);
    setBlastSequence(ex.seq);
    setError("");
    if (phase !== "idle") handleReset();
  };

  const charCount = sequence.replace(/\s/g, "").replace(/>.*\n?/g, "").length;

  return (
    <div className="blast-page">
      {/* Page header */}
      <div className="blast-page__header">
        <div>
          <h2 className="blast-page__title">
            BLAST Sequence Analysis
          </h2>
          <p className="blast-page__subtitle">
            Submit a nucleotide sequence to NCBI BLAST for real-time similarity search against viral genomes
          </p>
        </div>
        {blastTarget && (
          <motion.div
            className="blast-source-chip"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span style={{ color: "#4a7a9b", fontSize: 11, fontFamily: "monospace" }}>Pre-filled from:</span>
            <span style={{ color: "#00d4ff", fontFamily: "Orbitron", fontWeight: 700, fontSize: 12 }}>{blastTarget.name}</span>
          </motion.div>
        )}
      </div>

      <div className="blast-layout">
        {/* Left: input panel */}
        <div className="blast-input-panel">
          {/* Example sequences */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 10 }}>EXAMPLE SEQUENCES</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {EXAMPLES.map((ex, i) => (
                <motion.button
                  key={i}
                  onClick={() => loadExample(ex)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    background: "#060f1a",
                    border: "1px solid #1a3a5c",
                    color: "#00d4ff",
                    padding: "6px 14px",
                    borderRadius: 4,
                    fontFamily: "monospace",
                    fontSize: 11,
                    cursor: "pointer",
                    transition: "border-color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#00d4ff66")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#1a3a5c")}
                >
                  {ex.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Sequence textarea */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.15em" }}>
                NUCLEOTIDE SEQUENCE
              </div>
              <span style={{ fontFamily: "monospace", fontSize: 11, color: charCount > 0 ? "#00d4ff" : "#2a4a6a" }}>
                {charCount.toLocaleString()} nt
              </span>
            </div>
            <textarea
              className="seq-textarea"
              placeholder={">SequenceName (optional)\nATGCATGCATGCATGC..."}
              value={sequence}
              onChange={(e) => { setSequence(e.target.value); setBlastSequence(e.target.value); if (error) setError(""); }}
              rows={10}
              disabled={phase === "submitting" || phase === "polling"}
              spellCheck={false}
            />
          </div>

          {/* Live sequence preview */}
          <AnimatePresence>
            {sequence.trim().length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                style={{ marginBottom: 14, background: "#020a10", border: "1px solid #0e2540", borderRadius: 6, padding: "12px 14px", maxHeight: 120, overflowY: "auto" }}
              >
                <div style={{ fontFamily: "Orbitron", fontSize: 9, color: "#2a4a6a", letterSpacing: "0.1em", marginBottom: 6 }}>SEQUENCE PREVIEW</div>
                <ColorSeq seq={sequence.replace(/^>.*\n?/m, "")} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Program + database */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 6 }}>BLAST PROGRAM</div>
              <select
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                className="blast-select"
                disabled={phase === "submitting" || phase === "polling"}
              >
                <option value="blastn">blastn — nucleotide</option>
                <option value="megablast">megablast — highly similar</option>
                <option value="dc-megablast">dc-megablast — discontiguous</option>
              </select>
            </div>
            <div>
              <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 6 }}>DATABASE</div>
              <select
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="blast-select"
                disabled={phase === "submitting" || phase === "polling"}
              >
                <option value="nt">nt — NCBI Nucleotide</option>
                <option value="refseq_rna">RefSeq RNA</option>
                <option value="refseq_genomic">RefSeq Genomic</option>
              </select>
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ background: "#1a0008", border: "1px solid #ff224466", borderRadius: 6, padding: "10px 14px", marginBottom: 14 }}
              >
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#ff4455" }}>⚠ {error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            {phase === "idle" || phase === "error" ? (
              <motion.button
                className="submit-blast-btn"
                onClick={handleSubmit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={!sequence.trim()}
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  style={{ display: "inline-block" }}
                >
                  🔬
                </motion.span>
                {" "}SUBMIT BLAST SEARCH
              </motion.button>
            ) : phase === "done" ? (
              <>
                <motion.button
                  className="submit-blast-btn"
                  onClick={handleViewResults}
                  initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                  whileHover={{ scale: 1.03 }}
                >
                  📊 VIEW RESULTS
                </motion.button>
                <button
                  onClick={handleReset}
                  style={{ background: "#060f1a", border: "1px solid #1a3a5c", color: "#4a7a9b", padding: "0 20px", borderRadius: 6, fontFamily: "Orbitron", fontSize: 11, cursor: "pointer" }}
                >
                  NEW SEARCH
                </button>
              </>
            ) : (
              <button
                onClick={() => { clearPoll(); handleReset(); }}
                style={{ background: "#1a0008", border: "1px solid #ff224444", color: "#ff4455", padding: "0 20px", borderRadius: 6, fontFamily: "Orbitron", fontSize: 11, cursor: "pointer" }}
              >
                CANCEL
              </button>
            )}
          </div>
        </div>

        {/* Right: animation panel */}
        <div className="blast-animation-panel">
          <AnimatePresence mode="wait">
            {phase === "idle" && (
              <motion.div
                key="idle-panel"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ fontFamily: "Orbitron", fontSize: 12, color: "#2a4a6a", letterSpacing: "0.2em", marginBottom: 24 }}>SEQUENCE READY</div>
                <DNAHelixAnimation />
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a4a6a", marginTop: 20, lineHeight: 1.6 }}>
                  Enter a nucleotide sequence<br />and submit to begin BLAST analysis
                </div>
              </motion.div>
            )}

            {(phase === "submitting" || phase === "polling") && (
              <motion.div
                key="searching-panel"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ fontFamily: "Orbitron", fontSize: 11, color: "#00d4ff", letterSpacing: "0.2em", marginBottom: 20, textShadow: "0 0 10px #00d4ff" }}>
                  SEARCHING NCBI BLAST
                </div>
                <RadarAnimation progress={progress} />

                {/* Status message */}
                <motion.div
                  key={statusMsg}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ fontFamily: "monospace", fontSize: 12, color: "#4a7a9b", marginTop: 20, marginBottom: 12 }}
                >
                  {statusMsg}
                </motion.div>

                {/* Progress bar */}
                <div style={{ background: "#0e2540", height: 4, borderRadius: 2, overflow: "hidden", margin: "0 auto", maxWidth: 200 }}>
                  <motion.div
                    style={{ height: "100%", background: "linear-gradient(90deg, #00d4ff, #00ff88)", borderRadius: 2 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                {ridLocal && (
                  <div style={{ fontFamily: "monospace", fontSize: 10, color: "#2a4a6a", marginTop: 10 }}>
                    RID: {ridLocal}
                  </div>
                )}

                {/* Scrolling sequence ticker */}
                <div style={{ overflow: "hidden", width: "100%", maxWidth: 220, margin: "20px auto 0", background: "#020a10", borderRadius: 4, padding: "8px 12px" }}>
                  <motion.div
                    style={{ fontFamily: "monospace", fontSize: 10, whiteSpace: "nowrap" }}
                    animate={{ x: [0, -300] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  >
                    {"ATGCTAGCTAGCTAGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC".split("").map((c, i) => (
                      <span key={i} style={{ color: c === "A" ? "#00d4ff" : c === "T" ? "#bd00ff" : c === "G" ? "#00ff88" : "#ffaa00" }}>{c}</span>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            )}

            {phase === "done" && (
              <motion.div
                key="done-panel"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: "center" }}
              >
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.6, repeat: 2 }}
                  style={{ fontSize: 64, marginBottom: 20 }}
                >
                  ✅
                </motion.div>
                <div style={{ fontFamily: "Orbitron", fontSize: 16, color: "#00ff88", textShadow: "0 0 20px #00ff88", marginBottom: 12 }}>
                  ANALYSIS COMPLETE
                </div>
                <p style={{ fontFamily: "monospace", fontSize: 12, color: "#4a7a9b", lineHeight: 1.6, marginBottom: 24 }}>
                  BLAST search finished successfully.<br />
                  View your results to see alignment matches,<br />
                  viral similarity scoring, and vaccine cross-reference.
                </p>
                <motion.button
                  className="submit-blast-btn"
                  onClick={handleViewResults}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                >
                  📊 VIEW FULL RESULTS →
                </motion.button>
              </motion.div>
            )}

            {phase === "error" && (
              <motion.div
                key="error-panel"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ textAlign: "center" }}
              >
                <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
                <div style={{ fontFamily: "Orbitron", fontSize: 14, color: "#ff4455", marginBottom: 12 }}>SEARCH FAILED</div>
                <p style={{ fontFamily: "monospace", fontSize: 12, color: "#4a7a9b", lineHeight: 1.6 }}>
                  {error || "An error occurred during BLAST search."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
