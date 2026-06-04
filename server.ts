console.log("SERVER BOOTING");

import express from "express";
import path from "path";
import https from "https";

const app = express();

const BACKEND_URL =
  process.env.BACKEND_URL ||
  "https://bluecrestpremium-production.up.railway.app";

console.log("REGISTERING API PROXY");

app.use("/api", (req, res) => {

console.log("BACKEND_URL =", BACKEND_URL);
  console.log("REQ URL =", req.url);

  
  const backend = new URL(BACKEND_URL);

  const options = {
    hostname: backend.hostname,
    path: `/api${req.url}`,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = https.request(
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

  req.pipe(proxyReq, {
    end: true
  });

  proxyReq.on("error", (err) => {
    console.error(err);

    res.status(502).json({
      error: "Backend unavailable"
    });
  });
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
