import logging
from datetime import datetime, UTC, timedelta
from uuid import uuid4
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.collaboration import (
    Approval,
    ApprovalStep,
    ApprovalWorkflow,
    AuditLog,
    Comment,
    Discussion,
    MeetingNote,
    Notification,
)
from app.models.decision import (
    Alternative,
    AlternativeEvaluation,
    Decision,
    DecisionVersion,
    EvaluationCriterion,
    Risk,
    Stakeholder,
)
from app.models.identity import Role, Team, TeamMember, User, UserProfile
from app.models.taxonomy import DecisionCategory, DecisionTag, DecisionTagLink
from app.services.version_service import create_decision_snapshot

logger = logging.getLogger(__name__)


def seed_database() -> None:
    """Seed the database with default roles, categories, tags, workflows, demo users, and realistic decision case files."""
    db: Session = SessionLocal()
    try:
        # 1. ROLES
        roles_data = [
            ("employee", "Employee", "Standard employee with decision creation and collaboration permissions."),
            ("reviewer", "Reviewer", "Peer/technical reviewer authorized to evaluate and verify decision cases."),
            ("manager", "Manager", "Management authority responsible for final organizational decision sign-offs."),
            ("administrator", "Administrator", "System administrator with full user management, audit, and governance controls."),
        ]
        roles_map: dict[str, Role] = {}
        for code, name, desc in roles_data:
            r = db.scalar(select(Role).where(Role.code == code))
            if not r:
                r = Role(code=code, name=name, description=desc, is_system=True)
                db.add(r)
                db.flush()
            roles_map[code] = r

        # 2. DEMO USERS
        demo_users_data = [
            ("admin@edrp.org", "Password123!", "administrator", "Sarah Jenkins", "Director of IT & Enterprise Architecture", "Executive IT", "+1-555-0101"),
            ("manager@edrp.org", "Password123!", "manager", "Marcus Vance", "Engineering VP", "Engineering", "+1-555-0102"),
            ("reviewer@edrp.org", "Password123!", "reviewer", "Dr. Elena Rostova", "Principal Solutions Architect", "Architecture", "+1-555-0103"),
            ("employee@edrp.org", "Password123!", "employee", "Alex Chen", "Lead Software Engineer", "Product Engineering", "+1-555-0104"),
        ]
        users_map: dict[str, User] = {}
        for email, pwd, role_code, full_name, title, dept, phone in demo_users_data:
            u = db.scalar(select(User).where(User.email == email))
            if not u:
                u = User(
                    email=email,
                    hashed_password=hash_password(pwd),
                    role_id=roles_map[role_code].id,
                    is_active=True,
                )
                db.add(u)
                db.flush()

                prof = UserProfile(
                    user_id=u.id,
                    full_name=full_name,
                    job_title=title,
                    department=dept,
                    phone=phone,
                )
                db.add(prof)
                db.flush()
            users_map[email] = u

        # 3. TEAMS
        team_arch = db.scalar(select(Team).where(Team.name == "Core Architecture Group"))
        if not team_arch:
            team_arch = Team(
                name="Core Architecture Group",
                description="Cross-functional technical leadership and strategic system design.",
                created_by_id=users_map["admin@edrp.org"].id,
            )
            db.add(team_arch)
            db.flush()

            for u in users_map.values():
                db.add(TeamMember(team_id=team_arch.id, user_id=u.id))
            db.flush()

        # 4. CATEGORIES
        cats_data = [
            ("Architecture & Engineering", "architecture-engineering", "Core software, system architecture, and tech stack choices."),
            ("Cloud & Infrastructure", "cloud-infrastructure", "Compute platforms, cloud vendors, container orchestration, and hosting."),
            ("Security & Compliance", "security-compliance", "Zero-trust models, identity management, regulatory compliance, and encryption."),
            ("Product & Strategy", "product-strategy", "Feature roadmaps, technology deprecation, and product direction."),
            ("Vendor & Tool Selection", "vendor-tool-selection", "Third-party SaaS, procurement, and commercial tool evaluation."),
            ("Operations & Governance", "operations-governance", "Standard operating procedures, change management, and team structure."),
        ]
        cats_map: dict[str, DecisionCategory] = {}
        for name, slug, desc in cats_data:
            c = db.scalar(select(DecisionCategory).where(DecisionCategory.slug == slug))
            if not c:
                c = DecisionCategory(name=name, slug=slug, description=desc)
                db.add(c)
                db.flush()
            cats_map[slug] = c

        # 5. TAGS
        tags_data = ["high-impact", "critical", "cloud", "security", "compliance", "cost-saving", "scalability", "performance"]
        tags_map: dict[str, DecisionTag] = {}
        for tname in tags_data:
            slug = tname.lower()
            t = db.scalar(select(DecisionTag).where(DecisionTag.slug == slug))
            if not t:
                t = DecisionTag(name=tname, slug=slug)
                db.add(t)
                db.flush()
            tags_map[slug] = t

        # 6. DEFAULT APPROVAL WORKFLOW
        wf = db.scalar(select(ApprovalWorkflow).where(ApprovalWorkflow.is_default == True))
        if not wf:
            wf = ApprovalWorkflow(
                name="Standard Enterprise Review & Management Approval",
                description="Two-stage verification: Technical Peer Review followed by Executive Management Sign-off.",
                is_default=True,
                created_by_id=users_map["admin@edrp.org"].id,
            )
            db.add(wf)
            db.flush()

            step1 = ApprovalStep(
                workflow_id=wf.id,
                step_order=1,
                name="Peer & Technical Architecture Review",
                required_role_id=roles_map["reviewer"].id,
            )
            step2 = ApprovalStep(
                workflow_id=wf.id,
                step_order=2,
                name="Executive Management Sign-off",
                required_role_id=roles_map["manager"].id,
            )
            db.add_all([step1, step2])
            db.flush()

        # 7. SAMPLE DECISION 1: Approved Microservices Case
        d1 = db.scalar(select(Decision).where(Decision.title == "Transition Core Billing Engine from Monolith to Event-Driven Microservices"))
        if not d1:
            d1 = Decision(
                owner_id=users_map["employee@edrp.org"].id,
                category_id=cats_map["architecture-engineering"].id,
                team_id=team_arch.id,
                approval_workflow_id=wf.id,
                title="Transition Core Billing Engine from Monolith to Event-Driven Microservices",
                problem_statement="The existing billing subsystem inside the legacy Ruby on Rails monolith experiences severe database lock contention during end-of-month reconciliation cycles, causing peak API latencies of 4.8s and occasional payment timeout anomalies. We must decouple billing and payment settlement into an independently scalable, event-driven subsystem.",
                status="approved",
                implementation_status="in_progress",
                outcome_summary="Decision fully approved and authorized for Q3 implementation. The Apache Kafka event-driven Go service approach was selected after demonstrating 10x throughput in spike benchmarks while maintaining ACID transactional guarantees via Outbox pattern.",
                outcome_recorded_at=datetime.now(UTC) - timedelta(days=2),
                outcome_recorded_by_id=users_map["manager@edrp.org"].id,
            )
            db.add(d1)
            db.flush()

            # Tags
            db.add_all([
                DecisionTagLink(decision_id=d1.id, tag_id=tags_map["high-impact"].id),
                DecisionTagLink(decision_id=d1.id, tag_id=tags_map["scalability"].id),
                DecisionTagLink(decision_id=d1.id, tag_id=tags_map["performance"].id),
            ])

            # Criteria
            c1 = EvaluationCriterion(decision_id=d1.id, name="Throughput & Peak Latency", weight=3.0, sort_order=1)
            c2 = EvaluationCriterion(decision_id=d1.id, name="Data Consistency & Auditability", weight=3.0, sort_order=2)
            c3 = EvaluationCriterion(decision_id=d1.id, name="Implementation Complexity & TCO", weight=2.0, sort_order=3)
            c4 = EvaluationCriterion(decision_id=d1.id, name="Developer Velocity & Tooling", weight=1.5, sort_order=4)
            db.add_all([c1, c2, c3, c4])
            db.flush()

            # Alternatives
            a1 = Alternative(decision_id=d1.id, title="Event-Driven Microservices with Go & Apache Kafka", description="Decoupled Go microservice consuming domain events via Kafka with Postgres Outbox pattern for idempotent settlement.", sort_order=1, is_selected=True)
            a2 = Alternative(decision_id=d1.id, title="Modular Monolith Refactoring with Read Replicas", description="Extract billing domain boundary within existing codebase with dedicated Postgres read replica and Redis cache.", sort_order=2, is_selected=False)
            a3 = Alternative(decision_id=d1.id, title="Serverless AWS Lambda Pipeline with DynamoDB", description="Fully managed event pipeline using AWS EventBridge, Lambda execution workers, and DynamoDB storage.", sort_order=3, is_selected=False)
            db.add_all([a1, a2, a3])
            db.flush()

            d1.selected_alternative_id = a1.id

            # Evaluations
            scores_matrix = [
                # (alt, crit, score, note)
                (a1.id, c1.id, 95.0, "Sub-10ms response times, scales to 50k events/sec seamlessly."),
                (a1.id, c2.id, 92.0, "Outbox pattern guarantees exactly-once processing with complete ledger audit."),
                (a1.id, c3.id, 75.0, "Requires Kafka cluster operations and schema registry governance."),
                (a1.id, c4.id, 85.0, "Go tooling is mature with high test coverage and fast compile times."),

                (a2.id, c1.id, 70.0, "Addresses read locks but write contention remains bottleneck at peak periods."),
                (a2.id, c2.id, 88.0, "Strong consistency within single relational DB."),
                (a2.id, c3.id, 90.0, "Lowest upfront operational overhead."),
                (a2.id, c4.id, 80.0, "Familiar codebase for existing engineering staff."),

                (a3.id, c1.id, 88.0, "Auto-scaling is automatic though cold-starts cause occasional spikes."),
                (a3.id, c2.id, 78.0, "Eventual consistency requires custom distributed saga compensation."),
                (a3.id, c3.id, 65.0, "High monthly cost at high event volumes with vendor lock-in."),
                (a3.id, c4.id, 72.0, "Local debugging and integration testing are complex."),
            ]
            for aid, cid, sc, nt in scores_matrix:
                db.add(AlternativeEvaluation(decision_id=d1.id, alternative_id=aid, criterion_id=cid, score=sc, notes=nt, evaluated_by_id=users_map["reviewer@edrp.org"].id))

            # Risks
            db.add_all([
                Risk(decision_id=d1.id, title="Distributed Transaction Failure During Payment Settlement", severity="high", likelihood="low", mitigation="Implement transactional Outbox pattern with strict idempotency keys on payment gateway calls."),
                Risk(decision_id=d1.id, title="Kafka Operational Complexity & Partition Lag", severity="medium", likelihood="medium", mitigation="Deploy Strimzi Kafka Operator on EKS with automated partition rebalancing and Prometheus alerts."),
            ])

            # Stakeholders
            db.add_all([
                Stakeholder(decision_id=d1.id, user_id=users_map["employee@edrp.org"].id, display_name="Alex Chen", stakeholder_role="Author & Tech Lead"),
                Stakeholder(decision_id=d1.id, user_id=users_map["reviewer@edrp.org"].id, display_name="Dr. Elena Rostova", stakeholder_role="Principal Architect"),
                Stakeholder(decision_id=d1.id, user_id=users_map["manager@edrp.org"].id, display_name="Marcus Vance", stakeholder_role="Executive Sponsor"),
            ])

            # Approvals
            appr1 = Approval(
                decision_id=d1.id,
                step_order=1,
                step_name="Peer & Technical Architecture Review",
                required_role_id=roles_map["reviewer"].id,
                actor_id=users_map["reviewer@edrp.org"].id,
                status="approved",
                comment="Architecture design is sound. Benchmark data verifies Go + Kafka satisfies peak throughput objectives.",
                acted_at=datetime.now(UTC) - timedelta(days=5),
            )
            appr2 = Approval(
                decision_id=d1.id,
                step_order=2,
                step_name="Executive Management Sign-off",
                required_role_id=roles_map["manager"].id,
                actor_id=users_map["manager@edrp.org"].id,
                status="approved",
                comment="Budget and headcount allocated for Q3 rollout. Proceed with phased migration.",
                acted_at=datetime.now(UTC) - timedelta(days=2),
            )
            db.add_all([appr1, appr2])

            # Discussion
            disc1 = Discussion(decision_id=d1.id, title="Event Schema Registry & Backward Compatibility Strategy", created_by_id=users_map["reviewer@edrp.org"].id)
            db.add(disc1)
            db.flush()

            comm1 = Comment(discussion_id=disc1.id, author_id=users_map["reviewer@edrp.org"].id, body="Should we enforce Protocol Buffers or Avro with Confluent Schema Registry for all billing event schemas?")
            db.add(comm1)
            db.flush()

            comm2 = Comment(discussion_id=disc1.id, parent_id=comm1.id, author_id=users_map["employee@edrp.org"].id, body="We recommend Protobuf for seamless gRPC service integration and strict type generation across Go and TypeScript.")
            db.add(comm2)

            # Meeting Note
            db.add(MeetingNote(
                decision_id=d1.id,
                title="Architecture Review Board Sign-off Session",
                body="ARB convened to review billing microservices decomposition. Benchmarks reviewed and verified. Approval consensus achieved.",
                occurred_at=datetime.now(UTC) - timedelta(days=4),
                recorded_by_id=users_map["reviewer@edrp.org"].id,
            ))

            db.flush()
            create_decision_snapshot(db, d1.id, users_map["admin@edrp.org"].id, reason="Final case file baseline")

        # 8. SAMPLE DECISION 2: In-Review Case
        d2 = db.scalar(select(Decision).where(Decision.title == "Standardize on Managed Amazon EKS vs Google GKE for Multi-Region Deployments"))
        if not d2:
            d2 = Decision(
                owner_id=users_map["employee@edrp.org"].id,
                category_id=cats_map["cloud-infrastructure"].id,
                team_id=team_arch.id,
                approval_workflow_id=wf.id,
                title="Standardize on Managed Amazon EKS vs Google GKE for Multi-Region Deployments",
                problem_statement="Our hybrid infrastructure currently operates heterogeneous Kubernetes clusters across self-hosted hardware and multi-cloud providers. Management overhead has grown to 30% of DevOps bandwidth. We must standardize on a single primary managed container platform.",
                status="in_review",
                implementation_status="not_started",
            )
            db.add(d2)
            db.flush()

            db.add(DecisionTagLink(decision_id=d2.id, tag_id=tags_map["cloud"].id))
            db.add(DecisionTagLink(decision_id=d2.id, tag_id=tags_map["cost-saving"].id))

            alt2_1 = Alternative(decision_id=d2.id, title="Amazon Elastic Kubernetes Service (EKS) on AWS", description="Deploy centralized clusters on AWS EKS utilizing Karpenter for node autoscaling and AWS Secrets Manager integration.", sort_order=1)
            alt2_2 = Alternative(decision_id=d2.id, title="Google Kubernetes Engine (GKE Autopilot)", description="Utilize GKE Autopilot mode for fully automated node provisioning, patching, and multi-cluster ingress.", sort_order=2)
            db.add_all([alt2_1, alt2_2])
            db.flush()

            c2_1 = EvaluationCriterion(decision_id=d2.id, name="Operational Automation & Maintenance", weight=3.0, sort_order=1)
            c2_2 = EvaluationCriterion(decision_id=d2.id, name="Cloud Ecosystem Integration", weight=2.5, sort_order=2)
            db.add_all([c2_1, c2_2])
            db.flush()

            db.add(Approval(decision_id=d2.id, step_order=1, step_name="Peer & Technical Architecture Review", required_role_id=roles_map["reviewer"].id, status="pending"))
            db.add(Approval(decision_id=d2.id, step_order=2, step_name="Executive Management Sign-off", required_role_id=roles_map["manager"].id, status="waiting"))

            create_decision_snapshot(db, d2.id, users_map["employee@edrp.org"].id, reason="Submitted for technical review")

        # 9. SAMPLE DECISION 3: In-Approval Case
        d3 = db.scalar(select(Decision).where(Decision.title == "Enterprise Identity Provider Migration to Okta with FIDO2 MFA"))
        if not d3:
            d3 = Decision(
                owner_id=users_map["employee@edrp.org"].id,
                category_id=cats_map["security-compliance"].id,
                team_id=team_arch.id,
                approval_workflow_id=wf.id,
                title="Enterprise Identity Provider Migration to Okta with FIDO2 MFA",
                problem_statement="Legacy Active Directory federation lacks WebAuthn/FIDO2 hardware token support, failing SOC2 Type II compliance audit criteria. We require a modern cloud Identity Provider with adaptive risk policies.",
                status="in_approval",
                implementation_status="not_started",
            )
            db.add(d3)
            db.flush()

            db.add(DecisionTagLink(decision_id=d3.id, tag_id=tags_map["security"].id))
            db.add(DecisionTagLink(decision_id=d3.id, tag_id=tags_map["compliance"].id))

            alt3_1 = Alternative(decision_id=d3.id, title="Okta Workforce Identity Cloud", description="Cloud-native enterprise IdP with universal directory, adaptive MFA, and SCIM automated provisioning.", sort_order=1, is_selected=True)
            alt3_2 = Alternative(decision_id=d3.id, title="Self-Hosted Keycloak with Hardware Security Module", description="Open-source Keycloak deployment with custom HSM integration for key protection.", sort_order=2)
            db.add_all([alt3_1, alt3_2])
            db.flush()
            d3.selected_alternative_id = alt3_1.id

            db.add(Approval(
                decision_id=d3.id,
                step_order=1,
                step_name="Peer & Technical Architecture Review",
                required_role_id=roles_map["reviewer"].id,
                actor_id=users_map["reviewer@edrp.org"].id,
                status="approved",
                comment="Security review passed. Okta satisfies zero-trust architecture criteria.",
                acted_at=datetime.now(UTC) - timedelta(days=1),
            ))
            db.add(Approval(
                decision_id=d3.id,
                step_order=2,
                step_name="Executive Management Sign-off",
                required_role_id=roles_map["manager"].id,
                status="pending",
            ))

            create_decision_snapshot(db, d3.id, users_map["reviewer@edrp.org"].id, reason="Review passed, awaiting management authorization")

        db.commit()
        print("Database seed completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
