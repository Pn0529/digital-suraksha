# Digital Suraksha

Digital Suraksha is a mobile-first civic-tech portal designed to help citizens understand cybercrime prevention, secure digital payments, and everyday financial literacy. It is built for English and Telugu audiences and includes a homepage, multilingual voice assistant, knowledge library, downloadable awareness materials, and a simple admin dashboard.

## Features

- Responsive homepage and civic-style design system
- English/Telugu language toggle
- Voice assistant panel with browser speech recognition, typed questions, and server-generated text-to-speech output
- Searchable knowledge base for common scam scenarios
- Fraud awareness cards, safety tips, checklist, quiz, and case studies
- Bilingual personal digital-security assessment with a transparent habit score, tailored actions, and local progress
- Cyberbullying Report & Evidence Centre with private-on-device incident records, file validation, SHA-256 evidence hashes, and editable complaint summaries
- Family safety checklist with progress tracking and browser speech where supported
- Official help centre with I4C reporting guidance, emergency steps, and public support links
- Downloadable educational materials stored in the project
- Admin dashboard mock workflow for content and publication status

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- React Router
- Express API server
- Browser Web Speech API for speech recognition
- Google Cloud Text-to-Speech for generated audio playback
- Node.js built-in test runner for backend API tests

## Project structure

- `src/App.tsx` — main application and route structure
- `src/SupportPages.tsx` — assessment, incident-reporting, evidence, and family-safety pages
- `src/reportStorage.ts` — local IndexedDB storage and evidence-file validation/hash logic
- `src/index.css` — Tailwind and global styling
- `server/index.js` — local Express API and grounded answer logic
- `public/materials/` — downloadable awareness files
- `public/qrcodes/` — local demo QR asset

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and edit the values for your environment. `.env` is ignored by Git:

```powershell
Copy-Item .env.example .env
```

To enable spoken answers, enable the Google Cloud Text-to-Speech API for a Google Cloud project and configure Application Default Credentials for the API server. For local development, create a service account with permission to use Text-to-Speech and store its JSON key outside the repository:

```dotenv
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json
```

Then start the app:

```powershell
npm run dev
```

Set `GOOGLE_APPLICATION_CREDENTIALS` in `.env` (or in the server process environment) to the service-account file path before running `npm run dev`. The key file itself must remain outside the repository. Google Cloud billing and API access are required for generated speech; without credentials, the rest of the app still runs, but speech generation reports an error.

For deployments, set `FRONTEND_ORIGINS` to a comma-separated list of exact trusted frontend origins, including the production site origin even when the frontend and API share a host. Production startup fails if this setting is missing. Development origins for Vite are allowed by default.

The app runs at:

- Frontend: http://localhost:5173/
- API: http://localhost:4000/api/health

## Assessment and incident-report workflow

- Visit `/assessment`, answer the eight habit questions, and save the score. Each affirmative answer is worth 12.5 points. This is a self-check only and does not verify or guarantee account security.
- Visit `/reports` to prepare an incident record. The form accepts up to five PNG, JPEG, PDF, or UTF-8 text files (10 MB each, 25 MB combined). It checks extension, declared MIME type, and basic file signatures/content before computing SHA-256 hashes in the browser.
- Incident descriptions, original evidence files, hashes, editable summaries, and reporting references are kept in this browser profile's IndexedDB. They are not sent to the Express API. The browser does not encrypt this local data or associate it with an authenticated user. Do not use shared devices or store sensitive material here; clearing browser data may permanently delete it. There is no server-side backup, multi-user isolation, account authentication, or admin access.
- The form does not display evidence previews and does not modify originals. Do not select or upload intimate images of minors; contact a trusted adult and appropriate authorities.
- Prepare and edit the complaint summary, save it locally, then use the official link to submit the report yourself. Update the acknowledgement/reference and status after submission. Digital Suraksha does not submit reports to I4C and does not display an automated-submission success message.
- For financial cyber fraud in India, contact your bank promptly and call **1930**. Use the official [National Cyber Crime Reporting Portal](https://cybercrime.gov.in/) for reporting guidance and submission.
- The `/family` checklist and assessment progress are stored in browser local storage. Browser speech is optional; the visible text remains available if voice support is unavailable.

## API

| Method | Endpoint | Behavior |
| --- | --- | --- |
| `GET` | `/api/health` | Process health only; does not verify Google Cloud readiness. |
| `GET` | `/api/knowledge-base` | Returns the locally maintained English/Telugu guidance entries. |
| `POST` | `/api/assistant/query` | Accepts `{ "question": "...", "language": "en" }` or `"te"` and returns a grounded local answer or a safe fallback. Requests are limited to 30 per IP per 15 minutes. |
| `POST` | `/api/assistant/speech` | Accepts `{ "text": "...", "language": "en" }` or `"te"` and returns MP3 audio. Requires Google Cloud credentials and is limited to 20 requests per IP per 15 minutes. |

JSON request bodies are limited to 8 KB. The question and speech text have additional UTF-8 byte limits. Invalid JSON and unknown API paths return JSON errors. CORS is restricted to configured frontend origins. When deployed behind a reverse proxy, configure the proxy and rate-limit client IP handling appropriately.

## Production build

```bash
npm run build
npm run preview
```

## Security and privacy limitations

- The assistant uses a local, grounded knowledge base and does not ask for OTPs, UPI PINs, passwords, or payment credentials.
- Microphone input depends on browser support and microphone permissions. Spoken answers require valid Google Cloud credentials and Text-to-Speech API access on the server.
- Speech recognition runs in the browser; speech synthesis runs on the server through Google Cloud. Spoken question text is sent to the local API for matching, and answer text is sent to Google Cloud when audio is requested.
- The admin dashboard is a static demo. It has no authentication, authorization, content editing, audit logs, or persistent storage. Do not use it to manage real content or private reports.
- The app does not currently have user accounts, a database, server-side incident APIs, server-side evidence storage, role-based access control, or encrypted report storage. Evidence is not available across devices or browser profiles. These features require a security-reviewed identity, storage, key-management, retention, and authorization design before deployment.
- The knowledge base is manually maintained and is not a live authoritative feed. Unmatched questions receive a safe fallback rather than a guessed topic answer.
- The production dependency audit (`npm audit --omit=dev`) is clean. The full audit still reports seven transitive advisories in the Tailwind CSS 3 build-tool dependency chain; the Tailwind 4 major migration was not applied because it needs separate compatibility work.
- Configure HTTPS at the production edge. This repository has not been deployed or production-certified.
- This project is a local assistance and awareness application, not a law-enforcement service or emergency service. Never enter passwords, OTPs, UPI PINs, or banking credentials.
- Use HTTPS for the deployed site. The current local browser storage should not be treated as encrypted or suitable for shared-device use.

## Tests

Run the backend API tests without Google Cloud credentials:

```bash
npm test
```

## Demo flow

1. Open the homepage.
2. Toggle English/Telugu.
3. Use the microphone on the homepage or the assistant route.
4. Ask a question such as: “How do I protect my UPI payment?” or “What should I do if a scammer asks for OTP?”
5. Read the answer, use the speech feature, and browse the library and help center.
6. Visit `/assessment` and answer the habit questions to see the score and recommendations.
7. Visit `/reports`, create an incident record, optionally add safe test files, prepare and edit the complaint summary, and save the draft locally. Verify that the report appears below the form, then download an original file or delete the test record.
8. Use the official portal button to open `https://cybercrime.gov.in/` in a new tab. Submissions must be made on that official site; the local app does not submit them.
9. Visit `/family` to use the checklist and optional text-to-speech guidance. Download the included awareness materials from the home page.
