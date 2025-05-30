import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useUserProfile = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProfile = async (profileData) => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (data.success) {
        // Aggiorna il contesto utente con i dati restituiti dall'API
        updateUser({
          ...user,
          ...data.data
        });
        return { success: true, data: data.data };
      } else {
        setError(data.message || 'Errore durante l\'aggiornamento');
        return { success: false, error: data.message };
      }
    } catch (err) {
      const errorMessage = 'Errore di connessione. Riprova più tardi.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateProfile,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}; 