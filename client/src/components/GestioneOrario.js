import { useState } from 'react';
import OrarioClasse from './OrarioClasse';
import OrarioDocente from './OrarioDocente';
import OrarioForm from './OrarioForm';
import styles from '../styles/Orario.module.css';

const GestioneOrario = () => {
  const [viewMode, setViewMode] = useState('classe');
  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    // Ricarica i dati dopo l'aggiunta di una lezione
    setShowForm(false);
  };

  return (
    <div className={styles.gestioneOrarioContainer}>
      <div className={styles.actionButtons}>
        <div className={styles.viewToggle}>
          <button
            className={viewMode === 'classe' ? styles.activeButton : ''}
            onClick={() => setViewMode('classe')}
          >
            Visualizza per Classe
          </button>
          <button
            className={viewMode === 'docente' ? styles.activeButton : ''}
            onClick={() => setViewMode('docente')}
          >
            Visualizza per Docente
          </button>
        </div>
        
        <button
          className={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Chiudi Form' : 'Aggiungi Lezione'}
        </button>
      </div>

      {showForm && (
        <div className={styles.formSection}>
          <OrarioForm onSuccess={handleFormSuccess} />
        </div>
      )}

      {viewMode === 'classe' ? <OrarioClasse /> : <OrarioDocente />}
    </div>
  );
};

export default GestioneOrario;