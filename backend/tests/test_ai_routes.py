"""
Integration tests for AI Analysis API Routes

Tests for AI analysis endpoints, authentication, and error handling.
"""

import pytest
import uuid
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app import models, schemas
from app.utils.db import get_db
from app.utils.auth import get_current_user

client = TestClient(app)

class TestAIAnalysisRoutes:
    """Test cases for AI analysis API routes"""
    
    @pytest.fixture
    def mock_db(self):
        """Mock database session"""
        return Mock(spec=Session)
    
    @pytest.fixture
    def mock_user(self):
        """Mock authenticated user"""
        user = Mock(spec=schemas.User)
        user.id = uuid.uuid4()
        user.email = "test@example.com"
        user.role = "user"
        return user
    
    @pytest.fixture
    def mock_admin_user(self):
        """Mock admin user"""
        user = Mock(spec=schemas.User)
        user.id = uuid.uuid4()
        user.email = "admin@example.com"
        user.role = "admin"
        return user
    
    @pytest.fixture
    def mock_policy(self, mock_user):
        """Mock insurance policy"""
        policy = Mock(spec=models.InsurancePolicy)
        policy.id = uuid.uuid4()
        policy.user_id = mock_user.id
        policy.document_id = uuid.uuid4()
        policy.policy_type = "health"
        return policy
    
    @pytest.fixture
    def mock_document(self):
        """Mock policy document"""
        document = Mock(spec=models.PolicyDocument)
        document.id = uuid.uuid4()
        document.extracted_text = "Sample policy text for analysis"
        document.file_path = "/path/to/document.pdf"
        document.mime_type = "application/pdf"
        return document
    
    def test_analyze_policy_success(self, mock_db, mock_user, mock_policy, mock_document):
        """Test successful policy analysis request"""
        # Setup mocks
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_policy,  # Policy query
            mock_document  # Document query
        ]
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                with patch('app.routes.ai_analysis.ai_analysis_service') as mock_ai_service:
                    with patch('app.routes.ai_analysis.ai_monitoring_service') as mock_monitoring:
                        # Configure mocks
                        mock_ai_service.is_available.return_value = True
                        mock_monitoring.start_analysis.return_value = "analysis-123"
                        
                        # Make request
                        response = client.post(
                            "/api/ai/analyze-policy",
                            json={
                                "policy_id": str(mock_policy.id),
                                "analysis_type": "comprehensive"
                            }
                        )
                        
                        assert response.status_code == 200
                        data = response.json()
                        assert data["analysis_id"] == "analysis-123"
                        assert data["status"] == "processing"
                        assert "AI analysis started" in data["message"]
    
    def test_analyze_policy_not_found(self, mock_db, mock_user):
        """Test analysis request for non-existent policy"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                response = client.post(
                    "/api/ai/analyze-policy",
                    json={
                        "policy_id": str(uuid.uuid4()),
                        "analysis_type": "comprehensive"
                    }
                )
                
                assert response.status_code == 404
                assert "Policy not found" in response.json()["detail"]
    
    def test_analyze_policy_permission_denied(self, mock_db, mock_user, mock_policy):
        """Test analysis request without proper permissions"""
        # Set different user ID to simulate permission denial
        mock_policy.user_id = uuid.uuid4()  # Different from mock_user.id
        mock_db.query.return_value.filter.return_value.first.return_value = mock_policy
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                response = client.post(
                    "/api/ai/analyze-policy",
                    json={
                        "policy_id": str(mock_policy.id),
                        "analysis_type": "comprehensive"
                    }
                )
                
                assert response.status_code == 403
                assert "Not enough permissions" in response.json()["detail"]
    
    def test_analyze_policy_service_unavailable(self, mock_db, mock_user, mock_policy, mock_document):
        """Test analysis request when AI service is unavailable"""
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_policy,
            mock_document
        ]
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                with patch('app.routes.ai_analysis.ai_analysis_service') as mock_ai_service:
                    mock_ai_service.is_available.return_value = False
                    
                    response = client.post(
                        "/api/ai/analyze-policy",
                        json={
                            "policy_id": str(mock_policy.id),
                            "analysis_type": "comprehensive"
                        }
                    )
                    
                    assert response.status_code == 503
                    assert "AI analysis service is not available" in response.json()["detail"]
    
    def test_analyze_policy_invalid_analysis_type(self, mock_db, mock_user, mock_policy, mock_document):
        """Test analysis request with invalid analysis type"""
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_policy,
            mock_document
        ]
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                with patch('app.routes.ai_analysis.ai_analysis_service') as mock_ai_service:
                    mock_ai_service.is_available.return_value = True
                    
                    response = client.post(
                        "/api/ai/analyze-policy",
                        json={
                            "policy_id": str(mock_policy.id),
                            "analysis_type": "invalid_type"
                        }
                    )
                    
                    assert response.status_code == 400
                    assert "Invalid analysis type" in response.json()["detail"]
    
    def test_get_analysis_status_success(self, mock_db, mock_user, mock_policy):
        """Test successful analysis status retrieval"""
        # Mock analysis log
        mock_log = Mock()
        mock_log.analysis_id = "analysis-123"
        mock_log.policy_id = mock_policy.id
        mock_log.status = "completed"
        mock_log.error_message = None
        mock_log.red_flags_detected = 2
        mock_log.benefits_extracted = 5
        mock_log.confidence_score = 0.85
        mock_log.processing_time_seconds = 3.2
        
        mock_db.query.return_value.filter.return_value.first.side_effect = [
            mock_log,  # Analysis log query
            mock_policy  # Policy query
        ]
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                response = client.get("/api/ai/analysis-status/analysis-123")
                
                assert response.status_code == 200
                data = response.json()
                assert data["analysis_id"] == "analysis-123"
                assert data["status"] == "completed"
                assert data["red_flags_detected"] == 2
                assert data["benefits_extracted"] == 5
                assert data["confidence_score"] == 0.85
    
    def test_get_analysis_status_not_found(self, mock_db, mock_user):
        """Test analysis status for non-existent analysis"""
        mock_db.query.return_value.filter.return_value.first.return_value = None
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                response = client.get("/api/ai/analysis-status/nonexistent")
                
                assert response.status_code == 404
                assert "Analysis not found" in response.json()["detail"]
    
    def test_reanalyze_policy_success(self, mock_db, mock_user, mock_policy):
        """Test successful policy re-analysis"""
        mock_db.query.return_value.filter.return_value.first.return_value = mock_policy
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                with patch('app.routes.ai_analysis.enhanced_policy_service') as mock_service:
                    mock_service.reanalyze_policy_with_ai.return_value = (
                        [Mock(), Mock()],  # red_flags
                        [Mock(), Mock(), Mock()]  # benefits
                    )
                    
                    response = client.post(f"/api/ai/reanalyze-policy/{mock_policy.id}")
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert "Policy re-analysis completed" in data["message"]
                    assert data["red_flags_detected"] == 2
                    assert data["benefits_extracted"] == 3
    
    def test_extract_text_success(self, mock_db, mock_user, mock_document):
        """Test successful text extraction"""
        mock_document.user_id = mock_user.id
        mock_document.extracted_text = None  # Force re-extraction
        mock_db.query.return_value.filter.return_value.first.return_value = mock_document
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                with patch('app.routes.ai_analysis.text_extraction_service') as mock_service:
                    # Mock extraction result
                    mock_result = Mock()
                    mock_result.text = "Extracted text content"
                    mock_result.extraction_method = "pypdf2"
                    mock_result.confidence_score = 0.95
                    mock_result.text_quality = "excellent"
                    mock_result.word_count = 100
                    mock_result.processing_time = 2.1
                    mock_result.error_message = None
                    
                    mock_service.extract_text_from_file.return_value = mock_result
                    
                    response = client.post(
                        "/api/ai/extract-text",
                        json={
                            "document_id": str(mock_document.id),
                            "force_reextraction": True
                        }
                    )
                    
                    assert response.status_code == 200
                    data = response.json()
                    assert data["extraction_method"] == "pypdf2"
                    assert data["confidence_score"] == 0.95
                    assert data["word_count"] == 100
    
    def test_extract_text_cached_result(self, mock_db, mock_user, mock_document):
        """Test text extraction with cached result"""
        mock_document.user_id = mock_user.id
        mock_document.extracted_text = "Existing extracted text"
        mock_document.ocr_confidence_score = 0.9
        mock_db.query.return_value.filter.return_value.first.return_value = mock_document
        
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                response = client.post(
                    "/api/ai/extract-text",
                    json={
                        "document_id": str(mock_document.id),
                        "force_reextraction": False
                    }
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["extraction_method"] == "cached"
                assert data["confidence_score"] == 0.9
    
    def test_get_analysis_metrics_admin_only(self, mock_db, mock_user, mock_admin_user):
        """Test analysis metrics endpoint requires admin access"""
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            # Test with regular user
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                response = client.get("/api/ai/analysis-metrics")
                assert response.status_code == 403
                assert "Admin access required" in response.json()["detail"]
            
            # Test with admin user
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_admin_user):
                with patch('app.routes.ai_analysis.ai_monitoring_service') as mock_monitoring:
                    mock_monitoring.get_analysis_metrics.return_value = []
                    
                    response = client.get("/api/ai/analysis-metrics")
                    assert response.status_code == 200
                    assert "metrics" in response.json()
    
    def test_get_performance_stats_admin_only(self, mock_db, mock_user, mock_admin_user):
        """Test performance stats endpoint requires admin access"""
        with patch('app.routes.ai_analysis.get_db', return_value=mock_db):
            # Test with regular user
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_user):
                response = client.get("/api/ai/performance-stats")
                assert response.status_code == 403
            
            # Test with admin user
            with patch('app.routes.ai_analysis.get_current_user', return_value=mock_admin_user):
                with patch('app.routes.ai_analysis.ai_monitoring_service') as mock_monitoring:
                    mock_monitoring.get_performance_stats.return_value = {
                        "total_analyses": 10,
                        "success_rate": 95.0
                    }
                    
                    response = client.get("/api/ai/performance-stats")
                    assert response.status_code == 200
                    data = response.json()
                    assert data["total_analyses"] == 10
                    assert data["success_rate"] == 95.0


class TestAIAnalysisValidation:
    """Test request validation for AI analysis endpoints"""
    
    def test_analyze_policy_request_validation(self):
        """Test request validation for analyze policy endpoint"""
        # Test missing policy_id
        response = client.post(
            "/api/ai/analyze-policy",
            json={"analysis_type": "comprehensive"}
        )
        assert response.status_code == 422  # Validation error
        
        # Test invalid UUID format
        response = client.post(
            "/api/ai/analyze-policy",
            json={
                "policy_id": "invalid-uuid",
                "analysis_type": "comprehensive"
            }
        )
        assert response.status_code == 422
    
    def test_text_extraction_request_validation(self):
        """Test request validation for text extraction endpoint"""
        # Test missing document_id
        response = client.post(
            "/api/ai/extract-text",
            json={"force_reextraction": True}
        )
        assert response.status_code == 422
        
        # Test invalid UUID format
        response = client.post(
            "/api/ai/extract-text",
            json={
                "document_id": "invalid-uuid",
                "force_reextraction": False
            }
        )
        assert response.status_code == 422
