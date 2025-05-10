import axios from 'axios';

export const getAllDocenti = async () => {
  try {
    const response = await axios.get('/api/docenti');
    return response;
  } catch (error) {
    console.error('Errore nella chiamata API getAllDocenti:', error);
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

export const getAllClassiInsegnamento = async () => {
  try {
    const response = await axios.get(`${API_URL}/classi-insegnamento`);
    return response;
  } catch (error) {
    throw error;
  }
};