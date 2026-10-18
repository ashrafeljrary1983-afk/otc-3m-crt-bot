const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// بيانات التوكن وقناة الـ 3 دقائق الخاصة بك
const TELEGRAM_BOT_TOKEN = "8820098367:AAE1ZCWRXj4QQeR5I8KJYkEvtEmJeHEv5OE";
const TELEGRAM_CHAT_ID = "-1004373443600";

// دالة إرسال الإشارات إلى قناة تيليجرام
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

// دالة تحديد السوق الحالي حسب رغبتك الدقيقة بتوقيت ليبيا (UTC+2)
function getCurrentMarketType() {
    const now = new Date();
    // حساب توقيت ليبيا (UTC+2)
    const utcHours = now.getUTCHours();
    const libyaHours = (utcHours + 2) % 24;
    const libyaDay = now.getUTCDay(); // 0 = الأحد, 1 = الاثنين, ... 5 = الجمعة, 6 = السبت

    // الاستثناء: من الاثنين (1) إلى الجمعة (5) بين الساعة 8 صباحاً (8:00) و 9 مساءً (21:00) يعمل على السوق الحقيقي
    if (libyaDay >= 1 && libyaDay <= 5) {
        if (libyaHours >= 8 && libyaHours < 21) {
            return "Real Market 🟢 (السوق الحقيقي)";
        }
    }

    // باقي الأوقات وأيام السبت والأحد تعمل على سوق الـ OTC كقاعدة أساسية
    return "OTC Market 🔄 (سوق الـ OTC)";
}

// استقبال الـ Webhook وإرسال الإشارة مع تحديد نوع السوق تلقائياً
app.post('/signal', async (req, res) => {
    const signalData = req.body;
    if (!signalData || !signalData.message) {
        return res.status(400).send({ error: "بيانات الإشارة غير صالحة" });
    }

    const marketType = getCurrentMarketType();
    const fullMessage = `${signalData.message}\n\n🌐 نوع السوق: *${marketType}*`;

    await sendTelegramMessage(fullMessage);
    res.status(200).send({ status: "success", market: marketType });
});

// صفحة البداية للتأكد من حالة السيرفر ونوع السوق الحالي
app.get('/', (req, res) => {
    const currentMarket = getCurrentMarketType();
    res.send(`🚀 OTC & Real Market 3-Min Bot is Live!<br>📍 حالة السوق الحالية الآن: <b>${currentMarket}</b>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
