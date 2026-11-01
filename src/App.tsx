import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Globe2,
  Landmark,
  Mic,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Users,
  Volume2,
  Wallet,
} from 'lucide-react';
import { AssessmentPage, FamilyPage, IncidentPage } from './SupportPages';

export type Language = 'en' | 'te';

type LocalizedText = {
  en: string;
  te: string;
};

type HistoryItem = {
  question: string;
  answer: string;
};

type Suggestion = {
  en: string;
  te: string;
};

const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const saved = window.localStorage.getItem('digital-suraksha-language');
  return saved === 'te' ? 'te' : 'en';
};

const t = (value: LocalizedText, language: Language) => value[language];

const fraudCategories = [
  {
    title: { en: 'UPI & Bank Safety', te: 'UPI & బ్యాంక్ భద్రత' },
    description: {
      en: 'Spot fake payment requests, verify account details, and protect OTPs.',
      te: 'తప్పుడు చెల్లింపు అభ్యర్థనలను గుర్తించడం, అకౌంట్ వివరాలను ధృవీకరించడం మరియు OTPలను రక్షించడం.',
    },
    accent: 'from-emerald-500 to-teal-600',
    icon: CreditCard,
  },
  {
    title: { en: 'Phishing & Fake Links', te: 'ఫిషింగ్ & నకిలీ లింక్లు' },
    description: {
      en: 'Learn how to inspect domains, verify URLs, and avoid scam messages.',
      te: 'డొమైన్‌లను పరిశీలించడం, URLలను ధృవీకరించడం మరియు స్కామ్ సందేశాలను నివారించడం.',
    },
    accent: 'from-sky-500 to-cyan-600',
    icon: ShieldAlert,
  },
  {
    title: { en: 'Job & Investment Fraud', te: 'జాబ్ & ఇన్వెస్ట్మెంట్ మోసం' },
    description: {
      en: 'Recognize fake work-from-home offers and investment traps.',
      te: 'నకిలీ వర్క్-ఫ్రమ్-హోమ్ ఆఫర్లు మరియు ఇన్వెస్ట్మెంట్ బారిన పడకుండా జాగ్రత్త.',
    },
    accent: 'from-amber-500 to-orange-600',
    icon: Wallet,
  },
  {
    title: { en: 'Digital Arrest Threats', te: 'డిజిటల్ అరెస్ట్ బెదిరింపులు' },
    description: {
      en: 'Protect yourself against pressure tactics and impersonation calls.',
      te: 'పీడన ధోరణులు మరియు గుర్తింపు కాల్‌ల నుండి మీర్ని రక్షించుకోండి.',
    },
    accent: 'from-rose-500 to-red-600',
    icon: ShieldCheck,
  },
];

const awarenessExamples = [
  {
    title: { en: 'UPI QR code payments', te: 'UPI QR కోడ్ చెల్లింపులు' },
    detail: {
      en: 'Verify the recipient and amount shown in your payment app before approving a QR-code payment.',
      te: 'QR కోడ్ ద్వారా చెల్లింపును ఆమోదించే ముందు, పేమెంట్ యాప్‌లో చూపిన స్వీకర్తను మరియు మొత్తాన్ని ధృవీకరించండి.',
    },
  },
  {
    title: { en: 'Checking loan apps', te: 'లోన్ యాప్‌లను పరిశీలించడం' },
    detail: {
      en: 'Unverified loan apps may misuse personal data or demand suspicious fees. Check the lender through trusted sources.',
      te: 'ధృవీకరించబడని లోన్ యాప్‌లు వ్యక్తిగత సమాచారాన్ని దొంగిలించి, యాప్‌ను అన్‌లాక్ చేయడానికి డబ్బు అడగవచ్చు.',
    },
  },
  {
    title: { en: 'Investment impersonation', te: 'పెట్టుబడి పేరుతో వేషధారణ' },
    detail: {
      en: 'Treat unsolicited investment advice on messaging apps cautiously and verify the person independently.',
      te: 'మోసగాళ్ళు WhatsApp మరియు Telegramలో “ఇన్వెస్ట్మెంట్ నిపుణులు” వలె నటిస్తున్నారు.',
    },
  },
];

const dailyTips = [
  { en: 'Before you pay, confirm the beneficiary name and amount once again.', te: 'చెల్లించడానికి ముందు, స్వీకర్త పేరు మరియు మొత్తం మళ్లీ ధృవీకరించండి.' },
  { en: 'Never share OTPs, banking passwords, or one-time codes with anyone.', te: 'OTPలు, బ్యాంకింగ్ పాస్వర్డ్‌లు లేదా వన్-టైమ్ కోడ్‌లను ఎవరితోనూ పంచుకోకండి.' },
  { en: 'If a caller sounds urgent, step away and verify through an official helpline.', te: 'కాలర్ అత్యవసరంగా మాట్లాడితే, కనీసం బయటకు వెళ్లి అధికారిక హెల్ప్‌లైన్ ద్వారా ధృవీకరించండి.' },
];

const checklist = [
  { en: 'Verify the beneficiary name before sending money.', te: 'డబ్బు పంపే ముందు స్వీకర్త పేరు పరిశీలించండి.' },
  { en: 'Check if the app is the official one from the bank or payment provider.', te: 'యాప్ బ్యాంక్ లేదా పేమెంట్ ప్రొవైడర్ అధికారికదో చూసుకోండి.' },
  { en: 'Do not approve payment requests from unknown numbers.', te: 'తెలియని నంబర్ల నుంచి వచ్చే చెల్లింపు అభ్యర్థనలకు అంగీకరించకండి.' },
  { en: 'Keep screenshots and save the transaction ID for follow-up.', te: 'సంభాషణను అలాగే టైప్ చేసి, ట్రాన్జాక్షన్ IDను భద్రపరచండి.' },
];

const learningCards = [
  {
    title: { en: 'Smart budgeting', te: 'స్మార్ట్ బడ్జెట్' },
    description: { en: 'Track spending, set emergency savings, and avoid impulse purchases.', te: 'ఖర్చులను ట్రాక్ చేసి, ఎమర్జెన్సీ పొదుపు చేయండి మరియు ఆక్షేపించబడిన కొనుగోళ్లను నివారించండి.' },
    icon: Landmark,
  },
  {
    title: { en: 'Safe borrowing', te: 'సురక్షిత ఋణం' },
    description: { en: 'Understand loan terms and avoid hidden charges or fake lenders.', te: 'లోన్ షరతులను అర్థం చేసుకుని, మరుగున ఉన్న ఛార్జీలు లేదా నకిలీ అప్పు సంస్థలను నివారించండి.' },
    icon: BookOpen,
  },
  {
    title: { en: 'Family money habits', te: 'కుటుంబ ఆర్థిక అలవాట్లు' },
    description: { en: 'Create household goals and protect the family from quick-money traps.', te: 'కుటుంబ లక్ష్యాలను రూపొందించండి మరియు త్వరిత సంపాదన బారిన పడకుండా రక్షించండి.' },
    icon: Users,
  },
];

