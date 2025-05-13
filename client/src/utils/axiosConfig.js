import axios from 'axios';

// Configura la base URL per le chiamate API (se necessario)
// axios.defaults.baseURL = 'http://localhost:5000';

// Interceptor per aggiungere il token JWT a tutte le richieste
const setupAxiosInterceptors = (token) => {
  // Aggiungi il token di autenticazione a tutte le richieste
  axios.interceptors.request.use(
    (config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Gestisci le risposte e gli errori
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // Gestisci errori come 401 Unauthorized
      if (error.response && error.response.status === 401) {
        console.log('Sessione scaduta o non autorizzata');
        // Puoi fare redirect alla pagina di login o mostrare un alert
        // localStorage.removeItem('token');
        // window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors; 