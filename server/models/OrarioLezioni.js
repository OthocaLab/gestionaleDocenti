const mongoose = require('mongoose');

const OrarioLezioniSchema = new mongoose.Schema({
  giornoSettimana: {
    type: String,
    enum: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
    required: [true, 'Inserisci il giorno della settimana']
  },
  ora: {
    type: Number,
    required: [true, 'Inserisci l\'ora della lezione'],
    min: 1,
    max: 8
  },
  oraInizio: {
    type: String,
    required: [true, 'Inserisci l\'ora di inizio']
  },
  oraFine: {
    type: String,
    required: [true, 'Inserisci l\'ora di fine']
  },
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Docente',
    required: true
  },
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true
  },
  aula: {
    type: String,
    default: 'N/D'
  },
  settimana: {
    type: Number,
    default: null // null indica tutte le settimane
  },
  isDisponibilita: {
    type: Boolean,
    default: false // Indica se si tratta di uno slot di disponibilità
  }
});

module.exports = mongoose.model('OrarioLezioni', OrarioLezioniSchema);