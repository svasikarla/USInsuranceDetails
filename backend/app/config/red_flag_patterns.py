"""
Red Flag Pattern Configuration

This module contains all red flag detection patterns, severity classifications,
and configuration settings for the pattern-based detection system.
"""

from typing import Dict, List, Any
from enum import Enum

class Severity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FlagType(Enum):
    PREAUTH_REQUIRED = "preauth_required"
    COVERAGE_LIMITATION = "coverage_limitation"
    EXCLUSION = "exclusion"
    NETWORK_LIMITATION = "network_limitation"
    HIGH_COST = "high_cost"

class DetectionMethod(Enum):
    PATTERN_ENHANCED = "pattern_enhanced"
    AI_ANALYSIS = "ai_analysis"
    MANUAL = "manual"
    SYSTEM = "system"

# Cost-sharing thresholds for severity classification
COST_THRESHOLDS = {
    'deductible_individual_high': 5000,
    'deductible_individual_critical': 8000,
    'deductible_family_high': 10000,
    'deductible_family_critical': 16000,
    'copay_primary_high': 50,
    'copay_specialist_high': 80,
    'copay_er_high': 500,
    'coinsurance_high': 40,
    'oop_max_individual_high': 9000,
    'oop_max_family_high': 18000,
}

# Pre-authorization patterns
PREAUTH_PATTERNS = {
    "patterns": [
        # Standard authorization patterns
        r'(pre-?authorization|prior authorization|pre-?auth|prior auth).*?required',
        r'require[sd]?\s+(pre-?authorization|prior authorization|pre-?auth|prior auth)',
        r'authorization\s+required',
        r'requires?\s+authorization',
        r'must\s+obtain\s+authorization',
        r'authorization\s+must\s+be\s+obtained',
        
        # Additional authorization patterns
        r'prior approval.*?required',
        r'pre-?approval.*?required',
        r'requires?\s+prior\s+approval',
        r'requires?\s+pre-?approval',
        r'approval.*?required.*?before',
        r'must\s+be\s+approved\s+in\s+advance',
        r'advance\s+approval\s+required',
        r'pre-?certification.*?required',
        r'requires?\s+pre-?certification',
        
        # Out-of-network specific authorization
        r'out-?of-?network.*?authorization',
        r'out-?of-?network.*?approval',
        r'out-?of-?network.*?pre-?auth',
        r'authorization.*?out-?of-?network',
        r'approval.*?out-?of-?network',
        
        # Service-specific authorization
        r'specialist.*?authorization',
        r'specialist.*?approval',
        r'imaging.*?authorization',
        r'surgery.*?authorization',
        r'procedure.*?authorization'
    ],
    "severity": Severity.MEDIUM,
    "flag_type": FlagType.PREAUTH_REQUIRED,
    "confidence_score": 0.85,
    "detection_method": DetectionMethod.PATTERN_ENHANCED
}

# Mental health visit limitation patterns
MENTAL_HEALTH_PATTERNS = {
    "patterns": [
        r'mental health.*?limited to (\d+) visits?',
        r'behavioral health.*?limited to (\d+) sessions?',
        r'therapy.*?limited to (\d+) visits?',
        r'therapy.*?restricted to (\d+) sessions?',
        r'psychiatric.*?limited to (\d+) visits?',
        r'counseling.*?limited to (\d+) sessions?',
        r'mental health.*?maximum (\d+) visits?',
        r'behavioral health.*?maximum (\d+) sessions?',
        r'therapy.*?maximum (\d+) visits?',
        r'mental health.*?(\d+) visits? per year',
        r'behavioral health.*?(\d+) sessions? annually',
        r'therapy.*?(\d+) sessions? per year',
        r'mental health.*?no more than (\d+) visits?',
        r'therapy.*?up to (\d+) sessions?',
        r'(\d+) mental health visits?',
        r'(\d+) therapy sessions?',
        r'(\d+) counseling sessions?'
    ],
    "severity": Severity.HIGH,
    "flag_type": FlagType.COVERAGE_LIMITATION,
    "confidence_score": 0.90,
    "detection_method": DetectionMethod.PATTERN_ENHANCED
}

