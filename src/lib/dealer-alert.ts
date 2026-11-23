// The "new pickup near you" message sent to dealers, by email and on WhatsApp.
// Plain functions with no imports, so they run on the server, in the browser and in `npm test`.

export const ALERT_TITLE = "New pickup near you";

/** "Gar-Ali, 785001", or just the pincode when the area has no name. */
export const placeLabel = (pincode: string, area?: string | null) => (area ? `${area}, ${pincode}` : pincode);

/** One message for every channel. Holds no customer address or phone: only the dealer who accepts sees those. */
export function alertText(o: { place: string; note: string | null; code: string; siteUrl: string }): string {
  return [
    `${ALERT_TITLE}: ${o.place}.`,
    o.note ?? "",
    "",
    "Open Abondhu and tap Accept to take it. The first dealer to accept gets it.",
    `${o.siteUrl}/partner`,
    "",
    `Booking ${o.code}`,
  ].join("\n").replace(/\n{3,}/g, "\n\n");
}

/** wa.me link that opens WhatsApp with the message ready to send to this +91 number. */
export const whatsappLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
