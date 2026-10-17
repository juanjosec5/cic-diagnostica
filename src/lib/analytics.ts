type EventData = Record<string, string | number>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventData) => void };
  }
}

/** Sends a custom event to Umami. No-op when the tracker isn't loaded (dev, previews, ad blockers). */
export function track(event: string, data?: EventData): void {
  window.umami?.track(event, data);
}
