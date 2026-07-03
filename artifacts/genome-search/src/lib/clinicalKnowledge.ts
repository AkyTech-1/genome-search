export interface VaccineInfo {
  name: string;
  type: "Live-attenuated" | "Inactivated" | "Subunit" | "mRNA" | "Viral vector" | "DNA" | "Experimental" | "None";
  efficacy: number; // 0–100
  manufacturer: string;
  yearApproved: number | null;
  notes: string;
}

export interface ClinicalProfile {
  transmission: string[];
  incubation: string;
  symptoms: string[];
  severity: "Mild" | "Moderate" | "Severe" | "Highly Severe";
  treatment: string[];
  prevention: string[];
  cfr: string;
  notes: string;
  vaccines: VaccineInfo[];
}

export interface PandemicScore {
  score: number;
  level: "Low" | "Moderate" | "Elevated" | "High" | "Critical";
  factors: string[];
  r0: string;
  ifr: string;
}

export interface SimilarityResult {
  viralPotential: number;
  matchedFamily: string;
  crossVaccines: string[];
  predictedSymptoms: string[];
  phylogeneticDistance: "Very Close" | "Close" | "Moderate" | "Distant" | "Very Distant";
}

const VACCINE_DB: Record<string, VaccineInfo[]> = {
  "SARS-CoV-2": [
    { name: "Pfizer-BioNTech (BNT162b2)", type: "mRNA", efficacy: 95, manufacturer: "Pfizer/BioNTech", yearApproved: 2021, notes: "First FDA-approved mRNA vaccine; requires ultra-cold storage" },
    { name: "Moderna (mRNA-1273)", type: "mRNA", efficacy: 94, manufacturer: "Moderna", yearApproved: 2022, notes: "Slightly higher dose; strong booster response" },
    { name: "Johnson & Johnson (Ad26.COV2.S)", type: "Viral vector", efficacy: 66, manufacturer: "J&J/Janssen", yearApproved: 2021, notes: "Single-dose; associated with rare thrombosis (TTS)" },
    { name: "AstraZeneca (ChAdOx1)", type: "Viral vector", efficacy: 76, manufacturer: "AstraZeneca/Oxford", yearApproved: 2021, notes: "Widely distributed globally; paused in some countries due to rare clotting events" },
    { name: "Novavax (NVX-CoV2373)", type: "Subunit", efficacy: 90, manufacturer: "Novavax", yearApproved: 2022, notes: "Protein subunit with Matrix-M adjuvant; traditional vaccine technology" },
  ],
  "Influenza A (H1N1)": [
    { name: "Seasonal Influenza (Quadrivalent)", type: "Inactivated", efficacy: 60, manufacturer: "Multiple", yearApproved: 1945, notes: "Reformulated annually; efficacy varies by strain match" },
    { name: "Fluzone High-Dose", type: "Inactivated", efficacy: 72, manufacturer: "Sanofi Pasteur", yearApproved: 2009, notes: "4x antigen dose — recommended for adults 65+" },
    { name: "FluBlok (Recombinant)", type: "Subunit", efficacy: 75, manufacturer: "Sanofi Pasteur", yearApproved: 2013, notes: "Egg-free; higher efficacy in clinical trials vs standard-dose" },
    { name: "FluMist (LAIV)", type: "Live-attenuated", efficacy: 55, manufacturer: "AstraZeneca", yearApproved: 2003, notes: "Intranasal; not recommended for immunocompromised or pregnant" },
  ],
  "Ebola Virus": [
    { name: "Ervebo (rVSV-ZEBOV)", type: "Live-attenuated", efficacy: 100, manufacturer: "Merck", yearApproved: 2019, notes: "First FDA-approved Ebola vaccine; used in ring vaccination; single dose" },
    { name: "Zabdeno + Mvabea", type: "Viral vector", efficacy: 87, manufacturer: "Janssen", yearApproved: 2020, notes: "2-dose heterologous prime-boost regimen; broader coverage" },
  ],
  "Yellow Fever Virus": [
    { name: "YF-VAX (17D)", type: "Live-attenuated", efficacy: 99, manufacturer: "Sanofi", yearApproved: 1937, notes: "Single dose provides lifetime immunity; required for travel to endemic areas" },
  ],
  "Measles Virus": [
    { name: "MMR II", type: "Live-attenuated", efficacy: 97, manufacturer: "Merck", yearApproved: 1971, notes: "2-dose schedule; 97% efficacy; eliminated measles in many countries" },
    { name: "Priorix", type: "Live-attenuated", efficacy: 97, manufacturer: "GSK", yearApproved: 1985, notes: "European formulation; combined measles-mumps-rubella" },
  ],
  "Monkeypox Virus": [
    { name: "JYNNEOS/Imvamune", type: "Live-attenuated", efficacy: 85, manufacturer: "Bavarian Nordic", yearApproved: 2019, notes: "Modified Vaccinia Ankara; non-replicating; 2 doses; approved for smallpox and mpox" },
    { name: "ACAM2000", type: "Live-attenuated", efficacy: 95, manufacturer: "Emergent BioSolutions", yearApproved: 2007, notes: "Replication-competent; more side effects; used in ring vaccination" },
  ],
  "Rabies Virus": [
    { name: "RabAvert (PCEC)", type: "Inactivated", efficacy: 100, manufacturer: "Bavarian Nordic", yearApproved: 1997, notes: "Pre- and post-exposure prophylaxis; 100% effective if given before symptoms" },
    { name: "Rabipur", type: "Inactivated", efficacy: 100, manufacturer: "GSK", yearApproved: 1984, notes: "Purified chick embryo cell; widely used globally" },
    { name: "VERORAB", type: "Inactivated", efficacy: 100, manufacturer: "Sanofi Pasteur", yearApproved: 1985, notes: "Vero cell-derived; used extensively in Asia/Africa" },
  ],
  "Hepatitis B Virus": [
    { name: "Engerix-B", type: "Subunit", efficacy: 95, manufacturer: "GSK", yearApproved: 1989, notes: "Recombinant HBsAg; 3-dose schedule; highly effective" },
    { name: "Heplisav-B", type: "Subunit", efficacy: 95, manufacturer: "Dynavax", yearApproved: 2017, notes: "2-dose schedule with CpG adjuvant; faster protection" },
    { name: "PreHevbrio", type: "Subunit", efficacy: 91, manufacturer: "VBI Vaccines", yearApproved: 2021, notes: "Triple antigen (S, preS1, preS2); especially effective in non-responders" },
  ],
  "Dengue Virus": [
    { name: "Dengvaxia (CYD-TDV)", type: "Live-attenuated", efficacy: 66, manufacturer: "Sanofi Pasteur", yearApproved: 2015, notes: "Only licensed for seropositive individuals aged 9–45; risk of severe dengue in seronegative" },
    { name: "TAK-003 (QDENGa)", type: "Live-attenuated", efficacy: 80, manufacturer: "Takeda", yearApproved: 2022, notes: "Approved EU/Indonesia; safe regardless of prior exposure (ages 4–60)" },
  ],
  "Chikungunya Virus": [
    { name: "IXCHIQ (VLA1553)", type: "Live-attenuated", efficacy: 98, manufacturer: "Valneva", yearApproved: 2023, notes: "First FDA-approved chikungunya vaccine (June 2023); single dose; adults 18+" },
  ],
  "Varicella-Zoster Virus": [
    { name: "Varivax", type: "Live-attenuated", efficacy: 90, manufacturer: "Merck", yearApproved: 1995, notes: "2-dose childhood vaccine; prevents chickenpox; reduces shingles risk" },
    { name: "Shingrix", type: "Subunit", efficacy: 97, manufacturer: "GSK", yearApproved: 2017, notes: "Preferred over Zostavax; >90% efficacy against shingles in adults 50+" },
  ],
  "Poliovirus": [
    { name: "IPV (Salk)", type: "Inactivated", efficacy: 99, manufacturer: "Multiple", yearApproved: 1955, notes: "Gold standard; no reversion risk; injectable; preferred in polio-free countries" },
    { name: "OPV (Sabin)", type: "Live-attenuated", efficacy: 99, manufacturer: "Multiple", yearApproved: 1961, notes: "Oral; low cost; some reversion risk (VDPV); critical for eradication in endemic areas" },
  ],
  "Japanese Encephalitis Virus": [
    { name: "IXIARO (SA14-14-2)", type: "Inactivated", efficacy: 96, manufacturer: "Valneva", yearApproved: 2009, notes: "FDA-approved for travelers; 2-dose series; booster after 1-2 years" },
    { name: "Imojev (ChimeriVax-JE)", type: "Live-attenuated", efficacy: 98, manufacturer: "Sanofi Pasteur", yearApproved: 2010, notes: "Single dose; approved Australia, Southeast Asia" },
  ],
  "Tick-Borne Encephalitis": [
    { name: "FSME-IMMUN", type: "Inactivated", efficacy: 98, manufacturer: "Pfizer", yearApproved: 1976, notes: "3-dose schedule + boosters; available in Europe; prevents TBE encephalitis" },
    { name: "Encepur", type: "Inactivated", efficacy: 98, manufacturer: "Bavarian Nordic", yearApproved: 1994, notes: "Alternative inactivated TBE vaccine; accelerated schedule available" },
  ],
};

