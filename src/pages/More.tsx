import { useNavigate } from "react-router-dom";
import { Target, Settings, Download, CreditCard, CalendarClock, ChevronRight } from "lucide-react";

const items = [
  { to: "/fixed-charges", icon: CalendarClock, label: "Charges fixes" },
  { to: "/payment-methods", icon: CreditCard, label: "Moyens de paiement" },
  { to: "/goals", icon: Target, label: "Objectifs d'épargne" },
  { to: "/settings", icon: Settings, label: "Paramètres" },
  { to: "/export", icon: Download, label: "Exporter mes données", placeholder: true },
];

const More = () => {
  const navigate = useNavigate();

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      <h1 className="text-xl font-bold font-display">Plus</h1>

      <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
        {items.map(({ to, icon: Icon, label, placeholder }) => (
          <button
            key={to}
            onClick={() => {
              if (!placeholder) navigate(to);
            }}
            className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default More;
