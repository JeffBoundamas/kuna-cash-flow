import { icons } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICON_OPTIONS } from "@/lib/payment-method-types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onChange: (icon: string) => void;
}

const IconPicker = ({ open, onOpenChange, value, onChange }: Props) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>Choisir une icône</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-5 gap-3 mt-4 pb-4">
          {ICON_OPTIONS.map((name) => {
            const LucideIcon = (icons as any)[name];
            if (!LucideIcon) return null;
            return (
              <button
                key={name}
                onClick={() => { onChange(name); onOpenChange(false); }}
                className={cn(
                  "flex h-14 w-full items-center justify-center rounded-xl border-2 transition-all",
                  value === name
                    ? "border-primary bg-primary/10"
                    : "border-border bg-muted/50 hover:border-primary/50"
                )}
              >
                <LucideIcon className="h-6 w-6" />
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default IconPicker;
