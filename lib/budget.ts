import { calculerFraisNotaire } from "@/lib/notaire";
import { calculerCapaciteEmprunt } from "@/lib/credit";

export type Persona = "solo" | "couple" | "investisseur";

export interface CalculBudgetInput {
  persona: Persona;
  revenuMensuel1: number;
  revenuMensuel2?: number | null;
  apport: number;
  rendementLocatifVisePct?: number | null;
}

export interface CalculBudgetResult {
  enveloppeBudgetMax: number;
  fraisAcquisitionEstimes: number;
  margeSecuriteMontant: number;
  capaciteEmpruntIndicative: number;
  mensualiteIndicative: number;
  coutTotalInteretsIndicatif: number;
  tauxEffortEffectifPct: number;
  hypotheses: {
    tauxEffortIndicatifPct: number;
    dureeAns: number;
    tauxInteretAnnuelIndicatifPct: number;
    tauxAssuranceAnnuelIndicatifPct: number;
    tauxMargeSecuritePct: number;
    fraisNotaire: ReturnType<typeof calculerFraisNotaire>["hypotheses"];
  };
}

const TAUX_EFFORT_INDICATIF_PCT = 30;
const DUREE_ANS = 20;
const TAUX_MARGE_SECURITE_PCT = 10;
const PRECISION_DICHOTOMIE_EUR = 1;
const MAX_ITERATIONS_DICHOTOMIE = 60;

/**
 * Frais d'acquisition + marge de sécurité pour un prix de bien donné.
 * Département inconnu à ce stade (aucun bien identifié) : taux national par
 * défaut, à affiner une fois un bien réel identifié (Étape 6).
 */
function chargesAcquisition(prix: number): number {
  const frais = calculerFraisNotaire({ prixBien: prix, departement: null });
  const margeSecurite = prix * (TAUX_MARGE_SECURITE_PCT / 100);
  return frais.fraisNotaireTotal + margeSecurite;
}

/**
 * Résout par dichotomie le prix de bien maximal tel que
 * prix + frais d'acquisition + marge de sécurité == disponibleTotal.
 */
function resoudreEnveloppeParDichotomie(disponibleTotal: number): number {
  let bas = 0;
  let haut = disponibleTotal;
  for (let i = 0; i < MAX_ITERATIONS_DICHOTOMIE; i++) {
    const milieu = (bas + haut) / 2;
    const coutTotal = milieu + chargesAcquisition(milieu);
    if (coutTotal > disponibleTotal) {
      haut = milieu;
    } else {
      bas = milieu;
    }
    if (haut - bas < PRECISION_DICHOTOMIE_EUR) break;
  }
  return bas;
}

/**
 * Estimation indicative de l'enveloppe budgétaire (Étape 3, formalisée à
 * l'Étape 4 avec le vrai calcul de frais de notaire et de capacité
 * d'emprunt). Jamais un accord de prêt ni un conseil engageant.
 *
 * Le rendement locatif visé (persona investisseur) n'est volontairement pas
 * injecté dans le calcul : l'abattement bancaire sur loyers projetés est une
 * règle métier fine, toujours différée au-delà de cette étape.
 */
export function calculerEnveloppeBudget(
  input: CalculBudgetInput,
): CalculBudgetResult {
  const revenuTotal = input.revenuMensuel1 + (input.revenuMensuel2 ?? 0);

  const credit = calculerCapaciteEmprunt({
    revenuMensuelTotal: revenuTotal,
    dureeAns: DUREE_ANS,
    tauxEffortMaxPct: TAUX_EFFORT_INDICATIF_PCT,
  });

  const disponibleTotal = credit.capaciteEmpruntMax + input.apport;
  const enveloppeBudgetMax = resoudreEnveloppeParDichotomie(disponibleTotal);
  const fraisNotaire = calculerFraisNotaire({
    prixBien: enveloppeBudgetMax,
    departement: null,
  });
  const margeSecuriteMontant = enveloppeBudgetMax * (TAUX_MARGE_SECURITE_PCT / 100);

  return {
    enveloppeBudgetMax: Math.round(enveloppeBudgetMax),
    fraisAcquisitionEstimes: fraisNotaire.fraisNotaireTotal,
    margeSecuriteMontant: Math.round(margeSecuriteMontant),
    capaciteEmpruntIndicative: credit.capaciteEmpruntMax,
    mensualiteIndicative: credit.mensualiteTotale,
    coutTotalInteretsIndicatif: credit.coutTotalInterets,
    tauxEffortEffectifPct: credit.tauxEffortEffectifPct,
    hypotheses: {
      tauxEffortIndicatifPct: TAUX_EFFORT_INDICATIF_PCT,
      dureeAns: DUREE_ANS,
      tauxInteretAnnuelIndicatifPct: credit.hypotheses.tauxInteretAnnuelPct,
      tauxAssuranceAnnuelIndicatifPct: credit.hypotheses.tauxAssuranceAnnuelPct,
      tauxMargeSecuritePct: TAUX_MARGE_SECURITE_PCT,
      fraisNotaire: fraisNotaire.hypotheses,
    },
  };
}
