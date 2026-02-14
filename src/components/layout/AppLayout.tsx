import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-lg pb-24">{children}</main>
      <BottomNav />
    </div>
  );
};

export default AppLayout;
