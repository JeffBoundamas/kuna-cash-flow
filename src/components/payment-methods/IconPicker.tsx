import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Banknote, Building2, Smartphone, CreditCard, FileText,
  Wallet, PiggyBank, Landmark, HandCoins, BadgeDollarSign,
  CircleDollarSign, Receipt, Coins, DollarSign, Gift,
  ShieldCheck, ArrowLeftRight, TrendingUp
} from "lucide-react";

const ICONS = [
  { name: "Banknote", component: Banknote },
  { name: "Building2", component: Building2 },
  { name: "Smartphone", component: Smartphone },
  { name: "CreditCard", component: CreditCard },
  { name: "FileText", component: FileText },
  { name: "Wallet", component: Wallet },
  { name: "PiggyBank", component: PiggyBank },
  { name: "Landmark", component: Landmark },
  { name: "HandCoins", component: HandCoins },
  { name: "BadgeDollarSign", component: BadgeDollarSign },
  { name: "CircleDollarSign", component: CircleDollarSign },
  { name: "Receipt", component: Receipt },
  { name: "Coins", component: Coins },
  { name: "DollarSign", component: DollarSign },
  { name: "Gift", component: Gift },
  { name: "ShieldCheck", component: ShieldCheck },
  { name: "ArrowLeftRight", component: ArrowLeftRight },
  { name: "TrendingUp", component: TrendingUp },
];

interface IconPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (icon: string) => void;
}

const IconPicker = ({ open, onOpenChange, value, onSelect }: IconPickerProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="bottom" className="rounded-t-2xl">
      <SheetHeader>
        <SheetTitle>Choisir une icône</SheetTitle>
      </SheetHeader>
      <div className="grid grid-cols-6 gap-3 py-4">
        {ICONS.map(({ name, component: Icon }) => (
          <button
            key={name}
            onClick={() => { onSelect(name); onOpenChange(false); }}
            className={`flex items-center justify-center p-3 rounded-xl transition-colors ${
              value === name
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            <Icon className="h-6 w-6" />
          </button>
        ))}
      </div>
    </SheetContent>
  </Sheet>
);

export default IconPicker;
export { ICONS };
