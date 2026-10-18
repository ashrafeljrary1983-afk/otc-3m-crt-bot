const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 10000;

const TELEGRAM_BOT_TOKEN = "8820098367:AAE1ZCWRXj4QQeR5I8KJYkEvtEmJeHEv5OE";
const TELEGRAM_CHAT_ID = "-1004373443600";

const AFFILIATE_LINK = "https://broker-qx.pro/sign-up/?lid=2392983";

// دالة تحديد السوق الحالي حسب توقيت ليبيا (UTC+2)
function getCurrentMarketType() {
    const now = new Date();
    const utcHours = now.getUTCHours();
    const libyaHours = (utcHours + 2) % 24;
    const libyaDay = now.getUTCDay(); // 0 = الأحد, 1 = الاثنين, ... 5 = الجمعة, 6 = السبت

    // الاستثناء: من الاثنين (1) إلى الجمعة (5) بين 8 صباحاً و 9 مساءً (21:00) -> سوق حقيقي
    if (libyaDay >= 1 && libyaDay <= 5) {
        if (libyaHours >= 8 && libyaHours < 21) {
            return "Real Market 🟢 (السوق الحقيقي)";
        }
    }

    // باقي الأوقات وأيام السبت والأحد -> سوق OTC
    return "OTC Market 🔄 (سوق الـ OTC)";
}

// دالة جلب السعر وتوليد الإشارة التلقائية (3 دقائق مع التبديل الذكي)
async function generateAndSendAutoSignal() {
    try {
        const marketType = getCurrentMarketType();
        
        let rate = "1.0850";
        try {
            const response = await axios.get('https://api.exchangerate-api.com/v4/latest/EUR');
            rate = response.data.rates.USD.toFixed(4);
        } catch (e) {
            console.log("Using fallback rate");
        }
        
        const isCall = Math.random() >= 0.5;
        const directionText = isCall ? "صعود ⬆️💚" : "هبوط ⬇️🔴";
        const dirName = isCall ? "صعود ⬆️" : "هبوط ⬇️";

        const pairName = marketType.includes("OTC") ? "EUR/USD-OTC" : "EUR/USD";

        const now = new Date();
        const targetTime = new Date(now.getTime() + (2 * 60 * 1000) + (2 * 60 * 60 * 1000));
        const hours = String(targetTime.getUTCHours()).padStart(2, '0');
        const minutes = String(targetTime.getUTCMinutes()).padStart(2, '0');
        const timeVal = `${hours}:${minutes} 🇱🇾`;

        const signalMessage = `🚨 *إشارة صفقة أوتوماتيكية (3 دقائق)*\n\n` +
                              `💱 الزوج: *${pairName}*\n` +
                              `💙 الوقت: *${timeVal}*\n` +
                              `📊 السعر الحالي: *${rate}*\n` +
                              `📈 الاتجاه المقترح: *${directionText}*\n` +
                              `⏱️ الفريم: *3 دقائق*\n` +
                              `🌐 نوع السوق: *${marketType}*\n\n` +
                              `🎁 [انضم للقناة الـ VIP وسجل للحصول على البونص](${AFFILIATE_LINK})`;

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: signalMessage,
            parse_mode: 'Markdown'
        });
        console.log("تم إرسال إشارة الـ 3 دقائق بنجاح!");
    } catch (error) {
        console.error("خطأ في إرسال الإشارة الآلية:", error.message);
    }
}

// تشغيل نظام الإشارات التلقائية كل 5 دقائق
setInterval(generateAndSendAutoSignal, 5 * 60 * 1000);
setTimeout(generateAndSendAutoSignal, 5000);

app.get('/', (req, res) => {
    const currentMarket = getCurrentMarketType();
    res.send(`🚀 Automated 3M Bot is Live!<br>📍 حالة السوق الحالية الآن: <b>${currentMarket}</b>`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
