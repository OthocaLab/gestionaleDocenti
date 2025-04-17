
import { useState } from 'react';
import axios from 'axios';
import styles from '../styles/Orario.module.css';

const ImportaClassiInsegnamento = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    
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
      setError('Seleziona un file JSON');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post('/api/classi-insegnamento/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess(`Importazione completata con successo! ${response.data.imported} classi di insegnamento importate.`);
      setFile(null);
      setPreview(null);
      // Reset file input
      document.getElementById('jsonFile').value = '';
      
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(`Errore durante l'importazione: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.importContainer}>
      <h3>Importa Classi di Insegnamento</h3>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      <form onSubmit={handleSubmit} className={styles.importForm}>
        <div className={styles.formGroup}>
          <label htmlFor="jsonFile">Seleziona file JSON:</label>
          <input
            type="file"
            id="jsonFile"
            accept=".json"
            onChange={handleFileChange}
            className={styles.fileInput}
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
          className={styles.submitButton}
          disabled={loading || !file}
        >
          {loading ? 'Importazione in corso...' : 'Importa Classi di Insegnamento'}
        </button>
      </form>
      
      <div className={styles.infoBox}>
        <h4>Formato JSON richiesto:</h4>
        <pre className={styles.jsonFormat}>
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
          Il campo "codice" diventerà "codiceClasse", "denominazione" diventerà "descrizione" e per ogni materia
          in "materie" verrà creato un record nella tabella Materia se non esiste già.
        </p>
      </div>
    </div>
  );
};

export default ImportaClassiInsegnamento;