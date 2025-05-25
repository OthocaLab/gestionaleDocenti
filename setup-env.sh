#!/bin/bash

# Script per configurare l'ambiente Othoca Labs
echo "🚀 Configurazione ambiente Othoca Labs..."

# Controlla se il file .env esiste già
if [ -f ".env" ]; then
    echo "⚠️  Il file .env esiste già."
    read -p "Vuoi sovrascriverlo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operazione annullata."
        exit 1
    fi
fi

# Copia la configurazione
if [ -f "environment-config.txt" ]; then
    cp environment-config.txt .env
    echo "✅ File .env creato con successo!"
    echo ""
    echo "📝 PROSSIMI PASSI:"
    echo "1. Modifica il file .env con i tuoi dati:"
    echo "   - SMTP_USER: la tua email Gmail"
    echo "   - SMTP_PASSWORD: password per app Gmail"
    echo "   - JWT_SECRET: una chiave segreta sicura"
    echo ""
    echo "2. Per configurare Gmail SMTP:"
    echo "   - Attiva 2FA: https://myaccount.google.com/security"
    echo "   - Crea password app: https://myaccount.google.com/apppasswords"
    echo ""
    echo "3. Avvia l'applicazione:"
    echo "   - Backend: cd server && npm run dev"
    echo "   - Frontend: cd client && npm run dev"
    echo ""
else
    echo "❌ File environment-config.txt non trovato!"
    exit 1
fi 