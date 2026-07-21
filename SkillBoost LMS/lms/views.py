import json
import io
import requests
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from django.http import HttpResponse, FileResponse
from django.conf import settings
from django.utils import timezone

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.enums import TA_CENTER

from .models import (
    Course, VideoLesson, Quiz, Question, Answer,
    QuizAttempt, CourseCompletion
)
from .forms import CourseForm, VideoLessonForm

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

PASSING_SCORE = 80.0  # Percentage


# ─────────────────────────────────────────────
# Auth Views
# ─────────────────────────────────────────────

def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard')
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('dashboard')
        else:
            messages.error(request, 'Invalid username or password.')
    return render(request, 'lms/login.html')


def logout_view(request):
    logout(request)
    return redirect('login')


# ─────────────────────────────────────────────
# Dashboard
# ─────────────────────────────────────────────

@login_required
def dashboard(request):
    courses = Course.objects.all()
    # Get user's completion status for each course
    completions = {
        c.course_id: c
        for c in CourseCompletion.objects.filter(user=request.user)
    }
    return render(request, 'lms/dashboard.html', {
        'courses': courses,
        'completions': completions,
    })


# ─────────────────────────────────────────────
# Course Views
# ─────────────────────────────────────────────

@login_required
def course_upload(request):
    if request.method == 'POST':
        form = CourseForm(request.POST)
        if form.is_valid():
            course = form.save()
            messages.success(request, f'Course "{course.title}" created successfully!')
            return redirect('course_detail', course_id=course.id)
    else:
        form = CourseForm()
    return render(request, 'lms/course_upload.html', {'form': form})


