from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),

    # Dashboard
    path('', views.dashboard, name='dashboard'),

    # Courses
    path('courses/upload/', views.course_upload, name='course_upload'),
    path('courses/<int:course_id>/', views.course_detail, name='course_detail'),

    # Video Lessons
    path('courses/<int:course_id>/lessons/upload/', views.video_lesson_upload, name='video_lesson_upload'),
    path('lessons/<int:lesson_id>/generate-quiz/', views.generate_quiz, name='generate_quiz'),

    # Quiz
    path('quiz/<int:quiz_id>/', views.quiz_view, name='quiz_view'),
    path('quiz/<int:quiz_id>/submit/', views.quiz_submit, name='quiz_submit'),
    path('quiz/results/<int:attempt_id>/', views.quiz_results, name='quiz_results'),

    # Certificate
    path('certificate/<int:course_id>/<int:user_id>/', views.generate_certificate, name='generate_certificate'),

    # Recommendations
    path('recommendations/', views.recommend_courses, name='recommend_courses'),
]
