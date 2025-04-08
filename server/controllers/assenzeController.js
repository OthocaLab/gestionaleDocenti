const Docente = require('../models/Docente');
const Assenza = require('../models/Assenze');

// Ottieni statistiche assenze
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
    const assentiGiornataIntera = await Assenza.countDocuments({ 
      data: { $gte: dataInizio, $lte: dataFine },
      assenteGiornataIntera: true 
    });
    
    // Conta docenti con assenze parziali (solo alcune ore)
    const assentiParziali = await Assenza.countDocuments({ 
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

// Ottieni elenco docenti assenti per data
exports.getAssenze = async (req, res) => {
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
        { 'oreAssenza.ora': ora },
        { orario: ora }
      ];
    }
    
    const assenze = await Assenza.find(query)
      .populate('docente')
      .populate('classe')
      .populate('materia')
      .populate('oreAssenza.sostituto');
    
    res.status(200).json({
      success: true,
      count: assenze.length,
      data: assenze
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero delle assenze', 
      error: error.message 
    });
  }
};

// Registra assenza
exports.registraAssenza = async (req, res) => {
  try {
    const { 
      docenteId, 
      classeId, 
      materiaId, 
      data, 
      orario, 
      assenteGiornataIntera, 
      motivazione, 
      tipo, 
      oreAssenza 
    } = req.body;
    
    // Verifica se esiste già una registrazione per questa data e docente
    let assenza = await Assenza.findOne({
      docente: docenteId,
      data: new Date(data)
    });
    
    if (assenza) {
      // Aggiorna la registrazione esistente
      assenza.classe = classeId || assenza.classe;
      assenza.materia = materiaId || assenza.materia;
      assenza.orario = orario || assenza.orario;
      assenza.assenteGiornataIntera = assenteGiornataIntera || false;
      
      if (motivazione) assenza.motivazione = motivazione;
      if (tipo) assenza.tipo = tipo;
      
      if (assenteGiornataIntera) {
        assenza.oreAssenza = []; // Se assente tutto il giorno, rimuovi le ore specifiche
      } else if (oreAssenza && oreAssenza.length > 0) {
        assenza.oreAssenza = oreAssenza;
      }
      
      await assenza.save();
      
      return res.status(200).json({
        success: true,
        message: 'Assenza aggiornata con successo',
        data: assenza
      });
    }
    
    // Crea una nuova registrazione
    assenza = await Assenza.create({
      docente: docenteId,
      classe: classeId || null,
      materia: materiaId || null,
      data: new Date(data),
      orario: orario || null,
      assenteGiornataIntera: assenteGiornataIntera || false,
      motivazione: motivazione || null,
      tipo: tipo || 'Altro',
      oreAssenza: !assenteGiornataIntera && oreAssenza ? oreAssenza : []
    });
    
    res.status(201).json({
      success: true,
      message: 'Assenza registrata con successo',
      data: assenza
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella registrazione dell\'assenza', 
      error: error.message 
    });
  }
};

// Registra sostituzione per un'assenza
exports.registraSostituzione = async (req, res) => {
  try {
    const { assenzaId, sostitutoId, ora } = req.body;
    
    const assenza = await Assenza.findById(assenzaId);
    
    if (!assenza) {
      return res.status(404).json({
        success: false,
        message: 'Assenza non trovata'
      });
    }
    
    // Se è specificata un'ora e l'assenza è per ore specifiche
    if (ora && !assenza.assenteGiornataIntera) {
      // Trova l'ora specifica di assenza
      const oraAssenza = assenza.oreAssenza.find(o => o.ora === ora);
      
      if (oraAssenza) {
        // Aggiorna il sostituto per quell'ora specifica
        oraAssenza.sostituto = sostitutoId;
      } else {
        // Aggiungi una nuova ora di assenza con sostituto
        assenza.oreAssenza.push({
          ora,
          motivo: assenza.motivazione,
          sostituto: sostitutoId
        });
      }
    } else {
      // Per assenze giornaliere o se l'ora non è specificata
      // Qui potremmo gestire la sostituzione in modo diverso
      // Per ora, impostiamo solo un campo sostituto generale
      assenza.sostituto = sostitutoId;
    }
    
    await assenza.save();
    
    res.status(200).json({
      success: true,
      message: 'Sostituzione registrata con successo',
      data: assenza
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella registrazione della sostituzione', 
      error: error.message 
    });
  }
};