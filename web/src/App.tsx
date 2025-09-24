import React, { useState } from 'react';
import CreateExam from './components/CreateExam';
import ExamInterface from './components/ExamInterface';
import './App.css';

type AppState = 'create' | 'exam';

function App() {
  const [currentState, setCurrentState] = useState<AppState>('create');
  const [currentExamId, setCurrentExamId] = useState<string>('');

  const handleExamCreated = (examId: string) => {
    setCurrentExamId(examId);
    setCurrentState('exam');
  };

  const handleBackToCreate = () => {
    setCurrentExamId('');
    setCurrentState('create');
  };

  return (
    <div className="App">
      {currentState === 'create' && (
        <CreateExam onExamCreated={handleExamCreated} />
      )}
      
      {currentState === 'exam' && currentExamId && (
        <ExamInterface 
          examId={currentExamId} 
          onBack={handleBackToCreate}
        />
      )}
    </div>
  );
}

export default App;
