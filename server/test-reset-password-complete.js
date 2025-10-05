#!/usr/bin/env node

/**
 * Test Completo Reset Password con JWT + Redis
 * 
 * @description Script per testare il flusso completo di reset password
 * @usage node test-reset-password-complete.js
 */

require('dotenv').config();
const axios = require('axios');

// Configurazione
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const NEW_PASSWORD = 'NewSecurePassword123';

// Colori per output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji, message, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function logSuccess(message) {
  log('✅', message, colors.green);
}

function logError(message) {
  log('❌', message, colors.red);
}

function logInfo(message) {
  log('ℹ️ ', message, colors.cyan);
}

function logWarning(message) {
  log('⚠️ ', message, colors.yellow);
}

function logStep(number, message) {
  log(`${number}️⃣ `, message, colors.bright);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testHealthCheck() {
  logStep('1', 'Test Health Check del sistema');
  
  try {
    const response = await axios.get(`${BASE_URL.replace('/api', '')}/api/health`);
    const health = response.data;
    
    logInfo(`Status generale: ${health.status}`);
    logInfo(`MongoDB: ${health.services.mongodb.status}`);
    logInfo(`Redis enabled: ${health.services.redis.enabled}`);
    logInfo(`Redis status: ${health.services.redis.status}`);
    
    if (health.services.redis.activeResetTokens !== undefined) {
      logInfo(`Token reset attivi: ${health.services.redis.activeResetTokens}`);
    }
    
    if (health.status === 'ok' && health.services.redis.status === 'connected') {
      logSuccess('Sistema pronto per i test');
      return true;
    } else {
      logWarning('Sistema non completamente pronto');
      return false;
    }
  } catch (error) {
    logError(`Errore health check: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
    }
    return false;
  }
}

async function testForgotPassword() {
  logStep('2', 'Test Forgot Password');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Message: ${response.data.message}`);
    
    if (response.data.smtp_disabled && response.data.debug_token) {
      logWarning('SMTP disabilitato - usando debug_token');
      logInfo(`Debug Token: ${response.data.debug_token.substring(0, 50)}...`);
      return response.data.debug_token;
    }
    
    if (response.data.success) {
      logSuccess('Email di reset inviata');
      logWarning('SMTP abilitato - controlla la tua email per il token');
      logInfo('Per continuare il test, inserisci il token manualmente o disabilita SMTP');
      return null;
    }
    
    return null;
  } catch (error) {
    logError(`Errore forgot password: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Message: ${error.response.data.message}`);
    }
    return null;
  }
}

async function testResetPassword(token) {
  logStep('3', 'Test Reset Password');
  
  if (!token) {
    logWarning('Token non disponibile - skip test reset');
    return false;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/reset-password/${token}`, {
      password: NEW_PASSWORD
    });
    
    logInfo(`Status: ${response.status}`);
    logInfo(`Message: ${response.data.message}`);
    
    if (response.data.success && response.data.token) {
      logSuccess('Password reimpostata con successo');
      logInfo(`Token autenticazione ricevuto: ${response.data.token.substring(0, 30)}...`);
      logInfo(`Utente: ${response.data.user.email}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logError(`Errore reset password: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Message: ${error.response.data.message}`);
    }
    return false;
  }
}

async function testTokenReuse(token) {
  logStep('4', 'Test Riutilizzo Token (deve fallire)');
  
  if (!token) {
    logWarning('Token non disponibile - skip test riutilizzo');
    return;
  }
  
  try {
    await axios.post(`${BASE_URL}/auth/reset-password/${token}`, {
      password: 'AnotherPassword456'
    });
    
    logError('ERRORE: Token riutilizzato con successo (NON dovrebbe accadere!)');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('Token correttamente rifiutato (già utilizzato)');
      logInfo(`Message: ${error.response.data.message}`);
    } else {
      logError(`Errore inaspettato: ${error.message}`);
    }
  }
}

async function testLogin() {
  logStep('5', 'Test Login con nuova password');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_EMAIL,
      password: NEW_PASSWORD
    });
    
    if (response.data.success && response.data.token) {
      logSuccess('Login riuscito con nuova password');
      logInfo(`Utente: ${response.data.user.nome} ${response.data.user.cognome}`);
      logInfo(`Ruolo: ${response.data.user.ruolo}`);
      return true;
    }
    
    return false;
  } catch (error) {
    logError(`Errore login: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Message: ${error.response.data.message}`);
    }
    return false;
  }
}

