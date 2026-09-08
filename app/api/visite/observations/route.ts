import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";

const bodySchema = z.object({
  bienId: z.number().int().positive(),
  clientId: z.string().uuid(),
  checklistItemId: z.string().min(1),
  coche: z.boolean(),
  incertain: z.boolean(),
  note: z.string().max(5000),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  }
  const { bienId, clientId, checklistItemId, coche, incertain, note } = parsed.data;

  await db.query(
    `INSERT INTO visite_observation (bien_id, client_id, checklist_item_id, coche, incertain, note)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (client_id) DO UPDATE
       SET coche = EXCLUDED.coche,
           incertain = EXCLUDED.incertain,
           note = EXCLUDED.note,
           updated_at = now()`,
    [bienId, clientId, checklistItemId, coche, incertain, note || null],
  );

  return NextResponse.json({ ok: true });
}
