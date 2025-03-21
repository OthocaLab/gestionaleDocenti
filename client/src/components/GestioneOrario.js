import { useState, useEffect } from 'react';
import { getAllClassi, getOrarioByClasse, createClasse } from '../services/orarioService';
import styles from '../styles/Orario.module.css';

const GestioneOrario = () => {
  const [classi, setClassi] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [orario, setOrario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showClasseForm, setShowClasseForm] = useState(false);
  const [classeFormData, setClasseFormData] = useState({
    anno: '',
    sezione: '',
    aula: '',
    indirizzo: '',
    numeroStudenti: ''
  });
  const [success, setSuccess] = useState('');

  const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const ore = [
    { num: 1, inizio: '8:15', fine: '9:15' },
    { num: 2, inizio: '9:15', fine: '10:15' },
    { num: 3, inizio: '10:15', fine: '11:15' },
    { num: 4, inizio: '11:15', fine: '12:15' },
    { num: 5, inizio: '12:15', fine: '13:15' },
    { num: 6, inizio: '13:15', fine: '14:15' }
  ];

  useEffect(() => {
    fetchClassi();
  }, []);

  useEffect(() => {
    // Seleziona la prima classe di default se ce ne sono
    if (classi.length > 0 && !selectedClasse) {
      setSelectedClasse(classi[0]._id);
      fetchOrario(classi[0]._id);
    }
  }, [classi]);

  const fetchClassi = async () => {
    try {
      setLoading(true);
      const response = await getAllClassi();
      setClassi(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento delle classi');
      setLoading(false);
    }
  };

  const fetchOrario = async (classeId) => {
    try {
      setLoading(true);
      const response = await getOrarioByClasse(classeId);
      setOrario(response.data);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento dell\'orario');
      setLoading(false);
    }
  };

  const handleClasseChange = async (e) => {
    const classeId = e.target.value;
    setSelectedClasse(classeId);
    
    if (classeId) {
      fetchOrario(classeId);
    } else {
      setOrario([]);
    }
  };

  const handleClasseFormChange = (e) => {
    const { name, value } = e.target;
    setClasseFormData({
      ...classeFormData,
      [name]: value
    });
  };

  const handleClasseFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!classeFormData.anno || !classeFormData.sezione || !classeFormData.aula || !classeFormData.indirizzo) {
      setError('Tutti i campi sono obbligatori tranne il numero di studenti');
      return;
    }
    
    try {
      setLoading(true);
      await createClasse(classeFormData);
      
      setSuccess('Classe creata con successo!');
      setClasseFormData({
        anno: '',
        sezione: '',
        aula: '',
        indirizzo: '',
        numeroStudenti: ''
      });
      
      // Ricarica l'elenco delle classi
      await fetchClassi();
      
      setShowClasseForm(false);
      setLoading(false);
    } catch (err) {
      setError('Errore nella creazione della classe: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  // Funzione per ottenere la lezione per un determinato giorno e ora
  const getLezione = (giorno, ora) => {
    return orario.find(
      (lezione) => lezione.giornoSettimana === giorno && lezione.ora === ora
    );
  };

  // Ottieni i dettagli della classe selezionata
  const classeSelezionata = classi.find(c => c._id === selectedClasse);

  return (
    <div className={styles.orarioContainer}>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👨‍🏫</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Presenze Del Giorno</div>
            <div className={styles.statValue}>42</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Classi Totali</div>
            <div className={styles.statValue}>{classi.length || 0}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📋</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Presenze Attive</div>
            <div className={styles.statValue}>38</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Personale Disponibile</div>
            <div className={styles.statValue}>5</div>
          </div>
        </div>
      </div>

      <div className={styles.orarioPanel}>
        <div className={styles.orarioHeader}>
          <h3>Lista Orari</h3>
          <div className={styles.searchFilters}>
            <div className={styles.searchBox}>
              <input 
                type="text" 
                placeholder="Cerca in base a Indirizzo, Classe..." 
                className={styles.searchInput}
              />
            </div>
            <div className={styles.filterButtons}>
              <button className={styles.filterButton}>Docenti</button>
              <button className={`${styles.filterButton} ${styles.activeFilter}`}>Classe</button>
            </div>
          </div>
        </div>

        <div className={styles.classeSelector}>
          <div className={styles.selectWithButton}>
            <select
              value={selectedClasse}
              onChange={handleClasseChange}
              className={styles.select}
            >
              <option value="">-- Seleziona una classe --</option>
              {classi.map((classe) => (
                <option key={classe._id} value={classe._id}>
                  {classe.anno}ª {classe.sezione} - {classe.indirizzo}
                </option>
              ))}
            </select>
            <button 
              className={styles.addButton}
              onClick={() => setShowClasseForm(!showClasseForm)}
            >
              {showClasseForm ? 'Annulla' : 'Nuova Classe'}
            </button>
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}
          
          {showClasseForm && (
            <div className={styles.formSection}>
              <h4>Crea Nuova Classe</h4>
              <form onSubmit={handleClasseFormSubmit} className={styles.classeForm}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="anno">Anno:</label>
                    <select
                      id="anno"
                      name="anno"
                      value={classeFormData.anno}
                      onChange={handleClasseFormChange}
                      className={styles.select}
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
                    <label htmlFor="sezione">Sezione:</label>
                    <input
                      type="text"
                      id="sezione"
                      name="sezione"
                      value={classeFormData.sezione}
                      onChange={handleClasseFormChange}
                      className={styles.textInput}
                    />
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="aula">Aula:</label>
                  <input
                    type="text"
                    id="aula"
                    name="aula"
                    value={classeFormData.aula}
                    onChange={handleClasseFormChange}
                    className={styles.textInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="indirizzo">Indirizzo di studio:</label>
                  <input
                    type="text"
                    id="indirizzo"
                    name="indirizzo"
                    value={classeFormData.indirizzo}
                    onChange={handleClasseFormChange}
                    className={styles.textInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="numeroStudenti">Numero Studenti:</label>
                  <input
                    type="number"
                    id="numeroStudenti"
                    name="numeroStudenti"
                    value={classeFormData.numeroStudenti}
                    onChange={handleClasseFormChange}
                    className={styles.textInput}
                  />
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Salvataggio in corso...' : 'Salva Classe'}
                </button>
              </form>
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Caricamento in corso...</div>
        ) : selectedClasse && (
          <div className={styles.orarioTableWrapper}>
            <div className={styles.classeInfoHeader}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Classe</div>
                <div className={styles.infoValue}>{classeSelezionata?.anno || ''}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Sezione</div>
                <div className={styles.infoValue}>{classeSelezionata?.sezione || ''}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Coordinatore</div>
                <div className={styles.infoValue}>Docente 1</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Aula</div>
                <div className={styles.infoValue}>{classeSelezionata?.aula || ''}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>Indirizzo</div>
                <div className={styles.infoValue}>{classeSelezionata?.indirizzo || ''}</div>
              </div>
            </div>

            <table className={styles.orarioTable}>
              <thead>
                <tr>
                  <th></th>
                  {giorni.map(giorno => (
                    <th key={giorno}>{giorno}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ore.map((ora) => (
                  <tr key={ora.num}>
                    <td className={styles.oraCell}>
                      <div className={styles.oraNum}>{ora.num}ª</div>
                      <div className={styles.oraRange}>
                        {ora.inizio}-{ora.fine}
                      </div>
                    </td>
                    {giorni.map((giorno) => {
                      const lezione = getLezione(giorno, ora.num);
                      return (
                        <td 
                          key={`${giorno}-${ora.num}`}
                          className={`${styles.lezioneCell} ${lezione ? styles.hasLezione : ''}`}
                          style={{ backgroundColor: lezione?.materia?.coloreMateria || 'transparent' }}
                        >
                          {lezione ? (
                            <div className={styles.lezione}>
                              <div className={styles.materiaText}>{lezione.materia.descrizione}</div>
                              <div className={styles.docenteText}>
                                {lezione.docente.nome} {lezione.docente.cognome}
                              </div>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
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

export default GestioneOrario;