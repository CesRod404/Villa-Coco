"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./HeroNavbar.module.css";

const navigation = [
  { label: "Home", href: "/", match: "/" },
  { label: "About us", href: "/#about-us", match: "#about-us" },
  { label: "Villas", href: "/villas", match: "/villas" },
  { label: "Wellness", href: "/retreats", match: "/retreats" },
  { label: "Hotels", href: "/packages", match: "/packages" },
  { label: "Weddings", href: "/#weddings", match: "#weddings" },
  { label: "Galleries", href: "/#galleries", match: "#galleries" },
  { label: "Inquiries", href: "/#inquiries", match: "#inquiries" },
] as const;

export default function HeroNavbar() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash);
    updateHash();
    window.addEventListener("hashchange", updateHash);
    return () => window.removeEventListener("hashchange", updateHash);
  }, []);

  const isActive = (match: string) => {
    if (match.startsWith("#")) return pathname === "/" && hash === match;
    if (match === "/") return pathname === "/" && !hash;
    return pathname.startsWith(match);
  };

  return (
    <>
      <nav className={styles.desktopNav} aria-label="Main navigation">
        <div className={styles.navInner}>
          {navigation.map((item) => {
            const active = isActive(item.match);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${styles.navLink} ${active ? styles.active : ""}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <details className={styles.mobileMenu}>
        <summary>Explore</summary>
        <nav aria-label="Mobile navigation">
          {navigation.map((item) => {
            const active = isActive(item.match);
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={active ? styles.mobileActive : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </details>
    </>
  );
}
