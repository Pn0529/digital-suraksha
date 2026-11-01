import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowDownToLine, ExternalLink, ShieldAlert, ShieldCheck, Trash2, Volume2 } from 'lucide-react';
import {
  deleteIncident,
  getEvidence,
  listIncidents,
  saveIncident,
  updateIncident,
  validateAndHashEvidence,
  type EvidenceMetadata,
  type IncidentCategory,
  type IncidentRecord,
  type ReportingStatus,
} from './reportStorage';

export type Language = 'en' | 'te';

const portalUrl = 'https://cybercrime.gov.in/';
const createReference = () => `DS-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomUUID().toUpperCase()}`;
const reportCategories: { id: IncidentCategory; en: string; te: string }[] = [
  { id: 'harassment', en: 'Online harassment', te: 'ఆన్‌లైన్ వేధింపులు' },
  { id: 'threats', en: 'Abusive or threatening messages', te: 'దూషణ లేదా బెదిరింపు సందేశాలు' },
  { id: 'unwanted-contact', en: 'Repeated unwanted contact', te: 'పదేపదే అవాంఛిత సంప్రదింపు' },
  { id: 'cyberstalking', en: 'Cyberstalking', te: 'సైబర్ స్టాకింగ్' },
  { id: 'impersonation', en: 'Impersonation', te: 'వేరొకరి వేషధారణ' },
  { id: 'non-consensual-content', en: 'Sharing content without permission', te: 'అనుమతి లేకుండా కంటెంట్ పంచుకోవడం' },
  { id: 'social-media', en: 'Social media harassment', te: 'సోషల్ మీడియా వేధింపులు' },
  { id: 'other', en: 'Other cyberbullying incident', te: 'ఇతర సైబర్ వేధింపు ఘటన' },
];

const assessmentItems = [
  { id: 'passwords', topic: { en: 'Password practices', te: 'పాస్‌వర్డ్ అలవాట్లు' }, question: { en: 'Do you use long, unique passwords and a trusted password manager for important accounts?', te: 'ముఖ్యమైన ఖాతాలకు పొడవైన, ప్రత్యేక పాస్‌వర్డ్‌లు మరియు నమ్మకమైన పాస్‌వర్డ్ మేనేజర్‌ను ఉపయోగిస్తున్నారా?' }, action: { en: 'Set unique passwords for your email and banking accounts; consider a reputable password manager.', te: 'మీ ఇమెయిల్, బ్యాంక్ ఖాతాలకు ప్రత్యేక పాస్‌వర్డ్‌లు పెట్టండి; నమ్మకమైన పాస్‌వర్డ్ మేనేజర్‌ను పరిశీలించండి.' } },
  { id: 'mfa', topic: { en: 'Two-step verification', te: 'రెండు-దశల ధృవీకరణ' }, question: { en: 'Have you enabled two-step verification on your email and social accounts where available?', te: 'అందుబాటులో ఉన్నప్పుడు మీ ఇమెయిల్, సామాజిక ఖాతాల్లో రెండు-దశల ధృవీకరణను ప్రారంభించారా?' }, action: { en: 'Enable two-step verification from the official security settings of your key accounts.', te: 'మీ ముఖ్య ఖాతాల అధికారిక భద్రతా సెట్టింగ్‌లలో రెండు-దశల ధృవీకరణ ప్రారంభించండి.' } },
  { id: 'recovery', topic: { en: 'Account recovery', te: 'ఖాతా పునరుద్ధరణ' }, question: { en: 'Are your recovery email and phone number current and protected?', te: 'మీ పునరుద్ధరణ ఇమెయిల్, ఫోన్ నంబర్ తాజావిగా మరియు సురక్షితంగా ఉన్నాయా?' }, action: { en: 'Review recovery details from account settings and remove any outdated contact method.', te: 'ఖాతా సెట్టింగ్‌లలో పునరుద్ధరణ వివరాలను పరిశీలించి, పాత సంప్రదింపు మార్గాలను తొలగించండి.' } },
  { id: 'device-lock', topic: { en: 'Device security', te: 'పరికర భద్రత' }, question: { en: 'Do you lock your phone and computer with a screen lock and keep them physically secure?', te: 'ఫోన్, కంప్యూటర్‌కు స్క్రీన్ లాక్ పెట్టి వాటిని భౌతికంగా సురక్షితంగా ఉంచుతున్నారా?' }, action: { en: 'Set a screen lock and enable device-finding and remote lock features if supported.', te: 'స్క్రీన్ లాక్ పెట్టి, అందుబాటులో ఉంటే పరికరాన్ని గుర్తించడం, దూరం నుంచి లాక్ చేసే సౌకర్యాలను ప్రారంభించండి.' } },
  { id: 'permissions', topic: { en: 'App permissions', te: 'యాప్ అనుమతులు' }, question: { en: 'Do you regularly review and remove permissions that apps do not need?', te: 'యాప్‌లకు అవసరం లేని అనుమతులను తరచుగా పరిశీలించి తొలగిస్తున్నారా?' }, action: { en: 'Review microphone, camera, contacts, and location access for installed apps.', te: 'ఇన్‌స్టాల్ చేసిన యాప్‌ల మైక్రోఫోన్, కెమెరా, కాంటాక్ట్‌లు, లొకేషన్ అనుమతులను పరిశీలించండి.' } },
  { id: 'privacy', topic: { en: 'Privacy settings', te: 'గోప్యతా సెట్టింగ్‌లు' }, question: { en: 'Have you checked who can see your profile, posts, and personal details?', te: 'మీ ప్రొఫైల్, పోస్టులు, వ్యక్తిగత వివరాలను ఎవరు చూడగలరో పరిశీలించారా?' }, action: { en: 'Limit profile visibility and avoid posting information that can be used to guess passwords or security answers.', te: 'ప్రొఫైల్ కనిపించే పరిధిని తగ్గించి, పాస్‌వర్డ్‌లు లేదా భద్రతా సమాధానాలను ఊహించడానికి ఉపయోగపడే వివరాలను పోస్ట్ చేయవద్దు.' } },
  { id: 'updates', topic: { en: 'Software updates', te: 'సాఫ్ట్‌వేర్ నవీకరణలు' }, question: { en: 'Do you install operating-system and app updates from official sources promptly?', te: 'ఆపరేటింగ్ సిస్టమ్, యాప్ నవీకరణలను అధికారిక వనరుల నుంచి త్వరగా ఇన్‌స్టాల్ చేస్తున్నారా?' }, action: { en: 'Turn on automatic updates where practical and install updates from official app stores only.', te: 'సాధ్యమైన చోట ఆటోమేటిక్ అప్‌డేట్‌లను ప్రారంభించి, అధికారిక యాప్ స్టోర్‌ల నుంచే అప్‌డేట్ చేయండి.' } },
  { id: 'login-alerts', topic: { en: 'Login alerts', te: 'లాగిన్ హెచ్చరికలు' }, question: { en: 'Would you notice and act on an unfamiliar sign-in alert or recovery request?', te: 'తెలియని లాగిన్ హెచ్చరిక లేదా పునరుద్ధరణ అభ్యర్థన వస్తే గుర్తించి చర్య తీసుకుంటారా?' }, action: { en: 'Enable sign-in alerts and review active sessions; sign out unfamiliar devices and change the affected password.', te: 'లాగిన్ హెచ్చరికలను ప్రారంభించి యాక్టివ్ సెషన్‌లను చూడండి; తెలియని పరికరాలను సైన్ అవుట్ చేసి సంబంధిత పాస్‌వర్డ్ మార్చండి.' } },
];

