import "server-only";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

/**
 * Email delivery via AWS SES (v2).
 *
 *  • Enabled when ENQUIRY_FROM is set to an address/domain you've verified in
 *    SES. Until then `mailEnabled` is false and the enquiry route logs the
 *    message instead — the site, DB and WhatsApp fallback all keep working.
 *  • Credentials resolve through the standard AWS chain: an IAM role when
 *    running on EC2 / ECS / Lambda (no keys in env — preferred), or
 *    AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY locally.
 *  • Region comes from AWS_SES_REGION (or AWS_REGION); it MUST be the region
 *    where your SES sending identity is verified. Defaults to ap-south-1
 *    (Mumbai). AWS_SES_ENDPOINT can override the endpoint (LocalStack/tests).
 */

export const mailEnabled = !!process.env.ENQUIRY_FROM;

let client: SESv2Client | null = null;
function getClient(): SESv2Client {
  if (!client) {
    client = new SESv2Client({
      region: process.env.AWS_SES_REGION || process.env.AWS_REGION || "ap-south-1",
      ...(process.env.AWS_SES_ENDPOINT ? { endpoint: process.env.AWS_SES_ENDPOINT } : {}),
    });
  }
  return client;
}

export interface MailInput {
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail(m: MailInput): Promise<string | undefined> {
  const out = await getClient().send(
    new SendEmailCommand({
      FromEmailAddress: m.from,
      Destination: { ToAddresses: [m.to] },
      ReplyToAddresses: m.replyTo ? [m.replyTo] : undefined,
      Content: {
        Simple: {
          Subject: { Data: m.subject, Charset: "UTF-8" },
          Body: {
            Text: { Data: m.text, Charset: "UTF-8" },
            ...(m.html ? { Html: { Data: m.html, Charset: "UTF-8" } } : {}),
          },
        },
      },
    })
  );
  return out.MessageId;
}
