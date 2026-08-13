import VillaRecommender from "@/components/recommender/VillaRecommender";

/**
 * Página temporal para previsualizar el Villa Recommender mientras se integra
 * en el flujo real. Bórrala (o muévela) cuando el quiz ya viva en su lugar
 * definitivo (modal, home, etc).
 */
export default function RecommenderPreviewPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <VillaRecommender
        onComplete={(answers) => {
          // Placeholder: aqui se conectará la llamada a /api/recommend
          console.log("Villa Recommender answers:", answers);
        }}
      />
    </main>
  );
}
