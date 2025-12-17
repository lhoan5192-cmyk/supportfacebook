export default async function handler(req, res) {
    // Chỉ cho phép gửi bằng phương thức POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Lấy Token và ChatID từ "Két sắt" Vercel
    const token = process.env.TG_BOT_TOKEN;
    const chatId = process.env.TG_CHAT_ID;

    if (!token || !chatId) {
        return res.status(500).json({ error: 'Chưa cấu hình Token trên Vercel' });
    }

    const { message } = req.body;

    try {
        // Server Vercel tự âm thầm gửi tin sang Telegram
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const data = await response.json();
        
        if (data.ok) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(400).json({ error: 'Lỗi Telegram', details: data });
        }
    } catch (error) {
        return res.status(500).json({ error: 'Lỗi Server' });
    }
}