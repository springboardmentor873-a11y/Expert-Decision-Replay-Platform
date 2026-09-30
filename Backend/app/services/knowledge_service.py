"""
Read-only queries for the Knowledge Repository.

Everything here reads existing, real database relationships:
  Team  ↔ User      via users.team_id
  User  ↔ Document  via repository_documents.uploaded_by
  Team  ↔ Decision  via decisions.team_id
  User  ↔ Decision  via decisions.created_by
  Document ↔ Decision via repository_documents.decision_id

The Repository is deliberately read-only — there are no write functions and no
upload/document-creation path. Filtering/searching/sorting happen in-process
against the enriched corpus because the Repository serves a small, curated set
of documents; this keeps team/uploader/tag search trivially correct while
avoiding N+1 queries.
"""
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.decision import Decision
from app.models.repository_document import RepositoryDocument
from app.models.team import Team
from app.models.user import User

RECENTLY_ADDED_DAYS = 7

SEARCH_FIELD_KEYS = ("title", "description", "team_name", "uploader_name")

_DOCUMENT_JOIN = (
    select(
        RepositoryDocument,
        Team.name,
        User.full_name,
        User.email,
        Decision.title,
    )
    .outerjoin(Team, Team.id == RepositoryDocument.team_id)
    .outerjoin(User, User.id == RepositoryDocument.uploaded_by)
    .outerjoin(Decision, Decision.id == RepositoryDocument.decision_id)
)


def _document_dict(row) -> dict:
    document, team_name, uploader_name, uploader_email, decision_title = row
    return {
        "id": document.id,
        "title": document.title,
        "description": document.description,
        "team_id": document.team_id,
        "team_name": team_name,
        "uploaded_by": document.uploaded_by,
        "uploader_name": uploader_name,
        "uploader_email": uploader_email,
        "file_type": document.file_type,
        "file_size_bytes": document.file_size_bytes,
        "tags": document.tags or [],
        "decision_id": document.decision_id,
        "decision_title": decision_title,
        "has_content": bool(document.content_path),
        "content_path": document.content_path,
        "created_at": document.created_at,
    }


async def _all_documents(db: AsyncSession) -> list[dict]:
    rows = (await db.execute(_DOCUMENT_JOIN)).all()
    return [_document_dict(row) for row in rows]


async def repo_summary(db: AsyncSession) -> dict:
    """Repository-wide counts, all computed from actual records."""
    total = (
        await db.execute(select(func.count()).select_from(RepositoryDocument))
    ).scalar_one()
    decision_documents = (
        await db.execute(
            select(func.count()).select_from(RepositoryDocument).where(
                RepositoryDocument.decision_id.is_not(None)
            )
        )
    ).scalar_one()
    teams_contributed = (
        await db.execute(
            select(func.count(func.distinct(RepositoryDocument.team_id))).select_from(
                RepositoryDocument
            ).where(RepositoryDocument.team_id.is_not(None))
        )
    ).scalar_one()
    cutoff = datetime.now(timezone.utc) - timedelta(days=RECENTLY_ADDED_DAYS)
    recently_added = (
        await db.execute(
            select(func.count()).select_from(RepositoryDocument).where(
                RepositoryDocument.created_at >= cutoff
            )
        )
    ).scalar_one()

    return {
        "total_documents": total,
        "decision_documents": decision_documents,
        "teams_contributed": teams_contributed,
        "recently_added": recently_added,
    }


def _matches_search(document: dict, query: str | None) -> bool:
    if not query:
        return True
    needle = query.lower()
    for key in SEARCH_FIELD_KEYS:
        value = document.get(key)
        if value and needle in value.lower():
            return True
    for tag in document.get("tags", []):
        if needle in tag.lower():
            return True
    return False


def _matches_tag(document: dict, tag: str | None) -> bool:
    if not tag:
        return True
    return tag in (document.get("tags") or [])


async def list_documents(
    db: AsyncSession,
    *,
    query: str | None = None,
    team_id: uuid.UUID | None = None,
    file_type: str | None = None,
    tag: str | None = None,
    sort: str = "latest",
    offset: int = 0,
    limit: int = 10,
) -> dict:
    corpus = await _all_documents(db)

    file_types = sorted({d["file_type"] for d in corpus if d["file_type"]})
    all_tags = sorted({t for d in corpus for t in (d.get("tags") or [])})

    visible = [
        d
        for d in corpus
        if (team_id is None or d["team_id"] == team_id)
        and (file_type is None or d["file_type"] == file_type)
        and _matches_tag(d, tag)
        and _matches_search(d, query)
    ]

    if sort == "oldest":
        visible.sort(key=lambda d: d["created_at"])
    elif sort == "name_asc":
        visible.sort(key=lambda d: d["title"].lower())
    elif sort == "name_desc":
        visible.sort(key=lambda d: d["title"].lower(), reverse=True)
    else:
        visible.sort(key=lambda d: d["created_at"], reverse=True)

    total = len(visible)
    items = [d for d in visible[offset : offset + limit]]
    for item in items:
        item.pop("content_path", None)  # never expose storage paths to clients

    return {
        "items": items,
        "total": total,
        "file_types": file_types,
        "tags": all_tags,
    }


