import React from 'react';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import styles from '../styles/DarkModeTest.module.css';

const DarkModeTest = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={styles.testContainer}>
      <div className={styles.header}>
        <h1>🌙 Test Dark Mode</h1>
        <ThemeToggle />
      </div>
      
      <div className={styles.statusCard}>
        <h2>Stato Attuale</h2>
        <p>Tema corrente: <strong>{isDarkMode ? 'Dark Mode 🌙' : 'Light Mode ☀️'}</strong></p>
        <p>Classe body: <code>{isDarkMode ? 'dark-mode' : 'light-mode'}</code></p>
      </div>

      <div className={styles.componentsGrid}>
        {/* Card di test */}
        <div className={styles.testCard}>
          <h3>Card Standard</h3>
          <p>Questo è un esempio di card con testo normale.</p>
          <button className={styles.primaryButton}>Pulsante Primario</button>
          <button className={styles.secondaryButton}>Pulsante Secondario</button>
        </div>

        {/* Form di test */}
        <div className={styles.testCard}>
          <h3>Elementi Form</h3>
          <div className={styles.formGroup}>
            <label htmlFor="testInput">Input di test:</label>
            <input 
              id="testInput" 
              type="text" 
              placeholder="Scrivi qualcosa..." 
              className={styles.input}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="testSelect">Select di test:</label>
            <select id="testSelect" className={styles.select}>
              <option>Opzione 1</option>
              <option>Opzione 2</option>
              <option>Opzione 3</option>
            </select>
          </div>
        </div>

        {/* Tabella di test */}
        <div className={styles.testCard}>
          <h3>Tabella</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Ruolo</th>
                <th>Stato</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Mario Rossi</td>
                <td>Docente</td>
                <td><span className={styles.badge}>Attivo</span></td>
              </tr>
              <tr>
                <td>Anna Verdi</td>
                <td>Vicepresidenza</td>
                <td><span className={styles.badge}>Attivo</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Messaggi di stato */}
        <div className={styles.testCard}>
          <h3>Messaggi di Stato</h3>
          <div className={styles.successMessage}>
            ✅ Messaggio di successo
          </div>
          <div className={styles.errorMessage}>
            ❌ Messaggio di errore
          </div>
          <div className={styles.warningMessage}>
            ⚠️ Messaggio di avviso
          </div>
          <div className={styles.infoMessage}>
            ℹ️ Messaggio informativo
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <p>🎨 Dark Mode implementata con successo!</p>
        <p>Tutti i componenti supportano il cambio di tema automatico.</p>
      </div>
    </div>
  );
};

export default DarkModeTest; 