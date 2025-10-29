import TelegramBot from "node-telegram-bot-api";

let bot: TelegramBot | null = null;

// Escape Markdown special characters to prevent parse errors
function escapeMarkdown(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

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
    trackingNumber: number;
    unitName: string;
    title: string;
    description: string;
    assignee?: string;
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

    let fullMessage = "";
    
    if (feedbackDetails) {
      // Escape all user-provided text to prevent Markdown parsing errors
      const safeUnitName = escapeMarkdown(feedbackDetails.unitName);
      const safeTitle = escapeMarkdown(feedbackDetails.title);
      const safeDescription = escapeMarkdown(feedbackDetails.description);
      const safeMessage = escapeMarkdown(message);
      
      fullMessage = `🔔 *Thông báo yêu cầu hỗ trợ mới*\n\n` +
        `*Số kiến nghị:* #${feedbackDetails.trackingNumber}\n` +
        `*Đơn vị:* ${safeUnitName}\n` +
        `*Tiêu đề:* ${safeTitle}\n\n` +
        `*Nội dung:*\n${safeDescription}\n\n`;
      
      // Add auto-assignment info if available
      if (feedbackDetails.assignee) {
        const safeAssignee = escapeMarkdown(feedbackDetails.assignee);
        fullMessage += `✅ *Tự động phân công:* ${safeAssignee}\n\n`;
      }
      
      fullMessage += `---\n${safeMessage}`;
    } else {
      fullMessage = message;
    }

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
  trackingNumber: number,
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

    // Escape user-provided fields
    const safeUnitName = escapeMarkdown(unitName);
    const safeFeedbackTitle = escapeMarkdown(feedbackTitle);

    const message = `✅ *Cập nhật trạng thái*\n\n` +
      `*Số kiến nghị:* #${trackingNumber}\n` +
      `*Đơn vị:* ${safeUnitName}\n` +
      `*Yêu cầu:* ${safeFeedbackTitle}\n` +
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

export async function sendAssigneeNotification(
  trackingNumber: number,
  assigneeName: string
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

    // Escape user-provided assignee name
    const safeAssigneeName = escapeMarkdown(assigneeName);

    const message = `👤 *Phân công xử lý*\n\n` +
      `Kiến nghị số *#${trackingNumber}* được phân công cho đồng chí *${safeAssigneeName}* tiếp nhận xử lý.\n\n` +
      `Yêu cầu đồng chí *${safeAssigneeName}* khẩn trương xem xét xử lý.`;

    await bot.sendMessage(chatId, message, {
      parse_mode: "Markdown",
    });

    console.log("Assignee notification sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending assignee notification:", error);
    return false;
  }
}
