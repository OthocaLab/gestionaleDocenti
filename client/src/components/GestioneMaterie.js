import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/GestioneDidattica.module.css';

const GestioneMaterie = () => {
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    codice: '',
    descrizione: ''
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMaterie();
  }, []);

  const fetchMaterie = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/materie');
      setMaterie(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento delle materie');
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
        await axios.put(`/api/materie/${editingId}`, formData);
        setSuccess('Materia aggiornata con successo!');
      } else {
        await axios.post('/api/materie', formData);
        setSuccess('Materia creata con successo!');
      }
      
      resetForm();
      fetchMaterie();
    } catch (err) {
      setError('Errore: ' + (err.response?.data?.message || err.message));
      setLoading(false);
    }
  };

  const handleEdit = (materia) => {
    setFormData({
      nome: materia.nome,
      codice: materia.codice || '',
      descrizione: materia.descrizione || ''
    });
    setEditingId(materia._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminare questa materia?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/materie/${id}`);
      setSuccess('Materia eliminata con successo!');
      fetchMaterie();
    } catch (err) {
      setError('Errore nell\'eliminazione della materia');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      codice: '',
      descrizione: ''
    });
    setEditingId(null);
    setShowForm(false);
    setLoading(false);
  };

  return (
    <div className={styles.classiContainer}>
      <div className={styles.headerSection}>
        <h3 className={styles.title}>Gestione Materie</h3>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.addButton}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Annulla' : '+ Aggiungi Materia'}
          </button>
        </div>
      </div>

      {error && <div className={`${styles.message} ${styles.error}`}>{error}</div>}
      {success && <div className={`${styles.message} ${styles.success}`}>{success}</div>}

      {showForm && (
        <div className={styles.formCard}>
          <h4 className={styles.formTitle}>{editingId ? 'Modifica Materia' : 'Aggiungi Nuova Materia'}</h4>
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome Materia</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="codice">Codice</label>
                <input
                  type="text"
                  id="codice"
                  name="codice"
                  value={formData.codice}
                  onChange={handleChange}
                  className={styles.input}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="descrizione">Descrizione</label>
              <textarea
                id="descrizione"
                name="descrizione"
                value={formData.descrizione}
                onChange={handleChange}
                className={styles.input}
                rows="3"
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
        <h3>Elenco Materie</h3>
        {loading && !showForm ? (
          <p>Caricamento materie...</p>
        ) : materie.length === 0 ? (
          <p>Nessuna materia trovata.</p>
        ) : (
          <table className={styles.classiList}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Codice</th>
                <th>Descrizione</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {materie.map((materia) => (
                <tr key={materia._id}>
                  <td>{materia.nome}</td>
                  <td>{materia.codice || '-'}</td>
                  <td>{materia.descrizione || '-'}</td>
                  <td>
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleEdit(materia)}
                    >
                      ✏️
                    </button>
                    <button 
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(materia._id)}
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

export default GestioneMaterie;