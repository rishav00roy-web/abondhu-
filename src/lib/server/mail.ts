import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

let transport: Transporter | null = null;

/**
 * Sends a plain-text email through Gmail (or any SMTP server). Off until
 * SMTP_USER and SMTP_PASS are set on the server; then returns false without sending.
 */
export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return false;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  await transport.sendMail({ from: `Abondhu <${user}>`, to, subject, text });
  return true;
}
