"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AlerteVigilance } from "@/lib/alertes-vigilance";
import type { ChecklistCategorie } from "@/lib/checklist-rules";
import {
  compterEnAttente,
  enregistrerObservation,
  enregistrerPhotoLocale,
  listerObservations,
  listerPhotos,
  synchroniser,
  type PhotoLocale,
} from "@/lib/offline-sync";

interface ObservationServeur {
  checklistItemId: string;
  coche: boolean;
  incertain: boolean;
  note: string;
}

interface PhotoServeur {
  id: string;
  url: string;
  checklistItemId: string | null;
}

interface EtatItem {
  coche: boolean;
  incertain: boolean;
  note: string;
}

export function VisiteClient({
  bienId,
  titre,
  alertes,
  categories,
  observationsServeur,
  photosServeur,
}: {
  bienId: number;
  titre: string;
  alertes: AlerteVigilance[];
  categories: ChecklistCategorie[];
  observationsServeur: ObservationServeur[];
  photosServeur: PhotoServeur[];
}) {
  const etatServeurInitial = useMemo(() => {
    const map = new Map<string, EtatItem>();
    for (const o of observationsServeur) {
      map.set(o.checklistItemId, { coche: o.coche, incertain: o.incertain, note: o.note });
    }
    return map;
  }, [observationsServeur]);

  const [etats, setEtats] = useState<Map<string, EtatItem>>(etatServeurInitial);
  const [photosLocales, setPhotosLocales] = useState<PhotoLocale[]>([]);
  const [enAttente, setEnAttente] = useState(0);
  const [messageSync, setMessageSync] = useState<string | null>(null);
  const [syncEnCours, setSyncEnCours] = useState(false);

  const rafraichirDepuisLocal = useCallback(async () => {
    const [observationsLocales, photos, nbEnAttente] = await Promise.all([
      listerObservations(bienId),
      listerPhotos(bienId),
      compterEnAttente(bienId),
    ]);

    setEtats((precedent) => {
      const fusion = new Map(precedent.size > 0 ? precedent : etatServeurInitial);
      for (const o of observationsLocales) {
        fusion.set(o.checklistItemId, { coche: o.coche, incertain: o.incertain, note: o.note });
      }
      return fusion;
    });
    setPhotosLocales(photos);
    setEnAttente(nbEnAttente);
  }, [bienId, etatServeurInitial]);

  useEffect(() => {
    rafraichirDepuisLocal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const declencherSync = useCallback(async () => {
    setSyncEnCours(true);
    setMessageSync(null);
    const resultat = await synchroniser(bienId);
    await rafraichirDepuisLocal();
    setSyncEnCours(false);
    if (resultat.ok === 0 && resultat.echecs === 0) {
      setMessageSync("Rien à synchroniser.");
    } else if (resultat.echecs === 0) {
      setMessageSync(`${resultat.ok} élément(s) synchronisé(s).`);
    } else {
      setMessageSync(`${resultat.ok} synchronisé(s), ${resultat.echecs} en échec (réessai possible).`);
    }
  }, [bienId, rafraichirDepuisLocal]);

  useEffect(() => {
    const surReconnexion = () => {
      declencherSync();
    };
    window.addEventListener("online", surReconnexion);
    if (navigator.onLine) declencherSync();
    return () => window.removeEventListener("online", surReconnexion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mettreAJourItem = useCallback(
    (checklistItemId: string, patch: Partial<EtatItem>) => {
      setEtats((precedent) => {
        const nouveau = new Map(precedent);
        const actuel = nouveau.get(checklistItemId) ?? { coche: false, incertain: false, note: "" };
        const suivant = { ...actuel, ...patch };
        nouveau.set(checklistItemId, suivant);
        enregistrerObservation({
          bienId,
          checklistItemId,
          coche: suivant.coche,
          incertain: suivant.incertain,
          note: suivant.note,
        }).then(() => compterEnAttente(bienId).then(setEnAttente));
        return nouveau;
      });
    },
    [bienId],
  );

  const ajouterPhoto = useCallback(
    async (checklistItemId: string, fichier: File) => {
      await enregistrerPhotoLocale({
        bienId,
        checklistItemId,
        blob: fichier,
        nomFichier: fichier.name,
        typeMime: fichier.type || "image/jpeg",
      });
      await rafraichirDepuisLocal();
    },
    [bienId, rafraichirDepuisLocal],
  );

  const photosParItem = useMemo(() => {
    const map = new Map<string, { url: string; local: boolean }[]>();
    for (const p of photosServeur) {
      if (!p.checklistItemId) continue;
      const liste = map.get(p.checklistItemId) ?? [];
      liste.push({ url: p.url, local: false });
      map.set(p.checklistItemId, liste);
    }
    for (const p of photosLocales) {
      if (!p.checklistItemId) continue;
      const liste = map.get(p.checklistItemId) ?? [];
      liste.push({ url: URL.createObjectURL(p.blob), local: !p.synced });
      map.set(p.checklistItemId, liste);
    }
    return map;
  }, [photosServeur, photosLocales]);

  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <Link href={`/biens/${bienId}`} className="text-sm text-primary underline">
        &larr; {titre}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Visite en cours</h1>

      <Card className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">
            {enAttente > 0
              ? `${enAttente} élément(s) en attente de synchronisation`
              : "Tout est synchronisé"}
          </p>
          <Button variant="outline" onClick={declencherSync} disabled={syncEnCours}>
            {syncEnCours ? "Synchronisation…" : "Synchroniser maintenant"}
          </Button>
        </div>
        {messageSync && <p className="mt-2 text-sm text-muted-foreground">{messageSync}</p>}
      </Card>

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
            <ul className="mt-2 space-y-4">
              {categorie.items.map((item) => {
                const etat = etats.get(item.id) ?? { coche: false, incertain: false, note: "" };
                const photos = photosParItem.get(item.id) ?? [];
                return (
                  <li key={item.id} className="border-t border-border pt-3 first:border-t-0 first:pt-0">
                    <label className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={etat.coche}
                        onChange={(e) => mettreAJourItem(item.id, { coche: e.target.checked })}
                        className="mt-1 h-4 w-4 shrink-0 rounded border-border"
                      />
                      <span>{item.libelle}</span>
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-2 pl-6">
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={etat.incertain}
                          onChange={(e) => mettreAJourItem(item.id, { incertain: e.target.checked })}
                          className="h-3.5 w-3.5 rounded border-border"
                        />
                        Marquer comme incertain
                      </label>
                      <label className="text-xs text-primary underline">
                        Ajouter une photo
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const fichier = e.target.files?.[0];
                            if (fichier) ajouterPhoto(item.id, fichier);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                    <textarea
                      value={etat.note}
                      onChange={(e) => mettreAJourItem(item.id, { note: e.target.value })}
                      placeholder="Note (optionnel)"
                      rows={2}
                      className="mt-2 ml-6 w-[calc(100%-1.5rem)] rounded-card border border-border bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                    />
                    {photos.length > 0 && (
                      <div className="mt-2 ml-6 flex flex-wrap gap-2">
                        {photos.map((photo, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src={photo.url}
                            alt=""
                            className="h-16 w-16 rounded-card border border-border object-cover"
                          />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
