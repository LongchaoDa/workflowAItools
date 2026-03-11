import express from "express";
import cors from "cors";
import path from "node:path";
import authRoutes from "./routes/auth.js";
import noteRoutes from "./routes/notes.js";
import communityRoutes from "./routes/community.js";
import workflowRoutes from "./routes/workflows.js";
import uploadRoutes from "./routes/uploads.js";

export const buildApp = () => {
  const app = express();
  app.disable("x-powered-by");

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use("/media", express.static(path.resolve(process.cwd(), "../assets")));

  app.get("/", (_req, res) => {
    res
      .status(200)
      .type("html")
      .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>AI Workflow Backend</title>
    <style>
      body { margin:0; font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, sans-serif; background:#0b1229; color:#e7ecff; }
      .wrap { max-width: 760px; margin: 56px auto; padding: 0 16px; }
      .card { background:#111a3a; border:1px solid #2f4379; border-radius:12px; padding:20px; }
      h1 { margin:0 0 8px; font-size:28px; }
      p { color:#b8c6f5; }
      ul { margin: 14px 0 0; padding-left: 20px; }
      li { margin: 8px 0; }
      a { color:#87c9ff; text-decoration:none; }
      a:hover { text-decoration:underline; }
      code { background:#0a1430; border:1px solid #334a83; border-radius:6px; padding:2px 6px; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <h1>AI Workflow Backend</h1>
        <p>Service is running. This server only provides API endpoints.</p>
        <ul>
          <li>Health: <a href="/health"><code>GET /health</code></a></li>
          <li>Auth: <code>POST /api/auth/register</code>, <code>POST /api/auth/login</code></li>
          <li>Notes: <code>POST /api/notes</code>, <code>GET /api/notes/mine</code></li>
          <li>Uploads: <code>POST /api/uploads</code>, <code>GET /api/uploads/mine</code></li>
          <li>Community: <code>GET /api/community/search</code>, <code>GET /api/community/bookmarks</code></li>
        </ul>
      </div>
    </div>
  </body>
</html>`);
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true, service: "ai-workflow-backend" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/notes", noteRoutes);
  app.use("/api/uploads", uploadRoutes);
  app.use("/api/community", communityRoutes);
  app.use("/api/workflows", workflowRoutes);

  return app;
};
