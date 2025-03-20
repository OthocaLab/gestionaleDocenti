import { useState, useEffect } from 'react';
import { getOrarioByClasse, getAllClassi } from '../services/orarioService';
import styles from '../styles/Orario.module.css';

const OrarioClasse = () => {
  const [classi, setClassi] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [orario, setOrario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const ore = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    const fetchClassi = async () => {
      try {
        setLoading(true);
        const response = await getAllClassi();
        setClassi(response.data);
        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento delle classi');
        setLoading(false);
      }
    };

    fetchClassi();
  }, []);

  const handleClasseChange = async (e) => {
    const classeId = e.target.value;
    setSelectedClasse(classeId);
    
    if (classeId) {
      try {
        setLoading(true);
        const response = await getOrarioByClasse(classeId);
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
      <h3>Visualizza Orario Classe</h3>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.selectContainer}>
        <label htmlFor="classe">Seleziona Classe:</label>
        <select
          id="classe"
          value={selectedClasse}
          onChange={handleClasseChange}
          className={styles.select}
        >
          <option value="">-- Seleziona una classe --</option>
          {classi.map((classe) => (
            <option key={classe._id} value={classe._id}>
              {classe.anno}ª {classe.sezione} - {classe.indirizzo}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Caricamento in corso...</div>
      ) : selectedClasse && (
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
                            <div className={styles.docente}>
                              {lezione.docente.nome} {lezione.docente.cognome}
                            </div>
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

export default OrarioClasse;