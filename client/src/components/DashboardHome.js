import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/DashboardHome.module.css';

const DashboardHome = () => {
  const [docenti, setDocenti] = useState([]);
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
  const [activeTab, setActiveTab] = useState('presenti');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Recupera l'elenco dei docenti
        const docentiResponse = await axios.get('/api/docenti');
        setDocenti(docentiResponse.data);
        
        // Calcola le statistiche
        const presenti = docentiResponse.data.filter(d => !d.assente).length;
        const assenti = docentiResponse.data.filter(d => d.assente).length;
        
        setStatistiche({
          totalePresenze: presenti,
          totaleAssenze: assenti,
          personaleAttivo: docentiResponse.data.length
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Errore nel recupero dei dati:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
              onClick={() => setActiveTab('presenti')}
            >
              Elenco docenti presenti
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'assenti' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('assenti')}
            >
              Elenco docenti assenti
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'materia' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('materia')}
            >
              Materia
            </button>
            
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.docenteTable}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cognome</th>
                  <th>classe</th>
                  <th>materia</th>
                  <th>e-mail</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5">Caricamento...</td>
                  </tr>
                ) : (
                  docenti
                    .filter(docente => activeTab === 'presenti' ? !docente.assente : docente.assente)
                    .map((docente, index) => (
                      <tr key={docente._id || index}>
                        <td>{docente.nome || 'Mario'}</td>
                        <td>{docente.cognome || 'Rossi'}</td>
                        <td>{docente.classeInsegnamento || '4h'}</td>
                        <td>{docente.materia || 'informatica'}</td>
                        <td>{docente.email || 'mariorossi@gmail.com'}</td>
                        <td>
                          <button className={styles.actionButton}>
                            {index % 2 === 0 ? '↑' : '↓'}
                          </button>
                        </td>
                      </tr>
                    ))
                )}
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