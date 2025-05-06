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

// Funzioni per le materie
export const getAllMaterie = async () => {
  try {
    const response = await axios.get(`${API_URL}/orario/materie`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nel recupero delle materie' };
  }
};

export const createMateria = async (materiaData) => {
  try {
    const response = await axios.post(`${API_URL}/orario/materie`, materiaData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nella creazione della materia' };
  }
};

// Funzioni per le classi
export const getAllClassi = async () => {
  try {
    const response = await axios.get(`${API_URL}/orario/classi`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nel recupero delle classi' };
  }
};

export const createClasse = async (classeData) => {
  try {
    const response = await axios.post(`${API_URL}/orario/classi`, classeData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nella creazione della classe' };
  }
};

// Funzioni per gli orari
export const getOrarioByClasse = async (classeId) => {
  try {
    const response = await axios.get(`${API_URL}/orario/orario/classe/${classeId}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nel recupero dell\'orario della classe' };
  }
};

export const getOrarioByDocente = async (docenteId) => {
  try {
    const response = await axios.get(`${API_URL}/orario/orario/docente/${docenteId}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nel recupero dell\'orario del docente' };
  }
};

export const createOrarioLezione = async (orarioData) => {
  try {
    const response = await axios.post(`${API_URL}/orario/orario`, orarioData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Errore nella creazione dell\'orario' };
  }
};

export const importOrario = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Important: Do NOT set Content-Type header when using FormData
    // The browser will automatically set the correct boundary
    const config = getAuthConfig();
    
    // Add debugging
    console.log('FormData contents:', file.name, file.type, file.size);
    
    const response = await axios.post(`${API_URL}/orario/import`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error details:', error);
    throw error.response?.data || { message: 'Errore nell\'importazione dell\'orario' };
  }
};

// Importa classi di esempio
export const importaClassiEsempio = async (datiEsempio) => {
  try {
    const response = await axios.post('/api/classi/importa-esempio', datiEsempio);
    return response;
  } catch (error) {
    throw error;
  }
};