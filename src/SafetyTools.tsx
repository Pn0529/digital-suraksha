import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Language } from './SupportPages';

type AnalysisFinding = { id: string; score?: number; severity?: string; explanation: string; action?: string };
type AnalysisResult = {
  category: 'LOW RISK' | 'SUSPICIOUS' | 'HIGH RISK' | 'INCONCLUSIVE';
  score: number | null;
  findings: AnalysisFinding[];
  recommendations?: string[];
  explanation?: string;
  external?: { status: string };
  analyzedAt?: string;
};
type AccountSession = {
  user: { id: string; email: string; createdAt: string };
  csrfToken: string;
  expiresAt: string;
};

function isBooleanArray(value: unknown): value is boolean[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'boolean');
}

function useAccountSession() {
  const [session, setSession] = useState<AccountSession | null>(null);
  const [sessionError, setSessionError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => {
    let active = true;
    void fetch('/api/auth/me', { credentials: 'include' }).then(async (response) => {
      if (response.status === 401) return null;
      const data = await response.json() as AccountSession & { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Could not load account session');
      return data;
    }).then((data) => {
      if (active) {
        setSession(data);
        setCheckingSession(false);
      }
    }).catch(() => {
      if (active) {
        setSessionError('Account status could not be loaded. Check your connection and retry.');
        setCheckingSession(false);
      }
    });
    return () => { active = false; };
  }, []);
  return { session, setSession, sessionError, checkingSession };
}

const ui = {
  en: {
    analysis: 'Scam message checker',
    analysisIntro: 'Check suspicious SMS, chat, job, bank, prize, and payment messages using explainable local rules. Text is not sent to an AI service; results are saved only if you opt in.',
    messageLabel: 'Paste the message to check',
    messagePlaceholder: 'Paste message text here. Do not include passwords, OTPs, or other secrets.',
    analyze: 'Analyze message',
    analyzing: 'Checking…',
    sample: 'Load a safe example',
    saveHistory: 'Save this result to my private account history',
    accountRequired: 'Sign in to save checks to your private history.',
    url: 'Suspicious URL checker',
    urlIntro: 'Local checks do not open the URL. Google Safe Browsing is optional and only runs if you explicitly agree to share the URL.',
    urlLabel: 'URL to check',
    externalConsent: 'I agree to send this URL to Google Safe Browsing for an external reputation check.',
    externalNotConfigured: 'External checking was requested but no Google Safe Browsing key is configured. Only local checks were used.',
    externalMatch: 'Google Safe Browsing reported a threat match.',
    externalNoMatch: 'Google Safe Browsing reported no match. This does not prove that the URL is safe.',
    externalUnavailable: 'Google Safe Browsing could not be reached. The local result may be incomplete.',
    externalNotRequested: 'No external service was contacted.',
    result: 'Analysis result',
    score: 'Risk score',
    noFindings: 'No known suspicious patterns were detected. This does not prove that the message or URL is genuine or safe.',
    safeActions: 'Recommended safe actions',
    helpline: 'If money may be at risk in India, contact your bank and call 1930.',
    official: 'Official cybercrime portal',
    error: 'Could not complete the check. Check your connection and try again.',
    payment: 'UPI and payment safety',
    paymentIntro: 'Before a payment, verify each item. This checklist never connects to a bank or initiates a transaction.',
    completed: 'completed',
    review: 'Review unchecked items before proceeding',
    allDone: 'All checks marked complete. Review the recipient and amount once more in your payment app.',
    reset: 'Reset checklist',
    inconclusive: 'INCONCLUSIVE',
    incomplete: 'Some safety checks are still incomplete:',
  },
  te: {
    analysis: 'మోస సందేశ తనిఖీ',
    analysisIntro: 'అనుమానాస్పద SMS, చాట్, ఉద్యోగ, బ్యాంక్, బహుమతి, చెల్లింపు సందేశాలను అర్థమయ్యే స్థానిక నియమాలతో తనిఖీ చేయండి. సందేశాలు AI సేవకు పంపబడవు; మీరు అంగీకరిస్తేనే ఫలితాలు సేవ్ అవుతాయి.',
    messageLabel: 'తనిఖీ చేయాల్సిన సందేశాన్ని అతికించండి',
    messagePlaceholder: 'సందేశాన్ని ఇక్కడ అతికించండి. పాస్‌వర్డ్‌లు, OTPలు లేదా ఇతర రహస్యాలను చేర్చవద్దు.',
    analyze: 'సందేశాన్ని తనిఖీ చేయండి',
    analyzing: 'తనిఖీ చేస్తున్నాం…',
    sample: 'సురక్షిత ఉదాహరణను లోడ్ చేయండి',
    saveHistory: 'ఈ ఫలితాన్ని నా ప్రైవేట్ ఖాతా చరిత్రలో భద్రపరచండి',
    accountRequired: 'తనిఖీలను ప్రైవేట్ చరిత్రలో భద్రపరచడానికి సైన్ ఇన్ చేయండి.',
    url: 'అనుమానాస్పద URL తనిఖీ',
    urlIntro: 'స్థానిక తనిఖీలు URLను తెరవవు. Google Safe Browsing ఐచ్ఛికం; URLను పంచుకోవడానికి మీరు స్పష్టంగా అంగీకరించినప్పుడే తనిఖీ జరుగుతుంది.',
    urlLabel: 'తనిఖీ చేయాల్సిన URL',
    externalConsent: 'బాహ్య ప్రతిష్ఠ తనిఖీ కోసం ఈ URLను Google Safe Browsingకు పంపడానికి అంగీకరిస్తున్నాను.',
    externalNotConfigured: 'బాహ్య తనిఖీ కోరారు, కానీ Google Safe Browsing కీ లేదు. స్థానిక తనిఖీలు మాత్రమే చేశాం.',
    externalMatch: 'Google Safe Browsing ముప్పు గుర్తింపును నివేదించింది.',
    externalNoMatch: 'Google Safe Browsing ముప్పును గుర్తించలేదు. ఇది URL సురక్షితమని నిరూపించదు.',
    externalUnavailable: 'Google Safe Browsingను సంప్రదించలేకపోయాం. స్థానిక ఫలితం పూర్తి కాకపోవచ్చు.',
    externalNotRequested: 'బాహ్య సేవను సంప్రదించలేదు.',
    result: 'విశ్లేషణ ఫలితం',
    score: 'ప్రమాద స్కోరు',
    noFindings: 'తెలిసిన అనుమానాస్పద నమూనాలు కనిపించలేదు. సందేశం లేదా URL నిజమైనది లేదా సురక్షితమైనది అని ఇది నిరూపించదు.',
    safeActions: 'సిఫార్సు చేసిన సురక్షిత చర్యలు',
    helpline: 'భారతదేశంలో డబ్బు ప్రమాదంలో ఉంటే, మీ బ్యాంక్‌ను సంప్రదించి 1930కు కాల్ చేయండి.',
    official: 'అధికారిక సైబర్ క్రైమ్ పోర్టల్',
    error: 'తనిఖీ పూర్తి కాలేదు. కనెక్షన్‌ను పరిశీలించి మళ్లీ ప్రయత్నించండి.',
    payment: 'UPI మరియు చెల్లింపు భద్రత',
    paymentIntro: 'చెల్లింపుకు ముందు ప్రతి అంశాన్ని ధృవీకరించండి. ఈ చెక్‌లిస్ట్ బ్యాంక్‌ను సంప్రదించదు లేదా లావాదేవీ చేయదు.',
    completed: 'పూర్తి',
    review: 'ముందుకు వెళ్లే ముందు తనిఖీ చేయని అంశాలను సమీక్షించండి',
    allDone: 'అన్ని తనిఖీలను పూర్తి చేశారు. చెల్లింపు యాప్‌లో స్వీకర్త, మొత్తాన్ని మరోసారి ధృవీకరించండి.',
    reset: 'చెక్‌లిస్ట్‌ను రీసెట్ చేయండి',
    inconclusive: 'నిర్ధారణ కాలేదు',
    incomplete: 'ఇంకా పూర్తి కాని భద్రతా తనిఖీలు:',
  },
  hi: {
    analysis: 'संदेश धोखाधड़ी जाँच',
    analysisIntro: 'समझाए जा सकने वाले स्थानीय नियमों से संदिग्ध SMS, चैट, नौकरी, बैंक, इनाम और भुगतान संदेश जाँचें। संदेश AI सेवा को नहीं भेजे जाते; नतीजे केवल आपकी सहमति से सहेजे जाते हैं।',
    messageLabel: 'जाँचने के लिए संदेश पेस्ट करें',
    messagePlaceholder: 'संदेश यहाँ पेस्ट करें। पासवर्ड, OTP या अन्य गोपनीय जानकारी शामिल न करें।',
    analyze: 'संदेश जाँचें',
    analyzing: 'जाँच हो रही है…',
    sample: 'सुरक्षित उदाहरण लोड करें',
    saveHistory: 'इस नतीजे को अपने निजी खाते के इतिहास में सहेजें',
    accountRequired: 'जाँच को निजी इतिहास में सहेजने के लिए साइन इन करें।',
    url: 'संदिग्ध URL जाँच',
    urlIntro: 'स्थानीय जाँच URL नहीं खोलती। Google Safe Browsing वैकल्पिक है और URL साझा करने की स्पष्ट सहमति पर ही चलेगा।',
    urlLabel: 'जाँचने के लिए URL',
    externalConsent: 'बाहरी प्रतिष्ठा जाँच के लिए मैं यह URL Google Safe Browsing को भेजने के लिए सहमत हूँ।',
    externalNotConfigured: 'बाहरी जाँच मांगी गई, लेकिन Google Safe Browsing कुंजी सेट नहीं है। केवल स्थानीय जाँच हुई।',
    externalMatch: 'Google Safe Browsing ने खतरे का मिलान बताया।',
    externalNoMatch: 'Google Safe Browsing ने कोई मिलान नहीं बताया। इससे URL सुरक्षित साबित नहीं होता।',
    externalUnavailable: 'Google Safe Browsing उपलब्ध नहीं था। स्थानीय नतीजा अधूरा हो सकता है।',
    externalNotRequested: 'किसी बाहरी सेवा से संपर्क नहीं किया गया।',
    result: 'जाँच का परिणाम',
    score: 'जोखिम स्कोर',
    noFindings: 'कोई ज्ञात संदिग्ध संकेत नहीं मिला। इससे संदेश या URL असली या सुरक्षित साबित नहीं होता।',
    safeActions: 'सुरक्षित कदम',
    helpline: 'भारत में पैसे का जोखिम हो तो बैंक से संपर्क करें और 1930 पर कॉल करें।',
    official: 'आधिकारिक साइबर अपराध पोर्टल',
    error: 'जाँच पूरी नहीं हो सकी। कनेक्शन जाँचकर फिर कोशिश करें।',
    payment: 'UPI और भुगतान सुरक्षा',
    paymentIntro: 'भुगतान से पहले हर बात जाँचें। यह सूची बैंक से नहीं जुड़ती और लेन-देन शुरू नहीं करती।',
    completed: 'पूरे',
    review: 'आगे बढ़ने से पहले अधूरे चरण देखें',
    allDone: 'सभी चरण पूरे हैं। भुगतान ऐप में प्राप्तकर्ता और राशि फिर से जाँचें।',
    reset: 'सूची रीसेट करें',
    inconclusive: 'निष्कर्ष नहीं',
    incomplete: 'अधूरे सुरक्षा चरण:',
  },
} as const;

const messageSamples: Record<Language, string> = {
  en: 'URGENT: Your bank account will be blocked today. Share your OTP immediately to keep it active.',
  te: 'అత్యవసరం: మీ బ్యాంక్ ఖాతా ఈరోజు బ్లాక్ అవుతుంది. దాన్ని కొనసాగించడానికి మీ OTPను వెంటనే పంపండి.',
  hi: 'तुरंत: आपका बैंक खाता आज बंद हो जाएगा। इसे चालू रखने के लिए अभी अपना OTP भेजें।',
};

const paymentChecklist: Record<Language, string[]> = {
  en: [
    'Verify the recipient name shown in your payment app.',
    'Confirm the UPI ID character by character.',
    'Check the exact payment amount before approving.',
    'Never share your UPI PIN with anyone.',
    'Never share an OTP with a caller or message sender.',
    'Entering your UPI PIN authorizes a payment; it is not needed to receive money.',
    'Scanning a QR code may start a payment flow. Check what the app asks you to do.',
    'Be cautious with collect requests from people you do not know.',
    'Do not follow payment instructions from an unknown caller.',
    'Verify money requests through a separate trusted channel.',
  ],
  te: [
    'చెల్లింపు యాప్‌లో కనిపించే స్వీకర్త పేరును ధృవీకరించండి.',
    'UPI IDను అక్షరం అక్షరం పరిశీలించండి.',
    'ఆమోదించే ముందు కచ్చితమైన మొత్తాన్ని చూడండి.',
    'మీ UPI PINను ఎవరితోనూ పంచుకోకండి.',
    'కాలర్ లేదా సందేశం పంపినవారికి OTP చెప్పకండి.',
    'UPI PIN నమోదు చేయడం చెల్లింపును ఆమోదిస్తుంది; డబ్బు పొందడానికి ఇది అవసరం కాదు.',
    'QR కోడ్ స్కాన్ చెల్లింపు ప్రక్రియను ప్రారంభించవచ్చు. యాప్ ఏమి చేయమంటోందో చూడండి.',
    'తెలియని వ్యక్తుల collect అభ్యర్థనల పట్ల జాగ్రత్తగా ఉండండి.',
    'తెలియని కాలర్ చెల్లింపు సూచనలను అనుసరించవద్దు.',
    'డబ్బు అభ్యర్థనలను వేరే నమ్మకమైన మార్గంలో ధృవీకరించండి.',
  ],
  hi: [
    'भुगतान ऐप में दिख रहे प्राप्तकर्ता का नाम जाँचें।',
    'UPI ID को अक्षर-दर-अक्षर सत्यापित करें।',
    'मंज़ूरी से पहले भुगतान की सही राशि जाँचें।',
    'अपना UPI PIN किसी के साथ साझा न करें।',
    'कॉलर या संदेश भेजने वाले को OTP न बताएं।',
    'UPI PIN डालना भुगतान को मंज़ूरी देता है; पैसे पाने के लिए इसकी ज़रूरत नहीं होती।',
    'QR कोड स्कैन करने से भुगतान प्रक्रिया शुरू हो सकती है। ऐप क्या करने को कह रहा है, जाँचें।',
    'अनजान लोगों से आए collect अनुरोधों से सावधान रहें।',
    'अनजान कॉलर के भुगतान निर्देश न मानें।',
    'पैसे के अनुरोध की अलग, भरोसेमंद माध्यम से पुष्टि करें।',
  ],
};

type UiKey = keyof typeof ui.en;
const label = (language: Language, key: UiKey) => ui[language][key];

async function readAnalysisResponse<T>(response: Response): Promise<T> {
  try {
    return await response.json() as T;
  } catch {
    throw new Error(`The API returned an invalid response (HTTP ${response.status}). Make sure the API server is running and try again.`);
  }
}

function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>;
}

