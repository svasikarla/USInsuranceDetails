"""
Dashboard Categorization Service

Provides categorization analytics and summaries for the dashboard
"""

import logging
from typing import Dict, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text, func

from app.models import CoverageBenefit, RedFlag, InsurancePolicy
from app.schemas.dashboard import BenefitsSummary, CategorizationSummary
from app.services.categorization_service import categorization_service

logger = logging.getLogger(__name__)


class DashboardCategorizationService:
    """Service for dashboard categorization analytics"""
    
    def get_categorization_summary(self, db: Session, user_id: str) -> CategorizationSummary:
        """Get comprehensive categorization summary for dashboard"""
        
        # Get benefits summary
        benefits_summary = self._get_benefits_summary(db, user_id)
        
        # Get red flags summary (enhanced with categorization)
        red_flags_summary = self._get_red_flags_summary(db, user_id)
        
        # Calculate regulatory compliance score
        compliance_score = self._calculate_compliance_score(db, user_id)
        
        # Get top regulatory concerns
        top_concerns = self._get_top_regulatory_concerns(db, user_id)
        
        # Identify coverage gaps
        coverage_gaps = self._identify_coverage_gaps(db, user_id)
        
        total_categorized = benefits_summary.total + red_flags_summary["total"]
        
        return CategorizationSummary(
            total_categorized_items=total_categorized,
            benefits_summary=benefits_summary,
            red_flags_summary=red_flags_summary,
            regulatory_compliance_score=compliance_score,
            top_regulatory_concerns=top_concerns,
            coverage_gaps=coverage_gaps
        )
    
    def _get_benefits_summary(self, db: Session, user_id: str) -> BenefitsSummary:
        """Get benefits categorization summary"""
        
        # Query benefits with categorization data
        query = text("""
            SELECT 
                COUNT(*) as total,
                regulatory_level,
                prominent_category,
                federal_regulation
            FROM coverage_benefits cb
            JOIN insurance_policies p ON cb.policy_id = p.id
            WHERE p.user_id = :user_id
            GROUP BY regulatory_level, prominent_category, federal_regulation
        """)
        
        results = db.execute(query, {"user_id": user_id}).fetchall()
        
        total = 0
        by_regulatory_level = {}
        by_prominent_category = {}
        by_federal_regulation = {}
        
        for row in results:
            count = row.total
            total += count
            
            if row.regulatory_level:
                by_regulatory_level[row.regulatory_level] = by_regulatory_level.get(row.regulatory_level, 0) + count
            
            if row.prominent_category:
                by_prominent_category[row.prominent_category] = by_prominent_category.get(row.prominent_category, 0) + count
            
            if row.federal_regulation:
                by_federal_regulation[row.federal_regulation] = by_federal_regulation.get(row.federal_regulation, 0) + count
        
        return BenefitsSummary(
            total=total,
            by_regulatory_level=by_regulatory_level,
            by_prominent_category=by_prominent_category,
            by_federal_regulation=by_federal_regulation
        )
    
    def _get_red_flags_summary(self, db: Session, user_id: str) -> Dict:
        """Get red flags categorization summary"""
        
        # Query red flags with categorization data
        query = text("""
            SELECT 
                COUNT(*) as total,
                severity,
                risk_level,
                regulatory_level,
                prominent_category
            FROM red_flags rf
            JOIN insurance_policies p ON rf.policy_id = p.id
            WHERE p.user_id = :user_id
            GROUP BY severity, risk_level, regulatory_level, prominent_category
        """)
        
        results = db.execute(query, {"user_id": user_id}).fetchall()
        
        total = 0
        by_severity = {}
        by_risk_level = {}
        by_regulatory_level = {}
        by_prominent_category = {}
        
        for row in results:
            count = row.total
            total += count
            
            if row.severity:
                by_severity[row.severity] = by_severity.get(row.severity, 0) + count
            
            if row.risk_level:
                by_risk_level[row.risk_level] = by_risk_level.get(row.risk_level, 0) + count
            
            if row.regulatory_level:
                by_regulatory_level[row.regulatory_level] = by_regulatory_level.get(row.regulatory_level, 0) + count
            
            if row.prominent_category:
                by_prominent_category[row.prominent_category] = by_prominent_category.get(row.prominent_category, 0) + count
        
        return {
            "total": total,
            "by_severity": by_severity,
            "by_risk_level": by_risk_level,
            "by_regulatory_level": by_regulatory_level,
            "by_prominent_category": by_prominent_category
        }
    
    def _calculate_compliance_score(self, db: Session, user_id: str) -> float:
        """Calculate regulatory compliance score (0-100)"""
        
        # Get total red flags by risk level
        query = text("""
            SELECT risk_level, COUNT(*) as count
            FROM red_flags rf
            JOIN insurance_policies p ON rf.policy_id = p.id
            WHERE p.user_id = :user_id AND risk_level IS NOT NULL
            GROUP BY risk_level
        """)
        
        results = db.execute(query, {"user_id": user_id}).fetchall()
        
        if not results:
            return 100.0  # No red flags = perfect score
        
        # Weight red flags by severity
        weights = {
            'critical': 10,
            'high': 5,
            'medium': 2,
            'low': 1
        }
        
        total_weight = 0
        max_possible_weight = 0
        
        for row in results:
            count = row.count
            weight = weights.get(row.risk_level, 1)
            total_weight += count * weight
            max_possible_weight += count * 10  # Assume worst case (all critical)
        
        if max_possible_weight == 0:
            return 100.0
        
        # Calculate score (higher weight = lower score)
        score = max(0, 100 - (total_weight / max_possible_weight * 100))
        return round(score, 1)
    
    def _get_top_regulatory_concerns(self, db: Session, user_id: str) -> List[str]:
        """Get top regulatory concerns based on red flags"""
        
        query = text("""
            SELECT 
                prominent_category,
                regulatory_level,
                COUNT(*) as concern_count,
                AVG(CASE 
                    WHEN risk_level = 'critical' THEN 4
                    WHEN risk_level = 'high' THEN 3
                    WHEN risk_level = 'medium' THEN 2
                    WHEN risk_level = 'low' THEN 1
                    ELSE 1
                END) as avg_severity
            FROM red_flags rf
            JOIN insurance_policies p ON rf.policy_id = p.id
            WHERE p.user_id = :user_id 
                AND prominent_category IS NOT NULL
                AND regulatory_level IS NOT NULL
            GROUP BY prominent_category, regulatory_level
            ORDER BY concern_count DESC, avg_severity DESC
            LIMIT 5
        """)
        
        results = db.execute(query, {"user_id": user_id}).fetchall()
        
        concerns = []
        for row in results:
            category = row.prominent_category.replace('_', ' ').title()
            level = row.regulatory_level.replace('_', ' ').title()
            concerns.append(f"{category} ({level})")
        
        return concerns
    
    def _identify_coverage_gaps(self, db: Session, user_id: str) -> List[str]:
        """Identify potential coverage gaps based on missing essential benefits"""
        
        # Essential health benefits that should be present
        essential_benefits = [
            'ambulatory_patient_services',
            'emergency_services', 
            'hospitalization',
            'maternity_newborn_care',
            'mental_health_substance_use',
            'prescription_drugs',
            'rehabilitative_services',
            'laboratory_services',
            'preventive_care',
            'pediatric_services'
        ]
        
        # Check which benefits are missing
        query = text("""
            SELECT DISTINCT federal_regulation
            FROM coverage_benefits cb
            JOIN insurance_policies p ON cb.policy_id = p.id
            WHERE p.user_id = :user_id 
                AND federal_regulation = 'aca_ehb'
                AND prominent_category = 'coverage_access'
        """)
        
        results = db.execute(query, {"user_id": user_id}).fetchall()
        
        # This is a simplified gap analysis
        # In a real implementation, you'd have more sophisticated logic
        gaps = []
        
        # Check for common red flag patterns that indicate gaps
        gap_query = text("""
            SELECT title, description
            FROM red_flags rf
            JOIN insurance_policies p ON rf.policy_id = p.id
            WHERE p.user_id = :user_id 
                AND (
                    LOWER(title) LIKE '%exclusion%' OR
                    LOWER(title) LIKE '%not covered%' OR
                    LOWER(title) LIKE '%limitation%'
                )
            LIMIT 3
        """)
        
        gap_results = db.execute(gap_query, {"user_id": user_id}).fetchall()
        
        for row in gap_results:
            # Extract potential gap from red flag title
            title = row.title.replace('Exclusion', 'Coverage Gap').replace('Not Covered', 'Missing Coverage')
            gaps.append(title)
        
        return gaps[:5]  # Return top 5 gaps


# Global instance
dashboard_categorization_service = DashboardCategorizationService()
