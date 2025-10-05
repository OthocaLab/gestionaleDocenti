# 🔒 Configurazione Sicurezza Produzione

> **Priorità**: ALTA 🔴  
> **Da completare prima del deploy in produzione**

---

## ⚠️ IMPORTANTE

**NON deployare in produzione senza aver completato questa checklist.**

I valori di default sono pensati per development e **non sono sicuri** per produzione.

---

## 📋 Checklist Sicurezza

### 1. 🔑 Secret JWT Forti

#### Genera Secret Sicuri

```bash
# Genera RESET_PASSWORD_JWT_SECRET (32+ caratteri)
openssl rand -base64 32

# Genera JWT_SECRET (32+ caratteri, DIVERSO dal precedente)
openssl rand -base64 32
```

#### Aggiorna .env Production

```env
# PRIMA (❌ INSICURO)
JWT_SECRET=12345678
RESET_PASSWORD_JWT_SECRET=12345678

# DOPO (✅ SICURO)
JWT_SECRET=X9k2mP7nQ4wR8tY6uI3oL1aS5dF0gH9jK2mN4bV7cZ8xW3qE5rT6yU2iO1pA
RESET_PASSWORD_JWT_SECRET=Z8xW3qE5rT6yU2iO1pAX9k2mP7nQ4wR8tY6uI3oL1aS5dF0gH9jK2mN4bV7c
```

**✅ Verifica**: I due secret devono essere **diversi** e **lunghi almeno 32 caratteri**

---

### 2. 🔐 Password Redis

#### Opzione A: Redis Locale (Server Dedicato)

```bash
# 1. Genera password forte
REDIS_PASSWORD=$(openssl rand -base64 32)
echo $REDIS_PASSWORD

# 2. Configura Redis
redis-cli CONFIG SET requirepass "$REDIS_PASSWORD"

# 3. Verifica
redis-cli -a "$REDIS_PASSWORD" PING
# Output atteso: PONG

# 4. Rendi permanente
sudo nano /etc/redis/redis.conf
# Aggiungi: requirepass your_password_here

# 5. Riavvia Redis
sudo systemctl restart redis-server
```

#### Opzione B: Redis con Docker

Nel file `docker-compose.yml`, il servizio Redis è già configurato:

```yaml
redis:
  image: redis:7-alpine
  command: >
    sh -c "
    if [ -n \"$$REDIS_PASSWORD\" ]; then
      redis-server --requirepass \"$$REDIS_PASSWORD\"
    else
      redis-server
    fi
    "
  environment:
    - REDIS_PASSWORD=${REDIS_PASSWORD}
```

Basta impostare `REDIS_PASSWORD` nel `.env`:

```env
REDIS_PASSWORD=your_secure_password_here
```

**✅ Verifica**: Redis accetta solo connessioni autenticate

---

### 3. 🔒 Limita Bind Address Redis

#### Se Redis è Locale (stesso server del backend)

```bash
# Modifica configurazione
sudo nano /etc/redis/redis.conf

# Trova la riga:
# bind 127.0.0.1 ::1

# Assicurati che sia:
bind 127.0.0.1

# Salva e riavvia
sudo systemctl restart redis-server
```

**✅ Verifica**: Redis risponde solo su localhost

```bash
# Da localhost (dovrebbe funzionare)
redis-cli -a your_password ping

# Da remoto (dovrebbe fallire)
redis-cli -h your_server_ip -a your_password ping
```

---

### 4. 🚫 Rate Limiting Avanzato

#### Aggiungi Rate Limit Specifico per Reset Password

Crea `server/middleware/resetPasswordRateLimit.js`:

```javascript
const rateLimit = require('express-rate-limit');

// Rate limiter specifico per forgot password
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 3, // Max 3 richieste
  skipSuccessfulRequests: false,
  message: {
    success: false,
    message: 'Troppe richieste di reset password. Riprova tra 15 minuti.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  keyGenerator: (req) => {
    // Rate limit per IP E per email
    return `${req.ip}-${req.body.email || 'unknown'}`;
  },
  handler: (req, res) => {
    console.warn(`[SECURITY] Rate limit exceeded for ${req.ip} - email: ${req.body.email}`);
    res.status(429).json({
      success: false,
      message: 'Troppe richieste di reset password. Riprova tra 15 minuti.'
    });
  }
});

// Rate limiter per reset password (con token)
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 ora
  max: 5, // Max 5 tentativi
  skipSuccessfulRequests: true, // Non conta i successi
  message: {
    success: false,
    message: 'Troppi tentativi di reset. Riprova più tardi.'
  },
  trustProxy: true
});

module.exports = {
  forgotPasswordLimiter,
  resetPasswordLimiter
};
```

