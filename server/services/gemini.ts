import { GoogleGenAI } from "@google/genai";
import type { Feedback } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateTelegramNotification(feedback: Feedback): Promise<string> {
  return "Đã tiếp nhận yêu cầu hỗ trợ chờ phân công xử lý";
}
