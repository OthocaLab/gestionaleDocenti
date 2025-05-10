const mongoose = require('mongoose');

const classeInsegnamentoSchema = new mongoose.Schema({
  codiceClasse: {
    type: String,
    required: true,
    unique: true
  },
  descrizione: {
    type: String,
    required: true
  },
  materie: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia'
  }]
});

module.exports = mongoose.model('ClasseInsegnamento', classeInsegnamentoSchema);