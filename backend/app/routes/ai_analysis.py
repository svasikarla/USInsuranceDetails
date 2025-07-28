"""
AI Analysis API Routes

This module provides API endpoints for AI-powered policy analysis,
including red flag detection, benefit extraction, and monitoring.
"""

from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
import uuid

from app.utils.db import get_db
from app.core.dependencies import get_current_user
from app import schemas, models
from app.services.enhanced_policy_service import enhanced_policy_service
from app.services.ai_analysis_service import ai_analysis_service, AnalysisType
from app.services.ai_monitoring_service import ai_monitoring_service
from app.services.text_extraction_service import text_extraction_service

router = APIRouter()

# Pydantic schemas for AI analysis
from pydantic import BaseModel

class AIAnalysisRequest(BaseModel):
    """Request schema for AI analysis"""
    policy_id: UUID
    analysis_type: str = "comprehensive"  # "red_flags", "benefits", "comprehensive"
    force_reanalysis: bool = False

class AIAnalysisResponse(BaseModel):
    """Response schema for AI analysis"""
    analysis_id: str
    policy_id: str
    status: str
    message: str
    red_flags_detected: Optional[int] = None
    benefits_extracted: Optional[int] = None
    confidence_score: Optional[float] = None
    processing_time: Optional[float] = None

class TextExtractionRequest(BaseModel):
    """Request schema for text extraction"""
    document_id: UUID
    force_reextraction: bool = False

class TextExtractionResponse(BaseModel):
    """Response schema for text extraction"""
    document_id: str
    extraction_method: str
    confidence_score: float
    text_quality: str
    word_count: int
    processing_time: float
    error_message: Optional[str] = None

@router.post("/analyze-policy", response_model=AIAnalysisResponse)
async def analyze_policy_with_ai(
    *,
    db: Session = Depends(get_db),
    request: AIAnalysisRequest,
    current_user: schemas.User = Depends(get_current_user),
    background_tasks: BackgroundTasks
) -> Any:
    """
    Perform AI analysis on a policy document
    """
    # Verify policy exists and user has access
    policy = db.query(models.InsurancePolicy).filter(
        models.InsurancePolicy.id == request.policy_id
    ).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to analyze this policy"
        )
    
    # Check if AI service is available
    if not ai_analysis_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI analysis service is not available. Please check configuration."
        )
    
    # Get the associated document
    document = db.query(models.PolicyDocument).filter(
        models.PolicyDocument.id == policy.document_id
    ).first()
    
    if not document or not document.extracted_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Policy document not found or text not extracted"
        )
    
    # Validate analysis type
    try:
        analysis_type = AnalysisType(request.analysis_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid analysis type. Must be one of: {[t.value for t in AnalysisType]}"
        )
    
    # Start monitoring
    analysis_id = ai_monitoring_service.start_analysis(
        policy_id=str(policy.id),
        document_id=str(document.id),
        analysis_type=analysis_type,
        db=db
    )
    
    # Perform analysis in background
    background_tasks.add_task(
        _perform_ai_analysis_background,
        analysis_id,
        policy,
        document,
        analysis_type,
        request.force_reanalysis
    )
    
    return AIAnalysisResponse(
        analysis_id=analysis_id,
        policy_id=str(policy.id),
        status="processing",
        message="AI analysis started. Check status using the analysis ID."
    )

@router.get("/analysis-status/{analysis_id}", response_model=AIAnalysisResponse)
async def get_analysis_status(
    *,
    db: Session = Depends(get_db),
    analysis_id: str,
    current_user: schemas.User = Depends(get_current_user)
) -> Any:
    """
    Get the status of an AI analysis operation
    """
    # Get analysis log from database
    log = db.query(models.AIAnalysisLog).filter(
        models.AIAnalysisLog.analysis_id == analysis_id
    ).first()
    
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis not found"
        )
    
    # Verify user has access to this analysis
    policy = db.query(models.InsurancePolicy).filter(
        models.InsurancePolicy.id == log.policy_id
    ).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated policy not found"
        )
    
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to view this analysis"
        )
    
    return AIAnalysisResponse(
        analysis_id=log.analysis_id,
        policy_id=str(log.policy_id),
        status=log.status,
        message=log.error_message or f"Analysis {log.status}",
        red_flags_detected=log.red_flags_detected,
        benefits_extracted=log.benefits_extracted,
        confidence_score=log.confidence_score,
        processing_time=log.processing_time_seconds
    )

