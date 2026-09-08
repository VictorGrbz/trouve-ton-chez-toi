import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { Card } from "@/components/ui/card";
import { ObservationForm } from "./observation-form";

interface BienRow {
  id: string;
  titre: string;
}

interface ObservationRow {
  id: string;
  auteur_nom: string;
  texte: string;
  created_at: string;
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export default async function ObservationsBienPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bienId = Number(id);
  if (!Number.isInteger(bienId) || bienId <= 0) {
    notFound();
  }

  const { rows } = await db.query<BienRow>(`SELECT id, titre FROM bien WHERE id = $1`, [bienId]);
  const bien = rows[0];
  if (!bien) {
    notFound();
  }

  const { rows: observations } = await db.query<ObservationRow>(
    `SELECT id, auteur_nom, texte, created_at FROM observation WHERE bien_id = $1 ORDER BY created_at ASC`,
    [bienId],
  );

  const parAuteur = new Map<string, ObservationRow[]>();
  for (const observation of observations) {
    const liste = parAuteur.get(observation.auteur_nom) ?? [];
    liste.push(observation);
    parAuteur.set(observation.auteur_nom, liste);
  }
  const auteurs = [...parAuteur.keys()];

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <Link href={`/biens/${bien.id}`} className="text-sm text-primary underline">
        &larr; {bien.titre}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Observations partagées</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Chacun consigne ses propres observations sur ce bien, affichées côte à côte pour en discuter ensemble.
      </p>

      <div className="mt-6">
        <ObservationForm bienId={bienId} />
      </div>

      {auteurs.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Aucune observation pour l&apos;instant.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3">
          {auteurs.map((auteur) => (
            <div key={auteur} className="flex flex-col gap-3">
              <p className="text-sm font-medium">{auteur}</p>
              {parAuteur.get(auteur)!.map((observation) => (
                <Card key={observation.id}>
                  <p className="text-sm whitespace-pre-wrap">{observation.texte}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{formatDate(observation.created_at)}</p>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