# Waiting period patterns
WAITING_PERIOD_PATTERNS = {
    "patterns": [
        # Standard month-based patterns
        r'(\d+)-?month\s+waiting\s+period',
        r'waiting\s+period\s+of\s+(\d+)\s+months?',
        r'(\d+)\s+month[s]?\s+wait(?:ing)?',
        r'must\s+wait\s+(\d+)\s+months?',
        r'coverage\s+begins\s+after\s+(\d+)\s+months?',
        r'(\d+)\s+months?\s+before\s+coverage',
        r'effective\s+after\s+(\d+)\s+months?',

        # Day-based patterns (convert to months for consistency)
        r'(\d+)-?day\s+waiting\s+period',
        r'waiting\s+period\s+of\s+(\d+)\s+days?',
        r'(\d+)\s+days?\s+wait(?:ing)?',
        r'must\s+wait\s+(\d+)\s+days?',
        r'coverage\s+begins\s+after\s+(\d+)\s+days?',
        r'after\s+(\d+)\s+days?\s+of\s+employment',
        r'(\d+)\s+days?\s+after\s+enrollment',

        # Eligibility-specific patterns
        r'eligible\s+after\s+(\d+)\s+months?',
        r'eligibility\s+begins\s+after\s+(\d+)\s+months?',
        r'(\d+)\s+months?\s+of\s+employment\s+required',
        r'(\d+)\s+months?\s+before\s+eligible',

        # Benefit-specific waiting periods
        r'(\d+)\s+months?\s+waiting\s+period\s+for',
        r'(\d+)\s+months?\s+wait\s+for',
        r'no\s+coverage\s+for\s+(\d+)\s+months?',
        r'excluded\s+for\s+(\d+)\s+months?',
    ],
    "severity": Severity.HIGH,  # Default severity
    "severity_rules": {
        "maternity": {
            "12_plus_months": Severity.CRITICAL,
            "less_than_12": Severity.HIGH
        },
        "mental_health": Severity.HIGH,
        "preexisting": Severity.HIGH,
        "general": Severity.MEDIUM
    },
    "flag_type": FlagType.COVERAGE_LIMITATION,
    "confidence_score": 0.85,
    "detection_method": DetectionMethod.PATTERN_ENHANCED
}

# Network limitation patterns
NETWORK_LIMITATION_PATTERNS = {
    "patterns": [
        # Narrow network indicators
        r'narrow\s+network',
        r'limited\s+network',
        r'restricted\s+network',
        r'small\s+network',
        
        # Out-of-network penalties
        r'out-?of-?network.*not\s+covered',
        r'out-?of-?network.*(\d+)%\s+coinsurance',
        r'balance\s+billing',
        r'out-?of-?network.*full\s+charges',
        
        # Referral requirements
        r'referral.*required',
        r'specialist.*referral\s+required',
        r'primary\s+care.*approval',
        
        # Network restrictions
        r'in-?network\s+only',
        r'network\s+providers\s+only',
        r'must\s+use\s+network\s+providers'
    ],
    "severity": Severity.HIGH,
    "flag_type": FlagType.NETWORK_LIMITATION,
    "confidence_score": 0.85,
    "detection_method": DetectionMethod.PATTERN_ENHANCED
}

