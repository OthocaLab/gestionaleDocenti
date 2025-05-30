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

export const getAllDocenti = async () => {
  try {
    const response = await axios.get(`${API_URL}/docenti`, getAuthConfig());
    return response;
  } catch (error) {
    console.error('Errore nel recupero dei docenti:', error);
    throw error;
  }
};

export const createDocente = async (docenteData) => {
  try {
    const response = await axios.post(`${API_URL}/docenti`, docenteData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const updateDocente = async (id, docenteData) => {
  try {
    const response = await axios.put(`${API_URL}/docenti/${id}`, docenteData);
    return response;
  } catch (error) {
    throw error;
  }
};

export const deleteDocente = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/docenti/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getAllClassiInsegnamento = () => {
  return axios.get('/api/classi-insegnamento');
};