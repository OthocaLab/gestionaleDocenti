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

export const getDocentiDisponibili = async (giorno, ora) => {
  try {
    const response = await axios.get(`${API_URL}/orario/docenti-disponibili?giorno=${giorno}&ora=${ora}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Errore nel recupero dei docenti disponibili:', error);
    if (error.response?.status === 401) {
      throw { message: 'Sessione scaduta. Effettua nuovamente il login.' };
    }
    throw error.response?.data || { message: 'Errore nel recupero dei docenti disponibili' };
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

export const importOrario = async (fileObject) => {
  try {
    // Verifico se il file è valido
    if (!fileObject || !fileObject.name) {
      throw new Error('File non valido');
    }
    
    const formData = new FormData();
    formData.append('file', fileObject);
    
    // Ottieni un token fresco dall'auth context o localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token di autenticazione mancante. Effettua il login.');
    }
    
    console.log('Auth token:', 'Token presente e in uso');
    
    // Configurazione completa per la richiesta
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        // Non specificare Content-Type, sarà impostato automaticamente per FormData
      },
      // Opzioni importanti per CORS
      withCredentials: false,
      timeout: 60000, // 60 secondi di timeout
    };
    
    // Add debugging
    console.log('FormData contents:', fileObject.name, fileObject.type, fileObject.size);
    
    // Assicurarsi che API_URL sia corretto
    const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const apiUrl = serverUrl.endsWith('/api') ? serverUrl : `${serverUrl}/api`;
    console.log('API URL:', apiUrl);
    
    const fullUrl = `${apiUrl}/orario/import`;
    console.log('Full request URL:', fullUrl);
    
    // Use the real import endpoint that saves to MongoDB with gestione errori e retry
    let retries = 3;
    let lastError = null;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        console.log(`Tentativo di upload ${attempt + 1}/${retries}...`);
        const response = await axios.post(fullUrl, formData, config);
        console.log('Import response:', response.data);
        return response.data;
      } catch (err) {
        console.error(`Errore tentativo ${attempt + 1}:`, err.message);
        lastError = err;
        
        // Se abbiamo una risposta dal server, non ritentare
        if (err.response) {
          throw err;
        }
        
        // Attendi un po' prima di riprovare (backoff esponenziale)
        if (attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Attendo ${delay}ms prima di riprovare...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Se arriviamo qui, tutti i tentativi sono falliti
    throw lastError || new Error('Impossibile connettersi al server dopo multipli tentativi');
  } catch (error) {
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      // La richiesta è stata effettuata e il server ha risposto con un codice di stato
      // che non rientra nell'intervallo 2xx
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // La richiesta è stata effettuata ma non è stata ricevuta alcuna risposta
      console.error('No response received:', error.request);
    }
    
    if (error.response && error.response.status === 401) {
      throw { message: 'Sessione scaduta. Effettua di nuovo il login.' };
    } else if (error.response && error.response.status === 403) {
      throw { message: 'Non hai i permessi necessari per questa operazione. Contatta l\'amministratore.' };
    } else if (error.message.includes('Network Error') || error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
      throw { message: 'Impossibile connettersi al server. Verifica la tua connessione e che il server sia attivo.' };
    }
    
    throw { message: `Errore nell'importazione dell'orario: ${error.message}` };
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