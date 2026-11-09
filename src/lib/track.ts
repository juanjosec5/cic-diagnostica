// Analytics events, named as GA4's recommended events (search, add_to_cart, generate_lead). Does nothing until
// GA4's gtag is on the page (planned, after consent); the catalog already reports what we'll want to measure.
declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params?: Record<string, unknown>) => void;
  }
}

export function track(name: string, params?: Record<string, unknown>) {
  window.gtag?.('event', name, params);
}
