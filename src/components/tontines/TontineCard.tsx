import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Calendar, ArrowRight, Badge as BadgeIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatXAF } from "@/lib/currency";
import type { Tontine, TontineMember } from "@/lib/tontine-types";
import { getNextContributionDate } from "@/lib/tontine-types";

interface Props {
  tontine: Tontine;
  members: TontineMember[];
}

const TontineCard = ({ tontine, members }: Props) => {
  const navigate = useNavigate();

  const currentMember = useMemo(
    () => members.find((m) => m.position_in_order === tontine.current_cycle),
    [members, tontine.current_cycle]
  );

  const myMember = useMemo(() => members.find((m) => m.is_current_user), [members]);
  const isMyTurn = currentMember?.is_current_user;
  const potAmount = tontine.contribution_amount * tontine.total_members;
  const nextContribDate = useMemo(
    () => tontine.status === "active" ? getNextContributionDate(tontine.start_date, tontine.frequency, tontine.current_cycle) : null,
    [tontine]
  );

  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98] border-l-4"
      style={{ borderLeftColor: isMyTurn ? "hsl(var(--gold))" : "hsl(var(--primary))" }}
      onClick={() => navigate(`/tontines/${tontine.id}`)}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="font-semibold font-display text-sm">{tontine.name}</h3>
          <p className="text-xs text-muted-foreground">
            {formatXAF(tontine.contribution_amount)} / {tontine.frequency === "monthly" ? "mois" : "semaine"}
          </p>
        </div>
        {isMyTurn && (
          <Badge className="bg-gold text-gold-foreground text-[10px] animate-pulse">
            🎉 Votre tour !
          </Badge>
        )}
        {tontine.status === "completed" && (
          <Badge variant="secondary" className="text-[10px]">Terminée</Badge>
        )}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>{tontine.total_members} membres</span>
        </div>
        {nextContribDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Prochaine : {nextContribDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        <div>
          <p className="text-[10px] text-muted-foreground">Tour actuel</p>
          <p className="text-xs font-medium">{currentMember?.member_name ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Pot</p>
          <p className="text-xs font-bold text-gold">{formatXAF(potAmount)}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </Card>
  );
};

export default TontineCard;
