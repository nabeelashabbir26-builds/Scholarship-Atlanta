import { ApplicationTrackingStatus, SavedScholarshipItem } from '../types/scholarship';

const STORAGE_KEY = 'scholarship_atlas_saved_v1';
const BACKUP_KEY = 'scholarship_atlas_corrupt_backup';

// In-memory fallback if localStorage is disabled, restricted, or throws SecurityError
let memoryStorage: SavedScholarshipItem[] = [];
let isLocalStorageAvailable = true;

// Check availability once
try {
  const testKey = '__satlas_test__';
  window.localStorage.setItem(testKey, testKey);
  window.localStorage.removeItem(testKey);
} catch {
  isLocalStorageAvailable = false;
  console.warn('[Scholarship Atlas] LocalStorage is unavailable. Using in-memory fallback.');
}

const DEFAULT_CHECKLIST = [
  { id: 'transcripts', label: 'Certified academic transcripts gathered', completed: false },
  { id: 'references', label: 'Academic / employer reference letters requested', completed: false },
  { id: 'essay', label: 'Motivation letter / Personal statement drafted', completed: false },
  { id: 'language', label: 'English / host language test report (e.g. IELTS/TOEFL)', completed: false },
  { id: 'application', label: 'Official university / portal application submitted', completed: false },
];

/**
 * Safely reads saved scholarships from storage with schema validation.
 */
export function getSavedScholarships(): SavedScholarshipItem[] {
  if (!isLocalStorageAvailable) {
    return [...memoryStorage];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Data format is not an array');
    }

    // Filter and sanitize valid records
    const valid = parsed.filter((item): item is SavedScholarshipItem => {
      return (
        item &&
        typeof item.scholarshipId === 'string' &&
        ['Interested', 'Preparing', 'Applied'].includes(item.status)
      );
    });

    return valid;
  } catch (err) {
    console.error('[Scholarship Atlas] Failed to parse saved items from localStorage:', err);
    // Graceful recovery: preserve raw corrupted string for user recovery, then reset cleanly
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        window.localStorage.setItem(BACKUP_KEY, raw);
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {
      // Ignore secondary error
    }
    return [];
  }
}

function persist(items: SavedScholarshipItem[]): boolean {
  if (!isLocalStorageAvailable) {
    memoryStorage = [...items];
    notifySubscribers();
    return true;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    notifySubscribers();
    return true;
  } catch (err) {
    console.error('[Scholarship Atlas] Error persisting to localStorage:', err);
    memoryStorage = [...items];
    notifySubscribers();
    return false;
  }
}

// Simple subscriber pattern for component reactivity
type StorageListener = () => void;
const subscribers = new Set<StorageListener>();

export function subscribeToSavedItems(listener: StorageListener): () => void {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function notifySubscribers() {
  subscribers.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
}

// Also listen to cross-tab storage events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      notifySubscribers();
    }
  });
}

export function isScholarshipSaved(scholarshipId: string): boolean {
  const items = getSavedScholarships();
  return items.some((item) => item.scholarshipId === scholarshipId);
}

export function getSavedItem(scholarshipId: string): SavedScholarshipItem | undefined {
  const items = getSavedScholarships();
  return items.find((item) => item.scholarshipId === scholarshipId);
}

export function saveScholarship(
  scholarshipId: string,
  initialStatus: ApplicationTrackingStatus = 'Interested'
): void {
  const items = getSavedScholarships();
  const existingIndex = items.findIndex((item) => item.scholarshipId === scholarshipId);

  if (existingIndex >= 0) {
    items[existingIndex].status = initialStatus;
  } else {
    items.unshift({
      scholarshipId,
      status: initialStatus,
      savedAt: new Date().toISOString(),
      notes: '',
      checklist: DEFAULT_CHECKLIST.map((item) => ({ ...item })),
    });
  }

  persist(items);
}

export function unsaveScholarship(scholarshipId: string): void {
  const items = getSavedScholarships();
  const updated = items.filter((item) => item.scholarshipId !== scholarshipId);
  persist(updated);
}

export function updateSavedStatus(
  scholarshipId: string,
  newStatus: ApplicationTrackingStatus
): void {
  const items = getSavedScholarships();
  const target = items.find((item) => item.scholarshipId === scholarshipId);
  if (target) {
    target.status = newStatus;
    persist(items);
  }
}

export function updateSavedNotes(scholarshipId: string, notes: string): void {
  const items = getSavedScholarships();
  const target = items.find((item) => item.scholarshipId === scholarshipId);
  if (target) {
    target.notes = notes;
    persist(items);
  }
}

export function toggleChecklistItem(scholarshipId: string, checklistId: string): void {
  const items = getSavedScholarships();
  const target = items.find((item) => item.scholarshipId === scholarshipId);
  if (target && target.checklist) {
    target.checklist = target.checklist.map((item) =>
      item.id === checklistId ? { ...item, completed: !item.completed } : item
    );
    persist(items);
  }
}

/**
 * Export saved data as downloadable JSON for safety/backup
 */
export function exportSavedData(): string {
  const items = getSavedScholarships();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'Scholarship Atlas',
      version: '1.0',
      savedScholarships: items,
    },
    null,
    2
  );
}

/**
 * Import backup JSON safely
 */
export function importSavedData(jsonString: string): { success: boolean; count: number; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const candidateItems = parsed.savedScholarships || parsed;

    if (!Array.isArray(candidateItems)) {
      return { success: false, count: 0, error: 'Uploaded file does not contain a list of scholarships.' };
    }

    const current = getSavedScholarships();
    const map = new Map<string, SavedScholarshipItem>();

    // Put current items
    current.forEach((it) => map.set(it.scholarshipId, it));

    let importedCount = 0;
    candidateItems.forEach((it: any) => {
      if (it && typeof it.scholarshipId === 'string') {
        map.set(it.scholarshipId, {
          scholarshipId: it.scholarshipId,
          status: ['Interested', 'Preparing', 'Applied'].includes(it.status) ? it.status : 'Interested',
          savedAt: it.savedAt || new Date().toISOString(),
          notes: it.notes || '',
          checklist: Array.isArray(it.checklist) ? it.checklist : DEFAULT_CHECKLIST.map((item) => ({ ...item })),
        });
        importedCount++;
      }
    });

    const combined = Array.from(map.values());
    persist(combined);

    return { success: true, count: importedCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Invalid JSON syntax.' };
  }
}
