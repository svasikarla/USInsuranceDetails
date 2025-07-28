# AI/LLM Pipeline Architecture Guide

## Overview

The US Insurance Platform integrates Google Gemini LLM for comprehensive policy document analysis, including red flag detection and benefit extraction. This document provides a complete guide to the AI pipeline architecture, implementation details, and usage patterns.

## Architecture Components

### 1. Core Services

#### AI Analysis Service (`app/services/ai_analysis_service.py`)
- **Purpose**: Primary interface for Google Gemini LLM integration
- **Key Features**:
  - Structured analysis with JSON output
  - Retry logic with exponential backoff
  - Confidence scoring (0.0-1.0 scale)
  - Support for multiple analysis types
  - Error handling and fallback mechanisms

#### Enhanced Policy Service (`app/services/enhanced_policy_service.py`)
- **Purpose**: Policy management with AI integration
- **Key Features**:
  - AI-powered policy creation
  - Re-analysis capabilities
  - Graceful fallback to basic analysis
  - Analysis status tracking

#### Text Extraction Service (`app/services/text_extraction_service.py`)
- **Purpose**: Robust text extraction from multiple document formats
- **Key Features**:
  - PDF processing with PyPDF2
  - OCR fallback with Tesseract
  - Text quality assessment
  - Confidence scoring for extracted text

#### AI Monitoring Service (`app/services/ai_monitoring_service.py`)
- **Purpose**: Comprehensive monitoring and logging for AI operations
- **Key Features**:
  - Real-time analysis tracking
  - Performance metrics collection
  - Cost estimation
  - Error logging and debugging

### 2. Data Models

#### Analysis Result Structure
```python
@dataclass
class AnalysisResult:
    red_flags: List[RedFlagResult]
    benefits: List[BenefitResult]
    processing_time: float
    total_confidence: float
    analysis_metadata: Dict[str, Any]
```

#### Red Flag Detection
```python
@dataclass
class RedFlagResult:
    flag_type: str              # Category of red flag
    severity: str               # low, medium, high, critical
    title: str                  # Human-readable title
    description: str            # Detailed description
    source_text: str           # Original text that triggered flag
    page_number: Optional[str]  # Location in document
    recommendation: str         # Suggested action
    confidence_score: float     # AI confidence (0.0-1.0)
    reasoning: str             # AI reasoning for detection
```

#### Benefit Extraction
```python
@dataclass
class BenefitResult:
    category: str                      # preventive, emergency, specialist, etc.
    name: str                         # Benefit name
    coverage_percentage: Optional[float]  # Coverage percentage
    copay_amount: Optional[float]      # Copay amount
    coinsurance_percentage: Optional[float]  # Coinsurance
    requires_preauth: bool             # Pre-authorization required
    network_restriction: Optional[str]  # Network restrictions
    annual_limit: Optional[float]      # Annual limits
    visit_limit: Optional[int]         # Visit limits
    notes: Optional[str]              # Additional notes
    confidence_score: float           # AI confidence
```

### 3. API Endpoints

#### Analysis Endpoints
- `POST /api/ai/analyze-policy` - Start AI analysis
- `GET /api/ai/analysis-status/{analysis_id}` - Check analysis status
- `POST /api/ai/reanalyze-policy/{policy_id}` - Re-analyze existing policy

#### Text Processing Endpoints
- `POST /api/ai/extract-text` - Extract text from documents

#### Monitoring Endpoints (Admin Only)
- `GET /api/ai/analysis-metrics` - Get analysis metrics
- `GET /api/ai/performance-stats` - Get performance statistics

## Configuration

### Environment Variables
```bash
# Google AI Configuration
GOOGLE_AI_API_KEY=your_gemini_api_key_here
AI_ANALYSIS_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.6
AI_MAX_RETRIES=3
AI_RETRY_DELAY=1.0

# Text Extraction
OCR_CONFIDENCE_THRESHOLD=0.75
```

### Dependencies
```txt
google-generativeai==0.8.3  # Google Gemini LLM
PyPDF2>=3.0.0              # PDF text extraction
pytesseract>=0.3.10        # OCR processing
Pillow>=9.0.0              # Image processing
pdf2image>=1.16.0          # PDF to image conversion
```

## Usage Patterns

### 1. Basic Policy Analysis

```python
from app.services.ai_analysis_service import ai_analysis_service, AnalysisType

# Analyze policy document
result = ai_analysis_service.analyze_policy_document(
    document=policy_document,
    analysis_type=AnalysisType.COMPREHENSIVE
)

if result:
    print(f"Found {len(result.red_flags)} red flags")
    print(f"Extracted {len(result.benefits)} benefits")
    print(f"Overall confidence: {result.total_confidence:.2f}")
```