@login_required
def course_detail(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    lessons = course.lessons.all()
    quizzes = course.quizzes.all()

    # Check completion status
    completion = CourseCompletion.objects.filter(
        user=request.user, course=course
    ).first()

    # Get best quiz attempt for this course
    best_attempt = None
    if quizzes.exists():
        best_attempt = QuizAttempt.objects.filter(
            user=request.user, quiz__in=quizzes
        ).order_by('-score').first()

    return render(request, 'lms/course_detail.html', {
        'course': course,
        'lessons': lessons,
        'quizzes': quizzes,
        'completion': completion,
        'best_attempt': best_attempt,
    })


# ─────────────────────────────────────────────
# Video Lesson Views
# ─────────────────────────────────────────────

@login_required
def video_lesson_upload(request, course_id):
    course = get_object_or_404(Course, id=course_id)
    if request.method == 'POST':
        form = VideoLessonForm(request.POST)
        if form.is_valid():
            lesson = form.save(commit=False)
            lesson.course = course
            lesson.save()
            messages.success(request, f'Lesson "{lesson.title}" uploaded!')
            return redirect('course_detail', course_id=course.id)
    else:
        form = VideoLessonForm()
    return render(request, 'lms/video_lesson_upload.html', {
        'form': form,
        'course': course,
    })


# ─────────────────────────────────────────────
# AI Quiz Generation
# ─────────────────────────────────────────────

@login_required
def generate_quiz(request, lesson_id):
    lesson = get_object_or_404(VideoLesson, id=lesson_id)
    api_key = settings.GROQ_API_KEY

    if not api_key or not api_key.strip() or api_key.lower() in ('your_groq_api_key_here', 'gsk_placeholder'):
        messages.error(request, 'GROQ API key is not configured. Please add GROQ_API_KEY to your .env file.')
        return redirect('course_detail', course_id=lesson.course.id)

    prompt = f"""You are an expert quiz generator for an online learning platform.

Based on the following video lesson description, generate a quiz with exactly 5 multiple-choice questions.

Lesson Title: {lesson.title}
Lesson Description: {lesson.description}

Return ONLY a valid JSON object (no markdown, no code blocks) in this exact format:
{{
  "quiz_title": "Quiz title here",
  "questions": [
    {{
      "question_text": "The question here?",
      "answers": [
        {{"answer_text": "Option A", "is_correct": false}},
        {{"answer_text": "Option B", "is_correct": true}},
        {{"answer_text": "Option C", "is_correct": false}},
        {{"answer_text": "Option D", "is_correct": false}}
      ]
    }}
  ]
}}

Rules:
- Exactly 5 questions
- Exactly 4 answer options each
- Exactly 1 correct answer per question
- Questions should test understanding of the lesson content
- Return ONLY the JSON, nothing else"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }

    try:
        response = requests.post(
            GROQ_API_URL,
            headers=headers,
            json=payload,
            timeout=60
        )
        response.raise_for_status()
        data = response.json()

        raw_text = data['choices'][0]['message']['content'].strip()
        quiz_data = json.loads(raw_text)

        # Save Quiz to DB
        quiz = Quiz.objects.create(
            course=lesson.course,
            title=quiz_data.get('quiz_title', f'Quiz for {lesson.title}')
        )

        for q_data in quiz_data['questions']:
            question = Question.objects.create(
                quiz=quiz,
                question_text=q_data['question_text']
            )
            for a_data in q_data['answers']:
                Answer.objects.create(
                    question=question,
                    answer_text=a_data['answer_text'],
                    is_correct=a_data['is_correct']
                )

        messages.success(request, f'Quiz "{quiz.title}" generated successfully with {quiz.questions.count()} questions!')
        return redirect('quiz_view', quiz_id=quiz.id)

    except requests.exceptions.RequestException as e:
        messages.error(request, f'API request failed: {str(e)}')
    except (KeyError, json.JSONDecodeError) as e:
        messages.error(request, f'Failed to parse quiz data from AI response: {str(e)}')
    except Exception as e:
        messages.error(request, f'Unexpected error: {str(e)}')

    return redirect('course_detail', course_id=lesson.course.id)


# ─────────────────────────────────────────────
# Quiz Views
# ─────────────────────────────────────────────

@login_required
def quiz_view(request, quiz_id):
    quiz = get_object_or_404(Quiz, id=quiz_id)
    questions = quiz.questions.prefetch_related('answers').all()
    return render(request, 'lms/quiz.html', {
        'quiz': quiz,
        'questions': questions,
    })


@login_required
def quiz_submit(request, quiz_id):
    if request.method != 'POST':
        return redirect('quiz_view', quiz_id=quiz_id)

    quiz = get_object_or_404(Quiz, id=quiz_id)
    questions = quiz.questions.prefetch_related('answers').all()

    score = 0
    total = questions.count()
    results = {}

    for question in questions:
        submitted_answer_id = request.POST.get(f'question_{question.id}')
        correct_answer = question.answers.filter(is_correct=True).first()

        is_correct = False
        selected_answer = None

        if submitted_answer_id:
            try:
                selected_answer = question.answers.get(id=int(submitted_answer_id))
                if correct_answer and selected_answer.id == correct_answer.id:
                    is_correct = True
                    score += 1
            except Answer.DoesNotExist:
                pass

        results[question.id] = {
            'question': question,
            'selected': selected_answer,
            'correct_answer': correct_answer,
            'is_correct': is_correct,
        }

    percentage = (score / total * 100) if total > 0 else 0

    # Save quiz attempt
    attempt = QuizAttempt.objects.create(
        user=request.user,
        quiz=quiz,
        score=percentage
    )

    # Check course completion
    if percentage >= PASSING_SCORE:
        completion, created = CourseCompletion.objects.get_or_create(
            user=request.user,
            course=quiz.course,
            defaults={'is_completed': False}
        )
        if not completion.is_completed:
            completion.is_completed = True
            completion.completed_at = timezone.now()
            completion.save()

    return redirect('quiz_results', attempt_id=attempt.id)


@login_required
def quiz_results(request, attempt_id):
    attempt = get_object_or_404(QuizAttempt, id=attempt_id, user=request.user)
    quiz = attempt.quiz
    questions = quiz.questions.prefetch_related('answers').all()

    # Completion check
    completion = CourseCompletion.objects.filter(
        user=request.user, course=quiz.course
    ).first()

    passed = attempt.score >= PASSING_SCORE

    return render(request, 'lms/quiz_results.html', {
        'attempt': attempt,
        'quiz': quiz,
        'questions': questions,
        'passed': passed,
        'completion': completion,
        'passing_score': PASSING_SCORE,
    })


# ─────────────────────────────────────────────
# Certificate Generation
# ─────────────────────────────────────────────

@login_required
def generate_certificate(request, course_id, user_id):
    course = get_object_or_404(Course, id=course_id)
    cert_user = get_object_or_404(User, id=user_id)

    # Verify completion
    completion = get_object_or_404(
        CourseCompletion,
        user=cert_user, course=course, is_completed=True
    )

    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=landscape(A4),
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CertTitle',
        parent=styles['Title'],
        fontSize=36,
        textColor=colors.HexColor('#1a1a2e'),
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'CertSubtitle',
        parent=styles['Normal'],
        fontSize=16,
        textColor=colors.HexColor('#7c3aed'),
        spaceAfter=20,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    body_style = ParagraphStyle(
        'CertBody',
        parent=styles['Normal'],
        fontSize=14,
        textColor=colors.HexColor('#374151'),
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )
    name_style = ParagraphStyle(
        'CertName',
        parent=styles['Normal'],
        fontSize=28,
        textColor=colors.HexColor('#7c3aed'),
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    course_style = ParagraphStyle(
        'CertCourse',
        parent=styles['Normal'],
        fontSize=20,
        textColor=colors.HexColor('#1a1a2e'),
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    date_style = ParagraphStyle(
        'CertDate',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#6b7280'),
        spaceAfter=10,
        alignment=TA_CENTER,
        fontName='Helvetica'
    )

    completion_date = completion.completed_at
    if completion_date:
        date_str = completion_date.strftime('%B %d, %Y')
    else:
        date_str = timezone.now().strftime('%B %d, %Y')

    full_name = cert_user.get_full_name() or cert_user.username

    story = [
        Spacer(1, 1 * cm),
        Paragraph("🎓 Certificate of Completion", title_style),
        Paragraph("SkillBoost Learning Management System", subtitle_style),
        HRFlowable(width="80%", thickness=2, color=colors.HexColor('#7c3aed')),
        Spacer(1, 0.8 * cm),
        Paragraph("This is to certify that", body_style),
        Spacer(1, 0.3 * cm),
        Paragraph(full_name, name_style),
        Spacer(1, 0.3 * cm),
        Paragraph("has successfully completed the course", body_style),
        Spacer(1, 0.3 * cm),
        Paragraph(course.title, course_style),
        Spacer(1, 0.5 * cm),
        HRFlowable(width="60%", thickness=1, color=colors.HexColor('#d1d5db')),
        Spacer(1, 0.4 * cm),
        Paragraph(f"Date of Completion: {date_str}", date_style),
        Paragraph("SkillBoost LMS — Empowering Learners Worldwide", date_style),
    ]

    doc.build(story)
    buffer.seek(0)

    safe_name = course.title.replace(' ', '_')
    filename = f"certificate_{safe_name}_{cert_user.username}.pdf"

    response = HttpResponse(buffer.read(), content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


# ─────────────────────────────────────────────
# Course Recommendations
# ─────────────────────────────────────────────

@login_required
def recommend_courses(request):
    api_key = settings.GROQ_API_KEY

    # Build context from user's completed courses and quiz attempts
    completed_courses = CourseCompletion.objects.filter(
        user=request.user, is_completed=True
    ).select_related('course')

    recent_attempts = QuizAttempt.objects.filter(
        user=request.user
    ).select_related('quiz__course').order_by('-attempted_at')[:10]

    completed_titles = [c.course.title for c in completed_courses]
    attempt_summary = [
        f"{a.quiz.course.title} (score: {a.score:.0f}%)"
        for a in recent_attempts
    ]

    recommendations = []
    error_message = None

    if not api_key or not api_key.strip() or api_key.lower().startswith('your_'):
        error_message = 'GROQ API key not configured. Please add GROQ_API_KEY to your .env file.'
    else:
        prompt = f"""You are an expert course recommendation engine for an online learning platform called SkillBoost.

User Profile:
- Completed Courses: {', '.join(completed_titles) if completed_titles else 'None yet'}
- Recent Quiz Activity: {', '.join(attempt_summary) if attempt_summary else 'No quiz attempts yet'}

Based on this user's learning history, recommend 5 courses they should take next.
Return ONLY a valid JSON object with a "recommendations" array in this exact format:
{{"recommendations": [
  {{
    "title": "Course Title Here",
    "description": "A compelling 2-sentence description of what this course covers and why it's relevant.",
    "relevance_score": 95
  }}
]}}

Rules:
- Recommend courses that build on their existing knowledge
- If no history, recommend popular beginner courses in technology and business
- relevance_score should be between 50 and 100
- Return ONLY the JSON object, nothing else"""

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.8,
            "response_format": {"type": "json_object"},
        }

        try:
            response = requests.post(
                GROQ_API_URL,
                headers=headers,
                json=payload,
                timeout=60
            )
            response.raise_for_status()
            data = response.json()

            raw_text = data['choices'][0]['message']['content'].strip()
            parsed = json.loads(raw_text)
            rec_list = parsed.get('recommendations', parsed) if isinstance(parsed, dict) else parsed

            # Check if recommendations match existing courses
            for rec in rec_list:
                existing = Course.objects.filter(
                    title__icontains=rec['title'].split()[0]
                ).first()
                rec['existing_course'] = existing
                recommendations.append(rec)

        except requests.exceptions.RequestException as e:
            error_message = f'API request failed: {str(e)}'
        except (KeyError, json.JSONDecodeError) as e:
            error_message = f'Failed to parse recommendations: {str(e)}'
        except Exception as e:
            error_message = f'Unexpected error: {str(e)}'

    return render(request, 'lms/recommendations.html', {
        'recommendations': recommendations,
        'error_message': error_message,
        'completed_courses': completed_courses,
    })
