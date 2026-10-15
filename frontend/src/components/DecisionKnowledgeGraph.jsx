import React, { useMemo, useState } from "react";

/* =========================================================
   COLORS
========================================================= */

const COLORS = {
  blue: "#2563eb",
  blueLight: "#eff6ff",

  green: "#16a34a",
  greenLight: "#f0fdf4",

  purple: "#7c3aed",
  purpleLight: "#f5f3ff",

  orange: "#ea580c",
  orangeLight: "#fff7ed",

  red: "#dc2626",
  redLight: "#fef2f2",

  slate: "#475569",
  border: "#cbd5e1",
 line: "#475569",
};

/* =========================================================
   HELPERS
========================================================= */

function getPersonName(person) {
  if (!person) return "Unknown";

  if (typeof person === "string") {
    return person;
  }

  return person.name || person.email || "Unknown";
}

function shortText(text, length = 100) {
  if (!text) return "Not recorded";

  const value = String(text);

  return value.length <= length
    ? value
    : value.substring(0, length) + "...";
}

/* =========================================================
   GRAPH NODE
========================================================= */

function GraphNode({
  icon,
  title,
  subtitle,
  onClick,
  selected = false,
  color = COLORS.blue,
  background = "#ffffff",
  width = 170,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        width,
        minHeight: 82,
        padding: "12px 14px",
        borderRadius: 15,
        border: `1.5px solid ${
          selected ? color : COLORS.border
        }`,
        background,
        boxShadow: selected
          ? `0 0 0 3px ${color}18, 0 8px 20px rgba(15,23,42,0.10)`
          : "0 5px 14px rgba(15,23,42,0.07)",
        cursor: onClick ? "pointer" : "default",
        textAlign: "center",
        position: "relative",
        zIndex: 5,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          fontSize: 23,
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
          color,
          lineHeight: 1.2,
          wordBreak: "break-word",
        }}
      >
        {title}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: 5,
            fontSize: 11.5,
            color: COLORS.slate,
            lineHeight: 1.35,
            wordBreak: "break-word",
          }}
        >
          {subtitle}
        </div>
      )}
    </button>
  );
}

/* =========================================================
   SVG CONNECTIONS
========================================================= */

