import { NavLink as RouterNavLink } from "react-router-dom";
import { LayoutDashboard, ArrowLeftRight, PieChart, Wallet, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import kunaLogo from "@/assets/logo.png";

const tabs = [
  { to: "/", icon: LayoutDashboard, label: "Tableau" },
  { to: "/transactions", icon: ArrowLeftRight, label: "Mouvements" },
  { to: "/portfolio", icon: Wallet, label: "Portefeuille" },
  { to: "/budget", icon: PieChart, label: "Budget" },
  { to: "/more", icon: MoreHorizontal, label: "Plus" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-bottom lg:hidden">
      {/* Small centered logo above nav */}
      <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center justify-center h-10 w-10 rounded-full bg-card border border-border shadow-sm">
        <img src={kunaLogo} alt="Kuna" className="h-6 w-6" />
      </div>
      <div className="mx-auto flex max-w-lg md:max-w-2xl items-center justify-around py-1.5">
        {tabs.map(({ to, icon: Icon, label }) => (
          <RouterNavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-2 py-1.5 text-[11px] font-medium transition-colors rounded-lg",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isActive && "bg-primary/10"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span>{label}</span>
              </>
            )}
          </RouterNavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
