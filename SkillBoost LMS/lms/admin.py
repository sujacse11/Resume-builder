from django.contrib import admin
from .models import Course, VideoLesson, Quiz, Question, Answer, QuizAttempt, CourseCompletion


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'created_at')
    search_fields = ('title', 'description')
    list_filter = ('created_at',)


@admin.register(VideoLesson)
class VideoLessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'course')
    search_fields = ('title', 'description')
    list_filter = ('course',)


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'created_at')
    list_filter = ('course', 'created_at')


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('question_text', 'quiz')
    search_fields = ('question_text',)
    list_filter = ('quiz',)


@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ('answer_text', 'question', 'is_correct')
    list_filter = ('is_correct',)


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ('user', 'quiz', 'score', 'attempted_at')
    list_filter = ('quiz', 'attempted_at')
    search_fields = ('user__username',)


@admin.register(CourseCompletion)
class CourseCompletionAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'is_completed', 'completed_at')
    list_filter = ('is_completed', 'course')
    search_fields = ('user__username',)
