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
        <div style={{ ...styles.docIconBase, backgroundColor: "rgba(244, 63, 94, 0.15)", color: "#FB7185", border: "1px solid rgba(244, 63, 94, 0.3)" }}>
          PDF
        </div>
      );
    }
    if (ext === "docx" || ext === "doc") {
      return (
        <div style={{ ...styles.docIconBase, backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#818CF8", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
          Doc
        </div>
      );
    }
    if (ext === "pptx" || ext === "ppt") {
      return (
        <div style={{ ...styles.docIconBase, backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
          PPT
        </div>
      );
    }
    return (
      <div style={{ ...styles.docIconBase, backgroundColor: "rgba(255, 255, 255, 0.08)", color: "#94A3B8", border: "1px solid var(--border-subtle)" }}>
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
      {/* Top Main Banner matching Obsidian Dark */}
      <div style={styles.banner}>
        <div style={styles.bannerLeft}>
          <div style={styles.bookIconCircle}>
            <BookOpen size={24} color="var(--primary)" />
          </div>
          <div>
            <h1 style={styles.bannerTitle}>Knowledge Repository</h1>
            <p style={styles.bannerSubtitle}>
              A centralized repository of documents, past decisions, discussions and insights to support better decision-making.
            </p>
          </div>
        </div>
        <button style={styles.uploadBtn} onClick={() => setIsUploadOpen(true)}>
          <Upload size={17} />
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
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
                borderBottom: isActive ? "3px solid var(--primary)" : "3px solid transparent",
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
          <div style={{ ...styles.statIconCircle, backgroundColor: "var(--primary-container)" }}>
            <FileText size={22} color="var(--primary)" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.total_documents}</div>
            <div style={styles.statLabel}>Total Documents</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconCircle, backgroundColor: "rgba(22, 163, 74, 0.12)" }}>
            <CheckCircle size={22} color="var(--accent-emerald)" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.decision_documents}</div>
            <div style={styles.statLabel}>Decision Documents</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconCircle, backgroundColor: "var(--secondary-container)" }}>
            <Users size={22} color="var(--secondary)" />
          </div>
          <div>
            <div style={styles.statVal}>{stats.teams_contributed}</div>
            <div style={styles.statLabel}>Teams Contributed</div>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{ ...styles.statIconCircle, backgroundColor: "rgba(217, 119, 6, 0.12)" }}>
            <Clock size={22} color="var(--accent-amber)" />
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
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Sort by:</span>
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
                      backgroundColor: viewMode === "list" ? "var(--secondary-container)" : "transparent",
                      color: viewMode === "list" ? "var(--on-secondary-container)" : "var(--text-secondary)",
                    }}
                    onClick={() => setViewMode("list")}
                  >
                    <LayoutList size={16} />
                  </button>
                  <button
                    style={{
                      ...styles.toggleBtn,
                      backgroundColor: viewMode === "grid" ? "var(--secondary-container)" : "transparent",
                      color: viewMode === "grid" ? "var(--on-secondary-container)" : "var(--text-secondary)",
                    }}
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div style={styles.filterToolbar}>
              <div style={styles.searchWrap}>
                <Search size={15} color="var(--text-muted)" style={{ marginLeft: "10px" }} />
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
                <FileText size={40} color="var(--border-muted)" />
                <p style={{ marginTop: "12px", color: "var(--text-secondary)" }}>No matching documents found.</p>
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
                                    ? "rgba(99, 102, 241, 0.15)"
                                    : tag === "Database"
                                    ? "rgba(6, 182, 212, 0.15)"
                                    : tag === "Security"
                                    ? "rgba(244, 63, 94, 0.15)"
                                    : "rgba(16, 185, 129, 0.15)",
                                border:
                                  tag === "AI"
                                    ? "1px solid rgba(99, 102, 241, 0.3)"
                                    : tag === "Database"
                                    ? "1px solid rgba(6, 182, 212, 0.3)"
                                    : tag === "Security"
                                    ? "1px solid rgba(244, 63, 94, 0.3)"
                                    : "1px solid rgba(16, 185, 129, 0.3)",
                                color:
                                  tag === "AI"
                                    ? "#A5B4FC"
                                    : tag === "Database"
                                    ? "#67E8F9"
                                    : tag === "Security"
                                    ? "#FDA4AF"
                                    : "#6EE7B7",
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
              <div style={{ ...styles.insightIcon, backgroundColor: "rgba(99, 102, 241, 0.15)", color: "#818CF8", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
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
              <div style={{ ...styles.insightIcon, backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34D399", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
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
              <div style={{ ...styles.insightIcon, backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#FBBF24", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
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
                    selectedTag === topic.name ? "var(--primary)" : "var(--bg-surface-container)",
                  color: selectedTag === topic.name ? "var(--on-primary)" : "var(--text-secondary)",
                  border: selectedTag === topic.name ? "1px solid var(--primary)" : "1px solid var(--border-subtle)",
                  boxShadow: selectedTag === topic.name ? "0 2px 8px rgba(103, 80, 164, 0.28)" : "none",
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
                  {act.type === "upload" && <Upload size={14} color="#818CF8" />}
                  {act.type === "comment" && <MessageSquare size={14} color="#34D399" />}
                  {act.type === "approval" && <CheckCircle size={14} color="#A78BFA" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.activityText}>
                    <strong style={{ color: "var(--text-primary)" }}>{act.user_name}</strong> {act.action}{" "}
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
                  <h3 style={{ margin: 0, fontSize: "17px", color: "var(--text-primary)" }}>{previewDoc.title}</h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--text-secondary)" }}>
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
    gap: "28px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  banner: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    backgroundColor: "var(--bg-surface-container)",
    padding: "28px 32px",
    borderRadius: "var(--radius-2xl)",
    boxShadow: "var(--shadow-sm)",
  },
  bannerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },
  bookIconCircle: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    backgroundColor: "var(--primary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "var(--shadow-sm)",
  },
  bannerTitle: {
    fontSize: "26px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
    letterSpacing: "-0.3px",
  },
  bannerSubtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: "4px 0 0 0",
    lineHeight: 1.5,
  },
  uploadBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 22px",
    backgroundColor: "var(--primary)",
    color: "var(--on-primary)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "var(--shadow-sm)",
    transition: "all var(--md3-duration-short) var(--md3-easing)",
    fontFamily: "var(--font-sans)",
  },
  tabsRow: {
    display: "flex",
    gap: "24px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  tabBtn: {
    background: "none",
    border: "none",
    padding: "12px 4px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all var(--md3-duration-short) var(--md3-easing)",
    fontFamily: "var(--font-sans)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "18px",
  },
  statCard: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    padding: "20px 22px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "var(--shadow-card)",
    transition: "all var(--md3-duration-normal) var(--md3-easing)",
  },
  statIconCircle: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statVal: {
    fontSize: "26px",
    fontWeight: "700",
    color: "var(--text-primary)",
    letterSpacing: "-0.4px",
  },
  statLabel: {
    fontSize: "13px",
    color: "var(--text-secondary)",
    marginTop: "2px",
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 390px",
    gap: "26px",
  },
  leftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },
  rightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
  },
  docListCard: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    padding: "26px",
    boxShadow: "var(--shadow-card)",
  },
  docListHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
    flexWrap: "wrap",
    gap: "12px",
  },
  docListTitle: {
    fontSize: "19px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
  },
  docListSubtitle: {
    fontSize: "13.5px",
    color: "var(--text-secondary)",
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
    gap: "8px",
  },
  sortSelect: {
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    padding: "7px 16px",
    fontSize: "13px",
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-surface-container-high)",
    cursor: "pointer",
    outline: "none",
  },
  viewToggleGroup: {
    display: "flex",
    borderRadius: "var(--radius-full)",
    overflow: "hidden",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface-container-high)",
  },
  toggleBtn: {
    border: "none",
    padding: "7px 12px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background-color 0.15s ease",
  },
  filterToolbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    flexWrap: "wrap",
  },
  searchWrap: {
    flex: 1,
    minWidth: "220px",
    display: "flex",
    alignItems: "center",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    backgroundColor: "var(--bg-surface-container-high)",
    padding: "0 14px",
  },
  searchInput: {
    border: "none",
    outline: "none",
    padding: "9px 8px",
    fontSize: "14px",
    width: "100%",
    backgroundColor: "transparent",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
  },
  filterSelect: {
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-full)",
    padding: "8px 16px",
    fontSize: "13px",
    color: "var(--text-primary)",
    backgroundColor: "var(--bg-surface-container-high)",
    cursor: "pointer",
    outline: "none",
  },
  itemsList: {
    display: "flex",
    flexDirection: "column",
  },
  docRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 0",
    borderBottom: "1px solid var(--border-subtle)",
    flexWrap: "wrap",
    gap: "14px",
  },
  docRowLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
    minWidth: "260px",
  },
  docIconBase: {
    width: "38px",
    height: "38px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    flexShrink: 0,
  },
  docItemTitle: {
    fontSize: "14.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
    lineHeight: 1.3,
  },
  docItemMeta: {
    fontSize: "12.5px",
    color: "var(--text-secondary)",
    marginTop: "3px",
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
    padding: "3px 10px",
    borderRadius: "var(--radius-full)",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "opacity 0.15s ease",
  },
  viewDocBtn: {
    padding: "7px 16px",
    backgroundColor: "var(--primary-container)",
    color: "var(--on-primary-container)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all var(--md3-duration-short) var(--md3-easing)",
  },
  actionMenuBtn: {
    background: "none",
    border: "none",
    color: "var(--text-secondary)",
    padding: "6px",
    cursor: "pointer",
    display: "flex",
    borderRadius: "var(--radius-full)",
  },
  itemsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
    gap: "16px",
  },
  gridCard: {
    borderRadius: "var(--radius-md)",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-surface-container-low)",
    padding: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    boxShadow: "var(--shadow-sm)",
  },
  gridTitle: {
    fontSize: "14.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  viewDocBtnFull: {
    width: "100%",
    padding: "9px",
    backgroundColor: "var(--primary-container)",
    color: "var(--on-primary-container)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  paginationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: "18px",
    borderTop: "1px solid var(--border-subtle)",
    marginTop: "10px",
    flexWrap: "wrap",
    gap: "12px",
  },
  paginationText: {
    fontSize: "13px",
    color: "var(--text-secondary)",
  },
  paginationControls: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  pageArrow: {
    background: "var(--bg-surface-container-high)",
    border: "none",
    borderRadius: "var(--radius-full)",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  pageNum: {
    background: "var(--bg-surface-container-high)",
    border: "none",
    borderRadius: "var(--radius-full)",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    color: "var(--text-secondary)",
    cursor: "pointer",
  },
  pageNumActive: {
    backgroundColor: "var(--primary)",
    color: "var(--on-primary)",
    fontWeight: "700",
  },
  insightsCard: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    padding: "22px",
    boxShadow: "var(--shadow-card)",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  insightsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  insightsTitle: {
    fontSize: "16px",
    fontWeight: "600",
    color: "var(--text-primary)",
    margin: 0,
  },
  viewAllBtn: {
    background: "none",
    border: "none",
    color: "var(--primary)",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  insightItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  insightIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  insightItemTitle: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  insightItemText: {
    fontSize: "12.5px",
    color: "var(--text-secondary)",
    marginTop: "2px",
    lineHeight: 1.4,
  },
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "26px",
  },
  bottomCard: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-lg)",
    border: "1px solid var(--border-subtle)",
    padding: "22px",
    boxShadow: "var(--shadow-card)",
  },
  popularTagsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "16px",
  },
  popularTagPill: {
    padding: "6px 14px",
    borderRadius: "var(--radius-full)",
    fontSize: "12.5px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  activityFeed: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "16px",
  },
  activityItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  activityAvatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--secondary-container)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  activityText: {
    fontSize: "13.5px",
    color: "var(--text-secondary)",
    lineHeight: 1.4,
  },
  activityHighlight: {
    color: "var(--primary)",
    fontWeight: "600",
  },
  activityTime: {
    fontSize: "11.5px",
    color: "var(--text-muted)",
    whiteSpace: "nowrap",
  },
  emptyContainer: {
    padding: "44px",
    textAlign: "center",
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(28, 27, 31, 0.5)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  previewModal: {
    backgroundColor: "var(--bg-surface)",
    borderRadius: "var(--radius-xl)",
    width: "100%",
    maxWidth: "620px",
    boxShadow: "var(--shadow-xl)",
    border: "1px solid var(--border-subtle)",
    overflow: "hidden",
  },
  previewHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 26px",
    borderBottom: "1px solid var(--border-subtle)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    padding: "6px",
    borderRadius: "var(--radius-full)",
    display: "flex",
  },
  previewBody: {
    padding: "26px",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  previewSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  previewSectionTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: 0,
  },
  previewSectionContent: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    margin: 0,
  },
  linkedDecisionBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "var(--bg-surface-container)",
    borderRadius: "var(--radius-md)",
    fontSize: "13.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  openDecisionBtn: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "none",
    border: "none",
    color: "var(--primary)",
    fontSize: "12.5px",
    fontWeight: "600",
    cursor: "pointer",
  },
  previewMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "14px",
    padding: "14px",
    backgroundColor: "var(--bg-surface-container)",
    borderRadius: "var(--radius-md)",
  },
  metaLabel: {
    display: "block",
    fontSize: "11.5px",
    color: "var(--text-muted)",
  },
  metaValue: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  previewFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "18px 26px",
    backgroundColor: "var(--bg-surface-container-low)",
    borderTop: "1px solid var(--border-subtle)",
  },
  cancelBtn: {
    padding: "9px 20px",
    backgroundColor: "var(--bg-surface-container-high)",
    color: "var(--text-primary)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontWeight: "600",
    fontSize: "13.5px",
    cursor: "pointer",
  },
  downloadLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "9px 22px",
    backgroundColor: "var(--primary)",
    color: "var(--on-primary)",
    border: "none",
    borderRadius: "var(--radius-full)",
    fontWeight: "600",
    fontSize: "13.5px",
    textDecoration: "none",
    boxShadow: "var(--shadow-sm)",
  },
};

export default KnowledgeRepository;
