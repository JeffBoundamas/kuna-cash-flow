import { useState, useId } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, X, GripVertical } from "lucide-react";
import { useCreateTontine } from "@/hooks/use-tontines";
import { formatXAF, parseAmount } from "@/lib/currency";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
}

interface MemberInput {
  id: string;
  name: string;
  is_current_user: boolean;
}

let nextMemberId = 1;
const createMember = (is_current_user = false): MemberInput => ({
  id: `member-${nextMemberId++}`,
  name: "",
  is_current_user,
});

/* ── Sortable member row ── */
const SortableMemberRow = ({
  member,
  index,
  canRemove,
  onUpdate,
  onRemove,
}: {
  member: MemberInput;
  index: number;
  canRemove: boolean;
  onUpdate: (field: keyof MemberInput, value: string | boolean) => void;
  onRemove: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto" as any,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        type="button"
        className="touch-none cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-xs text-muted-foreground w-5 flex-shrink-0">#{index + 1}</span>
      <Input
        placeholder={`Membre ${index + 1}`}
        value={member.name}
        onChange={(e) => onUpdate("name", e.target.value)}
        className="h-9 text-sm"
      />
      <div className="flex items-center gap-1 flex-shrink-0">
        <Switch
          checked={member.is_current_user}
          onCheckedChange={(v) => onUpdate("is_current_user", v)}
          className="scale-75"
        />
        <span className="text-[10px] text-muted-foreground">Moi</span>
      </div>
      {canRemove && (
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

/* ── Main sheet ── */
const CreateTontineSheet = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("monthly");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [members, setMembers] = useState<MemberInput[]>([
    createMember(true),
    createMember(),
  ]);

  const createTontine = useCreateTontine();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const potAmount = parseAmount(amountStr) * members.length;

  const addMember = () => setMembers([...members, createMember()]);

  const removeMember = (idx: number) => {
    if (members.length <= 2) return;
    setMembers(members.filter((_, i) => i !== idx));
  };

  const updateMember = (idx: number, field: keyof MemberInput, value: string | boolean) => {
    const updated = [...members];
    if (field === "is_current_user" && value === true) {
      updated.forEach((m) => (m.is_current_user = false));
    }
    (updated[idx] as any)[field] = value;
    setMembers(updated);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMembers((prev) => {
        const oldIndex = prev.findIndex((m) => m.id === active.id);
        const newIndex = prev.findIndex((m) => m.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = () => {
    const amount = parseAmount(amountStr);
    if (!name.trim() || amount <= 0 || members.some((m) => !m.name.trim())) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    if (!members.some((m) => m.is_current_user)) {
      toast.error("Indiquez quel membre est vous");
      return;
    }

    createTontine.mutate(
      {
        name: name.trim(),
        total_members: members.length,
        contribution_amount: amount,
        frequency,
        start_date: startDate,
        members: members.map((m) => ({ name: m.name.trim(), is_current_user: m.is_current_user })),
      },
      {
        onSuccess: () => {
          toast.success("Tontine créée !");
          onOpenChange(false);
          setName("");
          setAmountStr("");
          setMembers([createMember(true), createMember()]);
        },
        onError: () => toast.error("Erreur lors de la création"),
      }
    );
  };

  // Find current user's position
  const myIndex = members.findIndex((m) => m.is_current_user);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nouvelle Tontine</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Nom de la tontine</Label>
            <Input placeholder="Ex: Tontine du quartier" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cotisation (FCFA)</Label>
              <Input type="number" inputMode="numeric" placeholder="50000" value={amountStr} onChange={(e) => setAmountStr(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fréquence</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensuelle</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Date de début</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          {potAmount > 0 && (
            <div className="rounded-xl bg-gold-muted p-3 text-center">
              <p className="text-xs text-muted-foreground">Pot total</p>
              <p className="text-lg font-bold font-display text-gold">{formatXAF(potAmount)}</p>
            </div>
          )}

          {myIndex >= 0 && potAmount > 0 && (
            <div className="rounded-xl bg-muted/50 p-3 text-center">
              <p className="text-xs text-muted-foreground">Vous passez en position {myIndex + 1}</p>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Membres ({members.length})</Label>
              <Button type="button" size="sm" variant="ghost" onClick={addMember} className="h-7">
                <Plus className="h-3.5 w-3.5 mr-1" /> Ajouter
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">Glissez pour réorganiser l'ordre de passage</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={members.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {members.map((m, i) => (
                    <SortableMemberRow
                      key={m.id}
                      member={m}
                      index={i}
                      canRemove={members.length > 2}
                      onUpdate={(field, value) => updateMember(i, field, value)}
                      onRemove={() => removeMember(i)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={createTontine.isPending}>
            Créer la tontine
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CreateTontineSheet;