function ResultCard({ result, language, externalDisclosure }: { result: AnalysisResult; language: Language; externalDisclosure?: string }) {
  const heading = result.category === 'INCONCLUSIVE' ? label(language, 'inconclusive') : result.category;
  const color = result.category === 'HIGH RISK'
    ? 'border-red-300 bg-red-50 text-red-950'
    : result.category === 'SUSPICIOUS'
      ? 'border-amber-300 bg-amber-50 text-amber-950'
      : result.category === 'LOW RISK'
        ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
        : 'border-slate-300 bg-slate-50 text-slate-950';
  const externalText = result.external?.status === 'match'
    ? label(language, 'externalMatch')
    : result.external?.status === 'no-match'
      ? label(language, 'externalNoMatch')
      : result.external?.status === 'unavailable'
        ? label(language, 'externalUnavailable')
        : result.external?.status === 'not-configured'
          ? label(language, 'externalNotConfigured')
          : label(language, 'externalNotRequested');

  return (
    <section aria-live="polite" className={`mt-5 rounded-2xl border p-5 ${color}`}>
      <div className="flex items-start gap-3">
        {result.category === 'HIGH RISK' || result.category === 'SUSPICIOUS' ? <AlertTriangle className="mt-1 h-6 w-6 shrink-0" /> : <ShieldCheck className="mt-1 h-6 w-6 shrink-0" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-black">{label(language, 'result')}: {heading}</h2>
          {result.score !== null && <p className="mt-1 font-semibold">{label(language, 'score')}: {result.score}/100</p>}
          {result.analyzedAt && <p className="mt-1 text-xs">{new Date(result.analyzedAt).toLocaleString(language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN')}</p>}
          {result.findings.length > 0 ? <ul className="mt-4 space-y-3">{result.findings.map((finding) => <li key={finding.id} className="rounded-xl bg-white/70 p-3"><strong>{finding.id.replaceAll('-', ' ')}</strong><p className="mt-1 text-sm leading-6">{finding.explanation}</p>{finding.action && <p className="mt-1 text-sm font-semibold">{finding.action}</p>}</li>)}</ul> : <p className="mt-3 text-sm">{label(language, 'noFindings')}</p>}
          {result.recommendations && <div className="mt-4"><h3 className="font-bold">{label(language, 'safeActions')}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{result.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          {result.explanation && <p className="mt-4 text-sm">{result.explanation}</p>}
          {externalDisclosure && <p className="mt-3 border-t border-current/20 pt-3 text-sm">{externalDisclosure} {externalText}</p>}
          <p className="mt-4 text-sm font-bold">{label(language, 'helpline')}</p>
          <a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm font-bold underline">{label(language, 'official')}<ExternalLink className="h-4 w-4" /></a>
        </div>
      </div>
    </section>
  );
}

export function AccountPage({ language }: { language: Language }) {
  const { session, setSession, sessionError } = useAccountSession();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [dashboardOwner, setDashboardOwner] = useState<string | null>(null);
  const hindi = language === 'hi';
  const telugu = language === 'te';

  useEffect(() => {
    if (!session) return;
    let active = true;
    void fetch('/api/dashboard', { credentials: 'include' }).then(async (response) => {
      const data = await response.json() as { dashboard?: Record<string, unknown>; error?: string };
      if (!response.ok || !data.dashboard) throw new Error(data.error ?? 'Could not load dashboard');
      if (active) {
        setDashboard(data.dashboard);
        setDashboardOwner(session.user.id);
      }
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Could not load dashboard');
    });
    return () => { active = false; };
  }, [session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      const response = await fetch(`/api/auth/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json() as AccountSession & { error?: string };
      if (!response.ok || !data.user || !data.csrfToken) throw new Error(data.error ?? 'Account request failed');
      setSession(data);
      setPassword('');
      setMessage(hindi ? 'आपका खाता सुरक्षित रूप से साइन इन है।' : telugu ? 'మీ ఖాతా సురక్షితంగా సైన్ ఇన్ అయింది.' : 'You are signed in securely.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Account request failed');
    }
  };

  const logout = async () => {
    if (!session) return;
    setError('');
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-csrf-token': session.csrfToken },
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? 'Could not sign out');
      }
      setSession(null);
      setDashboard(null);
      setDashboardOwner(null);
      setMessage(hindi ? 'आप साइन आउट हो गए हैं।' : telugu ? 'మీరు సైన్ అవుట్ అయ్యారు.' : 'You have signed out.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign out');
    }
  };

  const deleteAccount = async () => {
    if (!session || !window.confirm(hindi
      ? 'खाता और उससे जुड़ा सर्वर डेटा स्थायी रूप से हटाएँ? यह वापस नहीं किया जा सकता।'
      : telugu
        ? 'ఖాతా మరియు దాని సర్వర్ డేటాను శాశ్వతంగా తొలగించాలా? దీన్ని వెనక్కి తీసుకోలేరు.'
        : 'Permanently delete your account and its server data? This cannot be undone.')) return;
    setError('');
    try {
      const response = await fetch('/api/auth/account', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'x-csrf-token': session.csrfToken },
      });
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? 'Could not delete the account');
      }
      setSession(null);
      setDashboard(null);
      setDashboardOwner(null);
      setMessage(hindi ? 'खाता और सर्वर पर सहेजा डेटा हटा दिया गया है।' : telugu ? 'ఖాతా మరియు సర్వర్‌లో సేవ్ చేసిన డేటా తొలగించబడింది.' : 'The account and its server-stored data have been deleted.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the account');
    }
  };

  const stats = dashboard as {
    messages?: { total: number; suspicious: number; highRisk: number };
    urls?: { total: number; suspicious: number; highRisk: number };
    latestAssessment?: { score: number; createdAt: string } | null;
    recent?: Array<{ id: string; kind: string; category: string; createdAt: string; findings: AnalysisFinding[] }>;
  } | null;

  return (
    <PageShell>
      <header className="rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-6 text-white shadow-soft sm:p-8">
        <h1 className="text-3xl font-black">{hindi ? 'खाता और सुरक्षा डैशबोर्ड' : telugu ? 'ఖాతా మరియు భద్రత డాష్‌బోర్డ్' : 'Account and safety dashboard'}</h1>
        <p className="mt-3 max-w-3xl text-slate-200">{hindi ? 'वैकल्पिक खाता बनाएँ ताकि आप अपनी चुनी हुई सुरक्षा जाँच निजी रूप से सहेज सकें।' : telugu ? 'ఐచ్ఛిక ఖాతా సృష్టించి, మీరు ఎంచుకున్న భద్రతా తనిఖీలను ప్రైవేట్‌గా భద్రపరచండి.' : 'Create an optional account to privately save security checks you explicitly choose to keep.'}</p>
      </header>
      {(error || sessionError) && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-900">{error || sessionError}</p>}
      {message && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">{message}</p>}
      {session ? (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-600">{hindi ? 'साइन इन किया गया' : telugu ? 'సైన్ ఇన్ అయ్యారు' : 'Signed in as'}</p>
              <p className="font-bold">{session.user.email}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void logout()} className="rounded-full border border-slate-300 px-4 py-2 font-semibold">{hindi ? 'साइन आउट' : telugu ? 'సైన్ అవుట్' : 'Sign out'}</button>
              <button type="button" onClick={() => void deleteAccount()} className="rounded-full border border-red-300 px-4 py-2 font-semibold text-red-800">{hindi ? 'खाता हटाएँ' : telugu ? 'ఖాతా తొలగించండి' : 'Delete account'}</button>
            </div>
          </div>
          <h2 className="mt-6 text-xl font-black">{hindi ? 'आपका डैशबोर्ड' : telugu ? 'మీ డాష్‌బోర్డ్' : 'Your dashboard'}</h2>
          {dashboardOwner !== session.user.id && !error ? <p className="mt-3 text-slate-600">{hindi ? 'लोड हो रहा है…' : telugu ? 'లోడ్ అవుతోంది…' : 'Loading…'}</p> : dashboardOwner === session.user.id && stats && (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-600">{hindi ? 'संदेश जाँच' : telugu ? 'సందేశ తనిఖీలు' : 'Message checks'}</p><p className="mt-1 text-2xl font-black">{stats.messages?.total ?? 0}</p><p className="text-xs text-slate-600">{hindi ? 'संदिग्ध' : telugu ? 'అనుమానాస్పదం' : 'Suspicious'}: {stats.messages?.suspicious ?? 0}</p></div>
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-600">{hindi ? 'URL जाँच' : telugu ? 'URL తనిఖీలు' : 'URL checks'}</p><p className="mt-1 text-2xl font-black">{stats.urls?.total ?? 0}</p><p className="text-xs text-slate-600">{hindi ? 'संदिग्ध' : telugu ? 'అనుమానాస్పదం' : 'Suspicious'}: {stats.urls?.suspicious ?? 0}</p></div>
                <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-600">{hindi ? 'नवीनतम आकलन' : telugu ? 'తాజా అంచనా' : 'Latest assessment'}</p><p className="mt-1 text-2xl font-black">{stats.latestAssessment ? `${stats.latestAssessment.score}/100` : '—'}</p></div>
              </div>
              <h3 className="mt-6 font-bold">{hindi ? 'हाल की सहमति-आधारित जाँच' : telugu ? 'ఇటీవలి సమ్మతి-ఆధారిత తనిఖీలు' : 'Recent opt-in checks'}</h3>
              {!stats.recent?.length ? <p className="mt-2 text-sm text-slate-600">{hindi ? 'आपने अभी तक कोई जाँच सहेजी नहीं है।' : telugu ? 'మీరు ఇంకా తనిఖీలను సేవ్ చేయలేదు.' : 'You have not saved any checks yet.'}</p> : (
                <ul className="mt-2 divide-y divide-slate-100">{stats.recent.map((item) => <li key={item.id} className="py-3"><strong>{item.kind === 'message' ? (hindi ? 'संदेश' : telugu ? 'సందేశం' : 'Message') : 'URL'} — {item.category}</strong><p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p></li>)}</ul>
              )}
            </>
          )}
        </section>
      ) : (
        <form onSubmit={(event) => void submit(event)} className="mt-6 max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">{mode === 'register' ? (hindi ? 'खाता बनाएँ' : telugu ? 'ఖాతా సృష్టించండి' : 'Create an account') : (hindi ? 'साइन इन' : telugu ? 'సైన్ ఇన్' : 'Sign in')}</h2>
          <label className="mt-4 block text-sm font-bold">{hindi ? 'ईमेल' : telugu ? 'ఇమెయిల్' : 'Email'}<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>
          <label className="mt-4 block text-sm font-bold">{hindi ? 'पासवर्ड' : telugu ? 'పాస్‌వర్డ్' : 'Password'}<input type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={mode === 'register' ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal" />{mode === 'register' && <span className="mt-1 block font-normal text-slate-600">{hindi ? 'कम से कम 12 वर्ण।' : telugu ? 'కనీసం 12 అక్షరాలు.' : 'At least 12 characters.'}</span>}</label>
          <button type="submit" className="mt-5 rounded-full bg-brand-700 px-5 py-3 font-semibold text-white">{mode === 'register' ? (hindi ? 'खाता बनाएँ' : telugu ? 'ఖాతా సృష్టించండి' : 'Create account') : (hindi ? 'साइन इन' : telugu ? 'సైన్ ఇన్' : 'Sign in')}</button>
          <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }} className="ml-3 text-sm font-semibold text-brand-800 underline">{mode === 'register' ? (hindi ? 'पहले से खाता है? साइन इन करें' : telugu ? 'ఖాతా ఉందా? సైన్ ఇన్ చేయండి' : 'Already have an account? Sign in') : (hindi ? 'नया खाता बनाएँ' : telugu ? 'కొత్త ఖాతా సృష్టించండి' : 'Create a new account')}</button>
          <p className="mt-4 text-xs leading-5 text-slate-600">{hindi ? 'खाता वैकल्पिक है। विश्लेषण तब तक सहेजा नहीं जाता जब तक आप अलग से इसकी अनुमति न दें।' : telugu ? 'ఖాతా ఐచ్ఛికం. మీరు విడిగా అంగీకరించే వరకు విశ్లేషణలు సేవ్ చేయబడవు.' : 'Accounts are optional. Analyses are not saved unless you separately opt in.'}</p>
        </form>
      )}
    </PageShell>
  );
}

export function MessageAnalysisPage({ language }: { language: Language }) {
  const { session } = useAccountSession();
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveHistory, setSaveHistory] = useState(false);

  const analyze = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/security/message/analyze', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'x-csrf-token': session.csrfToken } : {}),
        },
        body: JSON.stringify({ message, language, saveHistory }),
      });
      const data = await readAnalysisResponse<{ result?: AnalysisResult; error?: string }>(response);
      if (!response.ok || !data.result) throw new Error(data.error ?? label(language, 'error'));
      setResult(data.result);
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== 'Failed to fetch' ? cause.message : label(language, 'error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <header className="rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-6 text-white shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-100">Detect. Alert. Prevent.</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{label(language, 'analysis')}</h1>
        <p className="mt-3 max-w-3xl text-slate-200">{label(language, 'analysisIntro')}</p>
      </header>
      <form onSubmit={(event) => void analyze(event)} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="message-analysis" className="block font-bold text-slate-900">{label(language, 'messageLabel')}<textarea id="message-analysis" required minLength={8} maxLength={4000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={label(language, 'messagePlaceholder')} rows={7} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100" /></label>
        <p className="mt-1 text-xs text-slate-500">{message.length}/4000 · {language === 'te' ? 'విశ్లేషణలో సందేశం సేవ్ చేయబడదు.' : language === 'hi' ? 'जाँच के दौरान संदेश सहेजा नहीं जाता।' : 'The message is not saved by this check.'}</p>
        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={saveHistory} disabled={!session} onChange={(event) => setSaveHistory(event.target.checked)} className="mt-1 h-4 w-4 accent-brand-700" /><span>{label(language, 'saveHistory')} {!session && <Link to="/account" className="font-semibold text-brand-800 underline">{label(language, 'accountRequired')}</Link>}</span></label>
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="submit" disabled={loading || message.trim().length < 8} className="rounded-full bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{loading ? label(language, 'analyzing') : label(language, 'analyze')}</button>
          <button type="button" onClick={() => { setMessage(messageSamples[language]); setResult(null); setError(''); }} className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800">{label(language, 'sample')}</button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </form>
      {result && <ResultCard result={result} language={language} />}
    </PageShell>
  );
}

export function UrlCheckPage({ language }: { language: Language }) {
  const { session } = useAccountSession();
  const [url, setUrl] = useState('');
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [disclosure, setDisclosure] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveHistory, setSaveHistory] = useState(false);

  const check = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const response = await fetch('/api/security/url/check', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(session ? { 'x-csrf-token': session.csrfToken } : {}),
        },
        body: JSON.stringify({ url, externalCheckConsent: consent, saveHistory }),
      });
      const data = await readAnalysisResponse<{ result?: AnalysisResult; disclosure?: string; error?: string }>(response);
      if (!response.ok || !data.result) throw new Error(data.error ?? label(language, 'error'));
      setResult(data.result);
      setDisclosure(data.disclosure ?? '');
    } catch (cause) {
      setError(cause instanceof Error && cause.message !== 'Failed to fetch' ? cause.message : label(language, 'error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <header className="rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-6 text-white shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-widest text-brand-100">Detect. Alert. Prevent.</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{label(language, 'url')}</h1>
        <p className="mt-3 max-w-3xl text-slate-200">{label(language, 'urlIntro')}</p>
      </header>
      <form onSubmit={(event) => void check(event)} className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label htmlFor="url-check" className="block font-bold text-slate-900">{label(language, 'urlLabel')}<input id="url-check" type="url" required maxLength={2048} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100" /></label>
        <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-700"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" /><span>{label(language, 'externalConsent')}</span></label>
        <label className="mt-4 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" checked={saveHistory} disabled={!session} onChange={(event) => setSaveHistory(event.target.checked)} className="mt-1 h-4 w-4 accent-brand-700" /><span>{label(language, 'saveHistory')} {!session && <Link to="/account" className="font-semibold text-brand-800 underline">{label(language, 'accountRequired')}</Link>}</span></label>
        <button type="submit" disabled={loading || !url.trim()} className="mt-4 rounded-full bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{loading ? label(language, 'analyzing') : label(language, 'analyze')}</button>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      </form>
      {result && <ResultCard result={result} language={language} externalDisclosure={disclosure} />}
    </PageShell>
  );
}

export function PaymentSafetyPage({ language }: { language: Language }) {
  const { session, checkingSession } = useAccountSession();
  const [checked, setChecked] = useState<boolean[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem('ds-payment-checklist') ?? 'null');
      if (Array.isArray(value) && value.length === paymentChecklist.en.length && value.every((item) => typeof item === 'boolean')) return value;
    } catch {
      return Array(paymentChecklist.en.length).fill(false);
    }
    return Array(paymentChecklist.en.length).fill(false);
  });
  const [storageError, setStorageError] = useState('');
  const [loadedChecklistUserId, setLoadedChecklistUserId] = useState<string | null>(null);
  const labels = paymentChecklist[language];
  const done = checked.filter(Boolean).length;
  const loadingAccountChecklist = checkingSession || Boolean(session && loadedChecklistUserId !== session.user.id);
  useEffect(() => {
    if (checkingSession || !session) return;
    let active = true;
    void fetch('/api/payment-checklist', { credentials: 'include' }).then(async (response) => {
      const data = await response.json() as { checks?: unknown; error?: string };
      if (!response.ok || !isBooleanArray(data.checks) || data.checks.length !== paymentChecklist.en.length) {
        throw new Error(data.error ?? 'Could not load the account payment checklist');
      }
      if (!active) return;
      setChecked(data.checks);
      localStorage.setItem('ds-payment-checklist', JSON.stringify(data.checks));
      setStorageError('');
      setLoadedChecklistUserId(session.user.id);
    }).catch((cause: unknown) => {
      if (active) {
        setStorageError(cause instanceof Error ? cause.message : 'Could not load the account payment checklist');
        setLoadedChecklistUserId(session.user.id);
      }
    });
    return () => { active = false; };
  }, [checkingSession, session]);

  const saveAccountChecklist = (checks: boolean[]) => {
    if (!session) return;
    void fetch('/api/payment-checklist', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': session.csrfToken },
      body: JSON.stringify({ checks }),
    }).then(async (response) => {
      if (!response.ok) {
        const data = await response.json() as { error?: string };
        throw new Error(data.error ?? 'Could not sync payment checklist');
      }
    }).catch((cause: unknown) => {
      setStorageError(cause instanceof Error ? cause.message : 'Could not sync payment checklist');
    });
  };

  const toggle = (index: number, value: boolean) => {
    const updated = checked.map((item, current) => current === index ? value : item);
    setChecked(updated);
    try {
      localStorage.setItem('ds-payment-checklist', JSON.stringify(updated));
      setStorageError('');
      saveAccountChecklist(updated);
    } catch {
      setStorageError(language === 'te' ? 'చెక్‌లిస్ట్ పురోగతిని భద్రపరచలేకపోయాం.' : language === 'hi' ? 'सूची की प्रगति सहेजी नहीं जा सकी।' : 'Checklist progress could not be saved.');
    }
  };
  const reset = () => {
    const empty = Array(labels.length).fill(false);
    setChecked(empty);
    try {
      localStorage.setItem('ds-payment-checklist', JSON.stringify(empty));
      setStorageError('');
      saveAccountChecklist(empty);
    } catch {
      setStorageError(language === 'te' ? 'చెక్‌లిస్ట్‌ను భద్రపరచలేకపోయాం.' : language === 'hi' ? 'सूची सहेजी नहीं जा सकी।' : 'Checklist could not be saved.');
    }
  };

  return (
    <PageShell>
      <header className="rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-6 text-white shadow-soft sm:p-8">
        <ShieldCheck className="h-7 w-7 text-brand-200" />
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{label(language, 'payment')}</h1>
        <p className="mt-3 max-w-3xl text-slate-200">{label(language, 'paymentIntro')}</p>
      </header>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <p className="font-semibold text-slate-800">{done}/{labels.length} {label(language, 'completed')}</p>
        <div className="mt-3 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${done / labels.length * 100}%` }} /></div>
        {loadingAccountChecklist && <p role="status" className="mt-3 text-sm text-slate-600">{checkingSession ? (language === 'hi' ? 'खाता स्थिति जाँची जा रही है…' : language === 'te' ? 'ఖాతా స్థితి తనిఖీ చేస్తోంది…' : 'Checking account status…') : language === 'hi' ? 'निजी खाता सूची लोड हो रही है…' : language === 'te' ? 'ప్రైవేట్ ఖాతా చెక్‌లిస్ట్ లోడ్ అవుతోంది…' : 'Loading your private account checklist…'}</p>}
        <div className="mt-4 space-y-3">{labels.map((item, index) => <label key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"><input type="checkbox" checked={checked[index]} disabled={loadingAccountChecklist} onChange={(event) => toggle(index, event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" /><span className="text-slate-800">{item}</span></label>)}</div>
        {session && <p className="mt-3 text-xs text-slate-600">{language === 'hi' ? 'आपकी सूची इस खाते के साथ निजी रूप से समन्वयित है।' : language === 'te' ? 'మీ చెక్‌లిస్ట్ ఈ ఖాతాతో ప్రైవేట్‌గా సమకాలీకరించబడింది.' : 'Your checklist syncs privately to this account.'}</p>}
        <div aria-live="polite" className={`mt-5 rounded-xl p-4 ${done === labels.length ? 'bg-emerald-50 text-emerald-950' : 'bg-amber-50 text-amber-950'}`}>
          <div className="flex items-center gap-2 font-bold">{done === labels.length ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}{done === labels.length ? label(language, 'allDone') : label(language, 'review')}</div>
          {done < labels.length && <ul className="mt-2 list-disc space-y-1 pl-7 text-sm">{labels.filter((_item, index) => !checked[index]).map((item) => <li key={item}>{item}</li>)}</ul>}
        </div>
        {storageError && <p role="alert" className="mt-3 text-sm text-red-800">{storageError}</p>}
        <button type="button" disabled={loadingAccountChecklist} onClick={reset} className="mt-4 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">{label(language, 'reset')}</button>
      </section>
    </PageShell>
  );
}