const quizQuestions = [
  {
    question: {
      en: 'What is the safest action before approving a UPI payment?',
      te: 'UPI చెల్లింపును అంగీకరించే ముందు సరైన చర్య ఏమిటి?',
    },
    options: [
      { en: 'Share the OTP immediately', te: 'OTPను వెంటనే పంచండి' },
      { en: 'Verify the recipient name and amount', te: 'స్వీకర్త పేరు మరియు మొత్తం ధృవీకరించండి' },
      { en: 'Click every link in the message', te: 'సందేశంలోని అన్ని లింకులను నొక్కండి' },
    ],
    answerIndex: 1,
  },
  {
    question: {
      en: 'Which message should be treated as suspicious?',
      te: 'ఏ సందేశాన్ని అనుమానంగా treatment చేయాలి?',
    },
    options: [
      { en: 'An official bank SMS with your real transaction reference', te: 'మీ నిజమైన ట్రాన్జాక్షన్ రిఫరెన్స్‌తో అధికారిక బ్యాంక్ SMS' },
      { en: 'A message asking for OTP and urgent payment', te: 'OTPను అడిగి, వెంటనే చెల్లింపు కోరే సందేశం' },
      { en: 'A reminder to update your app', te: 'యాప్‌ అప్డేట్ కోసం సూచన' },
    ],
    answerIndex: 1,
  },
];

const caseStudies = [
  {
    title: { en: 'Fake courier fee scam', te: 'నకిలీ కురియర్ ఫీజు మోసం' },
    summary: {
      en: 'A family paid a fake courier fee after receiving a convincing message from a scammer posing as a parcel service.',
      te: 'పార్శిల్ సర్వీస్‌గా నటిస్తున్న మోసగాడు పంపిన నమ్మకమైన సందేశం తర్వాత కుటుంబం నకిలీ కురియర్ ఫీజు చెల్లించింది.',
    },
    outcome: { en: 'Lesson: verify the sender and call the company directly.', te: 'పాఠం: పంపినవారిని ధృవీకరించి, కంపెనీకి నేరుగా కాల్ చేయండి.' },
  },
  {
    title: { en: 'Fake job offer trap', te: 'నకిలీ ఉద్యోగ ఆఫర్ బారిన పడిన ఉదాహరణ' },
    summary: {
      en: 'A student was asked to pay a registration fee before interview details were confirmed.',
      te: 'ఒక విద్యార్థిని ఇంటర్వ్యూ వివరాలు ధృవీకరిస్తే ముందు రిజిస్ట్రేషన్ ఫీజు చెల్లించమని అడిగారు.',
    },
    outcome: { en: 'Lesson: real employers do not ask for fees before work begins.', te: 'పాఠం: నిజమైన యజమానులు పని ప్రారంభమయ్యే ముందు ఫీజు అడగరు.' },
  },
];

const supports = [
  { en: 'Telugu and English voice search', te: 'తెలుగు మరియు ఇంగ్లీష్ వాయిస్ సెర్చ్' },
  { en: 'Simple guidance for first-time digital users', te: 'మొదటిసారి డిజిటల్ వినియోగదారులకు సరళ మార్గదర్శకత్వం' },
  { en: 'Official links to reporting services', te: 'నివేదన సేవలకు అధికారిక లింకులు' },
];

const resourceFiles = [
  { title: { en: 'Telugu awareness poster', te: 'తెలుగు అవగాహన పోస్టర్' }, file: '/materials/telugu-awareness-poster.txt', type: 'TXT' },
  { title: { en: 'English awareness poster', te: 'ఇంగ్లీష్ అవగాహన పోస్టర్' }, file: '/materials/english-awareness-poster.txt', type: 'TXT' },
  { title: { en: 'UPI safety checklist', te: 'UPI భద్రత చెక్‌లిస్ట్' }, file: '/materials/upi-safety-checklist.txt', type: 'TXT' },
  { title: { en: 'Senior safety guide', te: 'సీనియర్ సేఫ్టీ గైడ్' }, file: '/materials/senior-safety-guide.txt', type: 'TXT' },
];

const suggestedQuestions: Suggestion[] = [
  { en: 'How do I protect my UPI payment?', te: 'నా UPI చెల్లింపును ఎలా భద్రపరచుకోవాలి?' },
  { en: 'What should I do if a scammer asks for OTP?', te: 'మోసగాడు OTP అడిగితే నేను ఏమి చేయాలి?' },
  { en: 'How do I report a fraudulent message?', te: 'మోసపూరిత సందేశాన్ని ఎలా నివేదించాలి?' },
];

async function askAssistant(question: string, language: Language, signal: AbortSignal): Promise<string> {
  const response = await fetch('/api/assistant/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, language }),
    signal,
  });

  if (!response.ok) {
    throw new Error(response.status === 429 ? 'assistant-rate-limit' : 'assistant-request');
  }

  const data: { answer?: unknown } = await response.json();
  if (typeof data.answer !== 'string' || !data.answer.trim()) {
    throw new Error('Assistant API returned an invalid answer');
  }
  return data.answer;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
    SpeechRecognition?: SpeechRecognitionConstructor;
  }
}

