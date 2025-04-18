import { useState, useEffect } from 'react';
import { getOrarioByDocente } from '../services/orarioService';
import { getAllUsers } from '../services/userService';
import styles from '../styles/Orario.module.css';

const OrarioDocente = () => {
  const [docenti, setDocenti] = useState([]);
  const [selectedDocente, setSelectedDocente] = useState('');
  const [orario, setOrario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const ore = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    const fetchDocenti = async () => {
      try {
        setLoading(true);
        const response = await getAllUsers();
        // Filtra solo i docenti
        const soloDocenti = response.data.filter(user => user.ruolo === 'docente');
        setDocenti(soloDocenti);
        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento dei docenti');
        setLoading(false);
      }
    };

    fetchDocenti();
  }, []);

  const handleDocenteChange = async (e) => {
    const docenteId = e.target.value;
    setSelectedDocente(docenteId);
    
    if (docenteId) {
      try {
        setLoading(true);
        const response = await getOrarioByDocente(docenteId);
        setOrario(response.data);
        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento dell\'orario');
        setLoading(false);
      }
    } else {
      setOrario([]);
    }
  };

  // Funzione per ottenere la lezione per un determinato giorno e ora
  const getLezione = (giorno, ora) => {
    return orario.find(
      (lezione) => lezione.giornoSettimana === giorno && lezione.ora === ora
    );
  };

  return (
    <div className={styles.orarioContainer}>
      <h3>Visualizza Orario Docente</h3>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.selectContainer}>
        <label htmlFor="docente">Seleziona Docente:</label>
        <select
          id="docente"
          value={selectedDocente}
          onChange={handleDocenteChange}
          className={styles.select}
        >
          <option value="">-- Seleziona un docente --</option>
          {docenti.map((docente) => (
            <option key={docente._id} value={docente._id}>
              {docente.cognome} {docente.nome}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Caricamento in corso...</div>
      ) : selectedDocente && (
        <div className={styles.orarioTable}>
          <table>
            <thead>
              <tr>
                <th>Ora</th>
                {giorni.map((giorno) => (
                  <th key={giorno}>{giorno}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ore.map((ora) => (
                <tr key={ora}>
                  <td>{ora}ª</td>
                  {giorni.map((giorno) => {
                    const lezione = getLezione(giorno, ora);
                    return (
                      <td 
                        key={`${giorno}-${ora}`}
                        style={{ backgroundColor: lezione?.materia?.coloreMateria }}
                      >
                        {lezione ? (
                          <div className={styles.lezione}>
                            <div className={styles.materia}>{lezione.materia.descrizione}</div>
                          </div>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrarioDocente;