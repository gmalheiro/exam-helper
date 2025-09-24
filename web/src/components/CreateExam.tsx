import React, { useState } from 'react';
import { examAPI } from '../services/api';
import { ExamMode } from '../types/exam';
import './CreateExam.css';

interface CreateExamProps {
  onExamCreated: (examId: string) => void;
}

const CreateExam: React.FC<CreateExamProps> = ({ onExamCreated }) => {
  const [mode, setMode] = useState<ExamMode>('timer');
  const [duration, setDuration] = useState<number>(60);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examFile || !answerKeyFile) {
      setError('Por favor, selecione ambos os arquivos (prova e gabarito)');
      return;
    }

    if (mode === 'timer' && (!duration || duration <= 0)) {
      setError('Por favor, informe uma duração válida para o modo temporizador');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('mode', mode);
      if (mode === 'timer') {
        formData.append('duration', duration.toString());
      }
      formData.append('exam_pdf', examFile);
      formData.append('answer_key', answerKeyFile);

      const response = await examAPI.createExam(formData);
      onExamCreated(response.exam.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar prova');
    } finally {
      setLoading(false);
    }
  };

  const handleExamFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('O arquivo da prova deve ser um PDF');
        return;
      }
      setExamFile(file);
      setError('');
    }
  };

  const handleAnswerKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['text/plain', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setError('O gabarito deve ser um arquivo TXT ou PDF');
        return;
      }
      setAnswerKeyFile(file);
      setError('');
    }
  };

  return (
    <div className="create-exam-container">
      <div className="create-exam-card">
        <h1 className="create-exam-title">Criar Nova Prova</h1>
        
        <form onSubmit={handleSubmit} className="create-exam-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label className="form-label">Modo da Prova:</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="timer"
                  checked={mode === 'timer'}
                  onChange={(e) => setMode(e.target.value as ExamMode)}
                />
                <span className="radio-text">
                  <strong>Temporizador</strong> - Tempo limitado com submissão automática
                </span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="stopwatch"
                  checked={mode === 'stopwatch'}
                  onChange={(e) => setMode(e.target.value as ExamMode)}
                />
                <span className="radio-text">
                  <strong>Cronômetro</strong> - Registra o tempo, submissão manual
                </span>
              </label>
            </div>
          </div>

          {mode === 'timer' && (
            <div className="form-group">
              <label htmlFor="duration" className="form-label">
                Duração (minutos):
              </label>
              <input
                type="number"
                id="duration"
                min="1"
                max="300"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="form-input"
                placeholder="Ex: 60"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="exam-file" className="form-label">
              Arquivo da Prova (PDF):
            </label>
            <input
              type="file"
              id="exam-file"
              accept=".pdf"
              onChange={handleExamFileChange}
              className="form-input file-input"
              required
            />
            {examFile && (
              <div className="file-info">
                ✅ {examFile.name} ({Math.round(examFile.size / 1024)} KB)
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="answer-key-file" className="form-label">
              Gabarito (TXT ou PDF):
            </label>
            <input
              type="file"
              id="answer-key-file"
              accept=".txt,.pdf"
              onChange={handleAnswerKeyFileChange}
              className="form-input file-input"
              required
            />
            {answerKeyFile && (
              <div className="file-info">
                ✅ {answerKeyFile.name} ({Math.round(answerKeyFile.size / 1024)} KB)
              </div>
            )}
            <div className="file-help">
              <p>O gabarito deve seguir o formato:</p>
              <code>
                1. A<br/>
                2. B<br/>
                3. C<br/>
                ...
              </code>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Criando Prova...' : 'Criar Prova'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateExam;
