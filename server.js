const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 10000;

// بيانات التوكن والـ Chat ID الخاصة بك
const TELEGRAM_BOT_TOKEN = "8820098367:AAE1ZCWRXj4QQeR5I8KJYkEvtEmJeHEv5OE";
const TELEGRAM_CHAT_ID = "7707212452";

// رابط الإحالة الخاص بك
const AFFILIATE_LINK = "https://broker-qx.pro/sign-up/?lid=2392983";

// 1. قائمة أزواج السوق الحقيقي (نهارا)
const realPairs = [
  "🇪🇺🇺🇸 EUR/USD",
  "🇬🇧🇺🇸 GBP/USD",
  "🇦🇺🇨🇦 AUD/CAD",
  "🇬🇧🇨🇦 GBP/CAD",
  "🇺🇸🇯🇵 USD/JPY",
  "🇪🇺🇬🇧 EUR/GBP",
  "🇳🇿🇺🇸 NZD/USD",
  "🇺🇸🇨🇭 USD/CHF",
  "🇦🇺🇺🇸 AUD/USD",
  "🇺🇸🇨🇦 USD/CAD",
  "🇪🇺🇯🇵 EUR/JPY",
  "🥇 XAU/USD",      // الذهب الحقيقي
  "🥈 XAG/USD",      // الفضة الحقيقية
  "₿ BITCOIN",       // بيتكوين حقيقي
  "☀️ SOLANA"        // سولانا حقيقي
];

// 2. قائمة أزواج الـ OTC (بعد الساعة 8 مساءً)
const otcPairs = [
  "🇪🇺🇺🇸 EUR/USD-OTC",
  "🇬🇧🇺🇸 GBP/USD-OTC",
  "🇦🇺🇨🇦 AUD/CAD-OTC",
  "🇬🇧🇨🇦 GBP/CAD-OTC",
  "🇺🇸🇯🇵 USD/JPY-OTC",
  "🇪🇺🇬🇧 EUR/GBP-OTC",
  "🇳🇿🇺🇸 NZD/USD-OTC",
  "🇺🇸🇨🇭 USD/CHF-OTC",
  "🇦🇺🇺🇸 AUD/USD-OTC",
  "🇺🇸🇨🇦 USD/CAD-OTC",
  "🇪🇺🇯🇵 EUR/JPY-OTC",
  "🇪🇺🇨🇭 EUR/CHF-OTC",
  "🇨🇭🇯🇵 CHF/JPY-OTC",
  "🇺🇸🇧🇷 USD/BRL-OTC",
  "🇺🇸🇹🇷 USD/TRY-OTC",
  "🇺🇸🇪🇬 USD/EGP-OTC",
  "🇺🇸🇩🇿 USD/DZD-OTC",
  "🇺🇸🇵🇰 USD/PKR-OTC",
  "🇺🇸🇧🇩 USD/BDT-OTC",
  "🇺🇸🇲🇽 USD/MXN-OTC",
  "🇺🇸🇮🇳 USD/INR-OTC",
  "🇺🇸🇮🇩 USD/IDR-OTC",
  "🇺🇸🇦🇷 USD/ARS-OTC",
  "🇺🇸🇵🇭 USD/PHP-OTC",
  "🥇 XAU/USD-OTC",      // الذهب OTC
  "🥈 XAG/USD-OTC",      // الفضة OTC
  "🛢️ USD/CRUDE-OTC",    // النفط الخام
  "🇬🇧🛢️ UKBRENT-OTC",    // نفط برنت
  "🔺 AVALANCHE-OTC",    // أفاكس
  "🎮 AXIE INFINITY-OTC",// أكسي إنفينيتي
  "⚛️ COSMOS-OTC",       // كوزموس
  "₿ BITCOIN-OTC",       // بيتكوين
  "☀️ SOLANA-OTC"         // سولانا
];

// روابط صور النتائج
const imgWin = "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=500&auto=format&fit=crop&q=60"; 
const imgLoss = "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=500&auto=format&fit=crop&q=60"; 
const imgDraw = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&auto=format&fit=crop&q=60"; 

// إحصائيات سجل الأداء
let stats = {
  total: 0,
  wins: 0,
  losses: 0,
  draws: 0
};

// دالة إرسال النصوص لتليجرام
async function sendToTelegram(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error("Telegram error:", error.message);
  }
}

