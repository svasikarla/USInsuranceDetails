"""
AI Policy Data Extraction Service

This service extends the AI analysis capabilities to extract structured policy data
from insurance documents using Google Gemini LLM for automatic policy creation.
"""

import json
import logging
import time
import re
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from datetime import datetime, date
from decimal import Decimal
import google.generativeai as genai

from app.core.config import settings
from app.models import PolicyDocument
from app.services.ai_analysis_service import ai_analysis_service

logger = logging.getLogger(__name__)


@dataclass
class ExtractedPolicyData:
    """Structured policy data extracted from document"""
    # Basic Policy Information
    policy_name: Optional[str] = None
    policy_type: Optional[str] = None  # 'health', 'dental', 'vision', 'life'
    policy_number: Optional[str] = None
    plan_year: Optional[str] = None
    group_number: Optional[str] = None
    network_type: Optional[str] = None  # 'HMO', 'PPO', 'EPO', 'POS'
    
    # Dates
    effective_date: Optional[date] = None
    expiration_date: Optional[date] = None
    
    # Financial Information
    deductible_individual: Optional[Decimal] = None
    deductible_family: Optional[Decimal] = None
    out_of_pocket_max_individual: Optional[Decimal] = None
    out_of_pocket_max_family: Optional[Decimal] = None
    premium_monthly: Optional[Decimal] = None
    premium_annual: Optional[Decimal] = None
    
    # Extraction Metadata
    extraction_confidence: float = 0.0
    extraction_method: str = "ai"
    extraction_errors: List[str] = None
    raw_ai_response: Optional[Dict] = None
    
    def __post_init__(self):
        if self.extraction_errors is None:
            self.extraction_errors = []


