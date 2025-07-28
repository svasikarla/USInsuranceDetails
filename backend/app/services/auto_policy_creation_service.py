"""
Automatic Policy Creation Service

This service handles the automatic creation of insurance policies from uploaded documents
using AI-extracted data with validation and confidence scoring.
"""

import logging
import uuid
from typing import Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from app.models import PolicyDocument, InsurancePolicy, User
from app.schemas.policy_extraction import (
    ExtractedPolicyDataSchema, 
    AutoPolicyCreationResponse,
    PolicyDataValidationResult,
    PolicyCreationWorkflow,
    POLICY_TYPE_CONFIGS
)
from app.schemas.policy import InsurancePolicyCreate
from app.services.ai_policy_extraction_service import ai_policy_extraction_service
from app.services.enhanced_policy_service import enhanced_policy_service
from app.services.policy_service import create_policy as base_create_policy

logger = logging.getLogger(__name__)


class AutoPolicyCreationService:
    """Service for automatic policy creation from documents"""
    
    def __init__(self):
        self.default_workflow = PolicyCreationWorkflow()
    
    def process_document_for_auto_creation(
        self,
        db: Session,
        document: PolicyDocument,
        user: User,
        workflow: Optional[PolicyCreationWorkflow] = None
    ) -> AutoPolicyCreationResponse:
        """
        Process a document for automatic policy creation
        
        Args:
            db: Database session
            document: PolicyDocument to process
            user: User who owns the document
            workflow: Custom workflow configuration
            
        Returns:
            AutoPolicyCreationResponse with creation results
        """
        if not workflow:
            workflow = self.default_workflow
        
        logger.info(f"Starting auto policy creation for document {document.id}")
        
        try:
            # Step 1: Extract policy data using AI
            extracted_data = ai_policy_extraction_service.extract_policy_data(document)
            
            # Step 2: Validate extracted data
            validation_result = self._validate_extracted_data(extracted_data, workflow)
            
            # Step 3: Determine if auto-creation should proceed
            should_auto_create = self._should_auto_create(extracted_data, validation_result, workflow)
            
            # Step 4: Create policy if conditions are met
            policy_id = None
            if should_auto_create:
                try:
                    policy_id = self._create_policy_from_extracted_data(
                        db, document, user, extracted_data, workflow
                    )
                    logger.info(f"Successfully auto-created policy {policy_id} for document {document.id}")
                except Exception as e:
                    logger.error(f"Failed to create policy from extracted data: {str(e)}")
                    validation_result.errors.append(f"Policy creation failed: {str(e)}")
            
            # Step 5: Build response
            response = AutoPolicyCreationResponse(
                success=policy_id is not None,
                policy_id=policy_id,
                extracted_data=ExtractedPolicyDataSchema(**extracted_data.__dict__),
                validation_errors=validation_result.errors,
                warnings=validation_result.warnings,
                requires_review=not should_auto_create or validation_result.confidence_score < workflow.review_required_threshold,
                confidence_score=validation_result.confidence_score
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Auto policy creation failed for document {document.id}: {str(e)}")
            return AutoPolicyCreationResponse(
                success=False,
                policy_id=None,
                extracted_data=ExtractedPolicyDataSchema(extraction_errors=[str(e)]),
                validation_errors=[f"Processing failed: {str(e)}"],
                requires_review=True,
                confidence_score=0.0
            )
    
    def _validate_extracted_data(
        self, 
        extracted_data, 
        workflow: PolicyCreationWorkflow
    ) -> PolicyDataValidationResult:
        """Validate extracted policy data"""
        errors = []
        warnings = []
        missing_required = []
        
        # Get policy type specific configuration
        policy_config = POLICY_TYPE_CONFIGS.get(
            extracted_data.policy_type, 
            POLICY_TYPE_CONFIGS[list(POLICY_TYPE_CONFIGS.keys())[0]]  # Default to first config
        )
        
        # Check required fields
        required_fields = workflow.required_fields or policy_config["required_fields"]
        for field in required_fields:
            value = getattr(extracted_data, field, None)
            if not value:
                missing_required.append(field)
                errors.append(f"Required field '{field}' is missing")
        
        # Check data consistency
        if extracted_data.effective_date and extracted_data.expiration_date:
            if extracted_data.expiration_date <= extracted_data.effective_date:
                errors.append("Expiration date must be after effective date")
        
        if extracted_data.deductible_family and extracted_data.deductible_individual:
            if extracted_data.deductible_family < extracted_data.deductible_individual:
                errors.append("Family deductible cannot be less than individual deductible")
        
        # Check for reasonable values
        if extracted_data.premium_monthly and extracted_data.premium_monthly > 5000:
            warnings.append("Monthly premium seems unusually high (>$5,000)")
        
        if extracted_data.deductible_individual and extracted_data.deductible_individual > 20000:
            warnings.append("Individual deductible seems unusually high (>$20,000)")
        
        # Calculate confidence and quality scores
        confidence_score = self._calculate_validation_confidence(extracted_data, errors, warnings)
        quality_score = self._calculate_data_quality_score(extracted_data)
        
        return PolicyDataValidationResult(
            is_valid=len(errors) == 0,
            confidence_score=confidence_score,
            errors=errors,
            warnings=warnings,
            missing_required_fields=missing_required,
            data_quality_score=quality_score,
            recommendations=self._generate_recommendations(extracted_data, errors, warnings)
        )
    
    def _should_auto_create(
        self,
        extracted_data,
        validation_result: PolicyDataValidationResult,
        workflow: PolicyCreationWorkflow
    ) -> bool:
        """Determine if policy should be auto-created"""
        # Must pass validation
        if not validation_result.is_valid:
            return False

        # Lower threshold for fallback data - we want to create something for the user to work with
        min_threshold = 0.3 if extracted_data.extraction_method == "pattern_matching_fallback" else workflow.auto_create_threshold
        if extracted_data.extraction_confidence < min_threshold:
            return False

        # Must have minimum required data (relaxed for fallback)
        if not extracted_data.policy_name and not extracted_data.policy_type:
            return False

        return True
    
    def _create_policy_from_extracted_data(
        self,
        db: Session,
        document: PolicyDocument,
        user: User,
        extracted_data,
        workflow: PolicyCreationWorkflow
    ) -> uuid.UUID:
        """Create policy from extracted data"""
        
        # Build policy creation data
        policy_data = InsurancePolicyCreate(
            document_id=document.id,
            carrier_id=document.carrier_id,
            policy_name=extracted_data.policy_name or f"Policy from {document.original_filename}",
            policy_type=extracted_data.policy_type,
            policy_number=extracted_data.policy_number,
            plan_year=extracted_data.plan_year,
            effective_date=extracted_data.effective_date,
            expiration_date=extracted_data.expiration_date,
            group_number=extracted_data.group_number,
            network_type=extracted_data.network_type,
            deductible_individual=extracted_data.deductible_individual,
            deductible_family=extracted_data.deductible_family,
            out_of_pocket_max_individual=extracted_data.out_of_pocket_max_individual,
            out_of_pocket_max_family=extracted_data.out_of_pocket_max_family,
            premium_monthly=extracted_data.premium_monthly,
            premium_annual=extracted_data.premium_annual
        )
        
        # Create policy using enhanced service if AI analysis is enabled
        if workflow.enable_ai_analysis:
            policy, red_flags, benefits = enhanced_policy_service.create_policy_with_ai_analysis(
                db=db,
                user_id=user.id,
                document_id=document.id,
                policy_type=policy_data.policy_type or "health",
                carrier_id=policy_data.carrier_id,
                policy_number=policy_data.policy_number,
                effective_date=str(policy_data.effective_date) if policy_data.effective_date else None,
                expiration_date=str(policy_data.expiration_date) if policy_data.expiration_date else None,
                premium_monthly=float(policy_data.premium_monthly) if policy_data.premium_monthly is not None else None,
                deductible_individual=float(policy_data.deductible_individual) if policy_data.deductible_individual is not None else None,
                out_of_pocket_max_individual=float(policy_data.out_of_pocket_max_individual) if policy_data.out_of_pocket_max_individual is not None else None,
                use_ai_analysis=True
            )
            
            # Update policy with additional extracted data
            policy.policy_name = policy_data.policy_name
            policy.plan_year = policy_data.plan_year
            policy.group_number = policy_data.group_number
            policy.network_type = policy_data.network_type
            policy.deductible_family = policy_data.deductible_family
            policy.out_of_pocket_max_family = policy_data.out_of_pocket_max_family
            policy.premium_annual = policy_data.premium_annual
            
            db.commit()
            db.refresh(policy)
            
        else:
            # Create policy using basic service
            policy = base_create_policy(db=db, obj_in=policy_data, user_id=user.id)
        
        return policy.id
    
    def _calculate_validation_confidence(self, extracted_data, errors: list, warnings: list) -> float:
        """Calculate confidence score for validation"""
        base_confidence = extracted_data.extraction_confidence
        
        # Reduce confidence for errors and warnings
        error_penalty = len(errors) * 0.2
        warning_penalty = len(warnings) * 0.1
        
        # Boost confidence for having key fields
        key_fields_bonus = 0.0
        key_fields = ['policy_name', 'policy_type', 'deductible_individual', 'premium_monthly']
        for field in key_fields:
            if getattr(extracted_data, field, None):
                key_fields_bonus += 0.05
        
        final_confidence = base_confidence - error_penalty - warning_penalty + key_fields_bonus
        return max(0.0, min(1.0, final_confidence))
    
    def _calculate_data_quality_score(self, extracted_data) -> float:
        """Calculate overall data quality score"""
        total_fields = 16  # Total number of extractable fields
        filled_fields = 0
        
        # Count filled fields
        for field in ['policy_name', 'policy_type', 'policy_number', 'plan_year',
                     'group_number', 'network_type', 'effective_date', 'expiration_date',
                     'deductible_individual', 'deductible_family', 'out_of_pocket_max_individual',
                     'out_of_pocket_max_family', 'premium_monthly', 'premium_annual']:
            if getattr(extracted_data, field, None):
                filled_fields += 1
        
        completeness_score = filled_fields / total_fields
        
        # Factor in extraction confidence
        quality_score = (completeness_score * 0.6) + (extracted_data.extraction_confidence * 0.4)
        
        return min(1.0, quality_score)
    
    def _generate_recommendations(self, extracted_data, errors: list, warnings: list) -> list:
        """Generate recommendations for improving data quality"""
        recommendations = []
        
        if not extracted_data.policy_name:
            recommendations.append("Add a descriptive policy name")
        
        if not extracted_data.policy_type:
            recommendations.append("Specify the policy type (health, dental, vision, life)")
        
        if not extracted_data.effective_date:
            recommendations.append("Add policy effective date")
        
        if not extracted_data.premium_monthly and not extracted_data.premium_annual:
            recommendations.append("Add premium information (monthly or annual)")
        
        if extracted_data.extraction_confidence < 0.7:
            recommendations.append("Review extracted data for accuracy - low confidence extraction")
        
        if len(errors) > 0:
            recommendations.append("Fix validation errors before proceeding")
        
        if len(warnings) > 0:
            recommendations.append("Review warnings and verify unusual values")
        
        return recommendations


# Global service instance
auto_policy_creation_service = AutoPolicyCreationService()
