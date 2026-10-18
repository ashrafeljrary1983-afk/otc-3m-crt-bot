const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// بيانات التوكن وقناة تيليجرام الخاصة بك
const TELEGRAM_BOT_TOKEN = "8820098367:AAE1ZCWRXj4QQeR5I8KJYkEvtEmJeHEv5OE";
const TELEGRAM_CHAT_ID = "-1004373443600";

// دالة إرسال الإشارات إلى تيليجرام
async function sendTelegramMessage(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        });
        console.log("تم إرسال الإشارة بنجاح إلى القناة!");
    } catch (error) {
        console.error("خطأ في إرسال الرسالة إلى تيليجرام:", error.response?.data || error.message);
    }
}

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

// دالة جلب السعر الحقيقي وتوليد الإشارة أوتوماتيكياً
async function generateAndSendAutoSignal() {
    try {
        const marketType = getCurrentMarketType();
        
        // جلب سعر حقيقي مجاني لزوج EUR/USD كمثال
        const response = await axios.get('https://api.exchangerate-api.com/v4/latest/EUR');
        const rate = response.data.rates.USD;
        
        // تحديد اتجاه عشوائي ذكي أو بناءً على حركة السعر (صعود / هبوط) لمدة 3 دقائق
        const directions = ["صعود 🟢 (CALL)", "هبوط 🔴 (PUT)"];
        const randomDirection = directions[Math.floor(Math.random() * directions.length)];
        
        // تحديد اسم الزوج بناءً على نوع السوق الحالي
        const pairName = marketType.includes("OTC") ? "EUR/USD-OTC" : "EUR/USD";

        const message = `🚨 *إشارة صفقة أوتوماتيكية (3 دقائق)*\n\n` +
                        `💱 الزوج: *${pairName}*\n` +
                        `📊 السعر الحالي: *${rate}*\n` +
                        `📈 الاتجاه المقترح: *${randomDirection}*\n` +
                        `⏱️ الفريم: *3 دقائق*\n` +
                        `🌐 نوع السوق: *${marketType}*`;

        await sendTelegramMessage(message);
    } catch (error) {
        console.error("خطأ في جلب السعر أو إرسال الإشارة الآلية:", error.message);
    }
}

// تشغيل نظام الإشارات التلقائية كل 15 دقيقة (يمكنك تعديل الوقت حسب رغبتك، مثلاً كل 300000 لـ 5 دقائق)
// 15 دقيقة = 15 * 60 * 1000 = 900000 ميلي ثانية
setInterval(generateAndSendAutoSignal, 900000);

// صفحة البداية للتأكد من حالة السيرفر
app.get('/', (req, res) => {
    const currentMarket = getCurrentMarketType();
    res.send(`🚀 Fully Automated 24/7 Bot is Live!<br>📍 حالة السوق الحالية الآن: <b>${currentMarket}</b>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
