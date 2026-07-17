import os
import requests
import random
from django.conf import settings
from django.contrib.auth.models import User
from rest_framework import status, generics
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Resume, WorkExperience, Education, Skill, Project, Certification, Language, VolunteerWork, Award
from .serializers import (
    RegisterSerializer, UserSerializer, ResumeSerializer, ResumeListSerializer,
    WorkExperienceSerializer, EducationSerializer, SkillSerializer,
    ProjectSerializer, CertificationSerializer, LanguageSerializer,
    VolunteerWorkSerializer, AwardSerializer,
)

# ─────────────────────────── Gemini Helper ───────────────────────────────────

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

def call_gemini(prompt: str) -> str:
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        raise Exception("GEMINI_API_KEY not configured")
    response = requests.post(
        f"{GEMINI_URL}?key={api_key}",
        json={"contents": [{"parts": [{"text": prompt}]}]},
        timeout=30,
        headers={"Content-Type": "application/json"}
    )
    response.raise_for_status()
    data = response.json()
    return data['candidates'][0]['content']['parts'][0]['text'].strip()

# ─────────────────── AI Fallback Data ───────────────────────────────────────

SKILL_FALLBACKS = {
    'software': ['Python', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'REST APIs', 'SQL', 'Git', 'Docker', 'AWS', 'PostgreSQL', 'MongoDB'],
    'data': ['Python', 'SQL', 'Pandas', 'NumPy', 'TensorFlow', 'Machine Learning', 'Data Visualization', 'Tableau', 'Power BI', 'Scikit-learn', 'R', 'Spark'],
    'design': ['Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'UI/UX Design', 'Prototyping', 'Wireframing', 'Design Systems', 'CSS', 'Sketch'],
    'marketing': ['SEO', 'Google Analytics', 'Content Marketing', 'Social Media', 'Email Marketing', 'PPC', 'HubSpot', 'Copywriting', 'A/B Testing', 'CRM'],
    'default': ['Communication', 'Problem Solving', 'Team Leadership', 'Project Management', 'Critical Thinking', 'Agile', 'Microsoft Office', 'Time Management', 'Presentation Skills', 'Collaboration', 'Adaptability', 'Strategic Planning'],
}

def get_fallback_skills(context: str) -> list:
    ctx_lower = context.lower()
    for key in SKILL_FALLBACKS:
        if key in ctx_lower:
            return SKILL_FALLBACKS[key]
    return SKILL_FALLBACKS['default']

def get_fallback_summary(context: str) -> str:
    templates = [
        f"Results-driven professional with expertise in {context}. Proven track record of delivering high-quality work and driving measurable impact. Adept at collaborating cross-functionally and leading initiatives that align with strategic objectives.",
        f"Dynamic and innovative professional specializing in {context}. Known for combining analytical thinking with creative problem-solving to deliver outstanding outcomes. Passionate about continuous learning and leveraging emerging technologies.",
        f"Accomplished professional with deep expertise in {context}. Consistently delivers value through technical proficiency and strong interpersonal skills. Committed to excellence and driving organizational success.",
    ]
    return random.choice(templates)

def get_fallback_cover_letter(name, position, company, summary):
    return f"""Dear Hiring Manager,

I am writing to express my enthusiastic interest in the {position} role at {company}. With my background and proven track record, I am confident in my ability to make an immediate and lasting contribution to your team.

{summary or 'Throughout my career, I have consistently demonstrated the ability to deliver high-quality results while collaborating effectively with cross-functional teams.'}

What excites me most about {company} is your commitment to innovation and excellence. I am eager to bring my skills and passion to help drive your mission forward. I thrive in dynamic environments and am always looking for opportunities to grow and make a meaningful impact.

I would welcome the opportunity to discuss how my experience aligns with your needs. Thank you for considering my application.

Sincerely,
{name or 'Your Name'}"""

def get_fallback_ats_score(resume_text: str, job_description: str) -> dict:
    resume_words = set(resume_text.lower().split())
    jd_words = job_description.lower().split()
    jd_keywords = [w for w in jd_words if len(w) > 4]
    matched = [kw for kw in jd_keywords if kw in resume_words]
    score = min(95, max(30, int((len(matched) / max(len(jd_keywords), 1)) * 100)))
    suggestions = (
        ["Add more keywords from the job description", "Include specific technical skills mentioned in the posting", "Quantify your achievements with numbers", "Use action verbs at the start of bullet points"]
        if score < 50 else
        ["Consider adding more industry-specific terminology", "Expand your skills section with relevant tools", "Add measurable outcomes to your experience bullets"]
        if score < 75 else
        ["Your resume is well-optimized for this role", "Consider customizing the summary further"]
    )
    return {
        "score": score,
        "matched_keywords": list(set(matched))[:10],
        "suggestions": suggestions,
        "breakdown": {"keywords": min(100, score + 5), "format": 85, "experience": min(100, score - 5), "education": 90}
    }

def get_fallback_job_titles(skills, experience):
    mapping = {
        'react': ['Frontend Developer', 'UI Engineer', 'React Developer', 'Web Developer'],
        'python': ['Python Developer', 'Backend Engineer', 'Software Engineer', 'Data Engineer'],
        'data': ['Data Analyst', 'Data Scientist', 'Business Analyst', 'ML Engineer'],
        'design': ['UI/UX Designer', 'Product Designer', 'Graphic Designer', 'Visual Designer'],
        'manager': ['Project Manager', 'Product Manager', 'Engineering Manager', 'Team Lead'],
    }
    all_skills = ' '.join(skills).lower()
    for key, titles in mapping.items():
        if key in all_skills:
            return titles
    return ['Software Engineer', 'Full Stack Developer', 'Product Specialist', 'Technical Lead']

# ─────────────────────── Auth Views ─────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({'user': UserSerializer(user).data, 'access': str(refresh.access_token), 'refresh': str(refresh)}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        from django.contrib.auth import authenticate
        username = request.data.get('username', '')
        password = request.data.get('password', '')
        if '@' in username:
            try:
                user_obj = User.objects.get(email=username)
                username = user_obj.username
            except User.DoesNotExist:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({'user': UserSerializer(user).data, 'access': str(refresh.access_token), 'refresh': str(refresh)})
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)

