import { useEffect, useState, useCallback } from "react";

interface Props {
  show: boolean;
  onDone: () => void;
  potAmount: string;
}

const EMOJIS = ["🎉", "💰", "🥳", "✨", "🎊", "🏆", "💸", "⭐"];

const TontineCelebration = ({ show, onDone, potAmount }: Props) => {
  const [particles, setParticles] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);

  useEffect(() => {
    if (!show) return;
    const items = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      emoji: EMOJIS[i % EMOJIS.length],
      x: Math.random() * 100,
      delay: Math.random() * 1,
    }));
    setParticles(items);
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [show, onDone]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      <div className="absolute inset-0 bg-background/70 animate-fade-in" />

      <div className="relative z-10 text-center animate-scale-in">
        <p className="text-6xl mb-3">💰</p>
        <h2 className="text-2xl font-bold font-display text-gold">Pot reçu !</h2>
        <p className="text-lg font-semibold text-foreground mt-1">{potAmount}</p>
        <p className="text-sm text-muted-foreground mt-1">Félicitations 🎉</p>
      </div>

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

export default TontineCelebration;
