import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/ImpostazioniUtente.module.css';
import { sendVerificationCode, verifyEmailCode } from '../services/authService';

const ImpostazioniUtente = () => {
  const { user } = useContext(AuthContext);
  const [activeSection, setActiveSection] = useState('informazioniPersonali');
  
  // Stati per le informazioni personali
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [erroriInput, setErroriInput] = useState({});

  // Stati per le credenziali di accesso
  const [passwordCorrente, setPasswordCorrente] = useState('');
  const [nuovaPassword, setNuovaPassword] = useState('');
  const [confermaPassword, setConfermaPassword] = useState('');
  const [codiceDiVerifica, setCodiceDiVerifica] = useState('');
  const [codiceInviato, setCodiceInviato] = useState(false);
  const [codiceVerificato, setCodiceVerificato] = useState(false);
  const [codiceGenerato, setCodiceGenerato] = useState('');
  const [messaggioStato, setMessaggioStato] = useState('');

  // Stati per le notifiche
  const [notificheEmail, setNotificheEmail] = useState(true);
  const [notifichePush, setNotifichePush] = useState(false);

  // Stati per privacy e sicurezza
  const [autenticazioneADueFattori, setAutenticazioneADueFattori] = useState(false);

  // Mock data per le attività recenti
  const [attivitaRecenti] = useState([
    { id: 1, tipo: 'Accesso', data: '2023-11-25 14:30:00', ip: '192.168.1.1', dispositivo: 'Chrome su Windows' },
    { id: 2, tipo: 'Modifica Password', data: '2023-11-23 09:15:22', ip: '192.168.1.1', dispositivo: 'Chrome su Windows' },
    { id: 3, tipo: 'Accesso', data: '2023-11-20 18:45:11', ip: '192.168.0.2', dispositivo: 'Safari su MacOS' },
    { id: 4, tipo: 'Modifica Profilo', data: '2023-11-17 11:22:33', ip: '192.168.1.1', dispositivo: 'Chrome su Windows' },
  ]);

  // Stato per il modal di eliminazione account
  const [mostraModalEliminazione, setMostraModalEliminazione] = useState(false);
  const [confermaEliminazione, setConfermaEliminazione] = useState('');

  // Carica i dati utente all'avvio
  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setCognome(user.cognome || '');
      setEmail(user.email || '');
      setTelefono(user.telefono || '');
      setNotificheEmail(user.notificheEmail !== undefined ? user.notificheEmail : true);
      setNotifichePush(user.notifichePush !== undefined ? user.notifichePush : false);
      setAutenticazioneADueFattori(user.autenticazioneADueFattori || false);
    }
  }, [user]);

  // Validazione dell'email
  const validaEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validazione della password
  const validaPassword = (password) => {
    // Almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  // Invia codice di verifica (utilizzo API reale)
  const inviaCodiceDiVerifica = async () => {
    try {
      // Chiamata al servizio per inviare il codice di verifica
      await sendVerificationCode(email);
      setCodiceInviato(true);
      setMessaggioStato(`Un codice di verifica è stato inviato all'indirizzo email ${email}. Controlla la tua casella di posta.`);
    } catch (error) {
      console.error("Errore durante l'invio del codice:", error);
      setMessaggioStato(`Errore durante l'invio del codice: ${error.message || 'Si è verificato un errore'}`);
    }
  };

  // Verifica del codice
  const verificaCodice = async () => {
    if (!codiceDiVerifica) {
      setErroriInput({...erroriInput, codiceDiVerifica: 'Inserisci il codice di verifica'});
      return;
    }

    try {
      // Chiamata al servizio per verificare il codice
      await verifyEmailCode(codiceDiVerifica);
      setCodiceVerificato(true);
      setMessaggioStato('Codice verificato con successo! Ora puoi impostare una nuova password.');
      setErroriInput({...erroriInput, codiceDiVerifica: undefined});
    } catch (error) {
      console.error("Errore durante la verifica del codice:", error);
      setErroriInput({
        ...erroriInput, 
        codiceDiVerifica: error.message || 'Codice non valido'
      });
    }
  };

  // Gestione della sottomissione del form delle informazioni personali
  const handleSubmitInformazioniPersonali = (e) => {
    e.preventDefault();
    const errori = {};

    if (!nome) errori.nome = 'Il nome è obbligatorio';
    if (!cognome) errori.cognome = 'Il cognome è obbligatorio';
    
    if (!email) {
      errori.email = 'L\'email è obbligatoria';
    } else if (!validaEmail(email)) {
      errori.email = 'Inserisci un\'email valida';
    }

    if (Object.keys(errori).length > 0) {
      setErroriInput(errori);
      return;
    }

    // Qui l'implementazione dell'aggiornamento dei dati utente
    setMessaggioStato('Informazioni personali aggiornate con successo!');
    setErroriInput({});
  };

  // Gestione della sottomissione del form per il cambio password
  const handleSubmitCambioPassword = (e) => {
    e.preventDefault();
    const errori = {};

    if (!passwordCorrente) errori.passwordCorrente = 'La password corrente è obbligatoria';
    
    if (!nuovaPassword) {
      errori.nuovaPassword = 'La nuova password è obbligatoria';
    } else if (!validaPassword(nuovaPassword)) {
      errori.nuovaPassword = 'La password deve contenere almeno 8 caratteri, una lettera maiuscola, una minuscola, un numero e un carattere speciale';
    }

    if (nuovaPassword !== confermaPassword) {
      errori.confermaPassword = 'Le password non corrispondono';
    }

    if (Object.keys(errori).length > 0) {
      setErroriInput(errori);
      return;
    }

    // Qui l'implementazione del cambio password
    setMessaggioStato('Password aggiornata con successo!');
    setErroriInput({});
    setPasswordCorrente('');
    setNuovaPassword('');
    setConfermaPassword('');
    setCodiceInviato(false);
    setCodiceVerificato(false);
    setCodiceDiVerifica('');
  };

  // Aggiunta di una funzione per gestire il salvataggio delle notifiche
  const handleSalvaNotifiche = () => {
    // Qui l'implementazione del salvataggio delle notifiche
    setMessaggioStato('Preferenze di notifica salvate con successo!');
  };

  // Aggiunta di una funzione per gestire il salvataggio delle impostazioni di privacy
  const handleSalvaPrivacy = () => {
    // Qui l'implementazione del salvataggio delle impostazioni di privacy
    setMessaggioStato('Impostazioni di sicurezza aggiornate con successo!');
  };

  // Gestione dell'eliminazione dell'account
  const eliminaAccount = () => {
    if (confermaEliminazione !== email) {
      setErroriInput({...erroriInput, confermaEliminazione: 'L\'email non corrisponde'});
      return;
    }

    // Qui l'implementazione dell'eliminazione dell'account
    setMessaggioStato('Account eliminato con successo!');
    setMostraModalEliminazione(false);
    setConfermaEliminazione('');
    // Qui si dovrebbe reindirizzare l'utente alla pagina di login o simile
  };

  // Funzione per cambiare la sezione attiva
  const cambiaSezione = (sezione) => {
    setActiveSection(sezione);
    setMessaggioStato(''); // Pulisci il messaggio di stato quando cambi sezione
  };

  return (
    <div className={styles.containerForm}>
      <h1 className={styles.titoloPagina}>Impostazioni Utente</h1>
      
      <div className={styles.navTabs}>
        <button
          className={`${styles.tabButton} ${activeSection === 'informazioniPersonali' ? styles.activeTab : ''}`}
          onClick={() => cambiaSezione('informazioniPersonali')}
        >
          Informazioni Personali
        </button>
        <button
          className={`${styles.tabButton} ${activeSection === 'credenziali' ? styles.activeTab : ''}`}
          onClick={() => cambiaSezione('credenziali')}
        >
          Credenziali di Accesso
        </button>
        <button
          className={`${styles.tabButton} ${activeSection === 'notifiche' ? styles.activeTab : ''}`}
          onClick={() => cambiaSezione('notifiche')}
        >
          Notifiche
        </button>
        <button
          className={`${styles.tabButton} ${activeSection === 'privacy' ? styles.activeTab : ''}`}
          onClick={() => cambiaSezione('privacy')}
        >
          Privacy e Sicurezza
        </button>
        <button
          className={`${styles.tabButton} ${activeSection === 'eliminaAccount' ? styles.activeTab : ''}`}
          onClick={() => cambiaSezione('eliminaAccount')}
        >
          Eliminazione Account
        </button>
      </div>

      <div className={styles.formContent}>
        {/* Sezione Informazioni Personali */}
        {activeSection === 'informazioniPersonali' && (
          <form onSubmit={handleSubmitInformazioniPersonali} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="nome" className={styles.label}>Nome:</label>
              <input
                type="text"
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={styles.input}
              />
              {erroriInput.nome && <span className={styles.errorMessage}>{erroriInput.nome}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="cognome" className={styles.label}>Cognome:</label>
              <input
                type="text"
                id="cognome"
                value={cognome}
                onChange={(e) => setCognome(e.target.value)}
                className={styles.input}
              />
              {erroriInput.cognome && <span className={styles.errorMessage}>{erroriInput.cognome}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email" className={styles.label}>Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
              />
              {erroriInput.email && <span className={styles.errorMessage}>{erroriInput.email}</span>}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="telefono" className={styles.label}>Numero di Telefono:</label>
              <input
                type="tel"
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className={styles.input}
              />
              {erroriInput.telefono && <span className={styles.errorMessage}>{erroriInput.telefono}</span>}
            </div>
            
            {activeSection === 'informazioniPersonali' && messaggioStato && (
              <div className={`${styles.messaggioStato} ${styles.messaggioSuccesso}`}>
                {messaggioStato}
              </div>
            )}
            
            <button type="submit" className={styles.submitButton}>
              Salva Modifiche
            </button>
          </form>
        )}
        
        {/* Sezione Credenziali di Accesso */}
        {activeSection === 'credenziali' && (
          <form onSubmit={handleSubmitCambioPassword} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="passwordCorrente" className={styles.label}>Password Corrente:</label>
              <input
                type="password"
                id="passwordCorrente"
                value={passwordCorrente}
                onChange={(e) => setPasswordCorrente(e.target.value)}
                className={styles.input}
                disabled={codiceInviato}
              />
              {erroriInput.passwordCorrente && <span className={styles.errorMessage}>{erroriInput.passwordCorrente}</span>}
            </div>
            
            {messaggioStato && (
              <div className={`${styles.messaggioStato} ${codiceVerificato ? styles.messaggioSuccesso : ''}`}>
                {messaggioStato}
              </div>
            )}
            
            {!codiceInviato ? (
              <button 
                type="button" 
                className={styles.buttonSecondary}
                onClick={inviaCodiceDiVerifica}
                disabled={!passwordCorrente}
              >
                Invia Codice di Verifica
              </button>
            ) : !codiceVerificato ? (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="codiceDiVerifica" className={styles.label}>Codice di Verifica:</label>
                  <input
                    type="text"
                    id="codiceDiVerifica"
                    value={codiceDiVerifica}
                    onChange={(e) => setCodiceDiVerifica(e.target.value)}
                    className={styles.input}
                  />
                  {erroriInput.codiceDiVerifica && <span className={styles.errorMessage}>{erroriInput.codiceDiVerifica}</span>}
                </div>
                <button 
                  type="button" 
                  className={styles.buttonSecondary}
                  onClick={verificaCodice}
                >
                  Verifica Codice
                </button>
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="nuovaPassword" className={styles.label}>Nuova Password:</label>
                  <input
                    type="password"
                    id="nuovaPassword"
                    value={nuovaPassword}
                    onChange={(e) => setNuovaPassword(e.target.value)}
                    className={styles.input}
                  />
                  {erroriInput.nuovaPassword && <span className={styles.errorMessage}>{erroriInput.nuovaPassword}</span>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="confermaPassword" className={styles.label}>Conferma Nuova Password:</label>
                  <input
                    type="password"
                    id="confermaPassword"
                    value={confermaPassword}
                    onChange={(e) => setConfermaPassword(e.target.value)}
                    className={styles.input}
                  />
                  {erroriInput.confermaPassword && <span className={styles.errorMessage}>{erroriInput.confermaPassword}</span>}
                </div>
                
                <button 
                  type="submit" 
                  className={styles.submitButton}
                  disabled={!nuovaPassword || !confermaPassword}
                >
                  Cambia Password
                </button>
              </>
            )}
          </form>
        )}
        
        {/* Sezione Notifiche */}
        {activeSection === 'notifiche' && (
          <div className={styles.form}>
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="notificheEmail"
                checked={notificheEmail}
                onChange={(e) => setNotificheEmail(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="notificheEmail" className={styles.checkboxLabel}>
                Ricevi notifiche via email
              </label>
            </div>
            
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="notifichePush"
                checked={notifichePush}
                onChange={(e) => setNotifichePush(e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="notifichePush" className={styles.checkboxLabel}>
                Ricevi notifiche push
              </label>
            </div>
            
            {activeSection === 'notifiche' && messaggioStato && (
              <div className={`${styles.messaggioStato} ${styles.messaggioSuccesso}`}>
                {messaggioStato}
              </div>
            )}
            
            <button 
              type="button" 
              className={styles.submitButton}
              onClick={handleSalvaNotifiche}
            >
              Salva Preferenze
            </button>
          </div>
        )}
        
        {/* Sezione Privacy e Sicurezza */}
        {activeSection === 'privacy' && (
          <div className={styles.form}>
            <div className={styles.toggleGroup}>
              <div className={styles.toggleLabel}>Autenticazione a Due Fattori:</div>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={autenticazioneADueFattori}
                  onChange={(e) => setAutenticazioneADueFattori(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
              <div className={styles.toggleStatus}>
                {autenticazioneADueFattori ? 'Attivata' : 'Disattivata'}
              </div>
            </div>
            
            <div className={styles.attivitaRecenti}>
              <h3>Attività Recenti dell'Account</h3>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Attività</th>
                    <th>Data</th>
                    <th>IP</th>
                    <th>Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {attivitaRecenti.map((attivita) => (
                    <tr key={attivita.id}>
                      <td>{attivita.tipo}</td>
                      <td>{attivita.data}</td>
                      <td>{attivita.ip}</td>
                      <td>{attivita.dispositivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {activeSection === 'privacy' && messaggioStato && (
              <div className={`${styles.messaggioStato} ${styles.messaggioSuccesso}`}>
                {messaggioStato}
              </div>
            )}
            
            <button 
              type="button" 
              className={styles.submitButton}
              onClick={handleSalvaPrivacy}
            >
              Salva Impostazioni
            </button>
          </div>
        )}
        
        {/* Sezione Eliminazione Account */}
        {activeSection === 'eliminaAccount' && (
          <div className={styles.form}>
            <div className={styles.eliminazioneAvviso}>
              <h3>Eliminazione Account</h3>
              <p>
                L'eliminazione dell'account è un'azione irreversibile. 
                Tutti i tuoi dati verranno eliminati permanentemente dal sistema.
              </p>
              <button
                type="button"
                className={styles.buttonDanger}
                onClick={() => setMostraModalEliminazione(true)}
              >
                Elimina Account
              </button>
            </div>
            
            {activeSection === 'eliminaAccount' && messaggioStato && (
              <div className={`${styles.messaggioStato} ${styles.messaggioSuccesso}`}>
                {messaggioStato}
              </div>
            )}
            
            {mostraModalEliminazione && (
              <div className={styles.modal}>
                <div className={styles.modalContent}>
                  <h2>Conferma Eliminazione Account</h2>
                  <p>Per confermare l'eliminazione, inserisci la tua email: {email}</p>
                  
                  <div className={styles.formGroup}>
                    <input
                      type="text"
                      value={confermaEliminazione}
                      onChange={(e) => setConfermaEliminazione(e.target.value)}
                      className={styles.input}
                    />
                    {erroriInput.confermaEliminazione && <span className={styles.errorMessage}>{erroriInput.confermaEliminazione}</span>}
                  </div>
                  
                  <div className={styles.modalActions}>
                    <button
                      type="button"
                      className={styles.buttonCancel}
                      onClick={() => {
                        setMostraModalEliminazione(false);
                        setConfermaEliminazione('');
                      }}
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={eliminaAccount}
                    >
                      Conferma Eliminazione
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImpostazioniUtente;
