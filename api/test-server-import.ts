import type { VercelRequest, VercelResponse } from '@vercel/node';

// Stage 1: Can we even import getApp from server?
let getApp: any = null;
let importError: string | null = null;

try {
  const serverModule = await import('../server.js');
  getApp = serverModule.default;
} catch (e: any) {
  importError = e.message;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Stage 1 result
  if (importError) {
    return res.json({ stage: '1_import_server', result: '❌ CRASH', error: importError });
  }
  res.json({ stage: '1_import_server', result: '✅ ok' });
}
