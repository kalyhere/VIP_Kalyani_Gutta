"""
Seed a batch of sample medical cases for development and testing.

This script creates 20 richly detailed medical cases that mirror the
structure used by the Medical Case Creator (MCC). Each case includes:
  - Title and narrative description
  - Learning objectives
  - Structured JSON content with metadata, summary, HPI, ROS, PE, labs, plan

Run from the repo root (DATABASE_URL must point at your database):

    PYTHONPATH=packages/aimms-web-backend \\
      python3 packages/aimms-web-backend/seed_medical_cases.py

Use --force to delete previously seeded cases before re-creating them.
"""
from datetime import datetime, timedelta
from typing import List, Dict, Any
import argparse

from backend.database import SessionLocal
from backend.models import MedicalCase, User, UserRole


SEED_CASE_TEMPLATES = [
    (
        "Acute Asthma Exacerbation",
        "A 22-year-old female presents with progressive shortness of breath and wheezing after exposure to a cat.",
        [
            "Develop an evidence-based treatment plan for acute asthma exacerbations.",
            "Summarize criteria for hospital admission versus discharge.",
            "Explain patient-centered education for asthma action plans.",
        ],
        ["Asthma", "Pulmonology", "Emergency Medicine"],
        "Intermediate",
        30,
    ),
    (
        "Complicated UTI in Pregnancy",
        "A 28-year-old pregnant patient reports dysuria, fever, and flank pain concerning for pyelonephritis.",
        [
            "Differentiate between uncomplicated cystitis and pyelonephritis in pregnancy.",
            "Select antibiotic therapy appropriate for pregnancy.",
            "Identify maternal and fetal complications of pyelonephritis.",
        ],
        ["Infectious Disease", "Obstetrics", "Nephrology"],
        "Advanced",
        40,
    ),
    (
        "Diabetic Ketoacidosis",
        "A 19-year-old male with type 1 diabetes mellitus presents with polyuria, polydipsia, and abdominal pain.",
        [
            "Interpret laboratory abnormalities associated with DKA.",
            "Formulate a stepwise management plan for DKA in the emergency setting.",
            "Describe strategies to prevent recurrent DKA.",
        ],
        ["Endocrinology", "Emergency Medicine"],
        "Advanced",
        60,
    ),
    (
        "Acute Appendicitis",
        "A 16-year-old presents with periumbilical pain migrating to the right lower quadrant and mild leukocytosis.",
        [
            "Recognize classic and atypical presentations of appendicitis.",
            "Interpret key imaging findings supporting surgical consultation.",
            "Outline perioperative management for suspected appendicitis.",
        ],
        ["Surgery", "Gastroenterology", "Emergency Medicine"],
        "Intermediate",
        25,
    ),
    (
        "New-Onset Atrial Fibrillation",
        "A 68-year-old with hypertension presents with palpitations and an irregularly irregular rhythm on ECG.",
        [
            "Assess stroke risk using CHA₂DS₂-VASc scoring.",
            "Select rate versus rhythm control strategies based on patient characteristics.",
            "Discuss anticoagulation options and monitoring requirements.",
        ],
        ["Cardiology", "Internal Medicine"],
        "Intermediate",
        45,
    ),
    (
        "Pediatric Dehydration",
        "A 4-year-old with gastroenteritis presents with lethargy, sunken eyes, and poor oral intake.",
        [
            "Evaluate severity of dehydration in pediatric patients.",
            "Recommend appropriate fluid resuscitation strategies.",
            "Counsel caregivers on oral rehydration and warning signs.",
        ],
        ["Pediatrics", "Emergency Medicine"],
        "Beginner",
        20,
    ),
    (
        "STEMI in the Field",
        "A 58-year-old male with chest pain is brought in by EMS with ST elevations in leads II, III, and aVF.",
        [
            "Interpret ECG findings consistent with inferior wall STEMI.",
            "Initiate pre-PCI management including antiplatelet therapy.",
            "Coordinate rapid transfer to catheterization laboratory.",
        ],
        ["Cardiology", "Emergency Medicine"],
        "Advanced",
        35,
    ),
    (
        "Sepsis in the Elderly",
        "An 82-year-old female from a nursing facility presents with altered mental status and hypotension.",
        [
            "Apply Sepsis-3 criteria to identify septic shock.",
            "Implement early goal-directed therapy including fluids and antibiotics.",
            "Recognize atypical presentations of infection in older adults.",
        ],
        ["Critical Care", "Infectious Disease", "Geriatrics"],
        "Advanced",
        50,
    ),
    (
        "Hyperthyroidism with Thyroid Storm",
        "A 34-year-old with untreated Graves' disease presents with fever, tachycardia, and agitation.",
        [
            "Diagnose thyroid storm using Burch-Wartofsky criteria.",
            "Construct a multimodal pharmacologic treatment plan.",
            "Educate patients on triggers and long-term management.",
        ],
        ["Endocrinology", "Internal Medicine"],
        "Advanced",
        55,
    ),
    (
        "COPD Exacerbation",
        "A 65-year-old smoker reports increased dyspnea and sputum production over three days.",
        [
            "Differentiate COPD exacerbations from alternative diagnoses.",
            "Tailor bronchodilator and steroid therapy to symptom severity.",
            "Plan discharge including inhaler technique and follow-up.",
        ],
        ["Pulmonology", "Internal Medicine"],
        "Intermediate",
        30,
    ),
    (
        "Acute Ischemic Stroke",
        "A 70-year-old female with atrial fibrillation presents within 90 minutes of sudden hemiparesis.",
        [
            "Apply thrombolysis eligibility criteria for acute stroke.",
            "Coordinate multidisciplinary stroke team activation.",
            "Discuss secondary prevention strategies post-stroke.",
        ],
        ["Neurology", "Emergency Medicine"],
        "Advanced",
        40,
    ),
    (
        "Sickle Cell Pain Crisis",
        "A 24-year-old with sickle cell disease presents with severe limb pain and mild anemia.",
        [
            "Establish an analgesic plan that balances efficacy and safety.",
            "Screen for acute chest syndrome and other complications.",
            "Review hydroxyurea indications and prophylactic measures.",
        ],
        ["Hematology", "Emergency Medicine"],
        "Intermediate",
        35,
    ),
    (
        "Acute Pancreatitis",
        "A 45-year-old with alcohol use disorder presents with epigastric pain radiating to the back.",
        [
            "Interpret diagnostic criteria for acute pancreatitis.",
            "Assess severity using Ranson and BISAP scoring.",
            "Implement supportive care and address underlying causes.",
        ],
        ["Gastroenterology", "Internal Medicine"],
        "Intermediate",
        45,
    ),
    (
        "Upper GI Bleed",
        "A 60-year-old with history of NSAID use presents with melena and orthostatic hypotension.",
        [
            "Stabilize patients with suspected upper GI bleeding.",
            "Utilize risk stratification tools to guide management.",
            "Plan endoscopic evaluation and secondary prevention.",
        ],
        ["Gastroenterology", "Emergency Medicine"],
        "Advanced",
        50,
    ),
    (
        "Pediatric Febrile Seizure",
        "A 3-year-old experiences a generalized tonic-clonic seizure associated with fever.",
        [
            "Differentiate simple from complex febrile seizures.",
            "Provide family counseling on prognosis and recurrence.",
            "Outline indications for further neurologic evaluation.",
        ],
        ["Pediatrics", "Neurology"],
        "Beginner",
        20,
    ),
    (
        "Acute Cholecystitis",
        "A 52-year-old female presents with right upper quadrant pain, fever, and positive Murphy sign.",
        [
            "Interpret imaging and laboratory findings supporting acute cholecystitis.",
            "Plan surgical referral and perioperative antibiotics.",
            "Differentiate gallbladder disease from hepatic and pancreatic pathology.",
        ],
        ["Surgery", "Gastroenterology"],
        "Intermediate",
        30,
    ),
    (
        "Hypertensive Emergency",
        "A 59-year-old hypertensive male has severe headache, BP 220/130, and papilledema.",
        [
            "Differentiate hypertensive emergency from urgency.",
            "Select IV antihypertensive agents based on target organ damage.",
            "Monitor for complications related to rapid blood pressure reduction.",
        ],
        ["Cardiology", "Emergency Medicine"],
        "Advanced",
        40,
    ),
    (
        "Postpartum Hemorrhage",
        "A 30-year-old postpartum patient experiences heavy bleeding and uterine atony.",
        [
            "Identify causes of postpartum hemorrhage using the Four T's framework.",
            "Implement stepwise medical and surgical management.",
            "Coordinate multidisciplinary response in obstetric emergencies.",
        ],
        ["Obstetrics", "Emergency Medicine"],
        "Advanced",
        35,
    ),
    (
        "Syncope Evaluation",
        "A 40-year-old teacher collapses during class with rapid recovery and no prodrome.",
        [
            "Differentiate vasovagal syncope from cardiac etiologies.",
            "Stratify risk using clinical decision tools.",
            "Plan outpatient versus inpatient monitoring strategies.",
        ],
        ["Cardiology", "Internal Medicine"],
        "Intermediate",
        25,
    ),
    (
        "Community-Acquired Pneumonia",
        "A 55-year-old with cough, fever, and pleuritic chest pain has a left lower lobe infiltrate on CXR.",
        [
            "Apply severity scoring (CURB-65, PSI) to determine care setting.",
            "Select empiric antibiotic therapy per current guidelines.",
            "Educate on vaccination and preventive measures.",
        ],
        ["Pulmonology", "Infectious Disease"],
        "Intermediate",
        30,
    ),
]


