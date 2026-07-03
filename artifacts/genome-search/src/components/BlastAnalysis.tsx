import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeSequence } from "@/lib/sequenceAnalysis";
import type { SequenceStats } from "@/lib/sequenceAnalysis";
import { computeSimilarityAnalysis } from "@/lib/clinicalKnowledge";
import { useApp } from "@/App";

interface BlastHit {
  accession: string;
  title: string;
  score: number;
  evalue: string;
  identity: number;
}

interface PollResult {
  status: "waiting" | "done" | "failed";
  hits?: BlastHit[];
}

function BaseCompositionGrid({ stats }: { stats: SequenceStats }) {
  const bases = [
    { base: "A", count: stats.composition["A"] || 0, color: "#00d4ff" },
    { base: "T", count: stats.composition["T"] || 0, color: "#bd00ff" },
    { base: "G", count: stats.composition["G"] || 0, color: "#00ff88" },
    { base: "C", count: stats.composition["C"] || 0, color: "#ffaa00" },
  ].map((b) => ({ ...b, pct: stats.length > 0 ? (b.count / stats.length) * 100 : 0 }));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
      {bases.map(({ base, pct, color }) => (
        <div key={base}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <span style={{ fontFamily: "monospace", fontSize: 11, color }}>{base}</span>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a7a9b" }}>{pct.toFixed(1)}%</span>
          </div>
          <div style={{ height: 3, background: "#0e2540", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ height: "100%", background: color, borderRadius: 2 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const RISK_COLORS: Record<string, string> = {
  "Very Close": "#00ff88",
  "Close": "#00d4ff",
  "Moderate": "#ffaa00",
  "Distant": "#ff6600",
  "Very Distant": "#ff2244",
};

function ViralPotentialGauge({ score }: { score: number }) {
  const color = score >= 75 ? "#ff2244" : score >= 50 ? "#ff6600" : score >= 30 ? "#ffaa00" : "#00ff88";
  const r = 70;
  const circ = Math.PI * r; // half circle
  const arc = (score / 100) * circ;

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="200" height="110" viewBox="0 0 200 110">
        {/* Background arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#0e2540"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - arc }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const angle = (pct / 100) * Math.PI;
          const x = 100 - 80 * Math.cos(angle);
          const y = 100 - 80 * Math.sin(angle);
          const lx = 100 - 66 * Math.cos(angle);
          const ly = 100 - 66 * Math.sin(angle);
          return (
            <g key={pct}>
              <line x1={x} y1={y} x2={lx} y2={ly} stroke="#1a3a5c" strokeWidth={1.5} />
              <text x={100 - 54 * Math.cos(angle)} y={100 - 54 * Math.sin(angle)} fill="#2a4a6a" fontSize={8} textAnchor="middle" fontFamily="monospace">{pct}</text>
            </g>
          );
        })}
        {/* Score text */}
        <text x="100" y="78" fill={color} fontSize="32" fontWeight="800" textAnchor="middle" fontFamily="Orbitron, sans-serif" style={{ filter: `drop-shadow(0 0 10px ${color})` }}>
          {score}
        </text>
        <text x="100" y="92" fill="#4a7a9b" fontSize="10" textAnchor="middle" fontFamily="monospace">%</text>
      </svg>
      <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.15em", marginTop: -4 }}>VIRAL POTENTIAL SCORE</div>
      <div style={{
        fontFamily: "Orbitron", fontSize: 12, fontWeight: 700, marginTop: 4,
        color, textShadow: `0 0 12px ${color}`,
        background: `${color}14`, border: `1px solid ${color}33`,
        padding: "3px 16px", borderRadius: 20,
      }}>
        {score >= 80 ? "CRITICAL MATCH" : score >= 60 ? "HIGH SIMILARITY" : score >= 40 ? "MODERATE MATCH" : score >= 20 ? "LOW SIMILARITY" : "MINIMAL MATCH"}
      </div>
    </div>
  );
}

function HitRow({ hit, index, expanded }: { hit: BlastHit; index: number; expanded: boolean }) {
  const identColor = hit.identity >= 90 ? "#00ff88" : hit.identity >= 70 ? "#00d4ff" : hit.identity >= 50 ? "#ffaa00" : "#ff6600";
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      style={{
        background: "linear-gradient(135deg, #060f1a 0%, #081422 100%)",
        border: `1px solid ${index === 0 ? "#00d4ff33" : "#1a3a5c"}`,
        borderRadius: 8,
        padding: "14px 16px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {index === 0 && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #00d4ff88, transparent)" }} />
      )}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Rank badge */}
        <div style={{
          width: 32, height: 32, borderRadius: 4, flexShrink: 0,
          background: index === 0 ? "#00d4ff14" : "#0e2540",
          border: `1px solid ${index === 0 ? "#00d4ff44" : "#1a3a5c"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "Orbitron", fontWeight: 800, fontSize: 12,
          color: index === 0 ? "#00d4ff" : "#2a4a6a",
        }}>
          #{index + 1}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div style={{
            fontFamily: "monospace", fontSize: 12, color: "#90c4d8",
            lineHeight: 1.4, marginBottom: 6,
            overflow: expanded ? "visible" : "hidden",
            textOverflow: expanded ? "clip" : "ellipsis",
            whiteSpace: expanded ? "normal" : "nowrap",
          }}>
            {hit.title || hit.accession}
          </div>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#00d4ff", marginBottom: 8 }}>
            ACC: {hit.accession}
          </div>

          {/* Identity bar */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2a4a6a" }}>IDENTITY</span>
              <span style={{ fontFamily: "Orbitron", fontSize: 11, fontWeight: 700, color: identColor }}>
                {hit.identity}%
              </span>
            </div>
            <div style={{ height: 4, background: "#0e2540", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${hit.identity}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.05 }}
                style={{ height: "100%", background: `linear-gradient(90deg, ${identColor}66, ${identColor})`, borderRadius: 2 }}
              />
            </div>
          </div>

          {/* Score + E-value */}
          <div style={{ display: "flex", gap: 16 }}>
            <div>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2a4a6a" }}>SCORE </span>
              <span style={{ fontFamily: "Orbitron", fontSize: 11, fontWeight: 700, color: "#00d4ff" }}>{hit.score}</span>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2a4a6a" }}> bits</span>
            </div>
            <div>
              <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2a4a6a" }}>E-VALUE </span>
              <span style={{ fontFamily: "Orbitron", fontSize: 11, color: "#bd00ff" }}>{hit.evalue}</span>
            </div>
          </div>
        </div>

        {/* NCBI link */}
        <a
          href={`https://www.ncbi.nlm.nih.gov/nuccore/${hit.accession}`}
          target="_blank" rel="noopener noreferrer"
          style={{
            background: "#0e2540", border: "1px solid #1a3a5c", color: "#4a7a9b",
            padding: "6px 10px", borderRadius: 4, fontFamily: "monospace",
            fontSize: 10, textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          NCBI ↗
        </a>
      </div>
    </motion.div>
  );
}

export function BlastAnalysis() {
  const { blastRid, blastSequence, blastTarget, setActiveTab } = useApp();
  const [hits, setHits] = useState<BlastHit[]>([]);
  const [polling, setPolling] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [showAllHits, setShowAllHits] = useState(false);
  const [statusMsg, setStatusMsg] = useState("Waiting for BLAST results...");
  const [expandedHit, setExpandedHit] = useState<number | null>(null);

  const stats = blastSequence ? analyzeSequence(blastSequence) : null;
  const similarity = computeSimilarityAnalysis(hits);

  useEffect(() => {
    if (!blastRid) return;
    setDone(false);
    setHits([]);
    setError("");
    setPolling(true);

    const msgs = [
      "Querying NCBI BLAST results...",
      "Fetching alignment data...",
      "Processing hit metadata...",
    ];
    let tick = 0;

    const poll = async () => {
      if (done) return;
      setStatusMsg(msgs[tick % msgs.length]);
      tick++;
      try {
        const res = await fetch(`/api/blast/results?rid=${encodeURIComponent(blastRid)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PollResult = await res.json();
        if (data.status === "done") {
          setHits(data.hits || []);
          setDone(true);
          setPolling(false);
        } else if (data.status === "failed") {
          setError("BLAST search failed on NCBI side.");
          setPolling(false);
        }
      } catch {
        // keep polling
      }
    };

    const interval = setInterval(poll, 5000);
    poll();
    return () => clearInterval(interval);
  }, [blastRid]);

  const visibleHits = showAllHits ? hits : hits.slice(0, 5);

  if (!blastRid) {
    return (
      <div className="results-page">
        <div style={{ textAlign: "center", padding: "100px 20px" }}>
          <motion.div
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ fontSize: 72, marginBottom: 24 }}
          >
            🔬
          </motion.div>
          <div style={{ fontFamily: "Orbitron", fontSize: 18, color: "#2a4a6a", marginBottom: 12 }}>No BLAST Job Active</div>
          <p style={{ fontFamily: "monospace", fontSize: 14, color: "#2a4a6a", lineHeight: 1.7, marginBottom: 24 }}>
            Navigate to the BLAST Search tab and submit a nucleotide sequence to begin analysis.
          </p>
          <motion.button
            className="submit-blast-btn"
            onClick={() => setActiveTab("blast")}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            🔬 GO TO BLAST SEARCH
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="results-page">
      {/* Header */}
      <div className="results-header">
        <div>
          <h2 className="results-title">BLAST Analysis Results</h2>
          <p style={{ fontFamily: "monospace", fontSize: 13, color: "#4a7a9b", marginTop: 4 }}>
            {blastTarget ? `Analyzing: ${blastTarget.name}` : `RID: ${blastRid}`}
          </p>
        </div>
        <button
          onClick={() => setActiveTab("blast")}
          style={{ background: "#060f1a", border: "1px solid #1a3a5c", color: "#4a7a9b", padding: "8px 18px", borderRadius: 6, fontFamily: "Orbitron", fontSize: 11, cursor: "pointer" }}
        >
          ← NEW SEARCH
        </button>
      </div>

      {/* Polling state */}
      <AnimatePresence>
        {polling && !done && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ background: "#060f1a", border: "1px solid #00d4ff22", borderRadius: 8, padding: "16px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ width: 20, height: 20, border: "2px solid #0e2540", borderTopColor: "#00d4ff", borderRadius: "50%", flexShrink: 0 }}
            />
            <div>
              <div style={{ fontFamily: "Orbitron", fontSize: 11, color: "#00d4ff", marginBottom: 3 }}>SEARCHING...</div>
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a7a9b" }}>{statusMsg}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div style={{ background: "#1a0008", border: "1px solid #ff224466", borderRadius: 8, padding: "14px 18px", marginBottom: 24 }}>
          <span style={{ fontFamily: "monospace", fontSize: 12, color: "#ff4455" }}>⚠ {error}</span>
        </div>
      )}

      {done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Summary row */}
          <div className="results-summary-grid">
            {/* Viral potential gauge */}
            <div className="summary-card" style={{ gridColumn: "1 / -1" }}>
              <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap", justifyContent: "space-around" }}>
                <ViralPotentialGauge score={similarity.viralPotential} />
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontFamily: "Orbitron", fontSize: 11, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 14 }}>SIMILARITY INTELLIGENCE</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <InfoCell label="MATCHED FAMILY" value={similarity.matchedFamily} color="#bd00ff" />
                    <InfoCell label="PHYLOGENETIC DISTANCE" value={similarity.phylogeneticDistance} color={RISK_COLORS[similarity.phylogeneticDistance] || "#888"} />
                    <InfoCell label="TOTAL HITS" value={`${hits.length} alignments`} color="#00d4ff" />
                    <InfoCell label="TOP IDENTITY" value={hits.length > 0 ? `${hits[0].identity}%` : "N/A"} color="#00ff88" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sequence stats */}
            {stats && (
              <div className="summary-card">
                <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 14 }}>SEQUENCE COMPOSITION</div>
                <BaseCompositionGrid stats={stats} />
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid #0e2540" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a7a9b" }}>Length</span>
                  <span style={{ fontFamily: "Orbitron", fontSize: 11, color: "#00d4ff" }}>{stats.length.toLocaleString()} nt</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "#4a7a9b" }}>GC content</span>
                  <span style={{ fontFamily: "Orbitron", fontSize: 11, color: "#00ff88" }}>{stats.gcContent.toFixed(1)}%</span>
                </div>
              </div>
            )}

            {/* Predicted symptoms */}
            <div className="summary-card">
              <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 14 }}>
                PREDICTED SYMPTOMS <span style={{ color: "#2a4a6a" }}>(based on top matches)</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {similarity.predictedSymptoms.map((s, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    style={{
                      background: "#1a0a00", border: "1px solid #ff660033",
                      color: "#ff8844", padding: "4px 10px", borderRadius: 20,
                      fontFamily: "monospace", fontSize: 11,
                    }}
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
            </div>
          </div>

          {/* Vaccine cross-reference */}
          {similarity.crossVaccines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="summary-card"
              style={{ marginBottom: 24 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 20 }}>💉</span>
                <div style={{ fontFamily: "Orbitron", fontSize: 11, color: "#4a7a9b", letterSpacing: "0.15em" }}>
                  VACCINE SCENARIOS FROM SIMILAR STRANDS
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {similarity.crossVaccines.map((v, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    style={{
                      display: "flex", gap: 12, alignItems: "flex-start",
                      background: "#060f1a", border: "1px solid #00ff8822",
                      borderRadius: 6, padding: "10px 14px",
                    }}
                  >
                    <span style={{ color: "#00ff88", flexShrink: 0, marginTop: 1 }}>💉</span>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: "#70a480", lineHeight: 1.5 }}>{v}</span>
                  </motion.div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontFamily: "monospace", fontSize: 10, color: "#2a4a6a", lineHeight: 1.5 }}>
                ⚠ Cross-vaccine applicability is inferred from genetic similarity only. Consult immunologists and reference official WHO/EMA guidance for clinical decisions.
              </div>
            </motion.div>
          )}

          {/* Hit list */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "Orbitron", fontSize: 14, color: "#e0f4ff", marginBottom: 4 }}>
                  SEQUENCE ALIGNMENT HITS
                </div>
                <div style={{ fontFamily: "monospace", fontSize: 12, color: "#4a7a9b" }}>
                  {hits.length} hits returned — sorted by bit score
                </div>
              </div>
              {hits.length > 0 && (
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a4a6a" }}>
                  Top hit: <span style={{ color: "#00ff88" }}>{hits[0]?.identity}% identity</span>
                </div>
              )}
            </div>

            {hits.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", background: "#060f1a", border: "1px solid #1a3a5c", borderRadius: 8 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🔭</div>
                <div style={{ fontFamily: "Orbitron", fontSize: 14, color: "#4a7a9b", marginBottom: 8 }}>No significant alignments found</div>
                <p style={{ fontFamily: "monospace", fontSize: 12, color: "#2a4a6a" }}>
                  Try adjusting E-value threshold, database, or use a longer sequence
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {visibleHits.map((hit, i) => (
                    <div key={hit.accession + i} onClick={() => setExpandedHit(expandedHit === i ? null : i)} style={{ cursor: "pointer" }}>
                      <HitRow hit={hit} index={i} expanded={expandedHit === i} />
                    </div>
                  ))}
                </div>

                {hits.length > 5 && (
                  <motion.div style={{ textAlign: "center", marginTop: 16 }}>
                    <motion.button
                      onClick={() => setShowAllHits(!showAllHits)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        background: showAllHits ? "#1a0010" : "#060f1a",
                        border: `1px solid ${showAllHits ? "#bd00ff44" : "#1a3a5c"}`,
                        color: showAllHits ? "#bd00ff" : "#4a7a9b",
                        padding: "10px 28px",
                        borderRadius: 6,
                        fontFamily: "Orbitron",
                        fontSize: 11,
                        cursor: "pointer",
                        letterSpacing: "0.1em",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <motion.span
                        animate={{ rotate: showAllHits ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        ▼
                      </motion.span>
                      {showAllHits ? `SHOW LESS` : `SHOW ALL ${hits.length} MATCHES`}
                    </motion.button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function InfoCell({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "#050e1a", border: "1px solid #0e2540", borderRadius: 6, padding: "10px 12px" }}>
      <div style={{ fontFamily: "monospace", fontSize: 10, color: "#2a4a6a", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "Orbitron", fontWeight: 700, fontSize: 12, color, textShadow: `0 0 8px ${color}66` }}>{value}</div>
    </div>
  );
}
