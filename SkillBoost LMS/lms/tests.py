"""
Unit Tests for SkillBoost LMS
Covers: Models, ModelForms, Views
"""

from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone

from .models import (
    Course, VideoLesson, Quiz, Question, Answer,
    QuizAttempt, CourseCompletion
)
from .forms import CourseForm, VideoLessonForm


# ─────────────────────────────────────────────
# Model Tests
# ─────────────────────────────────────────────

class CourseModelTest(TestCase):
    def test_create_course(self):
        course = Course.objects.create(title="Python Basics", description="Learn Python")
        self.assertEqual(course.title, "Python Basics")
        self.assertEqual(str(course), "Python Basics")
        self.assertIsNotNone(course.created_at)

    def test_update_course(self):
        course = Course.objects.create(title="Old Title", description="Desc")
        course.title = "New Title"
        course.save()
        self.assertEqual(Course.objects.get(pk=course.pk).title, "New Title")

    def test_delete_course(self):
        course = Course.objects.create(title="To Delete", description="Desc")
        pk = course.pk
        course.delete()
        self.assertFalse(Course.objects.filter(pk=pk).exists())


class VideoLessonModelTest(TestCase):
    def setUp(self):
        self.course = Course.objects.create(title="Test Course", description="Desc")

    def test_create_lesson(self):
        lesson = VideoLesson.objects.create(
            course=self.course,
            title="Intro Lesson",
            video_url="https://youtube.com/watch?v=test",
            description="A lesson about basics"
        )
        self.assertEqual(lesson.course, self.course)
        self.assertIn("Test Course", str(lesson))

    def test_cascade_delete(self):
        lesson = VideoLesson.objects.create(
            course=self.course,
            title="Lesson 1",
            video_url="https://example.com/video",
            description="Desc"
        )
        self.course.delete()
        self.assertFalse(VideoLesson.objects.filter(pk=lesson.pk).exists())


class QuizModelTest(TestCase):
    def setUp(self):
        self.course = Course.objects.create(title="Course", description="Desc")

    def test_create_quiz(self):
        quiz = Quiz.objects.create(course=self.course, title="My Quiz")
        self.assertEqual(quiz.course, self.course)
        self.assertIn("My Quiz", str(quiz))

    def test_quiz_cascade_delete(self):
        quiz = Quiz.objects.create(course=self.course, title="Quiz")
        self.course.delete()
        self.assertFalse(Quiz.objects.filter(pk=quiz.pk).exists())


class QuestionModelTest(TestCase):
    def setUp(self):
        course = Course.objects.create(title="Course", description="Desc")
        self.quiz = Quiz.objects.create(course=course, title="Quiz")

    def test_create_question(self):
        q = Question.objects.create(quiz=self.quiz, question_text="What is Python?")
        self.assertEqual(q.quiz, self.quiz)
        self.assertIn("What is Python", str(q))


class AnswerModelTest(TestCase):
    def setUp(self):
        course = Course.objects.create(title="Course", description="Desc")
        quiz = Quiz.objects.create(course=course, title="Quiz")
        self.question = Question.objects.create(quiz=quiz, question_text="Q?")

    def test_create_correct_answer(self):
        a = Answer.objects.create(
            question=self.question,
            answer_text="The right answer",
            is_correct=True
        )
        self.assertTrue(a.is_correct)
        self.assertIn("✓", str(a))

    def test_create_incorrect_answer(self):
        a = Answer.objects.create(
            question=self.question,
            answer_text="Wrong",
            is_correct=False
        )
        self.assertFalse(a.is_correct)
        self.assertIn("✗", str(a))


class QuizAttemptModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        course = Course.objects.create(title="Course", description="Desc")
        self.quiz = Quiz.objects.create(course=course, title="Quiz")

    def test_create_attempt(self):
        attempt = QuizAttempt.objects.create(
            user=self.user, quiz=self.quiz, score=85.0
        )
        self.assertEqual(attempt.score, 85.0)
        self.assertIn("testuser", str(attempt))
        self.assertIn("85.0%", str(attempt))


class CourseCompletionModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.course = Course.objects.create(title="Course", description="Desc")

    def test_create_completion(self):
        c = CourseCompletion.objects.create(
            user=self.user, course=self.course, is_completed=True,
            completed_at=timezone.now()
        )
        self.assertTrue(c.is_completed)
        self.assertIn("Completed", str(c))

    def test_unique_together(self):
        CourseCompletion.objects.create(user=self.user, course=self.course)
        with self.assertRaises(Exception):
            CourseCompletion.objects.create(user=self.user, course=self.course)


# ─────────────────────────────────────────────
# Form Tests
# ─────────────────────────────────────────────

class CourseFormTest(TestCase):
    def test_valid_form(self):
        form = CourseForm(data={
            'title': 'Django for Beginners',
            'description': 'A comprehensive guide to Django'
        })
        self.assertTrue(form.is_valid())

    def test_missing_title(self):
        form = CourseForm(data={'title': '', 'description': 'Desc'})
        self.assertFalse(form.is_valid())
        self.assertIn('title', form.errors)

    def test_missing_description(self):
        form = CourseForm(data={'title': 'Course', 'description': ''})
        self.assertFalse(form.is_valid())
        self.assertIn('description', form.errors)


class VideoLessonFormTest(TestCase):
    def test_valid_form(self):
        form = VideoLessonForm(data={
            'title': 'Lesson 1',
            'video_url': 'https://youtube.com/watch?v=abc',
            'description': 'In this lesson we learn...'
        })
        self.assertTrue(form.is_valid())

    def test_invalid_url(self):
        form = VideoLessonForm(data={
            'title': 'Lesson 1',
            'video_url': 'not-a-url',
            'description': 'Desc'
        })
        self.assertFalse(form.is_valid())
        self.assertIn('video_url', form.errors)

    def test_missing_fields(self):
        form = VideoLessonForm(data={})
        self.assertFalse(form.is_valid())
        self.assertIn('title', form.errors)


# ─────────────────────────────────────────────
# View Tests
# ─────────────────────────────────────────────

class ViewTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser', password='testpass123', email='test@test.com'
        )
        self.course = Course.objects.create(
            title="Test Course", description="A test course"
        )
        self.lesson = VideoLesson.objects.create(
            course=self.course,
            title="Lesson 1",
            video_url="https://youtube.com/watch?v=test",
            description="Lesson about testing"
        )
        self.quiz = Quiz.objects.create(course=self.course, title="Test Quiz")
        self.question = Question.objects.create(
            quiz=self.quiz, question_text="What is 2+2?"
        )
        self.correct_answer = Answer.objects.create(
            question=self.question, answer_text="4", is_correct=True
        )
        self.wrong_answer = Answer.objects.create(
            question=self.question, answer_text="5", is_correct=False
        )

    def _login(self):
        self.client.login(username='testuser', password='testpass123')

    def test_login_page_accessible(self):
        response = self.client.get(reverse('login'))
        self.assertEqual(response.status_code, 200)

    def test_redirect_if_not_logged_in(self):
        response = self.client.get(reverse('dashboard'))
        self.assertRedirects(response, '/login/?next=/')

    def test_dashboard_authenticated(self):
        self._login()
        response = self.client.get(reverse('dashboard'))
        self.assertEqual(response.status_code, 200)

    def test_course_detail_status_200(self):
        self._login()
        response = self.client.get(reverse('course_detail', args=[self.course.id]))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.course.title)

    def test_course_upload_get(self):
        self._login()
        response = self.client.get(reverse('course_upload'))
        self.assertEqual(response.status_code, 200)

    def test_course_upload_post_valid(self):
        self._login()
        response = self.client.post(reverse('course_upload'), {
            'title': 'New Course',
            'description': 'A new course description'
        })
        self.assertEqual(Course.objects.filter(title='New Course').count(), 1)
        self.assertRedirects(
            response,
            reverse('course_detail', args=[Course.objects.get(title='New Course').id])
        )

    def test_quiz_view_status_200(self):
        self._login()
        response = self.client.get(reverse('quiz_view', args=[self.quiz.id]))
        self.assertEqual(response.status_code, 200)

    def test_quiz_submit_correct_answer(self):
        self._login()
        response = self.client.post(
            reverse('quiz_submit', args=[self.quiz.id]),
            {f'question_{self.question.id}': str(self.correct_answer.id)}
        )
        attempt = QuizAttempt.objects.filter(user=self.user, quiz=self.quiz).first()
        self.assertIsNotNone(attempt)
        self.assertEqual(attempt.score, 100.0)

    def test_quiz_submit_wrong_answer(self):
        self._login()
        self.client.post(
            reverse('quiz_submit', args=[self.quiz.id]),
            {f'question_{self.question.id}': str(self.wrong_answer.id)}
        )
        attempt = QuizAttempt.objects.filter(user=self.user, quiz=self.quiz).first()
        self.assertIsNotNone(attempt)
        self.assertEqual(attempt.score, 0.0)

    def test_passing_score_sets_completion(self):
        self._login()
        self.client.post(
            reverse('quiz_submit', args=[self.quiz.id]),
            {f'question_{self.question.id}': str(self.correct_answer.id)}
        )
        completion = CourseCompletion.objects.filter(
            user=self.user, course=self.course
        ).first()
        self.assertIsNotNone(completion)
        self.assertTrue(completion.is_completed)

    def test_certificate_returns_pdf(self):
        self._login()
        # First create completion
        CourseCompletion.objects.create(
            user=self.user, course=self.course,
            is_completed=True, completed_at=timezone.now()
        )
        response = self.client.get(
            reverse('generate_certificate', args=[self.course.id, self.user.id])
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertIn('attachment', response['Content-Disposition'])
