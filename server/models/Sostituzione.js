const mongoose = require('mongoose');

const sostituzioneSchema = new mongoose.Schema({
  assenza: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assenza',
    required: true
  },
  docente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Docente',
    required: true
  },
  docenteSostituto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Docente',
    required: true
  },
  data: {
    type: Date,
    required: true
  },
  ora: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  classe: {
    type: String,
    required: true
  },
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true
  },
  stato: {
    type: String,
    enum: ['programmata', 'confermata', 'annullata'],
    default: 'programmata'
  },
  note: {
    type: String
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
sostituzioneSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Sostituzione', sostituzioneSchema); 