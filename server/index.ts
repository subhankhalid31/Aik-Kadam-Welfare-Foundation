import "dotenv/config";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import helmet from "helmet";
import { createServer } from "http";
import { pool } from "./db";
import { registerRoutes, registerInboundWebhook } from "./routes";
import { setupVite, serveStatic } from "./vite";
import { PUBLIC_UPLOAD_DIR } from "./lib/upload";

if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.error(
    "FATAL: SESSION_SECRET is not set. Refusing to start in production with a default/guessable secret — set SESSION_SECRET in your environment.",
  );
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    // A real, tailored policy in production rather than the previous
    // blanket `false` — scoped to exactly what this app actually loads:
    // same-origin scripts (the app has no inline <script> tags or
    // dangerouslySetInnerHTML anywhere, so script-src doesn't need
    // 'unsafe-inline'/'unsafe-eval'), Google Identity Services (the
    // "Continue with Google" button — renders in an iframe and makes its
    // own requests, hence frame-src and connect-src both including it),
    // and Google Fonts. style-src needs 'unsafe-inline' because inline
    // `style={{...}}` (progress bars, framer-motion) compiles to real
    // style="" attributes, which CSP treats the same as a <style> tag
    // either way — there's no inline JS to gate here, just CSS values.
    //
    // Left off in development: Vite's dev client injects its own inline
    // HMR bootstrap script and relies on eval-based sourcemaps, neither
    // of which this policy allows — this would break local dev (hot
    // reload, error overlay) without actually protecting anything, since
    // nobody but the developer's own machine ever talks to that server.
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "https://accounts.google.com"],
              styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
              imgSrc: ["'self'", "data:", "blob:"],
              connectSrc: ["'self'", "https://accounts.google.com"],
              frameSrc: ["https://accounts.google.com"],
              objectSrc: ["'none'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'self'"],
            },
          }
        : false,
  }),
);
// Must be registered before express.json(): webhook signature verification
// needs the exact raw bytes Resend sent, not a re-serialized copy of a
// JSON-parsed object (which can differ byte-for-byte and fail verification).
registerInboundWebhook(app);
app.use(express.json());
// Reuses the exact same resolved directory upload.ts writes to (see
// UPLOAD_DIR there) — these two used to be two independently-hardcoded
// paths that happened to agree only because neither was configurable.
// Now that the write location can move (to a persistent disk in
// production), the read location has to move with it or this would
// serve 404s for every photo instead of just losing them on restart.
app.use("/uploads", express.static(PUBLIC_UPLOAD_DIR));

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
