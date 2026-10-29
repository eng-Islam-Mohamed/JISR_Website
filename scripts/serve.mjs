import http from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const root = path.resolve(projectRoot, process.argv.includes("--built") ? "dist" : ".");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".vert": "text/plain; charset=utf-8",
  ".frag": "text/plain; charset=utf-8",
  ".ttf": "font/ttf",
  ".apk": "application/vnd.android.package-archive",
};
const port = Number(process.env.PORT || 4173);
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const relative =
      pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const file = path.resolve(root, relative);
    if (
      !file.startsWith(root + path.sep) ||
      relative.split(/[\\/]/).some((p) => p.startsWith(".")) ||
      relative.startsWith("scripts/") ||
      relative.startsWith("qa/")
    ) {
      res.writeHead(403).end();
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      res.writeHead(404).end();
      return;
    }
    const headers = {
      "Content-Type": types[path.extname(file)] || "application/octet-stream",
      "Content-Length": info.size,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    };
    if (file.endsWith(".apk"))
      headers["Content-Disposition"] =
        'attachment; filename="JISR-Android.apk"';
    res.writeHead(200, headers);
    if (req.method === "HEAD") res.end();
    else createReadStream(file).pipe(res);
  } catch {
    res
      .writeHead(404, { "Content-Type": "text/plain; charset=utf-8" })
      .end("Not found");
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log(`JISR preview: http://127.0.0.1:${port}`),
);
