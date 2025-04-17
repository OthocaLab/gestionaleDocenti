import { useState } from 'react';
import styles from '../styles/ImportaDati.module.css';
import ImportaOrario from './ImportaOrario';
import GestioneMaterie from './GestioneMaterie';
import GestioneClassi from './GestioneClassi';
import GestioneClassiInsegnamento from './GestioneClassiInsegnamento';

const ImportaDati = () => {
  const [activeTab, setActiveTab] = useState('orario');

  return (
    <div className={styles.container}>
      <h2>Importa Dati</h2>
      <p>Qui potrai importare l'orario dei docenti e le assenze.</p>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'orario' ? styles.active : ''}`}
          onClick={() => setActiveTab('orario')}
        >
          Importa Orario
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'materie' ? styles.active : ''}`}
          onClick={() => setActiveTab('materie')}
        >
          Gestione Materie
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'classi' ? styles.active : ''}`}
          onClick={() => setActiveTab('classi')}
        >
          Gestione Classi
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'classiInsegnamento' ? styles.active : ''}`}
          onClick={() => setActiveTab('classiInsegnamento')}
        >
          Classi Insegnamento
        </button>
      </div>
      
      <div className={styles.tabContent}>
        {activeTab === 'orario' && <ImportaOrario />}
        {activeTab === 'materie' && <GestioneMaterie />}
        {activeTab === 'classi' && <GestioneClassi />}
        {activeTab === 'classiInsegnamento' && <GestioneClassiInsegnamento />}
      </div>
    </div>
  );
};

export default ImportaDati;