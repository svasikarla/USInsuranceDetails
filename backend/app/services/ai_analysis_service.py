"""
AI Analysis Service for Google Gemini LLM Integration

This service provides comprehensive AI-powered analysis of insurance policy documents
using Google Gemini LLM for red flag detection, benefit extraction, and policy analysis.
"""

import json
import logging
import time
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import PolicyDocument, InsurancePolicy, RedFlag, CoverageBenefit
from app.services.policy_service import create_red_flag, create_benefit

# Configure logging
logger = logging.getLogger(__name__)

class AnalysisType(Enum):
    """Types of AI analysis that can be performed"""
    RED_FLAGS = "red_flags"
    BENEFITS = "benefits"
    COMPREHENSIVE = "comprehensive"

class ConfidenceLevel(Enum):
    """AI confidence levels for analysis results"""
    HIGH = "high"      # 0.8 - 1.0
    MEDIUM = "medium"  # 0.6 - 0.8
    LOW = "low"        # 0.4 - 0.6
    VERY_LOW = "very_low"  # 0.0 - 0.4

@dataclass
class RedFlagResult:
    """Structured result for red flag detection"""
    flag_type: str
    severity: str
    title: str
    description: str
    source_text: str
    page_number: Optional[str]
    recommendation: str
    confidence_score: float
    reasoning: str
    # Categorization fields
    regulatory_level: Optional[str] = None
    prominent_category: Optional[str] = None
    federal_regulation: Optional[str] = None
    state_regulation: Optional[str] = None
    state_code: Optional[str] = None
    regulatory_context: Optional[str] = None
    risk_level: Optional[str] = None

@dataclass
class BenefitResult:
    """Structured result for benefit extraction"""
    category: str
    name: str
    coverage_percentage: Optional[float]
    copay_amount: Optional[float]
    coinsurance_percentage: Optional[float]
    requires_preauth: bool
    network_restriction: Optional[str]
    annual_limit: Optional[float]
    visit_limit: Optional[int]
    notes: str
    confidence_score: float
    # Categorization fields
    regulatory_level: Optional[str] = None
    prominent_category: Optional[str] = None
    federal_regulation: Optional[str] = None
    state_regulation: Optional[str] = None
    state_code: Optional[str] = None
    regulatory_context: Optional[str] = None

@dataclass
class AnalysisResult:
    """Complete analysis result from AI processing"""
    red_flags: List[RedFlagResult]
    benefits: List[BenefitResult]
    processing_time: float
    total_confidence: float
    analysis_metadata: Dict[str, Any]

