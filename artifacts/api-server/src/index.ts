import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const hasRcIntegration = !!(process.env.REPLIT_CONNECTORS_HOSTNAME && (process.env.REPL_IDENTITY || process.env.WEB_REPL_RENEWAL));
const hasRcSecretKey = !!process.env.REVENUECAT_SECRET_KEY;
if (hasRcIntegration) {
  logger.info("RevenueCat: backend client will use Replit integration credentials");
} else if (hasRcSecretKey) {
  logger.info("RevenueCat: backend client will use REVENUECAT_SECRET_KEY");
} else {
  logger.warn("RevenueCat: no backend credentials configured (REVENUECAT_SECRET_KEY not set and Replit integration unavailable) — entitlement checks will fail");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
