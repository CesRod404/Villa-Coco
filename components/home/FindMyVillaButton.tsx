"use client";

/**
 * components/home/FindMyVillaButton.tsx
 *
 * Botón "Find My Villa" del Hero. Vive separado de Hero.tsx (Server
 * Component) porque necesita estado de cliente para abrir/cerrar el modal
 * del VillaRecommender.
 */

import { useState } from "react";
import VillaRecommender, {
  type VillaRecommenderAnswers,
} from "@/components/recommender/VillaRecommender";

export default function FindMyVillaButton() {
  const [open, setOpen] = useState(false);

  function handleComplete(answers: VillaRecommenderAnswers) {
    // TODO: conectar con app/api/recommend (todavía un stub) para traer
    // la villa sugerida real y navegar al resultado. Por ahora solo
    // logueamos las respuestas para verificar que el flujo llega hasta acá.
    console.log("Villa Recommender answers:", answers);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-secondary px-8 py-4 text-button uppercase text-white"
      >
        Find My Villa
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <VillaRecommender
              onComplete={handleComplete}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}