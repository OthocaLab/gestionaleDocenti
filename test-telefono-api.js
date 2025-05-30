// Test script per verificare l'API di aggiornamento telefono
const apiBaseUrl = 'http://localhost:5000';

async function testTelefonoAPI() {
  console.log('🧪 Test API aggiornamento telefono...\n');
  
  // Dati di test per il login
  const loginData = {
    email: 'test@example.com', // Sostituire con email valida
    password: 'testpassword'    // Sostituire con password valida
  };
  
  try {
    // 1. Effettua login per ottenere token
    console.log('1. 🔐 Login...');
    const loginResponse = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });
    
    const loginResult = await loginResponse.json();
    
    if (!loginResult.success) {
      console.log('❌ Login fallito:', loginResult.message);
      console.log('ℹ️  Assicurati che esista un utente con le credenziali specificate');
      return;
    }
    
    const token = loginResult.token;
    console.log('✅ Login riuscito');
    
    // 2. Aggiorna il telefono
    console.log('\n2. 📞 Aggiornamento telefono...');
    const updateData = {
      telefono: '+39 333 1234567'
    };
    
    const updateResponse = await fetch(`${apiBaseUrl}/api/users/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const updateResult = await updateResponse.json();
    
    if (updateResult.success) {
      console.log('✅ Telefono aggiornato con successo!');
      console.log('📱 Nuovo telefono:', updateResult.data.telefono);
    } else {
      console.log('❌ Errore nell\'aggiornamento:', updateResult.message);
      if (updateResult.errors) {
        console.log('🔍 Dettagli errori:', updateResult.errors);
      }
    }
    
    // 3. Verifica i dati utente
    console.log('\n3. 👤 Verifica profilo utente...');
    const profileResponse = await fetch(`${apiBaseUrl}/api/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const profileResult = await profileResponse.json();
    
    if (profileResult.success) {
      console.log('✅ Profilo caricato correttamente');
      console.log('📋 Dati utente:');
      console.log(`   - Nome: ${profileResult.data.nome} ${profileResult.data.cognome}`);
      console.log(`   - Email: ${profileResult.data.email}`);
      console.log(`   - Telefono: ${profileResult.data.telefono || 'Non specificato'}`);
      console.log(`   - Ruolo: ${profileResult.data.ruolo}`);
    } else {
      console.log('❌ Errore nel caricamento profilo:', profileResult.message);
    }
    
    console.log('\n🎉 Test completato!');
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error);
    console.log('\nℹ️  Assicurati che:');
    console.log('   - Il server sia in esecuzione su localhost:5000');
    console.log('   - Esista un utente con le credenziali specificate');
    console.log('   - Il database sia accessibile');
  }
}

// Esegui il test
testTelefonoAPI(); 