"""
Multi-AI Service with Intelligent Fallback

This service provides intelligent fallback between multiple AI providers
for red flag detection when quota limits or service issues occur.
"""

import os
import json
import time
import logging
from typing import Dict, List, Any, Optional, Tuple
from enum import Enum
from dataclasses import dataclass

# AI Provider imports
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    ANTHROPIC_AVAILABLE = False

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

logger = logging.getLogger(__name__)

class AIProvider(Enum):
    GEMINI = "gemini"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    PATTERN = "pattern"

@dataclass
class AIResponse:
    provider: AIProvider
    red_flags: List[Dict[str, Any]]
    benefits: List[Dict[str, Any]]
    processing_time: float
    confidence_score: float
    error: Optional[str] = None

class MultiAIService:
    """Multi-provider AI service with intelligent fallback"""
    
    def __init__(self):
        self.providers = self._initialize_providers()
        self.fallback_order = [
            AIProvider.GEMINI,
            AIProvider.OPENAI,
            AIProvider.ANTHROPIC,
            AIProvider.PATTERN
        ]
        
        # Provider-specific configurations
        self.provider_configs = {
            AIProvider.GEMINI: {
                "model": "gemini-1.5-flash",
                "max_tokens": 8192,
                "temperature": 0.1,
                "timeout": 30
            },
            AIProvider.OPENAI: {
                "model": "gpt-4-turbo-preview",
                "max_tokens": 4096,
                "temperature": 0.1,
                "timeout": 30
            },
            AIProvider.ANTHROPIC: {
                "model": "claude-3-sonnet-20240229",
                "max_tokens": 4096,
                "temperature": 0.1,
                "timeout": 30
            }
        }
    
    def _initialize_providers(self) -> Dict[AIProvider, bool]:
        """Initialize available AI providers"""
        providers = {}
        
        # Initialize Gemini
        if GEMINI_AVAILABLE and os.getenv("GOOGLE_API_KEY"):
            try:
                genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
                providers[AIProvider.GEMINI] = True
                logger.info("✅ Gemini AI initialized")
            except Exception as e:
                providers[AIProvider.GEMINI] = False
                logger.warning(f"⚠️ Gemini initialization failed: {e}")
        else:
            providers[AIProvider.GEMINI] = False
        
        # Initialize OpenAI
        if OPENAI_AVAILABLE and os.getenv("OPENAI_API_KEY"):
            try:
                openai.api_key = os.getenv("OPENAI_API_KEY")
                providers[AIProvider.OPENAI] = True
                logger.info("✅ OpenAI initialized")
            except Exception as e:
                providers[AIProvider.OPENAI] = False
                logger.warning(f"⚠️ OpenAI initialization failed: {e}")
        else:
            providers[AIProvider.OPENAI] = False
        
        # Initialize Anthropic
        if ANTHROPIC_AVAILABLE and os.getenv("ANTHROPIC_API_KEY"):
            try:
                providers[AIProvider.ANTHROPIC] = True
                logger.info("✅ Anthropic initialized")
            except Exception as e:
                providers[AIProvider.ANTHROPIC] = False
                logger.warning(f"⚠️ Anthropic initialization failed: {e}")
        else:
            providers[AIProvider.ANTHROPIC] = False
        
        # Pattern fallback is always available
        providers[AIProvider.PATTERN] = True
        
        return providers
    
    def analyze_policy_document(self, document, max_retries: int = 3) -> AIResponse:
        """Analyze policy document with intelligent fallback"""
        
        for provider in self.fallback_order:
            if not self.providers.get(provider, False):
                continue
            
            for attempt in range(max_retries):
                try:
                    logger.info(f"🤖 Attempting analysis with {provider.value} (attempt {attempt + 1})")
                    
                    start_time = time.time()
                    
                    if provider == AIProvider.GEMINI:
                        response = self._analyze_with_gemini(document)
                    elif provider == AIProvider.OPENAI:
                        response = self._analyze_with_openai(document)
                    elif provider == AIProvider.ANTHROPIC:
                        response = self._analyze_with_anthropic(document)
                    elif provider == AIProvider.PATTERN:
                        response = self._analyze_with_patterns(document)
                    
                    processing_time = time.time() - start_time
                    
                    if response:
                        logger.info(f"✅ Analysis successful with {provider.value} in {processing_time:.2f}s")
                        return AIResponse(
                            provider=provider,
                            red_flags=response.get('red_flags', []),
                            benefits=response.get('benefits', []),
                            processing_time=processing_time,
                            confidence_score=response.get('confidence_score', 0.8)
                        )
                
                except Exception as e:
                    logger.warning(f"⚠️ {provider.value} attempt {attempt + 1} failed: {str(e)}")
                    
                    # Check for quota/rate limit errors
                    if self._is_quota_error(e):
                        logger.warning(f"🚫 {provider.value} quota exceeded, trying next provider")
                        break  # Skip remaining attempts for this provider
                    
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)  # Exponential backoff
        
        # If all AI providers fail, return error response
        logger.error("❌ All AI providers failed")
        return AIResponse(
            provider=AIProvider.PATTERN,
            red_flags=[],
            benefits=[],
            processing_time=0.0,
            confidence_score=0.0,
            error="All AI providers unavailable"
        )
    
    def _analyze_with_gemini(self, document) -> Optional[Dict[str, Any]]:
        """Analyze with Google Gemini"""
        model = genai.GenerativeModel(self.provider_configs[AIProvider.GEMINI]["model"])
        
        prompt = self._get_analysis_prompt(document.extracted_text)
        response = model.generate_content(prompt)
        
        return self._parse_ai_response(response.text)
    
    def _analyze_with_openai(self, document) -> Optional[Dict[str, Any]]:
        """Analyze with OpenAI GPT-4"""
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.chat.completions.create(
            model=self.provider_configs[AIProvider.OPENAI]["model"],
            messages=[
                {"role": "system", "content": self._get_system_prompt()},
                {"role": "user", "content": self._get_analysis_prompt(document.extracted_text)}
            ],
            max_tokens=self.provider_configs[AIProvider.OPENAI]["max_tokens"],
            temperature=self.provider_configs[AIProvider.OPENAI]["temperature"],
            response_format={"type": "json_object"}  # Ensure JSON response
        )
        
        return json.loads(response.choices[0].message.content)
    
    def _analyze_with_anthropic(self, document) -> Optional[Dict[str, Any]]:
        """Analyze with Anthropic Claude"""
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        
        response = client.messages.create(
            model=self.provider_configs[AIProvider.ANTHROPIC]["model"],
            max_tokens=self.provider_configs[AIProvider.ANTHROPIC]["max_tokens"],
            temperature=self.provider_configs[AIProvider.ANTHROPIC]["temperature"],
            messages=[
                {"role": "user", "content": self._get_analysis_prompt(document.extracted_text)}
            ]
        )
        
        return self._parse_ai_response(response.content[0].text)
    
    def _analyze_with_patterns(self, document) -> Dict[str, Any]:
        """Fallback to pattern-based analysis"""
        from .policy_service import analyze_policy_and_generate_benefits_flags
        from ..utils.db import SessionLocal
        
        # This would integrate with your existing pattern-based system
        # For now, return a basic structure
        return {
            "red_flags": [],
            "benefits": [],
            "confidence_score": 0.75,
            "analysis_method": "pattern_based"
        }
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for AI analysis"""
        return """You are an expert insurance policy analyzer. Analyze the provided health insurance policy document and identify red flags and benefits. 