class GeminiAnalysisService:
    """
    Google Gemini LLM service for insurance policy analysis
    """
    
    def __init__(self):
        """Initialize the Gemini AI service"""
        self.model_name = "gemini-1.5-pro"
        self.max_retries = 3
        self.retry_delay = 1.0
        self.max_tokens = 8192
        
        # Configure Gemini API
        if hasattr(settings, 'GOOGLE_AI_API_KEY') and settings.GOOGLE_AI_API_KEY:
            genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
            self.model = genai.GenerativeModel(
                model_name=self.model_name,
                safety_settings={
                    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
                }
            )
        else:
            logger.warning("Google AI API key not configured. AI analysis will be disabled.")
            self.model = None
    
    def is_available(self) -> bool:
        """Check if the AI service is available"""
        return self.model is not None
    
    def analyze_policy_document(
        self, 
        document: PolicyDocument, 
        analysis_type: AnalysisType = AnalysisType.COMPREHENSIVE
    ) -> Optional[AnalysisResult]:
        """
        Perform comprehensive AI analysis of a policy document
        
        Args:
            document: PolicyDocument to analyze
            analysis_type: Type of analysis to perform
            
        Returns:
            AnalysisResult with detected red flags and benefits
        """
        if not self.is_available():
            logger.error("AI service not available")
            return None
            
        if not document.extracted_text:
            logger.error(f"No extracted text available for document {document.id}")
            return None
        
        start_time = time.time()
        
        try:
            # Preprocess the text
            processed_text = self._preprocess_text(document.extracted_text)
            
            # Generate analysis prompt based on type
            prompt = self._generate_analysis_prompt(processed_text, analysis_type)
            
            # Call Gemini API with retry logic
            response = self._call_gemini_with_retry(prompt)
            
            if not response:
                return None
            
            # Parse the structured response
            analysis_result = self._parse_analysis_response(response, time.time() - start_time)
            
            logger.info(f"AI analysis completed for document {document.id} in {analysis_result.processing_time:.2f}s")
            return analysis_result
            
        except Exception as e:
            logger.error(f"Error during AI analysis: {str(e)}")
            return None
    
    def _preprocess_text(self, text: str) -> str:
        """
        Preprocess and clean the extracted text for better AI analysis
        """
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Limit text length to avoid token limits
        if len(text) > 50000:  # Approximate token limit
            text = text[:50000] + "... [Text truncated for analysis]"
        
        return text
    
    def _generate_analysis_prompt(self, text: str, analysis_type: AnalysisType) -> str:
        """
        Generate the analysis prompt for Gemini based on analysis type
        """
        base_prompt = f"""
You are an expert insurance policy analyst. Analyze the following insurance policy document and provide a comprehensive analysis.

POLICY DOCUMENT TEXT:
{text}

Please analyze this insurance policy document and return your findings in the following JSON format:
"""
        
        if analysis_type in [AnalysisType.RED_FLAGS, AnalysisType.COMPREHENSIVE]:
            base_prompt += """
{
  "red_flags": [
    {
      "flag_type": "preauth_required|coverage_limitation|exclusion|network_limitation|high_cost|deductible_concern|copay_concern",
      "severity": "critical|high|medium|low",
      "title": "Brief descriptive title",
      "description": "Detailed explanation of the red flag",
      "source_text": "Exact text from document that triggered this flag",
      "page_number": "Page number if identifiable",
      "recommendation": "Specific recommendation for the user",
      "confidence_score": 0.95,
      "reasoning": "Why this was flagged and confidence reasoning"
    }
  ],"""
        
        if analysis_type in [AnalysisType.BENEFITS, AnalysisType.COMPREHENSIVE]:
            base_prompt += """
  "benefits": [
    {
      "category": "preventive|emergency|specialist|prescription|mental_health|dental|vision|other",
      "name": "Specific benefit name",
      "coverage_percentage": 80.0,
      "copay_amount": 25.0,
      "coinsurance_percentage": 20.0,
      "requires_preauth": false,
      "network_restriction": "in_network_only|out_network_reduced|no_restriction",
      "annual_limit": 5000.0,
      "visit_limit": 12,
      "notes": "Additional important details",
      "confidence_score": 0.90
    }
  ],"""
        
        base_prompt += """
  "analysis_metadata": {
    "document_type": "health_insurance|dental|vision|other",
    "policy_complexity": "simple|moderate|complex",
    "text_quality": "excellent|good|fair|poor",
    "analysis_completeness": 0.95
  }
}

ANALYSIS GUIDELINES:
1. Focus on identifying potential issues that could negatively impact the policyholder
2. Look for hidden costs, restrictions, and limitations
3. Pay special attention to pre-authorization requirements
4. Identify network restrictions and out-of-pocket maximums
5. Flag any unusual exclusions or coverage gaps
6. Provide confidence scores between 0.0 and 1.0 for each finding
7. Include specific text excerpts that support your findings
8. Provide actionable recommendations for each red flag

Return only valid JSON without any additional text or formatting.
"""
        
        return base_prompt

    def _call_gemini_with_retry(self, prompt: str) -> Optional[str]:
        """
        Call Gemini API with retry logic and error handling
        """
        for attempt in range(self.max_retries):
            try:
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        max_output_tokens=self.max_tokens,
                        temperature=0.1,  # Low temperature for consistent analysis
                    )
                )

                if response.text:
                    return response.text
                else:
                    logger.warning(f"Empty response from Gemini API on attempt {attempt + 1}")

            except Exception as e:
                logger.warning(f"Gemini API call failed on attempt {attempt + 1}: {str(e)}")
                if attempt < self.max_retries - 1:
                    time.sleep(self.retry_delay * (2 ** attempt))  # Exponential backoff

        logger.error("All Gemini API retry attempts failed")
        return None

    def _parse_analysis_response(self, response: str, processing_time: float) -> AnalysisResult:
        """
        Parse the JSON response from Gemini into structured results
        """
        try:
            # Clean the response to extract JSON
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.endswith('```'):
                response = response[:-3]

            data = json.loads(response)

            # Parse red flags
            red_flags = []
            for flag_data in data.get('red_flags', []):
                red_flags.append(RedFlagResult(
                    flag_type=flag_data.get('flag_type', 'unknown'),
                    severity=flag_data.get('severity', 'medium'),
                    title=flag_data.get('title', 'Unknown Issue'),
                    description=flag_data.get('description', ''),
                    source_text=flag_data.get('source_text', ''),
                    page_number=flag_data.get('page_number'),
                    recommendation=flag_data.get('recommendation', ''),
                    confidence_score=float(flag_data.get('confidence_score', 0.5)),
                    reasoning=flag_data.get('reasoning', '')
                ))

            # Parse benefits
            benefits = []
            for benefit_data in data.get('benefits', []):
                benefits.append(BenefitResult(
                    category=benefit_data.get('category', 'other'),
                    name=benefit_data.get('name', 'Unknown Benefit'),
                    coverage_percentage=benefit_data.get('coverage_percentage'),
                    copay_amount=benefit_data.get('copay_amount'),
                    coinsurance_percentage=benefit_data.get('coinsurance_percentage'),
                    requires_preauth=benefit_data.get('requires_preauth', False),
                    network_restriction=benefit_data.get('network_restriction'),
                    annual_limit=benefit_data.get('annual_limit'),
                    visit_limit=benefit_data.get('visit_limit'),
                    notes=benefit_data.get('notes', ''),
                    confidence_score=float(benefit_data.get('confidence_score', 0.5))
                ))

            # Calculate overall confidence
            all_scores = [rf.confidence_score for rf in red_flags] + [b.confidence_score for b in benefits]
            total_confidence = sum(all_scores) / len(all_scores) if all_scores else 0.0

            return AnalysisResult(
                red_flags=red_flags,
                benefits=benefits,
                processing_time=processing_time,
                total_confidence=total_confidence,
                analysis_metadata=data.get('analysis_metadata', {})
            )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.debug(f"Raw response: {response}")
            return AnalysisResult([], [], processing_time, 0.0, {"error": "JSON parse error"})
        except Exception as e:
            logger.error(f"Error parsing analysis response: {str(e)}")
            return AnalysisResult([], [], processing_time, 0.0, {"error": str(e)})

    def save_analysis_results(
        self,
        db: Session,
        policy: InsurancePolicy,
        analysis_result: AnalysisResult
    ) -> Tuple[List[RedFlag], List[CoverageBenefit]]:
        """
        Save AI analysis results to the database

        Returns:
            Tuple of (created_red_flags, created_benefits)
        """
        created_red_flags = []
        created_benefits = []

        try:
            # Save red flags
            for red_flag_result in analysis_result.red_flags:
                red_flag = create_red_flag(
                    db=db,
                    policy_id=policy.id,
                    flag_type=red_flag_result.flag_type,
                    severity=red_flag_result.severity,
                    title=red_flag_result.title,
                    description=red_flag_result.description,
                    source_text=red_flag_result.source_text,
                    page_number=red_flag_result.page_number or "1",
                    recommendation=red_flag_result.recommendation,
                    confidence_score=red_flag_result.confidence_score,
                    detected_by="ai"
                )
                created_red_flags.append(red_flag)

            # Save benefits
            for benefit_result in analysis_result.benefits:
                benefit = create_benefit(
                    db=db,
                    policy_id=policy.id,
                    category=benefit_result.category,
                    name=benefit_result.name,
                    coverage_percentage=benefit_result.coverage_percentage or 0.0,
                    copay_amount=benefit_result.copay_amount or 0.0,
                    coinsurance_percentage=benefit_result.coinsurance_percentage or 0.0,
                    requires_preauth=benefit_result.requires_preauth,
                    network_restriction=benefit_result.network_restriction or "unknown",
                    annual_limit=benefit_result.annual_limit or 0.0,
                    visit_limit=benefit_result.visit_limit or 0,
                    notes=benefit_result.notes
                )
                created_benefits.append(benefit)

            logger.info(f"Saved {len(created_red_flags)} red flags and {len(created_benefits)} benefits for policy {policy.id}")

        except Exception as e:
            logger.error(f"Error saving analysis results: {str(e)}")
            db.rollback()
            raise

        return created_red_flags, created_benefits


# Global service instance
ai_analysis_service = GeminiAnalysisService()
