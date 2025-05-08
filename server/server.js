const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestionale_docenti';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connessione a MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connessione a MongoDB stabilita'))
.catch(err => {
  console.error('Errore di connessione a MongoDB:', err);
  // Se non riesci a connetterti al database, puoi continuare
  // ma è meglio che l'utente lo sappia
  console.log('Il server continuerà a funzionare senza MongoDB');
});

// Definizione dello schema e del modello per i docenti (esempio)
const docenteSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  cognome: { type: String, required: true },
  materia: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now }
});

const Docente = mongoose.model('Docente', docenteSchema);

// Rotte di base
app.get('/', (req, res) => {
  res.json({ message: 'API del gestionale docenti funzionante!' });
});

// Rotte per i docenti
app.get('/api/docenti', async (req, res) => {
  try {
    const docenti = await Docente.find();
    res.json(docenti);
  } catch (error) {
    console.error('Errore nel recupero dei docenti:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

app.post('/api/docenti', async (req, res) => {
  try {
    const { nome, cognome, materia, email } = req.body;
    const nuovoDocente = new Docente({ nome, cognome, materia, email });
    await nuovoDocente.save();
    res.status(201).json(nuovoDocente);
  } catch (error) {
    console.error('Errore nella creazione del docente:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
});

// Esempio rotta di login (semplificata)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // Questa è una logica di autenticazione molto semplificata
  // In un'applicazione reale, dovresti usare bcrypt per confrontare le password
  if (username === 'admin' && password === 'password') {
    res.json({
      success: true,
      message: 'Login effettuato con successo',
      user: { username, role: 'admin' }
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Credenziali non valide'
    });
  }
});

// Avvio del server
app.listen(PORT, () => {
  console.log(`Server in esecuzione sulla porta ${PORT}`);
});
