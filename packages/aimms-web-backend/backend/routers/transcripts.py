from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
import os
import json
import uuid
import asyncio
from io import BytesIO
from datetime import datetime
from pathlib import Path
from typing import Optional
import redis

from ..AIMHEI.AIMHEI import AIMHEI
from ..database import get_db
from .. import crud, schemas, models
from ..tasks import process_aimhei_transcript, get_job_status, JobStatus
from ..celery_app import celery_app

router = APIRouter(
    prefix="/api/transcripts",
    tags=["transcripts"],
    responses={404: {"description": "Not found"}},
)

UPLOAD_FOLDER = 'uploads/transcripts'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Redis client for job status tracking
redis_url = os.getenv("REDIS_URL", os.getenv("REDIS_TLS_URL", "redis://localhost:6379/0"))

# Handle both redis:// and rediss:// (TLS) URLs for Heroku Redis
from urllib.parse import urlparse

# For Heroku Redis, handle SSL with self-signed certificates
import ssl

if redis_url.startswith("rediss://"):
    redis_client = redis.from_url(
        redis_url,
        ssl_cert_reqs=ssl.CERT_NONE,
        ssl_check_hostname=False
    )
else:
    redis_client = redis.from_url(redis_url)

# List of criteria that are considered unacceptable if not met
unacceptable_criteria = [
    "Did the HCP give their first name?",
    "Did the HCP give their last name?",
    "Did the HCP give their title?",
    "Did the HCP explain the purpose of their visit?",
    "Did the HCP ask or confirm the patient's first name?",
    "Did the HCP ask or confirm the patient's last name?",
    "Did the HCP ask or confirm the patient's DOB?",
    "Did the HCP ask the patient to provide a list or listing of all prescription medications they were taking?"
]

def allowed_file(filename: str, allowed_extensions: set) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def parse_rubric_data(rubric_data):
    """Parse the structured rubric data and calculate scores.
    
    Args:
        rubric_data: List of dictionaries containing rubric evaluation data
        
    Returns:
        Dictionary containing calculated scores and metrics
    """
    scores = {
        'information_section': {'yes': 0, 'no': 0},
        'skill_section': {
            'medical_terminology': {'score': 0},
            'politeness': {'score': 0},
            'empathy': {'score': 0}
        }
    }
    
    # Handle legacy string format for backwards compatibility
    if isinstance(rubric_data, str):
        return parse_legacy_rubric_string(rubric_data)
    
    # Handle new structured format (list of dictionaries)
    if not isinstance(rubric_data, list):
        print(f"WARNING: Unexpected rubric_data type: {type(rubric_data)}")
        return get_default_scores()
    
    print(f"DEBUG: Processing {len(rubric_data)} rubric items")
    
    for item in rubric_data:
        if not isinstance(item, dict):
            print(f"DEBUG: Skipping non-dict item: {type(item)}")
            continue
            
        output = item.get('output', '')
        criteria = item.get('criteria', '')
        section_title = item.get('section_title', '')
        
        # Handle skill section scoring
        if "Medical Terminology Scoring" in criteria:
            if output.startswith('Y:') and '/' in output:
                try:
                    yes_count = int(output.split('/')[0].split(':')[1])
                    no_count = int(output.split('/')[1].split(':')[1])
                    total = yes_count + no_count
                    score = (yes_count / 10) * 100 if total > 0 else 100
                    scores['skill_section']['medical_terminology']['score'] = score
                    print(f"DEBUG: Medical terminology score: {score}")
                except (ValueError, IndexError) as e:
                    print(f"DEBUG: Error parsing medical terminology: {e}")
        
        elif "Politeness Scoring" in criteria:
            if output.startswith('AVG:') and '/' in output:
                try:
                    avg = float(output.split('/')[0].split(':')[1])
                    scores['skill_section']['politeness']['score'] = avg * 10  # Scale to 100
                    print(f"DEBUG: Politeness score: {avg * 10}")
                except (ValueError, IndexError) as e:
                    print(f"DEBUG: Error parsing politeness: {e}")
        
        elif "Empathy Scoring" in criteria:
            if output.startswith('AVG:') and '/' in output:
                try:
                    avg = float(output.split('/')[0].split(':')[1])
                    scores['skill_section']['empathy']['score'] = avg * 10  # Scale to 100
                    print(f"DEBUG: Empathy score: {avg * 10}")
                except (ValueError, IndexError) as e:
                    print(f"DEBUG: Error parsing empathy: {e}")
        
        # Information section scoring (YES/NO questions)
        elif output.upper() in ['YES', 'NO'] and 'Section' in section_title:
            scores['information_section'][output.lower()] += 1
            print(f"DEBUG: {output} answer in {section_title}")
    
    # Calculate total scores
    info_yes = scores['information_section']['yes']
    info_no = scores['information_section']['no']
    info_total = info_yes + info_no
    info_score = (info_yes / info_total * 100) if info_total > 0 else 0
    
    # Calculate skill section average
    skill_scores = [
        scores['skill_section']['medical_terminology']['score'],
        scores['skill_section']['politeness']['score'],
        scores['skill_section']['empathy']['score']
    ]
    skill_score = sum(skill_scores) / len(skill_scores) if skill_scores else 0
    
    total_score = (info_score + skill_score) / 2
    
    result = {
        'total_points_earned': info_yes,
        'total_points_possible': info_total,
        'percentage_score': round(total_score, 2),
        'information_section_score': round(info_score, 2),
        'skill_section_score': round(skill_score, 2),
        'medical_terminology_score': round(scores['skill_section']['medical_terminology']['score'], 2),
        'politeness_score': round(scores['skill_section']['politeness']['score'], 2),
        'empathy_score': round(scores['skill_section']['empathy']['score'], 2)
    }
    
    print(f"DEBUG: Final scores: {result}")
    return result

