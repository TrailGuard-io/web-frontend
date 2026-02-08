import { useEffect, useState } from "react";
import { useUserStore } from "../store/user";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import { API_BASE_URL } from "../lib/api";
import Link from "next/link";

interface Expedition {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  maxParticipants: number;
  cost?: number;
  isPremium: boolean;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  creator?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  team?: {
    id: number;
    name: string;
    avatar?: string;
  };
  _count?: {
    members: number;
  };
  createdAt: string;
}

const DIFFICULTY_COLORS = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800',
  expert: 'bg-purple-100 text-purple-800',
};

const STATUS_COLORS = {
  planned: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ExpeditionsPage() {
  const { t } = useTranslation("common");
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'planned' | 'active'>('all');
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const router = useRouter();

  useEffect(() => {
    let storedToken = token;
    if (!storedToken) {
      const stored = localStorage.getItem("token");
      if (!stored) {
        router.push("/login");
        return;
      }
      storedToken = stored;
      setToken(stored);
    }

    const params = filter !== 'all' ? `?status=${filter}` : '';
    
    fetch(`${API_BASE_URL}/api/expeditions${params}`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("Invalid expeditions response");
        }
        setExpeditions(data);
        setIsLoading(false);
      })
      .catch(() => {
        alert(t("error_loading_expeditions"));
        setExpeditions([]);
        setIsLoading(false);
      });

    fetch(`${API_BASE_URL}/api/subscriptions/current`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => res.json())
      .then((data) => setSubscriptionPlan(data.currentPlan || "free"))
      .catch(() => undefined);
  }, [token, filter, router, setToken]);

  const handleJoinExpedition = async (expeditionId: number) => {
    if (subscriptionPlan === "free") {
      alert(t("premium_required"));
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/expeditions/${expeditionId}/join`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (response.ok) {
        alert(t("expedition_joined_success"));
        window.location.reload();
      } else {
        const error = await response.json();
        if (response.status === 403) {
          alert(t("premium_required"));
        } else {
          alert(error.error || t("error_join_expedition"));
        }
      }
    } catch (error) {
      alert(t("connection_error"));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-ink"></div>
          <p className="mt-4 text-ink-muted">{t("loading_expeditions")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
              {t("guided_exploration")}
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink">
              {t("expeditions")}
            </h1>
        </div>
          <button
            onClick={() => {
              if (subscriptionPlan === "free") {
                alert(t("premium_required"));
                router.push("/subscription");
                return;
              }
              router.push("/expeditions/create");
            }}
            className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t("create_expedition")}
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          {(['all', 'planned', 'active'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                filter === filterOption
                  ? 'bg-ink text-white shadow-pill'
                  : 'bg-white text-ink hover:-translate-y-0.5 hover:bg-slate-50'
              }`}
            >
              {t(filterOption)}
            </button>
          ))}
        </div>

        {expeditions.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-ink">{t("no_expeditions_available")}</h3>
            <p className="mt-2 text-ink-muted">{t("create_first_expedition")}</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {expeditions.map((expedition) => (
              <div key={expedition.id} className="animate-fade-up rounded-[28px] border border-slate-100/80 bg-white/90 shadow-card backdrop-blur transition hover:-translate-y-1">
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="text-xl font-semibold text-ink">{expedition.title}</h3>
                        {expedition.isPremium && (
                          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            PRO
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[expedition.difficulty]}`}>
                          {t(`difficulty_${expedition.difficulty}`)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[expedition.status]}`}>
                          {t(`status_${expedition.status}`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {expedition.description && (
                    <p className="mb-4 line-clamp-2 text-ink-muted">{expedition.description}</p>
                  )}

                  <div className="mb-4 grid grid-cols-2 gap-4 text-sm text-ink-muted">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(expedition.startDate)}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {expedition._count?.members || 0}/{expedition.maxParticipants}
                    </div>

                    {expedition.cost && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        ${expedition.cost}
                      </div>
                    )}

                    {expedition.team && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {expedition.team.name}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200/70 pt-4">
                    <div className="text-sm text-ink-muted">
                      {t("by")} {expedition.creator?.name || expedition.creator?.email}
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/expeditions/${expedition.id}`}>
                        <button className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-200">
                          {t("view_details")}
                        </button>
                      </Link>
                      
                      {expedition.status === 'planned' && (expedition._count?.members || 0) < expedition.maxParticipants && (
                        <button
                          onClick={() => handleJoinExpedition(expedition.id)}
                          className="flex items-center gap-1 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {t("join")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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
