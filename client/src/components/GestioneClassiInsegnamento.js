import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Orario.module.css';
import ImportaClassiInsegnamento from './ImportaClassiInsegnamento';

const GestioneClassiInsegnamento = () => {
  const [classiInsegnamento, setClassiInsegnamento] = useState([]);
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formData, setFormData] = useState({
    codiceClasse: '',
    descrizione: '',
    materia: ''
  });

  useEffect(() => {
    fetchClassiInsegnamento();
    fetchMaterie();
  }, []);

  const fetchClassiInsegnamento = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/classi-insegnamento');
      setClassiInsegnamento(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento delle classi di insegnamento');
      setLoading(false);
    }
  };

  const fetchMaterie = async () => {
    try {
      const response = await axios.get('/api/materie');
      setMaterie(response.data.data || []);
    } catch (err) {
      setError('Errore nel caricamento delle materie');
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
    
    if (!formData.codiceClasse || !formData.descrizione || !formData.materia) {
      setError('Tutti i campi sono obbligatori');
      return;
    }
    
    try {
      setLoading(true);
      await axios.post('/api/classi-insegnamento', formData);
      
      setSuccess('Classe di insegnamento creata con successo!');
      setFormData({
        codiceClasse: '',
        descrizione: '',
        materia: ''
      });
      
      await fetchClassiInsegnamento();
      setShowForm(false);
      setLoading(false);
    } catch (err) {
      setError('Errore nella creazione della classe di insegnamento: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa classe di insegnamento?')) {
      try {
        await axios.delete(`/api/classi-insegnamento/${id}`);
        setSuccess('Classe di insegnamento eliminata con successo');
        fetchClassiInsegnamento();
      } catch (err) {
        setError('Errore nell\'eliminazione della classe di insegnamento');
      }
    }
  };

  return (
    <div className={styles.classiInsegnamentoContainer}>
      <div className={styles.headerSection}>
        <h3>Gestione Classi di Insegnamento</h3>
        <div className={styles.buttonGroup}>
          <button
            className={styles.addButton}
            onClick={() => {
              setShowForm(!showForm);
              setShowImport(false);
            }}
          >
            {showForm ? 'Chiudi Form' : 'Aggiungi Classe'}
          </button>
          <button
            className={styles.importButton}
            onClick={() => {
              setShowImport(!showImport);
              setShowForm(false);
            }}
          >
            {showImport ? 'Chiudi Import' : 'Importa da JSON'}
          </button>
        </div>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      {showForm && (
        <div className={styles.formSection}>
          <form onSubmit={handleFormSubmit} className={styles.classeForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="codiceClasse">Codice Classe:</label>
                <input
                  type="text"
                  id="codiceClasse"
                  name="codiceClasse"
                  value={formData.codiceClasse}
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
              <label htmlFor="materia">Materia:</label>
              <select
                id="materia"
                name="materia"
                value={formData.materia}
                onChange={handleFormChange}
                className={styles.select}
              >
                <option value="">-- Seleziona una materia --</option>
                {materie.map((materia) => (
                  <option key={materia._id} value={materia._id}>
                    {materia.descrizione}
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Salvataggio in corso...' : 'Salva Classe di Insegnamento'}
            </button>
          </form>
        </div>
      )}
      
      {showImport && (
        <ImportaClassiInsegnamento onImportComplete={fetchClassiInsegnamento} />
      )}
      
      {loading && !classiInsegnamento.length ? (
        <div className={styles.loading}>Caricamento classi di insegnamento in corso...</div>
      ) : (
        <div className={styles.classiList}>
          <table>
            <thead>
              <tr>
                <th>Codice</th>
                <th>Descrizione</th>
                <th>Materia</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {classiInsegnamento.map((classe) => (
                <tr key={classe._id}>
                  <td>{classe.codiceClasse}</td>
                  <td>{classe.descrizione}</td>
                  <td>{classe.materia?.descrizione || 'Non assegnata'}</td>
                  <td>
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDelete(classe._id)}
                    >
                      Elimina
                    </button>
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

export default GestioneClassiInsegnamento;