const familyActions = [
  { en: 'Save your bank’s official number and the national cyber-fraud helpline 1930.', te: 'మీ బ్యాంక్ అధికారిక నంబర్, జాతీయ సైబర్ మోసం హెల్ప్‌లైన్ 1930ను భద్రపరచండి.' },
  { en: 'Agree as a family to verify urgent money requests using a known phone number.', te: 'అత్యవసర డబ్బు అభ్యర్థనలను తెలిసిన ఫోన్ నంబర్ ద్వారా ధృవీకరించుకోవాలని కుటుంబంగా నిర్ణయించండి.' },
  { en: 'Help each other enable screen locks and two-step verification without sharing passwords.', te: 'పాస్‌వర్డ్‌లు పంచుకోకుండా స్క్రీన్ లాక్, రెండు-దశల ధృవీకరణ ప్రారంభించడంలో ఒకరికొకరు సహాయం చేయండి.' },
  { en: 'Ask before sharing someone else’s photos, location, or personal information.', te: 'ఇతరుల ఫోటోలు, లొకేషన్ లేదా వ్యక్తిగత సమాచారాన్ని పంచుకునే ముందు వారి అనుమతి అడగండి.' },
  { en: 'Make sure children know a trusted adult they can contact about online harassment.', te: 'ఆన్‌లైన్ వేధింపుల గురించి పిల్లలు సంప్రదించగల నమ్మకమైన పెద్దవారు ఎవరో వారికి తెలియజేయండి.' },
];

const text = (value: { en: string; te: string }, language: Language) => value[language];
const formatBytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

function readAssessmentProgress(): { done: Record<string, boolean>; score: number | null; error: string } {
  try {
    const actions = localStorage.getItem('ds-assessment-actions');
    const score = localStorage.getItem('ds-assessment-score');
    const parsed: unknown = actions ? JSON.parse(actions) : {};
    const done = typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
      && Object.values(parsed).every((value) => typeof value === 'boolean')
      ? parsed as Record<string, boolean>
      : {};
    const numericScore = score === null ? null : Number(score);
    return {
      done,
      score: numericScore !== null && Number.isFinite(numericScore) && numericScore >= 0 && numericScore <= 100 ? numericScore : null,
      error: '',
    };
  } catch {
    return { done: {}, score: null, error: 'Could not load saved progress from this browser.' };
  }
}

function readFamilyProgress(): { checked: boolean[]; error: string } {
  try {
    const saved = localStorage.getItem('ds-family-checklist');
    const parsed: unknown = saved ? JSON.parse(saved) : null;
    if (Array.isArray(parsed) && parsed.length === familyActions.length && parsed.every((value) => typeof value === 'boolean')) {
      return { checked: parsed, error: '' };
    }
    return { checked: Array(familyActions.length).fill(false), error: '' };
  } catch {
    return {
      checked: Array(familyActions.length).fill(false),
      error: 'Could not load saved checklist progress from this browser.',
    };
  }
}

function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>;
}

