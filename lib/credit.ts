/**
 * Capacité d'emprunt, mensualité et coût du crédit — calcul déterministe,
 * aucun appel IA. Toutes les valeurs restent des hypothèses indicatives non
 * engageantes (pas un accord de prêt, pas un conseil financier personnalisé).
 *
 * Hors périmètre volontaire : abattement bancaire sur revenus locatifs
 * projetés (persona investisseur), charges de crédit existantes — aucune
 * charge de crédit en cours n'est prise en compte à ce stade.
 */

export const TAUX_EFFORT_PLAFOND_HCSF_PCT = 35;

const DUREE_ANS_DEFAUT = 25;
const TAUX_INTERET_ANNUEL_PCT_DEFAUT = 3.5;
const TAUX_ASSURANCE_ANNUEL_PCT_DEFAUT = 0.30;

export interface CalculCapaciteEmpruntInput {
  revenuMensuelTotal: number;
  dureeAns?: number;
  tauxInteretAnnuelPct?: number;
  /** Taux annuel appliqué au capital initial (méthode française classique). */
  tauxAssuranceAnnuelPct?: number;
  /** Clampé à TAUX_EFFORT_PLAFOND_HCSF_PCT si une valeur supérieure est demandée. */
  tauxEffortMaxPct?: number;
}

export interface CalculCapaciteEmpruntResult {
  capaciteEmpruntMax: number;
  mensualiteCreditHorsAssurance: number;
  mensualiteAssurance: number;
  mensualiteTotale: number;
  coutTotalInterets: number;
  coutTotalAssurance: number;
  tauxEffortEffectifPct: number;
  hypotheses: {
    dureeAns: number;
    tauxInteretAnnuelPct: number;
    tauxAssuranceAnnuelPct: number;
    tauxEffortMaxPct: number;
  };
}

/**
 * Dérivation de la formule fermée (évite un solveur itératif) :
 * Soit M la mensualité totale plafonnée (crédit + assurance), A le facteur
 * d'annuité ((1-(1+i)^-n)/i), et a le taux d'assurance mensuel appliqué au
 * capital initial. L'assurance mensuelle vaut capital × a, donc la mensualité
 * crédit seule vaut M - capital×a, et le capital empruntable est celui dont
 * l'annuité (M - capital×a) rembourse exactement le capital sur n mois :
 *   capital = (M - capital×a) × A
 *   capital = M×A - capital×a×A
 *   capital × (1 + a×A) = M×A
 *   capital = M×A / (1 + a×A)
 */
export function calculerCapaciteEmprunt(
  input: CalculCapaciteEmpruntInput,
): CalculCapaciteEmpruntResult {
  const dureeAns = input.dureeAns ?? DUREE_ANS_DEFAUT;
  const tauxInteretAnnuelPct =
    input.tauxInteretAnnuelPct ?? TAUX_INTERET_ANNUEL_PCT_DEFAUT;
  const tauxAssuranceAnnuelPct =
    input.tauxAssuranceAnnuelPct ?? TAUX_ASSURANCE_ANNUEL_PCT_DEFAUT;
  const tauxEffortMaxPct = Math.min(
    input.tauxEffortMaxPct ?? TAUX_EFFORT_PLAFOND_HCSF_PCT,
    TAUX_EFFORT_PLAFOND_HCSF_PCT,
  );

  const nbMensualites = dureeAns * 12;
  const tauxMensuel = tauxInteretAnnuelPct / 100 / 12;
  const tauxAssuranceMensuel = tauxAssuranceAnnuelPct / 100 / 12;

  const mensualiteTotale = input.revenuMensuelTotal * (tauxEffortMaxPct / 100);

  const facteurAnnuite =
    tauxMensuel === 0
      ? nbMensualites
      : (1 - Math.pow(1 + tauxMensuel, -nbMensualites)) / tauxMensuel;

  const capital =
    (mensualiteTotale * facteurAnnuite) /
    (1 + tauxAssuranceMensuel * facteurAnnuite);

  const mensualiteAssurance = capital * tauxAssuranceMensuel;
  const mensualiteCreditHorsAssurance = mensualiteTotale - mensualiteAssurance;
  const coutTotalInterets = mensualiteCreditHorsAssurance * nbMensualites - capital;
  const coutTotalAssurance = mensualiteAssurance * nbMensualites;

  return {
    capaciteEmpruntMax: Math.round(capital),
    mensualiteCreditHorsAssurance: Math.round(mensualiteCreditHorsAssurance),
    mensualiteAssurance: Math.round(mensualiteAssurance),
    mensualiteTotale: Math.round(mensualiteTotale),
    coutTotalInterets: Math.round(coutTotalInterets),
    coutTotalAssurance: Math.round(coutTotalAssurance),
    tauxEffortEffectifPct: tauxEffortMaxPct,
    hypotheses: {
      dureeAns,
      tauxInteretAnnuelPct,
      tauxAssuranceAnnuelPct,
      tauxEffortMaxPct,
    },
  };
}
