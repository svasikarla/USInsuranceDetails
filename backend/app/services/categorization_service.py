"""
Categorization Service for Benefits and Red Flags

This service provides automatic categorization of benefits and red flags
based on regulatory framework and prominent categories.
"""

import logging
import re
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models import CoverageBenefit, RedFlag
from app.schemas.categorization import (
    RegulatoryLevel, ProminentCategory, FederalRegulation, 
    StateRegulation, RiskLevel
)

logger = logging.getLogger(__name__)


class CategorizationService:
    """Service for automatic categorization of benefits and red flags"""
    
    def __init__(self):
        self.benefit_patterns = self._load_benefit_patterns()
        self.red_flag_patterns = self._load_red_flag_patterns()
    
    def _load_benefit_patterns(self) -> Dict:
        """Load benefit categorization patterns"""
        return {
            # Federal ACA Essential Health Benefits
            'aca_ehb': {
                'patterns': [
                    r'ambulatory.*patient.*services?',
                    r'emergency.*services?',
                    r'hospitalization',
                    r'maternity.*newborn.*care',
                    r'mental.*health.*substance.*use',
                    r'prescription.*drugs?',
                    r'rehabilitative.*services?',
                    r'laboratory.*services?',
                    r'pediatric.*services?'
                ],
                'regulatory_level': 'federal',
                'prominent_category': 'coverage_access',
                'federal_regulation': 'aca_ehb'
            },
            
            # Preventive Care
            'preventive_care': {
                'patterns': [
                    r'preventive.*care',
                    r'wellness.*visit',
                    r'annual.*physical',
                    r'screening',
                    r'immunization',
                    r'vaccination'
                ],
                'regulatory_level': 'federal',
                'prominent_category': 'coverage_access',
                'federal_regulation': 'preventive_care'
            },
            
            # Mental Health Parity
            'mental_health': {
                'patterns': [
                    r'mental.*health',
                    r'behavioral.*health',
                    r'substance.*abuse',
                    r'addiction.*treatment',
                    r'therapy.*session',
                    r'counseling'
                ],
                'regulatory_level': 'federal',
                'prominent_category': 'special_populations',
                'federal_regulation': 'mental_health_parity'
            },
            
            # State Mandated Benefits
            'state_mandated': {
                'patterns': [
                    r'state.*mandated',
                    r'fertility.*treatment',
                    r'autism.*coverage',
                    r'chiropractic.*care',
                    r'acupuncture'
                ],
                'regulatory_level': 'state',
                'prominent_category': 'coverage_access',
                'state_regulation': 'state_mandated_benefits'
            }
        }
    
    def _load_red_flag_patterns(self) -> Dict:
        """Load red flag categorization patterns"""
        return {
            # Federal Violations - High Risk
            'aca_violations': {
                'patterns': [
                    r'excludes.*maternity',
                    r'no.*maternity.*coverage',
                    r'mental.*health.*limit',
                    r'substance.*abuse.*exclusion',
                    r'missing.*essential.*health.*benefit'
                ],
                'regulatory_level': 'federal',
                'prominent_category': 'special_populations',
                'federal_regulation': 'aca_ehb',
                'risk_level': 'high'
            },
            
            # Prior Authorization Issues
            'prior_auth': {
                'patterns': [
                    r'prior.*authorization.*required',
                    r'pre.*approval.*needed',
                    r'must.*obtain.*approval',
                    r'authorization.*before.*treatment'
                ],
                'regulatory_level': 'federal_state',
                'prominent_category': 'process_administrative',
                'risk_level': 'medium'
            },
            
            # Network Restrictions
            'network_issues': {
                'patterns': [
                    r'out.*of.*network.*not.*covered',
                    r'network.*restriction',
                    r'limited.*provider.*network',
                    r'narrow.*network'
                ],
                'regulatory_level': 'federal_state',
                'prominent_category': 'coverage_access',
                'risk_level': 'medium'
            },
            
            # Cost-Sharing Issues
            'cost_sharing': {
                'patterns': [
                    r'high.*deductible',
                    r'excessive.*copay',
                    r'high.*coinsurance',
                    r'out.*of.*pocket.*maximum.*exceeded'
                ],
                'regulatory_level': 'federal_state',
                'prominent_category': 'cost_financial',
                'risk_level': 'medium'
            },
            
            # Treatment Exclusions
            'exclusions': {
                'patterns': [
                    r'treatment.*excluded',
                    r'not.*covered',
                    r'experimental.*procedure.*excluded',
                    r'cosmetic.*surgery.*excluded'
                ],
                'regulatory_level': 'federal_state',
                'prominent_category': 'medical_necessity_exclusions',
                'risk_level': 'medium'
            },
            
            # Waiting Periods
            'waiting_periods': {
                'patterns': [
                    r'(\d+).*month.*waiting.*period',
                    r'waiting.*period.*applies',
                    r'coverage.*begins.*after.*(\d+).*months'
                ],
                'regulatory_level': 'federal_state',
                'prominent_category': 'process_administrative',
                'risk_level': 'medium'
            }
        }
    
    def categorize_benefit(self, benefit: CoverageBenefit, state_code: Optional[str] = None) -> Dict:
        """Automatically categorize a benefit"""
        text_to_analyze = f"{benefit.benefit_category} {benefit.benefit_name} {benefit.notes or ''}"
        
        for category_key, category_info in self.benefit_patterns.items():
            for pattern in category_info['patterns']:
                if re.search(pattern, text_to_analyze, re.IGNORECASE):
                    return {
                        'regulatory_level': category_info['regulatory_level'],
                        'prominent_category': category_info['prominent_category'],
                        'federal_regulation': category_info.get('federal_regulation'),
                        'state_regulation': category_info.get('state_regulation'),
                        'state_code': state_code if category_info['regulatory_level'] in ['state', 'federal_state'] else None,
                        'regulatory_context': self._get_regulatory_context(category_info, benefit.benefit_name)
                    }
        
        # Default categorization if no pattern matches
        return {
            'regulatory_level': 'federal_state',
            'prominent_category': 'coverage_access',
            'regulatory_context': 'General insurance benefit - regulatory classification pending review'
        }
    
    def categorize_red_flag(self, red_flag: RedFlag, state_code: Optional[str] = None) -> Dict:
        """Automatically categorize a red flag"""
        text_to_analyze = f"{red_flag.title} {red_flag.description} {red_flag.source_text or ''}"
        
        for category_key, category_info in self.red_flag_patterns.items():
            for pattern in category_info['patterns']:
                if re.search(pattern, text_to_analyze, re.IGNORECASE):
                    return {
                        'regulatory_level': category_info['regulatory_level'],
                        'prominent_category': category_info['prominent_category'],
                        'federal_regulation': category_info.get('federal_regulation'),
                        'state_regulation': category_info.get('state_regulation'),
                        'state_code': state_code if category_info['regulatory_level'] in ['state', 'federal_state'] else None,
                        'regulatory_context': self._get_regulatory_context(category_info, red_flag.title),
                        'risk_level': category_info.get('risk_level', 'medium')
                    }
        
        # Default categorization if no pattern matches
        return {
            'regulatory_level': 'federal_state',
            'prominent_category': 'process_administrative',
            'risk_level': red_flag.severity.lower() if red_flag.severity else 'medium',
            'regulatory_context': 'General insurance concern - regulatory classification pending review'
        }
    
    def _get_regulatory_context(self, category_info: Dict, item_name: str) -> str:
        """Generate regulatory context explanation"""
        regulatory_level = category_info['regulatory_level']
        federal_reg = category_info.get('federal_regulation')
        state_reg = category_info.get('state_regulation')
        
        if regulatory_level == 'federal' and federal_reg == 'aca_ehb':
            return f"'{item_name}' is regulated under ACA Essential Health Benefits requirements"
        elif regulatory_level == 'federal' and federal_reg == 'mental_health_parity':
            return f"'{item_name}' is subject to federal Mental Health Parity Act requirements"
        elif regulatory_level == 'federal' and federal_reg == 'preventive_care':
            return f"'{item_name}' is covered under ACA preventive care provisions with no cost-sharing"
        elif regulatory_level == 'state' and state_reg == 'state_mandated_benefits':
            return f"'{item_name}' is a state-mandated benefit that exceeds federal minimum requirements"
        elif regulatory_level == 'federal_state':
            return f"'{item_name}' is subject to both federal and state regulatory oversight"
        else:
            return f"'{item_name}' regulatory classification requires further review"
    
    def get_visual_indicators(self, categorization: Dict) -> Dict:
        """Get visual indicators for categorization"""
        regulatory_level = categorization.get('regulatory_level')
        prominent_category = categorization.get('prominent_category')
        risk_level = categorization.get('risk_level')
        
        # Badge colors
        badge_colors = {
            'federal': 'blue',
            'state': 'orange', 
            'federal_state': 'teal'
        }
        
        # Category icons
        category_icons = {
            'coverage_access': 'shield-check',
            'cost_financial': 'dollar-sign',
            'medical_necessity_exclusions': 'x-circle',
            'process_administrative': 'file-text',
            'special_populations': 'users'
        }
        
        # Risk level colors (for red flags)
        risk_colors = {
            'low': 'yellow',
            'medium': 'orange',
            'high': 'red',
            'critical': 'red'
        }
        
        return {
            'badge_color': badge_colors.get(regulatory_level, 'gray'),
            'category_icon': category_icons.get(prominent_category, 'info'),
            'risk_color': risk_colors.get(risk_level, 'gray') if risk_level else None,
            'regulatory_badges': self._get_regulatory_badges(categorization)
        }
    
    def _get_regulatory_badges(self, categorization: Dict) -> List[str]:
        """Get list of regulatory badges to display"""
        badges = []
        
        if categorization.get('federal_regulation'):
            badges.append(f"Federal: {categorization['federal_regulation'].upper()}")
        
        if categorization.get('state_regulation'):
            badges.append(f"State: {categorization['state_regulation'].replace('_', ' ').title()}")
        
        if categorization.get('state_code'):
            badges.append(f"State: {categorization['state_code'].upper()}")
        
        return badges


# Global instance
categorization_service = CategorizationService()
