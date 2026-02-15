import { useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Accounts from "@/pages/Accounts";
import CreancesTab from "@/components/obligations/CreancesTab";
import TontinesTab from "@/components/tontines/TontinesTab";

const TABS = [
  { key: "comptes", label: "Comptes" },
  { key: "tontines", label: "Tontines" },
  { key: "creances", label: "Créances" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const SWIPE_THRESHOLD = 50;

const Portfolio = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (TABS.find(t => t.key === searchParams.get("tab"))?.key ?? "comptes") as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const [direction, setDirection] = useState(0); // -1 left, 1 right
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const prevIndex = useRef(TABS.findIndex(t => t.key === initialTab));

  const currentIndex = TABS.findIndex(t => t.key === activeTab);

  const changeTab = useCallback((newKey: TabKey) => {
    const newIndex = TABS.findIndex(t => t.key === newKey);
    setDirection(newIndex > prevIndex.current ? 1 : -1);
    prevIndex.current = newIndex;
    setActiveTab(newKey);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0 && currentIndex < TABS.length - 1) {
      changeTab(TABS[currentIndex + 1].key);
    } else if (dx > 0 && currentIndex > 0) {
      changeTab(TABS[currentIndex - 1].key);
    }
  }, [currentIndex, changeTab]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "30%" : "-30%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-30%" : "30%",
      opacity: 0,
    }),
  };

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold font-display">Portefeuille</h1>
      </div>

      {/* Horizontal tabs */}
      <div className="px-4">
        <div className="flex border-b border-border relative">
          {TABS.map((tab, i) => (
            <button
              key={tab.key}
              onClick={() => changeTab(tab.key)}
              className={cn(
                "flex-1 pb-2.5 pt-1 text-sm font-medium text-center transition-colors relative",
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
          {/* Animated indicator */}
          <motion.span
            className="absolute bottom-0 h-0.5 rounded-full bg-primary"
            animate={{
              left: `calc(${currentIndex} * 100% / 3 + 0.5rem)`,
              width: `calc(100% / 3 - 1rem)`,
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>
      </div>

      {/* Tab content with swipe + slide animation */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={activeTab}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full"
          >
            {activeTab === "comptes" && <Accounts />}
            {activeTab === "tontines" && <TontinesTab />}
            {activeTab === "creances" && <CreancesTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Portfolio;
