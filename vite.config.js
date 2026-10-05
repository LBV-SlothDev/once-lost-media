import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  define: {
    __HASH_ROUTER__: "false",
    __BASE__: JSON.stringify("/"),
  },
});
