import { useState, useEffect, useContext } from 'react';
import { getAllDocenti } from '../services/docenteService';
import { getDocentiDisponibili } from '../services/orarioService';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/GestioneSostituzioni.module.css';

const GestioneSostituzioni = () => {
  const { refreshToken, logout } = useContext(AuthContext);
  const [docenti, setDocenti] = useState([]);
  const [docentiDisponibili, setDocentiDisponibili] = useState([]);
  const [docentiDispCodice, setDocentiDispCodice] = useState([]); // Docenti con codice DISP
  const [docentiAssenti, setDocentiAssenti] = useState([]);
  const [orarioClassi, setOrarioClassi] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filtri, setFiltri] = useState({
    data: new Date().toISOString().split('T')[0],
    ora: '',
    nome: '',
  });
  const [sostituzioni, setSostituzioni] = useState({});
  const [visualizzazione, setVisualizzazione] = useState('lista'); // 'lista' o 'griglia'
  const [docentiSostituiti, setDocentiSostituiti] = useState({}); // Per tenere traccia delle sostituzioni effettuate

  const oreDisponibili = [1, 2, 3, 4, 5, 6, 7, 8];
  const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  
  // Ottieni il giorno della settimana dalla data selezionata
  const getGiornoSettimana = (data) => {
    const giornoIndex = new Date(data).getDay();
    // In JavaScript getDay() restituisce 0 per Domenica, 1 per Lunedì, ecc.
    // Dobbiamo mapparlo al nostro array giorni
    return giorni[giornoIndex === 0 ? 6 : giornoIndex - 1];
  };

  useEffect(() => {
    fetchDocenti();
    fetchDocentiAssenti();
    fetchDocentiDispCodice(); // Ottieni i docenti con codice DISP
  }, []);
  
  useEffect(() => {
    if (filtri.data) {
      fetchDocentiAssenti();
    }
  }, [filtri.data]);

  const fetchDocenti = async () => {
    try {
      setLoading(true);
      const response = await getAllDocenti();
      // Filtra solo i docenti attivi
      const docentiAttivi = response.data.filter(d => d.stato === 'attivo');
      setDocenti(docentiAttivi);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento dei docenti');
      setLoading(false);
    }
  };
  
  // Funzione per ottenere i docenti con codice DISP
  const fetchDocentiDispCodice = async () => {
    try {
      setLoading(true);
      // Ottieni il token di autenticazione dallo storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token di autenticazione mancante. Effettuare nuovamente il login.');
        setLoading(false);
        return;
      }
      
      // Usa l'endpoint dedicato per docenti con codice DISP
      const response = await axios.get('/api/docenti/disp', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setDocentiDispCodice(response.data.data || []);
        console.log('Docenti DISP caricati:', response.data.data);
      } else {
        console.error('Errore nel formato risposta docenti DISP:', response.data);
        setDocentiDispCodice([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nel recupero dei docenti con codice DISP:', err);
      
      // Gestione specifica per errori di autenticazione
      if (err.response?.status === 401) {
        const retried = await handleAuthError(err);
        if (retried) {
          // Riprova l'operazione dopo aver rinnovato il token
          fetchDocentiDispCodice();
          return;
        }
      } else {
        setError('Errore nel recupero dei docenti disponibili: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      }
      
      setLoading(false);
    }
  };
  
  // Funzione per gestire gli errori di autenticazione
  const handleAuthError = async (error) => {
    console.error('Errore di autenticazione:', error);
    
    if (error.response?.status === 401) {
      try {
        // Prova a rinnovare il token
        const refreshed = await refreshToken();
        
        if (refreshed) {
          // Se il token è stato rinnovato, riprova l'operazione
          return true;
        } else {
          // Se il refresh è fallito, reindirizza al login
          setError('Sessione scaduta. Reindirizzamento al login...');
          setTimeout(() => {
            logout();
            window.location.href = '/login';
          }, 2000);
          return false;
        }
      } catch (refreshError) {
        setError('Errore di autenticazione. Effettuare nuovamente il login.');
        setTimeout(() => {
          logout();
          window.location.href = '/login';
        }, 2000);
        return false;
      }
    }
    
    return false;
  };

  const fetchDocentiAssenti = async () => {
    try {
      setLoading(true);
      // Ottieni il token di autenticazione dallo storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token di autenticazione mancante. Effettuare nuovamente il login.');
        setLoading(false);
        return;
      }
      
      // Chiama l'API per ottenere i docenti assenti per la data selezionata con il token
      const response = await axios.get(`/api/assenze?data=${filtri.data}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setDocentiAssenti(response.data.data || []);
      
      // Ottieni l'orario per tutte le classi
      await fetchOrarioClassi();
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nel recupero dei docenti assenti:', err);
      
      // Gestione specifica per errori di autenticazione
      if (err.response?.status === 401) {
        const retried = await handleAuthError(err);
        if (retried) {
          // Riprova l'operazione dopo aver rinnovato il token
          fetchDocentiAssenti();
          return;
        }
      } else {
        setError('Errore nel recupero dei docenti assenti: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      }
      
      setLoading(false);
    }
  };
  
  const fetchOrarioClassi = async () => {
    try {
      // Ottieni il token di autenticazione dallo storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token di autenticazione mancante. Effettuare nuovamente il login.');
        return;
      }
      
      // Configurazione con il token di autorizzazione
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      // Ottieni tutte le classi
      const responseClassi = await axios.get('/api/orario/classi', config);
      const classi = responseClassi.data.data;
      
      // Ottieni l'orario per ogni classe
      const orariPerClasse = {};
      
      for (const classe of classi) {
        const responseOrario = await axios.get(`/api/orario/orario/classe/${classe._id}`, config);
        
        if (responseOrario.data.success) {
          // Organizziamo l'orario per giorno e ora
          const orarioOrganizzato = {};
          
          responseOrario.data.data.forEach(lezione => {
            if (!orarioOrganizzato[lezione.giornoSettimana]) {
              orarioOrganizzato[lezione.giornoSettimana] = {};
            }
            orarioOrganizzato[lezione.giornoSettimana][lezione.ora] = lezione;
          });
          
          orariPerClasse[classe._id] = {
            classeInfo: classe,
            orario: orarioOrganizzato
          };
        }
      }
      
      setOrarioClassi(orariPerClasse);
    } catch (err) {
      console.error('Errore nel recupero dell\'orario delle classi:', err);
      if (err.response?.status === 401) {
        setError('Sessione scaduta. Effettuare nuovamente il login.');
      } else {
        setError('Errore nel recupero dell\'orario delle classi: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      }
    }
  };

  const fetchDocentiDisponibili = async () => {
    if (!filtri.ora) {
      setError('Seleziona un\'ora per visualizzare i docenti disponibili');
      return;
    }

    try {
      setLoading(true);
      // Ottieni il token di autenticazione dallo storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token di autenticazione mancante. Effettuare nuovamente il login.');
        setLoading(false);
        return;
      }
      
      // Usa il nuovo endpoint per recuperare i docenti disponibili
      const response = await axios.get('/api/docenti/disponibili', {
        params: {
          data: filtri.data,
          ora: filtri.ora
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setDocentiDisponibili(response.data.data || []);
        console.log('Docenti disponibili caricati:', response.data.data);
      } else {
        console.error('Errore nel formato risposta docenti disponibili:', response.data);
        setError('Errore nel recupero dei docenti disponibili: ' + response.data.message);
        setDocentiDisponibili([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nel recupero dei docenti disponibili:', err);
      
      // Gestione specifica per errori di autenticazione
      if (err.response?.status === 401) {
        const retried = await handleAuthError(err);
        if (retried) {
          // Riprova l'operazione dopo aver rinnovato il token
          fetchDocentiDisponibili();
          return;
        }
      } else {
        setError('Errore nel recupero dei docenti disponibili: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      }
      
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltri({
      ...filtri,
      [name]: value
    });

    // Reset dei docenti disponibili quando cambiano i filtri
    setDocentiDisponibili([]);
  };

  const applicaFiltri = () => {
    fetchDocentiDisponibili();
  };

  // Funzione per creare docenti DISP di test
  const creaDocentiDispTest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token di autenticazione mancante. Effettuare nuovamente il login.');
        setLoading(false);
        return;
      }
      
      // Chiamata all'API per creare docenti DISP
      const response = await axios.post('/api/docenti/crea-disp', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setSuccess(response.data.message);
        // Ricarica i docenti DISP
        await fetchDocentiDispCodice();
      } else {
        setError('Errore nella creazione dei docenti DISP: ' + response.data.message);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Errore nella creazione dei docenti DISP:', err);
      setError('Errore nella creazione dei docenti DISP: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  const handleSelezionaSostituto = (docenteId, sostitutoId) => {
    setSostituzioni({
      ...sostituzioni,
      [docenteId]: sostitutoId
    });
  };

  const handleSalvaSostituzione = async (docenteId) => {
    const sostitutoId = sostituzioni[docenteId];
    
    if (!sostitutoId) {
      alert('Seleziona un docente sostituto');
      return;
    }
    
    try {
      setLoading(true);
      // Ottieni il token di autenticazione
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Token di autenticazione mancante. Effettuare nuovamente il login.');
        setLoading(false);
        return;
      }
      
      // Chiama l'API per registrare la sostituzione
      const response = await axios.post('/api/docenti/sostituzione', 
        {
          docenteId,
          sostitutoId,
          data: filtri.data,
          ora: parseInt(filtri.ora || 1)
        }, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setSuccess('Sostituzione registrata con successo!');
        
        // Aggiorna l'oggetto docentiSostituiti per il cambio di colore
        setDocentiSostituiti({
          ...docentiSostituiti,
          [docenteId]: sostitutoId
        });
        
        // Rimuovi la sostituzione salvata dall'oggetto delle sostituzioni
        const nuoveSostituzioni = { ...sostituzioni };
        delete nuoveSostituzioni[docenteId];
        setSostituzioni(nuoveSostituzioni);
        
        console.log('Sostituzione effettuata:', response.data);
      } else {
        setError('Errore nella registrazione della sostituzione: ' + response.data.message);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Dettaglio errore sostituzione:', err);
      setError('Errore nella registrazione della sostituzione: ' + (err.response?.data?.message || err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  const docentiFiltratiNome = docenti.filter(docente => 
    docente.nome.toLowerCase().includes(filtri.nome.toLowerCase()) ||
    docente.cognome.toLowerCase().includes(filtri.nome.toLowerCase())
  );
  
  // Verifica se un docente è assente in una determinata ora
  const isDocenteAssenteInOra = (docenteId, ora) => {
    return docentiAssenti.some(assenza => {
      // Se è assente tutto il giorno
      if (assenza.docente._id === docenteId && assenza.assenteGiornataIntera) {
        return true;
      }
      
      // Se è assente in un'ora specifica
      if (assenza.docente._id === docenteId && assenza.oreAssenza) {
        return assenza.oreAssenza.some(oraAss => oraAss.ora === ora);
      }
      
      return false;
    });
  };

  // Verifica se un docente è stato sostituito
  const isDocenteSostituito = (docenteId) => {
    return docentiSostituiti[docenteId] !== undefined;
  };
  
  // Raggruppa le classi in gruppi di 3 per riga
  const raggruppaClassi = () => {
    const classi = Object.values(orarioClassi);
    const gruppi = [];
    
    for (let i = 0; i < classi.length; i += 3) {
      gruppi.push(classi.slice(i, i + 3));
    }
    
    return gruppi;
  };

  // Tutti i docenti disponibili per la selezione (inclusi quelli con codice DISP)
  const getAllDocentiDisponibili = () => {
    // Combinazione di docenti disponibili e docenti con codice DISP
    const docentiCombinati = [
      ...docentiDisponibili, 
      ...docentiDispCodice.filter(d => !docentiDisponibili.some(disponibile => disponibile._id === d._id))
    ];
    
    console.log('Docenti disponibili combinati:', docentiCombinati.length);
    return docentiCombinati;
  };

  return (
    <div className={styles.container}>
      <h2>Gestione Sostituzioni Docenti</h2>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      <div className={styles.filterSection}>
        <h3>Seleziona Data e Ora</h3>
        <div className={styles.filterRow}>
          <div className={styles.filterItem}>
            <label htmlFor="data">Data:</label>
            <input
              type="date"
              id="data"
              name="data"
              value={filtri.data}
              onChange={handleFiltroChange}
              className={styles.input}
            />
          </div>
          
          <div className={styles.filterItem}>
            <label htmlFor="ora">Ora:</label>
            <select
              id="ora"
              name="ora"
              value={filtri.ora}
              onChange={handleFiltroChange}
              className={styles.select}
            >
              <option value="">Seleziona</option>
              {oreDisponibili.map(ora => (
                <option key={ora} value={ora}>Ora {ora}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterItem}>
            <label htmlFor="nome">Filtro Docente:</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={filtri.nome}
              onChange={handleFiltroChange}
              placeholder="Cerca docente..."
              className={styles.input}
            />
          </div>
          
          <button 
            onClick={applicaFiltri} 
            className={styles.button}
            disabled={!filtri.ora}
          >
            Trova Disponibilità
          </button>
          
          <button 
            onClick={creaDocentiDispTest}
            className={`${styles.button} ${styles.buttonDisp}`}
            title="Crea docenti con codice DISP di test"
          >
            Crea Docenti DISP
          </button>
        </div>
        
        <div className={styles.viewToggle}>
          <button 
            className={`${styles.toggleButton} ${visualizzazione === 'lista' ? styles.active : ''}`}
            onClick={() => setVisualizzazione('lista')}
          >
            Lista Docenti
          </button>
          <button 
            className={`${styles.toggleButton} ${visualizzazione === 'griglia' ? styles.active : ''}`}
            onClick={() => setVisualizzazione('griglia')}
          >
            Griglia Oraria
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loadingMessage}>Caricamento in corso...</div>
      ) : (
        <>
          {visualizzazione === 'lista' && (
            <div className={styles.tableSection}>
              <h3>Elenco Docenti</h3>
              {docentiFiltratiNome.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Cognome</th>
                      <th>Ore Recupero</th>
                      <th>Sostituto</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docentiFiltratiNome.map(docente => (
                      <tr 
                        key={docente._id} 
                        className={isDocenteSostituito(docente._id) ? styles.docenteSostituito : ''}
                        style={isDocenteSostituito(docente._id) ? { backgroundColor: 'rgba(255, 0, 0, 0.2)' } : {}}
                      >
                        <td>{docente.nome}</td>
                        <td>{docente.cognome}</td>
                        <td>{docente.oreRecupero || 0}</td>
                        <td>
                          <select
                            value={sostituzioni[docente._id] || ''}
                            onChange={(e) => handleSelezionaSostituto(docente._id, e.target.value)}
                            className={styles.select}
                          >
                            <option value="">Seleziona sostituto</option>
                            {getAllDocentiDisponibili().map(sostituto => {
                              // Non mostrare il docente stesso nell'elenco dei sostituti
                              if (sostituto._id === docente._id) return null;
                              
                              // Aggiungi etichetta DISP per docenti con codice DISP
                              const isDispDocente = docentiDispCodice.some(d => d._id === sostituto._id);
                              let label = '';
                              
                              if (isDispDocente) {
                                label = ' [DISP]';
                              } else if (sostituto.oreRecupero > 0) {
                                label = ` (${sostituto.oreRecupero} ore)`;
                              }
                              
                              return (
                                <option 
                                  key={sostituto._id} 
                                  value={sostituto._id}
                                  style={isDispDocente ? {fontWeight: 'bold', color: '#dc3545'} : {}}
                                >
                                  {sostituto.nome} {sostituto.cognome}{label}
                                </option>
                              );
                            })}
                          </select>
                        </td>
                        <td>
                          <button
                            onClick={() => handleSalvaSostituzione(docente._id)}
                            className={styles.button}
                            disabled={!sostituzioni[docente._id]}
                          >
                            Salva
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>Nessun docente trovato con i filtri specificati</p>
              )}
            </div>
          )}
          
          {visualizzazione === 'griglia' && (
            <div className={styles.grigliaSostituzioni}>
              <h3>Visualizzazione Orario e Assenze - {getGiornoSettimana(filtri.data)}</h3>
              
              {docentiAssenti.length > 0 ? (
                <div className={styles.docentiAssentiList}>
                  <h4>Docenti Assenti</h4>
                  <ul>
                    {docentiAssenti.map(assenza => (
                      <li key={assenza._id} className={styles.docenteAssenteItem}>
                        <span className={styles.nomeDocente}>
                          {assenza.docente.nome} {assenza.docente.cognome} 
                        </span>
                        <span className={styles.infoAssenza}>
                          {assenza.assenteGiornataIntera 
                            ? 'Assente tutto il giorno' 
                            : `Assente ore: ${assenza.oreAssenza.map(o => o.ora).join(', ')}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>Nessun docente assente nella data selezionata</p>
              )}
              
              <div className={styles.grigliaOrario}>
                {raggruppaClassi().map((gruppo, index) => (
                  <div key={index} className={styles.rigaClassi}>
                    {gruppo.map(classeInfo => (
                      <div key={classeInfo.classeInfo._id} className={styles.classeOrario}>
                        <h4 className={styles.nomeClasse}>
                          {classeInfo.classeInfo.anno}{classeInfo.classeInfo.sezione} - {classeInfo.classeInfo.aula}
                        </h4>
                        <table className={styles.tabellaOrario}>
                          <thead>
                            <tr>
                              <th>Ora</th>
                              <th>Materia</th>
                              <th>Docente</th>
                              <th>Sostituto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {oreDisponibili.map(ora => {
                              const giorno = getGiornoSettimana(filtri.data);
                              const lezione = classeInfo.orario[giorno]?.[ora];
                              
                              // Se non c'è lezione in quest'ora, non mostriamo la riga
                              if (!lezione) return null;
                              
                              const docenteAssente = isDocenteAssenteInOra(lezione.docente._id, ora);
                              const docenteSostituito = isDocenteSostituito(lezione.docente._id);
                              
                              // Classe CSS condizionale
                              const rowClass = docenteSostituito 
                                ? styles.rigaSostituitaDocente 
                                : docenteAssente ? styles.rigaAssenteDocente : '';
                              
                              // Stile inline condizionale
                              const rowStyle = docenteSostituito 
                                ? { backgroundColor: 'rgba(255, 0, 0, 0.2)' } 
                                : {};
                              
                              return (
                                <tr 
                                  key={ora} 
                                  className={rowClass}
                                  style={rowStyle}
                                >
                                  <td>{ora}ª</td>
                                  <td>{lezione.materia.descrizione}</td>
                                  <td>
                                    {lezione.docente.nome} {lezione.docente.cognome}
                                  </td>
                                  <td>
                                    {docenteAssente && (
                                      <select
                                        value={sostituzioni[lezione.docente._id] || ''}
                                        onChange={(e) => handleSelezionaSostituto(lezione.docente._id, e.target.value)}
                                        className={styles.selectSostituto}
                                      >
                                        <option value="">Seleziona sostituto</option>
                                        {getAllDocentiDisponibili()
                                          .filter(d => filtri.ora ? parseInt(filtri.ora) === ora : true)
                                          .map(sostituto => {
                                            // Aggiungi etichetta DISP per docenti con codice DISP
                                            const isDispDocente = docentiDispCodice.some(d => d._id === sostituto._id);
                                            let label = '';
                                            
                                            if (isDispDocente) {
                                              label = ' [DISP]';
                                            } else if (sostituto.oreRecupero > 0) {
                                              label = ` (${sostituto.oreRecupero})`;
                                            }
                                            
                                            return (
                                              <option 
                                                key={sostituto._id} 
                                                value={sostituto._id}
                                                style={isDispDocente ? {fontWeight: 'bold', color: '#dc3545'} : {}}
                                              >
                                                {sostituto.nome} {sostituto.cognome}{label}
                                              </option>
                                            );
                                          })
                                        }
                                      </select>
                                    )}
                                    {docenteAssente && sostituzioni[lezione.docente._id] && (
                                      <button
                                        onClick={() => handleSalvaSostituzione(lezione.docente._id)}
                                        className={styles.buttonSalvaSostituto}
                                      >
                                        Salva
                                      </button>
                                    )}
                                    {docenteSostituito && (
                                      <span className={styles.sostituitoLabel}>
                                        Sostituito
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {docentiDisponibili.length > 0 && (
            <div className={styles.infoSection}>
              <h3>Docenti Disponibili - Ora {filtri.ora} - {getGiornoSettimana(filtri.data)}</h3>
              <div className={styles.disponibilitaContainer}>
                <div>
                  <h4>Docenti Disponibili</h4>
                  <ul className={styles.disponibilitaList}>
                    {docentiDisponibili.map(docente => (
                      <li key={docente._id} className={styles.disponibilitaItem}>
                        {docente.nome} {docente.cognome}
                        {docente.oreRecupero > 0 && <span className={styles.badge}>{docente.oreRecupero} ore da recuperare</span>}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {docentiDispCodice.length > 0 && (
                  <div>
                    <h4>Docenti con Codice Materia DISP</h4>
                    <ul className={styles.disponibilitaList}>
                      {docentiDispCodice.map(docente => (
                        <li key={docente._id} className={`${styles.disponibilitaItem} ${styles.dispItem}`}>
                          {docente.nome} {docente.cognome}
                          <span className={styles.badgeDisp}>DISP</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GestioneSostituzioni; 