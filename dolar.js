// Basit memory store (Vercel için yeterli)
const rateCache = {
  value: null,
  date: null,
  timestamp: 0
};

const ipStore = new Map();

// AYARLAR
const RATE_LIMIT_MS = 3000;      // 3 saniye
const BURST_LIMIT = 5;           // kısa sürede max istek
const BURST_WINDOW = 10000;      // 10 saniye
const BAN_TIME = 5 * 60 * 1000;  // 5 dakika
const CACHE_TTL = 60 * 1000;     // 1 dakika

export default async function handler(req, res) {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown";

  const now = Date.now();

  // IP kaydı
  if (!ipStore.has(ip)) {
    ipStore.set(ip, {
      lastRequest: 0,
      count: 0,
      firstRequest: now,
      bannedUntil: 0
    });
  }

  const ipData = ipStore.get(ip);

  // BAN KONTROL
  if (ipData.bannedUntil > now) {
    return res.status(429).json({
      success: false,
      message: "Geçici olarak engellendin",
      retryAfter: Math.ceil((ipData.bannedUntil - now) / 1000)
    });
  }

  // 3 SANİYE KURALI
  if (now - ipData.lastRequest < RATE_LIMIT_MS) {
    return res.status(429).json({
      success: false,
      message: "Çok hızlı istek",
      rule: "3 saniyede 1 istek"
    });
  }

  // BURST KONTROL
  if (now - ipData.firstRequest < BURST_WINDOW) {
    ipData.count++;
    if (ipData.count > BURST_LIMIT) {
      ipData.bannedUntil = now + BAN_TIME;
      return res.status(429).json({
        success: false,
        message: "Spam algılandı, 5 dk ban"
      });
    }
  } else {
    ipData.count = 1;
    ipData.firstRequest = now;
  }

  ipData.lastRequest = now;

  // PARAMETRE
  const { usd } = req.query;
  if (!usd || isNaN(usd)) {
    return res.status(400).json({
      success: false,
      message: "Geçerli USD gir"
    });
  }

  try {
    let rate;
    let source = "live";

    // CACHE KONTROL
    if (rateCache.value && now - rateCache.timestamp < CACHE_TTL) {
      rate = rateCache.value;
      source = "cache";
    } else {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 3000); // timeout

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

    res.status(200).json({
      success: true,
      usd: Number(usd),
      try: Number(result.toFixed(2)),
      rate,
      source,
      date: rateCache.date || null
    });

  } catch (err) {
    // FALLBACK
    if (rateCache.value) {
      return res.status(200).json({
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
      message: "Servis geçici olarak kullanılamıyor"
    });
  }
}
