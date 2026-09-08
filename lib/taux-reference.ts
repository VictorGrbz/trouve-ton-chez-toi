import { db } from "@/db";

export interface TauxReferenceActuel {
  valeurPct: number;
  /** "AAAA-MM" */
  moisReference: string;
  sourceUrl: string;
}

/**
 * Dernier taux de référence synchronisé (Banque de France, statistiques des
 * nouveaux crédits à l'habitat — voir db/sync-taux-reference.mjs).
 * Retourne null si aucune synchronisation n'a encore eu lieu ; les modules
 * de calcul retombent alors sur leur taux indicatif par défaut.
 */
export async function obtenirTauxReferenceActuel(): Promise<TauxReferenceActuel | null> {
  const { rows } = await db.query<{
    valeur_pct: string;
    mois_reference: string;
    source_url: string;
  }>(
    `SELECT valeur_pct, mois_reference, source_url
     FROM taux_reference
     ORDER BY mois_reference DESC
     LIMIT 1`,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    valeurPct: Number(row.valeur_pct),
    moisReference: row.mois_reference,
    sourceUrl: row.source_url,
  };
}

const MOIS_LABEL_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** "2026-07" -> "juillet 2026" */
export function formaterMoisReference(moisReference: string): string {
  const [annee, mois] = moisReference.split("-");
  const label = MOIS_LABEL_FR[Number(mois) - 1] ?? mois;
  return `${label} ${annee}`;
}