def parse_legacy_rubric_string(rubric_str: str):
    """Parse legacy tab-separated rubric format for backwards compatibility."""
    scores = {
        'information_section': {'yes': 0, 'no': 0},
        'skill_section': {
            'medical_terminology': {'score': 0},
            'politeness': {'score': 0},
            'empathy': {'score': 0}
        }
    }
    
    for line in rubric_str.split('\n'):
        if not line.strip():
            continue
            
        parts = line.split('\t')
        if len(parts) < 6:
            continue
            
        output, criteria, explanation, _, _, section = parts
        
        # Handle different section types
        if "Medical Terminology Scoring" in criteria:
            if output.startswith('Y:'):
                yes_count = int(output.split('/')[0].split(':')[1])
                no_count = int(output.split('/')[1].split(':')[1])
                # Score is percentage of correct terms
                total = yes_count + no_count
                score = (yes_count / 10) * 100 if total > 0 else 100
                scores['skill_section']['medical_terminology']['score'] = score
        
        elif "Politeness Scoring" in criteria:
            if output.startswith('AVG:'):
                avg = float(output.split('/')[0].split(':')[1])
                scores['skill_section']['politeness']['score'] = avg * 10
        
        elif "Empathy Scoring" in criteria:
            if output.startswith('AVG:'):
                avg = float(output.split('/')[0].split(':')[1])
                scores['skill_section']['empathy']['score'] = avg * 10
        
        elif output.lower() in ['yes', 'no']:
            if 'Section' in section:
                scores['information_section'][output.lower()] += 1
    
    # Calculate totals
    info_yes = scores['information_section']['yes']
    info_no = scores['information_section']['no']
    info_total = info_yes + info_no
    info_score = (info_yes / info_total * 100) if info_total > 0 else 0
    
    skill_scores = [
        score for score in [
            scores['skill_section']['medical_terminology']['score'],
            scores['skill_section']['politeness']['score'],
            scores['skill_section']['empathy']['score']
        ] if score is not None
    ]
    skill_score = sum(skill_scores) / len(skill_scores) if skill_scores else 0
    
    total_score = (info_score + skill_score) / 2
    
    return {
        'total_points_earned': info_yes,
        'total_points_possible': info_total,
        'percentage_score': round(total_score, 2),
        'information_section_score': round(info_score, 2),
        'skill_section_score': round(skill_score, 2),
        'medical_terminology_score': round(scores['skill_section']['medical_terminology']['score'] or 0, 2),
        'politeness_score': round(scores['skill_section']['politeness']['score'] or 0, 2),
        'empathy_score': round(scores['skill_section']['empathy']['score'] or 0, 2)
    }

def get_default_scores():
    """Return default scores when parsing fails."""
    return {
        'total_points_earned': 0,
        'total_points_possible': 0,
        'percentage_score': 0.0,
        'information_section_score': 0.0,
        'skill_section_score': 0.0,
        'medical_terminology_score': 0.0,
        'politeness_score': 0.0,
        'empathy_score': 0.0
    }

@router.post("/submit")
async def submit_transcript(
    transcript: UploadFile = File(...),
    config: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # Validate file types
        if not allowed_file(transcript.filename, {'txt'}):
            raise HTTPException(status_code=400, detail="Invalid transcript file type")
        if not allowed_file(config.filename, {'json'}):
            raise HTTPException(status_code=400, detail="Invalid config file type")

        # Read config data
        config_content = await config.read()
        config_data = json.loads(config_content)

        # Create BytesIO object from transcript file
        transcript_content = await transcript.read()
        transcript_io = BytesIO(transcript_content)

        # Initialize AIMHEI with PDF generation skipped for faster web processing
        aimhei = AIMHEI(
            json_data=config_data,
            transcript_input=transcript_io,
            file_name=transcript.filename,
            skip_pdf=True  # Skip PDF generation for web submissions
        )

        # Process transcript
        result = await aimhei.run()

        # Parse rubric data and create database record
        rubric_data = parse_rubric_data(result['rubric'])
        
        # Create standalone AIMHEI report in database
        db_report = models.AIMHEIReport(
            session_id=None,  # Null for standalone reports
            report_type='standalone',
            # Analysis Configuration fields from frontend
            report_name=config_data.get('report_name'),
            ai_model=config_data.get('model'),
            hcp_name=config_data.get('HCP_name'),
            hcp_year=str(config_data.get('HCP_year')) if config_data.get('HCP_year') else None,
            patient_id=config_data.get('patient_ID'),
            interview_date=config_data.get('interview_date'),
            human_supervisor=config_data.get('human_supervisor'),
            aispe_location=config_data.get('aispe_location'),
            status=schemas.AIMHEIStatus.COMPLETED,
            total_points_earned=rubric_data['total_points_earned'],
            total_points_possible=rubric_data['total_points_possible'],
            percentage_score=rubric_data['percentage_score'],
            information_section_score=rubric_data['information_section_score'],
            skill_section_score=rubric_data['skill_section_score'],
            medical_terminology_score=rubric_data['medical_terminology_score'],
            politeness_score=rubric_data['politeness_score'],
            empathy_score=rubric_data['empathy_score']
        )
        
        # Extract areas and summaries from structured rubric data
        unacceptable_areas = []
        improvement_areas = []
        section_summaries = {}
        
        if isinstance(result['rubric'], list):
            # New structured format
            for item in result['rubric']:
                if not isinstance(item, dict):
                    continue
                    
                output = item.get('output', '')
                criteria = item.get('criteria', '')
                section_title = item.get('section_title', '')
                
                # Track NO answers for improvement areas
                if output.upper() == 'NO':
                    improvement_areas.append(criteria)
                    # You can add logic here to determine unacceptable_criteria if needed
                
                # Build section summaries
                if 'Section' in section_title and output.upper() in ['YES', 'NO']:
                    if section_title not in section_summaries:
                        section_summaries[section_title] = {'yes': 0, 'no': 0}
                    section_summaries[section_title][output.lower()] += 1
        else:
            # Legacy string format fallback
            rubric_lines = result['rubric'].split('\n') if isinstance(result['rubric'], str) else []
            
            for line in rubric_lines:
                if not line.strip():
                    continue
                parts = line.split('\t')
                if len(parts) >= 6:
                    output, criteria, explanation, _, _, section = parts
                    if output.lower() == 'no':
                        improvement_areas.append(criteria)
                    
                    if 'Section' in section:
                        if section not in section_summaries:
                            section_summaries[section] = {'yes': 0, 'no': 0}
                        if output.lower() in ['yes', 'no']:
                            section_summaries[section][output.lower()] += 1

        db_report.unacceptable_areas = unacceptable_areas
        db_report.improvement_areas = improvement_areas
        db_report.section_summaries = section_summaries
        
        # Add rubric detail JSON if available
        if aimhei.reported:
            try:
                rubric_json_data = aimhei.reported.generate_rubric_json()
                db_report.rubric_detail = rubric_json_data
            except Exception as e:
                print(f"Error generating rubric_detail JSON: {e}")
        
        # Save to database
        db.add(db_report)
        db.commit()
        db.refresh(db_report)

        return JSONResponse(content={
            'success': True,
            'report_id': db_report.id,
            'result': {
                'rubric': result.get('rubric', ''),
                # Note: aimhei_report is None since skip_pdf=True for web submissions
                # To enable PDF: set skip_pdf=False and convert to base64: base64.b64encode(result['aimhei_report']).decode('utf-8')
            }
        })

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process transcript: {str(e)}"
        )

