import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/VisualizzaAssenzePerOra.module.css';

const VisualizzaAssenzePerOra = () => {
  const [assenze, setAssenze] = useState([]);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [ora, setOra] = useState('');
  const [loading, setLoading] = useState(false);
  const [docentiDisponibili, setDocentiDisponibili] = useState([]);
  
  const oreDisponibili = [1, 2, 3, 4, 5, 6, 7, 8];
  
  useEffect(() => {
    // Carica i docenti disponibili per le sostituzioni
    const fetchDocentiDisponibili = async () => {
      try {
        const response = await axios.get('/api/docenti');
        setDocentiDisponibili(response.data);
      } catch (error) {
        console.error('Errore nel recupero dei docenti:', error);
      }
    };
    
    fetchDocentiDisponibili();
  }, []);
  
  const fetchAssenze = async () => {
    if (!ora) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`/api/presenze?data=${data}&ora=${ora}`);
      setAssenze(response.data.data);
    } catch (error) {
      console.error('Errore nel recupero delle assenze:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (data && ora) {
      fetchAssenze();
    }
  }, [data, ora]);
  
  const handleSostituzione = async (presenzaId, ora) => {
    const sostitutoId = document.getElementById(`sostituto-${presenzaId}-${ora}`).value;
    
    if (!sostitutoId) {
      alert('Seleziona un docente sostituto');
      return;
    }
    
    try {
      await axios.post('/api/presenze/sostituzione', {
        presenzaId,
        sostitutoId,
        ora: parseInt(ora)
      });
      
      alert('Sostituzione registrata con successo');
      fetchAssenze(); // Ricarica i dati
    } catch (error) {
      alert(`Errore: ${error.response?.data?.message || error.message}`);
    }
  };
  
  return (
    <div className={styles.container}>
      <h2>Visualizza Assenze per Ora</h2>
      
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="data">Data:</label>
          <input
            type="date"
            id="data"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className={styles.input}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="ora">Ora:</label>
          <select
            id="ora"
            value={ora}
            onChange={(e) => setOra(e.target.value)}
            className={styles.select}
          >
            <option value="">Seleziona un'ora</option>
            {oreDisponibili.map(o => (
              <option key={o} value={o}>Ora {o}</option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Caricamento...</div>
      ) : (
        <>
          {assenze.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Classe</th>
                  <th>Materia</th>
                  <th>Tipo Assenza</th>
                  <th>Motivo</th>
                  <th>Sostituto</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {assenze.map(presenza => {
                  const docente = presenza.docente;
                  const tipoAssenza = presenza.assenteGiornataIntera 
                    ? 'Giornata intera' 
                    : `Ora ${ora}`;
                  const motivo = presenza.assenteGiornataIntera 
                    ? presenza.motivoGiornataIntera 
                    : presenza.oreAssenza.find(o => o.ora === parseInt(ora))?.motivo || '';
                  const sostitutoId = presenza.assenteGiornataIntera 
                    ? null 
                    : presenza.oreAssenza.find(o => o.ora === parseInt(ora))?.sostituto || null;
                  
                  return (
                    <tr key={presenza._id}>
                      <td>{docente.nome} {docente.cognome}</td>
                      <td>
                        {docente.classiInsegnamento?.map(c => c.nome).join(', ') || 'N/A'}
                      </td>
                      <td>
                        {docente.classiInsegnamento?.map(c => c.materia?.nome).join(', ') || 'N/A'}
                      </td>
                      <td>{tipoAssenza}</td>
                      <td>{motivo || 'Non specificato'}</td>
                      <td>
                        <select
                          id={`sostituto-${presenza._id}-${ora}`}
                          defaultValue={sostitutoId || ''}
                          className={styles.select}
                          disabled={presenza.assenteGiornataIntera}
                        >
                          <option value="">Seleziona sostituto</option>
                          {docentiDisponibili
                            .filter(d => d._id !== docente._id) // Escludi il docente assente
                            .map(d => (
                              <option key={d._id} value={d._id}>
                                {d.nome} {d.cognome}
                              </option>
                            ))
                          }
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => handleSostituzione(presenza._id, ora)}
                          className={styles.button}
                          disabled={presenza.assenteGiornataIntera}
                        >
                          Assegna
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.noData}>
              {ora ? 'Nessuna assenza trovata per questa data e ora' : 'Seleziona un\'ora per visualizzare le assenze'}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VisualizzaAssenzePerOra;