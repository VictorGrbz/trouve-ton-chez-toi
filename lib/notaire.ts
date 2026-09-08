import baremeNotarial from "@/config/bareme-notarial.json";

/**
 * ⚠️ Barème notarial (config/bareme-notarial.json) : mise à jour MANUELLE
 * UNIQUEMENT. Ne jamais scraper/automatiser cette donnée.
 * Avant toute mise en production : vérifier les valeurs sur
 * https://www.service-public.gouv.fr/particuliers/vosdroits/R54267
 * et mettre à jour le champ "verifie_le" du barème concerné.
 * Le barème change par arrêté ministériel tous les 1 à 2 ans environ.
 *
 * Couvre uniquement l'immobilier ANCIEN. Le neuf suit un régime de TVA
 * immobilière totalement différent, hors périmètre de ce module.
 */

interface BaremeDate {
  date_debut: string;
  date_fin: string | null;
  verifie_le: string;
}

interface TrancheEmoluments {
  seuil_min: number;
  seuil_max: number | null;
  taux_pct: number;
}

interface BaremeEmoluments extends BaremeDate {
  source: string;
  tranches: TrancheEmoluments[];
}

interface BaremeDmto extends BaremeDate {
  source: string;
  taux_departemental_defaut_pct: number;
  taux_departemental_par_departement: Record<string, number>;
}

const AGE_MAX_VERIFICATION_MOIS = 18;

function trouverBaremeActif<T extends BaremeDate>(baremes: T[], date: Date): T {
  const bareme = baremes.find((b) => {
    const debut = new Date(b.date_debut);
    const fin = b.date_fin ? new Date(b.date_fin) : null;
    return date >= debut && (fin === null || date < fin);
  });
  if (!bareme) {
    throw new Error(
      `Aucun barème notarial ne couvre la date ${date.toISOString()}.`,
    );
  }
  return bareme;
}

function avertirSiBaremePerime(label: string, verifieLe: string): void {
  if (process.env.NODE_ENV === "production") return;
  const ageMs = Date.now() - new Date(verifieLe).getTime();
  const ageMois = ageMs / (1000 * 60 * 60 * 24 * 30);
  if (Number.isNaN(ageMois) || ageMois > AGE_MAX_VERIFICATION_MOIS) {
    console.warn(
      `[lib/notaire] Barème "${label}" vérifié le ${verifieLe} — plus de ${AGE_MAX_VERIFICATION_MOIS} mois, à revérifier manuellement sur Service-Public.fr avant mise en production.`,
    );
  }
}

export interface CalculFraisNotaireInput {
  prixBien: number;
  /** Code département ("75", "2A"...). null/absent = taux national par défaut. */
  departement?: string | null;
  dateSimulation?: Date;
}

export interface CalculFraisNotaireResult {
  fraisNotaireTotal: number;
  detail: {
    emolumentsNotaireHT: number;
    tvaEmoluments: number;
    emolumentsNotaireTTC: number;
    dmto: number;
    csi: number;
    debours: number;
  };
  hypotheses: {
    departementUtilise: string | null;
    departementConnu: boolean;
    tauxDepartementalDmtoPct: number;
    tauxEffectifTotalPct: number;
    baremeEmolumentsDatesValidite: { debut: string; finOuIndefini: string | null };
    baremeDmtoDatesValidite: { debut: string; finOuIndefini: string | null };
    baremeVerifieLe: string;
  };
}

/**
 * Calcule les émoluments du notaire de façon progressive par tranche
 * (comme un barème d'impôt), pas en cherchant "la" tranche du prix.
 */
function calculerEmolumentsHT(prixBien: number, tranches: TrancheEmoluments[]): number {
  let total = 0;
  for (const tranche of tranches) {
    if (prixBien <= tranche.seuil_min) continue;
    const plafond = tranche.seuil_max ?? prixBien;
    const assiette = Math.min(prixBien, plafond) - tranche.seuil_min;
    total += assiette * (tranche.taux_pct / 100);
  }
  return total;
}

export function calculerFraisNotaire(
  input: CalculFraisNotaireInput,
): CalculFraisNotaireResult {
  const date = input.dateSimulation ?? new Date();

  const baremeEmoluments = trouverBaremeActif(
    baremeNotarial.emoluments_notaire.baremes as BaremeEmoluments[],
    date,
  );
  const baremeDmto = trouverBaremeActif(
    baremeNotarial.dmto.baremes as BaremeDmto[],
    date,
  );

  avertirSiBaremePerime("emoluments_notaire", baremeEmoluments.verifie_le);
  avertirSiBaremePerime("dmto", baremeDmto.verifie_le);

  const emolumentsNotaireHT = calculerEmolumentsHT(
    input.prixBien,
    baremeEmoluments.tranches,
  );
  const tvaEmoluments =
    emolumentsNotaireHT * (baremeNotarial.emoluments_notaire.tva_pct / 100);
  const emolumentsNotaireTTC = emolumentsNotaireHT + tvaEmoluments;

  const departementConnu =
    input.departement != null &&
    input.departement in baremeDmto.taux_departemental_par_departement;
  const tauxDepartementalDmtoPct = departementConnu
    ? baremeDmto.taux_departemental_par_departement[input.departement as string]
    : baremeDmto.taux_departemental_defaut_pct;

  const tauxTotalDmtoPct =
    tauxDepartementalDmtoPct *
      (1 + baremeNotarial.dmto.frais_assiette_pct_du_taux_departemental / 100) +
    baremeNotarial.dmto.taxe_communale_pct;
  const dmto = input.prixBien * (tauxTotalDmtoPct / 100);

  const csi = input.prixBien * (baremeNotarial.csi_pct / 100);
  const debours = baremeNotarial.debours_forfait_eur;

  const fraisNotaireTotal = emolumentsNotaireTTC + dmto + csi + debours;

  return {
    fraisNotaireTotal: Math.round(fraisNotaireTotal),
    detail: {
      emolumentsNotaireHT: Math.round(emolumentsNotaireHT),
      tvaEmoluments: Math.round(tvaEmoluments),
      emolumentsNotaireTTC: Math.round(emolumentsNotaireTTC),
      dmto: Math.round(dmto),
      csi: Math.round(csi),
      debours,
    },
    hypotheses: {
      departementUtilise: input.departement ?? null,
      departementConnu,
      tauxDepartementalDmtoPct,
      tauxEffectifTotalPct:
        Math.round((fraisNotaireTotal / input.prixBien) * 10000) / 100,
      baremeEmolumentsDatesValidite: {
        debut: baremeEmoluments.date_debut,
        finOuIndefini: baremeEmoluments.date_fin,
      },
      baremeDmtoDatesValidite: {
        debut: baremeDmto.date_debut,
        finOuIndefini: baremeDmto.date_fin,
      },
      baremeVerifieLe: baremeDmto.verifie_le,
    },
  };
}
