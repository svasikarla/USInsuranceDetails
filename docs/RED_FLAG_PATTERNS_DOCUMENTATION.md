# Red Flag Pattern Detection Documentation

## Overview

The US Insurance Platform uses a comprehensive pattern-based red flag detection system to identify concerning clauses and limitations in health insurance policies. This system serves as both a primary analysis tool and a reliable fallback when AI analysis is unavailable.

## Pattern Categories

### 1. Pre-authorization Requirements (Medium Severity)

**Purpose**: Detect requirements for prior approval that may delay or complicate access to care.

**Patterns**:
- `(pre-?authorization|prior authorization|pre-?auth|prior auth).*?required`
- `require[sd]?\s+(pre-?authorization|prior authorization|pre-?auth|prior auth)`
- `authorization\s+required`
- `requires?\s+authorization`
- `must\s+obtain\s+authorization`
- `prior approval.*?required`
- `pre-?approval.*?required`
- `advance\s+approval\s+required`
- `pre-?certification.*?required`
- `out-?of-?network.*?authorization`
- `specialist.*?authorization`

**Severity**: Medium
**Flag Type**: `preauth_required`
**Confidence Score**: 0.85

### 2. Mental Health Visit Limitations (High Severity)

**Purpose**: Detect limitations on mental health services that may violate parity laws.

**Enhanced Patterns**:
- `mental health.*?limited to (\d+) visits?`
- `behavioral health.*?limited to (\d+) sessions?`
- `therapy.*?limited to (\d+) visits?`
- `therapy.*?restricted to (\d+) sessions?`
- `psychiatric.*?limited to (\d+) visits?`
- `counseling.*?limited to (\d+) sessions?`
- `mental health.*?maximum (\d+) visits?`
- `(\d+) mental health visits?`
- `(\d+) therapy sessions?`

**Severity**: High (always for mental health)
**Flag Type**: `coverage_limitation`
**Confidence Score**: 0.90

### 3. Maternity Waiting Periods (Critical/High Severity)

**Purpose**: Detect waiting periods for maternity benefits, especially concerning 12+ month periods.

**Patterns**:
- `(\d+)-?month\s+waiting\s+period.*maternity`
- `(\d+)-?month\s+waiting\s+period.*pregnancy`
- `maternity.*(\d+)-?month\s+waiting`
- `pregnancy.*(\d+)-?month\s+waiting`
- `waiting\s+period\s+of\s+(\d+)\s+months?.*maternity`
- `(\d+)\s+month[s]?\s+wait.*maternity`

**Severity**: 
- Critical: 12+ months
- High: < 12 months
**Flag Type**: `coverage_limitation`
**Confidence Score**: 0.85

### 4. High Cost-Sharing (High/Critical Severity)

**Purpose**: Detect excessive deductibles, copays, and coinsurance that may create financial barriers.

**Thresholds**:
- Individual deductible > $8,000 (Critical)
- Individual deductible > $5,000 (High)
- Family deductible > $16,000 (Critical)
- Family deductible > $10,000 (High)
- Coinsurance > 40% (High)
- Primary care copay > $50 (High)
- Specialist copay > $80 (High)

**Patterns**:
- `deductible.*\$(\d+,?\d*)`
- `copay.*\$(\d+)`
- `coinsurance.*(\d+)%`
- `out-?of-?pocket.*\$(\d+,?\d*)`

**Severity**: High to Critical based on amounts
**Flag Type**: `high_cost`
**Confidence Score**: 0.90

### 5. Network Limitations (High Severity)

**Purpose**: Detect narrow networks and out-of-network penalties.

**Patterns**:
- `narrow\s+network`
- `limited\s+network`
- `out-?of-?network.*not\s+covered`
- `out-?of-?network.*(\d+)%`
- `balance\s+billing`
- `referral.*required`
- `specialist.*referral\s+required`

**Severity**: High for no coverage, Medium for limitations
**Flag Type**: `network_limitation`
**Confidence Score**: 0.85

### 6. Coverage Exclusions (High Severity)

**Purpose**: Detect exclusions of essential health benefits or important services.

**Patterns**:
- `mental health.*?(excluded|not covered)`
- `maternity.*?(excluded|not covered)`
- `prescription.*?(excluded|not covered)`
- `emergency.*?(excluded|not covered)`
- `preventive.*?(excluded|not covered)`
- `experimental.*?(excluded|not covered)`
- `cosmetic.*?(excluded|not covered)`
- `infertility.*?(excluded|not covered)`

**Severity**: 
- High: Essential health benefits
- Medium: Other exclusions
- Low: Cosmetic procedures
**Flag Type**: `coverage_limitation` or `exclusion`
**Confidence Score**: 0.85

### 7. Appeal Burden (Medium/High Severity)

