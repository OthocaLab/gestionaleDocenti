const fs = require('fs');
const path = require('path');
const Docente = require('../models/Docente');
const ClasseInsegnamento = require('../models/ClasseInsegnamento');
const OrarioLezioni = require('../models/OrarioLezioni');
const Materia = require('../models/Materia');
const ClasseScolastica = require('../models/ClasseScolastica');

exports.importaOrarioDocenti = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nessun file caricato' });
    }

    // Leggi il file JSON
    const filePath = req.file.path;
    let orariData;
    
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      orariData = JSON.parse(fileContent);
      console.log(`File JSON letto correttamente, contiene ${orariData.orari?.length || 0} docenti`);
    } catch (error) {
      console.error('Errore nella lettura del file JSON:', error);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ message: 'Formato del file non valido' });
    }
    
    if (!orariData || !orariData.orari || !Array.isArray(orariData.orari)) {
      console.error('Formato dati non valido. Atteso { orari: [...] }');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ message: 'Struttura del file non valida. Atteso { orari: [...] }' });
    }
    
    // Statistiche per l'importazione
    const stats = {
      totalTeachers: orariData.orari.length,
      processedTeachers: 0,
      newTeachers: 0,
      updatedTeachers: 0,
      errors: []
    };
    
    // Elabora i docenti
    for (const docente of orariData.orari) {
      try {
        stats.processedTeachers++;
        
        if (!docente.professore) {
          stats.errors.push('Docente senza nome');
          continue;
        }
        
        // Cerca il docente esistente
        let existingDocente = await Docente.findOne({
          $or: [
            { codiceFiscale: docente.codiceFiscale || docente.professore },
            { codiceDocente: docente.professore }
          ]
        });
        
        // Prepara i dati del docente
        const docenteData = {
          nome: docente.nome || docente.professore,
          cognome: docente.cognome || docente.professore,
          codiceFiscale: docente.codiceFiscale || docente.professore,
          codiceDocente: docente.professore,
          email: docente.email || `${docente.professore.toLowerCase().replace(/\s/g, '')}@temp.scuola.it`,
          telefono: docente.telefono || '',
          stato: docente.stato || 'attivo'
        };
        
        // Gestisci le classi di insegnamento
        if (docente.classiInsegnamento && Array.isArray(docente.classiInsegnamento)) {
          const classiIds = [];
          
          for (const codiceClasse of docente.classiInsegnamento) {
            // Cerca o crea la classe di insegnamento
            let classeInsegnamento = await ClasseInsegnamento.findOne({ codiceClasse });
            
            if (!classeInsegnamento) {
              classeInsegnamento = await ClasseInsegnamento.create({
                codiceClasse,
                descrizione: `Classe di insegnamento ${codiceClasse}`,
                materie: []
              });
            }
            
            classiIds.push(classeInsegnamento._id);
          }
          
          // Aggiorna il docente con le classi di insegnamento
          docenteData.classiInsegnamento = classiIds;
        }
        
        // Aggiorna o crea il docente
        if (existingDocente) {
          // Aggiorna solo i campi che non sono già valorizzati
          if (!existingDocente.nome || existingDocente.nome === existingDocente.codiceDocente) {
            existingDocente.nome = docenteData.nome;
          }
          if (!existingDocente.cognome || existingDocente.cognome === existingDocente.codiceDocente) {
            existingDocente.cognome = docenteData.cognome;
          }
          if (!existingDocente.email || existingDocente.email.includes('@temp.scuola.it')) {
            existingDocente.email = docenteData.email;
          }
          if (docente.telefono && (!existingDocente.telefono || existingDocente.telefono === '')) {
            existingDocente.telefono = docenteData.telefono;
          }
          if (docente.stato) {
            existingDocente.stato = docenteData.stato;
          }
          
          // Aggiorna le classi di insegnamento
          if (docenteData.classiInsegnamento) {
            existingDocente.classiInsegnamento = [
              ...new Set([
                ...existingDocente.classiInsegnamento.map(id => id.toString()),
                ...docenteData.classiInsegnamento.map(id => id.toString())
              ])
            ];
          }
          
          await existingDocente.save();
          stats.updatedTeachers++;
        } else {
          // Crea un nuovo docente
          await Docente.create(docenteData);
          stats.newTeachers++;
        }
      } catch (error) {
        console.error(`Errore nell'elaborazione del docente ${docente.professore}:`, error);
        stats.errors.push(`Errore docente ${docente.professore}: ${error.message}`);
      }
    }
    
    // Elimina il file temporaneo
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.status(200).json({
      success: true,
      message: 'Importazione completata',
      ...stats,
      errors: stats.errors.length > 0 ? stats.errors : undefined
    });
  } catch (error) {
    console.error('Errore durante l\'importazione:', error);
    
    // Assicurati di eliminare il file temporaneo in caso di errore
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false,
      message: `Errore durante l'importazione: ${error.message}` 
    });
  }
};