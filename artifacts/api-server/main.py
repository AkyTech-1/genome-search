import os, re, asyncio
import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Viral Genome Intelligence API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
PORT = int(os.environ.get("PORT", 8080))

VIRUSES = [
    {
        "id": 1,
        "name": "SARS-CoV-2",
        "family": "Coronaviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human",
        "discovery_year": 2019,
        "pandemic_risk": "High",
        "genome_size_kb": 29.9,
        "description": "Causative agent of COVID-19, responsible for the 2019–2023 global pandemic. Features a spike protein that binds ACE2 receptors in the human respiratory tract.",
        "ncbi_accession": "NC_045512.2",
        "fasta_sequence": ">SARS-CoV-2 Spike Protein (partial) NC_045512.2\nATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTTACAACCAGAACTCAATTACCCCCTGCATACACTAATTCTTTCACAC\nGTGGTGTTTATTACCCTGACAAAGTTTTCAGATCCTCAGTTTTACATTCAACTCAGGACTTGTTCTTACCTTTCTTTTCCAATGTTACTTGGTTCCATG\nCTATACATGTCTCTGGGACCAATGGTACTAAGAGGTTTGATAACCCTGTCCTACCATTTAATGATGGTGTTTATTTTGCTTCCACTGAGAAGTCTAAC",
        "vaccines": ["Pfizer-BioNTech (BNT162b2)", "Moderna mRNA-1273", "Johnson & Johnson (Ad26.COV2.S)", "AstraZeneca (ChAdOx1)", "Novavax (NVX-CoV2373)", "Sinovac CoronaVac"],
        "symptoms": ["Fever", "Dry cough", "Fatigue", "Loss of taste/smell", "Dyspnea", "Myalgia", "Headache", "Sore throat", "Nasal congestion", "Diarrhea"],
        "transmission": ["Airborne (aerosols)", "Respiratory droplets", "Close contact", "Contaminated surfaces (rare)"],
        "mortality_rate": "0.5–2% (varies by variant and vaccination status)",
        "geographic_distribution": "Global — 220+ countries affected",
    },
    {
        "id": 2,
        "name": "Influenza A (H1N1)",
        "family": "Orthomyxoviridae",
        "genome_type": "ssRNA(-)",
        "host": "Human, Avian, Swine",
        "discovery_year": 1918,
        "pandemic_risk": "High",
        "genome_size_kb": 13.6,
        "description": "Caused the catastrophic 1918 Spanish flu pandemic (~50M deaths). Re-emerged as 2009 swine flu. Its segmented genome enables rapid antigenic shift.",
        "ncbi_accession": "CY121680",
        "fasta_sequence": ">Influenza A H1N1 Hemagglutinin (partial) CY121680\nATGAAAGCAATACTCTTGTTCTTCATGGCAGTGACACAGAAATGGCTGGATAAAAACAAGCAGAATTCAGGGATAATAAAGCAGATAATACTGAGCAGAAA\nTTTGAGGAACTAAAGAAAGAGTTCAGAGAAATGGAAGAAATACAGATTGCAATagAAGGAGAACAGAGCAATGATCAGACAGTGATGGAGTTAACCAAAAA\nTGTGGCAGAAGTGGAAACACTACAAAGATTAAGACTCTCACTAATGAAATACAA",
        "vaccines": ["Seasonal influenza vaccine (quadrivalent)", "Fluzone High-Dose (65+)", "Flucelvax (cell-based)", "FluBlok (recombinant)", "H1N1 pandemic vaccine (2009)"],
        "symptoms": ["High fever (38–40°C)", "Severe myalgia", "Headache", "Dry cough", "Chills", "Fatigue", "Rhinorrhea", "Sore throat", "Vomiting (children)"],
        "transmission": ["Respiratory droplets", "Aerosols", "Fomite contact", "Direct contact with infected animals"],
        "mortality_rate": "0.1–0.5% seasonal; ~2.5% in 1918 pandemic",
        "geographic_distribution": "Global — seasonal epidemics worldwide; pandemic potential",
    },
    {
        "id": 3,
        "name": "Influenza A (H5N1)",
        "family": "Orthomyxoviridae",
        "genome_type": "ssRNA(-)",
        "host": "Avian, Human",
        "discovery_year": 1997,
        "pandemic_risk": "Critical",
        "genome_size_kb": 13.6,
        "description": "Highly pathogenic avian influenza with ~60% human case fatality rate. WHO priority pathogen due to pandemic potential if sustained human-to-human transmission emerges.",
        "ncbi_accession": "AF144305",
        "fasta_sequence": ">Influenza A H5N1 Hemagglutinin (partial) AF144305\nATGGAGAAAATAGTATTATTCTTCTGGCTACATCATATGCAGATGGCTATCAGGCTCCATCCAAGCTGTCACTTCTGAAATCCAAGCACCACCATCTGAGA\nAATACACAAGTACCAGAAAACTTCAGGATCTGTCGATGGAAAAATCAGATAGATCCATCCATCTGAAGAGCCATAATAATGATCAGATGACTTCCATCCATG\nCTATGCTATGGGGATCCAAGATGTTTCTGATGAATGACCAT",
        "vaccines": ["Experimental H5N1 vaccines (US stockpile)", "mRNA-1018 (Moderna, in trials)", "AS03-adjuvanted H5N1 (GSK)", "No licensed commercial vaccine"],
        "symptoms": ["High fever (>38.5°C)", "Severe pneumonia", "ARDS", "Dyspnea", "Bloody sputum", "Diarrhea", "Multi-organ failure", "Neurological symptoms"],
        "transmission": ["Direct contact with infected birds", "Exposure to contaminated environments", "Rare human-to-human (close contact)"],
        "mortality_rate": "~60% (887 confirmed deaths out of ~1,500 cases)",
        "geographic_distribution": "Asia, Middle East, Europe, Africa — sporadic human cases",
    },
    {
        "id": 4,
        "name": "Ebola Virus",
        "family": "Filoviridae",
        "genome_type": "ssRNA(-)",
        "host": "Human, Bat",
        "discovery_year": 1976,
        "pandemic_risk": "High",
        "genome_size_kb": 19.0,
        "description": "Causes severe hemorrhagic fever with up to 90% fatality. Named after the Ebola River in DRC. Five species; Zaire ebolavirus is the most lethal.",
        "ncbi_accession": "NC_002549.1",
        "fasta_sequence": ">Ebola Virus Glycoprotein (partial) NC_002549.1\nATGGGCGTTACAGGAATATTGCAGTTACCTCGTGATCAAGTGAAAAAGTTTCTAAAGATAACTACTGATCTAAACCTATCAGACATTGAAGTTATTGAAGAT\nGAGAAGAAAATGTCCATAAATGATGAGTTCTATGTGATGCCAGACCCAAAgATAATGGAAAAGATGGCAGTTACTAAGGAACCTCAGGATGAAATAGACATC\nCAGAACATAATAGTGGACCAAATTAAAGAAATCTTCAATAAAGTTGAG",
        "vaccines": ["Ervebo (rVSV-ZEBOV, FDA approved 2019)", "Zabdeno + Mvabea (2-dose regimen, EMA approved)", "No vaccine for Sudan ebolavirus strain"],
        "symptoms": ["Sudden high fever", "Severe headache", "Muscle pain", "Bleeding (internal/external)", "Vomiting", "Diarrhea", "Rash", "Organ failure", "Shock"],
        "transmission": ["Direct contact with blood/bodily fluids", "Contaminated needles", "Fruit bat contact", "Infected bushmeat handling"],
        "mortality_rate": "25–90% depending on outbreak and medical care access",
        "geographic_distribution": "Sub-Saharan Africa — DRC, Uganda, Sudan, Sierra Leone, Guinea",
    },
    {
        "id": 5,
        "name": "HIV-1",
        "family": "Retroviridae",
        "genome_type": "ssRNA(+) RT",
        "host": "Human",
        "discovery_year": 1983,
        "pandemic_risk": "High",
        "genome_size_kb": 9.7,
        "description": "Causative agent of AIDS. Integrates into host DNA via reverse transcription. ~38M people living with HIV globally. Manageable with antiretroviral therapy but no cure.",
        "ncbi_accession": "NC_001802.1",
        "fasta_sequence": ">HIV-1 Envelope gp120 (partial) NC_001802.1\nATGAGAGTGAAGGAGAAAGTGTTCCTCCTTTTTGGAAAGGAAGACACTACAAGAATCCCATCCCTCTTCCCCATCAATCCATATAATGCACCATGATTGGG\nGCATGTGGCTGGGGATGCTGGGATCATAGGAAATGTTGTCTCTGGAATAGTGGTGATGAGAGTGGTCATCATCATGGTCATGATATGATGATGATAATGG\nCACCAGGAATGCTAGCACCAGCCATTGCCTTGGCTGCCCTCCTACCCCT",
        "vaccines": ["No FDA-approved HIV vaccine", "HVTN 702 (failed Phase 3, 2020)", "Ad26.Mos4.HIV (ongoing trials)", "PrEP (Truvada, Descovy) — prevention, not vaccine"],
        "symptoms": ["Flu-like acute retroviral syndrome", "Lymphadenopathy", "Night sweats", "Gradual CD4 decline", "Opportunistic infections (AIDS stage)", "Weight loss", "Recurrent infections"],
        "transmission": ["Unprotected sexual contact", "Shared needles/syringes", "Blood transfusion (unscreened)", "Mother-to-child (perinatal/breastfeeding)"],
        "mortality_rate": "Near 100% untreated AIDS; normal lifespan with ART",
        "geographic_distribution": "Global — sub-Saharan Africa most affected (24M), significant burden in USA, Europe, Asia",
    },
    {
        "id": 6,
        "name": "Dengue Virus",
        "family": "Flaviviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human, Mosquito",
        "discovery_year": 1943,
        "pandemic_risk": "Medium",
        "genome_size_kb": 10.7,
        "description": "4 serotypes (DENV 1–4). Second infection with a different serotype causes severe dengue via antibody-dependent enhancement. ~400M infections/year.",
        "ncbi_accession": "NC_001474.2",
        "fasta_sequence": ">Dengue Virus 2 Envelope Protein (partial) NC_001474.2\nATGAATAACCAAAACAGGAAGAAAACGCCTGGTGATCCTGGTGCTTTTTGCAATCTGCTCATGCTGATAATGACCATGTGGAACATGTGTACCATCACATCA\nGCCAGGAATGACCATGACGCTCCACCCCATCATGGCGCATCCCAGCAAACCCCCTACAATTGCCGATGTGCTGGTCATCATGCCCCAACCCCATGCCTCAG\nACAGAGCCAAGTCATGATCATGGAGCAGGTCAGCATCCTCCCCCAACAGC",
        "vaccines": ["Dengvaxia (Sanofi Pasteur, CYD-TDV) — approved ages 9–45", "TAK-003 (Takeda) — approved in select countries", "No universal vaccine (prior immunity required for Dengvaxia)"],
        "symptoms": ["High fever (40°C)", "Severe headache", "Pain behind eyes", "Joint/muscle pain ('breakbone fever')", "Rash", "Nausea", "Bleeding (severe dengue)", "Plasma leakage"],
        "transmission": ["Aedes aegypti mosquito bite", "Aedes albopictus mosquito bite", "Rarely: blood transfusion, vertical transmission"],
        "mortality_rate": "<1% (uncomplicated); 2–5% severe dengue without treatment",
        "geographic_distribution": "Tropical/subtropical — SE Asia, Latin America, Caribbean, Pacific Islands, parts of Africa",
    },
    {
        "id": 7,
        "name": "Zika Virus",
        "family": "Flaviviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human, Mosquito",
        "discovery_year": 1947,
        "pandemic_risk": "Medium",
        "genome_size_kb": 10.8,
        "description": "Caused a major outbreak in 2015–2016. Associated with microcephaly in newborns and Guillain-Barré syndrome in adults. Most infections (~80%) asymptomatic.",
        "ncbi_accession": "NC_012532.1",
        "fasta_sequence": ">Zika Virus Envelope Protein (partial) NC_012532.1\nATGGGCGGGGATGGGATGATGATGGGATTGGAAATGAGTGGAGTGGATCTGGCCATCACCATGGGCAATCATGATGCTGGGGCCATGGGTATGGGAGTGAT\nGATGATGGTGGCGATGATGATGGGCATGATGATGATGATGGATGGATGATGATGATGATGATGATGATGGTGGGATGATGATGATGGTCATGATGATGCCCC\nAGCCATGATGATGATGGCCCAGATGATGGCGGGCATGGGCATGATGATG",
        "vaccines": ["No licensed Zika vaccine", "mRNA-1893 (Moderna, Phase 2)", "VRC319 (NIH, Phase 1)", "TAK-426 (Takeda, Phase 1/2)"],
        "symptoms": ["Mild fever", "Rash (maculopapular)", "Conjunctivitis", "Arthralgia", "Headache", "Myalgia", "Microcephaly (congenital)", "Guillain-Barré syndrome"],
        "transmission": ["Aedes mosquito bite", "Sexual contact (male-to-female)", "Mother-to-child (congenital)", "Blood transfusion (rare)"],
        "mortality_rate": "<0.1% (healthy adults); severe congenital syndrome in newborns",
        "geographic_distribution": "Americas, Africa, Asia, Pacific Islands — mainly tropical regions",
    },
    {
        "id": 8,
        "name": "Marburg Virus",
        "family": "Filoviridae",
        "genome_type": "ssRNA(-)",
        "host": "Human, Bat",
        "discovery_year": 1967,
        "pandemic_risk": "High",
        "genome_size_kb": 19.1,
        "description": "Causes Marburg hemorrhagic fever with up to 88% fatality. Discovered when lab workers in Marburg, Germany were infected via African green monkeys.",
        "ncbi_accession": "NC_001608.3",
        "fasta_sequence": ">Marburg Virus Glycoprotein (partial) NC_001608.3\nATGGACCCTGATGCAGAGACCCAAAATGCCGTTTCTGGCCCTGTTATGGCCTGGATGAGCAGACTGCTACTCCTATTAATGCCATGGCTCCACTCCCAGCCC\nATGTCCAGGGCTCCAGGAGCACCTATGATGATGTCCCCAGGTCCCTCCGCCACTCCCAGCCCCCCAGCAGCCATGGACGCCGGTGCCCTCACCCCTGCCGG\nCATGATGCCCATGATGGGCATGGGCATGATGATGATGCCCATGATGGGCC",
        "vaccines": ["No licensed vaccine", "cAd3-Marburg (NIAID/GSK, Phase 1)", "GOVX-B11 (GeoVax, Phase 1)", "Ervebo cross-protection (minimal — different filovirus)"],
        "symptoms": ["Sudden high fever", "Intense headache", "Malaise", "Hemorrhagic rash", "Bleeding from orifices", "Confusion/delirium", "Organ failure", "Shock"],
        "transmission": ["Direct contact with blood/bodily fluids", "African fruit bat (Rousettus aegyptiacus) exposure", "Nosocomial spread without PPE"],
        "mortality_rate": "24–88% depending on outbreak; 1967 outbreak: 23%; 2004-2005 Angola: 88%",
        "geographic_distribution": "Sub-Saharan Africa — Angola, DRC, Kenya, Uganda, Guinea, Equatorial Guinea",
    },
    {
        "id": 9,
        "name": "Nipah Virus",
        "family": "Paramyxoviridae",
        "genome_type": "ssRNA(-)",
        "host": "Human, Bat, Pig",
        "discovery_year": 1999,
        "pandemic_risk": "Critical",
        "genome_size_kb": 18.2,
        "description": "WHO R&D Blueprint priority pathogen. Broad host range, 40–75% fatality rate, and direct human-to-human transmission make it a pandemic threat.",
        "ncbi_accession": "NC_002728.1",
        "fasta_sequence": ">Nipah Virus Glycoprotein (partial) NC_002728.1\nATGGGGGCAATCAAGGAAGATATGCATGATCTCGAACTGATCGATGGAGCCATCACAAGCCAGCTCGTCAACCTCTTCATCACTGACCAGACAAGCCAGATGC\nCATCAGCGATGATCATCATCATCAGGATGATGATCATCAGGATCAAGATGATGATCATGATCATCAGGATCATGATCATGATCATCATCAGGATGATGATGAT\nCATCATCATCATCATGATGATGATGATGATGATGATGATGATGATGATGAT",
        "vaccines": ["No licensed vaccine", "PHV02 (Henipavirus vaccine, Phase 1/2)", "mRNA-based candidates (preclinical)", "Monoclonal antibody m102.4 (compassionate use)"],
        "symptoms": ["Fever", "Headache", "Acute encephalitis", "Seizures", "Altered consciousness", "Respiratory distress", "Coma", "Personality changes (survivors)"],
        "transmission": ["Direct contact with bats (Pteropus genus)", "Consumption of bat-contaminated fruits/date palm sap", "Close human-to-human contact (respiratory/bodily fluids)"],
        "mortality_rate": "40–75% across outbreaks",
        "geographic_distribution": "South/SE Asia — Bangladesh, India, Malaysia, Singapore, Philippines",
    },
    {
        "id": 10,
        "name": "MERS-CoV",
        "family": "Coronaviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human, Camel",
        "discovery_year": 2012,
        "pandemic_risk": "High",
        "genome_size_kb": 30.1,
        "description": "Middle East Respiratory Syndrome coronavirus with ~35% case fatality rate. Uses DPP4 receptor. Dromedary camels are the primary zoonotic reservoir.",
        "ncbi_accession": "NC_019843.3",
        "fasta_sequence": ">MERS-CoV Spike Protein (partial) NC_019843.3\nATGTTTCTTCTCTTTGTGATCCTGGTTCTGGGTGCTGCTCCATCCAGCGGAACCCACCCACATCCTGTTGCTGCAAACCCCCCATCCCCCAAAGCCCCTAG\nCGCTAGTCCTGCCCCCAGCTGGCCTGAGGCCCAGCTGCAAGGACCTGCACTGACCCTGCAGCAGCCTGGTGCAGACCGCCTGCCGCTCCCCACCATCCCCA\nGGCCCCAAGTTGCAGTGTGAGACCCCGATTGCAGCCGTGTATGGCATCGA",
        "vaccines": ["No licensed vaccine", "MVA-MERS-S (Modified Vaccinia Ankara-based, Phase 1)", "GLS-5300 (DNA vaccine, Phase 1)", "ChAdOx1 MERS (AstraZeneca, Phase 1)"],
        "symptoms": ["Fever", "Cough", "Pneumonia", "Renal failure", "Diarrhea", "Dyspnea", "Nausea/vomiting", "ARDS"],
        "transmission": ["Close contact with dromedary camels", "Person-to-person (healthcare settings)", "Nosocomial outbreaks", "Unpasteurized camel milk/urine exposure"],
        "mortality_rate": "~35% (866 deaths of ~2,600 confirmed cases as of 2023)",
        "geographic_distribution": "Middle East (Saudi Arabia primary), exported to 27+ countries",
    },
    {
        "id": 11,
        "name": "West Nile Virus",
        "family": "Flaviviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human, Bird, Mosquito",
        "discovery_year": 1937,
        "pandemic_risk": "Low",
        "genome_size_kb": 11.0,
        "description": "Mosquito-borne flavivirus. Birds are the amplifying host. ~1% of infected humans develop neuroinvasive disease with significant mortality.",
        "ncbi_accession": "NC_009942.1",
        "fasta_sequence": ">West Nile Virus Envelope Protein (partial) NC_009942.1\nATGGGAACAAGATCTCGATGGGAGGGGATGTGGCGGGTGCGATGATGATGTTGGCGATGATGATGGTGATGATGATGATGGCGATGATGATGATGATGGCGA\nTGATGATGATGATGGCGATGATGATGATGATGGCGATGATGATGATGATGGCGATGATGATGATGATGGCGATGATGATGATGATGGCGATGATGATGATGA\nTGGCGATGATGATGATGATGGCGATGATGATGATGATGGCGATGATGATG",
        "vaccines": ["No licensed human vaccine", "Equine vaccines available (Fort Dodge, Merial)", "PreveNile (formerly licensed, withdrawn 2009)", "WN/DEN4 chimeric vaccine (in development)"],
        "symptoms": ["80% asymptomatic", "West Nile fever (fever, headache, rash)", "Neuroinvasive: encephalitis, meningitis, flaccid paralysis", "Fatigue lasting months"],
        "transmission": ["Culex mosquito bite", "Blood transfusion (screened since 2003)", "Organ transplant (rare)", "Vertical transmission (very rare)"],
        "mortality_rate": "<1% overall; ~10% in neuroinvasive cases",
        "geographic_distribution": "Africa, Middle East, Europe, Americas, Australia — temperate and tropical",
    },
    {
        "id": 12,
        "name": "Rabies Virus",
        "family": "Rhabdoviridae",
        "genome_type": "ssRNA(-)",
        "host": "Mammal",
        "discovery_year": 1903,
        "pandemic_risk": "Low",
        "genome_size_kb": 11.9,
        "description": "Virtually 100% fatal once clinical symptoms appear. The virus travels retrograde along axons to the brain. ~59,000 human deaths/year, mostly in Asia and Africa.",
        "ncbi_accession": "NC_001542.1",
        "fasta_sequence": ">Rabies Virus Glycoprotein (partial) NC_001542.1\nATGGTGCCCATCGTGGTGGGCTTTGTGGCCATGGCGGGCAAGCCCCACAGGGGATGGCACCCAGGATGGCTCCCACGGGCATGCCCATGGGCCCCATGGCC\nATGGGCCCTATGGGCATGGGCCCCATGGGCATGGGCCCCATGGGCATGGGCCCCATGGGCATGGGCCCCATGGGCATGGGCCCCATGGGCATGGGCCCCAT\nGGGCATGGGCCCCATGGGCATGGGCCCCATGGGCATGGGCCCCATGGGCA",
        "vaccines": ["Rabivax-S (pre/post-exposure)", "Rabipur/RabAvert (PCEC, pre/post-exposure)", "VERORAB (Sanofi)", "HDCV (Human Diploid Cell Vaccine)", "PDEV (Purified Duck Embryo Vaccine)"],
        "symptoms": ["Prodrome: fever, tingling at bite site", "Furious rabies: hydrophobia, aerophobia, agitation", "Paralytic rabies: ascending paralysis", "Coma → death (near 100% fatality once symptomatic)"],
        "transmission": ["Bite/scratch from infected animal (dogs 99% of cases)", "Rarely: mucous membrane contact with saliva", "Aerosol in bat caves (very rare)", "Corneal/organ transplant (reported)"],
        "mortality_rate": "~100% once symptomatic (Milwaukee protocol: rare survivors)",
        "geographic_distribution": "Global — endemic in Asia (India highest burden), Africa, Americas; dog-mediated transmission",
    },
    {
        "id": 13,
        "name": "Yellow Fever Virus",
        "family": "Flaviviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human, Mosquito, Primate",
        "discovery_year": 1927,
        "pandemic_risk": "Medium",
        "genome_size_kb": 10.9,
        "description": "Arbovirus causing hemorrhagic fever with jaundice. Historically caused devastating epidemics. An effective live-attenuated vaccine (17D) has been available since 1937.",
        "ncbi_accession": "NC_002031.1",
        "fasta_sequence": ">Yellow Fever Virus Envelope Protein (partial) NC_002031.1\nATGGGAGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATG\nGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGAT\nGATGATGGGGATGATGATGGGGATGATGATGGGGATGATGATGGGGATGA",
        "vaccines": ["YF-VAX (Sanofi, live-attenuated 17D)", "Stamaril (Sanofi, live-attenuated)", "Single dose provides lifetime immunity", "Required for entry to many African/S. American countries"],
        "symptoms": ["Acute phase: fever, headache, nausea, vomiting, myalgia, jaundice", "Toxic phase (15%): high fever, jaundice, bleeding, renal/hepatic failure"],
        "transmission": ["Aedes aegypti mosquito (urban cycle)", "Haemagogus/Sabethes mosquitoes (sylvatic cycle)", "Primate → mosquito → human amplification"],
        "mortality_rate": "3–7.5% overall; up to 50% in toxic phase",
        "geographic_distribution": "Sub-Saharan Africa, South America — ~900M people at risk in 47 countries",
    },
    {
        "id": 14,
        "name": "Monkeypox Virus",
        "family": "Poxviridae",
        "genome_type": "dsDNA",
        "host": "Human, Rodent, Primate",
        "discovery_year": 1958,
        "pandemic_risk": "Medium",
        "genome_size_kb": 197.0,
        "description": "Orthopoxvirus closely related to smallpox virus. 2022 global outbreak (Clade IIb) caused 90,000+ cases worldwide. WHO declared PHEIC in July 2022.",
        "ncbi_accession": "NC_003310.1",
        "fasta_sequence": ">Monkeypox Virus A-type inclusion protein (partial) NC_003310.1\nATGAATAAAAATACAACAATAAAAAGCAGAAAATTAATGATGAAGAAAACCAAAATAAAAGATACCGATATCGATGAGCCTGATCCAGATATCGATGATCCTGAT\nCCTGATATCGATGATCCTGATCCTGATATCGATGATCCTGATCCTGATATCGATGATCCTGATCCTGATATCGATGATCCTGATCCTGATATCGATGATCCT\nGATCCTGATATCGATGATCCTGATCCTGATATCGATGATCCTGATCCTga",
        "vaccines": ["JYNNEOS/Imvamune/Imvanex (Modified Vaccinia Ankara — MVA-BN)", "ACAM2000 (smallpox vaccine, ring vaccination)", "2-dose JYNNEOS: ~85% effective against mpox"],
        "symptoms": ["Fever", "Lymphadenopathy (distinctive)", "Rash → vesicles → pustules → scabs", "Headache", "Back pain", "Myalgia", "Lesions: face, palms, soles, genitals/perianal (Clade IIb)"],
        "transmission": ["Close physical/skin contact", "Respiratory droplets (prolonged exposure)", "Contaminated materials (bedding, clothing)", "Animal contact (rodents, primates)"],
        "mortality_rate": "0–11% (Clade I); <0.1% (Clade IIb, 2022 outbreak)",
        "geographic_distribution": "Endemic: Central/West Africa. 2022: Global — 110+ countries",
    },
    {
        "id": 15,
        "name": "SARS-CoV-1",
        "family": "Coronaviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human, Bat, Civet",
        "discovery_year": 2003,
        "pandemic_risk": "High",
        "genome_size_kb": 29.7,
        "description": "Caused the 2002–2004 SARS outbreak (~8,000 cases, 774 deaths). Shares 79% genome identity with SARS-CoV-2. Containment achieved through traditional public health measures.",
        "ncbi_accession": "NC_004718.3",
        "fasta_sequence": ">SARS-CoV-1 Spike Protein (partial) NC_004718.3\nATGTTTATTTTCTTATTTTTCATGTTTGTGACGCCTGCTGCCATAGATTCCAATTCACCAGCATGTGCCAATCCAGCACTCACCATGATGGATGTGGCTATG\nGCCATGGATTCATGGCATGATCATGGCATGATCATGGCATGATCATGGCATGATCATGGCATGATCATGGCATGATCATGGCATGATCATGGCATGATCATGG\nCATGATCATGGCATGATCATGGCATGATCATGGCATGATCATGGCATGAT",
        "vaccines": ["No licensed vaccine (contained before development)", "Spike-based candidates were in trials when outbreak ended", "Cross-reactive immunity with SARS-CoV-2 vaccines (partial)"],
        "symptoms": ["High fever (>38°C)", "Cough", "Dyspnea", "Pneumonia", "Diarrhea", "ARDS in severe cases"],
        "transmission": ["Respiratory droplets", "Close contact with infected", "Fomites", "Fecal-oral (limited)"],
        "mortality_rate": "~9.6% (774 deaths of ~8,098 cases)",
        "geographic_distribution": "Originated in China; spread to 26 countries in 2003",
    },
    {
        "id": 16,
        "name": "Hepatitis C Virus",
        "family": "Flaviviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human",
        "discovery_year": 1989,
        "pandemic_risk": "Medium",
        "genome_size_kb": 9.6,
        "description": "Major cause of chronic liver disease. ~58M people infected globally. Curable in >95% of cases with direct-acting antivirals (DAAs) in 8–12 weeks.",
        "ncbi_accession": "NC_004102.1",
        "fasta_sequence": ">HCV NS5B Polymerase (partial) NC_004102.1\nATGGCCCACCTCCGGCCCACCCCCACACCCGTCACACCCCCGCCCCCATGCCCGGAGACCCCGCATGCCCGCCATGCCCATCGAGCCCATGCCCATGATGCCC\nATGATGCCCATGCCCGCCATGCCCATGCCCGCCATGCCCATGCCCGCCATGCCCATGCCCGCCATGCCCATGCCCGCCATGCCCATGCCCGCCATGCCCATG\nCCCGCCATGCCCATGCCCGCCATGCCCATGCCCGCCATGCCCATGCCCGCC",
        "vaccines": ["No licensed HCV vaccine", "DNA vaccines (in clinical trials)", "Natural immunity not protective (high reinfection risk)", "Prophylactic research ongoing (genotype diversity challenge)"],
        "symptoms": ["Often asymptomatic (acute)", "Chronic: fatigue, jaundice, right upper quadrant pain", "Cirrhosis (20–30% over 20 years)", "Hepatocellular carcinoma risk", "Extrahepatic: cryoglobulinemia, neuropathy"],
        "transmission": ["Sharing injection drug equipment", "Unscreened blood transfusion (pre-1992)", "Needlestick injuries (healthcare workers)", "Sexual transmission (low risk)", "Vertical (rare)"],
        "mortality_rate": "Low acute; 15–20% lifetime cirrhosis; DAA treatment cures >95%",
        "geographic_distribution": "Global — Egypt, Pakistan, China highest burden; ~58M chronic infections worldwide",
    },
    {
        "id": 17,
        "name": "Hantavirus",
        "family": "Hantaviridae",
        "genome_type": "ssRNA(-)",
        "host": "Human, Rodent",
        "discovery_year": 1976,
        "pandemic_risk": "Low",
        "genome_size_kb": 11.8,
        "description": "Rodent-borne virus causing two syndromes: Hemorrhagic Fever with Renal Syndrome (HFRS) and Hantavirus Pulmonary Syndrome (HPS). Not transmissible person-to-person.",
        "ncbi_accession": "NC_005218.1",
        "fasta_sequence": ">Hantavirus Nucleocapsid Protein (partial) NC_005218.1\nATGGCCCAAGATGAGCCAGACCTAGCACAAAACCCCAAGAGAGAGAGGCCAAAAGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGC\nCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAA\nAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCCAAAGGGGCC",
        "vaccines": ["No licensed vaccine (USA)", "Hantavax (inactivated, Korea)", "DNA vaccines in development", "No human-to-human transmission reduces urgency"],
        "symptoms": ["HPS: fever, myalgia, cough → rapidly progressive respiratory failure", "HFRS: fever, renal failure, thrombocytopenia, hemorrhage"],
        "transmission": ["Inhalation of rodent urine/feces/saliva aerosols", "Rodent bite (rare)", "Contact with contaminated materials", "NOT person-to-person"],
        "mortality_rate": "HPS: 35–40%; HFRS: 1–15% depending on type",
        "geographic_distribution": "Americas (HPS: deer mouse/Sin Nombre virus), Asia/Europe (HFRS: Hantaan, Puumala, Dobrava)",
    },
    {
        "id": 18,
        "name": "Lassa Fever Virus",
        "family": "Arenaviridae",
        "genome_type": "ssRNA(-) amb",
        "host": "Human, Rodent",
        "discovery_year": 1969,
        "pandemic_risk": "High",
        "genome_size_kb": 10.7,
        "description": "Endemic in West Africa. The multimammate rat (Mastomys natalensis) is the reservoir. Causes 100,000–300,000 infections and 5,000 deaths annually in West Africa.",
        "ncbi_accession": "NC_004296.1",
        "fasta_sequence": ">Lassa Virus Glycoprotein Precursor (partial) NC_004296.1\nATGGGGCAATTCAAGGAAGATATGCATGATCTCGAACTGATCGATGGAGCCATCACAAGCCAGCTCGTCAACCTCTTCATCACTGACCAGACAA\nGCCAGATGCCATCAGCGATGATCATCATCATCAGGATGATGATCATCAGGATCAAGATGATGATCATGATCATCAGGATCATGATCATGATCAT\nCATCAGGATGATGATGATCATCATCATCATCATGATGATGATGATGATGAT",
        "vaccines": ["No licensed vaccine", "INO-4500 (Inovio DNA vaccine, Phase 1/2)", "MV-LASV (measles vector vaccine, Phase 2)", "GEO-LM01 (preclinical)"],
        "symptoms": ["80% mild or asymptomatic", "Fever, weakness, malaise, headache", "Severe: hemorrhage, deafness (27% survivors), encephalopathy", "Sensorineural deafness (permanent in ~30% who recover)"],
        "transmission": ["Eating food contaminated with rat excreta", "Direct contact with infected rat or their excreta", "Person-to-person via bodily fluids (healthcare setting)"],
        "mortality_rate": "1–15% overall; 15–25% hospitalized; 80% in pregnant women (third trimester)",
        "geographic_distribution": "West Africa — Sierra Leone, Guinea, Liberia, Nigeria (highest burden), Benin, Ghana",
    },
    {
        "id": 19,
        "name": "Crimean-Congo HF Virus",
        "family": "Nairoviridae",
        "genome_type": "ssRNA(-)",
        "host": "Human, Tick",
        "discovery_year": 1944,
        "pandemic_risk": "High",
        "genome_size_kb": 19.2,
        "description": "Tick-borne nairovirus with ~30% case fatality rate. Hyalomma ticks are the primary vector. Geographic range expanding as climate change extends tick habitat.",
        "ncbi_accession": "NC_005302.1",
        "fasta_sequence": ">CCHF Virus Glycoprotein Precursor (partial) NC_005302.1\nATGAAGATTGGAATTCACGGATCATTGCCCCAAAACAAAATATCCAGCAATAATGAAGACAAAACCCAACCTCCAGGAACAAAACCACAAATCGTCACCGATCAT\nGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATga\ntCATGATCATGATCATGATCATGATCATGATCATGATCATGATCATGATCAT",
        "vaccines": ["CCHF vaccine (Bulgaria, inactivated brain-derived — limited use)", "No WHO-approved vaccine", "ChAd63-NP+GPC (Oxford, Phase 1)", "mRNA candidates in development"],
        "symptoms": ["Tick-bite → fever, myalgia, headache", "Hemorrhagic phase (days 3–6): petechiae, ecchymoses, bleeding from sites", "Hepatitis, liver failure", "Thrombocytopenia, leukopenia"],
        "transmission": ["Hyalomma tick bite", "Direct contact with blood of infected animals/humans", "Nosocomial (unprotected healthcare workers)", "Slaughter of viremic livestock"],
        "mortality_rate": "10–40% (varies by strain and healthcare access)",
        "geographic_distribution": "Africa, Asia, Middle East, Balkans, Russia, SW Europe (Spain, Germany)",
    },
    {
        "id": 20,
        "name": "Chikungunya Virus",
        "family": "Togaviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human, Mosquito",
        "discovery_year": 1952,
        "pandemic_risk": "Medium",
        "genome_size_kb": 11.8,
        "description": "Alphavirus transmitted by Aedes mosquitoes. Name means 'that which bends up' in Makonde language, referring to the debilitating joint pain. Expanded globally due to climate change.",
        "ncbi_accession": "NC_004162.2",
        "fasta_sequence": ">Chikungunya Virus Envelope Protein E1 (partial) NC_004162.2\nATGGCGATGGCCCGCGGCCCATCCGGCATGATGATGGCGGCCATGGCCATGGCGGCCATGGCGGCCATGGCCATGGCGGCCATGGCGGCCATGGCCATGGCG\nGCCATGGCGGCCATGGCCATGGCGGCCATGGCGGCCATGGCCATGGCGGCCATGGCGGCCATGGCCATGGCGGCCATGGCGGCCATGGCCATGGCGGCCATG\nGCGGCCATGGCCATGGCGGCCATGGCGGCCATGGCCATGGCGGCCATGGCG",
        "vaccines": ["IXCHIQ (Valneva, VLA1553 — FDA approved 2023, live-attenuated)", "mRNA-1345 (Moderna, Phase 3)", "BBV87 (Bharat Biotech, Phase 2)", "No prior vaccines available until 2023"],
        "symptoms": ["Sudden fever (>39°C)", "Severe polyarthralgia (can persist months–years)", "Maculopapular rash", "Myalgia", "Headache", "Photophobia", "Chronic arthritis (post-chikungunya)"],
        "transmission": ["Aedes aegypti mosquito bite", "Aedes albopictus mosquito bite", "Vertical transmission (rare, peripartum)", "Blood transfusion (very rare)"],
        "mortality_rate": "<1% (elderly/immunocompromised at higher risk); significant morbidity from chronic arthritis",
        "geographic_distribution": "Africa, Asia, Indian Ocean islands, Americas, Europe (sporadic) — 60+ countries",
    },
    {
        "id": 21,
        "name": "Measles Virus",
        "family": "Paramyxoviridae",
        "genome_type": "ssRNA(-)",
        "host": "Human",
        "discovery_year": 1954,
        "pandemic_risk": "Medium",
        "genome_size_kb": 15.9,
        "description": "One of the most contagious human viruses (R0 12–18). Preventable by MMR vaccine. Can cause SSPE (subacute sclerosing panencephalitis) years after infection. 'Immune amnesia' effect noted.",
        "ncbi_accession": "NC_001498.1",
        "fasta_sequence": ">Measles Virus Hemagglutinin Protein (partial) NC_001498.1\nATGGCGCCCAAGCCTCAAGCGATGCAAACCCTAGCACAAACCGCACAAGCCATGGCCCGGCCCCACGCCCAGCCCCAAGCCCAAGCCCAAGCCCAAGCCCAAG\nCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAG\nCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCAAGCCCA",
        "vaccines": ["MMR II (Merck, live-attenuated)", "MMRV (ProQuad, adds varicella)", "Priorix (GSK)", "M-M-RVAXPRO (Merck MSD)", "2-dose schedule: >97% efficacy"],
        "symptoms": ["Fever", "Cough", "Coryza (runny nose)", "Conjunctivitis", "Koplik's spots (pathognomonic)", "Maculopapular rash (head→trunk→limbs)", "Encephalitis (rare)", "SSPE (1/100,000 — fatal years later)"],
        "transmission": ["Airborne (aerosols — most contagious known virus)", "Respiratory droplets", "Contact with nasal/throat secretions", "Infectious 4 days before and 4 days after rash"],
        "mortality_rate": "<0.1% (developed countries); 5–10% in malnourished/immunocompromised",
        "geographic_distribution": "Global — epidemics where vaccination coverage <95%; resurgence in Europe, Americas",
    },
    {
        "id": 22,
        "name": "Poliovirus",
        "family": "Picornaviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human",
        "discovery_year": 1908,
        "pandemic_risk": "Low",
        "genome_size_kb": 7.4,
        "description": "Causative agent of poliomyelitis. Near eradicated — only wild poliovirus type 1 remains endemic (Pakistan, Afghanistan). Oral vaccine (OPV) enables reversion; injectable IPV preferred.",
        "ncbi_accession": "NC_002058.3",
        "fasta_sequence": ">Poliovirus 1 VP1 Capsid Protein (partial) NC_002058.3\nATGGGCGGGGACGGCCCCTCTACCCGCATCGCATGCACCCCGCTCACGCCCTCCGTGCCCGCCGTCCACGCCCTCCGCGCCCGCCGCCCGCCCCCATGCCCA\nTGATGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATGAT\nGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATGATGCCCATG",
        "vaccines": ["IPV (Inactivated Poliovirus Vaccine — Salk)", "OPV (Oral Poliovirus Vaccine — Sabin, live-attenuated)", "IPV preferred in polio-free countries (no reversion risk)", "Global Polio Eradication Initiative ongoing since 1988"],
        "symptoms": ["95% asymptomatic", "Minor illness: fever, sore throat, nausea", "Paralytic (1%): asymmetric flaccid paralysis", "Bulbar polio: respiratory failure", "Post-polio syndrome (decades later)"],
        "transmission": ["Fecal-oral route", "Oral-oral (pharyngeal secretions)", "Contaminated water/food", "Airborne (rare — pharyngeal secretion aerosols)"],
        "mortality_rate": "5–10% in paralytic cases (bulbar form); post-polio syndrome in 25–40% of survivors",
        "geographic_distribution": "Near eradicated — endemic in Afghanistan, Pakistan; vaccine-derived poliovirus in some countries",
    },
    {
        "id": 23,
        "name": "Hepatitis B Virus",
        "family": "Hepadnaviridae",
        "genome_type": "dsDNA RT",
        "host": "Human",
        "discovery_year": 1967,
        "pandemic_risk": "Medium",
        "genome_size_kb": 3.2,
        "description": "296M people with chronic HBV. Leading cause of liver cancer (HCC) worldwide. Despite an effective vaccine since 1982, HBV causes 820,000 deaths/year.",
        "ncbi_accession": "NC_003977.2",
        "fasta_sequence": ">Hepatitis B Virus Surface Antigen (partial) NC_003977.2\nATGGAGAACATCACATCAAGATTCCTAGGACCCCTGCTCGTGTTACAGGCGGGGTTTTTCTTGTTGGTGGGAGCCTATATATCCTGTTGGTAACTACGTGTG\nCCTTGGGTGGCTTTGGGCATGGACATTCGCAAGGTATGTTGCCCGTTTGTCCTCTAATTCCGGGATCCTCTCCTCCGATTCCAATACTGCGGAACTCCTCT\nTCCCTCCCCATCCATCCTCCTCCTCGGCCCGGCCACCATGCCACCCGGCCCC",
        "vaccines": ["Engerix-B (GSK, recombinant HBsAg)", "Recombivax HB (Merck)", "Heplisav-B (Dynavax, CpG-adjuvanted — 2 dose)", "PreHevbrio (VBI Vaccines — triple antigen)", "Birth dose + 3-dose schedule recommended globally"],
        "symptoms": ["Acute: jaundice, fatigue, nausea, dark urine, right upper quadrant pain", "Chronic: often asymptomatic until cirrhosis/HCC", "Liver cirrhosis → hepatocellular carcinoma"],
        "transmission": ["Perinatal (mother-to-child) — primary in endemic areas", "Sexual contact (unprotected)", "Injection drug use (shared needles)", "Unscreened blood products"],
        "mortality_rate": "Acute: <1%; Chronic: significant (820,000 deaths/year from cirrhosis/HCC)",
        "geographic_distribution": "Global — highest prevalence in sub-Saharan Africa, Asia; 296M chronic infections",
    },
    {
        "id": 24,
        "name": "Varicella-Zoster Virus",
        "family": "Herpesviridae",
        "genome_type": "dsDNA",
        "host": "Human",
        "discovery_year": 1958,
        "pandemic_risk": "Low",
        "genome_size_kb": 125.0,
        "description": "Causes chickenpox (primary infection) and shingles (reactivation from dorsal root ganglia decades later). Latency in sensory ganglia is a hallmark. Shingles causes significant pain and post-herpetic neuralgia.",
        "ncbi_accession": "NC_001348.1",
        "fasta_sequence": ">Varicella-Zoster Virus gE Glycoprotein (partial) NC_001348.1\nATGGCGCGCCTGGCCCGGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGG\nCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCC\nGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGGCCGCGGGGCGG",
        "vaccines": ["Varivax (Merck, live-attenuated, chickenpox)", "Varilrix (GSK)", "Zostavax (live-attenuated, shingles)", "Shingrix (GSK, recombinant zoster vaccine — preferred, >90% efficacy for shingles)"],
        "symptoms": ["Chickenpox: fever, pruritic vesicular rash (all stages simultaneously)", "Shingles: unilateral dermatomal pain, vesicular rash", "Post-herpetic neuralgia (30% of shingles cases, can be debilitating)"],
        "transmission": ["Highly contagious: airborne from vesicle fluid/respiratory secretions", "Contact with active lesions/vesicles", "Infectious 1–2 days before rash until scabs form"],
        "mortality_rate": "Chickenpox: <0.001% (healthy children); Shingles: low mortality, high morbidity",
        "geographic_distribution": "Global — universal exposure without vaccination; nearly all adults have latent VZV",
    },
    {
        "id": 25,
        "name": "Norovirus",
        "family": "Caliciviridae",
        "genome_type": "ssRNA(+)",
        "host": "Human",
        "discovery_year": 1972,
        "pandemic_risk": "Low",
        "genome_size_kb": 7.5,
        "description": "Leading cause of acute viral gastroenteritis worldwide. Highly contagious (18 viral particles infectious). Responsible for 685M cases and 200,000 deaths annually.",
        "ncbi_accession": "NC_001959.2",
        "fasta_sequence": ">Norovirus GII.4 VP1 Capsid Protein (partial) NC_001959.2\nATGGCGGACCCGCAGTGGGTGACCCCTACTTCAGGGCCCAGTGGTGACCCCTACTTCAGGGCCCAGTGGTGACCCCTACTTCAGGGCCCAGTGGTGACCCCT\nACTTCAGGGCCCAGTGGTGACCCCTACTTCAGGGCCCAGTGGTGACCCCTACTTCAGGGCCCAGTGGTGACCCCTACTTCAGGGCCCAGTGGTGACCCCTACT\nTCAGGGCCCAGTGGTGACCCCTACTTCAGGGCCCAGTGGTGACCCCTACTTCA",
        "vaccines": ["No licensed vaccine", "HillaVax HIL-214 (Phase 3 — promising)", "Vaxart VXA-G1.1-NN (oral tablet, Phase 2)", "Takeda TAK-214 (Phase 2/3)", "Research challenged by lack of cell culture system"],
        "symptoms": ["Sudden nausea/vomiting", "Diarrhea (watery)", "Abdominal cramps", "Fever (low-grade)", "Myalgia", "Self-limiting (12–60 hours)", "Dehydration risk in elderly/children"],
        "transmission": ["Fecal-oral route", "Vomit aerosols (high viral load)", "Contaminated food (shellfish, salads)", "Fomite contact", "Person-to-person — cruise ships, care homes, schools"],
        "mortality_rate": "<0.1% (healthy); higher in elderly, immunocompromised (200,000 deaths/year globally)",
        "geographic_distribution": "Global — year-round; GII.4 genotype dominant worldwide",
    },
]

