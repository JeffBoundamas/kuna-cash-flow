import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Plus } from "lucide-react";
import { formatXAF } from "@/lib/currency";
import type { TontineMember } from "@/lib/tontine-types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TontineMember | null;
  onAddPhone?: () => void;
}

const MemberInfoSheet = ({ open, onOpenChange, member, onAddPhone }: Props) => {
  if (!member) return null;

  const phoneClean = member.phone_number?.replace(/[\s+\-]/g, "") || "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {member.member_name}
            {member.is_current_user && (
              <Badge className="bg-gold text-gold-foreground text-[10px]">Moi</Badge>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Position</span>
              <span className="font-medium">Passage au tour {member.position_in_order}</span>
            </div>
            {member.payout_date && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Date prévue</span>
                <span className="font-medium">
                  {new Date(member.payout_date).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Statut</span>
              <span className="font-medium">
                {member.has_received_pot ? "Pot reçu ✓" : "En attente"}
              </span>
            </div>
          </div>

          {member.phone_number ? (
            <div className="flex gap-3">
              <a
                href={`tel:${member.phone_number}`}
                className="flex-1"
              >
                <Button variant="outline" className="w-full gap-2">
                  <Phone className="h-4 w-4" />
                  Appeler
                </Button>
              </a>
              <a
                href={`https://wa.me/${phoneClean}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  WhatsApp
                </Button>
              </a>
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground mb-2">Aucun numéro enregistré</p>
              {onAddPhone && (
                <Button variant="ghost" size="sm" onClick={onAddPhone} className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Ajouter
                </Button>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MemberInfoSheet;
