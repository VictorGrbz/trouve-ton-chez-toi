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
  hypotheses: {
    tauxEffortIndicatifPct: number;
    dureeAns: number;
    tauxInteretAnnuelIndicatifPct: number;
    tauxFraisAcquisitionIndicatifPct: number;
    tauxMargeSecuritePct: number;
  };
}

const TAUX_EFFORT_INDICATIF_PCT = 30;
const DUREE_ANS = 20;
const TAUX_INTERET_ANNUEL_INDICATIF_PCT = 3.5;
const TAUX_FRAIS_ACQUISITION_INDICATIF_PCT = 8;
const TAUX_MARGE_SECURITE_PCT = 10;

/**
 * Estimation indicative de première approche (Étape 3), volontairement
 * conservatrice (taux d'effort 30 %, sous le plafond légal de 35 % que
 * l'Étape 4 formalisera avec le barème notarial et le taux de référence
 * Banque de France). Jamais un accord de prêt ni un conseil engageant.
 *
 * Le rendement locatif visé (persona investisseur) n'est volontairement
 * pas injecté dans le calcul : l'abattement bancaire sur loyers projetés
 * est une règle métier fine réservée à l'Étape 4.
 */
export function calculerEnveloppeBudget(
  input: CalculBudgetInput,
): CalculBudgetResult {
  const revenuTotal =
    input.revenuMensuel1 + (input.revenuMensuel2 ?? 0);

  const mensualiteIndicative = revenuTotal * (TAUX_EFFORT_INDICATIF_PCT / 100);

  const tauxMensuel = TAUX_INTERET_ANNUEL_INDICATIF_PCT / 100 / 12;
  const nbMensualites = DUREE_ANS * 12;
  const capaciteEmpruntIndicative =
    tauxMensuel === 0
      ? mensualiteIndicative * nbMensualites
      : mensualiteIndicative *
        ((1 - Math.pow(1 + tauxMensuel, -nbMensualites)) / tauxMensuel);

  const disponibleTotal = capaciteEmpruntIndicative + input.apport;
  const tauxChargesTotal =
    (TAUX_FRAIS_ACQUISITION_INDICATIF_PCT + TAUX_MARGE_SECURITE_PCT) / 100;
  const enveloppeBudgetMax = disponibleTotal / (1 + tauxChargesTotal);

  const fraisAcquisitionEstimes =
    enveloppeBudgetMax * (TAUX_FRAIS_ACQUISITION_INDICATIF_PCT / 100);
  const margeSecuriteMontant =
    enveloppeBudgetMax * (TAUX_MARGE_SECURITE_PCT / 100);

  return {
    enveloppeBudgetMax: Math.round(enveloppeBudgetMax),
    fraisAcquisitionEstimes: Math.round(fraisAcquisitionEstimes),
    margeSecuriteMontant: Math.round(margeSecuriteMontant),
    capaciteEmpruntIndicative: Math.round(capaciteEmpruntIndicative),
    mensualiteIndicative: Math.round(mensualiteIndicative),
    hypotheses: {
      tauxEffortIndicatifPct: TAUX_EFFORT_INDICATIF_PCT,
      dureeAns: DUREE_ANS,
      tauxInteretAnnuelIndicatifPct: TAUX_INTERET_ANNUEL_INDICATIF_PCT,
      tauxFraisAcquisitionIndicatifPct: TAUX_FRAIS_ACQUISITION_INDICATIF_PCT,
      tauxMargeSecuritePct: TAUX_MARGE_SECURITE_PCT,
    },
  };
}
