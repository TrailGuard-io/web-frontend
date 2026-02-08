import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { API_BASE_URL } from "../../lib/api";
import { useUserStore } from "../../store/user";

interface FeatureFlags {
  teams: boolean;
}

export default function CreateTeamPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: true,
    maxMembers: 10,
  });

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }

    if (!token) setToken(storedToken);

    fetch(`${API_BASE_URL}/api/flags`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => setFlags(data?.flags ?? null))
      .catch(() => setFlags({ teams: false }))
      .finally(() => setLoadingFlags(false));
  }, [router, setToken, token]);

  const updateField = (key: keyof typeof formData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      alert(t("team_name_required"));
      return;
    }

    if (formData.maxMembers < 2 || formData.maxMembers > 50) {
      alert(t("invalid_max_members"));
      return;
    }

    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          isPublic: formData.isPublic,
          maxMembers: formData.maxMembers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || t("error"));
        return;
      }

      alert(t("team_created_successfully"));
      router.push("/teams");
    } catch {
      alert(t("connection_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingFlags) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-ink"></div>
          <p className="mt-4 text-ink-muted">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!flags?.teams) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/90 p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              {t("team_coordination")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
              {t("create_team")}
            </h1>
            <p className="mt-3 text-ink-muted">{t("team_creation_premium_feature")}</p>
            <button
              onClick={() => router.push("/subscription")}
              className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
            >
              {t("upgrade_to_premium")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
            {t("team_coordination")}
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {t("create_team")}
          </h1>
        </div>

        <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-8 shadow-card backdrop-blur">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-ink">{t("team_name")}</label>
              <input
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder={t("enter_team_name")}
                maxLength={100}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink-muted">{formData.name.length}/100</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink">{t("team_description")}</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder={t("enter_team_description")}
                rows={4}
                maxLength={500}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink-muted">
                {formData.description.length}/500
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
              <div>
                <label className="text-sm font-semibold text-ink">{t("public_team")}</label>
                <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {formData.isPublic ? t("anyone_can_join") : t("invite_only")}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {formData.isPublic ? t("public_team") : t("private_team")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField("isPublic", !formData.isPublic)}
                    className={`h-8 w-14 rounded-full p-1 transition ${
                      formData.isPublic ? "bg-emerald-400" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`block h-6 w-6 rounded-full bg-white transition ${
                        formData.isPublic ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-ink">{t("max_members")}</label>
                <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => updateField("maxMembers", Math.max(2, formData.maxMembers - 1))}
                    className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold text-ink">
                    {formData.maxMembers}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateField("maxMembers", Math.min(50, formData.maxMembers + 1))}
                    className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink shadow-sm"
                  >
                    +
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{t("members_range_help")}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t("processing") : t("create_team")}
            </button>
          </div>
        </div>
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
