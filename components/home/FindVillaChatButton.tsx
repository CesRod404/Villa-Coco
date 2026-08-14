"use client";

/**
 * components/home/FindVillaChatButton.tsx
 *
 * NOTA: el nombre del archivo quedó de una versión anterior donde este
 * botón abría el chat (dispatchaba OPEN_VILLA_CHAT_EVENT). Ahora abre el
 * cuestionario del Villa Recommender y, al terminar, la pantalla de
 * resultado — el chat tiene su propio botón flotante independiente en
 * ChatWidget.tsx. Vale la pena renombrarlo a FindVillaButton.tsx en un
 * commit de limpieza más adelante.
 *
 * El modal se renderiza con createPortal directo al <body> porque
 * HeroNavbar usa backdrop-filter, y backdrop-filter en un ancestro
 * "atrapa" a los hijos position:fixed dentro de su propio stacking
 * context.
 */

import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Sparkles, X } from "lucide-react";
import VillaRecommender, {
  type VillaRecommenderAnswers,
} from "@/components/recommender/VillaRecommender";
import VillaRecommendationResult, {
  type VillaRecommendationData,
} from "@/components/recommender/VillaRecommendationResult";

type FindVillaChatButtonProps = {
  children: ReactNode;
  className?: string;
};

type FlowState = "quiz" | "loadingResult" | "result" | "error";

export default function FindVillaChatButton({
  children,
  className,
}: FindVillaChatButtonProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [flow, setFlow] = useState<FlowState>("quiz");
  const [result, setResult] = useState<VillaRecommendationData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  function openModal() {
    setFlow("quiz");
    setResult(null);
    setErrorMessage(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function startOver() {
    setFlow("quiz");
    setResult(null);
    setErrorMessage(null);
  }

  async function handleComplete(answers: VillaRecommenderAnswers) {
    setFlow("loadingResult");
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Could not get a recommendation.");
      }

      const data: VillaRecommendationData = await res.json();
      setResult(data);
      setFlow("result");
    } catch (err) {
      console.error("Villa recommendation error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setFlow("error");
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={openModal}
        aria-haspopup="dialog"
      >
        {children}
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 p-4"
            onClick={closeModal}
          >
            <div onClick={(e) => e.stopPropagation()}>
              {flow === "quiz" && (
                <VillaRecommender
                  onComplete={handleComplete}
                  onClose={closeModal}
                />
              )}

              {flow === "loadingResult" && (
                <div
                  style={{ width: 384, maxWidth: "100%" }}
                  className="mx-auto flex h-[280px] flex-col rounded-md bg-background p-5 shadow-card"
                >
                  <div className="text-center">
                    <p className="text-heading text-primary">
                      VILLA RECOMMENDER
                    </p>
                    <span className="mx-auto mt-1.5 block h-px w-8 bg-primary" />
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
                    <div className="relative flex h-14 w-14 items-center justify-center">
                      <span className="absolute inset-0 animate-[spin_2.5s_linear_infinite] rounded-md border-2 border-accent" />
                      <Sparkles
                        className="h-5 w-5 text-accent"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-body font-semibold text-secondary">
                        Analyzing your preferences.
                      </p>
                      <p className="text-caption text-muted">
                        Our AI is finding your perfect villa.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {flow === "result" && result && (
                <VillaRecommendationResult
                  data={result}
                  onClose={closeModal}
                  onStartOver={startOver}
                />
              )}

              {flow === "error" && (
                <div
                  style={{ width: 384, maxWidth: "100%" }}
                  className="mx-auto flex flex-col items-center gap-4 rounded-md bg-background p-6 text-center shadow-card"
                >
                  <p className="text-body font-semibold text-secondary">
                    We couldn&apos;t generate your recommendation.
                  </p>
                  <p className="text-caption text-muted">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={startOver}
                    className="text-button rounded-md bg-primary px-6 py-2.5 uppercase text-primary-foreground"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}