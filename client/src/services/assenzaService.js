import axios from 'axios';
import { formatDateForAPI } from '../utils/dateUtils';

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

// Ottieni tutte le assenze
export const getAllAssenze = async () => {
  try {
    const response = await axios.get(`${API_URL}/assenze`, getAuthConfig());
    return response;
  } catch (error) {
    console.error('Errore nel recupero delle assenze:', error);
    throw error;
  }
};

// Ottieni assenza per ID
export const getAssenzaById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/assenze/${id}`, getAuthConfig());
    return response;
  } catch (error) {
    console.error(`Errore nel recupero dell'assenza con ID ${id}:`, error);
    throw error;
  }
};

// Crea una nuova assenza
export const createAssenza = async (assenzaData) => {
  try {
    const response = await axios.post(`${API_URL}/assenze`, assenzaData, getAuthConfig());
    return response;
  } catch (error) {
    console.error('Errore nella creazione dell\'assenza:', error);
    throw error;
  }
};

// Aggiorna un'assenza esistente
export const updateAssenza = async (id, assenzaData) => {
  try {
    const response = await axios.put(`${API_URL}/assenze/${id}`, assenzaData, getAuthConfig());
    return response;
  } catch (error) {
    console.error(`Errore nell'aggiornamento dell'assenza con ID ${id}:`, error);
    throw error;
  }
};

// Elimina un'assenza
export const deleteAssenza = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/assenze/${id}`, getAuthConfig());
    return response;
  } catch (error) {
    console.error(`Errore nell'eliminazione dell'assenza con ID ${id}:`, error);
    throw error;
  }
};

// Ottieni le assenze per una data specifica
export const getAssenzeByDate = async (date) => {
  try {
    const formattedDate = formatDateForAPI(date);
    const response = await axios.get(`${API_URL}/assenze/per-data`, {
      params: { data: formattedDate },
      ...getAuthConfig()
    });
    return response;
  } catch (error) {
    console.error(`Errore nel recupero delle assenze per la data ${date}:`, error);
    throw error;
  }
};

// Ottieni docenti assenti per una data specifica
export const getDocentiAssentiByDate = async (date) => {
  try {
    const formattedDate = formatDateForAPI(date);
    const response = await axios.get(`${API_URL}/assenze/docenti-per-data`, {
      params: { data: formattedDate },
      ...getAuthConfig()
    });
    return response;
  } catch (error) {
    console.error(`Errore nel recupero dei docenti assenti per la data ${date}:`, error);
    throw error;
  }
};

export default {
  getAllAssenze,
  getAssenzaById,
  createAssenza,
  updateAssenza,
  deleteAssenza,
  getAssenzeByDate,
  getDocentiAssentiByDate
}; 