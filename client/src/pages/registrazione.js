import { useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { AuthContext } from '../context/AuthContext';
import { register as authRegister } from '../services/authService';
import styles from '../styles/Register.module.css';

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    cognome: '',
    email: '',
    password: '',
    confermaPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  
  // Reindirizza alla dashboard se l'utente è già autenticato
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);
    
    try {
      // Validazione base
      if (!formData.nome || !formData.cognome || !formData.email || !formData.password) {
        throw new Error('Tutti i campi sono obbligatori');
      }
      
      if (formData.password !== formData.confermaPassword) {
        throw new Error('Le password non coincidono');
      }
      
      if (formData.password.length < 8) {
        throw new Error('La password deve contenere almeno 8 caratteri');
      }
      
      // Usa authService invece di fetch diretto
      const data = await authRegister({
        nome: formData.nome,
        cognome: formData.cognome,
        email: formData.email,
        password: formData.password
      });
      
      // Registrazione completata con successo
      setSuccessMessage('Registrazione completata con successo! Verrai reindirizzato alla pagina di login...');
      
      // Pulisci il form
      setFormData({
        nome: '',
        cognome: '',
        email: '',
        password: '',
        confermaPassword: ''
      });
      
      // Reindirizza al login dopo 3 secondi
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 3000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.registerLogo}>
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
        <h4 className={styles.registerTitle}>Crea un nuovo account</h4>
        
        {successMessage ? (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  placeholder="Inserisci il tuo nome"
                  value={formData.nome}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="cognome">Cognome</label>
                <input
                  type="text"
                  id="cognome"
                  name="cognome"
                  placeholder="Inserisci il tuo cognome"
                  value={formData.cognome}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Inserisci la tua email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Inserisci la password (min. 8 caratteri)"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confermaPassword">Conferma Password</label>
              <input
                type="password"
                id="confermaPassword"
                name="confermaPassword"
                placeholder="Conferma la password"
                value={formData.confermaPassword}
                onChange={handleChange}
                required
              />
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <button 
              type="submit" 
              className={styles.registerButton} 
              disabled={isLoading}
            >
              {isLoading ? 'Caricamento...' : 'Registrati'}
            </button>
          </form>
        )}
        
        <div className={styles.registerFooter}>
          <p>Hai già un account? <Link href="/login">Accedi</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;