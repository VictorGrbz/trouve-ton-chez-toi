"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { uploaderPhotoBien } from "@/lib/minio";

const texteOptionnel = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().trim().max(max).optional(),
  );

const nombreOptionnel = (schema: z.ZodNumber) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    schema.optional(),
  );

const enumOptionnel = <T extends [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.enum(values).optional());

const creerBienSchema = z.object({
  projetAchatId: z.preprocess((v) => Number(v), z.number().int().positive()),
  titre: z.string().trim().min(1, "Le titre est requis."),
  adresse: texteOptionnel(500),
  lienAnnonce: texteOptionnel(2000),
  texteAnnonceColle: texteOptionnel(20000),
  prixAffiche: nombreOptionnel(z.number().nonnegative()),
  surfaceM2: nombreOptionnel(z.number().nonnegative()),
  nbPieces: nombreOptionnel(z.number().int().nonnegative()),
  typeBien: enumOptionnel(["appartement", "maison"]),
  anneeConstruction: nombreOptionnel(z.number().int().min(1700).max(2100)),
  dpe: enumOptionnel(["A", "B", "C", "D", "E", "F", "G"]),
  notes: texteOptionnel(5000),
});

export interface CreerBienState {
  error: string | null;
}

export async function creerBien(
  _prevState: CreerBienState,
  formData: FormData,
): Promise<CreerBienState> {
  const parsed = creerBienSchema.safeParse({
    projetAchatId: formData.get("projetAchatId"),
    titre: formData.get("titre"),
    adresse: formData.get("adresse"),
    lienAnnonce: formData.get("lienAnnonce"),
    texteAnnonceColle: formData.get("texteAnnonceColle"),
    prixAffiche: formData.get("prixAffiche"),
    surfaceM2: formData.get("surfaceM2"),
    nbPieces: formData.get("nbPieces"),
    typeBien: formData.get("typeBien"),
    anneeConstruction: formData.get("anneeConstruction"),
    dpe: formData.get("dpe"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }
  const data = parsed.data;
  const copropriete = formData.get("copropriete") === "on";

  const { rows } = await db.query<{ id: string }>(
    `INSERT INTO bien (
      projet_achat_id, titre, adresse, lien_annonce, texte_annonce_colle,
      prix_affiche, surface_m2, nb_pieces, type_bien, annee_construction,
      dpe, copropriete, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING id`,
    [
      data.projetAchatId,
      data.titre,
      data.adresse ?? null,
      data.lienAnnonce ?? null,
      data.texteAnnonceColle ?? null,
      data.prixAffiche ?? null,
      data.surfaceM2 ?? null,
      data.nbPieces ?? null,
      data.typeBien ?? null,
      data.anneeConstruction ?? null,
      data.dpe ?? null,
      copropriete,
      data.notes ?? null,
    ],
  );
  const bienId = Number(rows[0].id);

  const photos = formData
    .getAll("photos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  for (const photo of photos) {
    const { objectKey, url } = await uploaderPhotoBien(bienId, photo);
    await db.query(
      `INSERT INTO bien_photo (bien_id, object_key, url) VALUES ($1, $2, $3)`,
      [bienId, objectKey, url],
    );
  }

  redirect(`/biens/${bienId}`);
}
