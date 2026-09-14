export const CONTACT_WHATSAPP_NUMBER = "5493364603631";
export const CONTACT_WHATSAPP_DISPLAY = "+54 9 3364 60-3631";

export function planWhatsAppHref(nombre: string): string {
  const text = encodeURIComponent(
    `Vi los planes que tienen y me gustaría obtener el plan ${nombre}.`
  );
  return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${text}`;
}
