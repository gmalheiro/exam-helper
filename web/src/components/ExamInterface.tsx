import React, { useState, useEffect, useCallback } from 'react';
import { examAPI } from '../services/api';
import { Exam, ExamStatus as ExamStatusType, ExamResult } from '../types/exam';
import Timer from './Timer';
import Stopwatch from './Stopwatch';
import AnswerForm from './AnswerForm';
import ExamResults from './ExamResults';
import './ExamInterface.css';

interface ExamInterfaceProps {
  examId: string;
  onBack: () => void;
}

const ExamInterface: React.FC<ExamInterfaceProps> = ({ examId, onBack }) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [examStatus, setExamStatus] = useState<ExamStatusType | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Load exam data
  const loadExam = useCallback(async () => {
    try {
      const [examResponse, statusResponse] = await Promise.all([
        examAPI.getExam(examId),
        examAPI.getExamStatus(examId)
      ]);
      
      setExam(examResponse.exam);
      setExamStatus(statusResponse);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar prova');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  // Update exam status periodically
  const updateStatus = useCallback(async () => {
    if (!exam || exam.status === 'completed' || exam.status === 'expired') {
      return;
    }

    try {
      const statusResponse = await examAPI.getExamStatus(examId);
      setExamStatus(statusResponse);
      
      // If exam expired, auto-submit
      if (statusResponse.status === 'expired' && exam.status === 'active') {
        handleAutoSubmit();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  }, [exam, examId]);

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  useEffect(() => {
    if (!exam || exam.status !== 'active') return;

    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [exam, updateStatus]);

  const handleStartExam = async () => {
    try {
      setLoading(true);
      const response = await examAPI.startExam(examId);
      setExam(response.exam);
      await loadExam(); // Refresh status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar prova');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!exam) return;

    try {
      setLoading(true);
      const response = await examAPI.submitAnswers(examId, answers);
      setResult(response.result);
      setExam(prev => prev ? { ...prev, status: 'completed' } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao submeter respostas');
      setLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!exam || Object.keys(answers).length === 0) return;

    try {
      const response = await examAPI.submitAnswers(examId, answers);
      setResult(response.result);
      setExam(prev => prev ? { ...prev, status: 'expired' } : null);
    } catch (err) {
      console.error('Auto-submit failed:', err);
    }
  };

  const handleTimeUp = () => {
    handleAutoSubmit();
  };

  if (loading) {
    return (
      <div className="exam-interface-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando prova...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exam-interface-container">
        <div className="error-container">
          <h2>Erro</h2>
          <p>{error}</p>
          <button onClick={onBack} className="back-button">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  if (!exam || !examStatus) {
    return (
      <div className="exam-interface-container">
        <div className="error-container">
          <h2>Prova não encontrada</h2>
          <button onClick={onBack} className="back-button">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Show results if exam is completed
  if (result) {
    return (
      <ExamResults 
        result={result} 
        examMode={exam.mode}
        onBack={onBack}
      />
    );
  }

  // Show start screen if exam is pending
  if (exam.status === 'pending') {
    return (
      <div className="exam-interface-container">
        <div className="exam-start-card">
          <h1>Prova Preparada</h1>
          
          <div className="exam-info">
            <div className="info-item">
              <strong>Modo:</strong> {exam.mode === 'timer' ? 'Temporizador' : 'Cronômetro'}
            </div>
            
            {exam.mode === 'timer' && exam.duration && (
              <div className="info-item">
                <strong>Duração:</strong> {Math.round(exam.duration / 60000)} minutos
              </div>
            )}
            
            <div className="info-item">
              <strong>Instruções:</strong>
              <ul>
                <li>Responda todas as questões marcando A, B, C, D ou E</li>
                <li>{exam.mode === 'timer' 
                  ? 'A prova será submetida automaticamente quando o tempo acabar' 
                  : 'Você pode submeter a prova quando terminar'
                }</li>
                <li>Certifique-se de ter uma conexão estável com a internet</li>
              </ul>
            </div>
          </div>

          <button 
            onClick={handleStartExam}
            className="start-exam-button"
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Iniciar Prova'}
          </button>
        </div>
      </div>
    );
  }

  // Show active exam interface
  return (
    <div className="exam-interface-container">
      <div className="exam-header">
        <div className="exam-title">
          <h1>Prova em Andamento</h1>
          <span className="exam-mode">
            Modo: {exam.mode === 'timer' ? 'Temporizador' : 'Cronômetro'}
          </span>
        </div>
        
        <div className="timer-container">
          {exam.mode === 'timer' ? (
            <Timer
              duration={exam.duration || 0}
              startTime={examStatus.start_time}
              onTimeUp={handleTimeUp}
            />
          ) : (
            <Stopwatch startTime={examStatus.start_time} />
          )}
        </div>
      </div>

      <div className="exam-content">
        <AnswerForm
          examId={examId}
          answers={answers}
          onAnswersChange={setAnswers}
          onSubmit={handleSubmitAnswers}
          canSubmit={exam.mode === 'stopwatch'}
          loading={loading}
        />
      </div>

      <div className="exam-footer">
        <button onClick={onBack} className="back-button secondary">
          Cancelar Prova
        </button>
      </div>
    </div>
  );
};

export default ExamInterface;
