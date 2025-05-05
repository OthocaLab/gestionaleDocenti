const mongoose = require('mongoose');

const docenteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  cognome: {
    type: String,
    required: true
  },
  telefono: {
    type: String
  },
  codiceFiscale: {
    type: String,
    unique: true,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  stato: {
    type: String,
    enum: ['attivo', 'inattivo'],
    default: 'attivo'
  },
  classiInsegnamento: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ClasseInsegnamento'
  }],
  oreRecupero: {
    type: Number,
    default: 0,
    min: 0,
    required: true
  }
});

module.exports = mongoose.model('Docente', docenteSchema);