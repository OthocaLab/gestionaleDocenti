import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/Inserimento.module.css';
import ProtectedRoute from '../components/ProtectedRoute';

const ElencoAssenze = () => {
  const { user, isAuthenticated, isLoading } = useContext(AuthContext);
  const router = useRouter();
  
  const [assenze, setAssenze] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroData, setFiltroData] = useState('');
  
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
  
  // Carica le assenze
  useEffect(() => {
    if (isAuthenticated && hasPermission()) {
      fetchAssenze();
    }
  }, [isAuthenticated]);
  
  const fetchAssenze = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/assenze', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setAssenze(response.data.data);
    } catch (err) {
      console.error('Errore nel recupero delle assenze:', err);
      setError('Impossibile caricare le assenze. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Filtra le assenze
  const assenzeFiltered = assenze.filter(assenza => {
    let match = true;
    
    if (filtroTipo && assenza.tipoAssenza !== filtroTipo) {
      match = false;
    }
    
    if (filtroData) {
      const dataFiltro = new Date(filtroData);
      const dataInizio = new Date(assenza.dataInizio);
      const dataFine = new Date(assenza.dataFine);
      
      if (dataFiltro < dataInizio || dataFiltro > dataFine) {
        match = false;
      }
    }
    
    return match;
  });
  
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
        <h1 className={styles.title}>Elenco Assenze</h1>
        
        <div className={styles.filterContainer}>
          <div className={styles.filterGroup}>
            <label>Filtra per tipo:</label>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
              className={styles.select}
            >
              <option value="">Tutti i tipi</option>
              <option value="malattia">Malattia</option>
              <option value="permesso">Permesso</option>
              <option value="ferie">Ferie</option>
              <option value="altro">Altro</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Filtra per data:</label>
            <input 
              type="date" 
              value={filtroData} 
              onChange={(e) => setFiltroData(e.target.value)}
              className={styles.input}
            />
          </div>
          
          <button 
            className={styles.actionButton}
            onClick={() => {
              setFiltroTipo('');
              setFiltroData('');
            }}
          >
            Resetta Filtri
          </button>
        </div>
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.actionButton}
            onClick={() => router.push('/inserimento-assenze')}
          >
            Registra Nuova Assenza
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={() => router.push('/dashboard')}
          >
            Torna alla Dashboard
          </button>
        </div>
        
        {loading ? (
          <p>Caricamento assenze in corso...</p>
        ) : error ? (
          <p className={styles.errorMessage}>{error}</p>
        ) : assenzeFiltered.length === 0 ? (
          <p>Nessuna assenza trovata.</p>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Tipo</th>
                  <th>Data Inizio</th>
                  <th>Data Fine</th>
                  <th>Giustificata</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {assenzeFiltered.map((assenza) => (
                  <tr key={assenza._id}>
                    <td>
                      {assenza.docente.nome} {assenza.docente.cognome}
                    </td>
                    <td>
                      {assenza.tipoAssenza.charAt(0).toUpperCase() + assenza.tipoAssenza.slice(1)}
                    </td>
                    <td>{formatDate(assenza.dataInizio)}</td>
                    <td>{formatDate(assenza.dataFine)}</td>
                    <td>{assenza.giustificata ? 'Sì' : 'No'}</td>
                    <td>
                      <button 
                        className={styles.actionButtonSmall}
                        onClick={() => router.push(`/dettaglio-assenza/${assenza._id}`)}
                      >
                        Dettagli
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default ElencoAssenze;