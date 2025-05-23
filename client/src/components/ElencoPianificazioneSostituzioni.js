import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import styles from '../styles/ElencoPianificazioneSostituzioni.module.css';

const ElencoPianificazioneSostituzioni = () => {
  const router = useRouter();
  const [sostituzioni, setSostituzioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('calendar'); // 'calendar' o 'list'
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroClasse, setFiltroClasse] = useState('');
  // Nuovi stati per la modifica della sostituzione
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sostituzioneInModifica, setSostituzioneInModifica] = useState(null);
  const [docentiDisponibili, setDocentiDisponibili] = useState([]);
  const [docenteSostitutoSelezionato, setDocenteSostitutoSelezionato] = useState('');
  const [modificaInCorso, setModificaInCorso] = useState(false);
  const [messaggioModifica, setMessaggioModifica] = useState({ testo: '', tipo: '' });
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

  // Funzione per recuperare tutte le sostituzioni
  const fetchSostituzioni = async () => {
    try {
      setLoading(true);
      
      // Calcola l'inizio e la fine del mese corrente
      const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const response = await axios.get('/api/sostituzioni', {
        params: {
          dataInizio: start.toISOString(),
          dataFine: end.toISOString()
        }
      }).catch(err => {
        if (err.response?.status === 403) {
          throw { status: 403, message: err.response.data.message };
        }
        throw err;
      });
      
      if (response.data && response.data.data) {
        // Formatta le sostituzioni per la visualizzazione
        const formattedSostituzioni = response.data.data.map(sostituzione => ({
          id: sostituzione._id,
          docente: sostituzione.docente.nome + ' ' + sostituzione.docente.cognome,
          docenteSostituto: sostituzione.docenteSostituto.nome + ' ' + sostituzione.docenteSostituto.cognome,
          docenteSostitutoId: sostituzione.docenteSostituto._id,
          docenteId: sostituzione.docente._id,
          data: new Date(sostituzione.data),
          ora: sostituzione.ora,
          materia: sostituzione.materia?.descrizione || 'N/D',
          materiaId: sostituzione.materia?._id || '',
          classe: sostituzione.classe || 'N/D'
        }));
        
        setSostituzioni(formattedSostituzioni);
        setError(null);
        setShowErrorPopup(false);
      } else {
        setSostituzioni([]);
      }
    } catch (err) {
      if (err.status === 403) {
        setErrorMessage(err.message || 'Il ruolo docente non è autorizzato ad accedere a questa risorsa');
        setShowErrorPopup(true);
        return;
      }
      setError('Impossibile caricare le sostituzioni. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carica le sostituzioni all'avvio e quando cambia il mese
  useEffect(() => {
    fetchSostituzioni();
  }, [currentMonth]);
  
  // Funzione per cambiare mese
  const changeMonth = (increment) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + increment);
    setCurrentMonth(newMonth);
  };
  
  // Ottieni i giorni del mese corrente
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = [];
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      daysInMonth.push(new Date(year, month, day));
    }
    
    return daysInMonth;
  };
  
  // Funzione per ottenere le sostituzioni per una data specifica
  const getSostituzioniPerData = (date) => {
    return sostituzioni.filter(sostituzione => 
      sostituzione.data.getDate() === date.getDate() && 
      sostituzione.data.getMonth() === date.getMonth() && 
      sostituzione.data.getFullYear() === date.getFullYear()
    );
  };
  
  // Funzioni di filtro
  const filtraSostituzioni = (sostituzioni) => {
    return sostituzioni.filter(sostituzione => {
      const matchDocente = filtroDocente === '' || 
        sostituzione.docente.toLowerCase().includes(filtroDocente.toLowerCase()) ||
        sostituzione.docenteSostituto.toLowerCase().includes(filtroDocente.toLowerCase());
      
      const matchClasse = filtroClasse === '' || 
        sostituzione.classe.toLowerCase().includes(filtroClasse.toLowerCase());
      
      return matchDocente && matchClasse;
    });
  };
  
  // Formatta la data in modo leggibile
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'Data non valida';
    
    // Formatta come dd/mm/yyyy
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  // Formatta il mese in modo leggibile
  const formatMonth = (date) => {
    const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 
                 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    return `${mesi[date.getMonth()]} ${date.getFullYear()}`;
  };
  
  // Funzione per aprire il modal e caricare i docenti disponibili
  const handleModificaSostituzione = async (sostituzione) => {
    setSostituzioneInModifica(sostituzione);
    setDocenteSostitutoSelezionato(sostituzione.docenteSostitutoId);
    setIsModalOpen(true);
    
    try {
      // Converti il giorno della settimana
      const giornoSettimana = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][sostituzione.data.getDay()];
      const giornoApi = { 'Lunedì': 'Lun', 'Martedì': 'Mar', 'Mercoledì': 'Mer', 'Giovedì': 'Gio', 'Venerdì': 'Ven', 'Sabato': 'Sab' }[giornoSettimana] || 'Lun';
      
      const response = await axios.get('/api/sostituzioni/docenti-disponibili', {
        params: {
          data: sostituzione.data.toISOString(),
          ora: sostituzione.ora,
          giorno: giornoApi
        }
      });
      
      // Aggiungi il docente attuale all'elenco, se non è già presente
      let docentiList = response.data.data || [];
      
      // Verifica se il docente sostituto attuale è già nella lista
      const docenteAttualePresente = docentiList.some(d => d.id === sostituzione.docenteSostitutoId);
      
      if (!docenteAttualePresente) {
        // Splitta il nome e cognome del docente
        const nomeCompleto = sostituzione.docenteSostituto.split(' ');
        const cognome = nomeCompleto.pop();
        const nome = nomeCompleto.join(' ');
        
        docentiList.unshift({
          id: sostituzione.docenteSostitutoId,
          nome: nome,
          cognome: cognome,
          stato: 'Attuale sostituto'
        });
      }
      
      setDocentiDisponibili(docentiList);
    } catch (err) {
      console.error('Errore nel recupero dei docenti disponibili:', err);
      setMessaggioModifica({
        testo: 'Impossibile caricare i docenti disponibili. Riprova più tardi.',
        tipo: 'errore'
      });
    }
  };
  
  // Funzione per salvare la modifica
  const salvaSostituzione = async () => {
    if (!sostituzioneInModifica || !docenteSostitutoSelezionato) return;
    
    setModificaInCorso(true);
    setMessaggioModifica({ testo: '', tipo: '' });
    
    try {
      await axios.put(`/api/sostituzioni/${sostituzioneInModifica.id}`, {
        docenteSostituto: docenteSostitutoSelezionato
      });
      
      setMessaggioModifica({
        testo: 'Sostituzione aggiornata con successo!',
        tipo: 'successo'
      });
      
      // Aggiorna la lista delle sostituzioni
      await fetchSostituzioni();
      
      // Chiudi il modal dopo 1 secondo
      setTimeout(() => {
        setIsModalOpen(false);
        setSostituzioneInModifica(null);
        setDocenteSostitutoSelezionato('');
        setMessaggioModifica({ testo: '', tipo: '' });
      }, 1000);
    } catch (err) {
      console.error('Errore nell\'aggiornamento della sostituzione:', err);
      setMessaggioModifica({
        testo: 'Impossibile aggiornare la sostituzione. Riprova più tardi.',
        tipo: 'errore'
      });
    } finally {
      setModificaInCorso(false);
    }
  };
  
  // Renderizza il calendario
  const renderCalendar = () => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const daysInMonth = getDaysInMonth();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const prefixDays = firstDayOfMonth.getDay(); // 0 = Domenica, 1 = Lunedì, ecc.
    
    return (
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          {dayNames.map(day => (
            <div key={day} className={styles.dayName}>{day}</div>
          ))}
        </div>
        <div className={styles.calendarBody}>
          {/* Celle vuote per allineare correttamente i giorni */}
          {Array(prefixDays).fill(null).map((_, index) => (
            <div key={`empty-${index}`} className={styles.emptyDay}></div>
          ))}
          
          {/* Giorni del mese */}
          {daysInMonth.map(day => {
            const sostituzioniDelGiorno = getSostituzioniPerData(day);
            const isSelected = selectedDate && 
              selectedDate.getDate() === day.getDate() && 
              selectedDate.getMonth() === day.getMonth() && 
              selectedDate.getFullYear() === day.getFullYear();
            
            return (
              <div 
                key={day.toString()} 
                className={`${styles.calendarDay} ${sostituzioniDelGiorno.length > 0 ? styles.hasSostituzioni : ''} ${isSelected ? styles.selected : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={styles.dayNumber}>{day.getDate()}</div>
                {sostituzioniDelGiorno.length > 0 && (
                  <div className={styles.sostituzioniCount}>{sostituzioniDelGiorno.length}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Renderizza l'elenco delle sostituzioni
  const renderSostituzioniList = () => {
    let sostituzioniDaVisualizzare = [];
    
    if (view === 'calendar' && selectedDate) {
      // Se siamo in vista calendario e una data è selezionata, mostriamo le sostituzioni di quel giorno
      sostituzioniDaVisualizzare = getSostituzioniPerData(selectedDate);
    } else {
      // Altrimenti mostriamo tutte le sostituzioni del mese
      sostituzioniDaVisualizzare = sostituzioni;
    }
    
    // Applica i filtri
    sostituzioniDaVisualizzare = filtraSostituzioni(sostituzioniDaVisualizzare);
    
    // Ordinamento per data e ora
    sostituzioniDaVisualizzare.sort((a, b) => {
      const dateComparison = a.data - b.data;
      if (dateComparison !== 0) return dateComparison;
      return a.ora - b.ora;
    });
    
    if (sostituzioniDaVisualizzare.length === 0) {
      return (
        <div className={styles.noResults}>
          {selectedDate ? `Nessuna sostituzione per il ${formatDate(selectedDate)}` : 'Nessuna sostituzione trovata'}
        </div>
      );
    }
    
    return (
      <div className={styles.sostituzioniList}>
        {sostituzioniDaVisualizzare.map(sostituzione => (
          <div key={sostituzione.id} className={styles.sostituzioneCard}>
            <div className={styles.sostituzioneHeader}>
              <div className={styles.sostituzioneData}>
                {formatDate(sostituzione.data)}
              </div>
              <div className={styles.sostituzioneOra}>{sostituzione.ora}ª ora</div>
            </div>
            <div className={styles.sostituzioneBody}>
              <div><strong>Docente assente:</strong> {sostituzione.docente}</div>
              <div><strong>Sostituto:</strong> {sostituzione.docenteSostituto}</div>
              <div><strong>Classe:</strong> {sostituzione.classe}</div>
              <div><strong>Materia:</strong> {sostituzione.materia}</div>
            </div>
            <div className={styles.sostituzioneFooter}>
              <button 
                className={styles.modificaButton}
                onClick={() => handleModificaSostituzione(sostituzione)}
              >
                Modifica Sostituto
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizza il modale per la modifica del sostituto
  const renderModalModifica = () => {
    if (!isModalOpen || !sostituzioneInModifica) return null;

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h3>Modifica Sostituzione</h3>
            <button 
              className={styles.closeButton}
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.modalInfo}>
              <p><strong>Data:</strong> {formatDate(sostituzioneInModifica.data)}</p>
              <p><strong>Ora:</strong> {sostituzioneInModifica.ora}ª ora</p>
              <p><strong>Docente assente:</strong> {sostituzioneInModifica.docente}</p>
              <p><strong>Classe:</strong> {sostituzioneInModifica.classe}</p>
              <p><strong>Materia:</strong> {sostituzioneInModifica.materia}</p>
            </div>
            
            <div className={styles.modalForm}>
              <label htmlFor="docenteSostituto">Seleziona il nuovo sostituto:</label>
              <select 
                id="docenteSostituto"
                value={docenteSostitutoSelezionato}
                onChange={(e) => setDocenteSostitutoSelezionato(e.target.value)}
                className={styles.select}
              >
                <option value="">Seleziona un docente...</option>
                {docentiDisponibili.map(docente => (
                  <option key={docente.id} value={docente.id}>
                    {docente.nome} {docente.cognome} {docente.stato ? `(${docente.stato})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            {messaggioModifica.testo && (
              <div className={`${styles.modalMessage} ${styles[messaggioModifica.tipo]}`}>
                {messaggioModifica.testo}
              </div>
            )}
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelButton}
              onClick={() => setIsModalOpen(false)}
              disabled={modificaInCorso}
            >
              Annulla
            </button>
            <button 
              className={styles.saveButton}
              onClick={salvaSostituzione}
              disabled={!docenteSostitutoSelezionato || modificaInCorso}
            >
              {modificaInCorso ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
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
  
  if (loading) {
    return <div className={styles.loading}>Caricamento...</div>;
  }
  
  if (error) {
    return <div className={styles.error}>{error}</div>;
  }
  
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pianificazione Sostituzioni</h1>
      
      <div className={styles.controls}>
        <div className={styles.viewToggle}>
          <button 
            className={view === 'calendar' ? styles.active : ''}
            onClick={() => setView('calendar')}
          >
            Vista Calendario
          </button>
          <button 
            className={view === 'list' ? styles.active : ''}
            onClick={() => {
              setView('list');
              setSelectedDate(null);
            }}
          >
            Vista Elenco
          </button>
        </div>
        
        <div className={styles.monthSelector}>
          <button onClick={() => changeMonth(-1)}>&lt;</button>
          <h2>{formatMonth(currentMonth)}</h2>
          <button onClick={() => changeMonth(1)}>&gt;</button>
        </div>
        
        <div className={styles.filters}>
          <input
            type="text"
            placeholder="Filtra per docente"
            value={filtroDocente}
            onChange={(e) => setFiltroDocente(e.target.value)}
            className={styles.filterInput}
          />
          <input
            type="text"
            placeholder="Filtra per classe"
            value={filtroClasse}
            onChange={(e) => setFiltroClasse(e.target.value)}
            className={styles.filterInput}
          />
        </div>
      </div>
      
      <div className={styles.content}>
        {view === 'calendar' && (
          <div className={styles.calendarView}>
            {renderCalendar()}
            
            {selectedDate && (
              <div className={styles.sostituzioniPerGiorno}>
                <h3>Sostituzioni per il {formatDate(selectedDate)}</h3>
                {renderSostituzioniList()}
              </div>
            )}
          </div>
        )}
        
        {view === 'list' && (
          <div className={styles.listView}>
            <h3>Elenco completo sostituzioni</h3>
            {renderSostituzioniList()}
          </div>
        )}
      </div>
      
      {renderModalModifica()}
    </div>
  );
};

export default ElencoPianificazioneSostituzioni; 