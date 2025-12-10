import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/gelir-gider/",   // 🔥 repo adın neyse aynen böyle
});
