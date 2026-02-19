import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "pwa-192.png", "pwa-512.png", "logo.png"],
      manifest: {
        name: "Kuna Finance — Gestion de finances personnelles",
        short_name: "Kuna Finance",
        description: "Gérez vos finances personnelles simplement avec Kuna. Suivi des dépenses, budgets, objectifs d'épargne et tontines.",
        theme_color: "#0d9668",
        background_color: "#f7f5f0",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        id: "/",
        lang: "fr",
        dir: "ltr",
        categories: ["finance", "productivity"],
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        screenshots: [],
        shortcuts: [
          {
            name: "Nouvelle transaction",
            short_name: "Transaction",
            url: "/transactions",
            icons: [{ src: "/pwa-192.png", sizes: "192x192" }],
          },
          {
            name: "Tableau de bord",
            short_name: "Dashboard",
            url: "/",
            icons: [{ src: "/pwa-192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/transactions.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "transactions-cache",
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 30, maxEntries: 100 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 7, maxEntries: 50 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 10 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 365, maxEntries: 10 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