async def get_document_or_404(db: AsyncSession, document_id: uuid.UUID) -> dict:
    row = (
        await db.execute(
            _DOCUMENT_JOIN.where(RepositoryDocument.id == document_id)
        )
    ).one_or_none()
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )
    return _document_dict(row)


async def list_decisions(
    db: AsyncSession,
    *,
    query: str | None = None,
    offset: int = 0,
    limit: int = 10,
) -> dict:
    stmt = (
        select(
            Decision,
            Team.name,
            User.full_name,
            func.count(RepositoryDocument.id),
        )
        .outerjoin(Team, Team.id == Decision.team_id)
        .outerjoin(User, User.id == Decision.created_by)
        .outerjoin(RepositoryDocument, RepositoryDocument.decision_id == Decision.id)
        .group_by(Decision.id, Team.name, User.full_name)
        .order_by(Decision.created_at.desc())
    )
    if query:
        stmt = stmt.where(Decision.title.ilike(f"%{query}%"))

    rows = (await db.execute(stmt)).all()
    items = []
    for decision, team_name, created_by_name, document_count in rows:
        items.append(
            {
                "id": decision.id,
                "title": decision.title,
                "category": decision.category,
                "status": decision.status,
                "team_id": decision.team_id,
                "team_name": team_name,
                "created_by": decision.created_by,
                "created_by_name": created_by_name,
                "document_count": document_count,
                "created_at": decision.created_at,
            }
        )

    total = len(items)
    return {"items": items[offset : offset + limit], "total": total}


def _graph_nodes_and_edges(
    teams: list[tuple[uuid.UUID, str]],
    people: list[tuple[uuid.UUID, str, str, uuid.UUID | None]],
    documents: list[tuple],
    decisions: list[tuple],
) -> dict:
    """Build graph nodes/edges from real rows only (never invented data)."""
    # people rows (id, full_name, role, team_id)
    person_team_ids = {person[0]: person[3] for person in people}

    nodes: list[dict] = [
        {"id": team_id, "type": "team", "label": name, "subtitle": "Team", "team_id": None}
        for team_id, name in teams
    ]
    nodes.extend(
        {
            "id": person_id,
            "type": "person",
            "label": name,
            "subtitle": role,
            "team_id": person_team_ids.get(person_id),
        }
        for person_id, name, role, _ in people
    )
    nodes.extend(
        {
            "id": doc_id,
            "type": "document",
            "label": title,
            "subtitle": file_type if file_type else "Document",
            "team_id": doc_team_id,
        }
        for doc_id, title, file_type, _uploaded_by, doc_team_id, _decision in documents
    )
    nodes.extend(
        {
            "id": decision_id,
            "type": "decision",
            "label": title,
            "subtitle": status,
            "team_id": decision_team_id,
        }
        for decision_id, title, status, _created_by, decision_team_id in decisions
    )

    edges: list[dict] = []

    def _add(source, target, relationship) -> None:
        if source is None or target is None:
            return
        edges.append({"source": source, "target": target, "relationship": relationship})

    for person_id, _, _, team_id in people:
        _add(team_id, person_id, "member")
    for doc_id, _, _, uploaded_by, doc_team_id, decision_id in documents:
        _add(uploaded_by, doc_id, "uploaded")
        _add(doc_id, doc_team_id, "belongs to")
        _add(doc_id, decision_id, "attached to")
    for decision_id, _, _, created_by, decision_team_id in decisions:
        _add(created_by, decision_id, "created by")
        _add(decision_team_id, decision_id, "associated")

    return {"nodes": nodes, "edges": edges}


async def graph_data(db: AsyncSession) -> dict:
    """Entire Knowledge Graph, built exclusively from real DB relationships."""
    teams = [
        (team_id, name)
        for team_id, name in (await db.execute(select(Team.id, Team.name))).all()
    ]

    users = [
        (user_id, full_name, role, team_id)
        for user_id, full_name, role, team_id in (
            await db.execute(select(User.id, User.full_name, User.role, User.team_id))
        ).all()
    ]

    uploader_ids = {
        row[0]
        for row in (
            await db.execute(
                select(func.distinct(RepositoryDocument.uploaded_by)).where(
                    RepositoryDocument.uploaded_by.is_not(None)
                )
            )
        ).all()
    }
    creator_ids = {
        row[0]
        for row in (
            await db.execute(
                select(func.distinct(Decision.created_by)).where(
                    Decision.created_by.is_not(None)
                )
            )
        ).all()
    }

    people = [
        user
        for user in users
        if user[3] is not None or user[0] in uploader_ids or user[0] in creator_ids
    ]

    documents = [
        (doc.id, doc.title, doc.file_type, doc.uploaded_by, doc.team_id, doc.decision_id)
        for doc in (
            await db.execute(
                select(
                    RepositoryDocument.id,
                    RepositoryDocument.title,
                    RepositoryDocument.file_type,
                    RepositoryDocument.uploaded_by,
                    RepositoryDocument.team_id,
                    RepositoryDocument.decision_id,
                )
            )
        ).all()
    ]

    decisions = [
        (decision.id, decision.title, str(decision.status.value), decision.created_by, decision.team_id)
        for decision in (
            await db.execute(
                select(
                    Decision.id,
                    Decision.title,
                    Decision.status,
                    Decision.created_by,
                    Decision.team_id,
                )
            )
        ).all()
    ]

    return _graph_nodes_and_edges(teams, people, documents, decisions)