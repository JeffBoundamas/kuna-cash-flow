import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, ArrowRight } from "lucide-react";
import { useTontines } from "@/hooks/use-tontines";
import { formatXAF } from "@/lib/currency";

const TontineDashboardCard = () => {
  const { data: tontines = [] } = useTontines();
  const navigate = useNavigate();

  const activeTontines = useMemo(() => tontines.filter((t) => t.status === "active"), [tontines]);

  const totalMonthlyCommitment = useMemo(() => {
    return activeTontines.reduce((sum, t) => {
      if (t.frequency === "monthly") return sum + t.contribution_amount;
      return sum + t.contribution_amount * 4; // weekly ~4x/month
    }, 0);
  }, [activeTontines]);

  if (activeTontines.length === 0) return null;

  return (
    <button
      onClick={() => navigate("/portfolio")}
      className="w-full rounded-xl border border-gold/30 bg-gold-muted p-4 text-left hover:shadow-sm transition-shadow active:scale-[0.98] animate-fade-in"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gold" />
          <span className="text-sm font-semibold font-display">Tontines</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">{activeTontines.length} active(s)</p>
          <p className="font-semibold">{formatXAF(totalMonthlyCommitment)}/mois</p>
        </div>
        <div className="text-right">
          {activeTontines.slice(0, 1).map((t) => (
            <div key={t.id}>
              <p className="text-muted-foreground">Prochain pot</p>
              <p className="font-semibold text-gold">{formatXAF(t.contribution_amount * t.total_members)}</p>
            </div>
          ))}
        </div>
      </div>
    </button>
  );
};

export default TontineDashboardCard;
