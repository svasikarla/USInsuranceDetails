"""
Enhanced Red Flag Service with Duplicate Prevention

This service provides improved red flag detection with:
1. Duplicate prevention using flag signatures
2. Enhanced pattern matching
3. Better severity classification
4. Confidence scoring and recommendations
5. Category-based organization
"""

import re
import uuid
import hashlib
from typing import Dict, List, Any, Set, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from ..models.red_flag import RedFlag
from ..models.policy import InsurancePolicy
from ..models.document import PolicyDocument

class EnhancedRedFlagService:
    """Enhanced Red Flag Service with duplicate prevention"""
    
    def __init__(self):
        self.confidence_threshold = 0.70
        
    def analyze_policy_with_duplicate_prevention(
        self, 
        db: Session, 
        policy: InsurancePolicy, 
        document: PolicyDocument
    ) -> List[RedFlag]:
        """Analyze policy and create red flags with duplicate prevention"""
        
        if not document.extracted_text:
            return []
        
        # Clear existing red flags for this policy to prevent duplicates
        self._clear_existing_red_flags(db, policy.id)
        
        # Analyze document
        detected_flags = self._analyze_document_enhanced(
            document.extracted_text, 
            str(policy.id)
        )
        
        # Create red flag records
        created_flags = []
        for flag_data in detected_flags:
            red_flag = self._create_red_flag_record(db, flag_data)
            if red_flag:
                created_flags.append(red_flag)
        
        db.commit()
        return created_flags
    
    def _clear_existing_red_flags(self, db: Session, policy_id: uuid.UUID) -> None:
        """Clear existing red flags for a policy to prevent duplicates"""
        db.query(RedFlag).filter(RedFlag.policy_id == policy_id).delete()
        db.flush()
    
    def _create_red_flag_record(self, db: Session, flag_data: Dict[str, Any]) -> Optional[RedFlag]:
        """Create a red flag database record"""
        try:
            red_flag = RedFlag(
                id=uuid.uuid4(),
                policy_id=uuid.UUID(flag_data['policy_id']),
                flag_type=flag_data['flag_type'],
                severity=flag_data['severity'],
                title=flag_data['title'],
                description=flag_data['description'],
                source_text=flag_data.get('source_text', ''),
                confidence_score=flag_data.get('confidence_score', 0.8),
                detected_by=flag_data.get('detected_by', 'pattern_enhanced'),
                recommendation=flag_data.get('recommendation', ''),
                created_at=datetime.utcnow(),
                # Optional categorization fields
                regulatory_level=flag_data.get('regulatory_level'),
                prominent_category=flag_data.get('prominent_category'),
                federal_regulation=flag_data.get('federal_regulation'),
                state_regulation=flag_data.get('state_regulation'),
                state_code=flag_data.get('state_code'),
                regulatory_context=flag_data.get('regulatory_context'),
                risk_level=flag_data.get('risk_level'),
            )

            # Auto-categorize if missing
            if not red_flag.regulatory_level or not red_flag.prominent_category:
                try:
                    from app.services.categorization_service import categorization_service
                    cat = categorization_service.categorize_red_flag(red_flag)
                    for key, value in cat.items():
                        setattr(red_flag, key, value)
                except Exception:
                    pass

            db.add(red_flag)
            db.flush()
            return red_flag
            
        except Exception as e:
            print(f"Error creating red flag record: {e}")
            return None
    
    def _analyze_document_enhanced(self, policy_text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Enhanced document analysis with duplicate prevention"""
        
        detected_flags = []
        flag_signatures = set()  # Track signatures to prevent duplicates
        
        # Enhanced pattern categories
        pattern_categories = [
            self._detect_maternity_waiting_periods,
            self._detect_mental_health_limitations,
            self._detect_preauthorization_requirements,
            self._detect_coverage_exclusions,
            self._detect_network_limitations,
            self._detect_high_cost_sharing,
            self._detect_aca_compliance_issues,
            self._detect_appeal_burdens
        ]
        
        for detect_func in pattern_categories:
            try:
                category_flags = detect_func(policy_text, policy_id)
                for flag in category_flags:
                    signature = self._generate_flag_signature(flag)
                    if signature not in flag_signatures:
                        detected_flags.append(flag)
                        flag_signatures.add(signature)
            except Exception as e:
                print(f"Error in {detect_func.__name__}: {e}")
        
        return detected_flags
    
    def _generate_flag_signature(self, flag: Dict[str, Any]) -> str:
        """Generate unique signature for a flag to prevent duplicates"""
        signature_data = f"{flag['flag_type']}|{flag['title']}|{flag['severity']}"
        return hashlib.md5(signature_data.encode()).hexdigest()
    
    def _extract_source_context(self, text: str, start: int, end: int, context_chars: int = 100) -> str:
        """Extract source context around a match"""
        context_start = max(0, start - context_chars)
        context_end = min(len(text), end + context_chars)
        return text[context_start:context_end].strip()
    
    def _detect_maternity_waiting_periods(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect maternity waiting periods"""
        flags = []
        
        patterns = [
            r'maternity.*?(\d+)-?month\s+waiting\s+period',
            r'(\d+)-?month\s+waiting\s+period.*?maternity',
            r'maternity.*?covered\s+after\s+(\d+)\s+months?',
            r'(\d+)\s+months?\s+waiting.*?maternity'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                months = int(match.group(1))
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                # Enhanced severity classification
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
                    'policy_id': policy_id,
                    'flag_type': 'coverage_limitation',
                    'severity': severity,
                    'title': f'Maternity Waiting Period ({months} months)',
                    'description': description,
                    'source_text': source_text,
                    'confidence_score': 0.95,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Consider plans with no maternity waiting periods. Check if state laws limit waiting periods.',
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
            r'therapy.*?limited to (\d+) visits?'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                visits = int(match.group(1))
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                flags.append({
                    'policy_id': policy_id,
                    'flag_type': 'coverage_limitation',
                    'severity': 'high',
                    'title': f'Mental Health Visit Limit ({visits} visits/year)',
                    'description': f'This policy limits mental health services to {visits} visits per year, which may violate federal mental health parity laws.',
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
            r'out-?of-?network.*?authorization',
            r'specialist.*?authorization'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                match_text = match.group().lower()
                if 'out-of-network' in match_text:
                    title = "Out-of-Network Pre-authorization Required"
                    description = "This policy requires pre-authorization for out-of-network services, which may delay care."
                else:
                    title = "Pre-authorization Required"
                    description = "This policy requires pre-authorization for certain services, which may delay care."
                
                flags.append({
                    'policy_id': policy_id,
                    'flag_type': 'preauth_required',
                    'severity': 'medium',
                    'title': title,
                    'description': description,
                    'source_text': source_text,
                    'confidence_score': 0.85,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Understand the pre-authorization process and allow extra time for approvals.',
                    'category': 'administrative_burden'
                })
                break
        
        return flags
    
    def _detect_coverage_exclusions(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect coverage exclusions"""
        flags = []
        
        exclusion_patterns = {
            'cosmetic': {'severity': 'low', 'patterns': [r'cosmetic.*?(excluded|procedures)']},
            'infertility': {'severity': 'medium', 'patterns': [r'infertility.*?(excluded|treatment)']},
            'experimental': {'severity': 'medium', 'patterns': [r'experimental.*?(excluded|treatments)']}
        }
        
        for exclusion_type, config in exclusion_patterns.items():
            for pattern in config['patterns']:
                matches = re.finditer(pattern, text, re.IGNORECASE)
                for match in matches:
                    source_text = self._extract_source_context(text, match.start(), match.end())
                    
                    flags.append({
                        'policy_id': policy_id,
                        'flag_type': 'exclusion',
                        'severity': config['severity'],
                        'title': f'{exclusion_type.title()} Treatment Exclusion',
                        'description': f'This policy excludes {exclusion_type} treatment, which means these services will not be covered.',
                        'source_text': source_text,
                        'confidence_score': 0.85,
                        'detected_by': 'pattern_enhanced',
                        'recommendation': f'If you need {exclusion_type} services, look for plans that cover these treatments.',
                        'category': 'coverage_exclusions'
                    })
                    break
        
        return flags
    
    def _detect_network_limitations(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect network limitations"""
        flags = []
        
        patterns = [
            r'out-?of-?network.*?(denied|not covered|higher cost)',
            r'narrow network',
            r'limited network'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                flags.append({
                    'policy_id': policy_id,
                    'flag_type': 'network_limitation',
                    'severity': 'high',
                    'title': 'Out-of-Network Services Limited',
                    'description': 'This policy has significant limitations on out-of-network services, which may result in high costs.',
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
        
        deductible_match = re.search(r'deductible.*?\$(\d+,?\d*)', text, re.IGNORECASE)
        if deductible_match:
            deductible = int(deductible_match.group(1).replace(',', ''))
            if deductible >= 5000:
                severity = "high" if deductible < 8000 else "critical"
                source_text = self._extract_source_context(text, deductible_match.start(), deductible_match.end())
                
                flags.append({
                    'policy_id': policy_id,
                    'flag_type': 'high_cost',
                    'severity': severity,
                    'title': f'High Deductible (${deductible:,})',
                    'description': f'This policy has a high annual deductible of ${deductible:,}.',
                    'source_text': source_text,
                    'confidence_score': 0.90,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Consider if you can afford the high deductible. Look into HSA options if available.',
                    'category': 'cost_sharing'
                })
        
        return flags
    
    def _detect_aca_compliance_issues(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect ACA compliance issues"""
        flags = []
        
        patterns = [
            r'short-?term.*plan',
            r'not.*aca.*compliant',
            r'pre-?existing.*excluded'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                flags.append({
                    'policy_id': policy_id,
                    'flag_type': 'coverage_limitation',
                    'severity': 'critical',
                    'title': 'ACA Non-Compliance',
                    'description': 'This policy may not comply with ACA requirements, lacking essential health benefits.',
                    'source_text': source_text,
                    'confidence_score': 0.95,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Consider ACA-compliant plans that provide comprehensive coverage.',
                    'category': 'regulatory_compliance'
                })
                break
        
        return flags
    
    def _detect_appeal_burdens(self, text: str, policy_id: str) -> List[Dict[str, Any]]:
        """Detect excessive appeal requirements"""
        flags = []
        
        patterns = [
            r'appeal.*(\d+)\s+days?',
            r'(\d+)\s+levels?\s+of\s+appeals?',
            r'appeal.*notarized'
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                source_text = self._extract_source_context(text, match.start(), match.end())
                
                flags.append({
                    'policy_id': policy_id,
                    'flag_type': 'coverage_limitation',
                    'severity': 'medium',
                    'title': 'Excessive Appeal Requirements',
                    'description': 'This policy has burdensome appeal requirements that may discourage legitimate appeals.',
                    'source_text': source_text,
                    'confidence_score': 0.75,
                    'detected_by': 'pattern_enhanced',
                    'recommendation': 'Understand the appeal process and keep detailed documentation.',
                    'category': 'administrative_burden'
                })
                break
        
        return flags

# Global service instance
enhanced_red_flag_service = EnhancedRedFlagService()
