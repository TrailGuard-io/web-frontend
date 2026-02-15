import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { API_BASE_URL } from "../../lib/api";
import { useUserStore } from "../../store/user";

interface ExpeditionMember {
  id: number;
  status: "pending" | "confirmed" | "cancelled";
  joinedAt: string;
  user: {
    id: number;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
}

interface ExpeditionLodging {
  name: string;
  type?: string;
  location?: string;
  notes?: string;
  checkIn?: string;
  checkOut?: string;
}

interface ExpeditionMedia {
  type?: "image" | "video";
  url: string;
  title?: string;
}

interface ExpeditionDetail {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  maxParticipants: number;
  cost?: number;
  isPremium: boolean;
  status: "planned" | "active" | "completed" | "cancelled";
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
  route?: Array<{
    lat: number;
    lng: number;
    name?: string;
  }>;
  lodgings?: ExpeditionLodging[];
  media?: Array<ExpeditionMedia | string>;
  creator: {
    id: number;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
  team?: {
    id: number;
    name: string;
    avatar?: string | null;
  };
  members?: ExpeditionMember[];
  _count?: {
    members: number;
  };
  createdAt: string;
}

const DIFFICULTY_COLORS = {
  beginner: "bg-green-100 text-green-800",
  intermediate: "bg-yellow-100 text-yellow-800",
  advanced: "bg-red-100 text-red-800",
  expert: "bg-purple-100 text-purple-800",
};

const STATUS_COLORS = {
  planned: "bg-blue-100 text-blue-800",
  active: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
  cancelled: "bg-red-100 text-red-800",
};

const MEMBER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-700",
};

export default function ExpeditionDetailPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const [expedition, setExpedition] = useState<ExpeditionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState<Record<number, boolean>>({});

