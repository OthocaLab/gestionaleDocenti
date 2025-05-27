import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/Inserimento.module.css';

const InserimentoAssenze = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  
  // Stati per il form
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [tipoAssenza, setTipoAssenza] = useState('');
  const [note, setNote] = useState('');
  const [giustificata, setGiustificata] = useState(false);
  const [documentazione, setDocumentazione] = useState('');
  // Nuovi stati per gli orari
  const [orarioSpecifico, setOrarioSpecifico] = useState(false);
  const [orarioEntrata, setOrarioEntrata] = useState('');
  const [orarioUscita, setOrarioUscita] = useState('');
  
  // Stati per gestire loading e messaggi
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dateError, setDateError] = useState('');
  
  // Funzione per la ricerca dei docenti con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery.length >= 3) {
        searchDocenti();
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);
  
  // Funzione per cercare i docenti
  const searchDocenti = async () => {
    if (searchQuery.length < 3) return;
    
    setIsSearching(true);
    try {
      const response = await axios.get(`/api/assenze/autocomplete?query=${searchQuery}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Errore nella ricerca dei docenti:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Errore nella ricerca dei docenti'
      });
    } finally {
      setIsSearching(false);
    }
  };
  
  // Funzione per selezionare un docente
  const handleSelectDocente = (docente) => {
    setSelectedDocente(docente);
    setSearchQuery(`${docente.nome} ${docente.cognome}`);
    setSearchResults([]);
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
    
    if (!selectedDocente) {
      setMessage({ type: 'error', text: 'Seleziona un docente' });
      return;
    }
    
    // Validazione delle date
    if (!validateDates(dataInizio, dataFine)) {
      setMessage({ type: 'error', text: 'Controlla le date inserite' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });
    
    try {
      const assenzaData = {
        docente: selectedDocente._id,
        dataInizio,
        dataFine,
        tipoAssenza,
        note,
        giustificata,
        documentazione,
        registrataDa: user._id, // Aggiungiamo l'utente che registra l'assenza
        // Aggiungiamo i nuovi campi
        orarioSpecifico,
        orarioEntrata: orarioSpecifico ? orarioEntrata : null,
        orarioUscita: orarioSpecifico ? orarioUscita : null
      };
      
      const response = await axios.post('/api/assenze', assenzaData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setMessage({
        type: 'success',
        text: 'Assenza registrata con successo'
      });
      
      // Reset del form
      setSelectedDocente(null);
      setSearchQuery('');
      setDataInizio('');
      setDataFine('');
      setTipoAssenza('');
      setNote('');
      setGiustificata(false);
      setDocumentazione('');
      setOrarioSpecifico(false);
      setOrarioEntrata('');
      setOrarioUscita('');
      
    } catch (error) {
      console.error('Errore nella registrazione dell\'assenza:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Errore nella registrazione dell\'assenza'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={styles.componentContainer}>
      <div className={styles.headerActions}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/dashboard?tab=assenze')}
        >
          <span className={styles.backIcon}>←</span> Torna all'elenco
        </button>
        <h1 className={styles.title}>Registrazione Assenze</h1>
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
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>🔍</span>
              Ricerca Docente
            </h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Cerca docente (nome, cognome, email o codice fiscale)</label>
              <div className={styles.searchContainer}>
                <input
                  type="text"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Inizia a digitare (minimo 3 caratteri)..."
                />
                <span className={styles.searchIcon}>🔍</span>
                
                {isSearching && (
                  <div className={styles.searchingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Ricerca...</span>
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {searchResults.map((docente) => (
                      <div
                        key={docente._id}
                        className={styles.searchResultItem}
                        onClick={() => handleSelectDocente(docente)}
                      >
                        <div className={styles.docenteAvatar}>
                          {docente.nome.charAt(0)}{docente.cognome.charAt(0)}
                        </div>
                        <div className={styles.docenteInfo}>
                          <div className={styles.docenteName}>{docente.nome} {docente.cognome}</div>
                          <div className={styles.docenteEmail}>{docente.email}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {selectedDocente && (
            <form onSubmit={handleSubmit}>
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>📝</span>
                  Dati Assenza
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
                
                {/* Nuova sezione per orari specifici */}
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
                  {isSubmitting ? 'Registrazione in corso...' : 'Registra Assenza'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InserimentoAssenze;