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
    unique: true,
    sparse: true
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
  },
  codiceDocente: {
    type: String,
    unique: true,
    sparse: true
  },
  docenteSostegno: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('Docente', docenteSchema);