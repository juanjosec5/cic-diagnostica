import { company, whatsappMessages, type WhatsAppIntent } from '../data/site';

/** Builds a wa.me link with a prefilled message for the given intent. */
export function waLink(intent: WhatsAppIntent = 'general'): string {
  return `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(whatsappMessages[intent])}`;
}
