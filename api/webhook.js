// api/webhook.js
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { url, message, interval } = req.body; // interval'i alın

        try {
            // Spam işlemi sırasında hız ayarlarını kontrol et
            const sendSpam = async () => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content: message })
                });

                if (response.status === 204) {
                    // Başarılı gönderim
                    return { success: true };
                } else if (response.status === 429) {
                    // Rate limit aşımı, duraklatılacak
                    return { success: false, message: 'Rate limit aşımı' };
                } else {
                    // Diğer hatalar
                    return { success: false, message: 'Başarısız' };
                }
            };

            // Daha hızlı spam göndermek için interval'ı azaltabilirsiniz
            let counter = 0;
            const spamInterval = setInterval(async () => {
                const result = await sendSpam();
                counter++;

                if (!result.success) {
                    clearInterval(spamInterval);  // Hata veya limit aşımı durumunda durdur
                    return res.status(429).json({ success: false, message: result.message });
                }

                if (counter >= 50) {  // 50 gönderim sonrası durdur
                    clearInterval(spamInterval);
                    return res.status(200).json({ success: true, message: '50 spam gönderildi.' });
                }
            }, interval);  // interval parametresine göre spam aralığını ayarla

        } catch (error) {
            res.status(500).json({ success: false, message: 'Sunucu hatası' });
        }
    } else {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }
}
