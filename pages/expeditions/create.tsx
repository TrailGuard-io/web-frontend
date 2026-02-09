import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { API_BASE_URL } from "../../lib/api";
import { useUserStore } from "../../store/user";
import { toast } from "react-toastify";

interface FeatureFlags {
  expeditions: boolean;
}

interface TeamOption {
  id: number;
  name: string;
}

const DIFFICULTY_OPTIONS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export default function CreateExpeditionPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const [flags, setFlags] = useState<FeatureFlags | null>(null);
  const [loadingFlags, setLoadingFlags] = useState(true);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    difficulty: "beginner",
    maxParticipants: 10,
    cost: "",
    isPremium: false,
    teamId: "",
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
      .catch(() => setFlags({ expeditions: false }))
      .finally(() => setLoadingFlags(false));
  }, [router, setToken, token]);

  useEffect(() => {
    if (!flags?.expeditions) return;
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;

    setLoadingTeams(true);
    fetch(`${API_BASE_URL}/api/teams`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid teams response");
        }
        setTeams(data.map((team) => ({ id: team.id, name: team.name })));
      })
      .catch(() => setTeams([]))
      .finally(() => setLoadingTeams(false));
  }, [flags?.expeditions, token]);

  const updateField = (key: keyof typeof formData, value: string | boolean | number) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error(t("expedition_title_required"));
      return;
    }

    if (!formData.startDate) {
      toast.error(t("start_date_required"));
      return;
    }

    if (formData.maxParticipants < 2 || formData.maxParticipants > 100) {
      toast.error(t("invalid_max_participants"));
      return;
    }

    if (formData.cost && Number(formData.cost) < 0) {
      toast.error(t("invalid_cost"));
      return;
    }

    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }

    const payload: Record<string, any> = {
      title: formData.title.trim(),
      startDate: formData.startDate,
      difficulty: formData.difficulty,
      maxParticipants: formData.maxParticipants,
      isPremium: formData.isPremium,
    };

    if (formData.description.trim()) payload.description = formData.description.trim();
    if (formData.endDate) payload.endDate = formData.endDate;
    if (formData.cost) payload.cost = Number(formData.cost);
    if (formData.teamId) payload.teamId = Number(formData.teamId);

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/api/expeditions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${storedToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || t("error"));
        return;
      }

      toast.success(t("expedition_created_successfully"));
      router.push("/expeditions");
    } catch {
      toast.error(t("connection_error"));
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

  if (!flags?.expeditions) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/90 p-8 shadow-card">
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              {t("guided_exploration")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
              {t("create_expedition")}
            </h1>
            <p className="mt-3 text-ink-muted">{t("expedition_creation_premium_feature")}</p>
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
            {t("guided_exploration")}
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {t("create_expedition")}
          </h1>
        </div>

        <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-8 shadow-card backdrop-blur">
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-ink">{t("expedition_title")}</label>
              <input
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder={t("enter_expedition_title")}
                maxLength={200}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink-muted">{formData.title.length}/200</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink">{t("expedition_description")}</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                placeholder={t("enter_expedition_description")}
                rows={4}
                maxLength={500}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink-muted">
                {formData.description.length}/500
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-ink">{t("start_date")}</label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">{t("end_date")}</label>
                <input
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-ink">{t("difficulty")}</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => updateField("difficulty", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t(`difficulty_${option}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">{t("max_participants")}</label>
                <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => updateField("maxParticipants", Math.max(2, formData.maxParticipants - 1))}
                    className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink shadow-sm"
                  >
                    -
                  </button>
                  <span className="text-lg font-semibold text-ink">
                    {formData.maxParticipants}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateField("maxParticipants", Math.min(100, formData.maxParticipants + 1))}
                    className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-ink shadow-sm"
                  >
                    +
                  </button>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{t("participants_range_help")}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-ink">{t("cost_optional")}</label>
                <input
                  type="number"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => updateField("cost", e.target.value)}
                  placeholder={t("cost_placeholder")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-ink">{t("team_optional")}</label>
                <select
                  value={formData.teamId}
                  onChange={(e) => updateField("teamId", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink focus:border-ink focus:outline-none"
                >
                  <option value="">{t("no_team")}</option>
                  {loadingTeams ? (
                    <option value="" disabled>
                      {t("loading_teams")}
                    </option>
                  ) : (
                    teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">{t("premium_expedition")}</p>
                <p className="text-xs text-ink-muted">{t("premium_expedition_hint")}</p>
              </div>
              <button
                type="button"
                onClick={() => updateField("isPremium", !formData.isPremium)}
                className={`h-8 w-14 rounded-full p-1 transition ${
                  formData.isPremium ? "bg-emerald-400" : "bg-slate-300"
                }`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-white transition ${
                    formData.isPremium ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? t("processing") : t("create_expedition")}
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
