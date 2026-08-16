import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.json({
    status: 'ok',
    message: 'Simple function works!',
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? `set (${process.env.SUPABASE_URL.slice(0, 25)}...)` : '❌ MISSING',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? `set (${process.env.SUPABASE_ANON_KEY.slice(0, 10)}...)` : '❌ MISSING',
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? `set (${process.env.GEMINI_API_KEY.slice(0, 6)}...)` : '❌ MISSING',
      NODE_ENV: process.env.NODE_ENV || 'unknown',
      VERCEL: process.env.VERCEL || 'not set',
    }
  });
}
