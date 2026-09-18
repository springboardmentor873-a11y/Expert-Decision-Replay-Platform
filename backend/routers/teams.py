from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import schemas
import models
import auth
import database

router = APIRouter(prefix="/teams", tags=["teams"])

@router.post("/", response_model=schemas.TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team: schemas.TeamCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.RoleEnum.MANAGER, models.RoleEnum.ADMINISTRATOR]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to create teams")
    
    db_team = db.query(models.Team).filter(models.Team.name == team.name).first()
    if db_team:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Team name already exists")
    
    new_team = models.Team(name=team.name, description=team.description)
    db.add(new_team)
    
    # Add creator as a member automatically
    new_team.members.append(current_user)
    
    db.commit()
    db.refresh(new_team)
    
    # Audit log
    audit = models.AuditLog(
        user_id=current_user.id,
        action="TEAM_CREATED",
        entity_type="Team",
        entity_id=new_team.id,
        description=f"Team '{new_team.name}' created by {current_user.email}"
    )
    db.add(audit)
    db.commit()
    
    return new_team

@router.get("/", response_model=List[schemas.TeamResponse])
def get_teams(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return db.query(models.Team).all()

@router.post("/{team_id}/members", response_model=schemas.TeamResponse)
def add_team_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if current_user.role not in [models.RoleEnum.MANAGER, models.RoleEnum.ADMINISTRATOR]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to manage team members")
        
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    if user in team.members:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User already in team")
        
    team.members.append(user)
    db.commit()
    db.refresh(team)
    
    # Audit log
    audit = models.AuditLog(
        user_id=current_user.id,
        action="TEAM_MEMBER_ADDED",
        entity_type="Team",
        entity_id=team.id,
        description=f"User '{user.email}' added to Team '{team.name}' by {current_user.email}"
    )
    db.add(audit)
    db.commit()
    
    return team
