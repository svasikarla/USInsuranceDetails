# AI Implementation Guide

## Quick Start

This guide provides step-by-step instructions for implementing and using the AI/LLM features in the US Insurance Platform.

## Prerequisites

### 1. Google AI API Setup
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key for Gemini
3. Copy the API key for configuration

### 2. Environment Configuration
Create or update your `.env` file:

```bash
# Google AI Configuration
GOOGLE_AI_API_KEY=your_actual_api_key_here
AI_ANALYSIS_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.6
AI_MAX_RETRIES=3
AI_RETRY_DELAY=1.0

# Text Extraction Configuration
OCR_CONFIDENCE_THRESHOLD=0.75
```

### 3. Install Dependencies
```bash
# Install AI dependencies
pip install google-generativeai==0.8.3

# Install OCR dependencies (optional but recommended)
pip install pytesseract Pillow pdf2image

# For Windows, also install Tesseract OCR:
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
```

## Database Migration

Run the migration to create the AI analysis logs table:

```bash
# Create migration for AI analysis logs
alembic revision --autogenerate -m "Add AI analysis logs table"

# Apply migration
alembic upgrade head
```

## Implementation Steps

### Step 1: Basic AI Analysis

```python
# Example: Analyze a policy document
from app.services.ai_analysis_service import ai_analysis_service, AnalysisType
from app.models import PolicyDocument

# Get document
document = db.query(PolicyDocument).filter(PolicyDocument.id == document_id).first()

# Perform analysis
result = ai_analysis_service.analyze_policy_document(
    document=document,
    analysis_type=AnalysisType.COMPREHENSIVE
)

if result:
    print(f"Analysis completed with {result.total_confidence:.2f} confidence")
    print(f"Red flags found: {len(result.red_flags)}")
    print(f"Benefits extracted: {len(result.benefits)}")
else:
    print("Analysis failed or service unavailable")
```

### Step 2: Enhanced Policy Creation

```python
# Example: Create policy with AI analysis
from app.services.enhanced_policy_service import enhanced_policy_service

# Create policy with automatic AI analysis
policy = enhanced_policy_service.create_policy_with_ai_analysis(
    db=db_session,
    policy_data={
        "policy_type": "health",
        "carrier_id": carrier_id,
        "user_id": user_id,
        # ... other policy data
    },
    document=uploaded_document
)

print(f"Policy created with ID: {policy.id}")
```

### Step 3: API Integration

```python
# Example: Using the API endpoints
import requests

# Start analysis
response = requests.post(
    "http://localhost:8000/api/ai/analyze-policy",
    json={
        "policy_id": "policy-uuid-here",
        "analysis_type": "comprehensive"
    },
    headers={"Authorization": "Bearer your-jwt-token"}
)

analysis_data = response.json()
analysis_id = analysis_data["analysis_id"]

# Check status
status_response = requests.get(
    f"http://localhost:8000/api/ai/analysis-status/{analysis_id}",
    headers={"Authorization": "Bearer your-jwt-token"}
)

status_data = status_response.json()
print(f"Analysis status: {status_data['status']}")
```

### Step 4: Text Extraction

```python
# Example: Extract text from document
from app.services.text_extraction_service import text_extraction_service

# Extract text
result = text_extraction_service.extract_text_from_file(
    file_path="/path/to/policy.pdf",
    mime_type="application/pdf"
)

print(f"Extraction method: {result.extraction_method}")
print(f"Confidence: {result.confidence_score:.2f}")
print(f"Word count: {result.word_count}")
print(f"Text quality: {result.text_quality}")

# Update document with extracted text
document.extracted_text = result.text
document.ocr_confidence_score = result.confidence_score
db.commit()
```

### Step 5: Monitoring and Analytics

```python
# Example: Monitor AI performance
from app.services.ai_monitoring_service import ai_monitoring_service

# Get performance statistics
stats = ai_monitoring_service.get_performance_stats(
    db=db_session,
    hours=24  # Last 24 hours
)

print(f"Total analyses: {stats['total_analyses']}")
print(f"Success rate: {stats['success_rate']}%")
print(f"Average processing time: {stats['average_processing_time_seconds']}s")
print(f"Average confidence: {stats['average_confidence_score']:.3f}")

# Get detailed metrics
metrics = ai_monitoring_service.get_analysis_metrics(
    db=db_session,
    policy_id=None,  # All policies
    hours=24
)

for metric in metrics:
    print(f"Analysis {metric['analysis_id']}: {metric['status']}")
```

## Frontend Integration

### React Component Example

