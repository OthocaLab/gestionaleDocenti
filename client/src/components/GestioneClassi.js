import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/GestioneDidattica.module.css';

const GestioneClassi = () => {
  const [classi, setClassi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    anno: '',
    sezione: '',
    aula: '',
    indirizzo: 'Meccanica',
    numeroStudenti: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchClassi();
  }, []);

  const fetchClassi = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/classi');
      // Estrai l'array di classi dalla risposta
      const classiArray = response.data.data;
      // Assicuriamoci che classi sia sempre un array
      setClassi(Array.isArray(classiArray) ? classiArray : []);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento delle classi');
      setClassi([]); // Imposta un array vuoto in caso di errore
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
    
    try {
      setLoading(true);
      
      if (editingId) {
        const response = await axios.put(`/api/classi/${editingId}`, formData);
        if (response.data.success) {
          setSuccess('Classe aggiornata con successo!');
          resetForm();
          fetchClassi();
        } else {
          // Gestione dell'errore restituito dal server
          if (response.data.error && response.data.error.includes('duplicate key error')) {
            setError(`Errore: Esiste già una classe ${formData.anno}${formData.sezione}. Scegli una combinazione diversa di anno e sezione.`);
          } else {
            setError('Errore: ' + (response.data.message || 'Errore sconosciuto'));
          }
          setLoading(false);
        }
      } else {
        const response = await axios.post('/api/classi', formData);
        if (response.data.success) {
          setSuccess('Classe creata con successo!');
          resetForm();
          fetchClassi();
        } else {
          // Gestione dell'errore restituito dal server
          if (response.data.error && response.data.error.includes('duplicate key error')) {
            setError(`Errore: Esiste già una classe ${formData.anno}${formData.sezione}. Scegli una combinazione diversa di anno e sezione.`);
          } else {
            setError('Errore: ' + (response.data.message || 'Errore sconosciuto'));
          }
          setLoading(false);
        }
      }
    } catch (err) {
      // Gestione degli errori di rete o altri errori
      if (err.response && err.response.data) {
        const errorData = err.response.data;
        if (errorData.error && errorData.error.includes('duplicate key error')) {
          setError(`Errore: Esiste già una classe ${formData.anno}${formData.sezione}. Scegli una combinazione diversa di anno e sezione.`);
        } else {
          setError('Errore: ' + (errorData.message || err.message || 'Errore sconosciuto'));
        }
      } else {
        setError('Errore di rete o server non disponibile');
      }
      setLoading(false);
    }
  };

  const handleEdit = (classe) => {
    setFormData({
      anno: classe.anno,
      sezione: classe.sezione,
      aula: classe.aula,
      indirizzo: classe.indirizzo,
      numeroStudenti: classe.numeroStudenti || ''
    });
    setEditingId(classe._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa classe?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/classi/${id}`);
      setSuccess('Classe eliminata con successo!');
      fetchClassi();
    } catch (err) {
      setError('Errore nell\'eliminazione della classe');
    }
  };

  const resetForm = () => {
    setFormData({
      anno: '',
      sezione: '',
      aula: '',
      indirizzo: 'Meccanica',
      numeroStudenti: ''
    });
    setEditingId(null);
    setShowForm(false);
    setLoading(false);
  };

  return (
    <div className={styles.classiContainer}>
      <div className={styles.headerSection}>
        <h3 className={styles.title}>Gestione Classi</h3>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.addButton}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annulla' : '+ Aggiungi Classe'}
          </button>
          <button className={styles.importButton}>
            ↑ Carica classi esempio
          </button>
        </div>
      </div>

      {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
      {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h4 className={styles.formTitle}>{editingId ? 'Modifica Classe' : 'Aggiungi Nuova Classe'}</h4>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="anno">Anno</label>
                <input
                  type="text"
                  id="anno"
                  name="anno"
                  value={formData.anno}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="sezione">Sezione</label>
                <input
                  type="text"
                  id="sezione"
                  name="sezione"
                  value={formData.sezione}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>
            
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="aula">Aula</label>
                <input
                  type="text"
                  id="aula"
                  name="aula"
                  value={formData.aula}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="indirizzo">Indirizzo</label>
                <input
                  type="text"
                  id="indirizzo"
                  name="indirizzo"
                  value={formData.indirizzo}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="numeroStudenti">Numero Studenti</label>
              <input
                type="number"
                id="numeroStudenti"
                name="numeroStudenti"
                value={formData.numeroStudenti}
                onChange={handleChange}
                className={styles.input}
              />
            </div>
            
            <div>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={resetForm}
              >
                Annulla
              </button>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Salvataggio...' : editingId ? 'Aggiorna' : 'Salva'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div>
        <h3>Elenco Classi</h3>
        {loading && !showForm ? (
          <p>Caricamento classi...</p>
        ) : !Array.isArray(classi) || classi.length === 0 ? (
          <p>Nessuna classe trovata.</p>
        ) : (
          <table className={styles.classiList}>
            <thead>
              <tr>
                <th>Anno</th>
                <th>Sezione</th>
                <th>Aula</th>
                <th>Indirizzo</th>
                <th>N. Studenti</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {classi.map((classe) => (
                <tr key={classe._id || Math.random()}>
                  <td>{classe.anno}</td>
                  <td>{classe.sezione}</td>
                  <td>{classe.aula}</td>
                  <td>{classe.indirizzo}</td>
                  <td>{classe.numeroStudenti || '-'}</td>
                  <td>
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleEdit(classe)}
                    >
                      ✏️
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(classe._id)}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default GestioneClassi;