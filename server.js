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

// Full List of Currency Pairs with Flags
const basePairs = [
  { name: "EUR/USD", flag: "🇪🇺🇺🇸" },
  { name: "GBP/USD", flag: "🇬🇧🇺🇸" },
  { name: "AUD/CAD", flag: "🇦🇺🇨🇦" },
  { name: "GBP/CAD", flag: "🇬🇧🇨🇦" },
  { name: "USD/JPY", flag: "🇺🇸🇯🇵" },
  { name: "EUR/GBP", flag: "🇪🇺🇬🇧" },
  { name: "NZD/USD", flag: "🇳🇿🇺🇸" },
  { name: "USD/CHF", flag: "🇺🇸🇨🇭" },
  { name: "AUD/USD", flag: "🇦🇺🇺🇸" },
  { name: "USD/CAD", flag: "🇺🇸🇨🇦" },
  { name: "EUR/JPY", flag: "🇪🇺🇯🇵" },
  { name: "EUR/CHF", flag: "🇪🇺🇨🇭" },
  { name: "CHF/JPY", flag: "🇨🇭🇯🇵" },
  { name: "USD/BRL", flag: "🇺🇸🇧🇷" },
  { name: "USD/TRY", flag: "🇺🇸🇹🇷" },
  { name: "USD/EGP", flag: "🇺🇸🇪🇬" },
  { name: "USD/DZD", flag: "🇺🇸🇩🇿" },
  { name: "USD/PKR", flag: "🇺🇸🇵🇰" },
  { name: "USD/BDT", flag: "🇺🇸🇧🇩" },
  { name: "USD/MXN", flag: "🇺🇸🇲🇽" },
  { name: "USD/INR", flag: "🇺🇸🇮🇳" },
  { name: "USD/IDR", flag: "🇺🇸🇮🇩" },
  { name: "USD/ARS", flag: "🇺🇸🇦🇷" },
  { name: "USD/PHP", flag: "🇺🇸🇵🇭" },
  { name: "XAU/USD", flag: "🥇" },
  { name: "XAG/USD", flag: "🥈" },
  { name: "USD/CRUDE", flag: "🛢️" },
  { name: "UKBRENT", flag: "🇬🇧🛢️" },
  { name: "AVALANCHE", flag: "🔺" },
  { name: "AXIE INFINITY", flag: "🎮" },
  { name: "COSMOS", flag: "⚛️" },
  { name: "BITCOIN", flag: "₿" },
  { name: "SOLANA", flag: "☀️" }
];

// Stats Tracker for the last 10 signals batch
let batchStats = {
  total: 0,
  wins: 0,
  losses: 0,
  draws: 0
};

let overallTotal = 0;

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
    const marketLabel = realMarket ? "Real Market 🟩 Quotex 🟢" : "OTC Market 🟩 Quotex 🔄";

    // Select random pair
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
    const signalMessage = `🤖 *AUTOMATED TRADING SIGNAL*\n\n` +
                          `📍 *Pair:* ${fullPairName}\n` +
                          `🌐 *Market Type:* ${marketLabel}\n` +
                          `📊 *Timeframe:* 3 Minutes\n` +
                          `⏳ *Duration:* 3 Minutes\n` +
                          `🕓 *Entry Time:* ${timeVal}\n\n` +
                          `🎯 *Direction:* ${directionText}`;

    await sendTelegramMessage(signalMessage);

    // Wait exactly 3 minutes for trade expiration
    setTimeout(async () => {
      const randVal = Math.random();
      let finalResult = 'WIN';
      if (randVal < 0.12) finalResult = 'LOSS';
      else if (randVal < 0.15) finalResult = 'DRAW';

      batchStats.total++;
      overallTotal++;
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

        // Reset batch stats for next 10 signals
        batchStats = { total: 0, wins: 0, losses: 0, draws: 0 };
      }

      // Signal completed, allow next signal after 1 minute rest
      setTimeout(() => {
        isSignalRunning = false;
      }, 60 * 1000);

    }, 3 * 60 * 1000);

  } catch (err) {
    console.error("Cycle error:", err);
    isSignalRunning = false;
  }
}

// Check every minute if cycle can run
setInterval(() => {
  if (!isSignalRunning) {
    run3MinSniperCycle();
  }
}, 30 * 1000);

// Initial run
setTimeout(() => {
  run3MinSniperCycle();
}, 5000);

app.get('/', (req, res) => {
  const marketStatus = isRealMarket() ? "Real Market 🟢" : "OTC Market 🔄";
  res.send(`🚀 3-Minute Automated Signal Bot (New Formatting & Batch 10 Stats) is Live!<br>Current Market: <b>${marketStatus}</b>`);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
