import React, { useState, useEffect } from 'react';
import styles from '../styles/RecuperoOre.module.css';
import axios from 'axios';
import { getAllDocenti, updateDocente } from '../services/docenteService';
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
  const [showModal, setShowModal] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState(null);
  const [oreRecupero, setOreRecupero] = useState(0);
  const [notaRecupero, setNotaRecupero] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchDocenti();
  }, []);

  const fetchDocenti = async () => {
    try {
      setLoading(true);
      const response = await getAllDocenti();
      const docentiData = Array.isArray(response.data) ? response.data : [];
      
      // Se non ci sono dati, usa dati di esempio
      if (docentiData.length === 0) {
        console.warn('Nessun docente trovato, verifica la connessione al server');
        setError('Nessun docente trovato. Verifica la connessione al server.');
      } else {
        setDocentiNonFiltrati(docentiData);
        setDocenti(docentiData);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Errore nel caricamento dei docenti:", err);
      setError('Errore nel caricamento dei docenti. Verifica la connessione al server.');
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
          (c.codiceClasse?.toLowerCase().includes(classeLower) || 
           c.nome?.toLowerCase().includes(classeLower))
        )
      );
    }
    
    // Filtra per materia
    if (filtri.materia !== '') {
      const materiaLower = filtri.materia.toLowerCase();
      docentiFiltered = docentiFiltered.filter(docente => 
        docente.classiInsegnamento?.some(c => 
          (c.materia?.nome?.toLowerCase().includes(materiaLower) ||
           c.materia?.descrizione?.toLowerCase().includes(materiaLower) ||
           c.descrizione?.toLowerCase().includes(materiaLower))
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

  const handleGestisciClick = (docente) => {
    setSelectedDocente(docente);
    setOreRecupero(docente.oreRecupero || 0);
    setNotaRecupero(docente.notaRecupero || '');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedDocente(null);
    setOreRecupero(0);
    setNotaRecupero('');
  };

  const handleSaveOreRecupero = async () => {
    if (!selectedDocente) return;

    try {
      setLoading(true);
      
      // Aggiorna il docente selezionato con le nuove ore
      const docenteAggiornato = {
        ...selectedDocente,
        oreRecupero: parseInt(oreRecupero),
        notaRecupero: notaRecupero
      };
      
      // Chiama il servizio per aggiornare il docente
      await updateDocente(selectedDocente._id, docenteAggiornato);
      
      // Aggiorna la lista dei docenti
      await fetchDocenti();
      
      // Chiudi il modale e mostra messaggio di successo
      setShowModal(false);
      setSuccessMessage('Ore di recupero aggiornate con successo!');
      
      // Nascondi il messaggio dopo 3 secondi
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      setLoading(false);
    } catch (err) {
      setError('Errore durante l\'aggiornamento delle ore di recupero');
      setLoading(false);
    }
  };

  if (loading && !showModal) {
    return <div>Caricamento in corso...</div>;
  }

  if (error && !showModal && docenti.length === 0) {
    return <div className="text-red-500">{error}</div>;
  }

  // Funzione di utilità per renderizzare le classi di insegnamento
  const renderClassiInsegnamento = (docente) => {
    if (!docente.classiInsegnamento || docente.classiInsegnamento.length === 0) {
      return <div>-</div>;
    }

    return (
      <>
        {docente.classiInsegnamento.map(classe => (
          <div key={classe._id || `classe-${Math.random()}`} className={styles.classeInsegnamento}>
            <span className={styles.classeNome}>{classe.codiceClasse || classe.nome || '-'}</span>
            {(classe.materia || classe.descrizione) && (
              <span className={styles.materiaTag}>
                {classe.materia?.nome || classe.materia?.descrizione || classe.descrizione || '-'}
              </span>
            )}
          </div>
        ))}
      </>
    );
  };

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

        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

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
          ) : error && docenti.length === 0 ? (
            <div className={styles.errorState}>
              <p>{error}</p>
            </div>
          ) : (
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Classi di insegnamento</th>
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
                      <td>
                        {renderClassiInsegnamento(docente)}
                      </td>
                      <td>
                        <span className={`${styles.oreBadge} ${docente.oreRecupero > 0 ? styles.pending : styles.completed}`}>
                          {docente.oreRecupero || 0}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={styles.actionButton}
                          onClick={() => handleGestisciClick(docente)}
                        >
                          Gestisci
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
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

      {/* Modal per gestire le ore di recupero */}
      {showModal && selectedDocente && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Gestione Ore di Recupero</h2>
              <button 
                className={styles.closeButton}
                onClick={handleModalClose}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalInfo}>
                <p className={styles.docenteNomeModal}>
                  {selectedDocente.cognome} {selectedDocente.nome}
                </p>
                <p className={styles.docenteEmailModal}>
                  {selectedDocente.email}
                </p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="oreRecupero">Ore da recuperare:</label>
                <input
                  type="number"
                  id="oreRecupero"
                  value={oreRecupero}
                  onChange={(e) => setOreRecupero(e.target.value)}
                  className={styles.textInput}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="notaRecupero">Note:</label>
                <textarea
                  id="notaRecupero"
                  value={notaRecupero}
                  onChange={(e) => setNotaRecupero(e.target.value)}
                  className={styles.textArea}
                  rows="3"
                  placeholder="Inserisci eventuali note sul recupero..."
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={handleModalClose}
              >
                Annulla
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSaveOreRecupero}
                disabled={loading}
              >
                {loading ? 'Salvataggio...' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecuperoOre;