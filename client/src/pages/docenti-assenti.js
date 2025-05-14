import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/DocentiAssenti.module.css';
import ProtectedRoute from '../components/ProtectedRoute';

const DocentiAssenti = () => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();
  
  const [docentiAssenti, setDocentiAssenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Verifica se l'utente ha i permessi necessari
  const hasPermission = () => {
    if (!user) return false;
    return ['admin', 'vicepresidenza', 'ufficioPersonale', 'docente'].includes(user.ruolo);
  };
  
  // Reindirizza se l'utente non ha i permessi
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermission()) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);
  
  // Carica le assenze per la data selezionata
  useEffect(() => {
    if (isAuthenticated && hasPermission() && selectedDate) {
      fetchDocentiAssenti(selectedDate);
    }
  }, [isAuthenticated, selectedDate]);
  
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
    
    // Se cambiamo mese, selezioniamo il primo giorno del nuovo mese
    const firstDayOfMonth = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
    setSelectedDate(firstDayOfMonth);
  };
  
  // Formatta la data in formato italiano
  const formatDate = (date) => {
    if (!date || !(date instanceof Date) || isNaN(date)) return 'Data non valida';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  // Formatta il mese in italiano
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
    const prefixDays = firstDayOfMonth.getDay();
    
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
                <div className={styles.dayNumber}>{day.getDate()}</div>
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
  
  // Se l'utente non è autenticato o sta caricando, non mostrare nulla
  if (isLoading || !isAuthenticated) {
    return null;
  }
  
  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Elenco Docenti Assenti</h1>
          <div className={styles.tabs}>
            <div className={`${styles.tab} ${styles.activeTab}`}>Elenco docenti presenti</div>
            <div className={styles.tab} onClick={() => router.push('/elenco-docenti-assenti')}>Elenco docenti assenti</div>
            <div className={styles.tab} onClick={() => router.push('/materia')}>Materia</div>
          </div>
        </div>
        
        <div className={styles.content}>
          <div className={styles.calendarContainer}>
            <div className={styles.monthSelector}>
              <button onClick={() => changeMonth(-1)} className={styles.monthButton}>&lt;</button>
              <h2>{formatMonth(currentMonth)}</h2>
              <button onClick={() => changeMonth(1)} className={styles.monthButton}>&gt;</button>
            </div>
            
            {renderCalendar()}
          </div>
          
          <div className={styles.docentiAssentiContainer}>
            <h2>Docenti assenti il {formatDate(selectedDate)}</h2>
            {renderTabellaDocentiAssenti()}
          </div>
        </div>
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionButton}
            onClick={() => router.push('/dashboard')}
          >
            Torna alla Dashboard
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DocentiAssenti; 