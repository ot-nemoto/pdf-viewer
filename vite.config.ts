import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages のプロジェクトページ（/pdf-viewer/ 配下）で配信するため
  base: "/pdf-viewer/",
  build: {
    // dev-commons の deploy テンプレが公開する ./out に合わせる
    outDir: "out",
  },
  server: {
    // devcontainer 内から起動してもホストのブラウザで開けるようにする
    host: true,
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
