import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/CalendarioAssenze.module.css';

const CalendarioAssenze = ({ onDateSelect }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [docentiAssenti, setDocentiAssenti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Carica i docenti assenti quando la data selezionata cambia
  useEffect(() => {
    fetchDocentiAssenti(selectedDate);
    // Passa la data selezionata al componente genitore
    if (onDateSelect) {
      onDateSelect(selectedDate);
    }
  }, [selectedDate]);

  const fetchDocentiAssenti = async (date) => {
    setLoading(true);
    try {
      // Formatta la data nel formato ISO senza orario
      const formattedDate = date.toISOString().split('T')[0];
      
      const response = await axios.get(`/api/assenze/docenti-per-data`, {
        params: { data: formattedDate },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setDocentiAssenti(response.data.data || []);
      setError('');
    } catch (err) {
      console.error('Errore nel recupero dei docenti assenti:', err);
      setError('Impossibile caricare i docenti assenti. Riprova più tardi.');
      setDocentiAssenti([]);
    } finally {
      setLoading(false);
    }
  };

  // Calcola i giorni nel mese corrente
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  // Cambia mese
  const changeMonth = (delta) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + delta);
    setCurrentMonth(newMonth);
  };

  // Formatta la data in formato italiano
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'Data non valida';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Formatta il mese in italiano
  const formatMonth = (date) => {
    const mesi = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 
                 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
    return `${mesi[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Renderizza il calendario
  const renderCalendar = () => {
    const dayNames = ['lu', 'ma', 'me', 'gi', 've', 'sa', 'do'];
    const daysInMonth = getDaysInMonth();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    // Ottieni il giorno della settimana del primo giorno del mese (0 = domenica, 1 = lunedì, ecc.)
    let firstDayIndex = firstDayOfMonth.getDay();
    // Converti da formato DOM (0=domenica) a formato italiano (0=lunedì)
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    return (
      <div className={styles.calendar}>
        <div className={styles.calendarHeader}>
          {dayNames.map(day => (
            <div key={day} className={styles.dayName}>{day}</div>
          ))}
        </div>
        <div className={styles.calendarBody}>
          {/* Celle vuote per allineare correttamente i giorni */}
          {Array(firstDayIndex).fill(null).map((_, index) => (
            <div key={`empty-${index}`} className={styles.emptyDay}></div>
          ))}
          
          {/* Giorni del mese */}
          {daysInMonth.map(day => {
            const isSelected = selectedDate && 
              selectedDate.getDate() === day.getDate() && 
              selectedDate.getMonth() === day.getMonth() && 
              selectedDate.getFullYear() === day.getFullYear();
            
            // Verifica se il giorno è oggi
            const isToday = new Date().toDateString() === day.toDateString();
            
            return (
              <div 
                key={day.toString()} 
                className={`${styles.calendarDay} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Renderizza la tabella dei docenti assenti
  const renderTabellaDocentiAssenti = () => {
    if (loading) {
      return <div className={styles.loading}>Caricamento...</div>;
    }
    
    if (error) {
      return <div className={styles.error}>{error}</div>;
    }
    
    if (docentiAssenti.length === 0) {
      return (
        <div className={styles.noResults}>
          Nessun docente assente per il {formatDate(selectedDate)}
        </div>
      );
    }
    
    return (
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Cognome</th>
              <th>Classe</th>
              <th>Materia</th>
              <th>E-mail</th>
              <th>Motivo assenza</th>
            </tr>
          </thead>
          <tbody>
            {docentiAssenti.map((docente) => (
              <tr key={docente._id}>
                <td>{docente.nome}</td>
                <td>{docente.cognome}</td>
                <td>{docente.classe}</td>
                <td>{docente.materia}</td>
                <td>{docente.email}</td>
                <td>{docente.motivoAssenza}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className={styles.calendarioContainer}>
      <div className={styles.calendarSection}>
        <div className={styles.monthSelector}>
          <button onClick={() => changeMonth(-1)} className={styles.monthButton}>&lt;</button>
          <h2 className={styles.monthTitle}>{formatMonth(currentMonth)}</h2>
          <button onClick={() => changeMonth(1)} className={styles.monthButton}>&gt;</button>
        </div>
        {renderCalendar()}
        <div className={styles.calendarActions}>
          <button
            className={styles.todayButton}
            onClick={() => setSelectedDate(new Date())}
          >
            Oggi
          </button>
          <button
            className={styles.cancelButton}
            onClick={() => setSelectedDate(new Date())}
          >
            Cancella
          </button>
        </div>
      </div>
      
      <div className={styles.assentiSection}>
        <h2>Docenti assenti il {formatDate(selectedDate)}</h2>
        {renderTabellaDocentiAssenti()}
      </div>
    </div>
  );
};

export default CalendarioAssenze; 