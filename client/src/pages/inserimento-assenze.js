import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/Inserimento.module.css';
import ProtectedRoute from '../components/ProtectedRoute';

const InserimentoAssenze = () => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
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
  
  // Verifica se l'utente ha i permessi necessari
  const hasPermission = () => {
    if (!user) return false;
    return ['admin', 'vicepresidenza', 'ufficioPersonale'].includes(user.ruolo);
  };
  
  // Reindirizza se l'utente non ha i permessi
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermission()) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);
  
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
        documentazione
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
  
  // Se l'utente non è autenticato o sta caricando, non mostrare nulla
  if (isLoading || !isAuthenticated) {
    return null;
  }
  
  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <h1 className={styles.title}>Registrazione Assenze</h1>
        
        {message.text && (
          <div className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}>
            {message.text}
          </div>
        )}
        
        <div className={styles.form}>
          <div className={styles.formSection}>
            <h2 className={styles.sectionTitle}>Ricerca Docente</h2>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Cerca docente (nome, cognome, email o codice fiscale)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className={styles.input}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Inizia a digitare (minimo 3 caratteri)..."
                />
                
                {isSearching && (
                  <div style={{ position: 'absolute', right: '10px', top: '10px' }}>
                    Ricerca in corso...
                  </div>
                )}
                
                {searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '0 0 4px 4px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {searchResults.map((docente) => (
                      <div
                        key={docente._id}
                        style={{
                          padding: '10px',
                          borderBottom: '1px solid #eee',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleSelectDocente(docente)}
                      >
                        {docente.nome} {docente.cognome} - {docente.email}
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
                <h2 className={styles.sectionTitle}>Dati Assenza</h2>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Data Inizio</label>
                    <input
                      type="date"
                      className={styles.input}
                      value={dataInizio}
                      onChange={(e) => setDataInizio(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Data Fine</label>
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
                    <label className={styles.label}>Tipo Assenza</label>
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
                    <label className={styles.label}>Giustificata</label>
                    <div style={{ marginTop: '10px' }}>
                      <input
                        type="checkbox"
                        id="giustificata"
                        checked={giustificata}
                        onChange={(e) => setGiustificata(e.target.checked)}
                        style={{ marginRight: '8px' }}
                      />
                      <label htmlFor="giustificata">L'assenza è giustificata</label>
                    </div>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Documentazione (URL)</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={documentazione}
                    onChange={(e) => setDocumentazione(e.target.value)}
                    placeholder="URL del documento o certificato..."
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Note</label>
                  <textarea
                    className={styles.textarea}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Inserisci eventuali note..."
                  />
                </div>
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => router.push('/dashboard')}
                >
                  Annulla
                </button>
                
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registrazione in corso...' : 'Registra Assenza'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InserimentoAssenze;