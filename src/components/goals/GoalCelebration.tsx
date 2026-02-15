import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  show: boolean;
  onDone: () => void;
}

const EMOJIS = ["🎉", "🏆", "⭐", "🥳", "💰", "🔥", "✨", "🎊"];

const GoalCelebration = ({ show, onDone }: Props) => {
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);

  useEffect(() => {
    if (!show) return;
    const items = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[i % EMOJIS.length],
      x: Math.random() * 100,
      delay: Math.random() * 0.8,
    }));
    setParticles(items);
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-background/60 animate-fade-in" />
      
      {/* Center text */}
      <div className="relative z-10 text-center animate-scale-in">
        <p className="text-5xl mb-2">🏆</p>
        <h2 className="text-2xl font-bold font-display text-primary">Objectif atteint !</h2>
        <p className="text-sm text-muted-foreground mt-1">Félicitations 🎉</p>
      </div>

      {/* Falling particles */}
      {particles.map(p => (
        <span
          key={p.id}
          className="absolute text-2xl animate-celebration-fall"
          style={{
            left: `${p.x}%`,
            top: "-5%",
            animationDelay: `${p.delay}s`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
};

export default GoalCelebration;
