/**
 * n8n — Code node: lógica de cotización SIN IA (sin redundancia)
 *
 * Entrada esperada (item anterior con estado del cliente):
 *   - text: mensaje WhatsApp ($json.messages[0].text.body)
 *   - from: teléfono ($json.messages[0].from)
 *   - step, servicio, instrumento, ciudad (desde Google Sheets o valores vacíos)
 *
 * Salida: reply, step, servicio, instrumento, ciudad (guardar en Sheets)
 */

const textRaw = ($input.item.json.text || $input.item.json.body || '').trim();
const text = textRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

let step = $input.item.json.step || 'inicio';
let servicio = $input.item.json.servicio || '';
let instrumento = $input.item.json.instrumento || '';
let ciudad = $input.item.json.ciudad || '';

function extractInstrumentType(t) {
  if (/vernier|calibrador|pie de rey|pie de rey/i.test(t)) return 'vernier/calibrador';
  if (/mult[ií]metro/i.test(t)) return 'multímetro';
  if (/b[aá]scula/i.test(t)) return 'báscula';
  if (/dur[ií]metro/i.test(t)) return 'durímetro';
  if (/torqu[ií]metro/i.test(t)) return 'torquímetro';
  return '';
}

function wantsCalibration(t) {
  return /calibraci|certific|servicio de calibraci/.test(t);
}

function wantsEquipment(t) {
  return /equipo|compra|adquiri|venta|cotizar equipo/.test(t);
}

function looksLikeInstrument(t, raw) {
  if (!raw || raw.length < 4) return false;
  if (/^(hola|buenas|buenos|hi|hey|si|sí|ok|gracias)$/.test(t)) return false;
  // Solo "calibración" o "calibración vernier" sin marca/modelo concreto
  if (wantsCalibration(t) && !/[a-z]{2,}\s+[a-z0-9]/i.test(raw) && !/mitutoyo|fluke|cd-?\d/i.test(t)) {
    return false;
  }
  return (
    /mitutoyo|fluke|hanna|ohaus|kern|sartorius|dillon|brown|sharpe|starrett|mahr|presys|radwag|and|timco|cd-?\d|vernier|mult[ií]metro|b[aá]scula|dur[ií]metro|torqu[ií]metro|term[oó]metro/i.test(
      t
    ) || (raw.length >= 8 && !wantsCalibration(t) && !wantsEquipment(t))
  );
}

function looksLikeLocation(t) {
  return (
    /monterrey|garcia|garcía|santa catarina|san pedro|apodaca|escobedo|guadalupe|mty|nuevo le[oó]n|\d+\s*(pieza|pza|equipo|instrumento)/i.test(
      t
    ) || t.length >= 5
  );
}

let reply = '';

// —— Máquina de estados ——
if (step === 'inicio') {
  if (wantsCalibration(text)) {
    servicio = 'calibracion';
    const tipo = extractInstrumentType(text);
    if (looksLikeInstrument(text, textRaw)) {
      instrumento = textRaw.replace(/calibraci[oó]n\s*/i, '').trim() || textRaw;
      step = 'falta_ciudad';
      reply = `Registramos ${instrumento} para calibración. ¿En qué ciudad se encuentra y cuántos instrumentos son?`;
    } else if (tipo) {
      step = 'falta_instrumento';
      reply = `Con gusto. Indique marca y modelo de su ${tipo}.`;
    } else {
      step = 'falta_instrumento';
      reply = 'Con gusto. Indique marca y modelo del instrumento a calibrar.';
    }
  } else if (wantsEquipment(text)) {
    servicio = 'equipo';
    step = 'falta_instrumento';
    reply =
      'Indique el instrumento que desea adquirir y su aplicación.';
  } else if (looksLikeInstrument(text, textRaw)) {
    instrumento = textRaw;
    if (servicio === 'calibracion') {
      step = 'falta_ciudad';
      reply = `Registramos ${instrumento} para calibración. ¿En qué ciudad se encuentra y cuántos instrumentos son?`;
    } else {
      step = 'falta_servicio';
      reply = `Registramos: ${instrumento}. ¿Requiere cotización de calibración o desea adquirir el equipo?`;
    }
  } else {
    reply =
      'Buenos días. ¿Requiere calibración o información sobre equipos? Si ya tiene el instrumento, indique marca y modelo.';
  }
} else if (step === 'falta_instrumento') {
  if (wantsCalibration(text) && servicio === 'calibracion' && !looksLikeInstrument(text, textRaw)) {
    // Cliente repite "calibración" — NO volver a pedir servicio ni saludar
    reply = 'Indique marca y modelo del instrumento a calibrar.';
  } else if (looksLikeInstrument(text, textRaw)) {
    instrumento = textRaw;
    if (servicio === 'calibracion') {
      step = 'falta_ciudad';
      reply = `Registramos ${instrumento} para calibración. ¿En qué ciudad se encuentra y cuántos instrumentos son?`;
    } else {
      step = 'completo';
      reply = `Recibido: ${instrumento}. Un asesor de equipos le contactará en breve.`;
    }
  } else if (wantsCalibration(text) && servicio !== 'calibracion') {
    servicio = 'calibracion';
    reply = 'Indique marca y modelo del instrumento a calibrar.';
  } else {
    reply = 'Por favor indique marca y modelo del instrumento.';
  }
} else if (step === 'falta_servicio') {
  if (wantsCalibration(text)) {
    servicio = 'calibracion';
    step = 'falta_ciudad';
    reply = `Perfecto. ${instrumento} para calibración. ¿En qué ciudad se encuentra y cuántos instrumentos son?`;
  } else if (wantsEquipment(text)) {
    servicio = 'equipo';
    step = 'completo';
    reply = `Recibido. Un asesor le contactará sobre ${instrumento}.`;
  } else {
    reply = '¿Calibración o compra de equipo?';
  }
} else if (step === 'falta_ciudad') {
  if (looksLikeLocation(text) || textRaw.length >= 4) {
    ciudad = textRaw;
    step = 'completo';
    reply = `Recibido: ${instrumento}, ${ciudad}. Un asesor metrológico le enviará la cotización en breve.`;
  } else {
    reply = 'Indique ciudad y cantidad de instrumentos (ej. Monterrey, 1 pieza).';
  }
} else if (step === 'completo') {
  reply =
    'Su solicitud ya está registrada. Un especialista dará seguimiento. Si tiene otra consulta, escriba *nueva* para iniciar otra solicitud.';
  if (/^nueva\b|otra solicitud|reiniciar/.test(text)) {
    step = 'inicio';
    servicio = '';
    instrumento = '';
    ciudad = '';
    reply =
      'De acuerdo. ¿Requiere calibración o información sobre equipos?';
  }
}

return [
  {
    json: {
      from: $input.item.json.from,
      text: textRaw,
      step,
      servicio,
      instrumento,
      ciudad,
      reply,
    },
  },
];
