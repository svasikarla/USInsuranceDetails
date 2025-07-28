"""
Schemas for AI Policy Data Extraction

These schemas define the structure for AI-extracted policy data,
validation rules, and automatic policy creation workflows.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import date, datetime
from decimal import Decimal
from enum import Enum


class PolicyType(str, Enum):
    """Supported policy types"""
    HEALTH = "health"
    DENTAL = "dental"
    VISION = "vision"
    LIFE = "life"


class NetworkType(str, Enum):
    """Supported network types"""
    HMO = "HMO"
    PPO = "PPO"
    EPO = "EPO"
    POS = "POS"


class ExtractionMethod(str, Enum):
    """Methods used for data extraction"""
    AI = "ai"
    PATTERN_MATCHING = "pattern_matching"
    MANUAL = "manual"
    HYBRID = "hybrid"


class DataQuality(str, Enum):
    """Quality assessment for extracted data"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    POOR = "poor"


class ExtractedPolicyDataSchema(BaseModel):
    """Schema for AI-extracted policy data"""
    
    # Basic Policy Information
    policy_name: Optional[str] = Field(None, description="Full policy or plan name")
    policy_type: Optional[PolicyType] = Field(None, description="Type of insurance policy")
    policy_number: Optional[str] = Field(None, description="Policy number or identifier")
    plan_year: Optional[str] = Field(None, description="Plan year (e.g., '2025')")
    group_number: Optional[str] = Field(None, description="Group number if applicable")
    network_type: Optional[NetworkType] = Field(None, description="Network type")
    
    # Dates
    effective_date: Optional[date] = Field(None, description="Policy effective date")
    expiration_date: Optional[date] = Field(None, description="Policy expiration date")
    
    # Financial Information (in USD)
    deductible_individual: Optional[Decimal] = Field(None, ge=0, description="Individual deductible amount")
    deductible_family: Optional[Decimal] = Field(None, ge=0, description="Family deductible amount")
    out_of_pocket_max_individual: Optional[Decimal] = Field(None, ge=0, description="Individual out-of-pocket maximum")
    out_of_pocket_max_family: Optional[Decimal] = Field(None, ge=0, description="Family out-of-pocket maximum")
    premium_monthly: Optional[Decimal] = Field(None, ge=0, description="Monthly premium amount")
    premium_annual: Optional[Decimal] = Field(None, ge=0, description="Annual premium amount")
    
    # Extraction Metadata
    extraction_confidence: float = Field(0.0, ge=0.0, le=1.0, description="Confidence score for extraction")
    extraction_method: ExtractionMethod = Field(ExtractionMethod.AI, description="Method used for extraction")
    extraction_errors: List[str] = Field(default_factory=list, description="List of extraction errors")
    missing_fields: List[str] = Field(default_factory=list, description="Fields that couldn't be extracted")
    data_quality: Optional[DataQuality] = Field(None, description="Overall data quality assessment")
    extraction_timestamp: datetime = Field(default_factory=datetime.utcnow, description="When extraction was performed")
    raw_ai_response: Optional[Dict[str, Any]] = Field(None, description="Raw AI response for debugging")
    
    @validator('effective_date', 'expiration_date')
    def validate_dates(cls, v, values):
        """Validate date fields"""
        if v and v > date(2030, 12, 31):
            raise ValueError("Date cannot be more than 5 years in the future")
        if v and v < date(2020, 1, 1):
            raise ValueError("Date cannot be before 2020")
        return v
    
    @validator('expiration_date')
    def validate_expiration_after_effective(cls, v, values):
        """Ensure expiration date is after effective date"""
        if v and 'effective_date' in values and values['effective_date']:
            if v <= values['effective_date']:
                raise ValueError("Expiration date must be after effective date")
        return v
    
    @validator('deductible_family')
    def validate_family_deductible(cls, v, values):
        """Ensure family deductible is >= individual deductible"""
        if v and 'deductible_individual' in values and values['deductible_individual']:
            if v < values['deductible_individual']:
                raise ValueError("Family deductible cannot be less than individual deductible")
        return v
    
    @validator('out_of_pocket_max_family')
    def validate_family_oop_max(cls, v, values):
        """Ensure family OOP max is >= individual OOP max"""
        if v and 'out_of_pocket_max_individual' in values and values['out_of_pocket_max_individual']:
            if v < values['out_of_pocket_max_individual']:
                raise ValueError("Family out-of-pocket max cannot be less than individual max")
        return v
    
    @validator('premium_annual')
    def validate_annual_premium(cls, v, values):
        """Validate annual premium consistency with monthly"""
        if v and 'premium_monthly' in values and values['premium_monthly']:
            expected_annual = values['premium_monthly'] * Decimal('12')
            # Allow 10% variance for rounding/fees
            variance_threshold = expected_annual * Decimal('0.1')
            if abs(v - expected_annual) > variance_threshold:
                raise ValueError("Annual premium should be approximately 12x monthly premium")
        return v


class AutoPolicyCreationRequest(BaseModel):
    """Request schema for automatic policy creation"""
    document_id: UUID = Field(..., description="ID of the processed document")
    carrier_id: Optional[UUID] = Field(None, description="Insurance carrier ID")
    force_creation: bool = Field(False, description="Force creation even with low confidence")
    min_confidence_threshold: float = Field(0.6, ge=0.0, le=1.0, description="Minimum confidence for auto-creation")
    user_overrides: Optional[Dict[str, Any]] = Field(None, description="User-provided data overrides")


