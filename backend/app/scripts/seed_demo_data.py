"""
Final Demo Data Seeder for Expert Decision Replay Platform.
CLI invocation: python -m app.scripts.seed_demo_data

Safe and idempotent:
- Preserves all real user data (e.g. nithin995938@gmail.com, bodigiteja@gmail.com, gorrelasampath@gmail.com)
  and real decisions (IDs 1, 2, 3).
- Reconciles old "Demo" accounts to the 4 final demo accounts:
  1. Nithin Kumar (Employee) - nithin.kumar@example.com
  2. Rahul Sharma (Reviewer) - rahul.sharma@example.com
  3. Priya Reddy (Manager) - priya.reddy@example.com
  4. Arjun Mehta (Administrator) - arjun.mehta@example.com
  Password for all: Demo@123
- Sets up the 3 final teams:
  1. Product Engineering Team (Lead: Priya Reddy, Members: Nithin Kumar, Priya Reddy, Rahul Sharma)
  2. Cloud Infrastructure Team (Lead: Priya Reddy, Members: Priya Reddy, Arjun Mehta)
  3. Security & Compliance Team (Lead: Arjun Mehta, Members: Arjun Mehta, Rahul Sharma)
- Ensures Nithin Kumar belongs to EXACTLY ONE team: Product Engineering Team.
- Sets up 5 coherent decisions across the three teams with alternatives, discussions, documents,
  and approvals.
"""

import os
import sys
import uuid
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
backend_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.core.security import hash_password
from app.core.config import settings

from app.models.role import Role, RoleEnum
from app.models.user import User
from app.models.category import Category
from app.models.tag import Tag, DecisionTag
from app.models.team import Team, TeamMember
from app.models.team_join_request import TeamJoinRequest
from app.models.decision import Decision, DecisionStatusEnum
from app.models.alternative import Alternative
from app.models.discussion import Discussion
from app.models.meeting_note import MeetingNote
from app.models.approval import Approval
from app.models.document import Document
from app.models.notification import Notification, NotificationTypeEnum
from app.models.decision_version import DecisionVersion


