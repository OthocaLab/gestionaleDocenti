import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/ElencoPianificazioneSostituzioni.module.css';

const ElencoPianificazioneSostituzioni = () => {
  const [sostituzioni, setSostituzioni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [view, setView] = useState('calendar'); // 'calendar' o 'list'
  const [filtroDocente, setFiltroDocente] = useState('');
  const [filtroClasse, setFiltroClasse] = useState('');
  
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
      });
      
      if (response.data && response.data.data) {
        // Formatta le sostituzioni per la visualizzazione
        const formattedSostituzioni = response.data.data.map(sostituzione => ({
          id: sostituzione._id,
          docente: sostituzione.docente.nome + ' ' + sostituzione.docente.cognome,
          docenteSostituto: sostituzione.docenteSostituto.nome + ' ' + sostituzione.docenteSostituto.cognome,
          data: new Date(sostituzione.data),
          ora: sostituzione.ora,
          materia: sostituzione.materia?.descrizione || 'N/D',
          classe: sostituzione.classe || 'N/D'
        }));
        
        setSostituzioni(formattedSostituzioni);
      } else {
        setSostituzioni([]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Errore nel recupero delle sostituzioni:', err);
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
          </div>
        ))}
      </div>
    );
  };
  
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
    </div>
  );
};

export default ElencoPianificazioneSostituzioni; 