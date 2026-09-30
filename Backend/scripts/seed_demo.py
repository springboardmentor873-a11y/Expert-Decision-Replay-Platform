"""
Development-only demo data.

Run from backend/:

    python -m scripts.seed_demo

Creates the 5 demo teams and their demo members (plus an unassigned demo user
for testing the "Request to Join a Team" flow) using REAL database records.

Safety rules enforced here:
  - Teams are keyed by name, users by email: if an entry already exists it is
    left completely untouched (existing users are NEVER reassigned).
  - Only the demo emails below are ever created — real users are never modified.
  - All demo accounts share one clearly-marked development password
    (Demo@1234). Do NOT reuse real credentials.
"""
import asyncio
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal, engine
from app.core.security import hash_password
from app.models.decision import Decision, DecisionStatus
from app.models.repository_document import RepositoryDocument
from app.models.team import Team
from app.models.user import User, UserRole

DEMO_PASSWORD = "Demo@1234"

# Promotion within each team for a bit of realism: entry 0 becomes a Reviewer.
_roles = (UserRole.REVIEWER,) + (UserRole.EMPLOYEE,) * 4

teams_data = [
    {
        "name": "AI & Machine Learning",
        "description": "Builds and operates the platform's ML models and AI features.",
        "members": [
            "Arjun Sharma",
            "Priya Singh",
            "Rahul Verma",
            "Neha Gupta",
            "Amit Kumar",
        ],
    },
    {
        "name": "Software Development",
        "description": "Designs, builds, and ships the core application.",
        "members": [
            "Rohit Sharma",
            "Ananya Singh",
            "Karan Verma",
            "Sneha Patel",
            "Vivek Kumar",
        ],
    },
    {
        "name": "Data Science",
        "description": "Explores data, build dashboards, and supports decision analytics.",
        "members": [
            "Aditya Gupta",
            "Simran Kaur",
            "Nikhil Sharma",
            "Pooja Verma",
            "Rohan Singh",
        ],
    },
    {
        "name": "Cyber Security",
        "description": "Keeps the organization, infrastructure, and user data secure.",
        "members": [
            "Akash Kumar",
            "Meera Singh",
            "Varun Gupta",
            "Tanya Sharma",
            "Manish Verma",
        ],
    },
    {
        "name": "Research & Innovation",
        "description": "Explores new product ideas and early-stage experiments.",
        "members": [
            "Aryan Singh",
            "Isha Gupta",
            "Dev Kumar",
            "Riya Sharma",
            "Mohit Verma",
        ],
    },
]

# A Manager/Administrator who can review join requests, and an unassigned user
# who can exercise the "Request to Join a Team" flow end to end.
demo_admin = {"full_name": "Demo Administrator", "email": "demo.admin@example.com"}
demo_newhire = {"full_name": "Demo New Hire", "email": "demo.newhire@example.com"}

