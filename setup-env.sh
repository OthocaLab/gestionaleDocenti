#!/bin/bash

# Script per configurare l'ambiente Othoca Labs
echo "🚀 Configurazione ambiente Othoca Labs..."
echo ""

# Funzione per mostrare il menu
show_menu() {
    echo "Seleziona l'ambiente da configurare:"
    echo "1) 🔧 Development (sviluppo locale)"
    echo "2) 🚀 Production (server di produzione)"
    echo "3) ❌ Annulla"
    echo ""
}

# Funzione per configurare development
setup_development() {
    echo "📝 Configurazione ambiente DEVELOPMENT..."
    if [ -f "environment-config.txt" ]; then
        cp environment-config.txt .env
        echo "✅ File .env creato per DEVELOPMENT!"
        show_dev_instructions
    else
        echo "❌ File environment-config.txt non trovato!"
        exit 1
    fi
}

# Funzione per configurare production
setup_production() {
    echo "🚀 Configurazione ambiente PRODUCTION..."
    if [ -f "environment-production.txt" ]; then
        cp environment-production.txt .env
        echo "✅ File .env creato per PRODUCTION!"
        show_prod_instructions
    else
        echo "❌ File environment-production.txt non trovato!"
        exit 1
    fi
}

# Istruzioni per development
show_dev_instructions() {
    echo ""
    echo "📝 PROSSIMI PASSI per DEVELOPMENT:"
    echo "1. Modifica il file .env con i tuoi dati:"
    echo "   - SMTP_USER: la tua email Gmail"
    echo "   - SMTP_PASSWORD: password per app Gmail"
    echo ""
    echo "2. Per configurare Gmail SMTP:"
    echo "   - Attiva 2FA: https://myaccount.google.com/security"
    echo "   - Crea password app: https://myaccount.google.com/apppasswords"
    echo ""
    echo "3. Avvia l'applicazione:"
    echo "   - Docker: docker-compose up -d"
    echo "   - Manuale: cd server && npm run dev (in un terminale)"
    echo "             cd client && npm run dev (in un altro terminale)"
    echo ""
    echo "4. Accedi all'applicazione:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5000/api"
    echo ""
}

# Istruzioni per production
show_prod_instructions() {
    echo ""
    echo "🚀 PROSSIMI PASSI per PRODUCTION:"
    echo ""
    echo "⚠️  IMPORTANTE: Modifica TUTTI i valori nel file .env:"
    echo ""
    echo "1. 🔐 Sicurezza:"
    echo "   - JWT_SECRET: genera una chiave sicura (min 32 caratteri)"
    echo "   - MONGODB_URI: configura il database di produzione"
    echo ""
    echo "2. 🌐 Domini e URL:"
    echo "   - Sostituisci 'yourdomain.com' con il tuo dominio reale"
    echo "   - ALLOWED_ORIGINS: domini permessi per CORS"
    echo "   - NEXT_PUBLIC_API_URL: URL pubblico delle API"
    echo ""
    echo "3. 📧 Email:"
    echo "   - SMTP_USER: email di produzione"
    echo "   - SMTP_PASSWORD: password per app Gmail di produzione"
    echo "   - EMAIL_FROM: indirizzo mittente con il tuo dominio"
    echo ""
    echo "4. 🚀 Deploy:"
    echo "   - docker-compose up -d"
    echo ""
    echo "5. 🔍 Verifica:"
    echo "   - Frontend: https://tuodominio.com:3000"
    echo "   - Backend API: https://tuodominio.com:5000/api"
    echo ""
    echo "📋 CHECKLIST PRODUZIONE:"
    echo "   □ JWT_SECRET cambiato"
    echo "   □ Database di produzione configurato"
    echo "   □ Domini reali configurati"
    echo "   □ Email di produzione configurata"
    echo "   □ SSL/HTTPS configurato"
    echo ""
}

# Controlla se il file .env esiste già
if [ -f ".env" ]; then
    echo "⚠️  Il file .env esiste già."
    read -p "Vuoi sovrascriverlo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operazione annullata."
        exit 1
    fi
    echo ""
fi

# Mostra il menu e gestisci la scelta
while true; do
    show_menu
    read -p "Inserisci la tua scelta (1-3): " choice
    echo ""
    
    case $choice in
        1)
            setup_development
            break
            ;;
        2)
            setup_production
            break
            ;;
        3)
            echo "❌ Operazione annullata."
            exit 0
            ;;
        *)
            echo "❌ Scelta non valida. Riprova."
            echo ""
            ;;
    esac
done

echo "🎉 Configurazione completata!"
echo ""
echo "💡 Suggerimenti:"
echo "   - Non committare mai il file .env"
echo "   - Fai un backup delle configurazioni di produzione"
echo "   - Testa sempre in development prima del deploy"
echo "" 