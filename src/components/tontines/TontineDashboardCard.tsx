import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, Calendar, ArrowRight, Sparkles } from "lucide-react";
import { useTontines } from "@/hooks/use-tontines";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatXAF } from "@/lib/currency";
import type { TontineMember } from "@/lib/tontine-types";

const TontineDashboardCard = () => {
  const { data: tontines = [] } = useTontines();
  const { user } = useAuth();
  const navigate = useNavigate();

  const activeTontines = useMemo(() => tontines.filter((t) => t.status === "active"), [tontines]);
  const activeTontineIds = useMemo(() => activeTontines.map((t) => t.id), [activeTontines]);

  // Fetch all members for active tontines
  const { data: allMembers = [] } = useQuery({
    queryKey: ["tontine_members_all", activeTontineIds],
    queryFn: async () => {
      if (activeTontineIds.length === 0) return [];
      const { data, error } = await supabase
        .from("tontine_members")
        .select("*")
        .in("tontine_id", activeTontineIds)
        .order("position_in_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as TontineMember[];
    },
    enabled: !!user && activeTontineIds.length > 0,
  });

  const totalMonthlyCommitment = useMemo(() => {
    return activeTontines.reduce((sum, t) => {
      if (t.frequency === "monthly") return sum + t.contribution_amount;
      return sum + t.contribution_amount * 4;
    }, 0);
  }, [activeTontines]);

  // Compute next event across all active tontines
  const nextEvent = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let best: { label: string; date: Date; type: "contribution" | "pot" } | null = null;

    for (const tontine of activeTontines) {
      const members = allMembers.filter((m) => m.tontine_id === tontine.id);
      const myMember = members.find((m) => m.is_current_user);

      // Next contribution: cycle-based date
      const nextCycleDate = new Date(tontine.start_date);
      if (tontine.frequency === "monthly") {
        nextCycleDate.setMonth(nextCycleDate.getMonth() + tontine.current_cycle - 1);
      } else {
        nextCycleDate.setDate(nextCycleDate.getDate() + (tontine.current_cycle - 1) * 7);
      }

      if (nextCycleDate >= today) {
        if (!best || nextCycleDate < best.date) {
          best = {
            label: `Cotisation ${tontine.name}`,
            date: nextCycleDate,
            type: "contribution",
          };
        }
      }

      // Pot to receive
      if (myMember && !myMember.has_received_pot && myMember.payout_date) {
        const payoutDate = new Date(myMember.payout_date);
        if (payoutDate >= today) {
          if (!best || payoutDate < best.date) {
            best = {
              label: `Pot ${tontine.name}`,
              date: payoutDate,
              type: "pot",
            };
          }
        }
      }
    }

    return best;
  }, [activeTontines, allMembers]);

  const daysUntil = useMemo(() => {
    if (!nextEvent) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil((nextEvent.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [nextEvent]);

  if (activeTontines.length === 0) return null;

  return (
    <button
      onClick={() => navigate("/portfolio?tab=tontines")}
      className="w-full rounded-xl border border-gold/30 bg-gold-muted p-4 text-left hover:shadow-sm transition-shadow active:scale-[0.98] animate-fade-in"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gold" />
          <span className="text-sm font-semibold font-display">Tontines</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-muted-foreground">{activeTontines.length} active{activeTontines.length > 1 ? "s" : ""}</p>
          <p className="font-semibold text-sm">{formatXAF(totalMonthlyCommitment)}<span className="text-muted-foreground font-normal">/mois</span></p>
        </div>
        <div className="text-right">
          <p className="text-muted-foreground">Prochain pot</p>
          <p className="font-semibold text-sm text-gold">
            {activeTontines.length > 0
              ? formatXAF(activeTontines[0].contribution_amount * activeTontines[0].total_members)
              : "—"}
          </p>
        </div>
      </div>

      {nextEvent && daysUntil !== null && (
        <div className="mt-3 pt-3 border-t border-gold/20 flex items-center gap-2">
          {nextEvent.type === "pot" ? (
            <Sparkles className="h-3.5 w-3.5 text-gold flex-shrink-0" />
          ) : (
            <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          )}
          <p className={`text-xs ${nextEvent.type === "pot" ? "text-gold font-semibold" : "text-muted-foreground"}`}>
            {nextEvent.label}
            {daysUntil === 0
              ? " — Aujourd'hui !"
              : daysUntil === 1
              ? " — Demain"
              : ` dans ${daysUntil} jours`}
          </p>
        </div>
      )}
    </button>
  );
};

export default TontineDashboardCard;
