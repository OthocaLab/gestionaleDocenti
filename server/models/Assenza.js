const mongoose = require('mongoose');

const assenzaSchema = new mongoose.Schema({
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Docente',
    required: true
  },
  dataInizio: {
    type: Date,
    required: true
  },
  dataFine: {
    type: Date,
    required: true
  },
  tipoAssenza: {
    type: String,
    enum: ['malattia', 'permesso', 'ferie', 'altro', 'fuoriclasse'],
    required: true
  },
  // Campi per gestire orari specifici
  orarioSpecifico: {
    type: Boolean,
    default: false
  },
  orarioEntrata: {
    type: String,
    // Formato HH:MM
  },
  orarioUscita: {
    type: String,
    // Formato HH:MM
  },
  note: {
    type: String
  },
  giustificata: {
    type: Boolean,
    default: false
  },
  documentazione: {
    type: String // URL o percorso del file di documentazione
  },
  registrataDa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Aggiorna la data di modifica prima di salvare
assenzaSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Assenza', assenzaSchema);