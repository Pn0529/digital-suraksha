export type IncidentCategory =
  | 'harassment'
  | 'threats'
  | 'unwanted-contact'
  | 'cyberstalking'
  | 'impersonation'
  | 'non-consensual-content'
  | 'social-media'
  | 'other';

export type ReportingStatus = 'draft' | 'ready' | 'submitted' | 'follow-up';

export type EvidenceMetadata = {
  id: string;
  name: string;
  size: number;
  type: string;
  sha256: string;
  uploadedAt: string;
};

export type IncidentRecord = {
  reference: string;
  category: IncidentCategory;
  platform: string;
  incidentDate: string;
  incidentUrl: string;
  description: string;
  ongoing: boolean;
  evidence: EvidenceMetadata[];
  summary: string;
  reportingStatus: ReportingStatus;
  officialReference: string;
  createdAt: string;
};

type StoredEvidence = {
  id: string;
  reportReference: string;
  file: Blob;
};

const DATABASE_NAME = 'digital-suraksha-private-vault';
const DATABASE_VERSION = 1;
const REPORTS_STORE = 'reports';
const EVIDENCE_STORE = 'evidence';

function openDatabase(): Promise<IDBDatabase> {
  if (!globalThis.indexedDB) {
    return Promise.reject(new Error('Private browser storage is unavailable in this browser.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(REPORTS_STORE)) {
        database.createObjectStore(REPORTS_STORE, { keyPath: 'reference' });
      }
      if (!database.objectStoreNames.contains(EVIDENCE_STORE)) {
        const evidence = database.createObjectStore(EVIDENCE_STORE, { keyPath: 'id' });
        evidence.createIndex('reportReference', 'reportReference', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Could not open private browser storage.'));
    request.onblocked = () => reject(new Error('Close other Digital Suraksha tabs and try again.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(new Error('Could not save the incident record.'));
    transaction.onabort = () => reject(new Error('The incident record was not saved.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Could not read private browser storage.'));
  });
}

export async function listIncidents(): Promise<IncidentRecord[]> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(REPORTS_STORE, 'readonly');
    const result = await requestResult(transaction.objectStore(REPORTS_STORE).getAll() as IDBRequest<IncidentRecord[]>);
    await transactionDone(transaction);
    return result.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  } finally {
    database.close();
  }
}

export async function saveIncident(report: IncidentRecord, files: { id: string; file: File }[]): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([REPORTS_STORE, EVIDENCE_STORE], 'readwrite');
    transaction.objectStore(REPORTS_STORE).put(report);
    const evidenceStore = transaction.objectStore(EVIDENCE_STORE);
    for (const upload of files) {
      if (!report.evidence.some((item) => item.id === upload.id)) {
        transaction.abort();
        throw new Error('Evidence metadata did not match the selected file.');
      }
      evidenceStore.put({ id: upload.id, reportReference: report.reference, file: upload.file } satisfies StoredEvidence);
    }
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function updateIncident(report: IncidentRecord): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(REPORTS_STORE, 'readwrite');
    transaction.objectStore(REPORTS_STORE).put(report);
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

export async function getEvidence(id: string): Promise<Blob | undefined> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(EVIDENCE_STORE, 'readonly');
    const item = await requestResult(transaction.objectStore(EVIDENCE_STORE).get(id) as IDBRequest<StoredEvidence | undefined>);
    await transactionDone(transaction);
    return item?.file;
  } finally {
    database.close();
  }
}

export async function deleteIncident(reference: string): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction([REPORTS_STORE, EVIDENCE_STORE], 'readwrite');
    transaction.objectStore(REPORTS_STORE).delete(reference);
    const evidenceStore = transaction.objectStore(EVIDENCE_STORE);
    const index = evidenceStore.index('reportReference');
    const request = index.openKeyCursor(IDBKeyRange.only(reference));
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        evidenceStore.delete(cursor.primaryKey);
        cursor.continue();
      }
    };
    await transactionDone(transaction);
  } finally {
    database.close();
  }
}

const acceptedFormats = new Map([
  ['.png', { type: 'image/png', signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  ['.jpg', { type: 'image/jpeg', signature: [0xff, 0xd8, 0xff] }],
  ['.jpeg', { type: 'image/jpeg', signature: [0xff, 0xd8, 0xff] }],
  ['.pdf', { type: 'application/pdf', signature: [0x25, 0x50, 0x44, 0x46, 0x2d] }],
  ['.txt', { type: 'text/plain', signature: [] }],
]);

export async function validateAndHashEvidence(file: File): Promise<EvidenceMetadata> {
  const maxBytes = 10 * 1024 * 1024;
  if (file.size === 0 || file.size > maxBytes) {
    throw new Error('Each file must be non-empty and no larger than 10 MB.');
  }

  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  const format = acceptedFormats.get(extension);
  if (!format || file.type !== format.type) {
    throw new Error('Only matching PNG, JPEG, PDF, and plain-text files are supported.');
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (format.signature.length && !format.signature.every((byte, index) => bytes[index] === byte)) {
    throw new Error(`The contents of "${file.name}" do not match its file type.`);
  }
  if (extension === '.txt') {
    if (bytes.includes(0)) {
      throw new Error(`"${file.name}" is not a plain-text file.`);
    }
    try {
      new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    } catch {
      throw new Error(`"${file.name}" is not valid UTF-8 text.`);
    }
  }

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const sha256 = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
  return {
    id: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    sha256,
    uploadedAt: new Date().toISOString(),
  };
}
