"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/db";

const ajouterObservationSchema = z.object({
  bienId: z.preprocess((v) => Number(v), z.number().int().positive()),
  auteurNom: z.string().trim().min(1, "Le nom de l'auteur est requis.").max(100),
  texte: z.string().trim().min(1, "L'observation ne peut pas être vide.").max(5000),
});

export interface AjouterObservationState {
  error: string | null;
}

export async function ajouterObservation(
  _prevState: AjouterObservationState,
  formData: FormData,
): Promise<AjouterObservationState> {
  const parsed = ajouterObservationSchema.safeParse({
    bienId: formData.get("bienId"),
    auteurNom: formData.get("auteurNom"),
    texte: formData.get("texte"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }
  const { bienId, auteurNom, texte } = parsed.data;

  await db.query(
    `INSERT INTO observation (bien_id, auteur_nom, texte) VALUES ($1, $2, $3)`,
    [bienId, auteurNom, texte],
  );

  redirect(`/biens/${bienId}/observations`);
}
