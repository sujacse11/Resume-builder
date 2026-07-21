from django import forms
from .models import Course, VideoLesson


class CourseForm(forms.ModelForm):
    class Meta:
        model = Course
        fields = ['title', 'description']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Enter course title...',
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Describe what students will learn...',
                'rows': 5,
            }),
        }


class VideoLessonForm(forms.ModelForm):
    class Meta:
        model = VideoLesson
        fields = ['title', 'video_url', 'description']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'Lesson title...',
            }),
            'video_url': forms.URLInput(attrs={
                'class': 'form-input',
                'placeholder': 'https://youtube.com/watch?v=...',
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-textarea',
                'placeholder': 'Describe what this lesson covers (used for AI quiz generation)...',
                'rows': 5,
            }),
        }
