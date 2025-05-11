import { useState, useEffect } from 'react';
import { getAllClassi, getOrarioByClasse, createClasse } from '../services/orarioService';
import styles from '../styles/Orario.module.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

  // Ottieni i dettagli della classe selezionata
  const classeSelezionata = classi.find(c => c._id === selectedClasse);

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
    
    // Prepara il contenuto HTML per la stampa
    printWindow.document.write(`
      <html>
        <head>
          <title>Orario Classe ${classeSelezionata?.anno || ''} ${classeSelezionata?.sezione || ''}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px;
              color: #333;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px; 
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            h2 {
              color: #2c3e50;
              margin-bottom: 10px;
            }
            .info { 
              display: flex; 
              justify-content: space-between; 
              margin-bottom: 15px; 
              background-color: #f8f9fa;
              padding: 10px;
              border-radius: 5px;
            }
            .info-item { 
              margin-right: 20px; 
            }
            .info-label { 
              font-weight: bold; 
              color: #3498db;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin-top: 20px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            th { 
              background-color: #3498db; 
              color: white;
              padding: 12px 8px;
              text-align: center;
              font-weight: bold;
            }
            td { 
              border: 1px solid #ddd; 
              padding: 10px 8px; 
              text-align: center; 
              vertical-align: middle;
            }
            .ora-cell {
              background-color: #f2f2f2;
              font-weight: bold;
              width: 80px;
            }
            .ora-num {
              font-size: 16px;
              margin-bottom: 5px;
            }
            .ora-range {
              font-size: 12px;
              color: #666;
            }
            .lezione {
              padding: 5px;
              border-radius: 4px;
              min-height: 60px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .materia {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .docente {
              font-size: 12px;
            }
            .aula {
              font-size: 11px;
              font-style: italic;
              margin-top: 3px;
            }
            @media print {
              body { 
                -webkit-print-color-adjust: exact; 
                color-adjust: exact; 
                print-color-adjust: exact;
              }
              .no-print {
                display: none;
              }
              @page {
                size: landscape;
                margin: 0;
                margin-top: 0;
                margin-bottom: 0;
              }
              @page :first {
                margin-top: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Orario Scolastico</h2>
            <div class="info">
              <div class="info-item">
                <span class="info-label">Classe:</span> ${classeSelezionata?.anno || ''} ${classeSelezionata?.sezione || ''}
              </div>
              <div class="info-item">
                <span class="info-label">Aula:</span> ${classeSelezionata?.aula || ''}
              </div>
              <div class="info-item">
                <span class="info-label">Indirizzo:</span> ${classeSelezionata?.indirizzo || ''}
              </div>
              <div class="info-item">
                <span class="info-label">Coordinatore:</span> Docente 1
              </div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th></th>
                ${giorni.map(giorno => `<th>${giorno}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${ore.map(ora => `
                <tr>
                  <td class="ora-cell">
                    <div class="ora-num">${ora.num}ª</div>
                    <div class="ora-range">${ora.inizio}-${ora.fine}</div>
                  </td>
                  ${giorni.map(giorno => {
                    const lezione = getLezione(giorno, ora.num);
                    const bgColor = lezione ? getColorMateria(lezione) : 'transparent';
                    const textColor = lezione ? getTextColor(bgColor) : '#000';
                    
                    return `
                      <td style="background-color: ${bgColor}; color: ${textColor}">
                        ${lezione ? `
                          <div class="lezione">
                            <div class="materia">${lezione.materia?.nome || lezione.materia?.codice || ''}</div>
                            <div class="docente">${lezione.docente?.nome || 'Docente non specificato'}</div>
                            <div class="aula">Aula: ${lezione.aula || classeSelezionata?.aula || ''}</div>
                          </div>
                        ` : ''}
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="no-print" style="margin-top: 20px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Stampa
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; background-color: #e74c3c; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
              Chiudi
            </button>
          </div>
        </body>
      </html>
    `);
    
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
      const pdf = new jsPDF({
        orientation: 'landscape', // Orizzontale per adattarsi meglio alla tabella
        unit: 'mm',
        format: 'a4'
      });
      
      // Aggiungi intestazione
      pdf.setFontSize(16);
      pdf.text(`Orario Classe ${classeSelezionata?.anno || ''} ${classeSelezionata?.sezione || ''}`, 14, 15);
      
      pdf.setFontSize(10);
      pdf.text(`Aula: ${classeSelezionata?.aula || ''}`, 14, 22);
      pdf.text(`Indirizzo: ${classeSelezionata?.indirizzo || ''}`, 14, 27);
      pdf.text(`Data: ${new Date().toLocaleDateString('it-IT')}`, 14, 32);
      
      // Calcola le dimensioni per adattare l'immagine alla pagina
      const imgWidth = 270; // Larghezza in mm (A4 landscape = 297mm)
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Aggiungi l'immagine della tabella
      pdf.addImage(imgData, 'PNG', 14, 40, imgWidth, imgHeight);
      
      // Salva il PDF
      pdf.save(`Orario_${classeSelezionata?.anno || ''}${classeSelezionata?.sezione || ''}_${new Date().toISOString().slice(0, 10)}.pdf`);
      
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
            <div className={styles.statValue}>5</div>
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
              <button className={styles.filterButton}>Docenti</button>
              <button className={`${styles.filterButton} ${styles.activeFilter}`}>Classe</button>
              <button className={styles.filterButton}>Aule</button>
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
              <div className={styles.headerActions}>
                <button 
                  className={styles.actionButton} 
                  title="Stampa orario"
                  onClick={handlePrintOrario}
                >
                  🖨️
                </button>
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
                      const lezione = getLezione(giorno, ora.num);
                      return (
                        <td 
                          key={`${giorno}-${ora.num}`}
                          className={`${styles.lezioneCell} ${lezione ? styles.hasLezione : styles.emptyLezione}`}
                          style={{ backgroundColor: lezione?.materia?.coloreMateria || 'transparent' }}
                        >
                          {lezione ? (
                            <div className={styles.lezione}>
                              <div className={styles.materiaText}>{lezione.materia?.descrizione || 'Materia non specificata'}</div>
                              <div className={styles.docenteText}>
                                {lezione.docente ? `${lezione.docente.nome || ''} ${lezione.docente.cognome || ''}` : 'Docente non specificato'}
                              </div>
                              <div className={styles.aulaText}>
                                {lezione.aula ? `Aula: ${lezione.aula}` : 'Aula: N/D'}
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
        )}
      </div>
    </div>
  );
};

export default GestioneOrario;
