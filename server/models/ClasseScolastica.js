const mongoose = require('mongoose');

const ClasseScolasticaSchema = new mongoose.Schema({
  anno: {
    type: Number,
    required: [true, 'Inserisci l\'anno della classe'],
    min: 1,
    max: 5
  },
  sezione: {
    type: String,
    required: [true, 'Inserisci la sezione della classe'],
    trim: true
  },
  aula: {
    type: String,
    required: [true, 'Inserisci l\'aula della classe']
  },
  indirizzo: {
    type: String,
    required: [true, 'Inserisci l\'indirizzo di studio']
  },
  numeroStudenti: {
    type: Number,
    default: 0
  },
  orarioLezioni: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OrarioLezioni'
  }]
});

// Indice composto per garantire l'unicità della combinazione anno-sezione
ClasseScolasticaSchema.index({ anno: 1, sezione: 1 }, { unique: true });

module.exports = mongoose.model('ClasseScolastica', ClasseScolasticaSchema);