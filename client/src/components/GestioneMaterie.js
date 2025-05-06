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
    <div className={styles.materieContainer}>
      <div className={styles.materieHeader}>
        <h3>Gestione Materie</h3>
        <button 
          className={styles.addButton}
          onClick={() => {
            if (showForm && editMode) {
              resetForm();
            } else {
              setShowForm(!showForm);
            }
          }}
        >
          {showForm ? (editMode ? 'Annulla Modifica' : 'Annulla') : 'Nuova Materia'}
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      {showForm && (
        <div className={styles.formSection}>
          <h4>{editMode ? 'Modifica Materia' : 'Crea Nuova Materia'}</h4>
          <form onSubmit={handleFormSubmit} className={styles.materiaForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="codice">Codice:</label>
                <input
                  type="text"
                  id="codice"
                  name="codice"
                  value={formData.codice}
                  onChange={handleFormChange}
                  className={styles.textInput}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="descrizione">Descrizione:</label>
                <input
                  type="text"
                  id="descrizione"
                  name="descrizione"
                  value={formData.descrizione}
                  onChange={handleFormChange}
                  className={styles.textInput}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="coloreMateria">Colore:</label>
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
              <label htmlFor="decretoMinisteriale">Decreto Ministeriale (opzionale):</label>
              <input
                type="text"
                id="decretoMinisteriale"
                name="decretoMinisteriale"
                value={formData.decretoMinisteriale}
                onChange={handleFormChange}
                className={styles.textInput}
              />
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Salvataggio in corso...' : (editMode ? 'Aggiorna Materia' : 'Salva Materia')}
            </button>
          </form>
        </div>
      )}
      
      {loading && !materie.length ? (
        <div className={styles.loading}>Caricamento in corso...</div>
      ) : (
        <div className={styles.materieList}>
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
                <tr key={materia._id}>
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
                      className={styles.actionButton}
                      onClick={() => handleEdit(materia)}
                    >
                      Modifica
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(materia._id)}
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
              {materie.length === 0 && (
                <tr>
                  <td colSpan="5" className={styles.noData}>
                    Nessuna materia disponibile. Aggiungi una nuova materia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GestioneMaterie;