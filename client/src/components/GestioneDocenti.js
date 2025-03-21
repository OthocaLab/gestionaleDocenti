import { useState, useEffect } from 'react';
import { getAllDocenti, createDocente } from '../services/orarioService';
import styles from '../styles/Orario.module.css';

const GestioneDocenti = () => {
  const [docenti, setDocenti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    telefono: '',
    materie: [],
    oreSettimanali: 18,
    disponibilita: []
  });

  useEffect(() => {
    fetchDocenti();
  }, []);

  const fetchDocenti = async () => {
    try {
      setLoading(true);
      const response = await getAllDocenti();
      setDocenti(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento dei docenti');
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
    
    if (!formData.nome || !formData.cognome || !formData.email) {
      setError('Nome, cognome ed email sono obbligatori');
      return;
    }
    
    try {
      setLoading(true);
      await createDocente(formData);
      
      setSuccess('Docente creato con successo!');
      setFormData({
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        materie: [],
        oreSettimanali: 18,
        disponibilita: []
      });
      
      await fetchDocenti();
      
      setShowForm(false);
      setLoading(false);
    } catch (err) {
      setError('Errore nella creazione del docente: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  return (
    <div className={styles.docentiContainer}>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👨‍🏫</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Docenti Totali</div>
            <div className={styles.statValue}>{docenti.length || 0}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Ore Settimanali</div>
            <div className={styles.statValue}>
              {docenti.reduce((total, docente) => total + (docente.oreSettimanali || 0), 0)}
            </div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📋</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Docenti Attivi</div>
            <div className={styles.statValue}>{docenti.filter(d => d.attivo).length || 0}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Docenti Disponibili</div>
            <div className={styles.statValue}>{docenti.filter(d => d.disponibile).length || 0}</div>
          </div>
        </div>
      </div>

      <div className={styles.docentiPanel}>
        <div className={styles.docentiHeader}>
          <h3>Elenco Docenti</h3>
          <div className={styles.searchFilters}>
            <div className={styles.searchBox}>
              <input 
                type="text" 
                placeholder="Cerca docente..." 
                className={styles.searchInput}
              />
            </div>
            <button 
              className={styles.addButton}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? 'Annulla' : 'Nuovo Docente'}
            </button>
          </div>
        </div>
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        
        {showForm && (
          <div className={styles.formSection}>
            <h4>Crea Nuovo Docente</h4>
            <form onSubmit={handleFormSubmit} className={styles.docenteForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="nome">Nome:</label>
                  <input
                    type="text"
                    id="nome"
                    name="nome"
                    value={formData.nome}
                    onChange={handleFormChange}
                    className={styles.textInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="cognome">Cognome:</label>
                  <input
                    type="text"
                    id="cognome"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleFormChange}
                    className={styles.textInput}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email:</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    className={styles.textInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="telefono">Telefono:</label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleFormChange}
                    className={styles.textInput}
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="oreSettimanali">Ore Settimanali:</label>
                  <input
                    type="number"
                    id="oreSettimanali"
                    name="oreSettimanali"
                    value={formData.oreSettimanali}
                    onChange={handleFormChange}
                    className={styles.textInput}
                    min="1"
                    max="40"
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Salvataggio in corso...' : 'Salva Docente'}
              </button>
            </form>
          </div>
        )}
        
        {loading ? (
          <div className={styles.loading}>Caricamento in corso...</div>
        ) : (
          <div className={styles.docentiList}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cognome</th>
                  <th>Email</th>
                  <th>Telefono</th>
                  <th>Ore Settimanali</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {docenti.map((docente) => (
                  <tr key={docente._id}>
                    <td>{docente.nome}</td>
                    <td>{docente.cognome}</td>
                    <td>{docente.email}</td>
                    <td>{docente.telefono || '-'}</td>
                    <td>{docente.oreSettimanali || 18}</td>
                    <td>
                      <button className={styles.actionButton}>Modifica</button>
                      <button className={styles.actionButton}>Elimina</button>
                      <button className={styles.actionButton}>Orario</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestioneDocenti;