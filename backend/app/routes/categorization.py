"""
Categorization API endpoints for benefits and red flags
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID

from app.utils.db import get_db
from app.core.dependencies import get_current_user
from app import schemas
from app.models import User, CoverageBenefit, RedFlag, InsurancePolicy, BenefitCategory, RedFlagCategory
from app.services import policy_service
from app.schemas.categorization import (
    BenefitCategory, BenefitCategoryCreate, BenefitCategoryUpdate,
    RedFlagCategory, RedFlagCategoryCreate, RedFlagCategoryUpdate,
    CategorizationFilter, CategorizationSummary,
    CategorizedBenefit, CategorizedRedFlag
)
from app.services.categorization_service import categorization_service

router = APIRouter(prefix="/api/categorization", tags=["categorization"])


@router.get("/benefits/categories", response_model=List[BenefitCategory])
async def get_benefit_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    regulatory_level: Optional[str] = Query(None),
    prominent_category: Optional[str] = Query(None),
    is_active: bool = Query(True)
):
    """Get all benefit categories with optional filtering"""
    query = db.query(BenefitCategory).filter(BenefitCategory.is_active == is_active)
    
    if regulatory_level:
        query = query.filter(BenefitCategory.regulatory_level == regulatory_level)
    
    if prominent_category:
        query = query.filter(BenefitCategory.prominent_category == prominent_category)
    
    return query.all()


@router.get("/red-flags/categories", response_model=List[RedFlagCategory])
async def get_red_flag_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    regulatory_level: Optional[str] = Query(None),
    prominent_category: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    is_active: bool = Query(True)
):
    """Get all red flag categories with optional filtering"""
    query = db.query(RedFlagCategory).filter(RedFlagCategory.is_active == is_active)
    
    if regulatory_level:
        query = query.filter(RedFlagCategory.regulatory_level == regulatory_level)
    
    if prominent_category:
        query = query.filter(RedFlagCategory.prominent_category == prominent_category)
    
    if risk_level:
        query = query.filter(RedFlagCategory.risk_level == risk_level)
    
    return query.all()


@router.get("/benefits/categorized/{policy_id}")
async def get_categorized_benefits(
    policy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    filter_params: CategorizationFilter = Depends()
):
    """Get categorized benefits for a specific policy"""
    # Verify policy ownership
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == policy_id,
        InsurancePolicy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Get benefits
    benefits_query = db.query(CoverageBenefit).filter(CoverageBenefit.policy_id == policy_id)
    
    # Apply filters
    if filter_params.regulatory_level:
        benefits_query = benefits_query.filter(
            CoverageBenefit.regulatory_level.in_(filter_params.regulatory_level)
        )
    
    if filter_params.prominent_category:
        benefits_query = benefits_query.filter(
            CoverageBenefit.prominent_category.in_(filter_params.prominent_category)
        )
    
    benefits = benefits_query.all()
    
    # Add categorization information
    categorized_benefits = []
    for benefit in benefits:
        if not benefit.regulatory_level:
            # Auto-categorize if not already categorized
            categorization = categorization_service.categorize_benefit(benefit)
            # Update benefit with categorization
            for key, value in categorization.items():
                setattr(benefit, key, value)
            db.commit()
        
        visual_indicators = categorization_service.get_visual_indicators({
            'regulatory_level': benefit.regulatory_level,
            'prominent_category': benefit.prominent_category,
            'federal_regulation': benefit.federal_regulation,
            'state_regulation': benefit.state_regulation
        })
        
        categorized_benefits.append({
            'benefit': benefit,
            'regulatory_badges': visual_indicators['regulatory_badges'],
            'visual_indicators': visual_indicators
        })
    
    return categorized_benefits


@router.get("/red-flags/categorized/{policy_id}")
async def get_categorized_red_flags(
    policy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    filter_params: CategorizationFilter = Depends()
):
    """Get categorized red flags for a specific policy"""
    # Verify policy ownership
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == policy_id,
        InsurancePolicy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Get red flags
    red_flags_query = db.query(RedFlag).filter(RedFlag.policy_id == policy_id)
    
    # Apply filters
    if filter_params.regulatory_level:
        red_flags_query = red_flags_query.filter(
            RedFlag.regulatory_level.in_(filter_params.regulatory_level)
        )
    
    if filter_params.prominent_category:
        red_flags_query = red_flags_query.filter(
            RedFlag.prominent_category.in_(filter_params.prominent_category)
        )
    
    if filter_params.risk_level:
        red_flags_query = red_flags_query.filter(
            RedFlag.risk_level.in_(filter_params.risk_level)
        )
    
    red_flags = red_flags_query.all()
    
    # Add categorization information
    categorized_red_flags = []
    for red_flag in red_flags:
        if not red_flag.regulatory_level:
            # Auto-categorize if not already categorized
            categorization = categorization_service.categorize_red_flag(red_flag)
            # Update red flag with categorization
            for key, value in categorization.items():
                setattr(red_flag, key, value)
            db.commit()
        
        visual_indicators = categorization_service.get_visual_indicators({
            'regulatory_level': red_flag.regulatory_level,
            'prominent_category': red_flag.prominent_category,
            'federal_regulation': red_flag.federal_regulation,
            'state_regulation': red_flag.state_regulation,
            'risk_level': red_flag.risk_level
        })
        
        categorized_red_flags.append({
            'red_flag': red_flag,
            'regulatory_badges': visual_indicators['regulatory_badges'],
            'visual_indicators': visual_indicators,
            'risk_indicators': {
                'risk_level': red_flag.risk_level,
                'risk_color': visual_indicators.get('risk_color'),
                'severity': red_flag.severity
            }
        })
    
    return categorized_red_flags


@router.get("/summary/{policy_id}", response_model=CategorizationSummary)
async def get_categorization_summary(
    policy_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get categorization summary for a policy"""
    # Verify policy ownership
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == policy_id,
        InsurancePolicy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    # Get benefits and red flags
    benefits = db.query(CoverageBenefit).filter(CoverageBenefit.policy_id == policy_id).all()
    red_flags = db.query(RedFlag).filter(RedFlag.policy_id == policy_id).all()
    
    total_items = len(benefits) + len(red_flags)
    
    # Count by regulatory level
    by_regulatory_level = {}
    by_prominent_category = {}
    by_federal_regulation = {}
    by_state_regulation = {}
    by_risk_level = {}
    
    for item in benefits + red_flags:
        # Count regulatory levels
        reg_level = getattr(item, 'regulatory_level', None)
        if reg_level:
            by_regulatory_level[reg_level] = by_regulatory_level.get(reg_level, 0) + 1
        
        # Count prominent categories
        prom_cat = getattr(item, 'prominent_category', None)
        if prom_cat:
            by_prominent_category[prom_cat] = by_prominent_category.get(prom_cat, 0) + 1
        
        # Count federal regulations
        fed_reg = getattr(item, 'federal_regulation', None)
        if fed_reg:
            by_federal_regulation[fed_reg] = by_federal_regulation.get(fed_reg, 0) + 1
        
        # Count state regulations
        state_reg = getattr(item, 'state_regulation', None)
        if state_reg:
            by_state_regulation[state_reg] = by_state_regulation.get(state_reg, 0) + 1
    
    # Count risk levels (red flags only)
    for red_flag in red_flags:
        risk_level = getattr(red_flag, 'risk_level', None)
        if risk_level:
            by_risk_level[risk_level] = by_risk_level.get(risk_level, 0) + 1
    
    return CategorizationSummary(
        total_items=total_items,
        by_regulatory_level=by_regulatory_level,
        by_prominent_category=by_prominent_category,
        by_federal_regulation=by_federal_regulation,
        by_state_regulation=by_state_regulation,
        by_risk_level=by_risk_level
    )


