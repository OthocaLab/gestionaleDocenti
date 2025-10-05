import { useState, useEffect } from 'react';
import styles from '../styles/DashboardHome.module.css';
import { getAllDocenti } from '../services/docenteService';
import { getDocentiAssentiByDate } from '../services/assenzaService';
import CalendarioAssenze from './CalendarioAssenze';

const DashboardHome = () => {
  const [docenti, setDocenti] = useState([]);
  const [docentiAssenti, setDocentiAssenti] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [statistiche, setStatistiche] = useState({
    totaleAssenze: 0,
    totalePresenze: 0,
    personaleAttivo: 0
  });
  const [comunicazioni, setComunicazioni] = useState([
    { id: 1, titolo: 'NOTA 1', contenuto: 'Contenuto della nota 1' },
    { id: 2, titolo: 'NOTA 2', contenuto: 'Contenuto della nota 2' },
    { id: 3, titolo: 'NOTA 3', contenuto: 'Contenuto della nota 3' }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('presenti');
  const [showCalendario, setShowCalendario] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDocentiAssentiByDate(selectedDate);
    }
  }, [selectedDate]);

  // Aggiorna le statistiche in base ai docenti totali e quelli assenti per la data selezionata
  useEffect(() => {
    const totaleAssenze = docentiAssenti.length;
    const totalePresenze = docenti.length - totaleAssenze;
    
    setStatistiche({
      totaleAssenze,
      totalePresenze,
      personaleAttivo: docenti.length
    });
  }, [docenti, docentiAssenti]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Recupera l'elenco dei docenti usando il servizio
      const response = await getAllDocenti();
      const docentiData = response.data || [];
      setDocenti(docentiData);
      
      // Recupera i docenti assenti per la data corrente
      await fetchDocentiAssentiByDate(selectedDate);
      
      setLoading(false);
    } catch (error) {
      console.error('Errore nel recupero dei dati:', error);
      setError('Si è verificato un errore nel caricamento dei dati. Riprova più tardi.');
      setDocenti([]);
      setLoading(false);
    }
  };

  const fetchDocentiAssentiByDate = async (date) => {
    try {
      const response = await getDocentiAssentiByDate(date);
      setDocentiAssenti(response.data.data || []);
    } catch (error) {
      console.error('Errore nel recupero dei docenti assenti:', error);
      setDocentiAssenti([]);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const toggleCalendario = () => {
    setShowCalendario(!showCalendario);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Resetta la ricerca quando si cambia tab
    if (searchQuery) {
      setSearchQuery('');
    }
  };

  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'Data non valida';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const renderDocentiList = () => {
    // Lista di docenti da visualizzare in base al tab attivo
    let docentiToShow;
    
    if (activeTab === 'presenti') {
      // Per i docenti presenti, escludiamo quelli che sono nell'elenco degli assenti
      const docentiAssentiIds = docentiAssenti.map(d => d._id || d.docente?._id);
      docentiToShow = docenti.filter(d => !docentiAssentiIds.includes(d._id));
      
      // Applica il filtro di ricerca solo per i docenti presenti
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        docentiToShow = docentiToShow.filter(d => 
          (d.nome || '').toLowerCase().includes(query) ||
          (d.cognome || '').toLowerCase().includes(query) ||
          (d.email || '').toLowerCase().includes(query) ||
          (d.classeInsegnamento || d.classe || '').toLowerCase().includes(query) ||
          (d.materia || '').toLowerCase().includes(query)
        );
      }
    } else if (activeTab === 'assenti') {
      docentiToShow = docentiAssenti;
    } else {
      docentiToShow = docenti;
    }

    if (loading) {
      return (
        <tr>
          <td colSpan="5">Caricamento...</td>
        </tr>
      );
    }

    if (error) {
      return (
        <tr>
          <td colSpan="5" className={styles.errorMessage}>
            {error}
          </td>
        </tr>
      );
    }

    if (docentiToShow.length === 0) {
      return (
        <tr>
          <td colSpan="5">
            {activeTab === 'assenti' 
              ? `Nessun docente assente${selectedDate ? ' per il ' + formatDate(selectedDate) : ''}` 
              : 'Nessun docente presente trovato'}
          </td>
        </tr>
      );
    }

    return docentiToShow.map((docente, index) => (
      <tr key={docente._id || index}>
        <td>{docente.nome || 'Mario'}</td>
        <td>{docente.cognome || 'Rossi'}</td>
        <td>{docente.classeInsegnamento || docente.classe || '4h'}</td>
        <td>{docente.materia || 'informatica'}</td>
        <td>{docente.email || 'mariorossi@gmail.com'}</td>
      </tr>
    ));
  };

  return (
    <div className={styles.dashboardHome}>
      <div className={styles.statsContainer}>
        <div className={styles.statCard}>
          <h3>Presenze</h3>
          <p className={styles.statValue}>{statistiche.totalePresenze}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Assenze</h3>
          <p className={styles.statValue}>{statistiche.totaleAssenze}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Personale Attivo</h3>
          <p className={styles.statValue}>{statistiche.personaleAttivo}</p>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.docentiSection}>
          <div className={styles.tabsContainer}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'presenti' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('presenti')}
            >
              Elenco docenti presenti
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'assenti' ? styles.activeTab : ''}`}
              onClick={() => handleTabChange('assenti')}
            >
              Elenco docenti assenti
            </button>
          </div>

          {activeTab === 'presenti' && (
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Cerca per nome, cognome, email, classe o materia..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button 
                  className={styles.clearSearchButton}
                  onClick={() => setSearchQuery('')}
                  title="Cancella ricerca"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {activeTab === 'assenti' && (
            <div className={styles.dateContainer}>
              <div className={styles.selectedDate}>
                <span>Data selezionata: {formatDate(selectedDate)}</span>
                <button 
                  className={styles.calendarToggle}
                  onClick={toggleCalendario}
                >
                  {showCalendario ? 'Nascondi calendario' : 'Mostra calendario'}
                </button>
              </div>
              
              {showCalendario && (
                <CalendarioAssenze onDateSelect={handleDateSelect} />
              )}
            </div>
          )}

          <div className={styles.tableContainer}>
            <table className={styles.docenteTable}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cognome</th>
                  <th>classe</th>
                  <th>materia</th>
                  <th>e-mail</th>
                </tr>
              </thead>
              <tbody>
                {renderDocentiList()}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.comunicazioniSection}>
          <h2>Comunicazioni Vicepresidenza</h2>
          <ul className={styles.comunicazioniList}>
            {comunicazioni.map(nota => (
              <li key={nota.id}>• {nota.titolo}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;