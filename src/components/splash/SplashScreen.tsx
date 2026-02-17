import { motion } from "framer-motion";
import kunaLogo from "@/assets/logo.png";

const SplashScreen = () => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center gap-4"
    >
      <motion.img
        src={kunaLogo}
        alt="Kuna"
        className="h-24 w-24 drop-shadow-lg"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-2xl font-bold font-display text-primary">Kuna Finance</h1>
        <p className="text-xs text-muted-foreground mt-1">Vos finances, simplifiées</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
      />
    </motion.div>
  </div>
);

export default SplashScreen;
