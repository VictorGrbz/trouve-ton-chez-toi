import { Client } from "minio";
import { randomUUID } from "node:crypto";

declare global {
  var minioClient: Client | undefined;
}

/**
 * MINIO_ENDPOINT accepte soit une URL complète (ex: http://127.0.0.1:9000,
 * cas du tunnel SSH local — voir PLAN.md), soit un hostname nu (ex:
 * s3.jess-vic.ovh), auquel cas MINIO_PORT/MINIO_USE_SSL s'appliquent.
 */
function resoudreConnexion(): { endPoint: string; port: number; useSSL: boolean } {
  const raw = process.env.MINIO_ENDPOINT!;
  if (raw.includes("://")) {
    const url = new URL(raw);
    const useSSL = url.protocol === "https:";
    return {
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : useSSL ? 443 : 80,
      useSSL,
    };
  }
  return {
    endPoint: raw,
    port: process.env.MINIO_PORT ? Number(process.env.MINIO_PORT) : 443,
    useSSL: process.env.MINIO_USE_SSL !== "false",
  };
}

function creerClient(): Client {
  return new Client({
    ...resoudreConnexion(),
    accessKey: process.env.MINIO_ACCESS_KEY!,
    secretKey: process.env.MINIO_SECRET_KEY!,
  });
}

const minioClient = globalThis.minioClient ?? creerClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.minioClient = minioClient;
}

const BUCKET = process.env.MINIO_BUCKET!;
const PUBLIC_BASE_URL = process.env.MINIO_PUBLIC_BASE_URL!;

export interface PhotoUploadee {
  objectKey: string;
  url: string;
}

/**
 * Upload une photo de bien sur MinIO (self-hosted, img.jess-vic.ovh) et
 * retourne son URL de lecture publique. Le bucket doit déjà exister avec une
 * politique de lecture publique configurée côté MinIO (hors dépôt).
 */
export async function uploaderPhotoBien(
  bienId: number,
  fichier: File,
): Promise<PhotoUploadee> {
  const extension = fichier.name.split(".").pop()?.toLowerCase() || "jpg";
  const objectKey = `biens/${bienId}/${randomUUID()}.${extension}`;
  const buffer = Buffer.from(await fichier.arrayBuffer());

  await minioClient.putObject(BUCKET, objectKey, buffer, buffer.length, {
    "Content-Type": fichier.type || "image/jpeg",
  });

  return { objectKey, url: `${PUBLIC_BASE_URL}/${objectKey}` };
}

/** Utilisé uniquement pour le nettoyage de données de test. */
export async function supprimerPhotoBien(objectKey: string): Promise<void> {
  await minioClient.removeObject(BUCKET, objectKey);
}
