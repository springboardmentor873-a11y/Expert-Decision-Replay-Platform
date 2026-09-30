import { useState } from "react";
import "./TeamHierarchy.css";

const ROLE_LABELS = {
  employee: "Employee",
  reviewer: "Reviewer",
  manager: "Manager",
  administrator: "Administrator",
};

function MemberNode({ member, isLeader }) {
  const extraRole = member.role !== "employee" ? ROLE_LABELS[member.role] || member.role : null;
  return (
    <div
      className={`team-hierarchy__node ${isLeader ? "team-hierarchy__node--leader" : ""}`}
    >
      <span className="team-hierarchy__node-name">{member.full_name}</span>
      <span className="team-hierarchy__node-label">
        {isLeader ? "Team Leader" : "Employee"}
      </span>
      {extraRole && <span className="team-hierarchy__node-role">{extraRole}</span>}
    </div>
  );
}

export default function TeamHierarchy({ team }) {
  const [expanded, setExpanded] = useState(true);

  if (!team.members || team.members.length === 0) return null;

  const leader = team.members[0];
  const remaining = team.members.slice(1);

  return (
    <section className="team-hierarchy">
      <button
        type="button"
        className="team-hierarchy__toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        <span>Team Hierarchy</span>
        <span className="team-hierarchy__chevron" aria-hidden="true">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="team-hierarchy__graph">
          <div className="team-hierarchy__team">
            <span className="team-hierarchy__team-label">Team</span>
            <span className="team-hierarchy__team-name">{team.name}</span>
          </div>

          <div className="team-hierarchy__stem" />

          <MemberNode member={leader} isLeader />

          {remaining.length > 0 && (
            <>
              <div className="team-hierarchy__stem" />
              <div className="team-hierarchy__rail">
                <ul className="team-hierarchy__members">
                  {remaining.map((member) => (
                    <li key={member.id} className="team-hierarchy__member">
                      <span className="team-hierarchy__stub" />
                      <MemberNode member={member} isLeader={false} />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}