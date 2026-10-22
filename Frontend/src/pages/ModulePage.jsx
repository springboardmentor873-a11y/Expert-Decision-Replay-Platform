import { useEffect, useMemo, useState } from "react";
import Sidebar from "../Sidebar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  API_BASE,
  getCurrentUser,
  logout,
} from "../api";
import { applyTheme, ThemeToggle } from "../theme";

import "./Workspace.css";

const graphNodePalette = {
  Decision: "#1677ff",
  People: "#08b88a",
  Teams: "#8b5cf6",
  Documents: "#f43f5e",
  Topics: "#f59e0b",
  Status: "#d946ef",
};

const arrangeKnowledgeGraph = (nodes) => {
  // A fixed grid reserves 280px × 106px for every node glyph and label card.
  // The 300px × 150px cells leave clear space even for the longest labels.
  const columns = 5;
  const columnGap = 300;
  const rowGap = 150;
  const startX = 340;
  const startY = 90;

  return nodes.map((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + column * columnGap;
    const y = startY + row * rowGap;
    return { ...node, x, y, baseX: x, baseY: y };
  });
};

function ModulePage({ title }) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = getCurrentUser();
  const teamMembersStorageKey = `workspace-team-members-${user?.id || "anonymous"}`;
  const teamNameStorageKey = `workspace-team-name-${user?.id || "anonymous"}`;

  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [moduleItems, setModuleItems] = useState([]);
  const [moduleData, setModuleData] = useState(null);
  const [moduleSearch, setModuleSearch] = useState("");
  const [moduleLoading, setModuleLoading] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("workspaceSettings") || "{}");
    } catch {
      return {};
    }
  });
  const [selectedTeamIds, setSelectedTeamIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(teamMembersStorageKey) || "[]");
      return Array.isArray(saved) ? saved.map(Number).filter(Number.isFinite) : [];
    } catch {
      return [];
    }
  });
  const [teamCandidateId, setTeamCandidateId] = useState("");
  const [teamName, setTeamName] = useState(() => localStorage.getItem(teamNameStorageKey) || localStorage.getItem("workspace-team-name") || "My Team");
  const [documentTypeFilter, setDocumentTypeFilter] = useState("All Types");
  const [graphNodes, setGraphNodes] = useState([]);
  const [graphEdges, setGraphEdges] = useState([]);
  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState(null);
  const [graphTypeFilter, setGraphTypeFilter] = useState("All");
  const [graphViewport, setGraphViewport] = useState({ x: 0, y: 0, width: 1880, height: 1200 });
  // Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);

  const role = (user?.role || "employee").toLowerCase();

  const isManager =
    role === "manager" ||
    role === "admin" ||
    role === "administrator";

  useEffect(() => {
    localStorage.setItem(teamMembersStorageKey, JSON.stringify(selectedTeamIds));
  }, [teamMembersStorageKey, selectedTeamIds]);

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------

  const formatDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatNotificationDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  };

  const notificationIcon = (type) => {
    switch (String(type || "").toLowerCase()) {
      case "approval":
      case "approved":
        return "✓";
      case "rejection":
      case "rejected":
        return "✕";
      case "comment":
        return "💬";
      case "upload":
      case "document":
        return "📄";
      default:
        return "🔔";
    }
  };

  const discussionIcon = (item) => (item?.is_meeting_note ? "🗒️" : "💬");

  const getFileType = (filename) => {
    const ext = String(filename || "").split(".").pop();
    if (!ext || ext === filename) return "FILE";
    return ext.toUpperCase().slice(0, 5);
  };

  const getGraphNodeColor = (type) => graphNodePalette[type] || "#64748b";

  const legendItems = Object.entries(graphNodePalette).map(([type, color]) => ({
    type,
    color,
  }));

  // ---------------------------------------------------------
  // DERIVED DATA
  // ---------------------------------------------------------

  const teamMembers = title === "Teams" ? moduleItems : [];

  const filteredTeamMembers = teamMembers.filter((member) => {
    const query = moduleSearch.trim().toLowerCase();
    if (!query) return true;
    return [member.name, member.email, member.role].some((value) =>
      String(value || "").toLowerCase().includes(query),
    );
  });

  const documentTypes = useMemo(() => {
    const types = new Set(
      moduleItems.map((item) => getFileType(item.filename)),
    );
    return ["All Types", ...Array.from(types).sort()];
  }, [moduleItems]);

  const filteredDocuments = moduleItems.filter((item) => {
    const query = moduleSearch.trim().toLowerCase();
    const matchesQuery =
      !query ||
      [item.filename, item.decision_title, item.uploader_name].some((value) =>
        String(value || "").toLowerCase().includes(query),
      );
    const matchesType =
      documentTypeFilter === "All Types" ||
      getFileType(item.filename) === documentTypeFilter;
    return matchesQuery && matchesType;
  });

  const visibleGraphNodes = useMemo(
    () =>
      graphTypeFilter === "All"
        ? graphNodes
        : graphNodes.filter((node) => node.type === graphTypeFilter),
    [graphNodes, graphTypeFilter],
  );

  const visibleGraphNodeIds = useMemo(
    () => new Set(visibleGraphNodes.map((node) => node.id)),
    [visibleGraphNodes],
  );

  // ---------------------------------------------------------
  // DATA LOADING
  // ---------------------------------------------------------

  const readJson = async (response) => {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        (data && (data.detail || data.message)) ||
          `Request failed with status ${response.status}`,
      );
    }
    return data;
  };

  const buildKnowledgeGraph = (payload) => {
    const nodes = [];
    const edges = [];
    const seen = new Set();

    const addNode = (type, key, label) => {
      if (!label) return null;
      const id = `${type}:${key}`;
      if (seen.has(id)) return id;
      seen.add(id);
      nodes.push({ id, type, label: String(label) });
      return id;
    };

    (payload.decisions || []).forEach((decision) => {
      const decisionNode = addNode("Decision", decision.id, decision.title);
      if (!decisionNode) return;

      const ownerNode = addNode("People", decision.user_id, decision.user_name);
      if (ownerNode) edges.push({ source: decisionNode, target: ownerNode });

      const statusNode = addNode("Status", decision.status, decision.status);
      if (statusNode) edges.push({ source: decisionNode, target: statusNode });

      const topicNode = addNode("Topics", decision.category, decision.category);
      if (topicNode) edges.push({ source: decisionNode, target: topicNode });
    });

    (payload.documents || []).forEach((document) => {
      const documentNode = addNode(
        "Documents",
        document.id,
        document.filename,
      );
      if (!documentNode) return;

      const decisionNode = addNode(
        "Decision",
        document.decision_id,
        document.decision_title,
      );
      if (decisionNode) edges.push({ source: documentNode, target: decisionNode });
    });

    (payload.teams || []).forEach((member) => {
      const teamNode = addNode("Teams", member.id, member.name);
      if (!teamNode) return;

      (member.decisions || []).forEach((decision) => {
        const decisionNode = addNode(
          "Decision",
          decision.id,
          decision.title,
        );
        if (decisionNode) edges.push({ source: teamNode, target: decisionNode });
      });
    });

    (payload.discussions || []).forEach((comment) => {
      const decisionNode = addNode(
        "Decision",
        comment.decision_id,
        comment.decision_title,
      );
      const personNode = addNode(
        "People",
        comment.user_id || comment.user_name,
        comment.user_name,
      );

      if (decisionNode && personNode) {
        edges.push({ source: decisionNode, target: personNode });
      }
    });

    setGraphNodes(arrangeKnowledgeGraph(nodes));
    setGraphEdges(edges);
  };

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    const uid = encodeURIComponent(user.id);

    const run = async () => {
      setError("");
      setModuleSearch("");

      try {
        if (title === "Discussions") {
          setLoading(true);
          const data = await readJson(
            await fetch(`${API_BASE}/discussions?user_id=${uid}`),
          );
          if (!cancelled) setDiscussions(Array.isArray(data) ? data : []);
          return;
        }

        if (title === "Teams") {
          setModuleLoading(true);
          const data = await readJson(
            await fetch(`${API_BASE}/teams?user_id=${uid}`),
          );
          if (!cancelled) setModuleItems(Array.isArray(data) ? data : []);
          return;
        }

        if (title === "Documents") {
          setModuleLoading(true);
          setDocumentTypeFilter("All Types");
          const data = await readJson(
            await fetch(`${API_BASE}/documents?user_id=${uid}`),
          );
          if (!cancelled) setModuleItems(Array.isArray(data) ? data : []);
          return;
        }

        if (title === "Analytics") {
          setModuleLoading(true);
          const data = await readJson(
            await fetch(`${API_BASE}/analytics?user_id=${uid}`),
          );
          if (!cancelled) setModuleData(data);
          return;
        }

        if (title === "Knowledge Graph") {
          setModuleLoading(true);
          resetGraphView();

          const [decisions, documents, discussions, teams] = await Promise.all([
            readJson(await fetch(`${API_BASE}/decisions?user_id=${uid}`)),
            readJson(await fetch(`${API_BASE}/documents?user_id=${uid}`)),
            readJson(await fetch(`${API_BASE}/discussions?user_id=${uid}`)),
            isManager
              ? readJson(await fetch(`${API_BASE}/teams?user_id=${uid}`))
              : Promise.resolve([]),
          ]);

          if (!cancelled) {
            buildKnowledgeGraph({
              decisions: Array.isArray(decisions) ? decisions : [],
              documents: Array.isArray(documents) ? documents : [],
              discussions: Array.isArray(discussions) ? discussions : [],
              teams: Array.isArray(teams) ? teams : [],
            });
          }
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "Something went wrong.");
      } finally {
        if (!cancelled) {
          setLoading(false);
          setModuleLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [title, user?.id, isManager]);

  useEffect(() => {
    if (!user?.id) return;

    const uid = encodeURIComponent(user.id);

    readJson(
      fetch(`${API_BASE}/notifications/unread-count?user_id=${uid}`),
    )
      .then((data) => setUnreadCount(Number(data?.unread_count || 0)))
      .catch(() => {});
  }, [user?.id, notifications]);

  // ---------------------------------------------------------
  // NOTIFICATIONS
  // ---------------------------------------------------------

  const loadNotifications = async () => {
    if (!user?.id) return;

    setNotificationLoading(true);

    try {
      const uid = encodeURIComponent(user.id);
      const data = await readJson(
        await fetch(`${API_BASE}/notifications?user_id=${uid}`),
      );
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Notification fetch error:", err);
    } finally {
      setNotificationLoading(false);
    }
  };

  const markNotificationRead = async (notificationId) => {
    if (!user?.id) return;

    try {
      const uid = encodeURIComponent(user.id);
      await readJson(
        await fetch(
          `${API_BASE}/notifications/${notificationId}/read?user_id=${uid}`,
          { method: "PUT" },
        ),
      );
      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId ? { ...item, is_read: 1 } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (err) {
      console.error("Notification read error:", err);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user?.id) return;

    try {
      const uid = encodeURIComponent(user.id);
      await readJson(
        await fetch(`${API_BASE}/notifications/read-all?user_id=${uid}`, {
          method: "PUT",
        }),
      );
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: 1 })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error("Notification read-all error:", err);
    }
  };

  // ---------------------------------------------------------
  // GRAPH CONTROLS
  // ---------------------------------------------------------

  function resetGraphView() {
    setGraphViewport({ x: 0, y: 0, width: 1880, height: 1200 });
    setSelectedGraphNodeId(null);
    setGraphTypeFilter("All");
  }

  function zoomGraph(direction) {
    setGraphViewport((current) => {
      const factor = direction === "in" ? 0.8 : 1.25;
      const width = Math.min(6000, Math.max(600, current.width * factor));
      const height = Math.min(4000, Math.max(400, current.height * factor));
      return {
        x: current.x + (current.width - width) / 2,
        y: current.y + (current.height - height) / 2,
        width,
        height,
      };
    });
  }

  // ---------------------------------------------------------
  // TEAMS
  // ---------------------------------------------------------

  const toggleTeamSelection = (memberId) => {
    setSelectedTeamIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  };

  const addTeamMember = () => {
    const memberId = Number(teamCandidateId);
    if (!memberId) return;

    setSelectedTeamIds((current) =>
      current.includes(memberId) ? current : [...current, memberId],
    );
    setTeamCandidateId("");
  };

  const saveTeam = (event) => {
    event.preventDefault();
    const name = teamName.trim() || "My Team";

    localStorage.setItem(teamNameStorageKey, name);
    localStorage.setItem("workspace-team-name", name);
  };

  // ---------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------

  const updateSetting = (key, value) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      localStorage.setItem("workspaceSettings", JSON.stringify(next));
      return next;
    });

    if (key === "theme") {
      applyTheme(value);
    }
  };

  return (
    <div className="workspace dashboard-workspace">

      <Sidebar activePath={location.pathname} />

      {/* =====================================================
          MAIN AREA
          ===================================================== */}

      <div className="dashboard-main">

        {/* =================================================
            TOPBAR
            ================================================= */}

        <header className="dashboard-topbar">

          <div className="dashboard-topbar-left">

            <div className="mobile-logo">
              ED
            </div>

            <div>

              <strong>
                Decision Intelligence
              </strong>

              <span>
                Organizational knowledge workspace
              </span>

            </div>

          </div>

          <div className="dashboard-topbar-right">

            {/* NOTIFICATION BELL */}
            <div
              className="notification-wrapper"
              style={{ position: "relative", marginRight: "16px" }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowNotifications((current) => !current);
                  if (!showNotifications) {
                    loadNotifications();
                  }
                }}
                aria-label="Notifications"
                title="Notifications"
                style={{
                  position: "relative",
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  border: "1px solid var(--workspace-border)",
                  background: "var(--workspace-surface)",
                  color: "var(--workspace-text)",
                  cursor: "pointer",
                  fontSize: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🔔

                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      minWidth: "19px",
                      height: "19px",
                      padding: "0 5px",
                      borderRadius: "999px",
                      background: "#dc2626",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #ffffff",
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  className="notification-popover"
                  style={{ top: "52px" }}
                >
                  <div className="notification-popover-header">
                    <div>
                      <strong className="notification-popover-title">
                        Notifications
                      </strong>
                      <div className="notification-popover-subtitle">
                        {unreadCount > 0
                          ? `${unreadCount} unread notification${
                              unreadCount === 1 ? "" : "s"
                            }`
                          : "You're all caught up"}
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        className="notification-popover-action"
                        onClick={markAllNotificationsRead}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="notification-popover-list">
                    {notificationLoading ? (
                      <div className="notification-popover-state">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="notification-popover-empty">
                        <div className="notification-popover-empty-icon">
                          🔔
                        </div>
                        <strong>
                          No notifications
                        </strong>
                        <span>
                          New approval updates will appear here.
                        </span>
                      </div>
                    ) : (
                      notifications.map((item) => {
                        const unread = Number(item.is_read) === 0;

                        return (
                          <div
                            key={item.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (unread) {
                                markNotificationRead(item.id);
                              }

                              if (item.decision_id) {
                                navigate(
                                  `/decisions/${item.decision_id}`
                                );
                                setShowNotifications(false);
                              }
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                if (unread) {
                                  markNotificationRead(item.id);
                                }
                                if (item.decision_id) {
                                  navigate(`/decisions/${item.decision_id}`);
                                  setShowNotifications(false);
                                }
                              }
                            }}
                            className={`notification-item${
                              unread ? " is-unread" : ""
                            }`}
                            style={{
                              cursor: item.decision_id
                                ? "pointer"
                                : "default",
                            }}
                          >
                            <div
                              className={`notification-item-icon type-${(
                                item.notification_type || "info"
                              ).toLowerCase()}`}
                            >
                              {notificationIcon(item.notification_type)}
                            </div>

                            <div className="notification-item-body">
                              <div className="notification-item-head">
                                <strong>
                                  {item.title}
                                </strong>

                                {unread && (
                                  <span className="notification-dot" />
                                )}
                              </div>

                              <p className="notification-item-message">
                                {item.message}
                              </p>

                              <span className="notification-item-time">
                                {formatNotificationDate(item.created_at)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <ThemeToggle />

            <div className="topbar-user">

              <div className="user-avatar">

                {user?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "U"}

              </div>

              <div className="user-info">

                <strong>
                  {user?.name || "User"}
                </strong>

                <span>
                  {isManager
                    ? "Manager"
                    : "Employee"}
                </span>

              </div>

            </div>

          </div>

        </header>

        {/* =================================================
            CONTENT
            ================================================= */}

        <main className="dashboard-content">

          {/* =================================================
              DISCUSSIONS PAGE
              ================================================= */}

          {title === "Discussions" ? (

            <div className="module-page">

              {/* HEADER */}

              <div className="module-page-header">

                <span className="eyebrow">
                  TEAM COLLABORATION
                </span>

                <h1>
                  Discussions
                </h1>

                <p className="module-subtitle">

                  {isManager
                    ? "Review discussions and meeting notes across all organizational decisions."
                    : "View your discussions and meeting notes."}

                </p>

              </div>

              {/* ACCESS CARD */}

              <div className="discussion-access-card">

                <div className="discussion-access-icon">

                  {isManager
                    ? "👨‍💼"
                    : "🔒"}

                </div>

                <div className="module-toolbar">
                  <input
                    value={moduleSearch}
                    onChange={(event) => setModuleSearch(event.target.value)}
                    placeholder="Search discussions..."
                    aria-label="Search discussions"
                  />
                </div>

                <div>

                  <strong>

                    {isManager
                      ? "Manager Discussion Access"
                      : "Employee Discussion Access"}

                  </strong>

                  <p>

                    {isManager
                      ? "You can view discussions posted by all employees across the organization."
                      : "You can view discussions that you have posted."}

                  </p>

                </div>

                <div className="discussion-total">

                  <strong>
                    {discussions.length}
                  </strong>

                  <span>
                    Discussions
                  </span>

                </div>

              </div>

              {/* LOADING */}

              {loading && (

                <div className="discussion-state">

                  <div className="loading-spinner"></div>

                  <h3>
                    Loading discussions...
                  </h3>

                  <p>
                    Fetching the latest team conversations.
                  </p>

                </div>

              )}

              {/* ERROR */}

              {!loading && error && (

                <div className="discussion-state error-state">

                  <div className="empty-icon">
                    !
                  </div>

                  <h3>
                    Unable to load discussions
                  </h3>

                  <p>
                    {error}
                  </p>

                </div>

              )}

              {/* EMPTY */}

              {!loading &&
                !error &&
                discussions.length === 0 && (

                  <div className="discussion-state">

                    <div className="empty-icon">
                      💬
                    </div>

                    <h3>
                      No discussions yet
                    </h3>

                    <p>
                      Discussions posted on decisions
                      will appear here.
                    </p>

                    <Link
                      to="/dashboard"
                      className="primary-btn"
                    >
                      View Decisions
                    </Link>

                  </div>

                )}

              {/* DISCUSSION LIST */}

              {!loading &&
                !error &&
                discussions
                  .filter((item) => {
                    const query = moduleSearch.trim().toLowerCase();
                    return !query || [
                      item.user_name,
                      item.user_role,
                      item.decision_title,
                      item.content,
                    ].some((value) => String(value || "").toLowerCase().includes(query));
                  })
                  .length > 0 && (

                  <div className="global-discussion-list">

                    {discussions.filter((item) => {
                      const query = moduleSearch.trim().toLowerCase();
                      return !query || [
                        item.user_name,
                        item.user_role,
                        item.decision_title,
                        item.content,
                      ].some((value) => String(value || "").toLowerCase().includes(query));
                    }).map(
                      (item) => (

                        <div
                          className="global-discussion-card"
                          key={item.id}
                        >

                          {/* ICON */}

                          <div className="global-discussion-icon">

                            {discussionIcon(item)}

                          </div>

                          {/* BODY */}

                          <div className="global-discussion-body">

                            <div className="global-discussion-top">

                              <div>

                                <span className="discussion-type">

                                  {item.is_meeting_note
                                    ? "MEETING NOTE"
                                    : "TEAM COMMENT"}

                                </span>

                                <h3>

                                  {item.user_name ||
                                    "Unknown User"}

                                </h3>
                                <span className="discussion-type">
                                  {item.user_role || "Employee"}
                                </span>

                              </div>

                              <span className="discussion-date">

                                {formatDate(
                                  item.created_at
                                )}

                              </span>

                            </div>

                            {/* MESSAGE */}

                            <p className="global-discussion-message">

                              {item.content}

                            </p>

                            {/* DECISION */}

                            <div className="discussion-decision">

                              <span>
                                Decision
                              </span>

                              <Link
                                to={`/decisions/${item.decision_id}`}
                              >

                                {item.decision_title ||
                                  `Decision #${item.decision_id}`}

                                <span>
                                  →
                                </span>

                              </Link>

                            </div>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                )}

            </div>

          ) : (

            /* =================================================
               OTHER MODULES
               ================================================= */

            <div className="module-page">

              <span className="eyebrow">
                KNOWLEDGE WORKSPACE
              </span>

              <h1>
                {title}
              </h1>

              <p className="module-subtitle">
                {title === "Teams" && "Organization members and decision activity."}
                {title === "Documents" && "Browse, search, and open documents linked to workspace decisions."}
                {title === "Knowledge Graph" && "Explore how decisions connect to people, teams, documents, topics, and workflow status."}
                {title === "Analytics" && "Decision and collaboration metrics for your access scope."}
                {title === "Profile" && "Your account and profile information."}
                {title === "Settings" && "Manage workspace preferences for this browser."}
              </p>

              {moduleLoading && <div className="discussion-state"><h3>Loading {title.toLowerCase()}...</h3></div>}
              {!moduleLoading && error && <div className="discussion-state error-state"><h3>Unable to load {title.toLowerCase()}</h3><p>{error}</p></div>}

              {!moduleLoading && !error && title === "Teams" && (
                <>
                  {isManager ? (
                    <>
                      <div className="module-toolbar module-toolbar-split">
                        <input value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} placeholder="Search team members..." aria-label="Search team members" />
                        <div className="module-summary">
                          <span>Total members: <strong>{teamMembers.length}</strong></span>
                          <span>Selected: <strong>{selectedTeamIds.length}</strong></span>
                          <span>Managers: <strong>{teamMembers.filter((item) => ["manager", "admin", "administrator"].includes((item.role || "").toLowerCase())).length}</strong></span>
                        </div>

                        <section className="team-members-panel">
                          <div className="team-members-panel-header">
                            <div>
                              <span className="eyebrow">CURRENT TEAM</span>
                              <h2>{teamName || "My Team"}</h2>
                            </div>
                            <span className="team-count-badge">{selectedTeamIds.length} joined</span>
                          </div>
                          <div className="team-add-form">
                            <select
                              value={teamCandidateId}
                              onChange={(event) => setTeamCandidateId(event.target.value)}
                              aria-label="Choose an employee to add"
                            >
                              <option value="">Choose an employee to add...</option>
                              {teamMembers
                                .filter((member) => !selectedTeamIds.includes(member.id))
                                .map((member) => (
                                  <option value={member.id} key={member.id}>
                                    {member.name} · {member.role || "Employee"}
                                  </option>
                                ))}
                            </select>
                            <button type="button" className="primary-btn" onClick={addTeamMember} disabled={!teamCandidateId}>
                              Add member
                            </button>
                          </div>
                          {selectedTeamIds.length ? (
                            <div className="team-member-chips">
                              {teamMembers.filter((member) => selectedTeamIds.includes(member.id)).map((member) => (
                                <div className="team-member-chip" key={member.id}>
                                  <span className="team-avatar small">{(member.name || "U").charAt(0).toUpperCase()}</span>
                                  <span><strong>{member.name}</strong><small>{member.role || "Employee"}</small></span>
                                  <button type="button" onClick={() => toggleTeamSelection(member.id)} aria-label={`Remove ${member.name} from team`}>×</button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="team-join-empty">
                              <span className="team-join-icon">＋</span>
                              <div><strong>Build your team</strong><p>Select an employee below to add them to the current team.</p></div>
                            </div>
                          )}
                          <form className="team-form" onSubmit={saveTeam}>
                            <label htmlFor="team-name">Team name</label>
                            <div className="team-form-row">
                              <input id="team-name" value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="e.g. Product Team" />
                              <button className="primary-btn" type="submit">Save Team</button>
                            </div>
                            <p>Choose members below to add them to this team.</p>
                          </form>
                        </section>
                      </div>

                      <div className="team-grid">
                        {filteredTeamMembers.map((member) => {
                          const isSelected = selectedTeamIds.includes(member.id);
                          const finalDecisionCount = Number(member.decisions_count || 0);

                          return (
                            <div className="team-card" key={member.id}>
                              <div className="team-card-header">
                                <div className="team-avatar">{(member.name || "U").charAt(0).toUpperCase()}</div>
                                <div>
                                  <h3>{member.name}</h3>
                                  <span>{member.role || "Employee"}</span>
                                </div>
                              </div>

                              <div className="team-meta">
                                <div>
                                  <label>Email</label>
                                  <strong>{member.email || "No email recorded"}</strong>
                                </div>
                                <div>
                                  <label>Decision count</label>
                                  <strong>{finalDecisionCount}</strong>
                                </div>
                              </div>

                              <div className="team-activity">
                                <span>Recent decisions</span>
                                {member.decisions && member.decisions.length ? (
                                  <ul>
                                    {member.decisions.slice(0, 3).map((decision) => (
                                      <li key={decision.id}>
                                        <Link to={`/decisions/${decision.id}`}>{decision.title}</Link>
                                        <small>{decision.status}</small>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>No decisions yet.</p>
                                )}
                              </div>

                              <button
                                type="button"
                                className={isSelected ? "secondary-btn team-btn-selected" : "primary-btn team-btn"}
                                onClick={() => toggleTeamSelection(member.id)}
                              >
                                {isSelected ? "Remove from Team" : "Add to Team"}
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {!filteredTeamMembers.length && <p className="module-empty">No matching members found.</p>}
                    </>
                  ) : <div className="discussion-state"><h3>Manager access only</h3><p>Teams organization data is available to managers.</p></div>}
                </>
              )}

              {!moduleLoading && !error && title === "Documents" && (
                <>
                  <div className="module-toolbar module-toolbar-split">
                    <input value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} placeholder="Search documents, decisions, or uploaders..." aria-label="Search documents" />
                    <div className="module-summary">
                      <span>Documents: <strong>{moduleItems.length}</strong></span>
                      <span>Types: <strong>{documentTypes.length - 1}</strong></span>
                      <span>Access: <strong>{isManager ? "Organization" : "My decisions"}</strong></span>
                    </div>
                  </div>

                  <div className="filter-chip-row">
                    {documentTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={documentTypeFilter === type ? "chip active" : "chip"}
                        onClick={() => setDocumentTypeFilter(type)}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  <div className="module-table-wrap">
                    <table className="module-table">
                      <thead>
                        <tr>
                          <th>Document</th>
                          <th>Type</th>
                          <th>Decision</th>
                          <th>Uploaded by</th>
                          <th>Uploaded</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDocuments.map((document) => (
                          <tr key={document.id}>
                            <td>{document.filename}</td>
                            <td><span className="file-pill">{getFileType(document.filename)}</span></td>
                            <td><Link to={`/decisions/${document.decision_id}`}>{document.decision_title || `Decision #${document.decision_id}`}</Link></td>
                            <td>{document.uploader_name || "System User"}</td>
                            <td>{document.uploaded_at ? new Date(document.uploaded_at).toLocaleString() : "?"}</td>
                            <td>
                              <div className="table-actions">
                                <a href={`${API_BASE}/documents/${document.id}/download?user_id=${user.id}`} target="_blank" rel="noreferrer">Download</a>
                                <Link to={`/decisions/${document.decision_id}`}>View Decision</Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!filteredDocuments.length && <p className="module-empty">No documents match your search and type filters.</p>}
                  </div>
                </>
              )}

              {!moduleLoading && !error && title === "Knowledge Graph" && (
                <div className="knowledge-graph-page">
                  <section className="knowledge-graph-panel">
                    <div className="graph-page-toolbar">
                      <div>
                        <span className="eyebrow">RELATIONSHIP MAP</span>
                        <p className="graph-help">Explore the relationships between decisions, people, documents, and knowledge.</p>
                      </div>
                      <div className="graph-controls" aria-label="Knowledge graph controls">
                        <select value={graphTypeFilter} onChange={(event) => setGraphTypeFilter(event.target.value)} aria-label="Filter graph node type">
                          <option value="All">All node types</option>
                          {legendItems.map(({ type }) => <option value={type} key={type}>{type}</option>)}
                        </select>
                        <button type="button" className="graph-zoom-button" onClick={() => zoomGraph("in")} aria-label="Zoom in">+ <span>Zoom In</span></button>
                        <button type="button" className="graph-zoom-button" onClick={() => zoomGraph("out")} aria-label="Zoom out">− <span>Zoom Out</span></button>
                        <button type="button" className="graph-reset-button" onClick={resetGraphView}>Reset</button>
                      </div>
                    </div>
                        <div className="knowledge-graph-shell">
                          <div className="knowledge-graph-canvas">
                            <svg
                              className="knowledge-graph-svg"
                              viewBox={`${graphViewport.x} ${graphViewport.y} ${graphViewport.width} ${graphViewport.height}`}
                              role="img"
                              aria-label="Interactive graph of decisions, people, teams, documents, topics, and statuses"
                            >
                              {graphEdges.map((edge, index) => {
                                const source = graphNodes.find((node) => node.id === edge.source);
                                const target = graphNodes.find((node) => node.id === edge.target);
                                if (!source || !target || !visibleGraphNodeIds.has(source.id) || !visibleGraphNodeIds.has(target.id)) return null;
                                return <line key={`${edge.source}-${edge.target}-${index}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={getGraphNodeColor(target.type)} strokeOpacity="0.55" strokeWidth="1.5" />;
                              })}
                              {visibleGraphNodes.map((node) => {
                                const selected = selectedGraphNodeId === node.id;
                                const color = getGraphNodeColor(node.type);
                                return (
                                  <g
                                    key={node.id}
                                    className="knowledge-graph-node-group"
                                    transform={`translate(${node.x},${node.y})`}
                                    role="button"
                                    tabIndex="0"
                                    aria-label={`${node.type}: ${node.label}`}
                                    onClick={() => setSelectedGraphNodeId(node.id)}
                                    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedGraphNodeId(node.id); } }}
                                  >
                                    <circle r={selected ? 38 : 32} fill={color} fillOpacity="0.14" stroke={color} strokeWidth={selected ? 4 : 2.5} />
                                    <circle r={selected ? 27 : 23} fill={color} />
                                    <text textAnchor="middle" y="7" className="graph-node-initial">{node.type === "Documents" ? "DOC" : node.type === "Decision" ? "D" : node.type === "People" ? node.label.slice(0, 1).toUpperCase() : node.type === "Teams" ? "T" : node.type === "Topics" ? "#" : "S"}</text>
                                    <rect className="graph-node-label-card" x={-Math.max(86, Math.min(140, node.label.length * 5 + 18))} y="48" width={Math.max(172, Math.min(280, node.label.length * 10 + 36))} height="58" rx="10" />
                                    <text textAnchor="middle" y="72" className="graph-node-label">{node.label.length > 25 ? `${node.label.slice(0, 23)}...` : node.label}</text>
                                    <text textAnchor="middle" y="92" className="graph-node-type">{node.type}</text>
                                  </g>
                                );
                              })}
                            </svg>
                            {!visibleGraphNodes.length && <div className="graph-canvas-empty">No nodes match these filters.</div>}
                          </div>
                        </div>
                  </section>
                </div>
              )}

              {!moduleLoading && !error && title === "Analytics" && moduleData && (
                <>
                  {(() => {
                    const total = Number(moduleData.total_decisions || 0);
                    const statuses = [
                      ["Draft", moduleData.draft_count, "#60a5fa"],
                      ["Under Review", moduleData.under_review_count, "#fbbf24"],
                      ["Approved", moduleData.approved_count, "#34d399"],
                      ["Rejected", moduleData.rejected_count, "#f87171"],
                      ["Completed", moduleData.completed_count, "#a78bfa"],
                    ];
                    let offset = 0;
                    const gradient = statuses.map(([, value, color]) => {
                      const start = total ? (offset / total) * 100 : 0;
                      offset += Number(value || 0);
                      const end = total ? (offset / total) * 100 : 0;
                      return `${color} ${start}% ${end}%`;
                    }).join(", ");
                    const categories = Object.entries(moduleData.categories || {}).sort((a, b) => b[1] - a[1]);
                    const maxCategory = Math.max(...categories.map(([, value]) => Number(value)), 1);
                    return (
                      <div className="analytics-chart-grid">
                        <div className="analytics-panel analytics-status-panel">
                          <div className="analytics-panel-heading"><div><h3>Decisions by status</h3><p>Current decision mix</p></div><span className="chart-kicker">{total} total</span></div>
                          <div className="donut-layout">
                            <div className="status-donut" style={{ background: `conic-gradient(${gradient || "#334155 0 100%"})` }}><div><strong>{total}</strong><span>Total decisions</span></div></div>
                            <div className="chart-legend">{statuses.map(([label, value, color]) => <div key={label}><span className="legend-dot" style={{ background: color }} />{label}<strong>{value || 0}</strong></div>)}</div>
                          </div>
                        </div>
                        <div className="analytics-panel">
                          <div className="analytics-panel-heading"><div><h3>Decisions by category</h3><p>Categories in your access scope</p></div><span className="chart-kicker">Live data</span></div>
                          <div className="category-bars">{categories.length ? categories.slice(0, 7).map(([label, value]) => <div className="category-bar-row" key={label}><span>{label}</span><div className="category-bar-track"><i style={{ width: `${(Number(value) / maxCategory) * 100}%` }} /></div><strong>{value}</strong></div>) : <p className="module-empty">No category data yet.</p>}</div>
                        </div>
                      </div>
                    );
                  })()}
                  <div className="analytics-grid">
                    {[
                      ["Total Decisions", moduleData.total_decisions, "Overall decision volume"],
                      ["Draft", moduleData.draft_count, "In progress"],
                      ["Under Review", moduleData.under_review_count, "Awaiting action"],
                      ["Approved", moduleData.approved_count, "Accepted"],
                      ["Rejected", moduleData.rejected_count, "Needs revision"],
                      ["Completed", moduleData.completed_count, "Closed"],
                    ].map(([label, value, hint]) => (
                      <div className="analytics-card" key={label}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                        <small>{hint}</small>
                      </div>
                    ))}
                  </div>

                  <div className="analytics-summary-grid">
                    <div className="analytics-panel">
                      <h3>Summary</h3>
                      <p>
                        {moduleData.scope === "organization"
                          ? `Your organization is managing ${moduleData.total_decisions} decisions across ${moduleData.total_employees} employees.`
                          : `You currently have ${moduleData.total_decisions} decisions in scope with ${moduleData.total_documents} linked documents.`}
                      </p>
                      <p>
                        {moduleData.approval_stats?.pending
                          ? `${moduleData.approval_stats.pending} approval${moduleData.approval_stats.pending === 1 ? "" : "s"} are still pending.`
                          : "There are no pending approvals."}
                      </p>
                    </div>

                    <div className="analytics-panel">
                      <h3>Top categories</h3>
                      <ul className="analytics-category-list">
                        {Object.entries(moduleData.categories || {}).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([key, value]) => (
                          <li key={key} title={`Category: ${key}`}><span>{key}</span><strong>{value}</strong></li>
                        ))}
                      </ul>
                    </div>
                    <div className="analytics-panel">
                      <h3>Workspace resources</h3>
                      <div className="resource-stat-grid">
                        <div><strong>{moduleData.total_employees || 0}</strong><span>Employees</span></div>
                        <div><strong>{moduleData.total_documents || 0}</strong><span>Documents</span></div>
                        <div><strong>{moduleData.total_discussions || 0}</strong><span>Discussions</span></div>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {title === "Profile" && (
                <div className="module-card profile-card"><div className="module-card-icon">◎</div><div><h2>{user?.name || "User"}</h2><p>Email: {user?.email || "—"}</p><p>Role: {user?.role || "—"}</p><p>User ID: {user?.id || "—"}</p></div></div>
              )}

              {title === "Settings" && (
                <div className="settings-grid settings-panel">
                  <section className="module-card settings-card"><h2>Account</h2><div className="settings-card-content"><p>{user?.name || "User"}</p><p>{user?.email || "—"}</p><p className="settings-muted">Role: {user?.role || "—"}</p></div></section>
                  <section className="module-card settings-card"><h2>Notifications</h2><div className="settings-card-content"><label className="settings-checkbox"><input type="checkbox" checked={settings.notifications !== false} onChange={(event) => updateSetting("notifications", event.target.checked)} /><span>Enable notification updates</span></label><p className="settings-muted">Receive updates about relevant workspace activity.</p></div></section>
                  <section className="module-card settings-card"><h2>Appearance</h2><div className="settings-card-content"><label className="settings-field"><span>Theme</span><select value={settings.theme || "light"} onChange={(event) => updateSetting("theme", event.target.value)}><option value="light">Light</option><option value="dark">Dark</option></select></label><div className="settings-theme-toggle"><ThemeToggle /></div></div></section>
                  <section className="module-card settings-card"><h2>Security</h2><div className="settings-card-content"><p>Password changes are handled through account support.</p><p className="settings-muted">Passwords are never displayed here.</p></div></section>
                </div>
              )}

              <Link
                to="/dashboard"
                className="primary-btn"
              >
                ← Back to Dashboard
              </Link>

            </div>

          )}

        </main>

      </div>

    </div>
  );
}

export default ModulePage;