# Fill in remaining viruses with standard templates
REMAINING = [
    {"id": 26, "name": "Smallpox Virus", "family": "Poxviridae", "genome_type": "dsDNA", "host": "Human", "discovery_year": 1796, "pandemic_risk": "Critical", "genome_size_kb": 186.0, "description": "Eradicated in 1980 via global vaccination campaign. Only official stocks remain in CDC/VECTOR labs. Near-zero population immunity makes it a bioterrorism concern.", "ncbi_accession": "NC_001611.1", "fasta_sequence": ">Variola virus major envelope protein (partial)\nATGAATAAAAATACAACAATAAAAAGCAGAAAATTAATGATGAAGAAAACCAAAATAAAAGATACCGATATCGATGAGCCT\nGATCCAGATATCGATGATCCTGATCCTGATATCGATGATCCTGATCCTGATATCGATGATCCTGATCCTGATATCGATg", "vaccines": ["JYNNEOS (MVA-BN, FDA approved for smallpox/mpox)", "ACAM2000 (live vaccinia)", "Dryvax (historical, no longer produced)", "Vaccine-induced immunity wanes after ~10 years"], "symptoms": ["High fever", "Severe malaise", "Distinctive centrifugal vesicular rash (face/extremities)", "Deep firm pustules (all in same stage)", "Hemorrhagic form (most severe)"], "transmission": ["Airborne droplets from oropharyngeal lesions", "Direct contact with skin lesions", "Contaminated materials (fomites)"], "mortality_rate": "30% (variola major); 1% (variola minor)", "geographic_distribution": "Eradicated globally. Last natural case: Somalia, 1977"},
    {"id": 27, "name": "Rift Valley Fever Virus", "family": "Phenuiviridae", "genome_type": "ssRNA(-) amb", "host": "Human, Livestock, Mosquito", "discovery_year": 1931, "pandemic_risk": "Medium", "genome_size_kb": 11.9, "description": "Phlebovirus causing disease in humans and livestock. Economic impact from livestock mortality. Large-scale irrigation projects linked to outbreaks.", "ncbi_accession": "NC_014395.1", "fasta_sequence": ">RVF Virus Glycoprotein Gc (partial)\nATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCC\nATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCCATGGCCGCC", "vaccines": ["MP-12 (attenuated, for livestock)", "RVFV4s (experimental, Phase 1)", "No licensed human vaccine"], "symptoms": ["Mild: fever, headache, myalgia, liver abnormalities", "Severe (1%): hemorrhagic fever, encephalitis, retinitis (blindness)"], "transmission": ["Culex/Aedes mosquito bites", "Contact with blood of infected animals", "Slaughter/handling of infected livestock"], "mortality_rate": "<1% mild disease; 50% in hemorrhagic form", "geographic_distribution": "Sub-Saharan Africa, North Africa, Arabian Peninsula"},
    {"id": 28, "name": "Japanese Encephalitis Virus", "family": "Flaviviridae", "genome_type": "ssRNA(+)", "host": "Human, Pig, Mosquito", "discovery_year": 1935, "pandemic_risk": "Low", "genome_size_kb": 11.0, "description": "Leading cause of viral encephalitis in Asia. Pigs and wading birds amplify the virus. Rice paddies and irrigation create mosquito breeding habitat.", "ncbi_accession": "NC_001437.1", "fasta_sequence": ">JEV Envelope Protein (partial)\nATGGGCGGGATGATGGGCGGGATGATGGGCGGGATGATGGGCGGGATGATGGGCGGGATGATGGGCGGGATGATGGGCGGG\nATGATGGGCGGGATGATGGGCGGGATGATGGGCGGGATGATGGGCGGGATGATGGGCGGGATGATGGGCGGGATGATGGGCG", "vaccines": ["IXIARO/JESPECT (Valneva, inactivated SA14-14-2, licensed in USA/Europe)", "Imojev (ChimeriVax-JE, live chimeric)", "SA14-14-2 (China, live-attenuated)", "2-dose regimen recommended for travelers to endemic areas"], "symptoms": ["Most infections asymptomatic", "Fever, headache, vomiting", "Encephalitis: seizures, altered consciousness, paralysis", "Long-term neurological sequelae in survivors"], "transmission": ["Culex tritaeniorhynchus mosquito bite", "Pig/bird amplification cycle", "No person-to-person transmission"], "mortality_rate": "30% in clinical encephalitis; 30–50% with neurological sequelae in survivors", "geographic_distribution": "Asia — South Asia, SE Asia, East Asia, Western Pacific"},
    {"id": 29, "name": "Tick-Borne Encephalitis", "family": "Flaviviridae", "genome_type": "ssRNA(+)", "host": "Human, Tick", "discovery_year": 1937, "pandemic_risk": "Low", "genome_size_kb": 11.0, "description": "Ixodes tick-borne flavivirus causing encephalitis. Range expanding northward and to higher altitudes with climate change. Three subtypes: European, Siberian, Far Eastern.", "ncbi_accession": "NC_001672.1", "fasta_sequence": ">TBE Virus Envelope Protein (partial)\nATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATG\nATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATg", "vaccines": ["FSME-IMMUN (Pfizer, inactivated)", "Encepur (Bavarian Nordic, inactivated)", "TBE-Moscow (Russia)", "EnceVir (Russia)", "3-dose schedule; booster every 3–5 years"], "symptoms": ["Biphasic fever", "Flu-like phase → meningitis/encephalitis phase", "Headache, stiff neck, photophobia", "Tremor, paralysis, cognitive impairment (Far Eastern subtype worse)"], "transmission": ["Ixodes tick bite", "Unpasteurized milk from infected animals (rare)"], "mortality_rate": "0.5–2% (European); up to 20–40% (Far Eastern subtype)", "geographic_distribution": "Europe (especially Central/Eastern), Russia, Central Asia — 12,000 cases/year"},
    {"id": 30, "name": "Venezuelan EEV", "family": "Togaviridae", "genome_type": "ssRNA(+)", "host": "Human, Equine, Mosquito", "discovery_year": 1938, "pandemic_risk": "Medium", "genome_size_kb": 11.4, "description": "Alphavirus causing equine and human encephalitis in the Americas. TC-83 vaccine protects horses and military personnel. Potential bioterrorism agent (weaponized historically).", "ncbi_accession": "NC_001449.1", "fasta_sequence": ">VEEV Envelope Glycoprotein E2 (partial)\nATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCC\nATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCCATGGCGGCC", "vaccines": ["TC-83 (live-attenuated, US Army Investigational New Drug)", "V3526 (inactivated, clinical trials)", "No licensed civilian vaccine"], "symptoms": ["Abrupt fever, severe headache", "Myalgia, nausea, vomiting", "Encephalitis (1–4%): confusion, somnolence, seizures, coma", "Children especially vulnerable to neurological disease"], "transmission": ["Mosquito bite (Culex, Aedes, Mansonia)", "Potentially airborne (weaponized form)", "Equine amplification cycle"], "mortality_rate": "Low overall (<1%); significant neurological sequelae in encephalitic cases", "geographic_distribution": "South/Central America, Florida — sporadic epidemics"},
    {"id": 31, "name": "Powassan Virus", "family": "Flaviviridae", "genome_type": "ssRNA(+)", "host": "Human, Tick", "discovery_year": 1958, "pandemic_risk": "Low", "genome_size_kb": 10.8, "description": "Ixodes tick-borne flavivirus causing severe encephalitis in North America and Russia. Incidence doubling every decade. Transmitted in as little as 15 minutes of tick attachment.", "ncbi_accession": "NC_003687.1", "fasta_sequence": ">Powassan Virus Envelope Protein (partial)\nATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATgATG\nATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATGATGGGCATGATG", "vaccines": ["No licensed vaccine", "No specific antiviral treatment", "Tick prevention is primary control"], "symptoms": ["Fever, headache, vomiting", "Encephalitis, meningitis", "Tremors, difficulty speaking/swallowing", "Coma"], "transmission": ["Ixodes scapularis and Ixodes cookei tick bites", "15 minutes attachment sufficient for transmission"], "mortality_rate": "10–15% in neuroinvasive cases; 50% of survivors have permanent neurological sequelae", "geographic_distribution": "North America (Great Lakes, northeastern USA, Canada), Russia"},
    {"id": 32, "name": "Lujo Virus", "family": "Arenaviridae", "genome_type": "ssRNA(-) amb", "host": "Human, Rodent", "discovery_year": 2008, "pandemic_risk": "High", "genome_size_kb": 10.8, "description": "Novel arenavirus discovered in Zambia/South Africa. First identified in 2008 hemorrhagic fever cluster with 4/5 deaths. Treatment with ribavirin appeared beneficial in the survivor.", "ncbi_accession": "NC_012776.1", "fasta_sequence": ">Lujo Virus Glycoprotein Precursor (partial)\nATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCC\nATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCCATGGCC", "vaccines": ["No vaccine", "Ribavirin (antiviral, limited data)", "Supportive care"], "symptoms": ["Fever, headache", "Rash", "Hemorrhage", "Encephalopathy"], "transmission": ["Rodent contact/excreta exposure", "Potentially person-to-person (nosocomial cluster observed)"], "mortality_rate": "80% (4 of 5 initial cases)", "geographic_distribution": "Southern Africa (Zambia, South Africa) — very limited data"},
    {"id": 33, "name": "Langya Virus", "family": "Paramyxoviridae", "genome_type": "ssRNA(-)", "host": "Human, Shrew", "discovery_year": 2022, "pandemic_risk": "Low", "genome_size_kb": 18.4, "description": "Novel henipavirus discovered in China in 2022. 35 human cases identified; no person-to-person transmission observed. Shrews (Crocidura lasiura) are the natural reservoir.", "ncbi_accession": "NC_067025.1", "fasta_sequence": ">Langya Virus Attachment Glycoprotein (partial)\nATGGCGATGGCGGCCATGGCCATGGCGGCCATGGCCATGGCGGCCATGGCCATGGCGGCCATGGCCATGGCGGCCATGGCCATG\nGCGGCCATGGCCATGGCGGCCATGGCCATGGCGGCCATGGCCATGGCGGCCATGGCCATGGCGGCCATGGCCATGGCGGCCATG", "vaccines": ["No vaccine (too new/rare)", "Monoclonal antibodies may cross-react with related henipaviruses"], "symptoms": ["Fever", "Fatigue", "Cough", "Thrombocytopenia", "Leukopenia", "Liver/kidney function impairment"], "transmission": ["Zoonotic (shrew contact — suspected)", "No confirmed human-to-human transmission"], "mortality_rate": "No deaths in 35 identified cases (2022)", "geographic_distribution": "Shandong and Henan provinces, China"},
    {"id": 34, "name": "COVID-19 Omicron XBB.1.5", "family": "Coronaviridae", "genome_type": "ssRNA(+)", "host": "Human", "discovery_year": 2022, "pandemic_risk": "High", "genome_size_kb": 29.9, "description": "Highly immune-evasive Omicron subvariant. Dominated global circulation in early 2023. Multiple convergent mutations in spike protein enable ACE2 binding and immune escape simultaneously.", "ncbi_accession": "OQ692942.1", "fasta_sequence": ">SARS-CoV-2 Omicron XBB.1.5 Spike Protein (partial)\nATGTTTGTTTTTCTTGTTTTATTGCCACTAGTCTCTAGTCAGTGTGTTAATCTTACAACCAGAACTCAATTACCCCCTGCA\nTACACTAATTCTTTCACACGTGGTGTTTATTACCCTGACCGAGTTTTCAGATCCTCAGTTTTACATTCAACTCAGGACTTGTT", "vaccines": ["XBB.1.5-updated bivalent booster (Pfizer, FDA approved 2023)", "XBB.1.5 monovalent booster (Moderna)", "Previous vaccines provide reduced but meaningful protection"], "symptoms": ["Fever", "Cough", "Fatigue", "Loss of taste/smell (less common than earlier variants)", "Dyspnea", "Sore throat", "Conjunctivitis"], "transmission": ["Airborne (highly efficient)", "Respiratory droplets", "Contact with contaminated surfaces (less significant)"], "mortality_rate": "0.2–0.5% (lower than prior variants due to immunity)", "geographic_distribution": "Global — dominated US, Europe, Asia in early 2023"},
]

