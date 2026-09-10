import os
import json
from datetime import datetime, timedelta
from sqlalchemy.orm import sessionmaker

from database.database import engine, Base
from models.role import Role
from models.team import Team
from models.user import User
from models.decision import Decision
from models.alternative import DecisionAlternative
from models.document import Document
from models.comment import Comment
from models.version import DecisionVersion
from security.password import hash_password

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def create_sample_file(filename: str, title: str, content_type: str = "pdf"):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(f"--- {title} ---\n\n")
            f.write(f"Document Type: {content_type.upper()}\n")
            f.write(f"Generated for Expert Decision Replay Platform\n")
            f.write(f"Timestamp: {datetime.utcnow().isoformat()}\n\n")
            f.write("Executive Summary:\nThis document contains technical specifications, evaluations, "
                    "and stakeholder analyses supporting strategic organizational decisions.\n")
    return file_path


def seed_database():
    # Ensure all tables exist
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        # 1. Roles
        roles_data = [
            ("Employee", "Creates and participates in organizational decisions."),
            ("Reviewer", "Reviews decisions and provides feedback."),
            ("Manager", "Approves or rejects decisions."),
            ("Administrator", "Manages users, roles, teams, and the system.")
        ]
        roles = {}
        for name, desc in roles_data:
            role = db.query(Role).filter(Role.name == name).first()
            if not role:
                role = Role(name=name, description=desc)
                db.add(role)
                db.commit()
                db.refresh(role)
            roles[name] = role

        # 2. Teams
        teams_data = [
            ("AI Team", "Artificial intelligence, machine learning models, and cognitive services."),
            ("Architecture", "System design, database architecture, and technical standards."),
            ("Cloud Infrastructure", "Cloud platforms, DevOps, CI/CD, and scaling."),
            ("Security & Compliance", "Data privacy, security policies, and regulatory compliance.")
        ]
        teams = {}
        for name, desc in teams_data:
            team = db.query(Team).filter(Team.name == name).first()
            if not team:
                team = Team(name=name, description=desc)
                db.add(team)
                db.commit()
                db.refresh(team)
            teams[name] = team

        # 3. Users - Only admin@company.com and emp@company.com
        default_pwd = hash_password("password123")
        users_data = [
            ("Admin User", "admin@company.com", roles["Administrator"].id, teams["Architecture"].id),
            ("Employee User", "emp@company.com", roles["Employee"].id, teams["AI Team"].id),
        ]
        users = {}
        for name, email, role_id, team_id in users_data:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                user = User(
                    name=name,
                    email=email,
                    password_hash=default_pwd,
                    role_id=role_id,
                    team_id=team_id
                )
                db.add(user)
                db.commit()
                db.refresh(user)
            users[email] = user

        # 4. Check if decisions already seeded
        existing_decisions = db.query(Decision).count()
        if existing_decisions > 0:
            print(f"Database already contains {existing_decisions} decisions. Skipping decision seed.")
            return

        print("Seeding Decisions, Alternatives, Documents, Comments, and Versions...")

        # Decision 1: AI Model Evaluation
        d1 = Decision(
            title="Enterprise AI Model Selection & Deployment",
            problem_statement="Evaluate and select an enterprise-grade large language model and hosting platform for organizational decision intelligence, ensuring data sovereignty, sub-300ms latency, and high reasoning benchmarks.",
            objective="Deploy an LLM platform meeting strict data privacy, sub-300ms latency, and high accuracy benchmarks.",
            context="Our current self-hosted models lack multi-turn reasoning capabilities, causing delays in engineering workflows.",
            category="AI",
            status="Approved",
            priority="Critical",
            created_by_id=users["emp@company.com"].id,
            team_id=teams["AI Team"].id,
            current_version=2,
            decision_rationale="The hybrid enterprise gateway provides top-tier benchmark accuracy with zero maintenance delay, meeting our compliance standards at 50% lower initial monthly cost.",
            created_at=datetime.utcnow() - timedelta(days=14)
        )
        db.add(d1)
        db.commit()
        db.refresh(d1)

        # Alternatives for D1
        d1_alt1 = DecisionAlternative(
            decision_id=d1.id,
            title="Self-hosted Open-Source Llama 3 70B on vLLM",
            description="Deploy open-source weights onto self-managed Kubernetes GPU clusters (A100/H100).",
            pros=json.dumps(["Complete data sovereignty", "Zero external per-token API charges", "Custom weights fine-tuning support"]),
            cons=json.dumps(["High upfront GPU infrastructure costs", "Operational overhead of GPU clustering", "Maintenance and scaling complexity"]),
            cost_estimate="$8,500 / month (Hardware & Cloud GPUs)",
            feasibility_analysis="High technical feasibility with existing DevOps team.",
            feasibility_score=8,
            risk_assessment="GPU hardware availability constraints and driver management overhead.",
            risk_level="Medium",
            mitigation_plan="Utilize cloud reserved instances and multi-region failover nodes.",
            is_selected=False
        )
        d1_alt2 = DecisionAlternative(
            decision_id=d1.id,
            title="Enterprise Hosted API with Private VPC Gateway",
            description="Use enterprise-tier hosted APIs with dedicated private endpoints, zero-data-retention agreements, and dual-provider routing.",
            pros=json.dumps(["State-of-the-art reasoning benchmark performance", "Zero infrastructure maintenance", "Enterprise SLA & SOC2/ISO27001 compliance", "Immediate integration time"]),
            cons=json.dumps(["Usage-based billing requires quota management", "Requires network egress through private tenant endpoint"]),
            cost_estimate="$4,200 / month estimated usage",
            feasibility_analysis="Immediate integration via standardized REST SDKs.",
            feasibility_score=10,
            risk_assessment="Third-party service rate limits during usage spikes.",
            risk_level="Low",
            mitigation_plan="Implement dual-provider failover routing and local semantic caching.",
            is_selected=True
        )
        d1_alt3 = DecisionAlternative(
            decision_id=d1.id,
            title="Proprietary On-Premises Appliance",
            description="Procure pre-configured rackmount AI server hardware with integrated vendor stack.",
            pros=json.dumps(["Air-gapped security model", "Predictable single-time purchase"]),
            cons=json.dumps(["$120,000 upfront capital expenditure", "Slow hardware update cycles and vendor lock-in"]),
            cost_estimate="$120,000 upfront + $1,500/mo maintenance",
            feasibility_analysis="Requires specialized server room cooling and rack footprint.",
            feasibility_score=4,
            risk_assessment="Rapid obsolescence of hardware within 18 months.",
            risk_level="High",
            mitigation_plan="Negotiate lease-to-own terms with hardware refresh clause.",
            is_selected=False
        )
        db.add_all([d1_alt1, d1_alt2, d1_alt3])
        db.commit()

        d1.selected_alternative_id = d1_alt2.id
        db.commit()

        # Decision 2: Database Migration
        d2 = Decision(
            title="Relational Database Architecture Migration",
            problem_statement="Migrate legacy relational database to modern PostgreSQL with native JSONB and vector extension support for decision knowledge graphs.",
            objective="Improve query latency for knowledge graph relationships by 40% and enable vector embeddings search.",
            context="Current storage solution lacks modern indexing for graph traversals and structured decision trees.",
            category="Database",
            status="Approved",
            priority="High",
            created_by_id=users["admin@company.com"].id,
            team_id=teams["Architecture"].id,
            current_version=1,
            decision_rationale="Managed PostgreSQL Aurora provides automated backups, pgvector compatibility, and reduces DBA operational load.",
            created_at=datetime.utcnow() - timedelta(days=10)
        )
        db.add(d2)
        db.commit()
        db.refresh(d2)

        d2_alt1 = DecisionAlternative(
            decision_id=d2.id,
            title="Managed PostgreSQL on Cloud (Aurora / RDS)",
            description="Adopt managed PostgreSQL with automated replication, multi-AZ failover, and pgvector extension.",
            pros=json.dumps(["Automated patching and backups", "pgvector extension support", "99.99% availability SLA"]),
            cons=json.dumps(["Higher cloud service cost compared to bare-metal"]),
            cost_estimate="$1,800 / month",
            feasibility_analysis="High compatibility with existing SQLAlchemy ORM schemas.",
            feasibility_score=9,
            risk_assessment="Downtime during initial data migration cutover.",
            risk_level="Low",
            mitigation_plan="Use logical replication for zero-downtime cutover.",
            is_selected=True
        )
        d2_alt2 = DecisionAlternative(
            decision_id=d2.id,
            title="Self-hosted PostgreSQL on Kubernetes with Stolon",
            description="Containerized PostgreSQL cluster running inside Kubernetes.",
            pros=json.dumps(["Lower compute costs", "Unified container orchestration"]),
            cons=json.dumps(["Complex stateful volume management", "Failover edge cases in Kubernetes"]),
            cost_estimate="$950 / month",
            feasibility_analysis="Requires advanced Kubernetes storage expertise.",
            feasibility_score=6,
            risk_assessment="Split-brain risks during network partitions.",
            risk_level="High",
            mitigation_plan="Implement strict Consul quorum fencing.",
            is_selected=False
        )
        db.add_all([d2_alt1, d2_alt2])
        db.commit()
        d2.selected_alternative_id = d2_alt1.id
        db.commit()

        # Decision 3: Cloud Deployment Strategy
        d3 = Decision(
            title="Cloud Deployment & Multi-Region Strategy",
            problem_statement="Define high-availability multi-region deployment strategy to support sub-100ms response times for global engineering teams.",
            objective="Achieve 99.95% uptime and geographic latency optimization across US and APAC regions.",
            context="Expansion into Asia-Pacific necessitates localized compute and content delivery.",
            category="Cloud",
            status="Under Review",
            priority="High",
            created_by_id=users["emp@company.com"].id,
            team_id=teams["Cloud Infrastructure"].id,
            current_version=1,
            created_at=datetime.utcnow() - timedelta(days=6)
        )
        db.add(d3)
        db.commit()
        db.refresh(d3)

        d3_alt1 = DecisionAlternative(
            decision_id=d3.id,
            title="Multi-Region Active-Passive with Route53 Failover",
            description="Primary region handles all writes; secondary region hosts read replicas and standby compute.",
            pros=json.dumps(["Simpler data consistency model", "Straightforward disaster recovery runbook"]),
            cons=json.dumps(["Higher read latency for APAC writes", "Standby compute idle cost"]),
            cost_estimate="$3,500 / month",
            feasibility_analysis="Easily implemented with existing Terraform scripts.",
            feasibility_score=8,
            risk_assessment="5-minute RPO window during emergency regional failover.",
            risk_level="Medium",
            mitigation_plan="Automated health check probes and pre-warmed Lambdas.",
            is_selected=False
        )
        db.add(d3_alt1)
        db.commit()

        # Decision 4: Security Compliance
        d4 = Decision(
            title="Enterprise Security Compliance & Audit Policy",
            problem_statement="Establish organizational baseline for data encryption, role-based audit logging, and SOC2 compliance across all decision replay endpoints.",
            objective="Pass external SOC2 Type II compliance audit with zero critical non-conformities.",
            context="Enterprise client onboarding requires verified audit logs of every decision alteration.",
            category="Security",
            status="Approved",
            priority="Critical",
            created_by_id=users["admin@company.com"].id,
            team_id=teams["Security & Compliance"].id,
            current_version=1,
            decision_rationale="Adopting centralized tamper-evident audit logs with automated quarterly reviews satisfies SOC2 compliance criteria.",
            created_at=datetime.utcnow() - timedelta(days=4)
        )
        db.add(d4)
        db.commit()
        db.refresh(d4)

        # Decision 5: Project Requirements for Micro-frontend
        d5 = Decision(
            title="Micro-frontend Architecture for Replay Portal",
            problem_statement="Determine whether to split the monolithic UI into modular micro-frontends for independent team deployments.",
            objective="Enable independent deployment cadence for Analytics, Decisions, and Knowledge Graph modules.",
            context="Multiple teams contributing to the frontend are experiencing merge bottlenecks.",
            category="Architecture",
            status="Draft",
            priority="Medium",
            created_by_id=users["emp@company.com"].id,
            team_id=teams["Architecture"].id,
            current_version=1,
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add(d5)
        db.commit()
        db.refresh(d5)

        # 5. Documents (matching user screenshot!)
        doc1_path = create_sample_file("AI_Model_Evaluation_Report.pdf", "AI Model Evaluation Report", "pdf")
        doc2_path = create_sample_file("Database_Comparison.docx", "Database Comparison Matrix", "docx")
        doc3_path = create_sample_file("Project_Requirements.pdf", "Project Requirements Specification", "pdf")
        doc4_path = create_sample_file("Cloud_Deployment_Strategy.pptx", "Cloud Deployment Strategy", "pptx")
        doc5_path = create_sample_file("Security_Compliance_Guidelines.pdf", "Security Compliance Guidelines", "pdf")

        docs = [
            Document(
                title="AI Model Evaluation Report.pdf",
                filename="AI_Model_Evaluation_Report.pdf",
                original_filename="AI Model Evaluation Report.pdf",
                file_path=doc1_path,
                file_type="pdf",
                file_size=2458000,
                category="AI",
                tags=json.dumps(["AI", "Evaluation", "Research"]),
                description="Comprehensive evaluation of proprietary and open-weight models across reasoning, speed, and cost metrics.",
                decision_id=d1.id,
                uploaded_by_id=users["emp@company.com"].id,
                created_at=datetime.utcnow() - timedelta(hours=2)
            ),
            Document(
                title="Database Comparison.docx",
                filename="Database_Comparison.docx",
                original_filename="Database Comparison.docx",
                file_path=doc2_path,
                file_type="docx",
                file_size=1180000,
                category="Database",
                tags=json.dumps(["Database", "Architecture", "Technical"]),
                description="Technical comparison matrix between PostgreSQL Aurora, MySQL, and MongoDB for graph relational workloads.",
                decision_id=d2.id,
                uploaded_by_id=users["admin@company.com"].id,
                created_at=datetime.utcnow() - timedelta(days=2)
            ),
            Document(
                title="Project Requirements.pdf",
                filename="Project_Requirements.pdf",
                original_filename="Project Requirements.pdf",
                file_path=doc3_path,
                file_type="pdf",
                file_size=3200000,
                category="Requirements",
                tags=json.dumps(["Requirements", "Planning"]),
                description="Detailed functional and non-functional requirements for the Expert Decision Replay Platform.",
                decision_id=d5.id,
                uploaded_by_id=users["emp@company.com"].id,
                created_at=datetime.utcnow() - timedelta(days=3)
            ),
            Document(
                title="Cloud Deployment Strategy.pptx",
                filename="Cloud_Deployment_Strategy.pptx",
                original_filename="Cloud Deployment Strategy.pptx",
                file_path=doc4_path,
                file_type="pptx",
                file_size=5400000,
                category="Cloud",
                tags=json.dumps(["Cloud", "Deployment", "Strategy"]),
                description="Multi-region cloud infrastructure architecture diagrams, network topology, and disaster recovery roadmap.",
                decision_id=d3.id,
                uploaded_by_id=users["emp@company.com"].id,
                created_at=datetime.utcnow() - timedelta(days=5)
            ),
            Document(
                title="Security Compliance Guidelines.pdf",
                filename="Security_Compliance_Guidelines.pdf",
                original_filename="Security Compliance Guidelines.pdf",
                file_path=doc5_path,
                file_type="pdf",
                file_size=1890000,
                category="Security",
                tags=json.dumps(["Security", "Compliance", "Policy"]),
                description="Mandatory organizational security policies, encryption-at-rest specifications, and SOC2 audit procedures.",
                decision_id=d4.id,
                uploaded_by_id=users["admin@company.com"].id,
                created_at=datetime.utcnow() - timedelta(days=7)
            )
        ]
        db.add_all(docs)
        db.commit()

        # 6. Comments & Meeting Notes
        c1 = Comment(
            decision_id=d1.id,
            user_id=users["admin@company.com"].id,
            content="Benchmark results confirm the private gateway handles 150 concurrent queries without latency degradation.",
            created_at=datetime.utcnow() - timedelta(hours=6)
        )
        c2 = Comment(
            decision_id=d1.id,
            user_id=users["emp@company.com"].id,
            content="This is very helpful for our analysis. Let's ensure the failover router is stress-tested before full release.",
            created_at=datetime.utcnow() - timedelta(hours=5)
        )
        c3 = Comment(
            decision_id=d1.id,
            user_id=users["admin@company.com"].id,
            is_meeting_note=True,
            meeting_date=datetime.utcnow() - timedelta(days=1),
            meeting_attendees="Admin User, Employee User",
            content="Stakeholder Review Meeting: Reviewed SLA guarantees, network topology, and compliance certificates. Unanimously agreed on Option B with private VPC connector.",
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add_all([c1, c2, c3])
        db.commit()

        # 7. Decision Versions
        v1_snapshot = {
            "title": d1.title,
            "problem_statement": d1.problem_statement,
            "objective": d1.objective,
            "context": d1.context,
            "status": "Under Review",
            "priority": "High",
            "alternatives": [
                {"title": d1_alt1.title, "cost": d1_alt1.cost_estimate},
                {"title": d1_alt2.title, "cost": d1_alt2.cost_estimate}
            ]
        }
        v1 = DecisionVersion(
            decision_id=d1.id,
            version_number=1,
            changed_by_id=users["emp@company.com"].id,
            change_summary="Initial decision formulation with 2 primary alternatives.",
            snapshot=json.dumps(v1_snapshot),
            created_at=datetime.utcnow() - timedelta(days=7)
        )

        v2_snapshot = {
            "title": d1.title,
            "problem_statement": d1.problem_statement,
            "objective": d1.objective,
            "context": d1.context,
            "status": "Approved",
            "priority": "Critical",
            "selected_alternative": d1_alt2.title,
            "decision_rationale": d1.decision_rationale,
            "alternatives": [
                {"title": d1_alt1.title, "cost": d1_alt1.cost_estimate},
                {"title": d1_alt2.title, "cost": d1_alt2.cost_estimate},
                {"title": d1_alt3.title, "cost": d1_alt3.cost_estimate}
            ]
        }
        v2 = DecisionVersion(
            decision_id=d1.id,
            version_number=2,
            changed_by_id=users["admin@company.com"].id,
            change_summary="Added on-premise hardware evaluation, finalized approval, and selected Enterprise Gateway.",
            snapshot=json.dumps(v2_snapshot),
            created_at=datetime.utcnow() - timedelta(days=2)
        )
        db.add_all([v1, v2])
        db.commit()

        print("Database seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