#### Applica i Rate Limiters

In `server/routes/authRoutes.js`:

```javascript
const { forgotPasswordLimiter, resetPasswordLimiter } = require('../middleware/resetPasswordRateLimit');

// Route per il recupero password
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);

// Route per il reset della password
router.post('/reset-password/:resetToken', resetPasswordLimiter, authController.resetPassword);
```

**✅ Verifica**: Dopo 3 tentativi di forgot-password, ottieni 429 (Too Many Requests)

---

### 5. 📊 Logging e Monitoring

#### Configura Logging Strutturato

Installa Winston:

```bash
cd server
npm install winston winston-daily-rotate-file
```

Crea `server/config/logger.js`:

```javascript
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // File per tutti i log
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d'
    }),
    // File separato per errori
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d'
    }),
    // File per eventi di sicurezza
    new DailyRotateFile({
      filename: 'logs/security-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'warn',
      maxFiles: '90d'
    })
  ]
});

// Console in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

#### Log Eventi Critici

In `server/controllers/authController.js`, aggiungi:

```javascript
const logger = require('../config/logger');

// In forgotPassword
logger.info('Reset password requested', { email, ip: req.ip });

// In resetPassword  
logger.info('Password reset successful', { email: decoded.email, ip: req.ip });

// Per tentativi sospetti
logger.warn('Invalid reset token attempt', { token: resetToken.substring(0, 20), ip: req.ip });
```

**✅ Verifica**: I log vengono salvati in `logs/`

---

### 6. 🔥 Firewall e Rete

#### Configura UFW (Ubuntu)

```bash
# Abilita firewall
sudo ufw enable

# Permetti SSH
sudo ufw allow ssh

# Permetti HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Permetti porta backend (solo se necessario da esterno)
sudo ufw allow 5000/tcp

# BLOCCA Redis da esterno (solo localhost)
sudo ufw deny 6379/tcp

# Verifica
sudo ufw status verbose
```

**✅ Verifica**: Redis (6379) è accessibile solo da localhost

---

### 7. 🔍 Monitoring Redis

#### Installa Redis CLI Tools

```bash
# Script monitoring.sh
#!/bin/bash

echo "=== Redis Health Check ==="
redis-cli -a $REDIS_PASSWORD INFO stats | grep -E "total_connections_received|total_commands_processed|keyspace"

echo ""
echo "=== Active Reset Tokens ==="
redis-cli -a $REDIS_PASSWORD KEYS "reset_token:*" | wc -l

echo ""
echo "=== Redis Memory ==="
redis-cli -a $REDIS_PASSWORD INFO memory | grep used_memory_human
```

#### Configura Alert

Crea `/etc/cron.d/redis-monitor`:

```bash
# Ogni ora, verifica Redis
0 * * * * root /path/to/monitoring.sh >> /var/log/redis-monitor.log 2>&1
```

**✅ Verifica**: Log monitoring in `/var/log/redis-monitor.log`

---

### 8. 💾 Backup Redis

#### Opzione A: RDB Snapshot (Consigliato)

```bash
# Configura in /etc/redis/redis.conf
save 900 1      # Salva se almeno 1 key cambia in 15min
save 300 10     # Salva se almeno 10 keys cambiano in 5min
save 60 10000   # Salva se almeno 10000 keys cambiano in 1min

dir /var/lib/redis
dbfilename dump.rdb
```

#### Opzione B: AOF (Append Only File)

```bash
# In /etc/redis/redis.conf
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
```

#### Script Backup Automatico

```bash
#!/bin/bash
# backup-redis.sh

BACKUP_DIR="/backup/redis"
DATE=$(date +%Y%m%d_%H%M%S)

# Crea backup
redis-cli -a $REDIS_PASSWORD BGSAVE

# Aspetta completamento
sleep 10

# Copia dump
cp /var/lib/redis/dump.rdb $BACKUP_DIR/dump_$DATE.rdb

# Mantieni solo ultimi 7 giorni
find $BACKUP_DIR -name "dump_*.rdb" -mtime +7 -delete

echo "Backup completato: $BACKUP_DIR/dump_$DATE.rdb"
```

Aggiungi a crontab:

```bash
# Backup ogni giorno alle 3 AM
0 3 * * * /path/to/backup-redis.sh >> /var/log/redis-backup.log 2>&1
```

**✅ Verifica**: Backup in `/backup/redis/`

---

### 9. 🚨 Alert e Notifiche

#### Script Alert

```bash
#!/bin/bash
# alert-redis-down.sh

