import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  envPrefix: ["VITE_", "TOSS_"],
  plugins: [
    tanstackRouter({
      routesDirectory: "./src/routes", // 라우트 파일 위치
      generatedRouteTree: "./src/routeTree.gen.ts", // 자동 생성될 파일 경로
      autoCodeSplitting: true, // 자동 코드 분할 활성화
      enableScaffolding: true, // 자동 코드 생성 활성화
    }),
    react(),
    tailwindcss(),
    svgr(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
});
