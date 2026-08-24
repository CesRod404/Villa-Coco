"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import styles from "./CookiePreferences.module.css";

type Preferences = {
  analytics: boolean;
  advertising: boolean;
};

const STORAGE_KEY = "villa-coco-cookie-preferences";

export default function CookiePreferences({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<Preferences>({
    analytics: true,
    advertising: true,
  });
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setPreferences(JSON.parse(stored) as Preferences);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    setOpen(false);
  }

  return (
    <>
      <button type="button" className={`${styles.trigger} ${className}`} onClick={() => setOpen(true)}>
        Cookies preferences
      </button>

      {open && (
        <div className={styles.backdrop} onMouseDown={() => setOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-dialog-title"
            className={styles.dialog}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.header}>
              <h2 id="cookie-dialog-title">Manage Cookies</h2>
              <button ref={closeRef} type="button" aria-label="Close cookie preferences" onClick={() => setOpen(false)}>
                <X aria-hidden="true" size={28} />
              </button>
            </header>

            <div className={styles.section}>
              <div className={styles.sectionHeading}>
                <h3>Necessary</h3>
                <span className={styles.always}>Always on</span>
              </div>
              <p>Required to enable core site functionality and to remember user preferences and choices, such as language preferences or customized settings.</p>
            </div>

            <CookieToggle
              title="Performance and Analytics"
              description="These cookies provide quantitative measures of website visitors. With their use we can count visits and traffic sources to improve the performance of our site."
              checked={preferences.analytics}
              onChange={(analytics) => setPreferences((current) => ({ ...current, analytics }))}
            />

            <CookieToggle
              title="Advertising"
              description="These cookies are used by advertising companies to serve ads that are relevant to your interests."
              checked={preferences.advertising}
              onChange={(advertising) => setPreferences((current) => ({ ...current, advertising }))}
            />

            <div className={styles.actions}>
              <button type="button" onClick={save}>Save Preferences</button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function CookieToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeading}>
        <h3>{title}</h3>
        <div className={styles.toggleGroup}>
          <span>{checked ? "On" : "Off"}</span>
          <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={`${title}: ${checked ? "on" : "off"}`}
            className={`${styles.toggle} ${checked ? styles.toggleOn : ""}`}
            onClick={() => onChange(!checked)}
          >
            <span />
          </button>
        </div>
      </div>
      <p>{description}</p>
    </div>
  );
}
