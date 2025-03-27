const Materia = require('../models/Materia');

exports.getAllMaterie = async (req, res) => {
  try {
    const materie = await Materia.find().populate('classeInsegnamento');
    res.status(200).json(materie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMateria = async (req, res) => {
  try {
    const materia = new Materia(req.body);
    const nuovaMateria = await materia.save();
    res.status(201).json(nuovaMateria);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMateria = async (req, res) => {
  try {
    const materia = await Materia.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(materia);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMateria = async (req, res) => {
  try {
    await Materia.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Materia eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};