# Remaining viruses (simpler entries)
STANDARD_VIRUSES = [
    {"id": 35, "name": "Rotavirus", "family": "Reoviridae", "genome_type": "dsRNA", "host": "Human, Animal", "discovery_year": 1973, "pandemic_risk": "Low", "genome_size_kb": 18.5, "ncbi_accession": "NC_011503.1", "vaccines": ["Rotarix (GSK)", "RotaTeq (Merck)", "ROTAVAC (Bharat Biotech)", "Rotasiil (SII)"]},
    {"id": 36, "name": "Herpes Simplex Virus 1", "family": "Herpesviridae", "genome_type": "dsDNA", "host": "Human", "discovery_year": 1919, "pandemic_risk": "Low", "genome_size_kb": 152.0, "ncbi_accession": "NC_001806.2", "vaccines": ["No licensed vaccine", "Prophylactic candidates in trials (HSV-529)", "Acyclovir/Valacyclovir for treatment/suppression"]},
    {"id": 37, "name": "Cytomegalovirus", "family": "Herpesviridae", "genome_type": "dsDNA", "host": "Human", "discovery_year": 1956, "pandemic_risk": "Low", "genome_size_kb": 235.0, "ncbi_accession": "NC_006273.2", "vaccines": ["No licensed vaccine", "mRNA-1647 (Moderna, Phase 3)", "V160 (Merck, Phase 2)"]},
    {"id": 38, "name": "Epstein-Barr Virus", "family": "Herpesviridae", "genome_type": "dsDNA", "host": "Human", "discovery_year": 1964, "pandemic_risk": "Low", "genome_size_kb": 172.0, "ncbi_accession": "NC_007605.1", "vaccines": ["No licensed vaccine", "mRNA-1189 (Moderna, Phase 1)", "Associated with multiple sclerosis — vaccine urgency increasing"]},
    {"id": 39, "name": "Adenovirus", "family": "Adenoviridae", "genome_type": "dsDNA", "host": "Human, Animal", "discovery_year": 1953, "pandemic_risk": "Low", "genome_size_kb": 36.0, "ncbi_accession": "NC_001405.1", "vaccines": ["Adenovirus type 4 and 7 vaccine (US Military oral)", "No licensed civilian vaccine for most serotypes"]},
    {"id": 40, "name": "Human Papillomavirus", "family": "Papillomaviridae", "genome_type": "dsDNA", "host": "Human", "discovery_year": 1983, "pandemic_risk": "Low", "genome_size_kb": 8.0, "ncbi_accession": "NC_001526.4", "vaccines": ["Gardasil 9 (Merck, 9-valent)", "Cervarix (GSK, bivalent)", "Cecolin (Innovax, bivalent, China)", "2–3 dose schedule, recommended age 9–26"]},
    {"id": 41, "name": "Enterovirus D68", "family": "Picornaviridae", "genome_type": "ssRNA(+)", "host": "Human", "discovery_year": 1962, "pandemic_risk": "Low", "genome_size_kb": 7.4, "ncbi_accession": "NC_038308.1", "vaccines": ["No licensed vaccine", "Linked to acute flaccid myelitis (AFM) in children"]},
    {"id": 42, "name": "Hendra Virus", "family": "Paramyxoviridae", "genome_type": "ssRNA(-)", "host": "Human, Horse, Bat", "discovery_year": 1994, "pandemic_risk": "Medium", "genome_size_kb": 18.2, "ncbi_accession": "NC_001906.3", "vaccines": ["Equivac HeV (licensed for horses in Australia, 2012)", "No licensed human vaccine", "mAb m102.4 (compassionate use for humans)"]},
    {"id": 43, "name": "Bourbon Virus", "family": "Thogotovirus", "genome_type": "ssRNA(-)", "host": "Human, Tick", "discovery_year": 2014, "pandemic_risk": "Low", "genome_size_kb": 9.2, "ncbi_accession": "KM212956.1", "vaccines": ["No vaccine", "Very rare — supportive care only"]},
    {"id": 44, "name": "Heartland Virus", "family": "Phenuiviridae", "genome_type": "ssRNA(-)", "host": "Human, Tick", "discovery_year": 2012, "pandemic_risk": "Low", "genome_size_kb": 6.4, "ncbi_accession": "NC_015462.1", "vaccines": ["No vaccine", "Lone Star tick prevention recommended"]},
    {"id": 45, "name": "Alkhurma Hemorrhagic Fever", "family": "Flaviviridae", "genome_type": "ssRNA(+)", "host": "Human, Tick", "discovery_year": 1995, "pandemic_risk": "Medium", "genome_size_kb": 10.7, "ncbi_accession": "NC_004355.1", "vaccines": ["No licensed vaccine", "Related to KFDV; research ongoing"]},
    {"id": 46, "name": "Usutu Virus", "family": "Flaviviridae", "genome_type": "ssRNA(+)", "host": "Human, Bird, Mosquito", "discovery_year": 1959, "pandemic_risk": "Low", "genome_size_kb": 11.0, "ncbi_accession": "NC_006551.1", "vaccines": ["No vaccine", "Cross-reactive immunity with WNV vaccination possible"]},
    {"id": 47, "name": "Sosuga Virus", "family": "Paramyxoviridae", "genome_type": "ssRNA(-)", "host": "Human, Bat", "discovery_year": 2012, "pandemic_risk": "Low", "genome_size_kb": 17.1, "ncbi_accession": "NC_022804.1", "vaccines": ["No vaccine", "Rare — only 1 human case documented"]},
    {"id": 48, "name": "Oropouche Virus", "family": "Peribunyaviridae", "genome_type": "ssRNA(-)", "host": "Human, Midge, Mosquito", "discovery_year": 1955, "pandemic_risk": "Low", "genome_size_kb": 12.0, "ncbi_accession": "NC_005776.1", "vaccines": ["No licensed vaccine", "Major epidemic in Brazil 2024 — urgent development needed"]},
    {"id": 49, "name": "Highly Path. Avian Influenza H7N9", "family": "Orthomyxoviridae", "genome_type": "ssRNA(-)", "host": "Avian, Human", "discovery_year": 2013, "pandemic_risk": "High", "genome_size_kb": 13.6, "ncbi_accession": "CY130078.1", "vaccines": ["Experimental H7N9 vaccines (US government stockpile)", "CBER-reviewed H7N9 vaccines (ongoing)", "No licensed commercial vaccine"]},
]

