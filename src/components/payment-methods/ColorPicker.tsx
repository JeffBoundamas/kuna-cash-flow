const PRESET_COLORS = [
  "#22C55E", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#6366F1", "#14B8A6",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker = ({ value, onChange }: ColorPickerProps) => (
  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
    {PRESET_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onChange(color)}
        className={`shrink-0 w-9 h-9 rounded-full border-2 transition-all ${
          value === color ? "border-foreground scale-110" : "border-transparent"
        }`}
        style={{ backgroundColor: color }}
      />
    ))}
  </div>
);

export default ColorPicker;
export { PRESET_COLORS };
