import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      includeAssets: ["favicon.svg", "brand-mark.png"],
      manifest: {
        name: "CORA",
        short_name: "CORA",
        description: "Digital operations platform for Makoni Council",
        theme_color: "#052560",
        background_color: "#E2E8ED",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "brand-mark.png", sizes: "192x192", type: "image/png" },
          { src: "brand-mark.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: { port: 5173, open: false, host: true },
});
