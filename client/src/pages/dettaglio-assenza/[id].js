import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import styles from '../../styles/Inserimento.module.css';
import ProtectedRoute from '../../components/ProtectedRoute';

const DettaglioAssenza = () => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();
  // Verifica se siamo nel browser prima di usare router.query
  const { id } = typeof window !== 'undefined' ? router.query : {};
  
  const [assenza, setAssenza] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Verifica se l'utente ha i permessi necessari
  const hasPermission = () => {
    if (!user) return false;
    return ['admin', 'vicepresidenza', 'ufficioPersonale'].includes(user.ruolo);
  };
  
  // Reindirizza se l'utente non ha i permessi
  useEffect(() => {
    // Verifica se siamo nel browser prima di usare il router
    if (typeof window !== 'undefined' && !isLoading && isAuthenticated && !hasPermission()) {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);
  
  // Carica i dettagli dell'assenza
  useEffect(() => {
    // Verifica se siamo nel browser prima di procedere
    if (typeof window !== 'undefined' && id && isAuthenticated && hasPermission()) {
      fetchAssenza();
    }
  }, [id, isAuthenticated]);
  
  const fetchAssenza = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assenze/${id}`, {
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
      await axios.put(`/api/assenze/${id}`, 
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
      await axios.delete(`/api/assenze/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Verifica se siamo nel browser prima di usare il router
      if (typeof window !== 'undefined') {
        router.push('/elenco-assenze');
      }
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
  
  // Se l'utente non è autenticato o sta caricando, non mostrare nulla
  if (isLoading || !isAuthenticated) {
    return null;
  }
  
  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <h1 className={styles.title}>Dettaglio Assenza</h1>
        
        {message.text && (
          <div className={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
            {message.text}
          </div>
        )}
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionButton}
            onClick={() => {
              // Verifica se siamo nel browser prima di usare il router
              if (typeof window !== 'undefined') {
                router.push('/elenco-assenze');
              }
            }}
          >
            Torna all'Elenco
          </button>
        </div>
        
        {loading ? (
          <p>Caricamento dettagli in corso...</p>
        ) : error ? (
          <p className={styles.errorMessage}>{error}</p>
        ) : !assenza ? (
          <p>Assenza non trovata.</p>
        ) : (
          <div className={styles.form}>
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Informazioni Docente</h2>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nome</label>
                  <p>{assenza.docente.nome}</p>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Cognome</label>
                  <p>{assenza.docente.cognome}</p>
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <p>{assenza.docente.email}</p>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Codice Fiscale</label>
                  <p>{assenza.docente.codiceFiscale}</p>
                </div>
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Dettagli Assenza</h2>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Tipo Assenza</label>
                  <p>{assenza.tipoAssenza.charAt(0).toUpperCase() + assenza.tipoAssenza.slice(1)}</p>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Stato</label>
                  <p>{assenza.giustificata ? 'Giustificata' : 'Non giustificata'}</p>
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data Inizio</label>
                  <p>{formatDate(assenza.dataInizio)}</p>
                </div>
                
                <div className={styles.formGroup}>
                  <label className={styles.label}>Data Fine</label>
                  <p>{formatDate(assenza.dataFine)}</p>
                </div>
              </div>
              
              {assenza.documentazione && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Documentazione</label>
                  <p>
                    <a href={assenza.documentazione} target="_blank" rel="noopener noreferrer">
                      Visualizza documentazione
                    </a>
                  </p>
                </div>
              )}
              
              {assenza.note && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Note</label>
                  <p>{assenza.note}</p>
                </div>
              )}
            </div>
            
            <div className={styles.formActions}>
              {!assenza.giustificata ? (
                <button 
                  className={styles.actionButton}
                  onClick={() => handleUpdateGiustificazione(true)}
                >
                  Segna come Giustificata
                </button>
              ) : (
                <button 
                  className={styles.actionButton}
                  onClick={() => handleUpdateGiustificazione(false)}
                >
                  Segna come Non Giustificata
                </button>
              )}
              
              <button 
                className={styles.cancelButton}
                onClick={handleDelete}
              >
                Elimina Assenza
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default DettaglioAssenza;

// Disabilita la generazione statica per questa pagina dinamica
export async function getServerSideProps(context) {
  return {
    props: {}, // Passa props vuote al componente
  };
}