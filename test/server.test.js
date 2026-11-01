import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openDatabase } from '../server/database.js';

process.env.NODE_ENV = 'test';
const { createApp } = await import('../server/index.js');

let server;
let baseUrl;
let database;
let clientFixture;

async function startServer(options = {}) {
  const app = createApp({
    frontendOrigins: ['http://localhost:5173'],
    database: openDatabase(':memory:'),
    safeBrowsingApiKey: options.safeBrowsingApiKey ?? '',
    externalFetch: options.externalFetch,
    queryLimit: options.queryLimit ?? 100,
    speechLimit: options.speechLimit ?? 10,
    serveClient: options.serveClient ?? false,
    clientDistPath: options.clientDistPath,
    textToSpeechClient: {
      async synthesizeSpeech(request) {
        if (options.synthesizeSpeech) {
          return options.synthesizeSpeech(request);
        }
        return [{ audioContent: Buffer.from([1, 2, 3]) }];
      },
    },
  });

  server = app.listen(0, '127.0.0.1');
  database = app.locals.database;
  server.once('close', () => database.close());
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

beforeEach(async () => startServer());

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
  if (clientFixture) {
    fs.rmSync(clientFixture, { recursive: true, force: true });
    clientFixture = undefined;
  }
});

test('health endpoint returns process status and security headers', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    message: 'Digital Suraksha API is running',
  });
});

test('query endpoint returns grounded English and Telugu matches', async () => {
  const english = await fetch(`${baseUrl}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'How do I check a phishing link?', language: 'en' }),
  });
  const telugu = await fetch(`${baseUrl}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'నకిలీ లింక్ గురించి చెప్పండి', language: 'te' }),
  });
  const teluguUpi = await fetch(`${baseUrl}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'యూపీఐ మోసం జరిగితే ఏమి చేయాలి?', language: 'te' }),
  });

  assert.equal(english.status, 200);
  assert.match((await english.json()).answer, /website address/i);
  assert.equal(telugu.status, 200);
  assert.match((await telugu.json()).answer, /లాగిన్ వివరాలను/);
  assert.equal(teluguUpi.status, 200);
  assert.match((await teluguUpi.json()).answer, /UPI PIN/);
});

test('unknown questions receive a safe fallback, not an unrelated answer', async () => {
  const response = await fetch(`${baseUrl}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'What is the weather on Mars?', language: 'en' }),
  });
  const data = await response.json();

  assert.equal(response.status, 200);
  assert.equal(data.confidence, 'fallback');
  assert.deepEqual(data.matches, []);
  assert.match(data.answer, /could not find a sufficiently relevant answer/i);
});

test('query rejects invalid shapes, languages, oversized text, and unknown fields', async () => {
  const invalidBodies = [
    [],
    { question: 42 },
    { question: '   ' },
    { question: 'valid', language: 'fr' },
    { question: 'valid', unexpected: true },
    { question: 'x'.repeat(1001) },
  ];

  for (const body of invalidBodies) {
    const response = await fetch(`${baseUrl}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400, JSON.stringify(body).slice(0, 80));
  }
});

test('malformed and oversized JSON receive safe client errors', async () => {
  const malformed = await fetch(`${baseUrl}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"question":',
  });
  const oversized = await fetch(`${baseUrl}/api/assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: 'x'.repeat(9000) }),
  });

  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error, 'Request body must be valid JSON');
  assert.equal(oversized.status, 413);
  assert.equal((await oversized.json()).error, 'Request body is too large');
});

test('unknown API routes return JSON 404 responses', async () => {
  const response = await fetch(`${baseUrl}/api/missing`);
  assert.equal(response.status, 404);
  assert.deepEqual(await response.json(), { error: 'API endpoint not found' });
});

test('client-serving mode uses the SPA fallback for frontend routes', async () => {
  clientFixture = fs.mkdtempSync(path.join(os.tmpdir(), 'digital-suraksha-client-'));
  fs.writeFileSync(path.join(clientFixture, 'index.html'), '<!doctype html><div id="root"></div>');
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await startServer({ serveClient: true, clientDistPath: clientFixture });

  const response = await fetch(`${baseUrl}/a/nested/frontend/route`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /id="root"/);
});

test('CORS blocks unconfigured origins and allows configured frontend origins', async () => {
  const denied = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'https://untrusted.example' },
  });
  const allowed = await fetch(`${baseUrl}/api/health`, {
    headers: { Origin: 'http://localhost:5173' },
  });

  assert.equal(denied.status, 403);
  assert.equal((await denied.json()).error, 'Origin is not allowed');
  assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');
});

test('assistant query applies its per-client rate limit', async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await startServer({ queryLimit: 2 });

  const statuses = [];
  for (let i = 0; i < 3; i += 1) {
    const response = await fetch(`${baseUrl}/api/assistant/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'UPI safety' }),
    });
    statuses.push(response.status);
  }

  assert.deepEqual(statuses, [200, 200, 429]);
});