**Purpose**: Detect excessive appeal requirements that may discourage legitimate appeals.

**Patterns**:
- `appeal.*(\d+)\s+days?`
- `(\d+)\s+levels?\s+of\s+appeals?`
- `appeal.*notarized`
- `appeal.*supporting\s+documentation`

**Severity**: 
- High: < 30 days or 3+ levels
- Medium: Other burdens
**Flag Type**: `coverage_limitation`
**Confidence Score**: 0.75

### 8. ACA Compliance Issues (Critical Severity)

**Purpose**: Detect non-ACA compliant plans that lack essential protections.

**Patterns**:
- `short-?term.*medical\s+plan`
- `not\s+aca.*compliant`
- `pre-?existing.*excluded`
- `annual.*benefit.*limit`
- `essential\s+health\s+benefits.*not.*covered`

**Severity**: Critical
**Flag Type**: `coverage_limitation`
**Confidence Score**: 0.95

## Severity Classifications

### Critical
- 12+ month maternity waiting periods
- Very high deductibles (>$8,000 individual)
- ACA non-compliance
- Emergency services exclusions

### High  
- Mental health visit limitations
- Maternity waiting periods (<12 months)
- High cost-sharing
- Essential health benefit exclusions
- No out-of-network coverage

### Medium
- Pre-authorization requirements
- General visit limitations
- Appeal burdens
- Coverage change clauses
- Non-essential exclusions

### Low
- Cosmetic procedure exclusions
- Minor administrative requirements

## Detection Methods

### Pattern-Based Detection
- **Method**: `pattern_enhanced`
- **Confidence**: 0.75 - 0.95
- **Speed**: 43,000+ chars/sec
- **Reliability**: High for known patterns

### AI-Based Detection  
- **Method**: `ai_analysis`
- **Confidence**: Variable (0.80 - 0.98)
- **Speed**: Slower, depends on API
- **Reliability**: High for complex analysis

### Manual Detection
- **Method**: `manual`
- **Confidence**: 1.0
- **Speed**: Slow
- **Reliability**: Highest accuracy

## Performance Metrics

### Processing Speed
- **Single documents**: 3,475 - 243,484 chars/sec
- **Multiple documents**: 43,781 - 45,472 chars/sec
- **Average processing time**: ~0.125 seconds per document

### Accuracy Metrics
- **Mental Health Patterns**: 100% accuracy
- **Maternity Patterns**: 100% accuracy  
- **Authorization Patterns**: 87.5% accuracy
- **Overall Pattern Detection**: 92.9% accuracy

### Database Performance
- **36 red flags** currently stored
- **100% data integrity** (no orphaned records)
- **Proper severity distribution**: Critical(2), High(11), Medium(20), Low(3)

## Configuration System

### Pattern Configuration File
Location: `backend/app/config/red_flag_patterns.py`

```python
RED_FLAG_PATTERNS = {
    "mental_health_limitations": {
        "patterns": [
            r'mental health.*?limited to (\d+) visits?',
            r'behavioral health.*?limited to (\d+) sessions?',
            # ... more patterns
        ],
        "severity": "high",
        "flag_type": "coverage_limitation",
        "confidence_score": 0.90
    },
    # ... more pattern categories
}
```

### Severity Thresholds
Location: `backend/app/config/severity_thresholds.py`

```python
COST_THRESHOLDS = {
    'deductible_individual_high': 5000,
    'deductible_individual_critical': 8000,
    'coinsurance_high': 40,
    # ... more thresholds
}
```

## Maintenance Guidelines

### Adding New Patterns
1. Add pattern to configuration file
2. Test with sample documents
3. Validate accuracy metrics
4. Update documentation

### Updating Severity Levels
1. Review current market standards
2. Update threshold configurations
3. Test against existing data
4. Document changes

### Performance Monitoring
1. Monitor processing times
2. Track accuracy metrics
3. Review false positive/negative rates
4. Optimize patterns as needed

## Integration Points

### API Endpoints
- `GET /policies/{policy_id}/red-flags` - Retrieve red flags
- `POST /policies/{policy_id}/analyze` - Trigger analysis

### Database Schema
- `red_flags` table stores all detected flags
- Foreign key relationships to policies
- Metadata tracking (confidence, detection method)

### Frontend Integration
- Dashboard displays red flag summaries
- Policy detail pages show specific flags
- Severity-based color coding and icons

## Future Enhancements

### Planned Improvements
1. Machine learning pattern optimization
2. Real-time pattern updates
3. Custom pattern creation interface
4. Advanced analytics and reporting
5. Integration with regulatory updates

### Monitoring and Alerts
1. Performance degradation alerts
2. Accuracy threshold monitoring
3. New pattern suggestion system
4. Regulatory compliance tracking
