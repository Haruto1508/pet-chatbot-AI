import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'test-key' });
    res.json({ googleGenAI: 'import ok ✅', hasClient: !!ai });
  } catch (e: any) {
    res.json({ googleGenAI: '❌ crash', message: e.message });
  }
}
