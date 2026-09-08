/**
 * Check-list de visite générée par des règles métier pures (aucun appel IA).
 * Varie selon la copropriété du bien et le persona du projet d'achat.
 * Étape 7 du plan.
 */

export interface ChecklistItem {
  id: string;
  libelle: string;
}

export interface ChecklistCategorie {
  id: string;
  titre: string;
  items: ChecklistItem[];
}

export interface BienPourChecklist {
  copropriete: boolean;
}

export type Persona = "solo" | "couple" | "investisseur";

const CATEGORIES_SOCLE: ChecklistCategorie[] = [
  {
    id: "general",
    titre: "État général",
    items: [
      { id: "general-murs-sols-plafonds", libelle: "État des murs, sols et plafonds (fissures, humidité visible)" },
      { id: "general-chauffage", libelle: "Type de chauffage et état de fonctionnement" },
      { id: "general-isolation", libelle: "Isolation apparente (fenêtres, combles)" },
      { id: "general-luminosite", libelle: "Luminosité et exposition à différentes heures de la journée" },
    ],
  },
  {
    id: "reseaux",
    titre: "Réseaux et diagnostics",
    items: [
      {
        id: "reseaux-gaz-elec",
        libelle:
          "Date des diagnostics gaz et électricité (obligatoires si installation de plus de 15 ans)",
      },
      { id: "reseaux-dpe", libelle: "Détail du DPE et pistes de rénovation énergétique si classe défavorable" },
      {
        id: "reseaux-plomb-amiante",
        libelle: "Présence des diagnostics plomb (CREP) et amiante correspondant à l'âge du bien",
      },
    ],
  },
  {
    id: "annexes",
    titre: "Sous-sol, cave et combles",
    items: [
      { id: "annexes-humidite", libelle: "Traces d'humidité, infiltration ou moisissure" },
      { id: "annexes-ventilation", libelle: "Ventilation et aération des espaces annexes" },
      { id: "annexes-nuisibles", libelle: "Traces de nuisibles (insectes xylophages, rongeurs)" },
    ],
  },
  {
    id: "zone-risque",
    titre: "Zone à risque",
    items: [
      {
        id: "risque-georisques",
        libelle: "Consulter georisques.gouv.fr (inondation, argiles, radon)",
      },
      { id: "risque-erp", libelle: "Demander l'État des Risques et Pollutions (ERP) au vendeur" },
    ],
  },
];

const CATEGORIE_COPROPRIETE: ChecklistCategorie = {
  id: "copropriete",
  titre: "Copropriété",
  items: [
    { id: "copro-pv-ag", libelle: "Lire les 3 derniers procès-verbaux d'assemblée générale" },
    { id: "copro-charges", libelle: "Montant et détail des charges courantes" },
    { id: "copro-fonds-travaux", libelle: "État du fonds de travaux et travaux votés à venir" },
    { id: "copro-carnet-entretien", libelle: "Consulter le carnet d'entretien de l'immeuble" },
    { id: "copro-procedures", libelle: "Vérifier l'existence de procédures ou litiges en cours" },
  ],
};

const CATEGORIE_INDIVIDUEL: ChecklistCategorie = {
  id: "individuel",
  titre: "Bien individuel",
  items: [
    { id: "individuel-toiture", libelle: "État de la toiture et de la charpente" },
    {
      id: "individuel-assainissement",
      libelle: "Type d'assainissement (tout-à-l'égout ou individuel) et conformité",
    },
    { id: "individuel-bornage", libelle: "Limites de propriété et bornage" },
  ],
};

const CATEGORIE_INVESTISSEUR: ChecklistCategorie = {
  id: "investissement",
  titre: "Rendement et fiscalité",
  items: [
    { id: "invest-loyer-marche", libelle: "Comparer le loyer envisagé au marché locatif local" },
    { id: "invest-regime-fiscal", libelle: "Identifier le régime fiscal applicable (micro-foncier, réel, LMNP)" },
    { id: "invest-encadrement-loyers", libelle: "Vérifier si la zone est soumise à l'encadrement des loyers" },
    { id: "invest-charges-recuperables", libelle: "Distinguer charges récupérables et non récupérables" },
    { id: "invest-vacance", libelle: "Estimer le risque de vacance locative du secteur" },
  ],
};

const CATEGORIE_USAGE_PERSONNEL: ChecklistCategorie = {
  id: "usage-personnel",
  titre: "Vie quotidienne",
  items: [
    { id: "perso-proximite", libelle: "Proximité des écoles, transports et commerces" },
    { id: "perso-voisinage", libelle: "Ressenti sur le voisinage et l'ambiance du quartier" },
    { id: "perso-projection", libelle: "Se projeter dans l'organisation quotidienne (rangement, trajets, bruit)" },
  ],
};

export function genererChecklistVisite(
  bien: BienPourChecklist,
  persona: Persona,
): ChecklistCategorie[] {
  return [
    ...CATEGORIES_SOCLE,
    bien.copropriete ? CATEGORIE_COPROPRIETE : CATEGORIE_INDIVIDUEL,
    persona === "investisseur" ? CATEGORIE_INVESTISSEUR : CATEGORIE_USAGE_PERSONNEL,
  ];
}