@router.post("/benefits/auto-categorize/{policy_id}")
async def auto_categorize_benefits(
    policy_id: UUID,
    state_code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Auto-categorize all benefits for a policy"""
    # Verify policy ownership
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == policy_id,
        InsurancePolicy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    benefits = db.query(CoverageBenefit).filter(CoverageBenefit.policy_id == policy_id).all()
    
    categorized_count = 0
    for benefit in benefits:
        categorization = categorization_service.categorize_benefit(benefit, state_code)
        
        # Update benefit with categorization
        for key, value in categorization.items():
            setattr(benefit, key, value)
        
        categorized_count += 1
    
    db.commit()
    
    return {
        "message": f"Successfully categorized {categorized_count} benefits",
        "policy_id": policy_id,
        "categorized_count": categorized_count
    }


@router.post("/red-flags/auto-categorize/{policy_id}")
async def auto_categorize_red_flags(
    policy_id: UUID,
    state_code: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Auto-categorize all red flags for a policy"""
    # Verify policy ownership
    policy = db.query(InsurancePolicy).filter(
        InsurancePolicy.id == policy_id,
        InsurancePolicy.user_id == current_user.id
    ).first()
    
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    red_flags = db.query(RedFlag).filter(RedFlag.policy_id == policy_id).all()
    
    categorized_count = 0
    for red_flag in red_flags:
        categorization = categorization_service.categorize_red_flag(red_flag, state_code)
        
        # Update red flag with categorization
        for key, value in categorization.items():
            setattr(red_flag, key, value)
        
        categorized_count += 1
    
    db.commit()
    
    return {
        "message": f"Successfully categorized {categorized_count} red flags",
        "policy_id": policy_id,
        "categorized_count": categorized_count
    }
