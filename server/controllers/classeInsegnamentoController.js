const ClasseInsegnamento = require('../models/ClasseInsegnamento');
const Materia = require('../models/Materia');
const fs = require('fs');
const path = require('path');

exports.getAllClassiInsegnamento = async (req, res) => {
  try {
    const classi = await ClasseInsegnamento.find().populate('materie');
    res.status(200).json(classi);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createClasseInsegnamento = async (req, res) => {
  try {
    const { codiceClasse, descrizione, materie } = req.body;
    
    // Create the classe insegnamento
    const classe = new ClasseInsegnamento({
      codiceClasse,
      descrizione,
      materie: materie || []
    });
    
    const nuovaClasse = await classe.save();
    
    // Update each materia with the reference to this classe
    if (materie && materie.length > 0) {
      await Materia.updateMany(
        { _id: { $in: materie } },
        { $addToSet: { classiInsegnamento: nuovaClasse._id } }
      );
    }
    
    // Return the populated classe
    const populatedClasse = await ClasseInsegnamento.findById(nuovaClasse._id).populate('materie');
    res.status(201).json(populatedClasse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateClasseInsegnamento = async (req, res) => {
  try {
    const { materie } = req.body;
    const classeId = req.params.id;
    
    // Get the current classe to check for removed materie
    const currentClasse = await ClasseInsegnamento.findById(classeId);
    if (!currentClasse) {
      return res.status(404).json({ message: 'Classe di insegnamento non trovata' });
    }
    
    // Update the classe
    const updatedClasse = await ClasseInsegnamento.findByIdAndUpdate(
      classeId,
      req.body,
      { new: true }
    );
    
    // If materie are being updated
    if (materie) {
      // Remove this classe from materie that are no longer associated
      const removedMaterie = currentClasse.materie.filter(
        m => !materie.includes(m.toString())
      );
      
      if (removedMaterie.length > 0) {
        await Materia.updateMany(
          { _id: { $in: removedMaterie } },
          { $pull: { classiInsegnamento: classeId } }
        );
      }
      
      // Add this classe to newly associated materie
      await Materia.updateMany(
        { _id: { $in: materie } },
        { $addToSet: { classiInsegnamento: classeId } }
      );
    }
    
    // Return the populated classe
    const populatedClasse = await ClasseInsegnamento.findById(classeId).populate('materie');
    res.status(200).json(populatedClasse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteClasseInsegnamento = async (req, res) => {
  try {
    const classeId = req.params.id;
    const classe = await ClasseInsegnamento.findById(classeId);
    
    if (!classe) {
      return res.status(404).json({ message: 'Classe di insegnamento non trovata' });
    }
    
    // Remove references from all associated materie
    await Materia.updateMany(
      { classiInsegnamento: classeId },
      { $pull: { classiInsegnamento: classeId } }
    );
    
    // Delete the classe
    await ClasseInsegnamento.findByIdAndDelete(classeId);
    
    res.status(200).json({ message: 'Classe di insegnamento eliminata con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Nuovo metodo per importare classi di insegnamento da JSON
exports.importClassiInsegnamento = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nessun file caricato' });
    }

    // Leggi il file JSON
    const filePath = req.file.path;
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Elimina il file temporaneo dopo averlo letto
    fs.unlinkSync(filePath);
    
    let importedCount = 0;
    let errors = [];

    // Processa ogni elemento del JSON
    for (const item of jsonData) {
      try {
        // Array per memorizzare gli ID delle materie
        const materieIds = [];
        
        // Per ogni materia nell'array materie
        for (const materiaName of item.materie) {
          // Cerca o crea la materia
          let materia = await Materia.findOne({ descrizione: materiaName });
          
          if (!materia) {
            // Genera un codice materia se non esiste
            const codiceMateria = `MAT-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
            
            materia = await Materia.create({
              codiceMateria: codiceMateria,
              descrizione: materiaName,
              coloreMateria: '#' + Math.floor(Math.random() * 16777215).toString(16) // Colore casuale
            });
          }
          
          materieIds.push(materia._id);
        }
        
        // Cerca se esiste già una classe di insegnamento con lo stesso codice
        let classeInsegnamento = await ClasseInsegnamento.findOne({ codiceClasse: item.codice });
        
        if (!classeInsegnamento) {
          // Crea la classe di insegnamento con tutte le materie
          classeInsegnamento = await ClasseInsegnamento.create({
            codiceClasse: item.codice,
            descrizione: item.denominazione,
            materie: materieIds
          });
          
          // Aggiorna il riferimento in ogni materia
          await Materia.updateMany(
            { _id: { $in: materieIds } },
            { $addToSet: { classiInsegnamento: classeInsegnamento._id } }
          );
          
          importedCount++;
        } else {
          // Aggiorna la classe esistente aggiungendo le nuove materie
          await ClasseInsegnamento.findByIdAndUpdate(
            classeInsegnamento._id,
            { $addToSet: { materie: { $each: materieIds } } }
          );
          
          // Aggiorna il riferimento in ogni materia
          await Materia.updateMany(
            { _id: { $in: materieIds } },
            { $addToSet: { classiInsegnamento: classeInsegnamento._id } }
          );
        }
      } catch (itemError) {
        errors.push(`Errore nell'importazione dell'elemento ${item.codice}: ${itemError.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      message: 'Importazione completata',
      imported: importedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Errore durante l\'importazione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'importazione',
      error: error.message
    });
  }
};