def build_case_content(
    title: str,
    description: str,
    objectives: List[str],
    topics: List[str],
    difficulty: str,
    duration_minutes: int,
    idx: int,
) -> Dict[str, Any]:
    """Construct structured JSON content similar to MCC exports."""
    summary_table = {
        "id": f"summary-{idx}",
        "title": "Case Summary",
        "rows": [
            {
                "id": f"summary-{idx}-1",
                "cells": [
                    {"content": "Chief Complaint", "isHeader": True},
                    {"content": description, "isHeader": False},
                ],
            },
            {
                "id": f"summary-{idx}-2",
                "cells": [
                    {"content": "Key Learning Points", "isHeader": True},
                    {"content": "<br>".join(objectives), "isHeader": False},
                ],
            },
        ],
    }

    hpi_table = {
        "id": f"hpi-{idx}",
        "title": "History of Present Illness",
        "rows": [
            {
                "id": f"hpi-{idx}-1",
                "cells": [
                    {"content": "Onset", "isHeader": True},
                    {"content": "Symptoms began within the last 24-48 hours.", "isHeader": False},
                ],
            },
            {
                "id": f"hpi-{idx}-2",
                "cells": [
                    {"content": "Associated Symptoms", "isHeader": True},
                    {"content": "Patient reports associated findings relevant to the case scenario.", "isHeader": False},
                ],
            },
        ],
    }

    exam_table = {
        "id": f"exam-{idx}",
        "title": "Physical Examination",
        "rows": [
            {
                "id": f"exam-{idx}-1",
                "cells": [
                    {"content": "Vital Signs", "isHeader": True},
                    {"content": "Vitals notable for changes consistent with the primary diagnosis.", "isHeader": False},
                ],
            },
            {
                "id": f"exam-{idx}-2",
                "cells": [
                    {"content": "Key Findings", "isHeader": True},
                    {"content": "Pertinent positives and negatives support the working diagnosis.", "isHeader": False},
                ],
            },
        ],
    }

    plan_table = {
        "id": f"plan-{idx}",
        "title": "Assessment & Plan",
        "rows": [
            {
                "id": f"plan-{idx}-1",
                "cells": [
                    {"content": "Assessment", "isHeader": True},
                    {"content": "Clinical picture consistent with the seed diagnosis.", "isHeader": False},
                ],
            },
            {
                "id": f"plan-{idx}-2",
                "cells": [
                    {"content": "Plan", "isHeader": True},
                    {"content": "Initiate guideline-directed therapy and outline follow-up.", "isHeader": False},
                ],
            },
        ],
    }

    return {
        "name": title,
        "version": "1.0",
        "metadata": {
            "topics": topics,
            "difficulty": difficulty,
            "estimated_duration_minutes": duration_minutes,
        },
        "sections": [
            {"id": f"section-summary-{idx}", "title": "Summary", "tables": [summary_table]},
            {"id": f"section-hpi-{idx}", "title": "History of Present Illness", "tables": [hpi_table]},
            {"id": f"section-exam-{idx}", "title": "Physical Examination", "tables": [exam_table]},
            {"id": f"section-plan-{idx}", "title": "Assessment & Plan", "tables": [plan_table]},
        ],
    }


def seed_medical_cases(force: bool = False):
    db = SessionLocal()
    try:
        faculty_user = (
            db.query(User)
            .filter(User.role.in_([UserRole.faculty, UserRole.admin]))
            .order_by(User.role.desc())
            .first()
        )

        if not faculty_user:
            raise RuntimeError(
                "No faculty/admin user found. Seed initial users first (run backend/db/init_db.py)."
            )

        existing_titles = [title for title, *_ in SEED_CASE_TEMPLATES]
        existing_cases = (
            db.query(MedicalCase).filter(MedicalCase.title.in_(existing_titles)).all()
        )

        if existing_cases:
            if not force:
                print(
                    f"✓ Found {len(existing_cases)} existing seed medical cases. "
                    "Use --force to recreate them."
                )
                return
            else:
                for case in existing_cases:
                    db.delete(case)
                db.commit()
                print(f"✓ Deleted {len(existing_cases)} existing seed medical cases.")

        created_cases: List[MedicalCase] = []
        base_created_at = datetime.utcnow() - timedelta(days=30)

        for idx, (
            title,
            description,
            objectives,
            topics,
            difficulty,
            duration_minutes,
        ) in enumerate(SEED_CASE_TEMPLATES, start=1):
            content = build_case_content(
                title,
                description,
                objectives,
                topics,
                difficulty,
                duration_minutes,
                idx,
            )

            is_public = idx % 2 == 0
            created_at = base_created_at + timedelta(days=idx)

            medical_case = MedicalCase(
                title=title,
                description=description,
                learning_objectives=objectives,
                content=content,
                created_by=faculty_user.id,
                is_public=is_public,
                is_active=True,
                created_at=created_at,
                updated_at=created_at,
            )

            db.add(medical_case)
            created_cases.append(medical_case)

        db.commit()

        print(f"✓ Successfully seeded {len(created_cases)} medical cases.")
        public_count = sum(1 for case in created_cases if case.is_public)
        print(f"   - Public cases: {public_count}")
        print(f"   - Private cases: {len(created_cases) - public_count}")
    except Exception as exc:
        db.rollback()
        print(f"✗ Error seeding medical cases: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed sample medical cases.")
    parser.add_argument(
        "--force",
        action="store_true",
        help="Delete existing seed medical cases before creating new ones.",
    )
    args = parser.parse_args()
    seed_medical_cases(force=args.force)


