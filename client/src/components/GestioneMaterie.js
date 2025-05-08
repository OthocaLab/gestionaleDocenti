import { useState, useEffect } from 'react';
import { getAllMaterie, createMateria, updateMateria, deleteMateria } from '../services/materiaService';
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
    coloreMateria: '#971645',
    decretoMinisteriale: '',
    classiInsegnamento: []
  });
  const [editMode, setEditMode] = useState(false);
  const [currentMateriaId, setCurrentMateriaId] = useState(null);

  useEffect(() => {
    fetchMaterie();
  }, []);

  const fetchMaterie = async () => {
    try {
      setLoading(true);
      const response = await getAllMaterie();
      setMaterie(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento delle materie: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.codice || !formData.descrizione) {
      setError('Codice e descrizione sono obbligatori');
      return;
    }
    
    try {
      setLoading(true);
      
      if (editMode) {
        await updateMateria(currentMateriaId, {
          codiceMateria: formData.codice,
          descrizione: formData.descrizione,
          coloreMateria: formData.coloreMateria,
          decretoMinisteriale: formData.decretoMinisteriale,
          classiInsegnamento: formData.classiInsegnamento
        });
        setSuccess('Materia aggiornata con successo!');
      } else {
        await createMateria(formData);
        setSuccess('Materia creata con successo!');
      }
      
      // Reset form
      setFormData({
        codice: '',
        descrizione: '',
        coloreMateria: '#971645',
        decretoMinisteriale: '',
        classiInsegnamento: []
      });
      
      // Refresh materie list
      await fetchMaterie();
      
      // Close form and reset edit mode
      setShowForm(false);
      setEditMode(false);
      setCurrentMateriaId(null);
      setLoading(false);
    } catch (err) {
      setError('Errore nella gestione della materia: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  const handleEdit = (materia) => {
    setFormData({
      codice: materia.codiceMateria,
      descrizione: materia.descrizione,
      coloreMateria: materia.coloreMateria || '#971645',
      decretoMinisteriale: materia.decretoMinisteriale || '',
      classiInsegnamento: materia.classiInsegnamento || []
    });
    setEditMode(true);
    setCurrentMateriaId(materia._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa materia?')) {
      try {
        setLoading(true);
        await deleteMateria(id);
        setSuccess('Materia eliminata con successo!');
        await fetchMaterie();
        setLoading(false);
      } catch (err) {
        setError('Errore nell\'eliminazione della materia: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      codice: '',
      descrizione: '',
      coloreMateria: '#971645',
      decretoMinisteriale: '',
      classiInsegnamento: []
    });
    setEditMode(false);
    setCurrentMateriaId(null);
    setShowForm(false);
  };

  return (
    <div className={styles.gestioneClassiContainer}>
      <div className={styles.headerSection}>
        <h2 className={styles.sectionTitle}>Gestione Materie</h2>
        <div className={styles.buttonGroup}>
          <button
            className={`${styles.actionButton} ${showForm ? styles.closeButton : styles.addButton}`}
            onClick={() => {
              if (showForm && editMode) {
                resetForm();
              } else {
                setShowForm(!showForm);
              }
            }}
          >
            {showForm ? (editMode ? '✕ Annulla Modifica' : '✕ Chiudi Form') : '+ Aggiungi Materia'}
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
          <h3 className={styles.formTitle}>{editMode ? 'Modifica materia' : 'Inserisci nuova materia'}</h3>
          <form onSubmit={handleFormSubmit} className={styles.classeForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="codice" className={styles.formLabel}>Codice:</label>
                <input
                  type="text"
                  id="codice"
                  name="codice"
                  value={formData.codice}
                  onChange={handleFormChange}
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
                  onChange={handleFormChange}
                  className={`${styles.formControl} ${styles.textInput}`}
                  placeholder="Es. Matematica, Italiano..."
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="coloreMateria" className={styles.formLabel}>Colore:</label>
                <input
                  type="color"
                  id="coloreMateria"
                  name="coloreMateria"
                  value={formData.coloreMateria}
                  onChange={handleFormChange}
                  className={styles.colorInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="decretoMinisteriale" className={styles.formLabel}>Decreto Ministeriale (opzionale):</label>
                <input
                  type="text"
                  id="decretoMinisteriale"
                  name="decretoMinisteriale"
                  value={formData.decretoMinisteriale}
                  onChange={handleFormChange}
                  className={`${styles.formControl} ${styles.textInput}`}
                  placeholder="Es. DM 123/2023..."
                />
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={`${styles.actionButton} ${styles.cancelButton}`}
                onClick={resetForm}
                disabled={loading}
              >
                Annulla
              </button>
              <button 
                type="submit" 
                className={`${styles.actionButton} ${styles.submitButton}`}
                disabled={loading}
              >
                {loading ? '⏳ Salvataggio...' : (editMode ? '💾 Aggiorna Materia' : '💾 Salva Materia')}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading && !materie.length ? (
        <div className={`${styles.loading} ${styles.centeredContent}`}>
          <div className={styles.loadingSpinner}></div>
          <p>Caricamento materie in corso...</p>
        </div>
      ) : (
        <div className={`${styles.classiList} ${styles.cardEffect}`}>
          <h3 className={styles.tableTitle}>Elenco Materie</h3>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Codice</th>
                  <th>Descrizione</th>
                  <th>Colore</th>
                  <th>Decreto Ministeriale</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {materie.map((materia) => (
                  <tr key={materia._id} className={styles.tableRow}>
                    <td>{materia.codiceMateria}</td>
                    <td>{materia.descrizione}</td>
                    <td>
                      <div 
                        className={styles.colorSample} 
                        style={{ backgroundColor: materia.coloreMateria }}
                        title={materia.coloreMateria}
                      ></div>
                    </td>
                    <td>{materia.decretoMinisteriale || '-'}</td>
                    <td>
                      <button 
                        className={`${styles.actionButton} ${styles.editButton}`}
                        onClick={() => handleEdit(materia)}
                      >
                        ✏️ Modifica
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDelete(materia._id)}
                      >
                        🗑️ Elimina
                      </button>
                    </td>
                  </tr>
                ))}
                {materie.length === 0 && (
                  <tr>
                    <td colSpan="5" className={styles.noData}>
                      <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📚</span>
                        <p>Nessuna materia disponibile</p>
                        <p className={styles.emptySubtext}>Aggiungi una nuova materia</p>
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

export default GestioneMaterie;