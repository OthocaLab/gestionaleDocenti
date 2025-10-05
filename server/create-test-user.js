#!/usr/bin/env node

/**
 * Script per creare un utente di test
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/gestionale-docenti';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'TestPassword123';

// Schema User
const UserSchema = new mongoose.Schema({
  nome: String,
  cognome: String,
  email: { type: String, unique: true },
  password: String,
  ruolo: String,
  createdAt: { type: Date, default: Date.now }
});

async function createTestUser() {
  try {
    console.log('\n🔧 Creazione Utente di Test\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connesso a MongoDB\n');

    const User = mongoose.model('User', UserSchema);

    // Verifica se l'utente esiste già
    const existingUser = await User.findOne({ email: TEST_EMAIL });
    
    if (existingUser) {
      console.log(`ℹ️  Utente ${TEST_EMAIL} già esistente`);
      console.log(`   ID: ${existingUser._id}`);
      console.log(`   Nome: ${existingUser.nome} ${existingUser.cognome}`);
      console.log(`   Ruolo: ${existingUser.ruolo}\n`);
      
      // Aggiorna la password
      const salt = await bcrypt.genSalt(10);
      existingUser.password = await bcrypt.hash(TEST_PASSWORD, salt);
      await existingUser.save();
      
      console.log('✅ Password aggiornata a: TestPassword123\n');
    } else {
      // Crea nuovo utente
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(TEST_PASSWORD, salt);
      
      const newUser = new User({
        nome: 'Test',
        cognome: 'User',
        email: TEST_EMAIL,
        password: hashedPassword,
        ruolo: 'docente'
      });

      await newUser.save();
      
      console.log('✅ Utente di test creato con successo!\n');
      console.log(`   Email: ${TEST_EMAIL}`);
      console.log(`   Password: ${TEST_PASSWORD}`);
      console.log(`   Ruolo: docente\n`);
    }

    await mongoose.connection.close();
    console.log('🎉 Pronto per i test!\n');
    
  } catch (error) {
    console.error('\n❌ Errore:', error.message);
    process.exit(1);
  }
}

createTestUser();

