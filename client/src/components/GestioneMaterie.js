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
    codiceMateria: '',
    descrizione: '',
    coloreMateria: '#3498db'
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
    
    if (!formData.codiceMateria || !formData.descrizione) {
      setError('Codice e descrizione della materia sono obbligatori');
      return;
    }
    
    try {
      setLoading(true);
      await createMateria(formData);
      
      setSuccess('Materia creata con successo!');
      setFormData({
        codiceMateria: '',
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
        <h3>Gestione Materie</h3>
        <button
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Chiudi Form' : 'Aggiungi Materia'}
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      {showForm && (
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit} className={styles.materiaForm}>
            <div className={styles.formGroup}>
              <label htmlFor="codiceMateria">Codice Materia:</label>
              <input
                type="text"
                id="codiceMateria"
                name="codiceMateria"
                value={formData.codiceMateria}
                onChange={handleChange}
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
                onChange={handleChange}
                className={styles.textInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="coloreMateria">Colore:</label>
              <input
                type="color"
                id="coloreMateria"
                name="coloreMateria"
                value={formData.coloreMateria}
                onChange={handleChange}
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
      
      {loading && !materie.length ? (
        <div className={styles.loading}>Caricamento materie in corso...</div>
      ) : (
        <div className={styles.materieList}>
          <table>
            <thead>
              <tr>
                <th>Codice</th>
                <th>Descrizione</th>
                <th>Colore</th>
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
                    ></div>
                  </td>
                </tr>
              ))}
              {materie.length === 0 && (
                <tr>
                  <td colSpan="3" className={styles.noData}>Nessuna materia disponibile</td>
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