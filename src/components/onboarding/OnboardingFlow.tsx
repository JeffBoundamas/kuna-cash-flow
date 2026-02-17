import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Landmark, Smartphone, Banknote, ArrowRight, Check, Sparkles, Target, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface OnboardingFlowProps {
  onComplete: () => void;
}

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
};

const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const totalSteps = 3;

  const handleSkip = () => {
    localStorage.setItem("kuna_onboarding_done", "true");
    onComplete();
  };

  const goNext = () => {
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem("kuna_onboarding_done", "true");
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-background">
      <div className="w-full max-w-lg flex justify-end px-6 pt-6">
        <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Passer
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center w-full max-w-lg px-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full"
          >
            {step === 0 && <WelcomeStep />}
            {step === 1 && <BudgetStep />}
            {step === 2 && <TransactionStep />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-lg px-6 pb-8 space-y-4 relative z-[70]">
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === step ? "w-8 bg-primary" : i < step ? "w-2 bg-primary/40" : "w-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <Button className="w-full h-12 text-base" onClick={goNext}>
            Commencer <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {step === 1 && (
          <Button className="w-full h-12 text-base" onClick={goNext}>
            Continuer <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
        {step === 2 && (
          <Button className="w-full h-12 text-base" onClick={handleFinish}>
            <Check className="mr-2 h-4 w-4" /> C'est parti !
          </Button>
        )}
      </div>
    </div>
  );
};

const WelcomeStep = () => (
  <div className="text-center space-y-6">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
      <Sparkles className="h-10 w-10 text-primary" />
    </div>
    <div className="space-y-2">
      <h1 className="text-2xl font-bold font-display">Bienvenue sur Kuna Finance</h1>
      <p className="text-muted-foreground leading-relaxed">
        Prenez le contrôle de vos finances personnelles. Suivez vos revenus, dépenses et objectifs d'épargne en quelques secondes.
      </p>
    </div>
    <div className="grid grid-cols-3 gap-3 pt-2">
      {[
        { icon: Wallet, label: "Comptes" },
        { icon: Target, label: "Budgets" },
        { icon: Receipt, label: "Mouvements" },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="rounded-xl bg-muted p-3 text-center">
          <Icon className="h-5 w-5 mx-auto text-primary mb-1" />
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      ))}
    </div>
  </div>
);

const BudgetStep = () => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20">
        <Target className="h-8 w-8 text-accent-foreground" />
      </div>
      <h2 className="text-xl font-bold font-display">Définissez votre budget</h2>
      <p className="text-sm text-muted-foreground">
        Vous pourrez créer des budgets détaillés par catégorie depuis la page Budget. Quelques conseils pour bien démarrer :
      </p>
    </div>
    <div className="space-y-3">
      {[
        { emoji: "🏠", title: "Essentiel (50%)", desc: "Logement, nourriture, transport" },
        { emoji: "🎉", title: "Désirs (30%)", desc: "Loisirs, restaurants, shopping" },
        { emoji: "💰", title: "Épargne (20%)", desc: "Objectifs, fonds d'urgence" },
      ].map(({ emoji, title, desc }) => (
        <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const TransactionStep = () => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Receipt className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold font-display">Ajoutez vos mouvements</h2>
      <p className="text-sm text-muted-foreground">
        Utilisez le bouton <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold mx-1">+</span> en bas de l'écran pour ajouter rapidement revenus et dépenses.
      </p>
    </div>
    <div className="space-y-3">
      {[
        { emoji: "⚡", title: "Ajout rapide", desc: "Un clavier calculatrice pour saisir en 3 secondes" },
        { emoji: "🔄", title: "Récurrents", desc: "Programmez loyer, abonnements, salaire…" },
        { emoji: "📊", title: "Rapports", desc: "Visualisez où va votre argent chaque mois" },
      ].map(({ emoji, title, desc }) => (
        <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
          <span className="text-2xl">{emoji}</span>
          <div>
            <p className="font-medium text-sm">{title}</p>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default OnboardingFlow;
