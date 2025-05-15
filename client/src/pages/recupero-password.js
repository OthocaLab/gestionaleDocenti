import { useState } from 'react';
import styles from '../styles/Login.module.css';
import axios from 'axios';
import { useRouter } from 'next/router';

export default function RecuperoPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      console.log('Risposta invio email:', response.data);
      setMessage('Se l\'email è registrata, riceverai le istruzioni per reimpostare la password.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (error) {
      console.error('Errore invio email:', error.response?.data || error);
      setError(error.response?.data?.message || 'Si è verificato un errore durante l\'invio della richiesta');
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Recupero Password</h1>
        </div>

        {message && <div className={styles.successMessage}>{message}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Inserisci la tua email"
            />
          </div>

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? 'Invio in corso...' : 'Invia richiesta'}
          </button>
        </form>
      </div>
    </div>
  );
}