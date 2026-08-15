import type { VercelRequest, VercelResponse } from '@vercel/node';
import getApp from '../server';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await getApp();
  
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
