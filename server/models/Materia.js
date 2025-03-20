const mongoose = require('mongoose');

const MateriaSchema = new mongoose.Schema({
  codiceMateria: {
    type: String,
    required: [true, 'Inserisci il codice della materia'],
    unique: true,
    trim: true
  },
  descrizione: {
    type: String,
    required: [true, 'Inserisci la descrizione della materia']
  },
  coloreMateria: {
    type: String,
    default: '#3498db' // Colore predefinito
  },
  decretoMinisteriale: {
    type: String
  },
  classeInsegnamento: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClasseInsegnamento'
  }]
});

module.exports = mongoose.model('Materia', MateriaSchema);