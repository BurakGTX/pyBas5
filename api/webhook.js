// api/webhook.js
export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { url, message } = req.body;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: message })
            });

            if (response.status === 204) {
                res.status(200).json({ success: true, message: 'Message sent successfully' });
            } else {
                res.status(response.status).json({ success: false, message: 'Failed to send message' });
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error occurred' });
        }
    } else {
        res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }
}
