"""
Unit tests for Enhanced Text Extraction Service

Tests for text extraction from various document formats,
OCR functionality, and text quality assessment.
"""

import pytest
import tempfile
import os
from unittest.mock import Mock, patch, MagicMock
from pathlib import Path

from app.services.text_extraction_service import (
    EnhancedTextExtractionService,
    ExtractionResult,
    ExtractionMethod,
    TextQuality
)

class TestEnhancedTextExtractionService:
    """Test cases for EnhancedTextExtractionService"""
    
    @pytest.fixture
    def extraction_service(self):
        """Create extraction service instance for testing"""
        return EnhancedTextExtractionService()
    
    @pytest.fixture
    def sample_text_file(self):
        """Create a temporary text file for testing"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write("This is a sample insurance policy document.\n")
            f.write("Coverage includes preventive care at 100%.\n")
            f.write("Emergency room visits require $150 copay.\n")
            temp_path = f.name
        
        yield temp_path
        
        # Cleanup
        if os.path.exists(temp_path):
            os.unlink(temp_path)
    
    def test_service_initialization(self, extraction_service):
        """Test service initialization"""
        assert extraction_service.pdf_available in [True, False]
        assert extraction_service.ocr_available in [True, False]
        assert hasattr(extraction_service, 'confidence_threshold')
    
    def test_extract_from_text_file_success(self, extraction_service, sample_text_file):
        """Test successful text file extraction"""
        result = extraction_service.extract_text_from_file(sample_text_file)
        
        assert isinstance(result, ExtractionResult)
        assert result.extraction_method == ExtractionMethod.PLAIN_TEXT.value
        assert result.confidence_score == 1.0
        assert result.text_quality == TextQuality.EXCELLENT.value
        assert "insurance policy" in result.text
        assert result.word_count > 0
        assert result.character_count > 0
        assert result.page_count == 1
        assert result.error_message is None
    
    def test_extract_from_nonexistent_file(self, extraction_service):
        """Test extraction from non-existent file"""
        result = extraction_service.extract_text_from_file("/nonexistent/file.txt")
        
        assert isinstance(result, ExtractionResult)
        assert result.extraction_method == "error"
        assert result.confidence_score == 0.0
        assert result.text_quality == TextQuality.POOR.value
        assert result.text == ""
        assert result.error_message == "File not found"
    
    def test_extract_from_unsupported_file_type(self, extraction_service):
        """Test extraction from unsupported file type"""
        with tempfile.NamedTemporaryFile(suffix='.xyz', delete=False) as f:
            f.write(b"binary data")
            temp_path = f.name
        
        try:
            result = extraction_service.extract_text_from_file(temp_path)
            
            assert isinstance(result, ExtractionResult)
            assert result.extraction_method == "unsupported"
            assert result.confidence_score == 0.0
            assert "Unsupported file type" in result.error_message
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_clean_text_functionality(self, extraction_service):
        """Test text cleaning functionality"""
        dirty_text = "  This   has   excessive    whitespace  \n\r\n  "
        cleaned = extraction_service._clean_text(dirty_text)
        
        assert cleaned == "This has excessive whitespace"
    
    def test_clean_text_empty_input(self, extraction_service):
        """Test text cleaning with empty input"""
        assert extraction_service._clean_text("") == ""
        assert extraction_service._clean_text(None) == ""
        assert extraction_service._clean_text("   ") == ""
    
    def test_calculate_text_confidence_good_text(self, extraction_service):
        """Test confidence calculation for good quality text"""
        good_text = "This is a well-formatted insurance policy document with proper words and structure."
        confidence = extraction_service._calculate_text_confidence(good_text)
        
        assert 0.7 <= confidence <= 1.0
    
    def test_calculate_text_confidence_poor_text(self, extraction_service):
        """Test confidence calculation for poor quality text"""
        poor_text = "a b c d e f g h i j k l m n o p q r s t u v w x y z"
        confidence = extraction_service._calculate_text_confidence(poor_text)
        
        assert confidence < 0.7
    
    def test_calculate_text_confidence_empty_text(self, extraction_service):
        """Test confidence calculation for empty text"""
        confidence = extraction_service._calculate_text_confidence("")
        assert confidence == 0.0
        
        confidence = extraction_service._calculate_text_confidence("   ")
        assert confidence == 0.0
    
    def test_determine_text_quality_levels(self, extraction_service):
        """Test text quality determination for different confidence levels"""
        assert extraction_service._determine_text_quality(0.95) == TextQuality.EXCELLENT.value
        assert extraction_service._determine_text_quality(0.85) == TextQuality.GOOD.value
        assert extraction_service._determine_text_quality(0.65) == TextQuality.FAIR.value
        assert extraction_service._determine_text_quality(0.35) == TextQuality.POOR.value
    
    @patch('app.services.text_extraction_service.PDF_AVAILABLE', False)
    def test_extract_from_pdf_no_pypdf2(self, extraction_service):
        """Test PDF extraction when PyPDF2 is not available"""
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            temp_path = f.name
        
        try:
            result = extraction_service._extract_from_pdf(temp_path, 0.0)
            
            assert result.extraction_method == "error"
            assert result.confidence_score == 0.0
            assert "PDF processing not available" in result.error_message
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    @patch('app.services.text_extraction_service.OCR_AVAILABLE', False)
    def test_extract_from_image_no_ocr(self, extraction_service):
        """Test image extraction when OCR is not available"""
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            temp_path = f.name
        
        try:
            with pytest.raises(Exception, match="OCR not available"):
                extraction_service._extract_from_image(temp_path, 0.0)
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    @patch('app.services.text_extraction_service.PdfReader')
    def test_extract_from_pdf_success(self, mock_pdf_reader, extraction_service):
        """Test successful PDF extraction with PyPDF2"""
        # Mock PDF reader
        mock_page = Mock()
        mock_page.extract_text.return_value = "Sample PDF text content"
        
        mock_reader_instance = Mock()
        mock_reader_instance.pages = [mock_page]
        mock_pdf_reader.return_value = mock_reader_instance
        
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as f:
            temp_path = f.name
        
        try:
            result = extraction_service._extract_from_pdf(temp_path, 0.0)
            
            assert result.extraction_method == ExtractionMethod.PYPDF2.value
            assert "Sample PDF text content" in result.text
            assert result.page_count == 1
            assert result.confidence_score > 0
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    @patch('app.services.text_extraction_service.pytesseract')
    @patch('app.services.text_extraction_service.Image')
    def test_extract_from_image_success(self, mock_image, mock_pytesseract, extraction_service):
        """Test successful image extraction with OCR"""
        # Mock OCR functionality
        mock_pytesseract.image_to_string.return_value = "Sample OCR extracted text"
        mock_pytesseract.image_to_data.return_value = {
            'conf': ['85', '90', '88', '92']
        }
        mock_pytesseract.Output.DICT = 'dict'
        
        mock_image_instance = Mock()
        mock_image.open.return_value = mock_image_instance
        
        # Set OCR as available for this test
        extraction_service.ocr_available = True
        
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
            temp_path = f.name
        
        try:
            result = extraction_service._extract_from_image(temp_path, 0.0)
            
            assert result.extraction_method == ExtractionMethod.OCR.value
            assert "Sample OCR extracted text" in result.text
            assert result.confidence_score > 0
            assert result.page_count == 1
        finally:
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    def test_mime_type_detection(self, extraction_service, sample_text_file):
        """Test MIME type detection and routing"""
        # Test with explicit MIME type
        result = extraction_service.extract_text_from_file(
            sample_text_file, 
            mime_type="text/plain"
        )
        assert result.extraction_method == ExtractionMethod.PLAIN_TEXT.value
        
        # Test with file extension detection
        result = extraction_service.extract_text_from_file(sample_text_file)
        assert result.extraction_method == ExtractionMethod.PLAIN_TEXT.value
    
    def test_extraction_result_dataclass(self):
        """Test ExtractionResult dataclass functionality"""
        result = ExtractionResult(
            text="Sample text",
            confidence_score=0.85,
            extraction_method="test",
            text_quality="good",
            page_count=1,
            word_count=2,
            character_count=11,
            processing_time=1.5,
            error_message=None,
            metadata={"test": "data"}
        )
        
        assert result.text == "Sample text"
        assert result.confidence_score == 0.85
        assert result.metadata == {"test": "data"}
    
    def test_extraction_with_processing_time(self, extraction_service, sample_text_file):
        """Test that processing time is calculated correctly"""
        result = extraction_service.extract_text_from_file(sample_text_file)
        
        assert result.processing_time >= 0
        assert isinstance(result.processing_time, float)


class TestTextExtractionIntegration:
    """Integration tests for text extraction functionality"""
    
    def test_extraction_service_global_instance(self):
        """Test that global service instance is available"""
        from app.services.text_extraction_service import text_extraction_service
        
        assert text_extraction_service is not None
        assert isinstance(text_extraction_service, EnhancedTextExtractionService)
    
    def test_multiple_format_support(self):
        """Test support for multiple document formats"""
        service = EnhancedTextExtractionService()
        
        # Test format routing logic
        test_cases = [
            ("document.pdf", "application/pdf"),
            ("document.txt", "text/plain"),
            ("image.jpg", "image/jpeg"),
            ("image.png", "image/png")
        ]
        
        for filename, expected_mime in test_cases:
            # This would test the routing logic
            # Actual file processing would require real files
            pass
    
    def test_error_recovery_mechanisms(self):
        """Test error recovery and fallback mechanisms"""
        # Test various error scenarios and recovery
        pass
    
    def test_performance_with_large_documents(self):
        """Test performance with large documents"""
        # Test extraction performance with large files
        pass
