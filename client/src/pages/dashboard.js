import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import GestioneOrario from '../components/GestioneOrario';
import ImportaOrario from '../components/ImportaOrario';
import styles from '../styles/Dashboard.module.css';

const Dashboard = () => {
  const { isAuthenticated, isLoading, user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('sostituzioni');

  // Protezione della rotta
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Se non è autenticato, non mostrare nulla (il redirect avverrà nell'useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <h1>Othoca Lab</h1>
        </div>
        <div className={styles.userInfo}>
          <span>Benvenuto, {user?.nome || 'Utente'}</span>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      <div className={styles.content}>
        <nav className={styles.sidebar}>
          <ul>
            <li 
              className={activeTab === 'sostituzioni' ? styles.active : ''}
              onClick={() => setActiveTab('sostituzioni')}
            >
              Sostituzioni
            </li>
            <li 
              className={activeTab === 'docenti' ? styles.active : ''}
              onClick={() => setActiveTab('docenti')}
            >
              Gestione Docenti
            </li>
            <li 
              className={activeTab === 'orario' ? styles.active : ''}
              onClick={() => setActiveTab('orario')}
            >
              Orario Scolastico
            </li>
            <li 
              className={activeTab === 'importa' ? styles.active : ''}
              onClick={() => setActiveTab('importa')}
            >
              Importa Dati
            </li>
            <li 
              className={activeTab === 'report' ? styles.active : ''}
              onClick={() => setActiveTab('report')}
            >
              Report
            </li>
          </ul>
        </nav>

        <main className={styles.mainContent}>
          {activeTab === 'sostituzioni' && (
            <div>
              <h2>Gestione Sostituzioni</h2>
              <p>Qui potrai gestire le sostituzioni dei docenti assenti.</p>
              {/* Contenuto della sezione sostituzioni */}
            </div>
          )}

          {activeTab === 'docenti' && (
            <div>
              <h2>Gestione Docenti</h2>
              <p>Qui potrai gestire i docenti e le loro ore da recuperare.</p>
              {/* Contenuto della sezione docenti */}
            </div>
          )}

          {activeTab === 'orario' && (
            <div>
              <h2>Orario Scolastico</h2>
              <p>Visualizza e gestisci l'orario scolastico per classi e docenti.</p>
              <GestioneOrario />
            </div>
          )}

          {activeTab === 'importa' && (
            <div>
              <h2>Importa Dati</h2>
              <p>Qui potrai importare l'orario dei docenti e le assenze.</p>
              <ImportaOrario />
            </div>
          )}

          {activeTab === 'report' && (
            <div>
              <h2>Report</h2>
              <p>Qui potrai generare report sulle sostituzioni e le ore da recuperare.</p>
              {/* Contenuto della sezione report */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;