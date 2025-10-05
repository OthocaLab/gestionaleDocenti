# 🔧 Installazione Redis in Locale (Opzione A)

> **Nota**: Questa guida è per installare Redis direttamente sul sistema per sviluppo locale.  
> Se preferisci usare Docker, segui le istruzioni già presenti in `docker-compose.yml`.

---

## 📋 Prerequisiti

- Sistema operativo Linux (Ubuntu/Debian) o macOS
- Permessi sudo per installazione

---

## 🐧 Ubuntu / Debian

### 1. Aggiornare i repository

```bash
sudo apt update
```

### 2. Installare Redis Server

```bash
sudo apt install redis-server -y
```

### 3. Verificare installazione

```bash
redis-server --version
```

Output atteso:
```
Redis server v=7.x.x sha=...
```

### 4. Avviare Redis

```bash
sudo systemctl start redis-server
```

### 5. Abilitare avvio automatico (opzionale)

```bash
sudo systemctl enable redis-server
```

### 6. Verificare stato servizio

```bash
sudo systemctl status redis-server
```

Output atteso:
```
● redis-server.service - Advanced key-value store
     Loaded: loaded (/lib/systemd/system/redis-server.service; enabled)
     Active: active (running) since ...
```

### 7. Testare connessione

```bash
redis-cli ping
```

Output atteso:
```
PONG
```

---

## 🍎 macOS (con Homebrew)

### 1. Installare Homebrew (se non già installato)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 2. Installare Redis

```bash
brew install redis
```

### 3. Avviare Redis

**Avvio manuale** (temporaneo):
```bash
redis-server
```

**Avvio come servizio** (background):
```bash
brew services start redis
```

### 4. Verificare connessione

```bash
redis-cli ping
```

Output atteso: `PONG`

---

## 🔧 Configurazione Base per Sviluppo

### 1. File di configurazione

Il file di configurazione Redis si trova in:
- **Ubuntu/Debian**: `/etc/redis/redis.conf`
- **macOS**: `/usr/local/etc/redis.conf` (Homebrew)

### 2. Configurazione senza password (sviluppo)

Per sviluppo locale, puoi lasciare Redis senza password. Assicurati che nel file `.env` del progetto:

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 3. Riavviare Redis dopo modifiche config

**Ubuntu/Debian**:
```bash
sudo systemctl restart redis-server
```

**macOS**:
```bash
brew services restart redis
```

---

## 🔐 Configurazione Sicurezza (Opzionale per Sviluppo Locale)

Se vuoi aggiungere una password anche in locale:

### 1. Modifica config Redis

```bash
sudo nano /etc/redis/redis.conf
```

### 2. Trova e decommentare la riga

```
# requirepass foobared
```

Cambia in:
```
requirepass tua_password_qui
```

### 3. Salva e chiudi (Ctrl+O, Ctrl+X)

### 4. Riavvia Redis

```bash
sudo systemctl restart redis-server
```

### 5. Aggiorna .env del progetto

```env
REDIS_PASSWORD=tua_password_qui
```

### 6. Test connessione con password

```bash
redis-cli -a tua_password_qui ping
```

---

## 🧪 Comandi Utili per Testing

### Connessione a Redis CLI

```bash
redis-cli
```

### Testare operazioni base

```bash
# Set un valore
127.0.0.1:6379> SET test "Hello Redis"
OK

# Get un valore
127.0.0.1:6379> GET test
"Hello Redis"

# Vedere tutte le chiavi
127.0.0.1:6379> KEYS *
1) "test"

# Eliminare una chiave
127.0.0.1:6379> DEL test
(integer) 1

# Uscire
127.0.0.1:6379> EXIT
```

### Monitorare operazioni in tempo reale

```bash
redis-cli MONITOR
```

Tieni questo terminale aperto mentre usi l'applicazione per vedere tutte le operazioni Redis.

### Statistiche Redis

```bash
redis-cli INFO stats
```

### Vedere chiavi di reset password

```bash
redis-cli KEYS "reset_token:*"
```

### Controllare TTL di una chiave

```bash
redis-cli TTL "reset_token:email@example.com"
```

---

## 🛑 Comandi Gestione Servizio

### Ubuntu/Debian

```bash
# Avviare
sudo systemctl start redis-server

# Fermare
sudo systemctl stop redis-server

# Riavviare
sudo systemctl restart redis-server

# Stato
sudo systemctl status redis-server

# Abilitare avvio automatico
sudo systemctl enable redis-server

# Disabilitare avvio automatico
sudo systemctl disable redis-server
```

### macOS (Homebrew)

```bash
# Avviare
brew services start redis

# Fermare
brew services stop redis

# Riavviare
brew services restart redis

# Stato
brew services list | grep redis
```

---

## ⚠️ Troubleshooting

### Redis non si avvia

**Problema**: Port 6379 già in uso

**Soluzione**:
```bash
# Trova processo usando porta 6379
sudo lsof -i :6379

# Termina processo
sudo kill -9 <PID>

# Riavvia Redis
sudo systemctl start redis-server
```

### Errore "Connection refused"

**Causa**: Redis non è avviato

**Soluzione**:
```bash
sudo systemctl start redis-server
redis-cli ping
```

### Errore "NOAUTH Authentication required"

**Causa**: Redis ha una password ma non la stai fornendo

**Soluzione**:
```bash
redis-cli -a tua_password
```

Oppure aggiorna `REDIS_PASSWORD` nel file `.env`

### Redis consuma troppa memoria

**Soluzione**: Imposta limite massimo in `redis.conf`

```
maxmemory 256mb
maxmemory-policy allkeys-lru
```

---

## 📊 Verifica Installazione Completa

Dopo aver installato Redis, verifica che tutto funzioni:

```bash
# 1. Redis è in esecuzione
redis-cli ping
# Output: PONG

# 2. Puoi scrivere dati
redis-cli SET test_key "test_value"
# Output: OK

# 3. Puoi leggere dati
redis-cli GET test_key
# Output: "test_value"

# 4. Puoi eliminare dati
redis-cli DEL test_key
# Output: (integer) 1

# 5. Verifica versione
redis-server --version
```

Se tutti i comandi funzionano, Redis è installato correttamente! ✅

---

## 🚀 Prossimi Passi

Ora che Redis è installato:

1. ✅ Verifica che le variabili d'ambiente siano configurate in `.env`
2. ✅ Continua con il Punto 2 della todolist: **Configurazione Redis** (creare `server/config/redisClient.js`)
3. ✅ Avvia il server backend e verifica i log di connessione Redis

---

## 📚 Risorse Utili

- [Documentazione ufficiale Redis](https://redis.io/documentation)
- [Redis Quick Start](https://redis.io/topics/quickstart)
- [Redis CLI Guide](https://redis.io/topics/rediscli)

---

**Ultima modifica**: 5 Ottobre 2025  
**Versione**: 1.0

