import React from 'react';
import useCounterUpdates from '../hooks/useCounterUpdates';
import styles from '../styles/ContatoreDashboard.module.css';

const ContatoreDashboard = ({ docenteId = null }) => {
  const { 
    statistics, 
    loading, 
    error, 
    lastUpdate, 
    forceUpdate, 
    isStale 
  } = useCounterUpdates({
    docenteId,
    refreshInterval: 15000, // Aggiorna ogni 15 secondi
    enabled: true
  });

  if (loading && !statistics) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingCard}>
          <div className={styles.spinner}></div>
          <p>Caricamento statistiche...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>⚠️</span>
          <p>Errore nel caricamento: {error}</p>
          <button onClick={forceUpdate} className={styles.retryButton}>
            Riprova
          </button>
        </div>
      </div>
    );
  }

  const renderDocenteStats = () => {
    if (!docenteId || !statistics?.docente) return null;

    const { docente, statistiche } = statistics;
    
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>
            Statistiche per {docente.nome} {docente.cognome}
          </h3>
          <button 
            onClick={forceUpdate} 
            className={`${styles.refreshButton} ${isStale ? styles.stale : ''}`}
            title="Aggiorna statistiche"
          >
            🔄
          </button>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏰</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{docente.oreRecupero}</div>
              <div className={styles.statLabel}>Ore da Recuperare</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{statistiche.totalAssenze}</div>
              <div className={styles.statLabel}>Totale Assenze</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{statistiche.assenzeGiustificate}</div>
              <div className={styles.statLabel}>Giustificate</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>❌</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{statistiche.assenzeNonGiustificate}</div>
              <div className={styles.statLabel}>Non Giustificate</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderGeneralStats = () => {
    if (docenteId || !statistics?.statistiche) return null;

    const { statistiche, topDocentiRecupero } = statistics;
    
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>Statistiche Generali</h3>
          <button 
            onClick={forceUpdate} 
            className={`${styles.refreshButton} ${isStale ? styles.stale : ''}`}
            title="Aggiorna statistiche"
          >
            🔄
          </button>
        </div>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{statistiche.totalDocenti}</div>
              <div className={styles.statLabel}>Docenti Attivi</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏰</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{statistiche.docentiConOreRecupero}</div>
              <div className={styles.statLabel}>Con Ore da Recuperare</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{statistiche.totalAssenze}</div>
              <div className={styles.statLabel}>Totale Assenze</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>✅</div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{statistiche.assenzeGiustificate}</div>
              <div className={styles.statLabel}>Giustificate</div>
            </div>
          </div>
        </div>
        
        {topDocentiRecupero && topDocentiRecupero.length > 0 && (
          <div className={styles.topSection}>
            <h4 className={styles.subTitle}>Top Docenti - Ore da Recuperare</h4>
            <div className={styles.topList}>
              {topDocentiRecupero.map((docente, index) => (
                <div key={docente._id} className={styles.topItem}>
                  <span className={styles.topRank}>{index + 1}</span>
                  <span className={styles.topName}>
                    {docente.nome} {docente.cognome}
                  </span>
                  <span className={styles.topValue}>{docente.oreRecupero} ore</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {renderDocenteStats()}
      {renderGeneralStats()}
      
      {lastUpdate && (
        <div className={styles.footer}>
          <small className={styles.lastUpdate}>
            Ultimo aggiornamento: {lastUpdate.toLocaleTimeString()}
            {isStale && <span className={styles.staleIndicator}> (non aggiornato)</span>}
          </small>
        </div>
      )}
    </>
  );
};

export default ContatoreDashboard; 