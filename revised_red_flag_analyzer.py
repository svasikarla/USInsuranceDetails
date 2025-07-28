#!/usr/bin/env python3
"""
Revised Red Flag Analyzer with Duplicate Prevention

This script provides an improved red flag analysis system that:
1. Prevents duplicate red flag detection
2. Uses enhanced pattern matching
3. Provides better severity classification
4. Includes confidence scoring and recommendations
"""

import sys
import os
import re
import uuid
import hashlib
from typing import Dict, List, Any, Set, Optional
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_env_path = os.path.join(os.path.dirname(__file__), 'backend', '.env')
if os.path.exists(load_env_path):
    load_dotenv(load_env_path)

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

class RedFlagAnalyzer:
    """Improved Red Flag Analyzer with duplicate prevention"""
    
    def __init__(self):
        self.detected_flags = set()  # Track detected flags to prevent duplicates
        self.confidence_threshold = 0.70
        
    def analyze_document(self, policy_text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Analyze document and return unique red flags"""
        
        self.detected_flags.clear()  # Reset for new analysis
        red_flags = []
        
        # Enhanced pattern categories
        pattern_categories = [
            self._detect_maternity_waiting_periods,
            self._detect_mental_health_limitations,
            self._detect_preauthorization_requirements,
            self._detect_coverage_exclusions,
            self._detect_network_limitations,
            self._detect_high_cost_sharing,
            self._detect_aca_compliance_issues
        ]
        
        for detect_func in pattern_categories:
            try:
                category_flags = detect_func(policy_text, policy_id)
                for flag in category_flags:
                    if self._is_unique_flag(flag):
                        red_flags.append(flag)
                        self._add_flag_to_tracker(flag)
            except Exception as e:
                print(f"Error in {detect_func.__name__}: {e}")
        
        return red_flags
    
    def _is_unique_flag(self, flag: Dict[str, Any]) -> bool:
        """Check if flag is unique to prevent duplicates"""
        flag_signature = self._generate_flag_signature(flag)
        return flag_signature not in self.detected_flags
    
    def _generate_flag_signature(self, flag: Dict[str, Any]) -> str:
        """Generate unique signature for a flag"""
        signature_data = f"{flag['flag_type']}|{flag['title']}|{flag['severity']}"
        return hashlib.md5(signature_data.encode()).hexdigest()
    
    def _add_flag_to_tracker(self, flag: Dict[str, Any]) -> None:
        """Add flag signature to tracker"""
        signature = self._generate_flag_signature(flag)
        self.detected_flags.add(signature)
    
    def _extract_source_context(self, text: str, start: int, end: int, context_chars: int = 100) -> str:
        """Extract source context around a match"""
        context_start = max(0, start - context_chars)
        context_end = min(len(text), end + context_chars)
        return text[context_start:context_end].strip()
    
    def _detect_maternity_waiting_periods(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect maternity waiting periods with enhanced patterns"""
        flags = []
        
        patterns = [
            r'maternity.*?(\d+)-?month\s+waiting\s+period',
            r'(\d+)-?month\s+waiting\s+period.*?maternity',
            r'maternity.*?covered\s+after\s+(\d+)\s+months?',
            r'(\d+)\s+months?\s+waiting.*?maternity',
            r'maternity.*?waiting\s+period.*?(\d+)\s+months?'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                months = int(match.group(1))
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                # Determine severity based on waiting period length
                if months >= 12:
                    severity = "critical"
                    description = f"This policy has a {months}-month waiting period for maternity care, which is excessive and may violate state insurance laws."
                elif months >= 6:
                    severity = "high"
                    description = f"This policy has a {months}-month waiting period for maternity care, which may delay access to essential reproductive health services."
                else:
                    severity = "medium"
                    description = f"This policy has a {months}-month waiting period for maternity care."
                
                flags.append({
                    'id': str(uuid.uuid4()),
                    'policy_id': policy_id,
                    'flag_type': 'coverage_limitation',
                    'severity': severity,
                    'title': f'Maternity Waiting Period ({months} months)',
                    'description': description,
                    'source_text': source_text,
                    'confidence_score': 0.95,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Consider plans with no maternity waiting periods or shorter waiting periods. Check if state laws limit waiting periods.',
                    'category': 'reproductive_health'
                })
                break  # Only detect once per category
        
        return flags
    
    def _detect_mental_health_limitations(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect mental health visit limitations"""
        flags = []
        
        patterns = [
            r'mental health.*?limited to (\d+) visits?',
            r'mental health.*?(\d+) visits? per year',
            r'behavioral health.*?limited to (\d+) sessions?',
            r'therapy.*?limited to (\d+) visits?',
            r'psychiatric.*?limited to (\d+) visits?',
            r'counseling.*?limited to (\d+) sessions?'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                visits = int(match.group(1))
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                flags.append({
                    'id': str(uuid.uuid4()),
                    'policy_id': policy_id,
                    'flag_type': 'coverage_limitation',
                    'severity': 'high',
                    'title': f'Mental Health Visit Limit ({visits} visits/year)',
                    'description': f'This policy limits mental health services to {visits} visits per year, which may violate federal mental health parity laws and restrict access to necessary care.',
                    'source_text': source_text,
                    'confidence_score': 0.90,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Mental health visit limitations may violate federal parity laws. Consider plans with unlimited mental health coverage.',
                    'category': 'mental_health'
                })
                break
        
        return flags
    
    def _detect_preauthorization_requirements(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect pre-authorization requirements"""
        flags = []
        
        patterns = [
            r'(pre-?authorization|prior authorization).*?required',
            r'require.*?(pre-?authorization|prior authorization)',
            r'out-?of-?network.*?authorization',
            r'specialist.*?authorization',
            r'prior approval.*?required'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                # Determine specific type
                match_text = match.group().lower()
                if 'out-of-network' in match_text:
                    title = "Out-of-Network Pre-authorization Required"
                    description = "This policy requires pre-authorization for out-of-network services, which may delay care and result in denials."
                elif 'specialist' in match_text:
                    title = "Specialist Pre-authorization Required"
                    description = "This policy requires pre-authorization for specialist visits, which may delay access to specialized care."
                else:
                    title = "Pre-authorization Required"
                    description = "This policy requires pre-authorization for certain services, which may delay care and result in coverage denials."
                
                flags.append({
                    'id': str(uuid.uuid4()),
                    'policy_id': policy_id,
                    'flag_type': 'preauth_required',
                    'severity': 'medium',
                    'title': title,
                    'description': description,
                    'source_text': source_text,
                    'confidence_score': 0.85,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Understand the pre-authorization process and allow extra time for approvals. Keep documentation of all requests.',
                    'category': 'administrative_burden'
                })
                break
        
        return flags
    
    def _detect_coverage_exclusions(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect coverage exclusions with proper categorization"""
        flags = []
        
        exclusion_patterns = {
            'cosmetic': {
                'patterns': [r'cosmetic.*?(excluded|not covered)', r'cosmetic procedures'],
                'severity': 'low',
                'category': 'elective_services'
            },
            'infertility': {
                'patterns': [r'infertility.*?(excluded|not covered)', r'infertility treatment'],
                'severity': 'medium',
                'category': 'reproductive_health'
            },
            'fertility': {
                'patterns': [r'fertility.*?(excluded|not covered)', r'fertility treatment'],
                'severity': 'medium',
                'category': 'reproductive_health'
            },
            'experimental': {
                'patterns': [r'experimental.*?(excluded|not covered)', r'experimental treatments'],
                'severity': 'medium',
                'category': 'innovative_care'
            }
        }
        
        for exclusion_type, config in exclusion_patterns.items():
            for pattern in config['patterns']:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    source_text = self._extract_source_context(text, match.start(), match.end())
                    
                    flags.append({
                        'id': str(uuid.uuid4()),
                        'policy_id': policy_id,
                        'flag_type': 'exclusion',
                        'severity': config['severity'],
                        'title': f'{exclusion_type.title()} Treatment Exclusion',
                        'description': f'This policy excludes {exclusion_type} treatment, which means these services will not be covered.',
                        'source_text': source_text,
                        'confidence_score': 0.85,
                        'detected_by': 'pattern_enhanced',
                        'recommendation': f'If you need {exclusion_type} services, look for plans that cover these treatments.',
                        'category': config['category']
                    })
                    break  # Only detect once per exclusion type
        
        return flags
    
    def _detect_network_limitations(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect network limitations"""
        flags = []
        
        patterns = [
            r'out-?of-?network.*?(denied|not covered)',
            r'out-?of-?network.*?higher cost',
            r'narrow network',
            r'limited network'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                flags.append({
                    'id': str(uuid.uuid4()),
                    'policy_id': policy_id,
                    'flag_type': 'network_limitation',
                    'severity': 'high',
                    'title': 'Out-of-Network Services Limited',
                    'description': 'This policy has significant limitations on out-of-network services, which may result in high out-of-pocket costs or denied claims.',
                    'source_text': source_text,
                    'confidence_score': 0.85,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Verify that your preferred doctors and hospitals are in-network before enrolling.',
                    'category': 'provider_access'
                })
                break
        
        return flags
    
    def _detect_high_cost_sharing(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect high cost-sharing requirements"""
        flags = []
        
        # Extract cost information
        deductible_match = re.search(r'deductible.*?\$(\d+,?\d*)', text, re.IGNORECASE)
        copay_match = re.search(r'copay.*?\$(\d+)', text, re.IGNORECASE)
        coinsurance_match = re.search(r'coinsurance.*?(\d+)%', text, re.IGNORECASE)
        
        if deductible_match:
            deductible = int(deductible_match.group(1).replace(',', ''))
            if deductible >= 5000:
                severity = "high" if deductible < 8000 else "critical"
                source_text = self._extract_source_context(text, deductible_match.start(), deductible_match.end())
                
                flags.append({
                    'id': str(uuid.uuid4()),
                    'policy_id': policy_id,
                    'flag_type': 'high_cost',
                    'severity': severity,
                    'title': f'High Deductible (${deductible:,})',
                    'description': f'This policy has a high annual deductible of ${deductible:,}, which means you must pay this amount before insurance coverage begins.',
                    'source_text': source_text,
                    'confidence_score': 0.90,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Consider if you can afford the high deductible. Look into Health Savings Account (HSA) options if available.',
                    'category': 'cost_sharing'
                })
        
        return flags
    
    def _detect_aca_compliance_issues(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect ACA compliance issues"""
        flags = []
        
        patterns = [
            r'short-?term.*plan',
            r'not.*aca.*compliant',
            r'pre-?existing.*excluded',
            r'annual.*benefit.*limit'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                flags.append({
                    'id': str(uuid.uuid4()),
                    'policy_id': policy_id,
                    'flag_type': 'coverage_limitation',
                    'severity': 'critical',
                    'title': 'ACA Non-Compliance',
                    'description': 'This policy may not comply with Affordable Care Act requirements, which means it may lack essential health benefits and consumer protections.',
                    'source_text': source_text,
                    'confidence_score': 0.95,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Consider ACA-compliant plans that provide comprehensive coverage and consumer protections.',
                    'category': 'regulatory_compliance'
                })
                break
        
        return flags

def analyze_sample_document():
    """Analyze the sample document from Supabase"""
    
    # Sample document text from Supabase
    sample_text = """Sample Employer-Provided Health Insurance Policy
Provider: HealthSecure Inc.
Policy Name: GoldCare Employee Plan
Policy Type: Employer-Provided Group Health Insurance
Coverage Start Date: 01-Jan-2025
Coverage End Date: 31-Dec-2025
-------------------------------------------
Coverage Summary:
- Annual Premium: $5,000 per employee
- Annual Deductible: $1,500
- Out-of-Pocket Maximum: $7,000
- Coinsurance: 20% after deductible
-------------------------------------------
Key Benefits:
- Inpatient Hospitalization: Covered at 80%
- Outpatient Services: Covered at 80%
- Emergency Room: $250 copay per visit
- Prescription Drugs: Tiered copays ($10/$30/$50)
- Maternity Care: Covered after 12-month waiting period
- Mental Health Services: Limited to 10 visits per year
-------------------------------------------
Exclusions & Limitations:
- Cosmetic procedures
- Infertility treatment
- Experimental treatments
- Out-of-network services may be denied or subject to higher cost-sharing
-------------------------------------------
Important Notes (Fine Print):
- 12-month waiting period applies for maternity care.
- Out-of-network services require prior authorization.
- Mental health coverage is limited to 10 visits per year.
- Coverage subject to change based on employer contract renewal.
For full policy details, please refer to the official plan document."""
    
    policy_id = "7b475300-c75b-4693-afd8-fc49171e7b82"
    
    analyzer = RedFlagAnalyzer()
    red_flags = analyzer.analyze_document(sample_text, policy_id)
    
    print("🔍 Revised Red Flag Analysis Results")
    print("=" * 80)
    print(f"Document: GoldCare Employee Plan")
    print(f"Total Red Flags Detected: {len(red_flags)}")
    print()
    
    # Group by severity
    severity_groups = {}
    for flag in red_flags:
        severity = flag['severity']
        if severity not in severity_groups:
            severity_groups[severity] = []
        severity_groups[severity].append(flag)
    
    # Display by severity
    severity_order = ['critical', 'high', 'medium', 'low']
    for severity in severity_order:
        if severity in severity_groups:
            flags = severity_groups[severity]
            print(f"🚨 {severity.upper()} SEVERITY ({len(flags)} flags)")
            print("-" * 60)
            
            for i, flag in enumerate(flags, 1):
                print(f"{i}. {flag['title']}")
                print(f"   Category: {flag['category']}")
                print(f"   Description: {flag['description']}")
                print(f"   Recommendation: {flag['recommendation']}")
                print(f"   Confidence: {flag['confidence_score']:.0%}")
                print()
    
    return red_flags

if __name__ == "__main__":
    red_flags = analyze_sample_document()
