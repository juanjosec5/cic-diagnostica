/**
 * Visitor consent for optional third parties (analytics and the Google Maps embed).
 * Stored in localStorage as { v, analytics, ts }. Bump CONSENT_VERSION when the tools or purposes
 * change so every visitor is asked again. See docs/privacy-plan.md.
 */

export const CONSENT_KEY = 'cic-consent';
export const CONSENT_VERSION = 1;
export const CONSENT_EVENT = 'cic:consent';

export type ConsentChoice = 'granted' | 'denied';

/** The stored choice for the current version, or null if the visitor hasn't chosen (or storage is blocked). */
export function readConsent(): ConsentChoice | null {
  try {
    const stored = JSON.parse(localStorage.getItem(CONSENT_KEY) ?? 'null');
    return stored?.v === CONSENT_VERSION ? stored.analytics : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: ConsentChoice): void {
  const previous = readConsent();
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, analytics: choice, ts: new Date().toISOString() }));
  } catch {
    // Storage blocked (private mode): the choice still applies to this page view.
  }
  // Scripts already running can't be unloaded, so withdrawing consent reloads the page without them.
  if (previous === 'granted' && choice === 'denied') {
    location.reload();
    return;
  }
  window.dispatchEvent(new CustomEvent<ConsentChoice>(CONSENT_EVENT, { detail: choice }));
}

/** Runs `callback` once: now if consent was already granted, or when the visitor accepts later. */
export function whenConsentGranted(callback: () => void): void {
  if (readConsent() === 'granted') {
    callback();
    return;
  }
  const listener = (event: Event) => {
    if ((event as CustomEvent<ConsentChoice>).detail !== 'granted') return;
    window.removeEventListener(CONSENT_EVENT, listener);
    callback();
  };
  window.addEventListener(CONSENT_EVENT, listener);
}
