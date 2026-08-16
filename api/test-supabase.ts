import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || 'placeholder',
      process.env.SUPABASE_ANON_KEY || 'placeholder'
    );
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    res.json({ supabase: 'import ok ✅', count, error: error?.message });
  } catch (e: any) {
    res.json({ supabase: '❌ crash', message: e.message });
  }
}
