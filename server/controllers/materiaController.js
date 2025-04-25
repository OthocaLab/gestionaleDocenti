const Materia = require('../models/Materia');
const ClasseInsegnamento = require('../models/ClasseInsegnamento');

exports.getAllMaterie = async (req, res) => {
  try {
    const materie = await Materia.find().populate('classiInsegnamento');
    res.status(200).json(materie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createMateria = async (req, res) => {
  try {
    const { codiceMateria, descrizione, coloreMateria, decretoMinisteriale, classiInsegnamento } = req.body;
    
    // Create the materia
    const materia = new Materia({
      codiceMateria,
      descrizione,
      coloreMateria,
      decretoMinisteriale,
      classiInsegnamento: classiInsegnamento || []
    });
    
    const nuovaMateria = await materia.save();
    
    // Update each classe with the reference to this materia
    if (classiInsegnamento && classiInsegnamento.length > 0) {
      await ClasseInsegnamento.updateMany(
        { _id: { $in: classiInsegnamento } },
        { $addToSet: { materie: nuovaMateria._id } }
      );
    }
    
    // Return the populated materia
    const populatedMateria = await Materia.findById(nuovaMateria._id).populate('classiInsegnamento');
    res.status(201).json(populatedMateria);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateMateria = async (req, res) => {
  try {
    const { classiInsegnamento } = req.body;
    const materiaId = req.params.id;
    
    // Get the current materia to check for removed classi
    const currentMateria = await Materia.findById(materiaId);
    if (!currentMateria) {
      return res.status(404).json({ message: 'Materia non trovata' });
    }
    
    // Update the materia
    const updatedMateria = await Materia.findByIdAndUpdate(
      materiaId,
      req.body,
      { new: true }
    );
    
    // If classiInsegnamento are being updated
    if (classiInsegnamento) {
      // Remove this materia from classi that are no longer associated
      const removedClassi = currentMateria.classiInsegnamento.filter(
        c => !classiInsegnamento.includes(c.toString())
      );
      
      if (removedClassi.length > 0) {
        await ClasseInsegnamento.updateMany(
          { _id: { $in: removedClassi } },
          { $pull: { materie: materiaId } }
        );
      }
      
      // Add this materia to newly associated classi
      await ClasseInsegnamento.updateMany(
        { _id: { $in: classiInsegnamento } },
        { $addToSet: { materie: materiaId } }
      );
    }
    
    // Return the populated materia
    const populatedMateria = await Materia.findById(materiaId).populate('classiInsegnamento');
    res.status(200).json(populatedMateria);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMateria = async (req, res) => {
  try {
    const materiaId = req.params.id;
    const materia = await Materia.findById(materiaId);
    
    if (!materia) {
      return res.status(404).json({ message: 'Materia non trovata' });
    }
    
    // Remove references from all associated classi
    await ClasseInsegnamento.updateMany(
      { materie: materiaId },
      { $pull: { materie: materiaId } }
    );
    
    // Delete the materia
    await Materia.findByIdAndDelete(materiaId);
    
    res.status(200).json({ message: 'Materia eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};