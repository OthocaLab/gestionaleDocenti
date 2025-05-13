import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica il token all'avvio dell'app
    const checkAuth = async () => {
      // Verifica se siamo nel browser
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          try {
            // Per ora, consideriamo valido il token se esiste
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData) {
              setUser(userData);
              setToken(storedToken);
              setIsAuthenticated(true);
            }
          } catch (error) {
            console.error('Errore durante la verifica dell\'autenticazione:', error);
            logout();
          }
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        
        // Salva anche il refresh token
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        setIsAuthenticated(true);
        setUser(response.data.user);
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Errore durante il login' 
      };
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Funzione per rinnovare il token se scaduto
  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refreshToken');
      
      if (!refreshTokenValue) {
        console.log('Refresh token non disponibile');
        return false;
      }
      
      const response = await axios.post('/api/auth/refresh-token', { 
        refreshToken: refreshTokenValue 
      });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        // Aggiorna lo stato dell'autenticazione
        setIsAuthenticated(true);
        setUser(response.data.user);
        
        console.log('Token rinnovato con successo');
        return true;
      } else {
        console.log('Errore nel rinnovo del token:', response.data.message);
        return false;
      }
    } catch (error) {
      console.error('Errore nel rinnovo del token:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout, 
      refreshToken 
    }}>
      {children}
    </AuthContext.Provider>
  );
};