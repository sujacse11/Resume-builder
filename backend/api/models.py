from django.db import models
from django.contrib.auth.models import User


class Resume(models.Model):
    TEMPLATE_CHOICES = [
        ('modern', 'Modern'),
        ('classic', 'Classic'),
        ('minimal', 'Minimal'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    title = models.CharField(max_length=255, default='My Resume')
    template = models.CharField(max_length=20, choices=TEMPLATE_CHOICES, default='modern')

    # Personal Information
    full_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    location = models.CharField(max_length=255, blank=True)
    linkedin = models.URLField(blank=True)
    github = models.URLField(blank=True)
    website = models.URLField(blank=True)
    job_title = models.CharField(max_length=255, blank=True)   # desired role headline

    # Summary
    summary = models.TextField(blank=True)

    # Cover Letter
    cover_letter = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} — {self.title}"


class WorkExperience(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='work_experiences')
    job_title = models.CharField(max_length=255, blank=True)
    company = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    start_date = models.CharField(max_length=50, blank=True)
    end_date = models.CharField(max_length=50, blank=True)
    current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.job_title} @ {self.company}"


class Education(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='educations')
    school_name = models.CharField(max_length=255, blank=True)
    degree = models.CharField(max_length=255, blank=True)
    field_of_study = models.CharField(max_length=255, blank=True)
    gpa = models.CharField(max_length=20, blank=True)
    start_date = models.CharField(max_length=50, blank=True)
    graduation_year = models.CharField(max_length=50, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.degree} — {self.school_name}"


class Skill(models.Model):
    CATEGORY_CHOICES = [
        ('technical', 'Technical'),
        ('soft', 'Soft Skills'),
        ('language', 'Language'),
        ('tool', 'Tool'),
        ('other', 'Other'),
    ]
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='skills')
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='technical')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name


class Project(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)
    tech_stack = models.CharField(max_length=500, blank=True)
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    start_date = models.CharField(max_length=50, blank=True)
    end_date = models.CharField(max_length=50, blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name


class Certification(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='certifications')
    name = models.CharField(max_length=255, blank=True)
    issuer = models.CharField(max_length=255, blank=True)
    issue_date = models.CharField(max_length=50, blank=True)
    expiry_date = models.CharField(max_length=50, blank=True)
    credential_url = models.URLField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} — {self.issuer}"


# ── NEW MODELS ────────────────────────────────────────────────────────────────

class Language(models.Model):
    PROFICIENCY_CHOICES = [
        ('native', 'Native / Bilingual'),
        ('fluent', 'Fluent'),
        ('professional', 'Professional Working'),
        ('intermediate', 'Intermediate'),
        ('basic', 'Basic'),
    ]
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='languages')
    name = models.CharField(max_length=100)
    proficiency = models.CharField(max_length=20, choices=PROFICIENCY_CHOICES, default='intermediate')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.name} ({self.proficiency})"


class VolunteerWork(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='volunteer_works')
    organization = models.CharField(max_length=255, blank=True)
    role = models.CharField(max_length=255, blank=True)
    start_date = models.CharField(max_length=50, blank=True)
    end_date = models.CharField(max_length=50, blank=True)
    current = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.role} @ {self.organization}"


class Award(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE, related_name='awards')
    title = models.CharField(max_length=255, blank=True)
    issuer = models.CharField(max_length=255, blank=True)
    date = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.title
