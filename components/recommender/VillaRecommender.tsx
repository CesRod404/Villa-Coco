"use client";

/**
 * components/recommender/VillaRecommender.tsx
 *
 * Quiz de 4 preguntas para recomendar una villa. Componente de cliente
 * autocontenido: maneja su propio estado (paso actual + respuestas) y,
 * al terminar, muestra una pantalla de "analizando" y llama a
 * `onComplete(answers)` para que el padre dispare la llamada real a
 * `app/api/recommend` (todavía un stub) y navegue al resultado.
 *
 * Usa los design tokens ya definidos en app/globals.css
 * (--text-heading, --text-eyebrow, --text-body, --text-button, --color-primary,
 * --color-secondary, --color-border, --color-chip-alt, --radius-md, --shadow-card),
 * los mismos que ya referencian "Villa Recommender" en los comentarios del tema.
 */

import { useEffect, useState } from "react";
import {
  X,
  ChevronLeft,
  Loader2,
  User,
  Users,
  UsersRound,
  Users2,
  Moon,
  PartyPopper,
  Gem,
  Trees,
  Waves,
  ChefHat,
  Compass,
  UtensilsCrossed,
  Clock,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

export type PeopleAnswer = "couple" | "small" | "group" | "large";
export type AtmosphereAnswer = "peaceful" | "lively" | "luxurious" | "rustic";
export type ActivityAnswer = "pool" | "cooking" | "exploring" | "dining";
export type NightsAnswer = "short" | "week" | "long" | "extended";

export interface VillaRecommenderAnswers {
  people: PeopleAnswer;
  atmosphere: AtmosphereAnswer;
  activity: ActivityAnswer;
  nights: NightsAnswer;
}

type AnswerKey = keyof VillaRecommenderAnswers;

interface Option<T extends string> {
  value: T;
  label: string;
  icon: LucideIcon;
}

interface QuestionConfig<T extends string> {
  key: AnswerKey;
  step: number;
  question: string;
  subtext: string;
  options: Option<T>[];
}

const PEOPLE_OPTIONS: Option<PeopleAnswer>[] = [
  { value: "couple", label: "Just me / couple", icon: User },
  { value: "small", label: "3-4 people", icon: Users },
  { value: "group", label: "5-8 people", icon: UsersRound },
  { value: "large", label: "9 people or more", icon: Users2 },
];

const ATMOSPHERE_OPTIONS: Option<AtmosphereAnswer>[] = [
  { value: "peaceful", label: "Peaceful, quiet retreat", icon: Moon },
  { value: "lively", label: "Lively and social", icon: PartyPopper },
  { value: "luxurious", label: "Luxurious and elegant", icon: Gem },
  { value: "rustic", label: "Rustic and natural", icon: Trees },
];

const ACTIVITY_OPTIONS: Option<ActivityAnswer>[] = [
  { value: "pool", label: "Swim & relax by the pool", icon: Waves },
  { value: "cooking", label: "Cooking with local produce", icon: ChefHat },
  { value: "exploring", label: "Exploring the surroundings", icon: Compass },
  { value: "dining", label: "Dining out & nightlife", icon: UtensilsCrossed },
];

const NIGHTS_OPTIONS: Option<NightsAnswer>[] = [
  { value: "short", label: "1-3 nights", icon: Clock },
  { value: "week", label: "4-7 nights", icon: CalendarDays },
  { value: "long", label: "1-2 weeks", icon: CalendarRange },
  { value: "extended", label: "More than 2 weeks", icon: CalendarClock },
];

const QUESTIONS: [
  QuestionConfig<PeopleAnswer>,
  QuestionConfig<AtmosphereAnswer>,
  QuestionConfig<ActivityAnswer>,
  QuestionConfig<NightsAnswer>
] = [
  {
    key: "people",
    step: 1,
    question: "How many people will there be?",
    subtext: "Including adults and children",
    options: PEOPLE_OPTIONS,
  },
  {
    key: "atmosphere",
    step: 2,
    question: "What kind of atmosphere are you looking for?",
    subtext: "Choose the feeling of your ideal stay",
    options: ATMOSPHERE_OPTIONS,
  },
  {
    key: "activity",
    step: 3,
    question: "Your favorite activity?",
    subtext: "The one you would enjoy the most at the villa",
    options: ACTIVITY_OPTIONS,
  },
  {
    key: "nights",
    step: 4,
    question: "How many nights do you plan to stay?",
    subtext: "This helps us tailor your search",
    options: NIGHTS_OPTIONS,
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;
const LOADING_STEP = TOTAL_QUESTIONS + 1;
/** Cuánto se queda la pantalla "Analyzing..." antes de avisar al padre. */
const ANALYZING_DELAY_MS = 1600;

interface VillaRecommenderProps {
  /** Se dispara cuando el usuario responde las 4 preguntas y termina la animación de análisis. */
  onComplete?: (answers: VillaRecommenderAnswers) => void;
  /** Si se pasa, se muestra el botón "X" y se invoca al hacer click. */
  onClose?: () => void;
  className?: string;
}

export default function VillaRecommender({
  onComplete,
  onClose,
  className = "",
}: VillaRecommenderProps) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Partial<VillaRecommenderAnswers>>({});

  const isLoadingStep = step === LOADING_STEP;
  const currentQuestion = !isLoadingStep ? QUESTIONS[step - 1] : undefined;

  function selectOption<T extends string>(key: AnswerKey, value: T) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    if (step < TOTAL_QUESTIONS) {
      setStep(step + 1);
    } else if (step === TOTAL_QUESTIONS) {
      setStep(LOADING_STEP);
    }
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  function reset() {
    setStep(1);
    setAnswers({});
  }

  function handleClose() {
    reset();
    onClose?.();
  }

  // Pantalla de análisis: espera un momento y entrega las respuestas al padre.
  useEffect(() => {
    if (!isLoadingStep) return;
    if (
      !answers.people ||
      !answers.atmosphere ||
      !answers.activity ||
      !answers.nights
    ) {
      return;
    }
    const finalAnswers = answers as VillaRecommenderAnswers;
    const timer = setTimeout(() => {
      onComplete?.(finalAnswers);
    }, ANALYZING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [isLoadingStep, answers, onComplete]);

  const isCurrentAnswered = currentQuestion
    ? Boolean(answers[currentQuestion.key])
    : false;

  return (
    <div
      className={`mx-auto flex w-full max-w-sm flex-col rounded-[var(--radius-md)] bg-background p-6 shadow-[var(--shadow-card)] ${className}`}
    >
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className={`flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-colors hover:bg-chip-alt ${
            step === 1 || isLoadingStep ? "invisible" : ""
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="flex h-7 w-7 items-center justify-center rounded-full text-secondary transition-colors hover:bg-chip-alt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-heading text-center text-primary">
        VILLA RECOMMENDER
      </p>

      {isLoadingStep ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="text-body font-semibold text-secondary">
              Analyzing your preferences...
            </p>
            <p className="text-caption text-muted">
              We&apos;re finding your perfect villa match
            </p>
          </div>
        </div>
      ) : (
        currentQuestion && (
          <>
            <p className="text-caption mt-2 text-center text-muted">
              {currentQuestion.step} of {TOTAL_QUESTIONS}
            </p>

            <h2 className="text-body mt-4 text-center text-lg font-semibold text-secondary">
              {currentQuestion.question}
            </h2>
            <p className="text-caption mb-6 mt-1 text-center text-muted">
              {currentQuestion.subtext}
            </p>

            <div className="grid flex-1 grid-cols-2 gap-3">
              {currentQuestion.options.map((option) => {
                const Icon = option.icon;
                const selected = answers[currentQuestion.key] === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      selectOption(currentQuestion.key, option.value)
                    }
                    aria-pressed={selected}
                    className={`flex min-h-[96px] flex-col items-center justify-center gap-2.5 rounded-[var(--radius-md)] border px-3 py-4 text-center transition-colors ${
                      selected
                        ? "border-primary bg-surface"
                        : "border-border bg-background hover:border-primary"
                    }`}
                  >
                    <Icon
                      className="h-6 w-6 text-primary"
                      strokeWidth={1.6}
                    />
                    <span className="text-caption font-medium leading-snug text-secondary">
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )
      )}

      {!isLoadingStep && (
        <div className="mt-6 flex flex-col gap-3.5">
          <div className="flex justify-center gap-1.5">
            {QUESTIONS.map((q) => (
              <span
                key={q.key}
                className={`h-1.5 rounded-full transition-all ${
                  q.step === step
                    ? "w-4 bg-primary"
                    : q.step < step
                      ? "w-1.5 bg-primary"
                      : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            disabled={!isCurrentAnswered}
            className="text-button rounded-[var(--radius-md)] bg-primary py-3 text-primary-foreground transition-opacity disabled:pointer-events-none disabled:opacity-35"
          >
            {step === TOTAL_QUESTIONS ? "See my results" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}