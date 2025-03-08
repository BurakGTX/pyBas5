export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Yalnızca POST isteği desteklenir." });
    }

    const discordWebhookURL = "https://discord.com/api/webhooks/1347982406941937775/zj_AV86uHwEYfRa29AxNzCockE23BcXibtKU-DYk9z66Vme537V54InbejP7FLFHWBxH";
    const message = { content: req.body.content || "Varsayılan mesaj" };

    try {
        const response = await fetch(discordWebhookURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message),
        });

        if (response.ok) {
            return res.status(200).json({ message: "Mesaj başarıyla gönderildi!" });
        } else {
            throw new Error("Webhook isteği başarısız");
        }
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ error: "Mesaj gönderilemedi" });
    }
}
