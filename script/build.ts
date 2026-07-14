import { build } from "esbuild";
import { execSync } from "child_process";

console.log("Building client...");
execSync("vite build", { stdio: "inherit" });

console.log("Building server...");
await build({
  entryPoints: ["server/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  packages: "external",
});

console.log("Build complete.");
