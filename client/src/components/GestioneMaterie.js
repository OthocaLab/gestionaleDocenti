import { useState, useEffect } from 'react';
import { getAllMaterie, createMateria } from '../services/orarioService';
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
    coloreMateria: '#971645'
  });

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
      setError('Errore nel caricamento delle materie');
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
      await createMateria(formData);
      
      setSuccess('Materia creata con successo!');
      setFormData({
        codice: '',
        descrizione: '',
        coloreMateria: '#971645'
      });
      
      await fetchMaterie();
      
      setShowForm(false);
      setLoading(false);
    } catch (err) {
      setError('Errore nella creazione della materia: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  return (
    <div className={styles.materieContainer}>
      <div className={styles.materieHeader}>
        <h3>Gestione Materie</h3>
        <button 
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Annulla' : 'Nuova Materia'}
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      {showForm && (
        <div className={styles.formSection}>
          <h4>Crea Nuova Materia</h4>
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
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Salvataggio in corso...' : 'Salva Materia'}
            </button>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className={styles.loading}>Caricamento in corso...</div>
      ) : (
        <div className={styles.materieList}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Codice</th>
                <th>Descrizione</th>
                <th>Colore</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {materie.map((materia) => (
                <tr key={materia._id}>
                  <td>{materia.codice}</td>
                  <td>{materia.descrizione}</td>
                  <td>
                    <div 
                      className={styles.colorSample} 
                      style={{ backgroundColor: materia.coloreMateria }}
                    ></div>
                  </td>
                  <td>
                    <button className={styles.actionButton}>Modifica</button>
                    <button className={styles.actionButton}>Elimina</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GestioneMaterie;