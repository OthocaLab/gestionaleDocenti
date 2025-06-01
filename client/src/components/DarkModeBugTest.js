import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import styles from '../styles/ImpostazioniUtente.module.css';

const DarkModeBugTest = () => {
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefono: '',
    bio: '',
    notifiche: false,
    newsletter: false
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className={styles.containerForm}>
      <div className={styles.titoloPagina}>
        🐛 Test Bug Fixes Dark Mode
        <div style={{ float: 'right' }}>
          <ThemeToggle />
        </div>
      </div>

      <div className={styles.messaggioStato}>
        Modalità corrente: <strong>{isDarkMode ? 'Dark Mode 🌙' : 'Light Mode ☀️'}</strong>
      </div>

      <div className={styles.form}>
        {/* Test Input Standard */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Nome (Input Test):</label>
          <input
            type="text"
            className={styles.input}
            value={formData.nome}
            onChange={(e) => handleInputChange('nome', e.target.value)}
            placeholder="Inserisci il tuo nome..."
          />
        </div>

        {/* Test Input Email */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Email (Input Test):</label>
          <input
            type="email"
            className={styles.input}
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="esempio@email.com"
          />
        </div>

        {/* Test Textarea */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Biografia (Textarea Test):</label>
          <textarea
            className={styles.textarea}
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Scrivi qualcosa su di te..."
            rows={4}
          />
        </div>

        {/* Test Textarea Bio */}
        <div className={styles.bioContainer}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Note Aggiuntive (Bio Textarea Test):</label>
            <textarea
              className={styles.bioTextarea}
              placeholder="Inserisci note aggiuntive o informazioni importanti..."
              rows={3}
            />
          </div>
        </div>

        {/* Test Select */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Categoria (Select Test):</label>
          <select className={styles.input}>
            <option value="">Seleziona una categoria...</option>
            <option value="docente">Docente</option>
            <option value="amministrativo">Amministrativo</option>
            <option value="dirigente">Dirigente</option>
          </select>
        </div>

        {/* Test Checkbox */}
        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="notifiche"
            className={styles.checkbox}
            checked={formData.notifiche}
            onChange={(e) => handleInputChange('notifiche', e.target.checked)}
          />
          <label htmlFor="notifiche" className={styles.checkboxLabel}>
            Ricevi notifiche via email (Checkbox Test)
          </label>
        </div>

        <div className={styles.checkboxGroup}>
          <input
            type="checkbox"
            id="newsletter"
            className={styles.checkbox}
            checked={formData.newsletter}
            onChange={(e) => handleInputChange('newsletter', e.target.checked)}
          />
          <label htmlFor="newsletter" className={styles.checkboxLabel}>
            Iscriviti alla newsletter
          </label>
        </div>

        {/* Test File Input */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Upload File (File Input Test):</label>
          <input
            type="file"
            className={styles.input}
            accept=".pdf,.doc,.docx"
          />
        </div>

        {/* Test Range Input */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Priorità (Range Input Test):</label>
          <input
            type="range"
            min="1"
            max="10"
            defaultValue="5"
            style={{
              width: '100%',
              height: '8px',
              background: isDarkMode ? '#404040' : '#ddd',
              borderRadius: '4px',
              outline: 'none'
            }}
          />
        </div>

        {/* Test Toggle Switch */}
        <div className={styles.toggleGroup}>
          <div className={styles.toggleLabel}>Modalità Avanzata (Toggle Test):</div>
          <label className={styles.toggle}>
            <input type="checkbox" />
            <span className={styles.slider}></span>
          </label>
          <div className={styles.toggleStatus}>Disattivata</div>
        </div>

        {/* Test Messaggi di Stato */}
        <div className={`${styles.messaggioStato} ${styles.messaggioSuccesso}`}>
          ✅ Messaggio di successo - Test completato con successo!
        </div>

        <div className={`${styles.messaggioStato} ${styles.messaggioErrore}`}>
          ❌ Messaggio di errore - Test per verifica stili errore!
        </div>

        {/* Test Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button className={styles.submitButton}>
            Button Primario
          </button>
          <button className={styles.buttonSecondary}>
            Button Secondario
          </button>
          <button className={styles.buttonCancel}>
            Button Annulla
          </button>
          <button className={styles.buttonDanger}>
            Button Pericolo
          </button>
        </div>

        {/* Test Buttons Disabled */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className={styles.submitButton} disabled>
            Primario Disabled
          </button>
          <button className={styles.buttonSecondary} disabled>
            Secondario Disabled
          </button>
        </div>

        {/* Test Table */}
        <div className={styles.attivitaRecenti} style={{ marginTop: '30px' }}>
          <h3>Tabella Test (Table Test)</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Colonna 1</th>
                <th>Colonna 2</th>
                <th>Colonna 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Dato 1</td>
                <td>Dato 2</td>
                <td>Dato 3</td>
              </tr>
              <tr>
                <td>Dato A</td>
                <td>Dato B</td>
                <td>Dato C</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Test Eliminazione Account */}
        <div className={styles.eliminazioneAvviso}>
          <h3>Test Avviso Eliminazione</h3>
          <p>
            Questo è un test per verificare che gli avvisi di eliminazione
            siano correttamente stilizzati in dark mode.
          </p>
        </div>
      </div>

      {/* Informazioni Debug */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        border: isDarkMode ? '1px solid #333' : '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: isDarkMode ? '#2a2a2a' : '#f9f9f9',
        fontSize: '12px',
        color: isDarkMode ? '#e0e0e0' : '#333'
      }}>
        <h4>Debug Info:</h4>
        <p>Body class: {isDarkMode ? 'dark-mode' : 'light-mode'}</p>
        <p>Tutti gli elementi sopra dovrebbero essere correttamente stilizzati in entrambe le modalità.</p>
        <p>Se vedi elementi bianchi o poco visibili in dark mode, c'è ancora un bug da sistemare!</p>
      </div>
    </div>
  );
};

export default DarkModeBugTest; 