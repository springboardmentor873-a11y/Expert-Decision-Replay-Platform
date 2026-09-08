import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Upload,
  FileText,
  FileSpreadsheet,
  FileCode,
  Users,
  Clock,
  Search,
  ChevronDown,
  LayoutList,
  LayoutGrid,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  BarChart2,
  Bookmark,
  ArrowUpRight,
  MessageSquare,
  CheckCircle,
  Download,
  X,
  ExternalLink,
  Tag
} from "lucide-react";
import KnowledgeGraphWidget from "./KnowledgeGraphWidget";
import UploadModal from "./UploadModal";

function KnowledgeRepository({ user, onNavigate, apiBase = "http://127.0.0.1:8000" }) {
  const [activeTab, setActiveTab] = useState("Documents");
  const [stats, setStats] = useState({
    total_documents: 128,
    decision_documents: 36,
    teams_contributed: 24,
    recently_added: 12,
  });
  const [documents, setDocuments] = useState([]);
  const [decisions, setDecisions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [popularTopics, setPopularTopics] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [insights, setInsights] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("All Teams");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedTag, setSelectedTag] = useState("All Tags");
  const [sortBy, setSortBy] = useState("Latest");
  const [viewMode, setViewMode] = useState("list"); // 'list' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchDocuments();
    fetchDecisions();
    fetchTeams();
    fetchPopularTopics();
    fetchRecentActivity();
    fetchInsights();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${apiBase}/knowledge-repository/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${apiBase}/documents`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDecisions = async () => {
    try {
      const res = await fetch(`${apiBase}/decisions`);
      if (res.ok) {
        const data = await res.json();
        setDecisions(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTeams = async () => {
    try {
      const res = await fetch(`${apiBase}/teams`);
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPopularTopics = async () => {
    try {
      const res = await fetch(`${apiBase}/knowledge-repository/popular-topics`);
      if (res.ok) {
        const data = await res.json();
        setPopularTopics(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const res = await fetch(`${apiBase}/knowledge-repository/recent-activity`);
      if (res.ok) {
        const data = await res.json();
        setRecentActivity(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await fetch(`${apiBase}/knowledge-repository/insights`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter and Sort Logic
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      !searchQuery ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploader_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTeam =
      selectedTeam === "All Teams" || doc.uploader_team === selectedTeam;

    const matchesType =
      selectedType === "All Types" ||
      doc.file_type.toLowerCase() === selectedType.toLowerCase();

    const matchesTag =
      selectedTag === "All Tags" ||
      (Array.isArray(doc.tags) && doc.tags.includes(selectedTag));

    return matchesSearch && matchesTeam && matchesType && matchesTag;
  });

  const getDocIcon = (fileType) => {
    const ext = fileType?.toLowerCase() || "";
    if (ext === "pdf") {
      return (
        <div style={{ ...styles.docIconBase, backgroundColor: "#fee2e2", color: "#dc2626" }}>
          PDF
        </div>
      );
    }
    if (ext === "docx" || ext === "doc") {
      return (
        <div style={{ ...styles.docIconBase, backgroundColor: "#dbeafe", color: "#2563eb" }}>
          Doc
        </div>
      );
    }
    if (ext === "pptx" || ext === "ppt") {
      return (
        <div style={{ ...styles.docIconBase, backgroundColor: "#ffedd5", color: "#ea580c" }}>
          PPT
        </div>
      );
    }
    return (
      <div style={{ ...styles.docIconBase, backgroundColor: "#f1f5f9", color: "#475569" }}>
        FILE
      </div>
    );
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return "Recently";
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div style={styles.container}>
      {/* Top Main Banner matching reference */}
      <div style={styles.banner}>
        <div style={styles.bannerLeft}>
          <div style={styles.bookIconCircle}>
            <BookOpen size={28} color="#ffffff" />
          </div>
          <div>
            <h1 style={styles.bannerTitle}>Knowledge Repository</h1>
            <p style={styles.bannerSubtitle}>
              A centralized repository of documents, past decisions, discussions and insights to support better decision-making.
            </p>
          </div>
        </div>
        <button style={styles.uploadBtn} onClick={() => setIsUploadOpen(true)}>
          <Upload size={16} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={styles.tabsRow}>
        {["All", "Documents", "Past Decisions", "Topics", "People", "Insights"].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              style={{
                ...styles.tabBtn,
                color: isActive ? "#2563eb" : "#64748b",
                borderBottom: isActive ? "2px solid #2563eb" : "2px solid transparent",
                fontWeight: isActive ? "600" : "500",
              }}
              onClick={() => {
                setActiveTab(tab);
                if (tab === "Past Decisions" && onNavigate) {
                  onNavigate("My Decisions");
                }
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Metric Cards Row */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{ ...styles.statIconCircle, backgroundColor: "#eff6ff" }}>
            <FileText size={22} color="#2563eb" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.total_documents}</div>
            <div style={styles.statLabel}>Total Documents</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconCircle, backgroundColor: "#ecfdf5" }}>
            <CheckCircle size={22} color="#10b981" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.decision_documents}</div>
            <div style={styles.statLabel}>Decision Documents</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconCircle, backgroundColor: "#f5f3ff" }}>
            <Users size={22} color="#8b5cf6" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.teams_contributed}</div>
            <div style={styles.statLabel}>Teams Contributed</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconCircle, backgroundColor: "#ede9fe" }}>
            <Clock size={22} color="#7c3aed" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.recently_added}</div>
            <div style={styles.statLabel}>Recently Added</div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: Left Documents List, Right Graph & Insights */}
      <div style={styles.mainGrid}>
        {/* Left Column: Documents Directory */}
        <div style={styles.leftCol}>
          <div style={styles.docListCard}>
            <div style={styles.docListHeader}>
              <div>
                <h2 style={styles.docListTitle}>Documents</h2>
                <p style={styles.docListSubtitle}>Browse and search all documents in the knowledge repository.</p>
              </div>
              <div style={styles.sortToggleRow}>
                <div style={styles.sortDropdown}>
                  <span style={{ fontSize: "13px", color: "#64748b" }}>Sort by:</span>
                  <select
                    style={styles.sortSelect}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="Latest">Latest</option>
                    <option value="Oldest">Oldest</option>
                    <option value="Title">Title (A-Z)</option>
                  </select>
                </div>
                <div style={styles.viewToggleGroup}>
                  <button
                    style={{
                      ...styles.toggleBtn,
                      backgroundColor: viewMode === "list" ? "#2563eb" : "#f1f5f9",
                      color: viewMode === "list" ? "#ffffff" : "#64748b",
                    }}
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList size={15} />
                  </button>
                  <button
                    style={{
                      ...styles.toggleBtn,
                      backgroundColor: viewMode === "grid" ? "#2563eb" : "#f1f5f9",
                      color: viewMode === "grid" ? "#ffffff" : "#64748b",
                    }}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div style={styles.filterToolbar}>
              <div style={styles.searchWrap}>
                <Search size={15} color="#94a3b8" style={{ marginLeft: "10px" }} />
                <input
                  type="text"
                  style={styles.searchInput}
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                style={styles.filterSelect}
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="All Teams">All Teams</option>
                <option value="AI Team">AI Team</option>
                <option value="Architecture">Architecture</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Security & Compliance">Security & Compliance</option>
              </select>

              <select
                style={styles.filterSelect}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="All Types">All Types</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
                <option value="pptx">PPTX</option>
              </select>

              <select
                style={styles.filterSelect}
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
              >
                <option value="All Tags">All Tags</option>
                <option value="AI">AI</option>
                <option value="Evaluation">Evaluation</option>
                <option value="Database">Database</option>
                <option value="Architecture">Architecture</option>
                <option value="Cloud">Cloud</option>
                <option value="Security">Security</option>
                <option value="Compliance">Compliance</option>
              </select>
            </div>

            {/* Document Items List / Grid */}
            {filteredDocuments.length === 0 ? (
              <div style={styles.emptyContainer}>
                <FileText size={40} color="#cbd5e1" />
                <p style={{ marginTop: "12px", color: "#64748b" }}>No matching documents found.</p>
              </div>
            ) : viewMode === "list" ? (
              <div style={styles.itemsList}>
                {filteredDocuments.map((doc) => {
                  const tags = Array.isArray(doc.tags) ? doc.tags : [];
                  return (
                    <div key={doc.id} style={styles.docRow}>
                      <div style={styles.docRowLeft}>
                        {getDocIcon(doc.file_type)}
                        <div>
                          <div style={styles.docItemTitle}>{doc.title}</div>
                          <div style={styles.docItemMeta}>
                            Uploaded by {doc.uploader_name} &bull; {formatDate(doc.created_at)}
                          </div>
                        </div>
                      </div>

                      <div style={styles.docRowRight}>
                        <div style={styles.tagPillsGroup}>
                          {tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                ...styles.tagPill,
                                backgroundColor:
                                  tag === "AI"
                                    ? "#dbeafe"
                                    : tag === "Database"
                                    ? "#e0e7ff"
                                    : tag === "Security"
                                    ? "#fee2e2"
                                    : "#f3e8ff",
                                color:
                                  tag === "AI"
                                    ? "#1d4ed8"
                                    : tag === "Database"
                                    ? "#4338ca"
                                    : tag === "Security"
                                    ? "#b91c1c"
                                    : "#7e22ce",
                              }}
                              onClick={() => setSelectedTag(tag)}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        <button style={styles.viewDocBtn} onClick={() => setPreviewDoc(doc)}>
                          View
                        </button>

                        <button
                          style={styles.actionMenuBtn}
                          onClick={() => setPreviewDoc(doc)}
                          title="Actions"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.itemsGrid}>
                {filteredDocuments.map((doc) => (
                  <div key={doc.id} style={styles.gridCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      {getDocIcon(doc.file_type)}
                      <button style={styles.actionMenuBtn} onClick={() => setPreviewDoc(doc)}>
                        <MoreVertical size={16} />
                      </button>
                    </div>
                    <div style={styles.gridTitle}>{doc.title}</div>
                    <div style={styles.docItemMeta}>
                      Uploaded by {doc.uploader_name} &bull; {formatDate(doc.created_at)}
                    </div>
                    <div style={{ marginTop: "auto", paddingTop: "12px" }}>
                      <button style={styles.viewDocBtnFull} onClick={() => setPreviewDoc(doc)}>
                        View Document
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination footer */}
            <div style={styles.paginationRow}>
              <div style={styles.paginationText}>
                Showing 1-{Math.min(filteredDocuments.length, 5)} of {stats.total_documents} documents
              </div>
              <div style={styles.paginationControls}>
                <button style={styles.pageArrow} disabled>
                  <ChevronLeft size={16} />
                </button>
                <button style={{ ...styles.pageNum, ...styles.pageNumActive }}>1</button>
                <button style={styles.pageNum}>2</button>
                <button style={styles.pageNum}>3</button>
                <button style={styles.pageNum}>4</button>
                <button style={styles.pageNum}>5</button>
                <button style={styles.pageArrow}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Knowledge Graph & Insights */}
        <div style={styles.rightCol}>
          {/* Knowledge Graph Card */}
          <KnowledgeGraphWidget
            onNodeClick={(node) => {
              if (node.type === "document") {
                const matched = documents.find((d) => d.title.includes("AI Model"));
                if (matched) setPreviewDoc(matched);
              } else if (node.type === "decision" && onNavigate) {
                onNavigate("My Decisions");
              }
            }}
          />

          {/* Related Insights Card */}
          <div style={styles.insightsCard}>
            <div style={styles.insightsHeader}>
              <h3 style={styles.insightsTitle}>Related Insights</h3>
              <button style={styles.viewAllBtn} onClick={() => setActiveTab("Insights")}>
                <span>View all</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div style={styles.insightItem}>
              <div style={{ ...styles.insightIcon, backgroundColor: "#eff6ff", color: "#2563eb" }}>
                <Lightbulb size={17} />
              </div>
              <div>
                <div style={styles.insightItemTitle}>Similar Decision Found</div>
                <div style={styles.insightItemText}>
                  3 previous decisions on AI model selection were approved.
                </div>
              </div>
            </div>

            <div style={styles.insightItem}>
              <div style={{ ...styles.insightIcon, backgroundColor: "#ecfdf5", color: "#10b981" }}>
                <BarChart2 size={17} />
              </div>
              <div>
                <div style={styles.insightItemTitle}>Common Factors</div>
                <div style={styles.insightItemText}>
                  Performance and scalability were key factors in past decisions.
                </div>
              </div>
            </div>

            <div style={styles.insightItem}>
              <div style={{ ...styles.insightIcon, backgroundColor: "#fef3c7", color: "#d97706" }}>
                <Bookmark size={17} />
              </div>
              <div>
                <div style={styles.insightItemTitle}>Recommended Reading</div>
                <div style={styles.insightItemText}>
                  Check the AI Model Evaluation Report for detailed analysis.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Popular Topics & Recent Activity */}
      <div style={styles.bottomGrid}>
        {/* Popular Topics */}
        <div style={styles.bottomCard}>
          <div style={styles.insightsHeader}>
            <h3 style={styles.insightsTitle}>Popular Topics</h3>
            <button style={styles.viewAllBtn}>
              <span>View all</span>
              <ChevronRight size={13} />
            </button>
          </div>
          <div style={styles.popularTagsContainer}>
            {popularTopics.map((topic, i) => (
              <span
                key={i}
                style={{
                  ...styles.popularTagPill,
                  backgroundColor:
                    selectedTag === topic.name ? "#2563eb" : "#f1f5f9",
                  color: selectedTag === topic.name ? "#ffffff" : "#334155",
                }}
                onClick={() =>
                  setSelectedTag(selectedTag === topic.name ? "All Tags" : topic.name)
                }
              >
                {topic.name}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div style={styles.bottomCard}>
          <div style={styles.insightsHeader}>
            <h3 style={styles.insightsTitle}>Recent Activity</h3>
            <button style={styles.viewAllBtn}>
              <span>View all</span>
              <ChevronRight size={13} />
            </button>
          </div>
          <div style={styles.activityFeed}>
            {recentActivity.map((act) => (
              <div key={act.id} style={styles.activityItem}>
                <div style={styles.activityAvatar}>
                  {act.type === "upload" && <Upload size={14} color="#2563eb" />}
                  {act.type === "comment" && <MessageSquare size={14} color="#059669" />}
                  {act.type === "approval" && <CheckCircle size={14} color="#7c3aed" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.activityText}>
                    <strong>{act.user_name}</strong> {act.action}{" "}
                    <span style={styles.activityHighlight}>{act.target}</span>
                  </div>
                </div>
                <span style={styles.activityTime}>{act.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document Preview & Details Modal */}
      {previewDoc && (
        <div style={styles.modalBackdrop}>
          <div style={styles.previewModal} className="animate-fade-in">
            <div style={styles.previewHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {getDocIcon(previewDoc.file_type)}
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", color: "#0f172a" }}>{previewDoc.title}</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#64748b" }}>
                    {previewDoc.category} &bull; Uploaded by {previewDoc.uploader_name} on {formatDate(previewDoc.created_at)}
                  </p>
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setPreviewDoc(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.previewBody}>
              <div style={styles.previewSection}>
                <h4 style={styles.previewSectionTitle}>Description & Executive Summary</h4>
                <p style={styles.previewSectionContent}>
                  {previewDoc.description || "Comprehensive technical analysis and decision criteria documentation."}
                </p>
              </div>

              {previewDoc.decision_title && (
                <div style={styles.previewSection}>
                  <h4 style={styles.previewSectionTitle}>Linked Decision</h4>
                  <div style={styles.linkedDecisionBox}>
                    <span>{previewDoc.decision_title}</span>
                    <button
                      style={styles.openDecisionBtn}
                      onClick={() => {
                        setPreviewDoc(null);
                        if (onNavigate) onNavigate("My Decisions");
                      }}
                    >
                      <span>Open Decision Replay</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              )}

              <div style={styles.previewSection}>
                <h4 style={styles.previewSectionTitle}>Tags & Classifications</h4>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(Array.isArray(previewDoc.tags) ? previewDoc.tags : []).map((t, idx) => (
                    <span key={idx} style={styles.tagPill}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div style={styles.previewMetaGrid}>
                <div>
                  <span style={styles.metaLabel}>File Size:</span>
                  <span style={styles.metaValue}>
                    {previewDoc.file_size ? `${(previewDoc.file_size / 1024).toFixed(1)} KB` : "1.2 MB"}
                  </span>
                </div>
                <div>
                  <span style={styles.metaLabel}>File Format:</span>
                  <span style={styles.metaValue}>{previewDoc.file_type?.toUpperCase()}</span>
                </div>
                <div>
                  <span style={styles.metaLabel}>Contributor Team:</span>
                  <span style={styles.metaValue}>{previewDoc.uploader_team || "AI Team"}</span>
                </div>
              </div>
            </div>

            <div style={styles.previewFooter}>
              <button style={styles.cancelBtn} onClick={() => setPreviewDoc(null)}>
                Close
              </button>
              <a
                href={`${apiBase}/documents/${previewDoc.id}/download`}
                target="_blank"
                rel="noreferrer"
                style={styles.downloadLink}
              >
                <Download size={15} />
                <span>Download Document</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => {
          fetchDocuments();
          fetchStats();
        }}
        decisions={decisions}
        apiBase={apiBase}
      />
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  banner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
  },
  bannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  bookIconCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "12px",
    backgroundColor: "#1e3a8a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(30, 58, 138, 0.2)",
  },
  bannerTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-0.5px",
  },
  bannerSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    margin: "4px 0 0 0",
  },
  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 20px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(37, 99, 235, 0.3)",
    transition: "background-color 0.15s ease",
  },
  tabsRow: {
    display: "flex",
    gap: "24px",
    borderBottom: "1px solid #e2e8f0",
  },
  tabBtn: {
    background: "none",
    border: "none",
    padding: "12px 2px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    padding: "18px 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
  },
  statIconCircle: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statVal: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "2px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "24px",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  docListCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  docListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
    flexWrap: "wrap",
    gap: "12px",
  },
  docListTitle: {
    fontSize: "18px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  docListSubtitle: {
    fontSize: "13px",
    color: "#64748b",
    margin: "3px 0 0 0",
  },
  sortToggleRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  sortDropdown: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  sortSelect: {
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    padding: "5px 10px",
    fontSize: "13px",
    color: "#334155",
    backgroundColor: "#ffffff",
    cursor: "pointer",
  },
  viewToggleGroup: {
    display: "flex",
    borderRadius: "6px",
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  toggleBtn: {
    border: "none",
    padding: "6px 8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  filterToolbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  searchWrap: {
    flex: 1,
    minWidth: "200px",
    display: "flex",
    alignItems: "center",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
  },
  searchInput: {
    border: "none",
    outline: "none",
    padding: "9px 12px",
    fontSize: "13px",
    width: "100%",
    backgroundColor: "transparent",
  },
  filterSelect: {
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    padding: "9px 12px",
    fontSize: "13px",
    color: "#334155",
    backgroundColor: "#ffffff",
    cursor: "pointer",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
  },
  docRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 0",
    borderBottom: "1px solid #f1f5f9",
    flexWrap: "wrap",
    gap: "12px",
  },
  docRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
    minWidth: "260px",
  },
  docIconBase: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    flexShrink: 0,
  },
  docItemTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
    lineHeight: 1.3,
  },
  docItemMeta: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
  },
  docRowRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  tagPillsGroup: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
  },
  tagPill: {
    padding: "3px 9px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    backgroundColor: "#eff6ff",
    color: "#2563eb",
  },
  viewDocBtn: {
    padding: "6px 14px",
    backgroundColor: "#ffffff",
    color: "#2563eb",
    border: "1px solid #bfdbfe",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  actionMenuBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
    borderRadius: "4px",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  gridCard: {
    borderRadius: "10px",
    border: "1px solid #e2e8f0",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  gridTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#0f172a",
  },
  viewDocBtnFull: {
    width: "100%",
    padding: "8px",
    backgroundColor: "#f8fafc",
    color: "#2563eb",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  paginationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "16px",
    borderTop: "1px solid #f1f5f9",
    marginTop: "8px",
    flexWrap: "wrap",
    gap: "12px",
  },
  paginationText: {
    fontSize: "13px",
    color: "#64748b",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  pageArrow: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#64748b",
    cursor: "pointer",
  },
  pageNum: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "6px",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    color: "#334155",
    cursor: "pointer",
  },
  pageNumActive: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderColor: "#2563eb",
    fontWeight: "600",
  },
  insightsCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "18px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  insightsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightsTitle: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#0f172a",
    margin: 0,
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "2px",
  },
  insightItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  insightIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  insightItemTitle: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  insightItemText: {
    fontSize: "12px",
    color: "#64748b",
    marginTop: "2px",
    lineHeight: 1.4,
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },
  bottomCard: {
    backgroundColor: "#ffffff",
    borderRadius: "14px",
    border: "1px solid #e2e8f0",
    padding: "18px 20px",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  },
  popularTagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "14px",
  },
  popularTagPill: {
    padding: "6px 12px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  activityFeed: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "14px",
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  activityAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    backgroundColor: "#f1f5f9",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  activityText: {
    fontSize: "13px",
    color: "#334155",
    lineHeight: 1.3,
  },
  activityHighlight: {
    color: "#2563eb",
    fontWeight: "500",
  },
  activityTime: {
    fontSize: "11px",
    color: "#94a3b8",
    whiteSpace: "nowrap",
  },
  emptyContainer: {
    padding: "40px",
    textAlign: "center",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  previewModal: {
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "600px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 24px",
    borderBottom: "1px solid #f1f5f9",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#94a3b8",
    padding: "4px",
    display: "flex",
  },
  previewBody: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  previewSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  previewSectionTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: 0,
  },
  previewSectionContent: {
    fontSize: "14px",
    color: "#334155",
    lineHeight: 1.5,
    margin: 0,
  },
  linkedDecisionBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 14px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  openDecisionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "none",
    border: "none",
    color: "#2563eb",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  previewMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  metaLabel: {
    display: "block",
    fontSize: "11px",
    color: "#64748b",
  },
  metaValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#0f172a",
  },
  previewFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 24px",
    backgroundColor: "#f8fafc",
    borderTop: "1px solid #f1f5f9",
  },
  cancelBtn: {
    padding: "8px 16px",
    backgroundColor: "#ffffff",
    color: "#475569",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
  },
  downloadLink: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 18px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    textDecoration: "none",
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
  },
};

export default KnowledgeRepository;
