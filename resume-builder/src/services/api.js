import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/#/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth
export const register = (d) => api.post('/auth/register/', d);
export const login = (d) => api.post('/auth/login/', d);
export const getMe = () => api.get('/auth/me/');

// ── Resumes
export const getResumes = () => api.get('/resumes/');
export const getResume = (id) => api.get(`/resumes/${id}/`);
export const createResume = (d) => api.post('/resumes/', d);
export const updateResume = (id, d) => api.patch(`/resumes/${id}/`, d);
export const deleteResume = (id) => api.delete(`/resumes/${id}/`);
export const duplicateResume = (id) => api.post(`/resumes/${id}/duplicate/`);

// ── Work Experience
export const getExperiences = (rid) => api.get(`/resumes/${rid}/experience/`);
export const createExperience = (rid, d) => api.post(`/resumes/${rid}/experience/`, d);
export const updateExperience = (id, d) => api.patch(`/experience/${id}/`, d);
export const deleteExperience = (id) => api.delete(`/experience/${id}/`);

// ── Education
export const getEducations = (rid) => api.get(`/resumes/${rid}/education/`);
export const createEducation = (rid, d) => api.post(`/resumes/${rid}/education/`, d);
export const updateEducation = (id, d) => api.patch(`/education/${id}/`, d);
export const deleteEducation = (id) => api.delete(`/education/${id}/`);

// ── Skills
export const getSkills = (rid) => api.get(`/resumes/${rid}/skills/`);
export const createSkill = (rid, d) => api.post(`/resumes/${rid}/skills/`, d);
export const deleteSkill = (id) => api.delete(`/skills/${id}/`);

// ── Projects
export const getProjects = (rid) => api.get(`/resumes/${rid}/projects/`);
export const createProject = (rid, d) => api.post(`/resumes/${rid}/projects/`, d);
export const updateProject = (id, d) => api.patch(`/projects/${id}/`, d);
export const deleteProject = (id) => api.delete(`/projects/${id}/`);

// ── Certifications
export const getCertifications = (rid) => api.get(`/resumes/${rid}/certifications/`);
export const createCertification = (rid, d) => api.post(`/resumes/${rid}/certifications/`, d);
export const updateCertification = (id, d) => api.patch(`/certifications/${id}/`, d);
export const deleteCertification = (id) => api.delete(`/certifications/${id}/`);

// ── Languages (NEW)
export const getLanguages = (rid) => api.get(`/resumes/${rid}/languages/`);
export const createLanguage = (rid, d) => api.post(`/resumes/${rid}/languages/`, d);
export const deleteLanguage = (id) => api.delete(`/languages/${id}/`);

// ── Volunteer (NEW)
export const getVolunteer = (rid) => api.get(`/resumes/${rid}/volunteer/`);
export const createVolunteer = (rid, d) => api.post(`/resumes/${rid}/volunteer/`, d);
export const updateVolunteer = (id, d) => api.patch(`/volunteer/${id}/`, d);
export const deleteVolunteer = (id) => api.delete(`/volunteer/${id}/`);

// ── Awards (NEW)
export const getAwards = (rid) => api.get(`/resumes/${rid}/awards/`);
export const createAward = (rid, d) => api.post(`/resumes/${rid}/awards/`, d);
export const updateAward = (id, d) => api.patch(`/awards/${id}/`, d);
export const deleteAward = (id) => api.delete(`/awards/${id}/`);

// ── AI
export const aiSummary = (context) => api.post('/ai/summary/', { context });
export const aiSkills = (role, existing_skills = []) => api.post('/ai/skills/', { role, existing_skills });
export const aiEnhanceBullet = (text, job_title) => api.post('/ai/enhance-bullet/', { text, job_title });
export const aiATSScore = (resume_text, job_description) => api.post('/ai/ats-score/', { resume_text, job_description });
export const aiCoverLetter = (d) => api.post('/ai/cover-letter/', d);
export const aiJobTitles = (skills, experience) => api.post('/ai/job-titles/', { skills, experience });
export const aiResumeReview = (resume_text) => api.post('/ai/resume-review/', { resume_text });

export default api;
