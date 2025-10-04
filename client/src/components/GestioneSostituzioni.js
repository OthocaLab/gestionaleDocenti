import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { getOrarioByClasse, getAllClassi } from '../services/orarioService';
import styles from '../styles/GestioneSostituzioni.module.css';

const GestioneSostituzioni = () => {
  const router = useRouter();
  const { token } = useContext(AuthContext);
  const [assenze, setAssenze] = useState([]);
  const [sostituti, setSostituti] = useState([]);
  const [orarioClasse, setOrarioClasse] = useState({});
  const [selectedAssenza, setSelectedAssenza] = useState(null);
  const [classiDisponibili, setClassiDisponibili] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const handleClosePopup = () => {
    setShouldRedirect(true);
    setShowErrorPopup(false);
  };

  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/dashboard');
    }
  }, [shouldRedirect, router]);

  // Funzioni per le chiamate API
  const fetchAssenzeDaCoprire = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/sostituzioni/assenze-da-coprire').catch(err => {
        if (err.response?.status === 403) {
          throw { status: 403, message: err.response.data.message };
        }
        throw err;
      });
      
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
        setShowErrorPopup(false);
      } else {
        setAssenze([]);
        setError('Dati non validi ricevuti dal server');
      }
    } catch (err) {
      if (err.status === 403) {
        setErrorMessage(err.message || 'Il ruolo docente non è autorizzato ad accedere a questa risorsa');
        setShowErrorPopup(true);
        return;
      }
      setError('Impossibile caricare le assenze. Riprova più tardi.');
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

  const fetchOrarioClasse = async (nomeClasse, data) => {
    console.log('🔍 DEBUG: fetchOrarioClasse chiamata con:', { nomeClasse, data });
    console.log('🔍 DEBUG: classiDisponibili.length:', classiDisponibili.length);
    
    if (!nomeClasse || nomeClasse === 'N/D') {
      console.log('❌ DEBUG: Classe non valida, imposto orario vuoto');
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
            tipo: 'vuota',
            coloreMateria: undefined
          });
        }
      }
      
      setOrarioClasse(orarioVuoto);
      return;
    }
    
    // Aspetta che le classi siano caricate se non lo sono ancora
    if (classiDisponibili.length === 0) {
      console.log('⏳ DEBUG: Le classi non sono ancora caricate, riprovo tra 500ms...');
      setTimeout(() => fetchOrarioClasse(nomeClasse, data), 500);
      return;
    }
    
    try {
      console.log('🔍 DEBUG: Cerco classe con nome:', nomeClasse);
      console.log('🔍 DEBUG: Classi disponibili:', classiDisponibili.map(c => ({ 
        nome: c.nome, 
        descrizione: c.descrizione, 
        anno: c.anno, 
        sezione: c.sezione,
        _id: c._id
      })));
      
      // Trova l'ID della classe dal nome - prova diversi campi
      let classe = classiDisponibili.find(c => 
        c.nome === nomeClasse || 
        c.descrizione === nomeClasse ||
        `${c.anno}${c.sezione}` === nomeClasse ||
        c.codice === nomeClasse
      );
      
      console.log('🔍 DEBUG: Prima ricerca - classe trovata:', classe);
      
      // Se non trovata, prova con una ricerca più flessibile
      if (!classe) {
        classe = classiDisponibili.find(c => 
          c.nome?.includes(nomeClasse) || 
          c.descrizione?.includes(nomeClasse) ||
          nomeClasse.includes(c.nome) ||
          nomeClasse.includes(c.descrizione)
        );
        console.log('🔍 DEBUG: Seconda ricerca flessibile - classe trovata:', classe);
      }
      
      if (!classe) {
        console.log('❌ DEBUG: Classe non trovata, uso API sostituzioni come fallback');
        // Fallback: usa l'API originale delle sostituzioni
        const response = await axios.get('/api/sostituzioni/orario-classe', {
          params: {
            classe: nomeClasse,
            data: data.toISOString()
          }
        });
        
        console.log('🔍 DEBUG: Risposta API sostituzioni:', response.data);
        setOrarioClasse(response.data.data || {});
        return;
      }
      
      console.log('✅ DEBUG: Classe trovata:', classe);
      console.log('🔍 DEBUG: Chiamo getOrarioByClasse con ID:', classe._id);
      
      // Usa il servizio orario per recuperare i dati
      const response = await getOrarioByClasse(classe._id);
      const orarioArray = response.data || [];
      
      console.log('🔍 DEBUG: Dati orario ricevuti:', orarioArray);
      console.log('🔍 DEBUG: Tipo dati ricevuti:', Array.isArray(orarioArray) ? 'Array' : typeof orarioArray);
      
      // Converti dal formato array al formato object che si aspetta la visualizzazione
      const orarioFormatted = {};
      const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
      
      console.log('🔄 DEBUG: Inizio conversione dati orario');
      
      // Inizializza la struttura vuota
      for (const giorno of giorni) {
        orarioFormatted[giorno] = [];
        for (let ora = 1; ora <= 8; ora++) {
          orarioFormatted[giorno].push({
            ora: ora,
            materia: '',
            docente: '',
            aula: '',
            tipo: 'vuota',
            coloreMateria: undefined
          });
        }
      }
      
      console.log('🔍 DEBUG: Struttura iniziale creata:', orarioFormatted);
      
      // Popola con i dati reali
      orarioArray.forEach((lezione, index) => {
        console.log(`🔍 DEBUG: Processo lezione ${index}:`, lezione);
        
        const giorno = lezione.giornoSettimana;
        const ora = lezione.ora;
        
        console.log(`🔍 DEBUG: giorno: ${giorno}, ora: ${ora}`);
        
        if (orarioFormatted[giorno] && orarioFormatted[giorno][ora - 1]) {
          const lezioneData = {
            ora: ora,
            materia: lezione.materia?.descrizione || '',
            docente: `${lezione.docente?.nome || ''} ${lezione.docente?.cognome || ''}`.trim(),
            aula: lezione.aula || '',
            tipo: 'normale',
            coloreMateria: lezione.materia?.coloreMateria
          };
          
          console.log(`🔍 DEBUG: Inserisco lezione in ${giorno}[${ora - 1}]:`, lezioneData);
          
          orarioFormatted[giorno][ora - 1] = lezioneData;
        } else {
          console.log(`❌ DEBUG: Impossibile inserire lezione - giorno o ora non validi`);
        }
      });
      
      console.log('✅ DEBUG: Orario finale formattato:', orarioFormatted);
      setOrarioClasse(orarioFormatted);
    } catch (err) {
      console.error('Errore nel recupero dell\'orario della classe:', err);
      
      // Fallback: usa l'API originale delle sostituzioni in caso di errore
      try {
        const response = await axios.get('/api/sostituzioni/orario-classe', {
          params: {
            classe: nomeClasse,
            data: data.toISOString()
          }
        });
        
        setOrarioClasse(response.data.data || {});
      } catch (fallbackErr) {
        console.error('Anche il fallback è fallito:', fallbackErr);
        if (err.response && err.response.status === 401) {
          setError('Sessione scaduta. Effettua nuovamente l\'accesso.');
        } else {
          setError('Impossibile caricare l\'orario della classe. Riprova più tardi.');
        }
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
    fetchClassiDisponibili();
  }, []);
  
  // Funzione per caricare le classi disponibili
  const fetchClassiDisponibili = async () => {
    try {
      console.log('🔄 DEBUG: Inizio caricamento classi...');
      const response = await getAllClassi();
      const classi = response.data || [];
      console.log('✅ DEBUG: Classi caricate con successo:', classi);
      setClassiDisponibili(classi);
    } catch (err) {
      console.error('❌ DEBUG: Errore nel caricamento delle classi:', err);
      setClassiDisponibili([]); // Assicurati che sia sempre un array
    }
  };

  // Carica i sostituti e l'orario quando viene selezionata un'assenza
  useEffect(() => {
    if (selectedAssenza) {
      console.log('🔄 DEBUG: useEffect attivato per assenza selezionata:', selectedAssenza);
      fetchDocentiDisponibili(selectedAssenza);
      fetchOrarioClasse(selectedAssenza.classe, selectedAssenza.data);
    }
  }, [selectedAssenza]);

  // Debug useEffect per monitorare i cambiamenti degli stati
  useEffect(() => {
    console.log('Stato del popup:', { showErrorPopup, errorMessage });
  }, [showErrorPopup, errorMessage]);

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

  // Renderizza prima il popup, poi il resto del contenuto
  if (showErrorPopup) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          maxWidth: '400px',
          width: '90%',
          textAlign: 'center',
        }}>
          <h3 style={{ 
            color: '#dc3545', 
            marginBottom: '15px',
            fontSize: '1.5em',
            fontWeight: '600'
          }}>
            Errore di Autorizzazione
          </h3>
          <p style={{ 
            margin: '15px 0', 
            fontSize: '1.1em',
            color: '#333',
            lineHeight: '1.4'
          }}>
            {errorMessage}
          </p>
          <button 
            onClick={handleClosePopup}
            style={{
              marginTop: '20px',
              padding: '12px 30px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1em',
              fontWeight: '500',
              transition: 'background-color 0.2s'
            }}
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  // Loading state - mostra spinner mentre i dati si stanno caricando
  if (loading || assenze.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Caricamento assenze da coprire...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Resto del contenuto del componente */}
      <div className={styles.columnLayout}>
        {/* Colonna sinistra - Elenco Assenze */}
        <div className={styles.leftColumn}>
          <h2>Elenco Assenze</h2>
          <div className={styles.assenzeList}>
            {Array.isArray(assenze) && assenze.map((assenza, index) => (
              <div 
                key={`assenza-${assenza.id || assenza.assenzaId || index}-${assenza.docente?.id || 'unknown'}-${index}`} 
                className={`${styles.assenzaCard} ${selectedAssenza?.id === assenza.id ? styles.selected : ''}`}
                onClick={() => handleSelectAssenza(assenza)}
              >
                <h3>{assenza.docente?.nome || 'N/D'}</h3>
                <div className={styles.dettagliAssenza}>
                  <p><strong>Classe:</strong> {assenza.classe || 'N/D'}</p>
                  <p><strong>Giorno:</strong> {assenza.giorno || 'N/D'}</p>
                  <p><strong>Ora:</strong> {assenza.ora || 'N/D'}</p>
                  <p><strong>Materia:</strong> {assenza.materia?.descrizione || 'N/D'}</p>
                  <p><strong>Data:</strong> {assenza.data ? assenza.data.toLocaleDateString() : 'N/D'}</p>
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
                  {selectedAssenza.docente?.nome || 'N/D'} - {selectedAssenza.classe || 'N/D'} - {selectedAssenza.giorno || 'N/D'} {selectedAssenza.ora || 'N/D'}ª ora
                </h3>
                <p>Data: {selectedAssenza.data ? selectedAssenza.data.toLocaleDateString() : 'N/D'}</p>
              </div>
              
              <div className={styles.sostitutiSection}>
                <h3>Docenti Disponibili</h3>
                {Array.isArray(sostituti) && sostituti.length > 0 ? (
                  <div className={styles.sostitutiList}>
                    {sostituti.map((sostituto, index) => (
                      <div key={`sostituto-${sostituto.id || index}-${sostituto.nome}-${sostituto.cognome}-${index}`} className={styles.sostitutoCard}>
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
                <h3>Orario della Classe {selectedAssenza.classe || 'N/D'}</h3>
                <div className={styles.orarioTable}>
                  <table>
                    <thead>
                      <tr>
                        <th></th>
                        {Array.isArray(giorni) && giorni.map((giorno, index) => (
                          <th key={`header-${giorno}-${index}`} className={giorno === selectedAssenza.giorno ? styles.giornoEvidenziato : ''}>
                            {giorno}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(ore) && ore.map((ora, oraIndex) => (
                        <tr key={`orario-row-${ora}-${oraIndex}`}>
                          <td className={styles.oraCell}>{ora}ª</td>
                          {Array.isArray(giorni) && giorni.map((giorno, giornoIndex) => {
                            const giornoFormat = convertGiornoToApi(giorno);
                            // Accesso diretto all'array usando l'indice (ora - 1)
                            const lezione = orarioClasse[giornoFormat]?.[ora - 1];
                            let cellClass = '';
                            
                            if (lezione && lezione.tipo !== 'vuota') {
                              if (lezione.tipo === 'compresenza') {
                                cellClass = styles.compresenza;
                              } else if (lezione.tipo === 'normale') {
                                cellClass = styles.normale;
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
                              <td 
                                key={`orario-cell-${giorno}-${ora}-${giornoIndex}-${oraIndex}`} 
                                className={cellClass}
                                style={{ 
                                  backgroundColor: lezione && lezione.coloreMateria && lezione.tipo !== 'vuota' 
                                    ? lezione.coloreMateria 
                                    : undefined 
                                }}
                              >
                                {lezione && lezione.tipo !== 'vuota' ? (
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