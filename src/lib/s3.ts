import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_ENDPOINT = process.env.S3_ENDPOINT || "";
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || "";
const S3_SECRET_KEY = process.env.S3_SECRET_KEY || "";
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_REGION = process.env.S3_REGION || "auto";
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || ""; // e.g. https://ipoa-upload.cn-nb1.rains3.com

let _client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!_client) {
    if (!S3_ENDPOINT || !S3_ACCESS_KEY || !S3_SECRET_KEY || !S3_BUCKET) {
      throw new Error("S3 环境变量未配置（S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET）");
    }
    _client = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });
  }
  return _client;
}

export function getS3PublicUrl(key: string): string {
  if (S3_PUBLIC_URL) {
    return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
  }
  const endpoint = S3_ENDPOINT.replace(/\/$/, "");
  return `${endpoint}/${S3_BUCKET}/${key}`;
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 600,
  maxSizeBytes?: number
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
    ...(maxSizeBytes ? { ContentLengthUpperBound: maxSizeBytes } : {}),
  });
  return getSignedUrl(getS3Client(), command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
  });
  await getS3Client().send(command);
}

export function getKeyFromUrl(url: string): string | null {
  if (S3_PUBLIC_URL) {
    const prefix = `${S3_PUBLIC_URL.replace(/\/$/, "")}/`;
    if (url.startsWith(prefix)) {
      return url.slice(prefix.length);
    }
  }
  const endpoint = S3_ENDPOINT.replace(/\/$/, "");
  const prefix = `${endpoint}/${S3_BUCKET}/`;
  if (url.startsWith(prefix)) {
    return url.slice(prefix.length);
  }
  return null;
}

export function isS3FileUrl(url: string): boolean {
  if (S3_PUBLIC_URL && url.startsWith(S3_PUBLIC_URL)) return true;
  return url.includes("rains3.com/") && !url.includes("rains3.com/ipoa_upload/");
}