if ! redis-cli -a $REDIS_PASSWORD PING > /dev/null 2>&1; then
    # Redis down - invia alert
    curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
        -H 'Content-Type: application/json' \
        -d '{"text":"🚨 ALERT: Redis is DOWN on production server!"}'
    
    # O invia email
    echo "Redis is down!" | mail -s "URGENT: Redis Down" admin@yourdomain.com
fi
```

Aggiungi a crontab:

```bash
# Check ogni 5 minuti
*/5 * * * * /path/to/alert-redis-down.sh
```

**✅ Verifica**: Ricevi notifica se Redis cade

---

### 10. 📖 Documentazione Team

#### Crea Runbook

Documenta:

1. **Come accedere a Redis**
   ```bash
   redis-cli -a $(cat /etc/redis/.password)
   ```

2. **Come verificare token attivi**
   ```bash
   redis-cli -a $(cat /etc/redis/.password) KEYS "reset_token:*"
   ```

3. **Come invalidare un token**
   ```bash
   redis-cli -a $(cat /etc/redis/.password) DEL "reset_token:user@example.com"
   ```

4. **Come fare restore da backup**
   ```bash
   sudo systemctl stop redis-server
   sudo cp /backup/redis/dump_YYYYMMDD.rdb /var/lib/redis/dump.rdb
   sudo chown redis:redis /var/lib/redis/dump.rdb
   sudo systemctl start redis-server
   ```

5. **Contatti emergenza**
   - DevOps Lead: +39 XXX XXXXXXX
   - Backend Lead: +39 XXX XXXXXXX
   - CTO: +39 XXX XXXXXXX

---

## ✅ Checklist Finale Pre-Deploy

Prima del deploy in produzione, verifica:

### Configurazione

- [ ] `JWT_SECRET` cambiato con valore sicuro (32+ caratteri)
- [ ] `RESET_PASSWORD_JWT_SECRET` diverso da `JWT_SECRET`
- [ ] `REDIS_PASSWORD` configurato con password forte
- [ ] `SMTP_ENABLED=true` con credenziali produzione
- [ ] `NODE_ENV=production`

### Redis

- [ ] Redis installato e funzionante
- [ ] Password configurata e testata
- [ ] Bind address limitato a localhost
- [ ] Backup configurato (RDB o AOF)
- [ ] Script monitoring attivo
- [ ] Alert configurati

### Sicurezza

- [ ] Rate limiting abilitato per `/forgot-password`
- [ ] Firewall configurato (UFW o iptables)
- [ ] Porta Redis (6379) bloccata da esterno
- [ ] Logging strutturato attivo
- [ ] Log rotation configurato

### Networking

- [ ] HTTPS configurato (certificato SSL)
- [ ] CORS configurato correttamente
- [ ] Reverse proxy configurato (Nginx/Apache)
- [ ] CDN configurato (opzionale)

### Monitoring

- [ ] Health check endpoint testato
- [ ] Monitoring Redis attivo
- [ ] Alert configurati (Slack/Email)
- [ ] Log centralization (opzionale)

### Documentazione

- [ ] Runbook creato e testato
- [ ] Team formato su nuovo sistema
- [ ] Procedure rollback documentate
- [ ] Contatti emergenza aggiornati

### Test

- [ ] Test end-to-end in staging
- [ ] Load test eseguito
- [ ] Failover Redis testato
- [ ] Restore backup testato

---

## 🔄 Procedura Rollback

Se qualcosa va storto:

### 1. Rollback Immediato

```bash
# Ferma il nuovo sistema
pm2 stop all

# Ripristina versione precedente
git checkout previous-stable-tag

# Restart
pm2 start all
```

### 2. Rollback Dati

```bash
# Se hai fatto migrazione database
node server/migrations/rollback-script.js

# Ripristina backup MongoDB se necessario
mongorestore --uri="mongodb://..." /backup/mongodb/...
```

### 3. Notifica Team

- Invia comunicazione a team e utenti
- Log incident per post-mortem
- Schedule fix e re-deploy

---

## 📞 Supporto

### In Caso di Problemi

1. **Check logs**: `tail -f logs/application-*.log`
2. **Redis status**: `redis-cli -a $REDIS_PASSWORD INFO`
3. **Health check**: `curl https://your-domain.com/api/health`
4. **Contatta DevOps**: +39 XXX XXXXXXX

### Risorse

- [Redis Security Checklist](https://redis.io/topics/security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

**Ultima modifica**: 5 Ottobre 2025  
**Versione**: 1.0  
**Mantenitore**: Othoca Labs DevOps Team

