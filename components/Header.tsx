import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const router = useRouter();
  const { locale, push, pathname, query } = router;
  const { t } = useTranslation("common");
  const nextLocale = locale === "es" ? "en" : "es";
  const [menuOpen, setMenuOpen] = useState(false);

  const switchLanguage = () => {
    push({ pathname, query }, undefined, { locale: nextLocale });
  };

  const navItems = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/rescue", label: t("rescue") },
    { href: "/expeditions", label: t("expeditions") },
    { href: "/teams", label: t("teams") },
    { href: "/subscription", label: t("subscription") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-3 rounded-full bg-white px-3 py-2 shadow-pill transition hover:-translate-y-0.5"
        >
          <img
            src="/images/logo2.png"
            alt="TrailGuard"
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-500">
              Sistema oficial
            </p>
            <p className="font-display text-lg font-semibold text-ink">
              TrailGuard
            </p>
          </div>
        </button>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                pathname === item.href
                  ? "bg-ink text-white shadow-pill"
                  : "bg-white text-ink hover:-translate-y-0.5 hover:bg-slate-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink shadow-pill md:hidden"
            aria-label="Abrir menú"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={switchLanguage}
            className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink shadow-pill"
          >
            🌐 {locale?.toUpperCase()}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden">
          <div className="mx-4 mb-4 rounded-3xl bg-white/90 p-4 shadow-card">
            <div className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    pathname === item.href
                      ? "bg-ink text-white"
                      : "bg-slate-50 text-ink"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
