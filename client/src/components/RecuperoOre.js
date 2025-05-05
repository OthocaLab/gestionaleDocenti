import React, { useState, useEffect } from 'react';
import styles from '../styles/RecuperoOre.module.css';
import axios from 'axios';
import { getAllDocenti } from '../services/docenteService';

const RecuperoOre = () => {
  const [docenti, setDocenti] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtri, setFiltri] = useState({
    minOre: '',
    maxOre: '',
    classe: '',
    materia: ''
  });

  useEffect(() => {
    fetchDocenti();
  }, []);

  const fetchDocenti = async () => {
    try {
      setLoading(true);
      const response = await getAllDocenti();
      setDocenti(Array.isArray(response.data) ? response.data : []);
      setLoading(false);
    } catch (err) {
      setError('Errore nel caricamento dei docenti');
      setLoading(false);
    }
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltri(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applicaFiltri = () => {
    fetchDocenti();
  };

  const azzeraFiltri = () => {
    setFiltri({
      minOre: '',
      maxOre: '',
      classe: '',
      materia: ''
    });
    fetchDocenti();
  };

  if (loading) {
    return <div>Caricamento in corso...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.pageHeader}>
          <h1 className={styles.mainTitle}>Gestione Recupero Ore</h1>
          <p className={styles.subtitle}>Monitora e gestisci le ore di recupero dei docenti</p>
        </div>

        {/* Stats Cards in griglia 2x2 */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {docenti.reduce((total, doc) => total + (doc.oreRecupero || 0), 0)}
              </span>
              <span className={styles.statLabel}>Ore da Recuperare</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{docenti.length}</span>
              <span className={styles.statLabel}>Docenti</span>
            </div>
          </div>
        </div>

        {/* Sezione Filtri */}
        <div className={styles.filterContainer}>
          <div className={styles.searchSection}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Cerca docente..."
                className={styles.searchInput}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
          </div>

          <div className={styles.filtersGrid}>
            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Range Ore</label>
              <div className={styles.rangeInputs}>
                <input
                  type="number"
                  name="minOre"
                  value={filtri.minOre}
                  onChange={handleFiltroChange}
                  placeholder="Min"
                  className={styles.numberInput}
                  min="0"
                />
                <span className={styles.rangeSeparator}>-</span>
                <input
                  type="number"
                  name="maxOre"
                  value={filtri.maxOre}
                  onChange={handleFiltroChange}
                  placeholder="Max"
                  className={styles.numberInput}
                  min="0"
                />
              </div>
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Classe</label>
              <input
                type="text"
                name="classe"
                value={filtri.classe}
                onChange={handleFiltroChange}
                placeholder="es. 1A"
                className={styles.input}
              />
            </div>

            <div className={styles.filterItem}>
              <label className={styles.filterLabel}>Materia</label>
              <input
                type="text"
                name="materia"
                value={filtri.materia}
                onChange={handleFiltroChange}
                placeholder="es. Matematica"
                className={styles.input}
              />
            </div>

            <div className={styles.filterActions}>
              <button onClick={applicaFiltri} className={styles.primaryButton}>
                Applica Filtri
              </button>
              <button onClick={azzeraFiltri} className={styles.secondaryButton}>
                Azzera
              </button>
            </div>
          </div>
        </div>

        {/* Tabella Docenti */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Caricamento dati...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <span className={styles.errorIcon}>⚠️</span>
              <p>{error}</p>
            </div>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Classi</th>
                  <th>Materie</th>
                  <th>Ore da Recuperare</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {docenti.length > 0 ? (
                  docenti.map((docente) => (
                    <tr key={docente._id}>
                      <td>
                        <div className={styles.docenteInfo}>
                          <div className={styles.avatarCircle}>
                            {docente.nome.charAt(0)}{docente.cognome.charAt(0)}
                          </div>
                          <div className={styles.docenteDetails}>
                            <span className={styles.docenteName}>
                              {docente.cognome} {docente.nome}
                            </span>
                            <span className={styles.docenteEmail}>
                              {docente.email}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>{docente.classiInsegnamento?.map(c => c.nome).join(', ') || '-'}</td>
                      <td>{docente.classiInsegnamento?.map(c => c.materia?.nome).join(', ') || '-'}</td>
                      <td>
                        <span className={`${styles.oreBadge} ${docente.oreRecupero > 0 ? styles.pending : styles.completed}`}>
                          {docente.oreRecupero || 0} ore
                        </span>
                      </td>
                      <td>
                        <button className={styles.actionButton}>
                          Gestisci
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5">
                      <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>📊</span>
                        <p>Nessun docente trovato</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecuperoOre;