from backend.database import init_db, SessionLocal, check_db_connection
from backend.models import Base, User, UserRole
from passlib.context import CryptContext
import structlog
import sys
from datetime import datetime

logger = structlog.get_logger()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_initial_data(db):
    """Create initial users."""
    try:
        # Create users (only if they don't exist)
        users = {}
        user_data = [
            ("admin", UserRole.admin),
            ("faculty", UserRole.faculty),
            ("student", UserRole.student)
        ]
        
        for email, role in user_data:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == email).first()
            if existing_user:
                users[email] = existing_user
                logger.info(f"User '{email}' already exists, skipping creation")
            else:
                new_user = User(
                    email=email,
                    hashed_password=pwd_context.hash("password"),
                    is_active=True,
                    role=role
                )
                db.add(new_user)
                users[email] = new_user
                logger.info(f"Created new user: {email}")
        
        db.commit()

        # Note: Students are now related to faculty through class enrollment rather than direct assignment
        logger.info("Students will be related to faculty through class enrollment")

        # Create sample classes
        create_sample_classes(db, users)
        
        # Create sample medical cases
        create_sample_medical_cases(db, users)
        
        # Create class enrollments and case assignments
        create_sample_assignments(db, users)

        db.commit()
        logger.info("Initial data created successfully")

    except Exception as e:
        logger.error("Failed to create initial data", error=str(e))
        db.rollback()
        raise


def create_sample_classes(db, users):
    """Create sample classes for faculty to manage."""
    try:
        from backend.models import Class, class_enrollment
        
        # Check if classes already exist
        existing_class = db.query(Class).first()
        if existing_class:
            logger.info("Sample classes already exist, skipping creation")
            return
        
        # Create sample classes
        classes_data = [
            {
                "name": "Emergency Medicine Clerkship",
                "code": "MED-EM-301", 
                "term": "Fall 2024",
                "faculty_id": users["faculty"].id
            },
            {
                "name": "Internal Medicine Rotation", 
                "code": "MED-IM-302",
                "term": "Fall 2024", 
                "faculty_id": users["faculty"].id
            },
            {
                "name": "Family Medicine Clerkship",
                "code": "MED-FM-303",
                "term": "Spring 2025",
                "faculty_id": users["faculty"].id
            }
        ]
        
        classes = {}
        for class_data in classes_data:
            new_class = Class(**class_data)
            db.add(new_class)
            db.flush()  # Get the ID
            classes[class_data["code"]] = new_class
            logger.info(f"Created class: {class_data['name']}")
        
        # Enroll student in classes
        # Import the association table for enrollment
        from sqlalchemy import insert
        from datetime import datetime
        
        for class_obj in classes.values():
            # Check if enrollment already exists
            enrollment_exists = db.execute(
                class_enrollment.select().where(
                    (class_enrollment.c.class_id == class_obj.id) &
                    (class_enrollment.c.user_id == users["student"].id)
                )
            ).first()
            
            if not enrollment_exists:
                db.execute(
                    insert(class_enrollment).values(
                        class_id=class_obj.id,
                        user_id=users["student"].id,
                        enrolled_at=datetime.utcnow(),
                        is_active=True
                    )
                )
                logger.info(f"Enrolled student in class: {class_obj.name}")
        
        db.commit()
        logger.info("Sample classes created and student enrolled successfully")
        
    except Exception as e:
        logger.error(f"Failed to create sample classes: {e}")
        raise


def create_sample_medical_cases(db, users):
    """Create sample medical cases."""
    try:
        from backend.models import MedicalCase
        
        # Check if medical cases already exist
        existing_case = db.query(MedicalCase).first()
        if existing_case:
            logger.info("Sample medical cases already exist, skipping creation")
            return
        
        # Sample medical case content (simplified version of the full case)
        sample_case_content = {
            "name": "Emergent Management of Acute Ischemic Stroke",
            "version": "1.0",
            "sections": [
                {
                    "id": "section-1",
                    "title": "Case Summary",
                    "tables": [
                        {
                            "id": "table-1",
                            "title": "Case Details",
                            "rows": [
                                {
                                    "id": "row-1",
                                    "cells": [
                                        {"content": "Scenario Title:", "isHeader": False},
                                        {"content": "Emergent Management of Acute Ischemic Stroke", "isHeader": False}
                                    ]
                                },
                                {
                                    "id": "row-2", 
                                    "cells": [
                                        {"content": "Brief Description:", "isHeader": False},
                                        {"content": "A 45-year-old female presents to the emergency department with acute onset neurological symptoms including sudden weakness on the right side, difficulty speaking, and facial droop that started 90 minutes ago.", "isHeader": False}
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    "id": "section-2",
                    "title": "Learning Objectives", 
                    "tables": [
                        {
                            "id": "table-2",
                            "title": "Objectives",
                            "rows": [
                                {
                                    "id": "row-3",
                                    "cells": [
                                        {"content": "Objective 1:", "isHeader": False},
                                        {"content": "Recognize signs and symptoms of acute stroke", "isHeader": False}
                                    ]
                                },
                                {
                                    "id": "row-4",
                                    "cells": [
                                        {"content": "Objective 2:", "isHeader": False}, 
                                        {"content": "Demonstrate rapid stroke assessment using NIHSS", "isHeader": False}
                                    ]
                                },
                                {
                                    "id": "row-5",
                                    "cells": [
                                        {"content": "Objective 3:", "isHeader": False},
                                        {"content": "Discuss time-sensitive treatment options for acute stroke", "isHeader": False}
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        
        # Create medical cases
        cases_data = [
            {
                "title": "Emergent Management of Acute Ischemic Stroke",
                "description": "A comprehensive emergency medicine case focusing on rapid assessment and management of acute stroke in a 45-year-old female patient.",
                "learning_objectives": [
                    "Recognize signs and symptoms of acute stroke",
                    "Demonstrate rapid stroke assessment using NIHSS", 
                    "Discuss time-sensitive treatment options for acute stroke",
                    "Practice effective communication with stroke team"
                ],
                "content": sample_case_content,
                "created_by": users["faculty"].id,
                "is_public": True
            },
            {
                "title": "Acute Myocardial Infarction Management",
                "description": "Emergency department management of a 58-year-old male presenting with chest pain and suspected STEMI.",
                "learning_objectives": [
                    "Recognize classic presentations of acute MI",
                    "Interpret ECG findings in STEMI",
                    "Initiate appropriate emergency interventions",
                    "Coordinate care with cardiology team"
                ],
                "content": {
                    "name": "Acute Myocardial Infarction Management",
                    "version": "1.0", 
                    "sections": [
                        {
                            "id": "section-1",
                            "title": "Case Overview",
                            "tables": [
                                {
                                    "id": "table-1",
                                    "title": "Patient Presentation",
                                    "rows": [
                                        {
                                            "id": "row-1",
                                            "cells": [
                                                {"content": "Chief Complaint:", "isHeader": False},
                                                {"content": "Severe chest pain radiating to left arm, started 2 hours ago", "isHeader": False}
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                "created_by": users["faculty"].id, 
                "is_public": True
            }
        ]
        
        cases = {}
        for case_data in cases_data:
            new_case = MedicalCase(**case_data)
            db.add(new_case)
            db.flush()  # Get the ID
            cases[case_data["title"]] = new_case
            logger.info(f"Created medical case: {case_data['title']}")
        
        db.commit()
        logger.info("Sample medical cases created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create sample medical cases: {e}")
        raise
        

def create_sample_assignments(db, users):
    """Create sample case assignments."""
    try:
        from backend.models import CaseAssignment, Class, MedicalCase
        from datetime import timedelta
        
        # Check if assignments already exist
        existing_assignment = db.query(CaseAssignment).first()
        if existing_assignment:
            logger.info("Sample assignments already exist, skipping creation")
            return
        
        # Get the created classes and cases
        classes = db.query(Class).all()
        cases = db.query(MedicalCase).all()
        
        if not classes or not cases:
            logger.warning("No classes or cases found, skipping assignment creation")
            return
        
        # Create assignments for the student
        for i, case in enumerate(cases[:2]):  # Assign first 2 cases
            class_obj = classes[i % len(classes)]  # Cycle through classes
            
            assignment = CaseAssignment(
                case_id=case.id,
                class_id=class_obj.id,
                student_id=users["student"].id,
                faculty_id=users["faculty"].id,
                assigned_date=datetime.utcnow(),
                due_date=datetime.utcnow() + timedelta(days=7),  # Due in 1 week
                status='not_started'
            )
            db.add(assignment)
            logger.info(f"Created assignment: {case.title} for student in {class_obj.name}")
        
        db.commit() 
        logger.info("Sample assignments created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create sample assignments: {e}")
        raise


def setup_database():
    """Initialize the database, create all tables, and seed initial data."""
    try:
        # First verify database connection
        if not check_db_connection():
            logger.error("Failed to connect to database. Please check your connection settings.")
            sys.exit(1)
            
        # Create all tables
        init_db()
        logger.info("Database tables created successfully")

        # Create initial data
        with SessionLocal() as db:
            create_initial_data(db)
        
    except Exception as e:
        logger.error("Failed to initialize database", error=str(e))
        sys.exit(1)

if __name__ == "__main__":
    setup_database() 