class AIPolicyExtractionService:
    """Service for extracting structured policy data using AI"""

    def __init__(self):
        self.model = None
        self.is_available = None  # Use None to indicate not yet initialized
        self._initialized = False

    def _ensure_initialized(self):
        """Ensure the service is initialized (lazy initialization)"""
        if self._initialized:
            return

        self._initialized = True

        # Initialize AI model if available
        if hasattr(settings, 'GOOGLE_AI_API_KEY') and settings.GOOGLE_AI_API_KEY:
            try:
                genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
                self.model = genai.GenerativeModel(
                    model_name="gemini-1.5-flash",
                    safety_settings={
                        genai.types.HarmCategory.HARM_CATEGORY_HATE_SPEECH: genai.types.HarmBlockThreshold.BLOCK_NONE,
                        genai.types.HarmCategory.HARM_CATEGORY_HARASSMENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                        genai.types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                        genai.types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: genai.types.HarmBlockThreshold.BLOCK_NONE,
                    }
                )
                self.is_available = True
                logger.info("AI Policy Extraction Service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize AI Policy Extraction Service: {str(e)}")
                self.is_available = False
        else:
            logger.warning("Google AI API key not configured. Policy extraction will use fallback methods.")
            self.is_available = False
    
    def extract_policy_data(self, document: PolicyDocument) -> ExtractedPolicyData:
        """
        Extract structured policy data from document

        Args:
            document: PolicyDocument with extracted text

        Returns:
            ExtractedPolicyData with extracted policy information
        """
        # Ensure service is initialized
        self._ensure_initialized()

        if not document.extracted_text:
            logger.error(f"No extracted text available for document {document.id}")
            return ExtractedPolicyData(
                extraction_confidence=0.0,
                extraction_errors=["No extracted text available"]
            )

        # Try AI extraction first
        if self.is_available:
            try:
                ai_result = self._extract_with_ai(document)
                # If AI extraction has good confidence, use it
                if ai_result.extraction_confidence > 0.3:
                    return ai_result
                else:
                    logger.warning(f"AI extraction confidence too low ({ai_result.extraction_confidence:.2f}), falling back to patterns")
                    # Fall back to pattern matching
                    return self._extract_with_patterns(document)
            except Exception as e:
                logger.error(f"AI extraction failed: {str(e)}")
                # Fall back to pattern matching
                return self._extract_with_patterns(document)
        else:
            # Use pattern matching fallback
            return self._extract_with_patterns(document)
    
    def _extract_with_ai(self, document: PolicyDocument) -> ExtractedPolicyData:
        """Extract policy data using AI"""
        start_time = time.time()
        
        # Preprocess text
        text = self._preprocess_text(document.extracted_text)
        
        # Generate extraction prompt
        prompt = self._generate_extraction_prompt(text)
        
        # Call AI with retry logic
        response = self._call_ai_with_retry(prompt)
        
        if not response:
            raise Exception("AI extraction failed - no response")
        
        # Parse response
        return self._parse_ai_response(response, time.time() - start_time)
    
    def _extract_with_patterns(self, document: PolicyDocument) -> ExtractedPolicyData:
        """Fallback extraction using regex patterns"""
        text = document.extracted_text.lower()
        
        extracted_data = ExtractedPolicyData(
            extraction_method="pattern_matching",
            extraction_confidence=0.5  # Lower confidence for pattern matching
        )
        
        # Enhanced pattern matching
        patterns = {
            'policy_name': r'(?:policy\s+name|plan\s+name):\s*([^\n\r]+)',
            'provider': r'provider:\s*([^\n\r]+)',
            'policy_type': r'(?:policy\s+type|plan\s+type):\s*([^\n\r]+)',
            'policy_number': r'policy\s+(?:number|#):\s*([a-z0-9-]+)',
            'deductible_individual': r'(?:annual\s+deductible|individual\s+deductible|deductible):\s*\$?([0-9,]+)',
            'premium_monthly': r'monthly\s+premium[:\s]*\$?([0-9,]+)',
            'premium_annual': r'annual\s+premium[:\s]*\$?([0-9,]+)',
            'out_of_pocket_max': r'out-of-pocket\s+maximum[:\s]*\$?([0-9,]+)',
            'start_date': r'(?:coverage\s+start\s+date|effective\s+date)[:\s]*([^\n\r]+)',
            'end_date': r'(?:coverage\s+end\s+date|expiration\s+date)[:\s]*([^\n\r]+)',
        }
        
        for field, pattern in patterns.items():
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = match.group(1).strip()

                # Handle monetary fields
                if field in ['deductible_individual', 'premium_monthly', 'premium_annual', 'out_of_pocket_max']:
                    try:
                        # Remove currency symbols and commas
                        clean_value = re.sub(r'[,$]', '', value)
                        decimal_value = Decimal(clean_value)
                        if field == 'out_of_pocket_max':
                            setattr(extracted_data, 'out_of_pocket_max_individual', decimal_value)
                        else:
                            setattr(extracted_data, field, decimal_value)
                    except (ValueError, TypeError):
                        pass

                # Handle date fields
                elif field in ['start_date', 'end_date']:
                    try:
                        # Simple date parsing for common formats
                        if field == 'start_date':
                            setattr(extracted_data, 'effective_date', self._parse_simple_date(value))
                        else:
                            setattr(extracted_data, 'expiration_date', self._parse_simple_date(value))
                    except:
                        pass

                # Handle text fields
                else:
                    setattr(extracted_data, field, value)
        
        # Infer policy name from filename or content
        if document.original_filename:
            extracted_data.policy_name = document.original_filename.replace('.pdf', '').replace('_', ' ').title()
        
        # Infer policy type
        if any(word in text for word in ['health', 'medical', 'healthcare']):
            extracted_data.policy_type = 'health'
        elif 'dental' in text:
            extracted_data.policy_type = 'dental'
        elif 'vision' in text:
            extracted_data.policy_type = 'vision'
        
        return extracted_data

    def _parse_simple_date(self, date_str: str) -> Optional[date]:
        """Parse simple date formats"""
        try:
            # Common date formats
            date_patterns = [
                r'(\d{1,2})-(\w{3})-(\d{4})',  # 01-Jan-2025
                r'(\d{4})-(\d{1,2})-(\d{1,2})',  # 2025-01-01
                r'(\d{1,2})/(\d{1,2})/(\d{4})',  # 01/01/2025
            ]

            for pattern in date_patterns:
                match = re.search(pattern, date_str)
                if match:
                    if 'Jan' in date_str or 'Feb' in date_str:  # Month name format
                        day, month_str, year = match.groups()
                        month_map = {
                            'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
                            'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
                        }
                        month = month_map.get(month_str, 1)
                        return date(int(year), month, int(day))
                    else:  # Numeric format
                        parts = match.groups()
                        if len(parts[0]) == 4:  # YYYY-MM-DD
                            year, month, day = parts
                        else:  # DD/MM/YYYY or MM/DD/YYYY
                            day, month, year = parts
                        return date(int(year), int(month), int(day))

            return None
        except:
            return None
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for AI extraction"""
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Limit text length to avoid token limits
        if len(text) > 30000:  # Conservative limit for extraction
            text = text[:30000] + "... [Text truncated for extraction]"
        
        return text
    
    def _generate_extraction_prompt(self, text: str) -> str:
        """Generate AI prompt for policy data extraction"""
        return f"""
