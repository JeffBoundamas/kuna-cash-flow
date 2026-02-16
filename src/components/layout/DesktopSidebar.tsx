import { NavLink as RouterNavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, PieChart, Wallet, MoreHorizontal, Target, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Tableau de bord" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Mouvements" },
  { to: "/portfolio", icon: Wallet, label: "Portefeuille" },
  { to: "/budget", icon: PieChart, label: "Budget" },
  { to: "/goals", icon: Target, label: "Objectifs" },
  { to: "/payment-methods", icon: CreditCard, label: "Moyens de paiement" },
  { to: "/more", icon: MoreHorizontal, label: "Plus" },
];

const DesktopSidebar = () => {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-60 border-r border-border bg-card z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <h1 className="text-xl font-bold font-display text-primary">Kuna</h1>
        <p className="text-xs text-muted-foreground">Gestion de finances</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )
            }
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span>{label}</span>
          </RouterNavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground">© 2025 Kuna Finance</p>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