### 2. Enhanced Policy Creation

```python
from app.services.enhanced_policy_service import enhanced_policy_service

# Create policy with AI analysis
policy = enhanced_policy_service.create_policy_with_ai_analysis(
    db=db_session,
    policy_data=policy_data,
    document=uploaded_document
)
```

### 3. Text Extraction

```python
from app.services.text_extraction_service import text_extraction_service

# Extract text from document
result = text_extraction_service.extract_text_from_file(
    file_path="/path/to/document.pdf"
)

print(f"Extraction method: {result.extraction_method}")
print(f"Confidence: {result.confidence_score:.2f}")
print(f"Text quality: {result.text_quality}")
```

### 4. Monitoring and Analytics

```python
from app.services.ai_monitoring_service import ai_monitoring_service

# Start monitoring analysis
analysis_id = ai_monitoring_service.start_analysis(
    policy_id=policy_id,
    document_id=document_id,
    analysis_type=AnalysisType.RED_FLAGS,
    db=db_session
)

# Complete analysis
ai_monitoring_service.complete_analysis(
    analysis_id=analysis_id,
    db=db_session,
    red_flags_count=5,
    benefits_count=12,
    confidence_score=0.87
)

# Get performance stats
stats = ai_monitoring_service.get_performance_stats(db=db_session, hours=24)
```

## Security Considerations

### 1. API Key Management
- Store Google AI API key securely in environment variables
- Never commit API keys to version control
- Use different keys for development and production
- Implement key rotation policies

### 2. Data Privacy
- Policy documents may contain sensitive information
- Implement proper access controls
- Consider data anonymization for AI processing
- Ensure compliance with privacy regulations

### 3. Rate Limiting
- Implement rate limiting for AI API calls
- Monitor usage to prevent quota exhaustion
- Implement circuit breaker patterns for resilience

## Performance Optimization

### 1. Caching Strategy
- Cache analysis results to avoid re-processing
- Implement TTL-based cache invalidation
- Use Redis for distributed caching

### 2. Batch Processing
- Process multiple documents in batches
- Implement queue-based processing for large volumes
- Use background tasks for long-running analyses

### 3. Text Preprocessing
- Optimize text extraction for better AI performance
- Remove unnecessary whitespace and formatting
- Implement text chunking for large documents

## Error Handling

### 1. Retry Logic
- Exponential backoff for API failures
- Maximum retry limits to prevent infinite loops
- Different retry strategies for different error types

### 2. Fallback Mechanisms
- Basic pattern matching when AI is unavailable
- Graceful degradation of functionality
- User notification of reduced capabilities

### 3. Monitoring and Alerting
- Real-time error tracking
- Performance threshold alerts
- Cost monitoring and budget alerts

## Testing Strategy

### 1. Unit Tests
- Mock external API calls
- Test individual service components
- Validate data transformations

### 2. Integration Tests
- Test end-to-end workflows
- Validate API endpoint functionality
- Test error scenarios

### 3. Performance Tests
- Load testing for high-volume scenarios
- Latency testing for user experience
- Cost analysis for different usage patterns

## Deployment Considerations

### 1. Environment Setup
- Configure API keys and environment variables
- Install required dependencies (Tesseract, etc.)
- Set up monitoring and logging

### 2. Scaling
- Horizontal scaling for increased load
- Load balancing for API endpoints
- Database optimization for analysis logs

### 3. Monitoring
- Application performance monitoring
- AI service health checks
- Cost tracking and optimization

## Future Enhancements

### 1. Multi-Model Support
- Support for additional LLM providers
- Model comparison and selection
- Ensemble methods for improved accuracy

### 2. Advanced Analytics
- Trend analysis across policies
- Predictive modeling for risk assessment
- Automated reporting and insights

### 3. User Experience
- Real-time analysis progress updates
- Interactive analysis results
- Customizable analysis parameters

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify key is correctly set in environment
   - Check API key permissions and quotas
   - Ensure proper key format

2. **Low Confidence Scores**
   - Review text extraction quality
   - Check document format compatibility
   - Adjust confidence thresholds

3. **Performance Issues**
   - Monitor API rate limits
   - Optimize text preprocessing
   - Implement caching strategies

4. **OCR Failures**
   - Verify Tesseract installation
   - Check image quality and format
   - Adjust OCR confidence thresholds

### Debugging Tools

- Analysis logs in `ai_analysis_logs` table
- Performance metrics via monitoring endpoints
- Detailed error messages in service logs
- Test utilities for isolated component testing
