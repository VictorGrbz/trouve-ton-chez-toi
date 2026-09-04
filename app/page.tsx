import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <Card className="max-w-md">
        <h1 className="text-3xl font-semibold tracking-tight">
          Trouve Ton Chez-Toi
        </h1>
        <p className="mt-4 text-muted-foreground">
          Copilote d&apos;achat immobilier : le carnet de visite intelligent
          qui accompagne chaque visite, avant, pendant et après.
        </p>
      </Card>
    </div>
  );
}
