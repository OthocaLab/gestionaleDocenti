const { validationResult } = require('express-validator');
const User = require('../models/User');

// Ottieni tutti gli utenti
exports.getAllUsers = async (req, res) => {
  try {
    // Implementa la paginazione
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    
    // Filtra per ruolo se specificato
    const filter = {};
    if (req.query.ruolo) {
      filter.ruolo = req.query.ruolo;
    }

    const users = await User.find(filter)
      .select('-password')
      .skip(startIndex)
      .limit(limit)
      .sort({ cognome: 1, nome: 1 });
    
    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: users
    });
  } catch (error) {
    console.error('Errore nel recupero degli utenti:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli utenti',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Registra un nuovo utente (solo admin)
exports.registerUser = async (req, res) => {
  try {
    // Verifica errori di validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nome, cognome, email, password, ruolo, telefono, materie, classi } = req.body;

    // Verifica se l'utente esiste già
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Un utente con questa email esiste già'
      });
    }

    // Crea un nuovo utente
    user = new User({
      nome,
      cognome,
      email,
      password,
      ruolo: ruolo || 'docente',
      telefono,
      materie: materie || [],
      classi: classi || []
    });

    await user.save();

    // Rimuovi la password dalla risposta
    user.password = undefined;

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Errore durante la registrazione dell\'utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore durante la registrazione dell\'utente',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Ottieni il profilo dell'utente corrente
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Errore nel recupero del profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del profilo',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Aggiorna il profilo dell'utente corrente
exports.updateUser = async (req, res) => {
  try {
    // Verifica errori di validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nome, cognome, email, telefono, materie, classi } = req.body;

    // Crea l'oggetto con i campi da aggiornare
    const updateFields = {};
    if (nome) updateFields.nome = nome;
    if (cognome) updateFields.cognome = cognome;
    if (email) {
      // Verifica se l'email è già in uso da un altro utente
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.user.id) {
        return res.status(400).json({
          success: false,
          message: 'Questa email è già in uso'
        });
      }
      updateFields.email = email;
    }
    if (telefono !== undefined) updateFields.telefono = telefono; // Accetta anche stringa vuota per rimuovere il telefono
    if (materie) updateFields.materie = materie;
    if (classi) updateFields.classi = classi;

    // Aggiorna l'utente
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento del profilo:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del profilo',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Aggiorna un utente specifico (solo admin)
exports.updateUserById = async (req, res) => {
  try {
    // Verifica errori di validazione
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nome, cognome, email, ruolo, telefono, materie, classi } = req.body;

    // Crea l'oggetto con i campi da aggiornare
    const updateFields = {};
    if (nome) updateFields.nome = nome;
    if (cognome) updateFields.cognome = cognome;
    if (email) {
      // Verifica se l'email è già in uso da un altro utente
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== req.params.id) {
        return res.status(400).json({
          success: false,
          message: 'Questa email è già in uso'
        });
      }
      updateFields.email = email;
    }
    if (ruolo) updateFields.ruolo = ruolo;
    if (telefono !== undefined) updateFields.telefono = telefono; // Accetta anche stringa vuota per rimuovere il telefono
    if (materie) updateFields.materie = materie;
    if (classi) updateFields.classi = classi;

    // Aggiorna l'utente
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento dell\'utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento dell\'utente',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Elimina un utente (solo admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }

    // Impedisci l'eliminazione dell'ultimo admin
    if (user.ruolo === 'admin') {
      const adminCount = await User.countDocuments({ ruolo: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Impossibile eliminare l\'ultimo amministratore'
        });
      }
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Utente eliminato con successo'
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione dell\'utente:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione dell\'utente',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};