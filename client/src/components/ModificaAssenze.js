import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/Inserimento.module.css';

const ModificaAssenze = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const { id } = router.query;
  
  // Stati per il form
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [tipoAssenza, setTipoAssenza] = useState('');
  const [note, setNote] = useState('');
  const [giustificata, setGiustificata] = useState(false);
  const [documentazione, setDocumentazione] = useState('');
  // Stati per gli orari
  const [orarioSpecifico, setOrarioSpecifico] = useState(false);
  const [orarioEntrata, setOrarioEntrata] = useState('');
  const [orarioUscita, setOrarioUscita] = useState('');
  
  // Stati per gestire loading e messaggi
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dateError, setDateError] = useState('');
  
  // Carica i dati dell'assenza
  useEffect(() => {
    if (isAuthenticated && id) {
      fetchAssenza();
    }
  }, [isAuthenticated, id]);
  
  const fetchAssenza = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assenze/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const assenza = response.data.data;
      
      // Formatta le date per l'input date
      const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
      };
      
      setSelectedDocente(assenza.docente);
      setDataInizio(formatDateForInput(assenza.dataInizio));
      setDataFine(formatDateForInput(assenza.dataFine));
      setTipoAssenza(assenza.tipoAssenza);
      setNote(assenza.note || '');
      setGiustificata(assenza.giustificata);
      setDocumentazione(assenza.documentazione || '');
      
      // Imposta i campi per gli orari specifici
      setOrarioSpecifico(assenza.orarioSpecifico || false);
      setOrarioEntrata(assenza.orarioEntrata || '');
      setOrarioUscita(assenza.orarioUscita || '');
      
    } catch (err) {
      console.error('Errore nel recupero dell\'assenza:', err);
      setMessage({
        type: 'error',
        text: 'Impossibile caricare i dati dell\'assenza. Riprova più tardi.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Funzione per validare le date
  const validateDates = (inizio, fine) => {
    if (inizio && fine) {
      const dataInizioDate = new Date(inizio);
      const dataFineDate = new Date(fine);
      
      if (dataFineDate < dataInizioDate) {
        setDateError('La data di fine non può essere precedente alla data di inizio');
        return false;
      }
    }
    setDateError('');
    return true;
  };
  
  // Gestori per i cambiamenti delle date
  const handleDataInizioChange = (e) => {
    const newDataInizio = e.target.value;
    setDataInizio(newDataInizio);
    validateDates(newDataInizio, dataFine);
  };
  
  const handleDataFineChange = (e) => {
    const newDataFine = e.target.value;
    setDataFine(newDataFine);
    validateDates(dataInizio, newDataFine);
  };
  
  // Funzione per inviare il form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione delle date
    if (!validateDates(dataInizio, dataFine)) {
      setMessage({ type: 'error', text: 'Controlla le date inserite' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      const assenzaData = {
        dataInizio,
        dataFine,
        tipoAssenza,
        note,
        giustificata,
        documentazione,
        // Aggiungiamo i campi per gli orari specifici
        orarioSpecifico,
        orarioEntrata: orarioSpecifico ? orarioEntrata : null,
        orarioUscita: orarioSpecifico ? orarioUscita : null
      };
      
      const response = await axios.put(`/api/assenze/${id}`, assenzaData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage({
        type: 'success',
        text: 'Assenza aggiornata con successo'
      });
      
      // Dopo qualche secondo, torniamo alla lista delle assenze
      setTimeout(() => {
        router.push('/dashboard?tab=assenze');
      }, 2000);
      
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'assenza:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Errore nell\'aggiornamento dell\'assenza'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) {
    return <div className={styles.loadingContainer}>Caricamento in corso...</div>;
  }
  
  return (
    <div className={styles.componentContainer}>
      <div className={styles.headerActions}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/dashboard?tab=assenze')}
        >
          <span className={styles.backIcon}>←</span> Torna all'elenco
        </button>
        <h1 className={styles.title}>Modifica Assenza</h1>
      </div>
      
      {message.text && (
        <div className={`${styles.messageBox} ${message.type === 'success' ? styles.successMessage : styles.errorMessage}`}>
          <span className={styles.messageIcon}>
            {message.type === 'success' ? '✓' : '⚠'}
          </span>
          {message.text}
        </div>
      )}
      
      <div className={styles.cardContainer}>
        <div className={styles.formCard}>
          <form onSubmit={handleSubmit}>
            {selectedDocente && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>👤</span>
                  Docente
                </h2>
                
                <div className={styles.selectedDocenteCard}>
                  <div className={styles.docenteAvatarLarge}>
                    {selectedDocente.nome.charAt(0)}{selectedDocente.cognome.charAt(0)}
                  </div>
                  <div className={styles.selectedDocenteInfo}>
                    <h3>{selectedDocente.nome} {selectedDocente.cognome}</h3>
                    <p>{selectedDocente.email}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📝</span>
                Dati Assenza
              </h2>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelIcon}>📅</span>
                    Data Inizio
                  </label>
                  <input
                    type="date"
                    className={styles.input}
                    value={dataInizio}
                    onChange={handleDataInizioChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelIcon}>📅</span>
                    Data Fine
                  </label>
                  <input
                    type="date"
                    className={`${styles.input} ${dateError ? styles.inputError : ''}`}
                    value={dataFine}
                    onChange={handleDataFineChange}
                    required
                  />
                  {dateError && (
                    <div className={styles.dateError}>
                      <span className={styles.errorIcon}>⚠</span>
                      {dateError}
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelIcon}>🏷️</span>
                    Tipo Assenza
                  </label>
                  <select
                    className={styles.select}
                    value={tipoAssenza}
                    onChange={(e) => setTipoAssenza(e.target.value)}
                    required
                  >
                    <option value="">Seleziona tipo...</option>
                    <option value="malattia">Malattia</option>
                    <option value="permesso">Permesso</option>
                    <option value="ferie">Ferie</option>
                    <option value="fuoriclasse">Fuoriclasse</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <span className={styles.labelIcon}>✓</span>
                    Giustificata
                  </label>
                  <div className={styles.checkboxContainer}>
                    <input
                      type="checkbox"
                      id="giustificata"
                      className={styles.checkbox}
                      checked={giustificata}
                      onChange={(e) => setGiustificata(e.target.checked)}
                    />
                    <label htmlFor="giustificata" className={styles.checkboxLabel}>
                      L'assenza è giustificata
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Sezione per orari specifici */}
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.labelIcon}>🕒</span>
                  Orario Specifico
                </label>
                <div className={styles.checkboxContainer}>
                  <input
                    type="checkbox"
                    id="orarioSpecifico"
                    className={styles.checkbox}
                    checked={orarioSpecifico}
                    onChange={(e) => setOrarioSpecifico(e.target.checked)}
                  />
                  <label htmlFor="orarioSpecifico" className={styles.checkboxLabel}>
                    Specifica orari di entrata/uscita
                  </label>
                </div>
              </div>
              
              {orarioSpecifico && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}>⏰</span>
                      Orario Entrata
                    </label>
                    <input
                      type="time"
                      className={styles.input}
                      value={orarioEntrata}
                      onChange={(e) => setOrarioEntrata(e.target.value)}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      <span className={styles.labelIcon}>⏰</span>
                      Orario Uscita
                    </label>
                    <input
                      type="time"
                      className={styles.input}
                      value={orarioUscita}
                      onChange={(e) => setOrarioUscita(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.labelIcon}>📎</span>
                  Documentazione (URL)
                </label>
                <input
                  type="text"
                  className={styles.input}
                  value={documentazione}
                  onChange={(e) => setDocumentazione(e.target.value)}
                  placeholder="URL del documento o certificato..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  <span className={styles.labelIcon}>📝</span>
                  Note
                </label>
                <textarea
                  className={styles.textarea}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Inserisci eventuali note..."
                  rows={4}
                />
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => router.push('/dashboard?tab=assenze')}
              >
                <span className={styles.buttonIcon}>✕</span>
                Annulla
              </button>
              
              <button
                type="submit"
                className={styles.submitButton}
                disabled={isSubmitting || dateError}
              >
                <span className={styles.buttonIcon}>{isSubmitting ? '⏳' : '✓'}</span>
                {isSubmitting ? 'Aggiornamento in corso...' : 'Aggiorna Assenza'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ModificaAssenze; 