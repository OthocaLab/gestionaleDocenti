import { useState, useEffect } from 'react';
import { getAllDocenti, createDocente, updateDocente, deleteDocente } from '../services/docenteService';
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
    codiceFiscale: '',
    stato: 'attivo',
    oreSettimanali: '',
    classiInsegnamento: []
  });
  const [classiDisponibili, setClassiDisponibili] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [currentDocenteId, setCurrentDocenteId] = useState(null);
  const [statistiche, setStatistiche] = useState({
    docentiTotali: 0,
    oreDaRecupero: 0,
    docentiConMateria: 0,
    docentiDisponibili: 0
  });
  
  useEffect(() => {
    fetchDocenti();
    fetchClassiInsegnamento();
  }, []);

  useEffect(() => {
    if (docenti.length > 0) {
      const stats = {
        docentiTotali: docenti.length,
        oreDaRecupero: docenti.reduce((total, doc) => {
          const ore = parseInt(doc.oreRecupero) || 0;
          return total + ore;
        }, 0),
        docentiConMateria: docenti.filter(d => {
          // Se il docente ha lezioni, controlla se almeno una non è DISP
          if (d.lezioni && Array.isArray(d.lezioni)) {
            return d.lezioni.some(lezione => 
              lezione.materia && 
              lezione.materia !== 'DISP'
            );
          }
          // Fallback al vecchio sistema per retrocompatibilità
          return d.materia && 
                 d.materia !== 'N/D' && 
                 d.materia !== 'DISP';
        }).length,
        docentiDisponibili: docenti.filter(d => {
          // Se il docente ha lezioni, controlla se almeno una è DISP
          if (d.lezioni && Array.isArray(d.lezioni)) {
            return d.stato === 'attivo' && 
                   d.lezioni.some(lezione => 
                     lezione.materia === 'DISP'
                   );
          }
          // Fallback al vecchio sistema per retrocompatibilità
          return d.stato === 'attivo' && 
                 d.materia === 'DISP';
        }).length
      };
      setStatistiche(stats);
    }
  }, [docenti]);

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

  const fetchClassiInsegnamento = async () => {
    try {
      // You'll need to create this service function
      const response = await getAllClassiInsegnamento();
      setClassiDisponibili(response.data);
    } catch (err) {
      setError('Errore nel caricamento delle classi di insegnamento');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Funzione per gestire la modifica di un docente
  const handleModifica = (docente) => {
    setFormData({
      nome: docente.nome || '',
      cognome: docente.cognome || '',
      email: docente.email || '',
      telefono: docente.telefono || '',
      codiceFiscale: docente.codiceFiscale || '',
      stato: docente.stato || 'attivo',
      oreSettimanali: docente.oreSettimanali || '',
      classiInsegnamento: docente.classiInsegnamento && docente.classiInsegnamento.length > 0 
        ? docente.classiInsegnamento.map(classe => 
            typeof classe === 'object' ? classe._id : classe
          )
        : []
    });
    
    setEditMode(true);
    setCurrentDocenteId(docente._id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };
  
  // Funzione per gestire l'eliminazione di un docente
  const handleElimina = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo docente? Questa azione non può essere annullata.')) {
      try {
        setLoading(true);
        await deleteDocente(id);
        setSuccess('Docente eliminato con successo!');
        await fetchDocenti();
        setLoading(false);
      } catch (err) {
        setError('Errore nell\'eliminazione del docente: ' + (err.message || 'Errore sconosciuto'));
        setLoading(false);
      }
    }
  };

  // Modifica la funzione handleFormSubmit per gestire sia la creazione che l'aggiornamento
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.nome || !formData.cognome || !formData.email || !formData.codiceFiscale) {
      setError('Nome, cognome, email e codice fiscale sono obbligatori');
      return;
    }
    
    try {
      setLoading(true);
      
      if (editMode) {
        // Aggiorna un docente esistente
        await updateDocente(currentDocenteId, formData);
        setSuccess('Docente aggiornato con successo!');
      } else {
        // Crea un nuovo docente
        await createDocente(formData);
        setSuccess('Docente creato con successo!');
      }
      
      // Reset del form
      setFormData({
        nome: '',
        cognome: '',
        email: '',
        telefono: '',
        codiceFiscale: '',
        stato: 'attivo',
        oreSettimanali: '',
        classiInsegnamento: []
      });
      
      await fetchDocenti();
      setShowForm(false);
      setEditMode(false);
      setCurrentDocenteId(null);
      setLoading(false);
    } catch (err) {
      setError('Errore nella gestione del docente: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  const handleClassiChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData({
      ...formData,
      classiInsegnamento: selectedOptions
    });
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocenti, setFilteredDocenti] = useState([]);
  const [filters, setFilters] = useState({
    minOre: '',
    maxOre: '',
    classe: '',
    materia: ''
  });

  useEffect(() => {
    applyFilters();
  }, [docenti, searchTerm, filters]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    let filtered = [...docenti];
  
    // Applica filtro di ricerca
    if (searchTerm) {
      filtered = filtered.filter(docente => 
        docente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        docente.cognome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        docente.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    // Applica filtro range ore
    if (filters.minOre) {
      filtered = filtered.filter(docente => docente.oreSettimanali >= parseInt(filters.minOre));
    }
    if (filters.maxOre) {
      filtered = filtered.filter(docente => docente.oreSettimanali <= parseInt(filters.maxOre));
    }
  
    // Applica filtro classe
    if (filters.classe) {
      filtered = filtered.filter(docente => {
        // Se il docente ha lezioni, cerca nelle classi delle lezioni
        if (docente.lezioni && Array.isArray(docente.lezioni)) {
          return docente.lezioni.some(lezione => 
            lezione.classe && 
            lezione.classe.toLowerCase().includes(filters.classe.toLowerCase())
          );
        }
        // Fallback ai classiInsegnamento tradizionali
        return docente.classiInsegnamento && docente.classiInsegnamento.some(classe => 
          typeof classe === 'object' && classe.nome && 
          classe.nome.toLowerCase().includes(filters.classe.toLowerCase())
        );
      });
    }
  
    // Applica filtro materia
    if (filters.materia) {
      filtered = filtered.filter(docente => {
        // Se il docente ha lezioni, cerca nelle materie delle lezioni
        if (docente.lezioni && Array.isArray(docente.lezioni)) {
          return docente.lezioni.some(lezione => 
            lezione.materia && 
            lezione.materia.toLowerCase().includes(filters.materia.toLowerCase())
          );
        }
        // Fallback ai classiInsegnamento tradizionali
        return docente.classiInsegnamento && docente.classiInsegnamento.some(classe => 
          typeof classe === 'object' && classe.materia && classe.materia.descrizione &&
          classe.materia.descrizione.toLowerCase().includes(filters.materia.toLowerCase())
        );
      });
    }
  
    setFilteredDocenti(filtered);
  };

  // Modifica la parte del render per includere gli handler
  return (
    <div className={styles.docentiContainer}>
      {/* Stats Cards con nuovo stile */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>👨‍🏫</span>
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{statistiche.docentiTotali}</h3>
            <p className={styles.statLabel}>Docenti Totali</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>⏱️</span>
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{statistiche.oreDaRecupero}</h3>
            <p className={styles.statLabel}>Ore da Recuperare</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>📚</span>
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{statistiche.docentiConMateria}</h3>
            <p className={styles.statLabel}>Docenti con Materia</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <span className={styles.statIcon}>👥</span>
          </div>
          <div className={styles.statContent}>
            <h3 className={styles.statValue}>{statistiche.docentiDisponibili}</h3>
            <p className={styles.statLabel}>Docenti Disponibili</p>
          </div>
        </div>
      </div>

      <div className={styles.docentiPanel}>
        <div className={styles.docentiHeader}>
          <h2 className={styles.panelTitle}>Gestione Docenti</h2>
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <span className={styles.searchIcon}>🔍</span>
              <input 
                type="text" 
                placeholder="Cerca docente..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <div className={styles.filterContainer}>
              <div className={styles.filterRow}>
                <div className={styles.filterItem}>
                  <label className={styles.filterLabel}>Range Ore:</label>
                  <div className={styles.rangeInputs}>
                    <input
                      type="number"
                      name="minOre"
                      placeholder="Min"
                      value={filters.minOre}
                      onChange={handleFilterChange}
                      className={styles.rangeInput}
                    />
                    <input
                      type="number"
                      name="maxOre"
                      placeholder="Max"
                      value={filters.maxOre}
                      onChange={handleFilterChange}
                      className={styles.rangeInput}
                    />
                  </div>
                </div>
                
                <div className={styles.filterItem}>
                  <label className={styles.filterLabel}>Classe:</label>
                  <input
                    type="text"
                    name="classe"
                    placeholder="es. 1A"
                    value={filters.classe}
                    onChange={handleFilterChange}
                    className={styles.filterInput}
                  />
                </div>
                
                <div className={styles.filterItem}>
                  <label className={styles.filterLabel}>Materia:</label>
                  <input
                    type="text"
                    name="materia"
                    placeholder="es. Matematica"
                    value={filters.materia}
                    onChange={handleFilterChange}
                    className={styles.filterInput}
                  />
                </div>
              </div>
            </div>
            <button 
              className={`${styles.addButton} ${showForm ? styles.active : ''}`}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? '✕ Annulla' : '+ Nuovo Docente'}
            </button>
          </div>
        </div>

        {/* Messaggi di feedback migliorati */}
        {error && (
          <div className={`${styles.message} ${styles.errorMessage}`}>
            <span className={styles.messageIcon}>⚠️</span>
            {error}
          </div>
        )}
        {success && (
          <div className={`${styles.message} ${styles.successMessage}`}>
            <span className={styles.messageIcon}>✅</span>
            {success}
          </div>
        )}

        {/* Form in un card con ombra */}
        {showForm && (
          <div className={styles.formCard}>
            <h3 className={styles.formTitle}>{editMode ? 'Modifica Docente' : 'Inserisci Nuovo Docente'}</h3>
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
                  <label htmlFor="codiceFiscale">Codice Fiscale:</label>
                  <input
                    type="text"
                    id="codiceFiscale"
                    name="codiceFiscale"
                    value={formData.codiceFiscale}
                    onChange={handleFormChange}
                    className={styles.textInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="stato">Stato:</label>
                  <select
                    id="stato"
                    name="stato"
                    value={formData.stato}
                    onChange={handleFormChange}
                    className={styles.select}
                  >
                    <option value="attivo">Attivo</option>
                    <option value="inattivo">Inattivo</option>
                  </select>
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
                
                <div className={styles.formGroup}>
                  <label htmlFor="classiInsegnamento">Classi di Insegnamento:</label>
                  <select
                    id="classiInsegnamento"
                    name="classiInsegnamento"
                    multiple
                    value={formData.classiInsegnamento}
                    onChange={handleClassiChange}
                    className={styles.select}
                  >
                    {classiDisponibili.map(classe => (
                      <option key={classe._id} value={classe._id}>
                        {classe.nome || classe.descrizione}
                      </option>
                    ))}
                  </select>
                  <small>Tieni premuto Ctrl (o Cmd) per selezionare più classi</small>
                </div>
              </div>
              
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Salvataggio in corso...' : (editMode ? 'Aggiorna Docente' : 'Salva Docente')}
              </button>
              
              {editMode && (
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => {
                    setEditMode(false);
                    setCurrentDocenteId(null);
                    setFormData({
                      nome: '',
                      cognome: '',
                      email: '',
                      telefono: '',
                      codiceFiscale: '',
                      stato: 'attivo',
                      oreSettimanali: '',
                      classiInsegnamento: []
                    });
                    setShowForm(false);
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  Annulla Modifica
                </button>
              )}
            </form>
          </div>
        )}

        {/* Tabella con nuovo stile */}
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Caricamento in corso...</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            {filteredDocenti.length > 0 ? (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cognome</th>
                    <th>Email</th>
                    <th>Telefono</th>
                    <th>Classi</th>
                    <th>Materie</th>
                    <th>Ore da Recuperare</th>
                    <th style={{ textAlign: 'center', minWidth: '300px' }}>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocenti.map((docente) => (
                    <tr key={docente._id}>
                      <td>{docente.nome}</td>
                      <td>{docente.cognome}</td>
                      <td>{docente.email}</td>
                      <td>{docente.telefono || '-'}</td>
                      <td>
                        {docente.lezioni && docente.lezioni.length > 0 
                          ? (() => {
                              const classi = [...new Set(docente.lezioni.map(lezione => lezione.classe).filter(Boolean))];
                              return classi.length > 0 ? classi.join(', ') : 'N/D';
                            })()
                          : (docente.classiInsegnamento && docente.classiInsegnamento.length > 0 
                              ? docente.classiInsegnamento.map(classe => 
                                  typeof classe === 'object' ? (classe.nome || classe.codiceClasse || 'N/D') : classe
                                ).join(', ')
                              : 'N/D'
                            )
                        }
                      </td>
                      <td>
                        {docente.lezioni && docente.lezioni.length > 0 
                          ? [...new Set(docente.lezioni.map(lezione => lezione.materia).filter(m => m && m !== 'DISP'))].join(', ') || 'DISP'
                          : (docente.classiInsegnamento && docente.classiInsegnamento.length > 0 
                              ? docente.classiInsegnamento.map(classe => 
                                  typeof classe === 'object' && classe.materia ? classe.materia.descrizione : '-'
                                ).filter((value, index, self) => self.indexOf(value) === index).join(', ')
                              : '-'
                            )
                        }
                      </td>
                      <td>{docente.oreRecupero || 0} ore</td>
                      <td>
                        <div className={styles.actionButtons}>
                          <button 
                            className={`${styles.actionButton} ${styles.editButton}`}
                            onClick={() => handleModifica(docente)}
                          >
                            ✏️ Modifica
                          </button>
                          <button 
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                            onClick={() => handleElimina(docente._id)}
                          >
                            🗑️ Elimina
                          </button>
                          <button className={`${styles.actionButton} ${styles.scheduleButton}`}>
                            📅 Orario
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.noResultsMessage}>
                <p>Nessun docente trovato</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GestioneDocenti;