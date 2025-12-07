"""
Seed test data for development environment.
Creates example standalone AIMHEI reports for testing.
"""
from backend.database import SessionLocal
from backend.models import AIMHEIReport
from datetime import datetime
import json

def seed_test_reports(force=False):
    """Create example standalone reports if they don't exist."""
    db = SessionLocal()

    try:
        # Check if we already have test data
        existing_count = db.query(AIMHEIReport).filter(
            AIMHEIReport.report_name.like("Test Report %")
        ).count()

        if existing_count > 0:
            if not force:
                print(f"✓ Found {existing_count} existing test reports, skipping seed (use --force to recreate)")
                return
            else:
                # Delete existing test reports
                db.query(AIMHEIReport).filter(
                    AIMHEIReport.report_name.like("Test Report %")
                ).delete()
                db.commit()
                print(f"✓ Deleted {existing_count} existing test reports")

        # Sample rubric detail data matching real AIMHEI report structure
        sample_rubric_detail = [
            # Section 1: Introduction
            {"section_title": "Section 1: Introduction", "criteria": "Did the HCP give their first name?", "output": "YES", "explanation": "The HCP clearly introduced themselves with their first name at the beginning of the encounter, establishing a professional yet personable tone.", "line_nums": [], "lines": []},
            {"section_title": "Section 1: Introduction", "criteria": "Did the HCP give their last name?", "output": "YES", "explanation": "The HCP provided their last name during the introduction, following proper professional protocol.", "line_nums": [], "lines": []},
            {"section_title": "Section 1: Introduction", "criteria": "Did the HCP ask for or confirm the patient's name?", "output": "YES", "explanation": "The HCP confirmed the patient's name at the start of the interview to ensure they were speaking with the correct individual.", "line_nums": [], "lines": []},
            {"section_title": "Section 1: Introduction", "criteria": "Did the HCP ask or confirm the patient's DOB?", "output": "YES", "explanation": "The HCP verified the patient's date of birth as part of proper patient identification procedures.", "line_nums": [], "lines": []},
            {"section_title": "Section 1: Introduction", "criteria": "Did the HCP explain their role?", "output": "YES", "explanation": "The HCP clearly explained their role in the patient's care, helping set appropriate expectations.", "line_nums": [], "lines": []},

            # Section 2: Present Illness
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP ask an appropriate opening question? (eg., 'What brings you in today?')", "output": "YES", "explanation": "The HCP used an open-ended question to allow the patient to describe their chief complaint in their own words.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore the onset of the problem?", "output": "YES", "explanation": "The HCP thoroughly explored when symptoms began and the circumstances surrounding onset.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore the location of the problem?", "output": "YES", "explanation": "The HCP asked detailed questions about where the symptoms are located and if they radiate.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore the duration of the problem?", "output": "YES", "explanation": "The HCP asked about how long each episode lasts and the overall duration of the problem.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore the character/quality of the problem?", "output": "YES", "explanation": "The HCP explored the nature and quality of symptoms with appropriate descriptive questions.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore alleviating factors?", "output": "NO", "explanation": "The HCP did not adequately explore what makes the symptoms better or provides relief.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore aggravating factors?", "output": "YES", "explanation": "The HCP asked about activities or circumstances that worsen the symptoms.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore the severity of the problem?", "output": "YES", "explanation": "The HCP used a pain scale and asked about functional impact to assess severity.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore the timing/temporal pattern of the problem?", "output": "YES", "explanation": "The HCP asked about when symptoms occur and if there is a pattern to their occurrence.", "line_nums": [], "lines": []},
            {"section_title": "Section 2: Present Illness", "criteria": "Did the HCP explore associated symptoms?", "output": "YES", "explanation": "The HCP systematically explored related symptoms that may accompany the chief complaint.", "line_nums": [], "lines": []},

            # Section 3: Past Medical History
            {"section_title": "Section 3: Past Medical History", "criteria": "Did the HCP ask about previous hospitalizations?", "output": "YES", "explanation": "The HCP asked about any previous hospital admissions and surgeries.", "line_nums": [], "lines": []},
            {"section_title": "Section 3: Past Medical History", "criteria": "Did the HCP ask about chronic medical conditions?", "output": "YES", "explanation": "The HCP inquired about ongoing medical conditions like diabetes, hypertension, or heart disease.", "line_nums": [], "lines": []},
            {"section_title": "Section 3: Past Medical History", "criteria": "Did the HCP ask about current medications?", "output": "YES", "explanation": "The HCP obtained a comprehensive list of current medications including dosages.", "line_nums": [], "lines": []},
            {"section_title": "Section 3: Past Medical History", "criteria": "Did the HCP ask about medication allergies?", "output": "YES", "explanation": "The HCP asked about drug allergies and the nature of reactions experienced.", "line_nums": [], "lines": []},

            # Section 4: Family and Social History
            {"section_title": "Section 4: Family and Social History", "criteria": "Did the HCP ask about family history of relevant conditions?", "output": "YES", "explanation": "The HCP asked about family history of conditions relevant to the chief complaint.", "line_nums": [], "lines": []},
            {"section_title": "Section 4: Family and Social History", "criteria": "Did the HCP ask about tobacco use?", "output": "YES", "explanation": "The HCP inquired about current and past tobacco use including amount and duration.", "line_nums": [], "lines": []},
            {"section_title": "Section 4: Family and Social History", "criteria": "Did the HCP ask about alcohol use?", "output": "YES", "explanation": "The HCP asked about alcohol consumption patterns in a non-judgmental manner.", "line_nums": [], "lines": []},
            {"section_title": "Section 4: Family and Social History", "criteria": "Did the HCP ask about occupation?", "output": "NO", "explanation": "The HCP did not explore the patient's occupation and potential occupational exposures.", "line_nums": [], "lines": []},
            {"section_title": "Section 4: Family and Social History", "criteria": "Did the HCP ask about living situation?", "output": "YES", "explanation": "The HCP asked about the patient's home environment and support system.", "line_nums": [], "lines": []},

            # Section 5: Review of Systems
            {"section_title": "Section 5: Review of Systems", "criteria": "Did the HCP perform a systematic review covering major organ systems?", "output": "YES", "explanation": "The HCP conducted a thorough review of systems including cardiovascular, respiratory, GI, and neurological.", "line_nums": [], "lines": []},
            {"section_title": "Section 5: Review of Systems", "criteria": "Did the HCP ask appropriate follow-up questions for positive findings?", "output": "YES", "explanation": "When positive symptoms were identified, the HCP explored them with appropriate detail.", "line_nums": [], "lines": []},

            # Section 6: Closing
            {"section_title": "Section 6: Closing", "criteria": "Did the HCP summarize the information gathered?", "output": "YES", "explanation": "The HCP provided a clear summary of the patient's history and concerns.", "line_nums": [], "lines": []},
            {"section_title": "Section 6: Closing", "criteria": "Did the HCP ask if the patient had any questions?", "output": "YES", "explanation": "The HCP explicitly asked if the patient had questions or concerns before concluding.", "line_nums": [], "lines": []},
            {"section_title": "Section 6: Closing", "criteria": "Did the HCP explain next steps?", "output": "YES", "explanation": "The HCP clearly outlined the plan for further evaluation and follow-up.", "line_nums": [], "lines": []},

            # Skills Section - Medical Terminology
            {"section_title": "Skills Section: Medical Terminology", "criteria": "Used appropriate medical terminology", "output": "YES", "explanation": "The HCP consistently used appropriate medical terminology while also explaining terms to ensure patient understanding.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Medical Terminology", "criteria": "Avoided excessive jargon", "output": "YES", "explanation": "The HCP balanced professional language with patient-friendly explanations.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Medical Terminology", "criteria": "Medical Terminology Score", "output": "Y:18/N:2", "explanation": "Overall excellent use of medical terminology with 18 appropriate uses and 2 instances where simpler language would have been better.", "line_nums": [], "lines": []},

            # Skills Section - Communication
            {"section_title": "Skills Section: Communication", "criteria": "Used open-ended questions effectively", "output": "YES", "explanation": "The HCP effectively used open-ended questions to gather comprehensive information and encourage patient narrative.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Communication", "criteria": "Used closed-ended questions appropriately", "output": "YES", "explanation": "The HCP used closed-ended questions when specific information was needed.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Communication", "criteria": "Demonstrated active listening", "output": "YES", "explanation": "The HCP showed attentive listening through appropriate verbal and non-verbal cues.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Communication", "criteria": "Asked clarifying questions", "output": "YES", "explanation": "The HCP sought clarification when patient responses were unclear or ambiguous.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Communication", "criteria": "Avoided interrupting the patient", "output": "NO", "explanation": "The HCP interrupted the patient twice during the history taking, which disrupted the flow of information.", "line_nums": [], "lines": []},

            # Skills Section - Professionalism
            {"section_title": "Skills Section: Professionalism", "criteria": "Politeness Score", "output": "avg:8.7", "explanation": "Consistently polite and respectful throughout the encounter with appropriate professional demeanor.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Professionalism", "criteria": "Empathy Score", "output": "avg:8.2", "explanation": "Demonstrated genuine concern for patient wellbeing and acknowledged patient's emotional state.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Professionalism", "criteria": "Built rapport effectively", "output": "YES", "explanation": "Established good rapport through appropriate eye contact, body language, and conversational tone.", "line_nums": [], "lines": []},
            {"section_title": "Skills Section: Professionalism", "criteria": "Transitioned smoothly between topics", "output": "YES", "explanation": "The HCP generally transitioned smoothly between different sections of the history.", "line_nums": [], "lines": []},

            # Additional entries to make report longer for testing scroll behavior
            {"section_title": "Section 7: Physical Examination", "criteria": "Did the HCP perform general inspection?", "output": "YES", "explanation": "The HCP conducted a thorough general inspection noting overall appearance and distress level.", "line_nums": [], "lines": []},
            {"section_title": "Section 7: Physical Examination", "criteria": "Did the HCP assess vital signs?", "output": "YES", "explanation": "All vital signs were measured including blood pressure, heart rate, temperature, and respiratory rate.", "line_nums": [], "lines": []},
            {"section_title": "Section 7: Physical Examination", "criteria": "Did the HCP perform cardiovascular examination?", "output": "YES", "explanation": "Comprehensive cardiovascular exam including inspection, palpation, and auscultation was performed.", "line_nums": [], "lines": []},
            {"section_title": "Section 7: Physical Examination", "criteria": "Did the HCP perform respiratory examination?", "output": "YES", "explanation": "Thorough respiratory examination including inspection, palpation, percussion, and auscultation.", "line_nums": [], "lines": []},
            {"section_title": "Section 7: Physical Examination", "criteria": "Did the HCP perform abdominal examination?", "output": "YES", "explanation": "Complete abdominal exam in proper order: inspection, auscultation, percussion, and palpation.", "line_nums": [], "lines": []},
            {"section_title": "Section 7: Physical Examination", "criteria": "Did the HCP perform neurological examination?", "output": "YES", "explanation": "Appropriate neurological examination including cranial nerves, motor, sensory, and reflexes.", "line_nums": [], "lines": []},
            {"section_title": "Section 7: Physical Examination", "criteria": "Did the HCP perform musculoskeletal examination?", "output": "YES", "explanation": "Relevant musculoskeletal examination with attention to range of motion and strength.", "line_nums": [], "lines": []},

            {"section_title": "Section 8: Diagnostic Reasoning", "criteria": "Did the HCP develop a differential diagnosis?", "output": "YES", "explanation": "The HCP developed a comprehensive differential diagnosis with multiple possibilities ranked by likelihood.", "line_nums": [], "lines": []},
            {"section_title": "Section 8: Diagnostic Reasoning", "criteria": "Did the HCP explain reasoning for each diagnosis?", "output": "YES", "explanation": "Clear rationale provided for including each condition in the differential.", "line_nums": [], "lines": []},
            {"section_title": "Section 8: Diagnostic Reasoning", "criteria": "Did the HCP consider serious/life-threatening conditions?", "output": "YES", "explanation": "Appropriate consideration of urgent conditions that require immediate attention or rule-out.", "line_nums": [], "lines": []},
            {"section_title": "Section 8: Diagnostic Reasoning", "criteria": "Did the HCP use evidence-based reasoning?", "output": "YES", "explanation": "Diagnostic reasoning was based on evidence and clinical guidelines.", "line_nums": [], "lines": []},

            {"section_title": "Section 9: Diagnostic Plan", "criteria": "Did the HCP order appropriate laboratory tests?", "output": "YES", "explanation": "Relevant laboratory tests ordered based on differential diagnosis and clinical presentation.", "line_nums": [], "lines": []},
            {"section_title": "Section 9: Diagnostic Plan", "criteria": "Did the HCP order appropriate imaging studies?", "output": "YES", "explanation": "Imaging studies selected appropriately with consideration of risks and benefits.", "line_nums": [], "lines": []},
            {"section_title": "Section 9: Diagnostic Plan", "criteria": "Did the HCP explain reasons for each test?", "output": "YES", "explanation": "Clear explanation provided for why each test was ordered and what information it would provide.", "line_nums": [], "lines": []},
            {"section_title": "Section 9: Diagnostic Plan", "criteria": "Did the HCP consider cost-effectiveness?", "output": "NO", "explanation": "Limited discussion of cost considerations and whether less expensive alternatives could provide similar information.", "line_nums": [], "lines": []},

            {"section_title": "Section 10: Treatment Plan", "criteria": "Did the HCP discuss treatment options?", "output": "YES", "explanation": "Multiple treatment options discussed including pharmacologic and non-pharmacologic approaches.", "line_nums": [], "lines": []},
            {"section_title": "Section 10: Treatment Plan", "criteria": "Did the HCP involve patient in decision-making?", "output": "YES", "explanation": "Shared decision-making approach used, incorporating patient preferences and values.", "line_nums": [], "lines": []},
            {"section_title": "Section 10: Treatment Plan", "criteria": "Did the HCP discuss risks and benefits?", "output": "YES", "explanation": "Thorough discussion of potential risks and benefits of each treatment option.", "line_nums": [], "lines": []},
            {"section_title": "Section 10: Treatment Plan", "criteria": "Did the HCP provide clear instructions?", "output": "YES", "explanation": "Clear, specific instructions provided including dosing, timing, and duration of treatment.", "line_nums": [], "lines": []},
            {"section_title": "Section 10: Treatment Plan", "criteria": "Did the HCP discuss follow-up?", "output": "YES", "explanation": "Clear follow-up plan established with specific timeframes and conditions requiring earlier return.", "line_nums": [], "lines": []},

            {"section_title": "Section 11: Patient Education", "criteria": "Did the HCP explain the diagnosis in lay terms?", "output": "YES", "explanation": "Diagnosis explained in patient-friendly language while maintaining accuracy.", "line_nums": [], "lines": []},
            {"section_title": "Section 11: Patient Education", "criteria": "Did the HCP discuss prognosis?", "output": "YES", "explanation": "Realistic discussion of expected outcomes and timeline for recovery.", "line_nums": [], "lines": []},
            {"section_title": "Section 11: Patient Education", "criteria": "Did the HCP provide lifestyle recommendations?", "output": "YES", "explanation": "Appropriate lifestyle modifications discussed including diet, exercise, and activity restrictions.", "line_nums": [], "lines": []},
            {"section_title": "Section 11: Patient Education", "criteria": "Did the HCP check patient understanding?", "output": "YES", "explanation": "Used teach-back method to verify patient comprehension of key points.", "line_nums": [], "lines": []},
            {"section_title": "Section 11: Patient Education", "criteria": "Did the HCP provide written materials?", "output": "NO", "explanation": "No written materials or resources provided to reinforce verbal education.", "line_nums": [], "lines": []},

            {"section_title": "Section 12: Safety and Prevention", "criteria": "Did the HCP discuss red flag symptoms?", "output": "YES", "explanation": "Clear explanation of warning signs that would require immediate medical attention.", "line_nums": [], "lines": []},
            {"section_title": "Section 12: Safety and Prevention", "criteria": "Did the HCP discuss preventive measures?", "output": "YES", "explanation": "Appropriate preventive strategies discussed to reduce risk of recurrence.", "line_nums": [], "lines": []},
            {"section_title": "Section 12: Safety and Prevention", "criteria": "Did the HCP discuss health maintenance?", "output": "YES", "explanation": "Addressed relevant health maintenance issues including screening recommendations.", "line_nums": [], "lines": []},
        ]

        # Create sample reports - generate 30 reports for pagination testing
        chief_complaints = ["Chest Pain", "Abdominal Pain", "Headache", "Back Pain", "Shortness of Breath",
                           "Dizziness", "Cough", "Fever", "Fatigue", "Knee Pain"]
        hcp_names = ["Dr. Jane Smith", "Dr. Alex Johnson", "Dr. Maria Garcia", "Dr. James Wilson",
                    "Dr. Emily Chen", "Dr. Robert Taylor", "Dr. Lisa Anderson", "Dr. David Lee"]
        supervisors = ["Dr. John Doe", "Dr. Sarah Williams", "Dr. Michael Brown", "Dr. Jennifer Davis"]
        locations = ["University Hospital", "Community Clinic", "Teaching Hospital", "Regional Medical Center"]
        ai_models = ["gpt-4o", "gpt-4o-mini", "gpt-4"]
        hcp_years = ["MS1", "MS2", "MS3", "MS4"]

        test_reports = []

        for i in range(1, 31):  # Create 30 reports
            # Vary the scores for realistic data
            base_score = 60 + (i * 1.2) % 35  # Scores between 60-95

            report = {
                "report_name": f"Test Report {i} - {chief_complaints[i % len(chief_complaints)]}",
                "report_type": "standalone",
                "status": "completed",
                "ai_model": ai_models[i % len(ai_models)],
                "hcp_name": hcp_names[i % len(hcp_names)],
                "hcp_year": hcp_years[i % len(hcp_years)],
                "patient_id": f"PT-{i:03d}",
                "interview_date": f"2024-{(i % 12) + 1:02d}-{(i % 28) + 1:02d}",
                "human_supervisor": supervisors[i % len(supervisors)],
                "aispe_location": locations[i % len(locations)],
                "total_points_earned": round(base_score, 1),
                "total_points_possible": 100.0,
                "percentage_score": round(base_score, 1),
                "information_section_score": round(base_score + (i % 5), 1),
                "skill_section_score": round(base_score - (i % 3), 1),
                "medical_terminology_score": round(base_score + (i % 7), 1),
                "politeness_score": round(base_score + (i % 4), 1),
                "empathy_score": round(base_score - (i % 6), 1),
                "unacceptable_areas": [] if base_score >= 80 else ["Needs improvement in patient-centered care"],
                "improvement_areas": [
                    f"Area {j+1} for improvement" for j in range((i % 3) + 1)
                ],
                "section_summaries": {
                    "information": f"Information gathering {'excellent' if base_score >= 85 else 'good' if base_score >= 75 else 'adequate'}",
                    "skills": f"Communication skills {'outstanding' if base_score >= 85 else 'good' if base_score >= 75 else 'need development'}",
                    "overall": f"Overall performance {'exemplary' if base_score >= 85 else 'solid' if base_score >= 75 else 'shows potential'}"
                },
                "rubric_detail": sample_rubric_detail
            }
            test_reports.append(report)

        # Insert reports
        for report_data in test_reports:
            report = AIMHEIReport(**report_data)
            db.add(report)

        db.commit()
        print(f"✓ Successfully seeded {len(test_reports)} test reports")

    except Exception as e:
        print(f"✗ Error seeding test data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import sys
    force = "--force" in sys.argv
    seed_test_reports(force=force)
