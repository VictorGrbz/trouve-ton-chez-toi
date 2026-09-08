/**
 * File d'attente hors-ligne pour les observations et photos de visite
 * (Étape 8). Toute interaction utilisateur écrit d'abord ici (IndexedDB),
 * jamais directement sur le réseau — l'UI ne dépend donc jamais de la
 * connectivité. `synchroniser` est une opération séparée, best-effort,
 * rejouable sans risque de doublon grâce à `clientId` (idempotence côté
 * serveur via ON CONFLICT). Ce module ne doit être importé que côté client.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export interface ObservationLocale {
  clientId: string;
  bienId: number;
  checklistItemId: string;
  coche: boolean;
  incertain: boolean;
  note: string;
  synced: boolean;
  updatedAt: number;
}

export interface PhotoLocale {
  clientId: string;
  bienId: number;
  checklistItemId: string | null;
  blob: Blob;
  nomFichier: string;
  typeMime: string;
  synced: boolean;
  createdAt: number;
}

interface VisiteDB extends DBSchema {
  observations: {
    key: string; // clientId
    value: ObservationLocale;
    indexes: { "by-bien": number };
  };
  photos: {
    key: string; // clientId
    value: PhotoLocale;
    indexes: { "by-bien": number };
  };
}

let dbPromise: Promise<IDBPDatabase<VisiteDB>> | null = null;

function getDb(): Promise<IDBPDatabase<VisiteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<VisiteDB>("trouve-ton-chez-toi-visite", 1, {
      upgrade(db) {
        const observations = db.createObjectStore("observations", { keyPath: "clientId" });
        observations.createIndex("by-bien", "bienId");
        const photos = db.createObjectStore("photos", { keyPath: "clientId" });
        photos.createIndex("by-bien", "bienId");
      },
    });
  }
  return dbPromise;
}

/** Upsert local par (bienId, checklistItemId) : un item de check-list = une observation. */
export async function enregistrerObservation(
  input: Omit<ObservationLocale, "synced" | "updatedAt" | "clientId"> & { clientId?: string },
): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("observations", "readwrite");
  const existantes = await tx.store.index("by-bien").getAll(input.bienId);
  const existante = existantes.find((o) => o.checklistItemId === input.checklistItemId);

  await tx.store.put({
    clientId: existante?.clientId ?? input.clientId ?? crypto.randomUUID(),
    bienId: input.bienId,
    checklistItemId: input.checklistItemId,
    coche: input.coche,
    incertain: input.incertain,
    note: input.note,
    synced: false,
    updatedAt: Date.now(),
  });
  await tx.done;
}

export async function enregistrerPhotoLocale(
  input: Omit<PhotoLocale, "synced" | "createdAt" | "clientId">,
): Promise<void> {
  const db = await getDb();
  await db.put("photos", {
    ...input,
    clientId: crypto.randomUUID(),
    synced: false,
    createdAt: Date.now(),
  });
}

export async function listerObservations(bienId: number): Promise<ObservationLocale[]> {
  const db = await getDb();
  return db.getAllFromIndex("observations", "by-bien", bienId);
}

export async function listerPhotos(bienId: number): Promise<PhotoLocale[]> {
  const db = await getDb();
  return db.getAllFromIndex("photos", "by-bien", bienId);
}

async function envoyerObservation(observation: ObservationLocale): Promise<boolean> {
  try {
    const res = await fetch("/api/visite/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bienId: observation.bienId,
        clientId: observation.clientId,
        checklistItemId: observation.checklistItemId,
        coche: observation.coche,
        incertain: observation.incertain,
        note: observation.note,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function envoyerPhoto(photo: PhotoLocale): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.set("bienId", String(photo.bienId));
    formData.set("clientId", photo.clientId);
    if (photo.checklistItemId) formData.set("checklistItemId", photo.checklistItemId);
    formData.set("photo", photo.blob, photo.nomFichier);
    const res = await fetch("/api/visite/photos", { method: "POST", body: formData });
    return res.ok;
  } catch {
    return false;
  }
}

/** Ne jette jamais : renvoie un compte pour affichage dans l'UI, retry possible au prochain appel. */
export async function synchroniser(bienId: number): Promise<{ ok: number; echecs: number }> {
  const db = await getDb();
  let ok = 0;
  let echecs = 0;

  const observations = (await listerObservations(bienId)).filter((o) => !o.synced);
  for (const observation of observations) {
    if (await envoyerObservation(observation)) {
      await db.put("observations", { ...observation, synced: true });
      ok += 1;
    } else {
      echecs += 1;
    }
  }

  const photos = (await listerPhotos(bienId)).filter((p) => !p.synced);
  for (const photo of photos) {
    if (await envoyerPhoto(photo)) {
      await db.put("photos", { ...photo, synced: true });
      ok += 1;
    } else {
      echecs += 1;
    }
  }

  return { ok, echecs };
}

export async function compterEnAttente(bienId: number): Promise<number> {
  const [observations, photos] = await Promise.all([listerObservations(bienId), listerPhotos(bienId)]);
  return observations.filter((o) => !o.synced).length + photos.filter((p) => !p.synced).length;
}
