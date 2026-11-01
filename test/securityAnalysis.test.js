import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeMessage, analyzeUrl } from '../server/securityAnalysis.js';

test('message analysis explains and scores credential and account-blocking pressure', () => {
  const result = analyzeMessage('URGENT: Your bank account will be blocked today. Share your OTP immediately to keep it active.');
  assert.equal(result.category, 'HIGH RISK');
  assert.ok(result.score >= 60 && result.score <= 100);
  assert.deepEqual(result.findings.map((item) => item.id), ['secret-code-request', 'account-threat', 'urgent-payment']);
  assert.ok(result.findings.every((item) => item.explanation && item.action));
});

test('message analysis detects a lottery claim, an advance-fee job, and an unexpected link', () => {
  const lottery = analyzeMessage('You have won a lottery prize! Click https://example.invalid/claim to collect now.');
  const job = analyzeMessage('Remote work from home job offer. Pay a processing fee before your interview.');
  assert.ok(lottery.findings.some((item) => item.id === 'prize-or-lottery'));
  assert.ok(lottery.findings.some((item) => item.id === 'suspicious-link'));
  assert.ok(job.findings.some((item) => item.id === 'job-fee'));
});

test('message analysis supports Telugu and Hindi indicators', () => {
  const telugu = analyzeMessage('మీ OTPను వెంటనే పంపండి, ఖాతా బ్లాక్ అవుతుంది', 'te');
  const hindi = analyzeMessage('अभी अपना OTP भेजें, खाता बंद हो जाएगा', 'hi');
  assert.ok(telugu.findings.some((item) => item.id === 'secret-code-request'));
  assert.ok(hindi.findings.some((item) => item.id === 'secret-code-request'));
});

test('ordinary messages are not declared safe and too-short messages are inconclusive', () => {
  const ordinary = analyzeMessage('The library closes at five; see you after class.');
  const short = analyzeMessage('hello');
  assert.equal(ordinary.category, 'LOW RISK');
  assert.match(ordinary.explanation, /does not prove/i);
  assert.equal(short.category, 'INCONCLUSIVE');
  assert.equal(short.score, null);
});

test('URL analysis flags HTTP, IP hosts, shortened URLs, and misspelled brands', () => {
  assert.ok(analyzeUrl('http://example.org/login').findings.some((item) => item.id === 'unencrypted-http'));
  assert.ok(analyzeUrl('http://192.0.2.1/login').findings.some((item) => item.id === 'ip-hostname'));
  assert.ok(analyzeUrl('https://bit.ly/abc123').findings.some((item) => item.id === 'shortened-url'));
  assert.ok(analyzeUrl('https://paypa1.example/').findings.some((item) => item.id === 'brand-lookalike'));
});

test('ordinary URLs remain inconclusive and are never visited', () => {
  const result = analyzeUrl('https://www.example.org/page');
  assert.equal(result.category, 'INCONCLUSIVE');
  assert.deepEqual(result.findings, []);
  assert.equal(result.external.status, 'not-requested');
});

test('malformed URLs are inconclusive and never use an external service', () => {
  const result = analyzeUrl('this is not a URL');
  assert.equal(result.category, 'INCONCLUSIVE');
  assert.equal(result.findings[0].id, 'malformed-url');
  assert.equal(result.external.status, 'not-requested');
});
