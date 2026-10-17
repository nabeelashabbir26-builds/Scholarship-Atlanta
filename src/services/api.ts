import { Scholarship, VerificationStatus } from '../types/scholarship';
import { INITIAL_SCHOLARSHIPS } from '../data/initialScholarships';

const ADMIN_TOKEN_KEY = 'satlas_admin_token';

export function getStoredAdminToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAdminToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

const CACHED_SCHOLARSHIPS_KEY = 'satlas_cached_scholarships_v1';

/**
 * Fetch all scholarships from the backend.
 * Uses service worker caching and localStorage offline backup.
 */
export async function fetchScholarships(): Promise<Scholarship[]> {
  try {
    const res = await fetch('/api/scholarships');
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const data = await res.json();
    const list = data.scholarships || [];
    if (Array.isArray(list) && list.length > 0) {
      try {
        localStorage.setItem(CACHED_SCHOLARSHIPS_KEY, JSON.stringify(list));
      } catch {
        // ignore quota errors
      }
      return list;
    }
    return list;
  } catch (err) {
    console.warn('[API] Failed to fetch /api/scholarships (network offline or unreachable). Loading cached listings:', err);
    try {
      const raw = localStorage.getItem(CACHED_SCHOLARSHIPS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_SCHOLARSHIPS;
  }
}

/**
 * Check admin server authentication status
 */
export async function checkAdminStatus(): Promise<{ authenticated: boolean; role: string; hint?: string }> {
  try {
    const token = getStoredAdminToken();
    const res = await fetch('/api/admin/status', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      return { authenticated: false, role: 'guest' };
    }
    return await res.json();
  } catch {
    return { authenticated: false, role: 'guest' };
  }
}

/**
 * Admin login with server verification
 */
export async function loginAdmin(password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || data.error || 'Authentication failed' };
    }

    setStoredAdminToken(data.token);
    return { success: true, token: data.token };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during admin login' };
  }
}

/**
 * Admin logout
 */
export async function logoutAdmin(): Promise<void> {
  setStoredAdminToken(null);
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
  } catch {
    // ignore
  }
}

/**
 * Admin update scholarship verification status (Server-authorized only!)
 */
export async function updateVerificationStatus(
  id: string,
  status: VerificationStatus,
  reviewedBy: string = 'Editorial Admin'
): Promise<{ success: boolean; updated?: Scholarship; error?: string }> {
  const token = getStoredAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin authentication token missing. Please sign in.' };
  }

  try {
    const res = await fetch(`/api/admin/scholarships/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, reviewedBy }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { success: false, error: errData.message || errData.error };
    }

    const updated = await res.json();
    return { success: true, updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin create new scholarship (Server-authorized only!)
 */
export async function createScholarship(
  scholarship: Partial<Scholarship>
): Promise<{ success: boolean; created?: Scholarship; error?: string }> {
  const token = getStoredAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin authentication token missing. Please sign in.' };
  }

  try {
    const res = await fetch('/api/admin/scholarships', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(scholarship),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { success: false, error: errData.message || errData.error };
    }

    const created = await res.json();
    return { success: true, created };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin update existing scholarship (Server-authorized only!)
 */
export async function editScholarship(
  id: string,
  data: Partial<Scholarship>
): Promise<{ success: boolean; updated?: Scholarship; error?: string }> {
  const token = getStoredAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin authentication token missing.' };
  }

  try {
    const res = await fetch(`/api/admin/scholarships/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { success: false, error: errData.message || errData.error };
    }

    const updated = await res.json();
    return { success: true, updated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin delete scholarship (Server-authorized only!)
 */
export async function deleteScholarship(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const token = getStoredAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin authentication token missing.' };
  }

  try {
    const res = await fetch(`/api/admin/scholarships/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { success: false, error: errData.message || errData.error };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Admin AI-assisted extraction workflow (Server-authorized only!)
 */
export async function extractScholarshipAI(payload: {
  sourceUrl?: string;
  sourceContent?: string;
  notes?: string;
}): Promise<{ success: boolean; extracted?: Scholarship; aiPowered?: boolean; error?: string }> {
  const token = getStoredAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin authentication token missing.' };
  }

  try {
    const res = await fetch('/api/admin/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.message || data.error || 'AI extraction failed' };
    }

    return { success: true, extracted: data.extracted, aiPowered: data.aiPowered };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Reset scholarships to original default records
 */
export async function resetSampleRecords(): Promise<{ success: boolean; count?: number; error?: string }> {
  const token = getStoredAdminToken();
  if (!token) {
    return { success: false, error: 'Unauthorized: Admin authentication token missing.' };
  }

  try {
    const res = await fetch('/api/admin/reset-samples', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      return { success: false, error: errData.message || errData.error };
    }

    const data = await res.json();
    return { success: true, count: data.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