def seed_demo_data():
    db: Session = SessionLocal()
    print("================================================================")
    print("      EXPERT DECISION REPLAY PLATFORM - FINAL DEMO SEEDER        ")
    print("================================================================")
    print("Database URL:", settings.DATABASE_URL.split("@")[-1])
    print("Reconciling demo accounts & teams while preserving real data...")

    try:
        now = datetime.now(timezone.utc)
        password_hash = hash_password("Demo@123")

        # -------------------------------------------------------------
        # 1. ROLES LOOKUP
        # -------------------------------------------------------------
        roles = {r.name: r.id for r in db.query(Role).all()}
        admin_role_id = roles.get(RoleEnum.ADMINISTRATOR.value, 4)
        manager_role_id = roles.get(RoleEnum.MANAGER.value, 3)
        reviewer_role_id = roles.get(RoleEnum.REVIEWER.value, 2)
        employee_role_id = roles.get(RoleEnum.EMPLOYEE.value, 1)

        # -------------------------------------------------------------
        # 2. RECONCILE / CREATE FINAL 4 DEMO ACCOUNTS
        # -------------------------------------------------------------
        # Target specifications (NO "Demo" in display names):
        # 1. Nithin Kumar (Employee)
        # 2. Rahul Sharma (Reviewer)
        # 3. Priya Reddy (Manager)
        # 4. Arjun Mehta (Administrator)
        target_accounts = [
            {
                "old_emails": ["nithin.demo@example.com"],
                "email": "nithin.kumar@example.com",
                "full_name": "Nithin Kumar",
                "role_id": employee_role_id,
            },
            {
                "old_emails": ["rahul.demo@example.com"],
                "email": "rahul.sharma@example.com",
                "full_name": "Rahul Sharma",
                "role_id": reviewer_role_id,
            },
            {
                "old_emails": ["priya.demo@example.com"],
                "email": "priya.reddy@example.com",
                "full_name": "Priya Reddy",
                "role_id": manager_role_id,
            },
            {
                "old_emails": ["admin.demo@example.com"],
                "email": "arjun.mehta@example.com",
                "full_name": "Arjun Mehta",
                "role_id": admin_role_id,
            },
        ]

        users_by_email = {}
        for acc in target_accounts:
            # Look up by target email or old email
            user = db.query(User).filter(User.email == acc["email"]).first()
            if not user:
                for old_e in acc["old_emails"]:
                    user = db.query(User).filter(User.email == old_e).first()
                    if user:
                        break

            if user:
                user.email = acc["email"]
                user.full_name = acc["full_name"]
                user.role_id = acc["role_id"]
                user.hashed_password = password_hash
                user.is_active = True
                db.flush()
                print(f"[i] Reconciled user: {user.full_name} ({user.email}) -> Role: {user.role.name}")
            else:
                user = User(
                    email=acc["email"],
                    full_name=acc["full_name"],
                    hashed_password=password_hash,
                    role_id=acc["role_id"],
                    is_active=True,
                    created_at=now - timedelta(days=60),
                    updated_at=now,
                )
                db.add(user)
                db.flush()
                print(f"[+] Created user: {user.full_name} ({user.email}) -> Role: {user.role.name}")

            users_by_email[acc["email"]] = user

        db.commit()

        # -------------------------------------------------------------
        # 3. CATEGORIES SETUP
        # -------------------------------------------------------------
        categories_data = [
            ("Architecture & Infrastructure", "Core backend architecture, microservices, and distributed infrastructure."),
            ("Cloud Infrastructure", "Cloud hosting, scalability, deployment pipelines, and platform operations."),
            ("Security & Compliance", "Zero-trust IAM, cryptographic hardening, RBAC policies, and regulatory compliance."),
            ("Database", "Relational database performance, read replication, connection pooling, and sharding."),
            ("Data & Analytics", "Data warehousing, stream processing, decision intelligence, and enterprise knowledge graphs."),
            ("Product & UX", "Design systems, usability guidelines, and customer experience engineering."),
        ]

        categories_by_name = {}
        for c_name, c_desc in categories_data:
            cat = db.query(Category).filter(Category.name == c_name).first()
            if not cat:
                # Check if there is an existing category to rename/reuse
                if c_name == "Cloud Infrastructure":
                    cat = db.query(Category).filter(Category.name == "Cloud & DevOps").first()
                elif c_name == "Database":
                    cat = db.query(Category).filter(Category.name == "AI & Machine Learning").first()

            if not cat:
                cat = Category(name=c_name, description=c_desc, created_at=now - timedelta(days=90), updated_at=now)
                db.add(cat)
                db.flush()
                print(f"[+] Created category: {cat.name}")
            else:
                cat.name = c_name
                cat.description = c_desc
                db.flush()
                print(f"[i] Reconciled category: {cat.name}")
            categories_by_name[c_name] = cat

        db.commit()

        # -------------------------------------------------------------
        # 4. TAGS SETUP
        # -------------------------------------------------------------
        tags_data = [
            "Scalability",
            "Security",
            "Cost-Optimization",
            "PostgreSQL",
            "FastAPI",
            "React",
            "Zero-Downtime",
            "Kubernetes",
            "Microservices",
            "Database",
        ]

        tags_by_name = {}
        for t_name in tags_data:
            tag = db.query(Tag).filter(Tag.name == t_name).first()
            if not tag:
                tag = Tag(name=t_name, created_at=now - timedelta(days=90))
                db.add(tag)
                db.flush()
                print(f"[+] Created tag: {tag.name}")
            else:
                print(f"[i] Tag exists: {tag.name}")
            tags_by_name[t_name] = tag

        db.commit()

        # -------------------------------------------------------------
        # 5. FINAL TEAMS SETUP & ROSTER RECONCILIATION
        # -------------------------------------------------------------
        # 1. Product Engineering Team (Lead: Priya Reddy, Members: Nithin Kumar, Priya Reddy, Rahul Sharma)
        # 2. Cloud Infrastructure Team (Lead: Priya Reddy, Members: Priya Reddy, Arjun Mehta)
        # 3. Security & Compliance Team (Lead: Arjun Mehta, Members: Arjun Mehta, Rahul Sharma)
        # NOTE: Nithin Kumar MUST belong to EXACTLY ONE team: Product Engineering Team.

        teams_spec = [
            {
                "target_name": "Product Engineering Team",
                "old_names": ["Core Platform Engineering", "Platform Squad"],
                "description": "Product development, engineering decisions and technical delivery.",
                "purpose": "Deliver resilient, high-quality user-facing features and technical services.",
                "lead_email": "priya.reddy@example.com",
                "creator_email": "priya.reddy@example.com",
                "members": [
                    ("nithin.kumar@example.com", "Member"),
                    ("priya.reddy@example.com", "Lead"),
                    ("rahul.sharma@example.com", "Member"),
                ]
            },
            {
                "target_name": "Cloud Infrastructure Team",
                "old_names": ["Cloud & Security Infrastructure"],
                "description": "Cloud infrastructure, scalability, deployment and platform operations.",
                "purpose": "Ensure high availability, multi-region resilience, and continuous deployment.",
                "lead_email": "priya.reddy@example.com",
                "creator_email": "priya.reddy@example.com",
                "members": [
                    ("priya.reddy@example.com", "Lead"),
                    ("arjun.mehta@example.com", "Member"),
                ]
            },
            {
                "target_name": "Security & Compliance Team",
                "old_names": ["Data & Analytics Squad"],
                "description": "Security, identity, governance and compliance decisions.",
                "purpose": "Protect enterprise data, enforce zero-trust identity, and maintain SOC 2 compliance.",
                "lead_email": "arjun.mehta@example.com",
                "creator_email": "arjun.mehta@example.com",
                "members": [
                    ("arjun.mehta@example.com", "Lead"),
                    ("rahul.sharma@example.com", "Member"),
                ]
            }
        ]

        teams_by_name = {}
        for t_spec in teams_spec:
            team = db.query(Team).filter(Team.name == t_spec["target_name"]).first()
            if not team:
                for old_t in t_spec["old_names"]:
                    team = db.query(Team).filter(Team.name == old_t).first()
                    if team:
                        break

            lead_user = users_by_email[t_spec["lead_email"]]

            if not team:
                team = Team(
                    name=t_spec["target_name"],
                    description=t_spec["description"],
                    created_by=lead_user.id,
                    created_at=now - timedelta(days=50),
                    updated_at=now,
                )
                db.add(team)
                db.flush()
                print(f"[+] Created team: {team.name}")
            else:
                team.name = t_spec["target_name"]
                team.description = t_spec["description"]
                team.created_by = lead_user.id
                db.flush()
                print(f"[i] Reconciled team: {team.name}")

            teams_by_name[t_spec["target_name"]] = team

            # Sync members strictly according to specification
            desired_user_ids = {users_by_email[m_email].id: m_role for m_email, m_role in t_spec["members"]}

            # Remove members not in desired roster (especially keeping Nithin Kumar in Product Engineering ONLY)
            existing_members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
            for em in existing_members:
                if em.user_id not in desired_user_ids:
                    # Do not remove real existing users (IDs 1, 2, 3) unless they conflict
                    if em.user_id in [1, 2, 3]:
                        continue
                    db.delete(em)
                    print(f"    [-] Removed user ID {em.user_id} from {team.name}")

            # Ensure desired members are added / updated
            for m_email, m_role in t_spec["members"]:
                u_obj = users_by_email[m_email]
                mem = db.query(TeamMember).filter(
                    TeamMember.team_id == team.id,
                    TeamMember.user_id == u_obj.id
                ).first()
                if not mem:
                    mem = TeamMember(
                        team_id=team.id,
                        user_id=u_obj.id,
                        role=m_role,
                        joined_at=now - timedelta(days=30),
                    )
                    db.add(mem)
                    print(f"    [+] Enrolled {u_obj.full_name} ({m_role}) in {team.name}")
                else:
                    mem.role = m_role

        db.commit()

        # Extra sanity check: Verify Nithin Kumar belongs to EXACTLY ONE team
        nithin_user = users_by_email["nithin.kumar@example.com"]
        prod_team = teams_by_name["Product Engineering Team"]
        other_memberships = db.query(TeamMember).filter(
            TeamMember.user_id == nithin_user.id,
            TeamMember.team_id != prod_team.id
        ).all()
        for om in other_memberships:
            db.delete(om)
            print(f"[!] Purged non-permitted team membership for Nithin Kumar in Team ID {om.team_id}")
        db.commit()

        # -------------------------------------------------------------
        # 6. RECONCILE / CLEANUP JOIN REQUESTS
        # -------------------------------------------------------------
        # Ensure clean state: Priya and Rahul requests resolved
        # Let's add 1 clean pending join request from an employee requesting to join Cloud Infrastructure Team
        cloud_team = teams_by_name["Cloud Infrastructure Team"]
        db.query(TeamJoinRequest).filter(
            TeamJoinRequest.user_id.in_([u.id for u in users_by_email.values()])
        ).delete(synchronize_session=False)

        # 1 clean pending join request for Priya Reddy or Arjun Mehta to review:
        # Nithin Kumar requesting to join Cloud Infrastructure Team as an evaluation request
        req1 = TeamJoinRequest(
            team_id=cloud_team.id,
            user_id=nithin_user.id,
            status="PENDING",
            message="I would like to join Cloud Infrastructure to help automate deployment telemetry.",
            created_at=now - timedelta(days=1),
        )
        db.add(req1)
        db.commit()
        print("[+] Created 1 pending join request for Cloud Infrastructure Team review")

        # -------------------------------------------------------------
        # 7. FIVE COHERENT ENTERPRISE DECISIONS
        # -------------------------------------------------------------
        # 1. Migration of Monolithic Backend to Event-Driven Microservices (Product Engineering Team, Approved)
        # 2. Cloud Infrastructure Scaling Strategy (Cloud Infrastructure Team, Approved)
        # 3. Zero-Trust IAM Authentication Hardening (Security & Compliance Team, Approved)
        # 4. PostgreSQL Read Replica Strategy (Product Engineering Team, Under Review - ready for Reviewer Rahul Sharma!)
        # 5. Enterprise Knowledge Graph Indexing (Product Engineering Team, Approved)

        nithin_user = users_by_email["nithin.kumar@example.com"]
        rahul_user = users_by_email["rahul.sharma@example.com"]
        priya_user = users_by_email["priya.reddy@example.com"]
        arjun_user = users_by_email["arjun.mehta@example.com"]

        decisions_specs = [
            {
                "id_target": 4,
                "title": "Migration of Monolithic Backend to Event-Driven Microservices",
                "problem_statement": "The legacy monolithic service suffers from tight coupling, slow build cycles, and connection pooling bottlenecks during peak traffic periods.",
                "context": "Platform volume has grown 400% YoY. The engineering organization requires decentralized squad ownership and independent service scaling.",
                "decision_taken": "Adopt FastAPI async microservices communicating over Redis Streams and RabbitMQ with automated OpenAPI schema contracts.",
                "reasoning": "FastAPI delivers native async/await performance, automatic schema validation, and Pythonic ergonomics suitable for rapid feature rollout.",
                "expected_outcome": "P99 latency under 80ms, 99.99% uptime, and zero-downtime rolling deployments.",
                "actual_outcome": "P99 latency decreased by 62%, deployment cadence increased from bi-weekly to multiple independent deployments daily.",
                "status": DecisionStatusEnum.APPROVED.value,
                "category_name": "Architecture & Infrastructure",
                "team_name": "Product Engineering Team",
                "creator": nithin_user,
                "tags": ["Scalability", "FastAPI", "Zero-Downtime", "Microservices"],
                "alternatives": [
                    {
                        "name": "FastAPI Async Microservices Architecture",
                        "description": "Decentralized async microservices leveraging ASGI, Pydantic validation, and Redis Streams messaging.",
                        "pros": "High concurrent throughput, native asynchronous I/O, automated OpenAPI documentation, rapid development cycle.",
                        "cons": "Requires event broker orchestration and distributed tracing instrumentation.",
                        "cost": "Medium",
                        "feasibility": "High",
                        "risk_assessment": "Low risk; extensive team expertise in Python and async paradigms.",
                        "is_selected": True,
                    },
                    {
                        "name": "Modular Monolith in Django",
                        "description": "Refactor monolithic codebase into decoupled internal Django apps sharing a single database.",
                        "pros": "Simplified deployment pipeline, built-in admin dashboard and ORM.",
                        "cons": "Persistent global database locks, synchronous I/O blocking, vertical scaling bottlenecks.",
                        "cost": "Low",
                        "feasibility": "High",
                        "risk_assessment": "Medium risk; does not solve long-term multi-squad deployment contention.",
                        "is_selected": False,
                    },
                    {
                        "name": "Serverless Functions (AWS Lambda)",
                        "description": "Deconstruct endpoints into individual serverless functions managed via AWS SAM.",
                        "pros": "Zero idle infrastructure costs, automatic vendor autoscaling.",
                        "cons": "Unpredictable cold-start latency spikes, vendor lock-in, complex local testing.",
                        "cost": "High at scale",
                        "feasibility": "Medium",
                        "risk_assessment": "High risk due to strict sub-100ms latency SLAs for enterprise clients.",
                        "is_selected": False,
                    }
                ],
                "discussions": [
                    (rahul_user, "Have we benchmarked Redis Streams versus Apache Kafka for our target message throughput?"),
                    (nithin_user, "Yes. For our workload (<50,000 events/sec), Redis Streams maintains sub-5ms delivery latency with significantly lower operational footprint. We can bridge to Kafka as volume expands."),
                    (priya_user, "Load testing on staging demonstrated zero connection exhaustion with asyncpg connection pooling under 10,000 concurrent requests."),
                ],
                "meeting_note": {
                    "title": "Architecture Review Board: Microservices Consensus",
                    "notes": "Reviewed load test results and OpenAPI contracts. The committee unanimously ratified the FastAPI microservices roadmap. Migration starts with identity and decision ingestion pipelines.",
                    "author": nithin_user
                },
                "approval": {
                    "reviewer": rahul_user,
                    "action": "APPROVED",
                    "comment": "Exceptional architectural rigor, load test benchmarks, and clear fallback plans. Approved for production implementation."
                },
                "document": {
                    "filename": "FastAPI_Architecture_Blueprint.pdf",
                    "content": "Enterprise Blueprint: Event-Driven FastAPI Microservices Architecture with Redis Streams, OpenAPI specifications, and distributed tracing topology."
                }
            },
            {
                "id_target": 8,
                "title": "Cloud Infrastructure Scaling Strategy",
                "problem_statement": "Single-zone container deployments present availability risks during cloud provider maintenance and burst traffic.",
                "context": "Preparation for enterprise multi-region expansion requiring continuous delivery with zero customer disruption.",
                "decision_taken": "Deploy multi-region Kubernetes clusters with automated Horizontal Pod Autoscaling (HPA) and ArgoCD GitOps pipelines.",
                "reasoning": "Declarative GitOps enables audit-logged releases and instant automated rollbacks upon metric degradation across all regions.",
                "expected_outcome": "100% zero-downtime deployments with sub-5-second rollback capability.",
                "actual_outcome": "Multi-region cluster active in production across 2 regions with automated traffic failover.",
                "status": DecisionStatusEnum.APPROVED.value,
                "category_name": "Cloud Infrastructure",
                "team_name": "Cloud Infrastructure Team",
                "creator": priya_user,
                "tags": ["Kubernetes", "Zero-Downtime", "Cost-Optimization", "Cloud"],
                "alternatives": [
                    {
                        "name": "Multi-Region Kubernetes with ArgoCD GitOps",
                        "description": "Declarative GitOps rollouts utilizing Argo Rollouts CRDs and Prometheus latency gates.",
                        "pros": "Native Kubernetes CRDs, declarative Git-driven audit trail, automated canary analysis.",
                        "cons": "Requires disciplined Git branch hygiene across environments.",
                        "cost": "Medium",
                        "feasibility": "High",
                        "risk_assessment": "Low risk; industry standard for modern cloud resilience.",
                        "is_selected": True,
                    },
                    {
                        "name": "Single-Region Vertical Scaling with AWS EC2 Metal",
                        "description": "Scale existing single-region instances to largest bare-metal compute shapes.",
                        "pros": "No multi-region data replication complexity.",
                        "cons": "Single point of failure for regional outages, extremely expensive idle costs.",
                        "cost": "High",
                        "feasibility": "Medium",
                        "risk_assessment": "High risk; fails disaster recovery SLAs.",
                        "is_selected": False,
                    }
                ],
                "discussions": [
                    (arjun_user, "ArgoCD synchronization health checks verified on staging. Canary rollbacks tested successfully within 4 seconds."),
                    (priya_user, "Production failover drill scheduled for Sunday midnight with simulated regional outage."),
                ],
                "meeting_note": {
                    "title": "Cloud Architecture Review: Multi-Region Resilience",
                    "notes": "Reviewed cluster topologies and disaster recovery objectives. Approved multi-region ArgoCD deployment roadmap.",
                    "author": priya_user
                },
                "approval": {
                    "reviewer": arjun_user,
                    "action": "APPROVED",
                    "comment": "Architecture meets all high-availability SLAs and compliance standards."
                },
                "document": {
                    "filename": "Cloud_Infrastructure_Scaling_Blueprint.pdf",
                    "content": "Enterprise Cloud Infrastructure Blueprint: Multi-Region Kubernetes Topology with Automated Horizontal Pod Autoscaling."
                }
            },
            {
                "id_target": 5,
                "title": "Zero-Trust IAM Authentication Hardening",
                "problem_statement": "Legacy session cookies were vulnerable to CSRF and lacked granular permission claims required for multi-tenant squad isolation.",
                "context": "SOC 2 Type II audit requirement for cryptographic claim verification and auditable session revocation across distributed microservices.",
                "decision_taken": "Deploy dual-token RS256 JWT authentication with rotating refresh tokens and automated Redis blocklists.",
                "reasoning": "Stateless verification in edge gateways with cryptographic signing provides instant RBAC validation without database roundtrips.",
                "expected_outcome": "Complete audit compliance, sub-millisecond token verification, and automated session revocation.",
                "actual_outcome": "Successfully passed external security audit with zero critical or high findings.",
                "status": DecisionStatusEnum.APPROVED.value,
                "category_name": "Security & Compliance",
                "team_name": "Security & Compliance Team",
                "creator": arjun_user,
                "tags": ["Security", "FastAPI"],
                "alternatives": [
                    {
                        "name": "Dual RS256 JWT with Refresh Token Rotation",
                        "description": "Short-lived 15-minute access tokens paired with single-use rotating refresh tokens and Redis revocation lists.",
                        "pros": "Stateless edge validation, cryptographic verification, fast revocation checks via memory cache.",
                        "cons": "Requires public/private key pair rotation management.",
                        "cost": "Low",
                        "feasibility": "High",
                        "risk_assessment": "Low risk; standard industry best practice for SOC 2 Type II.",
                        "is_selected": True,
                    },
                    {
                        "name": "Third-Party Identity Provider (Auth0 / Okta)",
                        "description": "Outsource authentication, user management, and token issuing to a commercial IDaaS vendor.",
                        "pros": "Turnkey enterprise SAML/SSO connectors, hosted login widget.",
                        "cons": "High monthly per-seat licensing cost, third-party operational dependency.",
                        "cost": "High",
                        "feasibility": "High",
                        "risk_assessment": "Medium risk; recurring subscription costs grow exponentially with active users.",
                        "is_selected": False,
                    },
                    {
                        "name": "Stateful Session Tokens in Redis",
                        "description": "Store all session metadata in Redis clusters and query on every inbound HTTP request.",
                        "pros": "Immediate server-side revocation capability without token expiration lag.",
                        "cons": "Creates single point of failure; Redis outage blocks all authenticated traffic.",
                        "cost": "Medium",
                        "feasibility": "High",
                        "risk_assessment": "High risk due to availability coupling on cache cluster.",
                        "is_selected": False,
                    }
                ],
                "discussions": [
                    (rahul_user, "What is the token expiration window and leeway for clock drift?"),
                    (arjun_user, "Access tokens expire in 15 minutes with a 30-second clock skew tolerance. Refresh tokens last 7 days with single-use invalidation."),
                ],
                "meeting_note": {
                    "title": "Security Council Sign-off",
                    "notes": "Reviewed token rotation algorithm, rate limiting thresholds, and key rotation protocols. Approved for production rollout.",
                    "author": arjun_user
                },
                "approval": {
                    "reviewer": arjun_user,
                    "action": "APPROVED",
                    "comment": "Meets all SOC 2 compliance standards and zero-trust identity specifications."
                },
                "document": {
                    "filename": "Zero_Trust_IAM_Specification.pdf",
                    "content": "Enterprise Security Specification: Cryptographic Token Rotation, RBAC scopes, and Automated Session Revocation Protocols."
                }
            },
            {
                "id_target": 6,
                "title": "PostgreSQL Read Replica Strategy",
                "problem_statement": "Primary PostgreSQL node read I/O operations have reached 82% capacity during peak business hours.",
                "context": "Decision history query volume increased due to organizational replay analytics and multi-tenant telemetry dashboards.",
                "decision_taken": "Deploy streaming asynchronous read replicas with pgpool-II load balancing and connection pooling.",
                "reasoning": "Read-heavy decision replay queries can be served entirely from replicas without risking primary write lock contention.",
                "expected_outcome": "Reduce primary CPU utilization to <35% and support 10x read scaling.",
                "actual_outcome": "Pending final review by Reviewer Rahul Sharma before production rollout.",
                "status": DecisionStatusEnum.UNDER_REVIEW.value,
                "category_name": "Database",
                "team_name": "Product Engineering Team",
                "creator": nithin_user,
                "tags": ["Scalability", "PostgreSQL", "Database", "Cost-Optimization"],
                "alternatives": [
                    {
                        "name": "PostgreSQL Read Replicas with pgpool-II",
                        "description": "Deploy two streaming asynchronous read replicas with connection pooling and automated read-write splitting via pgpool-II.",
                        "pros": "Cost-effective, native replication, minimal application code changes.",
                        "cons": "Replication lag potential under heavy write bursts (monitored <25ms).",
                        "cost": "Medium",
                        "feasibility": "High",
                        "risk_assessment": "Low risk; battle-tested architecture.",
                        "is_selected": True,
                    },
                    {
                        "name": "Migration to Google Cloud Spanner",
                        "description": "Migrate relational database to managed Google Cloud Spanner for globally distributed horizontal scalability.",
                        "pros": "Unlimited horizontal scale, multi-region synchronous replication.",
                        "cons": "Massive refactor of SQLAlchemy models, proprietary query semantics, and substantial continuous cost.",
                        "cost": "Very High",
                        "feasibility": "Low",
                        "risk_assessment": "High risk; major disruption to current development velocity.",
                        "is_selected": False,
                    }
                ],
                "discussions": [
                    (nithin_user, "Submitted this strategy for formal review. Replicas show lag under 12ms during simulated load."),
                    (rahul_user, "Reviewing connection pooling failover timeouts. Benchmarks look promising."),
                ],
                "meeting_note": {
                    "title": "Database Performance Review",
                    "notes": "Discussed failover mechanisms and read-write splitting. Submitted for Reviewer sign-off.",
                    "author": nithin_user
                },
                "document": {
                    "filename": "PostgreSQL_Replication_Plan.pdf",
                    "content": "PostgreSQL High Availability and Streaming Read Replication Blueprint with pgpool-II load balancing."
                }
            },
            {
                "id_target": 7,
                "title": "Enterprise Knowledge Graph Indexing",
                "problem_statement": "Cross-functional squads struggled to discover prior architectural decisions, resulting in duplicate research and inconsistent patterns.",
                "context": "Squads frequently re-evaluate technical questions previously decided by peer teams without understanding historical context or trade-offs.",
                "decision_taken": "Implement an interconnected knowledge graph projection linking Decisions, Categories, Teams, Alternatives, and Documents directly from database relationships.",
                "reasoning": "Visual relational exploration enables developers and engineering leaders to trace decision lineages, uncover dependencies, and prevent duplicate work.",
                "expected_outcome": "Cut architectural redundancy by 50% and accelerate new engineer onboarding.",
                "actual_outcome": "Knowledge repository search efficiency and discoverability increased by 75% across engineering teams.",
                "status": DecisionStatusEnum.APPROVED.value,
                "category_name": "Data & Analytics",
                "team_name": "Product Engineering Team",
                "creator": rahul_user,
                "tags": ["PostgreSQL", "React", "Scalability"],
                "alternatives": [
                    {
                        "name": "Relational SQL-Driven Graph Projection with D3/SVG Frontend",
                        "description": "Direct foreign-key graph projection served from PostgreSQL without requiring an external graph database.",
                        "pros": "Zero additional infrastructure overhead, real-time consistency, instant deployment.",
                        "cons": "Graph traversal depth best suited for 3-4 relationship hops.",
                        "cost": "Low",
                        "feasibility": "High",
                        "risk_assessment": "Low risk; leverages existing verified schema.",
                        "is_selected": True,
                    },
                    {
                        "name": "Dedicated Neo4j Graph Database Cluster",
                        "description": "Provision and synchronize a dedicated Neo4j instance with CDC streaming pipelines.",
                        "pros": "Deep multi-hop Cypher queries and native graph algorithms.",
                        "cons": "Requires ongoing cluster maintenance, backup pipelines, and dual-write consistency management.",
                        "cost": "High",
                        "feasibility": "Medium",
                        "risk_assessment": "Medium risk due to data sync drift and infrastructure complexity.",
                        "is_selected": False,
                    }
                ],
                "discussions": [
                    (rahul_user, "By utilizing PostgreSQL foreign keys, the graph response executes in under 15ms with full relational consistency."),
                    (nithin_user, "The interactive visualization in Knowledge Repository makes exploring cross-team decisions effortless."),
                ],
                "approval": {
                    "reviewer": arjun_user,
                    "action": "APPROVED",
                    "comment": "Outstanding approach. Delivers immediate enterprise discoverability with zero added infrastructure maintenance."
                },
                "document": {
                    "filename": "Knowledge_Graph_Specification.pdf",
                    "content": "Technical Specification: Decision Lineage Knowledge Graph Projection and Cross-Domain Visual Traversal."
                }
            }
        ]

        for d_spec in decisions_specs:
            cat = categories_by_name[d_spec["category_name"]]
            team = teams_by_name[d_spec["team_name"]]
            creator = d_spec["creator"]

            decision = None
            if "id_target" in d_spec:
                decision = db.query(Decision).filter(Decision.id == d_spec["id_target"]).first()
            if not decision:
                decision = db.query(Decision).filter(Decision.title == d_spec["title"]).first()

            if not decision:
                decision = Decision(
                    title=d_spec["title"],
                    problem_statement=d_spec["problem_statement"],
                    context=d_spec["context"],
                    decision_taken=d_spec["decision_taken"],
                    reasoning=d_spec["reasoning"],
                    expected_outcome=d_spec["expected_outcome"],
                    actual_outcome=d_spec.get("actual_outcome"),
                    status=d_spec["status"],
                    category_id=cat.id,
                    team_id=team.id,
                    created_by=creator.id,
                    created_at=now - timedelta(days=20),
                    updated_at=now,
                )
                db.add(decision)
                db.flush()
                print(f"[+] Created decision: '{decision.title}' ({decision.status})")
            else:
                decision.title = d_spec["title"]
                decision.problem_statement = d_spec["problem_statement"]
                decision.context = d_spec["context"]
                decision.decision_taken = d_spec["decision_taken"]
                decision.reasoning = d_spec["reasoning"]
                decision.expected_outcome = d_spec["expected_outcome"]
                decision.actual_outcome = d_spec.get("actual_outcome")
                decision.category_id = cat.id
                decision.team_id = team.id
                decision.status = d_spec["status"]
                decision.created_by = creator.id
                db.flush()
                print(f"[i] Reconciled decision: '{decision.title}' (ID {decision.id})")

            # Sync Tags
            for tag_name in d_spec.get("tags", []):
                t_obj = tags_by_name.get(tag_name)
                if t_obj:
                    dt_exist = db.query(DecisionTag).filter(
                        DecisionTag.decision_id == decision.id,
                        DecisionTag.tag_id == t_obj.id
                    ).first()
                    if not dt_exist:
                        dt = DecisionTag(decision_id=decision.id, tag_id=t_obj.id)
                        db.add(dt)

            # Sync Alternatives
            for alt_spec in d_spec.get("alternatives", []):
                alt = db.query(Alternative).filter(
                    Alternative.decision_id == decision.id,
                    Alternative.name == alt_spec["name"]
                ).first()
                if not alt:
                    alt = Alternative(
                        decision_id=decision.id,
                        name=alt_spec["name"],
                        description=alt_spec["description"],
                        pros=alt_spec["pros"],
                        cons=alt_spec["cons"],
                        cost=alt_spec.get("cost"),
                        feasibility=alt_spec.get("feasibility"),
                        risk_assessment=alt_spec.get("risk_assessment"),
                        is_selected=alt_spec["is_selected"],
                        created_at=decision.created_at,
                        updated_at=decision.updated_at,
                    )
                    db.add(alt)
                else:
                    alt.is_selected = alt_spec["is_selected"]
                    alt.pros = alt_spec["pros"]
                    alt.cons = alt_spec["cons"]

            # Sync Discussions
            for d_user, content in d_spec.get("discussions", []):
                disc = db.query(Discussion).filter(
                    Discussion.decision_id == decision.id,
                    Discussion.user_id == d_user.id,
                    Discussion.content == content
                ).first()
                if not disc:
                    disc = Discussion(
                        decision_id=decision.id,
                        user_id=d_user.id,
                        content=content,
                        created_at=decision.created_at + timedelta(hours=2),
                        updated_at=decision.created_at + timedelta(hours=2),
                    )
                    db.add(disc)

            # Sync Meeting Note
            if "meeting_note" in d_spec:
                mn_spec = d_spec["meeting_note"]
                mn_author = mn_spec["author"]
                mn = db.query(MeetingNote).filter(
                    MeetingNote.decision_id == decision.id,
                    MeetingNote.title == mn_spec["title"]
                ).first()
                if not mn:
                    mn = MeetingNote(
                        decision_id=decision.id,
                        title=mn_spec["title"],
                        notes=mn_spec["notes"],
                        meeting_date=decision.created_at + timedelta(days=1),
                        created_by=mn_author.id,
                        created_at=decision.created_at + timedelta(days=1),
                        updated_at=decision.created_at + timedelta(days=1),
                    )
                    db.add(mn)

            # Sync Approval
            if "approval" in d_spec:
                appr_spec = d_spec["approval"]
                appr_reviewer = appr_spec["reviewer"]
                appr = db.query(Approval).filter(
                    Approval.decision_id == decision.id,
                    Approval.reviewer_id == appr_reviewer.id,
                    Approval.action == appr_spec["action"]
                ).first()
                if not appr:
                    appr = Approval(
                        decision_id=decision.id,
                        reviewer_id=appr_reviewer.id,
                        action=appr_spec["action"],
                        previous_status=DecisionStatusEnum.UNDER_REVIEW.value,
                        new_status=DecisionStatusEnum.APPROVED.value,
                        comment=appr_spec.get("comment"),
                        created_at=decision.created_at + timedelta(days=2),
                    )
                    db.add(appr)

            # Sync Document
            if "document" in d_spec:
                doc_spec = d_spec["document"]
                existing_doc = db.query(Document).filter(
                    Document.decision_id == decision.id,
                    Document.original_filename == doc_spec["filename"]
                ).first()
                if not existing_doc:
                    storage_dir = os.path.join(os.getcwd(), settings.UPLOAD_DIR, "decisions", str(decision.id))
                    os.makedirs(storage_dir, exist_ok=True)
                    stored_name = f"{uuid.uuid4().hex}.pdf"
                    abs_path = os.path.join(storage_dir, stored_name)
                    with open(abs_path, "wb") as f_out:
                        f_out.write(doc_spec["content"].encode("utf-8"))

                    rel_path = os.path.join("decisions", str(decision.id), stored_name).replace("\\", "/")
                    new_doc = Document(
                        decision_id=decision.id,
                        original_filename=doc_spec["filename"],
                        stored_filename=stored_name,
                        file_path=rel_path,
                        content_type="application/pdf",
                        file_size=len(doc_spec["content"]),
                        uploaded_by=creator.id,
                        created_at=decision.created_at,
                    )
                    db.add(new_doc)
                    print(f"    [+] Created document attachment: {doc_spec['filename']}")

        db.commit()

        # -------------------------------------------------------------
        # 8. NOTIFICATIONS SETUP
        # -------------------------------------------------------------
        notif_specs = [
            (
                nithin_user.id,
                NotificationTypeEnum.DECISION_APPROVED.value,
                "Decision Approved",
                "Your decision 'Migration of Monolithic Backend to Event-Driven Microservices' has been approved."
            ),
            (
                rahul_user.id,
                NotificationTypeEnum.DECISION_SUBMITTED.value,
                "Decision Pending Review",
                "Nithin Kumar has submitted 'PostgreSQL Read Replica Strategy' for your architectural review."
            ),
            (
                priya_user.id,
                NotificationTypeEnum.TEAM_JOIN_REQUESTED.value,
                "New Team Join Request",
                "Nithin Kumar requested to join team 'Cloud Infrastructure Team'."
            ),
            (
                arjun_user.id,
                NotificationTypeEnum.DECISION_APPROVED.value,
                "Security Policy Approved",
                "Zero-Trust IAM Authentication Hardening specification ratified."
            ),
        ]

        for u_id, n_type, n_title, n_msg in notif_specs:
            exist_n = db.query(Notification).filter(
                Notification.recipient_id == u_id,
                Notification.title == n_title,
                Notification.message == n_msg
            ).first()
            if not exist_n:
                db.add(Notification(
                    recipient_id=u_id,
                    notification_type=n_type,
                    title=n_title,
                    message=n_msg,
                    is_read=False,
                    created_at=now - timedelta(hours=3)
                ))

        db.commit()

        # Print summary report
        total_users = db.query(User).count()
        total_teams = db.query(Team).count()
        total_decisions = db.query(Decision).count()
        total_cats = db.query(Category).count()
        total_tags = db.query(Tag).count()

        print("================================================================")
        print("           FINAL DEMO SEEDING COMPLETED SUCCESSFULLY             ")
        print("================================================================")
        print(f"Total Users in DB:      {total_users}")
        print(f"Total Teams in DB:      {total_teams}")
        print(f"Total Decisions in DB:  {total_decisions}")
        print(f"Total Categories in DB: {total_cats}")
        print(f"Total Tags in DB:       {total_tags}")
        print("----------------------------------------------------------------")
        print("Final Demo Accounts (Password: Demo@123):")
        print("  - EMPLOYEE:      Nithin Kumar   (nithin.kumar@example.com)")
        print("  - REVIEWER:      Rahul Sharma   (rahul.sharma@example.com)")
        print("  - MANAGER:       Priya Reddy    (priya.reddy@example.com)")
        print("  - ADMINISTRATOR: Arjun Mehta    (arjun.mehta@example.com)")
        print("----------------------------------------------------------------")
        print("Nithin Kumar Team Membership:")
        n_teams = [m.team.name for m in db.query(TeamMember).filter(TeamMember.user_id == nithin_user.id).all()]
        print(f"  {nithin_user.full_name} is enrolled in: {n_teams}")
        print("================================================================")

    except Exception as exc:
        db.rollback()
        print(f"[!] Error seeding demo data: {exc}")
        raise exc
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
