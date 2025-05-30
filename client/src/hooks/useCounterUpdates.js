import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

/**
 * Hook personalizzato per gestire gli aggiornamenti automatici dei contatori
 * @param {Object} options - Opzioni di configurazione
 * @param {string} options.docenteId - ID del docente per statistiche specifiche
 * @param {number} options.refreshInterval - Intervallo di aggiornamento in ms (default: 30000)
 * @param {boolean} options.enabled - Se abilitare il polling automatico (default: true)
 */
export const useCounterUpdates = (options = {}) => {
  const { 
    docenteId, 
    refreshInterval = 30000, 
    enabled = true 
  } = options;

  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Funzione per recuperare le statistiche
  const fetchStatistics = useCallback(async () => {
    try {
      setError(null);
      
      const params = docenteId ? { docenteId } : {};
      const response = await axios.get('/api/assenze/statistiche', {
        params,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setStatistics(response.data.data);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Errore nel recupero delle statistiche:', err);
      setError(err.response?.data?.message || 'Errore nel recupero delle statistiche');
    } finally {
      setLoading(false);
    }
  }, [docenteId]);

  // Funzione per forzare l'aggiornamento
  const forceUpdate = useCallback(() => {
    setLoading(true);
    fetchStatistics();
  }, [fetchStatistics]);

  // Effetto per il polling automatico
  useEffect(() => {
    if (!enabled) return;

    // Prima chiamata
    fetchStatistics();

    // Intervallo per aggiornamenti periodici
    const interval = setInterval(fetchStatistics, refreshInterval);

    // Cleanup
    return () => clearInterval(interval);
  }, [fetchStatistics, refreshInterval, enabled]);

  // Effetto per ascoltare eventi custom (per aggiornamenti real-time)
  useEffect(() => {
    const handleCounterUpdate = (event) => {
      if (event.detail && (!docenteId || event.detail.docenteId === docenteId)) {
        console.log('📊 Aggiornamento contatori ricevuto:', event.detail);
        forceUpdate();
      }
    };

    // Aggiungi listener per eventi custom
    window.addEventListener('counterUpdate', handleCounterUpdate);

    return () => {
      window.removeEventListener('counterUpdate', handleCounterUpdate);
    };
  }, [docenteId, forceUpdate]);

  return {
    statistics,
    loading,
    error,
    lastUpdate,
    forceUpdate,
    isStale: lastUpdate && (Date.now() - lastUpdate.getTime()) > refreshInterval * 2
  };
};

/**
 * Hook semplificato per ottenere solo le ore da recuperare di un docente
 * @param {string} docenteId - ID del docente
 */
export const useOreRecupero = (docenteId) => {
  const { statistics, loading, error, forceUpdate } = useCounterUpdates({ 
    docenteId,
    refreshInterval: 10000 // Aggiorna più frequentemente per le ore di recupero
  });

  return {
    oreRecupero: statistics?.docente?.oreRecupero || 0,
    loading,
    error,
    refreshOreRecupero: forceUpdate
  };
};

/**
 * Funzione utility per emettere eventi di aggiornamento contatori
 * @param {Object} data - Dati dell'aggiornamento
 */
export const emitCounterUpdate = (data) => {
  const event = new CustomEvent('counterUpdate', { detail: data });
  window.dispatchEvent(event);
};

export default useCounterUpdates; 