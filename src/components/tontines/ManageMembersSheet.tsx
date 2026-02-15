import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Trash2, Plus, Lock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useTontineMembers,
  useUpdateTontineMember,
  useAddTontineMember,
  useDeleteTontineMember,
  useBatchUpdateMemberPositions,
} from "@/hooks/use-tontines";
import { supabase } from "@/integrations/supabase/client";
import type { Tontine, TontineMember } from "@/lib/tontine-types";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tontine: Tontine;
}

const calcPayoutDate = (startDate: string, frequency: "weekly" | "monthly", position: number): string => {
  const d = new Date(startDate);
  if (frequency === "monthly") {
    d.setMonth(d.getMonth() + position - 1);
  } else {
    d.setDate(d.getDate() + (position - 1) * 7);
  }
  return d.toISOString().split("T")[0];
};

/* ─── Sortable Member Row ─── */
const SortableMemberRow = ({
  member,
  index,
  canDelete,
  isLocked,
  onUpdateName,
  onUpdatePhone,
  onSetCurrentUser,
  onDelete,
}: {
  member: TontineMember;
  index: number;
  canDelete: boolean;
  isLocked: boolean;
  onUpdateName: (name: string) => void;
  onUpdatePhone: (phone: string) => void;
  onSetCurrentUser: () => void;
  onDelete: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
    disabled: isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3",
        isLocked ? "bg-muted/50 border-muted opacity-60" : "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        {isLocked ? (
          <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <button
            type="button"
            className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <span className="text-xs text-muted-foreground w-6 flex-shrink-0 font-mono">#{index + 1}</span>
        <Input
          value={member.member_name}
          onChange={(e) => onUpdateName(e.target.value)}
          className="h-8 text-sm flex-1"
          disabled={isLocked}
        />
        <button
          onClick={onSetCurrentUser}
          className="flex-shrink-0"
        >
          <Badge
            className={cn(
              "text-[10px] cursor-pointer",
              member.is_current_user
                ? "bg-gold text-gold-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {member.is_current_user ? "Moi ⭐" : "Moi ?"}
          </Badge>
        </button>
        {canDelete && !isLocked && (
          <button
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 ml-12">
        <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        <Input
          value={member.phone_number || ""}
          onChange={(e) => onUpdatePhone(e.target.value)}
          placeholder="+241 XX XX XX XX"
          className="h-7 text-xs flex-1"
          disabled={isLocked}
        />
        {member.phone_number && (
          <a
            href={`https://wa.me/${member.phone_number.replace(/[\s+\-]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center rounded-full hover:bg-[#25D366]/10"
            onClick={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#25D366]">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
};

/* ─── Main Sheet ─── */
const ManageMembersSheet = ({ open, onOpenChange, tontine }: Props) => {
  const { data: dbMembers = [] } = useTontineMembers(tontine.id);
  const [localMembers, setLocalMembers] = useState<TontineMember[]>([]);
  const updateMember = useUpdateTontineMember();
  const addMember = useAddTontineMember();
  const deleteMember = useDeleteTontineMember();
  const batchUpdate = useBatchUpdateMemberPositions();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (open && dbMembers.length > 0) {
      setLocalMembers([...dbMembers].sort((a, b) => a.position_in_order - b.position_in_order));
    }
  }, [open, dbMembers]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalMembers((prev) => {
      const oldIdx = prev.findIndex((m) => m.id === active.id);
      const newIdx = prev.findIndex((m) => m.id === over.id);
      const reordered = arrayMove(prev, oldIdx, newIdx);

      // Recalculate positions and payout dates
      const updated = reordered.map((m, i) => ({
        ...m,
        position_in_order: i + 1,
        payout_date: calcPayoutDate(tontine.start_date, tontine.frequency, i + 1),
      }));

      // Persist
      batchUpdate.mutate(
        updated.map((m) => ({
          id: m.id,
          position_in_order: m.position_in_order,
          payout_date: m.payout_date,
        })),
        {
          onSuccess: () => toast.success("Ordre mis à jour. Nouvelles dates calculées."),
        }
      );

      return updated;
    });
  };

  const handleUpdateName = (id: string, name: string) => {
    setLocalMembers((prev) => prev.map((m) => (m.id === id ? { ...m, member_name: name } : m)));
  };

  const handleSaveName = (member: TontineMember) => {
    if (!member.member_name.trim()) return;
    // Check uniqueness
    const duplicate = localMembers.some(
      (m) => m.id !== member.id && m.member_name.trim().toLowerCase() === member.member_name.trim().toLowerCase()
    );
    if (duplicate) {
      toast.error("Ce nom existe déjà dans cette tontine");
      return;
    }
    updateMember.mutate({ id: member.id, member_name: member.member_name.trim() });
  };

  const handleUpdatePhone = (id: string, phone: string) => {
    setLocalMembers((prev) => prev.map((m) => (m.id === id ? { ...m, phone_number: phone } : m)));
  };

  const handleSavePhone = (member: TontineMember) => {
    updateMember.mutate({ id: member.id, phone_number: member.phone_number || null });
  };

  const handleSetCurrentUser = (id: string) => {
    // Unset all others, set this one
    localMembers.forEach((m) => {
      if (m.is_current_user && m.id !== id) {
        updateMember.mutate({ id: m.id, is_current_user: false });
      }
    });
    updateMember.mutate({ id, is_current_user: true });
    setLocalMembers((prev) =>
      prev.map((m) => ({ ...m, is_current_user: m.id === id }))
    );
    toast.success("Membre « Moi » mis à jour");
  };

  const handleAddMember = () => {
    const newPos = localMembers.length + 1;
    const payoutDate = calcPayoutDate(tontine.start_date, tontine.frequency, newPos);
    addMember.mutate(
      {
        tontine_id: tontine.id,
        member_name: `Membre ${newPos}`,
        position_in_order: newPos,
        payout_date: payoutDate,
      },
      {
        onSuccess: () => {
          // Update total_members on tontine
          supabase
            .from("tontines")
            .update({ total_members: newPos })
            .eq("id", tontine.id)
            .then(() => {
              toast.success("Membre ajouté");
            });
        },
      }
    );
  };

  const handleDeleteMember = (member: TontineMember) => {
    if (member.has_received_pot) {
      toast.error("Impossible de supprimer un membre ayant déjà reçu le pot");
      return;
    }
    if (localMembers.length <= 2) {
      toast.error("Minimum 2 membres par tontine");
      return;
    }
    if (!confirm(`Supprimer ${member.member_name} ?`)) return;

    deleteMember.mutate(member.id, {
      onSuccess: () => {
        const remaining = localMembers
          .filter((m) => m.id !== member.id)
          .map((m, i) => ({
            ...m,
            position_in_order: i + 1,
            payout_date: calcPayoutDate(tontine.start_date, tontine.frequency, i + 1),
          }));
        setLocalMembers(remaining);
        // Update positions + total_members
        batchUpdate.mutate(
          remaining.map((m) => ({
            id: m.id,
            position_in_order: m.position_in_order,
            payout_date: m.payout_date,
          }))
        );
        supabase
          .from("tontines")
          .update({ total_members: remaining.length })
          .eq("id", tontine.id);
        toast.success("Membre supprimé");
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Gérer les membres</SheetTitle>
        </SheetHeader>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          Glissez pour réorganiser. Les membres ayant reçu le pot sont verrouillés.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={localMembers.map((m) => m.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pb-2">
              {localMembers.map((m, i) => (
                <SortableMemberRow
                  key={m.id}
                  member={m}
                  index={i}
                  canDelete={localMembers.length > 2}
                  isLocked={m.has_received_pot}
                  onUpdateName={(name) => handleUpdateName(m.id, name)}
                  onUpdatePhone={(phone) => handleUpdatePhone(m.id, phone)}
                  onSetCurrentUser={() => handleSetCurrentUser(m.id)}
                  onDelete={() => handleDeleteMember(m)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Button variant="outline" className="w-full mt-3 gap-2" onClick={handleAddMember}>
          <Plus className="h-4 w-4" />
          Ajouter un membre
        </Button>

        <Button
          className="w-full mt-3"
          onClick={() => {
            // Save all pending name/phone changes
            localMembers.forEach((m) => {
              const original = dbMembers.find((db) => db.id === m.id);
              if (original && (original.member_name !== m.member_name || original.phone_number !== m.phone_number)) {
                updateMember.mutate({
                  id: m.id,
                  member_name: m.member_name.trim(),
                  phone_number: m.phone_number || null,
                });
              }
            });
            toast.success("Modifications enregistrées");
            onOpenChange(false);
          }}
        >
          Enregistrer
        </Button>
      </SheetContent>
    </Sheet>
  );
};

export default ManageMembersSheet;
