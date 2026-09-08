import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { genererAlertesVigilance } from "@/lib/alertes-vigilance";
import { genererChecklistVisite, type Persona } from "@/lib/checklist-rules";

interface BienRow {
  id: string;
  titre: string;
  annee_construction: number | null;
  dpe: string | null;
  copropriete: boolean;
  persona: Persona;
}

export default async function ChecklistBienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bienId = Number(id);
  if (!Number.isInteger(bienId) || bienId <= 0) {
    notFound();
  }

  const { rows } = await db.query<BienRow>(
    `SELECT b.id, b.titre, b.annee_construction, b.dpe, b.copropriete, p.persona
     FROM bien b
     JOIN projet_achat p ON p.id = b.projet_achat_id
     WHERE b.id = $1`,
    [bienId],
  );
  const bien = rows[0];
  if (!bien) {
    notFound();
  }

  const alertes = genererAlertesVigilance({
    anneeConstruction: bien.annee_construction,
    dpe: bien.dpe,
    copropriete: bien.copropriete,
  });
  const categories = genererChecklistVisite({ copropriete: bien.copropriete }, bien.persona);

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <Link href={`/biens/${bien.id}`} className="text-sm text-primary underline">
        &larr; {bien.titre}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Check-list de visite</h1>

      {alertes.length > 0 && (
        <div className="mt-6 space-y-3">
          {alertes.map((alerte) => (
            <Card key={alerte.id} className="border-warn-bg">
              <div className="flex items-center gap-2">
                <Badge variant={alerte.niveau === "attention" ? "warn" : "status"}>
                  {alerte.niveau === "attention" ? "Vigilance" : "Info"}
                </Badge>
                <p className="text-sm font-medium">{alerte.titre}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{alerte.description}</p>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {categories.map((categorie) => (
          <Card key={categorie.id}>
            <p className="text-sm font-medium">{categorie.titre}</p>
            <ul className="mt-2 space-y-2">
              {categorie.items.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    disabled
                    className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                    aria-label={item.libelle}
                  />
                  <span className="text-muted-foreground">{item.libelle}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Cette check-list est générée à partir de règles métier fixes (aucune IA) et sert de repère
        pendant votre visite. La possibilité de cocher les points et d&apos;ajouter des notes/photos
        en mode hors-ligne arrive à l&apos;étape suivante du projet.
      </p>
    </div>
  );
}