const PANDEMIC_SCORES: Record<string, { score: number; r0: string; ifr: string }> = {
  "SARS-CoV-2": { score: 88, r0: "2.5–5 (original); 8–15 (Omicron)", ifr: "0.1–0.5%" },
  "Influenza A (H1N1)": { score: 78, r0: "1.4–1.6 (seasonal); 1.2–3.1 (pandemic)", ifr: "0.02–0.1%" },
  "Influenza A (H5N1)": { score: 94, r0: "<1 (no sustained H-to-H)", ifr: "~60%" },
  "Nipah Virus": { score: 92, r0: "0.5–1.0 (current); pandemic potential if higher", ifr: "40–75%" },
  "Smallpox Virus": { score: 97, r0: "5–7", ifr: "30%" },
  "MERS-CoV": { score: 74, r0: "<1 (community); 2–6 (healthcare)", ifr: "~35%" },
  "Ebola Virus": { score: 65, r0: "1.5–2.5 (epidemic); <1.5 with interventions", ifr: "25–90%" },
  "Marburg Virus": { score: 68, r0: "1.1–1.8", ifr: "24–88%" },
  "Measles Virus": { score: 72, r0: "12–18 (highest known)", ifr: "<0.1% (developed); 5–25% (malnourished)" },
  "Dengue Virus": { score: 55, r0: "2–3 (urban Aedes)", ifr: "<1% (uncomplicated); 2–5% (severe)" },
  "HIV-1": { score: 80, r0: "2–5 (sexual transmission, varies)", ifr: "Near 100% (untreated AIDS)" },
  "COVID-19 Omicron XBB.1.5": { score: 82, r0: "8–15 (immune-evasive)", ifr: "0.05–0.2%" },
  "Highly Path. Avian Influenza H7N9": { score: 88, r0: "<1 (sporadic)", ifr: "~40%" },
  "Chikungunya Virus": { score: 50, r0: "2–6 (Aedes-dependent)", ifr: "<0.1%" },
  "Zika Virus": { score: 52, r0: "1.5–6.6 (Aedes-dependent)", ifr: "<0.1% (adults); severe congenital effects" },
  "Yellow Fever Virus": { score: 60, r0: "2–3 (urban cycle)", ifr: "3–7.5%" },
};

