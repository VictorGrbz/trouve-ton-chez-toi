import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { uploaderPhotoBien } from "@/lib/minio";

const champsSchema = z.object({
  bienId: z.preprocess((v) => Number(v), z.number().int().positive()),
  clientId: z.string().uuid(),
  checklistItemId: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.string().optional()),
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = champsSchema.safeParse({
    bienId: formData.get("bienId"),
    clientId: formData.get("clientId"),
    checklistItemId: formData.get("checklistItemId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "Photo manquante." }, { status: 400 });
  }
  const { bienId, clientId, checklistItemId } = parsed.data;

  const { rows: existantes } = await db.query<{ id: string }>(
    `SELECT id FROM bien_photo WHERE client_id = $1`,
    [clientId],
  );
  if (existantes.length > 0) {
    // Déjà synchronisée lors d'une tentative précédente : réponse idempotente,
    // pas de ré-upload MinIO.
    return NextResponse.json({ ok: true });
  }

  const { objectKey, url } = await uploaderPhotoBien(bienId, photo);
  await db.query(
    `INSERT INTO bien_photo (bien_id, object_key, url, checklist_item_id, client_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [bienId, objectKey, url, checklistItemId ?? null, clientId],
  );

  return NextResponse.json({ ok: true });
}
