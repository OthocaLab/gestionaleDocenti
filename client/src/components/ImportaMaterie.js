import { useState } from 'react';
import axios from 'axios';
import styles from '../styles/Orario.module.css';

const ImportaMaterie = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Seleziona un file da importare');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      setLoading(true);
      const response = await axios.post('/api/materie/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess('Materie importate con successo!');
      setFile(null);
      
      // Reset file input
      e.target.reset();
      
      // Notify parent component to refresh the list
      if (onImportComplete) {
        onImportComplete();
      }
      
      setLoading(false);
    } catch (err) {
      setError('Errore nell\'importazione delle materie: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  return (
    <div className={styles.importSection}>
      <h4>Importa Materie da File</h4>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      <form onSubmit={handleSubmit} className={styles.importForm}>
        <div className={styles.formGroup}>
          <label htmlFor="file">Seleziona file (CSV, Excel):</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            className={styles.fileInput}
          />
        </div>
        
        <div className={styles.importInfo}>
          <p>Formato atteso:</p>
          <ul>
            <li>Colonna 1: Codice Materia</li>
            <li>Colonna 2: Descrizione</li>
            <li>Colonna 3: Colore (opzionale, formato HEX)</li>
            <li>Colonna 4: Decreto Ministeriale (opzionale)</li>
          </ul>
        </div>
        
        <button 
          type="submit" 
          className={styles.importButton}
          disabled={loading || !file}
        >
          {loading ? 'Importazione in corso...' : 'Importa Materie'}
        </button>
      </form>
    </div>
  );
};

export default ImportaMaterie;