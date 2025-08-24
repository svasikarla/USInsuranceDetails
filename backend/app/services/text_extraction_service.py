"""
Enhanced Text Extraction Service

This service provides robust text extraction from policy documents with support
for multiple formats, OCR fallback, and text preprocessing for AI analysis.
"""

import logging
import os
import tempfile
import time
from typing import Optional, Tuple, Dict, Any
from dataclasses import dataclass
from enum import Enum
import mimetypes

# PDF processing
try:
    from PyPDF2 import PdfReader
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    logging.warning("PyPDF2 not available. PDF extraction will be limited.")

# OCR processing
try:
    import pytesseract
    from PIL import Image
    import pdf2image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    logging.warning("OCR dependencies not available. OCR extraction will be disabled.")

from app.core.config import settings

logger = logging.getLogger(__name__)

class ExtractionMethod(Enum):
    """Methods for text extraction"""
    PYPDF2 = "pypdf2"
    OCR = "ocr"
    PLAIN_TEXT = "plain_text"
    HYBRID = "hybrid"

class TextQuality(Enum):
    """Quality levels for extracted text"""
    EXCELLENT = "excellent"  # 0.9 - 1.0
    GOOD = "good"           # 0.7 - 0.9
    FAIR = "fair"           # 0.5 - 0.7
    POOR = "poor"           # 0.0 - 0.5

