import { company, whatsappMessages, type WhatsAppIntent } from '../data/site';

/** Builds a wa.me link with a prefilled message for the given intent. */
export function waLink(intent: WhatsAppIntent = 'general'): string {
  return waTextLink(whatsappMessages[intent]);
}

/** Builds a wa.me link with any prefilled text (e.g. a specific product). */
export function waTextLink(text: string): string {
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Opens the WhatsApp Business product catalog. */
export function waCatalogLink(): string {
  return `https://wa.me/c/${company.whatsapp}`;
}
