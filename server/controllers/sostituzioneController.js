const Sostituzione = require('../models/Sostituzione');
const Assenza = require('../models/Assenza');
const Docente = require('../models/Docente');
const OrarioLezioni = require('../models/OrarioLezioni');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Ottieni tutte le sostituzioni
exports.getSostituzioni = async (req, res) => {
  try {
    const { dataInizio, dataFine, docente, docenteSostituto, classe } = req.query;
    const filtro = {};
    
    // Filtro per data
    if (dataInizio || dataFine) {
      filtro.data = {};
      
      if (dataInizio) {
        filtro.data.$gte = new Date(dataInizio);
      }
      
      if (dataFine) {
        filtro.data.$lte = new Date(dataFine);
      }
    }
    
    // Filtro per docente assente
    if (docente) {
      filtro.docente = docente;
    }
    
    // Filtro per docente sostituto
    if (docenteSostituto) {
      filtro.docenteSostituto = docenteSostituto;
    }
    
    // Filtro per classe
    if (classe) {
      filtro.classe = classe;
    }
    
    const sostituzioni = await Sostituzione.find(filtro)
      .populate('docente', 'nome cognome')
      .populate('docenteSostituto', 'nome cognome')
      .populate('assenza')
      .populate('materia', 'codiceMateria descrizione')
      .sort({ data: 1, ora: 1 });

    // Log per debug
    if (!sostituzioni || sostituzioni.length === 0) {
      console.warn('Nessuna sostituzione trovata per il filtro:', filtro);
    }

    // Controllo dati nulli
    const sostituzioniPulite = sostituzioni.filter(s =>
      s.docente && s.docenteSostituto && s.assenza && s.materia
    );

    if (sostituzioniPulite.length !== sostituzioni.length) {
      const sostNull = sostituzioni.filter(s => !s.docente || !s.docenteSostituto || !s.assenza || !s.materia);
      console.warn('Alcune sostituzioni hanno riferimenti nulli:', sostNull.map(s => s._id));
    }

    res.status(200).json({
      success: true,
      count: sostituzioniPulite.length,
      data: sostituzioniPulite
    });
  } catch (error) {
    console.error('Errore nel recupero delle sostituzioni:', error, error.stack);
    // Risposta "safe" per evitare crash lato frontend
    res.status(200).json({
      success: false,
      count: 0,
      data: [],
      message: 'Errore nel recupero delle sostituzioni',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Ottieni le assenze da coprire (non ancora assegnate a sostituzioni)
exports.getAssenzeDaCoprire = async (req, res) => {
  try {
    // Trova tutte le assenze in un periodo
    const { dataInizio, dataFine } = req.query;
    const filtroData = {};
    
    if (dataInizio) {
      filtroData.dataInizio = { $gte: new Date(dataInizio) };
    }
    
    if (dataFine) {
      filtroData.dataFine = { $lte: new Date(dataFine) };
    }
    
    // Trova tutte le assenze che rispettano i filtri
    const assenze = await Assenza.find(filtroData)
      .populate('docente', 'nome cognome')
      .sort({ dataInizio: 1 });

    // Elabora le assenze per ottenere un elenco di ore da coprire
    const assenzeDaCoprire = [];
    
    // Per ogni assenza
    for (const assenza of assenze) {
      // Controllo null safety per docente
      if (!assenza.docente || !assenza.docente._id) {
        console.warn(`Assenza ${assenza._id} ha un docente null o malformato, saltando...`);
        continue;
      }

      const docenteId = assenza.docente._id;
      const startDate = new Date(assenza.dataInizio);
      const endDate = new Date(assenza.dataFine);
      
      // Converti le date di inizio e fine in numeri dei giorni della settimana (Lun=1, Mar=2, ecc.)
      const reverseMapGiorni = { 1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Gio', 5: 'Ven', 6: 'Sab', 0: 'Dom' };
      
      // Step 1: Ottieni tutte le lezioni di questo docente
      const lezioniDocente = await OrarioLezioni.find({ 
          docente: docenteId,
          isDisponibilita: false // Escludiamo le ore di disponibilità
        })
        .populate('materia', 'codiceMateria descrizione')
        .populate('docente', 'nome cognome')
        .populate('classe');

      // Per ogni giorno di assenza
      for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
        const giornoSettimana = currentDate.getDay(); // 0=Dom, 1=Lun, ecc.
        
        // Salta se è domenica (non ci sono lezioni)
        if (giornoSettimana === 0) continue;
        
        const giornoStr = reverseMapGiorni[giornoSettimana];
        
        // Filtra le lezioni per questo giorno della settimana
        const lezioniDelGiorno = lezioniDocente.filter(l => l.giornoSettimana === giornoStr);
        
        // Per ogni lezione in questo giorno
        for (const lezione of lezioniDelGiorno) {
          // Controllo null safety per lezione e relative proprietà
          if (!lezione || !lezione._id || !lezione.materia || !lezione.materia._id) {
            console.warn(`Lezione malformata per docente ${docenteId}, saltando...`);
            continue;
          }

          const dataLezione = new Date(currentDate);
          
          // Verifica se questa ora è già stata assegnata a una sostituzione
          const sostituzione = await Sostituzione.findOne({
            docente: docenteId,
            data: {
              $gte: new Date(dataLezione.setHours(0, 0, 0)),
              $lt: new Date(dataLezione.setHours(23, 59, 59))
            },
            ora: lezione.ora
          });
          
          // Se non c'è già una sostituzione, aggiungi all'elenco delle assenze da coprire
          if (!sostituzione) {
            // Controlla se l'assenza ha un orario specifico
            let includiLezione = true;
            
            if (assenza.orarioSpecifico) {
              // Mappatura delle ore scolastiche (adattabile alle specifiche della scuola)
              const mappingOreInizio = {
                1: "08:00", 2: "09:00", 3: "10:00", 4: "11:00", 
                5: "12:00", 6: "13:00", 7: "14:00", 8: "15:00"
              };
              const mappingOreFine = {
                1: "08:50", 2: "09:50", 3: "10:50", 4: "11:50", 
                5: "12:50", 6: "13:50", 7: "14:50", 8: "15:50"
              };
              
              // Funzione per convertire orari in minuti per facilitare il confronto
              const orarioInMinuti = (orario) => {
                const [ore, minuti] = orario.split(':').map(Number);
                return ore * 60 + minuti;
              };
              
              // Ottieni gli orari di inizio e fine della lezione corrente in minuti
              const inizioLezioneMinuti = orarioInMinuti(mappingOreInizio[lezione.ora]);
              const fineLezioneMinuti = orarioInMinuti(mappingOreFine[lezione.ora]);
              
              // Orari di assenza in minuti (usa valori predefiniti se non specificati)
              const entrataMinuti = assenza.orarioEntrata ? orarioInMinuti(assenza.orarioEntrata) : 0;
              const uscitaMinuti = assenza.orarioUscita ? orarioInMinuti(assenza.orarioUscita) : 24 * 60 - 1;
              
              // Verifica se c'è sovrapposizione tra l'orario della lezione e l'orario dell'assenza
              // Una lezione deve essere inclusa se anche solo parzialmente si sovrappone all'orario di assenza
              includiLezione = (
                // La lezione inizia durante l'assenza
                (inizioLezioneMinuti >= entrataMinuti && inizioLezioneMinuti < uscitaMinuti) ||
                // La lezione finisce durante l'assenza
                (fineLezioneMinuti > entrataMinuti && fineLezioneMinuti <= uscitaMinuti) ||
                // La lezione contiene completamente l'assenza
                (inizioLezioneMinuti <= entrataMinuti && fineLezioneMinuti >= uscitaMinuti)
              );
            }
            
            if (includiLezione) {
              // Formatta il nome della classe con controllo null safety
              let classeFormatted = 'N/D';
              if (lezione.classe && lezione.classe._id) {
                if (lezione.classe.anno && lezione.classe.sezione) {
                  classeFormatted = `${lezione.classe.anno}${lezione.classe.sezione}`;
                  if (lezione.classe.indirizzo) {
                    classeFormatted += ` - ${lezione.classe.indirizzo}`;
                  }
                } else {
                  classeFormatted = lezione.classe._id.toString();
                }
              }

              assenzeDaCoprire.push({
                id: `${assenza._id}-${lezione._id}`, // ID composto per identificazione univoca
                assenzaId: assenza._id.toString(),
                docente: {
                  id: docenteId.toString(),
                  nome: assenza.docente.nome || 'N/D',
                  cognome: assenza.docente.cognome || 'N/D'
                },
                data: new Date(currentDate),
                giorno: giornoStr,
                ora: lezione.ora,
                materia: {
                  _id: lezione.materia._id.toString(),
                  descrizione: lezione.materia.descrizione || 'N/D',
                  codiceMateria: lezione.materia.codiceMateria || 'N/D'
                },
                classe: classeFormatted,
                aula: lezione.aula || 'N/D'
              });
            }
          }
        }
      }
    }

    // Ordina le assenze da coprire per data e ora
    assenzeDaCoprire.sort((a, b) => {
      // Prima per data
      const dateComparison = new Date(a.data) - new Date(b.data);
      if (dateComparison !== 0) return dateComparison;
      
      // Poi per ora
      return a.ora - b.ora;
    });

    res.status(200).json({
      success: true,
      count: assenzeDaCoprire.length,
      data: assenzeDaCoprire
    });
  } catch (error) {
    console.error('Errore nel recupero delle assenze da coprire:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle assenze da coprire',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Ottieni i docenti disponibili per una sostituzione
exports.getDocentiDisponibili = async (req, res) => {
  try {
    const { data, ora, giorno } = req.query;
    
    if (!data || !ora || !giorno) {
      return res.status(400).json({
        success: false,
        message: 'Fornire data, ora e giorno della settimana per trovare i docenti disponibili'
      });
    }

    // Data formattata per la query
    const dataQuery = new Date(data);
    
    // 1. Trova tutti i docenti
    const tutti_docenti = await Docente.find({ stato: 'attivo' });
    
    // 2. Trova i docenti che hanno ore di disponibilità in quel giorno e ora
    const docentiDisponibili = await OrarioLezioni.find({ 
      giornoSettimana: giorno, 
      ora: parseInt(ora),
      isDisponibilita: true
    }).populate('docente', 'nome cognome email');
    
    // 3. Trova i docenti che sono già impegnati in quella ora (hanno lezione o sono in assenza)
    // a. Docenti che hanno lezione
    const docentiImpegnati = await OrarioLezioni.find({
      giornoSettimana: giorno,
      ora: parseInt(ora),
      isDisponibilita: false
    }).distinct('docente');
    
    // b. Docenti che sono in assenza
    const docentiAssenti = await Assenza.find({
      dataInizio: { $lte: dataQuery },
      dataFine: { $gte: dataQuery }
    }).distinct('docente');
    
    // c. Docenti già assegnati a sostituzioni in quell'ora
    const docentiSostituzioni = await Sostituzione.find({
      data: {
        $gte: new Date(dataQuery.setHours(0, 0, 0)),
        $lt: new Date(dataQuery.setHours(23, 59, 59))
      },
      ora: parseInt(ora)
    }).distinct('docenteSostituto');
    
    // 4. Unisci gli array di docenti impegnati (con controllo null safety)
    const impegnati = [
      ...docentiImpegnati.filter(d => d != null).map(d => d.toString()), 
      ...docentiAssenti.filter(d => d != null).map(d => d.toString()), 
      ...docentiSostituzioni.filter(d => d != null).map(d => d.toString())
    ];
    
    // 5. Crea l'elenco finale dei docenti disponibili con controllo null safety
    const risposta = docentiDisponibili
      .filter(d => d && d.docente && d.docente._id) // Filtra solo elementi validi
      .filter(d => !impegnati.includes(d.docente._id.toString()))
      .map(d => ({
        id: d.docente._id,
        nome: d.docente.nome || 'N/D',
        cognome: d.docente.cognome || 'N/D',
        stato: 'Disponibile'
      }));
    
    res.status(200).json({
      success: true,
      count: risposta.length,
      data: risposta
    });
  } catch (error) {
    console.error('Errore nel recupero dei docenti disponibili:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei docenti disponibili',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Ottieni l'orario di una classe
exports.getOrarioClasse = async (req, res) => {
  try {
    const { classe, data } = req.query;
    
    if (!classe) {
      return res.status(400).json({
        success: false,
        message: 'Fornire l\'ID della classe'
      });
    }
    
    // Verifica se la classe è un ID MongoDB valido
    const isValidObjectId = mongoose.Types.ObjectId.isValid(classe);
    
    if (!isValidObjectId || classe === 'N/D') {
      // Se non è un ID valido o è 'N/D', restituisci un orario vuoto
      return res.status(200).json({
        success: true,
        data: formatEmptySchedule()
      });
    }
    
    // Trova l'orario della classe
    const orarioClasse = await OrarioLezioni.find({ classe })
      .populate('docente', 'nome cognome')
      .populate('materia', 'codiceMateria descrizione');
    
    // Organizza l'orario per giorni e ore
    const orarioFormattato = {};
    const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    
    for (const giorno of giorni) {
      orarioFormattato[giorno] = [];
      
      for (let ora = 1; ora <= 8; ora++) {
        const lezione = orarioClasse.find(l => l.giornoSettimana === giorno && l.ora === ora);
        
        if (lezione && lezione.docente && lezione.materia) {
          // Se è stata specificata una data, controlla se il docente è assente in quel giorno
          let tipo = 'normale';
          
          if (data && lezione.docente._id) {
            const dataQuery = new Date(data);
            // Converte il giorno della settimana al formato numerico Javascript (0=Dom, 1=Lun, ecc.)
            const mapGiorni = { 'Lun': 1, 'Mar': 2, 'Mer': 3, 'Gio': 4, 'Ven': 5, 'Sab': 6 };
            const giornoSettimana = mapGiorni[giorno];
            
            // Imposta la data alla data corretta della settimana
            const giornoData = new Date(dataQuery);
            const diff = giornoSettimana - dataQuery.getDay();
            giornoData.setDate(dataQuery.getDate() + diff);
            
            // Controlla se il docente è assente in questo giorno
            const assenzeDocente = await Assenza.find({
              docente: lezione.docente._id,
              dataInizio: { $lte: giornoData },
              dataFine: { $gte: giornoData }
            });
            
            if (assenzeDocente.length > 0) {
              tipo = 'assenza';
            }
            
            // Controlla se c'è una sostituzione assegnata
            const sostituzione = await Sostituzione.findOne({
              docente: lezione.docente._id,
              data: {
                $gte: new Date(giornoData.setHours(0, 0, 0)),
                $lt: new Date(giornoData.setHours(23, 59, 59))
              },
              ora: lezione.ora
            }).populate('docenteSostituto', 'nome cognome');
            
            if (sostituzione && sostituzione.docenteSostituto) {
              tipo = 'sostituzione';
              lezione.sostituto = sostituzione.docenteSostituto;
            }
          }
          
          orarioFormattato[giorno].push({
            ora: lezione.ora,
            materia: lezione.materia.descrizione || 'N/D',
            docente: `${lezione.docente.nome || 'N/D'} ${lezione.docente.cognome || 'N/D'}`,
            aula: lezione.aula || '',
            tipo: tipo,
            sostituto: (lezione.sostituto && lezione.sostituto.nome && lezione.sostituto.cognome) 
              ? `${lezione.sostituto.nome} ${lezione.sostituto.cognome}` 
              : null
          });
        } else {
          orarioFormattato[giorno].push({
            ora: ora,
            materia: '',
            docente: '',
            aula: '',
            tipo: 'vuota'
          });
        }
      }
    }
    
    res.status(200).json({
      success: true,
      data: orarioFormattato
    });
  } catch (error) {
    console.error('Errore nel recupero dell\'orario della classe:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dell\'orario della classe',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Funzione di supporto per generare un orario vuoto
function formatEmptySchedule() {
  const orarioFormattato = {};
  const giorni = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
  
  for (const giorno of giorni) {
    orarioFormattato[giorno] = [];
    
    for (let ora = 1; ora <= 8; ora++) {
      orarioFormattato[giorno].push({
        ora: ora,
        materia: '',
        docente: '',
        aula: '',
        tipo: 'vuota'
      });
    }
  }
  
  return orarioFormattato;
}

// Crea una nuova sostituzione
exports.createSostituzione = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Aggiungi l'utente che registra la sostituzione
    req.body.registrataDa = req.user.id;

    const sostituzione = await Sostituzione.create(req.body);

    res.status(201).json({
      success: true,
      data: sostituzione
    });
  } catch (error) {
    console.error('Errore nella creazione della sostituzione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della sostituzione',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Aggiorna una sostituzione
exports.updateSostituzione = async (req, res) => {
  try {
    let sostituzione = await Sostituzione.findById(req.params.id);

    if (!sostituzione) {
      return res.status(404).json({
        success: false,
        message: 'Sostituzione non trovata'
      });
    }

    sostituzione = await Sostituzione.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: sostituzione
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento della sostituzione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della sostituzione',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Elimina una sostituzione
exports.deleteSostituzione = async (req, res) => {
  try {
    const sostituzione = await Sostituzione.findById(req.params.id);

    if (!sostituzione) {
      return res.status(404).json({
        success: false,
        message: 'Sostituzione non trovata'
      });
    }

    await sostituzione.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione della sostituzione:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della sostituzione',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
}; 