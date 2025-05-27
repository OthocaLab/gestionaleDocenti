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
  lezioni: [{
    giorno: String,    // es. "LU", "MA", "ME", etc.
    ora: String,       // es. "8:15", "9:15", etc.
    classe: String,    // es. "5M", "2A", etc.
    aula: String,      // es. "C02", "P06", etc.
    materia: String    // es. "MAT", "DISP", etc.
  }]
});

module.exports = mongoose.model('Docente', docenteSchema);