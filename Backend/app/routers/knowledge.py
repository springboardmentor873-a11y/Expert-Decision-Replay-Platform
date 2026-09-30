"""
Knowledge Repository — read-only browsing of documents, past decisions, and
the Relationships Graph.

Accessible to every authenticated role (employee, reviewer, manager,
administrator) via `get_current_user`. There is intentionally no write/upload
endpoint anywhere on this router.
"""
import uuid
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.knowledge import (
    KnowledgeGraph,
    RepositoryDecisionList,
    RepositoryDocumentList,
    RepositoryDocumentOut,
    RepositorySummary,
)
from app.services.knowledge_service import (
    get_document_or_404,
    graph_data,
    list_decisions,
    list_documents,
    repo_summary,
)

router = APIRouter(prefix="/api/v1/knowledge", tags=["knowledge"])

DocumentSort = Literal["latest", "oldest", "name_asc", "name_desc"]


@router.get("/summary", response_model=RepositorySummary)
async def knowledge_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await repo_summary(db)


@router.get("/documents", response_model=RepositoryDocumentList)
async def repository_documents(
    query: str | None = Query(default=None, max_length=200),
    team_id: uuid.UUID | None = Query(default=None),
    file_type: str | None = Query(default=None, max_length=20),
    tag: str | None = Query(default=None, max_length=60),
    sort: DocumentSort = Query(default="latest"),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await list_documents(
        db,
        query=query,
        team_id=team_id,
        file_type=file_type,
        tag=tag,
        sort=sort,
        offset=offset,
        limit=limit,
    )


@router.get("/documents/{document_id}", response_model=RepositoryDocumentOut)
async def repository_document_detail(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await get_document_or_404(db, document_id)


@router.get("/documents/{document_id}/download")
async def repository_document_download(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    document = await get_document_or_404(db, document_id)
    if not document.get("has_content") or not document.get("content_path"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No demo content available for this document.",
        )
    path = document["content_path"]
    if not Path(path).exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Demo content is missing from storage.",
        )
    return FileResponse(
        path=path,
        filename=Path(path).name,
        media_type=document.get("content_type") or "text/plain",
    )


@router.get("/decisions", response_model=RepositoryDecisionList)
async def repository_decisions(
    query: str | None = Query(default=None, max_length=200),
    limit: int = Query(default=10, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await list_decisions(db, query=query, offset=offset, limit=limit)


@router.get("/graph", response_model=KnowledgeGraph)
async def knowledge_graph(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return await graph_data(db)