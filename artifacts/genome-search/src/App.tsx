import { useState, createContext, useContext, useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import { Hero } from "@/components/Hero";
import { StatsBar } from "@/components/StatsBar";
import { DatabaseBrowser } from "@/components/DatabaseBrowser";
import { BlastSearch } from "@/components/BlastSearch";
import { BlastAnalysis } from "@/components/BlastAnalysis";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { Virus } from "@workspace/api-client-react";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 60_000 } },
});

export type AppTab = "database" | "blast" | "results";

interface AppCtx {
  activeTab: AppTab;
  setActiveTab: (t: AppTab) => void;
  blastTarget: Virus | null;
  setBlastTarget: (v: Virus | null) => void;
  blastRid: string | null;
  setBlastRid: (rid: string | null) => void;
  blastSequence: string;
  setBlastSequence: (s: string) => void;
}

export const AppContext = createContext<AppCtx>({
  activeTab: "database",
  setActiveTab: () => {},
  blastTarget: null,
  setBlastTarget: () => {},
  blastRid: null,
  setBlastRid: () => {},
  blastSequence: "",
  setBlastSequence: () => {},
});

export function useApp() {
  return useContext(AppContext);
}

// Track direction for slide transitions
const TAB_ORDER: AppTab[] = ["database", "blast", "results"];

const TAB_CONFIG: { id: AppTab; label: string; icon: string }[] = [
  { id: "database", label: "VIRAL DATABASE", icon: "🧬" },
  { id: "blast", label: "BLAST SEARCH", icon: "🔬" },
  { id: "results", label: "RESULTS", icon: "📊" },
];

// Page transition variants with directional slide
function pageVariants(direction: number) {
  return {
    initial: { opacity: 0, x: direction * 60, filter: "blur(6px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)" },
    exit: { opacity: 0, x: direction * -60, filter: "blur(6px)" },
  };
}

function AppShell() {
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTabState] = useState<AppTab>("database");
  const prevTabRef = useRef<AppTab>("database");
  const [direction, setDirection] = useState(0);
  const [blastTarget, setBlastTarget] = useState<Virus | null>(null);
  const [blastRid, setBlastRid] = useState<string | null>(null);
  const [blastSequence, setBlastSequence] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navigate = (tab: AppTab) => {
    const prevIdx = TAB_ORDER.indexOf(prevTabRef.current);
    const nextIdx = TAB_ORDER.indexOf(tab);
    setDirection(nextIdx > prevIdx ? 1 : -1);
    prevTabRef.current = tab;
    setActiveTabState(tab);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  };

  return (
    <AppContext.Provider value={{
      activeTab,
      setActiveTab: navigate,
      blastTarget, setBlastTarget,
      blastRid, setBlastRid,
      blastSequence, setBlastSequence,
    }}>
      {/* Cinematic boot loader */}
      <AnimatePresence>
        {booting && <LoadingScreen onComplete={() => setBooting(false)} />}
      </AnimatePresence>

      {/* Main app — fades in after boot */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: booting ? 0 : 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ minHeight: "100vh", background: "#020408", position: "relative", overflowX: "hidden" }}
      >
        {/* Ambient grid overlay */}
        <div className="ambient-grid" />

        {/* Hero — only on database tab */}
        <AnimatePresence>
          {activeTab === "database" && !booting && (
            <motion.div
              key="hero-block"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40, transition: { duration: 0.25 } }}
              transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Hero onSectionChange={(s) => navigate(s as AppTab)} />
              <StatsBar />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Bar */}
        <motion.div
          className={`nav-bar ${scrolled ? "nav-bar--scrolled" : ""}`}
          style={{ position: "sticky", top: 0, zIndex: 100 }}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: booting ? -60 : 0, opacity: booting ? 0 : 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        >
          <div className="nav-bar__inner">
            {/* Logo */}
            <div className="nav-logo">
              <motion.span
                className="nav-logo__symbol"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >⬡</motion.span>
              <span className="nav-logo__text">VGI</span>
            </div>

            {/* Tabs */}
            <nav className="nav-tabs">
              {TAB_CONFIG.map((t) => (
                <motion.button
                  key={t.id}
                  className={`nav-tab ${activeTab === t.id ? "nav-tab--active" : ""}`}
                  onClick={() => navigate(t.id)}
                  whileHover={{ color: "#7ab8d4" }}
                  whileTap={{ scale: 0.96 }}
                >
                  <span className="nav-tab__icon">{t.icon}</span>
                  <span className="nav-tab__label">{t.label}</span>
                  {activeTab === t.id && (
                    <motion.div
                      className="nav-tab__bar"
                      layoutId="nav-active-bar"
                      transition={{ type: "spring", stiffness: 600, damping: 40 }}
                    />
                  )}
                </motion.button>
              ))}
            </nav>

            {/* Status badge */}
            <div className="nav-status">
              <motion.span
                className="nav-status__dot"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
              <span className="nav-status__text">NCBI · LIVE</span>
            </div>
          </div>
        </motion.div>

        {/* Page content with directional slide transitions */}
        <main style={{ minHeight: "80vh" }}>
          <AnimatePresence mode="wait" custom={direction}>
            {activeTab === "database" && (
              <motion.div
                key="page-database"
                custom={direction}
                variants={pageVariants(direction)}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <DatabaseBrowser />
              </motion.div>
            )}
            {activeTab === "blast" && (
              <motion.div
                key="page-blast"
                custom={direction}
                variants={pageVariants(direction)}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <BlastSearch />
              </motion.div>
            )}
            {activeTab === "results" && (
              <motion.div
                key="page-results"
                custom={direction}
                variants={pageVariants(direction)}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <BlastAnalysis />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        <motion.footer
          className="app-footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <div className="app-footer__inner">
            <span className="app-footer__logo">🧬 VIRAL GENOME INTELLIGENCE SYSTEM v3.0</span>
            <span className="app-footer__meta">NCBI BLAST · 49 Pathogens · Research Use Only · {new Date().getFullYear()}</span>
          </div>
        </motion.footer>
      </motion.div>
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
