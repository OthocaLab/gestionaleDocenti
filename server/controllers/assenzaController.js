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

    const assenza = await Assenza.create(req.body);

    res.status(201).json({
      success: true,
      data: assenza
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