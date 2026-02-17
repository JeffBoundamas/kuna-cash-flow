import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SplashScreen from "@/components/splash/SplashScreen";

const SPLASH_DURATION = 2000;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash only once per browser session
    if (sessionStorage.getItem("kuna_splash_shown")) return false;
    return true;
  });

  useEffect(() => {
    if (!showSplash) return;
    sessionStorage.setItem("kuna_splash_shown", "1");
    const t = setTimeout(() => setShowSplash(false), SPLASH_DURATION);
    return () => clearTimeout(t);
  }, [showSplash]);

  if (loading || showSplash) {
    return <SplashScreen />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
