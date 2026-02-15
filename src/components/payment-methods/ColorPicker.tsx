import { cn } from "@/lib/utils";
import { COLOR_OPTIONS } from "@/lib/payment-method-types";

interface Props {
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker = ({ value, onChange }: Props) => {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1">
      {COLOR_OPTIONS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={cn(
            "h-9 w-9 flex-shrink-0 rounded-full border-2 transition-all",
            value === color ? "border-foreground scale-110" : "border-transparent"
          )}
          style={{ backgroundColor: color }}
          aria-label={color}
        />
      ))}
    </div>
  );
};

export default ColorPicker;
