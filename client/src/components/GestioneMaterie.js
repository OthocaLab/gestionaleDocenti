import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Orario.module.css';

const GestioneMaterie = () => {
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    codice: '',
    descrizione: '',
    coloreMateria: '#3498db'
  });

  useEffect(() => {
    fetchMaterie();
  }, []);

  const fetchMaterie = async () => {
    try {
      setLoading(true);
      console.log('Fetching materie...');
      const response = await axios.get('/api/materie');
      console.log('Response:', response.data);
      
      // Verifica la struttura della risposta
      if (response.data && Array.isArray(response.data)) {
        setMaterie(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setMaterie(response.data.data);
      } else {
        console.error('Formato risposta non valido:', response.data);
        setError('Formato risposta non valido');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nel caricamento delle materie:', err);
      setError('Errore nel caricamento delle materie: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.codice || !formData.descrizione) {
      setError('Codice e descrizione sono campi obbligatori');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('/api/materie', formData);
      
      setSuccess('Materia creata con successo!');
      setFormData({
        codice: '',
        descrizione: '',
        coloreMateria: '#3498db'
      });
      
      // Ricarica l'elenco delle materie
      fetchMaterie();
      
      setShowForm(false);
      setLoading(false);
    } catch (err) {
      setError('Errore nella creazione della materia: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  return (
    <div className={styles.gestioneMaterieContainer}>
      <div className={styles.headerSection}>
        <h2 className={styles.sectionTitle}>Gestione Materie</h2>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.actionButton} ${showForm ? styles.closeButton : styles.addButton}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Chiudi Form' : '+ Aggiungi Materia'}
          </button>
        </div>
      </div>
      
      {error && <div className={`${styles.alertMessage} ${styles.errorMessage}`}>
        <span className={styles.alertIcon}>⚠️</span> {error}
      </div>}
      
      {success && <div className={`${styles.alertMessage} ${styles.successMessage}`}>
        <span className={styles.alertIcon}>✅</span> {success}
      </div>}
      
      {showForm && (
        <div className={`${styles.formSection} ${styles.cardEffect}`}>
          <h3 className={styles.formTitle}>Inserisci nuova materia</h3>
          <form onSubmit={handleSubmit} className={styles.materiaForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="codice" className={styles.formLabel}>Codice:</label>
                <input
                  type="text"
                  id="codice"
                  name="codice"
                  value={formData.codice}
                  onChange={handleChange}
                  className={`${styles.formControl} ${styles.textInput}`}
                  placeholder="Es. MAT, ITA, INF..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="descrizione" className={styles.formLabel}>Descrizione:</label>
                <input
                  type="text"
                  id="descrizione"
                  name="descrizione"
                  value={formData.descrizione}
                  onChange={handleChange}
                  className={`${styles.formControl} ${styles.textInput}`}
                  placeholder="Es. Matematica, Italiano..."
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="coloreMateria" className={styles.formLabel}>Colore:</label>
              <input
                type="color"
                id="coloreMateria"
                name="coloreMateria"
                value={formData.coloreMateria}
                onChange={handleChange}
                className={styles.colorInput}
              />
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Salvataggio...' : 'Salva Materia'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className={styles.loadingMessage}>Caricamento materie in corso...</div>
      ) : (
        <div className={styles.materieGrid}>
          {materie.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Nessuna materia trovata. Aggiungi la tua prima materia!</p>
            </div>
          ) : (
            materie.map(materia => (
              <div 
                key={materia._id || materia.id} 
                className={styles.materiaCard}
                style={{ borderLeft: `4px solid ${materia.coloreMateria || '#3498db'}` }}
              >
                <div className={styles.materiaHeader}>
                  <h3 className={styles.materiaCodice}>{materia.codice || materia.codiceMateria}</h3>
                  <div 
                    className={styles.colorIndicator}
                    style={{ backgroundColor: materia.coloreMateria || '#3498db' }}
                  ></div>
                </div>
                <p className={styles.materiaDescrizione}>{materia.descrizione}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default GestioneMaterie;