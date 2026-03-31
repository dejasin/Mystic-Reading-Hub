import { forward, disconnect } from "@ngrok/ngrok";
import { spawn } from "child_process";

const PORT = process.env.PORT || "19943";
const authtoken = process.env.NGROK_AUTHTOKEN;

if (!authtoken) {
  console.error("NGROK_AUTHTOKEN is not set");
  process.exit(1);
}

console.log("Starting ngrok tunnel...");

let listener;
try {
  listener = await forward({
    addr: parseInt(PORT),
    authtoken,
    schemes: ["http", "https"],
  });
} catch (e) {
  console.error("Failed to start ngrok tunnel:", e.message);
  process.exit(1);
}

const tunnelUrl = listener.url();
const hostname = new URL(tunnelUrl).hostname;

console.log(`Tunnel ready: ${tunnelUrl}`);
console.log(`Expo URL: exp://${hostname}`);

const env = {
  ...process.env,
  EXPO_PUBLIC_DOMAIN: process.env.REPLIT_DEV_DOMAIN,
  EXPO_PUBLIC_REPL_ID: process.env.REPL_ID,
};

const expo = spawn(
  "pnpm",
  [
    "exec",
    "expo",
    "start",
    "--host",
    hostname,
    "--port",
    PORT,
  ],
  { env, stdio: "inherit" }
);

expo.on("close", async (code) => {
  await listener.close();
  process.exit(code ?? 0);
});

process.on("SIGTERM", async () => {
  expo.kill("SIGTERM");
  await listener.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  expo.kill("SIGINT");
  await listener.close();
  process.exit(0);
});
