const ClasseScolastica = require('../models/ClasseScolastica');

// Get all classi
exports.getAllClassi = async (req, res) => {
  try {
    const classi = await ClasseScolastica.find();
    res.status(200).json({
      success: true,
      count: classi.length,
      data: classi
    });
  } catch (error) {
    console.error('Errore nel recupero delle classi:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle classi',
      error: error.message
    });
  }
};

// Create new classe
exports.createClasse = async (req, res) => {
  try {
    const { anno, sezione, aula, indirizzo, numeroStudenti } = req.body;
    
    const classe = await ClasseScolastica.create({
      anno,
      sezione,
      aula,
      indirizzo,
      numeroStudenti
    });
    
    res.status(201).json({
      success: true,
      data: classe
    });
  } catch (error) {
    console.error('Errore nella creazione della classe:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della classe',
      error: error.message
    });
  }
};

// Update classe
exports.updateClasse = async (req, res) => {
  try {
    const classe = await ClasseScolastica.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!classe) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trovata'
      });
    }
    
    res.status(200).json({
      success: true,
      data: classe
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento della classe:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della classe',
      error: error.message
    });
  }
};

// Delete classe
exports.deleteClasse = async (req, res) => {
  try {
    const classe = await ClasseScolastica.findByIdAndDelete(req.params.id);
    
    if (!classe) {
      return res.status(404).json({
        success: false,
        message: 'Classe non trovata'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Classe eliminata con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione della classe:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della classe',
      error: error.message
    });
  }
};

// Import classi esempio
exports.importaClassiEsempio = async (req, res) => {
  try {
    const datiEsempio = req.body;
    
    // Array per memorizzare tutte le classi da creare
    const classiDaCreare = [];
    
    // Estrai le classi dal JSON di esempio
    Object.keys(datiEsempio.sezioni).forEach(sezioneKey => {
      const sezione = datiEsempio.sezioni[sezioneKey];
      
      Object.keys(sezione.classi).forEach(classeKey => {
        const classe = sezione.classi[classeKey];
        const anno = parseInt(classeKey.charAt(0)); // Converti in numero
        const sez = classeKey.substring(1);
        
        classiDaCreare.push({
          anno: anno,
          sezione: sez,
          indirizzo: sezione.indirizzo,
          aula: classe.aula,
          numeroStudenti: classe.studenti
        });
      });
    });
    
    // Elimina tutte le classi esistenti (opzionale)
    await ClasseScolastica.deleteMany({});
    
    // Inserisci le nuove classi
    const risultato = await ClasseScolastica.insertMany(classiDaCreare);
    
    res.status(201).json({
      success: true,
      message: `Importate con successo ${risultato.length} classi di esempio`,
      data: risultato
    });
  } catch (error) {
    console.error('Errore durante l\'importazione delle classi di esempio:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante l\'importazione delle classi di esempio',
      error: error.message
    });
  }
};