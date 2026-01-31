import { useEffect, useState } from "react";
import { useUserStore } from "../store/user";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";
import Link from "next/link";

interface Team {
  id: number;
  name: string;
  description?: string;
  avatar?: string;
  isPublic: boolean;
  maxMembers: number;
  owner?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  _count?: {
    members: number;
    expeditions: number;
  };
  createdAt: string;
}

export default function TeamsPage() {
  const { t } = useTranslation("common");
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const token = useUserStore((state) => state.token);
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      const stored = localStorage.getItem("token");
      if (!stored) {
        router.push("/login");
        return;
      }
    }

    fetch("http://localhost:3001/api/teams", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTeams(data);
        setIsLoading(false);
      })
      .catch(() => {
        alert(t("error_loading_teams"));
        setIsLoading(false);
      });
  }, [token]);

  const handleJoinTeam = async (teamId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/teams/${teamId}/join`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (response.ok) {
        alert(t("team_joined_success"));
        // Refresh teams list
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || t("error_join_team"));
      }
    } catch (error) {
      alert(t("connection_error"));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-ink"></div>
          <p className="mt-4 text-ink-muted">{t("loading_teams")}</p>
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
              {t("team_coordination")}
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink">{t("teams")}</h1>
          </div>
          <Link href="/teams/create">
            <button className="flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-pill transition hover:-translate-y-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t("create_team")}
            </button>
          </Link>
        </div>

        {teams.length === 0 ? (
          <div className="py-16 text-center">
            <svg className="mx-auto h-16 w-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-ink">{t("no_teams_available")}</h3>
            <p className="mt-2 text-ink-muted">{t("create_first_team")}</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => (
              <div key={team.id} className="animate-fade-up rounded-[28px] border border-slate-100/80 bg-white/90 shadow-card backdrop-blur transition hover:-translate-y-1">
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 text-xl font-semibold text-ink">{team.name}</h3>
                      <p className="mb-2 text-sm text-ink-muted">
                        {t("created_by")}: {team.owner?.name || team.owner?.email}
                      </p>
                    </div>
                    {team.avatar && (
                      <img 
                        src={team.avatar} 
                        alt={team.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                  </div>

                  {team.description && (
                    <p className="mb-4 line-clamp-2 text-ink-muted">{team.description}</p>
                  )}

                  <div className="mb-4 flex items-center gap-4 text-sm text-ink-muted">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {team._count?.members || 0}/{team.maxMembers}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      {team._count?.expeditions || 0}
                    </div>

                    {!team.isPublic && (
                      <div className="flex items-center gap-1 text-orange-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        {t("private")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/teams/${team.id}`}>
                      <button className="flex-1 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-slate-200">
                        {t("view_details")}
                      </button>
                    </Link>
                    
                    {team.isPublic && (team._count?.members || 0) < team.maxMembers && (
                      <button
                        onClick={() => handleJoinTeam(team.id)}
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
