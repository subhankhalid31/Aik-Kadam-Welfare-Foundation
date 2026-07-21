import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import { createServer } from "http";
import path from "path";
import { pool } from "./db";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.error(
    "FATAL: SESSION_SECRET is not set. Refusing to start in production with a default/guessable secret — set SESSION_SECRET in your environment.",
  );
  process.exit(1);
}

const app = express();
app.use(
  helmet({
    // Disabled for now — the app doesn't yet declare its own script/style
    // sources, and a default CSP would break the Vite dev client and
    // inline styles. Worth revisiting with a tailored policy before launch.
    contentSecurityPolicy: false,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.resolve(import.meta.dirname, "..", "uploads")));

const PgSession = connectPgSimple(session);

app.use(
  session({
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "dev-secret-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  }),
);

registerRoutes(app);

const server = createServer(app);

async function start() {
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  const port = Number(process.env.PORT) || 5000;
  server.listen(port, "0.0.0.0", () => {
    console.log(`Aik Kadam server running on http://localhost:${port}`);
  });
}

start();