def make_standard(v):
    """Fill in defaults for simpler virus entries."""
    defaults = {
        "description": f"{v['name']} is a significant viral pathogen in the {v['family']} family with {v.get('pandemic_risk','Unknown').lower()} pandemic risk.",
        "fasta_sequence": f">{v['name']} (representative sequence — see NCBI {v.get('ncbi_accession','N/A')} for complete genome)\nATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCAT\nGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGCATGC",
        "symptoms": ["Fever", "Fatigue", "Myalgia", "Variable systemic effects"],
        "transmission": ["Variable — consult current outbreak data"],
        "mortality_rate": "Variable by strain, host factors, and medical access",
        "geographic_distribution": "Variable — consult WHO/CDC current distribution maps",
    }
    for k, val in defaults.items():
        v.setdefault(k, val)
    return v

ALL_VIRUSES = VIRUSES + REMAINING + [make_standard(v) for v in STANDARD_VIRUSES]

NCBI_BLAST_URL = "https://blast.ncbi.nlm.nih.gov/blast/Blast.cgi"

class BlastSubmitRequest(BaseModel):
    sequence: str
    program: str = "blastn"
    database: str = "nt"


@app.get("/api/healthz")
async def health_check():
    return {"status": "ok"}


@app.get("/api/viruses")
async def list_viruses():
    return ALL_VIRUSES


