import React, { useState, useEffect } from 'react';
import styles from '../styles/ImportaOrario.module.css';

const ProgressBarTest = () => {
  const [progress, setProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval;
    if (isRunning && !isCompleted) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsCompleted(true);
            setIsRunning(false);
            return 100;
          }
          return prev + 5;
        });
      }, 200);
    }
    return () => clearInterval(interval);
  }, [isRunning, isCompleted]);

  const startTest = () => {
    setProgress(0);
    setIsCompleted(false);
    setIsRunning(true);
  };

  const resetTest = () => {
    setProgress(0);
    setIsCompleted(false);
    setIsRunning(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🧪 Test Progress Bar - Importazione Dati</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={startTest} 
          disabled={isRunning}
          style={{
            backgroundColor: '#971645',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            marginRight: '10px'
          }}
        >
          Avvia Test
        </button>
        <button 
          onClick={resetTest}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px'
          }}
        >
          Reset
        </button>
      </div>

      <div className={styles.importStatus}>
        <h4>Stato Importazione Test:</h4>
        <div className={styles.statusInfo}>
          <p><strong>Stato:</strong> {isCompleted ? 'Importazione completata con successo' : isRunning ? 'Importazione in corso...' : 'In attesa'}</p>
          <p><strong>Progresso:</strong> {Math.round(progress)}/100 elementi ({Math.round(progress)}%)</p>
          
          {progress > 0 && (
            <div className={styles.progressBar}>
              <div 
                className={`${styles.progressFill} ${isCompleted ? styles.progressCompleted : ''}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
          
          {isCompleted && (
            <div className={styles.completedMessage}>
              ✅ Importazione completata! La barra scomparirà automaticamente...
            </div>
          )}
        </div>
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4>Come testare:</h4>
        <ol>
          <li>Clicca "Avvia Test" per simulare l'importazione</li>
          <li>Osserva l'animazione della barra mentre progredisce</li>
          <li>Al 100% l'animazione dovrebbe fermarsi</li>
          <li>Apparirà il messaggio di completamento</li>
          <li>Usa "Reset" per ripetere il test</li>
        </ol>
        <p><strong>Comportamento atteso:</strong> L'animazione della barra si ferma quando il progresso raggiunge il 100%, invece di continuare all'infinito come prima.</p>
      </div>
    </div>
  );
};

export default ProgressBarTest; 