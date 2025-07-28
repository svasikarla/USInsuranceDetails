from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, text
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import json

from ..utils.db import get_db
from ..core.dependencies import get_current_user
from ..models.user import User
from ..models.policy import InsurancePolicy
from ..models.document import PolicyDocument
from ..models.carrier import InsuranceCarrier
from ..schemas.search import (
    SearchResult, GlobalSearchResponse, AdvancedSearchFilters,
    SearchFacets, SearchSuggestion
)

router = APIRouter(prefix="/search", tags=["search"])

@router.get("/global", response_model=GlobalSearchResponse)
async def global_search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    page: int = Query(1, ge=1),
    types: Optional[List[str]] = Query(None, description="Filter by content types"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Global search across policies, documents, and carriers
    """
    try:
        start_time = datetime.now()
        offset = (page - 1) * limit
        
        results = []
        total_count = 0
        facets = SearchFacets(types={}, carriers={}, policy_types={}, date_ranges={})
        
        # Search in policies
        if not types or 'policy' in types:
            policy_results, policy_count = search_policies(
                db, current_user, q, limit, offset
            )
            results.extend(policy_results)
            total_count += policy_count

            # Update facets
            facets.types['policy'] = policy_count
        
        # Search in documents
        if not types or 'document' in types:
            document_results, document_count = search_documents(
                db, current_user, q, limit, offset
            )
            results.extend(document_results)
            total_count += document_count

            # Update facets
            facets.types['document'] = document_count

        # Search in carriers
        if not types or 'carrier' in types:
            carrier_results, carrier_count = search_carriers(
                db, current_user, q, limit, offset
            )
            results.extend(carrier_results)
            total_count += carrier_count

            # Update facets
            facets.types['carrier'] = carrier_count

        # Sort results by relevance score
        results.sort(key=lambda x: x.relevance_score, reverse=True)

        # Limit results
        results = results[:limit]

        # Calculate search time
        search_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)

        # Generate suggestions
        suggestions = get_search_suggestions(db, q)
        
        return GlobalSearchResponse(
            results=results,
            total_count=total_count,
            page=page,
            limit=limit,
            search_time_ms=search_time_ms,
            facets=facets,
            suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.post("/advanced", response_model=GlobalSearchResponse)
async def advanced_search(
    filters: AdvancedSearchFilters,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Advanced search with comprehensive filtering
    """
    try:
        start_time = datetime.now()
        offset = ((filters.page or 1) - 1) * (filters.limit or 20)
        
        results = []
        total_count = 0
        facets = SearchFacets(types={}, carriers={}, policy_types={}, date_ranges={})
        
        # Search in policies
        if not filters.types or 'policy' in filters.types:
            policy_results, policy_count = advanced_search_policies(
                db, current_user, filters, filters.limit or 20, offset
            )
            results.extend(policy_results)
            total_count += policy_count
            facets.types['policy'] = policy_count

        # Search in documents
        if not filters.types or 'document' in filters.types:
            document_results, document_count = advanced_search_documents(
                db, current_user, filters, filters.limit or 20, offset
            )
            results.extend(document_results)
            total_count += document_count
            facets.types['document'] = document_count

        # Search in carriers
        if not filters.types or 'carrier' in filters.types:
            carrier_results, carrier_count = advanced_search_carriers(
                db, current_user, filters, filters.limit or 20, offset
            )
            results.extend(carrier_results)
            total_count += carrier_count
            facets.types['carrier'] = carrier_count
        
        # Sort results
        if filters.sort_by == 'relevance':
            results.sort(key=lambda x: x.relevance_score, reverse=(filters.sort_order == 'desc'))
        elif filters.sort_by == 'date':
            results.sort(key=lambda x: x.updated_at, reverse=(filters.sort_order == 'desc'))
        elif filters.sort_by == 'name':
            results.sort(key=lambda x: x.title.lower(), reverse=(filters.sort_order == 'desc'))
        elif filters.sort_by == 'type':
            results.sort(key=lambda x: x.type, reverse=(filters.sort_order == 'desc'))
        
        # Limit results
        results = results[:(filters.limit or 20)]
        
        # Calculate search time
        search_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        # Generate suggestions
        suggestions = await get_search_suggestions(db, filters.query or "")
        
        return GlobalSearchResponse(
            results=results,
            total_count=total_count,
            page=filters.page or 1,
            limit=filters.limit or 20,
            search_time_ms=search_time_ms,
            facets=facets,
            suggestions=suggestions
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Advanced search failed: {str(e)}")

@router.get("/quick", response_model=GlobalSearchResponse)
async def quick_search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(8, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Quick search for autocomplete/dropdown results
    """
    try:
        start_time = datetime.now()
        
        results = []
        
        # Quick search in each entity type (limited results)
        policy_results, _ = search_policies(db, current_user, q, 3, 0)
        document_results, _ = search_documents(db, current_user, q, 3, 0)
        carrier_results, _ = search_carriers(db, current_user, q, 2, 0)
        
        results.extend(policy_results)
        results.extend(document_results)
        results.extend(carrier_results)
        
        # Sort by relevance and limit
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        results = results[:limit]
        
        search_time_ms = int((datetime.now() - start_time).total_seconds() * 1000)
        
        return GlobalSearchResponse(
            results=results,
            total_count=len(results),
            page=1,
            limit=limit,
            search_time_ms=search_time_ms,
            facets=SearchFacets(types={}, carriers={}, policy_types={}, date_ranges={}),
            suggestions=[]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick search failed: {str(e)}")

@router.get("/suggestions")
async def get_search_suggestions_endpoint(
    q: str = Query("", description="Partial query for suggestions"),
    limit: int = Query(5, ge=1, le=10),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get search suggestions for autocomplete
    """
    try:
        suggestions = get_search_suggestions(db, q, limit)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get suggestions: {str(e)}")

# Helper functions for entity-specific searches

def search_policies(
    db: Session, user: User, query: str, limit: int, offset: int
) -> tuple[List[SearchResult], int]:
    """Search in insurance policies"""
    
    # Build search conditions
    search_conditions = []
    if query:
        search_term = f"%{query.lower()}%"
        search_conditions.append(
            or_(
                func.lower(InsurancePolicy.policy_number).like(search_term),
                func.lower(InsurancePolicy.policy_type).like(search_term),
                func.lower(InsurancePolicy.description).like(search_term)
            )
        )
    
    # Base query
    base_query = db.query(InsurancePolicy).filter(
        InsurancePolicy.user_id == user.id
    )
    
    if search_conditions:
        base_query = base_query.filter(and_(*search_conditions))
    
    # Get total count
    total_count = base_query.count()
    
    # Get results
    policies = base_query.offset(offset).limit(limit).all()
    
    # Convert to SearchResult
    results = []
    for policy in policies:
        # Calculate relevance score based on query match
        relevance_score = calculate_policy_relevance(policy, query)
        
        result = SearchResult(
            id=policy.id,
            type="policy",
            title=f"Policy {policy.policy_number}",
            description=policy.description or f"{policy.policy_type} insurance policy",
            url=f"/policies/{policy.id}",
            relevance_score=relevance_score,
            updated_at=policy.updated_at,
            metadata={
                "policy_type": policy.policy_type,
                "premium": float(policy.premium_amount) if policy.premium_amount else None,
                "carrier_id": policy.carrier_id,
                "status": "active"  # Assuming active for now
            }
        )
        results.append(result)
    
    return results, total_count

def search_documents(
    db: Session, user: User, query: str, limit: int, offset: int
) -> tuple[List[SearchResult], int]:
    """Search in policy documents"""
    
    # Build search conditions
    search_conditions = []
    if query:
        search_term = f"%{query.lower()}%"
        search_conditions.append(
            or_(
                func.lower(PolicyDocument.filename).like(search_term),
                func.lower(PolicyDocument.document_type).like(search_term),
                func.lower(PolicyDocument.extracted_text).like(search_term)
            )
        )
    
    # Base query
    base_query = db.query(PolicyDocument).filter(
        PolicyDocument.user_id == user.id
    )
    
    if search_conditions:
        base_query = base_query.filter(and_(*search_conditions))
    
    # Get total count
    total_count = base_query.count()
    
    # Get results
    documents = base_query.offset(offset).limit(limit).all()
    
    # Convert to SearchResult
    results = []
    for doc in documents:
        # Calculate relevance score
        relevance_score = calculate_document_relevance(doc, query)
        
        result = SearchResult(
            id=doc.id,
            type="document",
            title=doc.filename,
            description=f"{doc.document_type} document" + (f" - {doc.extracted_text[:100]}..." if doc.extracted_text else ""),
            url=f"/documents/{doc.id}",
            relevance_score=relevance_score,
            updated_at=doc.updated_at,
            metadata={
                "document_type": doc.document_type,
                "file_size": doc.file_size,
                "processing_status": doc.processing_status,
                "confidence_score": doc.confidence_score,
                "has_red_flags": bool(doc.red_flags)
            }
        )
        results.append(result)
    
    return results, total_count

def search_carriers(
    db: Session, user: User, query: str, limit: int, offset: int
) -> tuple[List[SearchResult], int]:
    """Search in insurance carriers"""
    
    # Build search conditions
    search_conditions = []
    if query:
        search_term = f"%{query.lower()}%"
        search_conditions.append(
            or_(
                func.lower(InsuranceCarrier.name).like(search_term),
                func.lower(InsuranceCarrier.contact_email).like(search_term),
                func.lower(InsuranceCarrier.phone_number).like(search_term)
            )
        )
    
    # Base query (carriers are not user-specific in current schema)
    base_query = db.query(InsuranceCarrier)
    
    if search_conditions:
        base_query = base_query.filter(and_(*search_conditions))
    
    # Get total count
    total_count = base_query.count()
    
    # Get results
    carriers = base_query.offset(offset).limit(limit).all()
    
    # Convert to SearchResult
    results = []
    for carrier in carriers:
        # Calculate relevance score
        relevance_score = calculate_carrier_relevance(carrier, query)
        
        # Get policy count for this carrier
        policy_count = db.query(InsurancePolicy).filter(
            InsurancePolicy.carrier_id == carrier.id,
            InsurancePolicy.user_id == user.id
        ).count()
        
        result = SearchResult(
            id=carrier.id,
            type="carrier",
            title=carrier.name,
            description=f"Insurance carrier - {carrier.contact_email or 'No email'}",
            url=f"/carriers/{carrier.id}",
            relevance_score=relevance_score,
            updated_at=carrier.updated_at,
            metadata={
                "contact_email": carrier.contact_email,
                "phone_number": carrier.phone_number,
                "policy_count": policy_count,
                "network_type": "in-network"  # Default assumption
            }
        )
        results.append(result)
    
    return results, total_count

# Advanced search functions (similar to basic but with more filters)
def advanced_search_policies(
    db: Session, user: User, filters: AdvancedSearchFilters, limit: int, offset: int
) -> tuple[List[SearchResult], int]:
    """Advanced search in policies with filters"""
    
    # Start with basic search
    results, total_count = search_policies(db, user, filters.query or "", limit, offset)
    
    # Apply additional filters
    if filters.policy_types:
        results = [r for r in results if r.metadata.get("policy_type") in filters.policy_types]
    
    if filters.premium_min is not None:
        results = [r for r in results if r.metadata.get("premium", 0) >= filters.premium_min]
    
    if filters.premium_max is not None:
        results = [r for r in results if r.metadata.get("premium", float('inf')) <= filters.premium_max]
    
    if filters.carrier_ids:
        results = [r for r in results if r.metadata.get("carrier_id") in filters.carrier_ids]
    
    return results, len(results)

def advanced_search_documents(
    db: Session, user: User, filters: AdvancedSearchFilters, limit: int, offset: int
) -> tuple[List[SearchResult], int]:
    """Advanced search in documents with filters"""
    
    # Start with basic search
    results, total_count = search_documents(db, user, filters.query or "", limit, offset)
    
    # Apply additional filters
    if filters.processing_status:
        results = [r for r in results if r.metadata.get("processing_status") in filters.processing_status]
    
    if filters.has_red_flags is not None:
        results = [r for r in results if bool(r.metadata.get("has_red_flags")) == filters.has_red_flags]
    
    if filters.processing_confidence_min is not None:
        results = [r for r in results if (r.metadata.get("confidence_score") or 0) >= filters.processing_confidence_min / 100]
    
    if filters.file_types:
        # Extract file extension from filename
        results = [r for r in results if any(r.title.lower().endswith(f".{ft}") for ft in filters.file_types)]
    
    return results, len(results)

def advanced_search_carriers(
    db: Session, user: User, filters: AdvancedSearchFilters, limit: int, offset: int
) -> tuple[List[SearchResult], int]:
    """Advanced search in carriers with filters"""
    
    # Start with basic search
    results, total_count = search_carriers(db, user, filters.query or "", limit, offset)
    
    # Apply additional filters
    if filters.carrier_ids:
        results = [r for r in results if r.id in filters.carrier_ids]
    
    return results, len(results)

# Relevance calculation functions
def calculate_policy_relevance(policy: InsurancePolicy, query: str) -> float:
    """Calculate relevance score for a policy"""
    if not query:
        return 0.5
    
    query_lower = query.lower()
    score = 0.0
    
    # Policy number exact match gets highest score
    if policy.policy_number and query_lower in policy.policy_number.lower():
        score += 1.0
    
    # Policy type match
    if policy.policy_type and query_lower in policy.policy_type.lower():
        score += 0.8
    
    # Description match
    if policy.description and query_lower in policy.description.lower():
        score += 0.6
    
    return min(score, 1.0)

def calculate_document_relevance(document: PolicyDocument, query: str) -> float:
    """Calculate relevance score for a document"""
    if not query:
        return 0.5
    
    query_lower = query.lower()
    score = 0.0
    
    # Filename match
    if document.filename and query_lower in document.filename.lower():
        score += 0.9
    
    # Document type match
    if document.document_type and query_lower in document.document_type.lower():
        score += 0.7
    
    # Extracted text match
    if document.extracted_text and query_lower in document.extracted_text.lower():
        score += 0.8
    
    return min(score, 1.0)

def calculate_carrier_relevance(carrier: InsuranceCarrier, query: str) -> float:
    """Calculate relevance score for a carrier"""
    if not query:
        return 0.5
    
    query_lower = query.lower()
    score = 0.0
    
    # Name exact match gets highest score
    if carrier.name and query_lower in carrier.name.lower():
        score += 1.0
    
    # Email match
    if carrier.contact_email and query_lower in carrier.contact_email.lower():
        score += 0.6
    
    # Phone match
    if carrier.phone_number and query_lower in carrier.phone_number.lower():
        score += 0.5
    
    return min(score, 1.0)

def get_search_suggestions(db: Session, query: str, limit: int = 5) -> List[str]:
    """Generate search suggestions based on query"""
    suggestions = []
    
    if not query:
        # Return popular search terms when no query
        suggestions = [
            "health insurance",
            "dental coverage",
            "vision benefits",
            "life insurance",
            "policy documents"
        ]
    else:
        # Generate suggestions based on partial query
        query_lower = query.lower()
        
        # Get policy types that match
        policy_types = db.query(InsurancePolicy.policy_type).distinct().all()
        for (policy_type,) in policy_types:
            if policy_type and query_lower in policy_type.lower():
                suggestions.append(policy_type)
        
        # Get carrier names that match
        carriers = db.query(InsuranceCarrier.name).distinct().all()
        for (name,) in carriers:
            if name and query_lower in name.lower():
                suggestions.append(name)
        
        # Add some common search terms
        common_terms = [
            "red flags", "premium", "coverage", "benefits", 
            "deductible", "copay", "network", "claims"
        ]
        for term in common_terms:
            if query_lower in term:
                suggestions.append(term)
    
    return suggestions[:limit]
