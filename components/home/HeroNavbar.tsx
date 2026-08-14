"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./HeroNavbar.module.css";

const navigation = [
  { label: "Home", id: "home" },
  { label: "Villas", id: "villas" },
  { label: "Mix & Match", id: "mix-match" },
  { label: "Guest Stories", id: "testimonials" },
  { label: "Services", id: "services" },
  { label: "Contact", id: "contact" },
] as const;

export default function HeroNavbar() {
  const [activeId, setActiveId] = useState("home");
  const menuRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    let ticking = false;

    const updateActiveSection = () => {
      const marker = Math.min(180, window.innerHeight * 0.28);
      let current = "home";

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        setActiveId("contact");
        ticking = false;
        return;
      }

      for (const item of navigation) {
        const section = document.getElementById(item.id);
        if (section && section.getBoundingClientRect().top <= marker) current = item.id;
      }

      setActiveId(current);
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateActiveSection);
        ticking = true;
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  function selectSection(id: string) {
    setActiveId(id);
    menuRef.current?.removeAttribute("open");
  }

  return (
    <>
      <nav className={styles.desktopNav} aria-label="Main page sections">
        <div className={styles.navInner}>
          {navigation.map((item) => {
            const active = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={`${styles.navLink} ${active ? styles.active : ""}`}
                onClick={() => selectSection(item.id)}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      </nav>

      <details ref={menuRef} className={styles.mobileMenu}>
        <summary>Explore</summary>
        <nav aria-label="Mobile page sections">
          {navigation.map((item) => {
            const active = activeId === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={active ? styles.mobileActive : undefined}
                onClick={() => selectSection(item.id)}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </details>
    </>
  );
}
