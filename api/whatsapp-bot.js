/**
 * Respuestas automáticas del bot de WhatsApp — Equipos y Servicios AG
 * Usado por api/whatsapp-webhook.js (Vercel)
 */

const LAB_NAME = 'Equipos y Servicios AG';

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function buildBotReply(incomingText) {
  const t = normalize(incomingText);

  if (!t.trim() || /^(hola|buenas|buenos|hi|hello|hey|saludos)/.test(t)) {
    return (
      `¡Hola! Gracias por contactar a *${LAB_NAME}*.\n\n` +
      'Somos laboratorio de calibración acreditado ISO/IEC 17025 (PJLA · L25-682).\n\n' +
      'Escriba una opción o palabra clave:\n' +
      '• *Cotización* — calibración o equipos\n' +
      '• *Horario* — días y horarios de atención\n' +
      '• *Acreditación* — certificados y alcance\n' +
      '• *Magnitudes* — áreas que calibramos\n\n' +
      'Un especialista le dará seguimiento. Respuesta típica: *24–48 h* en horario laboral.'
    );
  }

  if (/cotiz|precio|costo|cuanto/.test(t)) {
    return (
      'Para su *cotización*, indíquenos por favor:\n' +
      '1) Instrumento o magnitud\n' +
      '2) Marca y modelo (si aplica)\n' +
      '3) Ciudad\n\n' +
      'Un asesor metrológico revisará su solicitud y le responderá a la brevedad.'
    );
  }

  if (/calibr|certific|instrument/.test(t)) {
    return (
      'Realizamos *calibración acreditada* con trazabilidad internacional.\n' +
      'Magnitudes: dimensional, mecánica, eléctrica, termodinámica, química, masa, tiempo y más.\n\n' +
      'Envíe marca, modelo y cantidad de instrumentos para cotizar.'
    );
  }

  if (/equipo|venta|compra|durimetro|bascula|multimetro/.test(t)) {
    return (
      'Asesoramos en *venta de equipos* de medición y prueba, entregados calibrados.\n' +
      'Indíquenos el tipo de instrumento y su aplicación; un asesor le contactará.'
    );
  }

  if (/horario|hora|abierto|atienden|cuando/.test(t)) {
    return (
      '*Horario de atención:* Lun–Vie 8:00 – 18:00\n' +
      '*Cobertura:* Monterrey, García y zona metropolitana.\n\n' +
      'Fuera de horario recibimos su mensaje y le respondemos el siguiente día hábil.'
    );
  }

  if (/acredit|iso|17025|pjla|l25/.test(t)) {
    return (
      'Estamos acreditados bajo *ISO/IEC 17025:2017* ante PJLA.\n' +
      'Certificado: *L25-682*.\n\n' +
      'Verifique en el sitio oficial PJLA o solicite copia del certificado con nuestro equipo.'
    );
  }

  if (/magnitud|catalogo|dimensional|presion|temperatura/.test(t)) {
    return (
      'Calibramos 8 magnitudes: dimensional, mecánica, acústica, eléctrica, termodinámica, química, masa y fuerza, tiempo y frecuencia.\n\n' +
      'Visite nuestro catálogo en la web o escriba la magnitud que necesita.'
    );
  }

  if (/gracias|thank/.test(t)) {
    return 'Con gusto. Estamos para servirle. Si necesita algo más, escríbanos.';
  }

  return (
    `Gracias por escribir a *${LAB_NAME}*.\n\n` +
    'Recibimos su mensaje. Un especialista le responderá en un plazo típico de *24–48 horas* (Lun–Vie 8:00–18:00).\n\n' +
    'Si es urgente, indique *URGENTE* y el instrumento involucrado.'
  );
}

async function sendWhatsAppText({ token, phoneNumberId, to, body }) {
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WhatsApp API ${res.status}: ${err}`);
  }
}

module.exports = { buildBotReply, sendWhatsAppText };