@router.post("/submit-async")
async def submit_transcript_async(
    transcript: UploadFile = File(...),
    config: UploadFile = File(...),
    criteria: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    Submit transcript for async processing via Celery job queue
    Returns job_id immediately for tracking progress

    Parameters:
    - transcript: Required .txt file containing the interview transcript
    - config: Required .json file with analysis configuration
    - criteria: Optional .json file with custom scoring criteria (overrides default)
    """
    try:
        # Validate file types
        if not allowed_file(transcript.filename, {'txt'}):
            raise HTTPException(status_code=400, detail="Invalid transcript file type")
        if not allowed_file(config.filename, {'json'}):
            raise HTTPException(status_code=400, detail="Invalid config file type")

        # Validate criteria file if provided
        if criteria and not allowed_file(criteria.filename, {'json'}):
            raise HTTPException(status_code=400, detail="Invalid criteria file type - must be JSON")

        # Read files
        transcript_content = await transcript.read()
        config_content = await config.read()

        # Read and validate custom criteria if provided
        custom_criteria_data = None
        if criteria:
            criteria_content = await criteria.read()
            try:
                custom_criteria_data = json.loads(criteria_content)

                # Basic validation - check for required sections
                required_sections = ["Information Section", "Skill Section"]
                for section in required_sections:
                    if section not in custom_criteria_data:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid criteria file: missing required section '{section}'"
                        )

                print(f"✅ Custom criteria validated successfully (sections: {list(custom_criteria_data.keys())})")
            except json.JSONDecodeError as e:
                print(f"❌ JSON decode error: {str(e)}")
                raise HTTPException(status_code=400, detail="Invalid criteria file - must be valid JSON")
            except Exception as e:
                print(f"❌ Unexpected error reading criteria: {str(e)}")
                raise

        # Parse config
        config_data = json.loads(config_content)
        
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Extract user ID from request if available (you may need to modify this based on your auth system)
        user_id = None  # TODO: Extract from authenticated user
        
        # IMPORTANT: Set initial job status BEFORE submitting to prevent race condition
        from ..tasks import update_job_status, JobStatus
        update_job_status(job_id, JobStatus.PENDING, 0, "Job queued for processing...")
        
        # If custom criteria provided, store it temporarily in Redis with job_id
        # This avoids Celery serialization issues with large nested dicts
        if custom_criteria_data:
            from backend.tasks import redis_client
            import json as json_module
            criteria_key = f"job:{job_id}:criteria"
            redis_client.setex(
                criteria_key,
                3600,  # Expire after 1 hour
                json_module.dumps(custom_criteria_data)
            )
            print(f"✅ Stored custom criteria in Redis: {criteria_key}")

        # Submit job to Celery (use positional args to avoid conflicts with bind=True)
        # Pass job_id and a flag indicating if custom criteria exists (stored in Redis)
        task = process_aimhei_transcript.delay(
            job_id,  # positional argument
            transcript_content.decode('utf-8'),  # positional argument
            config_data,  # positional argument
            transcript.filename,  # positional argument
            user_id,  # positional argument
            bool(custom_criteria_data)  # positional argument - flag indicating custom criteria in Redis
        )
        
        return JSONResponse(content={
            'success': True,
            'job_id': job_id,
            'task_id': task.id,
            'status': 'pending',
            'message': 'Transcript submitted for processing'
        })
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit transcript for processing: {str(e)}"
        )

@router.get("/jobs/{job_id}/status")
async def get_job_status_endpoint(job_id: str):
    """
    Get the current status of a processing job
    """
    try:
        job_status = get_job_status(job_id)
        
        if not job_status:
            raise HTTPException(
                status_code=404,
                detail="Job not found or expired"
            )
        
        return JSONResponse(content=job_status)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get job status: {str(e)}"
        )

@router.get("/jobs/{job_id}/result")
async def get_job_result(job_id: str):
    """
    Get the result of a completed job
    """
    try:
        # First check job status
        job_status = get_job_status(job_id)
        
        if not job_status:
            raise HTTPException(
                status_code=404,
                detail="Job not found or expired"
            )
        
        if job_status['status'] != JobStatus.COMPLETED:
            raise HTTPException(
                status_code=400,
                detail=f"Job not completed yet. Current status: {job_status['status']}"
            )
        
        # Get result from Redis
        result_data = redis_client.get(f"job_result:{job_id}")
        
        if not result_data:
            raise HTTPException(
                status_code=404,
                detail="Job result not found or expired"
            )
        
        result = json.loads(result_data)
        
        return JSONResponse(content={
            'success': True,
            'job_id': job_id,
            'result': result
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get job result: {str(e)}"
        )

@router.get("/jobs/{job_id}/events")
async def get_job_events(job_id: str):
    """
    Server-Sent Events endpoint for real-time job progress updates
    """
    
    # Funny messages for ping events to keep users entertained
    funny_messages = [
        "🤖 Teaching the AI about bedside manner...",
        "📚 Cross-referencing medical dictionaries...",
        "🔍 Counting 'ums' and 'ahs' in the transcript...",
        "🏥 Consulting with virtual Dr. House...",
        "📝 Double-checking if anyone asked about allergies...",
        "🎭 Analyzing empathy levels with extreme precision...",
        "🔬 Running transcript through the politeness-o-meter...",
        "📊 Converting 'hmm's into quantifiable data...",
        "🧠 Teaching AI the difference between 'How are you?' and medical history...",
        "⚡ Caffeinating the neural networks...",
        "🎯 Calculating optimal bedside manner scores...",
        "📋 Checking if patient was asked their name 47 times...",
        "🕵️ Investigating suspicious levels of politeness...",
        "🎪 Balancing empathy scores on a tightrope...",
        "🔮 Predicting future medical interview success...",
        "🎨 Painting a portrait of communication skills...",
        "🎵 Listening for the rhythm of good rapport...",
        "🧐 Scrutinizing every 'please' and 'thank you'...",
        "🎲 Rolling dice for random encouragement points...",
        "🏆 Comparing to legendary medical interviews...",
        "🌟 Sprinkling some AI magic dust...",
        "🔧 Fine-tuning the conversation analysis engine...",
        "📡 Downloading latest bedside manner protocols...",
        "🎈 Inflating confidence scores appropriately...",
        "🎪 Juggling multiple scoring criteria simultaneously...",
        "🚀 Launching empathy detection algorithms...",
        "🎯 Aiming for the perfect feedback balance...",
        "🔍 Searching for hidden gems in the dialogue...",
        "📈 Graphing the trajectory of professional growth...",
        "🎭 Rehearsing constructive feedback delivery...",
        "🌊 Riding the waves of natural conversation flow...",
        "🎪 Performing semantic analysis acrobatics...",
        "🔬 Examining communication under a microscope...",
        "🎨 Crafting the masterpiece of medical feedback...",
        "⚡ Charging up the encouragement generators...",
        # NEW FUNNY MESSAGES - Adding tons more variety!
        "🎼 Composing a symphony of constructive criticism...",
        "🦸 Summoning the superhero squad of medical mentors...",
        "🎳 Bowling strikes with precision feedback delivery...",
        "🍔 Assembling the perfect feedback sandwich...",
        "🎪 Training circus seals to balance empathy scores...",
        "🧙 Casting spells to enhance communication clarity...",
        "🎢 Riding the roller coaster of emotional intelligence...",
        "🏄 Surfing the waves of professional development...",
        "🎯 Playing darts with dartboard-shaped rubrics...",
        "🎪 Teaching elephants to remember patient names...",
        "🎨 Finger-painting with liquid encouragement...",
        "🎭 Auditioning for the role of 'Constructive Critic'...",
        "🚁 Flying helicopter missions over conversation landscapes...",
        "🎪 Taming lions to purr with perfect politeness...",
        "🎨 Sculpting Mount Rushmore of medical communication...",
        "🎵 Conducting the orchestra of interpersonal skills...",
        "🎪 Juggling flaming torches of tough love feedback...",
        "🎢 Building roller coasters from pure motivation...",
        "🎯 Archery practice with arrows of insight...",
        "🎪 Teaching penguins to waddle with empathy...",
        "🎨 Painting rainbows with tears of constructive joy...",
        "🎭 Method acting as the ghost of feedback past...",
        "🎪 Balancing pineapples on noses for no reason...",
        "🚂 Conducting the train to Improvement Station...",
        "🎨 Mixing paint colors that don't exist yet...",
        "🎪 Convincing gravity to work sideways temporarily...",
        "🎭 Practicing mime techniques for silent encouragement...",
        "🎢 Installing safety nets made of pure optimism...",
        "🎯 Calibrating truth-seeking missiles of kindness...",
        "🎪 Teaching time itself to be more patient...",
        "🎨 Inventing new emotions specifically for this analysis...",
        "🎭 Rehearsing standing ovations for moderate improvements...",
        "🚀 Launching satellites to beam down wisdom rays...",
        "🎪 Negotiating peace treaties between honesty and kindness...",
        "🎨 Building bridges out of crystallized good intentions...",
        "🎭 Perfecting the art of enthusiastic slow clapping...",
        "🎢 Engineering happiness amplifiers for difficult feedback...",
        "🎯 Calculating the exact temperature of lukewarm praise...",
        "🎪 Training quantum particles to dance in formation...",
        "🎨 Weaving tapestries from threads of pure motivation...",
        "🎭 Inventing interpretive dance moves for 'room for improvement'...",
        "🚂 Building underground tunnels to the land of Better Communication...",
        "🎪 Teaching clouds to rain specific types of encouragement..."
    ]
    
    # Special messages for the long modeling/AI analysis phase
    modeling_messages = [
        "🧠 Deep-diving into conversational AI analysis...",
        "🔬 Running advanced empathy detection algorithms...",
        "🎯 Calculating precision politeness metrics...",
        "📊 Processing 47 different communication patterns...",
        "🤖 Having a philosophical debate with GPT about bedside manner...",
        "🧮 Crunching numbers faster than a medical calculator...",
        "🔍 Analyzing every pause, every 'um,' every 'well...'",
        "🎭 Teaching AI the subtle art of medical interviewing...",
        "⚡ Supercharging neural networks with medical wisdom...",
        "🏥 Consulting the virtual medical interview hall of fame...",
        "📝 Cross-referencing with 10,000 previous interviews...",
        "🎪 Performing linguistic gymnastics at light speed...",
        "🔮 Peering into the crystal ball of communication skills...",
        "🧠 Training AI to recognize good vibes and rapport...",
        "📚 Speed-reading every medical communication textbook...",
        "🎵 Analyzing the musical rhythm of doctor-patient dialogue...",
        "🔬 Putting conversation skills under the AI microscope...",
        "⚗️ Brewing the perfect feedback formula...",
        "🎯 Targeting areas for improvement with laser precision...",
        "🧐 Scrutinizing transcript with Sherlock Holmes intensity...",
        "💫 Channeling the spirits of great medical mentors...",
        "🎨 Painting a detailed portrait of communication mastery...",
        "🔧 Fine-tuning the delicate machinery of feedback...",
        "🚀 Launching into hyperdrive analysis mode...",
        "🧪 Mixing the perfect cocktail of constructive criticism...",
        "🎭 Rehearsing feedback delivery for maximum impact...",
        "⚡ Downloading wisdom from the medical interview cloud...",
        "🔍 Hunting for those elusive 'aha!' teaching moments...",
        "🎪 Balancing honesty and encouragement on a tightrope...",
        "🧠 Teaching AI the difference between 'good' and 'great'...",
        # NEW MODELING-SPECIFIC MESSAGES - Even more AI analysis humor!
        "🤖 Convincing GPT that small talk actually matters...",
        "🧠 Installing empathy.exe on the neural networks...",
        "🔬 Measuring the exact molecular weight of compassion...",
        "🎯 Calibrating the sensitivity settings on the kindness detector...",
        "📊 Running Monte Carlo simulations on 'How are you today?'...",
        "🧮 Computing the algorithmic complexity of active listening...",
        "🎭 Teaching transformer models to transform into therapists...",
        "⚡ Overclocking the processors responsible for understanding feelings...",
        "🔍 Debugging the infinite loop in the 'being genuinely interested' subroutine...",
        "🎪 Organizing a conference between neural networks about conversation ethics...",
        "🧠 Installing patches to fix the 'interrupting patient' bug...",
        "🔬 Conducting controlled experiments on the half-life of rapport...",
        "📈 Graphing the exponential decay of awkward silences...",
        "🎯 Training sniper rifles of precision feedback...",
        "🧪 Synthesizing artificial emotional intelligence from scratch...",
        "🔧 Adjusting the torque specifications on conversation flow...",
        "🎭 Method acting as a Large Language Model having an existential crisis...",
        "⚗️ Distilling pure essence of 'therapeutic communication'...",
        "🚀 Launching probes into the dark matter of unspoken empathy...",
        "🧠 Teaching quantum computers to feel quantum feelings...",
        "🔬 Peer-reviewing the AI's doctoral thesis on bedside manner...",
        "📊 Running regression analysis on the correlation between eye contact and trust...",
        "🎯 Fine-tuning the hyperparameters of human connection...",
        "🧮 Solving differential equations for optimal conversation pacing...",
        "🎪 Organizing a TED talk for artificial intelligence about authentic listening...",
        "🔍 Conducting forensic analysis on the crime scene of missed emotional cues...",
        "⚡ Installing turbo boosters on the compassion processing unit...",
        "🧠 Teaching machine learning that sometimes silence is the best response...",
        "🔬 Measuring the bandwidth required to transmit genuine concern...",
        "🎭 Holding auditions for the role of 'Most Helpful AI Assistant'...",
        "📈 Calculating the return on investment for therapeutic validation...",
        "🎯 Precision-engineering the delivery mechanism for difficult truths...",
        "🧪 Fermenting aged wisdom in temperature-controlled feedback chambers...",
        "🚀 Establishing communication protocols with the International Space Station of Empathy...",
        "🧠 Debugging the memory leak in the 'remembering patient preferences' module...",
        "🔬 Studying the aerodynamics of words that heal vs. words that hurt...",
        "⚡ Reverse-engineering the source code of legendary bedside manner...",
        "🎪 Mediating peace negotiations between Logic and Emotion departments...",
        "🧮 Calculating the statistical significance of saying 'I understand how you feel'...",
        "🔍 Archaeological excavation of buried communication gold in transcript layers...",
        "🎭 Rehearsing Oscar-worthy performances of 'Genuinely Caring About Strangers'...",
        "📊 Building machine learning models trained exclusively on Mr. Rogers footage...",
        "🎯 Engineering smart bombs that explode into clouds of validation and support...",
        "🧠 Installing additional RAM in the 'remembering to ask follow-up questions' sector..."
    ]
    
    # Import here to avoid circular imports
    import random
    
    async def event_generator():
        """Generate Server-Sent Events for job progress"""
        try:
            # Create Redis pub/sub connection
            pubsub = redis_client.pubsub()
            channel = f"job_progress:{job_id}"
            pubsub.subscribe(channel)
            
            # Send initial status
            initial_status = get_job_status(job_id)
            if initial_status:
                yield f"data: {json.dumps(initial_status)}\n\n"
            else:
                yield f"data: {json.dumps({'error': 'Job not found'})}\n\n"
                return
            
            # Listen for updates
            timeout_counter = 0
            max_timeout = 300
            ping_counter = 0  # Track how many pings we've sent
            
            while timeout_counter < max_timeout:
                try:
                    message = pubsub.get_message(timeout=1)
                    
                    if message and message['type'] == 'message':
                        # Reset timeout counter on receiving message
                        timeout_counter = 0
                        ping_counter = 0  # Reset ping counter on real message
                        
                        # Parse and send the message
                        try:
                            data = json.loads(message['data'])
                            yield f"data: {json.dumps(data)}\n\n"
                            
                            # End stream if job is completed or failed
                            if data.get('status') in [JobStatus.COMPLETED, JobStatus.FAILED]:
                                break
                                
                        except json.JSONDecodeError:
                            continue
                    else:
                        # No message received, increment timeout
                        timeout_counter += 1
                        
                        # Get current job status to determine progress stage
                        current_status = get_job_status(job_id)
                        should_ping = False
                        ping_frequency = 5  # Default: every 3 seconds
                        
                        if current_status and current_status.get('status') == JobStatus.PROCESSING:
                            current_progress = current_status.get('progress', 0)
                            
                            # SPECIAL HANDLING for modeling stage (30-60%) - this is the long wait!
                            if current_progress >= 30 and current_progress < 60:
                                ping_frequency = 5  # Every 5 seconds during modeling (was 1 - too aggressive)
                            else:
                                ping_frequency = 8  # Every 8 seconds for other stages
                        
                        # Check if we should send a ping based on the frequency
                        if timeout_counter % ping_frequency == 0:
                            ping_counter += 1
                            
                            if current_status and current_status.get('status') == JobStatus.PROCESSING:
                                current_progress = current_status.get('progress', 0)
                                
                                # Calculate incremental progress based on current stage
                                # SPECIAL HANDLING for modeling stage (30-60%) - this is the long wait!
                                if current_progress >= 30 and current_progress < 60:
                                    # MODELING STAGE: More aggressive updates during the long wait
                                    progress_increment = 4.9  # Much larger increments
                                    max_progress = 59
                                    stage = 'modeling'
                                # elif current_progress < 10:
                                #     # Early stage: slow increment
                                #     progress_increment = 0.5
                                #     max_progress = 9
                                #     stage = 'starting'
                                elif current_progress < 30:
                                    # Preparing stage: medium increment  
                                    progress_increment = 0.9
                                    max_progress = 29
                                    stage = 'preparing'
                                # elif current_progress < 80:
                                #     # Generating reports: medium increment
                                #     progress_increment = 0.4
                                #     max_progress = 79
                                #     stage = 'generating'
                                # else:
                                #     # Final stage: faster increment
                                #     progress_increment = 0.6
                                #     max_progress = 99
                                #     stage = 'finishing'
                                
                                new_progress = min(current_progress + progress_increment, max_progress)
                                
                                # Pick a random funny message (use special modeling messages during AI analysis)
                                if stage == 'modeling':
                                    funny_message = random.choice(modeling_messages)
                                else:
                                    funny_message = random.choice(funny_messages)
                                
                                # Create enhanced ping with progress and funny message
                                ping_data = {
                                    'type': 'ping',
                                    'job_id': job_id,
                                    'status': JobStatus.PROCESSING,
                                    'progress': round(new_progress, 1),
                                    'message': funny_message,
                                    'updated_at': datetime.utcnow().isoformat(),
                                    'ping_count': ping_counter,
                                    'stage': stage,
                                    'ping_frequency': f'every_{ping_frequency}_seconds'
                                }
                                
                                # Update Redis with new progress
                                redis_client.setex(f"job:{job_id}", 3600, json.dumps(ping_data))
                                
                                yield f"data: {json.dumps(ping_data)}\n\n"
                            else:
                                # Job not processing, send basic ping
                                basic_ping = {
                                    'type': 'ping',
                                    'message': random.choice(funny_messages),
                                    'ping_count': ping_counter
                                }
                                yield f"data: {json.dumps(basic_ping)}\n\n"
                            
                except Exception as e:
                    yield f"data: {json.dumps({'error': str(e)})}\n\n"
                    break
                    
        except Exception as e:
            yield f"data: {json.dumps({'error': f'SSE error: {str(e)}'})}\n\n"
        finally:
            try:
                pubsub.close()
            except:
                pass
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control"
        }
    )

@router.post("/submit-virtual-patient", response_model=schemas.TranscriptResponse)
async def submit_virtual_patient_transcript(
    request: schemas.SubmitVirtualPatientRequest,
    db: Session = Depends(get_db)
):
    """
    Receives transcript from Virtual Patient, runs AIMHEI analysis,
    and stores the results linked to the virtual patient session.
    """
    
    db_report = None
    temp_file = None
    try:
        # Validate request
        if not request.conversation:
            raise HTTPException(
                status_code=400,
                detail="Conversation cannot be empty"
            )
        
        # Check if conversation has enough content for analysis
        # Filter out system/welcome messages to count actual exchanges
        user_messages = [msg for msg in request.conversation if msg.sender == 'user']
        bot_messages = [msg for msg in request.conversation if msg.sender == 'bot' and not msg.text.startswith('Welcome')]
        
        if len(user_messages) < 1:
            raise HTTPException(
                status_code=400,
                detail=f"Conversation must contain at least one user message for analysis. This appears to be just a welcome message without any actual interaction."
            )
        
        if len(bot_messages) < 1:
            raise HTTPException(
                status_code=400,
                detail=f"Conversation lacks patient responses for analysis. Found {len(bot_messages)} non-welcome patient messages, but need at least 1 for analysis."
            )

        # Find the virtual patient session
        vp_session = db.query(models.VirtualPatientSession).filter(
            models.VirtualPatientSession.session_id == request.session_id
        ).first()
        
        # Verify session ownership if user_id is provided in request
        if vp_session and hasattr(request, 'user_id') and request.user_id:
            if vp_session.user_id != request.user_id:
                raise HTTPException(
                    status_code=403,
                    detail=f"Session {request.session_id} does not belong to the specified user"
                )
        
        # If session doesn't exist, this is likely an error - sessions should be created during launch
        if not vp_session:
            raise HTTPException(
                status_code=404,
                detail=f"Virtual patient session not found: {request.session_id}. Sessions must be created during launch, not during transcript submission."
            )


        # Check if a report already exists for this session
        existing_report = db.query(models.AIMHEIReport).filter(
            models.AIMHEIReport.session_id == vp_session.id
        ).first()
        
        if existing_report:
            # Allow retry for ERROR status reports, but return existing COMPLETED reports
            if existing_report.status == schemas.AIMHEIStatus.ERROR:
                print(f"Found existing ERROR report {existing_report.id}, allowing retry...")
                # Delete the error report to allow a fresh attempt
                db.delete(existing_report)
                db.commit()
            else:
                # Return successful reports instead of creating duplicates
                return schemas.TranscriptResponse(
                    success=True,
                    report_id=existing_report.id,
                    status=existing_report.status,
                    message="Report already exists for this session"
                )
        # Create a new AIMHEI report record
        db_report = models.AIMHEIReport(
            session_id=vp_session.id,  # Link to VP session using the database ID
            status=schemas.AIMHEIStatus.ACTIVE
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)

        # OPTIMISTIC COMPLETION: Update case assignment to pending_review immediately
        # This gives users immediate feedback that their submission was received
        case_assignment = None
        try:
            # Use assignment_id directly from the session for precise assignment targeting
            case_assignment = db.query(models.CaseAssignment).filter(
                models.CaseAssignment.id == vp_session.assignment_id,
                models.CaseAssignment.status.in_(["not_started", "in_progress"])
            ).first()
            
            if case_assignment:
                case_assignment.report_id = db_report.id
                case_assignment.status = "pending_review"
                db.commit()
                print(f"Optimistically updated case assignment {case_assignment.id}: linked report {db_report.id}, status -> pending_review")
            else:
                print(f"Warning: No case assignment found for assignment_id {vp_session.assignment_id} or assignment not in valid status")
                
        except Exception as e:
            print(f"Error updating case assignment optimistically: {e}")
            # Continue anyway - the analysis can still proceed

        # Convert conversation to transcript format
        transcript_lines = []
        for idx, msg in enumerate(request.conversation, 1):
            role = 'P' if msg.sender == 'bot' else 'D'
            # Remove any existing line numbers from the text
            text = msg.text.strip()
            if ': ' in text:
                text = ': '.join(text.split(': ')[1:])
            line = f"{idx}: {role}: {text}"
            transcript_lines.append(line)
        
        # Basic transcript validation - ensure we have some content
        if len(transcript_lines) < 2:  # At least welcome + 1 exchange
            raise HTTPException(
                status_code=400,
                detail=f"Transcript too short: {len(transcript_lines)} lines. Need at least a basic conversation exchange."
            )

        # Create a temporary file with the transcript
        temp_file = Path("temp_transcript.txt")
        temp_file.write_text('\n'.join(transcript_lines))

        # Format dates consistently - Use current date as interview date is removed from request
        interview_date = datetime.now().strftime("%Y-%m-%d")

        # Initialize AIMHEI with config using proper field names for backend
        config = {
            "formatting_process": "none",
            "model": os.getenv("OPENAI_MODEL", "gpt-4o"),
            "HCP_name": "Virtual Patient Simulation",  # Use backend field name format
            "HCP_year": datetime.now().year,           # Use backend field name format (as int)
            "patient_ID": request.patient_id or "VP_PATIENT",  # Use backend field name format
            "human_supervisor": "AI System",
            "interview_date": interview_date,
            "aispe_location": "Virtual"
        }

        # Run AIMHEI analysis
        with open(temp_file, 'rb') as f:
            transcript_io = BytesIO(f.read())

        try:
            print(f"=== AIMHEI DEBUG ===")
            print(f"Config: {config}")
            print(f"Temp file contents:")
            temp_file_contents = temp_file.read_text()
            print(temp_file_contents)
            print(f"Temp file lines: {temp_file_contents.split(chr(10))}")
            print(f"Starting AIMHEI analysis...")
            
            aimhei = AIMHEI(
                json_data=config,
                transcript_input=transcript_io, 
                file_name="virtual_patient_transcript.txt",
                is_test_mode=False,
                skip_pdf=True  # Skip PDF generation for faster virtual patient processing
            )
            
            print(f"AIMHEI object created, calling run()...")
            result = await aimhei.run()
            print(f"AIMHEI run completed successfully")
            print(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'Not a dict'}")
                
        except Exception as e:
            print(f"AIMHEI analysis exception details: {str(e)}")
            print(f"Exception type: {type(e)}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            
            # Check for specific error types and provide helpful messages
            error_msg = str(e)
            if "string indices must be integers" in error_msg:
                error_msg = "Conversation format incompatible with AIMHEI analysis. The conversation may be too short or missing required medical interaction patterns."
            elif "list index out of range" in error_msg:
                error_msg = "Conversation structure insufficient for analysis. Please ensure the conversation contains substantial medical dialogue."
            elif "Transcript too short" in error_msg:
                error_msg = "Conversation length insufficient for meaningful AIMHEI analysis."
            else:
                error_msg = f"AIMHEI analysis failed: {str(e)}"
            
            db_report.status = schemas.AIMHEIStatus.ERROR
            db.commit()
            
            # ROLLBACK: Revert case assignment back to in_progress if AIMHEI fails
            try:
                if case_assignment:
                    case_assignment.status = "in_progress"
                    case_assignment.report_id = None
                    db.commit()
                    print(f"Rolled back case assignment {case_assignment.id}: status -> in_progress, unlinked report")
            except Exception as rollback_error:
                print(f"Error rolling back case assignment: {rollback_error}")
            
            raise HTTPException(
                status_code=500,
                detail=error_msg
            )

        # Parse and assign rubric data
        try:
            rubric_data = parse_rubric_data(result['rubric'])
            db_report.total_points_earned = rubric_data['total_points_earned']
            db_report.total_points_possible = rubric_data['total_points_possible']
            db_report.percentage_score = rubric_data['percentage_score']
            db_report.information_section_score = rubric_data['information_section_score']
            db_report.skill_section_score = rubric_data['skill_section_score']
            db_report.medical_terminology_score = rubric_data['medical_terminology_score']
            db_report.politeness_score = rubric_data['politeness_score']
            db_report.empathy_score = rubric_data['empathy_score']
        except Exception as e:
            print(f"Failed to parse rubric data. Error: {str(e)}")
            print(f"Error type: {type(e)}")
            import traceback
            print(f"Full traceback: {traceback.format_exc()}")
            db_report.status = schemas.AIMHEIStatus.ERROR
            db.commit()
            
            # ROLLBACK: Revert case assignment back to in_progress
            try:
                if case_assignment:
                    case_assignment.status = "in_progress"
                    case_assignment.report_id = None
                    db.commit()
                    print(f"Rolled back case assignment {case_assignment.id}: status -> in_progress, unlinked report")
            except Exception as rollback_error:
                print(f"Error rolling back case assignment: {rollback_error}")
            
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse rubric data: {str(e)}"
            )

        # Extract areas and summaries from structured rubric data
        try:
            unacceptable_areas = []
            improvement_areas = []
            section_summaries = {}
            
            if isinstance(result['rubric'], list):
                # New structured format
                for item in result['rubric']:
                    if not isinstance(item, dict):
                        continue
                        
                    output = item.get('output', '')
                    criteria = item.get('criteria', '')
                    section_title = item.get('section_title', '')
                    
                    # Track NO answers for improvement areas
                    if output.upper() == 'NO':
                        improvement_areas.append(criteria)
                        # You can add logic here to determine unacceptable_criteria if needed
                    
                    # Build section summaries
                    if 'Section' in section_title and output.upper() in ['YES', 'NO']:
                        if section_title not in section_summaries:
                            section_summaries[section_title] = {'yes': 0, 'no': 0}
                        section_summaries[section_title][output.lower()] += 1
            else:
                # Legacy string format fallback
                rubric_lines = result['rubric'].split('\n') if isinstance(result['rubric'], str) else []
                
                for line in rubric_lines:
                    if not line.strip():
                        continue
                    parts = line.split('\t')
                    if len(parts) >= 6:
                        output, criteria, explanation, _, _, section = parts
                        if output.lower() == 'no':
                            improvement_areas.append(criteria)
                        
                        if 'Section' in section:
                            if section not in section_summaries:
                                section_summaries[section] = {'yes': 0, 'no': 0}
                            if output.lower() in ['yes', 'no']:
                                section_summaries[section][output.lower()] += 1

            db_report.unacceptable_areas = unacceptable_areas
            db_report.improvement_areas = improvement_areas
            db_report.section_summaries = section_summaries
        except Exception as e:
            db_report.status = schemas.AIMHEIStatus.ERROR
            db.commit()
            
            # ROLLBACK: Revert case assignment back to in_progress
            try:
                if case_assignment:
                    case_assignment.status = "in_progress"
                    case_assignment.report_id = None
                    db.commit()
                    print(f"Rolled back case assignment {case_assignment.id}: status -> in_progress, unlinked report")
            except Exception as rollback_error:
                print(f"Error rolling back case assignment: {rollback_error}")
            
            raise HTTPException(
                status_code=500,
                detail=f"Failed to process areas and summaries: {str(e)}"
            )

        # --- Add Rubric Detail JSON --- 
        try:
            if aimhei.reported: # Ensure the Report object exists
                rubric_json_data = aimhei.reported.generate_rubric_json()
                db_report.rubric_detail = rubric_json_data
            else:
                 # This shouldn't happen if aimhei.run() succeeded, but log if it does
                 print(f"Warning: aimhei.reported object not found after successful run for session {vp_session.id}")
        except Exception as e:
            # Log the error but don't necessarily fail the whole process
            print(f"Error generating or assigning rubric_detail JSON for report {db_report.id}: {e}")

        # Set status to COMPLETED since everything succeeded
        db_report.status = schemas.AIMHEIStatus.COMPLETED
        vp_session.status = "COMPLETED"
        
        # Case assignment was already updated optimistically - no need to update again
        print(f"AIMHEI analysis completed successfully for session {vp_session.session_id}")

        db.commit()
        db.refresh(db_report)

        return schemas.TranscriptResponse(
            success=True,
            report_id=db_report.id,
            status=db_report.status,
            message="Transcript analyzed and results stored successfully"
        )

    except HTTPException:
        raise  # Re-raise HTTP exceptions as they are already properly formatted

    except Exception as e:
        # Log the error for debugging
        print(f"Error analyzing transcript: {e}")
        if db_report:
            try:
                db_report.status = schemas.AIMHEIStatus.ERROR
                db.commit()
            except Exception as update_err:
                print(f"Failed to set status to ERROR after exception: {update_err}")
        
        # ROLLBACK: Revert case assignment back to in_progress if analysis fails
        try:
            if 'case_assignment' in locals() and case_assignment:
                case_assignment.status = "in_progress"
                case_assignment.report_id = None
                db.commit()
                print(f"Rolled back case assignment {case_assignment.id}: status -> in_progress, unlinked report")
        except Exception as rollback_error:
            print(f"Error rolling back case assignment in main exception handler: {rollback_error}")
        
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze transcript: {str(e)}"
        )

    finally:
        # Clean up temporary file
        if temp_file and temp_file.exists():
            temp_file.unlink()

@router.get("/status/{session_id}")
async def get_status(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the status and results of AIMHEI reports for a session.
    """
    reports = crud.get_aimhei_reports_by_session(db, session_id)
    if not reports:
        return JSONResponse(content={
            'session_id': session_id,
            'status': 'not_found'
        })
    
    # Return the most recent report's status and scores
    latest_report = max(reports, key=lambda r: r.created_at)
    return JSONResponse(content={
        'session_id': session_id,
        'status': latest_report.status,
        'points_earned': latest_report.total_points_earned,
        'points_possible': latest_report.total_points_possible,
        'percentage_score': latest_report.percentage_score,
        'information_section_score': latest_report.information_section_score,
        'skill_section_score': latest_report.skill_section_score,
        'medical_terminology_score': latest_report.medical_terminology_score,
        'politeness_score': latest_report.politeness_score,
        'empathy_score': latest_report.empathy_score,
        'unacceptable_areas': latest_report.unacceptable_areas,
        'improvement_areas': latest_report.improvement_areas,
        'section_summaries': latest_report.section_summaries
    }) 