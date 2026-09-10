import React, { useState, useEffect } from "react";
import { MessageSquare, Calendar, Users, FileText, ArrowUpRight, Search } from "lucide-react";

function DiscussionsView({ onSelectDecision, apiBase = "http://127.0.0.1:8000" }) {
  const [discussions, setDiscussions] = useState([]);
  const [filterType, setFilterType] = useState("all"); // 'all' | 'comments' | 'meetings'
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      const res = await fetch(`${apiBase}/discussions`);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = discussions.filter((d) => {
    if (filterType === "comments" && d.is_meeting_note) return false;
    if (filterType === "meetings" && !d.is_meeting_note) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.content.toLowerCase().includes(q) ||
        d.user_name.toLowerCase().includes(q) ||
        d.decision_title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Discussions & Meeting Minutes</h1>
          <p style={styles.subtitle}>
            Review cross-functional discourse, meeting conclusions, and stakeholder rationale.
          </p>
        </div>
      </div>

      <div style={styles.toolbar}>
        <div style={styles.pills}>
          <button
            style={{
              ...styles.pillBtn,
              backgroundColor: filterType === "all" ? "var(--primary)" : "var(--bg-surface-container)",
              color: filterType === "all" ? "var(--on-primary)" : "var(--text-secondary)",
              borderColor: filterType === "all" ? "var(--primary)" : "var(--border-subtle)",
              boxShadow: filterType === "all" ? "0 2px 8px rgba(103, 80, 164, 0.28)" : "none",
            }}
            onClick={() => setFilterType("all")}
          >
            All Threads ({discussions.length})
          </button>
          <button
            style={{
              ...styles.pillBtn,
              backgroundColor: filterType === "meetings" ? "var(--primary)" : "var(--bg-surface-container)",
              color: filterType === "meetings" ? "var(--on-primary)" : "var(--text-secondary)",
              borderColor: filterType === "meetings" ? "var(--primary)" : "var(--border-subtle)",
              boxShadow: filterType === "meetings" ? "0 2px 8px rgba(103, 80, 164, 0.28)" : "none",
            }}
            onClick={() => setFilterType("meetings")}
          >
            Formal Meeting Notes
          </button>
          <button
            style={{
              ...styles.pillBtn,
              backgroundColor: filterType === "comments" ? "var(--primary)" : "var(--bg-surface-container)",
              color: filterType === "comments" ? "var(--on-primary)" : "var(--text-secondary)",
              borderColor: filterType === "comments" ? "var(--primary)" : "var(--border-subtle)",
              boxShadow: filterType === "comments" ? "0 2px 8px rgba(103, 80, 164, 0.28)" : "none",
            }}
            onClick={() => setFilterType("comments")}
          >
            Comments & Feedback
          </button>
        </div>

        <div style={styles.searchWrap}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search discussions or attendees..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div style={styles.list}>
        {filtered.length === 0 ? (
          <div style={styles.empty}>
            <MessageSquare size={44} color="var(--primary)" style={{ opacity: 0.6 }} />
            <p style={{ marginTop: "14px", color: "var(--text-secondary)", fontSize: "15px", fontWeight: "500" }}>
              No discussions match your filter.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.card,
                backgroundColor: item.is_meeting_note ? "rgba(22, 163, 74, 0.04)" : "var(--bg-surface)",
                borderLeft: item.is_meeting_note ? "4px solid var(--accent-emerald)" : "4px solid var(--primary)",
              }}
            >
              <div style={styles.cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div
                    style={{
                      ...styles.avatar,
                      background: item.is_meeting_note
                        ? "linear-gradient(135deg, #16A34A 0%, #15803D 100%)"
                        : "linear-gradient(135deg, var(--primary) 0%, #7965af 100%)",
                    }}
                  >
                    {item.user_name.charAt(0)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "6px" }}>
                    <span style={styles.userName}>{item.user_name}</span>
                    {item.is_meeting_note && (
                      <span style={styles.meetingBadge}>
                        <Calendar size={12} /> Meeting Minutes
                      </span>
                    )}
                  </div>
                </div>
                <span style={styles.timestamp}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ""}
                </span>
              </div>

              {item.meeting_attendees && (
                <div style={styles.attendeesBox}>
                  <Users size={14} color="#15803D" />
                  <span>
                    <strong style={{ color: "#14532D" }}>Attendees:</strong> {item.meeting_attendees}
                  </span>
                </div>
              )}

              <p style={styles.content}>{item.content}</p>

              <div style={styles.cardFooter}>
                <div style={styles.decisionLink}>
                  <FileText size={14} color="var(--primary)" />
                  <span>
                    Regarding Decision:{" "}
                    <strong style={{ color: "var(--text-primary)" }}>{item.decision_title}</strong>
                  </span>
                </div>
                {onSelectDecision && (
                  <button
                    style={styles.openBtn}
                    onClick={() => onSelectDecision(item.decision_id)}
                    title="View full decision replay"
                  >
                    <span>View Decision Replay</span>
                    <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: "24px",
    fontWeight: "700",
    color: "var(--text-primary)",
    margin: 0,
    letterSpacing: "-0.4px",
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: "6px 0 0 0",
    lineHeight: "1.5",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "var(--bg-surface)",
    padding: "14px 20px",
    borderRadius: "var(--radius-xl)",
    border: "1px solid var(--border-subtle)",
    boxShadow: "var(--shadow-card)",
    flexWrap: "wrap",
    gap: "14px",
  },
  pills: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  pillBtn: {
    padding: "8px 18px",
    borderRadius: "var(--radius-full)",
    border: "1px solid var(--border-subtle)",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.18s cubic-bezier(0.2, 0, 0, 1)",
    fontFamily: "var(--font-sans)",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 16px",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--bg-surface-container)",
    width: "280px",
    transition: "border-color 0.2s ease",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13.5px",
    width: "100%",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  empty: {
    padding: "64px 24px",
    textAlign: "center",
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-xl)",
    border: "1px dashed var(--border-subtle)",
  },
  card: {
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    padding: "20px 24px",
    boxShadow: "var(--shadow-card)",
    transition: "transform 0.18s ease, box-shadow 0.18s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "13px",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.1)",
  },
  userName: {
    fontWeight: "600",
    fontSize: "14.5px",
    color: "var(--text-primary)",
  },
  meetingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 10px",
    backgroundColor: "rgba(22, 163, 74, 0.12)",
    color: "#15803D",
    borderRadius: "var(--radius-full)",
    border: "1px solid rgba(22, 163, 74, 0.25)",
    fontSize: "11.5px",
    fontWeight: "600",
  },
  timestamp: {
    fontSize: "12px",
    color: "var(--text-muted)",
  },
  attendeesBox: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12.5px",
    color: "#166534",
    backgroundColor: "rgba(22, 163, 74, 0.08)",
    border: "1px solid rgba(22, 163, 74, 0.2)",
    padding: "8px 14px",
    borderRadius: "var(--radius-md)",
    marginBottom: "12px",
  },
  content: {
    fontSize: "14px",
    color: "var(--text-primary)",
    lineHeight: 1.6,
    margin: "0 0 14px 0",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid var(--border-subtle)",
    paddingTop: "12px",
    flexWrap: "wrap",
    gap: "8px",
  },
  decisionLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  openBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "var(--primary-container)",
    color: "var(--on-primary-container)",
    border: "none",
    borderRadius: "var(--radius-full)",
    padding: "6px 14px",
    fontWeight: "600",
    fontSize: "12.5px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
};

export default DiscussionsView;
