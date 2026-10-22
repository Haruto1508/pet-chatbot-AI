import type { VercelRequest, VercelResponse } from '@vercel/node';
import getApp from '../server.js';

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  
  // Vercel Serverless automatically parses req.body before passing to handler.
  // Set req._body = true so that Express body-parser / raw-body skips re-reading
  // the already-consumed readable stream (which throws 500 error on POST requests).
  if ((req as any).body !== undefined && typeof (req as any).body === 'object') {
    (req as any)._body = true;
  }

  // Forward the original URL if it was rewritten
  if (req.headers['x-now-route-matches']) {
    // Vercel might rewrite the URL, ensure Express sees the original path
    // Actually, Vercel typically preserves req.url in Serverless Functions
  }
  
  // Return a promise that resolves when the response is finished
  return new Promise((resolve, reject) => {
    res.once('finish', resolve);
    res.once('error', reject);
    app(req as any, res as any);
  });
}
