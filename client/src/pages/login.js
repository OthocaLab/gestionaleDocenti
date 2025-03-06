import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { AuthContext } from '../context/AuthContext';
import styles from '../styles/Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  
  // Controlla se l'utente è stato appena registrato
  useEffect(() => {
    if (router.query.registered) {
      setSuccessMessage('Registrazione completata con successo! Ora puoi accedere.');
    }
  }, [router.query]);
  
  // Reindirizza alla dashboard se l'utente è già autenticato
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Validazione base
      if (!email || !password) {
        throw new Error('Inserisci email e password');
      }
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Errore durante il login');
      }
      
      // Salva il token e i dati utente
      login(data.token, data.user);
      
      // Reindirizza alla dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginLogo}>
          <Image 
            src="/img/logo.png" 
            alt="Othoca Lab" 
            width={80} 
            height={80}
            sizes="100vw"
            style={{ width: 'auto', height: 'auto' }}
            priority
          />
          
        </div>
        <h4 className={styles.loginTitle}>Inserisci email e password</h4>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="Username@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <div className={styles.forgotPassword}>
            <Link href="/recupero-password">Hai dimenticato la password?</Link>
          </div>
          
          <button 
            type="submit" 
            className={styles.loginButton} 
            disabled={isLoading}
          >
            {isLoading ? 'Caricamento...' : 'Accedi'}
          </button>
        </form>
        
        <div className={styles.loginFooter}>
          <p>Non hai ancora un account? <Link href="/registrazione">Registrati</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;