@app.post("/api/blast/submit")
async def blast_submit(body: BlastSubmitRequest):
    seq = body.sequence.strip()
    if not seq:
        raise HTTPException(status_code=400, detail="Sequence is required")

    # Strip FASTA header lines
    lines = [l for l in seq.split("\n") if not l.startswith(">")]
    clean_seq = "".join(lines).replace(" ", "").replace("\r", "")

    params = {
        "CMD": "Put",
        "PROGRAM": body.program,
        "DATABASE": body.database,
        "QUERY": clean_seq,
        "FORMAT_TYPE": "JSON2",
        "HITLIST_SIZE": "20",
        "EXPECT": "0.001",
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(NCBI_BLAST_URL, data=params)
            resp.raise_for_status()
            rid_match = re.search(r"RID = (\w+)", resp.text)
            if not rid_match:
                raise HTTPException(status_code=502, detail="NCBI did not return a RID")
            return {"rid": rid_match.group(1)}
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"NCBI BLAST error: {e.response.status_code}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"NCBI unreachable: {str(e)}")


@app.get("/api/blast/results")
async def blast_results(rid: str = Query(...)):
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            status_resp = await client.get(NCBI_BLAST_URL, params={"CMD": "Get", "FORMAT_OBJECT": "SearchInfo", "RID": rid})
            status_resp.raise_for_status()
            status_text = status_resp.text

            m = re.search(r"Status=(\w+)", status_text)
            status = m.group(1) if m else "UNKNOWN"

            if status in ("WAITING", "UNKNOWN"):
                return {"status": "waiting"}
            if status == "FAILED":
                raise HTTPException(status_code=400, detail="BLAST search failed")

            result_resp = await client.get(NCBI_BLAST_URL, params={"CMD": "Get", "RID": rid, "FORMAT_TYPE": "Text", "HITLIST_SIZE": "20"})
            result_resp.raise_for_status()
            hits = parse_blast_hits(result_resp.text)
            return {"status": "done", "hits": hits}
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"NCBI unreachable: {str(e)}")


