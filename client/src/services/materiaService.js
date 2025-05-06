import axios from 'axios';

// Ottiene tutte le materie
export const getAllMaterie = async () => {
  try {
    const response = await axios.get('/api/materie');
    return response;
  } catch (error) {
    throw error;
  }
};

// Crea una nuova materia
export const createMateria = async (materiaData) => {
  try {
    const response = await axios.post('/api/materie', {
      codiceMateria: materiaData.codice,
      descrizione: materiaData.descrizione,
      coloreMateria: materiaData.coloreMateria,
      decretoMinisteriale: materiaData.decretoMinisteriale || '',
      classiInsegnamento: materiaData.classiInsegnamento || []
    });
    return response;
  } catch (error) {
    throw error;
  }
};

// Aggiorna una materia esistente
export const updateMateria = async (id, materiaData) => {
  try {
    const response = await axios.put(`/api/materie/${id}`, materiaData);
    return response;
  } catch (error) {
    throw error;
  }
};

// Elimina una materia
export const deleteMateria = async (id) => {
  try {
    const response = await axios.delete(`/api/materie/${id}`);
    return response;
  } catch (error) {
    throw error;
  }
};