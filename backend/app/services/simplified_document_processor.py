"""
Simplified Document Processing Service

This service provides a streamlined, single-responsibility approach to document processing:
1. Extract text from document
2. Extract policy data (AI or fallback)
3. Create policy with extracted data

NO COMPLEXITY. NO MULTIPLE AI CALLS. JUST GET IT DONE.
"""

import logging
import os
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.models import PolicyDocument, InsurancePolicy, User
from app.schemas.policy import InsurancePolicyCreate
from app.services.text_extraction_service import text_extraction_service
from app.services.ai_policy_extraction_service import ai_policy_extraction_service

logger = logging.getLogger(__name__)


class SimplifiedDocumentProcessor:
    """
    Simple, straightforward document processor.
    No layers, no confusion, no over-engineering.
    """

    def process_document(self, db: Session, document: PolicyDocument) -> Dict[str, Any]:
        """
        Process a document from start to finish.

        Returns a dict with:
        - success: bool
        - status: str (text_extraction_failed, policy_created, needs_manual_entry)
        - policy_id: Optional[UUID]
        - error: Optional[str]
        """
        logger.info(f"[SIMPLIFIED] Processing document {document.id}")

        # STEP 1: Extract Text
        try:
            document.processing_status = "processing"
            db.commit()

            extraction_result = text_extraction_service.extract_text_from_file(
                document.file_path,
                document.mime_type
            )

            if not extraction_result.text or len(extraction_result.text.strip()) < 50:
                logger.error(f"[SIMPLIFIED] Text extraction failed or insufficient text for document {document.id}")
                document.processing_status = "failed"
                document.processing_error = "Could not extract text from document"
                document.extracted_text = ""
                db.commit()
                return {
                    "success": False,
                    "status": "text_extraction_failed",
                    "error": "Could not extract text from document"
                }

            # Save extracted text
            document.extracted_text = extraction_result.text
            document.ocr_confidence_score = float(extraction_result.confidence_score)
            document.processing_status = "completed"
            document.processed_at = datetime.utcnow()
            db.commit()

            logger.info(f"[SIMPLIFIED] Text extracted: {len(extraction_result.text)} chars, confidence: {extraction_result.confidence_score:.2f}")

        except Exception as e:
            logger.error(f"[SIMPLIFIED] Text extraction exception: {str(e)}")
            document.processing_status = "failed"
            document.processing_error = f"Text extraction error: {str(e)}"
            db.commit()
            return {
                "success": False,
                "status": "text_extraction_failed",
                "error": str(e)
            }

        # STEP 2: Extract Policy Data
        try:
            logger.info(f"[SIMPLIFIED] Extracting policy data for document {document.id}")

            extracted_data = ai_policy_extraction_service.extract_policy_data(document)

            # Store extracted data for user review
            from fastapi.encoders import jsonable_encoder
            document.extracted_policy_data = jsonable_encoder(extracted_data.__dict__)
            document.auto_creation_confidence = float(extracted_data.extraction_confidence or 0.0)
            db.commit()

            logger.info(f"[SIMPLIFIED] Policy data extracted with confidence: {extracted_data.extraction_confidence:.2f}")

        except Exception as e:
            logger.error(f"[SIMPLIFIED] Policy extraction exception: {str(e)}")
            # Don't fail the whole process - just mark for manual entry
            document.auto_creation_status = "needs_manual_entry"
            db.commit()
            return {
                "success": True,  # Text extraction succeeded
                "status": "needs_manual_entry",
                "message": "Text extracted but policy data extraction failed. Manual entry required."
            }

        # STEP 3: Create Policy (if we have minimal required data)
        try:
            # Check if we have enough data to create a policy
            has_minimal_data = (
                extracted_data.policy_name or
                extracted_data.policy_type or
                document.original_filename
            )

            if not has_minimal_data:
                logger.info(f"[SIMPLIFIED] Insufficient data for policy creation, marking for manual entry")
                document.auto_creation_status = "needs_manual_entry"
                db.commit()
                return {
                    "success": True,
                    "status": "needs_manual_entry",
                    "message": "Text extracted but insufficient policy data"
                }

            # Create policy
            logger.info(f"[SIMPLIFIED] Creating policy for document {document.id}")

            policy = self._create_policy_from_data(
                db=db,
                document=document,
                extracted_data=extracted_data
            )

            document.auto_creation_status = "completed"
            db.commit()

            logger.info(f"[SIMPLIFIED] Policy created successfully: {policy.id}")

            return {
                "success": True,
                "status": "policy_created",
                "policy_id": policy.id,
                "confidence": extracted_data.extraction_confidence,
                "message": "Policy created - review and edit as needed"
            }

        except Exception as e:
            logger.error(f"[SIMPLIFIED] Policy creation exception: {str(e)}")
            document.auto_creation_status = "failed"
            document.processing_error = f"Policy creation error: {str(e)}"
            db.commit()
            return {
                "success": False,
                "status": "policy_creation_failed",
                "error": str(e)
            }

    def _create_policy_from_data(
        self,
        db: Session,
        document: PolicyDocument,
        extracted_data
    ) -> InsurancePolicy:
        """
        Create a policy from extracted data.
        Simple, straightforward, no fancy features.
        """
        from app.services.policy_service import create_policy

        # Build policy name
        policy_name = (
            extracted_data.policy_name or
            f"Policy from {document.original_filename}" or
            "Imported Policy"
        )

        # Create policy data
        policy_data = InsurancePolicyCreate(
            document_id=document.id,
            carrier_id=document.carrier_id,
            policy_name=policy_name,
            policy_type=extracted_data.policy_type or "health",
            policy_number=extracted_data.policy_number,
            plan_year=extracted_data.plan_year,
            effective_date=extracted_data.effective_date,
            expiration_date=extracted_data.expiration_date,
            group_number=extracted_data.group_number,
            network_type=extracted_data.network_type,
            deductible_individual=extracted_data.deductible_individual,
            deductible_family=extracted_data.deductible_family,
            out_of_pocket_max_individual=extracted_data.out_of_pocket_max_individual,
            out_of_pocket_max_family=extracted_data.out_of_pocket_max_family,
            premium_monthly=extracted_data.premium_monthly,
            premium_annual=extracted_data.premium_annual
        )

        # Create policy
        policy = create_policy(db=db, obj_in=policy_data, user_id=document.user_id)

        return policy


# Global service instance
simplified_document_processor = SimplifiedDocumentProcessor()
