import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/Inserimento.module.css';

const ElencoAssenze = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  
  const [assenze, setAssenze] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroData, setFiltroData] = useState('');
  
  // Carica le assenze
  useEffect(() => {
    if (isAuthenticated) {
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

  // Funzione per modificare un'assenza
  const handleEdit = (assenzaId) => {
    router.push(`/dashboard?tab=modificaAssenza&id=${assenzaId}`);
  };
  
  // Funzione per eliminare un'assenza
  const handleDelete = async (assenzaId) => {
    if (!confirm('Sei sicuro di voler eliminare questa assenza?')) {
      return;
    }
    
    try {
      await axios.delete(`/api/assenze/${assenzaId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Rimuove l'assenza dall'elenco locale senza ricaricare
      setAssenze(prevAssenze => prevAssenze.filter(assenza => assenza._id !== assenzaId));
      
      alert('Assenza eliminata con successo');
    } catch (err) {
      console.error('Errore nell\'eliminazione dell\'assenza:', err);
      alert('Impossibile eliminare l\'assenza. Riprova più tardi.');
    }
  };
  
  return (
    <div className={styles.componentContainer}>
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
            <option value="fuoriclasse">Fuoriclasse</option>
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
          onClick={() => router.push('/dashboard?tab=inserisciAssenze')}
        >
          Registra Nuova Assenza
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
                <th>Orario</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {assenzeFiltered.map((assenza) => (
                <tr key={assenza._id}>
                  <td>
                    {assenza.docente ? `${assenza.docente.nome} ${assenza.docente.cognome}` : 'Docente non assegnato'}
                  </td>
                  <td>
                    {assenza.tipoAssenza.charAt(0).toUpperCase() + assenza.tipoAssenza.slice(1)}
                  </td>
                  <td>{formatDate(assenza.dataInizio)}</td>
                  <td>{formatDate(assenza.dataFine)}</td>
                  <td>
                    {assenza.orarioSpecifico ? (
                      <>
                        {assenza.orarioEntrata && <div>Entrata: {assenza.orarioEntrata}</div>}
                        {assenza.orarioUscita && <div>Uscita: {assenza.orarioUscita}</div>}
                      </>
                    ) : (
                      <span>Intero giorno</span>
                    )}
                  </td>
                  <td>
                    <div className={styles.actionButtonsRow}>
                      <button 
                        className={`${styles.actionButtonSmall} ${styles.editButton}`}
                        onClick={() => router.push(`/dashboard?tab=dettaglioAssenza&id=${assenza._id}`)}
                      >
                        Dettagli
                      </button>
                      <button 
                        className={`${styles.actionButtonSmall} ${styles.editButton}`}
                        onClick={() => handleEdit(assenza._id)}
                      >
                        Modifica
                      </button>
                      <button 
                        className={`${styles.actionButtonSmall} ${styles.deleteButton}`}
                        onClick={() => handleDelete(assenza._id)}
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ElencoAssenze;