import TelegramBot from "node-telegram-bot-api";

let bot: TelegramBot | null = null;

function initializeBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN not configured - Telegram notifications disabled");
    return null;
  }

  try {
    bot = new TelegramBot(token, { polling: false });
    console.log("Telegram bot initialized successfully");
    return bot;
  } catch (error) {
    console.error("Failed to initialize Telegram bot:", error);
    return null;
  }
}

export async function sendTelegramNotification(
  message: string,
  feedbackDetails?: {
    unitName: string;
    title: string;
    description: string;
  }
): Promise<boolean> {
  try {
    if (!bot) {
      bot = initializeBot();
    }

    if (!bot) {
      console.warn("Telegram bot not available - skipping notification");
      return false;
    }

    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      console.warn("TELEGRAM_CHAT_ID not configured - cannot send notification");
      return false;
    }

    let fullMessage = `🔔 *Thông báo phản ánh mới*\n\n`;
    
    if (feedbackDetails) {
      fullMessage += `*Đơn vị:* ${feedbackDetails.unitName}\n`;
      fullMessage += `*Tiêu đề:* ${feedbackDetails.title}\n\n`;
      fullMessage += `*Nội dung:*\n${feedbackDetails.description}\n\n`;
      fullMessage += `---\n`;
    }
    
    fullMessage += `_${message}_`;

    await bot.sendMessage(chatId, fullMessage, {
      parse_mode: "Markdown",
    });

    console.log("Telegram notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending Telegram notification:", error);
    return false;
  }
}

export async function sendStatusUpdateNotification(
  feedbackTitle: string,
  unitName: string,
  newStatus: string
): Promise<boolean> {
  try {
    if (!bot) {
      bot = initializeBot();
    }

    if (!bot) {
      return false;
    }

    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!chatId) {
      return false;
    }

    const statusMap: Record<string, string> = {
      received: "Mới tiếp nhận",
      processing: "Đang xử lý",
      resolved: "Đã xử lý",
    };

    const statusLabel = statusMap[newStatus] || newStatus;

    const message = `✅ *Cập nhật trạng thái*\n\n` +
      `*Đơn vị:* ${unitName}\n` +
      `*Phản ánh:* ${feedbackTitle}\n` +
      `*Trạng thái mới:* ${statusLabel}`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
    });

    console.log("Status update notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending status update notification:", error);
    return false;
  }
}
