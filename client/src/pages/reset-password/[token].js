import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Login.module.css';
import { resetPassword } from '../../services/authService';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const router = useRouter();
  const { token } = router.query;

  useEffect(() => {
    // Verifica che il token sia presente
    if (router.isReady && !token) {
      setError('Token non valido o mancante');
      setTokenValid(false);
    }
  }, [token, router.isReady]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Validazione password
    if (password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Le password non coincidono');
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword(token, password);
      console.log('Risposta reset password:', response);
      setMessage('Password reimpostata con successo! Verrai reindirizzato alla pagina di login...');
      
      // Reindirizza al login dopo 3 secondi
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          router.push('/login');
        }
      }, 3000);
    } catch (error) {
      console.error('Errore reset password:', error);
      
      // Gestione errori specifici
      if (error.message?.includes('Token')) {
        setError('Il link di reset è scaduto o non valido. Richiedi un nuovo link.');
        setTokenValid(false);
      } else {
        setError(error.message || 'Si è verificato un errore durante il reset della password');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginLogo}>
            <img 
              src="/img/logo.png" 
              alt="Othoca Labs" 
              style={{ 
                width: 'auto',
                height: '50px',
                marginBottom: '1rem'
              }}
            />
            <h1>Reset Password</h1>
          </div>

          <div className={styles.errorMessage}>
            {error || 'Il link di reset non è valido o è scaduto.'}
          </div>

          <button 
            onClick={() => router.push('/recupero-password')} 
            className={styles.loginButton}
          >
            Richiedi nuovo link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <img 
            src="/img/logo.png" 
            alt="Othoca Labs" 
            style={{ 
              width: 'auto',
              height: '50px',
              marginBottom: '1rem'
            }}
          />
          <h1>Reimposta Password</h1>
        </div>

        {message && <div className={styles.successMessage}>{message}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="password">Nuova Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Inserisci la nuova password"
              minLength={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Conferma Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Conferma la nuova password"
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? 'Salvataggio in corso...' : 'Reimposta password'}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p>Ricordi la password? <a href="/login">Torna al login</a></p>
        </div>
      </div>
    </div>
  );
}