async function testInvalidToken() {
  logStep('6', 'Test Token Invalido (deve fallire)');
  
  try {
    await axios.post(`${BASE_URL}/auth/reset-password/invalid_token_123`, {
      password: 'TestPassword123'
    });
    
    logError('ERRORE: Token invalido accettato (NON dovrebbe accadere!)');
  } catch (error) {
    if (error.response && error.response.status === 400) {
      logSuccess('Token invalido correttamente rifiutato');
      logInfo(`Message: ${error.response.data.message}`);
    } else {
      logError(`Errore inaspettato: ${error.message}`);
    }
  }
}

async function testShortPassword(token) {
  logStep('7', 'Test Password Troppo Corta (deve fallire)');
  
  // Genera un nuovo token per questo test
  try {
    const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: TEST_EMAIL
    });
    
    const testToken = forgotResponse.data.debug_token;
    
    if (!testToken) {
      logWarning('Token non disponibile - skip test password corta');
      return;
    }
    
    try {
      await axios.post(`${BASE_URL}/auth/reset-password/${testToken}`, {
        password: 'short'
      });
      
      logError('ERRORE: Password corta accettata (NON dovrebbe accadere!)');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        logSuccess('Password corta correttamente rifiutata');
        logInfo(`Message: ${error.response.data.message}`);
      } else {
        logError(`Errore inaspettato: ${error.message}`);
      }
    }
  } catch (error) {
    logWarning('Impossibile generare token per test password corta');
  }
}

async function testNonExistentEmail() {
  logStep('8', 'Test Email Non Esistente');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: 'nonexistent-' + Date.now() + '@example.com'
    });
    
    if (response.data.success) {
      logSuccess('Risposta generica corretta (non rivela se email esiste)');
      logInfo(`Message: ${response.data.message}`);
    }
  } catch (error) {
    logError(`Errore inaspettato: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪  TEST COMPLETO RESET PASSWORD JWT + REDIS');
  console.log('='.repeat(60) + '\n');
  
  logInfo(`Base URL: ${BASE_URL}`);
  logInfo(`Test Email: ${TEST_EMAIL}`);
  logInfo(`Test Password: ${NEW_PASSWORD}`);
  console.log();
  
  // Test 1: Health Check
  const systemReady = await testHealthCheck();
  console.log();
  
  if (!systemReady) {
    logError('Sistema non pronto - verificare MongoDB e Redis');
    process.exit(1);
  }
  
  await wait(1000);
  
  // Test 2: Forgot Password
  const resetToken = await testForgotPassword();
  console.log();
  await wait(1000);
  
  if (!resetToken) {
    logWarning('Test incompleto - SMTP abilitato o errore nel recupero token');
    logInfo('Per test completo, imposta SMTP_ENABLED=false nel .env');
    process.exit(0);
  }
  
  // Test 3: Reset Password
  const resetSuccess = await testResetPassword(resetToken);
  console.log();
  await wait(1000);
  
  if (!resetSuccess) {
    logError('Reset password fallito - test interrotti');
    process.exit(1);
  }
  
  // Test 4: Token Reuse
  await testTokenReuse(resetToken);
  console.log();
  await wait(1000);
  
  // Test 5: Login
  const loginSuccess = await testLogin();
  console.log();
  await wait(1000);
  
  // Test 6: Token Invalido
  await testInvalidToken();
  console.log();
  await wait(1000);
  
  // Test 7: Password Corta
  await testShortPassword();
  console.log();
  await wait(1000);
  
  // Test 8: Email Non Esistente
  await testNonExistentEmail();
  console.log();
  
  // Riepilogo
  console.log('\n' + '='.repeat(60));
  console.log('📊  RIEPILOGO TEST');
  console.log('='.repeat(60) + '\n');
  
  if (systemReady && resetSuccess && loginSuccess) {
    logSuccess('Tutti i test principali completati con successo! 🎉');
  } else {
    logWarning('Alcuni test sono falliti o incompleti');
  }
  
  console.log();
  logInfo('Per test più dettagliati, vedi: TEST-RESET-PASSWORD-FLOW.md');
  console.log();
}

// Esegui i test
runAllTests().catch(error => {
  console.error('\n❌ Errore fatale durante i test:', error);
  process.exit(1);
});