You are an expert insurance policy data extraction specialist. Extract structured policy information from the following insurance document.

DOCUMENT TEXT:
{text}

Extract the following policy information and return it in JSON format:

{{
  "policy_data": {{
    "policy_name": "Full policy name or plan name",
    "policy_type": "health|dental|vision|life",
    "policy_number": "Policy number if found",
    "plan_year": "Plan year (e.g., '2025')",
    "group_number": "Group number if applicable",
    "network_type": "HMO|PPO|EPO|POS",
    "effective_date": "YYYY-MM-DD format",
    "expiration_date": "YYYY-MM-DD format",
    "deductible_individual": 1500.00,
    "deductible_family": 3000.00,
    "out_of_pocket_max_individual": 7000.00,
    "out_of_pocket_max_family": 14000.00,
    "premium_monthly": 500.00,
    "premium_annual": 6000.00
  }},
  "extraction_metadata": {{
    "confidence_score": 0.95,
    "extraction_notes": "Any important notes about the extraction",
    "missing_fields": ["List of fields that couldn't be extracted"],
    "data_quality": "excellent|good|fair|poor"
  }}
}}

EXTRACTION GUIDELINES:
1. Only extract data that is explicitly mentioned in the document
2. Use null for fields that cannot be found or determined
3. Convert all monetary amounts to decimal numbers (no currency symbols)
4. Use standard date format (YYYY-MM-DD) for dates
5. Provide confidence score between 0.0 and 1.0
6. List any fields that couldn't be extracted in missing_fields
7. Be conservative with confidence scores - only use high scores for clearly stated information

Return only the JSON response, no additional text.
"""
    
    def _call_ai_with_retry(self, prompt: str, max_retries: int = 3) -> Optional[str]:
        """Call AI with retry logic"""
        for attempt in range(max_retries):
            try:
                response = self.model.generate_content(prompt)
                if response and response.text:
                    return response.text.strip()
            except Exception as e:
                logger.warning(f"AI call attempt {attempt + 1} failed: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(1.0 * (attempt + 1))  # Exponential backoff
        
        return None
    
    def _parse_ai_response(self, response: str, processing_time: float) -> ExtractedPolicyData:
        """Parse AI response into ExtractedPolicyData"""
        try:
            # Clean response (remove markdown formatting if present)
            response = response.strip()
            if response.startswith('```json'):
                response = response[7:]
            if response.endswith('```'):
                response = response[:-3]
            
            data = json.loads(response)
            policy_data = data.get('policy_data', {})
            metadata = data.get('extraction_metadata', {})
            
            # Create ExtractedPolicyData object
            extracted = ExtractedPolicyData(
                policy_name=policy_data.get('policy_name'),
                policy_type=policy_data.get('policy_type'),
                policy_number=policy_data.get('policy_number'),
                plan_year=policy_data.get('plan_year'),
                group_number=policy_data.get('group_number'),
                network_type=policy_data.get('network_type'),
                extraction_confidence=metadata.get('confidence_score', 0.0),
                extraction_method="ai",
                raw_ai_response=data
            )
            
            # Parse dates
            for date_field in ['effective_date', 'expiration_date']:
                date_str = policy_data.get(date_field)
                if date_str:
                    try:
                        parsed_date = datetime.strptime(date_str, '%Y-%m-%d').date()
                        setattr(extracted, date_field, parsed_date)
                    except ValueError:
                        extracted.extraction_errors.append(f"Invalid date format for {date_field}: {date_str}")
            
            # Parse monetary amounts
            for money_field in ['deductible_individual', 'deductible_family', 
                              'out_of_pocket_max_individual', 'out_of_pocket_max_family',
                              'premium_monthly', 'premium_annual']:
                amount = policy_data.get(money_field)
                if amount is not None:
                    try:
                        setattr(extracted, money_field, Decimal(str(amount)))
                    except (ValueError, TypeError):
                        extracted.extraction_errors.append(f"Invalid amount for {money_field}: {amount}")
            
            return extracted
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {str(e)}")
            return ExtractedPolicyData(
                extraction_confidence=0.0,
                extraction_errors=[f"JSON parse error: {str(e)}"],
                raw_ai_response={"raw_response": response}
            )
        except Exception as e:
            logger.error(f"Error parsing AI response: {str(e)}")
            return ExtractedPolicyData(
                extraction_confidence=0.0,
                extraction_errors=[f"Parse error: {str(e)}"],
                raw_ai_response={"raw_response": response}
            )


# Global service instance
ai_policy_extraction_service = AIPolicyExtractionService()
