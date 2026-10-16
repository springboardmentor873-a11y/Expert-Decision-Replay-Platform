import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { useToast } from "../ToastContext.jsx";
import { api } from "../api";

export default function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  // Milestone 4: Global Interactive Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchUnread() {
      try {
        const { unread_count } = await api.unreadNotificationCount();
        if (!cancelled) setUnreadCount(unread_count);
      } catch {
        // ignore
      }
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Milestone 4: Live WebSocket Notification Listener
  useEffect(() => {
    const token = localStorage.getItem("edrp_token");
    if (!token) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "127.0.0.1:8000"
      : window.location.host;
    const wsUrl = `${protocol}//${host}/notifications/ws?token=${token}`;

    let ws = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "notification") {
            setUnreadCount((prev) => prev + 1);
            showToast(data.message || "New notification received!", "info");
          }
        } catch (err) {
          console.error("WS message parse error:", err);
        }
      };
    } catch (e) {
      console.error("WS connection error:", e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [showToast]);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchDecisions({ q: searchQuery.trim() });
        setSearchResults(results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name) => {
    if (!name) return "IP";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const displayName = user?.full_name || "User";
  const displayRole = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Employee";

  const handleSelectResult = (decisionId) => {
    setShowDropdown(false);
    setSearchQuery("");
    navigate(`/decisions/${decisionId}`);
  };

  return (
    <header className="top-header">
      <div className="header-search" ref={searchContainerRef} style={{ position: "relative" }}>
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <input
          type="text"
          placeholder="Search decisions, rationale, alternatives..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery.trim() && setShowDropdown(true)}
        />

        {/* Global Search Results Floating Dropdown */}
        {showDropdown && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 6,
              backgroundColor: "#ffffff",
              borderRadius: 8,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e2e8f0",
              zIndex: 1000,
              maxHeight: 320,
              overflowY: "auto",
              padding: "6px 0",
            }}
          >
            {isSearching ? (
              <div style={{ padding: "12px 16px", color: "#64748b", fontSize: 13, textAlign: "center" }}>
                Searching knowledge base...
              </div>
            ) : searchResults.length === 0 ? (
              <div style={{ padding: "12px 16px", color: "#64748b", fontSize: 13, textAlign: "center" }}>
                No decisions matching "<strong>{searchQuery}</strong>"
              </div>
            ) : (
              <div>
                <div style={{ padding: "6px 16px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                  Matching Decisions ({searchResults.length})
                </div>
                {searchResults.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => handleSelectResult(d.id)}
                    style={{
                      padding: "10px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f1f5f9",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{d.title}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, display: "flex", gap: 10, alignItems: "center" }}>
                      <span>Category: {d.category}</span>
                      <span>•</span>
                      <span style={{ color: d.status === "Approved" ? "#16a34a" : "#ca8a04", fontWeight: 600 }}>
                        {d.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="header-right">
        <div className="notification-bell" title="Notifications" onClick={() => navigate("/notifications")} style={{ cursor: "pointer" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {unreadCount > 0 && <span className="bell-badge">{unreadCount}</span>}
        </div>

        <div className="user-profile-badge" onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}>
          <div className="avatar-circle">{getInitials(displayName)}</div>
          <div className="user-details">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{displayRole}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
