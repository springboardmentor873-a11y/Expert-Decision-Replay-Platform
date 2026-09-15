import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { AvatarInitials } from "../components/AvatarInitials";
import { api, type Team, type TeamDetail } from "../lib/api";

function TeamCard({ team, onClick }: { team: Team; onClick: () => void }) {
  return (
    <div className="team-card" onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <div className="stat-icon-circle stat-icon-blue" style={{ fontSize: 22 }}>👥</div>
        <div>
          <div className="team-card-name">{team.name}</div>
          <div className="team-card-dept">{team.department}</div>
        </div>
      </div>
      <div className="team-card-footer">
        <div className="member-avatars">
          {/* Placeholder avatars — real avatars shown in detail */}
          {[...Array(Math.min(team.member_count, 4))].map((_, i) => (
            <div
              key={i}
              className="avatar-circle avatar-sm"
              style={{
                background: ["#3b6bdd", "#059669", "#d97706", "#dc2626"][i % 4],
                marginRight: i < Math.min(team.member_count, 4) - 1 ? -8 : 0,
                border: "2px solid #fff",
              }}
            >
              {String.fromCharCode(65 + i)}
            </div>
          ))}
        </div>
        <span className="text-sm text-muted">{team.member_count} member{team.member_count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

function TeamDetailPanel({ team, onBack }: { team: TeamDetail; onBack: () => void }) {
  const navigate = useNavigate();
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>← Back</button>
        <h2 style={{ margin: 0 }}>{team.name}</h2>
        <span className="role-badge">{team.department}</span>
      </div>
      <div className="card">
        <div className="card-title">Members ({team.member_count})</div>
        {team.members.map((m) => (
          <div key={m.user_id} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "12px 0", borderBottom: "1px solid var(--slate-100)" }}>
            <AvatarInitials name={m.full_name} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{m.full_name}</div>
              <div className="text-sm text-muted">{m.designation} · {m.role}</div>
              {m.active_decisions.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div className="text-sm" style={{ color: "var(--slate-600)", marginBottom: 4 }}>Active decisions:</div>
                  {m.active_decisions.map((d) => (
                    <div
                      key={d.id}
                      style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, cursor: "pointer" }}
                      onClick={() => navigate(`/decisions/${d.id}`)}
                    >
                      <span className="text-sm" style={{ color: "var(--brand)" }}>→ {d.title}</span>
                      <span className={`badge badge-${d.status.toLowerCase().replace(" ", "-")}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {team.members.length === 0 && <p className="text-muted text-sm">No members in this team yet.</p>}
      </div>
    </div>
  );
}

export function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<TeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    api.get<Team[]>("/teams")
      .then(setTeams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectTeam = async (id: number) => {
    try {
      const detail = await api.get<TeamDetail>(`/teams/${id}`);
      setSelectedTeam(detail);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <AppLayout title="Teams">
      <div className="page-header">
        <div>
          <h2>Teams</h2>
          <p>View teams and their members across the organization.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <div className="loading-row"><div className="spinner" /></div>}

      {selectedTeam ? (
        <TeamDetailPanel team={selectedTeam} onBack={() => setSelectedTeam(null)} />
      ) : (
        <div className="teams-grid">
          {!loading && teams.length === 0 && (
            <p className="text-muted">No teams found for your account.</p>
          )}
          {teams.map((t) => (
            <TeamCard key={t.id} team={t} onClick={() => handleSelectTeam(t.id)} />
          ))}
        </div>
      )}
    </AppLayout>
  );
}
