import {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback
} from "react";
import { API_BASE_URL, AppSidebar, NotificationBell } from "./shared";

// ==========================================
// KNOWLEDGE REPOSITORY PAGE
// ==========================================

// ==========================================
// KNOWLEDGE REPOSITORY ICONS (inline SVG)
// ==========================================

const KrIcon = ({
  name,
  size = 18,
  color = "currentColor",
  thickness = 1.8
}) => {
  const paths = {
    upload: "M12 3v10m0 0l-4-4m4 4l4-4M5 16v3a2 2 0 002 2h10a2 2 0 002-2v-3",
    download: "M12 21V11m0 0l-4 4m4-4l4 4M5 8V5a2 2 0 012-2h10a2 2 0 012 2v3",
    view: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zm10 3a3 3 0 100-6 3 3 0 000 6z",
    search: "M11 11a7 7 0 110-14 7 7 0 010 14zm5 5l5 5",
    doc: "M6 2h8l4 4v16H6zM14 2v4h4",
    folder: "M3 6a2 2 0 012-2h4l2 2h8a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V6z",
    graph: "M5 7a2 2 0 100-4 2 2 0 000 4zm14 0a2 2 0 100-4 2 2 0 000 4zM12 21a2 2 0 100-4 2 2 0 000 4zM6.8 5.3l3.9 8M17.2 5.3l-4.4 8.2",
    users: "M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M10 11a4 4 0 100-8 4 4 0 000 8zM19 8a3 3 0 100-6 3 3 0 000 6zm2 5v3",
    tag: "M20.6 13.4L11 3.8A2 2 0 009.6 3H4a1 1 0 00-1 1v5.6a2 2 0 00.6 1.4l9.6 9.6a2 2 0 002.8 0l4.6-4.6a2 2 0 000-2.6zM7.5 7.5h.01",
    insights: "M4 20h16M6 20v-6m4 6v-9m4 9v-5m4 5V8",
    clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 3",
    close: "M6 6l12 12M18 6L6 18",
    left: "M15 6l-6 6 6 6",
    right: "M9 6l6 6-6 6",
    zoomin: "M11 11a5 5 0 110-10 5 5 0 010 10zM8 6h6M11 3v6M20 20l-4.5-4.5",
    zoomout: "M11 11a5 5 0 110-10 5 5 0 010 10zM8 6h6M20 20l-4.5-4.5",
    reset: "M3 12a9 9 0 109-9 9 9 0 00-6.4 2.7L3 8M3 3v5h5",
    activity: "M22 12h-4l-3 8-6-16-3 8H2",
    check: "M5 12l4 4L19 6",
    article: "M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5zM14 3v5h5M9 13h6M9 17h6"
  };
  return (
    <svg
      className="kr-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={thickness}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || ""} />
    </svg>
  );
};

// ==========================================
// KNOWLEDGE GRAPH LAYOUT (deterministic tree)
// ==========================================

const VIEW_W = 1600;
const VIEW_H = 820;

const shortLabel = (t, n) => {
  const s = (t || "").trim();
  return s.length > n ? s.slice(0, n - 1) + "\u2026" : s;
};

// Wrap a label into 1-3 lines by word (never truncate with "..."). Each line
// is a single SVG <tspan> so long decision names stay fully readable.
const wrapLabel = (t, maxCh) => {
  const words = (t || "").trim().split(/\s+/);
  const lines = [];
  let cur = "";
  words.forEach((w) => {
    if (cur && (cur + " " + w).length > maxCh) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + " " + w : w;
    }
  });
  if (cur) lines.push(cur);
  return lines.length ? lines.slice(0, 3) : [""];
};

function runLayout(nodes, edges) {
  const idx = {};
  nodes.forEach((n) => {
    idx[n.id] = n;
    n.owner = n.type === "decision" ? n.id : null;
  });

  // ---------- 1. Ownership: each node belongs to exactly one cluster ----------
  // Non-decision nodes are owned by their first (sorted) directly-connected decision.
  // Nodes with NO decision link are orphans. Uploaders inherit their document's owner.
  const nbr = {};
  nodes.forEach((n) => {
    nbr[n.id] = new Set();
  });
  edges.forEach((e) => {
    const a = idx[e.s];
    const b = idx[e.t];
    if (!a || !b) return;
    if (a.type === "decision") nbr[b.id].add(a.id);
    if (b.type === "decision") nbr[a.id].add(b.id);
  });
  nodes.forEach((n) => {
    if (n.type === "decision") {
      n.owner = n.id;
      n.shared = 0;
      return;
    }
    n.shared = nbr[n.id].size;
    n.owner = nbr[n.id].size ? [...nbr[n.id]].sort()[0] : null;
  });
  // uploader people (no direct decision link) inherit their document's cluster
  edges.forEach((e) => {
    if (e.kind !== "uploaded") return;
    const a = idx[e.s];
    const b = idx[e.t];
    if (!a || !b) return;
    const doc = a.type === "document" ? a : b.type === "document" ? b : null;
    const person = a.type === "person" ? a : b.type === "person" ? b : null;
    if (doc && person && person.owner === null && doc.owner) person.owner = doc.owner;
  });
  // team members (no direct decision link) inherit their team's cluster, so
  // the Team → Member edge always stays inside one cluster and each member
  // appears exactly once on the right side of that cluster.
  edges.forEach((e) => {
    if (e.kind !== "member") return;
    const a = idx[e.s];
    const b = idx[e.t];
    if (!a || !b) return;
    const team = a.type === "team" ? a : b.type === "team" ? b : null;
    const member = a.type === "member" ? a : b.type === "member" ? b : null;
    if (team && member && member.owner === null && team.owner) member.owner = team.owner;
  });

  // ---------- 2. orient edges parent→child, drop cross-cluster edges ----------
  const ORIENT = {
    team: (a, b) => (b.type === "team" ? [a, b] : [b, a]),
    expert: (a, b) => (b.type === "person" ? [a, b] : [b, a]),
    topic: (a, b) => (a.type === "decision" ? [a, b] : [b, a]),
    on: (a, b) => (a.type === "decision" ? [a, b] : [b, a]),
    belongs: (a, b) => (a.type === "decision" ? [a, b] : [b, a]),
    uploaded: (a, b) => (b.type === "person" ? [b, a] : [a, b]),
    member: (a, b) => (b.type === "team" ? [b, a] : [a, b])
  };
  const kept = [];
  edges.forEach((e) => {
    const a = idx[e.s];
    const b = idx[e.t];
    if (!a || !b) return;
    if (a.owner !== b.owner) return; // never crosses a cluster boundary
    const o = ORIENT[e.kind] ? ORIENT[e.kind](a, b) : [a, b];
    kept.push({ s: o[0].id, t: o[1].id, kind: e.kind });
  });
  edges.length = 0;
  kept.forEach((e) => edges.push(e));

  // ---------- 3. group members per decision into child-type columns ----------
  // Every cluster is one tree: Decision (root) → Team / Person / Topic / Document / Discussion.
  const decisions = nodes.filter((n) => n.type === "decision");
  const clusters = decisions.map((d) => {
    const lane = { team: [], person: [], topic: [], document: [], discussion: [], member: [] };
    nodes.forEach((n) => {
      if (n.type === "decision" || n.owner !== d.id) return;
      if (lane[n.type]) lane[n.type].push(n);
    });
    const expertOf = (id) =>
      edges.some((e) => e.kind === "expert" && (e.s === d.id ? e.t === id : e.t === d.id && e.s === id));
    lane.person.sort((a, b) => (expertOf(a.id) ? 0 : 1) - (expertOf(b.id) ? 0 : 1));
    lane.topic.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    lane.document.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    lane.discussion.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    lane.member.sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    return { d, lane };
  });

  // ---------- 4. fixed 3 x 2 group grid (deterministic) ----------
  // Decision groups are placed with:
  //   column = index % 3
  //   row    = Math.floor(index / 3)
  //   groupX = column * horizontalSpacing
  //   groupY = row * verticalSpacing
  //
  // Every group has the SAME box (same width and height). The blue Decision
  // sits at the center of its group's top area; children are always placed
  // relative to that Decision (Team | Person | Topic | Document row, then
  // Discussion directly under the Document slot). No force/random layout.
  const GRID_COLS = 3;
  const GROUP_W = 470; // same width for every group
  const GROUP_H = 350; // same height for every group
  const DEC_Y = 78; // decision center inside its group
  const CHILD_Y = 200; // children row center (relative to group top)
  const DISC_Y = 286; // Discussion under the Document slot
  const STACK = 30; // extra same-type members stack downward
  const SLOT_TYPES = ["team", "person", "topic", "document"];
  const SLOT_X = [-170, -57, 57, 170]; // child x offsets relative to Decision
  // Team members are smaller nodes placed relative to the Decision in a neat
  // vertical column on the RIGHT side of the cluster (never re-positions any
  // existing node — this block only sets x/y for the new member nodes).
  const MEMBER_X = 205; // member column x offset from the Decision
  const MEMBER_START = -14; // align the top of the column with the children row
  const MEMBER_STEP = 46; // vertical spacing so member names never overlap

  const nRows = Math.max(1, Math.ceil(clusters.length / GRID_COLS));
  const gridW = GRID_COLS * GROUP_W;
  const gridH = nRows * GROUP_H;
  const g0x = (VIEW_W - gridW) / 2;
  const g0y = (VIEW_H - gridH) / 2;

  clusters.forEach((c, i) => {
    const column = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    const gx = g0x + column * GROUP_W;
    const gy = g0y + row * GROUP_H;
    const cx = gx + GROUP_W / 2;

    // Decision node = centered, larger parent.
    c.d.x = cx;
    c.d.y = gy + DEC_Y;
    c.d.boxX = gx;
    c.d.boxY = gy;
    c.d.boxW = GROUP_W;
    c.d.boxH = GROUP_H;

    const lane = c.lane;
    const place = (list, x, y) => {
      if (!list) return;
      list.forEach((node, j) => {
        node.x = x;
        node.y = y + j * STACK;
      });
    };

    // Children row, one fixed slot per type, positioned relative to Decision.
    SLOT_TYPES.forEach((type, si) => {
      place(lane[type], cx + SLOT_X[si], gy + CHILD_Y);
    });

    // Discussion hangs under the Document slot.
    if (lane.discussion.length) {
      place(lane.discussion, cx + SLOT_X[SLOT_X.length - 1], gy + DISC_Y);
      // When the Decision also has a Document, route the Discussion edge from
      // the Document (parent) to the Discussion (child) as the diagram shows.
      const doc = lane.document[0];
      lane.discussion.forEach((disc) => {
        const e = edges.find(
          (x) =>
            x.kind === "on" &&
            ((x.s === c.d.id && x.t === disc.id) ||
              (x.s === disc.id && x.t === c.d.id))
        );
        if (e && doc) {
          e.s = doc.id;
          e.t = disc.id;
        }
      });
    }

    // Team members: stacked in a vertical column on the right side.
    const members = lane.member || [];
    members.forEach((m, j) => {
      m.x = cx + MEMBER_X;
      m.y = gy + CHILD_Y + MEMBER_START + j * MEMBER_STEP;
    });
  });
}

const NODE_COLOR = {
  decision: "#2563eb",
  document: "#059669",
  person: "#7c3aed",
  member: "#0891b2",
  team: "#0e7490",
  topic: "#dc2626",
  discussion: "#d97706"
};

const NODE_SIZE = {
  decision: 25,
  document: 9,
  person: 13,
  member: 11,
  team: 15,
  topic: 11,
  discussion: 10
};

const NODE_LABEL = {
  decision: "Decisions",
  document: "Documents",
  person: "People",
  member: "Members",
  team: "Teams",
  topic: "Topics",
  discussion: "Discussions"
};

const EDGE_COLOR = {
  team: "#0891b2",
  expert: "#7c3aed",
  topic: "#e11d48",
  belongs: "#059669",
  uploaded: "#10b981",
  member: "#0284c7",
  on: "#d97706"
};

// ==========================================
// SHARED SMALL COMPONENTS
// ==========================================

