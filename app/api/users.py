from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.models import User, UserType
from app.schemas.schemas import UserResponse
from app.dependencies.auth import get_current_user, require_librarian
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/users", tags=["users"])


class UpdateUserRoleRequest(BaseModel):
    user_type: UserType


@router.get("/", response_model=List[UserResponse])
async def list_users(
    search: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    """
    List all users with optional search by name or email.
    Requires librarian or super_admin role.
    """
    query = db.query(User)

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(search_pattern),
                User.email.ilike(search_pattern)
            )
        )

    users = query.offset(skip).limit(limit).all()
    return users


@router.put("/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: int,
    role_update: UpdateUserRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    """
    Update a user's role.
    Requires librarian or super_admin role.
    Only allows changing between MEMBER and LIBRARIAN roles.
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Prevent changing super_admin role
    if user.user_type == UserType.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify super admin role"
        )

    # Only allow MEMBER and LIBRARIAN role changes
    if role_update.user_type not in [UserType.MEMBER, UserType.LIBRARIAN]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only set role to member or librarian"
        )

    # Prevent users from changing their own role
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot change your own role"
        )

    user.user_type = role_update.user_type
    db.commit()
    db.refresh(user)

    return user
