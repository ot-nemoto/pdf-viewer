import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // devcontainer 内から起動してもホストのブラウザで開けるようにする
    host: true,
    port: 5173,
  },
});
