const mongoose = require('mongoose');

// Schema per le ore specifiche di assenza
const OraAssenzaSchema = new mongoose.Schema({
  ora: {
    type: Number,
    required: true,
    min: 1,
    max: 10 // Assumendo un massimo di 10 ore al giorno
  },
  motivo: {
    type: String,
    default: null
  },
  sostituto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Docente',
    default: null
  }
}, { _id: false });

const AssenzaSchema = new mongoose.Schema({
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Docente',
    required: true
  },
  classe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classe',
    default: null
  },
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    default: null
  },
  data: {
    type: Date,
    required: true
  },
  orario: {
    type: Number,
    min: 1,
    max: 10,
    default: null // Se specificato, indica l'ora specifica dell'assenza
  },
  // Indica se il docente è assente per l'intera giornata
  assenteGiornataIntera: {
    type: Boolean,
    default: false
  },
  motivazione: {
    type: String,
    default: null
  },
  tipo: {
    type: String,
    enum: ['Malattia', 'Permesso', 'Altro'],
    default: 'Altro'
  },
  // Array di ore specifiche in cui il docente è assente
  oreAssenza: [OraAssenzaSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indice composto per evitare duplicati (docente + data)
AssenzaSchema.index({ docente: 1, data: 1 }, { unique: true });

module.exports = mongoose.model('Assenza', AssenzaSchema);