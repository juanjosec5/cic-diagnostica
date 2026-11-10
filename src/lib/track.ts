// Analytics events, named as GA4's recommended events where one fits (search, add_to_cart, begin_checkout,
// generate_lead). window.gtag only exists once GA4 has loaded (after consent, on the production host); until then
// track() does nothing, so calling it is always safe.
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(name: string, params?: Record<string, unknown>) {
  window.gtag?.('event', name, params);
}
