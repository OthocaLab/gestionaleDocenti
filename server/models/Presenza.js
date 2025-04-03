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

const PresenzaSchema = new mongoose.Schema({
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Docente',
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  // Indica se il docente è assente per l'intera giornata
  assenteGiornataIntera: {
    type: Boolean,
    default: false
  },
  motivoGiornataIntera: {
    type: String,
    default: null
  },
  // Array di ore specifiche in cui il docente è assente
  oreAssenza: [OraAssenzaSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indice composto per evitare duplicati (docente + data)
PresenzaSchema.index({ docente: 1, data: 1 }, { unique: true });

module.exports = mongoose.model('Presenza', PresenzaSchema);