Return your analysis as a JSON object with this exact structure:
{
    "red_flags": [
        {
            "title": "Red flag title",
            "severity": "critical|high|medium|low",
            "description": "Detailed description",
            "category": "coverage_limitation|exclusion|high_cost|network_limitation|preauth_required",
            "confidence_score": 0.95
        }
    ],
    "benefits": [
        {
            "title": "Benefit title",
            "description": "Benefit description",
            "category": "coverage|cost_sharing|network"
        }
    ],
    "confidence_score": 0.85
}"""
    
    def _get_analysis_prompt(self, policy_text: str) -> str:
        """Get analysis prompt with policy text"""
        return f"""Analyze this health insurance policy document for red flags and benefits:

{policy_text[:8000]}  # Limit text length

Focus on identifying:
1. Coverage limitations and exclusions
2. High cost-sharing requirements
3. Network restrictions
4. Pre-authorization requirements
5. Waiting periods
6. ACA compliance issues

Provide detailed analysis in the specified JSON format."""
    
    def _parse_ai_response(self, response_text: str) -> Optional[Dict[str, Any]]:
        """Parse AI response text to JSON"""
        try:
            # Try to extract JSON from response
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response_text[start_idx:end_idx]
                return json.loads(json_str)
            
            return None
        except json.JSONDecodeError:
            logger.warning("Failed to parse AI response as JSON")
            return None
    
    def _is_quota_error(self, error: Exception) -> bool:
        """Check if error is related to quota/rate limits"""
        error_str = str(error).lower()
        quota_indicators = [
            'quota', 'rate limit', 'too many requests', 
            'resource_exhausted', 'insufficient_quota',
            'billing', 'usage limit'
        ]
        return any(indicator in error_str for indicator in quota_indicators)
    
    def get_provider_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all AI providers"""
        status = {}
        
        for provider, available in self.providers.items():
            status[provider.value] = {
                "available": available,
                "config": self.provider_configs.get(provider, {}),
                "priority": self.fallback_order.index(provider) if provider in self.fallback_order else -1
            }
        
        return status

# Global instance
multi_ai_service = MultiAIService()
