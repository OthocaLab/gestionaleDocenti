const mongoose = require('mongoose');

const ClasseInsegnamentoSchema = new mongoose.Schema({
  codiceClasse: {
    type: String,
    required: [true, 'Inserisci il codice della classe di insegnamento'],
    unique: true,
    trim: true
  },
  descrizione: {
    type: String,
    required: [true, 'Inserisci la descrizione della classe di insegnamento']
  },
  materie: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia'
  }]
});

module.exports = mongoose.model('ClasseInsegnamento', ClasseInsegnamentoSchema);