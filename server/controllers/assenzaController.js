const Assenza = require('../models/Assenza');
const Docente = require('../models/Docente');
const { validationResult } = require('express-validator');

// Ottieni tutte le assenze
exports.getAssenze = async (req, res) => {
  try {
    const assenze = await Assenza.find()
      .populate('docente', 'nome cognome email')
      .populate('registrataDa', 'nome cognome');

    res.status(200).json({
      success: true,
      count: assenze.length,
      data: assenze
    });
  } catch (error) {
    console.error('Errore nel recupero delle assenze:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle assenze',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Ottieni una singola assenza
exports.getAssenza = async (req, res) => {
  try {
    const assenza = await Assenza.findById(req.params.id)
      .populate('docente', 'nome cognome email')
      .populate('registrataDa', 'nome cognome');

    if (!assenza) {
      return res.status(404).json({
        success: false,
        message: 'Assenza non trovata'
      });
    }

    res.status(200).json({
      success: true,
      data: assenza
    });
  } catch (error) {
    console.error('Errore nel recupero dell\'assenza:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dell\'assenza',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Funzione helper per notificare aggiornamenti ai contatori
const notifyCounterUpdate = async (docenteId) => {
  try {
    // Calcola statistiche aggiornate per il docente
    const docente = await Docente.findById(docenteId);
    if (!docente) return;
    
    // Conta le assenze del docente
    const totalAssenze = await Assenza.countDocuments({ docente: docenteId });
    
    // Prepara dati per broadcast (se hai WebSocket implementato)
    const updateData = {
      type: 'COUNTER_UPDATE',
      docenteId: docenteId,
      data: {
        oreRecupero: docente.oreRecupero,
        totalAssenze: totalAssenze,
        timestamp: new Date()
      }
    };
    
    // Log per debug
    console.log(`📊 Contatori aggiornati per docente ${docente.nome} ${docente.cognome}:`, updateData.data);
    
    // TODO: Implementare WebSocket broadcast se necessario
    // io.emit('counterUpdate', updateData);
    
    return updateData;
  } catch (error) {
    console.error('Errore nella notifica degli aggiornamenti:', error);
  }
};

// Crea una nuova assenza
exports.createAssenza = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Aggiungi l'utente che registra l'assenza
    req.body.registrataDa = req.user.id;

    // Estrai i dati per le ore da recuperare
    const { aggiungiOreRecupero, numeroOreRecupero, docente: docenteId } = req.body;

    const assenza = await Assenza.create(req.body);

    // Se richiesto, aggiorna le ore da recuperare del docente
    if (aggiungiOreRecupero && numeroOreRecupero > 0) {
      try {
        const docente = await Docente.findById(docenteId);
        if (docente) {
          docente.oreRecupero = (docente.oreRecupero || 0) + numeroOreRecupero;
          await docente.save();
          
          console.log(`✅ Aggiunte ${numeroOreRecupero} ore da recuperare al docente ${docente.nome} ${docente.cognome}. Totale: ${docente.oreRecupero}`);
          
          // Notifica l'aggiornamento dei contatori
          await notifyCounterUpdate(docenteId);
        }
      } catch (oreError) {
        console.error('Errore nell\'aggiornamento delle ore da recuperare:', oreError);
        // Non interrompiamo il processo se l'aggiornamento delle ore fallisce
      }
    } else {
      // Anche se non aggiungiamo ore, notifichiamo l'aggiornamento per le assenze
      await notifyCounterUpdate(docenteId);
    }

    // Popola i dati per la risposta
    const assenzaPopulated = await Assenza.findById(assenza._id)
      .populate('docente', 'nome cognome email oreRecupero')
      .populate('registrataDa', 'nome cognome');

    res.status(201).json({
      success: true,
      data: assenzaPopulated,
      message: aggiungiOreRecupero && numeroOreRecupero > 0 
        ? `Assenza registrata e aggiunte ${numeroOreRecupero} ore da recuperare` 
        : 'Assenza registrata con successo'
    });
  } catch (error) {
    console.error('Errore nella creazione dell\'assenza:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione dell\'assenza',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Aggiorna un'assenza
exports.updateAssenza = async (req, res) => {
  try {
    let assenza = await Assenza.findById(req.params.id);

    if (!assenza) {
      return res.status(404).json({
        success: false,
        message: 'Assenza non trovata'
      });
    }

    assenza = await Assenza.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: assenza
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'assenza:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento dell\'assenza',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Elimina un'assenza
exports.deleteAssenza = async (req, res) => {
  try {
    const assenza = await Assenza.findById(req.params.id);

    if (!assenza) {
      return res.status(404).json({
        success: false,
        message: 'Assenza non trovata'
      });
    }

    // Elimina tutte le sostituzioni associate a questa assenza
    const Sostituzione = require('../models/Sostituzione');
    await Sostituzione.deleteMany({ assenza: assenza._id });

    await assenza.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'assenza:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione dell\'assenza',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Ottieni i docenti assenti per una data specifica
exports.getDocentiPerData = async (req, res) => {
  try {
    const { data } = req.query;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'La data è obbligatoria'
      });
    }

    // Converti la data in oggetto Date
    const dataRichiesta = new Date(data);
    
    // Se la data non è valida
    if (isNaN(dataRichiesta.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato data non valido. Usa il formato YYYY-MM-DD'
      });
    }
    
    // Imposta l'ora a 00:00:00 per la data richiesta
    dataRichiesta.setHours(0, 0, 0, 0);
    
    // Crea una copia della data per il giorno successivo
    const dataSuccessiva = new Date(dataRichiesta);
    dataSuccessiva.setDate(dataSuccessiva.getDate() + 1);
    
    // Trova le assenze che includono la data richiesta
    const assenze = await Assenza.find({
      dataInizio: { $lte: dataSuccessiva },
      dataFine: { $gte: dataRichiesta }
    }).populate('docente', 'nome cognome email');

    // Estrai i docenti dalle assenze
    const docentiAssenti = await Promise.all(
      assenze.map(async (assenza) => {
        const docente = assenza.docente;
        
        if (!docente) {
          return null;
        }
        
        // Ottieni ulteriori dettagli del docente
        try {
          // Popola le classi di insegnamento del docente
          const docenteCompleto = await Docente.findById(docente._id)
            .populate({
              path: 'classiInsegnamento',
              select: 'codiceClasse descrizione'
            });
          
          // Estrai i codici delle classi di insegnamento
          let classiDisplay = '';
          if (docenteCompleto.classiInsegnamento && docenteCompleto.classiInsegnamento.length > 0) {
            // Unisce tutti i codici delle classi separati da virgola
            classiDisplay = docenteCompleto.classiInsegnamento
              .map(classe => classe.codiceClasse || classe.descrizione || '')
              .filter(Boolean)
              .join(', ');
          }
          
          // Crea un oggetto con le informazioni combinate
          return {
            _id: docente._id,
            nome: docente.nome,
            cognome: docente.cognome,
            email: docente.email,
            classe: classiDisplay,
            materia: docenteCompleto.materia || '',
            motivoAssenza: assenza.tipoAssenza
          };
        } catch (error) {
          console.error(`Errore nel recupero dei dettagli del docente ${docente._id}: ${error.message}`);
          return {
            _id: docente._id,
            nome: docente.nome,
            cognome: docente.cognome,
            email: docente.email,
            classe: '',
            materia: '',
            motivoAssenza: assenza.tipoAssenza
          };
        }
      })
    );
    
    // Filtra eventuali valori null (docenti non trovati)
    const docentiValidi = docentiAssenti.filter(doc => doc !== null);

    res.status(200).json({
      success: true,
      count: docentiValidi.length,
      data: docentiValidi
    });
  } catch (error) {
    console.error('Errore nel recupero dei docenti assenti per data:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei docenti assenti per data',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Autocomplete per la ricerca dei docenti
exports.autocompleteDocenti = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Verifica che la query abbia almeno 3 caratteri
    if (!query || query.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'La query deve contenere almeno 3 caratteri'
      });
    }

    // Cerca docenti che corrispondono alla query
    const docenti = await Docente.find({
      $or: [
        { nome: { $regex: query, $options: 'i' } },
        { cognome: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { codiceFiscale: { $regex: query, $options: 'i' } }
      ]
    }).select('nome cognome email codiceFiscale');

    res.status(200).json({
      success: true,
      count: docenti.length,
      data: docenti
    });
  } catch (error) {
    console.error('Errore nella ricerca dei docenti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella ricerca dei docenti',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Ottieni statistiche e contatori aggiornati
exports.getStatistiche = async (req, res) => {
  try {
    const { docenteId } = req.query;
    
    if (docenteId) {
      // Statistiche per un docente specifico
      const docente = await Docente.findById(docenteId);
      if (!docente) {
        return res.status(404).json({
          success: false,
          message: 'Docente non trovato'
        });
      }
      
      const totalAssenze = await Assenza.countDocuments({ docente: docenteId });
      const assenzeGiustificate = await Assenza.countDocuments({ 
        docente: docenteId, 
        giustificata: true 
      });
      
      return res.status(200).json({
        success: true,
        data: {
          docente: {
            _id: docente._id,
            nome: docente.nome,
            cognome: docente.cognome,
            oreRecupero: docente.oreRecupero || 0
          },
          statistiche: {
            totalAssenze,
            assenzeGiustificate,
            assenzeNonGiustificate: totalAssenze - assenzeGiustificate
          }
        }
      });
    }
    
    // Statistiche generali
    const totalDocenti = await Docente.countDocuments({ stato: 'attivo' });
    const docentiConOreRecupero = await Docente.countDocuments({ 
      stato: 'attivo',
      oreRecupero: { $gt: 0 } 
    });
    const totalAssenze = await Assenza.countDocuments();
    const assenzeGiustificate = await Assenza.countDocuments({ giustificata: true });
    
    // Top 5 docenti con più ore da recuperare
    const topDocentiRecupero = await Docente.find({ 
      stato: 'attivo',
      oreRecupero: { $gt: 0 } 
    })
    .sort({ oreRecupero: -1 })
    .limit(5)
    .select('nome cognome oreRecupero');
    
    res.status(200).json({
      success: true,
      data: {
        statistiche: {
          totalDocenti,
          docentiConOreRecupero,
          totalAssenze,
          assenzeGiustificate,
          assenzeNonGiustificate: totalAssenze - assenzeGiustificate
        },
        topDocentiRecupero
      }
    });
  } catch (error) {
    console.error('Errore nel recupero delle statistiche:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};