@router.post("/reanalyze-policy/{policy_id}")
async def reanalyze_policy(
    *,
    db: Session = Depends(get_db),
    policy_id: UUID,
    current_user: schemas.User = Depends(get_current_user),
    background_tasks: BackgroundTasks,
    force_ai: bool = False
) -> Any:
    """
    Re-analyze an existing policy with AI
    """
    # Verify policy exists and user has access
    policy = db.query(models.InsurancePolicy).filter(
        models.InsurancePolicy.id == policy_id
    ).first()
    
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Policy not found"
        )
    
    if policy.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to reanalyze this policy"
        )
    
    # Perform re-analysis
    try:
        red_flags, benefits = enhanced_policy_service.reanalyze_policy_with_ai(
            db=db,
            policy_id=policy_id,
            force_ai=force_ai
        )
        
        return {
            "message": "Policy re-analysis completed",
            "policy_id": str(policy_id),
            "red_flags_detected": len(red_flags),
            "benefits_extracted": len(benefits)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Re-analysis failed: {str(e)}"
        )

@router.post("/extract-text", response_model=TextExtractionResponse)
async def extract_text_from_document(
    *,
    db: Session = Depends(get_db),
    request: TextExtractionRequest,
    current_user: schemas.User = Depends(get_current_user)
) -> Any:
    """
    Extract text from a document using enhanced extraction methods
    """
    # Verify document exists and user has access
    document = db.query(models.PolicyDocument).filter(
        models.PolicyDocument.id == request.document_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    if document.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to process this document"
        )
    
    # Check if re-extraction is needed
    if document.extracted_text and not request.force_reextraction:
        return TextExtractionResponse(
            document_id=str(document.id),
            extraction_method="cached",
            confidence_score=document.ocr_confidence_score or 1.0,
            text_quality="existing",
            word_count=len(document.extracted_text.split()),
            processing_time=0.0,
            error_message=None
        )
    
    # Perform text extraction
    try:
        result = text_extraction_service.extract_text_from_file(
            file_path=document.file_path,
            mime_type=document.mime_type
        )
        
        # Update document with new extraction results
        document.extracted_text = result.text
        document.ocr_confidence_score = result.confidence_score
        document.processing_status = "completed" if result.text else "failed"
        document.processing_error = result.error_message
        
        db.commit()
        
        return TextExtractionResponse(
            document_id=str(document.id),
            extraction_method=result.extraction_method,
            confidence_score=result.confidence_score,
            text_quality=result.text_quality,
            word_count=result.word_count,
            processing_time=result.processing_time,
            error_message=result.error_message
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}"
        )

@router.get("/analysis-metrics")
async def get_analysis_metrics(
    *,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
    hours: int = 24,
    policy_id: Optional[str] = None
) -> Any:
    """
    Get AI analysis metrics for monitoring (admin only)
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    metrics = ai_monitoring_service.get_analysis_metrics(
        db=db,
        policy_id=policy_id,
        hours=hours
    )
    
    return {"metrics": metrics}

@router.get("/performance-stats")
async def get_performance_stats(
    *,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user),
    hours: int = 24
) -> Any:
    """
    Get AI pipeline performance statistics (admin only)
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    stats = ai_monitoring_service.get_performance_stats(db=db, hours=hours)
    return stats

async def _perform_ai_analysis_background(
    analysis_id: str,
    policy: models.InsurancePolicy,
    document: models.PolicyDocument,
    analysis_type: AnalysisType,
    force_reanalysis: bool
) -> None:
    """
    Background task for performing AI analysis
    """
    from app.utils.db import SessionLocal
    db = SessionLocal()
    
    try:
        # Update status to processing
        ai_monitoring_service.update_analysis_status(
            analysis_id=analysis_id,
            status=ai_monitoring_service.AnalysisStatus.PROCESSING,
            db=db
        )
        
        # Perform the analysis
        analysis_result = ai_analysis_service.analyze_policy_document(
            document=document,
            analysis_type=analysis_type
        )
        
        if analysis_result:
            # Save results to database
            red_flags, benefits = ai_analysis_service.save_analysis_results(
                db=db,
                policy=policy,
                analysis_result=analysis_result
            )
            
            # Complete monitoring
            ai_monitoring_service.complete_analysis(
                analysis_id=analysis_id,
                db=db,
                red_flags_count=len(red_flags),
                benefits_count=len(benefits),
                confidence_score=analysis_result.total_confidence,
                api_calls=1
            )
        else:
            # Analysis failed
            ai_monitoring_service.fail_analysis(
                analysis_id=analysis_id,
                db=db,
                error_message="AI analysis returned no results"
            )
            
    except Exception as e:
        # Analysis failed with exception
        ai_monitoring_service.fail_analysis(
            analysis_id=analysis_id,
            db=db,
            error_message=str(e)
        )
    
    finally:
        db.close()
