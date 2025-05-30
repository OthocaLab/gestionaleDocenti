# Implementazione Campo `docenteSostegno`

## Panoramica
È stato implementato il campo `docenteSostegno` nel model Docente per identificare i docenti di sostegno e aggiornato l'import JSON per supportare questo nuovo campo.

## Modifiche Implementate

### 1. Model Docente (`server/models/Docente.js`)
- **Aggiunto campo**: `docenteSostegno` (Boolean, default: false)
- **Descrizione**: Campo che indica se il docente è un docente di sostegno

```javascript
docenteSostegno: {
  type: Boolean,
  default: false
}
```

### 2. Controller Import (`server/controllers/importController.js`)
- **Modificata funzione**: `processDocente()`
- **Aggiunto supporto**: Lettura del campo `docenteSostegno` dal JSON di import
- **Aggiornamento**: Durante l'aggiornamento di un docente esistente, il campo viene aggiornato se specificato nel JSON
- **Logging**: Aggiunto log per mostrare se il docente è di sostegno o meno

### 3. Controller Docente (`server/controllers/docenteController.js`)
- **Nuova funzione**: `getDocentiSostegno()` 
- **Endpoint**: `GET /api/docenti/sostegno`
- **Filtro opzionale**: Parametro `stato` per filtrare per stato del docente
- **Risposta**: Lista formattata dei docenti di sostegno

### 4. Routes Docenti (`server/routes/docenteRoutes.js`)
- **Nuova rotta**: `GET /api/docenti/sostegno` per ottenere solo i docenti di sostegno

### 5. Documentazione Import (`client/src/components/ImportaOrario.js`)
- **Aggiornato**: Formato JSON di esempio per includere il campo `docenteSostegno`
- **Aggiunta**: Nota esplicativa sul campo opzionale

## Formato JSON Aggiornato

```json
{
  "orari": [
    {
      "professore": "SOST01",
      "nome": "Anna",
      "cognome": "Sostegno",
      "email": "anna.sostegno@scuola.it",
      "telefono": "123456789",
      "docenteSostegno": true,
      "stato": "attivo",
      "lezioni": [
        {
          "giorno": "LU",
          "ora": "8:15",
          "classe": "1A",
          "aula": "S01",
          "materia": "SOST"
        }
      ]
    }
  ]
}
```

## API Endpoints

### Nuovi Endpoints
- **GET** `/api/docenti/sostegno` - Ottieni tutti i docenti di sostegno
  - Query params opzionali: `stato` (attivo/inattivo)

### Endpoints Esistenti Aggiornati
- **GET** `/api/docenti` - Ora include automaticamente il campo `docenteSostegno`
- **POST** `/api/import/orario` - Ora supporta l'import del campo `docenteSostegno`

## Esempi di Utilizzo

### 1. Ottenere tutti i docenti di sostegno
```javascript
GET /api/docenti/sostegno
```

### 2. Ottenere solo i docenti di sostegno attivi
```javascript
GET /api/docenti/sostegno?stato=attivo
```

### 3. Import JSON con docenti di sostegno
Utilizzare il file `test-docente-sostegno.js` come esempio di formato JSON valido.

## Note Importanti

1. **Retrocompatibilità**: Il campo `docenteSostegno` è opzionale e ha valore predefinito `false`
2. **Import esistenti**: I docenti già presenti nel database avranno `docenteSostegno: false` per default
3. **Aggiornamenti**: Durante l'import, se un docente esiste già e il JSON specifica `docenteSostegno`, il campo viene aggiornato
4. **Validazione**: Il campo accetta solo valori booleani (true/false)

## Test

È stato creato il file `test-docente-sostegno.js` con esempi di:
- Docente di sostegno (`docenteSostegno: true`)
- Docente normale (`docenteSostegno: false`) 
- Docente senza campo specificato (default: `false`) 