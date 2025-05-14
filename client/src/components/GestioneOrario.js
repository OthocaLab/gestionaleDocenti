import { useState, useEffect } from 'react';
import { getAllClassi, getOrarioByClasse, createClasse, getOrarioByDocente } from '../services/orarioService';
import { getAllDocenti } from '../services/docenteService';
import styles from '../styles/Orario.module.css';
import html2canvas from 'html2canvas';
import jspdf from 'jspdf';

const GestioneOrario = () => {
  const [classi, setClassi] = useState([]);
  const [docenti, setDocenti] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedDocente, setSelectedDocente] = useState('');
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
  const [visualizzazione, setVisualizzazione] = useState('classe'); // 'classe' o 'docente'

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
    fetchDocenti();
  }, []);

  useEffect(() => {
    if (visualizzazione === 'classe' && classi.length > 0 && !selectedClasse) {
      setSelectedClasse(classi[0]._id);
      fetchOrario(classi[0]._id, 'classe');
    } else if (visualizzazione === 'docente' && docenti.length > 0 && !selectedDocente) {
      setSelectedDocente(docenti[0]._id);
      fetchOrario(docenti[0]._id, 'docente');
    }
  }, [classi, docenti, visualizzazione]);

  const fetchClassi = async () => {
    try {
      setLoading(true);
      const response = await getAllClassi();
      // Ordina le classi prima per anno e poi per sezione
      const classiOrdinate = [...response.data].sort((a, b) => {
        // Prima ordina per anno
        if (parseInt(a.anno) !== parseInt(b.anno)) {
          return parseInt(a.anno) - parseInt(b.anno);
        }
        // Poi per sezione (A, B, C, ecc.)
        return a.sezione.localeCompare(b.sezione);
      });
      setClassi(classiOrdinate);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento delle classi');
      setLoading(false);
    }
  };

  const fetchDocenti = async () => {
    try {
      setLoading(true);
      const response = await getAllDocenti();
      // Ordina i docenti per cognome
      const docentiOrdinati = [...response.data].sort((a, b) => 
        a.cognome.localeCompare(b.cognome)
      );
      setDocenti(docentiOrdinati);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento dei docenti');
      setLoading(false);
    }
  };

  const fetchOrario = async (id, tipo) => {
    try {
      setLoading(true);
      let response;
      
      if (tipo === 'classe') {
        response = await getOrarioByClasse(id);
      } else if (tipo === 'docente') {
        response = await getOrarioByDocente(id);
      }
      
      setOrario(response.data);
      setLoading(false);
    } catch (err) {
      setError(`Errore nel caricamento dell'orario`);
      setLoading(false);
    }
  };

  const handleClasseChange = async (e) => {
    const classeId = e.target.value;
    setSelectedClasse(classeId);
    
    if (classeId) {
      fetchOrario(classeId, 'classe');
    } else {
      setOrario([]);
    }
  };

  const handleDocenteChange = async (e) => {
    const docenteId = e.target.value;
    setSelectedDocente(docenteId);
    
    if (docenteId) {
      fetchOrario(docenteId, 'docente');
    } else {
      setOrario([]);
    }
  };

  const handleFilterButtonClick = (tipo) => {
    setVisualizzazione(tipo);
    setOrario([]);
    
    if (tipo === 'classe' && classi.length > 0) {
      setSelectedClasse(classi[0]._id);
      fetchOrario(classi[0]._id, 'classe');
    } else if (tipo === 'docente' && docenti.length > 0) {
      setSelectedDocente(docenti[0]._id);
      fetchOrario(docenti[0]._id, 'docente');
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

  const getLezioni = (giorno, ora) => {
    return orario.filter(
      (lezione) => lezione.giornoSettimana === giorno && lezione.ora === ora
    );
  };

  // Funzione per determinare il colore del testo in base al colore di sfondo
  const getTextColor = (backgroundColor) => {
    if (!backgroundColor || backgroundColor === 'transparent') return '#000';
    
    // Converte il colore esadecimale in RGB
    const r = parseInt(backgroundColor.slice(1, 3), 16);
    const g = parseInt(backgroundColor.slice(3, 5), 16);
    const b = parseInt(backgroundColor.slice(5, 7), 16);
    
    // Calcola la luminosità (formula approssimativa)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Restituisce bianco per colori scuri, nero per colori chiari
    return luminance > 0.5 ? '#000' : '#fff';
  };

  // Ottieni i dettagli della classe o docente selezionati
  const classeSelezionata = classi.find(c => c._id === selectedClasse);
  const docenteSelezionato = docenti.find(d => d._id === selectedDocente);

  // Funzione per ottenere il colore della materia
  const getColorMateria = (lezione) => {
    if (!lezione || !lezione.materia) return 'transparent';
    
    // Usa il colore dalla materia se disponibile
    if (lezione.materia.coloreMateria) return lezione.materia.coloreMateria;
    
    // Altrimenti usa il colore dalla mappa in base al codice
    const codiceMateria = lezione.materia.codice || '';
    return coloriMaterie[codiceMateria] || '#cccccc';
  };

  // Funzione per stampare l'orario
  const handlePrintOrario = () => {
    const orarioElement = document.querySelector(`.${styles.orarioTableWrapper}`);
    
    if (!orarioElement) {
      setError('Impossibile trovare l\'elemento da stampare');
      return;
    }
    
    // Crea una copia dell'elemento per la stampa
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      setError('Il popup è stato bloccato. Abilita i popup per stampare l\'orario.');
      return;
    }
    
    
    // Aggiungi un piccolo ritardo per assicurarsi che il contenuto sia caricato
    setTimeout(() => {
      printWindow.document.close();
      printWindow.focus();
    }, 500);
  };

  // Funzione per esportare l'orario in PDF
  const handleExportPDF = () => {
    const orarioElement = document.querySelector(`.${styles.orarioTable}`);
    
    if (!orarioElement) {
      setError('Impossibile trovare l\'elemento da esportare');
      return;
    }
    
    setLoading(true);
    
    // Usa html2canvas per catturare l'elemento come immagine
    html2canvas(orarioElement, {
      scale: 2, // Migliora la qualità
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      
      // Crea un nuovo documento PDF
      const pdf = new jspdf({
        orientation: 'landscape', // Orizzontale per adattarsi meglio alla tabella
        unit: 'mm',
        format: 'a4'
      });
      
      // Aggiungi intestazione in base alla visualizzazione
      pdf.setFontSize(16);
      if (visualizzazione === 'classe') {
        pdf.text(`Orario Classe ${classeSelezionata?.anno || ''} ${classeSelezionata?.sezione || ''}`, 14, 15);
        pdf.setFontSize(10);
        pdf.text(`Aula: ${classeSelezionata?.aula || ''}`, 14, 22);
        pdf.text(`Indirizzo: ${classeSelezionata?.indirizzo || ''}`, 14, 27);
      } else {
        pdf.text(`Orario Docente ${docenteSelezionato?.cognome || ''} ${docenteSelezionato?.nome || ''}`, 14, 15);
        pdf.setFontSize(10);
        pdf.text(`Materia: ${docenteSelezionato?.materia || ''}`, 14, 22);
      }
      
      pdf.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 14, 32);
      
      // Calcola le dimensioni per adattare l'immagine alla pagina
      const imgWidth = 270; // Larghezza in mm (A4 landscape = 297mm)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Aggiungi l'immagine della tabella
      pdf.addImage(imgData, 'PNG', 14, 40, imgWidth, imgHeight);
      
      // Salva il PDF con nome appropriato
      if (visualizzazione === 'classe') {
        pdf.save(`Orario_${classeSelezionata?.anno || ''}${classeSelezionata?.sezione || ''}_${new Date().toISOString().slice(0, 10)}.pdf`);
      } else {
        pdf.save(`Orario_${docenteSelezionato?.cognome || ''}_${docenteSelezionato?.nome || ''}_${new Date().toISOString().slice(0, 10)}.pdf`);
      }
      
      setLoading(false);
      setSuccess('PDF esportato con successo!');
      
      // Nascondi il messaggio di successo dopo 3 secondi
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    }).catch(err => {
      setLoading(false);
      setError('Errore durante l\'esportazione del PDF: ' + err.message);
    });
  };

  return (
    <div className={styles.orarioContainer}>
      {/* Header con titolo e breadcrumb */}
      <div className={styles.pageHeader}>
        <h2 className={styles.pageTitle}>Gestione Orario Scolastico</h2>
        <div className={styles.breadcrumb}>
          <span>Dashboard</span> / <span className={styles.activePage}>Gestione Orario</span>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIcon}>👨‍🏫</div>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Presenze Del Giorno</div>
            <div className={styles.statValue}>42</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIcon}>📚</div>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Classi Totali</div>
            <div className={styles.statValue}>{classi.length || 0}</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIcon}>📋</div>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Presenze Attive</div>
            <div className={styles.statValue}>38</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIcon}>👥</div>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statLabel}>Personale Disponibile</div>
            <div className={styles.statValue}>{docenti.length || 0}</div>
          </div>
        </div>
      </div>

      <div className={styles.docentiPanel}>
        <div className={styles.docentiHeader}>
          <h3 className={styles.panelTitle}>Lista Orari</h3>
          <div className={styles.searchFilters}>
            <div className={styles.searchBox}>
              <div className={styles.searchIcon}>🔍</div>
              <input 
                type="text" 
                placeholder="Cerca in base a Indirizzo, Classe..." 
                className={styles.searchInput}
              />
            </div>
            <div className={styles.filterButtons}>
              <button 
                className={`${styles.filterButton} ${visualizzazione === 'docente' ? styles.activeFilter : ''}`}
                onClick={() => handleFilterButtonClick('docente')}
              >
                Docenti
              </button>
              <button 
                className={`${styles.filterButton} ${visualizzazione === 'classe' ? styles.activeFilter : ''}`}
                onClick={() => handleFilterButtonClick('classe')}
              >
                Classe
              </button>
              <button className={styles.filterButton}>Aule</button>
            </div>
          </div>
        </div>

        <div className={styles.classeSelector}>
          <div className={styles.selectWithButton}>
            {visualizzazione === 'classe' ? (
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
            ) : (
              <select
                value={selectedDocente}
                onChange={handleDocenteChange}
                className={styles.select}
              >
                <option value="">-- Seleziona un docente --</option>
                {docenti.map((docente) => (
                  <option key={docente._id} value={docente._id}>
                    {docente.cognome} {docente.nome !== docente.cognome ? docente.nome : ''}
                  </option>
                ))}
              </select>
            )}
            {visualizzazione === 'classe' && (
              <button 
                className={styles.addButton}
                onClick={() => setShowClasseForm(!showClasseForm)}
              >
                {showClasseForm ? 'Annulla' : 'Nuova Classe'}
              </button>
            )}
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          {success && <div className={styles.successMessage}>{success}</div>}
          
          {showClasseForm && visualizzazione === 'classe' && (
            <div className={styles.formSection}>
              <h4 className={styles.formTitle}>Crea Nuova Classe</h4>
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
                      placeholder="Es. A, B, C..."
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
                    placeholder="Es. 101, Lab. Informatica..."
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
                    placeholder="Es. Informatica, Scientifico..."
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
                    placeholder="Es. 25"
                    min="1"
                  />
                </div>
                
                <div className={styles.formActions}>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={() => setShowClasseForm(false)}
                  >
                    Annulla
                  </button>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? 'Salvataggio...' : 'Salva Classe'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <div>Caricamento in corso...</div>
          </div>
        ) : (visualizzazione === 'classe' && selectedClasse) || (visualizzazione === 'docente' && selectedDocente) ? (
          <div className={styles.orarioTableWrapper}>
            <div className={styles.classeInfoHeader}>
              {visualizzazione === 'classe' ? (
                <>
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
                </>
              ) : (
                <>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Docente</div>
                    <div className={styles.infoValue}>
                      {docenteSelezionato?.cognome} {docenteSelezionato?.nome !== docenteSelezionato?.cognome ? docenteSelezionato?.nome : ''}
                    </div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Materia</div>
                    <div className={styles.infoValue}>{docenteSelezionato?.materia || 'Varie'}</div>
                  </div>
                  <div className={styles.infoItem}>
                    <div className={styles.infoLabel}>Email</div>
                    <div className={styles.infoValue}>{docenteSelezionato?.email || 'N/D'}</div>
                  </div>
                </>
              )}
              <div className={styles.headerActions}>
                <button 
                  className={styles.actionButton} 
                  title="Esporta PDF"
                  onClick={handleExportPDF}
                >
                  📄
                </button>
                <button className={styles.actionButton} title="Modifica orario">
                  ✏️
                </button>
              </div>
            </div>

            <table className={styles.orarioTable}>
              <thead>
                <tr>
                  <th className={styles.cornerHeader}></th>
                  {giorni.map(giorno => (
                    <th key={giorno} className={styles.giornoHeader}>{giorno}</th>
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
                      const lezioni = getLezioni(giorno, ora.num);
                      return (
                        <td 
                          key={`${giorno}-${ora.num}`}
                          className={`${styles.lezioneCell} ${lezioni.length > 0 ? styles.hasLezione : styles.emptyLezione}`}
                          style={{ backgroundColor: lezioni.length > 0 ? lezioni[0].materia?.coloreMateria || 'transparent' : 'transparent' }}
                        >
                          {lezioni.length > 0 ? (
                            <div className={styles.lezione}>
                              <div className={styles.materiaText}>
                                {lezioni[0].materia?.descrizione || 'Materia non specificata'}
                              </div>
                              {visualizzazione === 'classe' ? (
                                <div className={styles.docenteText}>
                                  {(() => {
                                    // Controlla se ci sono cognomi duplicati
                                    const cognomi = lezioni.map(l => l.docente?.cognome || '');
                                    const hasDuplicates = cognomi.some((cognome, idx) => 
                                      cognomi.indexOf(cognome) !== idx && cognome !== '');
                                    
                                    return lezioni.map((lezione, index) => (
                                      <span key={lezione.docente._id}>
                                        {index > 0 ? ', ' : ''}
                                        {lezione.docente?.cognome || 'N/D'}
                                        {hasDuplicates && lezione.docente?.nome ? 
                                          `.${lezione.docente.nome.charAt(0)}` : ''}
                                      </span>
                                    ));
                                  })()}
                                </div>
                              ) : (
                                <div className={styles.classeText}>
                                  {lezioni[0].classe ? `${lezioni[0].classe.anno}ª ${lezioni[0].classe.sezione}` : 'Classe N/D'}
                                </div>
                              )}
                              <div className={styles.aulaText}>
                                {lezioni[0].aula ? `Aula: ${lezioni[0].aula}` : 'Aula: N/D'}
                              </div>
                            </div>
                          ) : (
                            <div className={styles.emptyLezioneContent}>
                              <button className={styles.addLezioneButton} title="Aggiungi lezione">
                                +
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default GestioneOrario;
