import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Orario.module.css';
import { deleteMateria } from '../services/materiaService';

// Opzioni di paginazione (senza 100)
const OPZIONI_PAGINAZIONE = [10, 20, 50, 'Tutte'];

const GestioneMaterie = () => {
  // Stato per le materie e la UI
  const [materie, setMaterie] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    codice: '',
    descrizione: '',
    coloreMateria: '#3498db',
    _id: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagina, setPagina] = useState(1);
  const [elementiPerPagina, setElementiPerPagina] = useState(10);

  // Carica le materie all'avvio
  useEffect(() => {
    fetchMaterie();
  }, []);

  // Recupera le materie dal backend
  const fetchMaterie = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/materie');
      if (response.data && Array.isArray(response.data)) {
        setMaterie(response.data);
      } else if (response.data && Array.isArray(response.data.data)) {
        setMaterie(response.data.data);
      } else {
        setError('Formato risposta non valido');
      }
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento delle materie: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  // Gestione input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Gestione ricerca
  const materieFiltrate = materie.filter(m =>
    (m.codice || m.codiceMateria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.descrizione || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Gestione cambio numero elementi per pagina
  const handleElementiPerPagina = (e) => {
    const val = e.target.value === 'Tutte' ? materieFiltrate.length : parseInt(e.target.value);
    setElementiPerPagina(val);
    setPagina(1);
  };

  // Paginazione
  const totalePagine = elementiPerPagina >= materieFiltrate.length ? 1 : Math.ceil(materieFiltrate.length / elementiPerPagina);
  const materiePagina = elementiPerPagina >= materieFiltrate.length
    ? materieFiltrate
    : materieFiltrate.slice((pagina - 1) * elementiPerPagina, pagina * elementiPerPagina);

  // Gestione submit form (aggiungi/modifica)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.codice || !formData.descrizione) {
      setError('Codice e descrizione sono campi obbligatori');
      return;
    }
    try {
      setLoading(true);
      if (editMode && formData._id) {
        // Modifica materia
        await axios.put(`/api/materie/${formData._id}`, {
          codiceMateria: formData.codice,
          descrizione: formData.descrizione,
          coloreMateria: formData.coloreMateria
        });
        setSuccess('Materia aggiornata con successo!');
      } else {
        // Nuova materia
        await axios.post('/api/materie', {
          codiceMateria: formData.codice,
          descrizione: formData.descrizione,
          coloreMateria: formData.coloreMateria
        });
        setSuccess('Materia creata con successo!');
      }
      setFormData({ codice: '', descrizione: '', coloreMateria: '#3498db', _id: null });
      setShowForm(false);
      setEditMode(false);
      fetchMaterie();
      setLoading(false);
    } catch (err) {
      setError('Errore nel salvataggio: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  // Gestione modifica
  const handleModifica = (materia) => {
    setFormData({
      codice: materia.codice || materia.codiceMateria,
      descrizione: materia.descrizione,
      coloreMateria: materia.coloreMateria || '#3498db',
      _id: materia._id
    });
    setShowForm(true);
    setEditMode(true);
  };

  // Gestione elimina
  const handleElimina = async (id) => {
    if (!window.confirm('Sei sicuro di voler eliminare questa materia?')) return;
    try {
      setLoading(true);
      await deleteMateria(id);
      setSuccess('Materia eliminata con successo!');
      fetchMaterie();
      setLoading(false);
    } catch (err) {
      setError('Errore nell\'eliminazione: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  // Gestione cambio pagina
  const cambiaPagina = (nuovaPagina) => {
    if (nuovaPagina >= 1 && nuovaPagina <= totalePagine) setPagina(nuovaPagina);
  };

  return (
    <div className={styles.gestioneMaterieContainer}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', width: '100%', marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Cerca per codice o nome..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setPagina(1); }}
          className={styles.searchInput}
          style={{ maxWidth: 300 }}
        />
        <span style={{ fontSize: 15, color: '#444', fontWeight: 500 }}>
          Materie visualizzabili:
        </span>
        <select
          value={elementiPerPagina >= materieFiltrate.length ? 'Tutte' : elementiPerPagina}
          onChange={handleElementiPerPagina}
          className={styles.select}
          style={{ width: 120 }}
        >
          {OPZIONI_PAGINAZIONE.map(opt => (
            <option key={opt} value={opt}>{opt === 'Tutte' ? `Tutte (${materieFiltrate.length})` : opt}</option>
          ))}
        </select>
        <button
          className={`${styles.actionButton} ${styles.addButton}`}
          onClick={() => {
            setShowForm(!showForm);
            setEditMode(false);
            setFormData({ codice: '', descrizione: '', coloreMateria: '#3498db', _id: null });
          }}
          style={{ marginLeft: 'auto', minWidth: 160 }}
        >
          + Aggiungi Materia
        </button>
      </div>

      {error && <div className={`${styles.alertMessage} ${styles.errorMessage}`}><span className={styles.alertIcon}>⚠️</span> {error}</div>}
      {success && <div className={`${styles.alertMessage} ${styles.successMessage}`}><span className={styles.alertIcon}>✅</span> {success}</div>}

      {showForm && (
        <div className={`${styles.formSection} ${styles.cardEffect}`} style={{ marginBottom: 24 }}>
          <h3 className={styles.formTitle}>{editMode ? 'Modifica Materia' : 'Inserisci nuova materia'}</h3>
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
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Salvataggio...' : (editMode ? 'Aggiorna Materia' : 'Salva Materia')}
              </button>
              {editMode && (
                <button type="button" className={styles.cancelButton} style={{ marginLeft: 12 }} onClick={() => {
                  setEditMode(false);
                  setShowForm(false);
                  setFormData({ codice: '', descrizione: '', coloreMateria: '#3498db', _id: null });
                }}>Annulla</button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tabella materie */}
      <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Codice</th>
              <th>Nome</th>
              <th>Descrizione</th>
              <th style={{ textAlign: 'center', minWidth: 180 }}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {materiePagina.length === 0 ? (
              <tr>
                <td colSpan="4" className={styles.noData}>
                  <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>📚</span>
                    <p>Nessuna materia trovata</p>
                  </div>
                </td>
              </tr>
            ) : (
              materiePagina.map(materia => (
                <tr key={materia._id || materia.id}>
                  <td>{materia.codice || materia.codiceMateria}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 16, height: 16, background: materia.coloreMateria || '#3498db', borderRadius: 4, display: 'inline-block', border: '1px solid #eee' }}></span>
                      {materia.descrizione}
                    </span>
                  </td>
                  <td>{materia.decretoMinisteriale || '-'}</td>
                  <td>
                    <div className={styles.actionButtons}>
                      <button className={`${styles.actionButton} ${styles.editButton}`} onClick={() => handleModifica(materia)}>
                        ✏️ Modifica
                      </button>
                      <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleElimina(materia._id)}>
                        🗑️ Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginazione */}
      {totalePagine > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, gap: 8 }}>
          <button onClick={() => cambiaPagina(pagina - 1)} disabled={pagina === 1} className={styles.actionButton}>&lt;</button>
          {[...Array(totalePagine)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => cambiaPagina(idx + 1)}
              className={pagina === idx + 1 ? `${styles.actionButton} ${styles.activeTab}` : styles.actionButton}
            >
              {idx + 1}
            </button>
          ))}
          <button onClick={() => cambiaPagina(pagina + 1)} disabled={pagina === totalePagine} className={styles.actionButton}>&gt;</button>
        </div>
      )}
    </div>
  );
};

export default GestioneMaterie;