function GraphConnections({ connections }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {connections.map((connection, index) => (
        <line
          key={index}
          x1={connection.x1}
          y1={connection.y1}
          x2={connection.x2}
          y2={connection.y2}
          stroke={connection.color || COLORS.line}
          strokeWidth="0.8"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/* =========================================================
   POSITIONED NODE
========================================================= */

function PositionedNode({ x, y, children }) {
  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: 5,
      }}
    >
      {children}
    </div>
  );
}

/* =========================================================
   HEADER
========================================================= */

function GraphHeader({
  subtitle,
  showBack,
  onBack,
  onReset,
}) {
  return (
    <div
      style={{
        height: 78,
        padding: "14px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e2e8f0",
        background: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      <div>
        <div
          style={{
            fontSize: 19,
            fontWeight: 800,
            color: "#0f172a",
          }}
        >
          Decision Knowledge Graph
        </div>

        <div
          style={{
            marginTop: 3,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          {subtitle}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
        }}
      >
        {showBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              border: "1px solid #cbd5e1",
              background: "#ffffff",
              color: "#334155",
              padding: "8px 13px",
              borderRadius: 9,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            ← Back
          </button>
        )}

        <button
          type="button"
          onClick={onReset}
          style={{
            border: "1px solid #cbd5e1",
            background: "#ffffff",
            color: "#334155",
            padding: "8px 13px",
            borderRadius: 9,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

function GraphSidebar({
  title,
  items,
  selectedName,
  onSelect,
}) {
  return (
    <div
      style={{
        width: 215,
        minWidth: 215,
        borderRight: "1px solid #e2e8f0",
        background: "#f8fafc",
        padding: 14,
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          marginBottom: 10,
        }}
      >
        {title}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 7,
        }}
      >
        {items.map((item, index) => {
          const name = item.name || "Untitled";

          const selected = selectedName === name;

          return (
            <button
              type="button"
              key={`${name}-${index}`}
              onClick={() => onSelect(item)}
              style={{
                width: "100%",
                padding: "9px 10px",
                borderRadius: 9,
                border: selected
                  ? "1.5px solid #2563eb"
                  : "1px solid #e2e8f0",
                background: selected
                  ? "#eff6ff"
                  : "#ffffff",
                textAlign: "left",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 750,
                  color: "#1e293b",
                  wordBreak: "break-word",
                }}
              >
                {name}
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 10.5,
                  color: "#64748b",
                }}
              >
                {item.count} decision
                {item.count !== 1 ? "s" : ""}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   RADIAL POSITIONS
========================================================= */

function getRadialPositions(count) {
  if (count === 0) return [];

  if (count === 1) {
    return [{ x: 78, y: 50 }];
  }

  if (count === 2) {
    return [
      { x: 25, y: 28 },
      { x: 75, y: 72 },
    ];
  }

  if (count === 3) {
    return [
      { x: 50, y: 16 },
      { x: 20, y: 70 },
      { x: 80, y: 70 },
    ];
  }

  const positions = [];

  const radiusX = 35;
  const radiusY = 32;

  for (let i = 0; i < count; i++) {
    const angle = -90 + (i / count) * 360;

    const radians = (angle * Math.PI) / 180;

    positions.push({
      x: 50 + Math.cos(radians) * radiusX,
      y: 50 + Math.sin(radians) * radiusY,
    });
  }

  return positions;
}

/* =========================================================
   RADIAL LIST GRAPH
========================================================= */

function RadialListGraph({
  title,
  sidebarTitle,
  items,
  icon,
  color,
  background,
  selectedName,
  onSelect,
  centerSubtitle,
  onBack,
  onReset,
}) {
  const positions = getRadialPositions(items.length);

  const connections = positions.map((position) => ({
    x1: 50,
    y1: 50,
    x2: position.x,
    y2: position.y,
  }));

  return (
    <div
      style={{
        marginTop: 28,
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        overflow: "hidden",
        background: "#ffffff",
      }}
    >
      <GraphHeader
        subtitle={title}
        showBack={true}
        onBack={onBack}
        onReset={onReset}
      />

      <div
        style={{
          height: 560,
          display: "flex",
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <GraphSidebar
          title={sidebarTitle}
          items={items}
          selectedName={selectedName}
          onSelect={onSelect}
        />

        <div
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 50% 50%, #f8fafc 0%, #ffffff 70%)",
          }}
        >
          <GraphConnections
            connections={connections}
          />

          {/* CENTER NODE */}
          <PositionedNode x={50} y={50}>
            <GraphNode
              icon={icon}
              title={title}
              subtitle={centerSubtitle}
              color={color}
              background={background}
              width={185}
            />
          </PositionedNode>

          {/* OUTER NODES */}
          {items.map((item, index) => {
            const position = positions[index];

            return (
              <PositionedNode
                key={`${item.name}-${index}`}
                x={position.x}
                y={position.y}
              >
                <GraphNode
                  icon={icon}
                  title={item.name}
                  subtitle={`${item.count} decision${
                    item.count !== 1 ? "s" : ""
                  }`}
                  onClick={() => onSelect(item)}
                  color={color}
                  background={background}
                  width={165}
                />
              </PositionedNode>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function DecisionKnowledgeGraph({
  allDecisions = [],
}) {
  const [view, setView] = useState("overview");

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [selectedStatus, setSelectedStatus] =
    useState(null);

  const [selectedPerson, setSelectedPerson] =
    useState(null);

  const [selectedDecision, setSelectedDecision] =
    useState(null);

  const decisions = Array.isArray(allDecisions)
    ? allDecisions
    : [];

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categories = useMemo(() => {
    const map = new Map();

    decisions.forEach((decision) => {
      const category = decision.category || "General";

      if (!map.has(category)) {
        map.set(category, []);
      }

      map.get(category).push(decision);
    });

    return Array.from(map.entries()).map(
      ([name, items]) => ({
        name,
        count: items.length,
        decisions: items,
      })
    );
  }, [decisions]);

  /* =======================================================
     STATUSES
  ======================================================= */

  const statuses = useMemo(() => {
    const map = new Map();

    decisions.forEach((decision) => {
      const status = decision.status || "Recorded";

      if (!map.has(status)) {
        map.set(status, []);
      }

      map.get(status).push(decision);
    });

    return Array.from(map.entries()).map(
      ([name, items]) => ({
        name,
        count: items.length,
        decisions: items,
      })
    );
  }, [decisions]);

  /* =======================================================
     PEOPLE
  ======================================================= */

  const people = useMemo(() => {
    const map = new Map();

    decisions.forEach((decision) => {
      const peopleInDecision = [
        decision.createdBy,
        decision.reviewedBy,
        decision.approvedBy,
      ];

      peopleInDecision.forEach((person) => {
        if (!person) return;

        const name = getPersonName(person);

        if (!map.has(name)) {
          map.set(name, []);
        }

        const existing = map.get(name);

        if (
          !existing.some(
            (item) => item._id === decision._id
          )
        ) {
          existing.push(decision);
        }
      });
    });

    return Array.from(map.entries()).map(
      ([name, items]) => ({
        name,
        count: items.length,
        decisions: items,
      })
    );
  }, [decisions]);

  /* =======================================================
     RESET
  ======================================================= */

  const resetGraph = () => {
    setView("overview");

    setSelectedCategory(null);
    setSelectedStatus(null);
    setSelectedPerson(null);
    setSelectedDecision(null);
  };

  /* =======================================================
     BACK
  ======================================================= */

  const goBack = () => {
    if (view === "decision") {
      setSelectedDecision(null);

      if (selectedCategory) {
        setView("categoryDecisions");
      } else if (selectedStatus) {
        setView("statusDecisions");
      } else if (selectedPerson) {
        setView("personDecisions");
      } else {
        setView("decisions");
      }

      return;
    }

    if (view === "categoryDecisions") {
      setSelectedCategory(null);
      setView("categories");
      return;
    }

    if (view === "statusDecisions") {
      setSelectedStatus(null);
      setView("statuses");
      return;
    }

    if (view === "personDecisions") {
      setSelectedPerson(null);
      setView("people");
      return;
    }

    if (
      view === "categories" ||
      view === "statuses" ||
      view === "people" ||
      view === "decisions"
    ) {
      setView("overview");
    }
  };

  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if (decisions.length === 0) {
    return (
      <div
        style={{
          marginTop: 28,
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <GraphHeader
          subtitle="No decisions available"
          showBack={false}
          onReset={resetGraph}
        />

        <div
          style={{
            height: 430,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: 14,
          }}
        >
          No decisions available for the knowledge graph.
        </div>
      </div>
    );
  }

  /* =======================================================
     OVERVIEW
     
     IMPORTANT:
     This is the ORIGINAL 4-NODE layout.
  ======================================================= */

  if (view === "overview") {
    const overviewNodes = [
      {
        key: "categories",
        x: 24,
        y: 25,
        icon: "📁",
        title: "Categories",
        subtitle: `${categories.length} categories`,
        color: COLORS.purple,
        background: COLORS.purpleLight,
        action: () => setView("categories"),
      },

      {
        key: "status",
        x: 76,
        y: 25,
        icon: "📊",
        title: "Status",
        subtitle: `${statuses.length} decision states`,
        color: COLORS.orange,
        background: COLORS.orangeLight,
        action: () => setView("statuses"),
      },

      {
        key: "people",
        x: 24,
        y: 75,
        icon: "👥",
        title: "People",
        subtitle: `${people.length} users involved`,
        color: COLORS.green,
        background: COLORS.greenLight,
        action: () => setView("people"),
      },

      {
        key: "decisions",
        x: 76,
        y: 75,
        icon: "📋",
        title: "All Decisions",
        subtitle: `View ${decisions.length} records`,
        color: COLORS.blue,
        background: COLORS.blueLight,
        action: () => setView("decisions"),
      },
    ];

    const overviewConnections =
      overviewNodes.map((node) => ({
        x1: 50,
        y1: 50,
        x2: node.x,
        y2: node.y,
      }));

    return (
      <div
        style={{
          marginTop: 28,
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <GraphHeader
          subtitle="Explore decisions and their related knowledge."
          showBack={false}
          onReset={resetGraph}
        />

        <div
          style={{
            height: 560,
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 50% 50%, #f8fafc 0%, #ffffff 70%)",
          }}
        >
          {/* CONNECTION LINES */}
          <GraphConnections
            connections={overviewConnections}
          />

          {/* CENTER NODE */}
          <PositionedNode x={50} y={50}>
            <GraphNode
              icon="🧠"
              title="Decision Repository"
              subtitle={`${decisions.length} decisions`}
              color={COLORS.blue}
              background={COLORS.blue}
              width={190}
              selected
            />
          </PositionedNode>

          {/* FOUR ORIGINAL NODES */}
          {overviewNodes.map((node) => (
            <PositionedNode
              key={node.key}
              x={node.x}
              y={node.y}
            >
              <GraphNode
                icon={node.icon}
                title={node.title}
                subtitle={node.subtitle}
                onClick={node.action}
                color={node.color}
                background={node.background}
                width={145}
              />
            </PositionedNode>
          ))}
        </div>
      </div>
    );
  }

  /* =======================================================
     CATEGORIES
  ======================================================= */

  if (view === "categories") {
    return (
      <RadialListGraph
        title="Categories"
        sidebarTitle="Categories"
        items={categories}
        icon="📁"
        color={COLORS.purple}
        background={COLORS.purpleLight}
        selectedName={selectedCategory?.name}
        centerSubtitle={`${categories.length} categories`}
        onBack={goBack}
        onReset={resetGraph}
        onSelect={(item) => {
          setSelectedCategory(item);
          setView("categoryDecisions");
        }}
      />
    );
  }

  /* =======================================================
     STATUS
  ======================================================= */

  if (view === "statuses") {
    return (
      <RadialListGraph
        title="Decision Status"
        sidebarTitle="Statuses"
        items={statuses}
        icon="📊"
        color={COLORS.orange}
        background={COLORS.orangeLight}
        selectedName={selectedStatus?.name}
        centerSubtitle={`${statuses.length} statuses`}
        onBack={goBack}
        onReset={resetGraph}
        onSelect={(item) => {
          setSelectedStatus(item);
          setView("statusDecisions");
        }}
      />
    );
  }

  /* =======================================================
     PEOPLE
  ======================================================= */

  if (view === "people") {
    return (
      <RadialListGraph
        title="People"
        sidebarTitle="People"
        items={people}
        icon="👥"
        color={COLORS.green}
        background={COLORS.greenLight}
        selectedName={selectedPerson?.name}
        centerSubtitle={`${people.length} people`}
        onBack={goBack}
        onReset={resetGraph}
        onSelect={(item) => {
          setSelectedPerson(item);
          setView("personDecisions");
        }}
      />
    );
  }

  /* =======================================================
     ALL DECISIONS
  ======================================================= */

  if (view === "decisions") {
    const decisionItems = decisions.map(
      (decision, index) => ({
        ...decision,

        name:
          decision.title ||
          decision.problemStatement ||
          `Decision ${index + 1}`,

        count: 1,
      })
    );

    return (
      <RadialListGraph
        title="All Decisions"
        sidebarTitle="Decisions"
        items={decisionItems}
        icon="📋"
        color={COLORS.blue}
        background={COLORS.blueLight}
        selectedName={
          selectedDecision?.title
        }
        centerSubtitle={`${decisions.length} decisions`}
        onBack={goBack}
        onReset={resetGraph}
        onSelect={(item) => {
          setSelectedDecision(item);
          setView("decision");
        }}
      />
    );
  }

  /* =======================================================
     FILTERED DECISIONS
  ======================================================= */

  let filteredDecisions = [];
  let filteredTitle = "";
  let filteredIcon = "📋";
  let filteredColor = COLORS.blue;
  let filteredBackground = COLORS.blueLight;

  if (
    view === "categoryDecisions" &&
    selectedCategory
  ) {
    filteredDecisions =
      selectedCategory.decisions;

    filteredTitle =
      `Category: ${selectedCategory.name}`;

    filteredIcon = "📁";
    filteredColor = COLORS.purple;
    filteredBackground =
      COLORS.purpleLight;
  }

  if (
    view === "statusDecisions" &&
    selectedStatus
  ) {
    filteredDecisions =
      selectedStatus.decisions;

    filteredTitle =
      `Status: ${selectedStatus.name}`;

    filteredIcon = "📊";
    filteredColor = COLORS.orange;
    filteredBackground =
      COLORS.orangeLight;
  }

  if (
    view === "personDecisions" &&
    selectedPerson
  ) {
    filteredDecisions =
      selectedPerson.decisions;

    filteredTitle =
      `Person: ${selectedPerson.name}`;

    filteredIcon = "👥";
    filteredColor = COLORS.green;
    filteredBackground =
      COLORS.greenLight;
  }

  /* =======================================================
     FILTERED DECISION GRAPH
  ======================================================= */

  if (
    view === "categoryDecisions" ||
    view === "statusDecisions" ||
    view === "personDecisions"
  ) {
    const decisionItems =
      filteredDecisions.map(
        (decision, index) => ({
          ...decision,

          name:
            decision.title ||
            decision.problemStatement ||
            `Decision ${index + 1}`,

          count: 1,
        })
      );

    const positions =
      getRadialPositions(
        decisionItems.length
      );

    const connections =
      positions.map((position) => ({
        x1: 50,
        y1: 50,
        x2: position.x,
        y2: position.y,
      }));

    return (
      <div
        style={{
          marginTop: 28,
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <GraphHeader
          subtitle={`${filteredTitle} • ${filteredDecisions.length} decisions`}
          showBack={true}
          onBack={goBack}
          onReset={resetGraph}
        />

        <div
          style={{
            height: 560,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <GraphSidebar
            title="Decisions"
            items={decisionItems}
            selectedName={
              selectedDecision?.title
            }
            onSelect={(decision) => {
              setSelectedDecision(decision);
              setView("decision");
            }}
          />

          <div
            style={{
              flex: 1,
              position: "relative",
              overflow: "hidden",
              background:
                "radial-gradient(circle at 50% 50%, #f8fafc 0%, #ffffff 70%)",
            }}
          >
            <GraphConnections
              connections={connections}
            />

            {/* CENTER */}
            <PositionedNode x={50} y={50}>
              <GraphNode
                icon={filteredIcon}
                title={filteredTitle}
                subtitle={`${filteredDecisions.length} decision${
                  filteredDecisions.length !== 1
                    ? "s"
                    : ""
                }`}
                color={filteredColor}
                background={
                  filteredBackground
                }
                width={190}
              />
            </PositionedNode>

            {/* DECISION NODES */}
            {decisionItems.map(
              (decision, index) => {
                const position =
                  positions[index];

                return (
                  <PositionedNode
                    key={
                      decision._id ||
                      index
                    }
                    x={position.x}
                    y={position.y}
                  >
                    <GraphNode
                      icon="📌"
                      title={decision.name}
                      subtitle={
                        decision.status ||
                        "Recorded"
                      }
                      onClick={() => {
                        setSelectedDecision(
                          decision
                        );
                        setView("decision");
                      }}
                      color={COLORS.blue}
                      background={
                        COLORS.blueLight
                      }
                      width={175}
                    />
                  </PositionedNode>
                );
              }
            )}
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     DECISION DETAIL GRAPH
  ======================================================= */

  if (
    view === "decision" &&
    selectedDecision
  ) {
    const detailNodes = [
      {
        key: "problem",
        x: 50,
        y: 17,
        icon: "❓",
        title: "Problem",
        subtitle: shortText(
          selectedDecision.problemStatement ||
            selectedDecision.description ||
            "No problem recorded.",
          90
        ),
        color: COLORS.red,
        background: COLORS.redLight,
        width: 200,
      },

      {
        key: "category",
        x: 20,
        y: 52,
        icon: "📁",
        title: "Category",
        subtitle:
          selectedDecision.category ||
          "General",
        color: COLORS.purple,
        background:
          COLORS.purpleLight,
        width: 170,
      },

      {
        key: "status",
        x: 80,
        y: 52,
        icon: "📊",
        title: "Status",
        subtitle:
          selectedDecision.status ||
          "Recorded",
        color: COLORS.orange,
        background:
          COLORS.orangeLight,
        width: 170,
      },

      {
        key: "reviewer",
        x: 30,
        y: 83,
        icon: "👤",
        title: "Reviewer Review",
        subtitle: shortText(
          selectedDecision.reviewerFeedback ||
            "No reviewer feedback recorded.",
          75
        ),
        color: COLORS.green,
        background:
          COLORS.greenLight,
        width: 195,
      },

      {
        key: "manager",
        x: 70,
        y: 83,
        icon: "👔",
        title: "Manager Review",
        subtitle: shortText(
          selectedDecision.managerFeedback ||
            "No manager feedback recorded.",
          75
        ),
        color: COLORS.green,
        background:
          COLORS.greenLight,
        width: 195,
      },
    ];

    const detailConnections =
      detailNodes.map((node) => ({
        x1: 50,
        y1: 50,
        x2: node.x,
        y2: node.y,
      }));

    return (
      <div
        style={{
          marginTop: 28,
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          overflow: "hidden",
          background: "#ffffff",
        }}
      >
        <GraphHeader
          subtitle="Decision Details"
          showBack={true}
          onBack={goBack}
          onReset={resetGraph}
        />

        <div
          style={{
            height: 560,
            position: "relative",
            overflow: "hidden",
            background:
              "radial-gradient(circle at 50% 50%, #f8fafc 0%, #ffffff 70%)",
          }}
        >
          <GraphConnections
            connections={detailConnections}
          />

          {/* MAIN DECISION */}
          <PositionedNode x={50} y={50}>
            <GraphNode
              icon="🧠"
              title={
                selectedDecision.title ||
                "Untitled Decision"
              }
              subtitle="Selected Decision"
              color={COLORS.blue}
              background={COLORS.blueLight}
              width={215}
              selected
            />
          </PositionedNode>

          {/* DETAIL NODES */}
          {detailNodes.map((node) => (
            <PositionedNode
              key={node.key}
              x={node.x}
              y={node.y}
            >
              <GraphNode
                icon={node.icon}
                title={node.title}
                subtitle={node.subtitle}
                color={node.color}
                background={node.background}
                width={node.width}
              />
            </PositionedNode>
          ))}
        </div>
      </div>
    );
  }

  return null;
}