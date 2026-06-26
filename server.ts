console.log("SERVER BOOTING");

import "dotenv/config";
import express from "express";
import path from "path";
import http from "http";
import https from "https";
import { spawn } from "child_process";

const app = express();

const SHOULD_START_INTERNAL_BACKEND =
  !process.env.BACKEND_URL ||
  process.env.BACKEND_URL === "http://127.0.0.1:4000" ||
  process.env.BACKEND_URL === "http://localhost:4000";

const INTERNAL_BACKEND_PORT =
  process.env.BACKEND_PORT || "4000";

let backendProcess: ReturnType<typeof spawn> | null = null;

if (SHOULD_START_INTERNAL_BACKEND) {
  console.log(
    `STARTING INTERNAL API ON 127.0.0.1:${INTERNAL_BACKEND_PORT}`
  );

  backendProcess = spawn(
    process.execPath,
    ["server.js"],
    {
      cwd: path.join(process.cwd(), "bluecrestback"),
      stdio: "inherit",
      env: {
        ...process.env,
        PORT: INTERNAL_BACKEND_PORT,
        NODE_ENV: process.env.NODE_ENV || "production"
      }
    }
  );

  backendProcess.on("exit", (code, signal) => {
    console.error(
      `Internal API exited with code ${code ?? "null"} and signal ${signal ?? "null"}`
    );
  });
}

const BACKEND_URL =
  process.env.BACKEND_URL ||
  `http://127.0.0.1:${INTERNAL_BACKEND_PORT}`;

console.log(`REGISTERING API PROXY -> ${BACKEND_URL}`);

app.use("/api", (req, res) => {
  const backend = new URL(BACKEND_URL);
  const transport = backend.protocol === "http:" ? http : https;

  const options = {
    hostname: backend.hostname,
    port: backend.port || (backend.protocol === "http:" ? 80 : 443),
    path: `/api${req.url}`,
    method: req.method,
    headers: {
      "content-type":
        req.headers["content-type"] || "application/json",
      ...(req.headers["content-length"]
        ? { "content-length": req.headers["content-length"] }
        : {}),
      "accept":
        req.headers["accept"] || "*/*",
      "authorization":
        req.headers["authorization"] || ""
    },
    timeout: Number(process.env.API_PROXY_TIMEOUT_MS || 30000)
  }

  const proxyReq = transport.request(
    options,
    (proxyRes) => {
      res.writeHead(
        proxyRes.statusCode || 200,
        proxyRes.headers
      );

      proxyRes.pipe(res, {
        end: true
      });
    }
  );

  proxyReq.on("timeout", () => {
    console.error(`API proxy timed out: ${req.method} /api${req.url}`);
    proxyReq.destroy(new Error("API proxy timed out"));
  });

  proxyReq.on("error", (err: any) => {
    console.error("========== PROXY ERROR ==========");
    console.error(err);
    console.error("NAME:", err?.name);
    console.error("MESSAGE:", err?.message);
    console.error("STACK:", err?.stack);

    if ((err as any)?.rawPacket) {
      console.error(
        "RAW PACKET:",
        (err as any).rawPacket.toString()
      );
    }

    console.error("=================================");

    res.status(502).json({
      error: "Backend unavailable"
    });
  });

  req.pipe(proxyReq, {
    end: true
  });
});

process.on("SIGTERM", () => {
  backendProcess?.kill("SIGTERM");
  process.exit(0);
});

process.on("SIGINT", () => {
  backendProcess?.kill("SIGINT");
  process.exit(0);
});

const distPath = path.join(
  process.cwd(),
  "dist"
);

console.log("DIST PATH:", distPath);

app.use(express.static(distPath));

app.get("*", (_, res) => {
  res.sendFile(
    path.join(
      distPath,
      "index.html"
    )
  );
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Frontend listening on port ${PORT}`
  );
});