@dataclass
class ExtractionResult:
    """Result of text extraction operation"""
    text: str
    confidence_score: float
    extraction_method: str
    text_quality: str
    page_count: int
    word_count: int
    character_count: int
    processing_time: float
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class EnhancedTextExtractionService:
    """
    Enhanced text extraction service with multiple extraction methods
    """
    
    def __init__(self):
        self.pdf_available = PDF_AVAILABLE
        self.ocr_available = OCR_AVAILABLE
        self.confidence_threshold = settings.OCR_CONFIDENCE_THRESHOLD
        
        # Configure Tesseract if available
        if self.ocr_available:
            try:
                # Try to configure Tesseract path (adjust for your system)
                # pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
                pass
            except Exception as e:
                logger.warning(f"Tesseract configuration warning: {e}")
    
    def extract_text_from_file(self, file_path: str, mime_type: Optional[str] = None) -> ExtractionResult:
        """
        Extract text from a file using the best available method
        
        Args:
            file_path: Path to the file
            mime_type: MIME type of the file (optional)
            
        Returns:
            ExtractionResult with extracted text and metadata
        """
        import time
        start_time = time.time()
        
        # Determine file type
        if not mime_type:
            mime_type, _ = mimetypes.guess_type(file_path)
        
        if not os.path.exists(file_path):
            return ExtractionResult(
                text="",
                confidence_score=0.0,
                extraction_method="error",
                text_quality=TextQuality.POOR.value,
                page_count=0,
                word_count=0,
                character_count=0,
                processing_time=time.time() - start_time,
                error_message="File not found"
            )
        
        try:
            # Route to appropriate extraction method
            if mime_type == "application/pdf" or file_path.lower().endswith('.pdf'):
                return self._extract_from_pdf(file_path, start_time)
            elif mime_type == "text/plain" or file_path.lower().endswith('.txt'):
                return self._extract_from_text_file(file_path, start_time)
            elif mime_type and mime_type.startswith('image/'):
                return self._extract_from_image(file_path, start_time)
            else:
                return ExtractionResult(
                    text="",
                    confidence_score=0.0,
                    extraction_method="unsupported",
                    text_quality=TextQuality.POOR.value,
                    page_count=0,
                    word_count=0,
                    character_count=0,
                    processing_time=time.time() - start_time,
                    error_message=f"Unsupported file type: {mime_type}"
                )
                
        except Exception as e:
            logger.error(f"Text extraction failed for {file_path}: {str(e)}")
            return ExtractionResult(
                text="",
                confidence_score=0.0,
                extraction_method="error",
                text_quality=TextQuality.POOR.value,
                page_count=0,
                word_count=0,
                character_count=0,
                processing_time=time.time() - start_time,
                error_message=str(e)
            )
    
    def _extract_from_pdf(self, file_path: str, start_time: float) -> ExtractionResult:
        """Extract text from PDF using PyPDF2 with OCR fallback"""
        if not self.pdf_available:
            return ExtractionResult(
                text="",
                confidence_score=0.0,
                extraction_method="error",
                text_quality=TextQuality.POOR.value,
                page_count=0,
                word_count=0,
                character_count=0,
                processing_time=time.time() - start_time,
                error_message="PDF processing not available"
            )
        
        try:
            # Try PyPDF2 first
            reader = PdfReader(file_path)
            text = ""
            page_count = len(reader.pages)
            
            for page in reader.pages:
                page_text = page.extract_text()
                text += page_text + "\n"
            
            # Clean and analyze the text
            text = self._clean_text(text)
            confidence = self._calculate_text_confidence(text)
            
            # If confidence is low and OCR is available, try OCR
            if confidence < self.confidence_threshold and self.ocr_available:
                logger.info(f"PyPDF2 confidence ({confidence:.2f}) below threshold, trying OCR")
                ocr_result = self._extract_pdf_with_ocr(file_path, start_time)
                if ocr_result.confidence_score > confidence:
                    return ocr_result
            
            return ExtractionResult(
                text=text,
                confidence_score=confidence,
                extraction_method=ExtractionMethod.PYPDF2.value,
                text_quality=self._determine_text_quality(confidence),
                page_count=page_count,
                word_count=len(text.split()),
                character_count=len(text),
                processing_time=time.time() - start_time,
                metadata={"pdf_pages": page_count}
            )
            
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {str(e)}, trying OCR")
            if self.ocr_available:
                return self._extract_pdf_with_ocr(file_path, start_time)
            else:
                raise e
    
    def _extract_pdf_with_ocr(self, file_path: str, start_time: float) -> ExtractionResult:
        """Extract text from PDF using OCR"""
        if not self.ocr_available:
            raise Exception("OCR not available")
        
        try:
            # Convert PDF to images
            images = pdf2image.convert_from_path(file_path)
            text = ""
            total_confidence = 0.0
            
            for i, image in enumerate(images):
                # Perform OCR on each page
                page_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
                page_text = pytesseract.image_to_string(image)
                
                # Calculate confidence for this page
                confidences = [int(conf) for conf in page_data['conf'] if int(conf) > 0]
                page_confidence = sum(confidences) / len(confidences) if confidences else 0
                
                text += page_text + "\n"
                total_confidence += page_confidence
            
            # Clean text and calculate overall confidence
            text = self._clean_text(text)
            avg_confidence = total_confidence / len(images) if images else 0
            normalized_confidence = avg_confidence / 100.0  # Tesseract returns 0-100
            
            return ExtractionResult(
                text=text,
                confidence_score=normalized_confidence,
                extraction_method=ExtractionMethod.OCR.value,
                text_quality=self._determine_text_quality(normalized_confidence),
                page_count=len(images),
                word_count=len(text.split()),
                character_count=len(text),
                processing_time=time.time() - start_time,
                metadata={"ocr_pages": len(images), "avg_ocr_confidence": avg_confidence}
            )
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {str(e)}")
            raise e
    
    def _extract_from_text_file(self, file_path: str, start_time: float) -> ExtractionResult:
        """Extract text from plain text file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='replace') as file:
                text = file.read()
            
            text = self._clean_text(text)
            
            return ExtractionResult(
                text=text,
                confidence_score=1.0,  # Plain text has perfect confidence
                extraction_method=ExtractionMethod.PLAIN_TEXT.value,
                text_quality=TextQuality.EXCELLENT.value,
                page_count=1,
                word_count=len(text.split()),
                character_count=len(text),
                processing_time=time.time() - start_time
            )
            
        except Exception as e:
            logger.error(f"Text file extraction failed: {str(e)}")
            raise e
    
    def _extract_from_image(self, file_path: str, start_time: float) -> ExtractionResult:
        """Extract text from image using OCR"""
        if not self.ocr_available:
            raise Exception("OCR not available for image processing")
        
        try:
            image = Image.open(file_path)
            
            # Perform OCR
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            text = pytesseract.image_to_string(image)
            
            # Calculate confidence
            confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            normalized_confidence = avg_confidence / 100.0
            
            text = self._clean_text(text)
            
            return ExtractionResult(
                text=text,
                confidence_score=normalized_confidence,
                extraction_method=ExtractionMethod.OCR.value,
                text_quality=self._determine_text_quality(normalized_confidence),
                page_count=1,
                word_count=len(text.split()),
                character_count=len(text),
                processing_time=time.time() - start_time,
                metadata={"image_ocr_confidence": avg_confidence}
            )
            
        except Exception as e:
            logger.error(f"Image OCR extraction failed: {str(e)}")
            raise e
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize extracted text"""
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = ' '.join(text.split())
        
        # Remove common OCR artifacts
        text = text.replace('|', 'I')  # Common OCR mistake
        text = text.replace('0', 'O')  # In some contexts
        
        # Normalize line breaks
        text = text.replace('\r\n', '\n').replace('\r', '\n')
        
        return text.strip()
    
    def _calculate_text_confidence(self, text: str) -> float:
        """Calculate confidence score for extracted text"""
        if not text:
            return 0.0
        
        # Simple heuristics for text quality
        words = text.split()
        if not words:
            return 0.0
        
        # Check for reasonable word length distribution
        avg_word_length = sum(len(word) for word in words) / len(words)
        if avg_word_length < 2 or avg_word_length > 15:
            return 0.3
        
        # Check for reasonable character distribution
        alpha_ratio = sum(1 for char in text if char.isalpha()) / len(text)
        if alpha_ratio < 0.5:
            return 0.4
        
        # Check for common English words (simple check)
        common_words = {'the', 'and', 'or', 'of', 'to', 'in', 'a', 'is', 'that', 'for'}
        found_common = sum(1 for word in words[:50] if word.lower() in common_words)
        common_ratio = found_common / min(len(words), 50)
        
        # Combine factors
        confidence = min(1.0, (alpha_ratio + common_ratio) / 2)
        return confidence
    
    def _determine_text_quality(self, confidence: float) -> str:
        """Determine text quality based on confidence score"""
        if confidence >= 0.9:
            return TextQuality.EXCELLENT.value
        elif confidence >= 0.7:
            return TextQuality.GOOD.value
        elif confidence >= 0.5:
            return TextQuality.FAIR.value
        else:
            return TextQuality.POOR.value


# Global service instance
text_extraction_service = EnhancedTextExtractionService()
