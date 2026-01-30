import { useState } from "react";
import { useRouter } from "next/router";
import { useUserStore } from "../store/user";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LoginPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const setToken = useUserStore((state) => state.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Completa todos los campos");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login inválido");
        return;
      }

      localStorage.setItem("token", data.token);
      setToken(data.token);
      toast.success("Login exitoso");
      router.push("/dashboard");
    } catch {
      toast.error("Error al conectar");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <ToastContainer />
      <div className="absolute -top-10 left-10 h-40 w-40 rounded-full bg-red-100 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-48 w-48 rounded-full bg-sky-100 blur-3xl" />

      <div className="relative w-full max-w-md rounded-[32px] bg-white/90 p-8 shadow-card backdrop-blur">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo2.png"
            alt="TrailGuard"
            className="h-12 w-12 rounded-2xl object-cover"
          />
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-red-500">
              Sistema oficial
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {t("login")}
            </h1>
          </div>
        </div>

        <p className="mt-3 text-sm text-ink-muted">
          Accedé a tus expediciones y rescates en tiempo real.
        </p>

        <form onSubmit={login} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none"
          />
          <input
            type="password"
            required
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-ink focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-ink py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
          >
            {t("login")}
          </button>
        </form>
      </div>
    </div>
  );
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
