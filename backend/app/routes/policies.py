from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from uuid import UUID

from app import schemas
from app.utils.db import get_db
from app.services import policy_service
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/recent", response_model=List[schemas.InsurancePolicy])
async def get_recent_policies(
    db: Session = Depends(get_db),
    limit: int = 5,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve recent insurance policies for the current user
    """
    policies = policy_service.get_recent_policies_lightweight(
        db=db, user_id=current_user.id, limit=limit
    )
    return policies


@router.get("", response_model=List[schemas.InsurancePolicy])
async def get_policies(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve all insurance policies for the current user
    """
    policies = policy_service.get_policies_by_user(
        db=db, user_id=current_user.id, skip=skip, limit=limit
    )
    return policies


@router.get("/{policy_id}", response_model=schemas.InsurancePolicy)
async def get_policy(
    *,
    db: Session = Depends(get_db),
    policy_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve a specific policy by ID
    """
    policy = policy_service.get_policy(db=db, policy_id=policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )
    
    # Verify policy ownership
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this policy",
        )
    
    return policy


@router.get("/{policy_id}/complete", response_model=schemas.CompletePolicyData)
async def get_policy_complete(
    *,
    response: Response,
    db: Session = Depends(get_db),
    policy_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Retrieve complete policy data in a single optimized request.
    Includes policy details, benefits, red flags, and document information.
    OPTIMIZED: Single consolidated endpoint to reduce API calls and improve performance.
    """
    from datetime import datetime

    # Set caching headers for better performance
    response.headers["Cache-Control"] = "public, max-age=600"  # 10 minutes cache
    response.headers["ETag"] = f"policy-{policy_id}-{int(datetime.utcnow().timestamp() // 600)}"

    # Get policy with all related data using optimized query
    policy = policy_service.get_policy(db=db, policy_id=policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )

    # Verify policy ownership
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this policy",
        )

    # Get benefits for this policy
    benefits = policy_service.get_policy_benefits(db=db, policy_id=policy_id)

    # Get red flags for this policy
    red_flags = policy_service.get_policy_red_flags(db=db, policy_id=policy_id)

    # Get document information
    document = None
    if policy.document_id:
        from app.services import document_service
        document = document_service.get_document(db=db, document_id=policy.document_id)

    # Get carrier information (already loaded via eager loading in get_policy)
    carrier = policy.carrier

    return schemas.CompletePolicyData(
        policy=policy,
        benefits=benefits,
        red_flags=red_flags,
        document=document,
        carrier=carrier
    )


@router.post("", response_model=schemas.InsurancePolicy)
async def create_policy(
    *,
    db: Session = Depends(get_db),
    policy_in: schemas.InsurancePolicyCreate,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Create a new insurance policy
    """
    # Verify document ownership
    document = policy_service.get_document(db=db, document_id=policy_in.document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )
    
    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to use this document",
        )
    
    # Create policy
    policy = policy_service.create_policy(
        db=db,
        obj_in=policy_in,
        user_id=current_user.id,
    )
    
    return policy


@router.put("/{policy_id}", response_model=schemas.InsurancePolicy)
async def update_policy(
    *,
    db: Session = Depends(get_db),
    policy_id: UUID,
    policy_in: schemas.InsurancePolicyUpdate,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Update an insurance policy
    """
    policy = policy_service.get_policy(db=db, policy_id=policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )
    
    # Verify policy ownership
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to modify this policy",
        )
    
    policy = policy_service.update_policy(
        db=db,
        policy=policy,
        obj_in=policy_in,
    )
    
    return policy


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    *,
    db: Session = Depends(get_db),
    policy_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
):
    """
    Delete an insurance policy
    """
    policy = policy_service.get_policy(db=db, policy_id=policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )
    
    # Verify policy ownership
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this policy",
        )
    
    policy_service.delete_policy(db=db, policy_id=policy_id)
    return None


@router.get("/{policy_id}/benefits", response_model=List[schemas.CoverageBenefit])
async def get_policy_benefits(
    *,
    db: Session = Depends(get_db),
    policy_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Get all benefits for a specific policy
    """
    # Verify policy ownership
    policy = policy_service.get_policy(db=db, policy_id=policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )
    
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this policy",
        )
    
    benefits = policy_service.get_policy_benefits(db=db, policy_id=policy_id)
    return benefits


@router.get("/{policy_id}/red-flags", response_model=List[schemas.RedFlag])
async def get_policy_red_flags(
    *,
    db: Session = Depends(get_db),
    policy_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
) -> Any:
    """
    Get all red flags for a specific policy
    """
    # Verify policy ownership
    policy = policy_service.get_policy(db=db, policy_id=policy_id)
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Insurance policy not found",
        )
    
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to access this policy",
        )
    
    red_flags = policy_service.get_policy_red_flags(db=db, policy_id=policy_id)
    return red_flags
