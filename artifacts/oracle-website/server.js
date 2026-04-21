import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = Number(process.env.PORT);
if (!port || Number.isNaN(port)) {
  throw new Error("PORT environment variable is required");
}

const indexPath = join(__dirname, "index.html");

const server = http.createServer(async (req, res) => {
  try {
    const html = await readFile(indexPath, "utf8");
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(html);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Oracle marketing site listening on port ${port}`);
});
