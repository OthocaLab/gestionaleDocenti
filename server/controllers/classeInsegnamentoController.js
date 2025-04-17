const ClasseInsegnamento = require('../models/ClasseInsegnamento');
const Materia = require('../models/Materia');
const fs = require('fs');
const path = require('path');

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
          
          // Cerca se esiste già una classe di insegnamento con lo stesso codice
          const existingClasse = await ClasseInsegnamento.findOne({ codiceClasse: item.codice });
          
          if (!existingClasse) {
            // Crea la classe di insegnamento
            await ClasseInsegnamento.create({
              codiceClasse: item.codice,
              descrizione: item.denominazione,
              materia: materia._id
            });
            
            // Aggiorna il riferimento nella materia
            await Materia.findByIdAndUpdate(
              materia._id,
              { $addToSet: { classeInsegnamento: materia._id } }
            );
            
            importedCount++;
          }
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