# Coverage exclusion patterns
COVERAGE_EXCLUSION_PATTERNS = {
    "patterns": [
        # Essential health benefit exclusions (high severity)
        r'mental health.*?(excluded|not covered)',
        r'maternity.*?(excluded|not covered)',
        r'prescription.*?(excluded|not covered)',
        r'emergency.*?(excluded|not covered)',
        r'preventive.*?(excluded|not covered)',

        # Other exclusions (medium severity)
        r'experimental.*?(excluded|not covered)',
        r'investigational.*?(excluded|not covered)',
        r'infertility.*?(excluded|not covered)',
        r'fertility.*?(excluded|not covered)',

        # Low priority exclusions (low severity)
        r'cosmetic.*?(excluded|not covered)',
        r'elective.*?(excluded|not covered)'
    ],
    "severity": Severity.MEDIUM,  # Default severity
    "severity_rules": {
        "essential_benefits": Severity.HIGH,
        "other_exclusions": Severity.MEDIUM,
        "cosmetic": Severity.LOW
    },
    "flag_type": FlagType.EXCLUSION,
    "confidence_score": 0.85,
    "detection_method": DetectionMethod.PATTERN_ENHANCED
}

# ACA compliance patterns
ACA_COMPLIANCE_PATTERNS = {
    "patterns": [
        r'short-?term.*medical\s+plan',
        r'not\s+aca.*compliant',
        r'non-?aca.*compliant',
        r'pre-?existing.*excluded',
        r'annual.*benefit.*limit',
        r'lifetime.*benefit.*limit',
        r'essential\s+health\s+benefits.*not.*covered',
        r'grandfathered\s+plan',
        r'mini-?med\s+plan'
    ],
    "severity": Severity.CRITICAL,
    "flag_type": FlagType.COVERAGE_LIMITATION,
    "confidence_score": 0.95,
    "detection_method": DetectionMethod.PATTERN_ENHANCED
}

# Master pattern configuration
RED_FLAG_PATTERNS = {
    "preauthorization": PREAUTH_PATTERNS,
    "mental_health_limitations": MENTAL_HEALTH_PATTERNS,
    "waiting_periods": WAITING_PERIOD_PATTERNS,
    "network_limitations": NETWORK_LIMITATION_PATTERNS,
    "coverage_exclusions": COVERAGE_EXCLUSION_PATTERNS,
    "aca_compliance": ACA_COMPLIANCE_PATTERNS
}

# Pattern processing configuration
PATTERN_CONFIG = {
    "case_sensitive": False,
    "multiline": True,
    "max_context_chars": 200,
    "min_confidence_threshold": 0.70,
    "enable_source_text_capture": True,
    "enable_recommendations": True
}

def get_pattern_config(pattern_name: str) -> Dict[str, Any]:
    """Get configuration for a specific pattern type"""
    return RED_FLAG_PATTERNS.get(pattern_name, {})

def get_all_patterns() -> Dict[str, Any]:
    """Get all pattern configurations"""
    return RED_FLAG_PATTERNS

def get_cost_thresholds() -> Dict[str, int]:
    """Get cost-sharing thresholds"""
    return COST_THRESHOLDS

def get_severity_order() -> Dict[str, int]:
    """Get severity ordering for prioritization"""
    return {
        Severity.CRITICAL.value: 4,
        Severity.HIGH.value: 3,
        Severity.MEDIUM.value: 2,
        Severity.LOW.value: 1
    }

def validate_pattern_config(pattern_config: Dict[str, Any]) -> bool:
    """Validate pattern configuration structure"""
    required_fields = ['patterns', 'severity', 'flag_type', 'confidence_score']
    return all(field in pattern_config for field in required_fields)

def add_custom_pattern(name: str, pattern_config: Dict[str, Any]) -> bool:
    """Add a custom pattern configuration"""
    if validate_pattern_config(pattern_config):
        RED_FLAG_PATTERNS[name] = pattern_config
        return True
    return False

def update_pattern_severity(pattern_name: str, new_severity: Severity) -> bool:
    """Update severity for a pattern"""
    if pattern_name in RED_FLAG_PATTERNS:
        RED_FLAG_PATTERNS[pattern_name]['severity'] = new_severity
        return True
    return False

def get_patterns_by_severity(severity: Severity) -> Dict[str, Any]:
    """Get all patterns with specified severity"""
    return {
        name: config for name, config in RED_FLAG_PATTERNS.items()
        if config.get('severity') == severity
    }
