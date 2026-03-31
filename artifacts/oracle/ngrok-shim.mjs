#!/usr/bin/env node
/**
 * ngrok-shim: replaces the old ngrok v2 binary.
 * Uses @ngrok/ngrok SDK (v3) and exposes a fake v2 HTTP API on port 4040
 * so that @expo/ngrok continues to work unchanged.
 */
import { createServer } from "http";
import { forward } from "@ngrok/ngrok";

const args = process.argv.slice(2);
const command = args[0];

// Handle `ngrok --version`
if (args.includes("--version") || args.includes("version")) {
  process.stdout.write("ngrok version 3.0.0\n");
  process.exit(0);
}

// Handle `ngrok authtoken <token>` — @expo/ngrok calls this to save the token.
// It waits for stdout data before resolving, so we must print something.
if (command === "authtoken") {
  process.stdout.write(
    "Authtoken saved to configuration file: ~/.ngrok2/ngrok.yml\n"
  );
  process.exit(0);
}

// Handle `ngrok start --none --log=stdout` — the main mode @expo/ngrok uses
if (command === "start") {
  const API_PORT = 4040;
  const authtoken = process.env.NGROK_AUTHTOKEN;

  // State
  const tunnels = {};

  // Create fake ngrok v2 HTTP API server
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${API_PORT}`);
    const path = url.pathname;

    let body = "";
    for await (const chunk of req) body += chunk;
    const json = body ? JSON.parse(body) : {};

    res.setHeader("Content-Type", "application/json");

    // POST /api/tunnels — create tunnel
    if (req.method === "POST" && path === "/api/tunnels") {
      const proto = json.proto || "http";
      const addr = json.addr || json.port || 19000;
      const name = json.name || "default";

      try {
        const listener = await forward({
          addr: typeof addr === "string" ? parseInt(addr) : addr,
          authtoken,
          schemes: ["http", "https"],
        });
        const publicUrl = listener.url().replace("https://", "http://");
        const httpsUrl = listener.url();

        tunnels[name] = { listener, publicUrl, httpsUrl, name, proto, addr };

        res.writeHead(201);
        res.end(
          JSON.stringify({
            name,
            public_url: publicUrl,
            proto,
            config: { addr: String(addr) },
            metrics: {},
          })
        );
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ msg: err.message }));
      }
      return;
    }

    // GET /api/tunnels — list tunnels
    if (req.method === "GET" && path === "/api/tunnels") {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          tunnels: Object.values(tunnels).map((t) => ({
            name: t.name,
            public_url: t.publicUrl,
            proto: t.proto,
            config: { addr: String(t.addr) },
            metrics: {},
          })),
        })
      );
      return;
    }

    // DELETE /api/tunnels/:name
    const deleteMatch = path.match(/^\/api\/tunnels\/(.+)$/);
    if (req.method === "DELETE" && deleteMatch) {
      const name = decodeURIComponent(deleteMatch[1]);
      if (tunnels[name]) {
        await tunnels[name].listener.close();
        delete tunnels[name];
      }
      res.writeHead(204);
      res.end();
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ msg: "not found" }));
  });

  server.listen(API_PORT, "127.0.0.1", () => {
    // Output the API address in the JSON format parseAddr() expects
    process.stdout.write(
      JSON.stringify({ addr: `127.0.0.1:${API_PORT}` }) + "\n"
    );
  });

  // Keep the process alive
  process.on("SIGTERM", () => {
    server.close();
    process.exit(0);
  });
  process.on("SIGINT", () => {
    server.close();
    process.exit(0);
  });
} else {
  process.stderr.write(`Unknown command: ${command}\n`);
  process.exit(1);
}
