import { useState } from 'react';
import { importOrario } from '../services/orarioService';
import styles from '../styles/Orario.module.css';
import axios from 'axios';

const ImportaOrario = () => {
  const [file, setFile] = useState(null);
  const [classiInsegnamentoFile, setClassiInsegnamentoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
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
      
      // Invia il file direttamente al server
      const response = await importOrario(file);
      
      if (response.updatedSchedules !== undefined) {
        // Risposta vecchia API che contiene le statistiche complete
        setMessage(`Orario importato con successo! ${response.updatedSchedules} orari importati, ${response.newClasses} nuove classi, ${response.insertedTeachers} nuovi docenti, ${response.newSubjects} nuove materie.`);
      } else {
        // Risposta nuova API asincrona
        setMessage(`File ricevuto correttamente. L'importazione continua in background sul server. 
          I dati saranno disponibili a breve. L'operazione potrebbe richiedere alcuni minuti 
          per file di grandi dimensioni.`);
      }
      
      setFile(null);
      // Reset file input
      document.getElementById('orarioFile').value = '';
    } catch (err) {
      setError('Errore durante l\'importazione: ' + (err.message || 'Errore nella richiesta al server'));
    } finally {
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