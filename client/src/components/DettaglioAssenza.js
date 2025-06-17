import { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/router';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import styles from '../styles/Inserimento.module.css';

const DettaglioAssenza = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const { id } = router.query;
  
  const [assenza, setAssenza] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (isAuthenticated && id) {
      fetchAssenza();
    }
  }, [isAuthenticated, id]);
  
  const fetchAssenza = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/assenze/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setAssenza(response.data.data);
    } catch (err) {
      console.error('Errore nel recupero dell\'assenza:', err);
      setError('Impossibile caricare i dati dell\'assenza. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Formatta la data
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
  };
  
  // Gestisce la modifica dell'assenza
  const handleEdit = () => {
    router.push(`/dashboard?tab=modificaAssenza&id=${id}`);
  };
  
  if (loading) {
    return <div className={styles.loadingContainer}>Caricamento in corso...</div>;
  }
  
  if (error) {
    return <div className={styles.errorContainer}>{error}</div>;
  }
  
  if (!assenza) {
    return <div className={styles.errorContainer}>Assenza non trovata</div>;
  }
  
  return (
    <div className={styles.componentContainer}>
      <div className={styles.headerActions}>
        <button 
          className={styles.backButton}
          onClick={() => router.push('/dashboard?tab=assenze')}
        >
          <span className={styles.backIcon}>←</span> Torna all'elenco
        </button>
        <h1 className={styles.title}>Dettaglio Assenza</h1>
      </div>
      
      <div className={styles.cardContainer}>
        <div className={styles.detailCard}>
          {/* Sezione Docente */}
          <div className={styles.detailSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>👤</span>
              Informazioni Docente
            </h2>
            
            {assenza.docente && (
              <div className={styles.selectedDocenteCard}>
                <div className={styles.docenteAvatarLarge}>
                  {assenza.docente.nome.charAt(0)}{assenza.docente.cognome.charAt(0)}
                </div>
                <div className={styles.selectedDocenteInfo}>
                  <h3>{assenza.docente.nome} {assenza.docente.cognome}</h3>
                  <p>{assenza.docente.email}</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Sezione Assenza */}
          <div className={styles.detailSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📝</span>
              Informazioni Assenza
            </h2>
            
            <div className={styles.detailGrid}>
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>
                  <span className={styles.labelIcon}>🏷️</span>
                  Tipo Assenza
                </div>
                <div className={styles.detailValue}>
                  {assenza.tipoAssenza.charAt(0).toUpperCase() + assenza.tipoAssenza.slice(1)}
                </div>
              </div>
              
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>
                  <span className={styles.labelIcon}>📅</span>
                  Data Inizio
                </div>
                <div className={styles.detailValue}>
                  {formatDate(assenza.dataInizio)}
                </div>
              </div>
              
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>
                  <span className={styles.labelIcon}>📅</span>
                  Data Fine
                </div>
                <div className={styles.detailValue}>
                  {formatDate(assenza.dataFine)}
                </div>
              </div>
              
              {/* Sezione Orari Specifici */}
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>
                  <span className={styles.labelIcon}>🕒</span>
                  Orario Specifico
                </div>
                <div className={styles.detailValue}>
                  {assenza.orarioSpecifico ? 'Sì' : 'No'}
                </div>
              </div>
              
              {assenza.orarioSpecifico && (
                <>
                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>
                      <span className={styles.labelIcon}>⏰</span>
                      Orario Entrata
                    </div>
                    <div className={styles.detailValue}>
                      {assenza.orarioEntrata || 'Non specificato'}
                    </div>
                  </div>
                  
                  <div className={styles.detailGroup}>
                    <div className={styles.detailLabel}>
                      <span className={styles.labelIcon}>⏰</span>
                      Orario Uscita
                    </div>
                    <div className={styles.detailValue}>
                      {assenza.orarioUscita || 'Non specificato'}
                    </div>
                  </div>
                </>
              )}
              
              {assenza.documentazione && (
                <div className={styles.detailGroup}>
                  <div className={styles.detailLabel}>
                    <span className={styles.labelIcon}>📎</span>
                    Documentazione
                  </div>
                  <div className={styles.detailValue}>
                    <a
                      href={assenza.documentazione}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      Visualizza documentazione
                    </a>
                  </div>
                </div>
              )}
              
              {assenza.note && (
                <div className={styles.detailGroupFull}>
                  <div className={styles.detailLabel}>
                    <span className={styles.labelIcon}>📝</span>
                    Note
                  </div>
                  <div className={styles.detailValue}>
                    {assenza.note}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sezione Registrazione */}
          <div className={styles.detailSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.sectionIcon}>📊</span>
              Informazioni di Sistema
            </h2>
            
            <div className={styles.detailGrid}>
              {assenza.registrataDa && (
                <div className={styles.detailGroup}>
                  <div className={styles.detailLabel}>
                    <span className={styles.labelIcon}>👤</span>
                    Registrata da
                  </div>
                  <div className={styles.detailValue}>
                    {assenza.registrataDa.nome} {assenza.registrataDa.cognome}
                  </div>
                </div>
              )}
              
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>
                  <span className={styles.labelIcon}>📅</span>
                  Data registrazione
                </div>
                <div className={styles.detailValue}>
                  {formatDate(assenza.createdAt)}
                </div>
              </div>
              
              <div className={styles.detailGroup}>
                <div className={styles.detailLabel}>
                  <span className={styles.labelIcon}>📅</span>
                  Ultima modifica
                </div>
                <div className={styles.detailValue}>
                  {formatDate(assenza.updatedAt)}
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => router.push('/dashboard?tab=assenze')}
            >
              <span className={styles.buttonIcon}>←</span>
              Torna all'elenco
            </button>
            
            <button
              type="button"
              className={styles.editButton}
              onClick={handleEdit}
            >
              <span className={styles.buttonIcon}>✎</span>
              Modifica
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DettaglioAssenza;