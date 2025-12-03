"""
Enhanced Policy Service with AI Integration

This service extends the basic policy service with AI-powered analysis capabilities
using Google Gemini LLM for comprehensive red flag detection and benefit extraction.
"""

import logging
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
import uuid

from app.models import InsurancePolicy, PolicyDocument, RedFlag, CoverageBenefit
from app.services.ai_analysis_service import ai_analysis_service, AnalysisType
from app.services.policy_service import (
    create_policy as base_create_policy,
    analyze_policy_and_generate_benefits_flags as basic_analysis
)
from app.services.enhanced_red_flag_service import enhanced_red_flag_service
from app.schemas.policy import InsurancePolicyCreate
from app.core.config import settings
from decimal import Decimal
from datetime import datetime

logger = logging.getLogger(__name__)

class EnhancedPolicyService:
    """
    Enhanced policy service with AI-powered analysis capabilities
    """
    
    def __init__(self):
        self.ai_enabled = settings.AI_ANALYSIS_ENABLED and ai_analysis_service.is_available()
        if not self.ai_enabled:
            logger.warning("AI analysis is disabled or unavailable. Falling back to basic analysis.")
    
    def create_policy_with_ai_analysis(
        self,
        db: Session,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
        policy_type: str,
        carrier_id: Optional[uuid.UUID] = None,
        policy_number: Optional[str] = None,
        effective_date: Optional[str] = None,
        expiration_date: Optional[str] = None,
        premium_monthly: Optional[float] = None,
        deductible_individual: Optional[float] = None,
        out_of_pocket_max_individual: Optional[float] = None,
        use_ai_analysis: bool = True
    ) -> Tuple[InsurancePolicy, List[RedFlag], List[CoverageBenefit]]:
        """
        Create a new policy with enhanced AI-powered analysis
        
        Args:
            db: Database session
            user_id: User ID creating the policy
            document_id: Associated document ID
            policy_type: Type of insurance policy
            carrier_id: Insurance carrier ID
            policy_number: Policy number
            effective_date: Policy effective date
            expiration_date: Policy expiration date
            premium_monthly: Monthly premium amount
            deductible_individual: Individual deductible amount
            out_of_pocket_max_individual: Individual out-of-pocket maximum
            use_ai_analysis: Whether to use AI analysis (default: True)
            
        Returns:
            Tuple of (created_policy, red_flags, benefits)
        """
        # Create the basic policy using existing service
        # Convert parameters to proper schema object
        policy_data = InsurancePolicyCreate(
            document_id=document_id,
            carrier_id=carrier_id,
            policy_name=f"Policy from Document",  # Default name, can be updated later
            policy_type=policy_type,
            policy_number=policy_number,
            effective_date=datetime.strptime(effective_date, '%Y-%m-%d').date() if effective_date else None,
            expiration_date=datetime.strptime(expiration_date, '%Y-%m-%d').date() if expiration_date else None,
            premium_monthly=Decimal(str(premium_monthly)) if premium_monthly is not None else None,
            deductible_individual=Decimal(str(deductible_individual)) if deductible_individual is not None else None,
            out_of_pocket_max_individual=Decimal(str(out_of_pocket_max_individual)) if out_of_pocket_max_individual is not None else None
        )

        policy = base_create_policy(
            db=db,
            obj_in=policy_data,
            user_id=user_id
        )
        
        # Get the associated document
        document = db.query(PolicyDocument).filter(PolicyDocument.id == document_id).first()
        if not document:
            logger.error(f"Document not found: {document_id}")
            return policy, [], []
        
        # Perform analysis based on availability and preference
        red_flags, benefits = self._analyze_policy_document(
            db=db,
            policy=policy,
            document=document,
            use_ai_analysis=use_ai_analysis and self.ai_enabled
        )
        
        return policy, red_flags, benefits
    
    def reanalyze_policy_with_ai(
        self,
        db: Session,
        policy_id: uuid.UUID,
        force_ai: bool = False
    ) -> Tuple[List[RedFlag], List[CoverageBenefit]]:
        """
        Re-analyze an existing policy with AI capabilities
        
        Args:
            db: Database session
            policy_id: Policy ID to re-analyze
            force_ai: Force AI analysis even if disabled
            
        Returns:
            Tuple of (new_red_flags, new_benefits)
        """
        # Get the policy and document
        policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id).first()
        if not policy:
            logger.error(f"Policy not found: {policy_id}")
            return [], []
        
        document = db.query(PolicyDocument).filter(PolicyDocument.id == policy.document_id).first()
        if not document:
            logger.error(f"Document not found for policy: {policy_id}")
            return [], []
        
        # Clear existing AI-generated analysis
        self._clear_ai_analysis(db, policy_id)
        
        # Perform new analysis
        use_ai = (force_ai or self.ai_enabled) and ai_analysis_service.is_available()
        red_flags, benefits = self._analyze_policy_document(
            db=db,
            policy=policy,
            document=document,
            use_ai_analysis=use_ai
        )
        
        logger.info(f"Re-analysis completed for policy {policy_id}: {len(red_flags)} red flags, {len(benefits)} benefits")
        return red_flags, benefits
    
    def _analyze_policy_document(
        self,
        db: Session,
        policy: InsurancePolicy,
        document: PolicyDocument,
        use_ai_analysis: bool = True
    ) -> Tuple[List[RedFlag], List[CoverageBenefit]]:
        """
        Analyze policy document using AI or fallback to basic analysis
        """
        if use_ai_analysis and document.extracted_text:
            try:
                # Perform AI analysis
                logger.info(f"Starting AI analysis for policy {policy.id}")
                analysis_result = ai_analysis_service.analyze_policy_document(
                    document=document,
                    analysis_type=AnalysisType.COMPREHENSIVE
                )
                
                if analysis_result and (analysis_result.red_flags or analysis_result.benefits):
                    # Save AI analysis results
                    red_flags, benefits = ai_analysis_service.save_analysis_results(
                        db=db,
                        policy=policy,
                        analysis_result=analysis_result
                    )
                    
                    logger.info(f"AI analysis completed for policy {policy.id}: "
                              f"{len(red_flags)} red flags, {len(benefits)} benefits, "
                              f"confidence: {analysis_result.total_confidence:.2f}")
                    
                    return red_flags, benefits
                else:
                    logger.warning(f"AI analysis returned no results for policy {policy.id}, falling back to basic analysis")
                    
            except Exception as e:
                logger.error(f"AI analysis failed for policy {policy.id}: {str(e)}, falling back to basic analysis")
        
        # Fallback to enhanced pattern-based analysis
        logger.info(f"Using enhanced pattern-based analysis for policy {policy.id}")
        try:
            # Use enhanced red flag service for better detection
            red_flags = enhanced_red_flag_service.analyze_policy_with_duplicate_prevention(
                db=db,
                policy=policy,
                document=document
            )

            # Also run basic analysis for benefits
            basic_analysis(db, policy, document)

            # Get the created benefits
            benefits = db.query(CoverageBenefit).filter(CoverageBenefit.policy_id == policy.id).all()

            logger.info(f"Enhanced pattern analysis completed: {len(red_flags)} red flags, {len(benefits)} benefits")
            return red_flags, benefits

        except Exception as e:
            logger.error(f"Enhanced pattern analysis failed for policy {policy.id}: {str(e)}")
            return [], []
    
    def _clear_ai_analysis(self, db: Session, policy_id: uuid.UUID) -> None:
        """
        Clear existing AI-generated red flags and benefits for re-analysis
        """
        try:
            # Remove AI-generated red flags
            ai_red_flags = db.query(RedFlag).filter(
                RedFlag.policy_id == policy_id,
                RedFlag.detected_by == "ai"
            ).all()
            
            for red_flag in ai_red_flags:
                db.delete(red_flag)
            
            # Note: We don't delete benefits as they don't have a detected_by field
            # In a production system, you might want to add a similar field to benefits
            
            db.commit()
            logger.info(f"Cleared {len(ai_red_flags)} AI-generated red flags for policy {policy_id}")
            
        except Exception as e:
            logger.error(f"Error clearing AI analysis for policy {policy_id}: {str(e)}")
            db.rollback()
    
    def get_analysis_status(self, policy_id: uuid.UUID, db: Session) -> dict:
        """
        Get the analysis status and metadata for a policy
        """
        policy = db.query(InsurancePolicy).filter(InsurancePolicy.id == policy_id).first()
        if not policy:
            return {"error": "Policy not found"}
        
        red_flags = db.query(RedFlag).filter(RedFlag.policy_id == policy_id).all()
        benefits = db.query(CoverageBenefit).filter(CoverageBenefit.policy_id == policy_id).all()
        
        ai_red_flags = [rf for rf in red_flags if rf.detected_by == "ai"]
        system_red_flags = [rf for rf in red_flags if rf.detected_by == "system"]
        
        return {
            "policy_id": str(policy_id),
            "ai_analysis_available": self.ai_enabled,
            "total_red_flags": len(red_flags),
            "ai_red_flags": len(ai_red_flags),
            "system_red_flags": len(system_red_flags),
            "total_benefits": len(benefits),
            "analysis_confidence": sum(rf.confidence_score or 0 for rf in ai_red_flags) / len(ai_red_flags) if ai_red_flags else None
        }


# Global service instance
enhanced_policy_service = EnhancedPolicyService()
