import { Shield, MapPin, GraduationCap, Target } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { useGoals } from "@/hooks/use-goals";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  "map-pin": MapPin,
  "graduation-cap": GraduationCap,
};

const GoalsPage = () => {
  const { data: goals = [], isLoading } = useGoals();

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-5">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Objectifs</h1>
        <div className="flex items-center gap-1 text-xs text-primary font-medium">
          <Target className="h-3.5 w-3.5" />
          SMART
        </div>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Aucun objectif défini. Créez votre premier objectif d'épargne !
        </p>
      ) : (
        goals.map((goal, i) => {
          const Icon = iconMap[goal.icon] || Target;
          const pct = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
          const remaining = goal.target_amount - goal.current_amount;
          const deadline = new Date(goal.deadline);
          const now = new Date();
          const monthsLeft = Math.max(
            0,
            (deadline.getFullYear() - now.getFullYear()) * 12 + deadline.getMonth() - now.getMonth()
          );
          const monthlyNeeded = monthsLeft > 0 ? Math.round(remaining / monthsLeft) : remaining;

          return (
            <div
              key={goal.id}
              className={cn(
                "rounded-2xl border p-4 animate-fade-in",
                goal.is_emergency_fund
                  ? "bg-gold-muted border-accent/30"
                  : "bg-card border-border"
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0",
                    goal.is_emergency_fund
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-display">{goal.name}</h3>
                    {goal.is_emergency_fund && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground">
                        PRIORITÉ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Échéance:{" "}
                    {deadline.toLocaleDateString("fr-FR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <p className="text-sm font-bold font-display text-primary">{pct}%</p>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      goal.is_emergency_fund ? "bg-accent" : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
                  <span>{formatXAF(goal.current_amount)}</span>
                  <span>{formatXAF(goal.target_amount)}</span>
                </div>
              </div>

              {/* Monthly suggestion */}
              <div className="mt-3 rounded-lg bg-background p-2.5 text-xs">
                <p className="text-muted-foreground">
                  Épargnez{" "}
                  <span className="font-bold text-foreground">
                    {formatXAF(monthlyNeeded)}
                  </span>
                  /mois pour atteindre votre objectif
                  {monthsLeft > 0 && ` en ${monthsLeft} mois`}.
                </p>
              </div>
            </div>
          );
        })
      )}

      {/* Emergency Fund Info */}
      <div className="rounded-xl border border-border bg-card p-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
        <h3 className="text-sm font-bold font-display mb-2">💡 Matelas de Sécurité</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Votre fonds d'urgence devrait couvrir <span className="font-semibold text-foreground">3 à 6 mois</span> de
          dépenses essentielles. C'est votre filet de sécurité avant d'investir.
          Selon le principe <span className="font-semibold text-foreground">FIRE</span>, priorisez cette épargne de précaution.
        </p>
      </div>
    </div>
  );
};

export default GoalsPage;
