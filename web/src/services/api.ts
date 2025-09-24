import axios from 'axios';
import { Exam, CreateExamRequest, SubmitAnswersRequest, ExamResult, ExamStatus } from '../types/exam';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export const examAPI = {
  // Create a new exam
  createExam: async (formData: FormData): Promise<{ exam: Exam; message: string }> => {
    const response = await api.post('/exams', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get exam details
  getExam: async (examId: string): Promise<{ exam: Exam }> => {
    const response = await api.get(`/exams/${examId}`);
    return response.data;
  },

  // Start an exam
  startExam: async (examId: string): Promise<{ exam: Exam; message: string }> => {
    const response = await api.post(`/exams/${examId}/start`);
    return response.data;
  },

  // Submit answers
  submitAnswers: async (examId: string, answers: Record<string, string>): Promise<{ result: ExamResult; message: string }> => {
    const response = await api.post(`/exams/${examId}/submit`, { answers });
    return response.data;
  },

  // Get exam status
  getExamStatus: async (examId: string): Promise<ExamStatus> => {
    const response = await api.get(`/exams/${examId}/status`);
    return response.data;
  },

  // Get answer key preview
  getAnswerKeyPreview: async (examId: string): Promise<{ preview: Record<string, string> }> => {
    const response = await api.get(`/exams/${examId}/answer-key-preview`);
    return response.data;
  },
};

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
);