# --- Knowledge Repository demo documents -------------------------------------
# Read-only curated documents for the Repository. Each entry picks an uploader
# by index into its team's member list and uploads a tiny demo copy to disk so
# the View/Download flow can be exercised. `days_ago` staggers created_at so the
# "Recently Added" summary card reflects a realistic window.
documents_data = [
    {
        "title": "AI Model Evaluation Report.pdf",
        "description": "Evaluation results for the platform's latest recommendation model, including accuracy benchmarks and edge-case behaviour.",
        "team": "AI & Machine Learning",
        "tags": ["AI", "Evaluation", "Research"],
        "file_type": "pdf",
        "days_ago": 2,
        "uploader_index": 0,
        "decision": "AI Model Evaluation Decision",
    },
    {
        "title": "Database Architecture.docx",
        "description": "Architecture notes for the decision replay data layer, covering schema, migrations, and indexing strategy.",
        "team": "Software Development",
        "tags": ["Database", "Architecture", "Technical"],
        "file_type": "docx",
        "days_ago": 9,
        "uploader_index": 1,
        "decision": "Database Platform Review",
    },
    {
        "title": "Project Requirements.pdf",
        "description": "Captured requirements for the current quarter's delivery commitments.",
        "team": "Software Development",
        "tags": ["Requirements", "Planning"],
        "file_type": "pdf",
        "days_ago": 16,
        "uploader_index": 3,
        "decision": None,
    },
    {
        "title": "Data Analysis Guidelines.pdf",
        "description": "Standard operating guidelines for producing and reviewing data analyses.",
        "team": "Data Science",
        "tags": ["Data", "Analytics", "Guidelines"],
        "file_type": "pdf",
        "days_ago": 12,
        "uploader_index": 0,
        "decision": "Analytics Tooling Decision",
    },
    {
        "title": "Cyber Security Policy.pdf",
        "description": "Organisation-wide security policy covering access control, acceptable use, and incident handling.",
        "team": "Cyber Security",
        "tags": ["Security", "Policy", "Compliance"],
        "file_type": "pdf",
        "days_ago": 20,
        "uploader_index": 1,
        "decision": "Security Policy Refresh",
    },
    {
        "title": "ML Model Deployment Guide.pdf",
        "description": "Step-by-step guide for taking ML models from experimentation to production safely.",
        "team": "AI & Machine Learning",
        "tags": ["ML", "Deployment", "Engineering"],
        "file_type": "pdf",
        "days_ago": 4,
        "uploader_index": 2,
        "decision": None,
    },
    {
        "title": "Research Methodology.pdf",
        "description": "Shared research methodology framework used across innovation experiments.",
        "team": "Research & Innovation",
        "tags": ["Research", "Methodology"],
        "file_type": "pdf",
        "days_ago": 14,
        "uploader_index": 0,
        "decision": "Research Investment Decision",
    },
    {
        "title": "API Development Guide.docx",
        "description": "Conventions and patterns for building and versioning REST endpoints.",
        "team": "Software Development",
        "tags": ["API", "Backend", "Development"],
        "file_type": "docx",
        "days_ago": 8,
        "uploader_index": 2,
        "decision": None,
    },
    {
        "title": "Data Privacy Guidelines.pdf",
        "description": "Guidelines for handling personal data in dashboards, reports, and experiments.",
        "team": "Data Science",
        "tags": ["Privacy", "Compliance", "Data"],
        "file_type": "pdf",
        "days_ago": 18,
        "uploader_index": 4,
        "decision": None,
    },
    {
        "title": "Team Decision Framework.pdf",
        "description": "Framework the team follows to prepare, review, and record decisions.",
        "team": "AI & Machine Learning",
        "tags": ["Decisions", "Framework", "Planning"],
        "file_type": "pdf",
        "days_ago": 6,
        "uploader_index": 4,
        "decision": None,
    },
    {
        "title": "Cloud Deployment Strategy.pptx",
        "description": "Strategy deck for moving workloads to a multi-region cloud footprint.",
        "team": "Software Development",
        "tags": ["Cloud", "Deployment", "Strategy"],
        "file_type": "pptx",
        "days_ago": 21,
        "uploader_index": 0,
        "decision": None,
    },
    {
        "title": "Model Performance Benchmark.pdf",
        "description": "Benchmark suite results comparing model versions across latency and quality.",
        "team": "AI & Machine Learning",
        "tags": ["AI", "Performance", "Benchmark"],
        "file_type": "pdf",
        "days_ago": 3,
        "uploader_index": 3,
        "decision": None,
    },
    {
        "title": "Data Visualization Standards.pdf",
        "description": "Standards for charts and dashboards so output is consistent and accessible.",
        "team": "Data Science",
        "tags": ["Visualization", "Analytics"],
        "file_type": "pdf",
        "days_ago": 15,
        "uploader_index": 1,
        "decision": None,
    },
    {
        "title": "Security Incident Response Guide.pdf",
        "description": "Playbook for detecting, triaging, and responding to security incidents.",
        "team": "Cyber Security",
        "tags": ["Security", "Incident", "Response"],
        "file_type": "pdf",
        "days_ago": 10,
        "uploader_index": 3,
        "decision": None,
    },
    {
        "title": "Innovation Roadmap.pdf",
        "description": "Quarterly roadmap of early-stage experiments and innovation bets.",
        "team": "Research & Innovation",
        "tags": ["Research", "Innovation", "Planning"],
        "file_type": "pdf",
        "days_ago": 5,
        "uploader_index": 2,
        "decision": None,
    },
    {
        "title": "Backend Coding Standards.docx",
        "description": "Coding standards the backend team reviews pull requests against.",
        "team": "Software Development",
        "tags": ["Backend", "Coding", "Standards"],
        "file_type": "docx",
        "days_ago": 11,
        "uploader_index": 4,
        "decision": None,
    },
    {
        "title": "Machine Learning Experiment Log.pdf",
        "description": "Running log of ML experiments, hypotheses, and recorded outcomes.",
        "team": "AI & Machine Learning",
        "tags": ["ML", "Experiments", "Research"],
        "file_type": "pdf",
        "days_ago": 1,
        "uploader_index": 1,
        "decision": None,
    },
    {
        "title": "Data Quality Checklist.pdf",
        "description": "Checklist used before publishing data-dependent analyses or reports.",
        "team": "Data Science",
        "tags": ["Data", "Quality", "Checklist"],
        "file_type": "pdf",
        "days_ago": 7,
        "uploader_index": 3,
        "decision": None,
    },
    {
        "title": "Application Security Guidelines.pdf",
        "description": "Guidelines for secure application development and review.",
        "team": "Cyber Security",
        "tags": ["Security", "Application"],
        "file_type": "pdf",
        "days_ago": 19,
        "uploader_index": 2,
        "decision": None,
    },
    {
        "title": "Research Project Proposal.pdf",
        "description": "Proposal template and example for new research projects.",
        "team": "Research & Innovation",
        "tags": ["Research", "Proposal", "Planning"],
        "file_type": "pdf",
        "days_ago": 13,
        "uploader_index": 4,
        "decision": None,
    },
]

