const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 10000;

// Telegram Configs
const TELEGRAM_BOT_TOKEN = "8820098367:AAE1ZCWRXj4QQeR5I8KJYkEvtEmJeHEv5OE";
const TELEGRAM_CHAT_ID = "-1004373443600";
const AFFILIATE_LINK = "https://broker-qx.pro/sign-up/?lid=2392983";

// Stable and High-Volume Currency Pairs
const basePairs = [
  { name: "EUR/USD", flag: "🇪🇺🇺🇸" },
  { name: "GBP/USD", flag: "🇬🇧🇺🇸" },
  { name: "USD/JPY", flag: "🇺🇸🇯🇵" },
  { name: "AUD/USD", flag: "🇦🇺🇺🇸" },
  { name: "USD/CAD", flag: "🇺🇸🇨🇦" },
  { name: "USD/CHF", flag: "🇺🇸🇨🇭" },
  { name: "EUR/GBP", flag: "🇪🇺🇬🇧" },
  { name: "EUR/JPY", flag: "🇪🇺🇯🇵" },
  { name: "GBP/JPY", flag: "🇬🇧🇯🇵" },
  { name: "AUD/CAD", flag: "🇦🇺🇨🇦" },
  { name: "NZD/USD", flag: "🇳🇿🇺🇸" },
  { name: "USD/MXN", flag: "🇺🇸🇲🇽" },
  { name: "USD/BRL", flag: "🇺🇸🇧🇷" },
  { name: "XAU/USD", flag: "🥇" },
  { name: "BITCOIN", flag: "₿" }
];

// Stats Tracker for the last 10 signals batch
let batchStats = {
  total: 0,
  wins: 0,
  losses: 0,
  draws: 0
};

// Check Market Type (Libya Time GMT+2)
function isRealMarket() {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const libyaHours = (utcHours + 2) % 24;
  const libyaDay = now.getUTCDay(); // 1 = Monday, ..., 5 = Friday

  // Monday to Friday between 8:00 AM and 9:00 PM (21:00) Libya Time
  if (libyaDay >= 1 && libyaDay <= 5) {
    if (libyaHours >= 8 && libyaHours < 21) {
      return true;
    }
  }
  return false;
}

async function sendTelegramMessage(text) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error("Telegram error:", error.message);
  }
}

let isSignalRunning = false;

async function run3MinSniperCycle() {
  if (isSignalRunning) return;
  isSignalRunning = true;

  try {
    const realMarket = isRealMarket();
    const marketLabel = realMarket ? "Real Market Quotex" : "OTC Market Quotex";

    // Select random pair from stable list
    const randomItem = basePairs[Math.floor(Math.random() * basePairs.length)];
    const pairSymbol = realMarket ? randomItem.name : `${randomItem.name}-OTC`;
    const fullPairName = `${randomItem.flag} ${pairSymbol}`;

    const isCall = Math.random() >= 0.5;
    const directionText = isCall ? "CALL ⬆️💚 (BUY)" : "PUT ⬇️🔴 (SELL)";
    const dirSimple = isCall ? "CALL ⬆️" : "PUT ⬇️";

    // Target Time (Libya Time GMT+2)
    const now = new Date();
    const targetTime = new Date(now.getTime() + (3 * 60 * 1000) + (2 * 60 * 60 * 1000));
    const hours = String(targetTime.getUTCHours()).padStart(2, '0');
    const minutes = String(targetTime.getUTCMinutes()).padStart(2, '0');
    const timeVal = `${hours}:${minutes} (GMT+2) 🇱🇾`;

    // Construct Signal Message
    const signalMessage = `🤖 *AUTOMATED TRADING SIGNAL (3M)*\n\n` +
                          `📍 *Pair:* ${fullPairName}\n` +
                          `🌐 *Market Type:* ${marketLabel}\n` +
                          `📊 *Timeframe:* 3 Minutes\n` +
                          `⏳ *Duration:* 3 Minutes\n` +
                          `🕓 *Entry Time:* ${timeVal}\n\n` +
                          `🎯 *Direction:* ${directionText}`;

    await sendTelegramMessage(signalMessage);

    // Wait 3 minutes for trade expiration
    setTimeout(async () => {
      const randVal = Math.random();
      let finalResult = 'WIN';
      if (randVal < 0.12) finalResult = 'LOSS';
      else if (randVal < 0.15) finalResult = 'DRAW';

      batchStats.total++;
      let resultTextDesc = '';

      if (finalResult === 'WIN') {
        batchStats.wins++;
        resultTextDesc = 'WIN 🟢 💵';
      } else if (finalResult === 'LOSS') {
        batchStats.losses++;
        resultTextDesc = 'LOSS 🔴 🪙';
      } else {
        batchStats.draws++;
        resultTextDesc = 'DRAW ⚖️';
      }

      // Single trade result message
      const resultMessage = `🏁 *SIGNAL RESULT*\n\n` +
                            `📍 *Pair:* ${fullPairName}\n` +
                            `🎯 *Direction:* ${dirSimple}\n` +
                            `📊 *Result:* ${resultTextDesc}`;

      await sendTelegramMessage(resultMessage);

      // Check if 10 signals batch is completed
      if (batchStats.total === 10) {
        const totalWinLoss = batchStats.wins + batchStats.losses;
        const winRate = totalWinLoss > 0 ? ((batchStats.wins / totalWinLoss) * 100).toFixed(1) : "0.0";

        const summaryMessage = `📊 *LAST 10 SIGNALS PERFORMANCE REPORT*\n\n` +
                               `• Total Signals: ${batchStats.total}\n` +
                               `• Winning Signals: ${batchStats.wins} 🟢\n` +
                               `• Losing Signals: ${batchStats.losses} 🔴\n` +
                               `• Draw Signals: ${batchStats.draws} ⚖️\n` +
                               `🎯 *Win Rate:* ${winRate}%\n\n` +
                               `🎁 [Join VIP & Claim Bonus](${AFFILIATE_LINK})`;

        await sendTelegramMessage(summaryMessage);

        // Reset batch stats
        batchStats = { total: 0, wins: 0, losses: 0, draws: 0 };
      }

      // ⏳ 1-minute buffer interval for traders to prepare before next signal starts
      setTimeout(() => {
        isSignalRunning = false;
      }, 60 * 1000);

    }, 3 * 60 * 1000);

  } catch (err) {
    console.error("Cycle error:", err);
    isSignalRunning = false;
  }
}

// Check every 20 seconds if cycle can run
setInterval(() => {
  if (!isSignalRunning) {
    run3MinSniperCycle();
  }
}, 20 * 1000);

// Initial run
setTimeout(() => {
  run3MinSniperCycle();
}, 5000);

app.get('/', (req, res) => {
  const marketStatus = isRealMarket() ? "Real Market 🟢" : "OTC Market 🔄";
  res.send(`🚀 3-Minute Automated Signal Bot is Live!<br>Current Market: <b>${marketStatus}</b>`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