type SpeechRecognitionResultLike = { 0: { transcript: string } };
type SpeechRecognitionEventLike = { results: ArrayLike<SpeechRecognitionResultLike> };
type SpeechRecognitionErrorLike = { error: string };

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function VoiceAssistantPanel({ language }: { language: Language }) {
  const location = useLocation();
  const locationState = location.state;
  const initialQuestion = (
    typeof locationState === 'object'
    && locationState !== null
    && 'question' in locationState
    && typeof locationState.question === 'string'
  ) ? locationState.question : '';
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const audioTextRef = useRef('');
  const audioLanguageRef = useRef<Language | null>(null);
  const speechRequestRef = useRef<AbortController | null>(null);
  const assistantRequestRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<'idle' | 'listening' | 'processing' | 'speaking' | 'error'>('idle');
  const [transcript, setTranscript] = useState('');
  const [questionInput, setQuestionInput] = useState(initialQuestion);
  const [answer, setAnswer] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState('');

  const clearAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    audioTextRef.current = '';
    audioLanguageRef.current = null;
  };

  const speakAnswer = async (text: string) => {
    speechRequestRef.current?.abort();

    if (
      audioRef.current
      && audioTextRef.current === text
      && audioLanguageRef.current === language
    ) {
      setError('');
      setState('speaking');
      try {
        await audioRef.current.play();
      } catch {
        setState('idle');
        setError(
          language === 'te'
            ? 'ఆడియోను ప్రారంభించలేకపోయాం. మళ్లీ ప్రయత్నించండి.'
            : 'Could not start audio playback. Please try again.',
        );
      }
      return;
    }

    clearAudio();
    const controller = new AbortController();
    speechRequestRef.current = controller;
    setError('');
    setState('processing');

    try {
      const response = await fetch('/api/assistant/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const errorCode = response.status === 502
          ? 'speech-service'
          : response.status === 429
            ? 'speech-rate-limit'
            : 'speech-request';
        throw new Error(errorCode);
      }

      const audioUrl = URL.createObjectURL(await response.blob());
      if (controller.signal.aborted) {
        URL.revokeObjectURL(audioUrl);
        return;
      }

      audioUrlRef.current = audioUrl;
      audioTextRef.current = text;
      audioLanguageRef.current = language;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        if (audioRef.current === audio) {
          speechRequestRef.current = null;
          setState('idle');
        }
      };
      audio.onerror = () => {
        if (audioRef.current === audio) {
          clearAudio();
          speechRequestRef.current = null;
          setState('error');
          setError(language === 'te' ? 'సమాధానాన్ని వినిపించలేకపోయాం. మళ్లీ ప్రయత్నించండి.' : 'Could not play the answer. Please try again.');
        }
      };
      setState('speaking');
      await audio.play();
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      speechRequestRef.current = null;
      if (error instanceof DOMException && error.name === 'NotAllowedError' && audioRef.current) {
        setState('idle');
        setError(
          language === 'te'
            ? 'ఆడియో సిద్ధంగా ఉంది. వినడానికి “చివరి సమాధానం వినిపించండి” బటన్‌ను మళ్లీ నొక్కండి.'
            : 'Audio is ready. Press “Read answer” again to play it.',
        );
        return;
      }
      clearAudio();
      setState('error');
      setError(
        language === 'te'
          ? error instanceof Error && error.message === 'speech-service'
            ? 'తెలుగు ఆడియో సేవ అందుబాటులో లేదు. సర్వర్ credentials, API access మరియు quota‌ను తనిఖీ చేయండి.'
            : error instanceof Error && error.message === 'speech-rate-limit'
              ? 'చాలా ఎక్కువ అభ్యర్థనలు వచ్చాయి. 15 నిమిషాల తర్వాత మళ్లీ ప్రయత్నించండి.'
              : 'సమాధానాన్ని వినిపించలేకపోయాం. మళ్లీ ప్రయత్నించండి.'
          : error instanceof Error && error.message === 'speech-service'
            ? 'Speech service is unavailable. Check server credentials, API access, and quota.'
            : error instanceof Error && error.message === 'speech-rate-limit'
              ? 'Too many speech requests. Please try again in 15 minutes.'
              : 'Could not play the answer. Please try again.',
      );
    }
  };

  useEffect(() => {
    return () => {
      speechRequestRef.current?.abort();
      assistantRequestRef.current?.abort();
      clearAudio();
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      const latestText = event.results[0]?.[0]?.transcript?.trim();
      if (!latestText) {
        return;
      }
      setTranscript(latestText);
      setQuestionInput(latestText);
    };

    recognition.onerror = (event: SpeechRecognitionErrorLike) => {
      setState('error');
      setError(
        language === 'te'
          ? event.error === 'not-allowed' || event.error === 'service-not-allowed'
            ? 'మైక్రోఫోన్ అనుమతి నిరాకరించబడింది. బ్రౌజర్ సెట్టింగ్‌లలో అనుమతించి మళ్లీ ప్రయత్నించండి.'
            : event.error === 'no-speech'
              ? 'మీ మాట వినబడలేదు. మళ్లీ ప్రయత్నించండి లేదా ప్రశ్నను టైప్ చేయండి.'
              : 'వాయిస్ గుర్తింపు సాధ్యం కాలేదు. మీ ప్రశ్నను టైప్ చేసి ప్రయత్నించండి.'
          : event.error === 'not-allowed' || event.error === 'service-not-allowed'
            ? 'Microphone permission was denied. Allow it in browser settings and try again.'
            : event.error === 'no-speech'
              ? 'No speech was detected. Try again or type your question.'
              : 'Voice recognition failed. You can type your question instead.',
      );
    };

    recognition.onend = () => {
      setState((currentState) => (currentState === 'listening' ? 'idle' : currentState));
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [language]);

  const askQuestion = async (question: string) => {
    if (!question.trim()) {
      return;
    }

    assistantRequestRef.current?.abort();
    speechRequestRef.current?.abort();
    speechRequestRef.current = null;
    clearAudio();
    const controller = new AbortController();
    assistantRequestRef.current = controller;
    setState('processing');
    setError('');
    setTranscript(question);
    setQuestionInput(question);

    try {
      const result = await askAssistant(question, language, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      setAnswer(result);
      setHistory((prev) => [{ question, answer: result }, ...prev].slice(0, 4));
      setState('idle');
      void speakAnswer(result);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
      setState('error');
      setError(
        error instanceof Error && error.message === 'assistant-rate-limit'
          ? language === 'te'
            ? 'చాలా ఎక్కువ ప్రశ్నలు వచ్చాయి. 15 నిమిషాల తర్వాత మళ్లీ ప్రయత్నించండి.'
            : 'Too many questions. Please try again in 15 minutes.'
          : language === 'te'
            ? 'సమాధాన సేవను సంప్రదించలేకపోయాం. కనెక్షన్‌ను తనిఖీ చేసి మళ్లీ ప్రయత్నించండి.'
            : 'Could not reach the answer service. Check your connection and try again.',
      );
    } finally {
      if (assistantRequestRef.current === controller) {
        assistantRequestRef.current = null;
      }
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      setState('error');
      setError(
        language === 'te'
          ? 'ఈ బ్రౌజర్‌లో వాయిస్ గుర్తింపు అందుబాటులో లేదు.'
          : 'Voice recognition is not available in this browser.',
      );
      return;
    }

    setState('listening');
    setError('');
    recognitionRef.current.lang = language === 'te' ? 'te-IN' : 'en-IN';
    try {
      recognitionRef.current.start();
    } catch {
      setState('error');
      setError(
        language === 'te'
          ? 'మైక్రోఫోన్‌ను ప్రారంభించలేకపోయాం. మళ్లీ ప్రయత్నించండి లేదా ప్రశ్నను టైప్ చేయండి.'
          : 'Could not start the microphone. Try again or type your question.',
      );
    }
  };

  const stopSpeaking = () => {
    recognitionRef.current?.stop();
    speechRequestRef.current?.abort();
    speechRequestRef.current = null;
    audioRef.current?.pause();
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
    setState('idle');
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-600">
            {language === 'te' ? 'మానా డిజిటల్ సురక్ష' : 'Mana Digital Suraksha'}
          </p>
          <h3 className="mt-1 text-2xl font-bold text-slate-900">
            {language === 'te' ? 'మీ సందేహాన్ని మాట్లాడండి' : 'Speak your doubt'}
          </h3>
        </div>
        <div aria-live="polite" className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          {state === 'listening'
            ? language === 'te'
              ? 'వినిస్తోంది'
              : 'Listening'
            : state === 'processing'
              ? language === 'te'
                ? 'ప్రాసెస్ చెయ్యబడుతోంది'
                : 'Processing'
              : state === 'speaking'
                ? language === 'te'
                  ? 'మాట్లాడుతోంది'
                  : 'Speaking'
                : language === 'te'
                  ? 'సిద్ధం'
                  : 'Ready'}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center">
        <button
          type="button"
          className={`flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition ${
            state === 'listening' ? 'bg-rose-500 animate-pulse' : 'bg-brand-600 hover:bg-brand-700'
          }`}
          onClick={startListening}
          aria-pressed={state === 'listening'}
          aria-label={language === 'te' ? 'మైక్రోఫోన్' : 'Microphone'}
        >
          <Mic className="h-10 w-10" />
        </button>
      </div>

      <div className="mt-4 text-center text-sm text-slate-600">
        {language === 'te' ? 'మాట్లాడండి / Speak Here' : 'మాట్లాడండి / Speak Here'}
      </div>

      <form
        className="mt-5 flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void askQuestion(questionInput);
        }}
      >
        <label className="sr-only" htmlFor="assistant-question">
          {language === 'te' ? 'మీ ప్రశ్నను టైప్ చేయండి' : 'Type your question'}
        </label>
        <input
          id="assistant-question"
          type="text"
          value={questionInput}
          maxLength={300}
          onChange={(event) => setQuestionInput(event.target.value)}
          placeholder={language === 'te' ? 'మీ ప్రశ్నను టైప్ చేయండి' : 'Type your question'}
          className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={!questionInput.trim() || state === 'processing'}
          className="rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {language === 'te' ? 'ప్రశ్న అడగండి' : 'Ask'}
        </button>
      </form>

      <div className="mt-6 space-y-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {language === 'te' ? 'గుర్తించిన పాఠం' : 'Recognized text'}
          </p>
          <p aria-live="polite" className="mt-2 min-h-[48px] text-lg text-slate-700">{transcript || (language === 'te' ? 'మీ మాట వినబడుతోంది...' : 'Your spoken question will appear here...')}</p>
        </div>

        <div className="rounded-2xl bg-brand-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
            {language === 'te' ? 'సమాధానం' : 'Answer'}
          </p>
          <p className="mt-2 text-lg text-slate-800">{answer || (language === 'te' ? 'సమాధానం కోసం మీ ప్రశ్నను అడగండి.' : 'Ask a question to receive a grounded answer.')}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {suggestedQuestions.map((item) => (
          <button
            key={item.en}
            type="button"
            onClick={() => askQuestion(t(item, language))}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand-300 hover:text-brand-700"
          >
            {t(item, language)}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => answer && speakAnswer(answer)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          <Volume2 className="h-4 w-4" />
          {language === 'te' ? 'చివరి సమాధానం వినిపించండి' : 'Read answer'}
        </button>
        <button
          type="button"
          onClick={stopSpeaking}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-300"
        >
          <ShieldAlert className="h-4 w-4" />
          {language === 'te' ? 'మాట్లాడడం ఆపండి' : 'Stop'}
        </button>
        <button
          type="button"
          onClick={() => {
            recognitionRef.current?.stop();
            assistantRequestRef.current?.abort();
            assistantRequestRef.current = null;
            speechRequestRef.current?.abort();
            speechRequestRef.current = null;
            clearAudio();
            setTranscript('');
            setQuestionInput('');
            setAnswer('');
            setError('');
            setState('idle');
          }}
          className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          {language === 'te' ? 'మళ్లీ ప్రారంభించండి' : 'Ask another'}
        </button>
      </div>

      {error && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {history.length > 0 && (
        <div className="mt-5 space-y-3 rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {language === 'te' ? 'సెషన్ చరిత్ర' : 'Current session'}
          </p>
          {history.map((item) => (
            <div key={`${item.question}-${item.answer}`} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-sm font-medium text-slate-800">Q: {item.question}</p>
              <p className="mt-2 text-sm text-slate-600">A: {item.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HomePage({ language }: { language: Language }) {
  const [quizIndex, setQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showScore, setShowScore] = useState(false);
  const tip = dailyTips[0];

  const currentQuestion = quizQuestions[quizIndex];

  const submitAnswer = (index: number) => {
    setSelectedAnswer(index);
    if (index === currentQuestion.answerIndex) {
      setScore((prev) => prev + 1);
    }
    const nextIndex = quizIndex + 1;
    if (nextIndex < quizQuestions.length) {
      setTimeout(() => {
        setQuizIndex(nextIndex);
        setSelectedAnswer(null);
      }, 600);
    } else {
      setTimeout(() => setShowScore(true), 600);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowScore(false);
  };

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-8 rounded-[32px] bg-gradient-to-br from-brand-50 via-white to-sky-50 p-6 shadow-soft lg:grid-cols-[1.2fr_0.8fr] lg:p-10">
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-2 text-sm font-semibold text-brand-700">
              <Sparkles className="h-4 w-4" />
              {language === 'te' ? 'సురక్షిత డిజిటల్ జీవితం' : 'Safe digital living'}
            </div>
            <h1 className="max-w-xl text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              {language === 'te'
                ? 'సైబర్ మోసాల నుంచి మీకు సహాయపడే డిజిటల్ సురక్ష'
                : 'Protect your money, identity, and peace of mind online.'}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-slate-600">
              {language === 'te'
                ? 'ఉచిత వాయిస్ సహాయం, verified case studies, మరియు సులభమైన సూచనలతో మీ కుటుంబం సురక్షితంగా డిజిటల్ ప్రపంచాన్ని ఉపయోగించగలదు.'
                : 'From scam awareness to financial literacy, Digital Suraksha gives families simple, trustworthy steps to stay safe online.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <NavLink to="/assistant" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
                <Mic className="h-4 w-4" />
                {language === 'te' ? 'మాట్లాడండి / Speak Here' : 'మాట్లాడండి / Speak Here'}
              </NavLink>
              <NavLink to="/library" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300">
                {language === 'te' ? 'వివరణలు చూడండి' : 'Explore safety library'}
                <ArrowRight className="h-4 w-4" />
              </NavLink>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {supports.map((item) => (
                <div key={item.en} className="rounded-2xl border border-slate-200 bg-white/80 p-3">
                  <CheckCircle2 className="mb-2 h-5 w-5 text-brand-600" />
                  <p className="text-sm text-slate-700">{t(item, language)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-brand-100 bg-slate-950 p-5 text-white shadow-soft">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-brand-200">Voice AI</p>
                <h2 className="mt-2 text-2xl font-bold">Mana Digital Suraksha</h2>
              </div>
              <div className="rounded-full bg-white/10 p-2">
                <Mic className="h-5 w-5 text-brand-200" />
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-sm text-slate-200">
                {language === 'te' ? 'మీ ప్రశ్నను మాట్లాడండి. సురక్షిత సమాధానం వినండి.' : 'Speak your question. Understand your safety.'}
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {suggestedQuestions.map((item) => (
                <NavLink
                  key={item.en}
                  to="/assistant"
                  state={{ question: t(item, language) }}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-slate-100 hover:bg-white/10"
                >
                  {t(item, language)}
                  <ChevronRight className="h-4 w-4" />
                </NavLink>
              ))}
            </div>
          </div>
        </section>

        <section aria-label={language === 'te' ? 'త్వరిత సహాయం' : 'Quick access'} className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { to: '/assessment', icon: ShieldCheck, title: { en: 'Personal Security Assessment', te: 'వ్యక్తిగత భద్రతా అంచనా' }, description: { en: 'Check your habits and get practical next steps.', te: 'మీ అలవాట్లను పరిశీలించి, తదుపరి చర్యలను పొందండి.' } },
            { to: '/assessment', icon: CheckCircle2, title: { en: 'Improve My Digital Safety', te: 'నా డిజిటల్ భద్రతను మెరుగుపరచండి' }, description: { en: 'Build a simple plan to improve account and device safety.', te: 'ఖాతా, పరికర భద్రతను మెరుగుపరచే సులభమైన ప్రణాళిక.' } },
            { to: '/reports', icon: FileText, title: { en: 'Cyberbullying Report & Evidence Centre', te: 'సైబర్ వేధింపు నివేదిక & ఆధారాల కేంద్రం' }, description: { en: 'Prepare a private incident record and complaint summary.', te: 'ప్రైవేట్ ఘటన వివరాలు, ఫిర్యాదు సారాంశాన్ని సిద్ధం చేయండి.' } },
            { to: '/help', icon: ShieldAlert, title: { en: 'Cybercrime Assistance', te: 'సైబర్ క్రైమ్ సహాయం' }, description: { en: 'Find urgent steps, 1930, and official reporting guidance.', te: 'అత్యవసర చర్యలు, 1930, అధికారిక నివేదిక మార్గదర్శకాలు.' } },
            { to: '/family', icon: Users, title: { en: 'Family Digital Safety', te: 'కుటుంబ డిజిటల్ భద్రత' }, description: { en: 'Use a guided checklist together, in English or Telugu.', te: 'ఇంగ్లీష్ లేదా తెలుగులో కుటుంబ చెక్‌లిస్ట్‌ను పూర్తి చేయండి.' } },
            { to: '/library', icon: BookOpen, title: { en: 'Cyber Awareness Library', te: 'సైబర్ అవగాహన గ్రంథాలయం' }, description: { en: 'Search simple bilingual safety information.', te: 'సులభమైన ద్విభాషా భద్రతా సమాచారాన్ని వెతకండి.' } },
          ].map(({ to, icon: Icon, title, description }) => (
            <NavLink key={title.en} to={to} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:bg-brand-50">
              <Icon className="h-5 w-5 text-brand-700" />
              <h2 className="mt-3 font-bold text-slate-900">{t(title, language)}</h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">{t(description, language)}</p>
            </NavLink>
          ))}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">
                {language === 'te' ? 'అవగాహన ఉదాహరణలు' : 'Awareness examples'}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {language === 'te' ? 'సాధారణ మోస పద్ధతులు' : 'Common scam tactics'}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {language === 'te' ? 'ఇవి విద్యా ఉదాహరణలు; తాజా హెచ్చరికలు కావు.' : 'Educational examples, not live alerts.'}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {awarenessExamples.map((alert) => (
              <div key={alert.title.en} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
                <h3 className="text-lg font-bold text-slate-900">{t(alert.title, language)}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t(alert.detail, language)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Categories</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Popular fraud categories</h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {fraudCategories.map(({ title, description, accent, icon: Icon }) => (
              <div key={title.en} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br p-3 text-white ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t(title, language)}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t(description, language)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-200">Tip of the day</p>
            <h3 className="mt-3 text-3xl font-bold">{t({ en: 'Daily digital safety tip', te: 'రోజువారీ డిజిటల్ భద్రత సూచన' }, language)}</h3>
            <p className="mt-4 text-lg leading-7 text-slate-200">
              {t({ en: tip.en, te: tip.te }, language)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">UPI safety checklist</p>
            <div className="mt-4 space-y-3">
              {checklist.map((item) => (
                <div key={item.en} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-brand-600" />
                  <p className="text-sm text-slate-700">{t(item, language)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Learning</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Financial literacy modules</h2>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {learningCards.map(({ title, description, icon: Icon }) => (
              <div key={title.en} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
                <div className="mb-4 inline-flex rounded-2xl bg-brand-50 p-3 text-brand-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{t(title, language)}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t(description, language)}</p>
                <NavLink to="/library" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  {language === 'te' ? 'లైబ్రరీ చూడండి' : 'Explore library'} <ArrowRight className="h-4 w-4" />
                </NavLink>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Quiz</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Scam-awareness challenge</h2>

            {!showScore ? (
              <div className="mt-5">
                <p className="text-lg font-semibold text-slate-800">{t(currentQuestion.question, language)}</p>
                <div className="mt-4 space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={option.en}
                      type="button"
                      onClick={() => submitAnswer(index)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                        selectedAnswer === index
                          ? index === currentQuestion.answerIndex
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-rose-300 bg-rose-50 text-rose-700'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-300 hover:bg-brand-50'
                      }`}
                    >
                      <span>{t(option, language)}</span>
                      {selectedAnswer === index && (index === currentQuestion.answerIndex ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-brand-50 p-5 text-center">
                <p className="text-sm uppercase tracking-[0.25em] text-brand-700">Score</p>
                <h3 className="mt-2 text-4xl font-black text-slate-900">{score}/{quizQuestions.length}</h3>
                <p className="mt-3 text-slate-700">
                  {language === 'te'
                    ? 'చక్కగా చేశారు. మీకు ప్రాథమిక విషయాలు తెలుసు. మీ స్కోర్‌ను మెరుగుపరచడానికి మళ్లీ ప్రయత్నించండి.'
                    : 'Great job. You have the basics. Try again to improve your score.'}
                </p>
                <button type="button" onClick={resetQuiz} className="mt-4 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  {language === 'te' ? 'మళ్లీ ప్రారంభించండి' : 'Retake quiz'}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">
              {language === 'te' ? 'ఉదాహరణ పరిస్థితులు' : 'Illustrative scenarios'}
            </p>
            <div className="mt-5 space-y-4">
              {caseStudies.map((item) => (
                <div key={item.title.en} className="rounded-2xl bg-slate-50 p-4">
                  <h3 className="text-lg font-bold text-slate-900">{t(item.title, language)}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{t(item.summary, language)}</p>
                  <p className="mt-3 text-sm font-semibold text-brand-700">{t(item.outcome, language)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Downloads</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">Downloadable awareness materials</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {resourceFiles.map((item) => (
              <a key={item.file} href={item.file} download className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-brand-300 hover:bg-brand-50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{t(item.title, language)}</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.type}</span>
                  </div>
                  <FileText className="h-5 w-5 text-brand-600" />
                </div>
              </a>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-700">Community</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Community awareness initiatives</h2>
            <div className="mt-5 space-y-4 text-slate-600">
              <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <Users className="mt-1 h-5 w-5 text-brand-600" />
                <p>{language === 'te' ? 'విద్యార్థులు, రైతులు మరియు సీనియర్ పౌరుల కోసం అవగాహన కార్యక్రమాలు.' : 'Awareness drives for students, farmers, and senior citizens.'}</p>
              </div>
              <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <BookOpen className="mt-1 h-5 w-5 text-brand-600" />
                <p>{language === 'te' ? 'శాల, కళాశాల, మరియు స్వయం సహాయక సమూహాలకు పనితీరును అందించండి.' : 'Simple workshops for schools, colleges, and self-help groups.'}</p>
              </div>
              <div className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                <Globe2 className="mt-1 h-5 w-5 text-brand-600" />
                <p>{language === 'te' ? 'సమాజం మరియు స్థానిక అధికారులు కలిసి వ్యాప్తిని నడపండి.' : 'Local outreach and public education for community safety.'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-700">Urgent help</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">If money is at risk, act now</h2>
            <div className="mt-5 space-y-3 text-slate-700">
              <p><span className="font-bold">National Cyber Crime Helpline:</span> 1930</p>
              <p><span className="font-bold">Official portal:</span> https://cybercrime.gov.in/</p>
              <p><span className="font-bold">RBI:</span> https://www.rbi.org.in/</p>
              <p><span className="font-bold">NPCI:</span> https://www.npci.org.in/</p>
            </div>
            <div className="mt-5 rounded-2xl bg-white p-4 text-sm text-slate-700">
              {language === 'te' ? 'చెల్లింపు, OTP, లేదా వ్యక్తిగత సమాచారంపై అనుమానం ఉంటే, బ్యాంక్‌ను సంప్రదించండి మరియు 1930 లేదా అధికారిక పోర్టల్‌లో ఫిర్యాదు చేయండి.' : 'If a payment, OTP, or personal data is at risk, contact your bank immediately and report it via 1930 or the official portal.'}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-200">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div>
            <div className="text-xl font-extrabold text-white">Digital Suraksha</div>
            <p className="mt-3 text-sm text-slate-300">Technology for safer digital choices, stronger financial habits, and community awareness.</p>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Resources</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><a href="/library">Safety library</a></li>
              <li><a href="/assistant">Voice assistant</a></li>
              <li><a href="/help">Official help</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Sources</h3>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li>National Cyber Crime Reporting Portal</li>
              <li>RBI</li>
              <li>NPCI</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">Privacy</h3>
            <p className="mt-4 text-sm text-slate-300">No OTP, UPI PIN, or password requests are made. Voice and AI features are educational and privacy-conscious.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

function LibraryPage({ language }: { language: Language }) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const entries = useMemo(() => {
    const base = [
      { title: { en: 'How to recognise phishing messages', te: 'ఫిషింగ్ సందేశాలను ఎలా గుర్తించాలి' }, category: 'Phishing', summary: { en: 'Check link previews, domain names, and urgency pressures before clicking.', te: 'నొక్కే ముందు లింక్ ప్రివ్యూ, డొమైన్ పేరు మరియు అత్యవసర పీడనాన్ని పరిశీలించండి.' } },
      { title: { en: 'UPI safety basics', te: 'UPI భద్రత యొక్క ప్రాథమిక అంశాలు' }, category: 'UPI', summary: { en: 'Never share your PIN or OTP. Always confirm the recipient before paying.', te: 'PIN లేదా OTPను ఎప్పుడూ పంచుకోకండి. చెల్లించే ముందు స్వీకర్తను ధృవీకరించండి.' } },
      { title: { en: 'Digital arrest scam warning', te: 'డిజిటల్ అరెస్ట్ స్కామ్ హెచ్చరిక' }, category: 'Threats', summary: { en: 'Scammers use fear and urgency. End the call and verify through official channels.', te: 'మోసగాళ్ళు భయం మరియు అత్యవసరాన్ని ఉపయోగిస్తారు. కాల్‌ను ముగించి, అధికారిక ఛానెళ్ల ద్వారా ధృవీకరించండి.' } },
      { title: { en: 'Budgeting and private savings', te: 'బడ్జెట్ మరియు వ్యక్తిగత పొదుపు' }, category: 'Finance', summary: { en: 'Set a family savings target and keep emergency funds separate from daily expenses.', te: 'కుటుంబం కొరకు పొదుపు లక్ష్యాన్ని సెట్ చేసి, ఎమర్జెన్సీ డబ్బును రోజువారీ ఖర్చుల నుంచి వేరుగా ఉంచండి.' } },
      { title: { en: 'Recognising fake job and loan offers', te: 'నకిలీ ఉద్యోగ, రుణ ఆఫర్లను గుర్తించడం' }, category: 'Scams', summary: { en: 'Be cautious of upfront fees, guaranteed returns, and requests to share OTPs or install unknown apps.', te: 'ముందస్తు ఫీజులు, హామీ ఇచ్చే లాభాలు, OTP పంచుకోవడం లేదా తెలియని యాప్‌లు ఇన్‌స్టాల్ చేయమనే అభ్యర్థనల పట్ల జాగ్రత్తగా ఉండండి.' } },
      { title: { en: 'Safer social media and privacy', te: 'సురక్షిత సోషల్ మీడియా, గోప్యత' }, category: 'Privacy', summary: { en: 'Review who can contact you, see your posts, and find you using your phone number.', te: 'మిమ్మల్ని ఎవరు సంప్రదించగలరు, పోస్టులు చూడగలరు, ఫోన్ నంబర్‌తో కనుగొనగలరో పరిశీలించండి.' } },
      { title: { en: 'Cyberbullying: save evidence, seek help', te: 'సైబర్ వేధింపులు: ఆధారాలు భద్రపరచండి, సహాయం పొందండి' }, category: 'Cyberbullying', summary: { en: 'Keep original messages and timestamps, block/report through the platform, and contact a trusted adult or authority if unsafe.', te: 'అసలు సందేశాలు, సమయాలను భద్రపరచండి; ప్లాట్‌ఫారమ్‌లో బ్లాక్/రిపోర్ట్ చేసి, అసురక్షితంగా అనిపిస్తే నమ్మకమైన పెద్దవారు లేదా అధికారులను సంప్రదించండి.' } },
      { title: { en: 'Protect accounts and recovery options', te: 'ఖాతాలు, పునరుద్ధరణ మార్గాలను రక్షించండి' }, category: 'Accounts', summary: { en: 'Use unique passwords, enable two-step verification, and keep recovery contact details current.', te: 'ప్రత్యేక పాస్‌వర్డ్‌లు వాడండి, రెండు-దశల ధృవీకరణ ప్రారంభించండి, పునరుద్ధరణ వివరాలను తాజావిగా ఉంచండి.' } },
    ];

    return base.filter((entry) => {
      const categoryMatch = selectedCategory === 'All' || entry.category === selectedCategory;
      const searchMatch = `${entry.title.en} ${entry.title.te} ${entry.summary.en} ${entry.summary.te}`
        .toLowerCase()
        .includes(query.toLowerCase());
      return categoryMatch && searchMatch;
    });
  }, [query, selectedCategory]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-brand-600 to-sky-600 p-6 text-white shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-100">Knowledge base</p>
        <h1 className="mt-3 text-4xl font-black">{language === 'te' ? 'సురక్షిత సమాచార గ్రంథాలయం' : 'Safety knowledge library'}</h1>
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <input
            aria-label={language === 'te' ? 'శోధన' : 'Search'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={language === 'te' ? 'సందేహం, మోసం లేదా భద్రతను వెతకండి' : 'Search by fraud, safety, or learning topic'}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-400"
          />
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-400"
          >
            {['All', 'Phishing', 'UPI', 'Threats', 'Finance', 'Scams', 'Privacy', 'Cyberbullying', 'Accounts'].map((category) => (
              <option key={category} value={category}>{language === 'te' ? ({
                All: 'అన్నీ',
                Phishing: 'ఫిషింగ్',
                UPI: 'UPI',
                Threats: 'బెదిరింపులు',
                Finance: 'ఆర్థికం',
                Scams: 'మోసాలు',
                Privacy: 'గోప్యత',
                Cyberbullying: 'సైబర్ వేధింపులు',
                Accounts: 'ఖాతాలు',
              } as Record<string, string>)[category] : category}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {entries.length > 0 ? entries.map((entry) => (
          <article key={entry.title.en} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">{entry.category}</span>
            <h2 className="mt-4 text-xl font-bold text-slate-900">{t(entry.title, language)}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{t(entry.summary, language)}</p>
            <NavLink
              to="/assistant"
              state={{ question: t(entry.title, language) }}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {language === 'te' ? 'సమాధానాన్ని అడగండి' : 'Ask about this'}
              <ArrowRight className="h-4 w-4" />
            </NavLink>
          </article>
        )) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500 md:col-span-2">
            {language === 'te' ? 'ఇలాంటి సమాచారం కనపడలేదు. వేరే శోధనను ప్రయత్నించండి.' : 'No matching content found. Try another search term.'}
          </div>
        )}
      </div>
    </main>
  );
}

function HelpPage({ language }: { language: Language }) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-soft">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-200">{language === 'te' ? 'అధికారిక సహాయం' : 'Official support'}</p>
        <h1 className="mt-3 text-4xl font-black">{language === 'te' ? 'అధికారిక సహాయం కేంద్రం' : 'Official citizen help center'}</h1>
        <p className="mt-3 max-w-3xl text-slate-200">{language === 'te' ? 'ఇది సమాచార సహాయం మాత్రమే; అత్యవసర సేవలకు ప్రత్యామ్నాయం కాదు. Digital Suraksha అధికారిక పోలీసు సంస్థ కాదు.' : 'This is guidance, not an emergency service. Digital Suraksha is not a law-enforcement agency.'}</p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-slate-900">{language === 'te' ? 'అధికారిక వనరులు' : 'Official resources'}</h2>
          <ul className="mt-4 space-y-4 text-slate-700">
            <li><a href="https://cybercrime.gov.in/" target="_blank" rel="noreferrer" className="font-medium text-brand-700 underline">National Cyber Crime Reporting Portal</a></li>
            <li><span className="font-bold">{language === 'te' ? 'జాతీయ సైబర్ మోసం హెల్ప్‌లైన్:' : 'National Cyber Crime Helpline:'}</span> 1930</li>
            <li><a href="https://www.rbi.org.in/" target="_blank" rel="noreferrer" className="font-medium text-brand-700 underline">Reserve Bank of India</a></li>
            <li><a href="https://www.npci.org.in/" target="_blank" rel="noreferrer" className="font-medium text-brand-700 underline">NPCI</a></li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-2xl font-bold text-slate-900">{language === 'te' ? 'డబ్బు ప్రమాదంలో ఉంటే' : 'If money is at risk'}</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-slate-700">
            <li>{language === 'te' ? 'మీ బ్యాంక్ అధికారిక నంబర్‌కు వెంటనే కాల్ చేసి, కార్డు/ఖాతా రక్షణ చర్యలు తీసుకోండి.' : 'Immediately call your bank using its official number and secure affected cards or accounts.'}</li>
            <li>{language === 'te' ? 'లావాదేవీ వివరాలు, సందేశాలు, సమయాలను మార్చకుండా భద్రపరచండి.' : 'Preserve transaction details, messages, and timestamps without altering them.'}</li>
            <li>{language === 'te' ? 'ఆర్థిక సైబర్ మోసాల కోసం 1930కు కాల్ చేసి, అధికారిక పోర్టల్‌లో నివేదించండి.' : 'For financial cyber fraud, call 1930 and report through the official portal as soon as possible.'}</li>
            <li>{language === 'te' ? 'లావాదేవీని నిలిపివేయడం లేదా తిరిగి పొందడం సాధ్యమా అని బ్యాంక్‌ను అడగండి; ఫలితానికి హామీ లేదు.' : 'Ask your bank whether a transaction can be stopped or disputed; recovery is not guaranteed.'}</li>
          </ol>
        </div>
      </div>

      <section className="mt-5 grid gap-5 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">{language === 'te' ? 'ఖాతా లేదా పరికరం దెబ్బతిన్నట్లయితే' : 'If an account or device is compromised'}</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>{language === 'te' ? 'శుభ్రమైన, నమ్మకమైన పరికరం నుంచి సంబంధిత ఖాతా పాస్‌వర్డ్ మార్చండి.' : 'From a trusted device, change the affected account password.'}</li>
            <li>{language === 'te' ? 'యాక్టివ్ సెషన్‌లను సమీక్షించి, తెలియని పరికరాల నుంచి సైన్ అవుట్ చేయండి.' : 'Review active sessions and sign out unfamiliar devices.'}</li>
            <li>{language === 'te' ? 'ఖాతా పునరుద్ధరణ వివరాలు, రెండు-దశల ధృవీకరణను పరిశీలించండి.' : 'Check recovery details and enable two-step verification.'}</li>
            <li>{language === 'te' ? 'మీ ఇమెయిల్, బ్యాంక్ లేదా ఇతర ఖాతాలపై ప్రభావం ఉంటే సంబంధిత సంస్థలను సంప్రదించండి.' : 'Contact the affected provider if email, banking, or other accounts may be at risk.'}</li>
          </ol>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-xl font-bold text-slate-900">{language === 'te' ? 'ఆధారాలను సురక్షితంగా భద్రపరచండి' : 'Preserve digital evidence safely'}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            <li>{language === 'te' ? 'అసలు సందేశాలు, URLలు, సమయం, రిఫరెన్స్ వివరాలను అలాగే ఉంచండి.' : 'Keep original messages, URLs, timestamps, and reference details.'}</li>
            <li>{language === 'te' ? 'అసలు ఫైళ్లను కత్తిరించవద్దు లేదా మార్చవద్దు; అవసరమైతే వేరే కాపీలో సున్నిత వివరాలను దాచండి.' : 'Do not crop or modify originals; redact unrelated personal details only on a separate copy.'}</li>
            <li>{language === 'te' ? 'మైనర్‌కు సంబంధించిన సన్నిహిత చిత్రాలను కాపీ చేయవద్దు లేదా పంచుకోవద్దు; నమ్మకమైన పెద్దవారు, అధికారులను సంప్రదించండి.' : 'Do not copy or share intimate images of a minor; contact a trusted adult and appropriate authorities.'}</li>
          </ul>
        </article>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <NavLink to="/reports" className="rounded-full bg-brand-700 px-5 py-3 font-semibold text-white">{language === 'te' ? 'సైబర్ వేధింపుల నివేదిక సిద్ధం చేయండి' : 'Prepare a cyberbullying report'}</NavLink>
        <NavLink to="/family" className="rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-800">{language === 'te' ? 'కుటుంబ భద్రతా సూచనలు' : 'Family safety checklist'}</NavLink>
      </div>
    </main>
  );
}

function AdminPage({ language }: { language: Language }) {
  const rows = [
    { title: 'UPI fraud alerts', status: 'Published', owner: 'Safety desk' },
    { title: 'Phishing knowledge base', status: 'Needs Review', owner: 'Content team' },
    { title: 'Senior safety guide', status: 'Draft', owner: 'Accessibility review' },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-brand-600 p-8 text-white shadow-soft">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-100">Administrator dashboard</p>
        <h1 className="mt-3 text-4xl font-black">{language === 'te' ? 'నిర్వాహక ప్యానెల్' : 'Content management dashboard'}</h1>
      </div>

      <div role="status" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        {language === 'te'
          ? 'డెమో మాత్రమే: ఇక్కడ నిజమైన లాగిన్, కంటెంట్ మార్పులు లేదా శాశ్వత నిల్వ లేవు. క్రింది వరుసలు ఉదాహరణలు మాత్రమే.'
          : 'Demo only: there is no authentication, content editing, or persistent storage. The rows below are illustrative examples.'}
      </div>

      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">{language === 'te' ? 'కంటెంట్ లైబ్రరీ (ఉదాహరణ)' : 'Content library (example)'}</h2>
          <button type="button" disabled className="cursor-not-allowed rounded-full bg-slate-300 px-4 py-2 text-sm font-semibold text-slate-600">
            {language === 'te' ? 'సవరణ అందుబాటులో లేదు' : 'Editing unavailable'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Owner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.title} className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{row.title}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${row.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : row.status === 'Needs Review' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function NotFoundPage({ language }: { language: Language }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-4xl font-black text-slate-900">
        {language === 'te' ? 'పేజీ కనబడలేదు' : 'Page not found'}
      </h1>
      <p className="mt-4 text-slate-600">
        {language === 'te' ? 'ఈ చిరునామాకు పేజీ లేదు.' : 'There is no page at this address.'}
      </p>
      <NavLink to="/" className="mt-6 inline-flex rounded-full bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700">
        {language === 'te' ? 'హోమ్‌కు వెళ్లండి' : 'Go home'}
      </NavLink>
    </main>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>(getStoredLanguage);

  useEffect(() => {
    window.localStorage.setItem('digital-suraksha-language', language);
    document.documentElement.lang = language === 'te' ? 'te' : 'en';
  }, [language]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <NavLink to="/" className="flex shrink-0 items-center gap-2 font-extrabold text-slate-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white"><ShieldCheck className="h-5 w-5" /></span>
              <span>Digital Suraksha</span>
            </NavLink>
            <nav aria-label={language === 'te' ? 'ప్రధాన నావిగేషన్' : 'Main navigation'} className="order-3 flex w-full gap-2 overflow-x-auto pb-1 text-sm font-semibold text-slate-700 sm:order-2 sm:w-auto sm:flex-1 sm:justify-center">
              {[
                ['/', language === 'te' ? 'హోమ్' : 'Home'],
                ['/assessment', language === 'te' ? 'అంచనా' : 'Assessment'],
                ['/reports', language === 'te' ? 'నివేదిక కేంద్రం' : 'Report centre'],
                ['/help', language === 'te' ? 'సహాయం' : 'Help'],
                ['/family', language === 'te' ? 'కుటుంబం' : 'Family'],
                ['/library', language === 'te' ? 'లైబ్రరీ' : 'Library'],
                ['/assistant', language === 'te' ? 'సహాయకుడు' : 'Assistant'],
                ['/admin', language === 'te' ? 'నిర్వాహకుడు' : 'Admin'],
              ].map(([to, label]) => <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap rounded-full px-3 py-2 hover:bg-brand-50 hover:text-brand-800 ${isActive ? 'bg-brand-50 text-brand-800' : ''}`}>{label}</NavLink>)}
            </nav>
            <div className="order-2 flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 sm:order-3">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              aria-pressed={language === 'en'}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${language === 'en' ? 'bg-brand-600 text-white' : 'text-slate-600'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('te')}
              aria-pressed={language === 'te'}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${language === 'te' ? 'bg-brand-600 text-white' : 'text-slate-600'}`}
            >
              తెలుగు
            </button>
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage language={language} />} />
          <Route path="/assessment" element={<AssessmentPage language={language} />} />
          <Route path="/reports" element={<IncidentPage language={language} />} />
          <Route path="/family" element={<FamilyPage language={language} />} />
          <Route path="/library" element={<LibraryPage language={language} />} />
          <Route path="/assistant" element={<div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"><VoiceAssistantPanel language={language} /></div>} />
          <Route path="/help" element={<HelpPage language={language} />} />
          <Route path="/admin" element={<AdminPage language={language} />} />
          <Route path="*" element={<NotFoundPage language={language} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
