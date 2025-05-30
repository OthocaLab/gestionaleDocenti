import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import GestioneOrario from '../components/GestioneOrario';
import ImportaOrario from '../components/ImportaOrario';
import DashboardHome from '../components/DashboardHome';
import styles from '../styles/Dashboard.module.css';
import GestioneDocenti from '../components/GestioneDocenti';
import GestioneAssenze from '../components/GestioneAssenze';
import RecuperoOre from '../components/RecuperoOre';
import ImportaDati from '../components/ImportaDati';
import GestioneDidattica from '../components/GestioneDidattica';
import GestioneSostituzioni from '../components/GestioneSostituzioni';
import ElencoPianificazioneSostituzioni from '../components/ElencoPianificazioneSostituzioni';
import ImpostazioniUtente from '../components/ImpostazioniUtente';

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

  // Set active tab based on query parameter
  useEffect(() => {
    if (router.query.tab) {
      if (router.query.tab === 'inserisciAssenze' || 
          router.query.tab === 'dettaglioAssenza' || 
          router.query.tab === 'modificaAssenza') {
        setActiveTab('assenze');
      } else {
        setActiveTab(router.query.tab);
      }
    }
  }, [router.query]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    router.push({
      pathname: '/dashboard',
      query: { tab }
    }, undefined, { shallow: true });
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Verifica se l'utente ha i permessi per accedere alla gestione assenze
  const canManageAssenze = () => {
    if (!user) return false;
    return ['admin', 'vicepresidenza', 'ufficioPersonale'].includes(user.ruolo);
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
          <img src="/img/logo.png" alt="Logo" className={styles.logoImg} />
        </div>
        <div className={styles.pageTitle}>
          {activeTab === 'dashboard' && "Dashboard"}
          {activeTab === 'orario' && "Orari Classi"}
          {activeTab === 'sostituzioni' && "Gestione Sostituzioni"}
          {activeTab === 'pianificazioneSostituzioni' && "Pianificazione Sostituzioni"}
          {activeTab === 'docenti' && "Gestione Docenti"}
          {activeTab === 'didattica' && "Gestione Didattica"}
          {activeTab === 'importa' && "Importa Dati"}
          {activeTab === 'report' && "Report"}
          {activeTab === 'assenze' && "Gestione Assenze"}
          {activeTab === 'recupero' && "Gestione Recupero Ore"}
          {activeTab === 'impostazioni' && "Impostazioni Utente"}
         
        </div>
        <div className={styles.userInfo}>
          <div className={styles.notifications}>
            <div className={styles.notificationIcon}>🔔</div>
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
              <a 
                href="#" 
                className={activeTab === 'dashboard' ? styles.active : ''} 
                onClick={() => handleTabChange('dashboard')}
              >
                <span className={styles.icon}>🏠</span>
                <span className={styles.label}>Dashboard</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === 'docenti' ? styles.active : ''} 
                onClick={() => handleTabChange('docenti')}
              >
                <span className={styles.icon}>👨‍🏫</span>
                <span className={styles.label}>Elenco Docenti</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === 'sostituzioni' ? styles.active : ''} 
                onClick={() => handleTabChange('sostituzioni')}
              >
                <span className={styles.icon}>🔄</span>
                <span className={styles.label}>Gestione Sostituzioni</span>
              </a>
            </li>
            <li>
              <a 
                href="#" 
                className={activeTab === 'pianificazioneSostituzioni' ? styles.active : ''} 
                onClick={() => handleTabChange('pianificazioneSostituzioni')}
              >
                <span className={styles.icon}>📅</span>
                <span className={styles.label}>Calendario Sostituzioni</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeTab === 'orario' ? styles.active : ''} onClick={() => setActiveTab('orario')}>
                <span className={styles.icon}>🕒</span>
                <span className={styles.label}>Orari Scolastici</span>
              </a>
            </li>
            {canManageAssenze() && (
              <li>
                <a href="#" className={activeTab === 'assenze' ? styles.active : ''} onClick={() => setActiveTab('assenze')}>
                  <span className={styles.icon}>📅</span>
                  <span className={styles.label}>Gestione Assenze</span>
                </a>
              </li>
            )}
             <li>
              <a 
                href="#" 
                className={activeTab === 'didattica' ? styles.active : ''} 
                onClick={() => setActiveTab('didattica')}
              >
                <span className={styles.icon}>📚</span>
                <span className={styles.label}>Gestione Didattica</span>
              </a>
            </li>
            <li>
              <a href="#" className={activeTab === 'recupero' ? styles.active : ''} onClick={() => setActiveTab('recupero')}>
                <span className={styles.icon}>⏱️</span>
                <span className={styles.label}>Recupero Ore</span>
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
           
            <li>
              <a href="#" className={activeTab === 'impostazioni' ? styles.active : ''} onClick={() => setActiveTab('impostazioni')}>
                <span className={styles.icon}>⚙️</span>
                <span className={styles.label}>Impostazioni Utente</span>
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
              <GestioneSostituzioni />
            </div>
          )}

          {activeTab === 'pianificazioneSostituzioni' && (
            <div>
              <ElencoPianificazioneSostituzioni />
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
          
          {activeTab === 'assenze' && (
            <GestioneAssenze />
          )}

          {activeTab === 'importa' && (
            <div>
              <ImportaDati />
            </div>
          )}

          {activeTab === 'report' && (
            <div>
              <h2>Report</h2>
              <p>Qui potrai generare report sulle sostituzioni e le ore da recuperare.</p>
              {/* Contenuto della sezione report */}
            </div>
          )}

          {activeTab === 'recupero' && (
            <div>
              <RecuperoOre />
            </div>
          )}
          
          {activeTab === 'didattica' && (
            <div>
              <GestioneDidattica />
            </div>
          )}

          {activeTab === 'impostazioni' && (
            <div>
              <ImpostazioniUtente />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;