export function getVaccineInfo(virusName: string): VaccineInfo[] {
  if (VACCINE_DB[virusName]) return VACCINE_DB[virusName];

  // Try partial match
  for (const [key, vaccines] of Object.entries(VACCINE_DB)) {
    if (virusName.toLowerCase().includes(key.toLowerCase().split(" ")[0])) {
      return vaccines;
    }
  }
  return [];
}

export function inferClinicalProfile(virusName: string): ClinicalProfile {
  const name = virusName.toLowerCase();
  const vaccines = getVaccineInfo(virusName);

  if (name.includes("ebola") || name.includes("marburg") || name.includes("lujo")) {
    return {
      transmission: ["Direct contact with bodily fluids of infected individuals", "Contaminated needles and medical equipment", "Exposure to infected fruit bats", "Handling infected wildlife/bushmeat"],
      incubation: "2–21 days (average 8–10 days)",
      symptoms: ["Sudden fever (>38°C)", "Severe headache", "Muscle pain", "Weakness", "Vomiting/diarrhea", "Internal and external hemorrhage", "Organ failure", "Shock"],
      severity: "Highly Severe",
      treatment: ["Inpatient intensive supportive care", "IV fluid resuscitation", "Electrolyte management", "Atoltivimab/maftivimab/odesivimab (monoclonal Abs for Ebola)", "Strict isolation protocols"],
      prevention: ["PPE (full isolation gown, gloves, face shield)", "Ring vaccination with approved vaccines", "Contact tracing", "Safe burial practices"],
      cfr: "25–90% (outbreak-dependent)",
      notes: "Strict isolation essential. Healthcare workers at high risk. Safe burial practices critical to prevent transmission.",
      vaccines,
    };
  }

  if (name.includes("influenza") || name.includes("flu") || name.includes("h1n1") || name.includes("h5n1") || name.includes("h7n9")) {
    const avian = name.includes("h5n1") || name.includes("h7n9");
    return {
      transmission: ["Respiratory droplets and aerosols", "Close contact with infected persons", "Fomites (hands to mucous membranes)", avian ? "Direct contact with infected poultry" : "Large respiratory droplets"],
      incubation: "1–4 days (average 2 days)",
      symptoms: ["High fever (38–40°C)", "Cough (often dry)", "Myalgia and arthralgia", "Headache", "Chills and rigors", "Fatigue", "Rhinorrhea", avian ? "Severe pneumonia and ARDS" : "Sore throat"],
      severity: avian ? "Highly Severe" : "Moderate",
      treatment: ["Oseltamivir (Tamiflu) — within 48h of onset", "Zanamivir (Relenza)", "Baloxavir marboxil (Xofluza)", "IV peramivir (severe cases)", "Supportive care"],
      prevention: ["Annual influenza vaccination", "Hand hygiene", "Respiratory etiquette", "Antiviral prophylaxis for exposed high-risk contacts"],
      cfr: avian ? "~60% (H5N1)" : "0.1–1% (seasonal)",
      notes: avian ? "Pandemic potential if sustained H-to-H transmission emerges. Monitor continuously." : "Annual reformulation needed. Vaccine coverage varies year to year.",
      vaccines,
    };
  }

  if (name.includes("coronavirus") || name.includes("sars") || name.includes("mers") || name.includes("covid")) {
    return {
      transmission: ["Airborne aerosols (primary route)", "Respiratory droplets", "Close contact with infected persons", "Fomites (less significant)"],
      incubation: "2–14 days (average 5–6 days for SARS-CoV-2)",
      symptoms: ["Fever and chills", "Cough", "Dyspnea", "Loss of taste/smell", "Fatigue", "Myalgia", "Headache", "GI symptoms (some variants)"],
      severity: "Severe",
      treatment: ["Nirmatrelvir/ritonavir (Paxlovid) — first-line oral antiviral", "Remdesivir (intravenous)", "Dexamethasone (severe hypoxia)", "Baricitinib/Tocilizumab (ICU)", "Supplemental oxygen/ventilation"],
      prevention: ["mRNA vaccination (primary + boosters)", "N95/KN95 respirator use", "Indoor ventilation improvement", "Social distancing during outbreaks"],
      cfr: "0.5–35% (varies: SARS-CoV-2 0.5–2%, MERS ~35%)",
      notes: "Immune evasion is ongoing challenge. Elderly and immunocompromised at highest risk. Long COVID affects 10–20% of recovered patients.",
      vaccines,
    };
  }

  if (name.includes("nipah") || name.includes("hendra") || name.includes("sosuga") || name.includes("langya")) {
    return {
      transmission: ["Direct contact with infected bats (Pteropus fruit bats)", "Consumption of bat-contaminated fruits or date palm sap", "Close human-to-human contact", "Healthcare-acquired infection without PPE"],
      incubation: "4–14 days (up to 45 days in some cases)",
      symptoms: ["Fever and headache", "Myalgia", "Acute encephalitis", "Altered consciousness", "Seizures", "Respiratory distress", "Coma"],
      severity: "Highly Severe",
      treatment: ["Intensive supportive care", "Mechanical ventilation", "Ribavirin (limited efficacy)", "mAb m102.4 (compassionate use — not yet licensed)"],
      prevention: ["Avoid contact with bats and their excreta", "Don't consume raw date palm sap", "Healthcare worker PPE", "Ring control and contact tracing"],
      cfr: "40–75%",
      notes: "WHO R&D Blueprint priority. Broad host tropism and human-to-human transmission capacity make this a pandemic risk pathogen.",
      vaccines,
    };
  }

  if (name.includes("dengue") || name.includes("zika") || name.includes("west nile") || name.includes("yellow fever") || name.includes("chikungunya") || name.includes("encephalitis")) {
    return {
      transmission: ["Aedes aegypti/albopictus mosquito bite (primary)", "Culex mosquito (West Nile)", "Blood transfusion (rare)", "Sexual transmission (Zika only)", "Vertical transmission (rare)"],
      incubation: "3–14 days",
      symptoms: ["High fever", "Severe headache", "Rash (maculopapular)", "Joint/muscle pain", "Conjunctivitis", "Nausea/vomiting", "Retro-orbital pain"],
      severity: "Moderate",
      treatment: ["Supportive care", "Antipyretics (avoid aspirin — bleeding risk with dengue)", "IV fluid resuscitation for severe dengue", "Hospitalization for plasma leakage"],
      prevention: ["Insect repellent (DEET/picaridin)", "Protective clothing", "Mosquito nets", "Eliminating standing water", "Vaccination (where available)"],
      cfr: "1–7% (varies by virus and disease severity)",
      notes: "Climate change is expanding mosquito vectors to higher latitudes. Rising global burden expected.",
      vaccines,
    };
  }

  // Generic fallback
  return {
    transmission: ["Variable — consult current outbreak/surveillance data", "Zoonotic spillover", "Vector-borne (if applicable)"],
    incubation: "Variable (days to weeks)",
    symptoms: ["Fever", "Fatigue and malaise", "Variable systemic manifestations"],
    severity: "Moderate",
    treatment: ["Supportive care", "Pathogen-specific antivirals if available", "Hospitalization for severe cases"],
    prevention: ["Standard infection prevention measures", "Vaccination if available", "Vector control"],
    cfr: "Variable by strain and host health status",
    notes: "Emerging or understudied pathogen. Consult WHO/CDC for current outbreak guidance.",
    vaccines,
  };
}

export function getPandemicScore(virusName: string, pandemicRisk?: string): PandemicScore {
  const stored = PANDEMIC_SCORES[virusName];
  if (stored) {
    return buildScore(stored.score, virusName, stored.r0, stored.ifr);
  }

  const risk = pandemicRisk?.toLowerCase() || "";
  let base = 25;
  if (risk === "critical") base = 88;
  else if (risk === "high") base = 70;
  else if (risk === "medium") base = 50;
  else if (risk === "low") base = 25;

  const name = virusName.toLowerCase();
  if (name.includes("influenza") || name.includes("corona")) base += 8;
  if (name.includes("nipah") || name.includes("ebola") || name.includes("marburg")) base += 5;

  return buildScore(Math.min(99, base), virusName, "Under investigation", "Unknown");
}

function buildScore(score: number, name: string, r0: string, ifr: string): PandemicScore {
  let level: PandemicScore["level"];
  if (score >= 88) level = "Critical";
  else if (score >= 70) level = "High";
  else if (score >= 55) level = "Elevated";
  else if (score >= 35) level = "Moderate";
  else level = "Low";

  const factors: string[] = [];
  const n = name.toLowerCase();
  if (n.includes("corona") || n.includes("influenza")) factors.push("High respiratory transmissibility");
  if (n.includes("nipah") || n.includes("hendra")) factors.push("Broad host tropism — zoonotic spillover risk");
  if (n.includes("ebola") || n.includes("marburg")) factors.push("Extreme case fatality rate");
  if (n.includes("sars") || n.includes("mers")) factors.push("Healthcare amplification potential");
  if (n.includes("h5n1") || n.includes("h7n9") || n.includes("avian")) factors.push("Pandemic influenza reassortment risk");
  if (n.includes("smallpox") || n.includes("variola")) factors.push("Near-zero population immunity", "Bioterrorism concern");
  if (score >= 80) factors.push("Limited global countermeasures");
  if (factors.length === 0) factors.push("Regional outbreak potential", "Vector-dependent spread");

  return { score, level, factors, r0, ifr };
}

