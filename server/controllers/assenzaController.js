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