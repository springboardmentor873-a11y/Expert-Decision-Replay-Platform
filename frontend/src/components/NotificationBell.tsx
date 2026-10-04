import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, type NotificationEntry } from "../lib/api";
import { timeAgo } from "../lib/format";

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationEntry[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadCount = () => {
    api
      .get<{ unread_count: number }>("/notifications/unread-count")
      .then((r) => setUnreadCount(r.unread_count))
      .catch(() => {});
  };

  const loadList = () => {
    api
      .get<NotificationEntry[]>("/notifications?limit=10")
      .then(setItems)
      .catch(() => {});
  };

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const handleItemClick = async (item: NotificationEntry) => {
    if (!item.is_read) {
      await api.patch(`/notifications/${item.id}/read`).catch(() => {});
      loadCount();
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
    }
    setOpen(false);
    if (item.entity_type === "Decision" && item.entity_id) {
      navigate(`/decisions/${item.entity_id}`);
    }
  };

  const markAllRead = async () => {
    await api.patch("/notifications/read-all").catch(() => {});
    loadCount();
    loadList();
  };

  return (
    <div style={{ position: "relative" }} ref={containerRef}>
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        style={{
          position: "relative",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 6,
          display: "flex",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--slate-700)" strokeWidth="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              background: "var(--danger)",
              color: "#fff",
              fontSize: "0.62rem",
              fontWeight: 700,
              borderRadius: 100,
              minWidth: 15,
              height: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 8px)",
            width: 340,
            background: "var(--paper)",
            border: "1px solid var(--slate-100)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-2)",
            zIndex: 50,
            maxHeight: 420,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 14px",
              borderBottom: "1px solid var(--slate-100)",
            }}
          >
            <strong style={{ fontSize: "0.9rem" }}>Notifications</strong>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--brass-dark)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "var(--slate-500)", fontSize: "0.88rem" }}>
              You're all caught up.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  padding: "10px 14px",
                  borderBottom: "1px solid var(--parchment-dim)",
                  cursor: "pointer",
                  background: item.is_read ? "transparent" : "var(--brass-tint)",
                }}
              >
                <div style={{ fontSize: "0.86rem", fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--slate-700)" }}>{item.message}</div>
                <div style={{ fontSize: "0.74rem", color: "var(--slate-500)", marginTop: 2 }}>
                  {timeAgo(item.created_at)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
