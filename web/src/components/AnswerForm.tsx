import React, { useState, useEffect } from 'react';
import { examAPI } from '../services/api';
import './AnswerForm.css';

interface AnswerFormProps {
  examId: string;
  answers: Record<string, string>;
  onAnswersChange: (answers: Record<string, string>) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  loading: boolean;
}

const AnswerForm: React.FC<AnswerFormProps> = ({
  examId,
  answers,
  onAnswersChange,
  onSubmit,
  canSubmit,
  loading
}) => {
  const [answerKeyPreview, setAnswerKeyPreview] = useState<Record<string, string>>({});
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  useEffect(() => {
    const loadAnswerKeyPreview = async () => {
      try {
        const response = await examAPI.getAnswerKeyPreview(examId);
        setAnswerKeyPreview(response.preview);
        
        // Get total questions from preview (this is a simplified approach)
        // In a real implementation, you might want to parse the full answer key
        const questionNumbers = Object.keys(response.preview).map(Number).sort((a, b) => a - b);
        const maxQuestion = Math.max(...questionNumbers);
        setTotalQuestions(maxQuestion);
      } catch (err) {
        console.error('Failed to load answer key preview:', err);
        // Fallback: assume 50 questions
        setTotalQuestions(50);
      }
    };

    loadAnswerKeyPreview();
  }, [examId]);

  const handleAnswerChange = (questionNumber: string, answer: string) => {
    const newAnswers = { ...answers, [questionNumber]: answer };
    onAnswersChange(newAnswers);
  };

  const handleSubmitClick = () => {
    if (canSubmit) {
      setShowSubmitConfirm(true);
    }
  };

  const confirmSubmit = () => {
    setShowSubmitConfirm(false);
    onSubmit();
  };

  const cancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key] && answers[key].trim() !== '').length;
  };

  const renderQuestionInputs = () => {
    const inputs = [];
    
    for (let i = 1; i <= totalQuestions; i++) {
      const questionNumber = i.toString();
      const currentAnswer = answers[questionNumber] || '';
      
      inputs.push(
        <div key={questionNumber} className="question-input">
          <label htmlFor={`q${questionNumber}`} className="question-label">
            {questionNumber}.
          </label>
          <div className="answer-options">
            {['A', 'B', 'C', 'D', 'E'].map(option => (
              <label key={option} className="answer-option">
                <input
                  type="radio"
                  name={`q${questionNumber}`}
                  value={option}
                  checked={currentAnswer === option}
                  onChange={(e) => handleAnswerChange(questionNumber, e.target.value)}
                />
                <span className="option-text">{option}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }
    
    return inputs;
  };

  return (
    <div className="answer-form-container">
      <div className="answer-form-header">
        <h2>Respostas da Prova</h2>
        <div className="progress-info">
          <span className="answered-count">
            {getAnsweredCount()} de {totalQuestions} questões respondidas
          </span>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(getAnsweredCount() / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="instructions">
        <p>📝 Marque a alternativa correta para cada questão (A, B, C, D ou E)</p>
        <p>💡 Você pode alterar suas respostas a qualquer momento antes de submeter</p>
      </div>

      <div className="questions-grid">
        {renderQuestionInputs()}
      </div>

      {canSubmit && (
        <div className="submit-section">
          <div className="submit-info">
            <p>
              Você respondeu <strong>{getAnsweredCount()}</strong> de <strong>{totalQuestions}</strong> questões.
            </p>
            {getAnsweredCount() < totalQuestions && (
              <p className="warning">
                ⚠️ Algumas questões não foram respondidas. Você pode submeter mesmo assim.
              </p>
            )}
          </div>
          
          <button
            onClick={handleSubmitClick}
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Submetendo...' : 'Submeter Prova'}
          </button>
        </div>
      )}

      {showSubmitConfirm && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3>Confirmar Submissão</h3>
            <p>
              Você está prestes a submeter sua prova com <strong>{getAnsweredCount()}</strong> questões respondidas.
            </p>
            <p><strong>Esta ação não pode ser desfeita!</strong></p>
            
            <div className="modal-buttons">
              <button onClick={cancelSubmit} className="cancel-button">
                Cancelar
              </button>
              <button onClick={confirmSubmit} className="confirm-button">
                Confirmar Submissão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnswerForm;
