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
  const [docente, setDocente] = useState(null);

  const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const ore = [
    { numero: 1, orario: '8:15-9:15' },
    { numero: 2, orario: '9:15-10:15' },
    { numero: 3, orario: '10:15-11:15' },
    { numero: 4, orario: '11:15-12:15' },
    { numero: 5, orario: '12:15-13:15' },
    { numero: 6, orario: '13:15-14:15' }
  ];

  useEffect(() => {
    const fetchDocenti = async () => {
      try {
        setLoading(true);
        const response = await getAllUsers();
        // Filtra solo i docenti
        const soloDocenti = response.data.filter(user => user.ruolo === 'docente');
        // Ordina i docenti per cognome
        const docentiOrdinati = [...soloDocenti].sort((a, b) => 
          a.cognome.localeCompare(b.cognome)
        );
        setDocenti(docentiOrdinati);
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
        setError(''); // Clear any previous errors
        
        // Trova il docente selezionato
        const docenteSelezionato = docenti.find(d => d._id === docenteId);
        setDocente(docenteSelezionato);
        
        console.log(`Fetching schedule for teacher: ${docenteSelezionato?.cognome || ''} ${docenteSelezionato?.nome || ''}, ID: ${docenteId}`);
        
        const response = await getOrarioByDocente(docenteId);
        console.log('Teacher schedule response:', response);
        
        if (response.success && response.data) {
          setOrario(response.data);
          if (response.data.length === 0) {
            console.log('Teacher has no scheduled lessons');
          }
        } else {
          console.error('Invalid response format:', response);
          setError('Formato della risposta non valido');
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching teacher schedule:", err);
        setError(`Errore nel caricamento dell'orario: ${err.message || 'Errore sconosciuto'}`);
        setOrario([]);
        setLoading(false);
      }
    } else {
      setOrario([]);
      setDocente(null);
    }
  };

  // Funzione per ottenere tutte le lezioni per un determinato giorno e ora
  const getLezioni = (giorno, ora) => {
    return orario.filter(
      (lezione) => lezione.giornoSettimana === giorno && lezione.ora === ora
    );
  };

  // Funzione per abbreviare la materia (massimo 3 caratteri)
  const getMateriaAbbreviata = (materia) => {
    if (!materia || !materia.descrizione) return '';
    
    const descrizione = materia.descrizione;
    
    // Se è già breve (3 caratteri o meno), la restituiamo in maiuscolo
    if (descrizione.length <= 3) {
      return descrizione.toUpperCase();
    }
    
    // Altrimenti, prendiamo le prime 3 lettere in maiuscolo
    return descrizione.substring(0, 3).toUpperCase();
  };

  return (
    <div className={styles.orarioContainer}>
      <h3>Lista Orari</h3>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.selectContainer}>
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
        <button className={styles.nuovaClasse}>Nuova Classe</button>
      </div>

      {loading ? (
        <div className={styles.loading}>Caricamento in corso...</div>
      ) : selectedDocente && docente ? (
        <>
          <div className={styles.docenteInfo}>
            <div className={styles.infoTable}>
              <div>Docente</div>
              <div>Materia</div>
              <div>Email</div>
              <div className={styles.buttonsGroup}>
                <button className={styles.iconButton}>
                  <span>📋</span>
                </button>
                <button className={styles.iconButton}>
                  <span>✏️</span>
                </button>
              </div>
            </div>
            <div className={styles.infoTableData}>
              <div>{docente.cognome} {docente.nome}</div>
              <div>Classe A-12</div>
              <div>{docente.email || 'ardu@temp.scuola.it'}</div>
              <div></div>
            </div>
          </div>

          <div className={styles.orarioTable}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  {giorni.map(giorno => (
                    <th key={giorno}>{giorno}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ore.map(ora => (
                  <tr key={ora.numero}>
                    <td className={styles.oraCell}>
                      <div className={styles.oraNum}>{ora.numero}ª</div>
                      <div className={styles.oraRange}>{ora.orario}</div>
                    </td>
                    {giorni.map(giorno => {
                      const lezioni = getLezioni(giorno, ora.numero);
                      const hasLezione = lezioni.length > 0;
                      const lezione = hasLezione ? lezioni[0] : null;
                      
                      return (
                        <td 
                          key={`${giorno}-${ora.numero}`}
                          style={{ 
                            backgroundColor: hasLezione ? lezione.materia.coloreMateria : undefined 
                          }}
                        >
                          {hasLezione && (
                            <div className={styles.lezioneContent}>
                              <div className={styles.codiceMateria}>
                                {getMateriaAbbreviata(lezione.materia)}
                              </div>
                              <div className={styles.docente}>
                                {lezione.docente?.cognome || 'N/D'}
                              </div>
                              <div className={styles.aula}>
                                Aula: {lezione.aula || 'N/D'}
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className={styles.noData}>Seleziona un docente per visualizzare l'orario</div>
      )}
    </div>
  );
};

export default OrarioDocente;