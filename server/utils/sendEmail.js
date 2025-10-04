const nodemailer = require('nodemailer');
require('dotenv').config();

// Controllo se SMTP è abilitato
const isSmtpEnabled = process.env.SMTP_ENABLED === 'true';

console.log('[DEBUG] Configurazione SMTP:', {
  enabled: isSmtpEnabled,
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
  user: process.env.SMTP_USER,
  from: process.env.EMAIL_FROM
});

// Configurazione SMTP per Gmail (solo se abilitato)
let transporter = null;

if (isSmtpEnabled) {
  transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465,
    secure: process.env.SMTP_SECURE === 'true', // true per 465, false per 587
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD // Deve essere una password per app!
    }
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error('[GMAIL] Errore nella configurazione SMTP:', error);
      console.error('[GMAIL] Ricorda: per Gmail serve una password per app, non la password normale!');
    } else {
      console.log('[GMAIL] Server SMTP pronto a inviare email.');
    }
  });
} else {
  console.log('[SMTP] Invio email disabilitato tramite configurazione SMTP_ENABLED=false');
}

const sendEmail = async (options) => {
  // Se SMTP è disabilitato, logga l'azione e ritorna senza inviare
  if (!isSmtpEnabled) {
    console.log('[SMTP] Email NON inviata (SMTP disabilitato):', {
      to: options.email,
      subject: options.subject,
      message: options.message?.substring(0, 100) + '...' // Solo primi 100 caratteri del messaggio
    });
    return { 
      success: false, 
      reason: 'SMTP_DISABLED',
      message: 'Invio email disabilitato tramite configurazione SMTP_ENABLED=false'
    };
  }

  const message = {
    from: process.env.EMAIL_FROM || 'Othoca Labs <tuoindirizzo@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // puoi aggiungere anche `html: options.html` se vuoi inviare email in HTML
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('[GMAIL] Email inviata con successo:', info);
    return { 
      success: true, 
      info: info,
      message: 'Email inviata con successo'
    };
  } catch (err) {
    console.error('[GMAIL] Errore durante l\'invio dell\'email:', err);
    throw err;
  }
};

module.exports = sendEmail;
