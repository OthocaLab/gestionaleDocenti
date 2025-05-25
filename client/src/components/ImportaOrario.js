/**
 * Componente per l'importazione degli orari scolastici
 * Utilizza un file CSS dedicato (ImportaOrario.module.css) per una migliore organizzazione
 */
import { useState, useEffect } from 'react';
import { importOrario, getImportStatus } from '../services/orarioService';
import styles from '../styles/ImportaOrario.module.css';
import axios from 'axios';

const ImportaOrario = () => {
  const [file, setFile] = useState(null);
  const [classiInsegnamentoFile, setClassiInsegnamentoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [polling, setPolling] = useState(false);

  // Polling per monitorare lo stato dell'importazione
  useEffect(() => {
    let interval;
    
    if (polling) {
      interval = setInterval(async () => {
        try {
          const status = await getImportStatus();
          setImportStatus(status.data);
          
          // Se l'importazione è completata, ferma il polling
          if (!status.data.isRunning) {
            setPolling(false);
            setLoading(false);
            
            if (status.data.currentStep === 'Importazione completata con successo') {
              setMessage(`Importazione completata con successo! 
                Processati ${status.data.processedTeachers}/${status.data.totalTeachers} docenti.
                ${status.data.errors.length > 0 ? `Errori: ${status.data.errors.length}` : ''}`);
            } else {
              setError(`Importazione fallita: ${status.data.currentStep}`);
            }
          }
        } catch (err) {
          console.error('Errore nel polling dello stato:', err);
        }
      }, 2000); // Polling ogni 2 secondi
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [polling]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
    setImportStatus(null);
  };

  const handleClassiInsegnamentoFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setClassiInsegnamentoFile(selectedFile);
    setMessage('');
    setError('');
    
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          // Show preview of first 3 items
          setPreview(jsonData.slice(0, 3));
        } catch (err) {
          setError('Il file selezionato non è un JSON valido');
          setPreview(null);
        }
      };
      reader.readAsText(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Seleziona un file da importare');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setError('');
      setImportStatus(null);
      
      // Invia il file direttamente al server
      const response = await importOrario(file);
      
      if (response.updatedSchedules !== undefined) {
        // Risposta vecchia API che contiene le statistiche complete
        setMessage(`Orario importato con successo! ${response.updatedSchedules} orari importati, ${response.newClasses} nuove classi, ${response.insertedTeachers} nuovi docenti, ${response.newSubjects} nuove materie.`);
        setLoading(false);
      } else {
        // Risposta nuova API asincrona - inizia il polling
        setMessage(`File ricevuto correttamente. L'importazione è in corso...`);
        setPolling(true);
      }
      
      setFile(null);
      // Reset file input
      document.getElementById('orarioFile').value = '';
    } catch (err) {
      setError('Errore durante l\'importazione: ' + (err.message || 'Errore nella richiesta al server'));
      setLoading(false);
    }
  };

  const handleClassiInsegnamentoSubmit = async (e) => {
    e.preventDefault();
    
    if (!classiInsegnamentoFile) {
      setError('Seleziona un file JSON da importare');
      return;
    }
    
    setLoading(true);
    setMessage('');
    setError('');
    
    const formData = new FormData();
    formData.append('file', classiInsegnamentoFile);
    
    try {
      const response = await axios.post('/api/classi-insegnamento/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage(`Importazione completata con successo! ${response.data.imported} classi di insegnamento importate.`);
      setClassiInsegnamentoFile(null);
      setPreview(null);
      // Reset file input
      document.getElementById('classiInsegnamentoFile').value = '';
    } catch (err) {
      setError(`Errore durante l'importazione: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.importContainer}>
      <div className={styles.tabContent}>
        <h3>Importa Orario</h3>
        
        <form onSubmit={handleSubmit} className={styles.importForm}>
          <div className={styles.fileInput}>
            <label htmlFor="orarioFile">Seleziona file JSON con l'orario:</label>
            <input
              type="file"
              id="orarioFile"
              accept=".json"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.importButton}
            disabled={!file || loading}
          >
            {loading ? 'Importazione in corso...' : 'Importa Orario'}
          </button>
        </form>
        
        {/* Stato dell'importazione */}
        {importStatus && (
          <div className={styles.importStatus}>
            <h4>Stato Importazione:</h4>
            <div className={styles.statusInfo}>
              <p><strong>Stato:</strong> {importStatus.currentStep}</p>
              <p><strong>Progresso:</strong> {importStatus.processedTeachers}/{importStatus.totalTeachers} docenti ({importStatus.progress}%)</p>
              {importStatus.progress > 0 && (
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${importStatus.progress}%` }}
                  ></div>
                </div>
              )}
              {importStatus.errors.length > 0 && (
                <div className={styles.errorList}>
                  <p><strong>Errori ({importStatus.errors.length}):</strong></p>
                  <ul>
                    {importStatus.errors.slice(0, 5).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {importStatus.errors.length > 5 && (
                      <li>... e altri {importStatus.errors.length - 5} errori</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        {message && <div className={styles.successMessage}>{message}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.instructions}>
          <h4>Formato del file JSON:</h4>
          <pre>
            {`{
  "orari": [
    {
      "professore": "ARDU",
      "lezioni": [
        {
          "giorno": "LU",
          "ora": "8:15",
          "classe": "2G",
          "aula": "S02",
          "materia": "LET"
        },
        ...
      ]
    },
    ...
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ImportaOrario;