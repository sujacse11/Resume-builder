from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', views.MeView.as_view(), name='me'),

    # Resumes
    path('resumes/', views.ResumeListCreateView.as_view(), name='resume-list'),
    path('resumes/<int:pk>/', views.ResumeDetailView.as_view(), name='resume-detail'),
    path('resumes/<int:pk>/duplicate/', views.ResumeDuplicateView.as_view(), name='resume-duplicate'),

    # Work Experience
    path('resumes/<int:resume_id>/experience/', views.WorkExperienceListCreate.as_view()),
    path('experience/<int:pk>/', views.WorkExperienceDetail.as_view()),

    # Education
    path('resumes/<int:resume_id>/education/', views.EducationListCreate.as_view()),
    path('education/<int:pk>/', views.EducationDetail.as_view()),

    # Skills
    path('resumes/<int:resume_id>/skills/', views.SkillListCreate.as_view()),
    path('skills/<int:pk>/', views.SkillDetail.as_view()),

    # Projects
    path('resumes/<int:resume_id>/projects/', views.ProjectListCreate.as_view()),
    path('projects/<int:pk>/', views.ProjectDetail.as_view()),

    # Certifications
    path('resumes/<int:resume_id>/certifications/', views.CertificationListCreate.as_view()),
    path('certifications/<int:pk>/', views.CertificationDetail.as_view()),

    # Languages (NEW)
    path('resumes/<int:resume_id>/languages/', views.LanguageListCreate.as_view()),
    path('languages/<int:pk>/', views.LanguageDetail.as_view()),

    # Volunteer Work (NEW)
    path('resumes/<int:resume_id>/volunteer/', views.VolunteerListCreate.as_view()),
    path('volunteer/<int:pk>/', views.VolunteerDetail.as_view()),

    # Awards (NEW)
    path('resumes/<int:resume_id>/awards/', views.AwardListCreate.as_view()),
    path('awards/<int:pk>/', views.AwardDetail.as_view()),

    # AI Endpoints
    path('ai/summary/', views.AIGenerateSummary.as_view(), name='ai-summary'),
    path('ai/skills/', views.AISkillSuggestions.as_view(), name='ai-skills'),
    path('ai/enhance-bullet/', views.AIEnhanceBullet.as_view(), name='ai-enhance'),
    path('ai/ats-score/', views.AIATSScore.as_view(), name='ai-ats'),
    path('ai/cover-letter/', views.AICoverLetter.as_view(), name='ai-cover-letter'),
    path('ai/job-titles/', views.AIJobTitleSuggestions.as_view(), name='ai-job-titles'),
    path('ai/resume-review/', views.AIResumeReview.as_view(), name='ai-resume-review'),
]
