import type { Express } from "express";
import express from "express";
import type { Server } from "http";
import path from "path";
import fs from "fs";

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: { server } },
    appType: "custom",
    root: path.resolve(import.meta.dirname, "..", "client"),
    configFile: path.resolve(import.meta.dirname, "..", "vite.config.ts"),
  });

  app.use(vite.middlewares);

  app.use(async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path.resolve(import.meta.dirname, "..", "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(`Build directory not found: ${distPath}. Run "npm run build" first.`);
  }
  app.use(express.static(distPath));
  app.use((_req: any, res: any) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
