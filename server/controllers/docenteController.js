const Docente = require('../models/Docente');

exports.getAllDocenti = async (req, res) => {
  try {
    const docenti = await Docente.find()
      .populate({
        path: 'classiInsegnamento',
        populate: {
          path: 'materia'
        }
      });
    res.status(200).json(docenti);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createDocente = async (req, res) => {
  try {
    const docente = new Docente(req.body);
    const nuovoDocente = await docente.save();
    res.status(201).json(nuovoDocente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDocente = async (req, res) => {
  try {
    const docente = await Docente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(docente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDocente = async (req, res) => {
  try {
    await Docente.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Docente eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};