# One demo decision per team, linked to the relevant demo document so the
# document -> decision ("attached to") edge exists in the Knowledge Graph.
decisions_data = [
    {
        "title": "AI Model Evaluation Decision",
        "team": "AI & Machine Learning",
        "created_by_index": 0,
        "days_ago": 2,
        "links_document": "AI Model Evaluation Report.pdf",
    },
    {
        "title": "Database Platform Review",
        "team": "Software Development",
        "created_by_index": 0,
        "days_ago": 9,
        "links_document": "Database Architecture.docx",
    },
    {
        "title": "Analytics Tooling Decision",
        "team": "Data Science",
        "created_by_index": 0,
        "days_ago": 12,
        "links_document": "Data Analysis Guidelines.pdf",
    },
    {
        "title": "Security Policy Refresh",
        "team": "Cyber Security",
        "created_by_index": 0,
        "days_ago": 20,
        "links_document": "Cyber Security Policy.pdf",
    },
    {
        "title": "Research Investment Decision",
        "team": "Research & Innovation",
        "created_by_index": 0,
        "days_ago": 14,
        "links_document": "Research Methodology.pdf",
    },
]


def _slug(full_name: str) -> str:
    return full_name.lower().replace(" ", ".")


async def _team_by_name(db, name: str) -> Team | None:
    result = await db.execute(select(Team).where(Team.name == name))
    return result.scalar_one_or_none()


async def _user_by_email(db, email: str) -> User | None:
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def _ensure_user(
    db, *, full_name: str, email: str, role: UserRole, team: Team | None
) -> User:
    existing = await _user_by_email(db, email)
    if existing is not None:
        return existing
    user = User(
        full_name=full_name,
        email=email,
        hashed_password=hash_password(DEMO_PASSWORD),
        role=role,
        team_id=team.id if team is not None else None,
    )
    db.add(user)
    await db.flush()
    return user


