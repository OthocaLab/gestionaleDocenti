/**
 * Utility functions per gestire le date senza problemi di fuso orario
 */

/**
 * Formatta una data per l'invio alle API evitando problemi di fuso orario
 * @param {Date|string} date - La data da formattare
 * @returns {string|null} Data nel formato YYYY-MM-DD o null se la data non è valida
 */
export const formatDateForAPI = (date) => {
  if (!date) return null;
  
  if (typeof date === 'string') return date;
  
  if (date instanceof Date && !isNaN(date.getTime())) {
    // Usa getFullYear, getMonth, getDate per evitare problemi di fuso orario
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  return null;
};

/**
 * Formatta una data per la visualizzazione in formato italiano
 * @param {Date|string} date - La data da formattare  
 * @returns {string} Data nel formato DD/MM/YYYY
 */
export const formatDateForDisplay = (date) => {
  if (!date) return 'Data non valida';
  
  let dateObj = date;
  if (typeof date === 'string') {
    dateObj = new Date(date);
  }
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'Data non valida';
  }
  
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
};

/**
 * Converte una stringa data YYYY-MM-DD in Date object locale
 * @param {string} dateString - Stringa data nel formato YYYY-MM-DD
 * @returns {Date|null} Date object o null se non valida
 */
export const parseAPIDate = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  const [year, month, day] = dateString.split('-').map(Number);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  
  // Crea una data usando il fuso orario locale
  return new Date(year, month - 1, day);
};

/**
 * Verifica se due date rappresentano lo stesso giorno
 * @param {Date} date1 - Prima data
 * @param {Date} date2 - Seconda data
 * @returns {boolean} True se le date rappresentano lo stesso giorno
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Restituisce una nuova data con l'ora impostata a 00:00:00
 * @param {Date} date - Data da normalizzare
 * @returns {Date} Nuova data con ora a midnight locale
 */
export const normalizeDate = (date) => {
  if (!date || !(date instanceof Date)) return null;
  
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export default {
  formatDateForAPI,
  formatDateForDisplay,
  parseAPIDate,
  isSameDay,
  normalizeDate
};
