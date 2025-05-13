import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/GestioneSostituzioni.module.css';

const GestioneSostituzioni = () => {
  const { token } = useContext(AuthContext);
  const [assenze, setAssenze] = useState([]);
  const [sostituti, setSostituti] = useState([]);
  const [orarioClasse, setOrarioClasse] = useState({});
  const [selectedAssenza, setSelectedAssenza] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Funzioni per le chiamate API
  const fetchAssenzeDaCoprire = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sostituzioni/assenze-da-coprire');
      
      if (response.data && response.data.data) {
        // Formatta i dati per la visualizzazione
        const formattedAssenze = response.data.data.map(assenza => ({
          id: assenza.id,
          assenzaId: assenza.assenzaId,
          docente: {
            id: assenza.docente.id,
            nome: `${assenza.docente.nome} ${assenza.docente.cognome}`
          },
          classe: assenza.classe,
          giorno: convertGiorno(assenza.giorno),
          ora: assenza.ora.toString(),
          materia: assenza.materia,
          data: new Date(assenza.data)
        }));
        
        setAssenze(formattedAssenze);
        setError(null);
      } else {
        setAssenze([]);
        setError('Dati non validi ricevuti dal server');
      }
    } catch (err) {
      console.error('Errore nel recupero delle assenze:', err);
      if (err.response && err.response.status === 401) {
        setError('Sessione scaduta. Effettua nuovamente l\'accesso.');
      } else {
        setError('Impossibile caricare le assenze. Riprova più tardi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDocentiDisponibili = async (assenza) => {
    if (!assenza) return;
    
    try {
      const response = await axios.get('/api/sostituzioni/docenti-disponibili', {
        params: {
          data: assenza.data.toISOString(),
          ora: assenza.ora,
          giorno: convertGiornoToApi(assenza.giorno)
        }
      });
      
      setSostituti(response.data.data || []);
    } catch (err) {
      console.error('Errore nel recupero dei docenti disponibili:', err);
      if (err.response && err.response.status === 401) {
        setError('Sessione scaduta. Effettua nuovamente l\'accesso.');
      } else {
        setError('Impossibile caricare i docenti disponibili. Riprova più tardi.');
      }
    }
  };

  const fetchOrarioClasse = async (classe, data) => {
    if (!classe || classe === 'N/D') {
      // Se la classe è 'N/D' o invalida, impostiamo un orario vuoto
      const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
      const orarioVuoto = {};
      
      for (const giorno of giorni) {
        orarioVuoto[giorno] = [];
        for (let ora = 1; ora <= 8; ora++) {
          orarioVuoto[giorno].push({
            ora: ora,
            materia: '',
            docente: '',
            aula: '',
            tipo: 'vuota'
          });
        }
      }
      
      setOrarioClasse(orarioVuoto);
      return;
    }
    
    try {
      const response = await axios.get('/api/sostituzioni/orario-classe', {
        params: {
          classe,
          data: data.toISOString()
        }
      });
      
      setOrarioClasse(response.data.data || {});
    } catch (err) {
      console.error('Errore nel recupero dell\'orario della classe:', err);
      if (err.response && err.response.status === 401) {
        setError('Sessione scaduta. Effettua nuovamente l\'accesso.');
      } else {
        setError('Impossibile caricare l\'orario della classe. Riprova più tardi.');
      }
    }
  };

  const assegnaSostituto = async (docenteSostitutoId) => {
    if (!selectedAssenza || !docenteSostitutoId) return;
    
    try {
      await axios.post('/api/sostituzioni', {
        assenza: selectedAssenza.assenzaId,
        docente: selectedAssenza.docente.id,
        docenteSostituto: docenteSostitutoId,
        data: selectedAssenza.data,
        ora: parseInt(selectedAssenza.ora),
        classe: selectedAssenza.classe,
        materia: selectedAssenza.materia._id
      });
      
      // Aggiorna la lista delle assenze
      fetchAssenzeDaCoprire();
      // Pulisci la selezione
      setSelectedAssenza(null);
    } catch (err) {
      console.error('Errore nell\'assegnazione del sostituto:', err);
      if (err.response && err.response.status === 401) {
        setError('Sessione scaduta. Effettua nuovamente l\'accesso.');
      } else {
        setError('Impossibile assegnare il sostituto. Riprova più tardi.');
      }
    }
  };

  // Carica le assenze all'avvio
  useEffect(() => {
    fetchAssenzeDaCoprire();
  }, []);

  // Carica i sostituti e l'orario quando viene selezionata un'assenza
  useEffect(() => {
    if (selectedAssenza) {
      fetchDocentiDisponibili(selectedAssenza);
      fetchOrarioClasse(selectedAssenza.classe, selectedAssenza.data);
    }
  }, [selectedAssenza]);

  const handleSelectAssenza = (assenza) => {
    setSelectedAssenza(assenza);
  };

  const handleAssegnaSostituto = (docenteId) => {
    assegnaSostituto(docenteId);
  };

  // Utility per convertire i giorni della settimana
  const convertGiorno = (giorno) => {
    const map = { 'Lun': 'Lunedì', 'Mar': 'Martedì', 'Mer': 'Mercoledì', 'Gio': 'Giovedì', 'Ven': 'Venerdì', 'Sab': 'Sabato' };
    return map[giorno] || giorno;
  };

  const convertGiornoToApi = (giorno) => {
    const map = { 'Lunedì': 'Lun', 'Martedì': 'Mar', 'Mercoledì': 'Mer', 'Giovedì': 'Gio', 'Venerdì': 'Ven', 'Sabato': 'Sab' };
    return map[giorno] || giorno;
  };

  const giorni = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì'];
  const ore = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Finché non ci sono dati o in caso di errore, visualizza lo stato corrispondente
  if (loading) {
    return <div className={styles.loading}>Caricamento...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  // Se non ci sono assenze da coprire
  if (assenze.length === 0) {
    return <div className={styles.noAssenze}>Non ci sono assenze da coprire in questo momento.</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.columnLayout}>
        {/* Colonna sinistra - Elenco Assenze */}
        <div className={styles.leftColumn}>
          <h2>Elenco Assenze</h2>
          <div className={styles.assenzeList}>
            {assenze.map((assenza) => (
              <div 
                key={assenza.id} 
                className={`${styles.assenzaCard} ${selectedAssenza?.id === assenza.id ? styles.selected : ''}`}
                onClick={() => handleSelectAssenza(assenza)}
              >
                <h3>{assenza.docente.nome}</h3>
                <div className={styles.dettagliAssenza}>
                  <p><strong>Classe:</strong> {assenza.classe}</p>
                  <p><strong>Giorno:</strong> {assenza.giorno}</p>
                  <p><strong>Ora:</strong> {assenza.ora}</p>
                  <p><strong>Materia:</strong> {assenza.materia.descrizione}</p>
                  <p><strong>Data:</strong> {assenza.data.toLocaleDateString()}</p>
                </div>
                <button 
                  className={styles.dettaglioButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAssenza(assenza);
                  }}
                >
                  Visualizza Dettaglio
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Colonna destra - Dettaglio Sostituzione */}
        <div className={styles.rightColumn}>
          {selectedAssenza ? (
            <>
              <div className={styles.dettaglioHeader}>
                <h2>Dettaglio Sostituzione</h2>
                <h3>
                  {selectedAssenza.docente.nome} - {selectedAssenza.classe} - {selectedAssenza.giorno} {selectedAssenza.ora}ª ora
                </h3>
                <p>Data: {selectedAssenza.data.toLocaleDateString()}</p>
              </div>
              
              <div className={styles.sostitutiSection}>
                <h3>Docenti Disponibili</h3>
                {sostituti.length > 0 ? (
                  <div className={styles.sostitutiList}>
                    {sostituti.map((sostituto) => (
                      <div key={sostituto.id} className={styles.sostitutoCard}>
                        <div className={styles.sostitutoInfo}>
                          <p className={styles.sostitutoNome}>{sostituto.nome} {sostituto.cognome}</p>
                          <p className={`${styles.sostitutoStato} ${
                            sostituto.stato === 'Disponibile' ? styles.disponibile : styles.occupato
                          }`}>
                            {sostituto.stato}
                          </p>
                        </div>
                        <button 
                          className={styles.assegnaButton}
                          disabled={sostituto.stato !== 'Disponibile'}
                          onClick={() => handleAssegnaSostituto(sostituto.id)}
                        >
                          Assegna
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.noResults}>Nessun docente disponibile per questa sostituzione</p>
                )}
              </div>

              <div className={styles.orarioSection}>
                <h3>Orario della Classe {selectedAssenza.classe}</h3>
                <div className={styles.orarioTable}>
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        {giorni.map((giorno) => (
                          <th key={giorno} className={giorno === selectedAssenza.giorno ? styles.giornoEvidenziato : ''}>
                            {giorno}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ore.map((ora) => (
                        <tr key={ora}>
                          <td className={styles.oraCell}>{ora}ª</td>
                          {giorni.map((giorno) => {
                            const giornoFormat = convertGiornoToApi(giorno);
                            const lezione = orarioClasse[giornoFormat]?.find(l => l.ora.toString() === ora);
                            let cellClass = '';
                            
                            if (lezione) {
                              if (lezione.tipo === 'compresenza') {
                                cellClass = styles.compresenza;
                              } else if (lezione.tipo === 'vuota') {
                                cellClass = styles.vuota;
                              } else if (lezione.tipo === 'assenza') {
                                cellClass = styles.assenza;
                              } else if (lezione.tipo === 'sostituzione') {
                                cellClass = styles.sostituzione;
                              }
                            } else {
                              cellClass = styles.vuota;
                            }

                            // Evidenzia la cella dell'assenza selezionata
                            if (giorno === selectedAssenza.giorno && ora === selectedAssenza.ora) {
                              cellClass = `${cellClass} ${styles.selected}`;
                            }
                            
                            return (
                              <td key={`${giorno}-${ora}`} className={cellClass}>
                                {lezione ? (
                                  <>
                                    <div className={styles.materia}>{lezione.materia}</div>
                                    <div className={styles.docente}>{lezione.docente}</div>
                                    {lezione.sostituto && <div className={styles.sostituto}>Sost: {lezione.sostituto}</div>}
                                  </>
                                ) : ''}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>Seleziona un'assenza per visualizzare i dettagli</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestioneSostituzioni; 