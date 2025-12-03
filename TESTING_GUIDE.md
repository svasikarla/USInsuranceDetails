# Policy Extraction Testing Guide
================================

This guide provides comprehensive testing tools to diagnose the "No policy data could be extracted from this document" error.

## 📁 Test Files Created

### Sample Policy Documents

1. **`sample_health_insurance_policy.txt`** - Comprehensive health insurance policy
   - Contains all standard fields (policy name, number, premiums, deductibles, etc.)
   - Includes red flag items for testing AI analysis
   - Well-formatted with clear labels

2. **`sample_dental_policy_complex.txt`** - Complex dental insurance policy
   - Tests different policy type extraction
   - Contains waiting periods and limitations
   - More complex formatting

3. **`sample_minimal_policy.txt`** - Minimal test case
   - Basic policy information only
   - Tests minimum viable extraction
   - Simple format for debugging

### Test Scripts

1. **`test_extraction.ps1`** - PowerShell test script (Windows)
   - Automated testing with detailed output
   - Color-coded results
   - Diagnostic information display

2. **`test_extraction_simple.sh`** - Bash script (Linux/Mac)
   - Simple curl-based testing
   - JSON output formatting
   - Error diagnosis

3. **`test_policy_extraction.py`** - Python test suite
   - Comprehensive testing framework
   - Multiple file testing
   - Detailed analysis

## 🚀 How to Run Tests

### Prerequisites

1. **Backend server running**: `python run.py` in backend directory
2. **Valid user account**: Create a test user or use existing credentials
3. **Sample files**: Ensure all sample files are in the current directory

### Option 1: PowerShell Script (Recommended for Windows)

```powershell
# Navigate to the project root
cd D:\GrowthSch\USInsuranceDetails

# Update credentials in the script if needed
# Edit test_extraction.ps1 and change $Email and $Password

# Run the test
.\test_extraction.ps1
```

### Option 2: Python Test Suite

```bash
# Install requests if not already installed
pip install requests

# Update credentials in test_policy_extraction.py
# Edit the login_data dictionary

# Run the test
python test_policy_extraction.py
```

### Option 3: Manual Testing via Frontend

1. Start frontend: `npm run dev` in frontend directory
2. Navigate to http://localhost:3000
3. Login with valid credentials
4. Go to Documents → Upload
5. Upload one of the sample files
6. Wait for processing
7. Go to Policies → New Policy
8. Select the uploaded document
9. Check if policy data is extracted

## 🔍 What to Look For

### Success Indicators

- ✅ Document uploads successfully
- ✅ Processing status becomes "completed"
- ✅ `has_extracted_text` is true
- ✅ `extracted_text_length` > 100
- ✅ `auto_creation_status` is "completed" or "review_required"
- ✅ `auto_creation_confidence` > 0
- ✅ `extracted_policy_data` contains policy fields

### Failure Points to Check

1. **Text Extraction Failure**
   - `processing_status` = "failed"
   - `has_extracted_text` = false
   - `extracted_text_length` = 0
   - **Cause**: OCR dependencies missing or file format issues

2. **AI Service Unavailable**
   - `auto_creation_status` = "failed"
   - `auto_creation_confidence` = 0
   - **Cause**: Google AI API key issues or service initialization failure

3. **Low Confidence Extraction**
   - `auto_creation_confidence` < 0.3
   - `extracted_policy_data` = null
   - **Cause**: Document format not recognized by AI or patterns

4. **Pattern Matching Failure**
   - AI fails and pattern matching also returns no data
   - **Cause**: Document format doesn't match expected patterns

## 🛠️ Troubleshooting Steps

### Step 1: Check Backend Logs

Look for these log messages in the backend console:

```
[DEBUG] Document {id} - extracted text length: {length}
[INFO] Starting pattern matching extraction for document {id}
[WARNING] AI extraction confidence too low
[ERROR] No extracted text available for document {id}
```

### Step 2: Verify Dependencies

Check if OCR dependencies are installed:

```bash
pip install pytesseract pillow pdf2image
```

For Windows, also install Tesseract binary:
- Download from: https://github.com/UB-Mannheim/tesseract/wiki
- Add to PATH environment variable

### Step 3: Test AI Service

Check if Google AI API is working:

```python
import google.generativeai as genai
genai.configure(api_key="your-api-key")
model = genai.GenerativeModel("gemini-1.5-flash")
response = model.generate_content("Test message")
print(response.text)
```

### Step 4: Manual Text Extraction Test

Test text extraction directly:

```python
from app.services.text_extraction_service import text_extraction_service
result = text_extraction_service.extract_text_from_file("sample_minimal_policy.txt", "text/plain")
print(f"Text: {result.text}")
print(f"Length: {len(result.text)}")
```

## 📊 Expected Results

### For `sample_minimal_policy.txt`

**Expected Extracted Fields:**
- `policy_name`: "Essential Health Plan"
- `policy_type`: "health"
- `policy_number`: "ESS-2025-123"
- `premium_monthly`: 299.00
- `deductible_individual`: 2500.00
- `out_of_pocket_max_individual`: 8000.00

### For `sample_health_insurance_policy.txt`

**Expected Extracted Fields:**
- `policy_name`: "Premium Health Plus Plan 2025"
- `policy_type`: "health"
- `policy_number`: "HP-2025-789456123"
- `network_type`: "PPO"
- `premium_monthly`: 485.50
- `deductible_individual`: 1500.00
- Plus many more fields...

## 🔧 Common Issues and Fixes

### Issue 1: "OCR dependencies not available"

**Fix:**
```bash
pip install pytesseract pillow pdf2image
# Windows: Install Tesseract binary and add to PATH
```

### Issue 2: "Google AI API key not configured"

**Fix:**
- Check `.env` file has `GOOGLE_API_KEY=your-key`
- Verify API key is valid and has quota
- Check backend logs for initialization errors

### Issue 3: "No extracted text available"

**Fix:**
- Ensure file is readable text format
- Check file encoding (should be UTF-8)
- Try with different file formats

### Issue 4: "AI extraction failed - no response"

**Fix:**
- Check internet connectivity
- Verify API key quota
- Check for API rate limiting

## 📈 Next Steps

If tests reveal specific issues:

1. **Text Extraction Issues**: Install OCR dependencies
2. **AI Service Issues**: Fix API configuration
3. **Pattern Matching Issues**: Enhance regex patterns
4. **Document Format Issues**: Add support for more formats

The enhanced logging and diagnostic information will help pinpoint exactly where the extraction pipeline is failing.
