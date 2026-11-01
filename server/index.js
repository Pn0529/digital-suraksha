import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 4000);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const knowledgeBase = [
  {
    id: 'upi-safety',
    keywords: ['upi', 'payment', 'pin', 'otp', 'cvv', 'transaction', 'banking'],
    keywordsTe: ['చెల్లింపు', 'పిన్', 'లావాదేవీ', 'బ్యాంక్', 'యుపిఐ', 'యూపీఐ', 'మోసం'],
    answer: {
      en: 'Never share your UPI PIN, OTP, or card CVV with anyone. Always verify the payment request before approving it and confirm the receiver name before paying. If a caller or message asks for urgent payment, pause, verify, and call your bank directly.',
      te: 'UPI PIN, OTP లేదా CVV మీకు ఎవరితోనైనా పంచుకోకండి. చెల్లింపును అంగీకరిస్తే ముందుగా పంపిన వివరాలను పరిశీలించండి మరియు వాస్తవ స్వీకర్త పేరు నమోదు అయిందో చూసుకోండి. ఎవరైనా వెంటనే చెల్లింపుని కోరితే, ఆగండి, ధృవీకరించండి, బ్యాంక్‌ను నేరుగా కాల్ చేయండి.'
    }
  },
  {
    id: 'phishing',
    keywords: ['link', 'phishing', 'fake website', 'website', 'sms'],
    keywordsTe: ['లింక్', 'ఫిషింగ్', 'నకిలీ లింక్', 'వెబ్‌సైట్', 'sms'],
    answer: {
      en: 'Carefully check the website address before entering login details. Fake messages often use urgent language, shortened links, or lookalike domains. Do not click unknown links, and verify the official app or website from a trusted source.',
      te: 'లాగిన్ వివరాలను నమోదు చేయడానికి ముందుగా వెబ్సైట్ చిరునామాను పరిశీలించండి. చెడ్డ సందేశాలు అత్యవసర భాష, చిన్న చేసిన లింకులు లేదా పోలిక వున్న డొమైన్లను ఉపయోగిస్తాయి. తెలియని లింకులను నొక్కవద్దు. అధికారిక యాప్ లేదా వెబ్సైట్‌ను సురక్షిత వనరునుంచి ధృవీకరించండి.'
    }
  },
  {
    id: 'job-scam',
    keywords: ['job scam', 'work from home', 'salary', 'job offer', 'recruitment fee'],
    keywordsTe: ['ఉద్యోగ మోసం', 'వర్క్ ఫ్రమ్ హోమ్', 'జీతం', 'ఉద్యోగ ఆఫర్', 'రిజిస్ట్రేషన్ ఫీజు'],
    answer: {
      en: 'A real job offer will not ask you to pay a fee, share OTPs, or complete a payment before the work starts. Be careful with “easy money” promises and verify the employer through official company channels.',
      te: 'నిజమైన ఉద్యోగ ఆఫర్ మీకు ఫీజు చెల్లించమని, OTPలను పంచుకోమని, పనులు ప్రారంభమయ్యేదాకా ముందుగానే చెల్లింపు చేయమని అడగదు. “సులభమైన సంపాదన” వాగ్దానాలపై జాగ్రత్త వహించండి మరియు కంపెనీ అధికారిక ఛానెళ్ల ద్వారా నియామకాన్ని ధృవీకరించండి.'
    }
  },
  {
    id: 'report-fraud',
    keywords: ['report fraud', 'report scam', 'fraudulent message', 'cybercrime', '1930', 'complaint'],
    keywordsTe: ['నివేదించ', 'ఫిర్యాదు', 'సైబర్ క్రైమ్'],
    answer: {
      en: 'If you suspect cyber fraud, report it immediately to your bank and the National Cyber Crime Reporting Portal. In India, the financial fraud helpline is 1930, and you should also save screenshots of the scam message and payment details.',
      te: 'సైబర్ మోసం అనుమానంగా ఉంటే, బ్యాంక్‌కు వెంటనే తెలియజేయండి మరియు జాతీయ సైబర్ క్రైమ్ రిపోర్టింగ్ పోర్టల్‌లో నివేదించండి. ఇండియాలో మొత్తం మోసానికి 1930 హెల్ప్‌లైన్ ఉంది. స్కామ్ సందేశం, చెల్లింపు వివరాల స్క్రీన్ షాట్లు నిల్వ చేయండి.'
    }
  },
  {
    id: 'digital-arrest',
    keywords: ['digital arrest', 'police', 'threat', 'video call', 'impersonation'],
    keywordsTe: ['డిజిటల్ అరెస్ట్', 'పోలీసు', 'బెదిరింపు', 'వీడియో కాల్'],
    answer: {
      en: 'No genuine officer will demand immediate payment, remote access to your phone, or your UPI PIN/OTP under threat or pressure. Stay calm, end the call, and verify the claim through the official office or police helpline.',
      te: 'నిజమైన అధికారులు ఎప్పుడూ వెంటనే చెల్లింపు, ఫోన్‌ను దూరస్థితిలో ఆన్ చేయించుకోవడం, UPI PIN/OTPలు భయపెట్టినపుడు అడగరు. ప్రశాంతంగా ఉండండి, కాల్‌ను ముగించండి, అధికారిక కార్యాలయం లేదా పోలీసు హెల్ప్‌లైన్ ద్వారా ధృవీకరించండి.'
    }
  }
];

const defaultFrontendOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOnlyFields(value, allowedFields) {
  return isObject(value) && Object.keys(value).every((key) => allowedFields.includes(key));
}

export function createApp({
  textToSpeechClient = new TextToSpeechClient(),
  frontendOrigins = process.env.FRONTEND_ORIGINS
    ? process.env.FRONTEND_ORIGINS.split(',').map((origin) => origin.trim()).filter((origin) => origin !== '*')
    : process.env.NODE_ENV === 'production' ? [] : defaultFrontendOrigins,
  queryLimit = 30,
  speechLimit = 20,
  serveClient = process.env.NODE_ENV === 'production',
} = {}) {
  if (process.env.NODE_ENV === 'production' && frontendOrigins.length === 0) {
    throw new Error('Set FRONTEND_ORIGINS to the exact frontend origin(s) in production');
  }

  const app = express();
  const allowedOrigins = new Set(frontendOrigins);
  const queryRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: queryLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
  const speechRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: speechLimit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      const error = new Error('Origin not allowed');
      error.status = 403;
      callback(error);
    },
  }));
  app.use(express.json({ limit: '8kb', strict: true }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'Digital Suraksha API is running' });
  });

  app.get('/api/knowledge-base', (_req, res) => {
    res.json({ items: knowledgeBase });
  });

  app.post('/api/assistant/query', queryRateLimit, (req, res) => {
    if (!hasOnlyFields(req.body, ['question', 'language'])) {
      return res.status(400).json({ error: 'Request must contain only question and language fields' });
    }
    if (typeof req.body.question !== 'string' || !req.body.question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }
    if (Buffer.byteLength(req.body.question, 'utf8') > 1000) {
      return res.status(400).json({ error: 'Question must be 1000 UTF-8 bytes or fewer' });
    }

    const language = req.body.language === undefined ? 'en' : req.body.language;
    if (language !== 'en' && language !== 'te') {
      return res.status(400).json({ error: 'Language must be en or te' });
    }

    const lowered = req.body.question.trim().toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const item of knowledgeBase) {
      const keywords = language === 'te' ? item.keywordsTe : item.keywords;
      const score = keywords.reduce((total, keyword) => {
        return total + (lowered.includes(keyword.toLowerCase()) ? 1 : 0);
      }, 0);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    const answer = bestMatch
      ? bestMatch.answer[language]
      : language === 'te'
        ? 'ఈ ప్రశ్నకు మా స్థానిక మార్గదర్శకంలో సరిపడ సమాచారం లేదు. UPI భద్రత, ఫిషింగ్, ఉద్యోగ మోసాలు లేదా మోసాన్ని నివేదించడం గురించి అడగండి.'
        : 'I could not find a sufficiently relevant answer in the local guide. Try asking about UPI safety, phishing, job scams, or reporting fraud.';

    res.json({
      answer,
      language,
      source: 'grounded knowledge base',
      matches: bestMatch ? (language === 'te' ? bestMatch.keywordsTe : bestMatch.keywords) : [],
      confidence: bestMatch ? 'medium' : 'fallback',
    });
  });

  app.post('/api/assistant/speech', speechRateLimit, async (req, res) => {
    if (!hasOnlyFields(req.body, ['text', 'language'])) {
      return res.status(400).json({ error: 'Request must contain only text and language fields' });
    }
    if (typeof req.body.text !== 'string' || !req.body.text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }
    if (Buffer.byteLength(req.body.text, 'utf8') > 5000) {
      return res.status(400).json({ error: 'Text must be 5000 UTF-8 bytes or fewer' });
    }
    if (req.body.language !== 'en' && req.body.language !== 'te') {
      return res.status(400).json({ error: 'Language must be en or te' });
    }

    try {
      const [response] = await textToSpeechClient.synthesizeSpeech({
        input: { text: req.body.text.trim() },
        voice: { languageCode: req.body.language === 'te' ? 'te-IN' : 'en-IN' },
        audioConfig: { audioEncoding: 'MP3' },
      }, { timeout: 15000 });
      const audio = Buffer.from(response.audioContent || []);

      if (!audio.length) {
        throw new Error('Text-to-Speech returned empty audio');
      }

      res.set({ 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' }).send(audio);
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      console.error('Text-to-Speech request failed', { code });
      res.status(502).json({ error: 'Speech generation failed. Check server credentials and try again.' });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  if (serveClient) {
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use((error, _req, res, _next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Request body must be valid JSON' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request body is too large' });
    }
    if (error.status === 403) {
      return res.status(403).json({ error: 'Origin is not allowed' });
    }

    console.error('Unhandled API error', { name: error.name });
    return res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  app.listen(port, '0.0.0.0', () => {
    console.log(`Digital Suraksha API listening on port ${port}`);
  });
}
