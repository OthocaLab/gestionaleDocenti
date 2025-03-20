import { useState, useEffect } from 'react';
import { getAllUsers } from '../services/userService';
import { getAllMaterie, getAllClassi, createOrarioLezione } from '../services/orarioService';
import styles from '../styles/Orario.module.css';

const OrarioForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    classeId: '',
    giornoSettimana: '',
    ora: '',
    oraInizio: '',
    oraFine: '',
    docente: '',
    materia: ''
  });
  
  const [docenti, setDocenti] = useState([]);
  const [materie, setMaterie] = useState([]);
  const [classi, setClassi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  const ore = [1, 2, 3, 4, 5, 6, 7, 8];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Carica docenti, materie e classi in parallelo
        const [docentiRes, materieRes, classiRes] = await Promise.all([
          getAllUsers(),
          getAllMaterie(),
          getAllClassi()
        ]);
        
        // Filtra solo i docenti
        const soloDocenti = docentiRes.data.filter(user => user.ruolo === 'docente');
        
        setDocenti(soloDocenti);
        setMaterie(materieRes.data);
        setClassi(classiRes.data);
        
        setLoading(false);
      } catch (err) {
        setError('Errore nel caricamento dei dati: ' + (err.message || 'Errore sconosciuto'));
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validazione base
    for (const key in formData) {
      if (!formData[key]) {
        setError(`Il campo ${key} è obbligatorio`);
        return;
      }
    }
    
    try {
      setLoading(true);
      await createOrarioLezione(formData);
      
      setSuccess('Lezione aggiunta con successo all\'orario!');
      setFormData({
        classeId: '',
        giornoSettimana: '',
        ora: '',
        oraInizio: '',
        oraFine: '',
        docente: '',
        materia: ''
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
      setLoading(false);
    } catch (err) {
      setError('Errore nella creazione della lezione: ' + (err.message || 'Errore sconosciuto'));
      setLoading(false);
    }
  };

  if (loading && !docenti.length && !materie.length && !classi.length) {
    return <div className={styles.loading}>Caricamento dati in corso...</div>;
  }

  return (
    <div className={styles.orarioFormContainer}>
      <h3>Aggiungi Lezione all'Orario</h3>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      <form onSubmit={handleSubmit} className={styles.orarioForm}>
        <div className={styles.formGroup}>
          <label htmlFor="classeId">Classe:</label>
          <select
            id="classeId"
            name="classeId"
            value={formData.classeId}
            onChange={handleChange}
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
        
        <div className={styles.formGroup}>
          <label htmlFor="giornoSettimana">Giorno:</label>
          <select
            id="giornoSettimana"
            name="giornoSettimana"
            value={formData.giornoSettimana}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">-- Seleziona un giorno --</option>
            {giorni.map((giorno) => (
              <option key={giorno} value={giorno}>
                {giorno}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="ora">Ora:</label>
          <select
            id="ora"
            name="ora"
            value={formData.ora}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">-- Seleziona un'ora --</option>
            {ore.map((ora) => (
              <option key={ora} value={ora}>
                {ora}ª ora
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="oraInizio">Ora Inizio:</label>
            <input
              type="time"
              id="oraInizio"
              name="oraInizio"
              value={formData.oraInizio}
              onChange={handleChange}
              className={styles.timeInput}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="oraFine">Ora Fine:</label>
            <input
              type="time"
              id="oraFine"
              name="oraFine"
              value={formData.oraFine}
              onChange={handleChange}
              className={styles.timeInput}
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="docente">Docente:</label>
          <select
            id="docente"
            name="docente"
            value={formData.docente}
            onChange={handleChange}
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
        
        <div className={styles.formGroup}>
          <label htmlFor="materia">Materia:</label>
          <select
            id="materia"
            name="materia"
            value={formData.materia}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="">-- Seleziona una materia --</option>
            {materie.map((materia) => (
              <option key={materia._id} value={materia._id}>
                {materia.descrizione}
              </option>
            ))}
          </select>
        </div>
        
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Salvataggio in corso...' : 'Aggiungi Lezione'}
        </button>
      </form>
    </div>
  );
};

export default OrarioForm;