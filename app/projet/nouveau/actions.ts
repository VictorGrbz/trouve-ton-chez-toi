"use server";

import { z } from "zod";
import { db } from "@/db";
import { calculerEnveloppeBudget, type Persona } from "@/lib/budget";

const creerProjetSchema = z
  .object({
    persona: z.enum(["solo", "couple", "investisseur"] as const satisfies readonly Persona[]),
    nomProjet: z.string().trim().max(200).optional(),
    zoneRecherche: z.string().trim().min(1, "La zone de recherche est requise."),
    revenuMensuel1: z.number().positive("Le revenu doit être supérieur à 0."),
    situationPro1: z.string().trim().max(200).optional(),
    revenuMensuel2: z.number().nonnegative().optional(),
    situationPro2: z.string().trim().max(200).optional(),
    apport: z.number().nonnegative(),
    budgetCible: z.number().nonnegative().optional(),
    rendementLocatifVisePct: z.number().nonnegative().max(100).optional(),
  })
  .refine((data) => data.persona === "couple" || data.revenuMensuel2 === undefined, {
    message: "Le second revenu n'est utilisé que pour le persona couple.",
    path: ["revenuMensuel2"],
  })
  .refine(
    (data) => data.persona === "investisseur" || data.rendementLocatifVisePct === undefined,
    {
      message: "Le rendement locatif n'est utilisé que pour le persona investisseur.",
      path: ["rendementLocatifVisePct"],
    },
  );

export type CreerProjetInput = z.input<typeof creerProjetSchema>;

export type CreerProjetResult =
  | { ok: true; enveloppeBudgetMax: number; fraisAcquisitionEstimes: number; margeSecuriteMontant: number }
  | { ok: false; error: string };

export async function creerProjetAchat(
  input: CreerProjetInput,
): Promise<CreerProjetResult> {
  const parsed = creerProjetSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Saisie invalide." };
  }
  const data = parsed.data;

  const resultat = calculerEnveloppeBudget({
    persona: data.persona,
    revenuMensuel1: data.revenuMensuel1,
    revenuMensuel2: data.persona === "couple" ? data.revenuMensuel2 ?? 0 : null,
    apport: data.apport,
    rendementLocatifVisePct:
      data.persona === "investisseur" ? data.rendementLocatifVisePct ?? null : null,
  });

  await db.query(
    `INSERT INTO projet_achat (
      persona, nom_projet, zone_recherche,
      revenu_mensuel_1, situation_pro_1,
      revenu_mensuel_2, situation_pro_2,
      apport, budget_cible, rendement_locatif_vise_pct,
      enveloppe_budget_max, frais_acquisition_estimes, marge_securite_montant,
      hypotheses_calcul
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      data.persona,
      data.nomProjet ?? null,
      data.zoneRecherche,
      data.revenuMensuel1,
      data.situationPro1 ?? null,
      data.persona === "couple" ? data.revenuMensuel2 ?? null : null,
      data.persona === "couple" ? data.situationPro2 ?? null : null,
      data.apport,
      data.budgetCible ?? null,
      data.persona === "investisseur" ? data.rendementLocatifVisePct ?? null : null,
      resultat.enveloppeBudgetMax,
      resultat.fraisAcquisitionEstimes,
      resultat.margeSecuriteMontant,
      JSON.stringify(resultat.hypotheses),
    ],
  );

  return {
    ok: true,
    enveloppeBudgetMax: resultat.enveloppeBudgetMax,
    fraisAcquisitionEstimes: resultat.fraisAcquisitionEstimes,
    margeSecuriteMontant: resultat.margeSecuriteMontant,
  };
}