const Pager = ({ page, max, set, count }) => {
  if (max <= 1) return null;
  return (
    <div className="kr-pager">
      <button
        className="kr-page-btn"
        disabled={page <= 1}
        onClick={() => set(page - 1)}
        aria-label="Previous page"
      >
        <KrIcon name="left" size={14} />
      </button>
      <span className="kr-page-info">{page} of {max} · {count} item(s)</span>
      <button
        className="kr-page-btn"
        disabled={page >= max}
        onClick={() => set(page + 1)}
        aria-label="Next page"
      >
        <KrIcon name="right" size={14} />
      </button>
    </div>
  );
};

const InsightsBody = ({ insights, formatDate, openViewDecision }) => {
  const statuses = insights.status_breakdown || {};
  const maxStatus = Math.max(1, ...Object.values(statuses).map(Number));
  const teamsB = insights.teams_breakdown || [];
  const maxTeam = Math.max(1, ...teamsB.map((t) => t.decision_count || 0));
  const approvals = insights.approval_summary || [];
  const recent = insights.recent_decisions || [];
  const mini = [
    { label: "Total Decisions", value: insights.total_decisions || 0 },
    { label: "Documents", value: insights.total_documents || 0 },
    { label: "Comments", value: insights.total_comments || 0 },
    { label: "Teams", value: insights.total_teams || 0 },
    { label: "People", value: insights.total_users || 0 },
    { label: "Approvals", value: insights.total_approvals || 0 }
  ];
  return (
    <div className="kr-insights">
      <div className="kr-mini-grid">
        {mini.map((m) => (
          <div className="kr-mini-card" key={m.label}>
            <div className="kr-mini-value">{m.value}</div>
            <div className="kr-mini-label">{m.label}</div>
          </div>
        ))}
      </div>
      <div className="kr-insights-cols">
        <div className="kr-insight-col">
          <h4>Status Breakdown</h4>
          {Object.keys(statuses).length === 0 ? (
            <div className="kr-empty-row">No data available.</div>
          ) : (
            <div className="kr-bar-list">
              {Object.keys(statuses).map((sname) => {
                const v = statuses[sname] || 0;
                return (
                  <div className="kr-bar-row" key={sname}>
                    <span className="kr-bar-label">{sname}</span>
                    <div className="kr-bar-track">
                      <div
                        className="kr-bar-fill kr-bar-fill-blue"
                        style={{ width: `${(v / maxStatus) * 100}%` }}
                      />
                    </div>
                    <span className="kr-bar-value">{v}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="kr-insight-col">
          <h4>Decisions by Team</h4>
          {teamsB.length === 0 ? (
            <div className="kr-empty-row">No data available.</div>
          ) : (
            <div className="kr-bar-list">
              {teamsB.map((t) => (
                <div className="kr-bar-row" key={t.team_id}>
                  <span className="kr-bar-label">{t.team_name}</span>
                  <div className="kr-bar-track">
                    <div
                      className="kr-bar-fill kr-bar-fill-green"
                      style={{ width: `${(t.decision_count / maxTeam) * 100}%` }}
                    />
                  </div>
                  <span className="kr-bar-value">{t.decision_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="kr-insights-cols">
        <div className="kr-insight-col">
          <h4>Approval Activity</h4>
          {approvals.length === 0 ? (
            <div className="kr-empty-row">No approval activity yet.</div>
          ) : (
            <div className="kr-chip-row">
              {approvals.map((a) => (
                <span className="kr-chip" key={`${a.action}-${a.count}`}>
                  {a.action} <span className="kr-chip-count">{a.count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="kr-insight-col">
          <h4>Recently Updated Decisions</h4>
          {recent.length === 0 ? (
            <div className="kr-empty-row">No recent decisions.</div>
          ) : (
            <div className="kr-act-mini">
              {recent.map((d) => (
                <button
                  className="kr-act-mini-item"
                  key={d.decision_id}
                  onClick={() => openViewDecision(d)}
                >
                  <div className="kr-act-mini-title">{d.title}</div>
                  <div className="kr-act-mini-meta">
                    {d.status} · {d.team_name || "—"} · {formatDate(d.updated_at)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// KNOWLEDGE REPOSITORY PAGE
// ==========================================

const KnowledgeRepositoryPage = (props) => {
  const {
    user,
    getRoleName,
    getToken,
    navigateTo,
    handleLogout,
    formatDate,
    formatFileSize,
    allDocuments,
    allDocumentsLoading,
    handleDownloadDocument,
    decisions,
    decisionsLoading,
    teams,
    allUsers,
    discussionList,
    knowledgeArticles,
    insights,
    insightsLoading,
    openViewDecision,
    openViewTeam,
    loadAllDocuments
  } = props;

  // ---------------- tabs ----------------
  const [tab, setTab] = useState("all");
  const [topicFilter, setTopicFilter] = useState(null);
  const [personInfo, setPersonInfo] = useState(null);

  const tabs = [
    { key: "all", label: "All" },
    { key: "documents", label: "Documents" },
    { key: "past", label: "Past Decisions" },
    { key: "topics", label: "Topics" },
    { key: "people", label: "People" },
    { key: "insights", label: "Insights" }
  ];

  // ---------------- filters ----------------
  const [docSearch, setDocSearch] = useState("");
  const [docTeam, setDocTeam] = useState("");
  const [docType, setDocType] = useState("");
  const [docSort, setDocSort] = useState("newest");
  const [pastSearch, setPastSearch] = useState("");
  const [pastTeam, setPastTeam] = useState("");
  const [pastStatus, setPastStatus] = useState("");
  const [pastPriority, setPastPriority] = useState("");
  const [pastSort, setPastSort] = useState("newest");
  const [docPage, setDocPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);

  // ---------------- upload ----------------
  const [showUpload, setShowUpload] = useState(false);
  const [uploadDecisionId, setUploadDecisionId] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadMsgType, setUploadMsgType] = useState("error");

  const openUpload = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setUploadDecisionId("");
    setUploadFile(null);
    setUploadMsg("");
    setUploadMsgType("error");
    setShowUpload(true);
  };

  const closeUpload = () => {
    if (uploadBusy) return;
    setShowUpload(false);
  };

  const submitUpload = async (e) => {
    e.preventDefault();
    if (!uploadDecisionId) {
      setUploadMsg("Please select the decision this document belongs to.");
      setUploadMsgType("error");
      return;
    }
    if (!uploadFile) {
      setUploadMsg("Please choose a file to upload.");
      setUploadMsgType("error");
      return;
    }
    setUploadBusy(true);
    setUploadMsg("");
    const formData = new FormData();
    formData.append("file", uploadFile);
    try {
      const res = await fetch(
        `${API_BASE_URL}/decisions/${uploadDecisionId}/documents`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${getToken()}` },
          body: formData
        }
      );
      if (res.ok) {
        setUploadMsg("Document uploaded successfully.");
        setUploadMsgType("success");
        setUploadDecisionId("");
        setUploadFile(null);
        if (typeof loadAllDocuments === "function") {
          loadAllDocuments();
        }
        setTimeout(() => setShowUpload(false), 1000);
      } else {
        let detail = "Upload failed. Check the file type and size (max 15 MB).";
        try {
          const data = await res.json();
          if (data && data.detail) detail = data.detail;
        } catch {
          // ignore parse errors
        }
        setUploadMsg(detail);
        setUploadMsgType("error");
      }
    } catch (err) {
      console.error("Upload document error:", err);
      setUploadMsg("Unable to connect to the server.");
      setUploadMsgType("error");
    } finally {
      setUploadBusy(false);
    }
  };

  // ---------------- categories / topics ----------------
  const [categories, setCategories] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/knowledge/categories`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) setCategories(await res.json());
    } catch (err) {
      console.error("Knowledge categories error:", err);
    }
  }, [getToken]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // ---------------- derived data ----------------
  const decisionMap = useMemo(() => {
    const m = new Map();
    (decisions || []).forEach((d) => {
      if (d && d.decision_id) m.set(d.decision_id, d);
    });
    return m;
  }, [decisions]);

  const teamMap = useMemo(() => {
    const m = new Map();
    (teams || []).forEach((t) => {
      if (t && t.team_id) m.set(t.team_id, t);
    });
    return m;
  }, [teams]);

  const docs = useMemo(() => {
    return (allDocuments || [])
      .map((doc) => {
        const dec = decisionMap.get(doc.decision_id);
        const parts = (doc.original_file_name || "").split(".");
        const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
        return {
          ...doc,
          ext,
          decision_title:
            doc.decision_title ||
            (dec ? dec.title : doc.decision_id ? `Decision #${doc.decision_id}` : "—"),
          team_id: dec ? dec.team_id : null,
          team_name: dec ? dec.team_name : null,
          expert_id: dec ? dec.expert_id : null,
          expert_name: dec ? dec.expert_name : null,
          decision_status: dec ? dec.status : null
        };
      })
      .sort((a, b) => new Date(b.uploaded_at || 0) - new Date(a.uploaded_at || 0));
  }, [allDocuments, decisionMap]);

  const people = useMemo(() => {
    const counts = {};
    (decisions || []).forEach((d) => {
      if (d.expert_id) counts[d.expert_id] = (counts[d.expert_id] || 0) + 1;
    });
    return (allUsers || [])
      .map((u) => ({
        ...u,
        contributed: counts[u.user_id] || 0
      }))
      .sort((a, b) => b.contributed - a.contributed);
  }, [allUsers, decisions]);

  const discussions = useMemo(() => {
    return (discussionList || []).filter((d) => d && d.comment_count > 0);
  }, [discussionList]);

  const decisionTopics = useMemo(() => {
    return (categories && categories.topics) || [];
  }, [categories]);

  const articleCategories = useMemo(() => {
    return (categories && categories.knowledge_categories) || [];
  }, [categories]);

  const topicChips = useMemo(() => {
    const list = [
      ...decisionTopics.map((t) => ({
        name: t.name,
        count: t.decision_count || 0,
        source: "topic"
      })),
      ...articleCategories.map((c) => ({
        name: c.name,
        count: c.article_count || 0,
        source: "article"
      }))
    ];
    return list.sort((a, b) => b.count - a.count).slice(0, 10);
  }, [decisionTopics, articleCategories]);

  const docTypes = useMemo(() => {
    const set = new Set();
    docs.forEach((d) => {
      if (d.ext) set.add(d.ext);
    });
    return Array.from(set).sort();
  }, [docs]);

  const teamOptions = useMemo(() => {
    return (teams || []).map((t) => ({ id: t.team_id, name: t.team_name }));
  }, [teams]);

  const peopleOfTeam = useCallback(
    (teamId) => people.filter((p) => String(p.team_id) === String(teamId)),
    [people]
  );

  // ---------------- filtered lists ----------------
  const docFiltered = useMemo(() => {
    let list = docs;
    const q = docSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          (d.original_file_name || "").toLowerCase().includes(q) ||
          (d.decision_title || "").toLowerCase().includes(q) ||
          (d.file_type || "").toLowerCase().includes(q)
      );
    }
    if (docTeam) list = list.filter((d) => String(d.team_id) === String(docTeam));
    if (docType) list = list.filter((d) => d.ext === docType.toLowerCase());
    const out = [...list];
    if (docSort === "name") {
      out.sort((a, b) =>
        (a.original_file_name || "").localeCompare(b.original_file_name || "")
      );
    } else if (docSort === "size") {
      out.sort((a, b) => (b.file_size || 0) - (a.file_size || 0));
    } else if (docSort === "oldest") {
      out.sort((a, b) => new Date(a.uploaded_at || 0) - new Date(b.uploaded_at || 0));
    }
    return out;
  }, [docs, docSearch, docTeam, docType, docSort]);

  const pastBase = useMemo(() => {
    let list = decisions || [];
    if (topicFilter && topicFilter.source === "topic") {
      const name = String(topicFilter.name).toLowerCase();
      list = list.filter(
        (d) => (d.category_name || "").toLowerCase() === name
      );
    }
    return list;
  }, [decisions, topicFilter]);

  const pastFiltered = useMemo(() => {
    let list = pastBase;
    const q = pastSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          (d.title || "").toLowerCase().includes(q) ||
          (d.expert_name || "").toLowerCase().includes(q) ||
          (d.category_name || "").toLowerCase().includes(q)
      );
    }
    if (pastTeam) list = list.filter((d) => String(d.team_id) === String(pastTeam));
    if (pastStatus) list = list.filter((d) => d.status === pastStatus);
    if (pastPriority) list = list.filter((d) => d.priority === pastPriority);
    const out = [...list];
    if (pastSort === "title") {
      out.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (pastSort === "oldest") {
      out.sort((a, b) => new Date(a.decision_date || 0) - new Date(b.decision_date || 0));
    } else {
      out.sort((a, b) => new Date(b.decision_date || 0) - new Date(a.decision_date || 0));
    }
    return out;
  }, [pastBase, pastSearch, pastTeam, pastStatus, pastPriority, pastSort]);

  const articleFiltered = useMemo(() => {
    let list = knowledgeArticles || [];
    if (topicFilter && topicFilter.source === "article") {
      const name = String(topicFilter.name).toLowerCase();
      list = list.filter((a) => (a.category || "").toLowerCase() === name);
    }
    return list.slice(0, 6);
  }, [knowledgeArticles, topicFilter]);

  const latestDecisions = useMemo(() => {
    return (decisions || [])
      .slice()
      .sort((a, b) => new Date(b.decision_date || 0) - new Date(a.decision_date || 0))
      .slice(0, 4);
  }, [decisions]);

  const latestDocs = useMemo(() => docs.slice(0, 4), [docs]);

  const activity = useMemo(() => {
    const events = [];
    (decisions || []).forEach((d) => {
      events.push({
        id: `d${d.decision_id}`,
        kind: "decision",
        at: new Date(d.updated_at || d.created_at || 0),
        verb: "Decision updated",
        label: d.title,
        ref: d
      });
    });
    docs.forEach((d) => {
      events.push({
        id: `doc${d.document_id}`,
        kind: "document",
        at: new Date(d.uploaded_at || 0),
        verb: "Document uploaded",
        label: d.original_file_name,
        ref: d
      });
    });
    (knowledgeArticles || []).forEach((a) => {
      events.push({
        id: `art${a.article_id}`,
        kind: "article",
        at: new Date(a.updated_at || a.created_at || 0),
        verb: "Knowledge article updated",
        label: a.title,
        ref: a
      });
    });
    return events.sort((a, b) => b.at - a.at).slice(0, 12);
  }, [decisions, docs, knowledgeArticles]);

  // ---------------- pagination ----------------
  const PAGE_SIZE = 8;
  const docCount = docFiltered.length;
  const pastCount = pastFiltered.length;
  const pageOf = (page, max) => Math.max(1, Math.min(page, max));
  const docMax = Math.max(1, Math.ceil(docCount / PAGE_SIZE));
  const pastMax = Math.max(1, Math.ceil(pastCount / PAGE_SIZE));
  const curDocPage = pageOf(docPage, docMax);
  const curPastPage = pageOf(pastPage, pastMax);
  const docSlice = docFiltered.slice((curDocPage - 1) * PAGE_SIZE, curDocPage * PAGE_SIZE);
  const pastSlice = pastFiltered.slice((curPastPage - 1) * PAGE_SIZE, curPastPage * PAGE_SIZE);

  // ---------------- summary cards ----------------
  const stats = useMemo(
    () => ({
      documents: docs.length,
      decisions: (decisions || []).length,
      topics: decisionTopics.length + articleCategories.length,
      people: people.length
    }),
    [docs, decisions, decisionTopics, articleCategories, people]
  );

  const statCards = [
    { key: "documents", icon: "doc", label: "Documents", value: stats.documents, color: "#059669", page: "documents" },
    { key: "past", icon: "activity", label: "Past Decisions", value: stats.decisions, color: "#2563eb", page: "past" },
    { key: "topics", icon: "tag", label: "Topics & Categories", value: stats.topics, color: "#dc2626", page: "topics" },
    { key: "people", icon: "users", label: "People", value: stats.people, color: "#7c3aed", page: "people" }
  ];

  const statusBadge = (s) =>
    `dash-badge dash-badge-${(s || "").toLowerCase().replace(/\s+/g, "-")}`;

  // ---------------- knowledge graph ----------------
  const graph = useMemo(() => {
    const nodes = [];
    const edges = [];
    const byId = {};
    const addNode = (id, type, label, sub, ref) => {
      if (byId[id]) return byId[id];
      const n = { id, type, label, sub, ref, x: 0, y: 0, vx: 0, vy: 0 };
      nodes.push(n);
      byId[id] = n;
      return n;
    };
    const addEdge = (a, b, kind) => {
      if (a && b) edges.push({ s: a.id, t: b.id, kind });
    };

    // Test / dev accounts are excluded so the graph only shows real application
    // relationships (the database itself is never modified).
    const TEST_USER_IDS = new Set([
      1, 3, 6, 5, 8, 48, 49, 63, 69, 70, 71, 72, 74, 75, 76, 77
    ]);
    const isTestUser = (u) => {
      if (!u) return false;
      if (TEST_USER_IDS.has(Number(u.user_id))) return true;
      const name = String(u.name || "").toLowerCase();
      return /^(test|smoke|m3|alt\s|t\.)\s*\S*/.test(name);
    };

    const recent = (decisions || [])
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at || 0) -
          new Date(a.updated_at || a.created_at || 0)
      )
      .slice(0, 6);

    recent.forEach((d) => {
      const dn = addNode(`d${d.decision_id}`, "decision", d.title, d.status || "", d);
      if (d.team_id) {
        const team = teamMap.get(d.team_id);
        addNode(
          `t${d.team_id}`,
          "team",
          team ? team.team_name : `Team ${d.team_id}`,
          "",
          team || null
        );
        addEdge(dn, byId[`t${d.team_id}`], "team");
      }
      if (d.expert_id && !isTestUser({ user_id: d.expert_id, name: d.expert_name })) {
        const person = people.find((p) => String(p.user_id) === String(d.expert_id));
        addNode(
          `p${d.expert_id}`,
          "person",
          d.expert_name || `User ${d.expert_id}`,
          (person && person.role_name) || "Contributor",
          person || null
        );
        addEdge(dn, byId[`p${d.expert_id}`], "expert");
      }
      if (d.category_name) {
        addNode(`topic:${d.category_name}`, "topic", d.category_name, "", null);
        addEdge(dn, byId[`topic:${d.category_name}`], "topic");
      }
    });

    // Real team members: one smaller node per REAL member of the team the
    // Decision belongs to (same rule that keeps the rest of the graph clean
    // excludes test / dev accounts here too). The cluster's own expert is
    // already shown as the Person node, so they are not duplicated on the
    // right. A team's column is built once even when several Decisions share
    // the same team, so the same member is never duplicated.
    const teamsWithMembers = new Set();
    recent.forEach((d) => {
      if (!d.team_id) return;
      const tid = Number(d.team_id);
      if (teamsWithMembers.has(tid)) return;
      teamsWithMembers.add(tid);
      // Members render beside the team's primary cluster (the same ownership
      // rule runLayout uses), so we exclude the expert who is ALREADY shown
      // as the Person node in that cluster.
      const ownDecision = recent
        .filter((x) => x.team_id && Number(x.team_id) === tid)
        .sort((a, b) => Number(a.decision_id) - Number(b.decision_id))[0];
      people.forEach((p) => {
        if (!p || String(p.team_id) !== String(tid)) return;
        if (isTestUser(p)) return;
        if (ownDecision && String(p.user_id) === String(ownDecision.expert_id)) return;
        const m = addNode(
          `mem${tid}:${p.user_id}`,
          "member",
          p.name || `User ${p.user_id}`,
          p.role_name || "Member",
          p
        );
        const teamNode = byId[`t${tid}`];
        if (teamNode) addEdge(teamNode, m, "member");
      });
    });

    docs.slice(0, 60).forEach((dc) => {
      const dn = byId[`d${dc.decision_id}`];
      if (!dn) return;
      const docn = addNode(
        `doc${dc.document_id}`,
        "document",
        dc.original_file_name,
        dc.file_type || "",
        dc
      );
      addEdge(docn, dn, "belongs");
      if (dc.uploaded_by) {
        const person = people.find(
          (p) => String(p.user_id) === String(dc.uploaded_by)
        );
        if (isTestUser({ user_id: dc.uploaded_by, name: person && person.name })) return;
        addNode(
          `p${dc.uploaded_by}`,
          "person",
          (person && person.name) || `User ${dc.uploaded_by}`,
          (person && person.role_name) || "Contributor",
          person || null
        );
        addEdge(docn, byId[`p${dc.uploaded_by}`], "uploaded");
      }
    });

    discussions.slice(0, 60).forEach((ds) => {
      const dn = byId[`d${ds.decision_id}`];
      if (!dn) return;
      const n = addNode(
        `disc${ds.decision_id}`,
        "discussion",
        `Discussion · ${ds.comment_count}`,
        ds.title,
        ds
      );
      addEdge(n, dn, "on");
    });

    runLayout(nodes, edges);

    // Only nodes that belong to a decision cluster stay visible, so no stray
    // test / unrelated users ever appear as an "Others" group.
    const keep = new Set();
    nodes.forEach((n) => {
      if (n.type === "decision" || n.owner != null) keep.add(n.id);
    });
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (!keep.has(nodes[i].id)) nodes.splice(i, 1);
    }
    Object.keys(byId).forEach((k) => {
      if (!keep.has(k)) delete byId[k];
    });

    return { nodes, edges, byId };
  }, [decisions, docs, people, discussions, teamMap]);

  const [selected, setSelected] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [hiddenTypes, setHiddenTypes] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [graphSearch, setGraphSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const svgRef = useRef(null);
  const dragRef = useRef(null);

  const activeNode = selected && graph.byId[selected] ? graph.byId[selected] : null;

  const toggleType = (type) => {
    setHiddenTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const onNodeHoverId = (id) => setHoverId(id);

  const visibleNodes = graph.nodes.filter((n) => !hiddenTypes.includes(n.type));
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = graph.edges.filter(
    (e) => visibleIds.has(e.s) && visibleIds.has(e.t)
  );

  const graphQuery = graphSearch.trim().toLowerCase();
  const matchedIds = useMemo(() => {
    if (!graphQuery) return null;
    const m = new Set();
    graph.nodes.forEach((n) => {
      const hay = `${n.label || ""} ${n.sub || ""} ${NODE_LABEL[n.type] || ""}`.toLowerCase();
      if (hay.includes(graphQuery)) m.add(n.id);
    });
    return m;
  }, [graph, graphQuery]);
  const matchCount = graphQuery
    ? graph.nodes.filter((n) => matchedIds && matchedIds.has(n.id)).length
    : graph.nodes.length;

  const clusterBoxes = useMemo(() => {
    const decisions = graph.nodes.filter((n) => n.type === "decision");

    const boxes = decisions.map((d) => {
      const members = graph.nodes.filter((n) => n.owner === d.id).length + 1;
      return {
        id: d.id,
        label: shortLabel(d.label, 30),
        x: d.boxX,
        y: d.boxY,
        w: d.boxW,
        h: d.boxH,
        count: members
      };
    });

    const others = graph.nodes.filter(
      (n) => n.type !== "decision" && n.owner == null
    );
    if (others.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      others.forEach((n) => {
        if (n.x < minX) minX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.x > maxX) maxX = n.x;
        if (n.y > maxY) maxY = n.y;
      });
      const pad = 44;
      boxes.push({
        id: "others",
        label: "Others",
        x: (minX + maxX) / 2 - (maxX - minX + pad * 2) / 2,
        y: (minY + maxY) / 2 - (maxY - minY + pad * 2) / 2,
        w: maxX - minX + pad * 2,
        h: maxY - minY + pad * 2,
        count: others.length
      });
    }
    return boxes;
  }, [graph]);

  const onPointerDown = (e) => {
    if (e.target && e.target.closest && e.target.closest(".kr-graph-node")) return;
    setDragging(true);
    const svg = svgRef.current;
    const rect = svg ? svg.getBoundingClientRect() : null;
    dragRef.current = {
      x0: e.clientX,
      y0: e.clientY,
      panX: pan.x,
      panY: pan.y,
      factor: rect && rect.width ? rect.width / VIEW_W : 1
    };
    if (svg && svg.setPointerCapture) svg.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    setPan({
      x: d.panX + (e.clientX - d.x0) / d.factor,
      y: d.panY + (e.clientY - d.y0) / d.factor
    });
  };

  const onPointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  const onWheelZoom = (e) => {
    const f = e.deltaY < 0 ? 1.12 : 0.89;
    setZoom((z) => Math.min(2.6, Math.max(0.45, z * f)));
  };

  // ---------------- graph details panel ----------------
  const renderPanel = () => {
    if (!activeNode) {
      return (
        <div className="kr-graph-empty-panel">
          <KrIcon name="graph" size={26} color="#cbd5e1" />
          <p>Click any node to inspect it and navigate to the related page.</p>
        </div>
      );
    }
    const n = activeNode;
    const isTopicCat = decisionTopics.some(
      (t) => String(t.name) === String(n.label)
    );

    let related = "";
    let actions = [];

    if (n.type === "decision") {
      const dcount = docs.filter(
        (x) => String(x.decision_id) === String(n.ref && n.ref.decision_id)
      ).length;
      const disc = discussions.find(
        (x) => String(x.decision_id) === String(n.ref && n.ref.decision_id)
      );
      related = `${dcount} document(s) · ${(disc && disc.comment_count) || 0} comment(s)`;
      actions = [
        { label: "Open Decision", action: () => openViewDecision(n.ref) },
        {
          label: "Browse Documents",
          action: () => {
            setTab("documents");
            setDocPage(1);
            if (n.ref) setDocSearch(n.ref.title || "");
          }
        }
      ];
    } else if (n.type === "document") {
      const dec = decisionMap.get(n.ref && n.ref.decision_id);
      related = dec ? `For decision: ${shortLabel(dec.title, 40)}` : "";
      actions = [
        { label: "View File", action: () => handleDownloadDocument(n.ref, true) },
        { label: "Download", action: () => handleDownloadDocument(n.ref, false) }
      ];
    } else if (n.type === "team") {
      const members = peopleOfTeam(n.ref && n.ref.team_id).length;
      related = `${members} member(s)`;
      actions = [{ label: "Open Team", action: () => openViewTeam(n.ref) }];
    } else if (n.type === "person") {
      const pdc = (decisions || []).filter(
        (d) => String(d.expert_id) === String(n.ref && n.ref.user_id)
      ).length;
      related = `${pdc} contributed decision(s)`;
      const team = n.ref && teamMap.get(n.ref.team_id);
      if (team) {
        actions.push({ label: "View Team", action: () => openViewTeam(team) });
      }
      actions.push({
        label: "See Decisions",
        action: () => {
          setTab("past");
          setPastPage(1);
          if (n.ref) setPastSearch(n.ref.name || "");
        }
      });
    } else if (n.type === "member") {
      const p = n.ref;
      const tm = p && teamMap.get(p.team_id);
      related = tm
        ? `Team: ${tm.team_name}`
        : p && p.team_id
        ? `Team #${p.team_id}`
        : "";
      actions = [
        {
          label: "Navigate to Profile",
          action: () => navigateTo("profile")
        }
      ];
    } else if (n.type === "topic") {
      const t = decisionTopics.find((x) => String(x.name) === String(n.label));
      if (isTopicCat) {
        related = `${(t && t.decision_count) || 0} connected decision(s)`;
        actions.push({
          label: "Browse Decisions",
          action: () => {
            setTopicFilter({ name: n.label, source: "topic" });
            setTab("past");
            setPastPage(1);
          }
        });
      }
      const hasArticles = articleCategories.some(
        (c) => String(c.name) === String(n.label)
      );
      if (hasArticles) {
        actions.push({
          label: "Browse Articles",
          action: () => {
            setTopicFilter({ name: n.label, source: "article" });
            setTab("all");
          }
        });
      }
    } else if (n.type === "discussion") {
      related = `${(n.ref && n.ref.comment_count) || 0} comments · ${
        (n.ref && n.ref.participant_count) || 0
      } participants`;
      actions = [
        {
          label: "Open Discussion",
          action: () => {
            const dec = decisionMap.get(n.ref && n.ref.decision_id) || n.ref;
            openViewDecision(dec);
          }
        }
      ];
    }

    return (
      <div className="kr-graph-panel">
        <div className="kr-graph-panel-head">
          <span
            className="kr-graph-panel-dot"
            style={{ background: NODE_COLOR[n.type] }}
          />
          <div className="kr-graph-panel-head-text">
            <div className="kr-graph-panel-type">{NODE_LABEL[n.type] || n.type}</div>
            <div className="kr-graph-panel-title">{shortLabel(n.label, 40)}</div>
          </div>
          <button
            className="kr-icon-btn"
            onClick={() => setSelected(null)}
            title="Close"
          >
            <KrIcon name="close" size={15} />
          </button>
        </div>
        {n.sub ? (
          <div className="kr-graph-panel-sub">{shortLabel(n.sub, 60)}</div>
        ) : null}
        {related ? <div className="kr-graph-panel-related">{related}</div> : null}
        <div className="kr-graph-panel-actions">
          {actions.map((a) => (
            <button key={a.label} className="kr-panel-btn" onClick={a.action}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="dash-layout">
      <AppSidebar
        activePage="knowledge"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
      <main className="dash-main">
        <header className="dash-header kr-header">
          <div>
            <h2 className="dash-header-title">Knowledge Repository</h2>
            <p className="dash-header-sub">
              Past decisions, documents, topics, people and an interactive knowledge graph
            </p>
          </div>
          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <button className="primary-button kr-upload-btn" onClick={openUpload}>
              <KrIcon name="upload" size={16} /> Upload Document
            </button>
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">{getRoleName(user?.role_id)}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="kr-stat-grid">
          {statCards.map((c) => (
            <button
              key={c.key}
              className="kr-stat-card"
              onClick={() => setTab(c.page)}
              title={`Open ${c.label} tab`}
            >
              <span className="kr-stat-icon" style={{ background: `${c.color}14`, color: c.color }}>
                <KrIcon name={c.icon} size={20} />
              </span>
              <div className="kr-stat-body">
                <div className="kr-stat-value">{c.value}</div>
                <div className="kr-stat-label">{c.label}</div>
              </div>
            </button>
          ))}
        </div>

        <div className="kr-tabs">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`kr-tab${tab === t.key ? " active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="kr-content">
          {tab === "all" && (
            <div className="kr-all">
              {topicFilter && (
                <div className="kr-filter-banner">
                  <KrIcon name="tag" size={15} />
                  <span>
                    Filtered by topic: <strong>{topicFilter.name}</strong>
                  </span>
                  <button
                    className="kr-filter-clear"
                    onClick={() => setTopicFilter(null)}
                  >
                    Clear ×
                  </button>
                </div>
              )}

              {topicFilter && topicFilter.source === "article" && (
                <section className="kr-block">
                  <div className="kr-block-head">
                    <h4>Knowledge Articles</h4>
                    <span className="kr-block-count">{articleFiltered.length}</span>
                  </div>
                  <div className="kr-article-grid">
                    {articleFiltered.map((a) => (
                      <div className="kr-article-card" key={a.article_id}>
                        <div className="kr-article-cat">{a.category}</div>
                        <div className="kr-article-title">{a.title}</div>
                        <div className="kr-article-content">
                          {(a.content || "").slice(0, 140)}
                          {(a.content || "").length > 140 ? "\u2026" : ""}
                        </div>
                        <div className="kr-article-meta">
                          {a.author_name ? `By ${a.author_name} · ` : ""}Updated{" "}
                          {a.updated_at ? formatDate(a.updated_at) : "—"}
                        </div>
                      </div>
                    ))}
                    {articleFiltered.length === 0 && (
                      <div className="kr-empty-row">No articles in this category.</div>
                    )}
                  </div>
                </section>
              )}

              <section className="kr-block">
                <div className="kr-block-head">
                  <h4>Popular Topics</h4>
                  <button className="kr-link-btn" onClick={() => setTab("topics")}>
                    View all →
                  </button>
                </div>
                {topicChips.length === 0 ? (
                  <div className="kr-empty-row">No topics yet.</div>
                ) : (
                  <div className="kr-chip-row">
                    {topicChips.map((c) => (
                      <button
                        key={`${c.source}-${c.name}`}
                        className="kr-chip"
                        onClick={() => {
                          setTopicFilter({ name: c.name, source: c.source });
                          setTab(c.source === "topic" ? "past" : "all");
                        }}
                      >
                        <KrIcon name="tag" size={13} />
                        {c.name}
                        <span className="kr-chip-count">{c.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="kr-block">
                <div className="kr-block-head">
                  <h4>Latest Documents</h4>
                  <button className="kr-link-btn" onClick={() => setTab("documents")}>
                    View all →
                  </button>
                </div>
                <div className="kr-doc-grid">
                  {latestDocs.map((d) => (
                    <div className="kr-doc-card" key={d.document_id}>
                      <div className="kr-doc-icon">
                        <KrIcon
                          name={d.ext === "pdf" || d.ext === "doc" || d.ext === "docx" ? "doc" : "folder"}
                          size={20}
                          color="#0e7490"
                        />
                      </div>
                      <div className="kr-doc-body">
                        <div className="kr-doc-name" title={d.original_file_name}>
                          {shortLabel(d.original_file_name, 34)}
                        </div>
                        <div className="kr-doc-meta">
                          {shortLabel(d.decision_title || "", 30) || "—"} ·{" "}
                          {formatFileSize(d.file_size)}
                        </div>
                      </div>
                      <div className="kr-doc-actions">
                        <button
                          className="kr-mini-btn"
                          onClick={() => handleDownloadDocument(d, true)}
                          title="View file"
                        >
                          <KrIcon name="view" size={14} />
                        </button>
                        <button
                          className="kr-mini-btn"
                          onClick={() => handleDownloadDocument(d, false)}
                          title="Download"
                        >
                          <KrIcon name="download" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {latestDocs.length === 0 && (
                    <div className="kr-empty-row">No documents uploaded yet.</div>
                  )}
                </div>
              </section>

              <section className="kr-block">
                <div className="kr-block-head">
                  <h4>Recent Past Decisions</h4>
                  <button className="kr-link-btn" onClick={() => setTab("past")}>
                    View all →
                  </button>
                </div>
                <div className="kr-past-grid">
                  {latestDecisions.map((d) => (
                    <div className="kr-past-card" key={d.decision_id}>
                      <div className="kr-past-top">
                        <div className="kr-past-title" title={d.title}>
                          {shortLabel(d.title, 44)}
                        </div>
                        <span className={statusBadge(d.status)}>{d.status}</span>
                      </div>
                      <div className="kr-past-meta">
                        {d.team_name ? `${d.team_name} · ` : ""}
                        {d.expert_name || "System"}
                      </div>
                      <div className="kr-past-meta">
                        {d.category_name || "General"} ·{" "}
                        {formatDate(d.decision_date)}
                      </div>
                      <button
                        className="kr-link-btn"
                        onClick={() => openViewDecision(d)}
                      >
                        Open Decision →
                      </button>
                    </div>
                  ))}
                  {latestDecisions.length === 0 && (
                    <div className="kr-empty-row">No decisions recorded yet.</div>
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "documents" && (
            <section className="kr-panel">
              <div className="kr-toolbar">
                <div className="kr-search">
                  <KrIcon name="search" size={15} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search by file name, decision title or type..."
                    value={docSearch}
                    onChange={(e) => {
                      setDocSearch(e.target.value);
                      setDocPage(1);
                    }}
                  />
                </div>
                <select
                  className="form-input kr-select"
                  value={docTeam}
                  onChange={(e) => {
                    setDocTeam(e.target.value);
                    setDocPage(1);
                  }}
                >
                  <option value="">All teams</option>
                  {teamOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  className="form-input kr-select"
                  value={docType}
                  onChange={(e) => {
                    setDocType(e.target.value);
                    setDocPage(1);
                  }}
                >
                  <option value="">All types</option>
                  {docTypes.map((t) => (
                    <option key={t} value={t}>
                      {t.toUpperCase()}
                    </option>
                  ))}
                </select>
                <select
                  className="form-input kr-select"
                  value={docSort}
                  onChange={(e) => {
                    setDocSort(e.target.value);
                    setDocPage(1);
                  }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name A–Z</option>
                  <option value="size">Largest first</option>
                </select>
              </div>

              <div className="kr-count-line">{docCount} document(s)</div>

              {allDocumentsLoading ? (
                <div className="kr-loading">Loading documents...</div>
              ) : docSlice.length === 0 ? (
                <div className="kr-empty">
                  <KrIcon name="doc" size={30} color="#cbd5e1" />
                  <p>
                    No documents match your filters. Upload a document to get started.
                  </p>
                  <button className="primary-button" onClick={openUpload}>
                    <KrIcon name="upload" size={15} /> Upload Document
                  </button>
                </div>
              ) : (
                <>
                  <div className="kr-doc-list">
                    {docSlice.map((d) => (
                      <div className="kr-doc-row" key={d.document_id}>
                        <div className="kr-doc-type">{d.ext ? d.ext.toUpperCase() : "FILE"}</div>
                        <div className="kr-doc-row-main">
                          <div className="kr-doc-name" title={d.original_file_name}>
                            {d.original_file_name}
                          </div>
                          <div className="kr-doc-meta">
                            <button
                              className="kr-inline-link"
                              onClick={() =>
                                openViewDecision(
                                  decisionMap.get(d.decision_id) || {
                                    decision_id: d.decision_id
                                  }
                                )
                              }
                            >
                              {d.decision_title || `Decision #${d.decision_id}`}
                            </button>
                            {d.team_name ? ` · ${d.team_name}` : ""} ·{" "}
                            {formatFileSize(d.file_size)} · {formatDate(d.uploaded_at)}
                          </div>
                        </div>
                        <div className="kr-doc-actions">
                          <button
                            className="kr-mini-btn"
                            onClick={() => handleDownloadDocument(d, true)}
                            title="View file"
                          >
                            <KrIcon name="view" size={14} />
                          </button>
                          <button
                            className="kr-mini-btn"
                            onClick={() => handleDownloadDocument(d, false)}
                            title="Download"
                          >
                            <KrIcon name="download" size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pager
                    page={curDocPage}
                    max={docMax}
                    set={setDocPage}
                    count={docCount}
                  />
                </>
              )}
            </section>
          )}

          {tab === "past" && (
            <section className="kr-panel">
              {topicFilter && topicFilter.source === "topic" && (
                <div className="kr-filter-banner">
                  <KrIcon name="tag" size={15} />
                  <span>
                    Filtered by topic: <strong>{topicFilter.name}</strong>
                  </span>
                  <button
                    className="kr-filter-clear"
                    onClick={() => setTopicFilter(null)}
                  >
                    Clear ×
                  </button>
                </div>
              )}

              <div className="kr-toolbar">
                <div className="kr-search">
                  <KrIcon name="search" size={15} color="#94a3b8" />
                  <input
                    type="text"
                    placeholder="Search by title, expert or topic..."
                    value={pastSearch}
                    onChange={(e) => {
                      setPastSearch(e.target.value);
                      setPastPage(1);
                    }}
                  />
                </div>
                <select
                  className="form-input kr-select"
                  value={pastTeam}
                  onChange={(e) => {
                    setPastTeam(e.target.value);
                    setPastPage(1);
                  }}
                >
                  <option value="">All teams</option>
                  {teamOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <select
                  className="form-input kr-select"
                  value={pastStatus}
                  onChange={(e) => {
                    setPastStatus(e.target.value);
                    setPastPage(1);
                  }}
                >
                  <option value="">All statuses</option>
                  {["Draft", "Under Review", "Reviewer Approved", "Approved", "Rejected", "Archived"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  className="form-input kr-select"
                  value={pastPriority}
                  onChange={(e) => {
                    setPastPriority(e.target.value);
                    setPastPage(1);
                  }}
                >
                  <option value="">All priorities</option>
                  {["Low", "Medium", "High"].map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  className="form-input kr-select"
                  value={pastSort}
                  onChange={(e) => {
                    setPastSort(e.target.value);
                    setPastPage(1);
                  }}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </div>

              <div className="kr-count-line">{pastCount} decision(s)</div>

              {decisionsLoading ? (
                <div className="kr-loading">Loading decisions...</div>
              ) : pastSlice.length === 0 ? (
                <div className="kr-empty">
                  <KrIcon name="activity" size={30} color="#cbd5e1" />
                  <p>No decisions match your filters.</p>
                </div>
              ) : (
                <>
                  <div className="kr-past-list">
                    {pastSlice.map((d) => (
                      <div className="kr-past-row" key={d.decision_id}>
                        <div className="kr-past-row-main">
                          <div className="kr-past-row-title">{d.title}</div>
                          <div className="kr-doc-meta">
                            <button
                              className="kr-inline-link"
                              onClick={() => openViewDecision(d)}
                            >
                              {d.expert_name || "System"}
                            </button>
                            {d.team_name ? ` · ${d.team_name}` : ""}
                            {d.category_name ? ` · ${d.category_name}` : ""} ·{" "}
                            {formatDate(d.decision_date)}
                          </div>
                        </div>
                        <span className={statusBadge(d.status)}>{d.status}</span>
                        <span className="kr-past-priority">{d.priority}</span>
                        <button
                          className="kr-mini-btn primary"
                          onClick={() => openViewDecision(d)}
                          title="Open decision"
                        >
                          <KrIcon name="view" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Pager
                    page={curPastPage}
                    max={pastMax}
                    set={setPastPage}
                    count={pastCount}
                  />
                </>
              )}
            </section>
          )}

          {tab === "topics" && (
            <section className="kr-panel">
              <div className="kr-block-head">
                <h4>Decision Topics</h4>
                <span className="kr-block-count">{decisionTopics.length}</span>
              </div>
              {decisionTopics.length === 0 ? (
                <div className="kr-empty-row">No decision topics yet.</div>
              ) : (
                <div className="kr-topic-grid">
                  {decisionTopics.map((t) => (
                    <button
                      className="kr-topic-card"
                      key={`t-${t.name}`}
                      onClick={() => {
                        setTopicFilter({ name: t.name, source: "topic" });
                        setTab("past");
                        setPastPage(1);
                      }}
                    >
                      <span className="kr-topic-icon kr-topic-icon-t">
                        <KrIcon name="tag" size={16} />
                      </span>
                      <span className="kr-topic-name">{t.name}</span>
                      <span className="kr-topic-count">
                        {t.decision_count} decision(s)
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div className="kr-block-head kr-block-head-spaced">
                <h4>Knowledge Categories</h4>
                <span className="kr-block-count">{articleCategories.length}</span>
              </div>
              {articleCategories.length === 0 ? (
                <div className="kr-empty-row">No knowledge categories yet.</div>
              ) : (
                <div className="kr-topic-grid">
                  {articleCategories.map((c) => (
                    <button
                      className="kr-topic-card kr-topic-card-k"
                      key={`k-${c.name}`}
                      onClick={() => {
                        setTopicFilter({ name: c.name, source: "article" });
                        setTab("all");
                      }}
                    >
                      <span className="kr-topic-icon kr-topic-icon-k">
                        <KrIcon name="article" size={16} />
                      </span>
                      <span className="kr-topic-name">{c.name}</span>
                      <span className="kr-topic-count">
                        {c.article_count} article(s)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "people" && (
            <section className="kr-panel">
              {people.length === 0 ? (
                <div className="kr-empty">
                  <KrIcon name="users" size={30} color="#cbd5e1" />
                  <p>No people found yet.</p>
                </div>
              ) : (
                <div className="kr-people-grid">
                  {people.map((p) => (
                    <button
                      key={p.user_id}
                      className={`kr-person-card${
                        personInfo &&
                        String(personInfo.user_id) === String(p.user_id)
                          ? " active"
                          : ""
                      }`}
                      onClick={() =>
                        setPersonInfo(
                          personInfo &&
                            String(personInfo.user_id) === String(p.user_id)
                            ? null
                            : p
                        )
                      }
                    >
                      <div className="kr-avatar">
                        {p.name ? p.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div className="kr-person-name">{p.name}</div>
                      <div className="kr-person-role">{p.role_name || "Member"}</div>
                      <div className="kr-person-team">{p.team_name || "No team"}</div>
                      <div className="kr-person-stat">{p.contributed} decision(s)</div>
                    </button>
                  ))}
                </div>
              )}

              {personInfo && (
                <div className="kr-person-detail">
                  <div className="kr-person-detail-head">
                    <div className="kr-avatar">
                      {personInfo.name ? personInfo.name.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <div className="kr-person-name">{personInfo.name}</div>
                      <div className="kr-person-role">
                        {personInfo.role_name || "Member"} ·{" "}
                        {personInfo.team_name || "No team"}
                      </div>
                    </div>
                    <button
                      className="kr-icon-btn"
                      onClick={() => setPersonInfo(null)}
                      title="Close"
                    >
                      <KrIcon name="close" size={15} />
                    </button>
                  </div>
                  <div className="kr-person-detail-body">
                    <div className="kr-count-line">
                      {personInfo.contributed} contributed decision(s) by {personInfo.name}
                    </div>
                    <div className="kr-past-list">
                      {(decisions || [])
                        .filter(
                          (d) => String(d.expert_id) === String(personInfo.user_id)
                        )
                        .map((d) => (
                          <div className="kr-past-row" key={d.decision_id}>
                            <div className="kr-past-row-main">
                              <div className="kr-past-row-title">{d.title}</div>
                              <div className="kr-doc-meta">
                                {d.team_name || ""}
                                {d.team_name && d.category_name ? " · " : ""}
                                {d.category_name || ""}
                                {d.decision_date
                                  ? ` · ${formatDate(d.decision_date)}`
                                  : ""}
                              </div>
                            </div>
                            <span className={statusBadge(d.status)}>{d.status}</span>
                            <button
                              className="kr-mini-btn primary"
                              onClick={() => openViewDecision(d)}
                              title="Open decision"
                            >
                              <KrIcon name="view" size={14} />
                            </button>
                          </div>
                        ))}
                      {(decisions || []).filter(
                        (d) => String(d.expert_id) === String(personInfo.user_id)
                      ).length === 0 && (
                        <div className="kr-empty-row">
                          No contributed decisions yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {tab === "insights" && (
            <section className="kr-panel">
              {insightsLoading ? (
                <div className="kr-loading">Loading insights...</div>
              ) : !insights ? (
                <div className="kr-empty">
                  <KrIcon name="insights" size={30} color="#cbd5e1" />
                  <p>No insights available yet.</p>
                </div>
              ) : (
                <InsightsBody
                  insights={insights}
                  formatDate={formatDate}
                  openViewDecision={openViewDecision}
                />
              )}
            </section>
          )}
        </div>

        {/* ------------------------------------ */}
        {/* KNOWLEDGE GRAPH                        */}
        {/* ------------------------------------ */}
        <div className="kr-graph-card">
          <div className="kr-graph-toolbar">
            <div>
              <div className="kr-graph-card-title">Knowledge Graph</div>
              <div className="kr-graph-card-sub">
                Explore how decisions, documents, people, teams, topics and discussions connect.
              </div>
            </div>
            <div className="kr-graph-controls">
              <div className="kr-graph-search">
                <KrIcon name="search" size={15} color="#64748b" />
                <input
                  type="text"
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  placeholder="Search nodes…"
                />
                {graphSearch ? (
                  <button
                    className="kr-graph-search-clear"
                    onClick={() => setGraphSearch("")}
                    title="Clear search"
                  >
                    &times;
                  </button>
                ) : null}
              </div>
              <button
                className="kr-icon-btn"
                onClick={() => setZoom((z) => Math.min(2.6, z + 0.2))}
                title="Zoom in"
              >
                <KrIcon name="zoomin" size={16} />
              </button>
              <button
                className="kr-icon-btn"
                onClick={() => setZoom((z) => Math.max(0.45, z - 0.2))}
                title="Zoom out"
              >
                <KrIcon name="zoomout" size={16} />
              </button>
              <button
                className="kr-icon-btn"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                title="Reset view"
              >
                <KrIcon name="reset" size={16} />
              </button>
            </div>
          </div>

          <div className="kr-graph-legend">
            {Object.keys(NODE_LABEL).map((type) => {
              const count = graph.nodes.filter((n) => n.type === type).length;
              const hidden = hiddenTypes.includes(type);
              return (
                <button
                  key={type}
                  className={`kr-legend-item${hidden ? " off" : ""}`}
                  onClick={() => toggleType(type)}
                  title={hidden ? `Show ${NODE_LABEL[type]}` : `Hide ${NODE_LABEL[type]}`}
                >
                  <span
                    className="kr-legend-dot"
                    style={{ background: hidden ? "#e2e8f0" : NODE_COLOR[type] }}
                  />
                  <span>{NODE_LABEL[type]}</span>
                  <span className="kr-legend-count">{count}</span>
                </button>
              );
            })}
            {graphQuery ? (
              <span className="kr-legend-hint">
                {matchCount} match{matchCount === 1 ? "" : "es"} · Clear the box to show all
              </span>
            ) : (
              <span className="kr-legend-hint">
                Drag to pan · Scroll to zoom · Search to find · Click a node to inspect
              </span>
            )}
          </div>

          <div className="kr-graph-body">
            <div className="kr-graph-canvas">
              {visibleNodes.length === 0 ? (
                <div className="kr-empty kr-graph-empty">
                  <KrIcon name="graph" size={30} color="#cbd5e1" />
                  <p>
                    No knowledge graph data yet. Add decisions or upload documents
                    to build the graph.
                  </p>
                </div>
              ) : (
                <svg
                  ref={svgRef}
                  className={`kr-graph-svg${dragging ? " kr-dragging" : ""}`}
                  viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                  onWheel={onWheelZoom}
                >
                  <g
                    transform={`translate(${pan.x} ${pan.y}) translate(${VIEW_W / 2} ${VIEW_H / 2}) scale(${zoom}) translate(${-VIEW_W / 2} ${-VIEW_H / 2})`}
                  >
                    {!hiddenTypes.includes("decision") &&
                      clusterBoxes.map((cb) => (
                        <g key={cb.id} className="kr-graph-cluster">
                          <rect
                            x={cb.x}
                            y={cb.y}
                            width={cb.w}
                            height={cb.h}
                            rx={22}
                          />
                          <text x={cb.x + 14} y={cb.y + 22} className="kr-graph-cluster-label">
                            {cb.label} · {cb.count} node{cb.count === 1 ? "" : "s"}
                          </text>
                        </g>
                      ))}
                    {visibleEdges.map((e, i) => {
                      const a = graph.byId[e.s];
                      const b = graph.byId[e.t];
                      const focus =
                        hoverId === e.s ||
                        hoverId === e.t ||
                        (activeNode && (activeNode.id === e.s || activeNode.id === e.t));
                      const inSearch =
                        !graphQuery ||
                        (matchedIds && matchedIds.has(e.s) && matchedIds.has(e.t));
                      const dx = b.x - a.x;
                      const dy = b.y - a.y;
                      const len = Math.max(1, Math.hypot(dx, dy));
                      const sag = Math.min(12, len * 0.12);
                      const qx = (a.x + b.x) / 2 - (dy / len) * sag;
                      const qy = (a.y + b.y) / 2 + (dx / len) * sag;
                      return (
                        <path
                          key={`e${i}`}
                          d={`M ${a.x} ${a.y} Q ${qx} ${qy} ${b.x} ${b.y}`}
                          fill="none"
                          stroke={focus ? "#334155" : EDGE_COLOR[e.kind] || "#94a3b8"}
                          strokeWidth={focus ? 2 : 1.25}
                          opacity={focus ? 0.95 : inSearch ? 0.55 : 0.22}
                          pointerEvents="none"
                        />
                      );
                    })}
                    {visibleNodes.map((n) => {
                      const active =
                        hoverId === n.id || (activeNode && activeNode.id === n.id);
                      const matched = !graphQuery || (matchedIds && matchedIds.has(n.id));
                      const dim = graphQuery && !matched;
                      const isRoot = n.type === "decision";
                      const r = active ? NODE_SIZE[n.type] + 3.5 : NODE_SIZE[n.type];
                      const isHubType =
                        n.type === "team" ||
                        n.type === "topic" ||
                        n.type === "person" ||
                        n.type === "decision";
                      const showLabel =
                        !dim &&
                        (active ||
                          (isRoot && zoom >= 0.72) ||
                          (zoom >= 1.35 &&
                            (isHubType || visibleNodes.length <= 60)) ||
                          (visibleNodes.length <= 60 && zoom >= 0.8) ||
                          (graphQuery && matched));
                      return (
                        <g
                          key={n.id}
                          className="kr-graph-node"
                          transform={`translate(${n.x} ${n.y})`}
                          onMouseEnter={() => onNodeHoverId(n.id)}
                          onMouseLeave={() => onNodeHoverId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(n);
                          }}
                          style={{ cursor: "pointer", opacity: dim ? 0.14 : 1 }}
                        >
                          <title>
                            {n.label}
                            {n.sub ? ` — ${n.sub}` : ""}
                            {n.shared > 1 ? ` · shared across ${n.shared} decisions` : ""}
                            {n.shared > 1 ? " · (edges only shown in primary cluster)" : ""}
                          </title>
                          <circle
                            r={r}
                            fill={NODE_COLOR[n.type]}
                            opacity={active ? 1 : 0.92}
                            stroke={active ? "#0f172a" : isRoot ? "#1e3a8a" : "#ffffff"}
                            strokeWidth={isRoot ? 2 : 1.4}
                          />
                          <circle
                            r={r + (isRoot ? 7 : 5)}
                            fill="none"
                            stroke={NODE_COLOR[n.type]}
                            strokeWidth={1}
                            opacity={active ? 0.6 : isRoot ? 0.3 : 0}
                          />
                          {isRoot ? (
                            <circle
                              r={r + 3}
                              fill="none"
                              stroke="#ffffff"
                              strokeWidth={2}
                              opacity={active ? 0.9 : 0.7}
                            />
                          ) : null}
                          {showLabel ? (
                            <text
                              className={`kr-graph-node-text${isRoot ? " kr-decision-label" : ""}`}
                              y={r + 14}
                              textAnchor="middle"
                            >
                              {wrapLabel(n.label, n.type === "decision" ? 34 : 16)
                                .slice(0, 2)
                                .map((line, li) => (
                                  <tspan
                                    key={li}
                                    x={0}
                                    dy={li === 0 ? 0 : 12.5}
                                  >
                                    {line}
                                  </tspan>
                                ))}
                            </text>
                          ) : null}
                        </g>
                      );
                    })}
                  </g>
                </svg>
              )}
            </div>
            <div className="kr-graph-side">{renderPanel()}</div>
          </div>
        </div>

        {/* ------------------------------------ */}
        {/* RECENT ACTIVITY                       */}
        {/* ------------------------------------ */}
        <div className="kr-activity-card">
          <div className="kr-graph-toolbar">
            <div>
              <div className="kr-graph-card-title">Recent Activity</div>
              <div className="kr-graph-card-sub">
                Latest updates across documents, decisions and knowledge articles.
              </div>
            </div>
          </div>
          {activity.length === 0 ? (
            <div className="kr-empty-row">No recent activity yet.</div>
          ) : (
            <div className="kr-activity-list">
              {activity.map((ev) => (
                <div className="kr-activity-item" key={ev.id}>
                  <span className={`kr-activity-dot kr-activity-dot-${ev.kind}`}>
                    <KrIcon
                      name={
                        ev.kind === "article"
                          ? "article"
                          : ev.kind === "document"
                          ? "doc"
                          : "activity"
                      }
                      size={13}
                      color="#ffffff"
                    />
                  </span>
                  <div className="kr-activity-body">
                    <div className="kr-activity-verb">{ev.verb}</div>
                    {ev.kind === "decision" ? (
                      <button
                        className="kr-inline-link"
                        onClick={() => openViewDecision(ev.ref)}
                      >
                        {ev.label}
                      </button>
                    ) : ev.kind === "document" ? (
                      <button
                        className="kr-inline-link"
                        onClick={() => handleDownloadDocument(ev.ref, true)}
                      >
                        {ev.label}
                      </button>
                    ) : (
                      <span className="kr-activity-label">{ev.label}</span>
                    )}
                  </div>
                  <span className="kr-activity-time">{formatDate(ev.at)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {showUpload && (
        <div
          className="kr-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeUpload();
          }}
        >
          <div className="kr-modal">
            <div className="kr-modal-head">
              <h4>
                <KrIcon name="upload" size={18} /> Upload Document
              </h4>
              <button
                className="kr-icon-btn"
                onClick={closeUpload}
                disabled={uploadBusy}
                title="Close"
              >
                <KrIcon name="close" size={15} />
              </button>
            </div>
            <form onSubmit={submitUpload}>
              <div className="form-group">
                <label className="form-label">Attach to decision *</label>
                <select
                  className="form-input"
                  value={uploadDecisionId}
                  onChange={(e) => setUploadDecisionId(e.target.value)}
                >
                  <option value="">Select a decision...</option>
                  {(decisions || []).map((d) => (
                    <option key={d.decision_id} value={d.decision_id}>
                      {d.title} {d.team_name ? `(${d.team_name})` : ""} · {d.status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Choose file *</label>
                <input
                  type="file"
                  className="form-input"
                  onChange={(e) =>
                    setUploadFile(
                      e.target.files && e.target.files[0] ? e.target.files[0] : null
                    )
                  }
                />
                {uploadFile ? (
                  <div className="kr-upload-file">
                    {uploadFile.name} · {formatFileSize(uploadFile.size)}
                  </div>
                ) : null}
                <div className="kr-form-hint">
                  PDF, images, documents, spreadsheets, ZIP, JSON, XML, LOG · max 15 MB
                </div>
              </div>
              {uploadMsg && (
                <div className={`message ${uploadMsgType}`}>{uploadMsg}</div>
              )}
              <div className="modal-actions">
                <button type="button" className="nav-button" onClick={closeUpload} disabled={uploadBusy}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={uploadBusy}>
                  {uploadBusy ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// DISCUSSIONS PAGE
// ==========================================

const cleanText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u0080-\u009f\u00ad\u200b-\u200d\ufeff]/g, "")
    .trim();
};

const STATUS_KEYS = [
  "approved",
  "rejected",
  "under-review",
  "archived",
  "draft",
  "active",
  "in-progress",
  "completed"
];

const cleanStatusKey = (status) => {
  const key = cleanText(status)
    .toLowerCase()
    .replace(/[\s/]+/g, "-");
  return STATUS_KEYS.includes(key) ? key : "default";
};

const statusTone = (status) => {
  const key = cleanStatusKey(status);
  return `disc-badge-${key}`;
};

const ICONS = {
  comment: "\u{1F4AC}",
  activity: "\u{1F4DD}",
  team: "\u{1F3E2}",
  people: "\u{1F465}",
  clock: "\u{23F3}",
  chat: "\u{1F4AC}",
  inbox: "\u{1F4E5}"
};

const ParticipantStack = ({ participants = [], limit = 4 }) => {
  const people = (participants || [])
    .map((p) => ({
      key: Number(p.user_id),
      name: cleanText(p.name) || `User #${p.user_id}`
    }))
    .filter((p) => Number.isFinite(p.key));

  if (people.length === 0) return null;

  const shown = people.slice(0, limit);
  const extra = people.length - shown.length;

  return (
    <div className="disc-stack">
      <div className="disc-stack-avatars">
        {shown.map((p) => (
          <span
            className="disc-person-avatar"
            key={p.key}
            title={p.name}
          >
            {p.name.charAt(0).toUpperCase()}
          </span>
        ))}
        {extra > 0 && (
          <span className="disc-person-avatar disc-person-more">
            +{extra}
          </span>
        )}
      </div>
      <span className="disc-stack-count">
        {people.length} {people.length === 1 ? "Participant" : "Participants"}
      </span>
    </div>
  );
};

const DiscussionsPage = (props) => {
  const {
    user,
    getRoleName,
    getToken,
    navigateTo,
    handleLogout,
    formatDate
  } = props;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [openDec, setOpenDec] = useState(null);
  const [comments, setComments] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [postMsg, setPostMsg] = useState("");
  const [postMsgType, setPostMsgType] = useState("error");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const authHeaders = { "Authorization": `Bearer ${getToken()}` };

  const fetchData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/discussions/?limit=200`,
        { headers: authHeaders }
      );
      if (res.status === 401) {
        navigateTo("login");
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError("Unable to load discussions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    if (!openDec) return;
    const onKey = (e) => {
      if (e.key === "Escape") closeThread();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openDec]);

  const teamOptions = useMemo(() => {
    const counts = {};
    list.forEach((d) => {
      const name = cleanText(d.team_name) || "(No team)";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [list]);

  const statusOptions = useMemo(() => {
    const counts = {};
    list.forEach((d) => {
      const name = cleanText(d.status) || "Unknown";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts).sort();
  }, [list]);

  const scopeCounts = useMemo(() => {
    const all = list.length;
    const active = list.filter(
      (d) => cleanText(d.status).toLowerCase() !== "archived"
    ).length;
    return { all, active, archived: all - active };
  }, [list]);

  const filtered = useMemo(() => {
    const q = cleanText(search).toLowerCase();
    return list.filter((d) => {
      const statusRaw = cleanText(d.status).toLowerCase();
      if (scope === "active" && statusRaw === "archived") return false;
      if (scope === "archived" && statusRaw !== "archived") return false;
      const team = cleanText(d.team_name) || "(No team)";
      if (teamFilter !== "all" && team !== teamFilter) return false;
      if (
        statusFilter !== "all" &&
        cleanText(d.status) !== statusFilter
      ) {
        return false;
      }
      if (q) {
        const haystack = [
          cleanText(d.title),
          team,
          cleanText(d.expert_name),
          ...(d.participants || []).map((p) => cleanText(p.name))
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [list, search, scope, teamFilter, statusFilter]);

  const recentActivity = useMemo(() => {
    return [...list]
      .sort(
        (a, b) =>
          new Date(b.last_activity_at) - new Date(a.last_activity_at)
      )
      .slice(0, 6);
  }, [list]);

  const openThread = async (d) => {
    setOpenDec(d);
    setComments([]);
    setThreadLoading(true);
    setThreadError("");
    setPostMsg("");
    setPostMsgType("error");
    setCommentText("");
    setDeleteTarget(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/decisions/${d.decision_id}/comments`,
        { headers: authHeaders }
      );
      if (res.status === 401) {
        navigateTo("login");
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) {
      setThreadError("Failed to load the discussion thread.");
    } finally {
      setThreadLoading(false);
    }
  };

  const closeThread = () => {
    setOpenDec(null);
    setComments([]);
    setDeleteTarget(null);
  };

  const syncCardCounts = (decisionId, nextComments) => {
    setList((prev) =>
      prev.map((item) => {
        if (item.decision_id !== decisionId) return item;
        const uniqueUsers = new Set(
          nextComments.map((c) => Number(c.user_id))
        );
        return {
          ...item,
          comment_count: nextComments.length,
          participant_count: uniqueUsers.size,
          last_activity_at: nextComments.length
            ? nextComments[nextComments.length - 1].created_at
            : item.last_activity_at
        };
      })
    );
  };

  const postComment = async (e) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !openDec) return;
    setPosting(true);
    setPostMsg("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/decisions/${openDec.decision_id}/comments`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ content: text })
        }
      );
      if (res.status === 401) {
        navigateTo("login");
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const created = await res.json();
      const updated = [...comments, created];
      setComments(updated);
      syncCardCounts(openDec.decision_id, updated);
      setCommentText("");
      setPostMsg("Comment posted.");
      setPostMsgType("success");
    } catch (err) {
      setPostMsg("Failed to post comment. Please try again.");
      setPostMsgType("error");
    } finally {
      setPosting(false);
    }
  };

  const confirmDeleteComment = (c) => setDeleteTarget(c);
  const cancelDeleteComment = () => setDeleteTarget(null);

  const deleteComment = async () => {
    if (!deleteTarget || !openDec) return;
    setDeleting(true);
    setPostMsg("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/decisions/${openDec.decision_id}/comments/${deleteTarget.comment_id}`,
        { method: "DELETE", headers: authHeaders }
      );
      if (res.status === 401) {
        navigateTo("login");
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const updated = comments.filter(
        (c) => Number(c.comment_id) !== Number(deleteTarget.comment_id)
      );
      setComments(updated);
      syncCardCounts(openDec.decision_id, updated);
      setDeleteTarget(null);
      setPostMsg("Comment deleted.");
      setPostMsgType("success");
    } catch (err) {
      setPostMsg("Failed to delete comment. Please try again.");
      setPostMsgType("error");
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteComment = (c) =>
    Number(user?.role_id) === 4 ||
    Number(user?.user_id) === Number(openDec?.expert_id) ||
    Number(user?.user_id) === Number(c.user_id);

  const statusBadge = (status) => `disc-badge ${statusTone(status)}`;
  const statusLabel = (status) => cleanText(status) || "Unknown";

  const hasActiveFilters =
    search || scope !== "all" || teamFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setScope("all");
    setTeamFilter("all");
    setStatusFilter("all");
  };

  return (
    <div className="dash-layout">
      <AppSidebar
        activePage="discussions"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h2 className="dash-header-title">Discussions</h2>
            <p className="dash-header-sub">
              Conversations linked to decisions, scoped to your teams.
            </p>
          </div>
          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="disc-page">
          <div className="disc-content">
            <section className="kr-panel disc-panel">
              <div className="disc-panel-head">
                <div>
                  <div className="detail-card-title">
                    Live Discussions
                  </div>
                  <p className="alt-section-sub">
                    Browse and join conversations on decisions.
                  </p>
                </div>
                <div className="kr-block-count">
                  {filtered.length} shown
                </div>
              </div>

              <div className="kr-toolbar disc-toolbar">
                <div className="disc-toolbar-top">
                  <div className="kr-search disc-search">
                    <KrIcon name="search" size={16} />
                    <input
                      type="text"
                      placeholder="Search by title, team, expert or participant..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    {search && (
                      <button
                        className="disc-search-clear"
                        onClick={() => setSearch("")}
                        title="Clear search"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  <div className="disc-filter-row">
                    <div className="disc-filter-field">
                      <label className="disc-filter-label" htmlFor="disc-team-filter">
                        Team
                      </label>
                      <select
                        id="disc-team-filter"
                        className="kr-select"
                        value={teamFilter}
                        onChange={(e) => setTeamFilter(e.target.value)}
                      >
                        <option value="all">All teams</option>
                        {teamOptions.map(([name, count]) => (
                          <option key={name} value={name}>
                            {name} ({count})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="disc-filter-field">
                      <label className="disc-filter-label" htmlFor="disc-status-filter">
                        Status
                      </label>
                      <select
                        id="disc-status-filter"
                        className="kr-select"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="all">All statuses</option>
                        {statusOptions.map(([name, count]) => (
                          <option key={name} value={name}>
                            {name} ({count})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="kr-tabs disc-scope-tabs">
                  {[
                    { key: "all", label: "All" },
                    { key: "active", label: "Active" },
                    { key: "archived", label: "Archived" }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      className={`kr-tab${scope === tab.key ? " active" : ""}`}
                      onClick={() => setScope(tab.key)}
                    >
                      {tab.label}
                      <span className="disc-tab-count">
                        {scopeCounts[tab.key]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {loading && (
                <div className="disc-state">
                  <div className="disc-spinner"></div>
                  <p>Loading discussions...</p>
                </div>
              )}

              {!loading && loadError && (
                <div className="disc-state disc-state-error">
                  <div className="message error">{loadError}</div>
                  <button
                    className="action-button view-button"
                    onClick={fetchData}
                  >
                    Try again
                  </button>
                </div>
              )}

              {!loading && !loadError && filtered.length === 0 && (
                <div className="disc-state">
                  <div className="disc-empty-icon">{ICONS.inbox}</div>
                  <h3>
                    {list.length === 0
                      ? "No discussions yet"
                      : "No discussions match your filters"}
                  </h3>
                  <p>
                    {list.length === 0
                      ? "Start a discussion around a decision to collaborate with your team."
                      : "Try adjusting your search or filter criteria."}
                  </p>
                  {hasActiveFilters && (
                    <button
                      className="action-button view-button"
                      onClick={clearFilters}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}

              {!loading && !loadError && filtered.length > 0 && (
                <div className="disc-grid">
                  {filtered.map((d) => (
                    <div className="disc-card" key={d.decision_id}>
                      <div className="disc-card-head">
                        <div className="disc-card-icon">{ICONS.chat}</div>
                        <div className="disc-card-head-main">
                          <button
                            className="disc-card-title"
                            onClick={() => openThread(d)}
                            title="Open discussion"
                          >
                            {cleanText(d.title)}
                          </button>
                          <div className="disc-card-badges">
                            <span className={statusBadge(d.status)}>
                              {statusLabel(d.status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="disc-card-meta">
                        <button
                          className="disc-chip"
                          disabled={!d.team_id}
                          onClick={() =>
                            d.team_id &&
                            navigateTo("team-view", { team_id: d.team_id })
                          }
                          title={
                            d.team_id
                              ? "Open team details"
                              : "No team linked"
                          }
                        >
                          <span className="disc-chip-icon">{ICONS.team}</span>
                          {cleanText(d.team_name) || "No team"}
                        </button>
                        <span className="disc-chip">
                          <span className="disc-chip-icon">{"\u{1F464}"}</span>
                          {cleanText(d.expert_name) || "System"}
                        </span>
                      </div>

                      <div className="disc-card-stats">
                        <span>
                          <span className="disc-stat-ico">{ICONS.comment}</span>
                          {d.comment_count || 0} Comments
                        </span>
                        <span className="disc-stat-sep">{"\u00B7"}</span>
                        <span>
                          <span className="disc-stat-ico">{ICONS.people}</span>
                          {d.participant_count || 0} Participants
                        </span>
                      </div>

                      <ParticipantStack participants={d.participants} />

                      <div className="disc-card-foot">
                        <span className="disc-last-activity">
                          <span className="disc-stat-ico">{ICONS.clock}</span>
                          {formatDate(d.last_activity_at)}
                        </span>
                        <button
                          className="action-button view-button disc-open"
                          onClick={() => openThread(d)}
                        >
                          Open Discussion
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="disc-side">
            <section className="kr-panel disc-side-card">
              <div className="disc-side-title">Discussion Activity</div>
              <div className="disc-activity-list">
                {recentActivity.length === 0 ? (
                  <p className="disc-activity-empty">
                    No activity yet. Start a discussion to see updates here.
                  </p>
                ) : (
                  recentActivity.map((a) => (
                    <button
                      className="disc-activity-item"
                      key={a.decision_id}
                      onClick={() => openThread(a)}
                      title="Open discussion"
                    >
                      <span className="disc-activity-icon">
                        {Number(a.comment_count) > 0
                          ? ICONS.activity
                          : ICONS.chat}
                      </span>
                      <span className="disc-activity-body">
                        <strong>{cleanText(a.title)}</strong>
                        <span className="disc-time">
                          {Number(a.comment_count) > 0
                            ? `${a.comment_count} comment(s)`
                            : "Discussion started"}{" "}
                          {"\u2022"} {formatDate(a.last_activity_at)}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="kr-panel disc-side-card">
              <div className="disc-side-title">Discussion Guidelines</div>
              <ul className="disc-guidelines">
                <li>Stay relevant to the decision at hand.</li>
                <li>Share evidence and data when possible.</li>
                <li>Respect team members and their opinions.</li>
                <li>Keep discussions decision-focused.</li>
              </ul>
            </section>
          </aside>
        </div>
      </main>

      {openDec && (
        <div className="modal-overlay" onClick={closeThread}>
          <div
            className="modal-box disc-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="disc-modal-head">
              <div className="disc-modal-icon">{ICONS.chat}</div>
              <div className="disc-modal-title-wrap">
                <h3 className="disc-modal-title">
                  {cleanText(openDec.title)}
                </h3>
                <div className="disc-modal-badges">
                  <span className={statusBadge(openDec.status)}>
                    {statusLabel(openDec.status)}
                  </span>
                </div>
              </div>
              <button
                className="disc-modal-close"
                onClick={closeThread}
                title="Close"
              >
                &times;
              </button>
            </div>

            <div className="disc-modal-info">
              <div className="disc-modal-tile">
                <span className="disc-label">Related Decision</span>
                <button
                  className="disc-link"
                  onClick={() =>
                    navigateTo("decision-view", {
                      decision_id: openDec.decision_id
                    })
                  }
                >
                  {cleanText(openDec.title)}
                </button>
              </div>
              <div className="disc-modal-tile">
                <span className="disc-label">Team</span>
                {openDec.team_id ? (
                  <button
                    className="disc-link"
                    onClick={() =>
                      navigateTo("team-view", {
                        team_id: openDec.team_id
                      })
                    }
                  >
                    {cleanText(openDec.team_name) || "Unassigned"}
                  </button>
                ) : (
                  <span className="disc-tile-value">
                    {cleanText(openDec.team_name) || "Unassigned"}
                  </span>
                )}
              </div>
              <div className="disc-modal-tile">
                <span className="disc-label">Created</span>
                <span className="disc-tile-value">
                  {formatDate(openDec.created_at)}
                </span>
              </div>
              <div className="disc-modal-tile">
                <span className="disc-label">Last Activity</span>
                <span className="disc-tile-value">
                  {formatDate(openDec.last_activity_at)}
                </span>
              </div>
              <div className="disc-modal-tile">
                <span className="disc-label">Owned By</span>
                <span className="disc-tile-value">
                  {cleanText(openDec.expert_name) || "System"}
                </span>
              </div>
            </div>

            <div className="disc-conv">
              <div className="disc-conv-head">
                <div className="detail-card-title">Conversation</div>
                <div className="kr-block-count">
                  {comments.length} {comments.length === 1 ? "comment" : "comments"}
                </div>
              </div>

              {postMsg && (
                <div className={`message ${postMsgType}`}>
                  {postMsg}
                </div>
              )}

              {threadLoading && (
                <div className="disc-state">
                  <div className="disc-spinner"></div>
                  <p>Loading discussion...</p>
                </div>
              )}

              {!threadLoading && threadError && (
                <div className="message error">{threadError}</div>
              )}

              {!threadLoading &&
                !threadError &&
                comments.length === 0 && (
                  <div className="disc-conv-empty">
                    No comments yet. Start the conversation below.
                  </div>
                )}

              {!threadLoading &&
                !threadError &&
                comments.length > 0 && (
                  <div className="disc-comment-list">
                    {comments.map((c) => {
                      const confirmTarget =
                        deleteTarget &&
                        Number(deleteTarget.comment_id) === Number(c.comment_id);
                      return (
                        <div className="disc-comment" key={c.comment_id}>
                          <div className="disc-comment-avatar">
                            {cleanText(c.author_name).charAt(0).toUpperCase() ||
                              "?"}
                          </div>
                          <div className="disc-comment-body">
                            <div className="disc-comment-head">
                              <strong>
                                {cleanText(c.author_name) ||
                                  `User #${c.user_id}`}
                              </strong>
                              <span>{formatDate(c.created_at)}</span>
                            </div>
                            <p className="disc-comment-content">
                              {cleanText(c.content)}
                            </p>
                            {confirmTarget ? (
                              <div className="disc-delete-confirm">
                                <span>Delete this comment?</span>
                                <button
                                  className="disc-delete-cancel"
                                  onClick={cancelDeleteComment}
                                  disabled={deleting}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="disc-delete-ok"
                                  onClick={deleteComment}
                                  disabled={deleting}
                                >
                                  {deleting ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            ) : (
                              canDeleteComment(c) && (
                                <button
                                  className="disc-comment-delete"
                                  onClick={() => confirmDeleteComment(c)}
                                >
                                  Delete
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              <form className="disc-comment-form" onSubmit={postComment}>
                <textarea
                  rows="3"
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                ></textarea>
                <div className="disc-comment-form-foot">
                  <span className="disc-form-hint">
                    Be specific and helpful.
                  </span>
                  <button
                    type="submit"
                    className="primary-button disc-post-btn"
                    disabled={posting || !commentText.trim()}
                  >
                    {posting ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// SEARCH PAGE
// ==========================================

const SearchPage = (props) => {
  const {
    user,
    getRoleName,
    navigateTo,
    formatDate,
    results,
    loading,
    onSearch,
    handleLogout
  } = props;

  const [q, setQ] = useState("");

  const submit = (e) => {
    if (e) e.preventDefault();
    onSearch(q);
  };

  const none = (arr) => !arr || arr.length === 0;

  return (
    <div className="dash-layout">
      <AppSidebar
        activePage="search"
        navigateTo={navigateTo}
        handleLogout={handleLogout}
      />
      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h2 className="dash-header-title">Search</h2>
            <p className="dash-header-sub">
              Find decisions, documents, teams, and people
            </p>
          </div>
          <div className="dash-header-right">
            <NotificationBell navigateTo={navigateTo} />
            <div className="dash-header-user">
              <div className="dash-avatar">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="dash-user-info">
                <div className="dash-user-name">{user?.name}</div>
                <div className="dash-user-role">
                  {getRoleName(user?.role_id)}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="dash-card" style={{ marginBottom: "20px" }}>
          <form className="filter-bar" style={{ marginBottom: "0" }} onSubmit={submit}>
            <div className="filter-field grow">
              <input
                type="text"
                className="form-input"
                placeholder="Search decisions, documents, teams, discussions, knowledge, people..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? "Searching..." : "\u{1F50D} Search"}
            </button>
          </form>
        </section>

        {results && (
          <>
            {!none(results.decisions) && (
              <section className="dash-card" style={{ marginBottom: "20px" }}>
                <h4 className="dash-side-title">
                  Decisions ({results.decisions.length})
                </h4>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead>
                      <tr><th>Title</th><th>Status</th><th>Expert</th><th>Team</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {results.decisions.map((d) => (
                        <tr key={d.decision_id}>
                          <td className="dash-td-title">{d.title}</td>
                          <td>
                            <span className={`dash-badge dash-badge-${(d.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                              {d.status}
                            </span>
                          </td>
                          <td>{d.expert_name || "\u2014"}</td>
                          <td>{d.team_name || "\u2014"}</td>
                          <td>
                            <button
                              className="action-button view-button"
                              onClick={() =>
                                navigateTo("decision-view", {
                                  decision_id: d.decision_id }
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {!none(results.documents) && (
              <section className="dash-card" style={{ marginBottom: "20px" }}>
                <h4 className="dash-side-title">
                  Documents ({results.documents.length})
                </h4>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead>
                      <tr><th>File</th><th>Decision</th><th>Type</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                      {results.documents.map((doc) => (
                        <tr key={doc.document_id}>
                          <td className="dash-td-title">
                            {doc.original_file_name || doc.file_name}
                          </td>
                          <td>{doc.decision_title || "\u2014"}</td>
                          <td>{doc.file_type || "\u2014"}</td>
                          <td>
                            <button
                              className="action-button view-button"
                              onClick={() =>
                                navigateTo("decision-view", {
                                  decision_id: doc.decision_id }
                                )
                              }
                            >
                              Open Decision
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {!none(results.discussions) && (
              <section className="dash-card" style={{ marginBottom: "20px" }}>
                <h4 className="dash-side-title">
                  Discussions ({results.discussions.length})
                </h4>
                <div className="disc-list">
                  {results.discussions.map((d) => (
                    <div className="disc-card" key={d.decision_id}>
                      <div className="disc-body">
                        <div className="disc-title-row">
                          <div className="disc-title">{d.title}</div>
                          <span className={`dash-badge dash-badge-${(d.status || "").toLowerCase().replace(/\s+/g, "-")}`}>
                            {d.status}
                          </span>
                        </div>
                        <div className="disc-meta">
                          {d.comment_count} comment(s) \u00B7{" "}
                          {d.participant_count} participant(s)
                        </div>
                        <button
                          className="action-button view-button"
                          onClick={() =>
                            navigateTo("decision-view", {
                              decision_id: d.decision_id }
                            )
                          }
                        >
                          Open Discussion
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!none(results.teams) && (
              <section className="dash-card" style={{ marginBottom: "20px" }}>
                <h4 className="dash-side-title">
                  Teams ({results.teams.length})
                </h4>
                <div className="team-card-grid">
                  {results.teams.map((t) => (
                    <div className="team-card" key={t.team_id}>
                      <div className="team-card-head">
                        <div className="team-card-icon">&#128101;</div>
                        <div>
                          <div className="team-card-name">{t.team_name}</div>
                          <div className="team-card-count">
                            {t.member_count} member(s)
                          </div>
                        </div>
                      </div>
                      <p className="team-card-desc">
                        {t.description || "No description provided."}
                      </p>
                      <button
                        className="action-button view-button"
                        onClick={() =>
                          navigateTo("team-view", { team_id: t.team_id })
                        }
                      >
                        View Team
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!none(results.people) && (
              <section className="dash-card" style={{ marginBottom: "20px" }}>
                <h4 className="dash-side-title">
                  People ({results.people.length})
                </h4>
                <div className="dash-table-wrap">
                  <table className="dash-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Team</th></tr>
                    </thead>
                    <tbody>
                      {results.people.map((p) => (
                        <tr key={p.user_id}>
                          <td className="dash-td-title">{p.name}</td>
                          <td>{p.email}</td>
                          <td>{p.role_name || "\u2014"}</td>
                          <td>{p.team_name || "\u2014"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {!none(results.knowledge) && (
              <section className="dash-card" style={{ marginBottom: "20px" }}>
                <h4 className="dash-side-title">
                  Knowledge Articles ({results.knowledge.length})
                </h4>
                <div className="article-grid">
                  {results.knowledge.map((a) => (
                    <div className="article-card" key={a.article_id}>
                      <div className="article-cat">{a.category}</div>
                      <div className="article-title">{a.title}</div>
                      <div className="article-content">
                        {(a.content || "").slice(0, 220)}
                        {(a.content || "").length > 220 ? "\u2026" : ""}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {!none(results.categories) && (
              <section className="dash-card" style={{ marginBottom: "20px" }}>
                <h4 className="dash-side-title">
                  Categories ({results.categories.length})
                </h4>
                <div className="topic-grid">
                  {results.categories.map((c) => (
                    <div className="topic-card" key={c.category_id}>
                      <div className="topic-icon">&#127919;</div>
                      <div className="topic-name">{c.category_name}</div>
                      <div className="topic-count">
                        {c.decision_count} decision(s)
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {none(results.decisions) &&
              none(results.documents) &&
              none(results.discussions) &&
              none(results.teams) &&
              none(results.people) &&
              none(results.knowledge) &&
              none(results.categories) && (
                <div className="dash-card">
                  <div className="dash-empty-row">
                    No results found for "{results.query}".
                  </div>
                </div>
              )}
          </>
        )}
      </main>
    </div>
  );
};

export {
  KnowledgeRepositoryPage,
  DiscussionsPage,
  SearchPage
};