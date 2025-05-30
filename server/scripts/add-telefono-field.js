const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Usa MONGODB_URI o fallback a URI locale per sviluppo
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestionaledocenti';

console.log('🔧 Verifica connessione database:');
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Caricato da .env' : '❌ Non trovato');
console.log('- URI utilizzato:', mongoURI);

// Connessione al database
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const migrationAddTelefonoField = async () => {
  try {
    console.log('🚀 Avvio migrazione: Aggiunta campo telefono agli utenti...');
    
    // Aggiorna tutti gli utenti che non hanno il campo telefono
    const result = await mongoose.connection.db.collection('users').updateMany(
      { telefono: { $exists: false } }, // Filtra utenti senza campo telefono
      { $set: { telefono: '' } }        // Imposta telefono come stringa vuota
    );
    
    console.log(`✅ Migrazione completata con successo!`);
    console.log(`📊 Utenti aggiornati: ${result.modifiedCount}`);
    console.log(`📊 Utenti esaminati: ${result.matchedCount}`);
    
    if (result.modifiedCount === 0) {
      console.log('ℹ️  Nessun utente da aggiornare (campo telefono già presente)');
    }
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
    console.log('📝 Connessione al database chiusa');
  }
};

// Verifica che la connessione sia stabilita prima di eseguire la migrazione
mongoose.connection.once('open', async () => {
  console.log('🔌 Connesso al database MongoDB');
  await migrationAddTelefonoField();
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Errore di connessione al database:', error);
  process.exit(1);
}); 