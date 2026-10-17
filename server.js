const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// بيانات التوكن وقناة الـ 3 دقائق الجديدة الخاصة بك
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
        console.log("تم إرسال الإشارة بنجاح إلى القناة الخاصة بصفقات الـ 3 دقائق!");
    } catch (error) {
        console.error("خطأ في إرسال الرسالة إلى تيليجرام:", error.response?.data || error.message);
    }
}

// نقطة استقبال الـ Webhook أو إرسال التجربة
app.post('/signal', async (req, res) => {
    const signalData = req.body;
    if (!signalData || !signalData.message) {
        return res.status(400).send({ error: "بيانات الإشارة غير صالحة" });
    }

    await sendTelegramMessage(signalData.message);
    res.status(200).send({ status: "success", message: "تم بث الإشارة بنجاح" });
});

// صفحة البداية للتأكد من أن السيرفر يعمل
app.get('/', (req, res) => {
    res.send("🚀 OTC 3-Min CRT Trading Bot Server is Live and Running 24/7!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
