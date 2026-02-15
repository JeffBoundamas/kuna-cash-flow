import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { PiggyBank } from "lucide-react";
import Accounts from "@/pages/Accounts";
import CreancesTab from "@/components/obligations/CreancesTab";

const TABS = [
  { key: "comptes", label: "Comptes" },
  { key: "tontines", label: "Tontines" },
  { key: "creances", label: "Créances" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const ComingSoon = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center px-6">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
      {icon}
    </div>
    <h2 className="font-semibold font-display mb-1">{label}</h2>
    <p className="text-sm text-muted-foreground">Bientôt disponible</p>
  </div>
);

const Portfolio = () => {
  const [activeTab, setActiveTab] = useState<TabKey>("comptes");
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
        {activeTab === "tontines" && (
          <ComingSoon
            icon={<PiggyBank className="h-8 w-8 text-muted-foreground" />}
            label="Tontines"
          />
        )}
        {activeTab === "creances" && <CreancesTab />}
      </div>
    </div>
  );
};

export default Portfolio;
