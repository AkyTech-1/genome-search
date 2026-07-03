import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useListViruses } from "@workspace/api-client-react";
import type { Virus } from "@workspace/api-client-react";
import { useApp } from "@/App";
import { inferClinicalProfile, getPandemicScore, getVaccineInfo } from "@/lib/clinicalKnowledge";

const RISK_COLOR: Record<string, string> = {
  Critical: "#ff0044",
  High: "#ff6600",
  Medium: "#ffaa00",
  Low: "#00ff88",
};

const GENOME_COLOR: Record<string, string> = {
  "ssRNA(+)": "#00d4ff",
  "ssRNA(-)": "#bd00ff",
  "ssRNA(+) RT": "#ff6644",
  "ssRNA(-) amb": "#ffaa00",
  "dsDNA": "#00ff88",
  "dsDNA RT": "#44ff88",
  "dsRNA": "#ff44aa",
};

function RiskBadge({ risk }: { risk: string }) {
  const color = RISK_COLOR[risk] || "#888";
  return (
    <span style={{
      background: `${color}18`,
      border: `1px solid ${color}55`,
      color,
      padding: "2px 10px",
      borderRadius: 4,
      fontSize: 10,
      fontFamily: "Orbitron, sans-serif",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textShadow: `0 0 8px ${color}88`,
    }}>
      {risk.toUpperCase()}
    </span>
  );
}

function GenomeBadge({ type }: { type: string }) {
  const color = GENOME_COLOR[type] || "#888";
  return (
    <span style={{
      background: `${color}14`,
      border: `1px solid ${color}44`,
      color,
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 10,
      fontFamily: "'Share Tech Mono', monospace",
      letterSpacing: "0.05em",
    }}>
      {type}
    </span>
  );
}

function CircularScore({ score, color, label }: { score: number; color: string; label: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 88, height: 88 }}>
        <svg width="88" height="88" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="44" cy="44" r={r} fill="none" stroke="#0e2540" strokeWidth="6" />
          <motion.circle
            cx="44" cy="44" r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - filled }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
            style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: "Orbitron", fontWeight: 800, fontSize: 18, color, textShadow: `0 0 12px ${color}` }}>
            {score}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#4a7a9b", letterSpacing: "0.05em" }}>/ 100</span>
        </div>
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.08em", textAlign: "center" }}>{label}</span>
    </div>
  );
}

function VaccineCard({ vaccine }: { vaccine: { name: string; type: string; efficacy: number; manufacturer: string; yearApproved: number | null; notes: string } }) {
  const eff = vaccine.efficacy;
  const color = eff >= 90 ? "#00ff88" : eff >= 70 ? "#ffaa00" : eff >= 50 ? "#ff6600" : "#888";
  return (
    <div style={{
      background: "linear-gradient(135deg, #081e38 0%, #0a2040 100%)",
      border: "1px solid #1a3a5c",
      borderRadius: 8,
      padding: "14px 16px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, paddingRight: 12 }}>
          <div style={{ fontFamily: "Orbitron", fontWeight: 700, fontSize: 12, color: "#e0f4ff", marginBottom: 3 }}>{vaccine.name}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#4a7a9b" }}>{vaccine.type}</span>
            <span style={{ color: "#1a3a5c" }}>·</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#4a7a9b" }}>{vaccine.manufacturer}</span>
            {vaccine.yearApproved && <><span style={{ color: "#1a3a5c" }}>·</span><span style={{ fontFamily: "monospace", fontSize: 10, color: "#4a7a9b" }}>Approved {vaccine.yearApproved}</span></>}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontFamily: "Orbitron", fontWeight: 800, fontSize: 20, color, textShadow: `0 0 10px ${color}` }}>{eff}%</div>
          <div style={{ fontFamily: "monospace", fontSize: 9, color: "#4a7a9b" }}>EFFICACY</div>
        </div>
      </div>
      {/* Efficacy bar */}
      <div style={{ height: 3, background: "#0e2540", borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${eff}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 2 }}
        />
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 10, color: "#3a6a8a", lineHeight: 1.5 }}>{vaccine.notes}</div>
    </div>
  );
}

function VirusModal({ virus, onClose }: { virus: Virus; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<"overview" | "clinical" | "vaccines" | "genome">("overview");
  const { setActiveTab: navTo, setBlastTarget, setBlastSequence } = useApp();

  const clinical = inferClinicalProfile(virus.name);
  const pandemicScore = getPandemicScore(virus.name, virus.pandemic_risk);
  const vaccines = getVaccineInfo(virus.name);
  const riskColor = RISK_COLOR[virus.pandemic_risk] || "#888";

  const handleRunBlast = () => {
    setBlastTarget(virus);
    setBlastSequence(virus.fasta_sequence || "");
    navTo("blast");
    onClose();
  };

  const TABS = [
    { id: "overview" as const, label: "Overview" },
    { id: "clinical" as const, label: "Clinical" },
    { id: "vaccines" as const, label: `Vaccines (${vaccines.length || (virus.vaccines?.length ?? 0)})` },
    { id: "genome" as const, label: "Genome" },
  ];

  const displayVaccines = vaccines.length > 0 ? vaccines : (virus.vaccines || []).map(name => ({
    name,
    type: "Unknown" as const,
    efficacy: 75,
    manufacturer: "See literature",
    yearApproved: null,
    notes: "Refer to official prescribing information for details.",
  }));

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-panel"
          initial={{ opacity: 0, scale: 0.92, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 40 }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="modal-header" style={{ borderBottom: `1px solid ${riskColor}33` }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <h2 className="modal-title">{virus.name}</h2>
                <RiskBadge risk={virus.pandemic_risk} />
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4a7a9b" }}>
                  <span style={{ color: "#1a3a5c", marginRight: 4 }}>FAMILY</span> {virus.family}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4a7a9b" }}>
                  <span style={{ color: "#1a3a5c", marginRight: 4 }}>HOST</span> {virus.host}
                </span>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "#4a7a9b" }}>
                  <span style={{ color: "#1a3a5c", marginRight: 4 }}>DISC.</span> {virus.discovery_year}
                </span>
                <GenomeBadge type={virus.genome_type} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <motion.button
                className="blast-cta-btn"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRunBlast}
              >
                <span>🔬</span> Run BLAST
              </motion.button>
              <button className="modal-close-btn" onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Tabs */}
          <div className="modal-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`modal-tab ${activeTab === t.id ? "modal-tab--active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
                {activeTab === t.id && (
                  <motion.div className="modal-tab__bar" layoutId="modal-tab-bar" />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="modal-body">
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div key="ov" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {/* Score row */}
                  <div className="score-row">
                    <CircularScore score={pandemicScore.score} color={riskColor} label="PANDEMIC RISK" />
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontFamily: "Orbitron", fontSize: 11, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 8 }}>DESCRIPTION</div>
                        <p style={{ fontFamily: "monospace", fontSize: 13, color: "#b0d4e8", lineHeight: 1.7 }}>{virus.description}</p>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div className="info-cell">
                          <div className="info-cell__label">GENOME SIZE</div>
                          <div className="info-cell__value" style={{ color: "#00d4ff" }}>{virus.genome_size_kb} kb</div>
                        </div>
                        <div className="info-cell">
                          <div className="info-cell__label">NCBI ACCESSION</div>
                          <div className="info-cell__value" style={{ color: "#00ff88", fontSize: 12 }}>{virus.ncbi_accession}</div>
                        </div>
                        <div className="info-cell" style={{ gridColumn: "1/-1" }}>
                          <div className="info-cell__label">GEOGRAPHIC DISTRIBUTION</div>
                          <div className="info-cell__value" style={{ color: "#ffaa00", fontSize: 12 }}>{virus.geographic_distribution}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Risk factors */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{ fontFamily: "Orbitron", fontSize: 11, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 10 }}>PANDEMIC RISK FACTORS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {pandemicScore.factors.map((f, i) => (
                        <span key={i} style={{
                          background: `${riskColor}14`,
                          border: `1px solid ${riskColor}33`,
                          color: riskColor,
                          padding: "4px 12px",
                          borderRadius: 20,
                          fontFamily: "monospace",
                          fontSize: 11,
                        }}>⚠ {f}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 16 }}>
                    <div className="info-cell">
                      <div className="info-cell__label">R₀ (BASIC REPRODUCTION)</div>
                      <div className="info-cell__value" style={{ color: "#bd00ff", fontSize: 12 }}>{pandemicScore.r0}</div>
                    </div>
                    <div className="info-cell">
                      <div className="info-cell__label">IFR (INFECTION FATALITY)</div>
                      <div className="info-cell__value" style={{ color: "#ff4444", fontSize: 12 }}>{pandemicScore.ifr}</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "clinical" && (
                <motion.div key="cl" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="clinical-grid">
                    <div>
                      <SectionHead label="SYMPTOMS" />
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {(virus.symptoms?.length ? virus.symptoms : clinical.symptoms).map((s, i) => (
                          <span key={i} className="symptom-chip">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionHead label="TRANSMISSION ROUTES" />
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {(virus.transmission?.length ? virus.transmission : clinical.transmission).map((t, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ color: "#ff6600", marginTop: 2, flexShrink: 0 }}>▸</span>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#90c4d8", lineHeight: 1.5 }}>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionHead label="TREATMENT" />
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {clinical.treatment.map((t, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                            <span style={{ color: "#00d4ff", marginTop: 2, flexShrink: 0 }}>◆</span>
                            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#90c4d8", lineHeight: 1.5 }}>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <SectionHead label="KEY METRICS" />
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <div className="info-cell">
                          <div className="info-cell__label">MORTALITY RATE</div>
                          <div className="info-cell__value" style={{ color: "#ff4444", fontSize: 12 }}>{virus.mortality_rate || clinical.cfr}</div>
                        </div>
                        <div className="info-cell">
                          <div className="info-cell__label">INCUBATION PERIOD</div>
                          <div className="info-cell__value" style={{ color: "#ffaa00", fontSize: 12 }}>{clinical.incubation}</div>
                        </div>
                        <div className="info-cell">
                          <div className="info-cell__label">SEVERITY CLASS</div>
                          <div className="info-cell__value" style={{ color: riskColor, fontSize: 12 }}>{clinical.severity}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {clinical.notes && (
                    <div style={{ marginTop: 16, background: "#050e1a", border: "1px solid #1a3a5c", borderRadius: 8, padding: "12px 16px" }}>
                      <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#ffaa00", letterSpacing: "0.1em", marginBottom: 6 }}>⚠ CLINICAL NOTES</div>
                      <p style={{ fontFamily: "monospace", fontSize: 12, color: "#8ab4cc", lineHeight: 1.6 }}>{clinical.notes}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "vaccines" && (
                <motion.div key="vx" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  {displayVaccines.length > 0 ? (
                    <>
                      <div style={{ fontFamily: "Orbitron", fontSize: 11, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 16 }}>
                        {displayVaccines.length} VACCINE{displayVaccines.length > 1 ? "S" : ""} ON RECORD
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {displayVaccines.map((v, i) => (
                          <VaccineCard key={i} vaccine={v} />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "60px 20px" }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
                      <div style={{ fontFamily: "Orbitron", fontSize: 14, color: "#ff6600", marginBottom: 8 }}>NO LICENSED VACCINE</div>
                      <p style={{ fontFamily: "monospace", fontSize: 13, color: "#4a7a9b", lineHeight: 1.6 }}>
                        No commercially approved vaccine exists for {virus.name}.<br />
                        Research and development may be ongoing — check WHO/NIH pipelines.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "genome" && (
                <motion.div key="ge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div style={{ marginBottom: 16 }}>
                    <SectionHead label="FASTA SEQUENCE (REPRESENTATIVE)" />
                    <div style={{
                      background: "#020a10",
                      border: "1px solid #0e2540",
                      borderRadius: 8,
                      padding: "16px",
                      fontFamily: "'Share Tech Mono', monospace",
                      fontSize: 11,
                      lineHeight: 1.8,
                      wordBreak: "break-all",
                      maxHeight: 280,
                      overflowY: "auto",
                      color: "#4a7a9b",
                      position: "relative",
                    }}>
                      {(virus.fasta_sequence || "No sequence available").split("").map((ch, i) => {
                        const c = ch === "A" ? "#00d4ff" : ch === "T" ? "#bd00ff" : ch === "G" ? "#00ff88" : ch === "C" ? "#ffaa00" : ch === ">" || ch === "\n" ? "#ff6600" : "#4a7a9b";
                        return <span key={i} style={{ color: ch === "\n" ? "transparent" : c }}>{ch === "\n" ? "\n" : ch}</span>;
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                      <button
                        onClick={() => navigator.clipboard?.writeText(virus.fasta_sequence || "")}
                        style={{
                          background: "#0e2540", border: "1px solid #1a3a5c", color: "#4a7a9b",
                          padding: "6px 14px", borderRadius: 4, fontFamily: "monospace", fontSize: 11, cursor: "pointer",
                        }}
                      >
                        📋 Copy FASTA
                      </button>
                      <motion.button
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        onClick={handleRunBlast}
                        style={{
                          background: "linear-gradient(135deg, #003a5a, #005a8a)",
                          border: "1px solid #00d4ff44",
                          color: "#00d4ff",
                          padding: "6px 16px",
                          borderRadius: 4,
                          fontFamily: "Orbitron, sans-serif",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          letterSpacing: "0.1em",
                        }}
                      >
                        🔬 BLAST THIS SEQUENCE
                      </motion.button>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div className="info-cell">
                      <div className="info-cell__label">GENOME TYPE</div>
                      <div style={{ marginTop: 4 }}><GenomeBadge type={virus.genome_type} /></div>
                    </div>
                    <div className="info-cell">
                      <div className="info-cell__label">GENOME SIZE</div>
                      <div className="info-cell__value" style={{ color: "#00d4ff" }}>{virus.genome_size_kb} kb</div>
                    </div>
                    <div className="info-cell">
                      <div className="info-cell__label">NCBI ACCESSION</div>
                      <a
                        href={`https://www.ncbi.nlm.nih.gov/nuccore/${virus.ncbi_accession}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 12, textDecoration: "none" }}
                      >
                        {virus.ncbi_accession} ↗
                      </a>
                    </div>
                  </div>
                  {/* Genome composition bar */}
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.1em", marginBottom: 8 }}>NUCLEOTIDE LEGEND</div>
                    <div style={{ display: "flex", gap: 20 }}>
                      {[["A", "#00d4ff"], ["T", "#bd00ff"], ["G", "#00ff88"], ["C", "#ffaa00"]].map(([b, c]) => (
                        <div key={b} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 12, height: 12, background: c, borderRadius: 2 }} />
                          <span style={{ fontFamily: "monospace", fontSize: 12, color: c }}>{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <div style={{ fontFamily: "Orbitron", fontSize: 10, color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: 10, paddingBottom: 6, borderBottom: "1px solid #0e2540" }}>
      {label}
    </div>
  );
}

function VirusCard({ virus, onClick }: { virus: Virus; onClick: () => void }) {
  const riskColor = RISK_COLOR[virus.pandemic_risk] || "#888";
  const { setBlastTarget, setBlastSequence, setActiveTab } = useApp();

  const handleBlastClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBlastTarget(virus);
    setBlastSequence(virus.fasta_sequence || "");
    setActiveTab("blast");
  };

  return (
    <motion.div
      className="virus-card"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{ "--risk-color": riskColor } as React.CSSProperties}
      layout
    >
      {/* Top accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${riskColor}88, ${riskColor}22, transparent)`, marginBottom: 0 }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700, fontSize: 14, color: "#e0f4ff", marginBottom: 4, lineHeight: 1.3 }}>
              {virus.name}
            </h3>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4a7a9b" }}>{virus.family}</div>
          </div>
          <RiskBadge risk={virus.pandemic_risk} />
        </div>

        {/* Genome type + host */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <GenomeBadge type={virus.genome_type} />
          <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2a5a7a", display: "flex", alignItems: "center" }}>
            HOST: <span style={{ color: "#4a8aa0", marginLeft: 4 }}>{virus.host.split(",")[0].trim()}</span>
          </span>
        </div>

        {/* Description preview */}
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#3a6a8a", lineHeight: 1.5, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {virus.description}
        </p>

        {/* Genome size bar */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2a4a6a" }}>GENOME SIZE</span>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#4a7a9b" }}>{virus.genome_size_kb} kb</span>
          </div>
          <div style={{ height: 3, background: "#0e2540", borderRadius: 2, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (virus.genome_size_kb / 250) * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ height: "100%", background: `linear-gradient(90deg, ${riskColor}66, ${riskColor})` }}
            />
          </div>
        </div>

        {/* Vaccine count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, color: "#2a5a7a" }}>
            <span style={{ color: virus.vaccines?.length ? "#00ff88" : "#ff4444", marginRight: 6 }}>
              {virus.vaccines?.length ? "✓" : "✗"}
            </span>
            {virus.vaccines?.length ? `${virus.vaccines.length} vaccine${virus.vaccines.length > 1 ? "s" : ""}` : "No vaccine"}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#2a5a7a" }}>{virus.discovery_year}</span>
          </div>
        </div>
      </div>

      {/* Hover actions */}
      <div className="virus-card__actions">
        <span className="virus-card__detail-hint">Click for details</span>
        <motion.button
          className="virus-card__blast-btn"
          onClick={handleBlastClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          🔬 BLAST
        </motion.button>
      </div>
    </motion.div>
  );
}

export function DatabaseBrowser() {
  const { data: viruses = [], isLoading } = useListViruses();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [familyFilter, setFamilyFilter] = useState("All");
  const [genomeFilter, setGenomeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("risk");
  const [selectedVirus, setSelectedVirus] = useState<Virus | null>(null);

  const families = useMemo(() => {
    const s = new Set<string>();
    viruses.forEach((v) => s.add(v.family));
    return ["All", ...Array.from(s).sort()];
  }, [viruses]);

  const genomeTypes = useMemo(() => {
    const s = new Set<string>();
    viruses.forEach((v) => s.add(v.genome_type));
    return ["All", ...Array.from(s).sort()];
  }, [viruses]);

  const filtered = useMemo(() => {
    const RISK_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    let list = [...viruses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((v) =>
        v.name.toLowerCase().includes(q) ||
        v.family.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.host.toLowerCase().includes(q)
      );
    }
    if (riskFilter !== "All") list = list.filter((v) => v.pandemic_risk === riskFilter);
    if (familyFilter !== "All") list = list.filter((v) => v.family === familyFilter);
    if (genomeFilter !== "All") list = list.filter((v) => v.genome_type === genomeFilter);

    if (sortBy === "risk") list.sort((a, b) => (RISK_ORDER[a.pandemic_risk] ?? 4) - (RISK_ORDER[b.pandemic_risk] ?? 4));
    else if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "year") list.sort((a, b) => a.discovery_year - b.discovery_year);
    else if (sortBy === "genome") list.sort((a, b) => b.genome_size_kb - a.genome_size_kb);

    return list;
  }, [viruses, search, riskFilter, familyFilter, genomeFilter, sortBy]);

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{ width: 48, height: 48, border: "3px solid #0e2540", borderTopColor: "#00d4ff", borderRadius: "50%" }}
        />
      </div>
    );
  }

  return (
    <div className="db-browser">
      {/* Filters bar */}
      <div className="db-filters">
        {/* Search */}
        <div className="db-search">
          <span className="db-search__icon">🔍</span>
          <input
            className="db-search__input"
            placeholder="Search viruses, families, hosts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "#4a7a9b", cursor: "pointer", fontSize: 14, padding: "0 8px" }}>✕</button>
          )}
        </div>

        {/* Filter controls */}
        <div className="db-filter-row">
          <Select label="Risk" value={riskFilter} onChange={setRiskFilter} options={["All", "Critical", "High", "Medium", "Low"]} />
          <Select label="Family" value={familyFilter} onChange={setFamilyFilter} options={families} />
          <Select label="Genome" value={genomeFilter} onChange={setGenomeFilter} options={genomeTypes} />
          <Select label="Sort" value={sortBy} onChange={setSortBy} options={[
            { value: "risk", label: "By Risk" },
            { value: "name", label: "By Name" },
            { value: "year", label: "By Year" },
            { value: "genome", label: "By Genome Size" },
          ]} />
        </div>

        {/* Result count */}
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "#2a5a7a", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#00d4ff" }}>{filtered.length}</span>
          <span>/ {viruses.length} pathogens</span>
        </div>
      </div>

      {/* Card grid */}
      <div className="virus-grid">
        <AnimatePresence mode="popLayout">
          {filtered.map((virus, i) => (
            <motion.div
              key={virus.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25, delay: Math.min(i * 0.02, 0.4) }}
              layout
            >
              <VirusCard virus={virus} onClick={() => setSelectedVirus(virus)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔭</div>
          <div style={{ fontFamily: "Orbitron", fontSize: 16, color: "#4a7a9b", marginBottom: 8 }}>No pathogens found</div>
          <p style={{ fontFamily: "monospace", fontSize: 13, color: "#2a4a6a" }}>Try adjusting your search or filters</p>
        </div>
      )}

      {/* Virus detail modal */}
      <AnimatePresence>
        {selectedVirus && <VirusModal virus={selectedVirus} onClose={() => setSelectedVirus(null)} />}
      </AnimatePresence>
    </div>
  );
}

function Select({
  label, value, onChange, options
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[] | { value: string; label: string }[];
}) {
  const normalized = options.map((o) => typeof o === "string" ? { value: o, label: o } : o);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2a4a6a", letterSpacing: "0.05em" }}>{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#060f1a",
          border: "1px solid #1a3a5c",
          color: "#00d4ff",
          padding: "6px 10px",
          borderRadius: 4,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 11,
          cursor: "pointer",
          outline: "none",
        }}
      >
        {normalized.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
