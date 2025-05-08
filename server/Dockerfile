FROM node:18

WORKDIR /app

# Copia package.json e package-lock.json (se esiste)
COPY package*.json ./

# Installa le dipendenze
RUN npm install

# Copia il resto del codice sorgente
COPY . .

# Esponi la porta su cui il server ascolta
EXPOSE 5000

# Comando per avviare l'applicazione
CMD ["npm", "start"]
