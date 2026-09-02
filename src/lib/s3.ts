import "server-only";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Résumé storage on AWS S3.
 *
 *  • Enabled when CAREERS_S3_BUCKET is set. Until then `s3Enabled` is false and
 *    the apply route simply doesn't persist the file (the parsed text/fields
 *    are still saved); nothing breaks during setup.
 *  • Credentials resolve through the standard AWS chain — an IAM role on
 *    EC2/ECS/Amplify (preferred, no keys in env) or AWS_ACCESS_KEY_ID /
 *    AWS_SECRET_ACCESS_KEY locally. The role needs s3:PutObject + s3:GetObject
 *    on the bucket.
 *  • Region: AWS_S3_REGION → AWS_SES_REGION → AWS_REGION → ap-south-1.
 *  • Objects are written with server-side encryption (AES256) and are private;
 *    the admin downloads them through short-lived pre-signed URLs, so the
 *    bucket never needs public access.
 */

export const s3Enabled = !!process.env.CAREERS_S3_BUCKET;
const BUCKET = process.env.CAREERS_S3_BUCKET || "";
const PREFIX = (process.env.CAREERS_S3_PREFIX || "resumes").replace(/^\/+|\/+$/g, "");

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region:
        process.env.AWS_S3_REGION ||
        process.env.AWS_SES_REGION ||
        process.env.AWS_REGION ||
        "ap-south-1",
    });
  }
  return client;
}

const EXT: Record<string, string> = { pdf: "pdf", docx: "docx", doc: "doc" };

/** Build a safe, collision-resistant object key from the application ref. */
export function resumeKey(ref: string, kind: string, year: number, month: number): string {
  const mm = String(month).padStart(2, "0");
  const ext = EXT[kind] || "bin";
  const safeRef = ref.replace(/[^A-Za-z0-9._-]/g, "");
  return `${PREFIX}/${year}/${mm}/${safeRef}.${ext}`;
}

const CONTENT_TYPE: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
};

export async function uploadResume(
  key: string,
  body: Uint8Array,
  kind: string,
  originalName: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: CONTENT_TYPE[kind] || "application/octet-stream",
      ServerSideEncryption: "AES256",
      // Suggest a download filename without exposing it in the URL.
      ContentDisposition: `attachment; filename="${originalName.replace(/["\\\r\n]/g, "")}"`,
      Metadata: { app: "branditbro-careers" },
    })
  );
}

/** Short-lived (default 5 min) pre-signed GET URL for the admin panel. */
export async function signedResumeUrl(key: string, expiresIn = 300): Promise<string> {
  return getSignedUrl(getClient(), new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn });
}
