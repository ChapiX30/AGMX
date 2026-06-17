/**
 * Webhook WhatsApp Cloud API (Meta) — despliegue en Vercel
 *
 * Variables de entorno en Vercel:
 *   WHATSAPP_TOKEN
 *   WHATSAPP_PHONE_NUMBER_ID
 *   WHATSAPP_VERIFY_TOKEN  (elige una clave secreta tuya)
 */
const { buildBotReply, sendWhatsAppText } = require('./whatsapp-bot');

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
      return;
    }
    res.status(403).end('Forbidden');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).end('Method not allowed');
    return;
  }

  res.status(200).json({ received: true });

  try {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) return;

    const body = req.body;
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== 'text') return;

    const from = message.from;
    const text = message.text?.body || '';
    const reply = buildBotReply(text);

    await sendWhatsAppText({
      token,
      phoneNumberId,
      to: from,
      body: reply,
    });
  } catch (err) {
    console.error('whatsapp-webhook:', err);
  }
};
