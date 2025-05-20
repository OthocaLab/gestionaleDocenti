import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Configurazione di axios con il token
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Funzione per il login
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore durante il login' };
  }
};

// Funzione per la registrazione
export const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore durante la registrazione' };
  }
};

// Funzione per la verifica del token
export const verifyToken = async () => {
  try {
    const response = await axios.get(`${API_URL}/auth/verify`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore durante la verifica del token' };
  }
};

// Funzione per il recupero password
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore durante il recupero password' };
  }
};

// Funzione per il reset della password
export const resetPassword = async (resetToken, password) => {
  try {
    const response = await axios.put(`${API_URL}/auth/reset-password/${resetToken}`, { password });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore durante il reset della password' };
  }
};

// Funzione per il cambio password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    const response = await axios.post(`${API_URL}/auth/change-password`, { 
      currentPassword, 
      newPassword 
    }, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore durante il cambio password' };
  }
};

// Funzione per inviare il codice di verifica dell'email
export const sendVerificationCode = async (email) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/send-verification-code`,
      { email },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore durante l\'invio del codice di verifica' };
  }
};

// Funzione per verificare il codice email
export const verifyEmailCode = async (code) => {
  try {
    const response = await axios.post(
      `${API_URL}/auth/verify-email-code`,
      { code },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore durante la verifica del codice' };
  }
}; 