  const expeditionId = useMemo(() => {
    if (!router.query.id) return null;
    const parsed = Number(router.query.id);
    return Number.isNaN(parsed) ? null : parsed;
  }, [router.query.id]);

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }

    if (!token) setToken(storedToken);
    if (!expeditionId) return;

    setIsLoading(true);
    setError(false);

    fetch(`${API_BASE_URL}/api/expeditions/${expeditionId}`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Expedition not found");
        return res.json();
      })
      .then((data) => {
        setExpedition(data);
      })
      .catch(() => {
        setError(true);
        setExpedition(null);
      })
      .finally(() => setIsLoading(false));
  }, [expeditionId, router, setToken, token]);

  const resolveAvatarUrl = (url?: string | null) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const normalized = url.startsWith("/") ? url : `/${url}`;
    return `${API_BASE_URL}${normalized}`;
  };

  const getInitials = (value: string) => {
    const parts = value.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
    return `${first}${last}`.toUpperCase();
  };

  const formatDate = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleDateString() : "-";

  const formatDateTime = (dateString?: string) =>
    dateString ? new Date(dateString).toLocaleString() : "-";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-ink"></div>
          <p className="mt-4 text-ink-muted">{t("loading_expedition")}</p>
        </div>
      </div>
    );
  }

  if (error || !expedition) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/90 p-8 shadow-card">
            <h1 className="font-display text-2xl font-semibold text-ink">
              {t("expedition_not_found")}
            </h1>
            <p className="mt-3 text-ink-muted">{t("error_loading_expedition")}</p>
            <button
              onClick={() => router.push("/expeditions")}
              className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-pill"
            >
              {t("back_to_expeditions")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const memberCount = expedition._count?.members ?? expedition.members?.length ?? 0;
  const confirmedMembers =
    expedition.members?.filter((member) => member.status === "confirmed").length ?? 0;
  const creator = expedition.creator;

  const hasStartPoint =
    typeof expedition.startLat === "number" && typeof expedition.startLng === "number";
  const hasEndPoint =
    typeof expedition.endLat === "number" && typeof expedition.endLng === "number";

  const routePoints =
    expedition.route && expedition.route.length > 0
      ? expedition.route
      : [
          ...(hasStartPoint
            ? [
                {
                  lat: expedition.startLat as number,
                  lng: expedition.startLng as number,
                  name: t("starting_point"),
                },
              ]
            : []),
          ...(hasEndPoint
            ? [
                {
                  lat: expedition.endLat as number,
                  lng: expedition.endLng as number,
                  name: t("ending_point"),
                },
              ]
            : []),
        ];

  const lodgings = expedition.lodgings ?? [];
  const mediaItems = Array.isArray(expedition.media) ? expedition.media : [];
  const normalizedMedia = mediaItems
    .map((item) => (typeof item === "string" ? { url: item, type: "image" } : item))
    .filter((item): item is ExpeditionMedia => Boolean(item?.url));

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <button
          onClick={() => router.push("/expeditions")}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-ink shadow-card transition hover:-translate-y-0.5"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("back_to_expeditions")}
        </button>

        <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                {t("expedition_details")}
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
                {expedition.title}
              </h1>
              <p className="mt-2 text-sm text-ink-muted">
                {t("created_by")}: {creator?.name || creator?.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {expedition.isPremium && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                  PRO
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${DIFFICULTY_COLORS[expedition.difficulty]}`}
              >
                {t(`difficulty_${expedition.difficulty}`)}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[expedition.status]}`}
              >
                {t(`status_${expedition.status}`)}
              </span>
            </div>
          </div>

          {expedition.description && (
            <p className="mt-4 text-ink-muted">{expedition.description}</p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("start_date")}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {formatDateTime(expedition.startDate)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("end_date")}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {formatDateTime(expedition.endDate)}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("participants")}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {memberCount}/{expedition.maxParticipants}
              </p>
              <p className="text-xs text-ink-muted">
                {confirmedMembers} {t("member_status_confirmed").toLowerCase()}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("cost")}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {expedition.cost != null ? `$${expedition.cost}` : "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("team")}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {expedition.team ? expedition.team.name : "-"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                {t("created_on")}
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                {formatDate(expedition.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("route_overview")}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {t("places_to_visit")}
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {routePoints.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
                    {t("no_route_available")}
                  </div>
                ) : (
                  routePoints.map((point, index) => (
                    <div
                      key={`${point.lat}-${point.lng}-${index}`}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink">
                          {point.name || `${t("route_point")} ${index + 1}`}
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-ink">
                          #{index + 1}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted">
                        {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("lodging_and_camps")}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {t("lodging_and_camps")}
                </h2>
              </div>

              <div className="mt-4 space-y-3">
                {lodgings.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
                    {t("no_lodgings_available")}
                    <span className="mt-1 block text-xs text-ink-muted">
                      {t("lodging_hint")}
                    </span>
                  </div>
                ) : (
                  lodgings.map((lodging, index) => (
                    <div
                      key={`${lodging.name}-${index}`}
                      className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-ink">{lodging.name}</p>
                        {lodging.type && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-ink">
                            {lodging.type}
                          </span>
                        )}
                      </div>
                      {lodging.location && (
                        <p className="mt-1 text-xs text-ink-muted">{lodging.location}</p>
                      )}
                      {(lodging.checkIn || lodging.checkOut) && (
                        <p className="mt-1 text-xs text-ink-muted">
                          {formatDate(lodging.checkIn)} - {formatDate(lodging.checkOut)}
                        </p>
                      )}
                      {lodging.notes && (
                        <p className="mt-2 text-xs text-ink-muted">{lodging.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("media_gallery")}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {t("media_gallery")}
                </h2>
              </div>

              <div className="mt-4">
                {normalizedMedia.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
                    {t("no_media_available")}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {normalizedMedia.map((item, index) => (
                      <div
                        key={`${item.url}-${index}`}
                        className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
                      >
                        {item.type === "video" ? (
                          <video controls className="h-40 w-full object-cover">
                            <source src={item.url} />
                          </video>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.title || `${t("media_gallery")} ${index + 1}`}
                            className="h-40 w-full object-cover"
                          />
                        )}
                        <div className="px-3 py-2 text-xs text-ink-muted">
                          {item.title || (item.type === "video" ? "Video" : "Imagen")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("team_coordination")}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {t("created_by")}
                </h2>
              </div>

              <div className="mt-4 flex items-center gap-3">
                {creator?.avatar && !avatarErrors[creator.id] ? (
                  <img
                    src={resolveAvatarUrl(creator.avatar) || undefined}
                    alt={creator.name || creator.email}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={() =>
                      setAvatarErrors((prev) => ({ ...prev, [creator?.id ?? 0]: true }))
                    }
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-ink">
                    {getInitials(creator?.name || creator?.email || "-")}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {creator?.name || creator?.email}
                  </p>
                  <p className="text-xs text-ink-muted">{creator?.email}</p>
                </div>
              </div>

              {expedition.team && (
                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-ink-muted">
                    {t("team")}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink">{expedition.team.name}</p>
                    <Link
                      href={`/teams/${expedition.team.id}`}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink"
                    >
                      {t("view_details")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                    {t("participants")}
                  </p>
                  <h2 className="font-display text-xl font-semibold text-ink">
                    {t("members")}
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                  {memberCount}/{expedition.maxParticipants}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {expedition.members && expedition.members.length > 0 ? (
                  expedition.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        {member.user.avatar && !avatarErrors[member.user.id] ? (
                          <img
                            src={resolveAvatarUrl(member.user.avatar) || undefined}
                            alt={member.user.name || member.user.email}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={() =>
                              setAvatarErrors((prev) => ({
                                ...prev,
                                [member.user.id]: true,
                              }))
                            }
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-ink">
                            {getInitials(member.user.name || member.user.email)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            {member.user.name || member.user.email}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${MEMBER_STATUS_COLORS[member.status]}`}
                      >
                        {t(`member_status_${member.status}`)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
                    {t("no_members_available")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ["common"])),
    },
  };
}
