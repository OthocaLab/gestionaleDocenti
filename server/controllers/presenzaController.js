const Docente = require('../models/Docente');
const Presenza = require('../models/Presenza');

// Ottieni statistiche presenze/assenze
exports.getStatistiche = async (req, res) => {
  try {
    let data = new Date();
    if (req.query.data) {
      data = new Date(req.query.data);
    }
    
    // Formatta la data per la query
    const dataInizio = new Date(data);
    dataInizio.setHours(0, 0, 0, 0);
    const dataFine = new Date(data);
    dataFine.setHours(23, 59, 59, 999);
    
    const totaleDocenti = await Docente.countDocuments();
    
    // Conta docenti assenti per l'intera giornata
    const assentiGiornataIntera = await Presenza.countDocuments({ 
      data: { $gte: dataInizio, $lte: dataFine },
      assenteGiornataIntera: true 
    });
    
    // Conta docenti con assenze parziali (solo alcune ore)
    const assentiParziali = await Presenza.countDocuments({ 
      data: { $gte: dataInizio, $lte: dataFine },
      assenteGiornataIntera: false,
      oreAssenza: { $exists: true, $ne: [] }
    });
    
    // Docenti presenti = totale - (assenti giornata intera + assenti parziali)
    const presenti = totaleDocenti - (assentiGiornataIntera + assentiParziali);
    
    res.status(200).json({
      success: true,
      data: {
        totaleDocenti,
        presenti,
        assentiGiornataIntera,
        assentiParziali,
        totaleAssenti: assentiGiornataIntera + assentiParziali,
        personaleAttivo: presenti
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero delle statistiche', 
      error: error.message 
    });
  }
};

// Ottieni elenco docenti presenti/assenti per data
exports.getPresenze = async (req, res) => {
  try {
    const data = req.query.data ? new Date(req.query.data) : new Date();
    const dataInizio = new Date(data);
    dataInizio.setHours(0, 0, 0, 0);
    const dataFine = new Date(data);
    dataFine.setHours(23, 59, 59, 999);
    
    // Filtra per ora specifica se fornita
    const ora = req.query.ora ? parseInt(req.query.ora) : null;
    
    let query = {
      data: { $gte: dataInizio, $lte: dataFine }
    };
    
    // Se è specificata un'ora, filtra per assenze in quell'ora specifica
    if (ora !== null) {
      query.$or = [
        { assenteGiornataIntera: true },
        { 'oreAssenza.ora': ora }
      ];
    }
    
    const presenze = await Presenza.find(query).populate({
      path: 'docente',
      populate: {
        path: 'classiInsegnamento',
        populate: {
          path: 'materia'
        }
      }
    }).populate('oreAssenza.sostituto');
    
    res.status(200).json({
      success: true,
      count: presenze.length,
      data: presenze
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero delle presenze', 
      error: error.message 
    });
  }
};

// Registra presenza/assenza
exports.registraPresenza = async (req, res) => {
  try {
    const { docenteId, data, assenteGiornataIntera, motivoGiornataIntera, oreAssenza } = req.body;
    
    // Verifica se esiste già una registrazione per questa data e docente
    let presenza = await Presenza.findOne({
      docente: docenteId,
      data: new Date(data)
    });
    
    if (presenza) {
      // Aggiorna la registrazione esistente
      presenza.assenteGiornataIntera = assenteGiornataIntera || false;
      
      if (assenteGiornataIntera) {
        presenza.motivoGiornataIntera = motivoGiornataIntera;
        presenza.oreAssenza = []; // Se assente tutto il giorno, rimuovi le ore specifiche
      } else if (oreAssenza && oreAssenza.length > 0) {
        presenza.oreAssenza = oreAssenza;
      }
      
      await presenza.save();
      
      return res.status(200).json({
        success: true,
        message: 'Presenza aggiornata con successo',
        data: presenza
      });
    }
    
    // Crea una nuova registrazione
    presenza = await Presenza.create({
      docente: docenteId,
      data: new Date(data),
      assenteGiornataIntera: assenteGiornataIntera || false,
      motivoGiornataIntera: assenteGiornataIntera ? motivoGiornataIntera : null,
      oreAssenza: !assenteGiornataIntera && oreAssenza ? oreAssenza : []
    });
    
    res.status(201).json({
      success: true,
      message: 'Presenza registrata con successo',
      data: presenza
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella registrazione della presenza', 
      error: error.message 
    });
  }
};

// Registra sostituzione per un'assenza
exports.registraSostituzione = async (req, res) => {
  try {
    const { presenzaId, sostitutoId, ora } = req.body;
    
    const presenza = await Presenza.findById(presenzaId);
    
    if (!presenza) {
      return res.status(404).json({
        success: false,
        message: 'Registrazione di presenza non trovata'
      });
    }
    
    // Se è assente per l'intera giornata
    if (presenza.assenteGiornataIntera) {
      return res.status(400).json({
        success: false,
        message: 'Per le assenze giornaliere, utilizzare il sistema di sostituzioni completo'
      });
    }
    
    // Trova l'ora specifica di assenza
    const oraAssenza = presenza.oreAssenza.find(o => o.ora === ora);
    
    if (!oraAssenza) {
      return res.status(404).json({
        success: false,
        message: 'Ora di assenza non trovata'
      });
    }
    
    // Aggiorna il sostituto
    oraAssenza.sostituto = sostitutoId;
    await presenza.save();
    
    res.status(200).json({
      success: true,
      message: 'Sostituzione registrata con successo',
      data: presenza
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella registrazione della sostituzione', 
      error: error.message 
    });
  }
};