"""
Unit tests for AI Analysis Service

Tests for Google Gemini LLM integration, red flag detection,
and benefit extraction functionality.
"""

import pytest
import json
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import uuid

from app.services.ai_analysis_service import (
    GeminiAnalysisService,
    AnalysisType,
    RedFlagResult,
    BenefitResult,
    AnalysisResult
)
from app.models import PolicyDocument, InsurancePolicy
from app.core.config import settings

class TestGeminiAnalysisService:
    """Test cases for GeminiAnalysisService"""
    
    @pytest.fixture
    def mock_document(self):
        """Create a mock policy document"""
        document = Mock(spec=PolicyDocument)
        document.id = uuid.uuid4()
        document.extracted_text = """
        Health Insurance Policy
        
        Coverage Details:
        - Preventive care: 100% covered
        - Emergency room visits: $150 copay
        - Specialist visits: $30 copay, pre-authorization required
        
        Limitations:
        - Out-of-network services not covered
        - Annual deductible: $2,000
        """
        return document
    
    @pytest.fixture
    def mock_policy(self):
        """Create a mock insurance policy"""
        policy = Mock(spec=InsurancePolicy)
        policy.id = uuid.uuid4()
        policy.policy_type = "health"
        return policy
    
    @pytest.fixture
    def ai_service(self):
        """Create AI service instance for testing"""
        with patch('app.services.ai_analysis_service.genai') as mock_genai:
            service = GeminiAnalysisService()
            service.model = Mock()
            return service
    
    def test_service_initialization(self):
        """Test AI service initialization"""
        with patch('app.services.ai_analysis_service.genai') as mock_genai:
            service = GeminiAnalysisService()
            assert service.model_name == "gemini-1.5-pro"
            assert service.max_retries == 3
            assert service.retry_delay == 1.0
    
    def test_is_available_with_api_key(self, ai_service):
        """Test service availability when API key is configured"""
        ai_service.model = Mock()
        assert ai_service.is_available() is True
    
    def test_is_available_without_api_key(self):
        """Test service availability when API key is not configured"""
        with patch('app.services.ai_analysis_service.genai') as mock_genai:
            with patch.object(settings, 'GOOGLE_AI_API_KEY', None):
                service = GeminiAnalysisService()
                assert service.is_available() is False
    
    def test_preprocess_text(self, ai_service):
        """Test text preprocessing functionality"""
        input_text = "  This   is   a   test   document  with  excessive   whitespace  "
        processed = ai_service._preprocess_text(input_text)
        assert processed == "This is a test document with excessive whitespace"
    
    def test_preprocess_long_text(self, ai_service):
        """Test text preprocessing with length limit"""
        long_text = "word " * 20000  # Create very long text
        processed = ai_service._preprocess_text(long_text)
        assert len(processed) <= 50050  # Should be truncated
        assert processed.endswith("... [Text truncated for analysis]")
    
    def test_generate_analysis_prompt_red_flags(self, ai_service):
        """Test prompt generation for red flags analysis"""
        text = "Sample policy text"
        prompt = ai_service._generate_analysis_prompt(text, AnalysisType.RED_FLAGS)
        
        assert "red_flags" in prompt
        assert "flag_type" in prompt
        assert "severity" in prompt
        assert "confidence_score" in prompt
        assert text in prompt
    
    def test_generate_analysis_prompt_benefits(self, ai_service):
        """Test prompt generation for benefits analysis"""
        text = "Sample policy text"
        prompt = ai_service._generate_analysis_prompt(text, AnalysisType.BENEFITS)
        
        assert "benefits" in prompt
        assert "category" in prompt
        assert "coverage_percentage" in prompt
        assert text in prompt
    
    def test_generate_analysis_prompt_comprehensive(self, ai_service):
        """Test prompt generation for comprehensive analysis"""
        text = "Sample policy text"
        prompt = ai_service._generate_analysis_prompt(text, AnalysisType.COMPREHENSIVE)
        
        assert "red_flags" in prompt
        assert "benefits" in prompt
        assert "analysis_metadata" in prompt
        assert text in prompt
    
    def test_call_gemini_with_retry_success(self, ai_service):
        """Test successful Gemini API call"""
        mock_response = Mock()
        mock_response.text = '{"test": "response"}'
        ai_service.model.generate_content.return_value = mock_response
        
        result = ai_service._call_gemini_with_retry("test prompt")
        assert result == '{"test": "response"}'
        ai_service.model.generate_content.assert_called_once()
    
    def test_call_gemini_with_retry_failure(self, ai_service):
        """Test Gemini API call with retries on failure"""
        ai_service.model.generate_content.side_effect = Exception("API Error")
        
        result = ai_service._call_gemini_with_retry("test prompt")
        assert result is None
        assert ai_service.model.generate_content.call_count == 3  # Should retry 3 times
    
    def test_parse_analysis_response_valid_json(self, ai_service):
        """Test parsing valid JSON response"""
        response = '''
        {
            "red_flags": [
                {
                    "flag_type": "preauth_required",
                    "severity": "medium",
                    "title": "Pre-authorization Required",
                    "description": "Some services require pre-authorization",
                    "source_text": "pre-authorization required",
                    "recommendation": "Check before treatment",
                    "confidence_score": 0.85,
                    "reasoning": "Clear indication in policy text"
                }
            ],
            "benefits": [
                {
                    "category": "preventive",
                    "name": "Preventive Care",
                    "coverage_percentage": 100.0,
                    "requires_preauth": false,
                    "confidence_score": 0.95
                }
            ],
            "analysis_metadata": {
                "document_type": "health_insurance"
            }
        }
        '''
        
        result = ai_service._parse_analysis_response(response, 2.5)
        
        assert isinstance(result, AnalysisResult)
        assert len(result.red_flags) == 1
        assert len(result.benefits) == 1
        assert result.processing_time == 2.5
        
        red_flag = result.red_flags[0]
        assert red_flag.flag_type == "preauth_required"
        assert red_flag.severity == "medium"
        assert red_flag.confidence_score == 0.85
        
        benefit = result.benefits[0]
        assert benefit.category == "preventive"
        assert benefit.coverage_percentage == 100.0
        assert benefit.confidence_score == 0.95
    
    def test_parse_analysis_response_invalid_json(self, ai_service):
        """Test parsing invalid JSON response"""
        response = "Invalid JSON response"
        
        result = ai_service._parse_analysis_response(response, 1.0)
        
        assert isinstance(result, AnalysisResult)
        assert len(result.red_flags) == 0
        assert len(result.benefits) == 0
        assert result.total_confidence == 0.0
        assert "error" in result.analysis_metadata
    
    def test_parse_analysis_response_with_markdown(self, ai_service):
        """Test parsing JSON response wrapped in markdown"""
        response = '''```json
        {
            "red_flags": [],
            "benefits": [],
            "analysis_metadata": {}
        }
        ```'''
        
        result = ai_service._parse_analysis_response(response, 1.0)
        
        assert isinstance(result, AnalysisResult)
        assert len(result.red_flags) == 0
        assert len(result.benefits) == 0
    
    @patch('app.services.ai_analysis_service.create_red_flag')
    @patch('app.services.ai_analysis_service.create_benefit')
    def test_save_analysis_results(self, mock_create_benefit, mock_create_red_flag, ai_service, mock_policy):
        """Test saving analysis results to database"""
        mock_db = Mock()
        
        # Create mock analysis result
        red_flag_result = RedFlagResult(
            flag_type="preauth_required",
            severity="medium",
            title="Test Red Flag",
            description="Test description",
            source_text="test text",
            page_number="1",
            recommendation="test recommendation",
            confidence_score=0.85,
            reasoning="test reasoning"
        )
        
        benefit_result = BenefitResult(
            category="preventive",
            name="Test Benefit",
            coverage_percentage=100.0,
            copay_amount=None,
            coinsurance_percentage=None,
            requires_preauth=False,
            network_restriction=None,
            annual_limit=None,
            visit_limit=None,
            notes="test notes",
            confidence_score=0.95
        )
        
        analysis_result = AnalysisResult(
            red_flags=[red_flag_result],
            benefits=[benefit_result],
            processing_time=2.5,
            total_confidence=0.9,
            analysis_metadata={}
        )
        
        # Mock return values
        mock_red_flag = Mock()
        mock_benefit = Mock()
        mock_create_red_flag.return_value = mock_red_flag
        mock_create_benefit.return_value = mock_benefit
        
        # Call the method
        red_flags, benefits = ai_service.save_analysis_results(
            db=mock_db,
            policy=mock_policy,
            analysis_result=analysis_result
        )
        
        # Verify calls
        mock_create_red_flag.assert_called_once()
        mock_create_benefit.assert_called_once()
        
        # Verify red flag creation parameters
        red_flag_call = mock_create_red_flag.call_args
        assert red_flag_call[1]['flag_type'] == "preauth_required"
        assert red_flag_call[1]['severity'] == "medium"
        assert red_flag_call[1]['confidence_score'] == 0.85
        assert red_flag_call[1]['detected_by'] == "ai"
        
        # Verify benefit creation parameters
        benefit_call = mock_create_benefit.call_args
        assert benefit_call[1]['category'] == "preventive"
        assert benefit_call[1]['coverage_percentage'] == 100.0
        
        # Verify return values
        assert red_flags == [mock_red_flag]
        assert benefits == [mock_benefit]
    
    def test_analyze_policy_document_no_text(self, ai_service, mock_document):
        """Test analysis when document has no extracted text"""
        mock_document.extracted_text = None
        
        result = ai_service.analyze_policy_document(mock_document)
        assert result is None
    
    def test_analyze_policy_document_service_unavailable(self, mock_document):
        """Test analysis when service is unavailable"""
        service = GeminiAnalysisService()
        service.model = None
        
        result = service.analyze_policy_document(mock_document)
        assert result is None
    
    @patch('app.services.ai_analysis_service.time.time')
    def test_analyze_policy_document_success(self, mock_time, ai_service, mock_document):
        """Test successful policy document analysis"""
        # Mock time for processing time calculation
        mock_time.side_effect = [0.0, 2.5]  # start and end times
        
        # Mock successful API response
        mock_response = Mock()
        mock_response.text = '''
        {
            "red_flags": [
                {
                    "flag_type": "preauth_required",
                    "severity": "medium",
                    "title": "Pre-authorization Required",
                    "description": "Some services require pre-authorization",
                    "source_text": "pre-authorization required",
                    "recommendation": "Check before treatment",
                    "confidence_score": 0.85,
                    "reasoning": "Clear indication"
                }
            ],
            "benefits": [],
            "analysis_metadata": {}
        }
        '''
        ai_service.model.generate_content.return_value = mock_response
        
        result = ai_service.analyze_policy_document(mock_document, AnalysisType.RED_FLAGS)
        
        assert result is not None
        assert isinstance(result, AnalysisResult)
        assert len(result.red_flags) == 1
        assert result.processing_time == 2.5
        assert result.red_flags[0].flag_type == "preauth_required"


