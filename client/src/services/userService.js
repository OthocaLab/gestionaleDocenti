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

// Funzione per ottenere tutti gli utenti
export const getAllUsers = async () => {
  try {
    const response = await axios.get(`${API_URL}/users`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nel recupero degli utenti' };
  }
};

// Funzione per ottenere un utente specifico
export const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/users/${userId}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nel recupero dell\'utente' };
  }
};

// Funzione per ottenere il profilo dell'utente corrente
export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/users/me`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nel recupero del profilo' };
  }
};

// Funzione per aggiornare un utente
export const updateUser = async (userId, userData) => {
  try {
    const response = await axios.put(`${API_URL}/users/${userId}`, userData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nell\'aggiornamento dell\'utente' };
  }
};

// Funzione per eliminare un utente
export const deleteUser = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/users/${userId}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nell\'eliminazione dell\'utente' };
  }
};

// Funzione per registrare un nuovo utente (solo admin)
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/users/register`, userData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nella registrazione dell\'utente' };
  }
};