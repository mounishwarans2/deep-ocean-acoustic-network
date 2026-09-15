// Minimal Express backend for the Underwater Intelligence dashboard.
// Exposes POST /api/notify/failure -> Twilio SMS + voice call.
// All Twilio credentials stay server-side (dotenv). Nothing secret is
// ever sent to or required by the React frontend.
const path = require('path');
// Canonical location is server/.env; fall back to cwd .env / real env vars.
// (dotenv never overrides variables that are already set.)
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const PORT = Number(process.env.PORT || 5000);
const { TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM, ALERT_TO } = process.env;

const app = express();
app.use(cors());
app.use(express.json({ limit: '64kb' }));

function credentialsConfigured() {
  return Boolean(TWILIO_SID && TWILIO_TOKEN && TWILIO_FROM && ALERT_TO);
}

function getTwilioClient() {
  // Required lazily so the server boots (and serves health/validation)
  // even when Twilio env vars are not configured.
  // eslint-disable-next-line global-require
  const twilio = require('twilio');
  return twilio(TWILIO_SID, TWILIO_TOKEN);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, twilioConfigured: credentialsConfigured() });
});

// POST /api/notify/failure
// Body: { nodeId: string, status?: string, message?: string }
app.post('/api/notify/failure', async (req, res) => {
  const { nodeId, status, message } = req.body || {};

  // ---- backend validation ----
  if (typeof nodeId !== 'string' || nodeId.trim() === '') {
    return res.status(400).json({ ok: false, error: 'nodeId is required and must be a non-empty string.' });
  }
  if (nodeId.length > 64) {
    return res.status(400).json({ ok: false, error: 'nodeId is too long (max 64 characters).' });
  }

  const safeNode = nodeId.trim();
  const safeStatus = typeof status === 'string' && status ? status.slice(0, 32) : 'CRITICAL';
  const safeMessage = typeof message === 'string' && message ? message.slice(0, 500) : 'Underwater node failure detected';

  if (!credentialsConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Twilio is not configured on the server. Set TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM and ALERT_TO.',
    });
  }

  // NOTE: trial accounts accept ONLY predefined SMS template names as the
  // body (freeform text is rejected with error 572006). This template is
  // proven accepted by Twilio. After upgrading to a full account, restore
  // the freeform failure text below.
  // const smsBody = [
  //   '🚨 UNDERWATER NODE FAILURE',
  //   '',
  //   `Node: ${safeNode}`,
  //   `Status: ${safeStatus}`,
  //   '',
  //   safeMessage,
  //   '',
  //   'Emergency recovery procedure initiated.',
  //   'Check the Mission Dashboard.',
  // ].join('\n');
  void safeStatus;
  void safeMessage;
  const smsBody = 'sms_appointment_reminders';

  // Voice uses Twilio's hosted template (same approach as the Console's
  // "Start call"): trial accounts accept the Url parameter where inline
  // TwiML is rejected. The template speaks a generic alert prompt.
  const VOICE_TEMPLATE_URL = 'https://webhooks.twilio.com/v1/Voice/Template/voice_speech_recognition';

  const result = { ok: true, sms: null, call: null };
  const errors = [];

  try {
    const client = getTwilioClient();
    const sms = await client.messages.create({ from: TWILIO_FROM, to: ALERT_TO, body: smsBody });
    result.sms = { sid: sms.sid, status: sms.status };
  } catch (err) {
    errors.push(`SMS failed: ${err && err.message ? err.message : err}`);
  }

  try {
    const client = getTwilioClient();
    const call = await client.calls.create({
      from: TWILIO_FROM,
      to: ALERT_TO,
      url: VOICE_TEMPLATE_URL,
    });
    result.call = { sid: call.sid, status: call.status };
  } catch (err) {
    errors.push(`Call failed: ${err && err.message ? err.message : err}`);
  }

  if (!result.sms && !result.call) {
    return res.status(502).json({ ok: false, error: errors.join(' | ') || 'Twilio request failed.' });
  }
  if (errors.length > 0) {
    result.warning = errors.join(' | ');
  }
  return res.json(result);
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[notify-server] listening on http://localhost:${PORT} (twilio configured: ${credentialsConfigured()})`);
});
