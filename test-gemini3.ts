
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { apiVersion: 'v1' }
});
async function run() {
  try {
    const res = await ai.models.generateContentStream({
      model: 'gemini-1.5-flash',
      contents: 'hello'
    });
    for await (const chunk of res) {
      process.stdout.write(chunk.text);
    }
  } catch(e) {
    console.error('STREAM ERROR:', e);
  }
}
run();

