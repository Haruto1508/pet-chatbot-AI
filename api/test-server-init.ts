import type { VercelRequest, VercelResponse } from '@vercel/node';
import getApp from '../server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Stage 2: Can we call getApp() to init Express?
  try {
    const app = await getApp();
    res.json({ 
      stage: '2_getApp', 
      result: '✅ ok', 
      hasApp: !!app,
      appType: typeof app
    });
  } catch (e: any) {
    res.json({ stage: '2_getApp', result: '❌ CRASH', error: e.message, stack: e.stack?.split('\n').slice(0,5) });
  }
}
