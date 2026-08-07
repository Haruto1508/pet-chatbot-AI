
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  try {
    const contents = [{ text: 'hello' }];
    const res = await ai.models.generateContentStream({
      model: 'gemini-1.5-flash',
      contents: { parts: contents }
    });
    for await (const chunk of res) {
      process.stdout.write(chunk.text);
    }
  } catch(e) {
    console.error('STREAM ERROR:', e);
  }
}
run();

