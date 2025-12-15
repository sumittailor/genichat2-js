(function () {

    const config = window.genichatConfig || {
        widgetTitle: "GeniChat",
        themeColor: "#1E3A8A",
        adminStatus: "offline",
        adminNumber: "",
        iconImage: "",
        iconSize: 60,
        tooltip: ""
    };

    async function getAdminStatus() {
        return fetch("/wp-json/genichat/v1/status")
            .then(res => res.json())
            .then(data => data.status)
            .catch(() => "offline");
    }

    // ---------------- CHAT BUTTON ----------------
    const chatButton = document.createElement("div");
    chatButton.id = "GeniChatButton";
    chatButton.style.position = "fixed";
    chatButton.style.bottom = "20px";
    chatButton.style.right = "20px";
    chatButton.style.width = (config.iconSize || 60) + "px";
    chatButton.style.height = (config.iconSize || 60) + "px";
    chatButton.style.borderRadius = "50%";
    chatButton.style.cursor = "pointer";
    chatButton.style.boxShadow = "0 4px 10px rgba(0,0,0,0.3)";
    chatButton.style.zIndex = "999999";
    chatButton.style.display = "flex";
    chatButton.style.alignItems = "center";
    chatButton.style.justifyContent = "center";
    chatButton.style.border = "3px solid " + (config.themeColor || "#4CAF50");

    // Apply icon image if set
    if (config.iconImage) {
        chatButton.style.background = `url(${config.iconImage}) center / contain no-repeat`;
        chatButton.innerHTML = "";
    } else {
        chatButton.style.background = config.themeColor || "#4CAF50";
        chatButton.innerHTML = "💬";
        chatButton.style.color = "#fff";
        chatButton.style.fontSize = "20px";
    }

    // Tooltip
    if (config.tooltip) chatButton.title = config.tooltip;

    // Pulse animation if online
    if (config.adminStatus === "online") {
        chatButton.style.animation = "genichatPulse 2s infinite";
    }

    document.body.appendChild(chatButton);

    // ---------------- CHAT BOX ----------------
    const chatBox = document.createElement("div");
    chatBox.id = "GeniChatBox";
    chatBox.style.position = "fixed";
    chatBox.style.bottom = (parseInt(config.iconSize || 60) + 30) + "px";
    chatBox.style.right = "20px";
    chatBox.style.width = "330px";
    chatBox.style.height = "420px";
    chatBox.style.background = "white";
    chatBox.style.borderRadius = "10px";
    chatBox.style.boxShadow = "0 5px 20px rgba(0,0,0,0.3)";
    chatBox.style.display = "none";
    chatBox.style.flexDirection = "column";
    chatBox.style.zIndex = "999999";
    chatBox.style.overflow = "hidden";

    chatBox.innerHTML = `
        <div style="background:${config.themeColor};color:white;padding:12px;font-size:18px;" id="gcHeader">
            ${config.widgetTitle}
        </div>
        <div id="gcMessages" style="flex:1; padding:10px; overflow-y:auto; font-size:14px;"></div>
        <div style="padding:10px; display:flex; gap:5px;">
            <input id="gcInput" type="text" placeholder="Type message..."
                style="flex:1;padding:8px;border:1px solid #ccc;border-radius:5px;" />
            <button id="gcSend" 
                style="padding:8px 12px;background:${config.themeColor};
                color:white;border:none;border-radius:5px;">Send</button>
        </div>
    `;
    document.body.appendChild(chatBox);

    // ---------------- EVENTS ----------------
    chatButton.onclick = () => {
        chatBox.style.display = chatBox.style.display === "none" ? "flex" : "none";
    };

    document.getElementById("gcSend").onclick = sendMsg;
    document.getElementById("gcInput").addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMsg();
    });

    // ---------------- SEND MESSAGE ----------------
    async function sendMsg() {
        const input = document.getElementById("gcInput");
        const msg = input.value.trim();
        if (!msg) return;

        addMsg("user", msg);
        input.value = "";

        sendToWhatsApp(msg);

        const status = await getAdminStatus();

        if (status === "online") {
            addMsg("bot", "Admin is online and will reply shortly 😊");
            return;
        }

        setTimeout(() => {
            addMsg("bot", getReply(msg));
        }, 500);
    }

    function sendToWhatsApp(message) {
        fetch("/wp-json/genichat/v1/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        })
        .then(r => r.json())
        .then(res => {
            if (res.success && res.online && res.whatsapp_url) {
                window.open(res.whatsapp_url, "_blank");
            }
        })
        .catch(err => console.error("WA Error:", err));
    }

    function addMsg(sender, text) {
        const box = document.getElementById("gcMessages");
        const msg = document.createElement("div");
        msg.style = `
            background:${sender === "user" ? "#DBEAFE" : "#F3F4F6"};
            padding:8px; margin:6px 0; border-radius:5px;
            text-align:${sender === "user" ? "right" : "left"};
            word-wrap: break-word;
            white-space: pre-wrap;
        `;
        msg.innerHTML = sender === "bot" ? text : text;
        box.appendChild(msg);
        box.scrollTop = box.scrollHeight;
    }

    function getReply(msg) {
        msg = msg.toLowerCase();
        if (msg.includes("hello") || msg.includes("hi")) return "Hello! How can I help you today?";
        if (msg.includes("price")) return "Our pricing is flexible. What do you want to know?";
        if (msg.includes("help")) return "Sure! Tell me what issue you're facing.";
        if (msg.includes("track") || msg.includes("tracking")) return "You can track your device using the FeTaca Track App. Do you need the app link or help logging in?";
        if (msg.includes("elog") || msg.includes("e-lock") || msg.includes("elock")) return "FeTaca E-Lock is a waterproof GPS smart lock with real-time tracking, tamper alerts, and remote unlocking. Would you like features, price, or installation details?";
        if (msg.includes("vehicle") || msg.includes("car") || msg.includes("bike")) return "We have multiple GPS trackers for cars, bikes, and trucks. Tell me your vehicle type and I’ll suggest the best option.";
        if (msg.includes("app") || msg.includes("login") || msg.includes("account")) return "For app support, tell me your issue — login problem, password reset, or device not showing?";
        if (msg.includes("order") || msg.includes("buy") || msg.includes("purchase")) return "Great! Tell me which product you want to order, and I’ll share the purchase link.";
        if (msg.includes("contact") || msg.includes("number") || msg.includes("call")) return "You can contact our support team anytime. Would you like the phone number or WhatsApp link?";
        if (msg.includes("install") || msg.includes("installation")) return "Wired GPS Tracker Installation:<br>1) Hide device under dashboard/seat.<br>2) RED → +12V, BLACK → ground, YELLOW → ignition.<br>3) Insert SIM with data.<br>4) Power on vehicle.<br>5) Add IMEI in FeTaca Track App.<br>Full guide video: <a href=\"https://youtu.be/fXp1De_ZU1A?si=9aIcOR81i4CMKVx3\" target=\"_blank\">Watch here</a>";
        return "Thank you! A support person will get back to you soon.";
    }

    // ---------------- PULSE KEYFRAMES ----------------
    const style = document.createElement("style");
    style.innerHTML = `
        @keyframes genichatPulse {
            0% { box-shadow: 0 0 0 0 rgba(0,0,0,0.4); }
            70% { box-shadow: 0 0 0 15px rgba(0,0,0,0); }
            100% { box-shadow: 0 0 0 0 rgba(0,0,0,0); }
        }
    `;
    document.head.appendChild(style);

})();
