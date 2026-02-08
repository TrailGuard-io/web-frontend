import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { API_BASE_URL } from "../../lib/api";
import { useUserStore } from "../../store/user";
import Link from "next/link";

interface TeamMember {
  id: number;
  role: string;
  joinedAt: string;
  user: {
    id: number;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
}

interface TeamExpedition {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
  status: "planned" | "active" | "completed" | "cancelled";
  maxParticipants: number;
  cost?: number;
  _count?: {
    members: number;
  };
}

interface TeamDetail {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  isPublic: boolean;
  maxMembers: number;
  owner: {
    id: number;
    name?: string | null;
    email: string;
    avatar?: string | null;
  };
  members: TeamMember[];
  expeditions: TeamExpedition[];
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

export default function TeamDetailPage() {
  const { t } = useTranslation("common");
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [avatarErrors, setAvatarErrors] = useState<Record<number, boolean>>({});

  const teamId = useMemo(() => {
    if (!router.query.id) return null;
    const parsed = Number(router.query.id);
    return Number.isNaN(parsed) ? null : parsed;
  }, [router.query.id]);

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

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString();

  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) {
      router.push("/login");
      return;
    }

    if (!token) setToken(storedToken);

    if (!teamId) return;

    setIsLoading(true);
    setError(false);

    fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Team not found");
        return res.json();
      })
      .then((data) => {
        setTeam(data);
      })
      .catch(() => {
        setError(true);
        setTeam(null);
      })
      .finally(() => setIsLoading(false));
  }, [router, setToken, teamId, token]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-ink"></div>
          <p className="mt-4 text-ink-muted">{t("loading_team")}</p>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen px-4 py-12">
        <div className="mx-auto w-full max-w-3xl">
          <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/90 p-8 shadow-card">
            <h1 className="font-display text-2xl font-semibold text-ink">
              {t("team_not_found")}
            </h1>
            <p className="mt-3 text-ink-muted">{t("error_loading_team")}</p>
            <button
              onClick={() => router.push("/teams")}
              className="mt-6 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-pill"
            >
              {t("back_to_teams")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              {team.avatar && !avatarErrors[team.id] ? (
                <img
                  src={resolveAvatarUrl(team.avatar) || undefined}
                  alt={team.name}
                  className="h-16 w-16 rounded-2xl object-cover"
                  onError={() =>
                    setAvatarErrors((prev) => ({ ...prev, [team.id]: true }))
                  }
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-lg font-semibold text-ink">
                  {getInitials(team.name)}
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("team_coordination")}
                </p>
                <h1 className="font-display text-3xl font-semibold text-ink">
                  {team.name}
                </h1>
                <p className="mt-1 text-sm text-ink-muted">
                  {t("created_by")}: {team.owner?.name || team.owner?.email}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {!team.isPublic && (
                <span className="inline-flex items-center rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                  {t("private")}
                </span>
              )}
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                {team.members.length}/{team.maxMembers} {t("members")}
              </span>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                {team.expeditions.length} {t("expeditions")}
              </span>
            </div>
          </div>

          {team.description && (
            <p className="mt-4 text-ink-muted">{team.description}</p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("team_members")}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {t("members")}
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                {team.members.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {team.members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
                  {t("no_members_available")}
                </div>
              ) : (
                team.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {member.user.avatar &&
                      !avatarErrors[member.user.id] ? (
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
                          {t("member_since")}: {formatDate(member.joinedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                      {member.role === "admin" ? t("role_admin") : t("role_member")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-100/80 bg-white/90 p-6 shadow-card backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink-muted">
                  {t("team_expeditions")}
                </p>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {t("expeditions")}
                </h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink">
                {team.expeditions.length}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {team.expeditions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-muted">
                  {t("no_expeditions_available")}
                </div>
              ) : (
                team.expeditions.map((expedition) => (
                  <div
                    key={expedition.id}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-ink">
                          {expedition.title}
                        </p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {formatDate(expedition.startDate)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${STATUS_COLORS[expedition.status]}`}
                        >
                          {t(`status_${expedition.status}`)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${DIFFICULTY_COLORS[expedition.difficulty]}`}
                        >
                          {t(`difficulty_${expedition.difficulty}`)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                      <span>
                        {expedition._count?.members || 0}/
                        {expedition.maxParticipants} {t("members")}
                      </span>
                      <Link
                        href={`/expeditions/${expedition.id}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink"
                      >
                        {t("view_details")}
                      </Link>
                    </div>
                  </div>
                ))
              )}
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
