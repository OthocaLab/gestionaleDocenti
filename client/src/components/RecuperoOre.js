import React, { useState, useEffect } from 'react';
import styles from '../styles/RecuperoOre.module.css';
import axios from 'axios';
import { getAllDocenti } from '../services/docenteService';
// Rimuovi temporaneamente l'importazione di framer-motion
// import { motion } from 'framer-motion';

const RecuperoOre = () => {
  const [docenti, setDocenti] = useState([]);
  const [docentiNonFiltrati, setDocentiNonFiltrati] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtri, setFiltri] = useState({
    minOre: '',
    maxOre: '',
    classe: '',
    materia: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDocenti();
  }, []);

  const fetchDocenti = async () => {
    try {
      setLoading(true);
      const response = await getAllDocenti();
      const docentiData = Array.isArray(response.data) ? response.data : [];
      setDocentiNonFiltrati(docentiData);
      setDocenti(docentiData);
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const applicaFiltri = () => {
    let docentiFiltered = [...docentiNonFiltrati];
    
    // Filtra per termine di ricerca
    if (searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase();
      docentiFiltered = docentiFiltered.filter(docente => 
        docente.nome.toLowerCase().includes(searchLower) || 
        docente.cognome.toLowerCase().includes(searchLower) || 
        docente.email.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtra per range di ore
    if (filtri.minOre !== '') {
      docentiFiltered = docentiFiltered.filter(docente => 
        (docente.oreRecupero || 0) >= parseInt(filtri.minOre)
      );
    }
    
    if (filtri.maxOre !== '') {
      docentiFiltered = docentiFiltered.filter(docente => 
        (docente.oreRecupero || 0) <= parseInt(filtri.maxOre)
      );
    }
    
    // Filtra per classe
    if (filtri.classe !== '') {
      const classeLower = filtri.classe.toLowerCase();
      docentiFiltered = docentiFiltered.filter(docente => 
        docente.classiInsegnamento?.some(c => 
          c.nome.toLowerCase().includes(classeLower)
        )
      );
    }
    
    // Filtra per materia
    if (filtri.materia !== '') {
      const materiaLower = filtri.materia.toLowerCase();
      docentiFiltered = docentiFiltered.filter(docente => 
        docente.classiInsegnamento?.some(c => 
          c.materia?.nome.toLowerCase().includes(materiaLower)
        )
      );
    }
    
    setDocenti(docentiFiltered);
  };

  const azzeraFiltri = () => {
    setFiltri({
      minOre: '',
      maxOre: '',
      classe: '',
      materia: ''
    });
    setSearchTerm('');
    setDocenti(docentiNonFiltrati);
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
        </div>

        {/* Stats Cards in riga */}
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>⏱️</div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>
                {docenti.reduce((total, doc) => total + (doc.oreRecupero || 0), 0)}
              </span>
              <span className={styles.statLabel}>Ore</span>
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

        {/* Sezione Filtri Compatta */}
        <div className={styles.filterContainer}>
          <div className={styles.searchAndFilters}>
            <div className={styles.searchWrapper}>
              <input
                type="text"
                placeholder="Cerca docente..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
              />
              <span className={styles.searchIcon}>🔍</span>
            </div>
            
            <div className={styles.filtersRow}>
              <div className={styles.filterItem}>
                <input
                  type="number"
                  name="minOre"
                  value={filtri.minOre}
                  onChange={handleFiltroChange}
                  placeholder="Min ore"
                  className={styles.smallInput}
                  min="0"
                />
              </div>
              <div className={styles.filterItem}>
                <input
                  type="number"
                  name="maxOre"
                  value={filtri.maxOre}
                  onChange={handleFiltroChange}
                  placeholder="Max ore"
                  className={styles.smallInput}
                  min="0"
                />
              </div>
              <div className={styles.filterItem}>
                <input
                  type="text"
                  name="classe"
                  value={filtri.classe}
                  onChange={handleFiltroChange}
                  placeholder="Classe"
                  className={styles.smallInput}
                />
              </div>
              <div className={styles.filterItem}>
                <input
                  type="text"
                  name="materia"
                  value={filtri.materia}
                  onChange={handleFiltroChange}
                  placeholder="Materia"
                  className={styles.smallInput}
                />
              </div>
              <div className={styles.filterActions}>
                <button 
                  onClick={applicaFiltri} 
                  className={styles.smallButton}
                >
                  Filtra
                </button>
                <button 
                  onClick={azzeraFiltri} 
                  className={styles.smallButton}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabella Docenti Compatta */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner}></div>
              <p>Caricamento...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p>{error}</p>
            </div>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Classi</th>
                  <th>Materie</th>
                  <th>Ore</th>
                  <th></th>
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
                          </div>
                        </div>
                      </td>
                      <td>{docente.classiInsegnamento?.map(c => c.nome).join(', ') || '-'}</td>
                      <td>{docente.classiInsegnamento?.map(c => c.materia?.nome).join(', ') || '-'}</td>
                      <td>
                        <span className={`${styles.oreBadge} ${docente.oreRecupero > 0 ? styles.pending : styles.completed}`}>
                          {docente.oreRecupero || 0}
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