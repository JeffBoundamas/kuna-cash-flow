import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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

const Portfolio = () => {
  const [searchParams] = useSearchParams();
  const initialTab = (TABS.find(t => t.key === searchParams.get("tab"))?.key ?? "comptes") as TabKey;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col min-h-0">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold font-display">Portefeuille</h1>
      </div>

      {/* Horizontal tabs */}
      <div className="px-4">
        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-1 pb-2.5 pt-1 text-sm font-medium text-center transition-colors relative",
                activeTab === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div ref={containerRef} className="flex-1 overflow-y-auto">
        {activeTab === "comptes" && <Accounts />}
        {activeTab === "tontines" && <TontinesTab />}
        {activeTab === "creances" && <CreancesTab />}
      </div>
    </div>
  );
};

export default Portfolio;
