import { ProjetWizard } from "./projet-wizard";

export default function NouveauProjetPage() {
  return (
    <div className="flex flex-1 flex-col px-6 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Nouveau projet d&apos;achat
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Quelques questions pour estimer votre enveloppe budgétaire.
      </p>
      <div className="mt-8">
        <ProjetWizard />
      </div>
    </div>
  );
}
