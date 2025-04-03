import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import GestioneOrario from '../components/GestioneOrario';
import ImportaOrario from '../components/ImportaOrario';
import DashboardHome from '../components/DashboardHome';
import styles from '../styles/Dashboard.module.css';
import GestioneDocenti from '../components/GestioneDocenti';

const Dashboard = () => {
  const { isAuthenticated, isLoading, user, logout } = useContext(AuthContext);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

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
          <div className={styles.logoIcon}>OL</div>
          <h1>Othoca Lab</h1>
        </div>
        <div className={styles.pageTitle}>
          {activeTab === 'dashboard' && "Dashboard"}
          {activeTab === 'orario' && "Orari Classi"}
          {activeTab === 'sostituzioni' && "Gestione Sostituzioni"}
          {activeTab === 'docenti' && "Gestione Docenti"}
          {activeTab === 'importa' && "Importa Dati"}
          {activeTab === 'report' && "Report"}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.notifications}>
            <span className={styles.notificationIcon}>🔔</span>
          </div>
          <div className={styles.userAvatar}>
            <div className={styles.avatarCircle}>{user?.nome?.charAt(0) || 'U'}</div>
          </div>
        </div>
      </header>

      <div className={styles.content}>
        <nav className={styles.sidebar}>
          <ul>
            <li>
              <a href="#" className={activeTab === 'dashboard' ? styles.active : ''} onClick={() => setActiveTab('dashboard')}>
                <span className={styles.icon}>🏠</span>
                <span className={styles.label}>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeTab === 'docenti' ? styles.active : ''} onClick={() => setActiveTab('docenti')}>
                <span className={styles.icon}>👨‍🏫</span>
                <span className={styles.label}>Elenco Docenti</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeTab === 'sostituzioni' ? styles.active : ''} onClick={() => setActiveTab('sostituzioni')}>
                <span className={styles.icon}>🔄</span>
                <span className={styles.label}>Sostituzioni</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeTab === 'orario' ? styles.active : ''} onClick={() => setActiveTab('orario')}>
                <span className={styles.icon}>🕒</span>
                <span className={styles.label}>Orari Scolastici</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeTab === 'importa' ? styles.active : ''} onClick={() => setActiveTab('importa')}>
                <span className={styles.icon}>📥</span>
                <span className={styles.label}>Importa Dati</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeTab === 'report' ? styles.active : ''} onClick={() => setActiveTab('report')}>
                <span className={styles.icon}>📊</span>
                <span className={styles.label}>Report</span>
              </a>
            </li>
            <li className={styles.logoutItem}>
              <a href="#" onClick={handleLogout}>
                <span className={styles.icon}>🚪</span>
                <span className={styles.label}>Logout</span>
              </a>
            </li>
          </ul>
        </nav>

        <main className={styles.mainContent}>
          {activeTab === 'dashboard' && (
            <DashboardHome />
          )}

          {activeTab === 'sostituzioni' && (
            <div>
              <h2>Gestione Sostituzioni</h2>
              <p>Qui potrai gestire le sostituzioni dei docenti assenti.</p>
              {/* Contenuto della sezione sostituzioni */}
            </div>
          )}

          {activeTab === 'docenti' && (
            <div>
              <GestioneDocenti />
            </div>
          )}

          {activeTab === 'orario' && (
            <div>
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