export function computeSimilarityAnalysis(hits: Array<{ accession: string; title: string; score: number; identity: number; evalue: string }>): SimilarityResult {
  if (!hits || hits.length === 0) {
    return {
      viralPotential: 0,
      matchedFamily: "Unknown",
      crossVaccines: [],
      predictedSymptoms: [],
      phylogeneticDistance: "Very Distant",
    };
  }

  const topHit = hits[0];
  const avgIdentity = hits.slice(0, 5).reduce((acc, h) => acc + (h.identity || 0), 0) / Math.min(5, hits.length);
  const topScore = topHit.score || 0;

  // Compute viral potential (0–100) based on identity and score
  const identityFactor = Math.min(100, avgIdentity);
  const scoreFactor = Math.min(100, (topScore / 1000) * 100);
  const viralPotential = Math.round((identityFactor * 0.6 + scoreFactor * 0.4));

  // Determine phylogenetic distance
  let phylogeneticDistance: SimilarityResult["phylogeneticDistance"];
  if (avgIdentity >= 95) phylogeneticDistance = "Very Close";
  else if (avgIdentity >= 80) phylogeneticDistance = "Close";
  else if (avgIdentity >= 60) phylogeneticDistance = "Moderate";
  else if (avgIdentity >= 40) phylogeneticDistance = "Distant";
  else phylogeneticDistance = "Very Distant";

  // Infer family from hit titles
  const titleLower = topHit.title.toLowerCase();
  let matchedFamily = "Unknown";
  let crossVaccines: string[] = [];
  let predictedSymptoms: string[] = [];

  if (titleLower.includes("coronavirus") || titleLower.includes("sars") || titleLower.includes("covid") || titleLower.includes("mers")) {
    matchedFamily = "Coronaviridae";
    crossVaccines = ["SARS-CoV-2 vaccines may provide partial cross-protection", "SARS-CoV-1 antibodies show some cross-reactivity"];
    predictedSymptoms = ["Respiratory symptoms", "Fever", "Cough", "Potential loss of taste/smell", "Possible pneumonia"];
  } else if (titleLower.includes("influenza") || titleLower.includes("flu")) {
    matchedFamily = "Orthomyxoviridae";
    crossVaccines = ["Influenza vaccines may offer partial protection (strain-dependent)", "Universal influenza vaccine candidates in development"];
    predictedSymptoms = ["High fever", "Myalgia", "Respiratory distress", "Headache", "Fatigue"];
  } else if (titleLower.includes("ebola") || titleLower.includes("filovir") || titleLower.includes("marburg")) {
    matchedFamily = "Filoviridae";
    crossVaccines = ["Ervebo (Ebola vaccine) may offer partial protection", "Zabdeno/Mvabea cross-reactive potential"];
    predictedSymptoms = ["Hemorrhagic fever", "High fever", "Vomiting/diarrhea", "Bleeding", "Organ failure"];
  } else if (titleLower.includes("flavivir") || titleLower.includes("dengue") || titleLower.includes("zika") || titleLower.includes("west nile")) {
    matchedFamily = "Flaviviridae";
    crossVaccines = ["Dengvaxia (Dengue) may show partial protection", "Yellow fever vaccine (17D) cross-reactive for some flaviviruses", "JE vaccine (IXIARO) potential cross-protection"];
    predictedSymptoms = ["Fever", "Rash", "Arthralgia/myalgia", "Headache", "Hemorrhagic potential (severe)"];
  } else if (titleLower.includes("paramyxo") || titleLower.includes("nipah") || titleLower.includes("measles") || titleLower.includes("hendra")) {
    matchedFamily = "Paramyxoviridae";
    crossVaccines = ["MMR vaccine cross-protection possible against related paramyxoviruses", "mAb m102.4 cross-reactive for henipaviruses"];
    predictedSymptoms = ["Fever", "Respiratory symptoms", "Potential encephalitis", "Rash (morbilliviruses)"];
  } else if (titleLower.includes("herpes") || titleLower.includes("varicella") || titleLower.includes("cmv") || titleLower.includes("ebv")) {
    matchedFamily = "Herpesviridae";
    crossVaccines = ["VZV vaccines (Shingrix/Varivax) for related alphaherpesvirus", "No broad herpesvirus vaccine available"];
    predictedSymptoms = ["Vesicular rash", "Fever", "Latency with potential reactivation", "Neuropathy"];
  } else if (titleLower.includes("hiv") || titleLower.includes("retrovir")) {
    matchedFamily = "Retroviridae";
    crossVaccines = ["No licensed HIV vaccine", "PrEP (Truvada/Descovy) for prevention"];
    predictedSymptoms = ["Immunodeficiency", "Lymphadenopathy", "Opportunistic infections", "Weight loss"];
  } else if (titleLower.includes("pox") || titleLower.includes("vaccinia") || titleLower.includes("orthopox")) {
    matchedFamily = "Poxviridae";
    crossVaccines = ["JYNNEOS (MVA-BN) — effective against related orthopoxviruses", "ACAM2000 (smallpox vaccine) broad orthopoxvirus protection"];
    predictedSymptoms = ["Vesicular/pustular rash", "Fever", "Lymphadenopathy", "Systemic illness"];
  }

  if (predictedSymptoms.length === 0) {
    predictedSymptoms = ["Fever", "Fatigue", "Variable systemic manifestations based on viral tropism"];
    matchedFamily = "Under analysis";
    crossVaccines = ["Analyze full hit list for specific cross-vaccine recommendations"];
  }

  return { viralPotential, matchedFamily, crossVaccines, predictedSymptoms, phylogeneticDistance };
}