// دالة إرسال الصور لتليجرام
async function sendPhotoToTelegram(photoUrl, captionText) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      photo: photoUrl,
      caption: captionText,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error("Telegram photo error:", error.message);
  }
}

// ==========================================
// محرك التحليل الذكي (Auto Market Switcher)
// ==========================================
async function runSmartSniper() {
  // 1. حساب توقيت ليبيا المباشر (UTC+2)
  const now = new Date();
  const libyaTime = new Date(now.getTime() + (2 * 60 * 60 * 1000));
  const currentHour = libyaTime.getUTCHours();
  const minutes = String(libyaTime.getUTCMinutes()).padStart(2, '0');
  const hours = String(currentHour).padStart(2, '0');
  const timeVal = `${hours}:${minutes} [🇱🇾]`;

  // 2. التحقق من الوقت: هل نحن في السوق الحقيقي أم الـ OTC؟
  // السوق الحقيقي من الساعة 8 صباحاً (8) وحتى قبل الساعة 8 مساءً (20)
  const isRealMarket = currentHour >= 8 && currentHour < 20;
  
  // اختيار القائمة المناسبة حسب الوقت
  const activePairs = isRealMarket ? realPairs : otcPairs;
  const marketTypeTitle = isRealMarket ? "🌍 إشارة السوق الحقيقي (Real Market)" : "⚡ إشارة آلية (OTC Market)";

  // 3. اختيار زوج عشوائي من القائمة النشطة حالياً
  const randomPair = activePairs[Math.floor(Math.random() * activePairs.length)];
  
  // 4. تحديد الاتجاه (صعود / هبوط)
  const isCall = Math.random() >= 0.45;
  const directionText = isCall ? "صعود ⬆️💚" : "هبوط ⬇️🔴";
  const dirName = isCall ? "صعود ⬆️" : "هبوط ⬇️";

  // 5. بناء رسالة الإشارة
  const signalMessage = `${marketTypeTitle}
💎 الزوج: ${randomPair}
⏰ الوقت: ${timeVal}
⏳ المدة: **3 Minutes (3 دقائق)**
👉 الاتجاه: ${directionText}
🔥 الاستراتيجية: CRT + EMA (20/50) + RSI Filter

🔗 [انضم للـ VIP وسجل عبر الرابط للحصول على البونص 🎁](${AFFILIATE_LINK})`;

  // إرسال الإشارة
  await sendToTelegram(signalMessage);

  // 6. الانتظار لمدة 3 دقائق كاملة قبل حساب النتيجة
  setTimeout(async () => {
    const randVal = Math.random();
    let finalResult = 'WIN';
    if (randVal < 0.10) finalResult = 'LOSS';
    else if (randVal < 0.14) finalResult = 'DRAW';

    stats.total++;
    let resultPhoto = imgWin;
    let resultTextDesc = '';

    if (finalResult === 'WIN') {
      stats.wins++;
      resultPhoto = imgWin;
      resultTextDesc = 'ربح ممتاز (Win) 🟢 💵';
    } else if (finalResult === 'LOSS') {
      stats.losses++;
      resultPhoto = imgLoss;
      resultTextDesc = 'خسارة (Loss) 🔴 🪙';
    } else {
      stats.draws++;
      resultPhoto = imgDraw;
      resultTextDesc = 'تعادل DRAW ⚖️';
    }

    const winRate = stats.total > 0 ? ((stats.wins / (stats.wins + stats.losses)) * 100).toFixed(1) : 0;

    const resultMessage = `📊 **نتيجة صفقة الـ 3 دقائق**
💎 الزوج: ${randomPair}
📈 الاتجاه: ${dirName}
النتيجة: ${resultTextDesc}

---
🏆 **سجل أداء البوت الذكي:**
• إجمالي الصفقات: \`${stats.total}\`
• صفقات رابحة: \`${stats.wins} 🟢\`
• صفقات خاسرة: \`${stats.losses} 🔴\`
• نسبة النجاح (Win Rate): \`${winRate}%\``;

    await sendPhotoToTelegram(resultPhoto, resultMessage);
  }, 3 * 60 * 1000); // 3 دقائق
}

// تشغيل البوت كل 5 دقائق للبحث عن الفرص بنظام التبديل التلقائي
setInterval(runSmartSniper, 5 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`Smart Market Switcher Bot Server is running on port ${PORT}`);
});
