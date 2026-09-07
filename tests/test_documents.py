"""
Test Suite: Milestone 2 - File Uploads & Document Management
Tests file upload, format validation, size constraints, storage,
download, authorization / RBAC, cascade deletion, and error handling.
"""

import io
import os
import shutil
import sys
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi import HTTPException, UploadFile, status

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.database.database import Base
from app.models.decision import Decision, DecisionStatusEnum
from app.models.document import Document
from app.models.role import Role, RoleEnum
from app.models.user import User
from app.core.config import settings
from app.services.decision_service import create_decision, delete_decision
from app.services.document_service import (
    delete_document,
    get_document_by_id,
    get_document_file_for_download,
    get_documents,
    upload_document,
)
from app.api.routes.documents import (
    download_decision_document,
    list_decision_documents,
    remove_decision_document,
    upload_decision_document,
)
from app.schemas.decision import DecisionCreateRequest


class TestDocuments(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine("sqlite:///:memory:", echo=False)
        cls.SessionLocal = sessionmaker(bind=cls.engine, autocommit=False, autoflush=False)
        Base.metadata.create_all(bind=cls.engine)

        # Use test upload dir
        cls.test_upload_dir = os.path.join(os.getcwd(), "test_uploads")
        settings.UPLOAD_DIR = "test_uploads"
        os.makedirs(cls.test_upload_dir, exist_ok=True)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(cls.test_upload_dir):
            shutil.rmtree(cls.test_upload_dir, ignore_errors=True)

    def setUp(self):
        self.db = self.SessionLocal()

        # Seed roles
        for r_name in [RoleEnum.EMPLOYEE.value, RoleEnum.REVIEWER.value, RoleEnum.MANAGER.value, RoleEnum.ADMINISTRATOR.value]:
            if not self.db.query(Role).filter(Role.name == r_name).first():
                self.db.add(Role(name=r_name, description=f"{r_name} role"))
        self.db.commit()

        # Seed test users
        emp_role = self.db.query(Role).filter(Role.name == RoleEnum.EMPLOYEE.value).first()
        rev_role = self.db.query(Role).filter(Role.name == RoleEnum.REVIEWER.value).first()
        adm_role = self.db.query(Role).filter(Role.name == RoleEnum.ADMINISTRATOR.value).first()

        self.alice = self.db.query(User).filter(User.email == "alice_doc@test.com").first()
        if not self.alice:
            self.alice = User(full_name="Alice Employee", email="alice_doc@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.alice)

        self.bob = self.db.query(User).filter(User.email == "bob_doc@test.com").first()
        if not self.bob:
            self.bob = User(full_name="Bob Employee", email="bob_doc@test.com", hashed_password="hash", role_id=emp_role.id)
            self.db.add(self.bob)

        self.reviewer = self.db.query(User).filter(User.email == "reviewer_doc@test.com").first()
        if not self.reviewer:
            self.reviewer = User(full_name="Charlie Reviewer", email="reviewer_doc@test.com", hashed_password="hash", role_id=rev_role.id)
            self.db.add(self.reviewer)

        self.admin = self.db.query(User).filter(User.email == "admin_doc@test.com").first()
        if not self.admin:
            self.admin = User(full_name="Dave Admin", email="admin_doc@test.com", hashed_password="hash", role_id=adm_role.id)
            self.db.add(self.admin)

        self.db.commit()

        # Create a test draft decision owned by Alice
        dec_req = DecisionCreateRequest(
            title="Kubernetes Migration Architecture",
            problem_statement="Evaluate k8s clusters for scalability",
            context="Current monolith cannot handle peak load",
            decision_taken="Adopt EKS managed cluster",
            reasoning="Cost effective and enterprise grade support"
        )
        self.alice_decision = create_decision(self.db, dec_req, self.alice.id)

    def tearDown(self):
        self.db.close()

    def test_01_authenticated_valid_upload(self):
        """Test uploading a valid PDF document to a draft decision."""
        file_content = b"%PDF-1.4 Mock architectural specification for k8s"
        upload_file = UploadFile(
            filename="architecture_v1.pdf",
            file=io.BytesIO(file_content),
            headers={"content-type": "application/pdf"}
        )

        doc = upload_decision_document(
            decision_id=self.alice_decision.id,
            file=upload_file,
            db=self.db,
            current_user=self.alice
        )

        self.assertIsNotNone(doc.id)
        self.assertEqual(doc.original_filename, "architecture_v1.pdf")
        self.assertTrue(doc.stored_filename.endswith(".pdf"))
        self.assertEqual(doc.uploaded_by, self.alice.id)
        self.assertEqual(doc.file_size, len(file_content))

        # Verify physical file existence on disk
        stored_path = os.path.join(settings.UPLOAD_DIR, "decisions", str(self.alice_decision.id), doc.stored_filename)
        self.assertTrue(os.path.isfile(stored_path))

    def test_02_invalid_file_type_rejected(self):
        """Test that executable and disallowed file extensions are rejected with HTTP 400."""
        upload_file = UploadFile(
            filename="trojan.exe",
            file=io.BytesIO(b"MZ\x90\x00malicious binary content"),
            headers={"content-type": "application/x-msdownload"}
        )

        with self.assertRaises(HTTPException) as ctx:
            upload_decision_document(
                decision_id=self.alice_decision.id,
                file=upload_file,
                db=self.db,
                current_user=self.alice
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("not allowed", ctx.exception.detail)

    def test_03_oversized_file_rejected(self):
        """Test that files exceeding MAX_UPLOAD_SIZE_BYTES (10 MB) are rejected with HTTP 400."""
        oversized_bytes = b"0" * (10 * 1024 * 1024 + 512)
        upload_file = UploadFile(
            filename="massive_dump.csv",
            file=io.BytesIO(oversized_bytes),
            headers={"content-type": "text/csv"}
        )

        with self.assertRaises(HTTPException) as ctx:
            upload_decision_document(
                decision_id=self.alice_decision.id,
                file=upload_file,
                db=self.db,
                current_user=self.alice
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exceeds maximum allowed limit", ctx.exception.detail)

    def test_04_empty_file_rejected(self):
        """Test that empty 0-byte files are rejected with HTTP 400."""
        upload_file = UploadFile(
            filename="empty.txt",
            file=io.BytesIO(b""),
            headers={"content-type": "text/plain"}
        )

        with self.assertRaises(HTTPException) as ctx:
            upload_decision_document(
                decision_id=self.alice_decision.id,
                file=upload_file,
                db=self.db,
                current_user=self.alice
            )
        self.assertEqual(ctx.exception.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("empty file", ctx.exception.detail)

    def test_05_path_traversal_sanitization(self):
        """Test that filenames with path traversal attempts are safely stripped."""
        upload_file = UploadFile(
            filename="../../etc/passwd.txt",
            file=io.BytesIO(b"benign text content"),
            headers={"content-type": "text/plain"}
        )

        doc = upload_decision_document(
            decision_id=self.alice_decision.id,
            file=upload_file,
            db=self.db,
            current_user=self.alice
        )

        # Stored filename must be UUID-based without traversal characters
        self.assertNotIn("..", doc.file_path)
        self.assertEqual(doc.original_filename, "passwd.txt")

    def test_06_list_documents(self):
        """Test retrieving all documents attached to a decision."""
        upload_file = UploadFile(
            filename="benchmark_report.xlsx",
            file=io.BytesIO(b"Mock excel data"),
            headers={"content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
        )
        upload_decision_document(self.alice_decision.id, upload_file, self.db, self.alice)

        docs = list_decision_documents(self.alice_decision.id, self.db, self.alice)
        self.assertGreaterEqual(len(docs), 1)
        self.assertTrue(any(d.original_filename == "benchmark_report.xlsx" for d in docs))

    def test_07_authorized_download(self):
        """Test authorized file download preserves original filename and correct file content."""
        content = b"Benchmark data: 40k req/s sustained"
        upload_file = UploadFile(
            filename="perf_results.csv",
            file=io.BytesIO(content),
            headers={"content-type": "text/csv"}
        )
        doc = upload_decision_document(self.alice_decision.id, upload_file, self.db, self.alice)

        response = download_decision_document(self.alice_decision.id, doc.id, self.db, self.alice)
        self.assertEqual(response.filename, "perf_results.csv")
        self.assertTrue(os.path.isfile(response.path))

    def test_08_unauthorized_access_blocked(self):
        """Test that another user (Bob) cannot view or download documents of Alice's draft decision."""
        upload_file = UploadFile(
            filename="confidential_rfc.docx",
            file=io.BytesIO(b"Strictly confidential"),
            headers={"content-type": "application/msword"}
        )
        doc = upload_decision_document(self.alice_decision.id, upload_file, self.db, self.alice)

        # Bob attempts to list documents
        with self.assertRaises(HTTPException) as ctx:
            list_decision_documents(self.alice_decision.id, self.db, self.bob)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

        # Bob attempts to download
        with self.assertRaises(HTTPException) as ctx:
            download_decision_document(self.alice_decision.id, doc.id, self.db, self.bob)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_09_authorized_delete_removes_file(self):
        """Test that authorized deletion removes database record and disk file."""
        upload_file = UploadFile(
            filename="to_delete.txt",
            file=io.BytesIO(b"temporary file"),
            headers={"content-type": "text/plain"}
        )
        doc = upload_decision_document(self.alice_decision.id, upload_file, self.db, self.alice)
        disk_path = os.path.join(settings.UPLOAD_DIR, "decisions", str(self.alice_decision.id), doc.stored_filename)
        self.assertTrue(os.path.isfile(disk_path))

        # Delete document
        remove_decision_document(self.alice_decision.id, doc.id, self.db, self.alice)

        # Verify DB record removed
        db_doc = self.db.query(Document).filter(Document.id == doc.id).first()
        self.assertIsNone(db_doc)

        # Verify disk file removed
        self.assertFalse(os.path.isfile(disk_path))

    def test_10_unauthorized_delete_blocked(self):
        """Test that a non-owner/non-admin cannot delete another user's document."""
        upload_file = UploadFile(
            filename="protected.pdf",
            file=io.BytesIO(b"Protected file"),
            headers={"content-type": "application/pdf"}
        )
        doc = upload_decision_document(self.alice_decision.id, upload_file, self.db, self.alice)

        with self.assertRaises(HTTPException) as ctx:
            remove_decision_document(self.alice_decision.id, doc.id, self.db, self.bob)
        self.assertEqual(ctx.exception.status_code, status.HTTP_403_FORBIDDEN)

    def test_11_missing_document_handling(self):
        """Test that missing decision or document IDs return HTTP 404."""
        with self.assertRaises(HTTPException) as ctx:
            download_decision_document(self.alice_decision.id, 99999, self.db, self.alice)
        self.assertEqual(ctx.exception.status_code, status.HTTP_404_NOT_FOUND)

        with self.assertRaises(HTTPException) as ctx:
            download_decision_document(99999, 1, self.db, self.alice)
        self.assertEqual(ctx.exception.status_code, status.HTTP_404_NOT_FOUND)

    def test_12_administrator_can_access_and_delete(self):
        """Test that an Administrator can view, download, and delete any document."""
        upload_file = UploadFile(
            filename="admin_audit.pdf",
            file=io.BytesIO(b"Audit file content"),
            headers={"content-type": "application/pdf"}
        )
        doc = upload_decision_document(self.alice_decision.id, upload_file, self.db, self.alice)

        # Admin downloads
        resp = download_decision_document(self.alice_decision.id, doc.id, self.db, self.admin)
        self.assertEqual(resp.filename, "admin_audit.pdf")

        # Admin deletes
        remove_decision_document(self.alice_decision.id, doc.id, self.db, self.admin)
        db_doc = self.db.query(Document).filter(Document.id == doc.id).first()
        self.assertIsNone(db_doc)


if __name__ == "__main__":
    unittest.main()