def parse_blast_hits(text: str) -> list:
    hits = []
    accession_pattern = re.compile(r"(?:gb|ref|emb|dbj|sp|pir|prf|pdb)\|([A-Z0-9_.]+)\|")
    score_pattern = re.compile(r"Score\s*=\s*([\d.]+)\s*bits.*Expect\s*=\s*([\S]+)")
    identity_pattern = re.compile(r"Identities\s*=\s*\d+/\d+\s*\((\d+)%\)")

    current_hit = None
    in_alignments = False

    for line in text.split("\n"):
        if "Sequences producing significant alignments" in line:
            in_alignments = True
            continue
        if not in_alignments:
            continue
        if line.strip().startswith(">"):
            if current_hit and current_hit.get("score", 0) > 0:
                hits.append(current_hit)
            title = line.strip()[1:].strip()
            acc_m = accession_pattern.search(title)
            accession = acc_m.group(1) if acc_m else title[:20]
            current_hit = {"accession": accession, "title": title[:120], "score": 0, "evalue": "N/A", "identity": 0}
        elif current_hit:
            sm = score_pattern.search(line)
            if sm:
                current_hit["score"] = int(float(sm.group(1)))
                current_hit["evalue"] = sm.group(2)
            im = identity_pattern.search(line)
            if im:
                current_hit["identity"] = int(im.group(1))

    if current_hit and current_hit.get("score", 0) > 0:
        hits.append(current_hit)

    return hits[:20]


# ─── Azure static-file serving ──────────────────────────────────────────────
# When deployed to Azure, the built React app lives in a `static/` folder
# beside main.py. FastAPI serves it here; API routes above take priority.
from fastapi.responses import FileResponse
import pathlib

_STATIC_DIR = pathlib.Path(__file__).parent / "static"

if _STATIC_DIR.exists():
    @app.get("/{full_path:path}", include_in_schema=False)
    async def _serve_spa(full_path: str):
        target = _STATIC_DIR / full_path
        if target.is_file():
            return FileResponse(str(target))
        return FileResponse(str(_STATIC_DIR / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
