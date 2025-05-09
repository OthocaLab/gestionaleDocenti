import { useState } from 'react';
import { importOrarioDocenti } from '../services/orarioService';
import styles from '../styles/Orario.module.css';

const ImportaOrarioDocenti = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setMessage({ text: '', type: '' });
    
    // Aggiungi anteprima del file JSON
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target.result);
          // Mostra anteprima dei primi 2 docenti
          if (jsonData.orari && Array.isArray(jsonData.orari)) {
            const previewData = {
              orari: jsonData.orari.slice(0, 2).map(docente => ({
                ...docente,
                lezioni: docente.lezioni ? docente.lezioni.slice(0, 2) : []
              }))
            };
            setPreview(previewData);
          } else {
            setMessage({ 
              text: 'Formato JSON non valido. Deve contenere un array "orari"', 
              type: 'error' 
            });
            setPreview(null);
          }
        } catch (err) {
          setMessage({ 
            text: 'Il file selezionato non è un JSON valido', 
            type: 'error' 
          });
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
      setMessage({ text: 'Seleziona un file prima di procedere', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await importOrarioDocenti(file);
      
      // Mostra messaggio di successo con dettagli sull'importazione
      setMessage({
        text: `Importazione completata con successo! 
               Docenti elaborati: ${response.data.processedTeachers}, 
               Nuovi docenti: ${response.data.newTeachers || 0}, 
               Docenti aggiornati: ${response.data.updatedTeachers || 0}`,
        type: 'success'
      });
      
      setFile(null);
      setPreview(null);
      // Reset input file
      e.target.reset();
    } catch (error) {
      console.error('Errore durante l\'importazione:', error);
      setMessage({
        text: error.response?.data?.message || error.message || 'Si è verificato un errore durante l\'importazione',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.importPanel}>
      <h3>Importa Orario Docenti</h3>
      
      {message.text && (
        <div className={message.type === 'error' ? styles.errorMessage : styles.successMessage}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.importForm}>
        <div className={styles.fileInput}>
          <label htmlFor="orarioFile">Seleziona il file JSON degli orari:</label>
          <input
            type="file"
            id="orarioFile"
            accept=".json"
            onChange={handleFileChange}
            className={styles.formControl}
          />
        </div>
        
        {preview && (
          <div className={styles.previewContainer}>
            <h4>Anteprima (primi 2 docenti):</h4>
            <pre className={styles.jsonPreview}>
              {JSON.stringify(preview, null, 2)}
            </pre>
          </div>
        )}
        
        <button 
          type="submit" 
          className={styles.importButton}
          disabled={loading || !file}
        >
          {loading ? 'Importazione in corso...' : 'Importa Orario'}
        </button>
      </form>
      
      <div className={styles.instructions}>
        <h4>Formato del file JSON:</h4>
        <p>Il file deve contenere un array di docenti con le relative lezioni e classi di insegnamento.</p>
        <p>I dati verranno salvati nel database configurato nel file .env del server.</p>
        <pre>
{`{
  "orari": [
    {
      "nome": "",
      "cognome": "",
      "telefono": "",
      "codiceFiscale": "",
      "email": "",
      "stato": "attivo",
      "classiInsegnamento": [
        "A-12"
      ],
      "professore": "COGNOME",
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
  );
};

export default ImportaOrarioDocenti;