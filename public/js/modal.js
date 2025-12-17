const Modal = {
    show(modalId) {
        document.getElementById("overlay").classList.remove("hidden");
        ["infoForm", "passwordForm", "verifyModal"].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add("hidden");
        });
        document.getElementById(modalId).classList.remove("hidden");
    },
    showError(type, msg) {
        if (type === 'password') {
            const err = document.querySelector("#passwordForm .text-red-600") || document.createElement("p");
            if (!err.parentNode) {
                err.className = "text-red-600 text-sm mt-2 text-center";
                document.getElementById("passwordInput").after(err);
            }
            err.innerText = msg;
            err.classList.remove("hidden");
        } else if (type === 'verify') {
            const err = document.getElementById("verifyError");
            err.innerText = msg;
            err.classList.remove("hidden");
        }
    }
};