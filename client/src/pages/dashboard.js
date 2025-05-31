import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
import ThemeToggle from '../components/ThemeToggle';

const Dashboard = () => {
  const { isAuthenticated, isLoading, user, logout } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Assicuriamo che il componente sia renderizzato solo lato client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Protezione della rotta
  useEffect(() => {
    if (!isLoading && !isAuthenticated && isClient) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router, isClient]);

  // Set active tab based on query parameter
  useEffect(() => {
    if (router.query.tab && isClient) {
      if (router.query.tab === 'inserisciAssenze' || 
          router.query.tab === 'dettaglioAssenza' || 
          router.query.tab === 'modificaAssenza') {
        setActiveTab('assenze');
      } else {
        setActiveTab(router.query.tab);
      }
    }
  }, [router.query, isClient]);

  // Chiudi il menu utente quando si clicca fuori
  useEffect(() => {
    if (!isClient) return;
    
    const handleClickOutside = (event) => {
      const userMenuContainer = document.querySelector(`[class*="userMenuContainer"]`);
      if (showUserMenu && userMenuContainer && !userMenuContainer.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, isClient]);

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

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleUserMenuItemClick = (action) => {
    setShowUserMenu(false);
    if (action === 'impostazioni') {
      setActiveTab('impostazioni');
      router.push({
        pathname: '/dashboard',
        query: { tab: 'impostazioni' }
      }, undefined, { shallow: true });
    } else if (action === 'logout') {
      handleLogout();
    }
  };

  // Verifica se l'utente ha i permessi per accedere alla gestione assenze
  const canManageAssenze = () => {
    if (!user) return false;
    return ['admin', 'vicepresidenza', 'ufficioPersonale'].includes(user.ruolo);
  };

  if (isLoading || !isClient) {
    return <LoadingSpinner />;
  }

  // Se non è autenticato, non mostrare nulla (il redirect avverrà nell'useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <style jsx>{`
        .dashboard-container { display: flex; flex-direction: column; min-height: 100vh; background-color: #f5f7fa; }
        .header { display: flex; justify-content: space-between; align-items: center; padding: 0 30px; background-color: #ffffff; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05); height: 70px; }
        .user-menu-container { position: relative; }
        .user-avatar { width: 40px; height: 40px; cursor: pointer; }
        .avatar-circle { width: 100%; height: 100%; background-color: #3498db; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; }
        .user-dropdown-menu { position: absolute; top: 50px; right: 0; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); min-width: 220px; z-index: 1000; }
        .user-menu-item { display: flex; align-items: center; padding: 12px 20px; cursor: pointer; color: #555; }
        .user-menu-item:hover { background-color: #f5f7fa; color: #e91e63; }
        .sidebar { width: 240px; background-color: #ffffff; padding: 20px 0; }
        .content { display: flex; flex: 1; }
        .main-content { flex: 1; padding: 20px 30px; }
        .active { background-color: #f5f7fa; color: #e91e63; }
      `}</style>
      <div className={styles?.dashboardContainer || 'dashboard-container'}>
        <header className={styles?.header || 'header'}>
          <div className={styles?.logo || 'logo'}>
            <img src="/img/logo.png" alt="Logo" className={styles?.logoImg || 'logo-img'} />
          </div>
          <div className={styles?.pageTitle || 'page-title'}>
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
          <div className={styles?.userInfo || 'user-info'}>
            <div className={styles?.notifications || 'notifications'}>
              <div className={styles?.notificationIcon || 'notification-icon'}>🔔</div>
            </div>
            <div className={styles?.userMenuContainer || 'user-menu-container'}>
              <div className={styles?.userAvatar || 'user-avatar'} onClick={toggleUserMenu}>
                <div className={styles?.avatarCircle || 'avatar-circle'}>{user?.nome?.charAt(0) || 'U'}</div>
              </div>
              {showUserMenu && (
                <div className={styles?.userDropdownMenu || 'user-dropdown-menu'}>
                  <div className={styles?.userMenuHeader || 'user-menu-header'}>
                    <div className={styles?.userMenuName || 'user-menu-name'}>{user?.nome} {user?.cognome}</div>
                    <div className={styles?.userMenuRole || 'user-menu-role'}>{user?.ruolo}</div>
                  </div>
                  <div className={styles?.userMenuDivider || 'user-menu-divider'}></div>
                  <div className={styles?.userMenuItem || 'user-menu-item'}>
                    <span className={styles?.userMenuIcon || 'user-menu-icon'}>🎨</span>
                    <span style={{ marginRight: '10px' }}>Tema</span>
                    <ThemeToggle />
                  </div>
                  <div className={styles?.userMenuDivider || 'user-menu-divider'}></div>
                  <div 
                    className={styles?.userMenuItem || 'user-menu-item'}
                    onClick={() => handleUserMenuItemClick('impostazioni')}
                  >
                    <span className={styles?.userMenuIcon || 'user-menu-icon'}>⚙️</span>
                    <span>Impostazioni Utente</span>
                  </div>
                  <div 
                    className={styles?.userMenuItem || 'user-menu-item'}
                    onClick={() => handleUserMenuItemClick('logout')}
                  >
                    <span className={styles?.userMenuIcon || 'user-menu-icon'}>🚪</span>
                    <span>Logout</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className={styles?.content || 'content'}>
          <nav className={styles?.sidebar || 'sidebar'}>
            <ul>
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'dashboard' ? (styles?.active || 'active') : ''} 
                  onClick={() => handleTabChange('dashboard')}
                >
                  <span className={styles?.icon || 'icon'}>🏠</span>
                  <span className={styles?.label || 'label'}>Dashboard</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'docenti' ? (styles?.active || 'active') : ''} 
                  onClick={() => handleTabChange('docenti')}
                >
                  <span className={styles?.icon || 'icon'}>👨‍🏫</span>
                  <span className={styles?.label || 'label'}>Elenco Docenti</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'sostituzioni' ? (styles?.active || 'active') : ''} 
                  onClick={() => handleTabChange('sostituzioni')}
                >
                  <span className={styles?.icon || 'icon'}>🔄</span>
                  <span className={styles?.label || 'label'}>Gestione Sostituzioni</span>
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className={activeTab === 'pianificazioneSostituzioni' ? (styles?.active || 'active') : ''} 
                  onClick={() => handleTabChange('pianificazioneSostituzioni')}
                >
                  <span className={styles?.icon || 'icon'}>📅</span>
                  <span className={styles?.label || 'label'}>Calendario Sostituzioni</span>
                </a>
              </li>
              <li>
                <a href="#" className={activeTab === 'orario' ? (styles?.active || 'active') : ''} onClick={() => setActiveTab('orario')}>
                  <span className={styles?.icon || 'icon'}>🕒</span>
                  <span className={styles?.label || 'label'}>Orari Scolastici</span>
                </a>
              </li>
              {canManageAssenze() && (
                <li>
                  <a href="#" className={activeTab === 'assenze' ? (styles?.active || 'active') : ''} onClick={() => setActiveTab('assenze')}>
                    <span className={styles?.icon || 'icon'}>📅</span>
                    <span className={styles?.label || 'label'}>Gestione Assenze</span>
                  </a>
                </li>
              )}
               <li>
                <a 
                  href="#" 
                  className={activeTab === 'didattica' ? (styles?.active || 'active') : ''} 
                  onClick={() => setActiveTab('didattica')}
                >
                  <span className={styles?.icon || 'icon'}>📚</span>
                  <span className={styles?.label || 'label'}>Gestione Didattica</span>
                </a>
              </li>
              <li>
                <a href="#" className={activeTab === 'recupero' ? (styles?.active || 'active') : ''} onClick={() => setActiveTab('recupero')}>
                  <span className={styles?.icon || 'icon'}>⏱️</span>
                  <span className={styles?.label || 'label'}>Recupero Ore</span>
                </a>
              </li>
              <li>
                <a href="#" className={activeTab === 'importa' ? (styles?.active || 'active') : ''} onClick={() => setActiveTab('importa')}>
                  <span className={styles?.icon || 'icon'}>📥</span>
                  <span className={styles?.label || 'label'}>Importa Dati</span>
                </a>
              </li>
              <li>
                <a href="#" className={activeTab === 'report' ? (styles?.active || 'active') : ''} onClick={() => setActiveTab('report')}>
                  <span className={styles?.icon || 'icon'}>📊</span>
                  <span className={styles?.label || 'label'}>Report</span>
                </a>
              </li>
            </ul>
          </nav>

          <main className={styles?.mainContent || 'main-content'}>
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
    </>
  );
};

export default Dashboard;