class AutoPolicyCreationResponse(BaseModel):
    """Response schema for automatic policy creation"""
    success: bool = Field(..., description="Whether policy creation was successful")
    policy_id: Optional[UUID] = Field(None, description="Created policy ID")
    extracted_data: ExtractedPolicyDataSchema = Field(..., description="Extracted policy data")
    validation_errors: List[str] = Field(default_factory=list, description="Validation errors encountered")
    warnings: List[str] = Field(default_factory=list, description="Warnings about extracted data")
    requires_review: bool = Field(False, description="Whether manual review is recommended")
    confidence_score: float = Field(0.0, description="Overall confidence in extracted data")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")


class PolicyDataValidationResult(BaseModel):
    """Result of policy data validation"""
    is_valid: bool = Field(..., description="Whether data passes validation")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in validation")
    errors: List[str] = Field(default_factory=list, description="Validation errors")
    warnings: List[str] = Field(default_factory=list, description="Validation warnings")
    missing_required_fields: List[str] = Field(default_factory=list, description="Required fields that are missing")
    data_quality_score: float = Field(0.0, ge=0.0, le=1.0, description="Overall data quality score")
    recommendations: List[str] = Field(default_factory=list, description="Recommendations for improvement")


class PolicyExtractionStatus(BaseModel):
    """Status of policy extraction process"""
    document_id: UUID = Field(..., description="Document ID")
    status: str = Field(..., description="Extraction status")
    progress: float = Field(0.0, ge=0.0, le=1.0, description="Progress percentage")
    current_step: str = Field("", description="Current processing step")
    estimated_completion: Optional[datetime] = Field(None, description="Estimated completion time")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    started_at: datetime = Field(default_factory=datetime.utcnow, description="When extraction started")
    completed_at: Optional[datetime] = Field(None, description="When extraction completed")


class PolicyDataConfidenceMetrics(BaseModel):
    """Detailed confidence metrics for extracted policy data"""
    overall_confidence: float = Field(..., ge=0.0, le=1.0, description="Overall confidence score")
    field_confidence: Dict[str, float] = Field(default_factory=dict, description="Per-field confidence scores")
    extraction_method_confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in extraction method")
    text_quality_score: float = Field(..., ge=0.0, le=1.0, description="Quality of source text")
    completeness_score: float = Field(..., ge=0.0, le=1.0, description="Completeness of extracted data")
    consistency_score: float = Field(..., ge=0.0, le=1.0, description="Internal consistency of data")
    
    def calculate_overall_confidence(self) -> float:
        """Calculate overall confidence based on component scores"""
        scores = [
            self.extraction_method_confidence,
            self.text_quality_score,
            self.completeness_score,
            self.consistency_score
        ]
        # Weight the scores (extraction method and consistency are most important)
        weights = [0.4, 0.2, 0.2, 0.2]
        weighted_score = sum(score * weight for score, weight in zip(scores, weights))
        return min(weighted_score, 1.0)


class PolicyCreationWorkflow(BaseModel):
    """Workflow configuration for automatic policy creation"""
    auto_create_threshold: float = Field(0.8, ge=0.0, le=1.0, description="Confidence threshold for auto-creation")
    review_required_threshold: float = Field(0.6, ge=0.0, le=1.0, description="Threshold below which review is required")
    required_fields: List[str] = Field(
        default_factory=lambda: ["policy_name", "policy_type"],
        description="Fields required for policy creation"
    )
    enable_ai_analysis: bool = Field(True, description="Whether to run AI analysis after creation")
    enable_red_flag_detection: bool = Field(True, description="Whether to detect red flags")
    enable_benefit_extraction: bool = Field(True, description="Whether to extract benefits")
    notification_settings: Dict[str, bool] = Field(
        default_factory=lambda: {
            "notify_on_success": True,
            "notify_on_failure": True,
            "notify_on_low_confidence": True
        },
        description="Notification preferences"
    )


# Configuration for different policy types
POLICY_TYPE_CONFIGS = {
    PolicyType.HEALTH: {
        "required_fields": ["policy_name", "policy_type", "deductible_individual"],
        "recommended_fields": ["premium_monthly", "out_of_pocket_max_individual", "network_type"],
        "auto_create_threshold": 0.75,
        "review_threshold": 0.6
    },
    PolicyType.DENTAL: {
        "required_fields": ["policy_name", "policy_type"],
        "recommended_fields": ["premium_monthly", "deductible_individual"],
        "auto_create_threshold": 0.7,
        "review_threshold": 0.5
    },
    PolicyType.VISION: {
        "required_fields": ["policy_name", "policy_type"],
        "recommended_fields": ["premium_monthly"],
        "auto_create_threshold": 0.7,
        "review_threshold": 0.5
    },
    PolicyType.LIFE: {
        "required_fields": ["policy_name", "policy_type"],
        "recommended_fields": ["premium_monthly", "premium_annual"],
        "auto_create_threshold": 0.8,
        "review_threshold": 0.6
    }
}