export function AssessmentPage({ language }: { language: Language }) {
  const [storedProgress] = useState(readAssessmentProgress);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [done, setDone] = useState(storedProgress.done);
  const [savedScore, setSavedScore] = useState<number | null>(storedProgress.score);
  const [saveError, setSaveError] = useState(storedProgress.error);

  const answeredCount = Object.keys(answers).length;
  const score = Math.round((Object.values(answers).filter(Boolean).length / assessmentItems.length) * 100);
  const saveActionProgress = (next: Record<string, boolean>) => {
    setDone(next);
    try {
      localStorage.setItem('ds-assessment-actions', JSON.stringify(next));
      setSaveError('');
    } catch {
      setSaveError(language === 'te' ? 'ఈ పరికరంలో పురోగతిని భద్రపరచలేకపోయాం.' : 'Progress could not be saved on this device.');
    }
  };
  const completeAssessment = () => {
    try {
      localStorage.setItem('ds-assessment-score', String(score));
      setSavedScore(score);
      setSaveError('');
    } catch {
      setSaveError(language === 'te' ? 'మూల్యాంకనాన్ని భద్రపరచలేకపోయాం.' : 'The assessment could not be saved.');
    }
  };

  return (
    <PageShell>
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-slate-900 p-6 text-white shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-100">{language === 'te' ? 'వ్యక్తిగత భద్రత' : 'Personal digital safety'}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{language === 'te' ? 'మీ డిజిటల్ భద్రతను అంచనా వేయండి' : 'Check your digital safety habits'}</h1>
        <p className="mt-3 max-w-3xl text-brand-50">{language === 'te' ? 'ఈ స్వీయ-మూల్యాంకనం మీ అలవాట్లను మాత్రమే పరిశీలిస్తుంది. ఇది ఖాతా భద్రతకు హామీ కాదు. పాస్‌వర్డ్‌లు, OTPలు లేదా ఖాతా యాక్సెస్‌ను ఎప్పుడూ అడగదు.' : 'This self-assessment checks habits only. It cannot guarantee that an account is secure. It never asks for passwords, OTPs, or account access.'}</p>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          {assessmentItems.map((item, index) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{index + 1}. {text(item.topic, language)}</p>
              <h2 className="mt-2 font-semibold text-slate-900">{text(item.question, language)}</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {[true, false].map((answer) => (
                  <button key={String(answer)} type="button" aria-pressed={answers[item.id] === answer} onClick={() => setAnswers((current) => ({ ...current, [item.id]: answer }))} className={`rounded-full border px-4 py-2 text-sm font-semibold ${answers[item.id] === answer ? 'border-brand-700 bg-brand-700 text-white' : 'border-slate-300 text-slate-700 hover:bg-brand-50'}`}>
                    {answer ? (language === 'te' ? 'అవును' : 'Yes') : (language === 'te' ? 'కాదు / తెలియదు' : 'No / Not sure')}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
        <aside className="h-fit rounded-2xl border border-brand-100 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <p className="text-sm font-bold uppercase tracking-widest text-brand-700">{language === 'te' ? 'మీ పురోగతి' : 'Your progress'}</p>
          <p className="mt-3 text-4xl font-black text-slate-900">{answeredCount}/{assessmentItems.length}</p>
          <p className="mt-1 text-sm text-slate-600">{language === 'te' ? 'సమాధానాలు ఇచ్చిన ప్రశ్నలు' : 'questions answered'}</p>
          {answeredCount === assessmentItems.length && (
            <>
              <div className="mt-5 rounded-xl bg-brand-50 p-4">
                <p className="text-sm text-brand-900">{language === 'te' ? 'అలవాట్ల సూచిక' : 'Habit check score'}</p>
                <p className="mt-1 text-4xl font-black text-brand-800">{score}<span className="text-xl">/100</span></p>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">{language === 'te' ? 'ప్రతి “అవును” సమాధానానికి 12.5 పాయింట్లు. ఇది మార్గదర్శక సూచిక మాత్రమే; భద్రతా ధృవీకరణ కాదు.' : 'Each “Yes” contributes 12.5 points. This is a guidance indicator, not a security certification.'}</p>
              <button onClick={completeAssessment} type="button" className="mt-4 w-full rounded-full bg-brand-700 px-4 py-3 font-semibold text-white hover:bg-brand-800">{language === 'te' ? 'మూల్యాంకనాన్ని భద్రపరచండి' : 'Save assessment'}</button>
            </>
          )}
          {savedScore !== null && <p className="mt-3 text-sm text-slate-600">{language === 'te' ? 'చివరి భద్రపరిచిన స్కోరు' : 'Last saved score'}: <strong>{savedScore}/100</strong></p>}
          {saveError && <p role="alert" className="mt-3 text-sm text-red-700">{saveError}</p>}
        </aside>
      </section>

      {answeredCount === assessmentItems.length && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">{language === 'te' ? 'మీ తదుపరి భద్రతా చర్యలు' : 'Recommended next steps'}</h2>
          <p className="mt-1 text-sm text-slate-600">{language === 'te' ? '“కాదు” లేదా “తెలియదు” అని సమాధానమిచ్చిన అంశాలపై దృష్టి పెట్టండి. పూర్తి చేసిన చర్యలు ఈ పరికరంలోనే భద్రపరచబడతాయి.' : 'Start with items answered “No” or “Not sure”. Completed actions are saved only in this browser.'}</p>
          <div className="mt-4 space-y-3">
            {assessmentItems.filter((item) => !answers[item.id]).map((item) => (
              <label key={item.id} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                <input type="checkbox" checked={Boolean(done[item.id])} onChange={(event) => saveActionProgress({ ...done, [item.id]: event.target.checked })} className="mt-1 h-4 w-4 accent-emerald-700" />
                <span><strong className="block text-slate-900">{text(item.topic, language)}</strong><span className="text-sm text-slate-600">{text(item.action, language)}</span></span>
              </label>
            ))}
            {assessmentItems.every((item) => answers[item.id]) && <p className="rounded-xl bg-emerald-50 p-4 text-emerald-900">{language === 'te' ? 'అద్భుతం — మీ సమాధానాలన్నీ మంచి భద్రతా అలవాట్లను సూచిస్తున్నాయి. ఖాతా సెట్టింగ్‌లను క్రమం తప్పకుండా పరిశీలించండి.' : 'Great—your answers reflect useful safety habits. Continue reviewing account settings regularly.'}</p>}
          </div>
          <button type="button" onClick={() => { setAnswers({}); setSaveError(''); }} className="mt-5 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">{language === 'te' ? 'మళ్లీ అంచనా వేయండి' : 'Repeat assessment'}</button>
        </section>
      )}
    </PageShell>
  );
}

type SelectedEvidence = { file: File; metadata: EvidenceMetadata };

function createSummary(report: Omit<IncidentRecord, 'summary'>, language: Language): string {
  const category = reportCategories.find((item) => item.id === report.category);
  const date = report.incidentDate || (language === 'te' ? 'సుమారు తేదీ అందించలేదు' : 'Approximate date not provided');
  const urls = report.incidentUrl || (language === 'te' ? 'అందించలేదు' : 'Not provided');
  const evidence = report.evidence.length
    ? report.evidence.map((item, index) => `${index + 1}. ${item.name} (${formatBytes(item.size)}; SHA-256: ${item.sha256}; ${item.uploadedAt})`).join('\n')
    : (language === 'te' ? 'ఎలాంటి ఫైల్ జోడించలేదు' : 'No files attached');

  if (language === 'te') {
    return `సైబర్ వేధింపు ఘటన — ఫిర్యాదు సారాంశం\nసూచన సంఖ్య: ${report.reference}\n\nఘటన రకం: ${category?.te ?? report.category}\nప్లాట్‌ఫారమ్: ${report.platform || 'అందించలేదు'}\nసుమారు తేదీ/సమయం: ${date}\nకొనసాగుతోందా: ${report.ongoing ? 'అవును' : 'కాదు / తెలియదు'}\nసంబంధిత URL: ${urls}\n\nవివరణ:\n${report.description}\n\nఆధారాల జాబితా:\n${evidence}\n\nఈ సారాంశం వినియోగదారు అందించిన వివరాలపై మాత్రమే రూపొందించబడింది. అధికారిక పోర్టల్‌లో సమర్పించే ముందు దయచేసి పరిశీలించి సవరించండి.`;
  }
  return `Cyberbullying incident — complaint summary\nReference: ${report.reference}\n\nIncident category: ${category?.en ?? report.category}\nPlatform: ${report.platform || 'Not provided'}\nApproximate date/time: ${date}\nOngoing: ${report.ongoing ? 'Yes' : 'No / not sure'}\nRelevant URL: ${urls}\n\nDescription:\n${report.description}\n\nEvidence inventory:\n${evidence}\n\nThis summary uses only information provided by the user. Review and edit it before submitting through the official portal. It is not an official complaint or a legal finding.`;
}

function ReportCard({ report, language, onChange, onDelete }: { report: IncidentRecord; language: Language; onChange: (report: IncidentRecord) => void; onDelete: (reference: string) => void }) {
  const [reference, setReference] = useState(report.officialReference);
  const [status, setStatus] = useState(report.reportingStatus);
  const [message, setMessage] = useState('');
  const category = reportCategories.find((item) => item.id === report.category);
  const updateTracking = async (event: FormEvent) => {
    event.preventDefault();
    const updated = { ...report, officialReference: reference.trim(), reportingStatus: status };
    try {
      await updateIncident(updated);
      onChange(updated);
      setMessage(language === 'te' ? 'స్థితి భద్రపరచబడింది.' : 'Reporting status saved on this device.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save reporting status.');
    }
  };
  const downloadEvidence = async (item: EvidenceMetadata) => {
    try {
      const file = await getEvidence(item.id);
      if (!file) throw new Error('The saved original was not found in this browser.');
      const url = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = item.name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not retrieve the original evidence.');
    }
  };
  const downloadSummary = () => {
    const url = URL.createObjectURL(new Blob([report.summary], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.reference}-complaint-summary.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <summary className="cursor-pointer list-none">
        <span className="flex flex-wrap items-center justify-between gap-3">
          <span><strong className="block text-lg text-slate-900">{report.reference}</strong><span className="text-sm text-slate-600">{category ? text(category, language) : report.category} · {new Date(report.createdAt).toLocaleString(language === 'te' ? 'te-IN' : 'en-IN')}</span></span>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-800">{language === 'te' ? 'ఈ పరికరంలో సేవ్' : 'Saved on this device'}</span>
        </span>
      </summary>
      <div className="mt-4 border-t border-slate-100 pt-4">
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{report.description}</p>
        <p className="mt-3 text-sm text-slate-600">{language === 'te' ? 'ప్లాట్‌ఫారమ్' : 'Platform'}: {report.platform || '—'} · {language === 'te' ? 'ఆధారాలు' : 'Evidence'}: {report.evidence.length}</p>
        {report.evidence.length > 0 && <ul className="mt-3 space-y-2">{report.evidence.map((item) => <li key={item.id} className="rounded-lg bg-slate-50 p-3 text-xs text-slate-700"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold">{item.name} · {formatBytes(item.size)}</span><button type="button" onClick={() => void downloadEvidence(item)} className="inline-flex items-center gap-1 font-semibold text-brand-800"><ArrowDownToLine className="h-4 w-4" />{language === 'te' ? 'అసలు ఫైల్' : 'Download original'}</button></div><p className="mt-1 break-all">SHA-256: {item.sha256}</p><p>{language === 'te' ? 'అప్‌లోడ్ సమయం' : 'Added'}: {new Date(item.uploadedAt).toLocaleString()}</p></li>)}</ul>}
        <details className="mt-4 rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer font-semibold text-slate-800">{language === 'te' ? 'ఫిర్యాదు సారాంశాన్ని సమీక్షించండి' : 'Review prepared complaint summary'}</summary><pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">{report.summary}</pre><button type="button" onClick={downloadSummary} className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white"><ArrowDownToLine className="h-4 w-4" />{language === 'te' ? 'సారాంశాన్ని డౌన్‌లోడ్ చేయండి' : 'Download summary'}</button></details>
        <form onSubmit={(event) => void updateTracking(event)} className="mt-4 grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-sm font-semibold text-slate-700">{language === 'te' ? 'అధికారిక రిఫరెన్స్ సంఖ్య (ఐచ్ఛికం)' : 'Official acknowledgement/reference (optional)'}<input value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-semibold text-slate-700">{language === 'te' ? 'నివేదిక స్థితి' : 'Reporting status'}<select value={status} onChange={(event) => setStatus(event.target.value as ReportingStatus)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal"><option value="draft">{language === 'te' ? 'ముసాయిదా' : 'Draft'}</option><option value="ready">{language === 'te' ? 'సమర్పణకు సిద్ధం' : 'Ready to submit'}</option><option value="submitted">{language === 'te' ? 'అధికారికంగా సమర్పించబడింది' : 'Submitted on official portal'}</option><option value="follow-up">{language === 'te' ? 'తదుపరి చర్య అవసరం' : 'Follow-up needed'}</option></select></label>
          <button type="submit" className="self-end rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">{language === 'te' ? 'భద్రపరచండి' : 'Save'}</button>
        </form>
        {message && <p role="status" className="mt-2 text-sm text-slate-600">{message}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <a href={portalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white">{language === 'te' ? 'అధికారిక పోర్టల్ తెరవండి' : 'Open official portal'}<ExternalLink className="h-4 w-4" /></a>
          <button type="button" onClick={() => onDelete(report.reference)} className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" />{language === 'te' ? 'ఈ పరికరం నుంచి తొలగించండి' : 'Delete from this device'}</button>
        </div>
      </div>
    </details>
  );
}

export function IncidentPage({ language }: { language: Language }) {
  const [records, setRecords] = useState<IncidentRecord[]>([]);
  const [category, setCategory] = useState<IncidentCategory>('harassment');
  const [platform, setPlatform] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [incidentUrl, setIncidentUrl] = useState('');
  const [description, setDescription] = useState('');
  const [ongoing, setOngoing] = useState(false);
  const [files, setFiles] = useState<SelectedEvidence[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [storageError, setStorageError] = useState('');
  const [notice, setNotice] = useState('');
  const [reference, setReference] = useState(createReference);

  useEffect(() => {
    let active = true;
    void listIncidents().then((saved) => {
      if (active) {
        setRecords(saved);
        setStorageError('');
        setLoading(false);
      }
    }).catch((cause: unknown) => {
      if (active) {
        setStorageError(cause instanceof Error ? cause.message : 'Could not load reports.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const selectFiles = async (selected: FileList | null) => {
    if (!selected?.length) return;
    setProcessing(true);
    setError('');
    const next = [...files];
    let validationError = '';
    for (const file of Array.from(selected)) {
      if (next.length >= 5) {
        validationError = language === 'te' ? 'గరిష్ఠంగా 5 ఫైళ్లను మాత్రమే జోడించవచ్చు.' : 'You can attach up to 5 files.';
        break;
      }
      if (next.reduce((sum, item) => sum + item.file.size, 0) + file.size > 25 * 1024 * 1024) {
        validationError = language === 'te' ? 'మొత్తం ఫైళ్ల పరిమాణం 25 MB మించకూడదు.' : 'Combined evidence must not exceed 25 MB.';
        break;
      }
      try {
        const metadata = await validateAndHashEvidence(file);
        next.push({ file, metadata });
      } catch (cause) {
        validationError = cause instanceof Error ? cause.message : 'Evidence validation failed.';
      }
    }
    setFiles(next);
    setSummary('');
    if (validationError) {
      setError(validationError);
      setNotice('');
    } else {
      setNotice(language === 'te' ? 'ఫైళ్ల రకం తనిఖీ చేసి SHA-256 హాష్‌ను స్థానికంగా లెక్కించాం.' : 'File types checked and SHA-256 hashes calculated locally.');
    }
    setProcessing(false);
  };

  const reportWithoutSummary = useMemo(() => ({
    reference,
    category,
    platform: platform.trim(),
    incidentDate,
    incidentUrl: incidentUrl.trim(),
    description: description.trim(),
    ongoing,
    evidence: files.map((item) => item.metadata),
    reportingStatus: 'draft' as const,
    officialReference: '',
    createdAt: '',
  }), [category, description, files, incidentDate, incidentUrl, ongoing, platform, reference]);

  const prepareSummary = () => {
    if (!description.trim()) {
      setError(language === 'te' ? 'సారాంశం సిద్ధం చేయడానికి ముందుగా ఘటన వివరణ ఇవ్వండి.' : 'Add an incident description before preparing the summary.');
      return;
    }
    if (incidentUrl.trim()) {
      try {
        const url = new URL(incidentUrl.trim());
        if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
      } catch {
        setError(language === 'te' ? 'URL https:// లేదా http://తో ప్రారంభం కావాలి.' : 'The URL must start with https:// or http://.');
        return;
      }
    }
    setSummary(createSummary(reportWithoutSummary, language));
    setError('');
  };

  const submitReport = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!summary.trim()) {
      setError(language === 'te' ? 'ముందుగా సారాంశాన్ని సిద్ధం చేసి సమీక్షించండి.' : 'Prepare and review the complaint summary before saving.');
      return;
    }
    try {
      const record: IncidentRecord = { ...reportWithoutSummary, summary, createdAt: new Date().toISOString() };
      await saveIncident(record, files.map((item) => ({ id: item.metadata.id, file: item.file })));
      setRecords((current) => [record, ...current]);
      setNotice(language === 'te' ? `ఫిర్యాదు ముసాయిదా ఈ పరికరంలో భద్రపరచబడింది. రిఫరెన్స్: ${reference}` : `Draft saved on this device. Reference: ${reference}`);
      setCategory('harassment'); setPlatform(''); setIncidentDate(''); setIncidentUrl(''); setDescription(''); setOngoing(false); setFiles([]); setSummary('');
      setReference(createReference());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save the incident record.');
    }
  };

  const removeIncident = async (target: string) => {
    if (!window.confirm(language === 'te' ? 'ఈ నివేదిక మరియు దాని ఆధారాలను ఈ పరికరం నుంచి తొలగించాలా?' : 'Delete this report and its evidence from this device?')) return;
    try {
      await deleteIncident(target);
      setRecords((current) => current.filter((item) => item.reference !== target));
      setNotice(language === 'te' ? 'నివేదిక, ఆధారాలు తొలగించబడ్డాయి.' : 'Report and evidence deleted from this browser.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete the incident record.');
    }
  };

  return (
    <PageShell>
      <header className="rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-6 text-white shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-100">{language === 'te' ? 'గోప్యత-మొదటి సహాయం' : 'Privacy-first assistance'}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{language === 'te' ? 'సైబర్ వేధింపు నివేదిక & ఆధారాల కేంద్రం' : 'Cyberbullying Report & Evidence Centre'}</h1>
        <p className="mt-3 max-w-3xl text-slate-200">{language === 'te' ? 'మీ వివరాలు, అసలు ఫైళ్లు ఈ బ్రౌజర్ పరికరంలోనే భద్రపరచబడతాయి; సర్వర్‌కు అప్‌లోడ్ కావు. Digital Suraksha పోలీసు లేదా చట్ట అమలు సంస్థ కాదు.' : 'Your details and original files stay in this browser on this device; they are not uploaded to a server. Digital Suraksha is not a law-enforcement agency.'}</p>
      </header>

      <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <strong>{language === 'te' ? 'మైనర్ల భద్రత:' : 'Safety, especially for minors:'}</strong>{' '}
        {language === 'te' ? 'మైనర్‌కు సంబంధించిన సన్నిహిత చిత్రాలను ఎంచుకోవద్దు, కాపీ చేయవద్దు లేదా అప్‌లోడ్ చేయవద్దు. నమ్మకమైన పెద్దవారిని, సంబంధిత అధికారులను సంప్రదించండి. ఈ సాధనం చిత్రాల ప్రివ్యూ చూపదు.' : 'Do not select, copy, or upload intimate images of a minor. Contact a trusted adult and appropriate authorities. This tool does not preview images.'}
      </div>
      <div className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
        {language === 'te' ? 'స్థానిక నిల్వ పరికరంలోని బ్రౌజర్ ప్రొఫైల్‌కు మాత్రమే పరిమితం; ఇది ఎన్‌క్రిప్ట్ చేయబడలేదు లేదా ఖాతాతో రక్షించబడలేదు. భాగస్వామ్య పరికరంలో సున్నితమైన సమాచారాన్ని భద్రపరచవద్దు. బ్రౌజర్ డేటా తొలగిస్తే నివేదికలు పోవచ్చు.' : 'Local storage is limited to this browser profile; it is not encrypted or protected by an account. Do not save sensitive information on a shared device. Clearing browser data may permanently remove reports.'}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={(event) => void submitReport(event)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-800">{language === 'te' ? 'ఘటన రకం' : 'Incident category'}<select required value={category} onChange={(event) => { setCategory(event.target.value as IncidentCategory); setSummary(''); }} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 font-normal">{reportCategories.map((item) => <option key={item.id} value={item.id}>{text(item, language)}</option>)}</select></label>
            <label className="text-sm font-semibold text-slate-800">{language === 'te' ? 'ప్లాట్‌ఫారమ్ (ఐచ్ఛికం)' : 'Platform (optional)'}<input value={platform} onChange={(event) => { setPlatform(event.target.value); setSummary(''); }} maxLength={100} placeholder="e.g. social platform or messaging app" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-800">{language === 'te' ? 'సుమారు తేదీ, సమయం' : 'Approximate date and time'}<input type="datetime-local" value={incidentDate} onChange={(event) => { setIncidentDate(event.target.value); setSummary(''); }} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
            <label className="text-sm font-semibold text-slate-800">{language === 'te' ? 'సంబంధిత URL (ఐచ్ఛికం)' : 'Relevant profile/content URL (optional)'}<input type="url" value={incidentUrl} onChange={(event) => { setIncidentUrl(event.target.value); setSummary(''); }} maxLength={2000} placeholder="https://" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" /></label>
          </div>
          <label className="block text-sm font-semibold text-slate-800">{language === 'te' ? 'ఏమి జరిగింది? అవసరమైన వివరాలు మాత్రమే రాయండి.' : 'What happened? Include only details necessary to describe the incident.'}<textarea required minLength={10} maxLength={5000} rows={5} value={description} onChange={(event) => { setDescription(event.target.value); setSummary(''); }} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 font-normal" placeholder={language === 'te' ? 'మీకు తెలిసిన వాస్తవాలను క్రమంగా వివరించండి. ఊహించవద్దు.' : 'Describe what you observed in your own words. Do not guess or add unverified details.'} /><span className="mt-1 block text-xs text-slate-500">{description.length}/5000</span></label>
          <label className="flex items-start gap-3 text-sm text-slate-700"><input type="checkbox" checked={ongoing} onChange={(event) => { setOngoing(event.target.checked); setSummary(''); }} className="mt-1 h-4 w-4 accent-emerald-700" /><span>{language === 'te' ? 'ఘటన కొనసాగుతోంది లేదా పదేపదే జరుగుతోంది' : 'The incident is ongoing or repeated'}</span></label>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <label className="block text-sm font-semibold text-slate-900">{language === 'te' ? 'ఆధార ఫైళ్లు' : 'Evidence files'}<span className="mt-1 block font-normal text-slate-600">{language === 'te' ? 'PNG, JPEG, PDF, UTF-8 TXT మాత్రమే; ఒక్కొక్కటి గరిష్ఠం 10 MB, మొత్తం 5 ఫైళ్లు / 25 MB. ఎగ్జిక్యూటబుల్‌లు, మద్దతు లేని ఫైళ్లు తిరస్కరించబడతాయి.' : 'PNG, JPEG, PDF, or UTF-8 TXT only; max 10 MB each, 5 files / 25 MB total. Executables and unsupported formats are rejected.'}</span><input type="file" multiple accept=".png,.jpg,.jpeg,.pdf,.txt,image/png,image/jpeg,application/pdf,text/plain" disabled={processing || files.length >= 5} onChange={(event) => { void selectFiles(event.target.files); event.target.value = ''; }} className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:font-semibold file:text-white" /></label>
            <p aria-live="polite" className="mt-2 text-xs text-slate-600">{processing ? (language === 'te' ? 'ఫైల్ రకం తనిఖీ చేసి SHA-256 లెక్కిస్తున్నాం…' : 'Checking file type and calculating SHA-256…') : (language === 'te' ? 'ప్రివ్యూ లేదు. అసలు ఫైళ్లు మార్పు లేకుండా స్థానికంగా భద్రపరచబడతాయి.' : 'No previews are shown. Original files are stored locally without modification.')}</p>
            {files.length > 0 && <ul className="mt-3 space-y-2">{files.map((item) => <li key={item.metadata.id} className="rounded-lg bg-white p-3 text-xs text-slate-700"><div className="flex flex-wrap justify-between gap-2"><strong>{item.file.name} · {formatBytes(item.file.size)}</strong><button type="button" aria-label={`${language === 'te' ? 'తొలగించు' : 'Remove'} ${item.file.name}`} onClick={() => { setFiles((current) => current.filter((candidate) => candidate.metadata.id !== item.metadata.id)); setSummary(''); }} className="font-semibold text-red-700">{language === 'te' ? 'తొలగించు' : 'Remove'}</button></div><p className="mt-1 break-all">SHA-256: {item.metadata.sha256}</p><p>{language === 'te' ? 'స్థితి: పూర్తయింది' : 'Status: validated · hash complete'}</p></li>)}</ul>}
          </div>

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}

          <div className="grid gap-4 lg:grid-cols-2">
            <button type="button" onClick={prepareSummary} disabled={processing} className="rounded-full border border-brand-700 px-5 py-3 font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-50">{language === 'te' ? 'సారాంశాన్ని సిద్ధం చేయండి' : 'Prepare complaint summary'}</button>
            <button type="submit" disabled={!summary.trim() || processing} className="rounded-full bg-brand-700 px-5 py-3 font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50">{language === 'te' ? 'ముసాయిదాను ఈ పరికరంలో సేవ్ చేయండి' : 'Save draft on this device'}</button>
          </div>
          {summary && <label className="block text-sm font-semibold text-slate-800">{language === 'te' ? 'సమీక్షించి సవరించండి — ఈ సారాంశం AI రూపొందించినది కాదు.' : 'Review and edit — this summary is rule-based, not AI-generated.'}<textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={13} maxLength={12000} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 font-mono text-sm font-normal leading-6" /></label>}
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-black text-slate-900">{language === 'te' ? 'ఈ పరికరంలో సేవ్ చేసిన నివేదికలు' : 'Reports saved on this device'}</h2>
        {loading ? <p className="mt-3 text-slate-600">{language === 'te' ? 'నివేదికలను లోడ్ చేస్తున్నాం…' : 'Loading reports…'}</p> : storageError ? <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-red-800">{storageError}</p> : records.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-slate-600">{language === 'te' ? 'ఇంకా నివేదికలు లేవు.' : 'No saved reports yet.'}</p> : <div className="mt-4 space-y-3">{records.map((record) => <ReportCard key={record.reference} report={record} language={language} onChange={(updated) => setRecords((current) => current.map((item) => item.reference === updated.reference ? updated : item))} onDelete={(target) => void removeIncident(target)} />)}</div>}
      </section>

      <section className="mt-8 rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <h2 className="text-xl font-bold text-brand-950">{language === 'te' ? 'అధికారికంగా ఎలా నివేదించాలి' : 'How to report through the official portal'}</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
          <li>{language === 'te' ? 'సారాంశాన్ని తనిఖీ చేసి అవసరమైతే సవరించండి; మీ వద్ద ఉన్న అసలు ఆధారాలను భద్రపరచండి.' : 'Review and edit the summary; keep original evidence files and relevant URLs available.'}</li>
          <li>{language === 'te' ? 'జాతీయ సైబర్ క్రైమ్ రిపోర్టింగ్ పోర్టల్‌లో సంబంధిత వర్గాన్ని ఎంచుకుని ఫిర్యాదు వివరాలను స్వయంగా నమోదు చేయండి.' : 'Choose the relevant category on the National Cyber Crime Reporting Portal and enter the complaint details yourself.'}</li>
          <li>{language === 'te' ? 'అధికారిక ఫారమ్‌లో ఆధారాలను అప్‌లోడ్ చేసి, వచ్చిన acknowledgement/reference సంఖ్యను ఇక్కడ నమోదు చేయండి.' : 'Upload evidence to the official form and record the acknowledgement/reference number here.'}</li>
        </ol>
        <p className="mt-3 text-sm font-bold text-amber-900">{language === 'te' ? 'ఈ అప్లికేషన్ నివేదికను I4Cకి పంపదు; “సమర్పించబడింది” అనే స్థితి మీరే మార్చినప్పుడు మాత్రమే కనిపిస్తుంది.' : 'This app does not send reports to I4C. The “submitted” status is only a note you set after submitting through the official portal.'}</p>
        <a href={portalUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-700 px-5 py-3 font-semibold text-white">{language === 'te' ? 'జాతీయ సైబర్ క్రైమ్ పోర్టల్‌కు వెళ్లండి' : 'Open National Cyber Crime Reporting Portal'}<ExternalLink className="h-4 w-4" /></a>
      </section>
    </PageShell>
  );
}

export function FamilyPage({ language }: { language: Language }) {
  const [initialFamilyProgress] = useState(readFamilyProgress);
  const [checked, setChecked] = useState<boolean[]>(initialFamilyProgress.checked);
  const [voiceMessage, setVoiceMessage] = useState(initialFamilyProgress.error
    ? language === 'te' ? 'పాత పురోగతిని చదవలేకపోయాం; కొత్త చెక్‌లిస్ట్ అందుబాటులో ఉంది.' : initialFamilyProgress.error
    : '');

  const progress = checked.filter(Boolean).length;
  const toggle = (index: number, value: boolean) => {
    const next = checked.map((item, current) => current === index ? value : item);
    setChecked(next);
    try {
      localStorage.setItem('ds-family-checklist', JSON.stringify(next));
      setVoiceMessage('');
    } catch {
      setVoiceMessage(language === 'te' ? 'పురోగతిని ఈ పరికరంలో భద్రపరచలేకపోయాం.' : 'Could not save progress on this device.');
    }
  };
  const speakInstructions = () => {
    if (!('speechSynthesis' in window)) {
      setVoiceMessage(language === 'te' ? 'ఈ బ్రౌజర్‌లో వాయిస్ అందుబాటులో లేదు. సూచనలు తెరపై చదవవచ్చు.' : 'Voice is unavailable in this browser. Read the instructions on screen.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(familyActions.map((item, index) => `${index + 1}. ${text(item, language)}`).join('. '));
    utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
    utterance.onerror = () => setVoiceMessage(language === 'te' ? 'వాయిస్ ప్లేబ్యాక్ విఫలమైంది. తెరపై ఉన్న సూచనలను చదవండి.' : 'Voice playback failed. Read the instructions on screen.');
    window.speechSynthesis.speak(utterance);
    setVoiceMessage(language === 'te' ? 'వాయిస్ సూచనలు ప్రారంభమయ్యాయి. ఆడియో అందుబాటుపై బ్రౌజర్ ఆధారపడుతుంది.' : 'Voice guidance started; available voices depend on the browser.');
  };

  return (
    <PageShell>
      <section className="rounded-3xl bg-gradient-to-br from-brand-700 to-slate-900 p-6 text-white shadow-soft sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-100">{language === 'te' ? 'కుటుంబ డిజిటల్ భద్రత' : 'Family digital safety'}</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">{language === 'te' ? 'కుటుంబ భద్రతా కేంద్రం' : 'Family Safety Centre'}</h1>
        <p className="mt-3 max-w-3xl text-brand-50">{language === 'te' ? 'సులభమైన చర్యలను కలిసి పూర్తి చేయండి. ఈ చెక్‌లిస్ట్ పురోగతి ఈ బ్రౌజర్‌లో మాత్రమే ఉంటుంది; కుటుంబ సభ్యుల నివేదికలు లేదా ఖాతా వివరాలను ఇది పంచుకోదు.' : 'Work through simple safety actions together. Checklist progress stays in this browser and does not share anyone’s reports or account details.'}</p>
      </section>
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">{language === 'te' ? 'కుటుంబ చెక్‌లిస్ట్' : 'Family checklist'}</h2><p className="mt-1 text-sm text-slate-600">{progress}/{familyActions.length} {language === 'te' ? 'చర్యలు పూర్తి' : 'actions complete'}</p></div><button type="button" onClick={speakInstructions} className="inline-flex items-center gap-2 rounded-full bg-brand-700 px-4 py-2 font-semibold text-white"><Volume2 className="h-4 w-4" />{language === 'te' ? 'సూచనలు వినండి' : 'Listen to instructions'}</button></div>
        <div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${(progress / familyActions.length) * 100}%` }} /></div>
        <div className="mt-4 space-y-3">{familyActions.map((item, index) => <label key={item.en} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4"><input type="checkbox" checked={checked[index]} onChange={(event) => toggle(index, event.target.checked)} className="mt-1 h-4 w-4 accent-emerald-700" /><span className="text-slate-800">{text(item, language)}</span></label>)}</div>
        {voiceMessage && <p role="status" className="mt-3 text-sm text-slate-600">{voiceMessage}</p>}
      </section>
      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><ShieldCheck className="h-6 w-6 text-emerald-800" /><h2 className="mt-3 text-lg font-bold text-emerald-950">{language === 'te' ? 'సహాయం అడగడం సరి' : 'It is okay to ask for help'}</h2><p className="mt-2 text-sm leading-6 text-emerald-950">{language === 'te' ? 'ఆన్‌లైన్‌లో ఎవరైనా అసౌకర్యం కలిగిస్తే, వెంటనే నమ్మకమైన పెద్దవారికి చెప్పండి. సాక్ష్యాలను మార్చకుండా భద్రపరచండి.' : 'If someone makes you uncomfortable online, tell a trusted adult. Keep evidence without altering it.'}</p></article>
        <article className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><ShieldAlert className="h-6 w-6 text-amber-800" /><h2 className="mt-3 text-lg font-bold text-amber-950">{language === 'te' ? 'వ్యక్తిగత సమాచారాన్ని పంచుకోవద్దు' : 'Keep private information private'}</h2><p className="mt-2 text-sm leading-6 text-amber-950">{language === 'te' ? 'OTPలు, UPI PINలు, పాస్‌వర్డ్‌లు ఎవరితోనూ పంచుకోకండి — కుటుంబ సభ్యులతో కూడా కాదు.' : 'Never share OTPs, UPI PINs, or passwords—including with family members.'}</p></article>
      </section>
    </PageShell>
  );
}