```jsx
// AIAnalysisComponent.jsx
import React, { useState, useEffect } from 'react';
import { analyzePolicy, getAnalysisStatus } from '../services/aiService';

const AIAnalysisComponent = ({ policyId }) => {
  const [analysisId, setAnalysisId] = useState(null);
  const [status, setStatus] = useState('idle');
  const [results, setResults] = useState(null);

  const startAnalysis = async () => {
    try {
      setStatus('starting');
      const response = await analyzePolicy(policyId, 'comprehensive');
      setAnalysisId(response.analysis_id);
      setStatus('processing');
      
      // Poll for status
      pollStatus(response.analysis_id);
    } catch (error) {
      console.error('Analysis failed:', error);
      setStatus('error');
    }
  };

  const pollStatus = async (id) => {
    const interval = setInterval(async () => {
      try {
        const statusResponse = await getAnalysisStatus(id);
        
        if (statusResponse.status === 'completed') {
          setResults(statusResponse);
          setStatus('completed');
          clearInterval(interval);
        } else if (statusResponse.status === 'failed') {
          setStatus('error');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Status check failed:', error);
        clearInterval(interval);
      }
    }, 2000); // Check every 2 seconds
  };

  return (
    <div className="ai-analysis">
      <h3>AI Policy Analysis</h3>
      
      {status === 'idle' && (
        <button onClick={startAnalysis}>
          Start AI Analysis
        </button>
      )}
      
      {status === 'processing' && (
        <div>
          <p>Analysis in progress...</p>
          <div className="spinner"></div>
        </div>
      )}
      
      {status === 'completed' && results && (
        <div className="results">
          <h4>Analysis Results</h4>
          <p>Red Flags: {results.red_flags_detected}</p>
          <p>Benefits: {results.benefits_extracted}</p>
          <p>Confidence: {(results.confidence_score * 100).toFixed(1)}%</p>
        </div>
      )}
      
      {status === 'error' && (
        <div className="error">
          <p>Analysis failed. Please try again.</p>
          <button onClick={() => setStatus('idle')}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default AIAnalysisComponent;
```

### API Service Functions

```javascript
// services/aiService.js
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const analyzePolicy = async (policyId, analysisType = 'comprehensive') => {
  const response = await fetch(`${API_BASE}/api/ai/analyze-policy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({
      policy_id: policyId,
      analysis_type: analysisType
    })
  });

  if (!response.ok) {
    throw new Error('Analysis request failed');
  }

  return response.json();
};

export const getAnalysisStatus = async (analysisId) => {
  const response = await fetch(`${API_BASE}/api/ai/analysis-status/${analysisId}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  if (!response.ok) {
    throw new Error('Status check failed');
  }

  return response.json();
};

export const reanalyzePolicy = async (policyId, forceAI = false) => {
  const response = await fetch(`${API_BASE}/api/ai/reanalyze-policy/${policyId}?force_ai=${forceAI}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  if (!response.ok) {
    throw new Error('Re-analysis failed');
  }

  return response.json();
};

const getAuthToken = () => {
  // Implement your auth token retrieval logic
  return localStorage.getItem('authToken');
};
```

## Testing

### Running Tests

```bash
# Run AI service tests
pytest backend/tests/test_ai_analysis_service.py -v

# Run text extraction tests
pytest backend/tests/test_text_extraction_service.py -v

# Run API route tests
pytest backend/tests/test_ai_routes.py -v

# Run all AI-related tests
pytest backend/tests/test_ai* -v
```

### Manual Testing

```python
# Test script for manual verification
import asyncio
from app.services.ai_analysis_service import ai_analysis_service
from app.models import PolicyDocument

async def test_ai_analysis():
    # Create test document
    test_document = PolicyDocument(
        extracted_text="""
        Health Insurance Policy
        
        Benefits:
        - Preventive care: 100% covered
        - Emergency room: $150 copay
        - Specialist visits: $30 copay, pre-authorization required
        
        Limitations:
        - Out-of-network not covered
        - Annual deductible: $2,000
        """
    )
    
    # Test analysis
    result = ai_analysis_service.analyze_policy_document(test_document)
    
    if result:
        print("✅ AI Analysis successful")
        print(f"Red flags: {len(result.red_flags)}")
        print(f"Benefits: {len(result.benefits)}")
        print(f"Confidence: {result.total_confidence:.2f}")
    else:
        print("❌ AI Analysis failed")

# Run test
asyncio.run(test_ai_analysis())
```

## Troubleshooting

### Common Issues

1. **"AI analysis service is not available"**
   - Check GOOGLE_AI_API_KEY is set correctly
   - Verify API key has proper permissions
   - Check internet connectivity

2. **Low confidence scores**
   - Improve text extraction quality
   - Check document format and clarity
   - Adjust AI_CONFIDENCE_THRESHOLD

3. **OCR not working**
   - Install Tesseract OCR
   - Check pytesseract configuration
   - Verify image quality

4. **Analysis taking too long**
   - Check API rate limits
   - Monitor network latency
   - Consider document size optimization

### Debug Mode

Enable debug logging:

```python
import logging
logging.basicConfig(level=logging.DEBUG)

# This will show detailed AI service logs
```

## Production Deployment

### Environment Variables
```bash
# Production settings
GOOGLE_AI_API_KEY=prod_api_key_here
AI_ANALYSIS_ENABLED=true
AI_CONFIDENCE_THRESHOLD=0.7  # Higher threshold for production
AI_MAX_RETRIES=5
AI_RETRY_DELAY=2.0

# Monitoring
LOG_LEVEL=INFO
```

### Performance Monitoring
- Set up alerts for high error rates
- Monitor API usage and costs
- Track analysis performance metrics
- Implement health checks

### Security
- Rotate API keys regularly
- Implement rate limiting
- Monitor for unusual usage patterns
- Secure sensitive document data