test('speech endpoint returns MP3 audio for the selected language', async () => {
  let capturedRequest;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await startServer({
    synthesizeSpeech: async (request) => {
      capturedRequest = request;
      return [{ audioContent: Buffer.from([1, 2, 3]) }];
    },
  });

  const response = await fetch(`${baseUrl}/api/assistant/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'తెలుగు సమాధానం', language: 'te' }),
  });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'audio/mpeg');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [1, 2, 3]);
  assert.equal(capturedRequest.voice.languageCode, 'te-IN');
});

test('speech endpoint validates input before calling the provider', async () => {
  const invalidBodies = [
    { text: '', language: 'te' },
    { text: 'తెలుగు'.repeat(280), language: 'te' },
    { text: 'hello', language: 'xx' },
    { text: 'hello', language: 'en', unexpected: true },
  ];

  for (const body of invalidBodies) {
    const response = await fetch(`${baseUrl}/api/assistant/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
  }
});

test('speech provider errors return a sanitized response', async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await startServer({
    synthesizeSpeech: async () => {
      throw Object.assign(new Error('private provider details'), { code: 7 });
    },
  });

  const response = await fetch(`${baseUrl}/api/assistant/speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'hello', language: 'en' }),
  });
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.error, 'Speech generation failed. Check server credentials and try again.');
  assert.equal(JSON.stringify(body).includes('private provider details'), false);
});

test('speech endpoint applies its per-client rate limit', async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await startServer({ speechLimit: 2 });

  const body = JSON.stringify({ text: '', language: 'te' });
  const statuses = [];

  for (let i = 0; i < 3; i += 1) {
    const response = await fetch(`${baseUrl}/api/assistant/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    statuses.push(response.status);
  }

  assert.deepEqual(statuses, [400, 400, 429]);
});

test('message and URL analysis APIs return rule-based results without saving by default', async () => {
  const message = await fetch(`${baseUrl}/api/security/message/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'URGENT: your bank account will be blocked. Share your OTP now.' }),
  });
  const url = await fetch(`${baseUrl}/api/security/url/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'http://192.0.2.1/login' }),
  });
  const messageData = await message.json();
  const urlData = await url.json();

  assert.equal(message.status, 200);
  assert.equal(messageData.result.category, 'HIGH RISK');
  assert.equal(messageData.storage, 'not-saved');
  assert.equal(url.status, 200);
  assert.equal(urlData.result.category, 'HIGH RISK');
  assert.equal(urlData.result.external.status, 'not-requested');
  assert.equal(urlData.storage, 'not-saved');
});