def _file_slug(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return base or "document"


async def _ensure_decision(
    db, *, title: str, team: Team, created_by: User, days_ago: int
) -> Decision:
    result = await db.execute(select(Decision).where(Decision.title == title))
    existing = result.scalar_one_or_none()
    if existing is not None:
        return existing
    decision = Decision(
        title=title,
        problem_statement=f"Demo decision record for {team.name}. Seeded by scripts.seed_demo.",
        category="Strategy",
        status=DecisionStatus.DRAFT,
        created_by=created_by.id,
        team_id=team.id,
        created_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
    )
    db.add(decision)
    await db.flush()
    return decision


def _demo_copy_text(document: dict) -> str:
    tags = ", ".join(document["tags"])
    return (
        f"Demo copy of: {document['title']}\n"
        f"\n{document.get('description') or 'No description provided.'}\n"
        f"\nTags: {tags}\n"
        "\nThis lightweight demo copy exists only so the Knowledge Repository "
        "View/Download flow can be exercised. It is not the original document.\n"
    )


async def _ensure_document(
    db,
    *,
    title: str,
    description: str | None,
    team: Team,
    uploaded_by: User,
    file_type: str,
    tags: list[str],
    days_ago: int,
    decision_id,
) -> None:
    result = await db.execute(select(RepositoryDocument).where(RepositoryDocument.title == title))
    if result.scalar_one_or_none() is not None:
        return  # idempotent: existing demo documents are left untouched

    content = _demo_copy_text({"title": title, "description": description, "tags": tags})
    docs_dir = Path(settings.REPOSITORY_DOCS_DIR)
    docs_dir.mkdir(parents=True, exist_ok=True)
    content_path = docs_dir / f"{_file_slug(title)}.txt"
    if not content_path.exists():
        content_path.write_text(content, encoding="utf-8")

    db.add(
        RepositoryDocument(
            title=title,
            description=description,
            team_id=team.id,
            uploaded_by=uploaded_by.id,
            decision_id=decision_id,
            file_type=file_type,
            file_size_bytes=content_path.stat().st_size,
            content_path=str(content_path),
            content_type="text/plain; charset=utf-8",
            tags=tags,
            created_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
        )
    )
    await db.flush()


async def seed() -> None:
    teams_created = 0
    users_created = 0
    decisions_count = 0
    documents_count = 0

    async with AsyncSessionLocal() as db:
        teams_by_name: dict[str, Team] = {}
        members_by_team: dict[str, list[User]] = {}

        for team_data in teams_data:
            team = await _team_by_name(db, team_data["name"])
            if team is None:
                team = Team(
                    name=team_data["name"],
                    description=team_data["description"],
                )
                db.add(team)
                await db.flush()
                teams_created += 1
            teams_by_name[team.name] = team

            members: list[User] = []
            for index, member_name in enumerate(team_data["members"]):
                role = _roles[index]
                email = f"{_slug(member_name)}@demo.edr.dev"
                member = await _ensure_user(
                    db, full_name=member_name, email=email, role=role, team=team
                )
                members.append(member)
                users_created += 1
            members_by_team[team.name] = members

        await _ensure_user(
            db,
            full_name=demo_admin["full_name"],
            email=demo_admin["email"],
            role=UserRole.ADMINISTRATOR,
            team=None,
        )
        await _ensure_user(
            db,
            full_name=demo_newhire["full_name"],
            email=demo_newhire["email"],
            role=UserRole.EMPLOYEE,
            team=None,
        )

        # Demo decisions (one per team) give the Past Decisions tab and the
        # Knowledge Graph real decision records to reference.
        for decision_data in decisions_data:
            team = teams_by_name[decision_data["team"]]
            members = members_by_team[decision_data["team"]]
            created_by = members[decision_data["created_by_index"] % len(members)]
            await _ensure_decision(
                db,
                title=decision_data["title"],
                team=team,
                created_by=created_by,
                days_ago=decision_data["days_ago"],
            )
            decisions_count += 1

        decisions_by_title = {
            decision.title: decision
            for decision in (
                await db.execute(select(Decision).where(Decision.title.in_([d["title"] for d in decisions_data])))
            ).scalars()
        }

        # Read-only demo documents with tiny physical demo copies on disk.
        for document_data in documents_data:
            team = teams_by_name[document_data["team"]]
            members = members_by_team[document_data["team"]]
            uploader = members[document_data["uploader_index"] % len(members)]
            linked_decision = decisions_by_title.get(document_data.get("decision"))

            await _ensure_document(
                db,
                title=document_data["title"],
                description=document_data.get("description"),
                team=team,
                uploaded_by=uploader,
                file_type=document_data["file_type"],
                tags=document_data["tags"],
                days_ago=document_data["days_ago"],
                decision_id=linked_decision.id if linked_decision else None,
            )
            documents_count += 1

        await db.commit()

    print("Demo seed complete.")
    print(f"  teams created: {teams_created}")
    print(f"  demo users ensured: {users_created + 2}")
    print(f"  demo decisions ensured: {decisions_count}")
    print(f"  demo documents ensured: {documents_count}")
    print(f"  password for all demo users: {DEMO_PASSWORD}")
    print("  (entries that already existed were left untouched)")
    print()
    print("Credentials (development-only):")
    print(f"  Admin review: {demo_admin['email']} / {DEMO_PASSWORD}")
    print(f"  Join flow   : {demo_newhire['email']} / {DEMO_PASSWORD}")


async def main() -> None:
    try:
        await seed()
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())