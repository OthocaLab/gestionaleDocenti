import { useState } from 'react';
import { importOrario } from '../services/orarioService';
import GestioneMaterie from './GestioneMaterie';
import GestioneClassi from './GestioneClassi';
import styles from '../styles/Orario.module.css';

const ImportaOrario = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('importa');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Seleziona un file da importare');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setLoading(true);
        const fileContent = JSON.parse(event.target.result);
        
        // Invia i dati al server
        const response = await importOrario(fileContent);
        
        setMessage('Orario importato con successo!');
        setLoading(false);
      } catch (err) {
        setError('Errore durante l\'importazione: ' + (err.message || 'Formato file non valido'));
        setLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Errore nella lettura del file');
      setLoading(false);
    };
    
    reader.readAsText(file);
  };

  return (
    <div className={styles.importContainer}>
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button 
            className={activeTab === 'importa' ? styles.activeTab : ''}
            onClick={() => setActiveTab('importa')}
          >
            Importa Orario
          </button>
          <button 
            className={activeTab === 'materie' ? styles.activeTab : ''}
            onClick={() => setActiveTab('materie')}
          >
            Gestione Materie
          </button>
          <button 
            className={activeTab === 'classi' ? styles.activeTab : ''}
            onClick={() => setActiveTab('classi')}
          >
            Gestione Classi
          </button>
        </div>
      </div>
      
      {activeTab === 'importa' && (
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
              {`[
  {
    "classeId": "id_classe",
    "giornoSettimana": "Lun",
    "ora": 1,
    "oraInizio": "08:00",
    "oraFine": "09:00",
    "docente": "id_docente",
    "materia": "id_materia"
  },
  ...
]`}
            </pre>
          </div>
        </div>
      )}
      
      {activeTab === 'materie' && (
        <div className={styles.tabContent}>
          <GestioneMaterie />
        </div>
      )}
      
      {activeTab === 'classi' && (
        <div className={styles.tabContent}>
          <GestioneClassi />
        </div>
      )}
    </div>
  );
};

export default ImportaOrario;