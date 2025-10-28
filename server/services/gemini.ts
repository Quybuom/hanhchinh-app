import { GoogleGenAI } from "@google/genai";
import type { Feedback } from "@shared/schema";

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

// This API key is from Gemini Developer API Key, not vertex AI API Key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateTelegramNotification(feedback: Feedback): Promise<string> {
  try {
    const prompt = `Bạn là một trợ lý AI của hệ thống quản lý phản ánh của chính quyền tỉnh Bắc Ninh, Việt Nam. 
Tạo một thông báo ngắn gọn, chuyên nghiệp để xác nhận đã nhận phản ánh mới với thông tin sau:

Đơn vị: ${feedback.unitName}
Tiêu đề: ${feedback.title}
Mô tả: ${feedback.description}

Thông báo nên:
- Ngắn gọn, lịch sự và chuyên nghiệp
- Xác nhận đã nhận phản ánh
- Cam kết sẽ xem xét và xử lý
- Sử dụng tiếng Việt chuẩn
- Độ dài khoảng 2-3 câu

Chỉ trả về nội dung thông báo, không thêm giải thích.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
    });

    // Call the text() method to get the response text
    const text = response.text?.() || response.response?.text?.();
    
    if (text && typeof text === 'string' && text.trim().length > 0) {
      return text.trim();
    }
    
    console.warn("Gemini response did not contain text:", response);
    return "Đã tiếp nhận phản ánh của bạn. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.";
  } catch (error) {
    console.error("Error generating notification:", error);
    return "Đã tiếp nhận phản ánh của bạn. Chúng tôi sẽ xem xét và xử lý trong thời gian sớm nhất.";
  }
}
