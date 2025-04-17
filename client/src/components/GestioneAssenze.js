import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ElencoAssenze from './ElencoAssenze';
import InserimentoAssenze from './InserimentoAssenze';
import DettaglioAssenza from './DettaglioAssenza';
import styles from '../styles/Dashboard.module.css';

const GestioneAssenze = () => {
  const router = useRouter();
  const { tab, id } = router.query;
  const [activeView, setActiveView] = useState('elenco');
  const [assenzaId, setAssenzaId] = useState(null);

  useEffect(() => {
    if (tab === 'inserisciAssenze') {
      setActiveView('inserisci');
    } else if (tab === 'dettaglioAssenza' && id) {
      setActiveView('dettaglio');
      setAssenzaId(id);
    } else {
      setActiveView('elenco');
    }
  }, [tab, id]);

  return (
    <div className={styles.componentContainer}>
      {activeView === 'elenco' && <ElencoAssenze />}
      {activeView === 'inserisci' && <InserimentoAssenze />}
      {activeView === 'dettaglio' && <DettaglioAssenza assenzaId={assenzaId} />}
    </div>
  );
};

export default GestioneAssenze;