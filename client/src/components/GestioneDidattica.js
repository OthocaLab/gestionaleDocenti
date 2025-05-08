import { useState } from 'react';
import GestioneClassi from './GestioneClassi';
import GestioneMaterie from './GestioneMaterie';
import styles from '../styles/GestioneDidattica.module.css';

const GestioneDidattica = () => {
  const [activeTab, setActiveTab] = useState('classi');

  return (
    <div className={styles.gestioneDidatticaContainer}>
      <div className={styles.tabsContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'classi' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('classi')}
        >
          Gestione Classi
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'materie' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('materie')}
        >
          Gestione Materie
        </button>
      </div>

      <div className={styles.tabContent}>
        {activeTab === 'classi' && <GestioneClassi />}
        {activeTab === 'materie' && <GestioneMaterie />}
      </div>
    </div>
  );
};

export default GestioneDidattica;