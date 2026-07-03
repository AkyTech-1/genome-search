export interface SequenceStats {
  length: number;
  gcContent: number;
  atContent: number;
  composition: Record<string, number>;
  type: "DNA" | "RNA" | "Protein" | "Unknown";
  isValid: boolean;
  entropy: number;
  cpgIslands: number;
}

export function analyzeSequence(raw: string): SequenceStats {
  const seq = raw.replace(/\s/g, "").replace(/^>.*$/m, "").replace(/\s/g, "").toUpperCase();

  if (!seq) {
    return {
      length: 0,
      gcContent: 0,
      atContent: 0,
      composition: {},
      type: "Unknown",
      isValid: false,
      entropy: 0,
      cpgIslands: 0,
    };
  }

  const counts: Record<string, number> = {};
  for (const ch of seq) {
    counts[ch] = (counts[ch] || 0) + 1;
  }

  const total = seq.length;
  const g = counts["G"] || 0;
  const c = counts["C"] || 0;
  const a = counts["A"] || 0;
  const t = counts["T"] || 0;
  const u = counts["U"] || 0;

  const isRNA = u > 0 && t === 0;
  const isDNA = (a + t + g + c) / total > 0.85;
  const isProtein = !isDNA && !isRNA && /[DEFHIKLMNPQRSVWY]/.test(seq);

  let type: SequenceStats["type"] = "Unknown";
  if (isRNA) type = "RNA";
  else if (isDNA) type = "DNA";
  else if (isProtein) type = "Protein";

  const gcContent = total > 0 ? ((g + c) / total) * 100 : 0;
  const atContent = total > 0 ? ((a + (isRNA ? u : t)) / total) * 100 : 0;

  // Shannon entropy
  let entropy = 0;
  for (const [, count] of Object.entries(counts)) {
    const p = count / total;
    entropy -= p * Math.log2(p);
  }

  // CpG islands (DNA only)
  let cpgIslands = 0;
  if (type === "DNA") {
    const cpgMatches = seq.match(/CG/g);
    cpgIslands = cpgMatches ? cpgMatches.length : 0;
  }

  const validChars = type === "DNA"
    ? /^[ATGCNRYWSKMBDHV]+$/
    : type === "RNA"
    ? /^[AUGCNRYWSKMBDHV]+$/
    : /^[ACDEFGHIKLMNPQRSTVWY*]+$/;

  return {
    length: total,
    gcContent: Math.round(gcContent * 10) / 10,
    atContent: Math.round(atContent * 10) / 10,
    composition: counts,
    type,
    isValid: validChars.test(seq),
    entropy: Math.round(entropy * 100) / 100,
    cpgIslands,
  };
}

export function simpleIdentity(seq1: string, seq2: string): number {
  const s1 = seq1.replace(/\s/g, "").toUpperCase();
  const s2 = seq2.replace(/\s/g, "").toUpperCase();
  const len = Math.min(s1.length, s2.length);
  if (len === 0) return 0;
  let matches = 0;
  for (let i = 0; i < len; i++) {
    if (s1[i] === s2[i]) matches++;
  }
  return Math.round((matches / len) * 100);
}
