import { useState } from 'react';
import ImportaOrarioDocenti from '../components/ImportaOrarioDocenti';
import styles from '../styles/Orario.module.css';

const GestioneOrario = () => {
  const [activeTab, setActiveTab] = useState('importa');

  return (
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestione Orario</h1>
      </div>

      <div className={styles.tabContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'importa' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('importa')}
          >
            Importa Orario
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'visualizza' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('visualizza')}
          >
            Visualizza Orario
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'importa' && (
            <ImportaOrarioDocenti />
          )}
          {activeTab === 'visualizza' && (
            <div>
              <h3>Visualizzazione Orario</h3>
              <p>Seleziona un docente o una classe per visualizzare l'orario.</p>
              {/* Qui puoi aggiungere il componente per visualizzare l'orario */}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestioneOrario;