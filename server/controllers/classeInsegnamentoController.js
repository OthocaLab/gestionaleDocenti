const ClasseInsegnamento = require('../models/ClasseInsegnamento');

exports.getAllClassiInsegnamento = async (req, res) => {
  try {
    const classi = await ClasseInsegnamento.find().populate('materia');
    res.status(200).json(classi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createClasseInsegnamento = async (req, res) => {
  try {
    const classe = new ClasseInsegnamento(req.body);
    const nuovaClasse = await classe.save();
    res.status(201).json(nuovaClasse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateClasseInsegnamento = async (req, res) => {
  try {
    const classe = await ClasseInsegnamento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(classe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteClasseInsegnamento = async (req, res) => {
  try {
    await ClasseInsegnamento.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Classe di insegnamento eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};