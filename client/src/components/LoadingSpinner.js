import React from 'react';
import styles from '../styles/LoadingSpinner.module.css';

const LoadingSpinner = () => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}></div>
      <p>Caricamento...</p>
    </div>
  );
};

export default LoadingSpinner;