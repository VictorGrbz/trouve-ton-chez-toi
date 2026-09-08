import { db } from "@/db";
import { BienForm } from "./bien-form";

const PERSONA_LABELS: Record<string, string> = {
  solo: "Primo-accédant solo",
  couple: "Couple / famille",
  investisseur: "Investisseur locatif",
};

export default async function NouveauBienPage() {
  const { rows } = await db.query<{
    id: string;
    nom_projet: string | null;
    zone_recherche: string;
    persona: string;
  }>(
    `SELECT id, nom_projet, zone_recherche, persona
     FROM projet_achat
     ORDER BY created_at DESC`,
  );

  const projets = rows.map((r) => ({
    id: r.id,
    label: `${r.nom_projet?.trim() || r.zone_recherche} — ${
      PERSONA_LABELS[r.persona] ?? r.persona
    }`,
  }));

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Nouvelle fiche bien
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Saisie guidée ou collage du texte de l&apos;annonce, tel quel.
      </p>
      <div className="mt-8">
        <BienForm projets={projets} />
      </div>
    </div>
  );
}