@pytest.fixture
def sample_policy_text():
    """Sample policy text for testing"""
    return """
    HEALTH INSURANCE POLICY
    
    COVERAGE BENEFITS:
    1. Preventive Care: 100% covered, no deductible
    2. Emergency Room: $150 copay after deductible
    3. Specialist Visits: $30 copay, pre-authorization required
    4. Prescription Drugs: 80% covered after deductible
    
    LIMITATIONS AND EXCLUSIONS:
    - Out-of-network services not covered except in emergencies
    - Annual deductible: $2,000 individual, $4,000 family
    - Out-of-pocket maximum: $8,000 individual, $16,000 family
    - Cosmetic procedures excluded
    - Experimental treatments not covered
    
    NETWORK RESTRICTIONS:
    Must use in-network providers for coverage.
    Emergency services covered out-of-network at in-network rates.
    """


class TestAnalysisIntegration:
    """Integration tests for AI analysis functionality"""
    
    def test_end_to_end_analysis_flow(self, sample_policy_text):
        """Test complete analysis flow from text to results"""
        # This would be an integration test that requires actual API access
        # For now, we'll test the flow with mocked components
        pass
    
    def test_confidence_score_calculation(self):
        """Test confidence score calculation logic"""
        # Test various scenarios for confidence scoring
        pass
    
    def test_error_handling_and_recovery(self):
        """Test error handling and recovery mechanisms"""
        # Test various error scenarios and recovery
        pass
