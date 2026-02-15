import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent pinch-zoom & double-tap zoom on mobile (iOS Safari)
document.addEventListener("gesturestart", (e) => e.preventDefault());
document.addEventListener("gesturechange", (e) => e.preventDefault());
document.addEventListener("gestureend", (e) => e.preventDefault());

createRoot(document.getElementById("root")!).render(<App />);
