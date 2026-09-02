import {
  ArrowUpRight,
  BrainCircuit,
  ChevronDown,
  Database,
  GitBranch,
  LockKeyhole,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
  UserRound,
  Check,
  Clock3,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "../styles/LandingPage.css";

const navItems = [
  { label: "Home", id: "home" },
  { label: "How it works", id: "how-it-works" },
  { label: "Features", id: "features" },
  { label: "Vision", id: "vision" },
];

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    setMobileOpen(false);
  };

  return (
    <div className="dv-landing">
      <div className="dv-grid" />
      <div className="dv-glow dv-glow-left" />
      <div className="dv-glow dv-glow-right" />

      {/* ================= NAVBAR ================= */}

      <header className="dv-navbar-wrap">
        <nav className="dv-navbar">
          <button className="dv-brand" onClick={() => scrollTo("home")}>
            <span className="dv-brand-icon">
              <LockKeyhole size={17} />
            </span>

            <span>
              Decision<span>Vault</span>
            </span>
          </button>

          <div className="dv-nav-links">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)}>
                {item.label}
              </button>
            ))}
          </div>

          <div className="dv-nav-actions">

            <button className="dv-nav-cta" onClick={() => navigate("/login")}>
              Explore
              <ArrowUpRight size={15} />
            </button>
          </div>

          <button
            className="dv-mobile-menu"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="dv-mobile-nav">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => scrollTo(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ================= PAGE ================= */}

      <main className="dv-snap-container">
        {/* ================= HERO ================= */}

        <section id="home" className="dv-section dv-hero">
          <div className="dv-hero-content">
            <div className="dv-eyebrow">
              <span />A memory layer for better decisions
            </div>

            <h1>
              Remember
              <br />
              <span>why.</span>
            </h1>

            <p>
              DecisionVault captures the reasoning behind important decisions,
              creating a permanent layer of context for your team.
            </p>

            <div className="dv-actions">
              <button
                className="dv-primary"
                onClick={() => scrollTo("how-it-works")}
              >
                Explore DecisionVault
                <ArrowUpRight size={17} />
              </button>

              <button
                className="dv-secondary"
                onClick={() => scrollTo("features")}
              >
                <Play size={14} />
                See how it works
              </button>
            </div>

            <div className="dv-stats">
              <div>
                <strong>01</strong>
                <span>Capture</span>
              </div>

              <div>
                <strong>02</strong>
                <span>Understand</span>
              </div>

              <div>
                <strong>03</strong>
                <span>Replay</span>
              </div>
            </div>
          </div>

          {/* 3D VAULT */}

          <div className="dv-vault-stage">
            <div className="dv-vault-glow" />

            <div className="dv-orbit dv-orbit-one" />
            <div className="dv-orbit dv-orbit-two" />

            <div className="dv-vault-shadow" />

            <div className="dv-vault">
              <div className="dv-vault-top" />

              <div className="dv-vault-face">
                <div className="dv-vault-inner">
                  <div className="dv-vault-core">
                    <span className="dv-core-ring dv-ring-1" />
                    <span className="dv-core-ring dv-ring-2" />
                    <span className="dv-core-ring dv-ring-3" />

                    <div className="dv-core-lock">
                      <LockKeyhole size={34} />
                    </div>
                  </div>

                  <div className="dv-vault-label">
                    <span>DECISION</span>
                    <strong>01</strong>
                  </div>
                </div>
              </div>

              <div className="dv-vault-side" />
              <div className="dv-vault-bottom" />
            </div>

            <div className="dv-vault-card dv-card-one">
              <BrainCircuit size={17} />

              <div>
                <span>Reasoning captured</span>
                <strong>94%</strong>
              </div>
            </div>

            <div className="dv-vault-card dv-card-two">
              <ShieldCheck size={17} />

              <div>
                <span>Decision verified</span>
                <strong>✓</strong>
              </div>
            </div>
          </div>

          <button
            className="dv-scroll"
            onClick={() => scrollTo("how-it-works")}
          >
            <span>Scroll to explore</span>
            <ChevronDown size={15} />
          </button>
        </section>

        {/* ================= HOW IT WORKS ================= */}

        <section id="how-it-works" className="dv-section dv-workflow">
          <div className="dv-section-heading">
            <span className="dv-section-label">01 / HOW IT WORKS</span>

            <h2>
              Context is the
              <span> missing layer.</span>
            </h2>

            <p>
              Most systems remember what happened. DecisionVault remembers why
              it happened.
            </p>
          </div>

          <div className="dv-workflow-grid">
            <article className="dv-workflow-card dv-main-card">
              <div className="dv-card-icon">
                <BrainCircuit size={21} />
              </div>

              <span className="dv-number">01</span>

              <h3>Capture the reasoning</h3>

              <p>
                Record assumptions, alternatives, constraints, evidence and the
                logic behind a decision.
              </p>

              <div className="dv-lines">
                <span />
                <span />
                <span />
                <span />
              </div>
            </article>

            <article className="dv-workflow-card">
              <div className="dv-card-icon">
                <Database size={21} />
              </div>

              <span className="dv-number">02</span>

              <h3>Build the context</h3>

              <p>Connect decisions to people, projects, events and outcomes.</p>
            </article>

            <article className="dv-workflow-card">
              <div className="dv-card-icon">
                <GitBranch size={21} />
              </div>

              <span className="dv-number">03</span>

              <h3>Replay the decision</h3>

              <p>
                Walk backwards through the reasoning and understand how your
                team arrived at the outcome.
              </p>
            </article>
          </div>
        </section>

        {/* ================= FEATURES ================= */}

        <section id="features" className="dv-section dv-features">
          <div className="dv-section-heading dv-centered">
            <span className="dv-section-label">02 / FEATURES</span>

            <h2>
              Built around
              <span> better thinking.</span>
            </h2>

            <p>Simple on the surface. Powerful underneath.</p>
          </div>

          <div className="dv-feature-grid">
            <div className="dv-feature-card">
              <div className="dv-feature-top">
                <div className="dv-card-icon">
                  <ShieldCheck size={20} />
                </div>

                <span>01</span>
              </div>

              <h3>Decision integrity</h3>

              <p>
                Keep the original context attached to every important decision.
              </p>

              <ArrowUpRight className="dv-feature-arrow" size={17} />
            </div>

            <div className="dv-feature-card">
              <div className="dv-feature-top">
                <div className="dv-card-icon">
                  <Sparkles size={20} />
                </div>

                <span>02</span>
              </div>

              <h3>AI-assisted insight</h3>

              <p>Surface patterns, contradictions and forgotten assumptions.</p>

              <ArrowUpRight className="dv-feature-arrow" size={17} />
            </div>

            <div className="dv-feature-card">
              <div className="dv-feature-top">
                <div className="dv-card-icon">
                  <GitBranch size={20} />
                </div>

                <span>03</span>
              </div>

              <h3>Decision timelines</h3>

              <p>See how decisions changed as new information appeared.</p>

              <ArrowUpRight className="dv-feature-arrow" size={17} />
            </div>

            <div className="dv-feature-card">
              <div className="dv-feature-top">
                <div className="dv-card-icon">
                  <Zap size={20} />
                </div>

                <span>04</span>
              </div>

              <h3>Fast retrieval</h3>

              <p>
                Find the reasoning you need without digging through endless
                documents.
              </p>

              <ArrowUpRight className="dv-feature-arrow" size={17} />
            </div>
          </div>
        </section>

        {/* ================= VISION ================= */}

        <section id="vision" className="dv-section dv-vision">
          <div className="dv-vision-card">
            <div className="dv-vision-content">
              <span className="dv-section-label">03 / THE VISION</span>

              <h2>
                Don't just store
                <br />
                decisions.
                <span> Understand them.</span>
              </h2>

              <p>
                DecisionVault is designed to become the memory layer between
                human reasoning, organisational knowledge and future decisions.
              </p>

              <button
                className="dv-primary"
                onClick={() => (window.location.href = "/login")}
              >
                Enter the vault
                <ArrowUpRight size={17} />
              </button>
            </div>

            <div className="dv-vision-visual" aria-hidden="true">
              <div className="dv-vision-orbit dv-vision-orbit-a" />
              <div className="dv-vision-orbit dv-vision-orbit-b" />

              <div className="dv-memory-core">
                <div className="dv-memory-core-glow" />
                <LockKeyhole size={31} />
                <span>MEMORY LAYER</span>
              </div>

              <div className="dv-memory-card dv-memory-card-top">
                <div className="dv-memory-icon">
                  <Check size={14} />
                </div>
                <div>
                  <span>Decision integrity</span>
                  <strong>Preserved</strong>
                </div>
              </div>

              <div className="dv-memory-card dv-memory-card-bottom">
                <div className="dv-memory-icon">
                  <Clock3 size={14} />
                </div>
                <div>
                  <span>Context timeline</span>
                  <strong>12 events linked</strong>
                </div>
              </div>

              <div className="dv-memory-connection dv-connection-one">
                <ArrowRight size={13} />
              </div>
              <div className="dv-memory-connection dv-connection-two">
                <ArrowRight size={13} />
              </div>
            </div>
          </div>

          <footer className="dv-footer">
            <div className="dv-footer-brand">
              <span className="dv-footer-logo">
                <LockKeyhole size={13} />
              </span>
              <span>
                Decision<span>Vault</span>
              </span>
            </div>

            <div className="dv-footer-links">
              <button onClick={() => scrollTo("home")}>Home</button>
              <button onClick={() => scrollTo("how-it-works")}>
                How it works
              </button>
              <button onClick={() => scrollTo("features")}>Features</button>
              <button onClick={() => scrollTo("vision")}>Vision</button>
            </div>

            <div className="dv-footer-meta">
              <span>© 2026 DecisionVault</span>
              <span>Decisions, preserved.</span>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
