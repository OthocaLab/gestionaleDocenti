const Docente = require('../models/Docente');

exports.getAllDocenti = async (req, res) => {
  try {
    const docenti = await Docente.find().populate('classiInsegnamento');
    
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
    
    res.status(200).json(docentiFormattati);
  } catch (error) {
    console.error('Errore getAllDocenti:', error);
    res.status(500).json({ 
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