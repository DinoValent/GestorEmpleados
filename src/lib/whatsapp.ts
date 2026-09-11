const CONTACT_WHATSAPP_NUMBER = "5493400446008";

export function planWhatsAppHref(nombre: string): string {
  const text = encodeURIComponent(
    `Hola! Quiero más información sobre el plan ${nombre} de Puntual.`
  );
  return `https://wa.me/${CONTACT_WHATSAPP_NUMBER}?text=${text}`;
}
