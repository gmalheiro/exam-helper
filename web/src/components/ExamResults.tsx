import React, { useState } from 'react';
import { ExamResult, ExamMode } from '../types/exam';
import './ExamResults.css';

interface ExamResultsProps {
  result: ExamResult;
  examMode: ExamMode;
  onBack: () => void;
}

const ExamResults: React.FC<ExamResultsProps> = ({ result, examMode, onBack }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [filterCorrect, setFilterCorrect] = useState<boolean | null>(null);

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#28a745';
    if (score >= 60) return '#fd7e14';
    return '#dc3545';
  };

  const getScoreEmoji = (score: number): string => {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🎉';
    if (score >= 70) return '👏';
    if (score >= 60) return '👍';
    return '💪';
  };

  const filteredDetails = result.details.filter(detail => {
    if (filterCorrect === null) return true;
    return detail.is_correct === filterCorrect;
  });

  const downloadResults = () => {
    const data = {
      exam_id: result.exam_id,
      score: result.score,
      correct_answers: result.correct_answers,
      wrong_answers: result.wrong_answers,
      total_questions: result.total_questions,
      time_taken: formatTime(result.time_taken),
      exam_mode: examMode,
      details: result.details,
      generated_at: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exam-result-${result.exam_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="exam-results-container">
      <div className="results-card">
        <div className="results-header">
          <h1>Resultado da Prova {getScoreEmoji(result.score)}</h1>
          <div className="exam-mode-badge">
            {examMode === 'timer' ? 'Modo Temporizador' : 'Modo Cronômetro'}
          </div>
        </div>

        <div className="score-section">
          <div className="score-circle">
            <div 
              className="score-value" 
              style={{ color: getScoreColor(result.score) }}
            >
              {result.score.toFixed(1)}%
            </div>
            <div className="score-label">Nota Final</div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item correct">
            <div className="stat-value">{result.correct_answers}</div>
            <div className="stat-label">Acertos</div>
          </div>
          
          <div className="stat-item wrong">
            <div className="stat-value">{result.wrong_answers}</div>
            <div className="stat-label">Erros</div>
          </div>
          
          <div className="stat-item total">
            <div className="stat-value">{result.total_questions}</div>
            <div className="stat-label">Total</div>
          </div>
          
          <div className="stat-item time">
            <div className="stat-value">{formatTime(result.time_taken)}</div>
            <div className="stat-label">Tempo</div>
          </div>
        </div>

        <div className="performance-bar">
          <div className="performance-label">Desempenho:</div>
          <div className="bar-container">
            <div 
              className="performance-fill correct-fill"
              style={{ width: `${(result.correct_answers / result.total_questions) * 100}%` }}
            />
            <div 
              className="performance-fill wrong-fill"
              style={{ width: `${(result.wrong_answers / result.total_questions) * 100}%` }}
            />
          </div>
          <div className="bar-legend">
            <span className="legend-item correct">
              <span className="legend-color"></span>
              Corretas ({result.correct_answers})
            </span>
            <span className="legend-item wrong">
              <span className="legend-color"></span>
              Incorretas ({result.wrong_answers})
            </span>
          </div>
        </div>

        <div className="actions-section">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="details-button"
          >
            {showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}
          </button>
          
          <button 
            onClick={downloadResults}
            className="download-button"
          >
            📥 Baixar Resultado
          </button>
        </div>

        {showDetails && (
          <div className="details-section">
            <div className="details-header">
              <h3>Detalhes por Questão</h3>
              
              <div className="filter-buttons">
                <button
                  onClick={() => setFilterCorrect(null)}
                  className={`filter-btn ${filterCorrect === null ? 'active' : ''}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterCorrect(true)}
                  className={`filter-btn correct ${filterCorrect === true ? 'active' : ''}`}
                >
                  Corretas
                </button>
                <button
                  onClick={() => setFilterCorrect(false)}
                  className={`filter-btn wrong ${filterCorrect === false ? 'active' : ''}`}
                >
                  Incorretas
                </button>
              </div>
            </div>

            <div className="questions-details">
              {filteredDetails.map((detail) => (
                <div 
                  key={detail.question_number} 
                  className={`question-detail ${detail.is_correct ? 'correct' : 'wrong'}`}
                >
                  <div className="question-number">
                    Q{detail.question_number}
                  </div>
                  
                  <div className="question-answers">
                    <div className="answer-row">
                      <span className="answer-label">Sua resposta:</span>
                      <span className={`answer-value ${detail.is_correct ? 'correct' : 'wrong'}`}>
                        {detail.user_answer || 'Não respondida'}
                      </span>
                    </div>
                    
                    {!detail.is_correct && (
                      <div className="answer-row">
                        <span className="answer-label">Resposta correta:</span>
                        <span className="answer-value correct">
                          {detail.correct_answer}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="result-icon">
                    {detail.is_correct ? '✅' : '❌'}
                  </div>
                </div>
              ))}
              
              {filteredDetails.length === 0 && (
                <div className="no-results">
                  Nenhuma questão encontrada com o filtro selecionado.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="footer-actions">
          <button onClick={onBack} className="back-button">
            Nova Prova
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;
