from django.contrib import admin
from .models import Resume, WorkExperience, Education, Skill, Project, Certification


class WorkExperienceInline(admin.TabularInline):
    model = WorkExperience
    extra = 0


class EducationInline(admin.TabularInline):
    model = Education
    extra = 0


class SkillInline(admin.TabularInline):
    model = Skill
    extra = 0


class ProjectInline(admin.TabularInline):
    model = Project
    extra = 0


class CertificationInline(admin.TabularInline):
    model = Certification
    extra = 0


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ['title', 'user', 'template', 'full_name', 'email', 'updated_at']
    list_filter = ['template', 'created_at']
    search_fields = ['title', 'user__username', 'full_name', 'email']
    inlines = [WorkExperienceInline, EducationInline, SkillInline, ProjectInline, CertificationInline]


admin.site.register(WorkExperience)
admin.site.register(Education)
admin.site.register(Skill)
admin.site.register(Project)
admin.site.register(Certification)
