"""
AI Monitoring and Logging Service

This service provides comprehensive monitoring, logging, and observability
for the AI/LLM pipeline operations in the US Insurance Platform.
"""

import logging
import time
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
from sqlalchemy.orm import Session
from sqlalchemy import Column, String, Text, DateTime, Float, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid

from app.models.base import Base, BaseModel
from app.core.config import settings

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class AnalysisStatus(Enum):
    """Status of AI analysis operations"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"

class AnalysisType(Enum):
    """Types of AI analysis"""
    RED_FLAGS = "red_flags"
    BENEFITS = "benefits"
    COMPREHENSIVE = "comprehensive"

@dataclass
class AnalysisMetrics:
    """Metrics for AI analysis operations"""
    analysis_id: str
    policy_id: str
    document_id: str
    analysis_type: str
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    processing_time_seconds: Optional[float]
    token_count: Optional[int]
    confidence_score: Optional[float]
    red_flags_detected: int
    benefits_extracted: int
    error_message: Optional[str]
    retry_count: int
    api_calls_made: int
    total_cost_estimate: Optional[float]

class AIAnalysisLog(Base, BaseModel):
    """Database model for AI analysis logs"""
    __tablename__ = "ai_analysis_logs"
    __table_args__ = {'extend_existing': True}
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    analysis_id = Column(String(255), nullable=False, index=True)
    policy_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    document_id = Column(UUID(as_uuid=True), nullable=False)
    analysis_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime)
    processing_time_seconds = Column(Float)
    token_count = Column(Integer)
    confidence_score = Column(Float)
    red_flags_detected = Column(Integer, default=0)
    benefits_extracted = Column(Integer, default=0)
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    api_calls_made = Column(Integer, default=0)
    total_cost_estimate = Column(Float)
    analysis_metadata = Column(JSONB)

class AIMonitoringService:
    """
    Service for monitoring and logging AI analysis operations
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.active_analyses: Dict[str, AnalysisMetrics] = {}
    
    def start_analysis(
        self,
        policy_id: str,
        document_id: str,
        analysis_type: AnalysisType,
        db: Session
    ) -> str:
        """
        Start monitoring an AI analysis operation
        
        Returns:
            analysis_id: Unique identifier for this analysis
        """
        analysis_id = str(uuid.uuid4())
        start_time = datetime.utcnow()
        
        # Create metrics object
        metrics = AnalysisMetrics(
            analysis_id=analysis_id,
            policy_id=policy_id,
            document_id=document_id,
            analysis_type=analysis_type.value,
            status=AnalysisStatus.PENDING.value,
            start_time=start_time,
            end_time=None,
            processing_time_seconds=None,
            token_count=None,
            confidence_score=None,
            red_flags_detected=0,
            benefits_extracted=0,
            error_message=None,
            retry_count=0,
            api_calls_made=0,
            total_cost_estimate=None
        )
        
        # Store in memory for active tracking
        self.active_analyses[analysis_id] = metrics
        
        # Log to database
        self._log_to_database(metrics, db)
        
        self.logger.info(f"Started AI analysis {analysis_id} for policy {policy_id}")
        return analysis_id
    
    def update_analysis_status(
        self,
        analysis_id: str,
        status: AnalysisStatus,
        db: Session,
        error_message: Optional[str] = None,
        retry_count: Optional[int] = None
    ) -> None:
        """Update the status of an ongoing analysis"""
        if analysis_id not in self.active_analyses:
            self.logger.warning(f"Analysis {analysis_id} not found in active analyses")
            return
        
        metrics = self.active_analyses[analysis_id]
        metrics.status = status.value
        
        if error_message:
            metrics.error_message = error_message
        
        if retry_count is not None:
            metrics.retry_count = retry_count
        
        # Update database
        self._update_database_log(metrics, db)
        
        self.logger.info(f"Updated analysis {analysis_id} status to {status.value}")
    
    def complete_analysis(
        self,
        analysis_id: str,
        db: Session,
        red_flags_count: int = 0,
        benefits_count: int = 0,
        confidence_score: Optional[float] = None,
        token_count: Optional[int] = None,
        api_calls: int = 1
    ) -> None:
        """Complete an AI analysis and record final metrics"""
        if analysis_id not in self.active_analyses:
            self.logger.warning(f"Analysis {analysis_id} not found in active analyses")
            return
        
        metrics = self.active_analyses[analysis_id]
        end_time = datetime.utcnow()
        
        # Update metrics
        metrics.status = AnalysisStatus.COMPLETED.value
        metrics.end_time = end_time
        metrics.processing_time_seconds = (end_time - metrics.start_time).total_seconds()
        metrics.red_flags_detected = red_flags_count
        metrics.benefits_extracted = benefits_count
        metrics.confidence_score = confidence_score
        metrics.token_count = token_count
        metrics.api_calls_made = api_calls
        
        # Estimate cost (rough estimate for Gemini API)
        if token_count:
            # Approximate cost calculation (adjust based on actual pricing)
            metrics.total_cost_estimate = (token_count / 1000) * 0.001  # $0.001 per 1K tokens
        
        # Update database
        self._update_database_log(metrics, db)
        
        # Remove from active tracking
        del self.active_analyses[analysis_id]
        
        self.logger.info(
            f"Completed analysis {analysis_id}: "
            f"{red_flags_count} red flags, {benefits_count} benefits, "
            f"confidence: {confidence_score:.3f if confidence_score else 'N/A'}, "
            f"time: {metrics.processing_time_seconds:.2f}s"
        )
    
    def fail_analysis(
        self,
        analysis_id: str,
        db: Session,
        error_message: str,
        retry_count: int = 0
    ) -> None:
        """Mark an analysis as failed"""
        if analysis_id not in self.active_analyses:
            self.logger.warning(f"Analysis {analysis_id} not found in active analyses")
            return
        
        metrics = self.active_analyses[analysis_id]
        metrics.status = AnalysisStatus.FAILED.value
        metrics.end_time = datetime.utcnow()
        metrics.processing_time_seconds = (metrics.end_time - metrics.start_time).total_seconds()
        metrics.error_message = error_message
        metrics.retry_count = retry_count
        
        # Update database
        self._update_database_log(metrics, db)
        
        # Remove from active tracking
        del self.active_analyses[analysis_id]
        
        self.logger.error(f"Failed analysis {analysis_id}: {error_message}")
    
    def get_analysis_metrics(
        self,
        db: Session,
        policy_id: Optional[str] = None,
        hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Get analysis metrics for monitoring dashboard"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        query = db.query(AIAnalysisLog).filter(AIAnalysisLog.start_time >= cutoff_time)
        
        if policy_id:
            query = query.filter(AIAnalysisLog.policy_id == policy_id)
        
        logs = query.order_by(AIAnalysisLog.start_time.desc()).all()
        
        return [
            {
                "analysis_id": log.analysis_id,
                "policy_id": str(log.policy_id),
                "analysis_type": log.analysis_type,
                "status": log.status,
                "start_time": log.start_time.isoformat(),
                "processing_time": log.processing_time_seconds,
                "confidence_score": log.confidence_score,
                "red_flags_detected": log.red_flags_detected,
                "benefits_extracted": log.benefits_extracted,
                "error_message": log.error_message,
                "retry_count": log.retry_count
            }
            for log in logs
        ]
    
    def get_performance_stats(self, db: Session, hours: int = 24) -> Dict[str, Any]:
        """Get performance statistics for the AI pipeline"""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        logs = db.query(AIAnalysisLog).filter(AIAnalysisLog.start_time >= cutoff_time).all()
        
        if not logs:
            return {"message": "No analysis data available"}
        
        completed_logs = [log for log in logs if log.status == "completed"]
        failed_logs = [log for log in logs if log.status == "failed"]
        
        total_analyses = len(logs)
        success_rate = len(completed_logs) / total_analyses if total_analyses > 0 else 0
        
        avg_processing_time = (
            sum(log.processing_time_seconds for log in completed_logs if log.processing_time_seconds) /
            len(completed_logs) if completed_logs else 0
        )
        
        avg_confidence = (
            sum(log.confidence_score for log in completed_logs if log.confidence_score) /
            len([log for log in completed_logs if log.confidence_score]) if completed_logs else 0
        )
        
        total_red_flags = sum(log.red_flags_detected or 0 for log in completed_logs)
        total_benefits = sum(log.benefits_extracted or 0 for log in completed_logs)
        
        return {
            "time_period_hours": hours,
            "total_analyses": total_analyses,
            "completed_analyses": len(completed_logs),
            "failed_analyses": len(failed_logs),
            "success_rate": round(success_rate * 100, 2),
            "average_processing_time_seconds": round(avg_processing_time, 2),
            "average_confidence_score": round(avg_confidence, 3),
            "total_red_flags_detected": total_red_flags,
            "total_benefits_extracted": total_benefits,
            "estimated_total_cost": sum(log.total_cost_estimate or 0 for log in completed_logs)
        }
    
    def _log_to_database(self, metrics: AnalysisMetrics, db: Session) -> None:
        """Log analysis metrics to database"""
        try:
            log_entry = AIAnalysisLog(
                analysis_id=metrics.analysis_id,
                policy_id=uuid.UUID(metrics.policy_id),
                document_id=uuid.UUID(metrics.document_id),
                analysis_type=metrics.analysis_type,
                status=metrics.status,
                start_time=metrics.start_time,
                metadata=asdict(metrics)
            )
            
            db.add(log_entry)
            db.commit()
            
        except Exception as e:
            self.logger.error(f"Failed to log analysis to database: {str(e)}")
            db.rollback()
    
    def _update_database_log(self, metrics: AnalysisMetrics, db: Session) -> None:
        """Update existing database log entry"""
        try:
            log_entry = db.query(AIAnalysisLog).filter(
                AIAnalysisLog.analysis_id == metrics.analysis_id
            ).first()
            
            if log_entry:
                log_entry.status = metrics.status
                log_entry.end_time = metrics.end_time
                log_entry.processing_time_seconds = metrics.processing_time_seconds
                log_entry.confidence_score = metrics.confidence_score
                log_entry.red_flags_detected = metrics.red_flags_detected
                log_entry.benefits_extracted = metrics.benefits_extracted
                log_entry.error_message = metrics.error_message
                log_entry.retry_count = metrics.retry_count
                log_entry.api_calls_made = metrics.api_calls_made
                log_entry.total_cost_estimate = metrics.total_cost_estimate
                log_entry.metadata = asdict(metrics)
                
                db.commit()
            
        except Exception as e:
            self.logger.error(f"Failed to update analysis log: {str(e)}")
            db.rollback()


# Global service instance
ai_monitoring_service = AIMonitoringService()
