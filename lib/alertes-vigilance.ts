/**
 * Alertes de vigilance générées par des règles métier pures (aucun appel IA),
 * à partir des seules données déjà saisies sur la fiche bien. Étape 7 du plan.
 */

export type NiveauAlerte = "attention" | "info";

export interface AlerteVigilance {
  id: string;
  titre: string;
  niveau: NiveauAlerte;
  description: string;
}

export interface BienPourAlertes {
  anneeConstruction: number | null;
  dpe: string | null;
  copropriete: boolean;
}

const SEUIL_ANNEE_PLOMB = 1949;
const SEUIL_ANNEE_AMIANTE = 1997;
const DPE_DEFAVORABLES = ["F", "G"];

export function genererAlertesVigilance(bien: BienPourAlertes): AlerteVigilance[] {
  const alertes: AlerteVigilance[] = [];

  if (bien.anneeConstruction != null && bien.anneeConstruction < SEUIL_ANNEE_PLOMB) {
    alertes.push({
      id: "plomb",
      titre: "Risque plomb (construit avant 1949)",
      niveau: "attention",
      description:
        "Un constat de risque d'exposition au plomb (CREP) est obligatoire pour la vente de ce bien. Demandez-le au vendeur s'il n'est pas déjà fourni.",
    });
  }

  // Approximation : la vraie règle porte sur la date du permis de construire,
  // non capturée sur la fiche bien (rarement connue avant la visite/les
  // diagnostics). On se base sur l'année de construction déclarée en
  // documentant explicitement cette limite dans le message.
  if (bien.anneeConstruction != null && bien.anneeConstruction < SEUIL_ANNEE_AMIANTE) {
    alertes.push({
      id: "amiante",
      titre: "Risque amiante à vérifier (construit avant 1997)",
      niveau: "attention",
      description:
        "Estimation basée sur l'année de construction déclarée, faute de date exacte du permis de construire — vérifiez cette date auprès du vendeur. Si le permis est antérieur à juillet 1997, un diagnostic amiante est obligatoire pour la vente.",
    });
  }

  if (bien.dpe && DPE_DEFAVORABLES.includes(bien.dpe)) {
    alertes.push({
      id: "dpe",
      titre: `DPE défavorable (classe ${bien.dpe})`,
      niveau: "attention",
      description:
        "Une classe F ou G signale une forte consommation énergétique : anticipez le coût d'une rénovation thermique dans votre budget, et vérifiez les restrictions de mise en location si vous envisagez un investissement locatif.",
    });
  }

  if (bien.copropriete) {
    alertes.push({
      id: "copropriete",
      titre: "Bien en copropriété",
      niveau: "info",
      description:
        "Demandez les 3 derniers procès-verbaux d'assemblée générale, le montant des charges courantes et l'état du fonds de travaux avant de vous engager.",
    });
  }

  return alertes;
}