# ─────────────────────── Resume Views ───────────────────────────────────────

class ResumeListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    def get_serializer_class(self):
        return ResumeListSerializer if self.request.method == 'GET' else ResumeSerializer
    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ResumeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ResumeSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Resume.objects.filter(user=self.request.user)

class ResumeDuplicateView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request, pk):
        try:
            original = Resume.objects.get(pk=pk, user=request.user)
        except Resume.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        copy = Resume.objects.create(
            user=request.user, title=f"{original.title} (Copy)", template=original.template,
            full_name=original.full_name, email=original.email, phone=original.phone,
            location=original.location, linkedin=original.linkedin, github=original.github,
            website=original.website, job_title=original.job_title,
            summary=original.summary, cover_letter=original.cover_letter,
        )
        for exp in original.work_experiences.all():
            WorkExperience.objects.create(resume=copy, job_title=exp.job_title, company=exp.company, location=exp.location, start_date=exp.start_date, end_date=exp.end_date, current=exp.current, description=exp.description, order=exp.order)
        for edu in original.educations.all():
            Education.objects.create(resume=copy, school_name=edu.school_name, degree=edu.degree, field_of_study=edu.field_of_study, gpa=edu.gpa, start_date=edu.start_date, graduation_year=edu.graduation_year, order=edu.order)
        for sk in original.skills.all():
            Skill.objects.create(resume=copy, name=sk.name, category=sk.category, order=sk.order)
        for proj in original.projects.all():
            Project.objects.create(resume=copy, name=proj.name, description=proj.description, tech_stack=proj.tech_stack, github_url=proj.github_url, live_url=proj.live_url, start_date=proj.start_date, end_date=proj.end_date, order=proj.order)
        for cert in original.certifications.all():
            Certification.objects.create(resume=copy, name=cert.name, issuer=cert.issuer, issue_date=cert.issue_date, expiry_date=cert.expiry_date, credential_url=cert.credential_url, order=cert.order)
        for lang in original.languages.all():
            Language.objects.create(resume=copy, name=lang.name, proficiency=lang.proficiency, order=lang.order)
        for vol in original.volunteer_works.all():
            VolunteerWork.objects.create(resume=copy, organization=vol.organization, role=vol.role, start_date=vol.start_date, end_date=vol.end_date, current=vol.current, description=vol.description, order=vol.order)
        for aw in original.awards.all():
            Award.objects.create(resume=copy, title=aw.title, issuer=aw.issuer, date=aw.date, description=aw.description, order=aw.order)
        return Response(ResumeSerializer(copy).data, status=status.HTTP_201_CREATED)

