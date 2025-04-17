import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/Inserimento.module.css';

const DettaglioAssenza = ({ assenzaId }) => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  
  const [assenza, setAssenza] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Carica i dettagli dell'assenza
  useEffect(() => {
    if (assenzaId && isAuthenticated) {
      fetchAssenza();
    }
  }, [assenzaId, isAuthenticated]);
  
  const fetchAssenza = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assenze/${assenzaId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setAssenza(response.data.data);
    } catch (err) {
      console.error('Errore nel recupero dei dettagli dell\'assenza:', err);
      setError('Impossibile caricare i dettagli dell\'assenza. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce l'aggiornamento dello stato di giustificazione
  const handleUpdateGiustificazione = async (giustificata) => {
    try {
      await axios.put(`/api/assenze/${assenzaId}`, 
        { giustificata }, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      setAssenza({ ...assenza, giustificata });
      setMessage({
        type: 'success',
        text: `Assenza ${giustificata ? 'giustificata' : 'non giustificata'} con successo`
      });
    } catch (err) {
      console.error('Errore nell\'aggiornamento dello stato di giustificazione:', err);
      setMessage({
        type: 'error',
        text: 'Impossibile aggiornare lo stato di giustificazione. Riprova più tardi.'
      });
    }
  };
  
  // Gestisce l'eliminazione dell'assenza
  const handleDelete = async () => {
    if (!confirm('Sei sicuro di voler eliminare questa assenza?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/assenze/${assenzaId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      router.push('/dashboard?tab=assenze');
    } catch (err) {
      console.error('Errore nell\'eliminazione dell\'assenza:', err);
      setMessage({
        type: 'error',
        text: 'Impossibile eliminare l\'assenza. Riprova più tardi.'
      });
    }
  };
  
  // Formatta la data
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
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
        <h1 className={styles.title}>Dettaglio Assenza</h1>
      </div>
      
      {message.text && (
        <div className={`${styles.messageBox} ${message.type === 'success' ? styles.successMessage : styles.errorMessage}`}>
          <span className={styles.messageIcon}>
            {message.type === 'success' ? '✓' : '⚠'}
          </span>
          {message.text}
        </div>
      )}
      
      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Caricamento dettagli in corso...</p>
        </div>
      ) : error ? (
        <div className={`${styles.messageBox} ${styles.errorMessage}`}>
          <span className={styles.messageIcon}>⚠</span>
          {error}
        </div>
      ) : !assenza ? (
        <div className={`${styles.messageBox} ${styles.errorMessage}`}>
          <span className={styles.messageIcon}>⚠</span>
          Assenza non trovata.
        </div>
      ) : (
        <div className={styles.cardContainer}>
          <div className={styles.formCard}>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>👤</span>
                Informazioni Docente
              </h2>
              
              <div className={styles.selectedDocenteCard}>
                <div className={styles.docenteAvatarLarge}>
                  {assenza.docente.nome.charAt(0)}{assenza.docente.cognome.charAt(0)}
                </div>
                <div className={styles.selectedDocenteInfo}>
                  <h3>{assenza.docente.nome} {assenza.docente.cognome}</h3>
                  <p>{assenza.docente.email}</p>
                  {assenza.docente.codiceFiscale && <p className={styles.codiceFiscale}>CF: {assenza.docente.codiceFiscale}</p>}
                </div>
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon}>📅</span>
                Dettagli Assenza
              </h2>
              
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Tipo Assenza</div>
                  <div className={styles.detailValue}>
                    <span className={`${styles.badge} ${styles[`badge${assenza.tipoAssenza.charAt(0).toUpperCase() + assenza.tipoAssenza.slice(1)}`]}`}>
                      {assenza.tipoAssenza.charAt(0).toUpperCase() + assenza.tipoAssenza.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Stato</div>
                  <div className={styles.detailValue}>
                    <span className={`${styles.badge} ${assenza.giustificata ? styles.badgeSuccess : styles.badgeWarning}`}>
                      {assenza.giustificata ? 'Giustificata' : 'Non giustificata'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Data Inizio</div>
                  <div className={styles.detailValue}>
                    <span className={styles.dateValue}>{formatDate(assenza.dataInizio)}</span>
                  </div>
                </div>
                
                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Data Fine</div>
                  <div className={styles.detailValue}>
                    <span className={styles.dateValue}>{formatDate(assenza.dataFine)}</span>
                  </div>
                </div>
              </div>
              
              {assenza.documentazione && (
                <div className={styles.documentazioneContainer}>
                  <h3 className={styles.subsectionTitle}>
                    <span className={styles.subsectionIcon}>📎</span>
                    Documentazione
                  </h3>
                  <a 
                    href={assenza.documentazione} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.documentLink}
                  >
                    <span className={styles.documentIcon}>📄</span>
                    Visualizza documentazione
                  </a>
                </div>
              )}
              
              {assenza.note && (
                <div className={styles.noteContainer}>
                  <h3 className={styles.subsectionTitle}>
                    <span className={styles.subsectionIcon}>📝</span>
                    Note
                  </h3>
                  <div className={styles.noteContent}>
                    {assenza.note}
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.formActions}>
              {!assenza.giustificata ? (
                <button 
                  className={styles.submitButton}
                  onClick={() => handleUpdateGiustificazione(true)}
                >
                  <span className={styles.buttonIcon}>✓</span>
                  Segna come Giustificata
                </button>
              ) : (
                <button 
                  className={styles.warningButton}
                  onClick={() => handleUpdateGiustificazione(false)}
                >
                  <span className={styles.buttonIcon}>⚠</span>
                  Segna come Non Giustificata
                </button>
              )}
              
              <button 
                className={styles.dangerButton}
                onClick={handleDelete}
              >
                <span className={styles.buttonIcon}>🗑️</span>
                Elimina Assenza
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DettaglioAssenza;