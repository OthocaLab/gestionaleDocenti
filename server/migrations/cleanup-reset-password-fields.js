/**
 * Migration Script: Cleanup Reset Password Fields
 * 
 * @description Rimuove i campi obsoleti resetPasswordToken e resetPasswordExpire
 *              da tutti i documenti User esistenti nel database.
 * 
 * @date 2025-10-05
 * @reason Migrazione da sistema reset password (MongoDB) a JWT + Redis
 * 
 * @usage node server/migrations/cleanup-reset-password-fields.js
 */

require('dotenv').config({ path: '../../.env' });
const mongoose = require('mongoose');

// Connessione al database
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI non trovato nel file .env');
  process.exit(1);
}

console.log('🔄 Migration: Cleanup Reset Password Fields\n');
console.log(`📊 Connessione a: ${MONGODB_URI}\n`);

async function runMigration() {
  try {
    // Connetti al database
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso al database MongoDB\n');

    // Ottieni il modello User
    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

    // Conta gli utenti con campi obsoleti
    const usersWithOldFields = await User.countDocuments({
      $or: [
        { resetPasswordToken: { $exists: true } },
        { resetPasswordExpire: { $exists: true } }
      ]
    });

    console.log(`📋 Utenti con campi obsoleti trovati: ${usersWithOldFields}`);

    if (usersWithOldFields === 0) {
      console.log('\n✅ Nessuna migrazione necessaria. Database già pulito!');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Chiedi conferma (se non in modalità --force)
    if (!process.argv.includes('--force')) {
      console.log('\n⚠️  Questa operazione rimuoverà i campi:');
      console.log('   - resetPasswordToken');
      console.log('   - resetPasswordExpire');
      console.log(`\n   da ${usersWithOldFields} documenti utente.`);
      console.log('\n💡 Per procedere senza conferma, usa: node ... --force');
      console.log('\n🔴 INTERROTTO: Aggiungi --force per eseguire la migrazione');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n🚀 Inizio migrazione...\n');

    // Rimuovi i campi obsoleti
    const result = await User.updateMany(
      {
        $or: [
          { resetPasswordToken: { $exists: true } },
          { resetPasswordExpire: { $exists: true } }
        ]
      },
      {
        $unset: {
          resetPasswordToken: '',
          resetPasswordExpire: ''
        }
      }
    );

    console.log(`✅ Migrazione completata!`);
    console.log(`   - Documenti modificati: ${result.modifiedCount}`);
    console.log(`   - Documenti matchati: ${result.matchedCount}`);

    // Verifica che i campi siano stati rimossi
    const remainingUsers = await User.countDocuments({
      $or: [
        { resetPasswordToken: { $exists: true } },
        { resetPasswordExpire: { $exists: true } }
      ]
    });

    if (remainingUsers > 0) {
      console.log(`\n⚠️  Attenzione: ${remainingUsers} documenti hanno ancora campi obsoleti`);
    } else {
      console.log('\n✅ Verifica: Tutti i campi obsoleti sono stati rimossi con successo');
    }

    // Chiudi connessione
    await mongoose.connection.close();
    console.log('\n🔌 Disconnesso dal database');
    console.log('\n🎉 Migrazione completata con successo!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Errore durante la migrazione:', error);
    
    try {
      await mongoose.connection.close();
    } catch (closeError) {
      console.error('❌ Errore chiusura connessione:', closeError);
    }
    
    process.exit(1);
  }
}

// Gestione interruzione
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Migrazione interrotta dall\'utente');
  try {
    await mongoose.connection.close();
  } catch (error) {
    // Ignora errori di chiusura
  }
  process.exit(0);
});

// Esegui migrazione
runMigration();

