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
              backgroundColor: filterType === "all" ? "#2563eb" : "#ffffff",
              color: filterType === "all" ? "#ffffff" : "#475569",
            }}
            onClick={() => setFilterType("all")}
          >
            All Threads ({discussions.length})
          </button>
          <button
            style={{
              ...styles.pillBtn,
              backgroundColor: filterType === "meetings" ? "#2563eb" : "#ffffff",
              color: filterType === "meetings" ? "#ffffff" : "#475569",
            }}
            onClick={() => setFilterType("meetings")}
          >
            Formal Meeting Notes
          </button>
          <button
            style={{
              ...styles.pillBtn,
              backgroundColor: filterType === "comments" ? "#2563eb" : "#ffffff",
              color: filterType === "comments" ? "#ffffff" : "#475569",
            }}
            onClick={() => setFilterType("comments")}
          >
            Comments & Feedback
          </button>
        </div>

        <div style={styles.searchWrap}>
          <Search size={14} color="#94a3b8" />
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
            <MessageSquare size={40} color="#cbd5e1" />
            <p style={{ marginTop: "12px", color: "#64748b" }}>No discussions match your filter.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              style={{
                ...styles.card,
                backgroundColor: item.is_meeting_note ? "#fcfdfc" : "#ffffff",
                borderLeft: item.is_meeting_note ? "4px solid #10b981" : "4px solid #2563eb",
              }}
            >
              <div style={styles.cardHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={styles.avatar}>
                    {item.user_name.charAt(0)}
                  </div>
                  <div>
                    <span style={styles.userName}>{item.user_name}</span>
                    {item.is_meeting_note && (
                      <span style={styles.meetingBadge}>
                        <Calendar size={11} /> Meeting Minutes
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
                  <Users size={13} color="#059669" />
                  <span><strong>Attendees:</strong> {item.meeting_attendees}</span>
                </div>
              )}

              <p style={styles.content}>{item.content}</p>

              <div style={styles.cardFooter}>
                <div style={styles.decisionLink}>
                  <FileText size={13} color="#64748b" />
                  <span>Regarding Decision: <strong>{item.decision_title}</strong></span>
                </div>
                {onSelectDecision && (
                  <button
                    style={styles.openBtn}
                    onClick={() => onSelectDecision(item.decision_id)}
                  >
                    <span>View Decision Replay</span>
                    <ArrowUpRight size={13} />
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
    gap: "20px",
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
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    flexWrap: "wrap",
    gap: "12px",
  },
  pills: {
    display: "flex",
    gap: "8px",
  },
  pillBtn: {
    padding: "6px 14px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  searchWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 12px",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    backgroundColor: "#f8fafc",
    width: "250px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    background: "transparent",
    fontSize: "13px",
    width: "100%",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  empty: {
    padding: "60px",
    textAlign: "center",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px dashed #cbd5e1",
  },
  card: {
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    padding: "18px 20px",
    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px",
  },
  avatar: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "12px",
  },
  userName: {
    fontWeight: "700",
    fontSize: "14px",
    color: "#0f172a",
    marginRight: "8px",
  },
  meetingBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "2px 8px",
    backgroundColor: "#ecfdf5",
    color: "#059669",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "700",
  },
  timestamp: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  attendeesBox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#065f46",
    backgroundColor: "#f0fdf4",
    padding: "6px 12px",
    borderRadius: "6px",
    marginBottom: "10px",
  },
  content: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: 1.5,
    margin: "0 0 12px 0",
  },
  cardFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    paddingTop: "10px",
  },
  decisionLink: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#64748b",
  },
  openBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "none",
    border: "none",
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
  },
};

export default DiscussionsView;
