import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE)
    ),
    databaseURL:
      "https://pastebin-61d0b-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

const db = admin.database();

// =======================
// MEMORY STORE
// =======================
const rateCache = {
  value: null,
  date: null,
  timestamp: 0
};

const ipStore = new Map();

// AYARLAR
const RATE_LIMIT_MS = 3000;
const BURST_LIMIT = 5;
const BURST_WINDOW = 10000;
const BAN_TIME = 5 * 60 * 1000;
const CACHE_TTL = 60 * 1000;

export default async function handler(req, res) {
  const now = Date.now();

  // =======================
  // API KEY KONTROL
  // =======================
  const { usd, apikey } = req.query;

  if (!apikey) {
    return res.status(401).json({
      success: false,
      message: "API key gerekli"
    });
  }

  const keyRef = db.ref("apiKeys/" + apikey);
  const keySnap = await keyRef.get();

  if (!keySnap.exists()) {
    return res.status(403).json({
      success: false,
      message: "Geçersiz API key"
    });
  }

  const keyData = keySnap.val();

  if (!keyData.active) {
    return res.status(403).json({
      success: false,
      message: "API key pasif"
    });
  }

  // GÜNLÜK RESET
  const today = new Date().toISOString().slice(0, 10);
  if (keyData.lastReset !== today) {
    keyData.usedToday = 0;
    keyData.lastReset = today;
  }

  if (keyData.usedToday >= keyData.dailyLimit) {
    return res.status(429).json({
      success: false,
      message: "Günlük limit doldu"
    });
  }

  // =======================
  // IP RATE LIMIT
  // =======================
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  if (!ipStore.has(ip)) {
    ipStore.set(ip, {
      lastRequest: 0,
      count: 0,
      firstRequest: now,
      bannedUntil: 0
    });
  }

  const ipData = ipStore.get(ip);

  if (ipData.bannedUntil > now) {
    return res.status(429).json({
      success: false,
      message: "IP geçici olarak engellendi"
    });
  }

  if (now - ipData.lastRequest < RATE_LIMIT_MS) {
    return res.status(429).json({
      success: false,
      message: "Çok hızlı istek (3 saniye)"
    });
  }

  if (now - ipData.firstRequest < BURST_WINDOW) {
    ipData.count++;
    if (ipData.count > BURST_LIMIT) {
      ipData.bannedUntil = now + BAN_TIME;
      return res.status(429).json({
        success: false,
        message: "Spam algılandı (5 dk ban)"
      });
    }
  } else {
    ipData.count = 1;
    ipData.firstRequest = now;
  }

  ipData.lastRequest = now;

  // =======================
  // PARAMETRE
  // =======================
  if (!usd || isNaN(usd)) {
    return res.status(400).json({
      success: false,
      message: "Geçerli USD gir"
    });
  }

  try {
    let rate;
    let source = "live";

    // CACHE
    if (rateCache.value && now - rateCache.timestamp < CACHE_TTL) {
      rate = rateCache.value;
      source = "cache";
    } else {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000);

      const r = await fetch(
        "https://free.ratesdb.com/v1/rates?from=USD&to=TRY",
        { signal: controller.signal }
      );
      const j = await r.json();

      rate = j.data.rates.TRY;
      rateCache.value = rate;
      rateCache.date = j.data.date;
      rateCache.timestamp = now;
    }

    const result = usd * rate;

    // LIMIT DÜŞ
    await keyRef.update({
      usedToday: keyData.usedToday + 1,
      lastReset: keyData.lastReset
    });

    res.json({
      success: true,
      usd: Number(usd),
      try: Number(result.toFixed(2)),
      rate,
      source,
      limitLeft: keyData.dailyLimit - keyData.usedToday - 1
    });

  } catch (err) {
    if (rateCache.value) {
      return res.json({
        success: true,
        usd: Number(usd),
        try: Number((usd * rateCache.value).toFixed(2)),
        rate: rateCache.value,
        source: "fallback-cache",
        warning: "Canlı veri alınamadı"
      });
    }

    res.status(500).json({
      success: false,
      message: "Servis geçici olarak kapalı"
    });
  }
}
