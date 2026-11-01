import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';

process.env.NODE_ENV = 'test';
const { createApp } = await import('../server/index.js');

let server;
let baseUrl;

async function startServer(options = {}) {
  const app = createApp({
    frontendOrigins: ['http://localhost:5173'],
    queryLimit: options.queryLimit ?? 100,
    speechLimit: options.speechLimit ?? 10,
    serveClient: options.serveClient ?? false,
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
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await startServer({ serveClient: true });

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
