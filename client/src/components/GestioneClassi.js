import { useState, useEffect } from 'react';
import { getAllClassi, createClasse, importaClassiEsempio } from '../services/orarioService';
import styles from '../styles/Orario.module.css';
import datiEsempioClassi from '../data/esempio_classi_studenti.json';

const GestioneClassi = () => {
  const [classi, setClassi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    anno: '',
    sezione: '',
    aula: '',
    indirizzo: '',
    numeroStudenti: ''
  });

  useEffect(() => {
    fetchClassi();
  }, []);

  const fetchClassi = async () => {
    try {
      setLoading(true);
      const response = await getAllClassi();
      setClassi(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento delle classi: ' + (err.message || 'Errore sconosciuto'));
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
    
    if (!formData.anno || !formData.sezione || !formData.aula || !formData.indirizzo) {
      setError('Tutti i campi sono obbligatori tranne il numero di studenti');
      return;
    }
    
    try {
      setLoading(true);
      await createClasse(formData);
      
      setSuccess('Classe creata con successo!');
      setFormData({
        anno: '',
        sezione: '',
        aula: '',
        indirizzo: '',
        numeroStudenti: ''
      });
      
      // Ricarica l'elenco delle classi
      fetchClassi();
      
      setShowForm(false);
      setLoading(false);
    } catch (err) {
      setError('Errore nella creazione della classe: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  const handleImportaEsempio = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Usa i dati di esempio importati
      const response = await importaClassiEsempio(datiEsempioClassi);
      
      setSuccess('Classi di esempio importate con successo!');
      
      // Ricarica l'elenco delle classi
      fetchClassi();
      
      setLoading(false);
    } catch (err) {
      setError('Errore nell\'importazione delle classi di esempio: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  return (
    <div className={styles.gestioneClassiContainer}>
      <div className={styles.headerSection}>
        <h2 className={styles.sectionTitle}>Gestione Classi</h2>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.actionButton} ${showForm ? styles.closeButton : styles.addButton}`}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Chiudi Form' : '+ Aggiungi Classe'}
          </button>
          <button
            className={`${styles.actionButton} ${styles.importButton}`}
            onClick={handleImportaEsempio}
            disabled={loading}
          >
            {loading ? '⏳ Caricamento...' : '📥 Carica classi esempio'}
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
          <h3 className={styles.formTitle}>Inserisci nuova classe</h3>
          <form onSubmit={handleSubmit} className={styles.classeForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="anno" className={styles.formLabel}>Anno:</label>
                <select
                  id="anno"
                  name="anno"
                  value={formData.anno}
                  onChange={handleChange}
                  className={`${styles.formControl} ${styles.select}`}
                >
                  <option value="">-- Seleziona --</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="sezione" className={styles.formLabel}>Sezione:</label>
                <input
                  type="text"
                  id="sezione"
                  name="sezione"
                  value={formData.sezione}
                  onChange={handleChange}
                  className={`${styles.formControl} ${styles.textInput}`}
                  placeholder="Es. A, B, C..."
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="aula" className={styles.formLabel}>Aula:</label>
                <input
                  type="text"
                  id="aula"
                  name="aula"
                  value={formData.aula}
                  onChange={handleChange}
                  className={`${styles.formControl} ${styles.textInput}`}
                  placeholder="Es. 101, Lab. Informatica..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="numeroStudenti" className={styles.formLabel}>Numero Studenti:</label>
                <input
                  type="number"
                  id="numeroStudenti"
                  name="numeroStudenti"
                  value={formData.numeroStudenti}
                  onChange={handleChange}
                  className={`${styles.formControl} ${styles.textInput}`}
                  placeholder="Es. 25"
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="indirizzo" className={styles.formLabel}>Indirizzo di studio:</label>
              <input
                type="text"
                id="indirizzo"
                name="indirizzo"
                value={formData.indirizzo}
                onChange={handleChange}
                className={`${styles.formControl} ${styles.textInput}`}
                placeholder="Es. Informatica, Scientifico..."
              />
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={`${styles.actionButton} ${styles.cancelButton}`}
                onClick={() => setShowForm(false)}
                disabled={loading}
              >
                Annulla
              </button>
              <button 
                type="submit" 
                className={`${styles.actionButton} ${styles.submitButton}`}
                disabled={loading}
              >
                {loading ? '⏳ Salvataggio...' : '💾 Salva Classe'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading && !classi.length ? (
        <div className={`${styles.loading} ${styles.centeredContent}`}>
          <div className={styles.loadingSpinner}></div>
          <p>Caricamento classi in corso...</p>
        </div>
      ) : (
        <div className={`${styles.classiList} ${styles.cardEffect}`}>
          <h3 className={styles.tableTitle}>Elenco Classi</h3>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Anno</th>
                  <th>Sezione</th>
                  <th>Aula</th>
                  <th>Indirizzo</th>
                  <th>N. Studenti</th>
                </tr>
              </thead>
              <tbody>
                {classi.map((classe) => (
                  <tr key={classe._id} className={styles.tableRow}>
                    <td>{classe.anno}°</td>
                    <td>{classe.sezione}</td>
                    <td>{classe.aula}</td>
                    <td>{classe.indirizzo}</td>
                    <td>{classe.numeroStudenti || '-'}</td>
                  </tr>
                ))}
                {classi.length === 0 && (
                  <tr>
                    <td colSpan="5" className={styles.noData}>
                      <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📚</span>
                        <p>Nessuna classe disponibile</p>
                        <p className={styles.emptySubtext}>Aggiungi una nuova classe o importa le classi di esempio</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestioneClassi;