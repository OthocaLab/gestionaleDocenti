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
  
  // Stati per gestire loading e messaggi
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
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
  
  // Funzione per inviare il form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDocente) {
      setMessage({ type: 'error', text: 'Seleziona un docente' });
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
        registrataDa: user._id // Aggiungiamo l'utente che registra l'assenza
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
                      onChange={(e) => setDataInizio(e.target.value)}
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
                      className={styles.input}
                      value={dataFine}
                      onChange={(e) => setDataFine(e.target.value)}
                      required
                    />
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
                  disabled={isSubmitting}
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