test('Safe Browsing receives a URL only with explicit consent', async () => {
  let capturedRequest;
  const unavailable = await fetch(`${baseUrl}/api/security/url/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.org/', externalCheckConsent: true }),
  });
  const unavailableData = await unavailable.json();
  assert.equal(unavailableData.result.external.status, 'not-configured');
  assert.match(unavailableData.disclosure, /not sent/);

  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await startServer({
    safeBrowsingApiKey: 'test-key',
    externalFetch: async (url, request) => {
      capturedRequest = { url, request };
      return { ok: true, async json() { return { matches: [{ threatType: 'SOCIAL_ENGINEERING' }] }; } };
    },
  });

  const local = await fetch(`${baseUrl}/api/security/url/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.org/', externalCheckConsent: false }),
  });
  assert.equal((await local.json()).result.external.status, 'not-requested');
  assert.equal(capturedRequest, undefined);

  const external = await fetch(`${baseUrl}/api/security/url/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.org/', externalCheckConsent: true }),
  });
  const data = await external.json();
  assert.equal(external.status, 200);
  assert.equal(capturedRequest.request.method, 'POST');
  assert.match(capturedRequest.url, /safebrowsing\.googleapis\.com/);
  assert.equal(JSON.parse(capturedRequest.request.body).threatInfo.threatEntries[0].url, 'https://example.org/');
  assert.equal(data.result.category, 'HIGH RISK');
  assert.equal(data.result.external.status, 'match');
});

test('account registration, authentication, user-isolated history, and CSRF checks work', async () => {
  const register = async (email) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'a secure test passphrase' }),
    });
    const data = await response.json();
    return {
      response,
      data,
      cookie: response.headers.get('set-cookie').match(/digital_suraksha_session=([^;]+)/)[1],
    };
  };

  const owner = await register('Owner@example.test');
  assert.equal(owner.response.status, 201);
  assert.equal(owner.data.user.email, 'owner@example.test');
  assert.ok(owner.data.csrfToken);

  const shortPassword = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'short@example.test', password: 'short' }),
  });
  assert.equal(shortPassword.status, 400);

  const duplicate = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@example.test', password: 'a secure test passphrase' }),
  });
  assert.equal(duplicate.status, 409);

  const unauthenticated = await fetch(`${baseUrl}/api/dashboard`);
  assert.equal(unauthenticated.status, 401);

  const deniedCsrf = await fetch(`${baseUrl}/api/security/message/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Urgent share your OTP', saveHistory: true }),
  });
  assert.equal(deniedCsrf.status, 401);

  const saved = await fetch(`${baseUrl}/api/security/message/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `digital_suraksha_session=${owner.cookie}`,
      'x-csrf-token': owner.data.csrfToken,
    },
    body: JSON.stringify({ message: 'Urgent share your OTP', saveHistory: true }),
  });
  assert.equal(saved.status, 200);
  assert.equal((await saved.json()).storage, 'saved');
  const savedDetails = database.prepare('SELECT details_json FROM analyses').get().details_json;
  assert.equal(savedDetails.includes('Urgent share your OTP'), false);

  const protectedWithoutCsrf = await fetch(`${baseUrl}/api/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `digital_suraksha_session=${owner.cookie}` },
    body: JSON.stringify({ answers: {} }),
  });
  assert.equal(protectedWithoutCsrf.status, 403);

  const assessmentAnswers = Object.fromEntries(
    ['passwords', 'mfa', 'recovery', 'device-lock', 'permissions', 'privacy', 'updates', 'login-alerts'].map((id, index) => [id, index < 4]),
  );
  const assessment = await fetch(`${baseUrl}/api/assessments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `digital_suraksha_session=${owner.cookie}`,
      'x-csrf-token': owner.data.csrfToken,
    },
    body: JSON.stringify({ answers: assessmentAnswers }),
  });
  assert.equal(assessment.status, 201);
  assert.equal((await assessment.json()).assessment.score, 50);

  const ownerDashboard = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { Cookie: `digital_suraksha_session=${owner.cookie}` },
  });
  assert.equal((await ownerDashboard.json()).dashboard.messages.total, 1);
  const ownerHistory = await fetch(`${baseUrl}/api/analysis-history`, {
    headers: { Cookie: `digital_suraksha_session=${owner.cookie}` },
  });
  assert.equal((await ownerHistory.json()).items.length, 1);

  const other = await register('other@example.test');
  const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'owner@example.test', password: 'incorrect password' }),
  });
  assert.equal(invalidLogin.status, 401);
  const validLogin = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'OWNER@example.test', password: 'a secure test passphrase' }),
  });
  const loginData = await validLogin.json();
  assert.equal(validLogin.status, 200);
  assert.equal(loginData.user.id, owner.data.user.id);

  const checklist = await fetch(`${baseUrl}/api/payment-checklist`, {
    headers: { Cookie: `digital_suraksha_session=${owner.cookie}` },
  });
  assert.deepEqual((await checklist.json()).checks, Array(10).fill(false));
  const checklistChecks = [true, false, true, false, true, false, true, false, true, false];
  const saveChecklist = await fetch(`${baseUrl}/api/payment-checklist`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `digital_suraksha_session=${owner.cookie}`,
      'x-csrf-token': owner.data.csrfToken,
    },
    body: JSON.stringify({ checks: checklistChecks }),
  });
  assert.equal(saveChecklist.status, 200);
  const savedChecklist = await fetch(`${baseUrl}/api/payment-checklist`, {
    headers: { Cookie: `digital_suraksha_session=${owner.cookie}` },
  });
  assert.deepEqual((await savedChecklist.json()).checks, checklistChecks);

  const otherDashboard = await fetch(`${baseUrl}/api/dashboard`, {
    headers: { Cookie: `digital_suraksha_session=${other.cookie}` },
  });
  const otherData = await otherDashboard.json();
  assert.equal(otherData.dashboard.messages.total, 0);
  assert.equal(otherData.dashboard.latestAssessment, null);
  const otherHistory = await fetch(`${baseUrl}/api/analysis-history`, {
    headers: { Cookie: `digital_suraksha_session=${other.cookie}` },
  });
  assert.deepEqual((await otherHistory.json()).items, []);

  const deleteAccount = await fetch(`${baseUrl}/api/auth/account`, {
    method: 'DELETE',
    headers: {
      Cookie: `digital_suraksha_session=${other.cookie}`,
      'x-csrf-token': other.data.csrfToken,
    },
  });
  assert.equal(deleteAccount.status, 204);
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM users WHERE id = ?').get(other.data.user.id).count, 0);
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM analyses WHERE user_id = ?').get(other.data.user.id).count, 0);
  assert.equal((await fetch(`${baseUrl}/api/dashboard`, { headers: { Cookie: `digital_suraksha_session=${other.cookie}` } })).status, 401);

  const loggedOut = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Cookie: `digital_suraksha_session=${owner.cookie}`,
      'x-csrf-token': owner.data.csrfToken,
    },
  });
  assert.equal(loggedOut.status, 204);
  assert.equal((await fetch(`${baseUrl}/api/dashboard`, { headers: { Cookie: `digital_suraksha_session=${owner.cookie}` } })).status, 401);
});
