import { useState, useCallback } from "react";
import { Shield, MapPin, GraduationCap, Target, Plus, Wallet, Heart, Home, Car, Plane, Trash2, Pencil } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import { useGoals, useDeleteGoal } from "@/hooks/use-goals";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import AddGoalSheet from "@/components/goals/AddGoalSheet";
import EditGoalSheet from "@/components/goals/EditGoalSheet";
import AddFundsSheet from "@/components/goals/AddFundsSheet";
import GoalCelebration from "@/components/goals/GoalCelebration";
import type { Goal } from "@/lib/types";
import { toast } from "sonner";

const iconMap: Record<string, React.ElementType> = {
  shield: Shield,
  "map-pin": MapPin,
  "graduation-cap": GraduationCap,
  target: Target,
  heart: Heart,
  home: Home,
  car: Car,
  plane: Plane,
};

const GoalsPage = () => {
  const { data: goals = [], isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();
  const [addOpen, setAddOpen] = useState(false);
  const [fundsGoal, setFundsGoal] = useState<Goal | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const handleCelebrationDone = useCallback(() => setCelebrating(false), []);

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-5">
        <Skeleton className="h-8 w-32" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <GoalCelebration show={celebrating} onDone={handleCelebrationDone} />

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold font-display">Objectifs</h1>
        <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" /> Nouveau
        </Button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 space-y-3 animate-fade-in">
          <Target className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aucun objectif défini.<br />Créez votre premier objectif d'épargne !
          </p>
        </div>
      ) : (
        goals.map((goal, i) => {
          const Icon = iconMap[goal.icon] || Target;
          const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
          const remaining = Math.max(0, goal.target_amount - goal.current_amount);
          const isComplete = pct >= 100;

          // Projected completion
          const createdAt = new Date(goal.created_at);
          const now = new Date();
          const daysSinceCreation = Math.max(1, Math.round((now.getTime() - createdAt.getTime()) / 86400000));
          const dailyRate = goal.current_amount / daysSinceCreation;
          const daysToComplete = dailyRate > 0 ? Math.ceil(remaining / dailyRate) : null;
          const projectedDate = daysToComplete !== null
            ? new Date(now.getTime() + daysToComplete * 86400000)
            : null;

          // Deadline info
          const deadline = new Date(goal.deadline);
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
                isComplete
                  ? "bg-emerald-light border-emerald-dark/30"
                  : goal.is_emergency_fund
                    ? "bg-gold-muted border-accent/30"
                    : "bg-card border-border"
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0",
                    isComplete
                      ? "bg-emerald-dark text-white"
                      : goal.is_emergency_fund
                        ? "bg-accent text-accent-foreground"
                        : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold font-display">{goal.name}</h3>
                    {isComplete && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-dark text-white">
                        ATTEINT ✓
                      </span>
                    )}
                    {!isComplete && goal.is_emergency_fund && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent text-accent-foreground">
                        PRIORITÉ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Échéance:{" "}
                    {deadline.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
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
                      isComplete
                        ? "bg-emerald-dark"
                        : goal.is_emergency_fund ? "bg-accent" : "bg-primary"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
                  <span>{formatXAF(goal.current_amount)}</span>
                  <span>{formatXAF(goal.target_amount)}</span>
                </div>
              </div>

              {/* Monthly suggestion + projection */}
              {!isComplete && (
                <div className="mt-3 rounded-lg bg-background p-2.5 text-xs space-y-1">
                  <p className="text-muted-foreground">
                    Épargnez{" "}
                    <span className="font-bold text-foreground">{formatXAF(monthlyNeeded)}</span>
                    /mois pour atteindre votre objectif
                    {monthsLeft > 0 && ` en ${monthsLeft} mois`}.
                  </p>
                  {projectedDate && dailyRate > 0 && (
                    <p className="text-muted-foreground">
                      📊 Au rythme actuel, objectif atteint vers{" "}
                      <span className="font-bold text-foreground">
                        {projectedDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="mt-3 flex gap-2">
                {!isComplete && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8 text-xs gap-1.5"
                    onClick={() => setFundsGoal(goal)}
                  >
                    <Wallet className="h-3.5 w-3.5" /> Ajouter des fonds
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                  onClick={() => setEditGoal(goal)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm("Supprimer cet objectif ?")) {
                      deleteGoal.mutate(goal.id, {
                        onSuccess: () => toast.success("Objectif supprimé"),
                      });
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
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
        </p>
      </div>

      <AddGoalSheet open={addOpen} onOpenChange={setAddOpen} />
      <EditGoalSheet
        open={!!editGoal}
        onOpenChange={(v) => { if (!v) setEditGoal(null); }}
        goal={editGoal}
      />
      <AddFundsSheet
        open={!!fundsGoal}
        onOpenChange={(v) => { if (!v) setFundsGoal(null); }}
        goal={fundsGoal}
        onGoalReached={() => setCelebrating(true)}
      />
    </div>
  );
};

export default GoalsPage;
