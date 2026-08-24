"use client";

/**
 * components/recommender/VillaRecommender.tsx
 *
 * Quiz de 4 preguntas para recomendar una villa. Componente de cliente
 * autocontenido: maneja su propio estado (paso actual + respuestas). Al
 * terminar la última pregunta, entrega las respuestas directo al padre
 * vía `onComplete(answers)` — el padre (FindVillaChatButton.tsx) es
 * quien muestra la pantalla de "Analyzing..." mientras llama a la API
 * real de app/api/recommend. Antes este componente tenía su PROPIA
 * pantalla de "Analyzing" también, lo que duplicaba la animación
 * (una falsa de 1.6s aquí, y otra real después) — se quitó para dejar
 * una sola pantalla de carga, la del padre.
 *
 * Usa los design tokens ya definidos en app/globals.css
 * (--text-heading, --text-eyebrow, --text-body, --text-button, --color-primary,
 * --color-secondary, --color-border, --color-chip-alt, --radius-md, --shadow-card),
 * los mismos que ya referencian "Villa Recommender" en los comentarios del tema.
 *
 * Selección: cada opción es un radio button estilizado (círculo a la
 * derecha) — sin íconos temáticos, siguiendo el Figma. Al seleccionar,
 * toda la tarjeta se pinta con --surface y el círculo se rellena.
 *
 * Altura y ancho fijos: las 4 preguntas comparten EXACTAMENTE el mismo
 * tamaño (384px × 440px) — reforzado con line-clamp en
 * título/subtexto/labels y un grid-rows-2 explícito para las opciones,
 * así ningún texto más largo puede empujar el layout.
 */

import { useState } from "react";
import { X, ChevronLeft } from "lucide-react";
import styles from "./VillaRecommender.module.css";

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
}

interface QuestionConfig<T extends string> {
  key: AnswerKey;
  step: number;
  question: string;
  subtext: string;
  options: Option<T>[];
}

const PEOPLE_OPTIONS: Option<PeopleAnswer>[] = [
  { value: "couple", label: "Just the two of us" },
  { value: "small", label: "3-4 persons" },
  { value: "group", label: "5-6 persons" },
  { value: "large", label: "7 persons or more" },
];

const ATMOSPHERE_OPTIONS: Option<AtmosphereAnswer>[] = [
  { value: "peaceful", label: "Peaceful, quiet retreat" },
  { value: "lively", label: "Lively and social" },
  { value: "luxurious", label: "Luxurious and elegant" },
  { value: "rustic", label: "Rustic and natural" },
];

const ACTIVITY_OPTIONS: Option<ActivityAnswer>[] = [
  { value: "pool", label: "Swim & relax by the pool" },
  { value: "cooking", label: "Cooking with local produce" },
  { value: "exploring", label: "Exploring the surroundings" },
  { value: "dining", label: "Dining out & nightlife" },
];

const NIGHTS_OPTIONS: Option<NightsAnswer>[] = [
  { value: "short", label: "3 – 4 nights" },
  { value: "week", label: "One week" },
  { value: "long", label: "10 – 14 nights" },
  { value: "extended", label: "More than two weeks" },
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
    subtext: "The time is yours",
    options: NIGHTS_OPTIONS,
  },
];

const TOTAL_QUESTIONS = QUESTIONS.length;

interface VillaRecommenderProps {
  /** Se dispara al terminar la pregunta 4, con las 4 respuestas ya completas. */
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

  const currentQuestion = QUESTIONS[step - 1];

  function selectOption<T extends string>(key: AnswerKey, value: T) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function goNext() {
    if (step < TOTAL_QUESTIONS) {
      setStep(step + 1);
      return;
    }

    // Última pregunta: entrega las respuestas directo al padre, que se
    // encarga de la pantalla de carga real mientras llama a la API.
    const finalAnswers = answers as VillaRecommenderAnswers;
    onComplete?.(finalAnswers);
  }

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  const isCurrentAnswered = Boolean(answers[currentQuestion.key]);

  return (
    <div className={`${styles.modal} ${className}`}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button
          type="button"
          onClick={goBack}
          aria-label="Back"
          className={`${styles.iconButton} ${step === 1 ? styles.invisible : ""}`}
        >
          <ChevronLeft size={22} />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className={styles.iconButton}
        >
          <X size={22} />
        </button>
      </div>

      <div>
        <p className={styles.heading}>VILLA RECOMMENDER</p>
        <span className={styles.headingLine} />
      </div>

      <div className="flex flex-1 flex-col">
        <p className={styles.step}>
          {currentQuestion.step} of {TOTAL_QUESTIONS}
        </p>

        {/* line-clamp-2 + min-h: sea 1 o 2 líneas, la pregunta SIEMPRE
            ocupa el mismo espacio, así el layout nunca se mueve. */}
        <h2 className={styles.question}>
          {currentQuestion.question}
        </h2>
        <p className={styles.subtext}>
          {currentQuestion.subtext}
        </p>

        <div className={styles.options}>
          {currentQuestion.options.map((option) => {
            const selected = answers[currentQuestion.key] === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectOption(currentQuestion.key, option.value)}
                aria-pressed={selected}
                className={`${styles.option} ${selected ? styles.optionSelected : ""}`}
              >
                <span>{option.label}</span>

                {/* Radio indicator */}
                <span
                  className={styles.radio}
                >
                  {selected && <span className={styles.radioDot} />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.progress} aria-label={`Step ${step} of ${TOTAL_QUESTIONS}`}>
          {QUESTIONS.map((q) => (
            <span
              key={q.key}
              className={`${styles.progressDot} ${
                q.step === step ? styles.progressCurrent : q.step < step ? styles.progressDone : ""
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={!isCurrentAnswered}
          className={styles.continueButton}
        >
          {step === TOTAL_QUESTIONS ? "See my results" : "Continue"}
        </button>
      </div>
    </div>
  );
}
