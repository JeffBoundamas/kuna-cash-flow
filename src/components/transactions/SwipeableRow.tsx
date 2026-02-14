import { useRef, useState, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onTap: () => void;
}

const THRESHOLD = 80;

const SwipeableRow = ({ children, onDelete, onTap }: SwipeableRowProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const didSwipeRef = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    didSwipeRef.current = false;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const diff = e.touches[0].clientX - startXRef.current;
    currentXRef.current = diff;
    if (diff < 0) {
      didSwipeRef.current = true;
      setOffset(Math.max(-120, diff));
    } else if (showDelete) {
      setOffset(Math.min(0, -120 + diff));
    }
  }, [showDelete]);

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    if (Math.abs(currentXRef.current) > THRESHOLD) {
      setOffset(-120);
      setShowDelete(true);
    } else {
      setOffset(0);
      setShowDelete(false);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (didSwipeRef.current) return;
    if (showDelete) {
      setOffset(0);
      setShowDelete(false);
      return;
    }
    onTap();
  }, [showDelete, onTap]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete background */}
      <div className="absolute inset-y-0 right-0 flex items-center justify-end bg-destructive px-5 rounded-xl">
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex items-center gap-2 text-destructive-foreground text-xs font-semibold"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer
        </button>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        className={cn(
          "relative bg-card border border-border rounded-xl cursor-pointer",
          !swiping && "transition-transform duration-200"
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default SwipeableRow;