# ─────────── Section CRUD helpers ────────────────────────────────────────────

def make_list_create(model_cls, serializer_cls, resume_fk='resume_id'):
    class View(generics.ListCreateAPIView):
        serializer_class = serializer_cls
        permission_classes = [IsAuthenticated]
        def get_queryset(self):
            return model_cls.objects.filter(resume__id=self.kwargs[resume_fk], resume__user=self.request.user)
        def perform_create(self, serializer):
            resume = Resume.objects.get(pk=self.kwargs[resume_fk], user=self.request.user)
            serializer.save(resume=resume)
    return View

def make_detail(model_cls, serializer_cls):
    class View(generics.RetrieveUpdateDestroyAPIView):
        serializer_class = serializer_cls
        permission_classes = [IsAuthenticated]
        def get_queryset(self):
            return model_cls.objects.filter(resume__user=self.request.user)
    return View

WorkExperienceListCreate = make_list_create(WorkExperience, WorkExperienceSerializer)
WorkExperienceDetail = make_detail(WorkExperience, WorkExperienceSerializer)
EducationListCreate = make_list_create(Education, EducationSerializer)
EducationDetail = make_detail(Education, EducationSerializer)
SkillListCreate = make_list_create(Skill, SkillSerializer)
SkillDetail = make_detail(Skill, SkillSerializer)
ProjectListCreate = make_list_create(Project, ProjectSerializer)
ProjectDetail = make_detail(Project, ProjectSerializer)
CertificationListCreate = make_list_create(Certification, CertificationSerializer)
CertificationDetail = make_detail(Certification, CertificationSerializer)
LanguageListCreate = make_list_create(Language, LanguageSerializer)
LanguageDetail = make_detail(Language, LanguageSerializer)
VolunteerListCreate = make_list_create(VolunteerWork, VolunteerWorkSerializer)
VolunteerDetail = make_detail(VolunteerWork, VolunteerWorkSerializer)
AwardListCreate = make_list_create(Award, AwardSerializer)
AwardDetail = make_detail(Award, AwardSerializer)

# ─────────────────────── AI Views ────────────────────────────────────────────

