import { useState, useMemo } from "react";
import { Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTontines, useTontineMembers } from "@/hooks/use-tontines";
import TontineCard from "@/components/tontines/TontineCard";
import CreateTontineSheet from "@/components/tontines/CreateTontineSheet";
import type { TontineMember } from "@/lib/tontine-types";

// Wrapper to load members for each tontine card
const TontineCardWithMembers = ({ tontine }: { tontine: any }) => {
  const { data: members = [] } = useTontineMembers(tontine.id);
  return <TontineCard tontine={tontine} members={members} />;
};

const TontinesPage = () => {
  const { data: tontines = [], isLoading } = useTontines();
  const [createOpen, setCreateOpen] = useState(false);

  const activeTontines = tontines.filter((t) => t.status === "active");
  const completedTontines = tontines.filter((t) => t.status === "completed");

  if (isLoading) {
    return (
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display">Tontines</h1>
          <p className="text-xs text-muted-foreground">{activeTontines.length} active(s)</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nouvelle
        </Button>
      </div>

      {tontines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-muted mb-4">
            <Users className="h-8 w-8 text-gold" />
          </div>
          <h2 className="font-semibold font-display mb-1">Aucune tontine</h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-xs">
            Créez votre première tontine pour suivre vos cotisations et tours de pot.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Créer une tontine
          </Button>
        </div>
      ) : (
        <>
          {activeTontines.length > 0 && (
            <div className="space-y-3">
              {activeTontines.map((t) => (
                <TontineCardWithMembers key={t.id} tontine={t} />
              ))}
            </div>
          )}

          {completedTontines.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">Terminées</h2>
              {completedTontines.map((t) => (
                <TontineCardWithMembers key={t.id} tontine={t} />
              ))}
            </div>
          )}
        </>
      )}

      <CreateTontineSheet open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
};

export default TontinesPage;
