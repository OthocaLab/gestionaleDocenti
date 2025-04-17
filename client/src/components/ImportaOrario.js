import { useState } from 'react';
import { importOrario } from '../services/orarioService';
import GestioneMaterie from './GestioneMaterie';
import GestioneClassi from './GestioneClassi';
import styles from '../styles/Orario.module.css';
import axios from 'axios';

const ImportaOrario = () => {
  const [file, setFile] = useState(null);
  const [classiInsegnamentoFile, setClassiInsegnamentoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('importa');
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
          <button 
            className={activeTab === 'classiInsegnamento' ? styles.activeTab : ''}
            onClick={() => setActiveTab('classiInsegnamento')}
          >
            Importa Classi Insegnamento
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
      
      {activeTab === 'classiInsegnamento' && (
        <div className={styles.tabContent}>
          <h3>Importa Classi di Insegnamento</h3>
          
          <form onSubmit={handleClassiInsegnamentoSubmit} className={styles.importForm}>
            <div className={styles.fileInput}>
              <label htmlFor="classiInsegnamentoFile">Seleziona file JSON con le classi di insegnamento:</label>
              <input
                type="file"
                id="classiInsegnamentoFile"
                accept=".json"
                onChange={handleClassiInsegnamentoFileChange}
                disabled={loading}
              />
            </div>
            
            {preview && (
              <div className={styles.previewContainer}>
                <h4>Anteprima (prime 3 classi):</h4>
                <pre className={styles.jsonPreview}>
                  {JSON.stringify(preview, null, 2)}
                </pre>
              </div>
            )}
            
            <button 
              type="submit" 
              className={styles.importButton}
              disabled={!classiInsegnamentoFile || loading}
            >
              {loading ? 'Importazione in corso...' : 'Importa Classi di Insegnamento'}
            </button>
          </form>
          
          {message && <div className={styles.successMessage}>{message}</div>}
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <div className={styles.instructions}>
            <h4>Formato del file JSON:</h4>
            <pre>
              {`[
  {
    "codice": "A-01",
    "denominazione": "Arte e immagine nella scuola secondaria di I grado",
    "materie": [
      "Arte e Immagine (Scuola secondaria di I grado)"
    ]
  },
  ...
]`}
            </pre>
            <p>
              Il sistema creerà automaticamente le classi di insegnamento e le materie associate se non esistono già.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportaOrario;