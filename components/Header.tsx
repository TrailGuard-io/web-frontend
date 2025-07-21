import { useRouter } from "next/router";
import { useUserStore } from "../store/user";

export default function Header() {
  const router = useRouter();
  const { locale, push, pathname, query } = router;
  const nextLocale = locale === "es" ? "en" : "es";

  const switchLanguage = () => {
    push({ pathname, query }, undefined, { locale: nextLocale });
  };

  return (
    <header className="w-full bg-white shadow-md px-4 py-3 flex items-center justify-between">
      <h1
        className="text-xl font-bold text-red-600 cursor-pointer"
        onClick={() => router.push("/")}
      >
        TrailGuard
      </h1>
      <div className="flex items-center gap-4">
        <button onClick={switchLanguage} className="text-sm text-gray-600">
          🌐 {locale?.toUpperCase()}
        </button>
      </div>
    </header>
  );
}
