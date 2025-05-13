const Docente = require('../models/Docente');
const ClasseInsegnamento = require('../models/ClasseInsegnamento');
const Assenza = require('../models/Assenze');
const OrarioLezioni = require('../models/OrarioLezioni');

exports.getAllDocenti = async (req, res) => {
  try {
    const { codiceMateria } = req.query;
    let docenti = [];
    
    // Se è specificato un codice materia, filtra i docenti per quel codice
    if (codiceMateria) {
      // Prima trova gli insegnamenti con quel codice materia
      const insegnamenti = await ClasseInsegnamento.find({ codiceMateria });
      
      // Quindi trova i docenti associati a quegli insegnamenti
      if (insegnamenti && insegnamenti.length > 0) {
        const docentiIds = insegnamenti.map(ins => ins.docente);
        docenti = await Docente.find({ 
          _id: { $in: docentiIds },
          stato: 'attivo'
        }).populate('classiInsegnamento');
      } else {
        // Se non ci sono insegnamenti con quel codice, restituisci array vuoto
        return res.status(200).json({
          success: true,
          count: 0,
          data: []
        });
      }
    } else {
      // Se non è specificato un codice materia, ottieni tutti i docenti
      docenti = await Docente.find().populate('classiInsegnamento');
    }
    
    const docentiFormattati = docenti.map(doc => {
      const docente = doc.toObject();
      
      if (docente.classiInsegnamento && docente.classiInsegnamento.length > 0) {
        const primaClasse = docente.classiInsegnamento[0];
        docente.classeInsegnamento = primaClasse.codiceClasse || 'N/D';
        docente.materia = primaClasse.descrizione || 'N/D';
        docente.codiceMateria = primaClasse.codiceMateria || 'N/D';
      } else {
        docente.classeInsegnamento = 'N/D';
        docente.materia = 'N/D';
        docente.codiceMateria = 'N/D';
      }
      
      return docente;
    });
    
    // Se è stata usata la query codiceMateria, restituisci in formato standard
    if (codiceMateria) {
      return res.status(200).json({
        success: true,
        count: docentiFormattati.length,
        data: docentiFormattati
      });
    }
    
    // Altrimenti, mantieni il formato originale per retrocompatibilità
    res.status(200).json(docentiFormattati);
  } catch (error) {
    console.error('Errore getAllDocenti:', error);
    res.status(500).json({ 
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.createDocente = async (req, res) => {
  try {
    const docente = new Docente(req.body);
    const nuovoDocente = await docente.save();
    res.status(201).json(nuovoDocente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateDocente = async (req, res) => {
  try {
    const docente = await Docente.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(docente);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteDocente = async (req, res) => {
  try {
    await Docente.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Docente eliminato con successo' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDocentiRecupero = async (req, res) => {
  try {
    const { minOre, maxOre, classe, materia } = req.query;
    
    let query = { oreRecupero: { $gt: 0 } };
    
    if (minOre) {
      query.oreRecupero.$gte = parseInt(minOre);
    }
    
    if (maxOre) {
      query.oreRecupero.$lte = parseInt(maxOre);
    }
    
    const docenti = await Docente.find(query).populate('classiInsegnamento');
    
    const docentiFormattati = docenti.map(doc => {
      const docente = doc.toObject();
      
      if (docente.classiInsegnamento && docente.classiInsegnamento.length > 0) {
        const primaClasse = docente.classiInsegnamento[0];
        docente.classeInsegnamento = primaClasse.codiceClasse || 'N/D';
        docente.materia = primaClasse.descrizione || 'N/D';
      } else {
        docente.classeInsegnamento = 'N/D';
        docente.materia = 'N/D';
      }
      
      return docente;
    });
    
    let risultatiFinali = docentiFormattati;
    if (classe) {
      risultatiFinali = risultatiFinali.filter(d => 
        d.classeInsegnamento.toLowerCase().includes(classe.toLowerCase())
      );
    }
    
    if (materia) {
      risultatiFinali = risultatiFinali.filter(d => 
        d.materia.toLowerCase().includes(materia.toLowerCase())
      );
    }
      
    res.status(200).json({
      success: true,
      count: risultatiFinali.length,
      data: risultatiFinali
    });
  } catch (error) {
    console.error('Errore getDocentiRecupero:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nel recupero dei docenti',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Registra sostituzione per un docente
exports.registraSostituzione = async (req, res) => {
  try {
    const { docenteId, sostitutoId, data, ora } = req.body;
    
    if (!docenteId || !sostitutoId || !data || !ora) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi sono obbligatori (docenteId, sostitutoId, data, ora)'
      });
    }
    
    // Recupera i docenti
    const docente = await Docente.findById(docenteId);
    const sostituto = await Docente.findById(sostitutoId);
    
    if (!docente || !sostituto) {
      return res.status(404).json({
        success: false,
        message: 'Docente o sostituto non trovato'
      });
    }
    
    // Verifica se il sostituto ha il codice materia DISP
    const sostitutoInsegnamenti = await ClasseInsegnamento.find({ 
      docente: sostitutoId,
      codiceMateria: 'DISP' 
    });
    
    const isDocenteDisp = sostitutoInsegnamenti.length > 0;
    
    console.log(`Sostituto ${sostituto.nome} ${sostituto.cognome} è DISP: ${isDocenteDisp}`);
    
    // Se il sostituto ha ore da recuperare e NON è un docente DISP, decrementare
    if (sostituto.oreRecupero > 0 && !isDocenteDisp) {
      sostituto.oreRecupero = Math.max(0, sostituto.oreRecupero - 1);
      await sostituto.save();
      console.log(`Ore recupero aggiornate per ${sostituto.nome} ${sostituto.cognome}: ${sostituto.oreRecupero}`);
    }
    
    // Qui potresti salvare la sostituzione in un nuovo modello "Sostituzione"
    // Per ora simuliamo solo l'operazione
    
    res.status(200).json({
      success: true,
      message: 'Sostituzione registrata con successo',
      data: {
        docente: {
          id: docente._id,
          nome: docente.nome,
          cognome: docente.cognome
        },
        sostituto: {
          id: sostituto._id,
          nome: sostituto.nome,
          cognome: sostituto.cognome,
          oreRecupero: sostituto.oreRecupero,
          isDocenteDisp
        },
        data,
        ora
      }
    });
  } catch (error) {
    console.error('Errore nella registrazione della sostituzione:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella registrazione della sostituzione',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Funzione per generare docenti disponibili di esempio con codice DISP
exports.creaDocentiDisp = async (req, res) => {
  try {
    // Verifica se esistono già docenti con codice DISP
    const insegnamentiDisp = await ClasseInsegnamento.find({ codiceMateria: 'DISP' });
    
    if (insegnamentiDisp.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Docenti DISP già disponibili nel sistema',
        count: insegnamentiDisp.length
      });
    }
    
    // Array di docenti disponibili da creare
    const docentiDisp = [
      { 
        nome: 'Paolo', 
        cognome: 'Disponibile', 
        codiceFiscale: 'DSPPLA80A01H501X',
        codiceDocente: 'DISP01',
        email: 'paolo.disp@scuola.it'
      },
      { 
        nome: 'Maria', 
        cognome: 'Sostituzione', 
        codiceFiscale: 'SSTMRA75B02H501Y',
        codiceDocente: 'DISP02',
        email: 'maria.sost@scuola.it'
      },
      { 
        nome: 'Giuseppe', 
        cognome: 'Supplente', 
        codiceFiscale: 'SPLGPP82C03H501Z',
        codiceDocente: 'DISP03',
        email: 'giuseppe.supplente@scuola.it'
      }
    ];
    
    const docentiCreati = [];
    const insegnamentiCreati = [];
    
    // Crea i docenti e gli insegnamenti associati
    for (const docenteData of docentiDisp) {
      // Verifica se il docente esiste già
      let docente = await Docente.findOne({ codiceFiscale: docenteData.codiceFiscale });
      
      if (!docente) {
        // Crea il docente
        docente = await Docente.create(docenteData);
        docentiCreati.push(docente);
        
        // Crea l'insegnamento con codice DISP
        const insegnamento = await ClasseInsegnamento.create({
          codiceClasse: `DISP-${docente.codiceDocente}`,
          descrizione: 'Disponibilità',
          codiceMateria: 'DISP',
          docente: docente._id
        });
        
        insegnamentiCreati.push(insegnamento);
        
        // Aggiorna il docente con l'insegnamento creato
        docente.classiInsegnamento = [insegnamento._id];
        await docente.save();
      }
    }
    
    res.status(201).json({
      success: true,
      message: `${docentiCreati.length} docenti DISP creati con successo`,
      docenti: docentiCreati.map(d => ({
        _id: d._id,
        nome: d.nome,
        cognome: d.cognome,
        codiceDocente: d.codiceDocente
      }))
    });
  } catch (error) {
    console.error('Errore nella creazione dei docenti DISP:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Errore nella creazione dei docenti DISP',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Funzione per ottenere docenti disponibili per sostituzioni
exports.getDocentiPerSostituzione = async (req, res) => {
  try {
    const { data, ora, classeId } = req.query;
    
    if (!data || !ora) {
      return res.status(400).json({
        success: false,
        message: 'Data e ora sono parametri obbligatori'
      });
    }
    
    // Converti la data in oggetto Date
    const dataRichiesta = new Date(data);
    if (isNaN(dataRichiesta.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato data non valido'
      });
    }
    
    // Converti ora in numero
    const oraRichiesta = parseInt(ora);
    if (isNaN(oraRichiesta) || oraRichiesta < 1 || oraRichiesta > 8) {
      return res.status(400).json({
        success: false,
        message: 'Ora non valida. Deve essere un numero tra 1 e 8'
      });
    }
    
    // Ottieni il giorno della settimana (0 = Domenica, 1 = Lunedì, ...)
    const giornoSettimana = dataRichiesta.getDay();
    // Converti al formato usato nell'app (Lun, Mar, ...)
    const giorniSettimana = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const giornoSettimanaFormattato = giorniSettimana[giornoSettimana];
    
    // 1. Ottieni tutti i docenti attivi
    const docenti = await Docente.find({ stato: 'attivo' }).populate('classiInsegnamento');
    
    // 2. Trova i docenti che sono assenti in quella data e ora
    const dataInizio = new Date(dataRichiesta);
    dataInizio.setHours(0, 0, 0, 0);
    const dataFine = new Date(dataRichiesta);
    dataFine.setHours(23, 59, 59, 999);
    
    const assenze = await Assenza.find({
      data: { $gte: dataInizio, $lte: dataFine },
      $or: [
        { assenteGiornataIntera: true },
        { 'oreAssenza.ora': oraRichiesta }
      ]
    }).select('docente');
    
    const docentiAssentiIds = assenze.map(a => a.docente.toString());
    
    // 3. Trova i docenti che hanno lezione in quella ora e giorno
    const docentiImpegnati = await OrarioLezioni.find({
      giornoSettimana: giornoSettimanaFormattato,
      ora: oraRichiesta
    }).select('docente');
    
    const docentiImpegnatiIds = docentiImpegnati.map(o => o.docente.toString());
    
    // 4. Trova i docenti con codice materia DISP
    const insegnamentiDisp = await ClasseInsegnamento.find({ codiceMateria: 'DISP' });
    const docentiDispIds = insegnamentiDisp.map(ins => ins.docente.toString());
    
    // 5. Filtra i docenti disponibili
    const docentiDisponibili = docenti.filter(docente => {
      const docenteId = docente._id.toString();
      
      // Escludi docenti assenti
      if (docentiAssentiIds.includes(docenteId)) {
        return false;
      }
      
      // Se il docente è un docente DISP, è sempre disponibile
      if (docentiDispIds.includes(docenteId)) {
        return true;
      }
      
      // Escludi docenti già impegnati in lezione
      if (docentiImpegnatiIds.includes(docenteId)) {
        return false;
      }
      
      // Docente disponibile
      return true;
    });
    
    // 6. Ordina i risultati: prima i docenti con ore da recuperare, poi quelli nella stessa classe
    const risultatiOrdinati = [...docentiDisponibili].sort((a, b) => {
      // Prima i docenti con ore da recuperare (più ore = priorità maggiore)
      if (a.oreRecupero !== b.oreRecupero) {
        return (b.oreRecupero || 0) - (a.oreRecupero || 0);
      }
      
      // Poi i docenti della stessa classe (se classeId è specificato)
      if (classeId) {
        const aHaClasse = a.classiInsegnamento?.some(ci => ci.codiceClasse === classeId);
        const bHaClasse = b.classiInsegnamento?.some(ci => ci.codiceClasse === classeId);
        
        if (aHaClasse && !bHaClasse) return -1;
        if (!aHaClasse && bHaClasse) return 1;
      }
      
      // Infine, ordina per cognome
      return a.cognome.localeCompare(b.cognome);
    });
    
    // Formatta i risultati per la risposta
    const risultatiFormattati = risultatiOrdinati.map(doc => {
      const docente = doc.toObject();
      
      // Aggiungi proprietà per identificare i docenti DISP
      docente.isDisp = docentiDispIds.includes(docente._id.toString());
      
      if (docente.classiInsegnamento && docente.classiInsegnamento.length > 0) {
        const primaClasse = docente.classiInsegnamento[0];
        docente.classeInsegnamento = primaClasse.codiceClasse || 'N/D';
        docente.materia = primaClasse.descrizione || 'N/D';
        docente.codiceMateria = primaClasse.codiceMateria || 'N/D';
      } else {
        docente.classeInsegnamento = 'N/D';
        docente.materia = 'N/D';
        docente.codiceMateria = 'N/D';
      }
      
      return docente;
    });
    
    res.status(200).json({
      success: true,
      count: risultatiFormattati.length,
      data: risultatiFormattati
    });
  } catch (error) {
    console.error('Errore getDocentiPerSostituzione:', error);
    res.status(500).json({ 
      success: false,
      message: 'Errore nel recupero dei docenti disponibili',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};