class AIGenerateSummary(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        context = request.data.get('context', '').strip()
        if not context:
            return Response({'error': 'Context is required'}, status=status.HTTP_400_BAD_REQUEST)
        prompt = f'Write a professional 2-3 sentence resume summary for someone with the following background: "{context}". Make it compelling, action-oriented, results-focused. Use third person. Return only the summary text, no quotes.'
        try:
            summary = call_gemini(prompt)
        except Exception:
            summary = get_fallback_summary(context)
        return Response({'summary': summary})

class AISkillSuggestions(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        role = request.data.get('role', 'software developer').strip()
        existing = request.data.get('existing_skills', [])
        prompt = f'Suggest exactly 12 professional skills for a {role}. Exclude: {", ".join(existing) if existing else "none"}. Return ONLY a comma-separated list. No numbering, no explanations.'
        try:
            text = call_gemini(prompt)
            skills = [s.strip() for s in text.split(',') if s.strip()][:12]
            if not skills: raise Exception("Empty")
        except Exception:
            skills = [s for s in get_fallback_skills(role) if s not in existing][:12]
        return Response({'skills': skills})

class AIEnhanceBullet(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        text = request.data.get('text', '').strip()
        job_title = request.data.get('job_title', '').strip()
        if not text:
            return Response({'error': 'Text is required'}, status=status.HTTP_400_BAD_REQUEST)
        prompt = f'Rewrite this job description bullet point to be more impactful and ATS-friendly for a {job_title} role: "{text}". Use strong action verbs, quantify where possible, be concise. Return only the improved text.'
        try:
            enhanced = call_gemini(prompt)
        except Exception:
            verb = random.choice(['Spearheaded', 'Engineered', 'Optimized', 'Delivered', 'Architected', 'Drove', 'Implemented'])
            enhanced = f"{verb} {text.lower().lstrip('- •').strip()}, resulting in measurable improvements in efficiency and project delivery."
        return Response({'enhanced': enhanced})

class AIATSScore(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        resume_text = request.data.get('resume_text', '').strip()
        job_description = request.data.get('job_description', '').strip()
        if not resume_text or not job_description:
            return Response({'error': 'Both fields required'}, status=status.HTTP_400_BAD_REQUEST)
        prompt = (
            f'Analyze this resume against the job description and provide an ATS compatibility score 0-100. '
            f'Resume:\n{resume_text[:2000]}\n\nJob Description:\n{job_description[:1000]}\n\n'
            'Respond with ONLY a JSON object with: "score" (integer), "matched_keywords" (array), "suggestions" (array), "breakdown" (object with keywords/format/experience/education as integers 0-100).'
        )
        try:
            result_text = call_gemini(prompt)
            import json, re
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                raise Exception("No JSON")
        except Exception:
            result = get_fallback_ats_score(resume_text, job_description)
        return Response(result)

class AICoverLetter(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        name = request.data.get('name', '').strip()
        position = request.data.get('position', 'the position').strip()
        company = request.data.get('company', 'your company').strip()
        summary = request.data.get('summary', '').strip()
        job_description = request.data.get('job_description', '').strip()
        prompt = (
            f'Write a professional cover letter for {name} applying for {position} at {company}. '
            f'Their background: {summary}. '
            f'Job description highlights: {job_description[:500]}. '
            'Write 3 paragraphs: opening hook, skills/achievements, closing. Keep it concise and compelling. '
            'Start with "Dear Hiring Manager," and end with "Sincerely, [Name]". Return only the letter.'
        )
        try:
            cover_letter = call_gemini(prompt)
        except Exception:
            cover_letter = get_fallback_cover_letter(name, position, company, summary)
        return Response({'cover_letter': cover_letter})

class AIJobTitleSuggestions(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        skills = request.data.get('skills', [])
        experience = request.data.get('experience', '')
        prompt = f'Suggest 6 professional job titles for someone with these skills: {", ".join(skills[:10])} and experience: "{experience[:200]}". Return ONLY a comma-separated list of job titles.'
        try:
            text = call_gemini(prompt)
            titles = [t.strip() for t in text.split(',') if t.strip()][:6]
            if not titles: raise Exception("Empty")
        except Exception:
            titles = get_fallback_job_titles(skills, experience)
        return Response({'titles': titles})

class AIResumeReview(APIView):
    """Full resume quality review with actionable suggestions."""
    permission_classes = [IsAuthenticated]
    def post(self, request):
        resume_text = request.data.get('resume_text', '').strip()
        prompt = (
            f'Review this resume and provide detailed feedback:\n{resume_text[:2500]}\n\n'
            'Return ONLY a JSON object with: '
            '"overall_score" (0-100), "strengths" (array of 3 strings), '
            '"improvements" (array of 4 specific actionable improvements), '
            '"missing_sections" (array of section names that should be added), '
            '"tone" (one word describing the tone: professional/casual/technical), '
            '"word_count_rating" (too_short/good/too_long).'
        )
        try:
            text = call_gemini(prompt)
            import json, re
            m = re.search(r'\{.*\}', text, re.DOTALL)
            result = json.loads(m.group()) if m else {}
        except Exception:
            result = {
                "overall_score": 72,
                "strengths": ["Clear work history structure", "Good technical skills listed", "Professional formatting"],
                "improvements": ["Add quantified achievements (numbers, percentages)", "Strengthen the professional summary", "Include more industry-specific keywords", "Add a projects or portfolio section"],
                "missing_sections": ["Projects", "Certifications"],
                "tone": "professional",
                "word_count_rating": "good"
            }
        return Response(result)
