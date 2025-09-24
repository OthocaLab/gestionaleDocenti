import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/GestionePresenze.module.css';

const GestionePresenze = () => {
  const [docenti, setDocenti] = useState([]);
  // Inizializza la data corrente senza problemi di fuso orario
  const getCurrentDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const [dataSelezionata, setDataSelezionata] = useState(getCurrentDateString());
  const [docenteSelezionato, setDocenteSelezionato] = useState('');
  const [assenteGiornataIntera, setAssenteGiornataIntera] = useState(false);
  const [motivoGiornataIntera, setMotivoGiornataIntera] = useState('');
  const [oreAssenza, setOreAssenza] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  const oreDisponibili = [1, 2, 3, 4, 5, 6, 7, 8];
  
  useEffect(() => {
    const fetchDocenti = async () => {
      try {
        const response = await axios.get('/api/docenti');
        setDocenti(response.data);
      } catch (error) {
        console.error('Errore nel recupero dei docenti:', error);
      }
    };
    
    fetchDocenti();
  }, []);
  
  const handleOraAssenzaChange = (ora, checked) => {
    if (checked) {
      // Aggiungi l'ora alle assenze
      setOreAssenza([...oreAssenza, { ora, motivo: '', sostituto: null }]);
    } else {
      // Rimuovi l'ora dalle assenze
      setOreAssenza(oreAssenza.filter(o => o.ora !== ora));
    }
  };
  
  const handleMotivoOraChange = (ora, motivo) => {
    setOreAssenza(oreAssenza.map(o => {
      if (o.ora === ora) {
        return { ...o, motivo };
      }
      return o;
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!docenteSelezionato) {
      setMessage('Seleziona un docente');
      return;
    }
    
    if (!assenteGiornataIntera && oreAssenza.length === 0) {
      setMessage('Seleziona almeno un\'ora di assenza o marca come assente per l\'intera giornata');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post('/api/presenze', {
        docenteId: docenteSelezionato,
        data: dataSelezionata,
        assenteGiornataIntera,
        motivoGiornataIntera: assenteGiornataIntera ? motivoGiornataIntera : null,
        oreAssenza: !assenteGiornataIntera ? oreAssenza : []
      });
      
      setMessage('Assenza registrata con successo');
      
      // Reset del form
      setDocenteSelezionato('');
      setAssenteGiornataIntera(false);
      setMotivoGiornataIntera('');
      setOreAssenza([]);
    } catch (error) {
      setMessage(`Errore: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={styles.container}>
      <h2>Gestione Presenze e Assenze</h2>
      
      {message && (
        <div className={`${styles.message} ${message.includes('Errore') ? styles.error : styles.success}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="data">Data:</label>
          <input
            type="date"
            id="data"
            value={dataSelezionata}
            onChange={(e) => setDataSelezionata(e.target.value)}
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="docente">Docente:</label>
          <select
            id="docente"
            value={docenteSelezionato}
            onChange={(e) => setDocenteSelezionato(e.target.value)}
            className={styles.select}
          >
            <option value="">Seleziona un docente</option>
            {docenti.map(docente => (
              <option key={docente._id} value={docente._id}>
                {docente.nome} {docente.cognome}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={assenteGiornataIntera}
              onChange={(e) => setAssenteGiornataIntera(e.target.checked)}
              className={styles.checkbox}
            />
            Assente per l'intera giornata
          </label>
        </div>
        
        {assenteGiornataIntera && (
          <div className={styles.formGroup}>
            <label htmlFor="motivoGiornata">Motivo dell'assenza:</label>
            <input
              type="text"
              id="motivoGiornata"
              value={motivoGiornataIntera}
              onChange={(e) => setMotivoGiornataIntera(e.target.value)}
              className={styles.input}
              placeholder="Malattia, permesso, ecc."
            />
          </div>
        )}
        
        {!assenteGiornataIntera && (
          <div className={styles.oreContainer}>
            <h3>Seleziona le ore di assenza:</h3>
            <div className={styles.oreGrid}>
              {oreDisponibili.map(ora => (
                <div key={ora} className={styles.oraItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={oreAssenza.some(o => o.ora === ora)}
                      onChange={(e) => handleOraAssenzaChange(ora, e.target.checked)}
                      className={styles.checkbox}
                    />
                    Ora {ora}
                  </label>
                  
                  {oreAssenza.some(o => o.ora === ora) && (
                    <input
                      type="text"
                      value={oreAssenza.find(o => o.ora === ora)?.motivo || ''}
                      onChange={(e) => handleMotivoOraChange(ora, e.target.value)}
                      className={styles.inputSmall}
                      placeholder="Motivo"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <button 
          type="submit" 
          className={styles.button}
          disabled={loading}
        >
          {loading ? 'Registrazione in corso...' : 'Registra Assenza'}
        </button>
      </form>
    </div>
  );
};

export default GestionePresenze;