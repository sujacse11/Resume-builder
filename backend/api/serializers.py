from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Resume, WorkExperience, Education, Skill, Project, Certification, Language, VolunteerWork, Award


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2']

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        if User.objects.filter(email=data.get('email', '')).exists():
            raise serializers.ValidationError({'email': 'Email already registered.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            password=validated_data['password'],
        )
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class WorkExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkExperience
        fields = '__all__'
        read_only_fields = ['resume']


class EducationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Education
        fields = '__all__'
        read_only_fields = ['resume']


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = '__all__'
        read_only_fields = ['resume']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ['resume']


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = '__all__'
        read_only_fields = ['resume']


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = '__all__'
        read_only_fields = ['resume']


class VolunteerWorkSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerWork
        fields = '__all__'
        read_only_fields = ['resume']


class AwardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Award
        fields = '__all__'
        read_only_fields = ['resume']


class ResumeSerializer(serializers.ModelSerializer):
    work_experiences = WorkExperienceSerializer(many=True, read_only=True)
    educations = EducationSerializer(many=True, read_only=True)
    skills = SkillSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    certifications = CertificationSerializer(many=True, read_only=True)
    languages = LanguageSerializer(many=True, read_only=True)
    volunteer_works = VolunteerWorkSerializer(many=True, read_only=True)
    awards = AwardSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Resume
        fields = '__all__'
        read_only_fields = ['user', 'created_at', 'updated_at']


class ResumeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = ['id', 'title', 'template', 'full_name', 'job_title', 'updated_at', 'created_at']
