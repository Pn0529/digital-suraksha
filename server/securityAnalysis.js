import { isIP } from 'node:net';

const messageRules = [
  {
    id: 'secret-code-request',
    severity: 38,
    pattern: /\b(?:otp|one[- ]time password|verification code|upi pin|pin number|cvv|card number|net banking password|banking password)\b/i,
    patternTe: /\bOTP\b|ఓటిపి|ఒటిపి|యుపిఐ పిన్|యూపీఐ పిన్|పిన్ నంబర్|బ్యాంక్ పాస్‌వర్డ్|బ్యాంకింగ్ పాస్‌వర్డ్/i,
    patternHi: /\bOTP\b|ओटीपी|यूपीआई पिन|पिन नंबर|बैंक पासवर्ड|वन टाइम पासवर्ड/i,
    en: 'The message refers to an OTP, UPI PIN, or banking secret. Do not share these with anyone.',
    te: 'ఈ సందేశం OTP, UPI PIN లేదా బ్యాంకింగ్ రహస్యాన్ని ప్రస్తావిస్తోంది. వీటిని ఎవరితోనూ పంచుకోకండి.',
    hi: 'संदेश में OTP, UPI PIN या बैंकिंग गोपनीय जानकारी मांगी गई है। इन्हें किसी के साथ साझा न करें।',
    action: 'Never share OTPs, UPI PINs, passwords, or card security codes.',
  },
  {
    id: 'credential-request',
    severity: 35,
    pattern: /\b(?:share|send|enter|confirm|verify|provide|update)\b.{0,45}\b(?:password|login|credentials?|account details|bank details|card details)\b|\b(?:password|login credentials?|bank details)\b.{0,35}\b(?:share|send|verify|provide)\b/i,
    patternTe: /పాస్‌వర్డ్.{0,30}(?:పంచుకో|పంప|నమోదు)|బ్యాంక్ వివరాల.{0,30}(?:పంచుకో|పంప)/i,
    patternHi: /पासवर्ड.{0,30}(?:साझा|भेजें|दर्ज)|बैंक विवरण.{0,30}(?:साझा|भेजें)/i,
    en: 'It asks for login or financial credentials. Legitimate support should not ask you to disclose passwords.',
    te: 'ఇది లాగిన్ లేదా ఆర్థిక వివరాలను అడుగుతోంది. నిజమైన సహాయం మీ పాస్‌వర్డ్‌ను వెల్లడించమని అడగదు.',
    hi: 'इसमें लॉगिन या वित्तीय जानकारी मांगी गई है। वैध सहायता आपसे पासवर्ड साझा करने को नहीं कहेगी।',
    action: 'Do not reply with credentials. Contact the organization using its official app or number.',
  },
  {
    id: 'account-threat',
    severity: 25,
    pattern: /\b(?:account|card|bank account|upi)\b.{0,45}\b(?:block(?:ed)?|suspend(?:ed)?|close|deactivat(?:e|ed)|freeze)\b|\b(?:block(?:ed)?|suspend(?:ed)?|deactivat(?:e|ed))\b.{0,45}\b(?:account|card|upi)\b/i,
    patternTe: /ఖాతా.{0,25}(?:బ్లాక్|నిలిపి|రద్దు)|కార్డు.{0,25}బ్లాక్/i,
    patternHi: /खाता.{0,25}(?:ब्लॉक|बंद|निलंबित)|कार्ड.{0,25}ब्लॉक/i,
    en: 'A threat to block or suspend an account can be used to pressure you into acting quickly.',
    te: 'ఖాతాను నిలిపివేస్తామని బెదిరించడం త్వరగా చర్య తీసుకునేలా ఒత్తిడి చేసే పద్ధతి కావచ్చు.',
    hi: 'खाता बंद करने की धमकी देकर आप पर तुरंत कार्रवाई का दबाव बनाया जा सकता है।',
    action: 'Pause. Check your account only in the official app or website.',
  },
  {
    id: 'urgent-payment',
    severity: 22,
    pattern: /\b(?:urgent|immediately|right now|within \d+ (?:minutes?|hours?)|act now|pay now|transfer now|last warning)\b/i,
    patternTe: /వెంటనే|తక్షణం|ఇప్పుడే చెల్లించ|అత్యవసరంగా/i,
    patternHi: /तुरंत|अभी भुगतान|अत्यावश्यक|अभी भेजें/i,
    en: 'Urgent payment language is a common pressure tactic, especially when paired with threats or secrecy.',
    te: 'అత్యవసర చెల్లింపు భాష ఒత్తిడి పద్ధతి కావచ్చు, ముఖ్యంగా బెదిరింపులు లేదా రహస్యంగా ఉంచమని చెప్పినప్పుడు.',
    hi: 'तुरंत भुगतान की भाषा दबाव बनाने की चाल हो सकती है, खासकर धमकी या गोपनीयता के साथ।',
    action: 'Do not pay under pressure. Verify the request through a separate trusted channel.',
  },
  {
    id: 'prize-or-lottery',
    severity: 25,
    pattern: /\b(?:you (?:have )?won|winner|lottery|prize money|claim your prize|lucky draw|reward points?)\b/i,
    patternTe: /లాటరీ|బహుమతి గెలుచు|బహుమతి పొంద|లక్కీ డ్రా/i,
    patternHi: /लॉटरी|इनाम जीता|पुरस्कार प्राप्त|लकी ड्रॉ/i,
    en: 'Unexpected prizes or lottery wins may be used to request fees or personal information.',
    te: 'అనుకోని బహుమతులు లేదా లాటరీ విజయాల పేరుతో ఫీజులు లేదా వ్యక్తిగత సమాచారం అడగవచ్చు.',
    hi: 'अप्रत्याशित इनाम या लॉटरी जीत के नाम पर शुल्क या निजी जानकारी मांगी जा सकती है।',
    action: 'Do not pay a release fee or share details to claim an unexpected prize.',
  },
  {
    id: 'job-fee',
    severity: 28,
    pattern: /\b(?:job|work from home|recruitment|interview|salary|employment)\b.{0,65}\b(?:registration fee|processing fee|deposit|pay first|upfront fee|training fee)\b|\b(?:registration fee|processing fee|pay first)\b.{0,65}\b(?:job|work|salary|employment)\b/i,
    patternTe: /ఉద్యోగ.{0,30}(?:ఫీజు|డిపాజిట్)|జాబ్.{0,30}(?:ఫీజు|డిపాజిట్)/i,
    patternHi: /नौकरी.{0,30}(?:शुल्क|जमा|फीस)|जॉब.{0,30}(?:शुल्क|फीस)/i,
    en: 'The offer appears to require an advance fee for a job or recruitment process.',
    te: 'ఉద్యోగం లేదా నియామక ప్రక్రియ కోసం ముందస్తు ఫీజు అడిగినట్లు ఉంది.',
    hi: 'नौकरी या भर्ती प्रक्रिया के लिए पहले शुल्क मांगा जा रहा है।',
    action: 'Verify the vacancy on the employer’s official website; do not pay an unverified recruiter.',
  },
  {
    id: 'impersonation-pressure',
    severity: 24,
    pattern: /\b(?:police|customs|cbi|court|government|bank officer|rbi officer)\b.{0,70}\b(?:arrest|case|legal action|digital arrest|fine|penalty|pay|transfer)\b|\b(?:digital arrest|arrest warrant|police case)\b/i,
    patternTe: /పోలీసు.{0,40}(?:అరెస్ట్|కేసు|డబ్బు)|డిజిటల్ అరెస్ట్/i,
    patternHi: /पुलिस.{0,40}(?:गिरफ्तारी|मामला|भुगतान)|डिजिटल अरेस्ट/i,
    en: 'A person may be impersonating an authority while using threats or payment demands.',
    te: 'బెదిరింపులు లేదా డబ్బు డిమాండ్‌తో ఎవరో అధికారిగా నటించే అవకాశం ఉంది.',
    hi: 'धमकी या भुगतान की मांग के साथ कोई अधिकारी बनकर बात कर सकता है।',
    action: 'End the interaction and independently contact the official organization or local police.',
  },
  {
    id: 'suspicious-link',
    severity: 22,
    pattern: /(?:https?:\/\/|www\.)[^\s]+/i,
    patternTe: /(?:https?:\/\/|www\.)[^\s]+/i,
    patternHi: /(?:https?:\/\/|www\.)[^\s]+/i,
    en: 'A link is included. This analysis does not visit or verify the destination.',
    te: 'సందేశంలో లింక్ ఉంది. ఈ విశ్లేషణ లింక్‌ను తెరవదు లేదా ధృవీకరించదు.',
    hi: 'संदेश में एक लिंक है। यह विश्लेषण लिंक को खोलता या सत्यापित नहीं करता।',
    action: 'Do not open unexpected links. Verify the domain independently.',
  },
  {
    id: 'sensitive-personal-data',
    severity: 16,
    pattern: /\b(?:aadhaar|aadhar|pan number|date of birth|mother'?s maiden|identity proof|personal details)\b/i,
    patternTe: /ఆధార్|పాన్ నంబర్|పుట్టిన తేదీ|వ్యక్తిగత వివరాలు/i,
    patternHi: /आधार|पैन नंबर|जन्म तिथि|निजी जानकारी/i,
    en: 'The message refers to identity or personal information that should be shared only when necessary with verified services.',
    te: 'ఈ సందేశం గుర్తింపు లేదా వ్యక్తిగత సమాచారాన్ని ప్రస్తావిస్తోంది. ధృవీకరించిన సేవలకే అవసరమైనప్పుడు ఇవ్వండి.',
    hi: 'संदेश में पहचान या निजी जानकारी का उल्लेख है। इसे केवल सत्यापित सेवा के साथ आवश्यकता होने पर साझा करें।',
    action: 'Avoid sending identity documents or personal details to an unverified contact.',
  },
];

const recommendations = {
  en: [
    'Pause and do not reply, pay, or share a code while under pressure.',
    'Verify the sender using a phone number or website you find independently.',
    'Never share an OTP, UPI PIN, password, or card security code.',
    'If money may be at risk in India, contact your bank and call 1930 promptly.',
  ],
  te: [
    'ఒత్తిడిలో ఉన్నప్పుడు ఆగండి; స్పందించవద్దు, చెల్లించవద్దు, కోడ్‌ను పంచుకోవద్దు.',
    'మీరు స్వయంగా కనుగొన్న ఫోన్ నంబర్ లేదా వెబ్‌సైట్ ద్వారా పంపినవారిని ధృవీకరించండి.',
    'OTP, UPI PIN, పాస్‌వర్డ్ లేదా కార్డు భద్రతా కోడ్‌ను ఎప్పుడూ పంచుకోకండి.',
    'భారతదేశంలో డబ్బు ప్రమాదంలో ఉంటే, మీ బ్యాంక్‌ను సంప్రదించి 1930కు వెంటనే కాల్ చేయండి.',
  ],
  hi: [
    'दबाव में रुकें; जवाब न दें, भुगतान न करें और कोई कोड साझा न करें।',
    'स्वतंत्र रूप से प्राप्त फोन नंबर या वेबसाइट से प्रेषक की पुष्टि करें।',
    'OTP, UPI PIN, पासवर्ड या कार्ड सुरक्षा कोड कभी साझा न करें।',
    'भारत में पैसे का जोखिम हो तो बैंक से संपर्क करें और तुरंत 1930 पर कॉल करें।',
  ],
};

function rulePattern(rule, language) {
  if (language === 'te') return rule.patternTe;
  if (language === 'hi') return rule.patternHi;
  return rule.pattern;
}

export function analyzeMessage(message, language = 'en') {
  const cleaned = typeof message === 'string' ? message.trim() : '';
  if (cleaned.length < 8) {
    return {
      category: 'INCONCLUSIVE',
      score: null,
      findings: [],
      recommendations: recommendations[language] ?? recommendations.en,
      analyzedAt: new Date().toISOString(),
      explanation: 'Provide a longer message for a useful local pattern check. No message can be proven genuine by this tool.',
    };
  }

  const findings = messageRules
    .filter((rule) => rulePattern(rule, language).test(cleaned))
    .map((rule) => ({
      id: rule.id,
      score: rule.severity,
      severity: rule.severity >= 30 ? 'high' : rule.severity >= 22 ? 'medium' : 'low',
      explanation: rule[language] ?? rule.en,
      action: rule.action,
    }));

  const score = Math.min(100, findings.reduce((total, finding) => total + finding.score, 0));
  const category = findings.some((finding) => finding.severity === 'high') || score >= 60
    ? 'HIGH RISK'
    : score >= 25 ? 'SUSPICIOUS' : 'LOW RISK';

  return {
    category,
    score,
    findings,
    recommendations: recommendations[language] ?? recommendations.en,
    analyzedAt: new Date().toISOString(),
    explanation: 'This is a rule-based local indicator check, not a verdict. A low score does not prove a message is genuine or safe.',
  };
}

const shortenerHosts = new Set([
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly', 'cutt.ly', 'rebrand.ly',
]);
const knownBrandNames = ['google', 'microsoft', 'amazon', 'paypal', 'apple', 'facebook', 'instagram', 'whatsapp', 'sbi', 'hdfc', 'icici', 'npci'];
const riskyTlds = new Set(['zip', 'mov', 'top', 'xyz', 'click', 'work', 'country', 'gq', 'tk', 'ml', 'cf']);

export function analyzeUrl(input) {
  const raw = typeof input === 'string' ? input.trim() : '';
  const findings = [];
  if (raw.length < 4 || raw.length > 2048) {
    return { category: 'INCONCLUSIVE', score: null, findings: [], external: { status: 'not-requested' }, analyzedAt: new Date().toISOString() };
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    return { category: 'INCONCLUSIVE', score: null, findings: [{ id: 'malformed-url', explanation: 'Enter a complete URL such as https://example.com.' }], external: { status: 'not-requested' }, analyzedAt: new Date().toISOString() };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { category: 'INCONCLUSIVE', score: null, findings: [{ id: 'unsupported-scheme', explanation: 'Only HTTP and HTTPS URLs can be checked locally.' }], external: { status: 'not-requested' }, analyzedAt: new Date().toISOString() };
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
  const hostParts = hostname.split('.');
  let score = 0;
  const addFinding = (id, severity, explanation, points) => {
    if (findings.some((item) => item.id === id)) return;
    findings.push({ id, severity, explanation });
    score += points;
  };

  if (url.protocol === 'http:') addFinding('unencrypted-http', 'low', 'The URL uses HTTP, so the connection is not protected by HTTPS.', 15);
  if (isIP(hostname)) addFinding('ip-hostname', 'high', 'The host is an IP address rather than a recognizable domain name.', 35);
  if (shortenerHosts.has(hostname)) addFinding('shortened-url', 'medium', 'This is a URL-shortening service; the final destination is not shown.', 25);
  if (hostParts.length > 4) addFinding('many-subdomains', 'medium', 'The hostname has several subdomain levels. Check the registered domain carefully.', 15);
  if (/%(?:2f|5c|40|2e)/i.test(raw)) addFinding('encoded-characters', 'medium', 'The URL contains encoded slash, backslash, at-sign, or dot characters.', 15);
  if (hostname.includes('xn--')) addFinding('internationalized-host', 'medium', 'The hostname contains an internationalized (punycode) label; inspect it carefully.', 15);
  if (/[\s\\]/.test(raw)) addFinding('unusual-url-characters', 'medium', 'The URL contains whitespace, control, or backslash characters.', 20);
  const registeredHost = hostParts.length >= 2 ? hostParts.slice(-2, -1)[0] : hostname;
  const isCloseSpelling = (candidate, brand) => {
    const previous = Array.from({ length: brand.length + 1 }, (_value, index) => index);
    for (let row = 1; row <= candidate.length; row += 1) {
      let diagonal = previous[0];
      previous[0] = row;
      for (let column = 1; column <= brand.length; column += 1) {
        const above = previous[column];
        previous[column] = Math.min(
          previous[column] + 1,
          previous[column - 1] + 1,
          diagonal + (candidate[row - 1] === brand[column - 1] ? 0 : 1),
        );
        diagonal = above;
      }
    }
    return previous[brand.length] <= 2;
  };
  const lookalike = knownBrandNames.find((brand) => (
    registeredHost !== brand
    && (registeredHost.includes(brand) || isCloseSpelling(registeredHost, brand))
  ));
  if (lookalike) addFinding('brand-lookalike', 'high', `The registered hostname resembles the brand name "${lookalike}" but is not that exact label.`, 35);
  if (riskyTlds.has(hostParts.at(-1))) addFinding('uncommon-tld', 'low', 'The top-level domain is sometimes abused. This alone does not mean the site is unsafe.', 10);
  if (url.username || url.password) addFinding('embedded-credentials', 'high', 'The URL includes user-information fields before the hostname.', 30);
  if (url.port && !['80', '443'].includes(url.port)) addFinding('unusual-port', 'low', 'The URL uses a non-standard web port.', 10);
  if (raw.length > 500) addFinding('long-url', 'low', 'The URL is unusually long; inspect its destination and parameters carefully.', 10);

  const boundedScore = Math.min(100, score);
  const category = boundedScore >= 50 ? 'HIGH RISK' : boundedScore >= 20 ? 'SUSPICIOUS' : 'INCONCLUSIVE';
  return {
    category,
    score: boundedScore,
    findings,
    normalizedHost: hostname,
    external: { status: 'not-requested' },
    analyzedAt: new Date().toISOString(),
    explanation: 'Local pattern checks do not visit the URL and cannot prove that a URL is safe. Redirect destinations and live reputation were not checked.',
  };
}
