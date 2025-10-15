#!/bin/bash

# Impostazioni per gestione errori
set -e
set -u

echo "🚀 Avvio servizi per Gestionale Docenti..."

# Controllo e avvio servizi
echo "📊 Avvio MongoDB..."
if ! systemctl is-active --quiet mongodb; then
    sudo systemctl start mongodb
fi

echo "📝 Avvio Redis..."
if ! systemctl is-active --quiet redis; then
    sudo systemctl start redis
fi

# Avvio server in background
echo "🖥️  Avvio server Node.js..."
cd server
npm run dev &
SERVER_PID=$!

# Attendi qualche secondo per permettere al server di inizializzare
sleep 3

# Avvio client
echo "🌐 Avvio client Next.js..."
cd ../client
npm run dev &
CLIENT_PID=$!

# Gestione chiusura graceful
cleanup() {
    echo "⚠️  Arresto dei servizi..."
    kill $SERVER_PID
    kill $CLIENT_PID
    exit 0
}

trap cleanup SIGINT SIGTERM

# Mantieni lo script in esecuzione
wait