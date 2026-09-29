import { ref, update, onValue, serverTimestamp } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { auth, requireDb } from '../config/firebase.js';
import { checkLimit, recordAttempt, formatRetry } from '../utils/rateLimit.js';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, no 0/O/1/I
const SALT = 'arsheon-loan-request:v1';
export const LIMITS = {
  submit: { max: 3, windowMs: 10 * 60 * 1000 },
  lookup: { max: 10, windowMs: 10 * 60 * 1000 },
};

function limitError(name) {
  const r = checkLimit(name, LIMITS[name]);
  if (!r.limited) return null;
  const e = new Error(`Terlalu banyak percobaan. Coba lagi dalam ${formatRetry(r.retryInMs)}.`);
  e.code = 'app/rate-limited';
  return e;
}

export const normalizeRequestId = (v) => String(v ?? '').trim().toUpperCase();
export const normalizeAccessCode = (v) => String(v ?? '').toUpperCase().replace(/[\s-]/g, '');

export function generateAccessCode(length = 10) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function generateRequestId() {
  const n = (crypto.getRandomValues(new Uint32Array(1))[0] % 900000) + 100000;
  return `AR-${new Date().getFullYear()}-${n}`;
}

// The database key of the public status record. Only someone who knows BOTH the
// Request ID and the Access Code can compute it, so records cannot be enumerated.
export async function lookupKey(requestId, accessCode) {
  const input = `${SALT}:${normalizeRequestId(requestId)}:${normalizeAccessCode(accessCode)}`;
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function ensureSession() {
  if (!auth) return requireDb();
  if (!auth.currentUser) await signInAnonymously(auth); // silent; requestor never sees a login
}

export async function submitRequest(form) {
  const db = requireDb();
  const limited = limitError('submit');
  if (limited) throw limited;
  recordAttempt('submit', LIMITS.submit.windowMs);
  await ensureSession();

  const clean = {
    borrowerName: form.borrowerName.trim(),
    businessName: form.businessName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    requestedAmount: Number(form.requestedAmount),
    purpose: form.purpose.trim(),
    businessDescription: form.businessDescription.trim(),
    fundingPlan: form.fundingPlan.trim(),
    additionalNotes: form.additionalNotes.trim(),
  };

  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const requestId = generateRequestId();
    const accessCode = generateAccessCode();
    const key = await lookupKey(requestId, accessCode);
    const ts = serverTimestamp();
    try {
      await update(ref(db), {
        [`loanRequests/${requestId}`]: {
          requestId, ...clean, status: 'SUBMITTED', createdAt: ts, updatedAt: ts, accessTokenHash: key,
        },
        [`publicStatus/${key}`]: {
          requestId, businessName: clean.businessName, requestedAmount: clean.requestedAmount,
          status: 'SUBMITTED', createdAt: ts, updatedAt: ts,
        },
      });
      return { requestId, accessCode };
    } catch (err) {
      lastError = err;
      // A rules rejection here usually means the random ID already exists: retry with a new one.
      if (!String(err?.code).toUpperCase().includes('PERMISSION')) break;
    }
  }
  throw lastError;
}

// Subscribes to ONE request's public status. Returns an unsubscribe function.
export function watchStatus(key, onData, onError) {
  const db = requireDb();
  return onValue(ref(db, `publicStatus/${key}`), (snap) => onData(snap.val()), onError);
}

export function beginLookup() {
  const limited = limitError('lookup');
  if (limited) throw limited;
  recordAttempt('lookup', LIMITS.lookup.windowMs);
}
