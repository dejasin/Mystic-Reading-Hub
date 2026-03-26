import { createClient } from '@replit/revenuecat-sdk/client';
import { logger } from './logger.js';

let connectionSettings: any;

async function getApiKeyFromIntegration(): Promise<string | null> {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  if (!hostname) return null;

  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) return null;

  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token || connectionSettings.settings?.oauth?.credentials?.access_token || null;
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=revenuecat',
      {
        headers: {
          'Accept': 'application/json',
          'X-Replit-Token': xReplitToken,
        },
      }
    ).then(res => res.json()).then((data: any) => data.items?.[0]);
  } catch (e) {
    logger.warn({ err: e }, 'RevenueCat: failed to fetch integration credentials');
    return null;
  }

  return connectionSettings?.settings?.access_token || connectionSettings?.settings?.oauth?.credentials?.access_token || null;
}

async function getApiKey(): Promise<string> {
  const integrationKey = await getApiKeyFromIntegration();
  if (integrationKey) return integrationKey;

  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (secretKey) {
    logger.info('RevenueCat: using REVENUECAT_SECRET_KEY as fallback');
    return secretKey;
  }

  throw new Error('RevenueCat not configured: no integration credentials or REVENUECAT_SECRET_KEY found');
}

export async function getUncachableRevenueCatClient() {
  const apiKey = await getApiKey();
  return createClient({
    baseUrl: "https://api.revenuecat.com/v2",
    headers: { Authorization: "Bearer " + apiKey },
  });
}
